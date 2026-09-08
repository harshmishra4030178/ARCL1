import ErrorLog from "../../models/errorLogModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

/**
 * Get all error logs with advanced filtering, search, and pagination
 */
export const getErrorLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      severity = "all",
      source = "all",
      resolved = "all",
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { url: { $regex: search, $options: "i" } },
        { stack: { $regex: search, $options: "i" } },
      ];
    }

    if (severity && severity !== "all") {
      query.severity = severity;
    }

    if (source && source !== "all") {
      query.source = source;
    }

    if (resolved && resolved !== "all") {
      query.resolved = resolved === "true" || resolved === true;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ErrorLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ErrorLog.countDocuments(query),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          logs,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
        "Error logs fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated error statistics for the dashboard KPI cards
 */
export const getErrorStats = async (req, res, next) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCount,
      unresolvedCount,
      criticalCount,
      last24hCount,
      recentLogs,
    ] = await Promise.all([
      ErrorLog.countDocuments(),
      ErrorLog.countDocuments({ resolved: false }),
      ErrorLog.countDocuments({ severity: "critical", resolved: false }),
      ErrorLog.countDocuments({ createdAt: { $gte: last24h } }),
      ErrorLog.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          total: totalCount,
          unresolved: unresolvedCount,
          critical: criticalCount,
          last24h: last24hCount,
          recentLogs,
        },
        "Error statistics fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle resolve status of an error log
 */
export const toggleResolveErrorLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const log = await ErrorLog.findById(id);
    if (!log) {
      throw new ApiError(404, "Error log not found");
    }

    log.resolved = !log.resolved;
    log.resolvedAt = log.resolved ? new Date() : null;
    log.resolvedBy = log.resolved ? req.user?.name || req.user?.email || "Admin" : "";
    if (notes !== undefined) {
      log.notes = notes;
    }

    await log.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        log,
        `Error log marked as ${log.resolved ? "Resolved" : "Unresolved"}`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a single error log
 */
export const deleteErrorLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await ErrorLog.findByIdAndDelete(id);
    if (!log) {
      throw new ApiError(404, "Error log not found");
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Error log deleted successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk clear resolved error logs
 */
export const clearResolvedErrorLogs = async (req, res, next) => {
  try {
    const result = await ErrorLog.deleteMany({ resolved: true });

    return res.status(200).json(
      new ApiResponse(
        200,
        { deletedCount: result.deletedCount },
        `Successfully cleared ${result.deletedCount} resolved error logs`
      )
    );
  } catch (error) {
    next(error);
  }
};
