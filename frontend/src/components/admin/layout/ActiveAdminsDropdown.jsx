"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../../store/useAuthStore.js";
import { getActiveAdminsApi } from "../../../api/authApi.js";
import {
  FaUsers,
  FaCircle,
  FaCrown,
  FaShieldAlt,
  FaLaptop,
  FaMobileAlt,
  FaSyncAlt,
  FaChevronDown,
  FaUserCircle,
} from "react-icons/fa";
import { Link } from "../../../utils/navigation.jsx";

const formatWhatsAppLastSeen = (dateStr) => {
  if (!dateStr) return "Never logged in";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Offline";

  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If active in last 60 seconds (or slight clock tolerance)
  if (diffInSec >= -30 && diffInSec < 60) return "just now";

  // Check if today in local timezone
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin >= 1 && diffInMin < 15) {
      return `${diffInMin}m ago (${timeString})`;
    }
    return `today at ${timeString}`;
  }

  if (isYesterday) {
    return `yesterday at ${timeString}`;
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  const dateString = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(isThisYear ? {} : { year: "numeric" }),
  });

  return `${dateString} at ${timeString}`;
};

const ActiveAdminsDropdown = () => {
  const { user: currentUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [metrics, setMetrics] = useState({ online: 0, away: 0, totalAdmins: 0 });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchActiveAdmins = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await getActiveAdminsApi();
      if (res.data?.success && res.data?.data) {
        setAdmins(res.data.data.admins || []);
        setMetrics(res.data.data.metrics || { online: 0, away: 0, totalAdmins: 0 });
      }
    } catch (err) {
      console.warn("Failed to fetch active admins presence:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAdmins();

    // Auto refresh active status every 20 seconds
    const interval = setInterval(() => {
      fetchActiveAdmins(true);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const onlineCount = metrics.online || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-2xs cursor-pointer group"
        title="View Logged-in Admins Live Status"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${onlineCount > 0 ? "bg-emerald-400 opacity-75" : "bg-gray-400 opacity-50"}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${onlineCount > 0 ? "bg-emerald-500" : "bg-gray-400"}`}></span>
        </span>

        <span className="hidden md:inline text-slate-800 font-bold">
          {onlineCount > 0 ? `${onlineCount} Admin${onlineCount > 1 ? "s" : ""} Online` : "Admins Offline"}
        </span>
        <span className="md:hidden font-bold">
          {onlineCount} Online
        </span>

        <FaChevronDown className={`text-[10px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-[#021C57] text-white p-3.5 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 text-sm">
                <FaUsers />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-2">
                  Active Team &amp; Presence
                  <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                    Live
                  </span>
                </h3>
                <p className="text-[10px] text-blue-200">
                  {onlineCount} online of {metrics.totalAdmins} team members
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchActiveAdmins()}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 text-blue-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Refresh Status"
            >
              <FaSyncAlt className={`text-xs ${loading ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>

          {/* List of Admins */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
            {admins.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No registered administrators found.
              </div>
            ) : (
              <>
                {/* 1. LOGGED IN NOW SECTION */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-2 py-1 bg-emerald-50/70 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Logged In Now ({admins.filter((a) => a.status === "online").length})
                    </span>
                    <span className="text-[9px] text-emerald-600 font-semibold">Active in Portal</span>
                  </div>

                  {admins.filter((a) => a.status === "online").length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic px-2 py-1">No admins currently online</p>
                  ) : (
                    admins
                      .filter((a) => a.status === "online")
                      .map((admin) => {
                        const isMe = admin.email?.toLowerCase() === currentUser?.email?.toLowerCase();
                        return (
                          <div
                            key={admin._id}
                            className="p-2 sm:p-2.5 flex items-center justify-between gap-3 bg-emerald-50/40 border border-emerald-200/60 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                {admin.picture ? (
                                  <img
                                    src={admin.picture}
                                    alt={admin.name}
                                    className="w-8 h-8 rounded-full object-cover border border-emerald-300"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                                    {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                                  </div>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-300"></span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {admin.name || "Administrator"}
                                  </p>
                                  {isMe && (
                                    <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded-full">
                                      You
                                    </span>
                                  )}
                                  {admin.role === "superadmin" && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                      <FaCrown className="text-[8px] text-amber-600" /> SUPER
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate font-mono">
                                  {admin.email}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online Now
                              </span>
                              <div className="text-[9px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                                {admin.device?.includes("Mobile") ? (
                                  <FaMobileAlt className="text-[8px]" />
                                ) : (
                                  <FaLaptop className="text-[8px]" />
                                )}
                                <span>{admin.device}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* 2. LOGGED OUT / OFFLINE SECTION */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-slate-100 rounded-lg flex items-center justify-between">
                    <span>Logged Out / Inactive ({admins.filter((a) => a.status !== "online").length})</span>
                    <span className="text-[9px] text-slate-400 font-normal">Offline</span>
                  </div>

                  {admins
                    .filter((a) => a.status !== "online")
                    .map((admin) => {
                      const isAway = admin.status === "away";
                      return (
                        <div
                          key={admin._id}
                          className="p-2 sm:p-2.5 flex items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/70 transition rounded-xl"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              {admin.picture ? (
                                <img
                                  src={admin.picture}
                                  alt={admin.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200 opacity-60"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs opacity-70">
                                  {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                                </div>
                              )}
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isAway ? "bg-amber-400" : "bg-slate-300"}`}></span>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">
                                {admin.name || "Administrator"}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate font-mono">
                                {admin.email}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {isAway ? (
                              <span className="text-[10px] text-amber-700 font-medium">
                                Away ({formatWhatsAppLastSeen(admin.lastActiveAt)})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {admin.lastActiveAt || admin.lastLogin ? `Last seen ${formatWhatsAppLastSeen(admin.lastActiveAt || admin.lastLogin)}` : "Never logged in"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 text-[10px]">
              ⚡ Live Heartbeat: Updates every 30s
            </span>
            <Link
              to="/admin/users"
              onClick={() => setIsOpen(false)}
              className="font-bold text-blue-600 hover:text-blue-800 transition"
            >
              Manage Users &amp; Roles →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAdminsDropdown;
