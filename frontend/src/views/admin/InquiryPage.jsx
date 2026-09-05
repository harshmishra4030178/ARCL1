"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Eye,
  Search,
  FileQuestion,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Package,
  Copy,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useInquiryStore } from "../../store/useInquiryStore.js";
import InquiryDetailsModal from "../../components/admin/inquiry/InquiryDetailsModal.jsx";
import InquiryAnalytics from "../../components/admin/inquiry/InquiryAnalytics.jsx";
import Tooltip from "../../components/admin/common/Tooltip.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import { toast } from "react-toastify";
import { formatTitleCase } from "../../utils/stringUtils.js";

const InquiryPage = () => {
  const {
    inquiries = [],
    loading,
    error,
    fetchInquiries,
    updateStatus,
    deleteInquiry,
  } = useInquiryStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

  // Stat counts
  const stats = useMemo(() => {
    return {
      total: inquiries.length,
      pending: inquiries.filter((i) => i.status === "pending").length,
      contacted: inquiries.filter((i) => i.status === "contacted").length,
      completed: inquiries.filter((i) => i.status === "completed").length,
    };
  }, [inquiries]);

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.customerName?.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage) || 1;
  const paginatedInquiries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInquiries.slice(start, start + itemsPerPage);
  }, [filteredInquiries, currentPage, itemsPerPage]);

  // UPDATE STATUS
  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await updateStatus(id, newStatus);
      toast.success(`Inquiry marked as ${newStatus}`);
      fetchInquiries();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product inquiry?")) return;

    try {
      setDeletingId(id);
      await deleteInquiry(id);
      toast.success("Product inquiry deleted successfully");
    } catch (err) {
      toast.error("Failed to delete inquiry");
    } finally {
      setDeletingId(null);
    }
  };

  // COPY EMAILS
  const handleCopyEmails = () => {
    const emails = Array.from(
      new Set(inquiries.map((i) => i.email).filter(Boolean))
    );
    if (emails.length === 0) {
      toast.info("No email addresses available to copy.");
      return;
    }
    navigator.clipboard.writeText(emails.join(", "));
    toast.success(`Copied ${emails.length} inquiry emails to clipboard!`);
  };

  return (
    <div className="space-y-6 max-w-full">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileQuestion className="text-[#021C57]" /> Product Quotes & Price Inquiries
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Total {stats.total} quote requests • {stats.pending} pending action
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAnalytics((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-xl border text-xs sm:text-sm transition cursor-pointer ${
              showAnalytics
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-2xs"
            }`}
            title="Toggle Analytics & Graphs"
          >
            <BarChart3 size={15} />
            <span>{showAnalytics ? "Hide Analytics" : "Show Analytics & Graphs"}</span>
            {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={handleCopyEmails}
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-xl border border-gray-200 shadow-2xs text-xs sm:text-sm transition cursor-pointer"
            title="Copy all customer emails"
          >
            <Copy size={14} className="text-blue-600" /> Copy Inquirer Emails
          </button>
        </div>
      </div>

      {/* 2. ANALYTICS & OVERALL GRAPH SECTION */}
      {showAnalytics && (
        <InquiryAnalytics
          inquiries={inquiries}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, phone, or email..."
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
            <option value="all">All Inquiries ({inquiries.length})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="contacted">Contacted ({stats.contacted})</option>
            <option value="completed">Completed ({stats.completed})</option>
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
      {!loading && !error && filteredInquiries.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-gray-100 text-center space-y-3">
          <FileQuestion className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No inquiries found</h3>
          <p className="text-xs text-gray-400">
            {search || statusFilter !== "all"
              ? "Try adjusting your search query or status filter."
              : "No product quote inquiries recorded yet."}
          </p>
        </div>
      )}

      {/* 6. RESPONSIVE TABLE */}
      {!loading && !error && filteredInquiries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 text-[11px] sm:text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Customer</th>
                  <th className="py-3.5 px-4 font-bold">Requested Instrument</th>
                  <th className="py-3.5 px-3 font-bold text-center">Quantity</th>
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-3 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedInquiries.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-gray-50/80 transition duration-150 ${
                      item.status === "pending" ? "bg-amber-50/20 font-semibold" : ""
                    }`}
                  >
                    {/* CUSTOMER */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 line-clamp-1">
                          {formatTitleCase(item.customerName || "Customer")}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 font-mono">
                          <a
                            href={`mailto:${item.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {item.email}
                          </a>
                          {item.phone && (
                            <>
                              <span>•</span>
                              <a
                                href={`tel:${item.phone}`}
                                className="text-gray-700 hover:text-blue-600 font-bold"
                              >
                                {item.phone}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* PRODUCT NAME & CATEGORY */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-xs sm:max-w-md space-y-0.5">
                        <div className="font-semibold text-gray-900 line-clamp-1 flex items-center gap-1.5">
                          <Package size={13} className="text-blue-600 shrink-0" />
                          <span>{formatTitleCase(item.productName || "Product")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isInquiryBasket || (item.items && item.items.length > 1) ? (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                              📋 Basket ({item.items?.length || 0} items)
                            </span>
                          ) : null}
                          {item.category && (
                            <span className="inline-block text-[11px] text-gray-500 font-medium">
                              Category: {formatTitleCase(item.category)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* QUANTITY */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md text-xs font-mono">
                        {item.totalItems || item.quantity || 1} {((item.totalItems || item.quantity || 1) > 1) ? "Units" : "Unit"}
                      </span>
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
                          item.status === "pending"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : item.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        {/* QUICK VIEW */}
                        <Tooltip text="View Details">
                          <button
                            onClick={() => setSelectedInquiry(item)}
                            className="p-2 text-[#021C57] hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                        </Tooltip>

                        {/* DIRECT WHATSAPP BUTTON (IF PHONE PROVIDED) */}
                        {item.phone && (
                          <Tooltip text="Chat on WhatsApp">
                            <a
                              href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                                item.customerName || "Customer"
                              )},%20thank%20you%20for%20your%20inquiry%20on%20${encodeURIComponent(
                                item.productName || "ARCL Instrument"
                              )}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                            >
                              <MessageCircle size={15} />
                            </a>
                          </Tooltip>
                        )}

                        {/* EMAIL REPLY */}
                        <Tooltip text="Send Email Quote">
                          <a
                            href={`mailto:${item.email}?subject=${encodeURIComponent(
                              `Official Quote: ${item.productName || "ARCL Instrument"}`
                            )}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          >
                            <Mail size={14} />
                          </a>
                        </Tooltip>

                        {/* DELETE */}
                        <Tooltip text="Delete Inquiry">
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
                {Math.min(currentPage * itemsPerPage, filteredInquiries.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {filteredInquiries.length}
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
      <InquiryDetailsModal
        inquiry={selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
      />
    </div>
  );
};

export default InquiryPage;
