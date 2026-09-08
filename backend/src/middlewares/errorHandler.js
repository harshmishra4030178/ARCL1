import ApiError from "../utils/ApiError.js";
import ErrorLog from "../models/errorLogModel.js";

/**
 * Global centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new ApiError(409, `Duplicate value entered for ${field}. It must be unique.`);
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === "CastError") {
    error = new ApiError(400, `Resource not found. Invalid ID: ${err.value}`);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired. Please log in again.");
  }

  // Asynchronously record server/critical errors into MongoDB
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    try {
      const userAgent = req.headers?.["user-agent"] || "";
      const ipAddress =
        req.headers?.["x-forwarded-for"]?.split(",")[0] ||
        req.socket?.remoteAddress ||
        "";

      ErrorLog.create({
        message: String(error.message || "Server Exception").slice(0, 1000),
        stack: error.stack ? String(error.stack).slice(0, 5000) : "",
        source: "backend",
        url: req.originalUrl || req.url || "",
        route: req.baseUrl || "",
        method: req.method || "",
        statusCode,
        severity: "critical",
        userAgent: String(userAgent).slice(0, 500),
        ipAddress: String(ipAddress).slice(0, 100),
        metadata: {
          params: req.params,
          query: req.query,
          userId: req.user?._id,
        },
      }).catch((dbErr) => console.warn("Failed to write backend ErrorLog:", dbErr.message));
    } catch (e) {
      // Ignored
    }
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    ...(error.errors?.length > 0 && { errors: error.errors }),
  };

  return res.status(error.statusCode || 500).json(response);
};
