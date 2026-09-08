import ErrorLog from "../../models/errorLogModel.js";
import ApiResponse from "../../utils/ApiResponse.js";

/**
 * Public endpoint to silently ingest runtime client-side errors
 */
export const logClientError = async (req, res) => {
  try {
    const {
      message,
      stack,
      url,
      route,
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

    // Deduplicate: Don't flood DB if identical error happened in last 30 seconds
    const thirtySecAgo = new Date(Date.now() - 30 * 1000);
    const existingRecent = await ErrorLog.findOne({
      message: String(message).slice(0, 300),
      url: url || "",
      createdAt: { $gte: thirtySecAgo },
    });

    if (existingRecent) {
      return res.status(200).json(new ApiResponse(200, null, "Error log throttled/deduplicated"));
    }

    const newLog = await ErrorLog.create({
      message: String(message).slice(0, 1000),
      stack: stack ? String(stack).slice(0, 5000) : "",
      source: "frontend",
      url: url || "",
      route: route || "",
      severity: ["critical", "error", "warning", "info"].includes(severity)
        ? severity
        : "error",
      userAgent: String(userAgent).slice(0, 500),
      ipAddress: String(ipAddress).slice(0, 100),
      metadata,
    });

    return res.status(201).json(new ApiResponse(201, { id: newLog._id }, "Logged successfully"));
  } catch (error) {
    // Silent fail so error logging itself never breaks the client app
    console.warn("Could not save client error log:", error.message);
    return res.status(200).json(new ApiResponse(200, null, "Ignored"));
  }
};
