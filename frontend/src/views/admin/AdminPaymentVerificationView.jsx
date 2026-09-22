"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaFilter,
  FaEye,
  FaCheck,
  FaTimes,
  FaSync,
  FaBuilding,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaQrcode,
  FaCopy,
  FaExclamationTriangle,
  FaShieldAlt,
  FaFileInvoiceDollar,
  FaExternalLinkAlt,
  FaHistory,
  FaMoneyBillWave,
  FaLock,
  FaPlus,
  FaDownload,
  FaCertificate,
  FaTrashAlt,
  FaTrash,
  FaEdit,
  FaFileExcel,
  FaPrint,
  FaShareAlt,
  FaPaperPlane,
  FaWhatsapp,
  FaLink,
  FaCheckSquare,
  FaSquare,
  FaReceipt,
  FaList,
  FaDatabase,
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../api/axios.js";
import {
  getAdminPendingPaymentsApi,
  verifyAdminPaymentApi,
  rejectAdminPaymentApi,
  recordManualAdminPaymentApi,
  deleteAdminPaymentApi,
  bulkDeleteAdminPaymentsApi,
  updateAdminPaymentDetailsApi,
  updateAdminPaymentStatusApi,
  sendAdminPaymentReceiptApi,
  syncAdminCalibrationPaymentsApi,
} from "../../api/calibrationPaymentApi.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { hasModuleAccess } from "../../utils/rbac.js";

