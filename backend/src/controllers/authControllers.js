import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "arcl-super-secret-jwt-key-2026";

/**
 * Decode and extract info from Google JWT credential or payload
 */
const parseGoogleCredential = (credential) => {
  if (!credential) return null;
  try {
    const parts = credential.split(".");
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], "base64").toString("utf-8");
      return JSON.parse(payload);
    }
  } catch (err) {
    console.error("Failed to parse Google JWT credential:", err);
  }
  return null;
};

/**
 * Get all authorized admin emails from environment variables
 */
const getAuthorizedAdminEmails = () => {
  const emails = [];
  if (process.env.ADMIN_EMAIL) {
    process.env.ADMIN_EMAIL.split(",").forEach((e) => {
      if (e.trim()) emails.push(e.trim().toLowerCase());
    });
  }
  if (process.env.ADMIN_EMAILS) {
    process.env.ADMIN_EMAILS.split(",").forEach((e) => {
      if (e.trim()) emails.push(e.trim().toLowerCase());
    });
  }
  return Array.from(new Set(emails));
};

/**
 * @desc    Google OAuth Login for Admin & User Registration
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  try {
    const {
      credential,
      email: directEmail,
      name: directName,
      picture: directPicture,
      googleId: directGoogleId,
    } = req.body;

    let email = directEmail;
    let name = directName;
    let picture = directPicture;
    let googleId = directGoogleId;

    // If Google ID Token credential was supplied, parse payload
    if (credential) {
      const googleData = parseGoogleCredential(credential);
      if (googleData) {
        email = googleData.email || email;
        name = googleData.name || googleData.given_name || name;
        picture = googleData.picture || picture;
        googleId = googleData.sub || googleId;
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for authentication.",
      });
    }

    email = email.trim().toLowerCase();

    // Check if this email is designated as Admin in .env
    const authorizedAdminEmails = getAuthorizedAdminEmails();
    const isEnvAdmin = authorizedAdminEmails.includes(email);

    // Find existing user in MongoDB
    let user = await User.findOne({ email });

    const clientIp =
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    if (!user) {
      // If user does not exist:
      // If email is in ADMIN_EMAIL -> role is 'admin', otherwise registered with 'user' role
      const initialRole = isEnvAdmin ? "admin" : "user";

      user = await User.create({
        name: name || email.split("@")[0],
        email,
        picture: picture || "",
        googleId: googleId || "",
        role: initialRole,
        isActive: true,
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        currentIp: clientIp,
        userAgent: userAgent,
      });
    } else {
      // User exists in database
      // If email is admin@arcl.com or in .env ADMIN_EMAIL, ensure role is elevated to 'admin'
      if (isEnvAdmin) {
        user.role = "admin";
        user.isActive = true;
      }

      if (name) user.name = name;
      if (picture) user.picture = picture;
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
      user.lastActiveAt = new Date();
      user.currentIp = clientIp;
      user.userAgent = userAgent;
      await user.save();
    }

    // Default permissions setup for superadmin or admin
    const defaultFullPermissions = {
      products: { create: true, edit: true, delete: true },
      categories: { create: true, edit: true, delete: true },
      equipmentTypes: { create: true, edit: true, delete: true },
      blogs: { create: true, edit: true, delete: true },
      inquiries: { view: true, delete: true },
      contacts: { view: true, delete: true },
      subscribers: { view: true, delete: true },
      users: { manage: true },
    };

    if (isEnvAdmin ) {
      user.role = "superadmin";
      user.permissions = defaultFullPermissions;
      user.markModified("permissions");
      await user.save();
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        isRegistered: true,
        isAdmin: false,
        message:
          "Your account has been deactivated. Please contact the Administrator.",
      });
    }

    // Check user role
    const hasAdminAccess =
      user.role === "admin" || user.role === "superadmin";

    if (!hasAdminAccess) {
      // User registered cleanly in database with 'user' role, but NOT allowed in Admin panel
      return res.status(403).json({
        success: false,
        isRegistered: true,
        isAdmin: false,
        role: "user",
        email: user.email,
        name: user.name,
        picture: user.picture,
        message:
          "Access Denied: You are registered with standard 'user' role. Only authorized Administrators can access this portal. Please contact the administrator to grant you access from the Users Management panel.",
      });
    }

    // Generate Admin JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      isAdmin: true,
      message: "Admin authenticated successfully! Welcome to ARCL Portal.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        permissions: user.permissions || defaultFullPermissions,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Internal Server Error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Super Admin Direct Email & Password Login
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check credentials for Super Admin securely via environment variables
    const allowedSuperAdminEmails = (
      process.env.SUPER_ADMIN_EMAILS ||
      "abhinav@arclinstruments.com,abhinavtripathi32@gmail.com"
    )
      .split(",")
      .map((e) => e.trim().toLowerCase());

    const expectedSuperAdminPassword =
      process.env.SUPER_ADMIN_PASSWORD || "Abhi@arcl25";

    const isSuperAdminMatch =
      allowedSuperAdminEmails.includes(cleanEmail) &&
      cleanPassword === expectedSuperAdminPassword;

    if (!isSuperAdminMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Super Admin ID or Password. Access Denied.",
      });
    }

    const defaultFullPermissions = {
      products: { create: true, edit: true, delete: true },
      categories: { create: true, edit: true, delete: true },
      equipmentTypes: { create: true, edit: true, delete: true },
      blogs: { create: true, edit: true, delete: true },
      inquiries: { view: true, delete: true },
      contacts: { view: true, delete: true },
      subscribers: { view: true, delete: true },
      users: { manage: true },
    };

    // Find or create the super admin user in MongoDB
    let user = await User.findOne({ email: cleanEmail });
    const clientIp =
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    if (!user) {
      user = await User.create({
        name: "Abhinav (Super Admin)",
        email: cleanEmail,
        role: "superadmin",
        isActive: true,
        permissions: defaultFullPermissions,
        lastLogin: new Date(),
        lastActiveAt: new Date(),
        currentIp: clientIp,
        userAgent: userAgent,
      });
    } else {
      user.role = "superadmin";
      user.isActive = true;
      user.permissions = defaultFullPermissions;
      user.lastLogin = new Date();
      user.lastActiveAt = new Date();
      user.currentIp = clientIp;
      user.userAgent = userAgent;
      user.markModified("permissions");
      await user.save();
    }

    // Generate JWT token (7 days validity)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      isAdmin: true,
      message: "Super Admin authenticated successfully! Welcome back.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture || "",
        role: user.role,
        permissions: user.permissions || defaultFullPermissions,
      },
    });
  } catch (error) {
    console.error("Password Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed. Internal Server Error.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get Current Logged-In User Profile
 * @route   GET /api/v1/auth/me
 * @access  Admin
 */
