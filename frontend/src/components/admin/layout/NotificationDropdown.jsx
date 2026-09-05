"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  FileQuestion,
  Mail,
  ShoppingBag,
  ExternalLink,
  Clock,
  RotateCw,
  X,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "../../../utils/navigation.jsx";
import { useNotificationStore } from "../../../store/useNotificationStore.js";
import { formatTitleCase } from "../../../utils/stringUtils.js";

function getRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSec = Math.floor((now - date) / 1000);

  if (diffInSec < 60) return "Just now";
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState("all"); // "all" | "inquiry" | "contact"
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications = [],
    unreadCount,
    loading,
    initialize,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Initialize store and set up polling interval (every 30s)
  useEffect(() => {
    initialize();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Filtered notifications
  const filteredList = notifications.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  const handleItemClick = (item) => {
    markAsRead(item.id);
    setIsOpen(false);
    navigate(item.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. BELL TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-2xl border transition duration-200 cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-blue-50 text-[#021C57] border-blue-300 ring-2 ring-blue-100"
            : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
        }`}
        title="Admin Notifications"
        aria-label="Toggle notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} className={unreadCount > 0 ? "text-[#021C57]" : ""} />

        {/* UNREAD BADGE COUNTER */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 2. NOTIFICATION DROPDOWN MODAL */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#021C57] to-[#0B2F7E] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={17} className="text-amber-400" />
              <div>
                <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
                <p className="text-[10px] text-blue-200">
                  {unreadCount > 0
                    ? `${unreadCount} unread quote & inquiry alerts`
                    : "All notifications are up to date"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/15 transition cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={12} />
                  <span>Read all</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition cursor-pointer text-blue-200 hover:text-white"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 py-1 px-2 rounded-xl font-semibold transition cursor-pointer text-center ${
                filterType === "all"
                  ? "bg-white text-[#021C57] shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType("inquiry")}
              className={`flex-1 py-1 px-2 rounded-xl font-semibold transition cursor-pointer text-center ${
                filterType === "inquiry"
                  ? "bg-white text-[#021C57] shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Quotes ({notifications.filter((n) => n.type === "inquiry").length})
            </button>
            <button
              onClick={() => setFilterType("contact")}
              className={`flex-1 py-1 px-2 rounded-xl font-semibold transition cursor-pointer text-center ${
                filterType === "contact"
                  ? "bg-white text-[#021C57] shadow-2xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Messages ({notifications.filter((n) => n.type === "contact").length})
            </button>
          </div>

          {/* NOTIFICATION ITEMS FEED */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#021C57] flex items-center justify-center mx-auto">
                  <Sparkles size={18} />
                </div>
                <p className="text-xs font-bold text-gray-800">No notifications</p>
                <p className="text-[11px] text-gray-400">
                  New product quote requests and contact messages will appear here.
                </p>
              </div>
            ) : (
              filteredList.slice(0, 15).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-blue-50/40 relative ${
                    item.isUnread ? "bg-amber-50/30" : "bg-white"
                  }`}
                >
                  {/* TYPE ICON */}
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      item.type === "inquiry"
                        ? item.isBasket
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {item.type === "inquiry" ? (
                      item.isBasket ? (
                        <ShoppingBag size={15} />
                      ) : (
                        <FileQuestion size={15} />
                      )
                    ) : (
                      <Mail size={15} />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {formatTitleCase(item.customerName || "Customer")}
                      </p>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0 font-medium">
                        <Clock size={10} /> {getRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 line-clamp-1 font-medium">
                      {item.type === "inquiry"
                        ? `Quote: ${formatTitleCase(item.title)}`
                        : `Message: ${item.title}`}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                      {item.type === "inquiry" && (
                        <span className="bg-slate-100 text-slate-700 font-mono font-semibold px-1.5 py-0.2 rounded">
                          {item.quantity} {item.quantity > 1 ? "units" : "unit"}
                        </span>
                      )}

                      <span
                        className={`font-semibold px-1.5 py-0.2 rounded uppercase tracking-wider text-[9px] ${
                          item.status === "pending" || item.status === "unread"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* UNREAD INDICATOR DOT */}
                  {item.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition cursor-pointer text-[11px]"
              title="Refresh notifications"
            >
              <RotateCw size={11} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <Link
              to="/admin/inquiry"
              onClick={() => setIsOpen(false)}
              className="text-[#021C57] hover:text-blue-700 font-bold flex items-center gap-1 text-[11px]"
            >
              <span>Go to Inquiries Hub</span>
              <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
