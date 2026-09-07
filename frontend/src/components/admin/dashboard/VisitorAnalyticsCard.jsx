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
  Activity,
} from "lucide-react";

const VisitorAnalyticsCard = ({ visitorData = null, loading = false, onRefresh = null }) => {
  const [activeTab, setActiveTab] = useState("devices"); // "devices" | "browsers" | "pages"
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

    // Process daily trend data (last 7 days continuous)
    let trend = [];
    if (dailyTrend.length > 0) {
      trend = dailyTrend.map((t) => {
        const d = new Date(t.date);
        const dayLabel = isNaN(d.getTime())
          ? t.date
          : d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            });
        return {
          date: dayLabel,
          fullDate: t.date,
          pageviews: t.pageviews || 0,
          uniqueVisitors: t.uniqueVisitors || 0,
        };
      });
    } else {
      // Clean fallback: 7 consecutive past days with 0 counts
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString("en-US", {
          weekday: "short",
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
  }, [visitorData]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="text-blue-600 w-5 h-5" />
            <h2 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">
              Visitor Traffic & Device Intelligence
            </h2>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Real-time breakdown of storefront visitors, device types, operating systems, and platforms
          </p>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-200/70 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("devices")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "devices"
                ? "bg-white text-[#021C57] shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Smartphone size={13} /> Devices & OS
          </button>
          <button
            onClick={() => setActiveTab("browsers")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "browsers"
                ? "bg-white text-[#021C57] shadow-2xs font-bold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Compass size={13} /> Browsers
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Unique Visitors</span>
            <Users size={14} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{analytics.uniqueVisitors}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <TrendingUp size={11} /> Real Sessions
          </span>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Total Pageviews</span>
            <Eye size={14} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{analytics.totalViews}</p>
          <span className="text-[11px] text-gray-400">Storefront engagements</span>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Desktop Share</span>
            <Monitor size={14} className="text-[#021C57]" />
          </div>
          <p className="text-2xl font-black text-[#021C57]">
            {analytics.devices.desktop.percentage}%
          </p>
          <span className="text-[11px] text-gray-400 font-mono">
            {analytics.devices.desktop.count} visits
          </span>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Mobile & Tablet</span>
            <Smartphone size={14} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {analytics.devices.mobile.percentage + analytics.devices.tablet.percentage}%
          </p>
          <span className="text-[11px] text-gray-400 font-mono">
            {analytics.devices.mobile.count + analytics.devices.tablet.count} visits
          </span>
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: VISITOR TRAFFIC TIMELINE (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-50/50 p-5 rounded-3xl border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={15} className="text-blue-600" /> Visitor Activity Timeline
              </h3>
              <p className="text-[11px] text-gray-400">
                Daily Pageviews vs Unique Visitor traffic (Last 7 Days)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#021C57]"></span>
                <span className="text-gray-600 text-[11px]">Views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-600 text-[11px]">Unique</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative pt-6 pb-2">
            {hoveredDate && (
              <div className="absolute top-0 right-2 bg-gray-900 text-white px-2.5 py-1 rounded-lg text-xs z-10 flex items-center gap-2.5 animate-fadeIn">
                <span className="font-bold text-blue-300">{hoveredDate.date}:</span>
                <span>Views: <strong>{hoveredDate.pageviews}</strong></span>
                <span className="text-emerald-400">Unique: {hoveredDate.uniqueVisitors}</span>
              </div>
            )}

            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 border-b border-gray-200/80 px-2">
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
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Pageviews Bar */}
                      <div
                        style={{ height: viewH }}
                        className={`w-3 sm:w-4 rounded-t-md transition-all duration-300 group-hover:brightness-110 ${
                          item.pageviews > 0
                            ? "bg-gradient-to-t from-[#021C57] to-blue-600"
                            : "bg-gray-200"
                        }`}
                      />
                      {/* Unique Visitors Bar */}
                      <div
                        style={{ height: uniqH }}
                        className={`w-3 sm:w-4 rounded-t-md transition-all duration-300 group-hover:brightness-110 ${
                          item.uniqueVisitors > 0
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                            : "bg-gray-200"
                        }`}
                      />
                    </div>

                    <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-900 transition whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: DEVICE & PLATFORM BREAKDOWN (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-50/50 p-5 rounded-3xl border border-gray-100 space-y-4 flex flex-col justify-between">
          
          {/* TAB 1: DEVICES & OS */}
          {activeTab === "devices" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Monitor size={15} className="text-indigo-600" /> Device Distribution
                </h3>
                <span className="text-[11px] text-gray-400">Hardware type</span>
              </div>

              {/* Progress Bars for Devices */}
              <div className="space-y-3">
                {/* Desktop */}
                <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-[#021C57]" />
                      <span className="font-bold text-gray-800">Desktop / Laptop</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">
                      {analytics.devices.desktop.count} ({analytics.devices.desktop.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.desktop.percentage}%` }}
                      className="bg-[#021C57] h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Smartphone size={14} className="text-emerald-600" />
                      <span className="font-bold text-gray-800">Mobile Phone</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">
                      {analytics.devices.mobile.count} ({analytics.devices.mobile.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.mobile.percentage}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Tablet */}
                <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Tablet size={14} className="text-amber-500" />
                      <span className="font-bold text-gray-800">Tablet / iPad</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">
                      {analytics.devices.tablet.count} ({analytics.devices.tablet.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${analytics.devices.tablet.percentage}%` }}
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              {/* OS Pills */}
              <div className="pt-2 border-t border-gray-200/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Operating Systems
                </span>
                {analytics.osBreakdown.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.osBreakdown.map((os, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700"
                      >
                        <Cpu size={11} className="text-gray-400" /> {os.name}:{" "}
                        <strong className="text-gray-900">{os.percentage}%</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No operating systems recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BROWSERS */}
          {activeTab === "browsers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Compass size={15} className="text-blue-600" /> Browser Market Share
                </h3>
                <span className="text-[11px] text-gray-400">User Agents</span>
              </div>

              {analytics.browserBreakdown.length > 0 ? (
                <div className="space-y-2.5">
                  {analytics.browserBreakdown.map((b, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800">{b.name}</span>
                        <span className="font-mono text-gray-600 font-bold">
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
                <p className="text-xs text-gray-400 italic">No browser telemetry recorded yet.</p>
              )}
            </div>
          )}

          {/* TAB 3: TOP STOREFRONT PAGES */}
          {activeTab === "pages" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Layers size={15} className="text-emerald-600" /> Most Visited Storefront Routes
                </h3>
                <span className="text-[11px] text-gray-400">Page hits</span>
              </div>

              {analytics.topPages.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topPages.map((p, i) => (
                    <div
                      key={i}
                      className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-medium text-gray-700 truncate max-w-[180px]">
                        {p.path}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        {p.pageviews} views ({p.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No route visits recorded yet.</p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default VisitorAnalyticsCard;
