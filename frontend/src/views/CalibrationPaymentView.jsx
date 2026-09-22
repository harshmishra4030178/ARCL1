"use client";

import React, { useState, useEffect } from "react";
import {
  FaQrcode,
  FaCopy,
  FaCheck,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaUpload,
  FaFileInvoiceDollar,
  FaSync,
  FaArrowLeft,
  FaInfoCircle,
  FaDownload,
  FaLock,
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../api/axios.js";
import {
  getCalibrationPaymentDetailsApi,
  submitCalibrationPaymentApi,
} from "../api/calibrationPaymentApi.js";

export default function CalibrationPaymentView({ recordId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  // Form State
  const [utr, setUtr] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [customerNotes, setCustomerNotes] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Copy state feedback
  const [copiedField, setCopiedField] = useState("");

  const fetchPaymentDetails = async (isSilent = false) => {
    if (!recordId) {
      setError("No Calibration Request ID provided.");
      if (!isSilent) setLoading(false);
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      setError("");
      const res = await getCalibrationPaymentDetailsApi(recordId);
      if (res.data?.data) {
        setData(res.data.data);
        if (res.data.data.payment?.utr && !utr) {
          setUtr(res.data.data.payment.utr);
        }
        if (res.data.data.payment?.customerNotes && !customerNotes) {
          setCustomerNotes(res.data.data.payment.customerNotes);
        }
        if (res.data.data.payment?.paymentScreenshotUrl && !screenshotPreview) {
          setScreenshotPreview(res.data.data.payment.paymentScreenshotUrl);
        }
      } else {
        if (!isSilent) setError("Could not load calibration payment details.");
      }
    } catch (err) {
      console.error("Payment details error:", err);
      if (!isSilent) {
        setError(
          err.response?.data?.message ||
            "Calibration request not found or server unreachable."
        );
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails(false);

    // 5-second live polling to automatically sync payment status
    const interval = setInterval(() => {
      fetchPaymentDetails(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [recordId]);

  const handleDownloadPdf = (docType = "tax_invoice") => {
    const sNo = data?.calibrationRecord?.serialNo || data?.payment?.serialNo || recordId || "ARCL-CTM-9842";
    const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
    window.open(
      `${base}/client/calibration/download-document?docType=${encodeURIComponent(docType)}&download=true&serialNo=${encodeURIComponent(sNo)}&t=${Date.now()}`,
      "_blank"
    );
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!utr || utr.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UTR / UPI Transaction Reference Number.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("utr", utr.trim().toUpperCase());
      formData.append("paymentDate", paymentDate);
      formData.append("customerNotes", customerNotes.trim());
      if (screenshotFile) {
        formData.append("paymentScreenshot", screenshotFile);
      }

      const res = await submitCalibrationPaymentApi(
        data?.payment?._id || data?.calibrationRecord?.id || recordId,
        formData
      );

      if (res.data?.success) {
        toast.success(
          "Payment submitted successfully! Status updated to UNDER VERIFICATION."
        );
        fetchPaymentDetails();
      } else {
        toast.error(res.data?.message || "Failed to submit payment details.");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to submit payment details. Please check your UTR number."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const paymentStatus = data?.payment?.paymentStatus || "PENDING_PAYMENT";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <FaSync className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">
          Loading secure ₹0-Cost UPI payment gateway details...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-2xl">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load Payment Page</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { calibrationRecord, billing, upi, bankDetails, payment } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-2xl font-bold">
              <FaShieldAlt />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  ARCL Instruments Calibration Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ₹0-Fee Direct UPI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Secure NABL-Traceable Calibration Payment & Accounts Verification System
              </p>
            </div>
          </div>

          <a
            href="/calibration-services"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <FaArrowLeft /> Back to Calibration Portal
          </a>
        </div>

        {/* Real-Time Payment Status Alert Banners */}
        {paymentStatus === "UNDER_VERIFICATION" && (
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 shadow-lg flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
              <FaClock className="animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-300">
                Payment Status: UNDER VERIFICATION
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Your payment reference (UTR:{" "}
                <strong className="font-mono text-amber-200">{payment?.utr}</strong>)
                has been submitted successfully. The ARCL Accounts Team is manually verifying your transaction against our bank statement.
              </p>
              <div className="pt-1 text-[11px] text-amber-400/90 font-medium">
                • Status updates to <strong>PAYMENT VERIFIED</strong> automatically upon admin bank confirmation.
              </div>
            </div>
          </div>
        )}

        {paymentStatus === "PAYMENT_VERIFIED" && (
          <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-lg flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
              <FaCheckCircle />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-300">
                Payment Status: PAYMENT VERIFIED & CONFIRMED
              </h3>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Thank you! Your payment of{" "}
                <strong className="text-white">
                  ₹{billing?.finalPayableAmount?.toLocaleString("en-IN")}
                </strong>{" "}
                (UTR: <strong className="font-mono">{payment?.utr}</strong>) has been verified and confirmed by ARCL Accounts Admin.
              </p>
              <p className="text-[11px] text-emerald-400/90 pt-1 font-semibold">
                Your NABL Calibration Certificate and dispatch documents are processed.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === "PAYMENT_REJECTED" && (
          <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-5 shadow-lg flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
              <FaExclamationTriangle />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-300">
                Payment Status: VERIFICATION REJECTED
              </h3>
              <p className="text-xs text-red-200/80 leading-relaxed">
                Reason:{" "}
                <strong className="text-red-200">
                  {payment?.rejectionReason || "UTR Mismatch or Transaction Not Received"}
                </strong>
              </p>
              <p className="text-[11px] text-red-300 pt-1">
                Please verify your UTR number in your UPI app and re-submit the corrected details below.
              </p>
            </div>
          </div>
        )}

        {/* Official Document Downloads with Dual QR Codes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
              <FaDownload />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Download Official Documents (With Auto-Pay Dual QR)
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct PDF downloads embedded with Authentic NABL CC-4313 &amp; Auto-UPI QR Codes
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPdf("tax_invoice")}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              title="Download Tax Invoice with dual QR codes"
            >
              <FaFileInvoiceDollar /> Tax Invoice (PDF)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf("certificate")}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              title="Download Calibration Certificate with dual QR codes"
            >
              <FaShieldAlt /> Calibration Certificate (PDF)
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf("srf")}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Download Service Request Form / Inward Slip"
            >
              <FaDownload /> SRF Slip (PDF)
            </button>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Request Details & Billing Breakdown */}
          <div className="lg:col-span-6 space-y-6">

            {/* Request Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FaFileInvoiceDollar className="text-blue-400" /> Calibration Request Details
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {calibrationRecord?.serialNo || "REQ-01"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <FaBuilding className="text-slate-500" /> Company Name
                  </span>
                  <span className="font-semibold text-slate-200 block text-sm">
                    {calibrationRecord?.clientCompany || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <FaUser className="text-slate-500" /> Contact Person
                  </span>
                  <span className="font-semibold text-slate-200 block text-sm">
                    {calibrationRecord?.clientContactPerson || "Customer"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 mb-1 block">Instrument Name</span>
                  <span className="font-medium text-slate-200 block">
                    {calibrationRecord?.instrument || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 mb-1 block">Serial Number / Model</span>
                  <span className="font-mono text-slate-200 block">
                    {calibrationRecord?.serialNo} ({calibrationRecord?.modelNo || "STD"})
                  </span>
                </div>
              </div>

              {/* Billing Table */}
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Calibration Service Charges (Base)</span>
                  <span className="font-mono text-slate-200">
                    ₹{billing?.calibrationCharges?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({billing?.gstRate || 18}%)</span>
                  <span className="font-mono text-slate-200">
                    ₹{billing?.gstAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Final Payable Amount</span>
                  <span className="font-bold text-emerald-400 text-lg font-mono">
                    ₹{billing?.finalPayableAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Bank Account Details Card (Fallback option) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FaBuilding className="text-slate-400" /> Alternate Bank NEFT / RTGS Details
              </h3>
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Bank:</span>
                  <span>{bankDetails?.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Account Name:</span>
                  <span>{bankDetails?.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Account No:</span>
                  <span className="text-white font-bold">{bankDetails?.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">IFSC Code:</span>
                  <span className="text-blue-400">{bankDetails?.ifscCode}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic UPI QR Code & UTR Submission Form */}
          <div className="lg:col-span-6 space-y-6">

            {/* Dual UPI QR Codes Container */}
            <div className="bg-linear-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaQrcode /> Dual QR Codes: Auto-Pay (Fixed Amount) & Official Bank QR
                </span>
                <span className="text-[11px] px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full font-mono">
                  NPCI Compliant
                </span>
              </div>

              {/* Grid with Both QR Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Dynamic Auto-Generated Fixed Amount QR */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-blue-500/30 text-center space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 block uppercase tracking-wider">
                    1. Fixed-Amount Auto Pay
                  </span>
                  <div className="inline-block p-2 bg-white rounded-xl shadow-lg border border-slate-700">
                    {upi?.qrCodeDataUrl ? (
                      <img
                        src={upi.qrCodeDataUrl}
                        alt="ARCL Auto Pay UPI QR Code"
                        className="w-40 h-40 mx-auto object-contain rounded"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-slate-500 text-xs">
                        Generating QR...
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    Pre-filled ₹{billing?.finalPayableAmount?.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Auto-attaches amount & reference
                  </span>
                </div>

                {/* 2. Static Official HDFC Bank QR */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    2. Official ARCL Bank QR
                  </span>
                  <div className="inline-block p-2 bg-white rounded-xl shadow-lg border border-slate-700">
                    <img
                      src="/assets/hdfc_qr.png"
                      alt="ARCL Official Bank QR Code"
                      className="w-40 h-40 mx-auto object-contain rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/assets/hdfc_qr.jpg";
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">
                    Official HDFC Bank VPA
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Scan via any UPI App
                  </span>
                </div>

              </div>

              {/* Payee VPA & Quick Copy Actions */}
              <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ARCL Official UPI VPA:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(upi?.vpa, "UPI ID")}
                    className="flex items-center gap-1 font-mono text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    <span>{upi?.vpa}</span>
                    {copiedField === "UPI ID" ? (
                      <FaCheck className="text-emerald-400" />
                    ) : (
                      <FaCopy className="text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Exact Amount to Pay:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        billing?.finalPayableAmount?.toString(),
                        "Amount"
                      )
                    }
                    className="flex items-center gap-1 font-mono text-white hover:text-blue-300 font-bold cursor-pointer"
                  >
                    <span>
                      ₹{billing?.finalPayableAmount?.toLocaleString("en-IN")}
                    </span>
                    {copiedField === "Amount" ? (
                      <FaCheck className="text-emerald-400" />
                    ) : (
                      <FaCopy className="text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment Reference:</span>
                  <span className="font-mono text-slate-300">
                    {upi?.referenceNote}
                  </span>
                </div>
              </div>

              {/* Supported App Logos Text */}
              <p className="text-[11px] text-slate-400">
                Supported Apps: <strong>BHIM, Google Pay, PhonePe, Paytm, CRED, iMobile, YONO SBI, Amazon Pay</strong>
              </p>
            </div>

            {/* UTR & Screenshot Submission Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <FaLock className="text-emerald-400" /> Submit Transaction Details for Verification
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* UTR Field */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    12-Digit UTR / UPI Transaction Reference Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.toUpperCase())}
                    placeholder="e.g. 426819034512"
                    disabled={paymentStatus === "PAYMENT_VERIFIED"}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-blue-500 transition disabled:opacity-60"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Find the 12-digit UTR/Ref No in your UPI app transaction statement.
                  </span>
                </div>

                {/* Date & Time Picker */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Payment Date & Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    disabled={paymentStatus === "PAYMENT_VERIFIED"}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition disabled:opacity-60"
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Upload Payment Screenshot (PNG / JPG / WEBP)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold cursor-pointer transition flex items-center gap-2">
                      <FaUpload /> Select Screenshot File
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        disabled={paymentStatus === "PAYMENT_VERIFIED"}
                        className="hidden"
                      />
                    </label>
                    <span className="text-slate-400 text-[11px] truncate">
                      {screenshotFile ? screenshotFile.name : "No file chosen"}
                    </span>
                  </div>

                  {/* Screenshot Preview */}
                  {screenshotPreview && (
                    <div className="mt-3 p-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot Preview"
                        className="max-h-40 mx-auto object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Customer Notes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Paid from HDFC Bank account of Harsh Mishra"
                    disabled={paymentStatus === "PAYMENT_VERIFIED"}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition disabled:opacity-60"
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={submitting || paymentStatus === "PAYMENT_VERIFIED"}
                  className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FaSync className="animate-spin text-base" /> Submitting for Verification...
                    </>
                  ) : paymentStatus === "PAYMENT_VERIFIED" ? (
                    <>
                      <FaCheckCircle className="text-emerald-400 text-base" /> Payment Confirmed
                    </>
                  ) : paymentStatus === "UNDER_VERIFICATION" ? (
                    <>
                      <FaSync className="text-amber-400 text-base" /> Update UTR Submission
                    </>
                  ) : (
                    <>
                      <FaShieldAlt className="text-base" /> Submit Payment for Verification
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Security & Audit Footer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <FaShieldAlt className="text-emerald-400" />
            <span>Strict Zero-Fee Policy • Manual Bank Statement Audit Verification</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            ARCL Instruments Private Limited Metrology Portal
          </span>
        </div>

      </div>
    </div>
  );
}
