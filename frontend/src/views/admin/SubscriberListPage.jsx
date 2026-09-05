"use client";

import { useEffect, useState } from "react";
import {
  FaTrash,
  FaEnvelope,
  FaSearch,
  FaCopy,
  FaFileCsv,
  FaCheck,
  FaUserCheck,
  FaCommentDots,
} from "react-icons/fa";
import { getAdminSubscribers, deleteSubscriber } from "../../api/subscriberApi.js";
import BulkSmsModal from "../../components/admin/subscriber/BulkSmsModal.jsx";
import { toast } from "react-toastify";

const SubscriberListPage = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await getAdminSubscribers();
      // Handle ApiResponse structure
      const list =
        res.data?.data?.subscribers ||
        res.data?.data ||
        res.data?.subscribers ||
        [];
      setSubscribers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load subscribers:", err);
      toast.error("Failed to load newsletter subscribers list");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the subscriber list?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
      toast.success("Subscriber removed successfully");
    } catch (err) {
      console.error("Delete subscriber error:", err);
      toast.error(err.response?.data?.message || "Failed to remove subscriber");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyAllEmails = () => {
    if (subscribers.length === 0) return;
    const emailString = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emailString);
    setCopiedAll(true);
    toast.success(`Copied ${subscribers.length} email addresses to clipboard!`);
    setTimeout(() => setCopiedAll(false), 3000);
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;

    const headers = "Email,Source,Status,Subscribed Date\n";
    const rows = subscribers
      .map(
        (s) =>
          `"${s.email}","${s.source || "Website"}","${
            s.isActive ? "Active" : "Inactive"
          }","${new Date(s.createdAt).toISOString()}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ARCL_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscribers list exported as CSV!");
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.email?.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2.5">
            <FaEnvelope className="text-[#021C57]" /> Newsletter Subscribers
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage users who opted in for new laboratory equipment updates & price alerts ({subscribers.length} total)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowSmsModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#021C57] to-[#0D3692] hover:from-[#032675] hover:to-[#0f3ea3] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            title="Create & send bulk SMS & Email campaigns with greeting banners to subscribers and customers"
          >
            <FaCommentDots className="text-amber-400" />
            <span>Send Broadcast (SMS & Email)</span>
          </button>

          <button
            onClick={handleCopyAllEmails}
            disabled={subscribers.length === 0}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Copy all email addresses for marketing blast"
          >
            {copiedAll ? <FaCheck className="text-green-600" /> : <FaCopy />}
            <span>{copiedAll ? "Emails Copied!" : "Copy All Emails"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <FaFileCsv size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* SEARCH AND STATS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subscriber email..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
            <FaUserCheck size={12} className="text-emerald-600" /> Active Opt-ins: {subscribers.filter(s => s.isActive).length}
          </span>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 border-4 border-[#021C57] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm font-medium">Loading subscriber list...</p>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3 shadow-xs">
          <FaEnvelope className="mx-auto text-gray-300 text-4xl" />
          <h3 className="text-base font-bold text-gray-700">
            {search ? "No matching subscribers found" : "No Subscribers Yet"}
          </h3>
          <p className="text-gray-400 text-xs max-w-sm mx-auto">
            {search
              ? "Try searching for a different email keyword."
              : "When visitors subscribe on the homepage newsletter form, their emails will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Subscriber Email</th>
                <th className="p-4">Opt-in Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Subscribed Date</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredSubscribers.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50/80 transition">
                  {/* EMAIL */}
                  <td className="p-4 font-semibold text-gray-800">
                    <a
                      href={`mailto:${item.email}`}
                      className="text-blue-700 hover:underline flex items-center gap-2"
                    >
                      <FaEnvelope size={12} className="text-gray-400" />
                      {item.email}
                    </a>
                  </td>

                  {/* SOURCE */}
                  <td className="p-4 text-xs text-gray-500 font-mono">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                      {item.source || "website_home"}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        item.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      ● {item.isActive ? "Subscribed" : "Unsubscribed"}
                    </span>
                  </td>

                  {/* DATE */}
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(item._id, item.email)}
                      disabled={deletingId === item._id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                      title="Remove Subscriber"
                    >
                      {deletingId === item._id ? (
                        <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                      ) : (
                        <FaTrash size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BULK SMS CAMPAIGN MODAL */}
      <BulkSmsModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
      />
    </div>
  );
};

export default SubscriberListPage;
