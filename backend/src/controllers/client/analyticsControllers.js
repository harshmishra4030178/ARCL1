import Visitor from "../../models/visitorModel.js";
import { parseUserAgent } from "../../utils/deviceParser.js";

// POST /api/v1/client/analytics/track
export const trackVisitor = async (req, res) => {
  try {
    const {
      sessionId,
      path = "/",
      referrer = "",
      screenResolution = "",
      clientDevice = "",
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID required" });
    }

    const userAgent = req.headers["user-agent"] || "";
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    const { device, os, browser } = parseUserAgent(userAgent, clientDevice);

    // Rate-limit consecutive duplicate hits for same path within 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const recentHit = await Visitor.findOne({
      sessionId,
      path,
      createdAt: { $gte: thirtySecondsAgo },
    });

    if (recentHit) {
      return res.status(200).json({ success: true, message: "Visit debounced" });
    }

    const visit = await Visitor.create({
      sessionId,
      ip,
      device,
      browser,
      os,
      path,
      referrer,
      screenResolution,
    });

    return res.status(201).json({
      success: true,
      message: "Visit logged successfully",
      data: { id: visit._id, device, browser, os },
    });
  } catch (error) {
    console.error("Visitor tracking error:", error);
    // Silent fail so client UX is never interrupted
    return res.status(500).json({ success: false, message: "Tracking failed" });
  }
};
