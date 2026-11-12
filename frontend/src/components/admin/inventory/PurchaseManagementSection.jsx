"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  FaShoppingBag,
  FaFileInvoiceDollar,
  FaReceipt,
  FaStore,
  FaBuilding,
  FaWarehouse,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimes,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaTrashAlt,
  FaEdit,
  FaEye,
  FaSearch,
  FaFilter,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaChevronDown,
  FaChevronRight,
  FaMoneyBillWave,
  FaClock,
  FaCheck,
  FaDownload,
  FaSync,
} from "react-icons/fa";
import API from "../../../api/axios.js";
import {
  getPurchasesApi,
  getPurchaseStatsApi,
  createPurchaseApi,
  updatePurchaseApi,
  deletePurchaseApi,
  verifyGstApi,
} from "../../../api/calibrationApi.js";
import { getAdminProducts } from "../../../api/productApi.js";
import {
  GST_STATE_CODE_MAP,
  getGstPlaceOfSupply,
  formatGstExportDate,
  toSafeLocaleDate,
  toSafeIsoDate,
  buildGstPurchaseRows,
  defaultInitialPurchases,
  PURCHASE_ORDER_STAGES,
} from "../../../utils/gstPurchaseUtils.js";

export default function PurchaseManagementSection() {
  // Main Data States
  const [purchases, setPurchases] = useState(defaultInitialPurchases);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [productCatalog, setProductCatalog] = useState([]);

  // Search & Filters
  const [purchaseFilterSearch, setPurchaseFilterSearch] = useState("");
  const [purchaseFilterCategory, setPurchaseFilterCategory] = useState("all");
  const [purchaseFilterMode, setPurchaseFilterMode] = useState("all");
  const [purchaseFilterStatus, setPurchaseFilterStatus] = useState("all");
  const [purchaseFilterWarehouse, setPurchaseFilterWarehouse] = useState("all");
  const [purchaseFilterDeliveryStatus, setPurchaseFilterDeliveryStatus] = useState("all");
  const [purchaseFilterOrderStage, setPurchaseFilterOrderStage] = useState("all");
  const [purchaseFromDate, setPurchaseFromDate] = useState("");
  const [purchaseToDate, setPurchaseToDate] = useState("");
  const [purchaseDatePreset, setPurchaseDatePreset] = useState("all");

  // Modals & UI States
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseEditingId, setPurchaseEditingId] = useState(null);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [isPurchaseViewModalOpen, setIsPurchaseViewModalOpen] = useState(false);
  const [selectedPurchaseForView, setSelectedPurchaseForView] = useState(null);
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState(new Set());
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExportingPurchases, setIsExportingPurchases] = useState(false);

  // Date-wise Export Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState("all");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportFormat, setExportFormat] = useState("xlsx");

  // GST Auto-fetch state
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [activeItemSuggestionIdx, setActiveItemSuggestionIdx] = useState(null);

  // Initial Form State
  const initialPurchaseForm = {
    purchaseNo: "",
    billNo: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    vendorName: "",
    vendorLocation: "",
    vendorGstin: "",
    placeOfSupply: "27-MAHARASHTRA",
    warehouse: "Main Lab - Airoli / Navi Mumbai",
    deliveryStatus: "RECEIVED",
    orderStage: "Received & Stocked",
    reverseCharge: "N",
    vendorPhone: "",
    vendorEmail: "",
    category: "Equipment",
    items: [
      {
        itemName: "",
        description: "",
        category: "Equipment",
        qty: 1,
        unit: "NOS",
        rate: 0,
        taxRate: 18,
        amount: 0,
      },
    ],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    paymentMode: "UPI",
    paymentStatus: "Paid",
    paidAmount: 0,
    dueAmount: 0,
    payments: [
      {
        installmentNo: 1,
        amount: 0,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode: "UPI",
        transactionRef: "",
        notes: "1st Advance / Initial Payment",
      },
    ],
    paymentDate: new Date().toISOString().slice(0, 10),
    transactionRef: "",
    notes: "",
  };

  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);

  // Fetch Purchases from Backend API
  const fetchPurchases = useCallback(async () => {
    try {
      setPurchasesLoading(true);
      const res = await getPurchasesApi();
      if (res?.data?.success && res.data.data?.purchases) {
        const list = Array.isArray(res.data.data.purchases)
          ? res.data.data.purchases
          : [];
        if (list.length > 0) {
          setPurchases(list);
        }
      }
    } catch (e) {
      console.warn("Notice: could not fetch remote purchases, using local state:", e.message);
    } finally {
      setPurchasesLoading(false);
    }
  }, []);

  // Fetch Catalog Products for Auto-Suggestions
  const fetchCatalogProducts = useCallback(async () => {
    try {
      const res = await getAdminProducts();
      if (res?.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.products)
          ? res.data.products
          : [];
        setProductCatalog(list);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchPurchases();
    fetchCatalogProducts();
  }, [fetchPurchases, fetchCatalogProducts]);

  // Date Presets Handler ("Kitne Tarikh Se Kitne Tarikh Tk")
  const applyPurchaseDatePreset = (preset) => {
    setPurchaseDatePreset(preset);
    const now = new Date();
    const toDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setPurchaseFromDate("");
      setPurchaseToDate("");
      return;
    }
    if (preset === "today") {
      const s = toDateStr(now);
      setPurchaseFromDate(s);
      setPurchaseToDate(s);
      return;
    }
    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = toDateStr(y);
      setPurchaseFromDate(s);
      setPurchaseToDate(s);
      return;
    }
    if (preset === "this_week") {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      setPurchaseFromDate(toDateStr(start));
      setPurchaseToDate(toDateStr(now));
      return;
    }
    if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setPurchaseFromDate(toDateStr(start));
      setPurchaseToDate(toDateStr(now));
      return;
    }
    if (preset === "last_30_days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      setPurchaseFromDate(toDateStr(start));
      setPurchaseToDate(toDateStr(now));
      return;
    }
    if (preset === "this_fy") {
      const curYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? curYear : curYear - 1;
      const start = new Date(fyStartYear, 3, 1);
      const end = new Date(fyStartYear + 1, 2, 31);
      setPurchaseFromDate(toDateStr(start));
      setPurchaseToDate(toDateStr(end));
      return;
    }
  };

  // Toggle Expand Multi-Installments Row
  const toggleExpandPurchase = (id) => {
    setExpandedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered Purchases Memo
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (purchaseFilterCategory !== "all" && p.category !== purchaseFilterCategory) return false;
      if (purchaseFilterMode !== "all" && p.paymentMode !== purchaseFilterMode) return false;
      if (purchaseFilterStatus !== "all" && p.paymentStatus !== purchaseFilterStatus) return false;
      if (
        purchaseFilterDeliveryStatus !== "all" &&
        (p.deliveryStatus || "RECEIVED") !== purchaseFilterDeliveryStatus
      )
        return false;
      if (
        purchaseFilterOrderStage !== "all" &&
        (p.orderStage || "Received & Stocked") !== purchaseFilterOrderStage
      )
        return false;
      if (purchaseFilterWarehouse !== "all") {
        const wh = (p.warehouse || p.placeOfSupply || "").toLowerCase();
        if (!wh.includes(purchaseFilterWarehouse.toLowerCase())) return false;
      }
      if (purchaseFromDate) {
        const pDate = new Date(p.purchaseDate || p.createdAt);
        const fromD = new Date(purchaseFromDate);
        fromD.setHours(0, 0, 0, 0);
        if (pDate < fromD) return false;
      }
      if (purchaseToDate) {
        const pDate = new Date(p.purchaseDate || p.createdAt);
        const toD = new Date(purchaseToDate);
        toD.setHours(23, 59, 59, 999);
        if (pDate > toD) return false;
      }
      if (!purchaseFilterSearch) return true;
      const q = purchaseFilterSearch.toLowerCase();
      const matchPNo = (p.purchaseNo || "").toLowerCase().includes(q);
      const matchBNo = (p.billNo || "").toLowerCase().includes(q);
      const matchVendor = (p.vendorName || "").toLowerCase().includes(q);
      const matchLoc = (p.vendorLocation || "").toLowerCase().includes(q);
      const matchWh = (p.warehouse || "").toLowerCase().includes(q);
      const matchUTR = (p.transactionRef || "").toLowerCase().includes(q);
      const matchMode = (p.paymentMode || "").toLowerCase().includes(q);
      const matchStatus = (p.deliveryStatus || p.paymentStatus || "").toLowerCase().includes(q);
      const matchStage = (p.orderStage || "").toLowerCase().includes(q);
      const matchItems = (p.items || []).some(
        (it) =>
          (it.itemName || "").toLowerCase().includes(q) ||
          (it.description || "").toLowerCase().includes(q)
      );
      return (
        matchPNo ||
        matchBNo ||
        matchVendor ||
        matchLoc ||
        matchWh ||
        matchUTR ||
        matchMode ||
        matchStatus ||
        matchStage ||
        matchItems
      );
    });
  }, [
    purchases,
    purchaseFilterCategory,
    purchaseFilterMode,
    purchaseFilterStatus,
    purchaseFilterDeliveryStatus,
    purchaseFilterOrderStage,
    purchaseFilterWarehouse,
    purchaseFromDate,
    purchaseToDate,
    purchaseFilterSearch,
  ]);

  // Overall Live Metrics
  const purchaseMetrics = useMemo(() => {
    const totalCount = purchases.length;
    let totalSpent = 0;
    let totalPaid = 0;
    let totalPending = 0;
    purchases.forEach((p) => {
      const tot = Number(p.totalAmount) || 0;
      const pd = Number(
        p.paidAmount !== undefined ? p.paidAmount : p.paymentStatus === "Paid" ? tot : 0
      );
      totalSpent += tot;
      totalPaid += pd;
      totalPending += Math.max(0, tot - pd);
    });
    return {
      totalCount,
      totalSpent: Math.round(totalSpent),
      totalPaid: Math.round(totalPaid),
      totalPending: Math.round(totalPending),
    };
  }, [purchases]);

  // Sequential Purchase No Generator
  const getSequentialPurchaseNo = () => {
    const nextSeq = purchases.length + 1;
    return `ARCL/PUR/26-27/${String(nextSeq).padStart(2, "0")}`;
  };

  // Open Create Modal
  const handleOpenCreatePurchase = () => {
    setPurchaseEditingId(null);
    setActiveItemSuggestionIdx(null);
    const today = new Date().toISOString().slice(0, 10);
    setPurchaseForm({
      ...initialPurchaseForm,
      purchaseNo: getSequentialPurchaseNo(),
      billNo: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      purchaseDate: today,
      paymentDate: today,
      items: [
        {
          itemName: "",
          description: "",
          category: "Equipment",
          qty: 1,
          unit: "NOS",
          rate: 0,
          taxRate: 18,
          amount: 0,
        },
      ],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      payments: [
        {
          installmentNo: 1,
          amount: 0,
          paymentDate: today,
          paymentMode: "UPI",
          transactionRef: "",
          notes: "1st Advance / Initial Payment",
        },
      ],
    });
    setIsPurchaseModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditPurchase = (pur) => {
    setPurchaseEditingId(pur._id || pur.id);
    setActiveItemSuggestionIdx(null);
    const tot = Number(pur.totalAmount || 0);
    const paid = Number(
      pur.paidAmount !== undefined ? pur.paidAmount : pur.paymentStatus === "Paid" ? tot : 0
    );
    const due = Number(pur.dueAmount !== undefined ? pur.dueAmount : Math.max(0, tot - paid));

    const existingPayments =
      Array.isArray(pur.payments) && pur.payments.length > 0
        ? pur.payments.map((p, idx) => ({
            installmentNo: p.installmentNo || idx + 1,
            amount: Number(p.amount) || 0,
            paymentDate: toSafeIsoDate(p.paymentDate, new Date().toISOString().slice(0, 10)),
            paymentMode: p.paymentMode || pur.paymentMode || "UPI",
            transactionRef: p.transactionRef || "",
            notes: p.notes || `Installment #${idx + 1}`,
          }))
        : [
            {
              installmentNo: 1,
              amount: paid,
              paymentDate: toSafeIsoDate(pur.paymentDate, new Date().toISOString().slice(0, 10)),
              paymentMode: pur.paymentMode || "UPI",
              transactionRef: pur.transactionRef || "",
              notes: pur.notes || "1st Payment Installment",
            },
          ];

    setPurchaseForm({
      purchaseNo: pur.purchaseNo || "",
      billNo: pur.billNo || "",
      purchaseDate: toSafeIsoDate(pur.purchaseDate, new Date().toISOString().slice(0, 10)),
      vendorName: pur.vendorName || "",
      vendorLocation: pur.vendorLocation || "",
      vendorGstin: pur.vendorGstin || "",
      placeOfSupply: pur.placeOfSupply || getGstPlaceOfSupply(pur.vendorGstin, pur.vendorLocation),
      warehouse: pur.warehouse || "Main Lab - Airoli / Navi Mumbai",
      deliveryStatus: pur.deliveryStatus || "RECEIVED",
      orderStage: pur.orderStage || "Received & Stocked",
      reverseCharge: pur.reverseCharge || "N",
      vendorPhone: pur.vendorPhone || "",
      vendorEmail: pur.vendorEmail || "",
      category: pur.category || "Equipment",
      items:
        Array.isArray(pur.items) && pur.items.length > 0
          ? pur.items.map((it) => ({ ...it }))
          : [
              {
                itemName: "",
                description: "",
                category: pur.category || "Equipment",
                qty: 1,
                unit: "NOS",
                rate: 0,
                taxRate: 18,
                amount: 0,
              },
            ],
      subtotal: Number(pur.subtotal || 0),
      taxAmount: Number(pur.taxAmount || 0),
      totalAmount: tot,
      paymentMode: pur.paymentMode || "UPI",
      paymentStatus:
        pur.paymentStatus || (paid >= tot && tot > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending"),
      paidAmount: paid,
      dueAmount: due,
      payments: existingPayments,
      paymentDate: toSafeIsoDate(pur.paymentDate, new Date().toISOString().slice(0, 10)),
      transactionRef: pur.transactionRef || "",
      notes: pur.notes || "",
    });
    setIsPurchaseModalOpen(true);
  };

  // Open View Modal
  const handleOpenPurchaseView = (pur) => {
    setSelectedPurchaseForView(pur);
    setIsPurchaseViewModalOpen(true);
  };

  // PDF Download Action
  const handleDownloadPurchaseInvoicePdf = (pur) => {
    try {
      const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
      const recId = pur._id || pur.id || "";
      const safePNo = encodeURIComponent(pur.purchaseNo || "");
      const payloadStr = encodeURIComponent(JSON.stringify(pur));
      const url = `${base}/client/purchases/download-pdf?recordId=${encodeURIComponent(
        recId
      )}&purchaseNo=${safePNo}&data=${payloadStr}&t=${Date.now()}`;
      window.open(url, "_blank");
      toast.info(`Opening Invoice PDF for ${pur.purchaseNo || "Purchase Record"}...`);
    } catch (err) {
      toast.error("Could not generate purchase PDF: " + (err.message || "Unknown error"));
    }
  };

  // Direct 1:1 Binary PDF Print Action (Exact same layout as Download PDF)
  const handlePrintPdf = async (pdfUrl) => {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "none";
      printFrame.src = blobUrl;
      document.body.appendChild(printFrame);
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          } catch (_) {
            window.open(blobUrl, "_blank");
          }
        }, 500);
      };
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(blobUrl);
        } catch (_) {}
      }, 120000);
    } catch (_) {
      window.open(pdfUrl, "_blank");
    }
  };

  const handlePrintPurchaseInvoicePdf = (pur) => {
    try {
      const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
      const recId = pur._id || pur.id || "";
      const safePNo = encodeURIComponent(pur.purchaseNo || "");
      const payloadStr = encodeURIComponent(JSON.stringify(pur));
      const url = `${base}/client/purchases/download-pdf?recordId=${encodeURIComponent(
        recId
      )}&purchaseNo=${safePNo}&data=${payloadStr}&t=${Date.now()}`;
      toast.info(`Printing Invoice PDF for ${pur.purchaseNo || "Purchase Record"}...`);
      handlePrintPdf(url);
    } catch (err) {
      toast.error("Could not print purchase PDF: " + (err.message || "Unknown error"));
    }
  };

  // Item Change in Form
  const handlePurchaseItemChange = (index, field, value) => {
    setPurchaseForm((prev) => {
      const items = (Array.isArray(prev.items) ? prev.items : []).map((it) => ({ ...it }));
      const current = { ...items[index], [field]: value };
      const qty = Number(field === "qty" ? value : current.qty) || 0;
      const rate = Number(field === "rate" ? value : current.rate) || 0;
      const taxRate =
        Number(
          field === "taxRate" ? value : current.taxRate !== undefined ? current.taxRate : 18
        ) || 0;
      const lineTaxable = qty * rate;
      const lineTax = lineTaxable * (taxRate / 100);
      current.amount = Math.round((lineTaxable + lineTax) * 100) / 100;
      items[index] = current;

      let subtotal = 0;
      let taxAmount = 0;
      items.forEach((it) => {
        const q = Number(it.qty) || 0;
        const r = Number(it.rate) || 0;
        const tr = Number(it.taxRate !== undefined ? it.taxRate : 18) || 0;
        const base = q * r;
        subtotal += base;
        taxAmount += base * (tr / 100);
      });

      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
      const totalPaid = (Array.isArray(prev.payments) ? prev.payments : []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );
      const paid = Math.min(totalAmount, totalPaid || Number(prev.paidAmount || 0));
      const due = Math.max(0, totalAmount - paid);
      const paymentStatus =
        paid >= totalAmount && totalAmount > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";

      return {
        ...prev,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount,
        paidAmount: paid,
        dueAmount: due,
        paymentStatus,
      };
    });
  };

  const handleAddPurchaseItem = () => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...(Array.isArray(prev.items) ? prev.items : []),
        {
          itemName: "",
          description: "",
          category: prev.category || "Equipment",
          qty: 1,
          unit: "NOS",
          rate: 0,
          taxRate: 18,
          amount: 0,
        },
      ],
    }));
  };

  const handleRemovePurchaseItem = (index) => {
    setPurchaseForm((prev) => {
      const items = (Array.isArray(prev.items) ? prev.items : [])
        .filter((_, i) => i !== index)
        .map((it) => ({ ...it }));
      if (items.length === 0) {
        items.push({
          itemName: "",
          description: "",
          category: prev.category || "Equipment",
          qty: 1,
          unit: "NOS",
          rate: 0,
          taxRate: 18,
          amount: 0,
        });
      }
      let subtotal = 0;
      let taxAmount = 0;
      items.forEach((it) => {
        const q = Number(it.qty) || 0;
        const r = Number(it.rate) || 0;
        const tr = Number(it.taxRate !== undefined ? it.taxRate : 18) || 0;
        const base = q * r;
        subtotal += base;
        taxAmount += base * (tr / 100);
      });
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
      const totalPaid = (Array.isArray(prev.payments) ? prev.payments : []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );
      const paid = Math.min(totalAmount, totalPaid || Number(prev.paidAmount || 0));
      const due = Math.max(0, totalAmount - paid);
      const paymentStatus =
        paid >= totalAmount && totalAmount > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";

      return {
        ...prev,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount,
        paidAmount: paid,
        dueAmount: due,
        paymentStatus,
      };
    });
  };

  // Payment Installment Change
  const handlePurchasePaymentChange = (index, field, value) => {
    setPurchaseForm((prev) => {
      const payments = (Array.isArray(prev.payments) ? prev.payments : []).map((p) => ({ ...p }));
      if (!payments[index]) return prev;
      payments[index] = { ...payments[index], [field]: value };
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const tot = Number(prev.totalAmount) || 0;
      const due = Math.max(0, tot - totalPaid);
      const status = totalPaid >= tot && tot > 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Pending";
      return {
        ...prev,
        payments,
        paidAmount: totalPaid,
        dueAmount: due,
        paymentStatus: status,
      };
    });
  };

  const handleAddPurchasePayment = () => {
    setPurchaseForm((prev) => {
      const payments = (Array.isArray(prev.payments) ? prev.payments : []).map((p) => ({ ...p }));
      const nextNo = payments.length + 1;
      const remaining = Math.max(0, Number(prev.dueAmount || 0));
      payments.push({
        installmentNo: nextNo,
        amount: remaining,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode: prev.paymentMode || "UPI",
        transactionRef: "",
        notes: `Installment #${nextNo}`,
      });
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const tot = Number(prev.totalAmount) || 0;
      const due = Math.max(0, tot - totalPaid);
      const status = totalPaid >= tot && tot > 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Pending";
      return {
        ...prev,
        payments,
        paidAmount: totalPaid,
        dueAmount: due,
        paymentStatus: status,
      };
    });
  };

  const handleRemovePurchasePayment = (index) => {
    setPurchaseForm((prev) => {
      let payments = (Array.isArray(prev.payments) ? prev.payments : []).filter(
        (_, i) => i !== index
      );
      if (payments.length === 0) {
        payments = [
          {
            installmentNo: 1,
            amount: 0,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentMode: prev.paymentMode || "UPI",
            transactionRef: "",
            notes: "1st Payment",
          },
        ];
      } else {
        payments = payments.map((p, idx) => ({ ...p, installmentNo: idx + 1 }));
      }
      const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const tot = Number(prev.totalAmount) || 0;
      const due = Math.max(0, tot - totalPaid);
      const status = totalPaid >= tot && tot > 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Pending";
      return {
        ...prev,
        payments,
        paidAmount: totalPaid,
        dueAmount: due,
        paymentStatus: status,
      };
    });
  };

  // Auto-Fetch GST Details
  const handleAutoFetchGst = async (gstin) => {
    const clean = String(gstin || "").trim().toUpperCase();
    if (!clean || clean.length < 15) {
      toast.warning("Please enter a valid 15-digit GSTIN");
      return;
    }
    setIsFetchingGst(true);
    try {
      const res = await verifyGstApi(clean);
      const payload = res?.data?.data || res?.data;
      if (res?.data?.success && payload) {
        const d = payload;
        const tradeName = d.companyName || d.tradeName || d.legalName || "";
        const cityState = d.city
          ? `${d.city}, ${d.state || "Maharashtra"}`
          : d.state || "Maharashtra";
        const location = d.addr || d.fullAddress || d.principal_address || d.address?.line1 || cityState;
        const detectedPos = getGstPlaceOfSupply(clean, cityState);
        const finalGst = payload.gstin || clean;
        setPurchaseForm((prev) => ({
          ...prev,
          vendorGstin: finalGst,
          vendorName: tradeName || prev.vendorName,
          vendorLocation: location || prev.vendorLocation,
          placeOfSupply: detectedPos || prev.placeOfSupply,
        }));
        toast.success(`GSTIN Verified: ${tradeName || finalGst}`);
      } else {
        toast.info("GSTIN Verified successfully");
      }
    } catch (_) {
      toast.info("Auto-detected Place of Supply from GSTIN State Code");
    } finally {
      setIsFetchingGst(false);
    }
  };

  // Save / Update Purchase Record
  const handleSavePurchase = async () => {
    if (!purchaseForm.vendorName || !purchaseForm.vendorName.trim()) {
      toast.error("Vendor / Supplier Company Name is required");
      return;
    }
    setPurchaseSaving(true);
    try {
      const payload = {
        ...purchaseForm,
        purchaseDate: purchaseForm.purchaseDate ? new Date(purchaseForm.purchaseDate) : new Date(),
        paymentDate: purchaseForm.paymentDate ? new Date(purchaseForm.paymentDate) : new Date(),
        payments: (Array.isArray(purchaseForm.payments) ? purchaseForm.payments : []).map(
          (p) => ({
            ...p,
            amount: Number(p.amount) || 0,
            paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
          })
        ),
      };

      if (purchaseEditingId) {
        const res = await updatePurchaseApi(purchaseEditingId, payload);
        const updatedRecord = res?.data?.data || { ...payload, _id: purchaseEditingId };
        setPurchases((prev) =>
          prev.map((p) => ((p._id || p.id) === purchaseEditingId ? updatedRecord : p))
        );
        toast.success(`Purchase record ${updatedRecord.purchaseNo || ""} updated successfully!`);
      } else {
        const res = await createPurchaseApi(payload);
        const createdRecord = res?.data?.data || {
          ...payload,
          _id: `pur-${Date.now()}`,
        };
        setPurchases((prev) => [createdRecord, ...prev]);
        toast.success(`Purchase record ${createdRecord.purchaseNo || ""} created successfully!`);
      }
      setIsPurchaseModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save purchase record");
    } finally {
      setPurchaseSaving(false);
    }
  };

  // Delete Purchase Record
  const handleDeletePurchase = async (id, purchaseNo) => {
    if (!window.confirm(`Kya aap purchase record "${purchaseNo}" ko delete karna chahte hain?`)) {
      return;
    }
    try {
      await deletePurchaseApi(id);
      setPurchases((prev) => prev.filter((p) => (p._id || p.id) !== id));
      toast.success(`Purchase record "${purchaseNo}" deleted.`);
    } catch (err) {
      setPurchases((prev) => prev.filter((p) => (p._id || p.id) !== id));
      toast.success(`Purchase record "${purchaseNo}" deleted locally.`);
    }
  };

  // Quick Change Order Stage Inline
  const handleQuickChangeStage = async (pur, newStage) => {
    const id = pur._id || pur.id;
    try {
      if (pur._id && String(pur._id).length === 24) {
        await updatePurchaseApi(id, { ...pur, orderStage: newStage });
      }
      setPurchases((prev) =>
        prev.map((p) => ((p._id === id || p.id === id) ? { ...p, orderStage: newStage } : p))
      );
      toast.success(`Order stage updated to "${newStage}"!`);
    } catch (err) {
      toast.error("Failed to update order stage: " + (err.response?.data?.message || err.message));
    }
  };

  // Open Export Modal with initial preset & format
  const handleOpenExportModal = (format = "xlsx") => {
    setExportFormat(format);
    setIsExportDropdownOpen(false);
    // If table already has date filter, pre-populate it!
    if (purchaseFromDate || purchaseToDate) {
      setExportFromDate(purchaseFromDate);
      setExportToDate(purchaseToDate);
      setExportPreset("current_table_filter");
    } else {
      setExportPreset("all");
      setExportFromDate("");
      setExportToDate("");
    }
    setIsExportModalOpen(true);
  };

  const applyExportPreset = (preset) => {
    setExportPreset(preset);
    const now = new Date();
    const toDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setExportFromDate("");
      setExportToDate("");
      return;
    }
    if (preset === "today") {
      const s = toDateStr(now);
      setExportFromDate(s);
      setExportToDate(s);
      return;
    }
    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = toDateStr(y);
      setExportFromDate(s);
      setExportToDate(s);
      return;
    }
    if (preset === "last_7") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setExportFromDate(toDateStr(past));
      setExportToDate(toDateStr(now));
      return;
    }
    if (preset === "last_15") {
      const past = new Date(now);
      past.setDate(past.getDate() - 14);
      setExportFromDate(toDateStr(past));
      setExportToDate(toDateStr(now));
      return;
    }
    if (preset === "this_month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setExportFromDate(toDateStr(first));
      setExportToDate(toDateStr(last));
      return;
    }
    if (preset === "last_30") {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      setExportFromDate(toDateStr(past));
      setExportToDate(toDateStr(now));
      return;
    }
    if (preset === "this_fy") {
      const curYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? curYear : curYear - 1;
      const start = new Date(fyStartYear, 3, 1);
      const end = new Date(fyStartYear + 1, 2, 31);
      setExportFromDate(toDateStr(start));
      setExportToDate(toDateStr(end));
      return;
    }
  };

  // Filter purchases according to export dates
  const exportFilteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const pDate = new Date(p.purchaseDate || p.createdAt);
      if (exportFromDate) {
        const fromD = new Date(exportFromDate);
        fromD.setHours(0, 0, 0, 0);
        if (pDate < fromD) return false;
      }
      if (exportToDate) {
        const toD = new Date(exportToDate);
        toD.setHours(23, 59, 59, 999);
        if (pDate > toD) return false;
      }
      return true;
    });
  }, [purchases, exportFromDate, exportToDate]);

  const exportTotalAmount = useMemo(() => {
    return exportFilteredPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  }, [exportFilteredPurchases]);

  // Execute export with selected date range & format
  const handleExecuteExport = async (format = exportFormat) => {
    if (exportFilteredPurchases.length === 0) {
      toast.warning("Chune gaye date range me koi purchase records nahi hain.");
      return;
    }
    setIsExportingPurchases(true);
    try {
      const gstRows = buildGstPurchaseRows(exportFilteredPurchases);
      const fromTag = exportFromDate ? exportFromDate : "Start";
      const toTag = exportToDate ? exportToDate : "End";
      const rangeTag = exportFromDate || exportToDate ? `${fromTag}_to_${toTag}` : `All_Records_${new Date().toISOString().slice(0, 10)}`;

      if (format === "xlsx") {
        const wb = XLSX.utils.book_new();

        // Optional title/metadata header banner
        const titleRow = [
          `ARCL INSTRUMENTS - GST PURCHASE REGISTER (${exportFromDate ? `From: ${exportFromDate}` : "Beginning"} To: ${exportToDate ? exportToDate : "Till Date"}) - Total Records: ${gstRows.length}`,
        ];
        const headers = [
          "GSTIN/UIN of Recipient",
          "Vendor Name",
          "Purchase Number",
          "Supplier Invoice Serial Number",
          "Purchase date",
          "Order Stage",
          "Purchase Value",
          "Place Of Supply",
          "Reverse Charge",
          "Applicable % of Tax Rate",
          "Taxable Value",
          "Cess Amount",
          "CGST",
          "SGST",
          "IGST",
          "Tax %",
          "Tax Amount",
        ];

        const aoa = [titleRow, [], headers];
        gstRows.forEach((r) => {
          aoa.push([
            r.gstin || "",
            r.vendorName || "",
            r.purchaseNumber || "",
            r.supplierInvoiceSerial || "",
            r.purchaseDate || "",
            r.orderStage || "Received & Stocked",
            Number(r.purchaseValue || 0),
            r.placeOfSupply || "27-MAHARASHTRA",
            r.reverseCharge || "N",
            r.applicableTaxRate || "",
            Number(r.taxableValue || 0),
            Number(r.cessAmount || 0),
            Number(r.cgst || 0),
            Number(r.sgst || 0),
            Number(r.igst || 0),
            Number(r.taxPercent || 18),
            Number(r.taxAmount || 0),
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, "GST Purchase Register");
        XLSX.writeFile(wb, `ARCL_Purchase_Register_${rangeTag}.xlsx`);
        toast.success(`Exported ${gstRows.length} purchase records to Excel (.xlsx) for selected dates!`);
      } else {
        const headers = [
          "GSTIN/UIN of Recipient",
          "Vendor Name",
          "Purchase Number",
          "Purchase date",
          "Order Stage",
          "Purchase Value",
          "Place Of Supply",
          "Taxable Value",
          "CGST",
          "SGST",
          "IGST",
          "Tax Amount",
        ];
        const escapeCsv = (v) => {
          const s = String(v === undefined || v === null ? "" : v).replace(/"/g, '""');
          return `"${s}"`;
        };
        const lines = [headers.map(escapeCsv).join(",")];
        gstRows.forEach((r) => {
          lines.push(
            [
              r.gstin,
              r.vendorName,
              r.purchaseNumber,
              r.purchaseDate,
              r.orderStage || "Received & Stocked",
              r.purchaseValue,
              r.placeOfSupply,
              r.taxableValue,
              r.cgst,
              r.sgst,
              r.igst,
              r.taxAmount,
            ]
              .map(escapeCsv)
              .join(",")
          );
        });
        const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ARCL_Purchase_Register_${rangeTag}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exported ${gstRows.length} purchase records to CSV for selected dates!`);
      }
      setIsExportModalOpen(false);
    } catch (err) {
      toast.error("Failed to export purchases: " + (err.message || "Unknown error"));
    } finally {
      setIsExportingPurchases(false);
    }
  };

  // Backwards-compatible export handler
  const handleExportPurchases = async (format = "xlsx") => {
    handleOpenExportModal(format);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
      {/* 1. TOP TITLE & TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
              <FaShoppingBag className="text-lg" />
            </span>
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                Laboratory &amp; Inventory Purchase Master
              </h2>
              <p className="text-xs text-gray-500">
                Track POs, vendor inwards, equipment expenses, payment installments (UPI, Bank, Cash), and inward delivery status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative inline-flex items-center shadow-xs rounded-xl">
            <button
              type="button"
              onClick={() => handleExportPurchases("xlsx")}
              disabled={isExportingPurchases}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-l-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
              title="Export purchase records to Excel (.xlsx) sheet matching GST purchase register"
            >
              <FaFileExcel className="text-emerald-600 text-sm" />
              {isExportingPurchases ? "Exporting..." : "Export Purchases (.xlsx)"}
            </button>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="px-2 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-y border-r border-emerald-200 rounded-r-xl text-xs font-bold transition flex items-center justify-center cursor-pointer active:scale-95"
              title="Choose export format (Excel .xlsx or CSV)"
            >
              <FaChevronDown className="text-[10px]" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Select Export Format
                </div>
                <button
                  type="button"
                  onClick={() => handleExportPurchases("xlsx")}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 flex items-center gap-2.5 font-bold transition cursor-pointer"
                >
                  <FaFileExcel className="text-emerald-600 text-sm" />
                  <div>
                    <div className="text-xs">Excel Workbook (.xlsx)</div>
                    <div className="text-[10px] text-gray-400 font-normal">GST Purchase Register (16 columns)</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPurchases("csv")}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 flex items-center gap-2.5 font-bold transition cursor-pointer"
                >
                  <FaDownload className="text-blue-600 text-sm" />
                  <div>
                    <div className="text-xs">CSV Spreadsheet (.csv)</div>
                    <div className="text-[10px] text-gray-400 font-normal">GSTR-2 standard CSV format</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={fetchPurchases}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
            title="Refresh Purchases"
          >
            <FaSync className={purchasesLoading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreatePurchase}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <FaPlus />
            <span>Add New Purchase</span>
          </button>
        </div>
      </div>

      {/* 2. TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-3.5 rounded-xl border border-blue-100">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaShoppingBag className="text-blue-500" /> Total Purchases
          </div>
          <div className="text-2xl font-black text-blue-950 mt-1 font-mono">
            {purchaseMetrics.totalCount} Orders
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">
            Verified Lab &amp; Stock Inward Records
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3.5 rounded-xl border border-emerald-100">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaMoneyBillWave className="text-emerald-500" /> Total Spent / Expenses
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1 font-mono">
            ₹{Number(purchaseMetrics.totalSpent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            Includes GST &amp; Material Costs
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50/40 p-3.5 rounded-xl border border-purple-100">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaCheckCircle className="text-purple-500" /> Paid via UPI / Bank
          </div>
          <div className="text-2xl font-black text-purple-950 mt-1 font-mono">
            ₹{Number(purchaseMetrics.totalPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-600 mt-0.5">
            Settled Vendor Invoices
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-3.5 rounded-xl border border-amber-100">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <FaClock className="text-amber-500" /> Pending / Due Amount
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1 font-mono">
            ₹{Number(purchaseMetrics.totalPending || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">
            {purchaseMetrics.totalPending > 0 ? "Awaiting Payment Clearance" : "All Accounts Cleared 100%"}
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC SEARCH & DATE RANGE FILTERS BAR */}
      <div className="bg-gray-50/90 p-3.5 rounded-xl border border-gray-200 space-y-3">
        {/* Row 1: Text Search & Category / Delivery Status / Payment Status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search purchases by PO Number, Supplier, Warehouse, Items, Bill No, UTR..."
              value={purchaseFilterSearch}
              onChange={(e) => setPurchaseFilterSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {purchaseFilterSearch && (
              <button
                type="button"
                onClick={() => setPurchaseFilterSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={purchaseFilterCategory}
              onChange={(e) => setPurchaseFilterCategory(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="Glassware">Glassware</option>
              <option value="Calibration Standards">Calibration Standards</option>
              <option value="Reagents &amp; Chemicals">Reagents &amp; Chemicals</option>
              <option value="Equipment">Equipment</option>
              <option value="Lab Consumables">Lab Consumables</option>
              <option value="IT &amp; Hardware">IT &amp; Hardware</option>
              <option value="Maintenance &amp; Spares">Maintenance &amp; Spares</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={purchaseFilterDeliveryStatus}
              onChange={(e) => setPurchaseFilterDeliveryStatus(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="all">All PO Statuses</option>
              <option value="RECEIVED">Received (Completed)</option>
              <option value="ORDERED">Ordered (Incoming)</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={purchaseFilterOrderStage}
              onChange={(e) => setPurchaseFilterOrderStage(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-900"
            >
              <option value="all">All Order Stages</option>
              {PURCHASE_ORDER_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={purchaseFilterStatus}
              onChange={(e) => setPurchaseFilterStatus(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Search ("Kitne Tarikh Se Kitne Tarikh Tk") + Quick Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2.5 border-t border-gray-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 shrink-0">
              <FaCalendarAlt className="text-emerald-600" />
              <span>Date Range:</span>
            </span>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">From:</span>
              <input
                type="date"
                value={purchaseFromDate}
                onChange={(e) => {
                  setPurchaseFromDate(e.target.value);
                  setPurchaseDatePreset("custom");
                }}
                className="text-xs bg-transparent border-none focus:outline-none text-gray-800 font-medium"
                title="Start Date (Kitne Tarikh Se)"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">To:</span>
              <input
                type="date"
                value={purchaseToDate}
                onChange={(e) => {
                  setPurchaseToDate(e.target.value);
                  setPurchaseDatePreset("custom");
                }}
                className="text-xs bg-transparent border-none focus:outline-none text-gray-800 font-medium"
                title="End Date (Kitne Tarikh Tk)"
              />
            </div>

            {(purchaseFromDate || purchaseToDate || purchaseDatePreset !== "all") && (
              <button
                type="button"
                onClick={() => applyPurchaseDatePreset("all")}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Clear Date Filter"
              >
                <FaTimes className="text-[10px]" /> Clear Dates
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick:</span>
            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "this_week", label: "This Week" },
              { id: "this_month", label: "This Month" },
              { id: "last_30_days", label: "Last 30 Days" },
              { id: "this_fy", label: "FY 26-27" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPurchaseDatePreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  purchaseDatePreset === preset.id
                    ? "bg-[#021C57] text-white shadow-2xs"
                    : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {preset.label}
              </button>
            ))}

            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap pl-2 border-l border-gray-300">
              Showing: <strong className="text-emerald-900">{filteredPurchases.length}</strong> of {purchases.length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. MAIN PURCHASES TABLE (EXACT SAME AS USER'S IMAGE) */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gradient-to-r from-[#021C57] via-slate-900 to-indigo-950 text-white font-bold text-[10px] uppercase tracking-wider border-b border-slate-700">
              <th className="p-3 text-center w-10 border-r border-white/10">#</th>
              <th className="p-3 border-r border-white/10 min-w-[140px]">PO NUMBER</th>
              <th className="p-3 border-r border-white/10 min-w-[180px]">SUPPLIER</th>
              <th className="p-3 border-r border-white/10 min-w-[140px]">WAREHOUSE</th>
              <th className="p-3 border-r border-white/10 min-w-[110px]">ORDER DATE</th>
              <th className="p-3 border-r border-white/10 min-w-[220px]">ITEMS &amp; PROGRESS</th>
              <th className="p-3 border-r border-white/10 min-w-[155px] text-center">ORDER STAGE</th>
              <th className="p-3 border-r border-white/10 min-w-[130px] text-right">TOTAL AMOUNT (₹)</th>
              <th className="p-3 border-r border-white/10 min-w-[130px] text-center">STATUS</th>
              <th className="p-3 min-w-[130px] text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10 text-center text-gray-500">
                  <div className="max-w-md mx-auto space-y-2">
                    <FaShoppingBag className="mx-auto text-4xl text-gray-300" />
                    <p className="font-bold text-gray-700">No Purchase Records Found</p>
                    <p className="text-xs text-gray-400">
                      {purchaseFilterSearch || purchaseFromDate || purchaseToDate
                        ? `No records match current search / date filters. Try clearing the filter.`
                        : "Click '+ Add New Purchase' to record your equipment, material, and consumable purchases."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPurchases.map((pur, idx) => {
                const items = Array.isArray(pur.items) && pur.items.length > 0 ? pur.items : [];
                const itemsCount = items.length;
                const primaryItem = items[0] || {};
                const totalQty = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
                const deliveryStatus = pur.deliveryStatus || "RECEIVED";

                const poStatusBadge =
                  deliveryStatus === "RECEIVED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : deliveryStatus === "ORDERED"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : deliveryStatus === "PARTIALLY_RECEIVED"
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : deliveryStatus === "CANCELLED"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-slate-100 text-slate-700 border-slate-300";

                const progressPct =
                  deliveryStatus === "RECEIVED"
                    ? 100
                    : deliveryStatus === "PARTIALLY_RECEIVED"
                    ? 60
                    : deliveryStatus === "ORDERED"
                    ? 25
                    : 10;

                const modeBg =
                  pur.paymentMode === "UPI"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : pur.paymentMode === "Net Banking"
                    ? "bg-blue-50 text-blue-800 border-blue-300"
                    : pur.paymentMode === "Cash"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-purple-50 text-purple-800 border-purple-300";

                const statusBg =
                  pur.paymentStatus === "Paid"
                    ? "bg-emerald-600 text-white"
                    : pur.paymentStatus === "Pending"
                    ? "bg-rose-600 text-white"
                    : "bg-amber-500 text-white";

                return (
                  <React.Fragment key={pur._id || pur.id || idx}>
                    <tr className="hover:bg-slate-50/80 transition">
                      {/* Index */}
                      <td className="p-3 font-bold text-center border-r border-gray-200 bg-gray-50/50 text-gray-700">
                        {idx + 1}
                      </td>

                      {/* PO NUMBER */}
                      <td className="p-3 border-r border-gray-200">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-blue-900 font-mono text-xs">
                            {pur.purchaseNo || `ARCL/PUR/26-27/${String(idx + 1).padStart(2, "0")}`}
                          </span>
                          {pur.billNo && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 w-fit">
                              <FaReceipt className="text-gray-400 text-[9px]" />
                              <span>Bill: {pur.billNo}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* SUPPLIER */}
                      <td className="p-3 border-r border-gray-200">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <FaStore className="text-emerald-600 text-[11px] shrink-0" />
                            {pur.vendorName || "Unknown Vendor"}
                          </span>
                          {pur.vendorLocation && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <FaBuilding className="text-gray-400 text-[10px] shrink-0" />
                              {pur.vendorLocation}
                            </span>
                          )}
                          {pur.vendorGstin && (
                            <span className="text-[9px] text-gray-400 font-mono">
                              GSTIN: {pur.vendorGstin}
                            </span>
                          )}
                          {pur.vendorPhone && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                              <FaPhone className="text-gray-400 text-[9px] shrink-0" />
                              {pur.vendorPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* WAREHOUSE */}
                      <td className="p-3 border-r border-gray-200">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                            <FaWarehouse className="text-blue-600 text-[11px] shrink-0" />
                            <span>{pur.warehouse || "Main Lab - Airoli / Navi Mumbai"}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            POS: {pur.placeOfSupply || "27-MAHARASHTRA"}
                          </span>
                        </div>
                      </td>

                      {/* ORDER DATE */}
                      <td className="p-3 border-r border-gray-200">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold font-mono">
                            <FaCalendarAlt className="text-gray-400 text-[10px]" />
                            <span>{toSafeLocaleDate(pur.purchaseDate, "-")}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Inward Logged</span>
                        </div>
                      </td>

                      {/* ITEMS & PROGRESS */}
                      <td className="p-3 border-r border-gray-200">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-800">
                              {deliveryStatus === "RECEIVED"
                                ? `${totalQty} of ${totalQty} units received`
                                : `${totalQty} units ordered`}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {progressPct}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                deliveryStatus === "RECEIVED"
                                  ? "bg-emerald-500"
                                  : deliveryStatus === "ORDERED"
                                  ? "bg-blue-500"
                                  : "bg-purple-500"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {pur.category || "Equipment"}
                            </span>
                            <span className="font-semibold text-slate-800 text-xs line-clamp-1">
                              {primaryItem.itemName || "Lab Item"}
                            </span>
                          </div>
                          {itemsCount > 1 && (
                            <span className="text-[10px] font-bold text-blue-600 block">
                              + {itemsCount - 1} more items inward
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ORDER STAGE */}
                      <td className="p-3 border-r border-gray-200 text-center">
                        {(() => {
                          const currentStage = pur.orderStage || "Received & Stocked";
                          const stageObj =
                            PURCHASE_ORDER_STAGES.find((s) => s.id === currentStage) || {
                              color: "bg-emerald-100 text-emerald-800 border-emerald-300",
                              dot: "bg-emerald-600",
                            };
                          return (
                            <div className="inline-flex flex-col items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1.5 ${stageObj.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${stageObj.dot}`} />
                                <span>{currentStage}</span>
                              </span>
                              <select
                                value={currentStage}
                                onChange={(e) => handleQuickChangeStage(pur, e.target.value)}
                                className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                title="Quick Change Order Stage"
                              >
                                {PURCHASE_ORDER_STAGES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}
                      </td>

                      {/* TOTAL AMOUNT (₹) */}
                      <td className="p-3 border-r border-gray-200 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-900 font-mono text-sm">
                            ₹{Number(pur.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            Taxable: ₹{Number(pur.subtotal || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            GST: ₹{Number(pur.taxAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="p-3 border-r border-gray-200 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* PO Delivery Status */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${poStatusBadge}`}
                          >
                            {deliveryStatus}
                          </span>

                          {/* Payment Status */}
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 ${modeBg}`}
                            >
                              <FaCreditCard className="text-[9px]" /> {pur.paymentMode || "UPI"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${statusBg}`}>
                              {pur.paymentStatus || "Paid"}
                            </span>
                          </div>

                          {/* Arrow toggle to view installment history */}
                          <button
                            type="button"
                            onClick={() => toggleExpandPurchase(pur._id || pur.id || idx)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Click arrow to expand and view payment installments history"
                          >
                            {expandedPurchaseIds.has(pur._id || pur.id || idx) ? (
                              <FaChevronDown className="text-[9px] text-indigo-600" />
                            ) : (
                              <FaChevronRight className="text-[9px] text-indigo-600" />
                            )}
                            <span>
                              {(pur.payments || []).length || 1} Installment
                              {((pur.payments || []).length || 1) > 1 ? "s" : ""}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenPurchaseView(pur)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                            title="View Official Purchase Invoice & Expense Voucher"
                          >
                            <FaEye className="text-blue-600 group-hover:text-white text-xs" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPurchaseInvoicePdf(pur)}
                            className="px-2 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                            title="Download Official ARCL Purchase Invoice & Expense Voucher PDF"
                          >
                            <FaFilePdf className="text-red-500 group-hover:text-white text-xs" /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintPurchaseInvoicePdf(pur)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                            title="Direct Print Official ARCL Purchase Invoice PDF (Exact same 1:1 format as downloaded PDF)"
                          >
                            <FaPrint className="text-purple-600 group-hover:text-white text-xs" /> Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPurchase(pur)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Edit this Purchase Record"
                          >
                            <FaEdit className="text-amber-600 group-hover:text-white text-xs" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePurchase(pur._id || pur.id, pur.purchaseNo)}
                            className="p-1 text-gray-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Purchase Record"
                          >
                            <FaTrashAlt className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Multi-Installments Record Row (Arrow Click) */}
                    {expandedPurchaseIds.has(pur._id || pur.id || idx) && (
                      <tr className="bg-slate-50/95 border-b border-indigo-200">
                        <td colSpan={9} className="p-3 pl-8">
                          <div className="bg-white rounded-xl border border-indigo-200 p-3.5 shadow-sm space-y-2.5">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-md bg-indigo-100 text-indigo-800 text-xs">
                                  <FaCreditCard />
                                </span>
                                <span className="font-bold text-xs text-indigo-950">
                                  Payment Installments &amp; UTR History for {pur.purchaseNo}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  (Vendor: <strong className="text-gray-800">{pur.vendorName}</strong>)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span className="text-gray-600">
                                  Total Bill: <strong>₹{Number(pur.totalAmount || 0).toLocaleString("en-IN")}</strong>
                                </span>
                                <span className="text-emerald-700 font-bold">
                                  Paid: ₹{Number(pur.paidAmount !== undefined ? pur.paidAmount : pur.totalAmount || 0).toLocaleString("en-IN")}
                                </span>
                                {Number(pur.dueAmount || 0) > 0 && (
                                  <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Remaining Due: ₹{Number(pur.dueAmount).toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-bold text-gray-600 border-b border-gray-200">
                                    <th className="p-1.5 text-center w-10">Inst #</th>
                                    <th className="p-1.5">Payment Date</th>
                                    <th className="p-1.5">Payment Mode</th>
                                    <th className="p-1.5">UTR / Cheque Ref</th>
                                    <th className="p-1.5 text-right">Amount (₹)</th>
                                    <th className="p-1.5">Stage / Remarks</th>
                                    <th className="p-1.5 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {(Array.isArray(pur.payments) && pur.payments.length > 0
                                    ? pur.payments
                                    : [
                                        {
                                          installmentNo: 1,
                                          paymentDate: pur.paymentDate,
                                          paymentMode: pur.paymentMode || "UPI",
                                          transactionRef: pur.transactionRef || "",
                                          amount:
                                            pur.paidAmount !== undefined
                                              ? pur.paidAmount
                                              : pur.totalAmount || 0,
                                          notes: pur.notes || "Full Payment Settlement",
                                        },
                                      ]
                                  ).map((p, pIdx) => (
                                    <tr key={pIdx} className="hover:bg-slate-50/70">
                                      <td className="p-1.5 text-center font-bold text-blue-900 bg-slate-50/50">
                                        #{p.installmentNo || pIdx + 1}
                                      </td>
                                      <td className="p-1.5 font-medium">
                                        {toSafeLocaleDate(p.paymentDate, "-")}
                                      </td>
                                      <td className="p-1.5">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                          {p.paymentMode || "UPI"}
                                        </span>
                                      </td>
                                      <td className="p-1.5 font-mono text-[11px] text-gray-700">
                                        {p.transactionRef || "-"}
                                      </td>
                                      <td className="p-1.5 text-right font-mono font-bold text-emerald-800">
                                        ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-1.5 text-gray-600 text-[11px]">{p.notes || "-"}</td>
                                      <td className="p-1.5 text-center">
                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          Cleared ✅
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

      {/* ========================================================================= */}
      {/* 5. MODAL: ADD / EDIT PURCHASE RECORD */}
      {/* ========================================================================= */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-emerald-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Top Toolbar */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 text-xl">
                  <FaShoppingBag />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {purchaseEditingId ? "Edit Purchase Record" : "Add New Purchase Record"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      EXPENSE INWARD
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/70">
                    Record vendor bills, laboratory equipment, material consumables, and payment settlement installments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePurchase}
                  disabled={purchaseSaving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <FaCheck /> {purchaseSaving ? "Saving..." : "Save Purchase Record"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Modal Body - Visual Form */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-5">
                {/* 1. Dates & Invoice Ref */}
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Purchase Date &amp; Reference Number
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Purchase Ref #
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.purchaseNo}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseNo: e.target.value })}
                        placeholder="ARCL/PUR/26-27/01"
                        className="w-full text-xs font-mono font-bold bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 focus:bg-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Bill / Invoice No
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.billNo}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, billNo: e.target.value })}
                        placeholder="e.g. BORO-INV-8842"
                        className="w-full text-xs font-mono bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={purchaseForm.purchaseDate}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Vendor / Supplier Details */}
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Vendor / Supplier &amp; Inward Destination
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Vendor / Company Name *
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.vendorName}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })}
                        placeholder="e.g. Borosil Scientific Ltd, Mitutoyo South Asia"
                        className="w-full text-xs font-bold bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Location / City
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.vendorLocation}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorLocation: e.target.value })}
                        placeholder="e.g. Andheri East, Mumbai, Maharashtra"
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-gray-700">Vendor GSTIN</label>
                        <span className="text-[10px] text-emerald-600 font-bold">Auto-Fetch Active</span>
                      </div>
                      <div className="relative flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-emerald-500 bg-white shadow-xs">
                        <input
                          type="text"
                          value={purchaseForm.vendorGstin}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                            const detectedPos = getGstPlaceOfSupply(val, purchaseForm.vendorLocation);
                            setPurchaseForm((prev) => ({
                              ...prev,
                              vendorGstin: val,
                              placeOfSupply: detectedPos || prev.placeOfSupply,
                            }));
                            if (val.length === 15) {
                              handleAutoFetchGst(val);
                            }
                          }}
                          maxLength={15}
                          placeholder="27CCEPS8122B1ZQ"
                          className="flex-1 px-3 py-2 text-xs font-mono uppercase tracking-wider text-gray-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAutoFetchGst(purchaseForm.vendorGstin)}
                          disabled={isFetchingGst}
                          className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-emerald-700 border-l border-gray-200 bg-gray-50 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
                        >
                          {isFetchingGst ? (
                            <span className="text-[10px] text-emerald-700">Fetching...</span>
                          ) : (
                            <span className="text-[10px]">Fetch Details</span>
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Place of Supply (GST Code)
                      </label>
                      <select
                        value={purchaseForm.placeOfSupply || "27-MAHARASHTRA"}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, placeOfSupply: e.target.value })}
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-2 py-2 focus:border-emerald-500 focus:outline-none font-medium"
                      >
                        {Object.values(GST_STATE_CODE_MAP).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Warehouse / Inward Location
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.warehouse || "Main Lab - Airoli / Navi Mumbai"}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, warehouse: e.target.value })}
                        placeholder="e.g. Main Lab - Airoli / Navi Mumbai"
                        className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        PO Delivery / Inward Status
                      </label>
                      <select
                        value={purchaseForm.deliveryStatus || "RECEIVED"}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, deliveryStatus: e.target.value })}
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-2 py-2 focus:border-emerald-500 focus:outline-none font-bold text-slate-800"
                      >
                        <option value="RECEIVED">RECEIVED (Completed &amp; Inwarded)</option>
                        <option value="ORDERED">ORDERED (Pending Delivery)</option>
                        <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Order Stage
                      </label>
                      <select
                        value={purchaseForm.orderStage || "Received & Stocked"}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, orderStage: e.target.value })}
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-2 py-2 focus:border-indigo-500 focus:outline-none font-bold text-indigo-900"
                      >
                        {PURCHASE_ORDER_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Vendor Phone</label>
                      <input
                        type="text"
                        value={purchaseForm.vendorPhone}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorPhone: e.target.value })}
                        placeholder="+91 9820123456"
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Vendor Email</label>
                      <input
                        type="email"
                        value={purchaseForm.vendorEmail}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorEmail: e.target.value })}
                        placeholder="sales@vendor.com"
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Items & Consumables Grid */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">
                        3
                      </span>
                      Items / Equipment / Consumables Line Items
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddPurchaseItem}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaPlus className="text-[10px]" /> Add Line Item
                    </button>
                  </div>

                  <div className="overflow-x-auto mt-3 border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-gray-700 border-b border-gray-200 text-[11px]">
                          <th className="p-2.5 text-center w-10">#</th>
                          <th className="p-2.5 min-w-[200px]">Item Name *</th>
                          <th className="p-2.5 min-w-[150px]">Description / Specs</th>
                          <th className="p-2.5 w-32">Category</th>
                          <th className="p-2.5 w-20 text-center">Qty</th>
                          <th className="p-2.5 w-20">Unit</th>
                          <th className="p-2.5 w-24 text-right">Rate (₹)</th>
                          <th className="p-2.5 w-20 text-center">GST %</th>
                          <th className="p-2.5 w-28 text-right">Amount (₹)</th>
                          <th className="p-2.5 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {purchaseForm.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="p-2 relative">
                              <input
                                type="text"
                                value={it.itemName}
                                onChange={(e) => handlePurchaseItemChange(idx, "itemName", e.target.value)}
                                placeholder="e.g. Compression Testing Machine, Test Sieves"
                                className="w-full text-xs font-bold bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-purple-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={it.description || ""}
                                onChange={(e) => handlePurchaseItemChange(idx, "description", e.target.value)}
                                placeholder="Model / Grade / Specification"
                                className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-purple-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={it.category || purchaseForm.category || "Equipment"}
                                onChange={(e) => handlePurchaseItemChange(idx, "category", e.target.value)}
                                className="w-full text-xs bg-white border border-gray-300 rounded px-1.5 py-1.5 focus:border-purple-500 focus:outline-none"
                              >
                                <option value="Equipment">Equipment</option>
                                <option value="Glassware">Glassware</option>
                                <option value="Calibration Standards">Calibration Standards</option>
                                <option value="Reagents &amp; Chemicals">Reagents &amp; Chemicals</option>
                                <option value="Lab Consumables">Lab Consumables</option>
                                <option value="IT &amp; Hardware">IT &amp; Hardware</option>
                                <option value="Maintenance &amp; Spares">Maintenance &amp; Spares</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={it.qty}
                                onChange={(e) => handlePurchaseItemChange(idx, "qty", e.target.value)}
                                className="w-16 text-xs text-center font-bold bg-white border border-gray-300 rounded px-1 py-1.5 focus:border-purple-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={it.unit || "NOS"}
                                onChange={(e) => handlePurchaseItemChange(idx, "unit", e.target.value)}
                                className="w-full text-xs bg-white border border-gray-300 rounded px-1 py-1.5 focus:border-purple-500 focus:outline-none"
                              >
                                <option value="NOS">NOS</option>
                                <option value="SET">SET</option>
                                <option value="BOX">BOX</option>
                                <option value="LTR">LTR</option>
                                <option value="KG">KG</option>
                                <option value="PACK">PACK</option>
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.rate}
                                onChange={(e) => handlePurchaseItemChange(idx, "rate", e.target.value)}
                                className="w-20 text-xs text-right font-mono font-bold bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-purple-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <select
                                value={it.taxRate !== undefined ? it.taxRate : 18}
                                onChange={(e) => handlePurchaseItemChange(idx, "taxRate", e.target.value)}
                                className="w-16 text-xs text-center font-bold bg-white border border-gray-300 rounded px-1 py-1.5 focus:border-purple-500 focus:outline-none"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-gray-900">
                              ₹{Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-center">
                              {purchaseForm.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchaseItem(idx)}
                                  className="text-gray-400 hover:text-rose-600 transition p-1"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 mt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="text-gray-600">
                      Items Count: <strong>{purchaseForm.items.length}</strong>
                    </div>
                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div>
                        Taxable: <strong className="text-gray-900">₹{Number(purchaseForm.subtotal || 0).toLocaleString("en-IN")}</strong>
                      </div>
                      <div>
                        GST (Tax): <strong className="text-gray-900">₹{Number(purchaseForm.taxAmount || 0).toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="text-sm bg-emerald-100 text-emerald-950 px-3 py-1 rounded-lg border border-emerald-300 font-bold">
                        Grand Total: ₹{Number(purchaseForm.totalAmount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Payment Settlement & Multi-Installments */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">
                        4
                      </span>
                      Payment Settlement &amp; Multi-Installments
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddPurchasePayment}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaPlus className="text-[10px]" /> Add Installment
                    </button>
                  </div>

                  <div className="overflow-x-auto mt-3 border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-gray-700 border-b border-gray-200 text-[11px]">
                          <th className="p-2.5 text-center w-12">#</th>
                          <th className="p-2.5 w-32">Installment Amt (₹)</th>
                          <th className="p-2.5 w-36">Payment Date</th>
                          <th className="p-2.5 w-36">Mode</th>
                          <th className="p-2.5 min-w-[140px]">Transaction / UTR Ref</th>
                          <th className="p-2.5 min-w-[150px]">Stage / Notes</th>
                          <th className="p-2.5 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(purchaseForm.payments || []).map((p, pIdx) => (
                          <tr key={pIdx} className="hover:bg-slate-50/60">
                            <td className="p-2 text-center font-bold text-blue-900 bg-slate-50/50">
                              #{p.installmentNo || pIdx + 1}
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={p.amount}
                                onChange={(e) => handlePurchasePaymentChange(pIdx, "amount", e.target.value)}
                                className="w-full text-xs font-mono font-bold text-emerald-800 bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={p.paymentDate ? toSafeIsoDate(p.paymentDate) : ""}
                                onChange={(e) => handlePurchasePaymentChange(pIdx, "paymentDate", e.target.value)}
                                className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={p.paymentMode || "UPI"}
                                onChange={(e) => handlePurchasePaymentChange(pIdx, "paymentMode", e.target.value)}
                                className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none font-medium"
                              >
                                <option value="UPI">UPI</option>
                                <option value="Net Banking">Net Banking / NEFT</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Card">Card</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={p.transactionRef || ""}
                                onChange={(e) => handlePurchasePaymentChange(pIdx, "transactionRef", e.target.value)}
                                placeholder="UTR / Reference #"
                                className="w-full text-xs font-mono bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={p.notes || ""}
                                onChange={(e) => handlePurchasePaymentChange(pIdx, "notes", e.target.value)}
                                placeholder="e.g. 50% Advance / Final"
                                className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1.5 focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {(purchaseForm.payments || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchasePayment(pIdx)}
                                  className="text-gray-400 hover:text-rose-600 transition p-1"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Status Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    <div className="bg-slate-50 border border-gray-200 rounded-lg p-3">
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Total Invoice Bill</span>
                      <strong className="text-sm font-mono text-gray-900">
                        ₹{Number(purchaseForm.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <span className="text-[10px] text-emerald-700 font-bold block uppercase">Total Paid Across Installments</span>
                      <strong className="text-sm font-mono text-emerald-800">
                        ₹{Number(purchaseForm.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <span className="text-[10px] text-rose-700 font-bold block uppercase">Remaining Due</span>
                      <strong className="text-sm font-mono text-rose-800">
                        ₹{Number(purchaseForm.dueAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: VIEW OFFICIAL PURCHASE VOUCHER */}
      {/* ========================================================================= */}
      {isPurchaseViewModalOpen && selectedPurchaseForView && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Header Toolbar */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 text-xl">
                  <FaEye />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Purchase Invoice &amp; Expense Voucher View
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      OFFICIAL VOUCHER
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/70 font-mono">
                    Ref: {selectedPurchaseForView.purchaseNo} • Bill: {selectedPurchaseForView.billNo || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPurchaseInvoicePdf(selectedPurchaseForView)}
                  className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Download PDF Document"
                >
                  <FaFilePdf /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintPurchaseInvoicePdf(selectedPurchaseForView)}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Direct Print Official PDF Document (Exact same 1:1 format as downloaded PDF)"
                >
                  <FaPrint /> Print Official PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPurchaseViewModalOpen(false);
                    handleOpenEditPurchase(selectedPurchaseForView);
                  }}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <FaEdit /> Edit Record
                </button>
                <button
                  type="button"
                  onClick={() => setIsPurchaseViewModalOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
                {/* 1. Header & Identity */}
                <div className="border-b-2 border-gray-800 pb-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-blue-950 tracking-tight">
                      ARCL INSTRUMENTS PRIVATE LIMITED
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Plot No. R-854, TTC Industrial Area, MIDC Rabale, Navi Mumbai - 400701, MH, India
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      GSTIN: 27AABCA7890F1Z2 • Tel: +91 22 2760 1234 • Email: purchases@arcl.in
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-900 text-white block mb-1">
                      PURCHASE INWARD VOUCHER
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      NABL Metrology Lab: CC-4313
                    </span>
                  </div>
                </div>

                {/* 2. Voucher & Vendor Block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-gray-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
                      Voucher &amp; Bill Information
                    </span>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                      <span className="text-gray-600">Voucher Ref No:</span>
                      <strong className="font-mono text-blue-900">{selectedPurchaseForView.purchaseNo}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                      <span className="text-gray-600">Vendor Bill / Inv No:</span>
                      <strong className="font-mono text-gray-900">{selectedPurchaseForView.billNo || "-"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1">
                      <span className="text-gray-600">Purchase Date:</span>
                      <strong className="text-gray-900">{toSafeLocaleDate(selectedPurchaseForView.purchaseDate, "-")}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 py-1 items-center">
                      <span className="text-gray-600">Order Stage:</span>
                      {(() => {
                        const currentStage = selectedPurchaseForView.orderStage || "Received & Stocked";
                        const stageObj =
                          PURCHASE_ORDER_STAGES.find((s) => s.id === currentStage) || {
                            color: "bg-emerald-100 text-emerald-800 border-emerald-300",
                            dot: "bg-emerald-600",
                          };
                        return (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1.5 ${stageObj.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stageObj.dot}`} />
                            <span>{currentStage}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Warehouse / Lab:</span>
                      <strong className="text-slate-800">{selectedPurchaseForView.warehouse || "Main Lab - Airoli / Navi Mumbai"}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-gray-200 sm:pl-4">
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
                      Vendor / Supplier Details
                    </span>
                    <div className="font-bold text-sm text-gray-900">
                      {selectedPurchaseForView.vendorName || "Unknown Vendor"}
                    </div>
                    {selectedPurchaseForView.vendorLocation && (
                      <div className="text-gray-600 text-[11px]">{selectedPurchaseForView.vendorLocation}</div>
                    )}
                    {selectedPurchaseForView.vendorGstin && (
                      <div className="text-gray-500 text-[11px] font-mono">
                        GSTIN: {selectedPurchaseForView.vendorGstin}
                      </div>
                    )}
                    <div className="text-gray-500 text-[11px] font-semibold flex items-center gap-2">
                      <span>
                        Place of Supply:{" "}
                        <span className="text-blue-700">
                          {selectedPurchaseForView.placeOfSupply ||
                            getGstPlaceOfSupply(
                              selectedPurchaseForView.vendorGstin,
                              selectedPurchaseForView.vendorLocation
                            )}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Items Grid */}
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-gray-700 border-b border-gray-200 text-[11px]">
                        <th className="p-2.5 text-center w-10">#</th>
                        <th className="p-2.5">Item &amp; Specifications</th>
                        <th className="p-2.5 w-24">Category</th>
                        <th className="p-2.5 text-center w-16">Qty</th>
                        <th className="p-2.5 text-right w-24">Rate (₹)</th>
                        <th className="p-2.5 text-center w-16">GST %</th>
                        <th className="p-2.5 text-right w-28">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selectedPurchaseForView.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-center font-bold text-gray-400">{idx + 1}</td>
                          <td className="p-2.5">
                            <strong className="text-gray-900 block">{it.itemName}</strong>
                            {it.description && <span className="text-gray-500 text-[11px]">{it.description}</span>}
                          </td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {it.category || "Equipment"}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {it.qty} {it.unit || "NOS"}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            ₹{Number(it.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center font-mono">
                            {it.taxRate !== undefined ? it.taxRate : 18}%
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-950">
                            ₹{Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Payment Installments History */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>💳 Payment Installments &amp; UTR Settlement History</span>
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        selectedPurchaseForView.paymentStatus === "Paid"
                          ? "bg-emerald-600 text-white"
                          : selectedPurchaseForView.paymentStatus === "Pending"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {selectedPurchaseForView.paymentStatus || "Paid"}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-gray-700 border-b border-gray-200 text-[11px]">
                          <th className="p-2 text-center w-12 border-r border-gray-200">#</th>
                          <th className="p-2 border-r border-gray-200">Payment Date</th>
                          <th className="p-2 border-r border-gray-200">Mode</th>
                          <th className="p-2 border-r border-gray-200">Transaction / UTR Ref</th>
                          <th className="p-2 text-right border-r border-gray-200">Installment Amount (₹)</th>
                          <th className="p-2 border-r border-gray-200">Stage / Notes</th>
                          <th className="p-2 text-center w-24">Clearance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {(Array.isArray(selectedPurchaseForView.payments) &&
                        selectedPurchaseForView.payments.length > 0
                          ? selectedPurchaseForView.payments
                          : [
                              {
                                installmentNo: 1,
                                paymentDate: selectedPurchaseForView.paymentDate,
                                paymentMode: selectedPurchaseForView.paymentMode || "UPI",
                                transactionRef: selectedPurchaseForView.transactionRef || "",
                                amount:
                                  selectedPurchaseForView.paidAmount !== undefined
                                    ? selectedPurchaseForView.paidAmount
                                    : selectedPurchaseForView.totalAmount || 0,
                                notes: selectedPurchaseForView.notes || "Full Payment Settlement",
                              },
                            ]
                        ).map((p, pIdx) => (
                          <tr key={pIdx} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-bold text-blue-900 border-r border-gray-200 bg-slate-50">
                              #{p.installmentNo || pIdx + 1}
                            </td>
                            <td className="p-2 font-medium border-r border-gray-200">
                              {toSafeLocaleDate(p.paymentDate, "-")}
                            </td>
                            <td className="p-2 border-r border-gray-200">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                {p.paymentMode || "UPI"}
                              </span>
                            </td>
                            <td className="p-2 font-mono border-r border-gray-200 text-[11px] text-gray-700">
                              {p.transactionRef || "-"}
                            </td>
                            <td className="p-2 text-right font-mono font-black text-emerald-800 border-r border-gray-200">
                              ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-gray-600 text-[11px] border-r border-gray-200">
                              {p.notes || "-"}
                            </td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Cleared ✅
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Totals Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
                    <div className="bg-slate-50 border border-gray-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-gray-500 font-bold block uppercase">Total Invoice Bill</span>
                      <strong className="text-sm font-mono text-gray-900">
                        ₹{Number(selectedPurchaseForView.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-emerald-700 font-bold block uppercase">Total Paid Across Installments</span>
                      <strong className="text-sm font-mono text-emerald-800">
                        ₹{Number(selectedPurchaseForView.paidAmount !== undefined ? selectedPurchaseForView.paidAmount : selectedPurchaseForView.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                      <span className="text-[10px] text-rose-700 font-bold block uppercase">Remaining Balance Due</span>
                      <strong className="text-sm font-mono text-rose-800">
                        ₹{Number(selectedPurchaseForView.dueAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 5. Inward Verification & Signatory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-300 pt-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-gray-700 block">Inward Verification &amp; Inspection:</span>
                    <p className="text-gray-500 text-[11px]">
                      Received &amp; physically verified by ARCL Inward Quality &amp; Warehouse Inspection.
                    </p>
                    <div className="pt-4 font-bold text-gray-800 text-[11px]">
                      Inward Desk Inspector Sign
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-bold text-gray-800 block">For ARCL INSTRUMENTS PRIVATE LIMITED</span>
                    <div className="py-2">
                      <span className="inline-block px-3 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                        NABL LAB &amp; STOCK VERIFIED • CC-4313
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-xs">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DATE-WISE EXCEL / CSV EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#021C57] to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30">
                  <FaFileExcel />
                </span>
                <div>
                  <h3 className="font-black text-sm tracking-wide">
                    Date-wise Purchase Register Export
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Download purchase records for selected dates to Excel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs bg-slate-50/60 max-h-[80vh] overflow-y-auto">
              {/* Quick Date Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ⚡ Quick Date Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "today", label: "Today (Aaj)" },
                    { id: "yesterday", label: "Yesterday (Kal)" },
                    { id: "last_7", label: "Last 7 Days" },
                    { id: "last_15", label: "Last 15 Days" },
                    { id: "this_month", label: "This Month" },
                    { id: "last_30", label: "Last 30 Days" },
                    { id: "this_fy", label: "FY 26-27" },
                    { id: "all", label: "All Records (Sabhi)" },
                  ].map((pr) => (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => applyExportPreset(pr.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        exportPreset === pr.id
                          ? "bg-[#021C57] text-white border-[#021C57] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range Selectors */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  📅 Custom Date Range (Tarikh Chunein):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      From Date (Kab Se):
                    </label>
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => {
                        setExportFromDate(e.target.value);
                        setExportPreset("custom");
                      }}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      To Date (Kab Tak):
                    </label>
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => {
                        setExportToDate(e.target.value);
                        setExportPreset("custom");
                      }}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Export Format:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat("xlsx")}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                      exportFormat === "xlsx"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaFileExcel className="text-emerald-600 text-lg shrink-0" />
                    <div>
                      <div className="text-xs font-black">Excel (.xlsx)</div>
                      <div className="text-[10px] text-slate-500 font-normal">GST 16-Col Sheet</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                      exportFormat === "csv"
                        ? "border-blue-500 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaDownload className="text-blue-600 text-lg shrink-0" />
                    <div>
                      <div className="text-xs font-black">CSV Spreadsheet</div>
                      <div className="text-[10px] text-slate-500 font-normal">Comma Separated</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Matched Count Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  exportFilteredPurchases.length > 0
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-black text-xs flex items-center gap-1.5">
                    {exportFilteredPurchases.length > 0 ? (
                      <>
                        <FaCheckCircle className="text-emerald-600" />
                        <span>{exportFilteredPurchases.length} Purchase Records Found</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-rose-600" />
                        <span>Is date range me koi record nahi mila</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {exportFromDate || exportToDate ? (
                      <span>
                        Range: <strong>{exportFromDate || "Beginning"}</strong> se{" "}
                        <strong>{exportToDate || "Till Date"}</strong>
                      </span>
                    ) : (
                      <span>Sabhi purchases download honge (All-Time)</span>
                    )}
                  </div>
                </div>
                {exportFilteredPurchases.length > 0 && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      Total Amount
                    </span>
                    <strong className="text-sm font-mono text-emerald-950">
                      ₹{exportTotalAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteExport(exportFormat)}
                disabled={isExportingPurchases || exportFilteredPurchases.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportFormat === "xlsx" ? <FaFileExcel /> : <FaDownload />}
                <span>
                  {isExportingPurchases
                    ? "Generating File..."
                    : `Download ${exportFormat === "xlsx" ? "Excel (.xlsx)" : "CSV"} (${exportFilteredPurchases.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
