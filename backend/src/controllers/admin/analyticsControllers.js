import Visitor from "../../models/visitorModel.js";

// GET /api/v1/admin/analytics/visitors
export const getVisitorAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysInt = Math.max(1, parseInt(days, 10) || 7);
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (daysInt - 1));

    // 1. TOTAL VISITS & UNIQUE SESSIONS (ALL-TIME)
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

    const totalDeviceTracked = desktopCount + mobileCount + tabletCount;
    const devices = {
      desktop: {
        count: desktopCount,
        percentage: totalDeviceTracked > 0 ? Math.round((desktopCount / totalDeviceTracked) * 100) : 0,
      },
      mobile: {
        count: mobileCount,
        percentage: totalDeviceTracked > 0 ? Math.round((mobileCount / totalDeviceTracked) * 100) : 0,
      },
      tablet: {
        count: tabletCount,
        percentage: totalDeviceTracked > 0 ? Math.round((tabletCount / totalDeviceTracked) * 100) : 0,
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
      percentage: totalDeviceTracked > 0 ? Math.round((item.count / totalDeviceTracked) * 100) : 0,
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
      percentage: totalDeviceTracked > 0 ? Math.round((item.count / totalDeviceTracked) * 100) : 0,
    }));

    // 5. DAILY TRAFFIC TREND (CONTINUOUS DATES)
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

    const trendMap = new Map();
    dailyTrendAgg.forEach((item) => {
      trendMap.set(item.date, item);
    });

    const continuousTrend = [];
    for (let i = daysInt - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (trendMap.has(dateStr)) {
        continuousTrend.push(trendMap.get(dateStr));
      } else {
        continuousTrend.push({
          date: dateStr,
          pageviews: 0,
          uniqueVisitors: 0,
        });
      }
    }

    // 6. TOP VISITED PAGES
    const topPagesAgg = await Visitor.aggregate([
      {
        $group: {
          _id: "$path",
          pageviews: { $sum: 1 },
        },
      },
      { $sort: { pageviews: -1 } },
      { $limit: 6 },
    ]);

    const topPages = topPagesAgg.map((p) => ({
      path: p._id || "/",
      pageviews: p.pageviews,
      percentage: totalPageviews > 0 ? Math.round((p.pageviews / totalPageviews) * 100) : 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPageviews,
          totalUniqueVisitors,
          mobileShare: devices.mobile.percentage + devices.tablet.percentage,
        },
        devices,
        osBreakdown,
        browserBreakdown,
        dailyTrend: continuousTrend,
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
