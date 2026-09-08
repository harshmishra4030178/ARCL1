"use client";

import { useEffect, useState } from "react";
import { useErrorLogStore } from "../../store/useErrorLogStore.js";
import { reportClientError } from "../../utils/clientErrorLogger.js";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Trash2,
  RefreshCw,
  ExternalLink,
  Copy,
  ShieldAlert,
  Bug,
  Globe,
  Server,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

const ErrorLogsPage = () => {
  const {
    logs,
    stats,
    pagination,
    loading,
    filters,
    setFilter,
    setPage,
    fetchLogs,
    fetchStats,
    toggleResolve,
    deleteLog,
    clearResolvedLogs,
  } = useErrorLogStore();

  const [selectedLogForModal, setSelectedLogForModal] = useState(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.info("Copied stack trace to clipboard!");
  };

  const handleTriggerTestError = () => {
    try {
      reportClientError({
        message: "Test Diagnostic Exception for ARCL System Verification",
        stack: "Error: Test Diagnostic\n  at AdminErrorLogsPage.jsx:45:12\n  at simulateTest (ARCL/diagnostics.js:10:4)",
        severity: "warning",
        metadata: { trigger: "Manual Admin Dashboard Trigger" },
      });
      toast.success("Triggered test error report! Refreshing in 1 second...");
      setTimeout(() => {
        fetchLogs();
        fetchStats();
      }, 1000);
    } catch (e) {
      toast.error("Test trigger failed");
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <XCircle size={12} className="text-red-600" /> Critical
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <AlertTriangle size={12} className="text-amber-600" /> Error
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Bug size={12} className="text-yellow-600" /> Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Clock size={12} className="text-blue-600" /> Info
          </span>
        );
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case "backend":
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
            <Server size={12} /> Backend
          </span>
        );
      case "frontend":
        return (
          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
            <Globe size={12} /> Frontend
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
            <Layers size={12} /> {source}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#021C57] tracking-tight">
                System Health & Error Monitoring
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Live automated capture of runtime client crashes, API errors, and backend exceptions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTriggerTestError}
            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-600" />
            Trigger Test Error
          </button>

          <button
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            Refresh
          </button>

          <button
            onClick={clearResolvedLogs}
            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Trash2 size={14} />
            Clear Resolved Logs
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Recorded</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.total || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        {/* Unresolved Errors */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">Unresolved Issues</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.unresolved || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Critical Errors */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-500">Critical Failures</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{stats.critical || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <XCircle size={22} />
          </div>
        </div>

        {/* Last 24 Hours */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-500">Last 24 Hours</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{stats.last24h || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH BAR */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search error message, URL, stack..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#021C57]"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={filters.severity}
              onChange={(e) => setFilter("severity", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#021C57]"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={filters.source}
              onChange={(e) => setFilter("source", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#021C57]"
            >
              <option value="all">All Sources (Frontend & Backend)</option>
              <option value="frontend">Frontend (Client Browser)</option>
              <option value="backend">Backend (Node/Express API)</option>
            </select>
          </div>

          {/* Resolution Status */}
          <div>
            <select
              value={filters.resolved}
              onChange={(e) => setFilter("resolved", e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#021C57]"
            >
              <option value="all">All Statuses (Resolved & Unresolved)</option>
              <option value="false">Unresolved Only (Needs Action)</option>
              <option value="true">Resolved Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. ERROR LOGS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#021C57] text-white">
              <tr>
                <th className="p-4 font-semibold">Severity & Source</th>
                <th className="p-4 font-semibold">Error Message</th>
                <th className="p-4 font-semibold">URL / Route</th>
                <th className="p-4 font-semibold">Reported At</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="w-8 h-8 border-3 border-[#021C57] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading system error logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-gray-800 text-sm">No Error Logs Found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your platform is operating smoothly with 0 active error reports under this filter.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={log._id}
                      className={`transition hover:bg-gray-50/80 ${
                        log.resolved ? "opacity-60 bg-gray-50/30" : ""
                      }`}
                    >
                      {/* Severity & Source */}
                      <td className="p-4 align-top space-y-1.5 whitespace-nowrap">
                        <div>{getSeverityBadge(log.severity)}</div>
                        <div>{getSourceIcon(log.source)}</div>
                      </td>

                      {/* Error Message */}
                      <td className="p-4 align-top max-w-xs md:max-w-md">
                        <div className="font-bold text-gray-900 line-clamp-2 break-words">
                          {log.message}
                        </div>
                        {log.stack && (
                          <button
                            onClick={() => setSelectedLogForModal(log)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold mt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Bug size={12} /> View Stack Trace
                          </button>
                        )}
                        {log.userAgent && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            Device: {log.userAgent}
                          </p>
                        )}
                      </td>

                      {/* URL / Route */}
                      <td className="p-4 align-top max-w-[180px] truncate">
                        {log.url ? (
                          <a
                            href={log.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-[#021C57] flex items-center gap-1 font-mono text-[11px] truncate"
                          >
                            <span className="truncate">{log.url.replace(/^https?:\/\/[^/]+/, "") || "/"}</span>
                            <ExternalLink size={10} className="shrink-0 text-gray-400" />
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                        {log.method && (
                          <span className="inline-block bg-gray-100 text-gray-600 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded mt-1">
                            {log.method} {log.statusCode || 500}
                          </span>
                        )}
                      </td>

                      {/* Reported At */}
                      <td className="p-4 align-top whitespace-nowrap text-gray-500">
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td className="p-4 align-top text-center whitespace-nowrap">
                        {log.resolved ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-top text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => toggleResolve(log._id)}
                          title={log.resolved ? "Mark Unresolved" : "Mark Resolved"}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                            log.resolved
                              ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {log.resolved ? "Reopen" : "Resolve"}
                        </button>

                        <button
                          onClick={() => deleteLog(log._id)}
                          title="Delete Log"
                          className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} total errors)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg font-semibold cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage(pagination.page + 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg font-semibold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. STACK TRACE MODAL */}
      {selectedLogForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Detailed Error Diagnostics
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedLogForModal.message}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block font-medium">URL / Route:</span>
                  <span className="font-mono text-gray-800 break-all">{selectedLogForModal.url || "N/A"}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <span className="text-gray-400 block font-medium">Reported At:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedLogForModal.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {selectedLogForModal.userAgent && (
                <div className="bg-gray-50 p-3 rounded-xl text-xs">
                  <span className="text-gray-400 block font-medium">Client Device / User Agent:</span>
                  <span className="font-mono text-gray-700 text-[11px] break-all">{selectedLogForModal.userAgent}</span>
                </div>
              )}

              {selectedLogForModal.stack && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Code Stack Trace:</span>
                    <button
                      onClick={() => handleCopy(selectedLogForModal.stack)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      <Copy size={12} /> Copy Trace
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
                    {selectedLogForModal.stack}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="bg-[#021C57] text-white px-6 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogsPage;
