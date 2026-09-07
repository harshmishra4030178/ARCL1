"use client";

import { useMemo, useState } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  Users,
  Eye,
  Globe,
  TrendingUp,
  Cpu,
  Compass,
  Layers,
  Calendar,
} from "lucide-react";

const VisitorAnalyticsCard = ({ visitorData = null, loading = false, onRefresh = null }) => {
  const [activeTab, setActiveTab] = useState("devices"); // "devices" | "browsers" | "pages"
  const [timeframe, setTimeframe] = useState(7); // 7 | 14 | 30 days
  const [hoveredDate, setHoveredDate] = useState(null);

  // Extract 100% real-time metrics directly from MongoDB API response
  const analytics = useMemo(() => {
    const raw = visitorData || {};
    const summary = raw.summary || {};
    const devices = raw.devices || {};
    const osBreakdown = raw.osBreakdown || [];
    const browserBreakdown = raw.browserBreakdown || [];
    const dailyTrend = raw.dailyTrend || [];
    const topPages = raw.topPages || [];

    const totalViews = summary.totalPageviews || 0;
    const uniqueVisitors = summary.totalUniqueVisitors || 0;

    // Device counts & percentages
    const desktopCount = devices.desktop?.count || 0;
    const mobileCount = devices.mobile?.count || 0;
    const tabletCount = devices.tablet?.count || 0;
    const desktopPct = devices.desktop?.percentage || 0;
    const mobilePct = devices.mobile?.percentage || 0;
    const tabletPct = devices.tablet?.percentage || 0;

    // Filter trend by selected timeframe (default 7 days)
    const slicedRawTrend = dailyTrend.length > 0
      ? dailyTrend.slice(-timeframe)
      : [];

    let trend = [];
    if (slicedRawTrend.length > 0) {
      trend = slicedRawTrend.map((t) => {
        const d = new Date(t.date);
        let dayLabel = t.date;
        if (!isNaN(d.getTime())) {
          if (timeframe <= 7) {
            dayLabel = d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            });
          } else {
            dayLabel = d.toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            });
          }
        }
        return {
          date: dayLabel,
          fullDate: t.date,
          pageviews: t.pageviews || 0,
          uniqueVisitors: t.uniqueVisitors || 0,
        };
      });
    } else {
      // Clean fallback: consecutive past days with 0 counts
      const now = new Date();
      for (let i = timeframe - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = timeframe <= 7
          ? d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            })
          : d.toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            });
        trend.push({
          date: dayLabel,
          fullDate: d.toISOString().split("T")[0],
          pageviews: 0,
          uniqueVisitors: 0,
        });
      }
    }

    const maxTrendVal = Math.max(
      ...trend.map((t) => Math.max(t.pageviews, t.uniqueVisitors)),
      5
    );

    return {
      totalViews,
      uniqueVisitors,
      devices: {
        desktop: { count: desktopCount, percentage: desktopPct },
        mobile: { count: mobileCount, percentage: mobilePct },
        tablet: { count: tabletCount, percentage: tabletPct },
      },
      osBreakdown,
      browserBreakdown,
      topPages,
      trend,
      maxTrendVal,
    };
  }, [visitorData, timeframe]);

  return (
    <div className="w-full max-w-full overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-100 pb-4 sm:pb-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 tracking-tight">
              Visitor Traffic & Device Intelligence
            </h2>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-400 truncate">
            Real-time breakdown of storefront visitors, device types, operating systems, and platforms
          </p>
        </div>

        {/* TAB CONTROLS */}
        <div className="w-full sm:w-auto flex items-center gap-1 bg-gray-50 p-1 rounded-xl sm:rounded-2xl border border-gray-200/70 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab("devices")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "devices"
                ? "bg-white text-[#021C57] shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Smartphone size={13} /> Devices & OS
          </button>
          <button
            onClick={() => setActiveTab("browsers")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "browsers"
                ? "bg-white text-[#021C57] shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Compass size={13} /> Browsers
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-[11px] sm:text-xs ${
              activeTab === "pages"
                ? "bg-white text-[#021C57] shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Layers size={13} /> Top Routes
          </button>
        </div>
      </div>

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-gray-500">
            <span className="truncate">Unique Visitors</span>
            <Users size={13} className="text-blue-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{analytics.uniqueVisitors}</p>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <TrendingUp size={11} /> Real Sessions
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-gray-500">
            <span className="truncate">Total Pageviews</span>
            <Eye size={13} className="text-indigo-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900">{analytics.totalViews}</p>
          <span className="text-[10px] sm:text-[11px] text-gray-400 truncate block">Storefront hits</span>
        </div>

        <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-gray-500">
            <span className="truncate">Desktop Share</span>
            <Monitor size={13} className="text-[#021C57] shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#021C57]">
            {analytics.devices.desktop.percentage}%
          </p>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-mono">
            {analytics.devices.desktop.count} visits
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-gray-500">
            <span className="truncate">Mobile & Tablet</span>
            <Smartphone size={13} className="text-emerald-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">
            {analytics.devices.mobile.percentage + analytics.devices.tablet.percentage}%
          </p>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-mono">
            {analytics.devices.mobile.count + analytics.devices.tablet.count} visits
          </span>
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        
        {/* LEFT: VISITOR TRAFFIC TIMELINE (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-50/50 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-600 shrink-0" /> Visitor Activity Timeline
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">
                Daily Pageviews vs Unique Visitor traffic
              </p>
            </div>

            {/* Timeframe & Legend Controls */}
            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              {/* Range Selector */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 text-[10px] font-bold text-gray-600">
                <button
                  onClick={() => setTimeframe(7)}
                  className={`px-2 py-0.5 rounded transition ${
                    timeframe === 7 ? "bg-[#021C57] text-white" : "hover:text-gray-900"
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => setTimeframe(14)}
                  className={`px-2 py-0.5 rounded transition ${
                    timeframe === 14 ? "bg-[#021C57] text-white" : "hover:text-gray-900"
                  }`}
                >
                  14D
                </button>
                <button
                  onClick={() => setTimeframe(30)}
                  className={`px-2 py-0.5 rounded transition ${
                    timeframe === 30 ? "bg-[#021C57] text-white" : "hover:text-gray-900"
                  }`}
                >
                  30D
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2.5 text-[10px] sm:text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#021C57]"></span>
                  <span className="text-gray-600">Views</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-gray-600">Unique</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative pt-4 sm:pt-6 pb-2 w-full overflow-hidden">
            {hoveredDate && (
              <div className="absolute top-0 right-1 bg-gray-900 text-white px-2 py-0.5 rounded-lg text-[10px] sm:text-xs z-10 flex items-center gap-2 animate-fadeIn shadow-md">
                <span className="font-bold text-blue-300">{hoveredDate.date}:</span>
                <span>Views: <strong>{hoveredDate.pageviews}</strong></span>
                <span className="text-emerald-400">Unique: {hoveredDate.uniqueVisitors}</span>
              </div>
            )}

            <div className="h-36 sm:h-44 w-full flex items-end justify-between gap-1 sm:gap-2 border-b border-gray-200/80 px-1">
              {analytics.trend.map((item, idx) => {
                const viewH = item.pageviews > 0
                  ? `${Math.min(100, Math.max(12, (item.pageviews / analytics.maxTrendVal) * 100))}%`
                  : "4px";
                const uniqH = item.uniqueVisitors > 0
                  ? `${Math.min(100, Math.max(10, (item.uniqueVisitors / analytics.maxTrendVal) * 100))}%`
                  : "4px";

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDate(item)}
                    onMouseLeave={() => setHoveredDate(null)}
                    className="flex-1 min-w-0 flex flex-col items-center gap-1 sm:gap-1.5 h-full justify-end group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                      {/* Pageviews Bar */}
                      <div
                        style={{ height: viewH }}
                        className={`w-full max-w-[14px] sm:max-w-[18px] rounded-t-md transition-all duration-300 group-hover:brightness-110 ${
                          item.pageviews > 0
                            ? "bg-gradient-to-t from-[#021C57] to-blue-600"
                            : "bg-gray-200"
                        }`}
                      />
                      {/* Unique Visitors Bar */}
                      <div
                        style={{ height: uniqH }}
                        className={`w-full max-w-[14px] sm:max-w-[18px] rounded-t-md transition-all duration-300 group-hover:brightness-110 ${
                          item.uniqueVisitors > 0
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                            : "bg-gray-200"
                        }`}
                      />
                    </div>

                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-gray-500 group-hover:text-gray-900 transition text-center truncate w-full block">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: DEVICE & PLATFORM BREAKDOWN (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-50/50 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 space-y-4 flex flex-col justify-between min-w-0 overflow-hidden">
          
          {/* TAB 1: DEVICES & OS */}
          {activeTab === "devices" && (
            <div className="space-y-3.5 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Monitor size={14} className="text-indigo-600 shrink-0" /> Device Distribution
                </h3>
                <span className="text-[10px] sm:text-[11px] text-gray-400">Hardware type</span>
              </div>

              {/* Progress Bars for Devices */}
              <div className="space-y-2.5 sm:space-y-3">
                {/* Desktop */}
                <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 space-y-1 sm:space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Monitor size={13} className="text-[#021C57] shrink-0" />
                      <span className="font-bold text-gray-800 text-[11px] sm:text-xs">Desktop / Laptop</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 text-[11px] sm:text-xs">
                      {analytics.devices.desktop.count} ({analytics.devices.desktop.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.desktop.percentage}%` }}
                      className="bg-[#021C57] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 space-y-1 sm:space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Smartphone size={13} className="text-emerald-600 shrink-0" />
                      <span className="font-bold text-gray-800 text-[11px] sm:text-xs">Mobile Phone</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 text-[11px] sm:text-xs">
                      {analytics.devices.mobile.count} ({analytics.devices.mobile.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.mobile.percentage}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Tablet */}
                <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 space-y-1 sm:space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Tablet size={13} className="text-amber-500 shrink-0" />
                      <span className="font-bold text-gray-800 text-[11px] sm:text-xs">Tablet / iPad</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 text-[11px] sm:text-xs">
                      {analytics.devices.tablet.count} ({analytics.devices.tablet.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.tablet.percentage}%` }}
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* OS Pills */}
              <div className="pt-2 border-t border-gray-200/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                  Operating Systems
                </span>
                {analytics.osBreakdown.length > 0 ? (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {analytics.osBreakdown.map((os, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold text-gray-700"
                      >
                        <Cpu size={10} className="text-gray-400 shrink-0" /> {os.name}:{" "}
                        <strong className="text-gray-900">{os.percentage}%</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">No operating systems recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BROWSERS */}
          {activeTab === "browsers" && (
            <div className="space-y-3.5 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Compass size={14} className="text-blue-600 shrink-0" /> Browser Market Share
                </h3>
                <span className="text-[10px] sm:text-[11px] text-gray-400">User Agents</span>
              </div>

              {analytics.browserBreakdown.length > 0 ? (
                <div className="space-y-2 sm:space-y-2.5">
                  {analytics.browserBreakdown.map((b, i) => (
                    <div key={i} className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 text-[11px] sm:text-xs">{b.name}</span>
                        <span className="font-mono text-gray-600 font-bold text-[11px] sm:text-xs">
                          {b.count} ({b.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${b.percentage}%` }}
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">No browser telemetry recorded yet.</p>
              )}
            </div>
          )}

          {/* TAB 3: TOP STOREFRONT PAGES */}
          {activeTab === "pages" && (
            <div className="space-y-3.5 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-600 shrink-0" /> Most Visited Storefront Routes
                </h3>
                <span className="text-[10px] sm:text-[11px] text-gray-400">Page hits</span>
              </div>

              {analytics.topPages.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topPages.map((p, i) => (
                    <div
                      key={i}
                      className="bg-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-100 flex items-center justify-between text-xs gap-2"
                    >
                      <span className="font-mono font-medium text-gray-700 truncate max-w-[130px] xs:max-w-[170px] sm:max-w-[220px] text-[11px] sm:text-xs">
                        {p.path}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 sm:px-2 rounded-md font-bold text-[10px] sm:text-[11px] shrink-0">
                        {p.pageviews} views ({p.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">No route visits recorded yet.</p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default VisitorAnalyticsCard;
