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
    emails.push(process.env.ADMIN_EMAIL.trim().toLowerCase());
  }
  if (process.env.ADMIN_EMAILS) {
    process.env.ADMIN_EMAILS.split(",").forEach((e) => {
      if (e.trim()) emails.push(e.trim().toLowerCase());
    });
  }
  // Default fallback if not set in .env
  if (emails.length === 0) {
    emails.push("admin@arcl.com");
  }
  return emails;
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
      });
    } else {
      // User exists in database
      // If email is explicitly in .env ADMIN_EMAIL, ensure role is elevated to 'admin'
      if (isEnvAdmin && user.role !== "admin" && user.role !== "superadmin") {
        user.role = "admin";
      }

      if (name) user.name = name;
      if (picture) user.picture = picture;
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
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
 * @desc    Get Current Logged-In User Profile
 * @route   GET /api/v1/auth/me
 * @access  Admin
 */
export const getMe = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
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