export const getMe = async (req, res) => {
  try {
    const user = req.user;

    const defaultFullPermissions = {
      products: { create: true, edit: true, delete: true },
      categories: { create: true, edit: true, delete: true },
      equipmentTypes: { create: true, edit: true, delete: true },
      blogs: { create: true, edit: true, delete: true },
      inquiries: { view: true, delete: true },
      contacts: { view: true, delete: true },
      subscribers: { view: true, delete: true },
      users: { manage: true },
    };

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        permissions: user.permissions || defaultFullPermissions,
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
    });
  }
};

/**
 * @desc    Admin Heartbeat Ping (Keeps Online Status Fresh)
 * @route   POST /api/v1/auth/heartbeat
 * @access  Admin
 */
export const heartbeat = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const clientIp =
      req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    await User.findByIdAndUpdate(user._id, {
      lastActiveAt: new Date(),
      currentIp: clientIp,
      userAgent: userAgent,
    });

    return res.status(200).json({
      success: true,
      message: "Heartbeat acknowledged",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Heartbeat error:", err);
    return res.status(500).json({ success: false, message: "Heartbeat failed" });
  }
};

/**
 * @desc    Set User Presence Immediately Offline on Tab Close / Page Leave
 * @route   POST /api/v1/auth/offline
 * @access  Admin
 */
export const setPresenceOffline = async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      // Set lastActiveAt to 60 seconds ago so status immediately flips to offline,
      // while retaining the exact last seen timestamp!
      await User.findByIdAndUpdate(user._id, {
        lastActiveAt: new Date(Date.now() - 60 * 1000),
      });
    }
    return res.status(200).json({ success: true, message: "Presence set to offline" });
  } catch (err) {
    return res.status(200).json({ success: true });
  }
};

/**
 * @desc    Get Active Admins & Real-Time Login Presence
 * @route   GET /api/v1/auth/active-admins
 * @access  Admin
 */
export const getActiveAdmins = async (req, res) => {
  try {
    const now = new Date();
    // Online: strictly active within last 45 seconds (heartbeat is sent every 20s)
    const fortyFiveSecondsAgo = new Date(now.getTime() - 45 * 1000);
    // Away: active within last 2 minutes
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    // Fetch all active admin/superadmin users
    const adminUsers = await User.find({
      role: { $in: ["admin", "superadmin"] },
      isActive: true,
    })
      .select("name email picture role lastLogin lastActiveAt currentIp userAgent createdAt")
      .sort({ lastActiveAt: -1, lastLogin: -1 });

    const adminsWithStatus = adminUsers.map((u) => {
      const lastActive = u.lastActiveAt;
      let status = "offline";

      if (lastActive && new Date(lastActive) >= fortyFiveSecondsAgo) {
        status = "online";
      } else if (lastActive && new Date(lastActive) >= twoMinutesAgo) {
        status = "away";
      }

      // Friendly device format
      let deviceLabel = "Desktop / Web";
      if (u.userAgent) {
        if (/mobile|android|iphone|ipad/i.test(u.userAgent)) {
          deviceLabel = "Mobile Device";
        } else if (/chrome/i.test(u.userAgent)) {
          deviceLabel = "Chrome Browser";
        } else if (/firefox/i.test(u.userAgent)) {
          deviceLabel = "Firefox Browser";
        } else if (/safari/i.test(u.userAgent)) {
          deviceLabel = "Safari Browser";
        }
      }

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        role: u.role,
        lastLogin: u.lastLogin,
        lastActiveAt: lastActive,
        status, // 'online' | 'away' | 'offline'
        isOnline: status === "online",
        device: deviceLabel,
      };
    });

    const onlineCount = adminsWithStatus.filter((u) => u.status === "online").length;
    const awayCount = adminsWithStatus.filter((u) => u.status === "away").length;

    return res.status(200).json({
      success: true,
      data: {
        admins: adminsWithStatus,
        metrics: {
          online: onlineCount,
          away: awayCount,
          totalAdmins: adminsWithStatus.length,
        },
      },
    });
  } catch (error) {
    console.error("Get Active Admins Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active admins status.",
    });
  }
};
