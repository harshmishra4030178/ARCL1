import ErrorLog from "../../models/errorLogModel.js";
import ApiResponse from "../../utils/ApiResponse.js";

/**
 * Public ingestion endpoint for all frontend client & runtime errors
 */
export const logClientError = async (req, res) => {
  try {
    const {
      message,
      stack,
      url,
      route,
      source = "frontend",
      statusCode = 500,
      method = "",
      severity = "error",
      metadata = {},
    } = req.body;

    if (!message) {
      return res.status(400).json(new ApiResponse(400, null, "Message is required"));
    }

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "";

    // Deduplicate: Don't flood DB if identical error happened in last 10 seconds on the same URL
    const tenSecAgo = new Date(Date.now() - 10 * 1000);
    const existingRecent = await ErrorLog.findOne({
      message: String(message).slice(0, 300),
      url: url || "",
      createdAt: { $gte: tenSecAgo },
    });

    if (existingRecent) {
      return res.status(200).json(new ApiResponse(200, { id: existingRecent._id }, "Error log throttled/deduplicated"));
    }

    const newLog = await ErrorLog.create({
      message: String(message).slice(0, 1000),
      stack: stack ? String(stack).slice(0, 5000) : "",
      source: String(source || "frontend").slice(0, 50),
      url: String(url || "").slice(0, 500),
      route: String(route || "").slice(0, 200),
      method: String(method || "").slice(0, 10),
      statusCode: typeof statusCode === "number" ? statusCode : 500,
      severity: ["critical", "error", "warning", "info"].includes(severity)
        ? severity
        : "error",
      userAgent: String(userAgent).slice(0, 500),
      ipAddress: String(ipAddress).slice(0, 100),
      metadata,
    });

    return res.status(201).json(new ApiResponse(201, { id: newLog._id }, "Logged successfully"));
  } catch (error) {
    console.warn("Could not save client error log:", error.message);
    return res.status(200).json(new ApiResponse(200, null, "Ignored"));
  }
};
