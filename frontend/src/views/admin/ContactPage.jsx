"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trash2,
  Eye,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { useContactStore } from "../../store/useContactStore.js";
import ContactDetailsModal from "../../components/admin/contact/ContactDetailsModal.jsx";
import Tooltip from "../../components/admin/common/Tooltip.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import { toast } from "react-toastify";
import { formatTitleCase } from "../../utils/stringUtils.js";

const ContactPage = () => {
  const {
    contacts = [],
    loading,
    error,
    fetchContacts,
    deleteContact,
    updateStatus,
  } = useContactStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  // Stat counts
  const stats = useMemo(() => {
    return {
      total: contacts.length,
      unread: contacts.filter((c) => c.status === "unread").length,
      read: contacts.filter((c) => c.status === "read").length,
      replied: contacts.filter((c) => c.status === "replied").length,
    };
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contacts, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, currentPage, itemsPerPage]);

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      setDeletingId(id);
      await deleteContact(id);
      toast.success("Contact message deleted successfully");
    } catch (err) {
      toast.error("Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  // UPDATE STATUS
  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await updateStatus(id, newStatus);
      toast.success(`Message marked as ${newStatus}`);
      fetchContacts();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // COPY EMAILS
  const handleCopyEmails = () => {
    const emails = Array.from(
      new Set(contacts.map((c) => c.email).filter(Boolean))
    );
    if (emails.length === 0) {
      toast.info("No email addresses available to copy.");
      return;
    }
    navigator.clipboard.writeText(emails.join(", "));
    toast.success(`Copied ${emails.length} contact emails to clipboard!`);
  };

  return (
    <div className="space-y-6 max-w-full">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="text-[#021C57]" /> Customer Messages & Contact Queries
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Total {stats.total} messages • {stats.unread} unread inquiries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-xl border border-gray-200 shadow-2xs text-xs sm:text-sm transition cursor-pointer"
            title="Copy all unique email addresses"
          >
            <Copy size={14} className="text-blue-600" /> Copy All Emails
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Messages</span>
            <span className="p-2 rounded-xl bg-blue-50 text-[#021C57]">
              <MessageSquare size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-[#021C57]">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Unread</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.unread}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Read / Reviewed</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Replied / Resolved</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.replied}</p>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, subject, or message..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500 font-medium"
          >
            <option value="all">All Status ({contacts.length})</option>
            <option value="unread">Unread ({stats.unread})</option>
            <option value="read">Read ({stats.read})</option>
            <option value="replied">Replied ({stats.replied})</option>
          </select>

          {/* Page Size */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none bg-gray-50 text-gray-700 cursor-pointer focus:border-blue-500"
            title="Items per page"
          >
            <option value={10}>10 / pg</option>
            <option value={15}>15 / pg</option>
            <option value={25}>25 / pg</option>
            <option value={50}>50 / pg</option>
          </select>
        </div>
      </div>

      {/* 4. LOADING & ERROR */}
      {loading && <SkeletonLoader />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* 5. EMPTY STATE */}
      {!loading && !error && filteredContacts.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-gray-100 text-center space-y-3">
          <Mail className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No contact messages found</h3>
          <p className="text-xs text-gray-400">
            {search || statusFilter !== "all"
              ? "Try adjusting your search query or status filter."
              : "No customer contact messages recorded yet."}
          </p>
        </div>
      )}

      {/* 6. TABLE */}
      {!loading && !error && filteredContacts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 text-[11px] sm:text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Customer Details</th>
                  <th className="py-3.5 px-4 font-bold">Subject & Message</th>
                  <th className="py-3.5 px-4 font-bold">Received Date</th>
                  <th className="py-3.5 px-3 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedContacts.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-gray-50/80 transition duration-150 ${
                      item.status === "unread" ? "bg-amber-50/20 font-semibold" : ""
                    }`}
                  >
                    {/* CUSTOMER */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 line-clamp-1">
                          {formatTitleCase(item.name || "Customer")}
                        </div>
                        <a
                          href={`mailto:${item.email}`}
                          className="text-xs text-blue-600 hover:underline block font-mono"
                        >
                          {item.email}
                        </a>
                      </div>
                    </td>

                    {/* SUBJECT & PREVIEW */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-xs sm:max-w-md space-y-0.5">
                        <div className="font-semibold text-gray-800 line-clamp-1 flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400 shrink-0" />
                          <span>{item.subject || "General Inquiry"}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {item.message || "—"}
                        </p>
                      </div>
                    </td>

                    {/* DATE */}
                    <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* STATUS SELECT */}
                    <td className="py-3.5 px-3 text-center">
                      <select
                        value={item.status}
                        disabled={updatingId === item._id}
                        onChange={(e) =>
                          handleStatusChange(item._id, e.target.value)
                        }
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition ${
                          item.status === "unread"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : item.status === "replied"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        {/* QUICK VIEW */}
                        <Tooltip text="View Full Message">
                          <button
                            onClick={() => setSelectedContact(item)}
                            className="p-2 text-[#021C57] hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                        </Tooltip>

                        {/* DIRECT REPLY VIA EMAIL */}
                        <Tooltip text="Reply via Email">
                          <a
                            href={`mailto:${item.email}?subject=${encodeURIComponent(
                              `Re: ${item.subject || "ARCL Inquiry"}`
                            )}`}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                          >
                            <Send size={14} />
                          </a>
                        </Tooltip>

                        {/* DELETE */}
                        <Tooltip text="Delete Message">
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === item._id ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-700">
                {Math.min(currentPage * itemsPerPage, filteredContacts.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {filteredContacts.length}
              </span>{" "}
              entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={13} />
              </button>

              <span className="px-3 py-1 font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
};

export default ContactPage;