export default function AdminPaymentVerificationView() {
  const { user } = useAuthStore();
  const canEdit = hasModuleAccess(user, "calibration", "edit");
  const canDelete = hasModuleAccess(user, "calibration", "delete");

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    underVerificationCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
    totalVerifiedAmount: 0,
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [lastSyncedTime, setLastSyncedTime] = useState("");

  // Multi-Select & Bulk Actions State
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);

  // Selected Payment & Review Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isScreenshotLightboxOpen, setIsScreenshotLightboxOpen] = useState(false);

  // Verification & Rejection Modal Action States
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isVerifyConfirmModalOpen, setIsVerifyConfirmModalOpen] = useState(false);

  // Edit Payment Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    paymentId: "",
    clientCompany: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    instrument: "",
    serialNo: "",
    finalPayableAmount: 2950,
    utr: "",
    paymentDate: "",
    paymentStatus: "UNDER_VERIFICATION",
    adminNotes: "",
    rejectionReason: "",
  });

  // Delete Confirmation Modal State (Single or Bulk)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null); // null means bulk delete of selectedPaymentIds

  // Send Receipt Modal State
  const [isSendReceiptModalOpen, setIsSendReceiptModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [receiptChannel, setReceiptChannel] = useState("both"); // 'email', 'whatsapp', 'both'
  const [receiptCustomEmail, setReceiptCustomEmail] = useState("");
  const [receiptCustomPhone, setReceiptCustomPhone] = useState("");
  const [receiptMessageNotes, setReceiptMessageNotes] = useState("");
  const [receiptSending, setReceiptSending] = useState(false);

  // Manual Payment Entry Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSerialNo, setManualSerialNo] = useState("");
  const [manualClientCompany, setManualClientCompany] = useState("");
  const [manualAmount, setManualAmount] = useState("1.18");
  const [manualUtr, setManualUtr] = useState("");
  const [manualPaymentDate, setManualPaymentDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [manualAdminNotes, setManualAdminNotes] = useState("Verified ₹1.18 in HDFC bank statement");
  const [manualStatus, setManualStatus] = useState("PAYMENT_VERIFIED");

  const [actionLoading, setActionLoading] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchPayments = async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!isSilent) setLoading(true);
      const res = await getAdminPendingPaymentsApi({
        status: statusFilter,
        search: searchTerm,
        page,
        limit: 50,
      });

      if (res.data?.data) {
        setPayments(res.data.data.payments || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
        setLastSyncedTime(new Date().toLocaleTimeString("en-IN"));
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      if (!isSilent) {
        toast.error(
          err.response?.data?.message || "Failed to load payment verification list."
        );
      }
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(false);

    // Live real-time polling (8s request-guarded)
    const interval = setInterval(() => {
      fetchPayments(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [statusFilter, searchTerm, page]);

  // Sync with Calibration DB Records
  const handleSyncCalibrationDb = async () => {
    try {
      setActionLoading(true);
      const res = await syncAdminCalibrationPaymentsApi();
      toast.success(
        res.data?.message || "Calibration records synchronized successfully!"
      );
      fetchPayments(false);
    } catch (err) {
      console.error("Sync error:", err);
      toast.error(
        err.response?.data?.message || "Failed to sync calibration records."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Copy UTR to clipboard
  const handleCopyUtr = (utrText) => {
    if (!utrText) return;
    navigator.clipboard.writeText(utrText);
    setCopiedUtr(true);
    toast.success("UTR copied to clipboard!");
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  // Copy Public Customer Payment URL
  const handleCopyPaymentLink = (p) => {
    const id = p.serialNo || p.calibrationRequestId || p._id;
    const url = `${window.location.origin}/calibration/payment/${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    toast.success("Public Customer Payment Link copied to clipboard!");
  };

  // ==========================================
  // SINGLE & BULK VERIFICATION / REJECTION
  // ==========================================

  const handleOpenReviewModal = (payment) => {
    setSelectedPayment(payment);
    setAdminNotes(payment.adminNotes || "");
    setRejectionReason(payment.rejectionReason || "");
    setIsReviewModalOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedPayment) return;

    try {
      setActionLoading(true);
      const res = await verifyAdminPaymentApi(selectedPayment._id, {
        adminNotes,
      });

      if (res.data?.success) {
        toast.success(
          `Payment for ${selectedPayment.clientCompany} verified successfully!`
        );
        setIsVerifyConfirmModalOpen(false);
        setIsReviewModalOpen(false);
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to verify payment.");
      }
    } catch (err) {
      console.error("Verify payment error:", err);
      toast.error(
        err.response?.data?.message || "Failed to verify payment in database."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickVerify = async (payment) => {
    if (!payment?._id) return;
    try {
      setActionLoading(true);
      setPayments((prev) =>
        prev.map((p) =>
          p._id === payment._id
            ? { ...p, paymentStatus: "PAYMENT_VERIFIED", verifiedAt: new Date() }
            : p
        )
      );
      const res = await verifyAdminPaymentApi(payment._id, {
        adminNotes: "1-Click Direct Bank Statement Verified by Admin",
      });

      if (res.data?.success) {
        toast.success(`Payment for ${payment.clientCompany} marked as Verified!`);
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to verify payment.");
        fetchPayments(true);
      }
    } catch (err) {
      console.error("Quick verify error:", err);
      toast.error(err.response?.data?.message || "Failed to verify payment.");
      fetchPayments(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStatusChange = async (paymentId, newStatus) => {
    try {
      setActionLoading(true);
      setPayments((prev) =>
        prev.map((p) =>
          p._id === paymentId
            ? { ...p, paymentStatus: newStatus }
            : p
        )
      );
      const res = await updateAdminPaymentStatusApi(paymentId, {
        status: newStatus,
        adminNotes: `Status changed to ${newStatus} from dashboard quick selector`,
      });
      if (res.data?.success) {
        toast.success(`Status updated to "${newStatus}"!`);
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to update status");
        fetchPayments(true);
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update payment status");
      fetchPayments(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedPayment) return;
    if (!rejectionReason || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason for the customer.");
      return;
    }

    try {
      setActionLoading(true);
      setPayments((prev) =>
        prev.map((p) =>
          p._id === selectedPayment._id
            ? { ...p, paymentStatus: "PAYMENT_REJECTED", rejectionReason: rejectionReason.trim() }
            : p
        )
      );
      const res = await rejectAdminPaymentApi(selectedPayment._id, {
        rejectionReason: rejectionReason.trim(),
        adminNotes,
      });

      if (res.data?.success) {
        toast.success("Payment rejected. Notification sent to customer.");
        setIsRejectModalOpen(false);
        setIsReviewModalOpen(false);
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to reject payment.");
        fetchPayments(true);
      }
    } catch (err) {
      console.error("Reject payment error:", err);
      toast.error(
        err.response?.data?.message || "Failed to record payment rejection."
      );
      fetchPayments(true);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // EDIT PAYMENT MODAL HANDLERS
  // ==========================================

  const handleOpenEditModal = (payment) => {
    setEditFormData({
      paymentId: payment._id,
      clientCompany: payment.clientCompany || "",
      clientName: payment.clientName || "",
      clientEmail: payment.clientEmail || "",
      clientPhone: payment.clientPhone || "",
      instrument: payment.instrument || "",
      serialNo: payment.serialNo || payment.calibrationRequestId || "",
      finalPayableAmount: payment.finalPayableAmount || 2950,
      utr: payment.utr || "",
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 16) : "",
      paymentStatus: payment.paymentStatus || "UNDER_VERIFICATION",
      adminNotes: payment.adminNotes || "",
      rejectionReason: payment.rejectionReason || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.clientCompany?.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setActionLoading(true);
      const res = await updateAdminPaymentDetailsApi(editFormData.paymentId, editFormData);
      if (res.data?.success) {
        toast.success("Payment details updated successfully! ✅");
        setIsEditModalOpen(false);
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to update payment details");
      }
    } catch (err) {
      console.error("Edit payment error:", err);
      toast.error(err.response?.data?.message || "Failed to update payment details");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DELETE & BULK DELETE HANDLERS
  // ==========================================

  const handleOpenSingleDelete = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const handleOpenBulkDelete = () => {
    if (selectedPaymentIds.length === 0) {
      toast.warning("Please select at least one payment to delete");
      return;
    }
    setPaymentToDelete(null); // Bulk mode
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      if (paymentToDelete) {
        // Single Delete
        const res = await deleteAdminPaymentApi(paymentToDelete._id);
        if (res.data?.success) {
          toast.success(`Payment record for "${paymentToDelete.clientCompany}" deleted successfully!`);
          setIsDeleteModalOpen(false);
          setPaymentToDelete(null);
          setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentToDelete._id));
          fetchPayments(true);
        } else {
          toast.error(res.data?.message || "Failed to delete payment");
        }
      } else {
        // Bulk Delete
        const res = await bulkDeleteAdminPaymentsApi(selectedPaymentIds);
        if (res.data?.success) {
          toast.success(res.data.message || `Deleted ${selectedPaymentIds.length} payment records!`);
          setIsDeleteModalOpen(false);
          setSelectedPaymentIds([]);
          fetchPayments(true);
        } else {
          toast.error(res.data?.message || "Failed to bulk delete payments");
        }
      }
    } catch (err) {
      console.error("Delete payment error:", err);
      toast.error(err.response?.data?.message || "Failed to delete payment record(s)");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // BULK VERIFY ACTION
  // ==========================================

  const handleBulkVerifySelected = async () => {
    if (selectedPaymentIds.length === 0) {
      toast.warning("Please select at least one payment to verify");
      return;
    }

    try {
      setActionLoading(true);
      let successCount = 0;
      for (const id of selectedPaymentIds) {
        try {
          await verifyAdminPaymentApi(id, {
            adminNotes: "Bulk verified by Admin from Dashboard",
          });
          successCount++;
        } catch (e) {
          console.warn(`Failed to verify ${id}:`, e);
        }
      }
      toast.success(`Successfully verified ${successCount} payment(s)! ✅`);
      setSelectedPaymentIds([]);
      fetchPayments(true);
    } catch (err) {
      toast.error("Failed to execute bulk verification");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // SEND RECEIPT / SHARE HANDLERS
  // ==========================================

  const handleOpenSendReceiptModal = (payment) => {
    setReceiptPayment(payment);
    setReceiptCustomEmail(payment.clientEmail || "");
    setReceiptCustomPhone(payment.clientPhone || "");
    setReceiptMessageNotes(payment.adminNotes || "Thank you for your payment to ARCL Instruments.");
    setIsSendReceiptModalOpen(true);
  };

  const handleSendReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptPayment) return;

    try {
      setReceiptSending(true);
      const res = await sendAdminPaymentReceiptApi(receiptPayment._id, {
        channel: receiptChannel,
        customEmail: receiptCustomEmail.trim(),
        customPhone: receiptCustomPhone.trim(),
        messageNotes: receiptMessageNotes.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Payment receipt sent successfully!");
        if (receiptChannel === "whatsapp" || receiptChannel === "both") {
          if (res.data.data?.whatsappUrl) {
            window.open(res.data.data.whatsappUrl, "_blank");
          }
        }
        setIsSendReceiptModalOpen(false);
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to send receipt");
      }
    } catch (err) {
      console.error("Send receipt error:", err);
      toast.error(err.response?.data?.message || "Failed to dispatch payment receipt");
    } finally {
      setReceiptSending(false);
    }
  };

  // ==========================================
  // MANUAL RECORD SUBMISSION
  // ==========================================

  const handleManualRecordSubmit = async (e) => {
    e.preventDefault();
    if (!manualUtr || manualUtr.trim().length < 4) {
      toast.error("Please enter a valid 12-digit UTR / Bank Reference Number.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await recordManualAdminPaymentApi({
        serialNo: manualSerialNo.trim(),
        clientCompany: manualClientCompany.trim() || "Direct UPI Client",
        amount: Number(manualAmount) || 1.18,
        utr: manualUtr.trim().toUpperCase(),
        paymentDate: manualPaymentDate,
        adminNotes: manualAdminNotes.trim(),
        status: manualStatus,
      });

      if (res.data?.success) {
        toast.success(`Direct bank transaction (UTR: ${manualUtr.trim().toUpperCase()}) logged successfully!`);
        setIsManualModalOpen(false);
        setManualUtr("");
        setManualSerialNo("");
        setManualClientCompany("");
        fetchPayments(true);
      } else {
        toast.error(res.data?.message || "Failed to record transaction.");
      }
    } catch (err) {
      console.error("Manual record error:", err);
      toast.error(err.response?.data?.message || "Failed to record manual bank transaction.");
    } finally {
      setActionLoading(false);
    }
  };

  // PDF Document Download Trigger
  const handleDownloadPdf = (docType, serialNo) => {
    const sNo = serialNo || "ARCL-CTM-9842";
    const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
    window.open(
      `${base}/client/calibration/download-document?docType=${encodeURIComponent(docType)}&download=true&serialNo=${encodeURIComponent(sNo)}&t=${Date.now()}`,
      "_blank"
    );
  };

  // Export to CSV / Excel
  const handleExportCsv = () => {
    if (!displayedPayments || displayedPayments.length === 0) {
      toast.warning("No payment records to export");
      return;
    }

    const headers = [
      "Request_ID",
      "Serial_No",
      "Client_Company",
      "Contact_Person",
      "Email",
      "Phone",
      "Instrument",
      "Payable_Amount",
      "Base_Charges",
      "GST_Amount",
      "UTR_Reference",
      "Payment_Status",
      "Payment_Date",
      "Verified_By",
      "Admin_Notes",
    ];

    const rows = displayedPayments.map((p) => [
      `"${p.calibrationRequestId || ""}"`,
      `"${p.serialNo || ""}"`,
      `"${(p.clientCompany || "").replace(/"/g, '""')}"`,
      `"${(p.clientName || "").replace(/"/g, '""')}"`,
      `"${p.clientEmail || ""}"`,
      `"${p.clientPhone || ""}"`,
      `"${(p.instrument || "").replace(/"/g, '""')}"`,
      p.finalPayableAmount || 0,
      p.calibrationCharges || 0,
      p.gstAmount || 0,
      `"${p.utr || ""}"`,
      `"${p.paymentStatus || ""}"`,
      `"${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : ""}"`,
      `"${p.verifiedByAdminName || ""}"`,
      `"${(p.adminNotes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARCL_Payment_Verifications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payment records exported to CSV successfully! 📊");
  };

  // Print Payment Statement
  const handlePrintLedger = () => {
    window.print();
  };

  // Instant In-Memory Dynamic Search Filter
  const displayedPayments = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return payments;
    const q = searchTerm.trim().toLowerCase();
    return payments.filter((p) => {
      const sNo = String(p.serialNo || p.calibrationRequestId || "").toLowerCase();
      const comp = String(p.clientCompany || "").toLowerCase();
      const name = String(p.clientName || "").toLowerCase();
      const utrStr = String(p.utr || "").toLowerCase();
      const inst = String(p.instrument || "").toLowerCase();
      const amt = String(p.finalPayableAmount || "");
      return (
        sNo.includes(q) ||
        comp.includes(q) ||
        name.includes(q) ||
        utrStr.includes(q) ||
        inst.includes(q) ||
        amt.includes(q)
      );
    });
  }, [payments, searchTerm]);

  // Selection Checkbox Toggles
  const handleToggleSelectAll = () => {
    if (selectedPaymentIds.length === displayedPayments.length && displayedPayments.length > 0) {
      setSelectedPaymentIds([]);
    } else {
      setSelectedPaymentIds(displayedPayments.map((p) => p._id));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedPaymentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    displayedPayments.length > 0 && selectedPaymentIds.length === displayedPayments.length;

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 font-sans">

      {/* Top Page Navigation Switcher (Calibration vs Payment Verification) */}
      <div className="flex border-b border-slate-800 gap-2 pb-1 text-sm font-semibold overflow-x-auto print:hidden">
        <a
          href="/admin/calibration"
          className="px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer"
        >
          <FaCertificate className="text-blue-400" />
          <span>1. Calibration Records Portal</span>
        </a>
        <a
          href="/admin/calibration/payments"
          className="px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold shadow-md cursor-pointer"
        >
          <FaMoneyBillWave className="text-emerald-300 animate-pulse" />
          <span>2. Live Payment Verifications</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono font-black">
            ACTIVE PORTAL
          </span>
        </a>
      </div>

      {/* Header Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xl font-bold">
              <FaShieldAlt />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                UPI &amp; Bank Payment Verifications
                {stats.underVerificationCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    {stats.underVerificationCount} Pending
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  Manual Bank Statement Audit, Dynamic Status Changer &amp; Customer Receipts
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync (8s) {lastSyncedTime ? `• ${lastSyncedTime}` : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Export payment records to CSV / Excel"
          >
            <FaFileExcel className="text-emerald-400" /> Export CSV
          </button>

          <button
            type="button"
            onClick={handlePrintLedger}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Print printable statement"
          >
            <FaPrint className="text-blue-400" /> Print
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={handleSyncCalibrationDb}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 text-xs font-bold rounded-xl border border-indigo-700/60 transition flex items-center gap-1.5 cursor-pointer"
              title="Synchronize all calibration certificate & quotation records into payments ledger"
            >
              <FaDatabase className={actionLoading ? "animate-spin text-indigo-400" : "text-indigo-400"} /> Sync DB Records
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FaPlus /> + Log Direct Bank Payment
          </button>

          <button
            type="button"
            onClick={() => fetchPayments(false)}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh payment records"
          >
            <FaSync className={loading ? "animate-spin text-blue-400" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        
        {/* Card 1: Pending Verification */}
        <div
          onClick={() => setStatusFilter("UNDER_VERIFICATION")}
          className={`p-5 rounded-2xl border shadow-xl cursor-pointer transition-all ${
            statusFilter === "UNDER_VERIFICATION"
              ? "bg-amber-500/10 border-amber-500/50 shadow-amber-500/10"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm">
              <FaClock />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {stats.underVerificationCount}
            </span>
            <span className="text-[11px] text-amber-400/80">Requires Bank Check</span>
          </div>
        </div>

        {/* Card 2: Total Verified */}
        <div
          onClick={() => setStatusFilter("PAYMENT_VERIFIED")}
          className={`p-5 rounded-2xl border shadow-xl cursor-pointer transition-all ${
            statusFilter === "PAYMENT_VERIFIED"
              ? "bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/10"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Verified Payments
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">
              <FaCheckCircle />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-300 font-mono">
              {stats.verifiedCount}
            </span>
            <span className="text-[11px] text-emerald-400/80 font-mono font-bold">
              ₹{stats.totalVerifiedAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Card 3: Rejected Payments */}
        <div
          onClick={() => setStatusFilter("PAYMENT_REJECTED")}
          className={`p-5 rounded-2xl border shadow-xl cursor-pointer transition-all ${
            statusFilter === "PAYMENT_REJECTED"
              ? "bg-red-500/10 border-red-500/50 shadow-red-500/10"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Rejected Payments
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center text-sm">
              <FaTimesCircle />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-300 font-mono">
              {stats.rejectedCount}
            </span>
            <span className="text-[11px] text-red-400/80">UTR / Ref Mismatch</span>
          </div>
        </div>

        {/* Card 4: All Payments */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`p-5 rounded-2xl border shadow-xl cursor-pointer transition-all ${
            statusFilter === "all"
              ? "bg-blue-500/10 border-blue-500/50 shadow-blue-500/10"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Total Recorded Payments
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-sm">
              <FaMoneyBillWave />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-300 font-mono">
              {stats.totalCount}
            </span>
            <span className="text-[11px] text-slate-400">All Statuses</span>
          </div>
        </div>

      </div>

      {/* Controls Bar: Search, Filters, and Bulk Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Payments", badge: stats.totalCount },
              { id: "UNDER_VERIFICATION", label: "Pending Verification", badge: stats.underVerificationCount },
              { id: "PAYMENT_VERIFIED", label: "Verified", badge: stats.verifiedCount },
              { id: "PENDING_PAYMENT", label: "Pending Submission", badge: stats.pendingCount },
              { id: "PAYMENT_REJECTED", label: "Rejected", badge: stats.rejectedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  statusFilter === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-3 text-slate-500 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search UTR, S/N, Company, Amount..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Dynamic Bulk Actions Toolbar (Appears when items are selected) */}
        {selectedPaymentIds.length > 0 && (
          <div className="p-3 bg-blue-950/70 border border-blue-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono text-[11px]">
                {selectedPaymentIds.length}
              </span>
              <span>Payment Record{selectedPaymentIds.length > 1 ? "s" : ""} Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleBulkVerifySelected}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaCheckCircle /> Bulk Verify ({selectedPaymentIds.length})
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={handleOpenBulkDelete}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTrashAlt /> Bulk Delete ({selectedPaymentIds.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedPaymentIds([])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="p-4">Request / Instrument</th>
                <th className="p-4">Customer / Company</th>
                <th className="p-4">Payable Amount</th>
                <th className="p-4">UTR Number &amp; Date</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <FaSync className="animate-spin text-2xl mx-auto mb-2 text-blue-500" />
                    Loading payment verification records...
                  </td>
                </tr>
              ) : displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No payment verification records found for the selected filter.
                  </td>
                </tr>
              ) : (
                displayedPayments.map((p) => {
                  const isExpanded = expandedPaymentId === p._id;
                  const isSelected = selectedPaymentIds.includes(p._id);
                  const isPending =
                    p.paymentStatus === "UNDER_VERIFICATION" ||
                    p.paymentStatus === "PAYMENT_SUBMITTED" ||
                    p.paymentStatus === "PENDING_PAYMENT";

                  return (
                    <React.Fragment key={p._id}>
                      <tr
                        className={`hover:bg-slate-800/50 transition ${
                          isSelected ? "bg-blue-950/40" : isExpanded ? "bg-slate-800/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(p._id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Request / Instrument */}
                        <td className="p-4">
                          <div className="font-bold text-white font-mono text-xs flex items-center gap-1.5">
                            <span>{p.calibrationRequestId || p.serialNo}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPaymentLink(p)}
                              className="text-slate-500 hover:text-blue-400 transition"
                              title="Copy Customer Payment Link"
                            >
                              <FaLink className="text-[10px]" />
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {p.instrument}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{p.clientCompany}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{p.clientName || "Customer"}</span>
                            {p.clientPhone && <span>• {p.clientPhone}</span>}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="p-4 font-mono">
                          <div className="font-bold text-emerald-400 text-sm">
                            ₹{p.finalPayableAmount?.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Base ₹{p.calibrationCharges} + GST ₹{p.gstAmount || 0}
                          </div>
                        </td>

                        {/* UTR & Date */}
                        <td className="p-4">
                          {p.utr ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[11px]">
                                {p.utr}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUtr(p.utr)}
                                className="text-slate-500 hover:text-white text-[10px]"
                                title="Copy UTR"
                              >
                                <FaCopy />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Not submitted</span>
                          )}
                          <div className="text-[10px] text-slate-500 mt-1">
                            {p.paymentDate
                              ? new Date(p.paymentDate).toLocaleString("en-IN")
                              : new Date(p.createdAt).toLocaleString("en-IN")}
                          </div>
                        </td>

                        {/* Status with Quick Status Changer */}
                        <td className="p-4">
                          <div className="space-y-1.5">
                            {p.paymentStatus === "UNDER_VERIFICATION" || p.paymentStatus === "PAYMENT_SUBMITTED" ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
                                <FaClock className="animate-spin text-[10px]" /> Under Verification
                              </span>
                            ) : p.paymentStatus === "PAYMENT_VERIFIED" ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                                <FaCheckCircle className="text-[10px]" /> Verified
                              </span>
                            ) : p.paymentStatus === "PAYMENT_REJECTED" ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 w-fit">
                                <FaTimesCircle className="text-[10px]" /> Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-fit">
                                Pending Submission
                              </span>
                            )}

                            {/* Quick Status Switcher Dropdown */}
                            {canEdit && (
                              <select
                                value={p.paymentStatus}
                                onChange={(e) => handleQuickStatusChange(p._id, e.target.value)}
                                className="block text-[10px] bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                <option value="UNDER_VERIFICATION">⏳ Under Verification</option>
                                <option value="PAYMENT_VERIFIED">✅ Verified</option>
                                <option value="PENDING_PAYMENT">🕒 Pending Submission</option>
                                <option value="PAYMENT_REJECTED">❌ Rejected</option>
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Actions Toolbar */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 1-Click Direct Verify */}
                            {isPending && canEdit && (
                              <button
                                type="button"
                                onClick={() => handleQuickVerify(p)}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                title="1-Click Direct Verification"
                              >
                                <FaCheckCircle /> Verify
                              </button>
                            )}

                            {/* Edit Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs transition cursor-pointer"
                                title="Edit payment details"
                              >
                                <FaEdit />
                              </button>
                            )}

                            {/* Send Receipt Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenSendReceiptModal(p)}
                              className="p-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg text-xs transition cursor-pointer"
                              title="Send Payment Receipt (Mail / WhatsApp)"
                            >
                              <FaPaperPlane />
                            </button>

                            {/* Review Modal */}
                            <button
                              type="button"
                              onClick={() => handleOpenReviewModal(p)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition cursor-pointer"
                              title="Review payment submission"
                            >
                              <FaEye />
                            </button>

                            {/* History Toggle */}
                            <button
                              type="button"
                              onClick={() => setExpandedPaymentId(isExpanded ? null : p._id)}
                              className={`p-1.5 rounded-lg text-xs border transition cursor-pointer ${
                                isExpanded
                                  ? "bg-slate-700 text-white border-slate-600"
                                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                              }`}
                              title="Toggle Audit Trail Timeline"
                            >
                              <FaHistory />
                            </button>

                            {/* Delete Button */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleOpenSingleDelete(p)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-lg text-xs transition cursor-pointer"
                                title="Delete payment record"
                              >
                                <FaTrashAlt />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>

                      {/* Expandable History & Audit Trail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-b border-slate-800">
                          <td colSpan={7} className="p-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-inner">
                              
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                  <FaHistory className="text-blue-400 text-sm" />
                                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                                    Payment Audit Log &amp; Official Documents
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf("tax_invoice", p.serialNo || p.calibrationRequestId)}
                                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  >
                                    <FaFileInvoiceDollar /> Tax Invoice PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf("certificate", p.serialNo || p.calibrationRequestId)}
                                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  >
                                    <FaShieldAlt /> Certificate PDF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPdf("srf", p.serialNo || p.calibrationRequestId)}
                                    className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                                  >
                                    <FaCertificate /> SRF Slip
                                  </button>
                                  <a
                                    href={`/calibration/payment/${encodeURIComponent(p.serialNo || p.calibrationRequestId)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                                  >
                                    <FaExternalLinkAlt /> Customer Payment Portal
                                  </a>
                                </div>
                              </div>

                              {/* Timeline Log List */}
                              {p.auditLog && p.auditLog.length > 0 ? (
                                <div className="space-y-2">
                                  {p.auditLog.map((log, idx) => (
                                    <div
                                      key={idx}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs gap-1"
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <div>
                                          <span className="font-bold text-blue-400 mr-2">
                                            {log.performedBy || "System"}:
                                          </span>
                                          <span className="text-slate-200">{log.details}</span>
                                        </div>
                                      </div>
                                      <span className="text-[11px] text-slate-500 font-mono shrink-0">
                                        {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "N/A"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 italic">
                                  No additional history events recorded yet.
                                </div>
                              )}

                              {/* Quick Meta Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-[11px]">
                                <div>
                                  <span className="text-slate-500 block">Customer Notes:</span>
                                  <span className="text-slate-300">{p.customerNotes || "None provided"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Admin Internal Notes:</span>
                                  <span className="text-slate-300">{p.adminNotes || "None recorded"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Rejection Reason:</span>
                                  <span className="text-red-400">{p.rejectionReason || "N/A"}</span>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: EDIT PAYMENT DETAILS MODAL */}
      {/* ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">
                  <FaEdit />
                </div>
                <h3 className="text-base font-bold text-white">Edit Payment Verification Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Customer / Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.clientCompany}
                    onChange={(e) => setEditFormData({ ...editFormData, clientCompany: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.clientName}
                    onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.clientEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Client Mobile / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editFormData.clientPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Instrument / Equipment Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.instrument}
                    onChange={(e) => setEditFormData({ ...editFormData, instrument: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Serial No. / Tag ID
                  </label>
                  <input
                    type="text"
                    value={editFormData.serialNo}
                    onChange={(e) => setEditFormData({ ...editFormData, serialNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Total Amount (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.finalPayableAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, finalPayableAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Verification Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editFormData.paymentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="UNDER_VERIFICATION">⏳ UNDER_VERIFICATION</option>
                    <option value="PAYMENT_VERIFIED">✅ PAYMENT_VERIFIED</option>
                    <option value="PENDING_PAYMENT">🕒 PENDING_PAYMENT</option>
                    <option value="PAYMENT_REJECTED">❌ PAYMENT_REJECTED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    UTR / Bank Reference No.
                  </label>
                  <input
                    type="text"
                    value={editFormData.utr}
                    onChange={(e) => setEditFormData({ ...editFormData, utr: e.target.value.toUpperCase() })}
                    placeholder="e.g. 426819034512"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Payment Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.paymentDate}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Admin Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={editFormData.adminNotes}
                  onChange={(e) => setEditFormData({ ...editFormData, adminNotes: e.target.value })}
                  placeholder="Notes regarding bank statement match, cheque clearance, etc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <FaSync className="animate-spin" /> : <FaCheck />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mx-auto">
              <FaTrashAlt />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {paymentToDelete ? "Delete Payment Record" : `Delete ${selectedPaymentIds.length} Payment Records`}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {paymentToDelete ? (
                  <>
                    Are you sure you want to permanently delete the payment entry for{" "}
                    <strong className="text-white">{paymentToDelete.clientCompany}</strong> (Amount: ₹{paymentToDelete.finalPayableAmount})?
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete all{" "}
                    <strong className="text-white">{selectedPaymentIds.length}</strong> selected payment records?
                  </>
                )}
              </p>
              <p className="text-[11px] text-red-400 font-semibold mt-2">
                ⚠️ This action cannot be undone. Associated calibration commercial payment status will be reset.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <FaSync className="animate-spin" /> : <FaTrashAlt />} Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: SEND OFFICIAL PAYMENT RECEIPT MODAL */}
      {/* ========================================== */}
      {isSendReceiptModalOpen && receiptPayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                  <FaReceipt />
                </div>
                <h3 className="text-base font-bold text-white">Dispatch Official Payment Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSendReceiptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSendReceiptSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client:</span>
                  <span className="font-bold text-white">{receiptPayment.clientCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Instrument:</span>
                  <span className="text-slate-200">{receiptPayment.instrument} ({receiptPayment.serialNo})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid Amount:</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{receiptPayment.finalPayableAmount?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UTR / Ref:</span>
                  <span className="font-mono text-blue-400 font-bold">{receiptPayment.utr || "Verified"}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recipient Email (SMTP Dispatch)
                </label>
                <input
                  type="email"
                  value={receiptCustomEmail}
                  onChange={(e) => setReceiptCustomEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recipient Mobile / WhatsApp No.
                </label>
                <input
                  type="tel"
                  value={receiptCustomPhone}
                  onChange={(e) => setReceiptCustomPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Receipt Note / Thank You Note
                </label>
                <textarea
                  rows={2}
                  value={receiptMessageNotes}
                  onChange={(e) => setReceiptMessageNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Send via Channel:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptChannel("email")}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      receiptChannel === "email"
                        ? "bg-blue-600 text-white border-blue-500 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    <FaEnvelope /> Email Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptChannel("whatsapp")}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      receiptChannel === "whatsapp"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    <FaWhatsapp /> WhatsApp Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptChannel("both")}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      receiptChannel === "both"
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white border-transparent shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    <FaPaperPlane /> Both (Email + WA)
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSendReceiptModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiptSending}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {receiptSending ? <FaSync className="animate-spin" /> : <FaPaperPlane />} Send Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: REVIEW & VERIFICATION MODAL */}
      {/* ========================================== */}
      {isReviewModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaShieldAlt className="text-blue-400" /> Review Payment Verification
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Request ID: <strong className="text-white font-mono">{selectedPayment.calibrationRequestId}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf("tax_invoice", selectedPayment.serialNo || selectedPayment.calibrationRequestId)}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FaFileInvoiceDollar /> Tax Invoice PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf("certificate", selectedPayment.serialNo || selectedPayment.calibrationRequestId)}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FaShieldAlt /> Certificate PDF
                </button>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Grid Layout: Request Info & Bank Match */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Customer &amp; Instrument
                </span>
                <div className="text-sm font-bold text-white">{selectedPayment.clientCompany}</div>
                <div className="text-slate-300">Contact: {selectedPayment.clientName || "N/A"}</div>
                <div className="text-slate-300">Email: {selectedPayment.clientEmail || "N/A"}</div>
                <div className="text-slate-400 font-mono pt-1">
                  Instrument: {selectedPayment.instrument} (S/N: {selectedPayment.serialNo})
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Server Computed Billing
                </span>
                <div className="flex justify-between text-slate-400">
                  <span>Calibration Fee Base:</span>
                  <span className="font-mono text-slate-200">₹{selectedPayment.calibrationCharges}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({selectedPayment.gstRate}%):</span>
                  <span className="font-mono text-slate-200">₹{selectedPayment.gstAmount}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1 text-sm">
                  <span>Total Payable:</span>
                  <span className="font-mono text-emerald-400">₹{selectedPayment.finalPayableAmount?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* UTR & Screenshot Verification Box */}
            <div className="bg-slate-950 p-5 rounded-2xl border-2 border-blue-500/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Submitted UTR &amp; Bank Reference
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-500/40">
                    {selectedPayment.utr || "No UTR Submitted"}
                  </span>
                  {selectedPayment.utr && (
                    <button
                      type="button"
                      onClick={() => handleCopyUtr(selectedPayment.utr)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUtr ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                      <span>{copiedUtr ? "Copied" : "Copy UTR"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Screenshot Display */}
              {selectedPayment.paymentScreenshotUrl ? (
                <div className="space-y-2 text-center">
                  <span className="text-xs text-slate-400 block">Uploaded Payment Receipt / Screenshot</span>
                  <div className="inline-block relative group rounded-xl border border-slate-800 overflow-hidden max-h-56 bg-slate-900">
                    <img
                      src={selectedPayment.paymentScreenshotUrl}
                      alt="Payment Screenshot"
                      className="max-h-56 mx-auto object-contain cursor-pointer hover:scale-105 transition"
                      onClick={() => setIsScreenshotLightboxOpen(true)}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsScreenshotLightboxOpen(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline cursor-pointer"
                    >
                      View Fullsize Lightbox / Zoom
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic text-center py-4">
                  No payment screenshot image attached. Please verify using UTR in bank statement.
                </div>
              )}
            </div>

            {/* Audit Trail Timeline */}
            {selectedPayment.auditLog && selectedPayment.auditLog.length > 0 && (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaHistory /> Audit &amp; Verification Log History
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedPayment.auditLog.map((log, index) => (
                    <div key={index} className="flex justify-between items-start text-[11px] border-b border-slate-800/60 pb-1">
                      <span className="text-slate-300">
                        <strong className="text-blue-400">{log.performedBy}:</strong> {log.details}
                      </span>
                      <span className="text-slate-500 font-mono shrink-0 ml-2">
                        {new Date(log.timestamp).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Action Notes Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Notes (Internal / Audit Memo)
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified transaction in HDFC Bank statement on 21 Sep 2026."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Review
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={!canEdit || selectedPayment.paymentStatus === "PAYMENT_REJECTED"}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FaTimesCircle /> Reject Payment
                </button>

                <button
                  type="button"
                  onClick={() => setIsVerifyConfirmModalOpen(true)}
                  disabled={!canEdit || selectedPayment.paymentStatus === "PAYMENT_VERIFIED"}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FaCheckCircle /> Verify Payment
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5: MANUAL PAYMENT ENTRY MODAL */}
      {/* ========================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                  <FaMoneyBillWave />
                </div>
                <h3 className="text-base font-bold text-white">Log Bank / Direct UPI Payment</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleManualRecordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Serial Number / Request ID (Optional)
                </label>
                <input
                  type="text"
                  value={manualSerialNo}
                  onChange={(e) => setManualSerialNo(e.target.value)}
                  placeholder="e.g. ARCL-CTM-9842"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Customer / Company Name
                </label>
                <input
                  type="text"
                  value={manualClientCompany}
                  onChange={(e) => setManualClientCompany(e.target.value)}
                  placeholder="e.g. Direct UPI Client / Tata Projects"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Amount Received (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="e.g. 1.18"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="PAYMENT_VERIFIED">PAYMENT VERIFIED (Confirm)</option>
                    <option value="UNDER_VERIFICATION">UNDER VERIFICATION</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  12-Digit UTR / Transaction Ref No. <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualUtr}
                  onChange={(e) => setManualUtr(e.target.value.toUpperCase())}
                  placeholder="e.g. 426819034512"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Payment Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={manualPaymentDate}
                  onChange={(e) => setManualPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Admin Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={manualAdminNotes}
                  onChange={(e) => setManualAdminNotes(e.target.value)}
                  placeholder="e.g. Verified in HDFC bank statement direct UPI credit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <FaSync className="animate-spin" /> : <FaCheck />} Save &amp; Verify Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Screenshot Modal */}
      {isScreenshotLightboxOpen && selectedPayment?.paymentScreenshotUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden flex flex-col items-center justify-center">
            <button
              onClick={() => setIsScreenshotLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 cursor-pointer z-10"
            >
              <FaTimes />
            </button>
            <img
              src={selectedPayment.paymentScreenshotUrl}
              alt="Payment Screenshot Lightbox"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Verify Confirmation Modal */}
      {isVerifyConfirmModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
              <FaCheckCircle />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Confirm Payment Verification</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to mark payment for <strong>{selectedPayment.clientCompany}</strong> (UTR: <span className="font-mono text-blue-400">{selectedPayment.utr}</span>) as <strong>VERIFIED</strong>?
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold mt-2">
                This will update the calibration record payment status to &quot;Paid&quot; and notify the client.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsVerifyConfirmModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <FaSync className="animate-spin" /> : <FaCheck />} Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mx-auto">
              <FaExclamationTriangle />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Reject Payment Verification</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please provide the reason for rejecting UTR <span className="font-mono text-white">{selectedPayment.utr}</span>. This reason will be emailed to the client.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mandatory Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR number not found in bank statement for 21 Sep 2026. Please re-check UTR."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <FaSync className="animate-spin" /> : <FaTimes />} Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
