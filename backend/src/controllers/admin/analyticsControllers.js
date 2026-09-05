import Visitor from "../../models/visitorModel.js";

// GET /api/v1/admin/analytics/visitors
export const getVisitorAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysInt = parseInt(days, 10) || 30;
    const startDate = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000);

    // 1. TOTAL VISITS & UNIQUE SESSIONS
    const totalPageviews = await Visitor.countDocuments();
    const uniqueSessions = await Visitor.distinct("sessionId");
    const totalUniqueVisitors = uniqueSessions.length;

    // 2. DEVICE DISTRIBUTION
    const deviceAgg = await Visitor.aggregate([
      {
        $group: {
          _id: "$device",
          count: { $sum: 1 },
        },
      },
    ]);

    let desktopCount = 0;
    let mobileCount = 0;
    let tabletCount = 0;

    deviceAgg.forEach((item) => {
      const dev = (item._id || "").toLowerCase();
      if (dev === "mobile") mobileCount = item.count;
      else if (dev === "tablet") tabletCount = item.count;
      else desktopCount += item.count;
    });

    const totalTracked = desktopCount + mobileCount + tabletCount || 1;
    const devices = {
      desktop: {
        count: desktopCount,
        percentage: Math.round((desktopCount / totalTracked) * 100),
      },
      mobile: {
        count: mobileCount,
        percentage: Math.round((mobileCount / totalTracked) * 100),
      },
      tablet: {
        count: tabletCount,
        percentage: Math.round((tabletCount / totalTracked) * 100),
      },
    };

    // 3. OPERATING SYSTEMS DISTRIBUTION
    const osAgg = await Visitor.aggregate([
      {
        $group: {
          _id: "$os",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const osBreakdown = osAgg.map((item) => ({
      name: item._id || "Other",
      count: item.count,
      percentage: Math.round((item.count / totalTracked) * 100),
    }));

    // 4. BROWSER DISTRIBUTION
    const browserAgg = await Visitor.aggregate([
      {
        $group: {
          _id: "$browser",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const browserBreakdown = browserAgg.map((item) => ({
      name: item._id || "Other",
      count: item.count,
      percentage: Math.round((item.count / totalTracked) * 100),
    }));

    // 5. DAILY TRAFFIC TREND (LAST 7 OR 14 DAYS)
    const dailyTrendAgg = await Visitor.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          pageviews: { $sum: 1 },
          uniqueSessions: { $addToSet: "$sessionId" },
        },
      },
      {
        $project: {
          date: "$_id",
          pageviews: 1,
          uniqueVisitors: { $size: "$uniqueSessions" },
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // 6. TOP VISITED PAGES
    const topPagesAgg = await Visitor.aggregate([
      {
        $group: {
          _id: "$path",
          pageviews: { $sum: 1 },
        },
      },
      { $sort: { pageviews: -1 } },
      { $limit: 5 },
    ]);

    const topPages = topPagesAgg.map((p) => ({
      path: p._id || "/",
      pageviews: p.pageviews,
      percentage: Math.round((p.pageviews / totalTracked) * 100),
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPageviews,
          totalUniqueVisitors,
          mobileShare: devices.mobile.percentage,
        },
        devices,
        osBreakdown,
        browserBreakdown,
        dailyTrend: dailyTrendAgg,
        topPages,
      },
    });
  } catch (error) {
    console.error("Fetch visitor analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitor analytics",
    });
  }
};
