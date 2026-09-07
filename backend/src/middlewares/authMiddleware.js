import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "arcl-super-secret-jwt-key-2026";

/**
 * Middleware to protect admin routes
 * Verifies JWT token and checks if the user has admin role
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user in DB
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is invalid or deactivated.",
      });
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have admin permissions.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or unauthorized token.",
    });
  }
};

/**
 * Middleware to restrict User & Role Management to Superadmin / Full Access Admin
 */
export const verifyUserManageAccess = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
      });
    }

    const envEmails = ["admin@arcl.com"];
    if (process.env.ADMIN_EMAIL) {
      process.env.ADMIN_EMAIL.split(",").forEach((e) => {
        if (e.trim()) envEmails.push(e.trim().toLowerCase());
      });
    }
    if (process.env.ADMIN_EMAILS) {
      process.env.ADMIN_EMAILS.split(",").forEach((e) => {
        if (e.trim()) envEmails.push(e.trim().toLowerCase());
      });
    }

    const isAuthorized =
      user.role === "superadmin" ||
      envEmails.includes(user.email?.toLowerCase()) ||
      user.permissions?.users?.manage === true;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: Only Super Administrators and authorized administrators with User Management privileges can access Users & Roles.",
      });
    }

    next();
  } catch (error) {
    console.error("verifyUserManageAccess Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying user management permissions.",
    });
  }
};

