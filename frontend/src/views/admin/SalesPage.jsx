"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  FaFileInvoiceDollar,
  FaClipboardList,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaTimes,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaDownload,
  FaShareAlt,
  FaPaperPlane,
  FaMoneyBillWave,
  FaCreditCard,
  FaChevronDown,
  FaChevronRight,
  FaUpload,
  FaSync,
  FaBuilding,
  FaBoxes,
  FaSlidersH,
  FaCheck,
  FaExclamationTriangle,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaImage,
  FaCamera,
  FaBox,
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  getSalesStatsApi,
  getSalesQuotationsApi,
  createSalesQuotationApi,
  updateSalesQuotationApi,
  deleteSalesQuotationApi,
  convertQuotationToSrfApi,
  getSalesSrfsApi,
  createSalesSrfApi,
  updateSalesSrfApi,
  updateSalesSrfPaymentApi,
  advanceSalesSrfStageApi,
  deleteSalesSrfApi,
  uploadSalesPoApi,
  deleteSalesPoApi,
  createCustomQuotationProductApi,
} from "../../api/salesApi.js";
import { getProducts, getAdminProducts } from "../../api/productApi.js";
import { getInventoryListApi } from "../../api/inventoryApi.js";
import { verifyGstApi } from "../../api/calibrationApi.js";
import { getBaseURL } from "../../api/axios.js";

// Standard ARCL Terms and Conditions
const DEFAULT_SALES_TERMS = [
  "Payment Terms: 100% advance or 30 days credit against approved PO.",
  "Prices: GST extra as applicable at current rates (18%).",
  "Delivery: Within 2-3 weeks from receipt of technically and commercially clear order.",
  "Validity: Quotation remains valid for 30 days from the date of issue.",
  "Warranty: 12 months comprehensive warranty against manufacturing defects from delivery date.",
  "Freight & Packaging: Extra at actuals unless explicitly agreed in writing.",
  "Jurisdiction: All disputes subject to Mumbai/Thane jurisdiction only.",
];

// Helper to convert number to Indian Currency Words (Exact 1:1 format like Calibration)
function numberToWords(num) {
  if (!num || isNaN(num) || Number(num) === 0) return "INR Zero Rupees Only.";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return "Overflow";
    const match = ("000000000" + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return "";
    let str = "";
    str += match[1] != 0 ? (a[Number(match[1])] || b[match[1][0]] + " " + a[match[1][1]]) + "Crore " : "";
    str += match[2] != 0 ? (a[Number(match[2])] || b[match[2][0]] + " " + a[match[2][1]]) + "Lakh " : "";
    str += match[3] != 0 ? (a[Number(match[3])] || b[match[3][0]] + " " + a[match[3][1]]) + "Thousand " : "";
    str += match[4] != 0 ? (a[Number(match[4])] || b[match[4][0]] + " " + a[match[4][1]]) + "Hundred " : "";
    str += match[5] != 0 ? ((str != "") ? "And " : "") + (a[Number(match[5])] || b[match[5][0]] + " " + a[match[5][1]]) : "";
    return str.trim();
  }

  const parts = Number(num).toFixed(2).split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : 0;

  let words = "INR " + inWords(integerPart);
  if (decimalPart > 0) {
    words += " And " + inWords(decimalPart) + " Paise";
  }
  return words + " Only.";
}

export default function SalesPage() {
  // Navigation Tabs: ONLY TWO tabs as requested
  const [activeTab, setActiveTab] = useState("quotations"); // 'quotations' or 'srf_orders'

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingQuotation, setSavingQuotation] = useState(false);
  const [savingSrf, setSavingSrf] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [uploadingPo, setUploadingPo] = useState(false);

  // Data States
  const [quotations, setQuotations] = useState([]);
  const [srfs, setSrfs] = useState([]);
  const [stats, setStats] = useState({
    quotations: { totalQuotations: 0, totalQuotedValuation: 0, approvedQuotations: 0 },
    srfs: { totalSrfs: 0, totalOrderValue: 0, totalPaid: 0, totalDue: 0, activeOrders: 0 },
  });
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Filters & Search
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("all");
  const [srfSearch, setSrfSearch] = useState("");
  const [srfStageFilter, setSrfStageFilter] = useState("all");
  const [srfPaymentFilter, setSrfPaymentFilter] = useState("all");

  // Date-wise Sales Export Modal States
  const [isSalesExportModalOpen, setIsSalesExportModalOpen] = useState(false);
  const [salesExportType, setSalesExportType] = useState("srf"); // 'srf' or 'quotations'
  const [salesExportPreset, setSalesExportPreset] = useState("all");
  const [salesExportFromDate, setSalesExportFromDate] = useState("");
  const [salesExportToDate, setSalesExportToDate] = useState("");
  const [salesExportFormat, setSalesExportFormat] = useState("xlsx");
  const [isExportingSales, setIsExportingSales] = useState(false);

  // Custom Product (Quotation Scope & Cloudinary) Modal States
  const [isCustomProductModalOpen, setIsCustomProductModalOpen] = useState(false);
  const [savingCustomProduct, setSavingCustomProduct] = useState(false);
  const [customProductTargetRowIdx, setCustomProductTargetRowIdx] = useState(null);
  const [customProductForm, setCustomProductForm] = useState({
    name: "",
    productCode: "",
    category: "General Laboratory Equipment",
    hsnCode: "9031",
    unit: "NOS",
    defaultRate: "",
    taxRate: 18,
    description: "",
    specifications: [""],
    imageFile: null,
    imagePreview: "",
  });

  // Expandable Rows States
  const [expandedSrfPaymentKeys, setExpandedSrfPaymentKeys] = useState(new Set());
  const [expandedQuotationKeys, setExpandedQuotationKeys] = useState(new Set());

  // Quotation Modal States
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [quotationForm, setQuotationForm] = useState({
    quotationNo: "",
    quotationDate: new Date().toISOString().split("T")[0],
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    placeOfSupply: "27-MAHARASHTRA",
    clientCompany: "",
    clientContactPerson: "",
    clientPhone: "",
    clientEmail: "",
    clientGst: "",
    clientAddress: "",
    billingAddress: "",
    shippingAddress: "",
    items: [
      {
        itemNo: 1,
        itemName: "",
        description: "",
        productImage: "",
        hsnSac: "998346",
        make: "ARCL",
        modelNo: "",
        qty: 1,
        qtyUnit: "NOS",
        rate: 0,
        taxRate: 18,
        amount: 0,
      },
    ],
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 0,
    terms: DEFAULT_SALES_TERMS,
    status: "Draft",
    remarks: "",
  });

  // SRF Modal States
  const [isSrfModalOpen, setIsSrfModalOpen] = useState(false);
  const [editingSrfId, setEditingSrfId] = useState(null);
  const [srfForm, setSrfForm] = useState({
    srfNo: "",
    dcNo: "",
    orderDate: new Date().toISOString().split("T")[0],
    challanDate: new Date().toISOString().split("T")[0],
    deliveryDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    clientCompany: "",
    clientContactPerson: "",
    clientPhone: "",
    clientEmail: "",
    clientGst: "",
    clientAddress: "",
    deliverySite: "",
    quotationRef: "",
    items: [
      {
        itemNo: 1,
        itemName: "",
        description: "",
        productImage: "",
        make: "ARCL",
        modelNo: "",
        serialNo: "",
        qty: 1,
        unit: "NOS",
        rate: 0,
        taxRate: 18,
        amount: 0,
      },
    ],
    commercialDocs: {
      totalAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      paymentMode: "UPI",
      paymentStatus: "Pending",
      transactionRef: "",
      payments: [],
    },
    stage: "Order Confirmed",
    remarks: "",
  });

  // SRF Payment & Installments Modal States
  const [isSrfPaymentModalOpen, setIsSrfPaymentModalOpen] = useState(false);
  const [srfPaymentTarget, setSrfPaymentTarget] = useState(null);
  const [srfPaymentForm, setSrfPaymentForm] = useState({
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    paymentStatus: "Pending",
    paymentMode: "UPI",
    transactionRef: "",
    payments: [],
  });

  // PO Document Upload & Preview States
  const poFileInputRef = useRef(null);
  const [targetPoSrf, setTargetPoSrf] = useState(null);
  const [isPoPreviewOpen, setIsPoPreviewOpen] = useState(false);
  const [poPreviewUrl, setPoPreviewUrl] = useState("");
  const [poPreviewFileName, setPoPreviewFileName] = useState("");

  // Document Viewer & Print Modal States
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null); // { type: 'quotation' | 'srf' | 'pi' | 'tax_invoice', data: ... }

  // Share Modal States (Email / WhatsApp)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState(null);

  // Auto-Suggest Product Search Dropdown States
  const [activeSuggestRow, setActiveSuggestRow] = useState(null); // { modalType: 'quotation' | 'srf', rowIndex: 0 }
  const [suggestQuery, setSuggestQuery] = useState("");

  // GST Verification States
  const [verifyingGst, setVerifyingGst] = useState(false);

  // ==========================================
  // INITIAL DATA FETCHING
  // ==========================================
  const fetchAllData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [statsRes, qRes, srfRes, prodRes, invRes] = await Promise.allSettled([
        getSalesStatsApi(),
        getSalesQuotationsApi(),
        getSalesSrfsApi(),
        getAdminProducts({ limit: 2000 }).catch(() => getProducts({ limit: 1000 })),
        getInventoryListApi({ limit: 1000 }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data?.data) {
        setStats(statsRes.value.data.data);
      }

      if (qRes.status === "fulfilled" && qRes.value?.data?.data?.quotations) {
        setQuotations(qRes.value.data.data.quotations);
      }

      if (srfRes.status === "fulfilled" && srfRes.value?.data?.data?.srfs) {
        setSrfs(srfRes.value.data.data.srfs);
      }

      // Merge website catalog and inventory products for auto-suggest with IMAGES
      const mergedProducts = [];
      const prodList = Array.isArray(prodRes.value?.data?.data)
        ? prodRes.value.data.data
        : (prodRes.value?.data?.data?.products || (Array.isArray(prodRes.value?.data) ? prodRes.value.data : []));

      if (prodRes.status === "fulfilled" && Array.isArray(prodList)) {
        prodList.forEach((p) => {
          const img = (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image || "");
          mergedProducts.push({
            name: p.title || p.name || "",
            sku: p.sku || p.productCode || "",
            price: p.price || p.salePrice || 0,
            category: p.category?.name || "Website Catalog",
            hsn: p.hsn || p.hsnCode || "998346",
            unit: "NOS",
            image: img,
          });
        });
      }

      const invList = Array.isArray(invRes.value?.data?.data?.items)
        ? invRes.value.data.data.items
        : (Array.isArray(invRes.value?.data?.data) ? invRes.value.data.data : []);

      if (invRes.status === "fulfilled" && Array.isArray(invList)) {
        invList.forEach((p) => {
          if (!mergedProducts.some((m) => m.name.toLowerCase() === (p.itemName || "").toLowerCase())) {
            mergedProducts.push({
              name: p.itemName || "",
              sku: p.sku || "",
              price: p.sellingPrice || p.unitCost || 0,
              category: p.category || "Inventory Stock",
              hsn: p.hsnSac || "998346",
              unit: p.unit || "NOS",
              image: p.image || p.imageUrl || "",
            });
          }
        });
      }
      setCatalogProducts(mergedProducts);
    } catch (err) {
      console.error("Failed to load sales portal data:", err);
      toast.error("Sales data load karne me samasya aayi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ==========================================
  // AUTO-SUGGESTION SEARCH LOGIC
  // ==========================================
  const filteredSuggestions = useMemo(() => {
    if (!suggestQuery || suggestQuery.trim().length < 1) return [];
    const q = suggestQuery.trim().toLowerCase();
    return catalogProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [suggestQuery, catalogProducts]);

  const handleSelectProductSuggestion = (prod, modalType, rowIndex) => {
    if (modalType === "quotation") {
      setQuotationForm((prev) => {
        const items = [...prev.items];
        const cur = items[rowIndex] || {};
        const rate = Number(prod.price) || cur.rate || 0;
        const qty = Number(cur.qty) || 1;
        const specs = Array.isArray(prod.specifications) && prod.specifications.length > 0
          ? prod.specifications
          : typeof prod.description === "string" && prod.description.includes("\n")
          ? prod.description.split("\n").map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
          : [];
        items[rowIndex] = {
          ...cur,
          itemName: prod.name,
          description: prod.description || (prod.category ? `Category: ${prod.category} • SKU: ${prod.sku}` : cur.description),
          specifications: specs,
          productImage: prod.image || cur.productImage || "",
          rate,
          qtyUnit: prod.unit || "NOS",
          hsnSac: prod.hsn || "998346",
          amount: qty * rate,
        };
        return { ...prev, items };
      });
    } else if (modalType === "srf") {
      setSrfForm((prev) => {
        const items = [...prev.items];
        const cur = items[rowIndex] || {};
        const rate = Number(prod.price) || cur.rate || 0;
        const qty = Number(cur.qty) || 1;
        items[rowIndex] = {
          ...cur,
          itemName: prod.name,
          description: prod.category ? `Category: ${prod.category} • SKU: ${prod.sku}` : cur.description,
          productImage: "", // Strictly no product image in SRF
          rate,
          unit: prod.unit || "NOS",
          amount: qty * rate,
        };
        return { ...prev, items };
      });
    }
    setActiveSuggestRow(null);
    setSuggestQuery("");
  };

  // Upload or attach image per line item (Normalizes to crisp standard JPEG for 100% PDFKit compatibility)
  const handleItemImageUpload = (rowIndex, modalType, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.warning("Image file must be less than 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUri = e.target?.result;
      if (!rawUri) return;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 800;
        let w = img.width || 600;
        let h = img.height || 600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUri = canvas.toDataURL("image/jpeg", 0.88);

        if (modalType === "quotation") {
          setQuotationForm((prev) => {
            const items = [...prev.items];
            items[rowIndex] = { ...items[rowIndex], productImage: dataUri };
            return { ...prev, items };
          });
        } else if (modalType === "srf") {
          setSrfForm((prev) => {
            const items = [...prev.items];
            items[rowIndex] = { ...items[rowIndex], productImage: dataUri };
            return { ...prev, items };
          });
        }
        toast.success("Product image attached successfully!");
      };
      img.onerror = () => {
        if (modalType === "quotation") {
          setQuotationForm((prev) => {
            const items = [...prev.items];
            items[rowIndex] = { ...items[rowIndex], productImage: rawUri };
            return { ...prev, items };
          });
        } else if (modalType === "srf") {
          setSrfForm((prev) => {
            const items = [...prev.items];
            items[rowIndex] = { ...items[rowIndex], productImage: rawUri };
            return { ...prev, items };
          });
        }
        toast.success("Product image attached successfully!");
      };
      img.src = rawUri;
    };
    reader.readAsDataURL(file);
  };

  // Open Custom Product Modal (Quotation Scope)
  const handleOpenCustomProductModal = (targetRowIdx = null) => {
    setCustomProductTargetRowIdx(targetRowIdx);
    const existingRow = targetRowIdx !== null ? quotationForm.items[targetRowIdx] : null;
    const initialSpecs = Array.isArray(existingRow?.specifications) && existingRow.specifications.length > 0
      ? existingRow.specifications
      : existingRow?.description && existingRow.description.includes("\n")
      ? existingRow.description.split("\n").map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
      : [""];

    setCustomProductForm({
      name: existingRow?.itemName || "",
      productCode: `ARCL-QT-${Date.now().toString().slice(-4)}`,
      category: "Civil Lab Equipment",
      hsnCode: existingRow?.hsnSac || "9031",
      unit: existingRow?.qtyUnit || "NOS",
      defaultRate: existingRow?.rate || "",
      taxRate: existingRow?.taxRate || 18,
      description: existingRow?.description || "",
      specifications: initialSpecs.length > 0 ? initialSpecs : [""],
      imageFile: null,
      imagePreview: existingRow?.productImage || "",
    });
    setIsCustomProductModalOpen(true);
  };

  const handleAddCustomProductSpec = () => {
    setCustomProductForm((prev) => ({
      ...prev,
      specifications: [...(prev.specifications || []), ""],
    }));
  };

  const handleCustomProductSpecChange = (index, value) => {
    setCustomProductForm((prev) => {
      const updated = [...(prev.specifications || [""])];
      updated[index] = value;
      return { ...prev, specifications: updated };
    });
  };

  const handleRemoveCustomProductSpec = (index) => {
    setCustomProductForm((prev) => {
      const updated = (prev.specifications || [""]).filter((_, i) => i !== index);
      return { ...prev, specifications: updated.length > 0 ? updated : [""] };
    });
  };

  // Save Custom Product to DB & Cloudinary
  const handleSaveCustomProduct = async () => {
    if (!customProductForm.name || !customProductForm.name.trim()) {
      toast.warning("Product ka naam dalna anivarya hai!");
      return;
    }
    setSavingCustomProduct(true);
    try {
      const validSpecs = (customProductForm.specifications || [])
        .map((s) => String(s || "").trim())
        .filter(Boolean);
      const fullDesc = validSpecs.length > 0
        ? validSpecs.map((s, idx) => `${idx + 1}. ${s}`).join("\n")
        : (customProductForm.description || "");

      const formData = new FormData();
      formData.append("name", customProductForm.name.trim());
      formData.append("productCode", customProductForm.productCode.trim());
      formData.append("category", customProductForm.category);
      formData.append("hsnCode", customProductForm.hsnCode.trim());
      formData.append("unit", customProductForm.unit || "NOS");
      formData.append("defaultRate", Number(customProductForm.defaultRate) || 0);
      formData.append("taxRate", Number(customProductForm.taxRate) || 18);
      formData.append("description", fullDesc);
      formData.append("specifications", JSON.stringify(validSpecs));

      if (customProductForm.imageFile) {
        formData.append("image", customProductForm.imageFile);
      } else if (customProductForm.imagePreview && customProductForm.imagePreview.startsWith("data:")) {
        formData.append("imageBase64", customProductForm.imagePreview);
      } else if (customProductForm.imagePreview && customProductForm.imagePreview.startsWith("http")) {
        formData.append("imageUrl", customProductForm.imagePreview);
      }

      const res = await createCustomQuotationProductApi(formData);
      const created = res?.data?.data || {
        name: customProductForm.name,
        sku: customProductForm.productCode,
        price: Number(customProductForm.defaultRate) || 0,
        category: customProductForm.category,
        hsn: customProductForm.hsnCode,
        unit: customProductForm.unit,
        image: customProductForm.imagePreview,
        taxRate: Number(customProductForm.taxRate) || 18,
        description: fullDesc,
        specifications: validSpecs,
      };

      // 1. Immediately append to catalogProducts so it appears in auto-suggestions
      setCatalogProducts((prev) => [
        {
          name: created.name,
          sku: created.sku,
          price: created.price,
          category: created.category,
          hsn: created.hsn,
          unit: created.unit,
          image: created.image,
          specifications: validSpecs,
        },
        ...prev.filter((p) => p.name.toLowerCase() !== created.name.toLowerCase()),
      ]);

      // 2. Insert into quotationForm items
      const rate = Number(created.price) || 0;
      const taxRate = Number(created.taxRate) !== undefined ? Number(created.taxRate) : 18;
      const hsnSac = created.hsn || "9031";
      const qtyUnit = created.unit || "NOS";
      const productImage = created.image || "";
      const description = fullDesc || created.description || `Category: ${created.category || "Custom Scope"} • Code: ${created.sku || ""}`;

      setQuotationForm((prev) => {
        const items = [...prev.items];
        if (customProductTargetRowIdx !== null && items[customProductTargetRowIdx]) {
          const cur = items[customProductTargetRowIdx];
          const qty = Number(cur.qty) || 1;
          const lineTaxable = qty * rate;
          const lineTax = lineTaxable * (taxRate / 100);
          const amount = Math.round((lineTaxable + lineTax) * 100) / 100;
          items[customProductTargetRowIdx] = {
            ...cur,
            itemName: created.name,
            productImage,
            rate,
            qtyUnit,
            hsnSac,
            taxRate,
            description,
            specifications: validSpecs,
            amount,
          };
        } else {
          const qty = 1;
          const lineTaxable = qty * rate;
          const lineTax = lineTaxable * (taxRate / 100);
          const amount = Math.round((lineTaxable + lineTax) * 100) / 100;
          items.push({
            itemName: created.name,
            description,
            specifications: validSpecs,
            productImage,
            hsnSac,
            qty,
            qtyUnit,
            rate,
            taxRate,
            amount,
          });
        }

        // Recalculate quotation totals
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

        return {
          ...prev,
          items,
          taxableAmount: Math.round(subtotal * 100) / 100,
          taxAmount: Math.round(taxAmount * 100) / 100,
          totalAmount,
        };
      });

      setIsCustomProductModalOpen(false);
      toast.success(`"${created.name}" Cloudinary pe upload ho gaya aur quotation me add ho gaya!`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save custom product");
    } finally {
      setSavingCustomProduct(false);
    }
  };

  // ==========================================
  // GSTIN VERIFICATION & AUTO-FILL
  // ==========================================
  const handleVerifyGst = async (gstin, targetFormType) => {
    const rawGst = String(gstin || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!rawGst || rawGst.length !== 15) {
      toast.warning("Please enter a valid 15-digit GSTIN!");
      return;
    }
    try {
      setVerifyingGst(true);
      const res = await verifyGstApi(rawGst);
      const payload = res?.data?.data || res?.data;
      if (res?.data?.success && payload) {
        const companyName = payload.companyName || payload.tradeName || payload.legalName || "";
        const address = payload.addr || payload.address?.line1 || (typeof payload.address === "string" ? payload.address : "");
        const cityStatePin = `${payload.city || ""}, ${payload.state || ""}, ${payload.pincode || ""}`.replace(/^, |, $/g, "");
        const fullAddr = address ? (cityStatePin && !address.includes(payload.pincode) ? `${address}\n${cityStatePin}` : address) : cityStatePin;
        const finalGst = payload.gstin || rawGst;

        if (targetFormType === "quotation") {
          setQuotationForm((prev) => ({
            ...prev,
            clientGst: finalGst,
            clientCompany: companyName || prev.clientCompany,
            clientAddress: fullAddr || address || prev.clientAddress,
            billingAddress: fullAddr || address || prev.billingAddress,
            placeOfSupply: payload.stateCode ? `${payload.stateCode}-${(payload.stateName || payload.state || "MAHARASHTRA").toUpperCase()}` : prev.placeOfSupply,
          }));
        } else if (targetFormType === "srf") {
          setSrfForm((prev) => ({
            ...prev,
            clientGst: finalGst,
            clientCompany: companyName || prev.clientCompany,
            clientAddress: fullAddr || address || prev.clientAddress,
            deliverySite: fullAddr || address || prev.deliverySite,
          }));
        }
        toast.success(`GSTIN Verified: ${companyName || "Client Verified"}`);
      } else {
        toast.info(res?.data?.error || "GSTIN format valid hai. Details manually enter kar sakte hain.");
      }
    } catch (err) {
      console.warn("GST verification notice:", err);
      toast.info("GSTIN formatted successfully.");
    } finally {
      setVerifyingGst(false);
    }
  };

  // ==========================================
  // QUOTATION TOTALS RECALCULATION
  // ==========================================
  const quotationTotals = useMemo(() => {
    let taxable = 0;
    (quotationForm.items || []).forEach((it) => {
      const q = parseFloat(it.qty) || 1;
      const r = parseFloat(it.rate) || 0;
      taxable += q * r;
    });

    const cgstRate = parseFloat(quotationForm.cgstRate ?? 9);
    const sgstRate = parseFloat(quotationForm.sgstRate ?? 9);
    const igstRate = parseFloat(quotationForm.igstRate ?? 0);

    const cgst = Math.round(((taxable * cgstRate) / 100) * 100) / 100;
    const sgst = Math.round(((taxable * sgstRate) / 100) * 100) / 100;
    const igst = Math.round(((taxable * igstRate) / 100) * 100) / 100;
    const rawTotal = taxable + cgst + sgst + igst;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;

    return { taxable, cgst, sgst, igst, grandTotal, roundOff };
  }, [quotationForm.items, quotationForm.cgstRate, quotationForm.sgstRate, quotationForm.igstRate]);

  // Dynamic Item Handlers for Quotation
  const handleAddQuotationItem = () => {
    setQuotationForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemNo: prev.items.length + 1,
          itemName: "",
          description: "",
          specifications: [],
          productImage: "",
          hsnSac: "998346",
          make: "ARCL",
          modelNo: "",
          qty: 1,
          qtyUnit: "NOS",
          rate: 0,
          taxRate: 18,
          amount: 0,
        },
      ],
    }));
  };

  const handleQuotationItemChange = (index, field, value) => {
    setQuotationForm((prev) => {
      const items = [...prev.items];
      const cur = { ...items[index], [field]: value };
      if (field === "qty" || field === "rate") {
        const q = parseFloat(field === "qty" ? value : cur.qty) || 0;
        const r = parseFloat(field === "rate" ? value : cur.rate) || 0;
        cur.amount = q * r;
      }
      items[index] = cur;
      return { ...prev, items };
    });
  };

  const handleRemoveQuotationItem = (index) => {
    setQuotationForm((prev) => {
      if (prev.items.length <= 1) {
        toast.warning("Kam se kam ek item quotation me hona zaroori hai.");
        return prev;
      }
      const items = prev.items.filter((_, idx) => idx !== index).map((it, idx) => ({ ...it, itemNo: idx + 1 }));
      return { ...prev, items };
    });
  };

  // Numbered Specification Handlers for Quotation Line Items
  const handleAddQuotationItemSpec = (itemIdx) => {
    setQuotationForm((prev) => {
      const items = [...prev.items];
      const cur = items[itemIdx];
      const specs = Array.isArray(cur.specifications) ? [...cur.specifications, ""] : [""];
      items[itemIdx] = { ...cur, specifications: specs };
      return { ...prev, items };
    });
  };

  const handleQuotationItemSpecChange = (itemIdx, specIdx, value) => {
    setQuotationForm((prev) => {
      const items = [...prev.items];
      const cur = items[itemIdx];
      const specs = Array.isArray(cur.specifications) ? [...cur.specifications] : [];
      specs[specIdx] = value;
      const validSpecs = specs.map((s) => String(s || "").trim()).filter(Boolean);
      const desc = validSpecs.length > 0
        ? validSpecs.map((s, idx) => `${idx + 1}. ${s}`).join("\n")
        : cur.description;
      items[itemIdx] = { ...cur, specifications: specs, description: desc };
      return { ...prev, items };
    });
  };

  const handleRemoveQuotationItemSpec = (itemIdx, specIdx) => {
    setQuotationForm((prev) => {
      const items = [...prev.items];
      const cur = items[itemIdx];
      const specs = (Array.isArray(cur.specifications) ? cur.specifications : []).filter((_, i) => i !== specIdx);
      const validSpecs = specs.map((s) => String(s || "").trim()).filter(Boolean);
      const desc = validSpecs.length > 0
        ? validSpecs.map((s, idx) => `${idx + 1}. ${s}`).join("\n")
        : "";
      items[itemIdx] = { ...cur, specifications: specs, description: desc };
      return { ...prev, items };
    });
  };

  // Dynamic Terms Handlers
  const handleAddQuotationTerm = () => {
    setQuotationForm((prev) => ({
      ...prev,
      terms: [...prev.terms, ""],
    }));
  };

  const handleQuotationTermChange = (index, value) => {
    setQuotationForm((prev) => {
      const terms = [...prev.terms];
      terms[index] = value;
      return { ...prev, terms };
    });
  };

  const handleRemoveQuotationTerm = (index) => {
    setQuotationForm((prev) => {
      const terms = prev.terms.filter((_, idx) => idx !== index);
      return { ...prev, terms: terms.length > 0 ? terms : [""] };
    });
  };

  // Open Quotation Editor Modal
  const handleOpenQuotationModal = (q = null) => {
    if (q) {
      setEditingQuotationId(q._id);
      setQuotationForm({
        quotationNo: q.quotationNo || "",
        quotationDate: q.quotationDate ? new Date(q.quotationDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        validityDate: q.validityDate ? new Date(q.validityDate).toISOString().split("T")[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        placeOfSupply: q.placeOfSupply || "27-MAHARASHTRA",
        clientCompany: q.clientCompany || "",
        clientContactPerson: q.clientContactPerson || "",
        clientPhone: q.clientPhone || "",
        clientEmail: q.clientEmail || "",
        clientGst: q.clientGst || "",
        clientAddress: q.clientAddress || "",
        billingAddress: q.billingAddress || q.clientAddress || "",
        shippingAddress: q.shippingAddress || q.clientAddress || "",
        items: Array.isArray(q.items) && q.items.length > 0 ? q.items.map((it, idx) => ({
          ...it,
          itemNo: it.itemNo || idx + 1,
          productImage: it.productImage || "",
          specifications: Array.isArray(it.specifications) && it.specifications.length > 0
            ? it.specifications
            : typeof it.description === "string" && it.description.includes("\n")
            ? it.description.split("\n").map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
            : it.description ? [it.description] : [],
        })) : [
          {
            itemNo: 1,
            itemName: "",
            description: "",
            specifications: [],
            productImage: "",
            hsnSac: "998346",
            make: "ARCL",
            modelNo: "",
            qty: 1,
            qtyUnit: "NOS",
            rate: 0,
            taxRate: 18,
            amount: 0,
          },
        ],
        cgstRate: q.cgstRate ?? 9,
        sgstRate: q.sgstRate ?? 9,
        igstRate: q.igstRate ?? 0,
        terms: Array.isArray(q.terms) && q.terms.length > 0 ? q.terms : DEFAULT_SALES_TERMS,
        status: q.status || "Draft",
        remarks: q.remarks || "",
      });
    } else {
      setEditingQuotationId(null);
      const count = quotations.length;
      const seq = String(count + 1).padStart(2, "0");
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);
      setQuotationForm({
        quotationNo: `ARCL/SQ/${currentYear}-${nextYear}/${seq}`,
        quotationDate: new Date().toISOString().split("T")[0],
        validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        placeOfSupply: "27-MAHARASHTRA",
        clientCompany: "",
        clientContactPerson: "",
        clientPhone: "",
        clientEmail: "",
        clientGst: "",
        clientAddress: "",
        billingAddress: "",
        shippingAddress: "",
        items: [
          {
            itemNo: 1,
            itemName: "Flexural Testing Machine - Digital",
            description: "1. High accuracy engineering test equipment with NABL traceability\n2. Capacity: 100 kN digital load indicator\n3. Rugged 4-pillar construction",
            specifications: [
              "High accuracy engineering test equipment with NABL traceability",
              "Capacity: 100 kN digital load indicator",
              "Rugged 4-pillar construction"
            ],
            productImage: "https://res.cloudinary.com/o6abs2b4/image/upload/v1789810932/products/retbowdyghdn8x2e1c8e.jpg",
            hsnSac: "998346",
            make: "ARCL",
            modelNo: "ARCL-FTM-100",
            qty: 1,
            qtyUnit: "NOS",
            rate: 65000,
            taxRate: 18,
            amount: 65000,
          },
        ],
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        terms: DEFAULT_SALES_TERMS,
        status: "Draft",
        remarks: "",
      });
    }
    setIsQuotationModalOpen(true);
  };

  // Save Quotation Handler
  const handleSaveQuotation = async (e) => {
    e.preventDefault();
    if (!quotationForm.clientCompany.trim()) {
      toast.warning("Please enter Customer / Client Company Name!");
      return;
    }
    if (!quotationForm.items || quotationForm.items.length === 0) {
      toast.warning("Quotation me kam se kam ek product line item hona zaroori hai.");
      return;
    }

    try {
      setSavingQuotation(true);
      const payload = {
        ...quotationForm,
        taxableAmount: quotationTotals.taxable,
        cgstAmount: quotationTotals.cgst,
        sgstAmount: quotationTotals.sgst,
        igstAmount: quotationTotals.igst,
        roundOff: quotationTotals.roundOff,
        totalAmount: quotationTotals.grandTotal,
      };

      if (editingQuotationId) {
        const res = await updateSalesQuotationApi(editingQuotationId, payload);
        if (res.data?.success) {
          toast.success("Sales Quotation safalta-purvak update ho gaya!");
          setIsQuotationModalOpen(false);
          fetchAllData(true);
        }
      } else {
        const res = await createSalesQuotationApi(payload);
        if (res.data?.success) {
          toast.success("Naya Sales Quotation safalta-purvak create ho gaya!");
          setIsQuotationModalOpen(false);
          fetchAllData(true);
        }
      }
    } catch (err) {
      console.error("Failed to save quotation:", err);
      toast.error(err.response?.data?.message || "Quotation save karne me error aayi.");
    } finally {
      setSavingQuotation(false);
    }
  };

  // Delete Quotation Handler
  const handleDeleteQuotation = async (q) => {
    if (!window.confirm(`Kya aap Quotation "${q.quotationNo}" (${q.clientCompany}) delete karna chahte hain?`)) {
      return;
    }
    try {
      const res = await deleteSalesQuotationApi(q._id);
      if (res.data?.success) {
        toast.success(`Quotation "${q.quotationNo}" delete ho gaya.`);
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to delete quotation:", err);
      toast.error("Quotation delete nahi ho paya.");
    }
  };

  // 1-Click Convert Quotation to SRF Order
  const handleConvertQuotationToSrf = async (q) => {
    if (!window.confirm(`Kya aap Quotation "${q.quotationNo}" ko active SRF & Sales Order me convert karna chahte hain?`)) {
      return;
    }
    try {
      const res = await convertQuotationToSrfApi(q._id);
      if (res.data?.success) {
        toast.success(`Quotation convert ho gaya! SRF Number: ${res.data.data?.srfNo || "Generated"}`);
        setActiveTab("srf_orders");
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to convert quotation to SRF:", err);
      toast.error("Quotation convert karne me error aayi.");
    }
  };

  // ==========================================
  // SRF & COMMERCIAL ORDERS LOGIC
  // ==========================================

  // Dynamic Item Handlers for SRF
  const handleAddSrfItem = () => {
    setSrfForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemNo: prev.items.length + 1,
          itemName: "",
          description: "",
          productImage: "",
          make: "ARCL",
          modelNo: "",
          serialNo: "",
          qty: 1,
          unit: "NOS",
          rate: 0,
          taxRate: 18,
          amount: 0,
        },
      ],
    }));
  };

  const handleSrfItemChange = (index, field, value) => {
    setSrfForm((prev) => {
      const items = [...prev.items];
      const cur = { ...items[index], [field]: value };
      if (field === "qty" || field === "rate") {
        const q = parseFloat(field === "qty" ? value : cur.qty) || 0;
        const r = parseFloat(field === "rate" ? value : cur.rate) || 0;
        cur.amount = q * r;
      }
      items[index] = cur;

      // Auto update total
      let calcTotal = 0;
      items.forEach((it) => {
        const amt = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
        calcTotal += amt + Math.round(amt * 0.18);
      });

      return {
        ...prev,
        items,
        commercialDocs: {
          ...prev.commercialDocs,
          totalAmount: Math.round(calcTotal),
          dueAmount: Math.max(0, Math.round(calcTotal) - (prev.commercialDocs.paidAmount || 0)),
        },
      };
    });
  };

  const handleRemoveSrfItem = (index) => {
    setSrfForm((prev) => {
      if (prev.items.length <= 1) {
        toast.warning("Kam se kam ek product item hona zaroori hai.");
        return prev;
      }
      const items = prev.items.filter((_, idx) => idx !== index).map((it, idx) => ({ ...it, itemNo: idx + 1 }));
      return { ...prev, items };
    });
  };

  // Open SRF Modal
  const handleOpenSrfModal = (srf = null) => {
    if (srf) {
      setEditingSrfId(srf._id);
      setSrfForm({
        srfNo: srf.srfNo || "",
        dcNo: srf.dcNo || "",
        orderDate: srf.orderDate ? new Date(srf.orderDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        challanDate: srf.challanDate ? new Date(srf.challanDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        deliveryDueDate: srf.deliveryDueDate ? new Date(srf.deliveryDueDate).toISOString().split("T")[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        clientCompany: srf.clientCompany || "",
        clientContactPerson: srf.clientContactPerson || "",
        clientPhone: srf.clientPhone || "",
        clientEmail: srf.clientEmail || "",
        clientGst: srf.clientGst || "",
        clientAddress: srf.clientAddress || "",
        deliverySite: srf.deliverySite || srf.clientAddress || "",
        quotationRef: srf.quotationRef || "",
        items: Array.isArray(srf.items) && srf.items.length > 0 ? srf.items.map((it, idx) => ({
          ...it,
          itemNo: it.itemNo || idx + 1,
          productImage: "",
        })) : [
          {
            itemNo: 1,
            itemName: "",
            description: "",
            productImage: "",
            make: "ARCL",
            modelNo: "",
            serialNo: "",
            qty: 1,
            unit: "NOS",
            rate: 0,
            taxRate: 18,
            amount: 0,
          },
        ],
        commercialDocs: srf.commercialDocs || {
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          paymentMode: "UPI",
          paymentStatus: "Pending",
          transactionRef: "",
          payments: [],
        },
        stage: srf.stage || "Order Confirmed",
        remarks: srf.remarks || "",
      });
    } else {
      setEditingSrfId(null);
      const count = srfs.length;
      const seq = String(count + 1).padStart(2, "0");
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);
      setSrfForm({
        srfNo: `SRF/SLS/${currentYear}-${nextYear}/${seq}`,
        dcNo: `DC/SLS/${currentYear}-${nextYear}/${seq}`,
        orderDate: new Date().toISOString().split("T")[0],
        challanDate: new Date().toISOString().split("T")[0],
        deliveryDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        clientCompany: "",
        clientContactPerson: "",
        clientPhone: "",
        clientEmail: "",
        clientGst: "",
        clientAddress: "",
        deliverySite: "",
        quotationRef: "",
        items: [
          {
            itemNo: 1,
            itemName: "Flexural Testing Machine - Digital",
            description: "Industrial grade supply with complete calibration & testing",
            productImage: "",
            make: "ARCL",
            modelNo: "ARCL-MOD-01",
            serialNo: "SN-2026-001",
            qty: 1,
            unit: "NOS",
            rate: 65000,
            taxRate: 18,
            amount: 65000,
          },
        ],
        commercialDocs: {
          totalAmount: 76700,
          paidAmount: 0,
          dueAmount: 76700,
          paymentMode: "UPI",
          paymentStatus: "Pending",
          transactionRef: "",
          payments: [],
        },
        stage: "Order Confirmed",
        remarks: "",
      });
    }
    setIsSrfModalOpen(true);
  };

  // Save SRF Handler
  const handleSaveSrf = async (e) => {
    e.preventDefault();
    if (!srfForm.clientCompany.trim()) {
      toast.warning("Please enter Customer Company!");
      return;
    }
    if (!srfForm.items || srfForm.items.length === 0) {
      toast.warning("SRF order me kam se kam ek product line item hona zaroori hai.");
      return;
    }

    try {
      setSavingSrf(true);
      if (editingSrfId) {
        const res = await updateSalesSrfApi(editingSrfId, srfForm);
        if (res.data?.success) {
          toast.success("Sales SRF Order safalta-purvak update ho gaya!");
          setIsSrfModalOpen(false);
          fetchAllData(true);
        }
      } else {
        const res = await createSalesSrfApi(srfForm);
        if (res.data?.success) {
          toast.success("Naya Sales SRF Order create ho gaya!");
          setIsSrfModalOpen(false);
          fetchAllData(true);
        }
      }
    } catch (err) {
      console.error("Failed to save SRF:", err);
      toast.error(err.response?.data?.message || "SRF save karne me error aayi.");
    } finally {
      setSavingSrf(false);
    }
  };

  // Delete SRF Handler
  const handleDeleteSrf = async (srf) => {
    if (!window.confirm(`Kya aap SRF Order "${srf.srfNo}" (${srf.clientCompany}) delete karna chahte hain?`)) {
      return;
    }
    try {
      const res = await deleteSalesSrfApi(srf._id);
      if (res.data?.success) {
        toast.success(`SRF Order "${srf.srfNo}" delete ho gaya.`);
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to delete SRF:", err);
      toast.error("SRF delete nahi ho paya.");
    }
  };

  // Advance Order Stage (1-Click)
  const handleAdvanceStage = async (srf) => {
    try {
      const res = await advanceSalesSrfStageApi(srf._id);
      if (res.data?.success) {
        toast.success(`Order stage upgraded to: ${res.data.data?.stage}`);
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to advance stage:", err);
      toast.error("Stage update karne me error aayi.");
    }
  };

  // ==========================================
  // PAYMENT & INSTALLMENTS MODAL LOGIC (Exact Same as SRF & Purchasing)
  // ==========================================
  const handleOpenSrfPaymentModal = (srf) => {
    setSrfPaymentTarget(srf);
    const docs = srf.commercialDocs || {};
    const total = Number(docs.totalAmount || 0);
    const paid = Number(docs.paidAmount || 0);
    const due = Number(docs.dueAmount !== undefined ? docs.dueAmount : Math.max(0, total - paid));
    const rawPayments = Array.isArray(docs.payments) && docs.payments.length > 0 ? docs.payments : [];

    const payments = rawPayments.length > 0
      ? rawPayments
      : paid > 0
      ? [
          {
            installmentNo: 1,
            amount: paid,
            paymentDate: docs.paymentDate ? new Date(docs.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            paymentMode: docs.paymentMode || "UPI",
            transactionRef: docs.transactionRef || "",
            notes: "Initial Down Payment / Clearance",
          },
        ]
      : [];

    setSrfPaymentForm({
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus: docs.paymentStatus || (due <= 0 && total > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending"),
      paymentMode: docs.paymentMode || "UPI",
      transactionRef: docs.transactionRef || "",
      payments,
    });
    setIsSrfPaymentModalOpen(true);
  };

  const handleAddPaymentInstallment = () => {
    setSrfPaymentForm((prev) => {
      const remaining = Math.max(0, prev.dueAmount);
      const newInst = {
        installmentNo: prev.payments.length + 1,
        amount: remaining,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: prev.paymentMode || "UPI",
        transactionRef: "",
        notes: `Installment #${prev.payments.length + 1}`,
      };
      const payments = [...prev.payments, newInst];
      const paid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const due = Math.max(0, prev.totalAmount - paid);
      const status = due <= 0 && prev.totalAmount > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
      return { ...prev, payments, paidAmount: paid, dueAmount: due, paymentStatus: status };
    });
  };

  const handleInstallmentChange = (index, field, value) => {
    setSrfPaymentForm((prev) => {
      const payments = [...prev.payments];
      payments[index] = { ...payments[index], [field]: value };
      const paid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const due = Math.max(0, prev.totalAmount - paid);
      const status = due <= 0 && prev.totalAmount > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
      return { ...prev, payments, paidAmount: paid, dueAmount: due, paymentStatus: status };
    });
  };

  const handleRemovePaymentInstallment = (index) => {
    setSrfPaymentForm((prev) => {
      const payments = prev.payments.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, installmentNo: idx + 1 }));
      const paid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const due = Math.max(0, prev.totalAmount - paid);
      const status = due <= 0 && prev.totalAmount > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
      return { ...prev, payments, paidAmount: paid, dueAmount: due, paymentStatus: status };
    });
  };

  const handleClearRemainingDue = () => {
    setSrfPaymentForm((prev) => {
      if (prev.dueAmount <= 0) {
        toast.info("Koi remaining due balance nahi hai (100% Cleared)!");
        return prev;
      }
      const settleAmount = prev.dueAmount;
      const settleInst = {
        installmentNo: prev.payments.length + 1,
        amount: settleAmount,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: prev.paymentMode || "UPI",
        transactionRef: `CLR-${Date.now().toString().slice(-6)}`,
        notes: "Full Balance Final Settlement (100% Cleared)",
      };
      const payments = [...prev.payments, settleInst];
      return {
        ...prev,
        payments,
        paidAmount: prev.totalAmount,
        dueAmount: 0,
        paymentStatus: "Paid",
      };
    });
    toast.success("Remaining due balance settled! Marked as 100% PAID.");
  };

  const handleSaveSrfPayment = async () => {
    if (!srfPaymentTarget) return;
    try {
      setSavingPayment(true);
      const res = await updateSalesSrfPaymentApi(srfPaymentTarget._id, srfPaymentForm);
      if (res.data?.success) {
        toast.success("Payment details aur installments ledger update ho gaye!");
        setIsSrfPaymentModalOpen(false);
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to update payment installments:", err);
      toast.error(err.response?.data?.message || "Payment update karne me error aayi.");
    } finally {
      setSavingPayment(false);
    }
  };

  // Toggle Installment Ledger Sub-Row
  const toggleExpandSrfPayment = (key) => {
    setExpandedSrfPaymentKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ==========================================
  // PO DOCUMENT UPLOAD & PREVIEW LOGIC
  // ==========================================
  const handleTriggerPoUpload = (srf) => {
    setTargetPoSrf(srf);
    if (poFileInputRef.current) {
      poFileInputRef.current.value = "";
      poFileInputRef.current.click();
    }
  };

  const handlePoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetPoSrf) return;

    const formData = new FormData();
    formData.append("poFile", file);
    formData.append("srfId", targetPoSrf._id);

    try {
      setUploadingPo(true);
      const res = await uploadSalesPoApi(formData);
      if (res.data?.success) {
        toast.success(`PO Document "${file.name}" safalta-purvak upload ho gaya!`);
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to upload PO:", err);
      toast.error("PO upload karne me samasya aayi.");
    } finally {
      setUploadingPo(false);
      setTargetPoSrf(null);
    }
  };

  const handleDeletePoFile = async (srf) => {
    if (!window.confirm(`Kya aap is SRF ka uploaded PO document delete karna chahte hain?`)) return;
    try {
      const res = await deleteSalesPoApi({ srfId: srf._id });
      if (res.data?.success) {
        toast.success("PO Document delete ho gaya.");
        fetchAllData(true);
      }
    } catch (err) {
      console.error("Failed to delete PO:", err);
      toast.error("PO delete nahi ho paya.");
    }
  };

  const handleViewPo = (srf) => {
    const url = srf.commercialDocs?.poFileUrl;
    if (!url) {
      toast.warning("Is SRF me koi PO attached nahi hai.");
      return;
    }
    setPoPreviewUrl(url);
    setPoPreviewFileName(srf.commercialDocs?.poFileName || "Sales_Purchase_Order.pdf");
    setIsPoPreviewOpen(true);
  };

  // ==========================================
  // DOCUMENT VIEWER & SHARING
  // ==========================================
  const openDocViewer = (type, data) => {
    setSelectedDoc({ type, data });
    setIsDocViewerOpen(true);
  };

  const handleOpenShareModal = (type, data) => {
    setShareData({ type, data });
    setIsShareModalOpen(true);
  };

  // ==========================================
  // DIRECT 1:1 BINARY PDF PRINT & DOWNLOAD
  // ==========================================
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

  const handlePrintQuotation = (q) => {
    if (!q?._id) return;
    const base = getBaseURL() || "http://localhost:5000/api/v1";
    handlePrintPdf(`${base}/admin/sales/quotations/${q._id}/download-pdf?t=${Date.now()}`);
  };

  const handleDownloadQuotation = (q) => {
    if (!q?._id) return;
    const base = getBaseURL() || "http://localhost:5000/api/v1";
    window.open(`${base}/admin/sales/quotations/${q._id}/download-pdf?download=true&t=${Date.now()}`, "_blank");
  };

  const handlePrintSrfDoc = (srf, docType = "srf") => {
    if (!srf?._id) return;
    const base = getBaseURL() || "http://localhost:5000/api/v1";
    handlePrintPdf(`${base}/admin/sales/srfs/${srf._id}/download-pdf?docType=${docType}&t=${Date.now()}`);
  };

  const handleDownloadSrfDoc = (srf, docType = "srf") => {
    if (!srf?._id) return;
    const base = getBaseURL() || "http://localhost:5000/api/v1";
    window.open(`${base}/admin/sales/srfs/${srf._id}/download-pdf?docType=${docType}&download=true&t=${Date.now()}`, "_blank");
  };

  // ==========================================
  // DATE-WISE SALES EXPORT LOGIC
  // ==========================================
  const handleOpenSalesExportModal = (type = "srf") => {
    setSalesExportType(type);
    setSalesExportPreset("all");
    setSalesExportFromDate("");
    setSalesExportToDate("");
    setSalesExportFormat("xlsx");
    setIsSalesExportModalOpen(true);
  };

  const applySalesExportPreset = (preset) => {
    setSalesExportPreset(preset);
    const now = new Date();
    const toDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setSalesExportFromDate("");
      setSalesExportToDate("");
      return;
    }
    if (preset === "today") {
      const s = toDateStr(now);
      setSalesExportFromDate(s);
      setSalesExportToDate(s);
      return;
    }
    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = toDateStr(y);
      setSalesExportFromDate(s);
      setSalesExportToDate(s);
      return;
    }
    if (preset === "last_7") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setSalesExportFromDate(toDateStr(past));
      setSalesExportToDate(toDateStr(now));
      return;
    }
    if (preset === "last_15") {
      const past = new Date(now);
      past.setDate(past.getDate() - 14);
      setSalesExportFromDate(toDateStr(past));
      setSalesExportToDate(toDateStr(now));
      return;
    }
    if (preset === "this_month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setSalesExportFromDate(toDateStr(first));
      setSalesExportToDate(toDateStr(last));
      return;
    }
    if (preset === "last_30") {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      setSalesExportFromDate(toDateStr(past));
      setSalesExportToDate(toDateStr(now));
      return;
    }
    if (preset === "this_fy") {
      const curYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? curYear : curYear - 1;
      const start = new Date(fyStartYear, 3, 1);
      const end = new Date(fyStartYear + 1, 2, 31);
      setSalesExportFromDate(toDateStr(start));
      setSalesExportToDate(toDateStr(end));
      return;
    }
  };

  const exportFilteredSrfs = useMemo(() => {
    return srfs.filter((s) => {
      const dateVal = s.orderDate || s.challanDate || s.createdAt;
      if (!dateVal) return true;
      const d = new Date(dateVal);
      if (salesExportFromDate) {
        const fromD = new Date(salesExportFromDate);
        fromD.setHours(0, 0, 0, 0);
        if (d < fromD) return false;
      }
      if (salesExportToDate) {
        const toD = new Date(salesExportToDate);
        toD.setHours(23, 59, 59, 999);
        if (d > toD) return false;
      }
      return true;
    });
  }, [srfs, salesExportFromDate, salesExportToDate]);

  const exportFilteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const dateVal = q.quotationDate || q.createdAt;
      if (!dateVal) return true;
      const d = new Date(dateVal);
      if (salesExportFromDate) {
        const fromD = new Date(salesExportFromDate);
        fromD.setHours(0, 0, 0, 0);
        if (d < fromD) return false;
      }
      if (salesExportToDate) {
        const toD = new Date(salesExportToDate);
        toD.setHours(23, 59, 59, 999);
        if (d > toD) return false;
      }
      return true;
    });
  }, [quotations, salesExportFromDate, salesExportToDate]);

  const handleExecuteSalesExport = (format = salesExportFormat) => {
    const isSrf = salesExportType === "srf";
    const dataList = isSrf ? exportFilteredSrfs : exportFilteredQuotations;
    if (dataList.length === 0) {
      toast.warning(`Chune gaye date range me koi ${isSrf ? "SRF / Sales Order" : "Quotation"} records nahi hain.`);
      return;
    }

    setIsExportingSales(true);
    try {
      const fromTag = salesExportFromDate || "Start";
      const toTag = salesExportToDate || "End";
      const rangeTag = salesExportFromDate || salesExportToDate ? `${fromTag}_to_${toTag}` : `All_Records_${new Date().toISOString().slice(0, 10)}`;

      if (isSrf) {
        const headers = [
          "#",
          "SRF No",
          "DC No",
          "Order Date",
          "Challan Date",
          "Customer Company",
          "Contact Person",
          "Phone",
          "Email",
          "GSTIN",
          "Place of Supply",
          "Products Count",
          "Taxable Amount (₹)",
          "Total Order Value (₹)",
          "Paid Amount (₹)",
          "Due Amount (₹)",
          "Payment Mode",
          "Payment Status",
          "Order Stage",
          "Shipping Address",
        ];

        const aoa = [
          [`ARCL INSTRUMENTS - SALES ORDERS & SRF REGISTER (${salesExportFromDate ? `From: ${salesExportFromDate}` : "Beginning"} To: ${salesExportToDate ? salesExportToDate : "Till Date"}) - Total Records: ${dataList.length}`],
          [],
          headers,
        ];

        dataList.forEach((s, idx) => {
          aoa.push([
            idx + 1,
            s.srfNo || "",
            s.dcNo || "",
            s.orderDate ? new Date(s.orderDate).toLocaleDateString("en-IN") : "",
            s.challanDate ? new Date(s.challanDate).toLocaleDateString("en-IN") : "",
            s.clientCompany || "",
            s.clientContactPerson || "",
            s.clientPhone || "",
            s.clientEmail || "",
            s.clientGst || "",
            s.placeOfSupply || "27-MAHARASHTRA",
            (s.items || []).length,
            Number(s.commercialDocs?.taxableAmount || 0),
            Number(s.commercialDocs?.totalAmount || 0),
            Number(s.commercialDocs?.paidAmount || 0),
            Number(s.commercialDocs?.dueAmount || 0),
            s.commercialDocs?.paymentMode || "UPI",
            s.commercialDocs?.paymentStatus || "Pending",
            s.stage || "Order Confirmed",
            s.clientAddress || "",
          ]);
        });

        if (format === "xlsx") {
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, "Sales_Orders_SRF");
          XLSX.writeFile(wb, `ARCL_Sales_Orders_${rangeTag}.xlsx`);
          toast.success(`Exported ${dataList.length} sales orders to Excel (.xlsx) for selected dates!`);
        } else {
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          const csv = XLSX.utils.sheet_to_csv(ws);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ARCL_Sales_Orders_${rangeTag}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`Exported ${dataList.length} sales orders to CSV for selected dates!`);
        }
      } else {
        const headers = [
          "#",
          "Quotation No",
          "Quotation Date",
          "Valid Till",
          "Customer Company",
          "Contact Person",
          "Phone",
          "Email",
          "GSTIN",
          "Place of Supply",
          "Items Count",
          "Subtotal (₹)",
          "Tax Amount (₹)",
          "Total Amount (₹)",
          "Status",
          "Delivery Period",
        ];

        const aoa = [
          [`ARCL INSTRUMENTS - COMMERCIAL SALES QUOTATIONS (${salesExportFromDate ? `From: ${salesExportFromDate}` : "Beginning"} To: ${salesExportToDate ? salesExportToDate : "Till Date"}) - Total Records: ${dataList.length}`],
          [],
          headers,
        ];

        dataList.forEach((q, idx) => {
          aoa.push([
            idx + 1,
            q.quotationNo || "",
            q.quotationDate ? new Date(q.quotationDate).toLocaleDateString("en-IN") : "",
            q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-IN") : "",
            q.clientCompany || "",
            q.clientContactPerson || "",
            q.clientPhone || "",
            q.clientEmail || "",
            q.clientGst || "",
            q.placeOfSupply || "27-MAHARASHTRA",
            (q.items || []).length,
            Number(q.taxableAmount || q.subtotal || 0),
            Number(q.taxAmount || 0),
            Number(q.totalAmount || 0),
            q.status || "Draft",
            q.commercialTerms?.deliveryPeriod || "2-3 Weeks",
          ]);
        });

        if (format === "xlsx") {
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, "Sales_Quotations");
          XLSX.writeFile(wb, `ARCL_Sales_Quotations_${rangeTag}.xlsx`);
          toast.success(`Exported ${dataList.length} sales quotations to Excel (.xlsx) for selected dates!`);
        } else {
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          const csv = XLSX.utils.sheet_to_csv(ws);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ARCL_Sales_Quotations_${rangeTag}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`Exported ${dataList.length} sales quotations to CSV for selected dates!`);
        }
      }
      setIsSalesExportModalOpen(false);
    } catch (err) {
      toast.error("Failed to export sales records: " + (err.message || "Unknown error"));
    } finally {
      setIsExportingSales(false);
    }
  };

  const handleExportQuotationsExcel = () => {
    handleOpenSalesExportModal("quotations");
  };

  const handleExportSrfsExcel = () => {
    handleOpenSalesExportModal("srf");
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchSearch =
        !quotationSearch ||
        (q.quotationNo && q.quotationNo.toLowerCase().includes(quotationSearch.toLowerCase())) ||
        (q.clientCompany && q.clientCompany.toLowerCase().includes(quotationSearch.toLowerCase())) ||
        (q.clientContactPerson && q.clientContactPerson.toLowerCase().includes(quotationSearch.toLowerCase())) ||
        (q.clientPhone && q.clientPhone.toLowerCase().includes(quotationSearch.toLowerCase())) ||
        (q.clientGst && q.clientGst.toLowerCase().includes(quotationSearch.toLowerCase()));

      const matchStatus = quotationStatusFilter === "all" || q.status === quotationStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, quotationSearch, quotationStatusFilter]);

  // Filtered SRFs
  const filteredSrfs = useMemo(() => {
    return srfs.filter((s) => {
      const matchSearch =
        !srfSearch ||
        (s.srfNo && s.srfNo.toLowerCase().includes(srfSearch.toLowerCase())) ||
        (s.dcNo && s.dcNo.toLowerCase().includes(srfSearch.toLowerCase())) ||
        (s.clientCompany && s.clientCompany.toLowerCase().includes(srfSearch.toLowerCase())) ||
        (s.clientContactPerson && s.clientContactPerson.toLowerCase().includes(srfSearch.toLowerCase())) ||
        (s.clientPhone && s.clientPhone.toLowerCase().includes(srfSearch.toLowerCase())) ||
        (s.items && s.items.some((i) => (i.itemName || "").toLowerCase().includes(srfSearch.toLowerCase())));

      const matchStage = srfStageFilter === "all" || s.stage === srfStageFilter;
      const matchPayment = srfPaymentFilter === "all" || s.commercialDocs?.paymentStatus === srfPaymentFilter;
      return matchSearch && matchStage && matchPayment;
    });
  }, [srfs, srfSearch, srfStageFilter, srfPaymentFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hidden PO File Input */}
      <input
        type="file"
        ref={poFileInputRef}
        onChange={handlePoFileChange}
        accept=".pdf,image/*,.doc,.docx"
        className="hidden"
      />

      {/* ==========================================
          HEADER BANNER (ARCL Navy Theme)
          ========================================== */}
      <div className="bg-gradient-to-r from-[#021C57] via-[#0B2A72] to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            <FaBuilding className="text-xs" />
            <span>ARCL Instruments Private Limited • Commercial Sales Division</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <FaFileInvoiceDollar className="text-amber-400" />
            <span>Sales Management Portal</span>
          </h1>
          <p className="text-xs text-blue-200/80 mt-1">
            Dedicated portal for Commercial Quotations &amp; Inward Sales Request Forms (SRF) • Product photos, catalog auto-suggestion &amp; live installment clearance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh All Sales Records"
          >
            <FaSync className={`text-xs ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenQuotationModal(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FaPlus className="text-xs" />
            <span>+ New Quotation</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenSrfModal(null)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FaPlus className="text-xs" />
            <span>+ Inward Sales SRF</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          TWO TAB SELECTOR BAR (ONLY QUOTATIONS & SRF)
          ========================================== */}
      <div className="flex items-center gap-2 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("quotations")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "quotations"
              ? "bg-[#021C57] text-white shadow-md ring-2 ring-blue-900/20"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <FaFileInvoiceDollar className={`text-sm ${activeTab === "quotations" ? "text-amber-400" : "text-gray-500"}`} />
          <span>1. Sales Quotations ({quotations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("srf_orders")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "srf_orders"
              ? "bg-[#021C57] text-white shadow-md ring-2 ring-blue-900/20"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
          }`}
        >
          <FaClipboardList className={`text-sm ${activeTab === "srf_orders" ? "text-emerald-400" : "text-gray-500"}`} />
          <span>2. SRF &amp; Commercial Orders ({srfs.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SALES QUOTATIONS (With Product Images)
          ========================================================================= */}
      {activeTab === "quotations" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Top Title & Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <FaFilePdf className="text-lg" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    Commercial Sales Quotations
                  </h2>
                  <p className="text-xs text-gray-500">
                    Live quotation generation with product photos &amp; catalog auto-suggestion • Standard 3-page ARCL format, GST calculations &amp; 1-click SRF conversion
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportQuotationsExcel}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Export all quotation records to CSV / Excel"
              >
                <FaFileExcel className="text-emerald-600" /> Export Quotations
              </button>
              <button
                type="button"
                onClick={() => handleOpenQuotationModal(null)}
                className="px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <FaPlus /> + Quotation
              </button>
            </div>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-3.5 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaBuilding className="text-blue-500" /> Total Quotations
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {stats.quotations?.totalQuotations || quotations.length}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Commercial proposals generated</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-3.5 rounded-xl border border-amber-100">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaMoneyBillWave className="text-amber-500" /> Total Quoted Valuation
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                ₹{Number(stats.quotations?.totalQuotedValuation || quotations.reduce((acc, q) => acc + (q.totalAmount || 0), 0)).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Includes 18% GST (CGST + SGST)</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3.5 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaCheckCircle className="text-emerald-500" /> Approved / Won
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {stats.quotations?.approvedQuotations || quotations.filter((q) => q.status === "Approved").length}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Approved by client PO</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50/40 p-3.5 rounded-xl border border-purple-100">
              <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaBoxes className="text-purple-500" /> Catalog Scope
              </div>
              <div className="text-2xl font-black text-purple-900 mt-1">
                {catalogProducts.length} Products
              </div>
              <div className="text-[11px] text-purple-600 mt-0.5">With photos &amp; live prices</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search quotations by Quotation No, Customer, Phone, Contact Person, GSTIN..."
                value={quotationSearch}
                onChange={(e) => setQuotationSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {quotationSearch && (
                <button
                  type="button"
                  onClick={() => setQuotationSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={quotationStatusFilter}
                onChange={(e) => setQuotationStatusFilter(e.target.value)}
                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Quotation Statuses</option>
                <option value="Draft">Draft 📝</option>
                <option value="Sent">Sent 📤</option>
                <option value="Approved">Approved 🟢</option>
                <option value="Expired">Expired 🟡</option>
                <option value="Cancelled">Cancelled 🔴</option>
              </select>

              <span className="font-semibold text-gray-600 text-xs shrink-0">
                Showing: <strong className="text-blue-900">{filteredQuotations.length}</strong> of {quotations.length}
              </span>
            </div>
          </div>

          {/* Quotations Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gradient-to-r from-[#021C57] to-indigo-900 text-white font-bold text-[11px]">
                  <th className="p-3 text-center w-12 border-r border-blue-800">#</th>
                  <th className="p-3 border-r border-blue-800 min-w-[150px]">Quotation Ref &amp; Date</th>
                  <th className="p-3 border-r border-blue-800 min-w-[200px]">Customer / Organization</th>
                  <th className="p-3 border-r border-blue-800 min-w-[130px]">Place of Supply</th>
                  <th className="p-3 border-r border-blue-800 min-w-[260px]">Quoted Equipment &amp; Product Image</th>
                  <th className="p-3 border-r border-blue-800 min-w-[130px] text-right">Quoted Valuation (₹)</th>
                  <th className="p-3 border-r border-blue-800 min-w-[100px] text-center">Status</th>
                  <th className="p-3 min-w-[210px] text-center">Quotation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-500">
                      <div className="max-w-md mx-auto space-y-2">
                        <FaFilePdf className="mx-auto text-4xl text-gray-300" />
                        <p className="font-bold text-gray-700">No Quotations Found</p>
                        <p className="text-xs text-gray-400">
                          {quotationSearch
                            ? `No records match your search "${quotationSearch}". Try clearing search.`
                            : "Click '+ Quotation' to create your first official commercial sales quotation with photos & auto-suggestions."}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenQuotationModal(null)}
                          className="mt-2 px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow transition"
                        >
                          + Create Quotation Now
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q, idx) => {
                    const items = Array.isArray(q.items) ? q.items : [];
                    const isMulti = items.length > 1;
                    const isExpanded = expandedQuotationKeys.has(q._id);
                    const primaryItem = items[0] || {};

                    return (
                      <React.Fragment key={q._id || idx}>
                        <tr className="hover:bg-blue-50/40 transition">
                          <td className="p-2.5 text-center font-bold text-gray-700 border-r border-gray-200 bg-gray-50/50">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono font-black text-blue-950 text-xs">
                                {q.quotationNo}
                              </span>
                              <span className="text-[10px] text-gray-500 font-medium">
                                Date: {q.quotationDate ? new Date(q.quotationDate).toLocaleDateString("en-IN") : "-"}
                              </span>
                              {q.validityDate && (
                                <span className="text-[9px] text-amber-700 font-bold">
                                  Valid till: {new Date(q.validityDate).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex flex-col gap-0.5">
                              <strong className="text-gray-900 font-extrabold text-xs">
                                {q.clientCompany}
                              </strong>
                              {q.clientContactPerson && (
                                <span className="text-[10px] text-gray-600">
                                  {q.clientContactPerson} {q.clientPhone ? `(${q.clientPhone})` : ""}
                                </span>
                              )}
                              {q.clientGst && (
                                <span className="text-[9px] font-mono font-bold text-blue-700">
                                  GST: {q.clientGst}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-gray-700 font-medium text-[11px]">
                            {q.placeOfSupply || "27-MAHARASHTRA"}
                          </td>

                          {/* Quoted Equipment Items With Product Image */}
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex items-center gap-2.5">
                              {primaryItem.productImage ? (
                                <img
                                  src={primaryItem.productImage}
                                  alt={primaryItem.itemName || "Product"}
                                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border border-gray-200">
                                  <FaBox className="text-sm" />
                                </div>
                              )}
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900 text-[11px] truncate max-w-[190px]">
                                    {primaryItem.itemName || "Precision Equipment"}
                                  </span>
                                  {isMulti && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-100 text-blue-800 font-mono">
                                      +{items.length - 1} more
                                    </span>
                                  )}
                                </div>
                                {isMulti ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedQuotationKeys((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(q._id)) next.delete(q._id);
                                        else next.add(q._id);
                                        return next;
                                      });
                                    }}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer text-left"
                                  >
                                    {isExpanded ? "▲ Hide line items" : `▼ View all ${items.length} items with photos`}
                                  </button>
                                ) : (
                                  primaryItem.description && (
                                    <span className="text-[10px] text-gray-500 truncate max-w-[190px]">
                                      {primaryItem.description}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-2.5 border-r border-gray-200 text-right">
                            <div className="flex flex-col items-end gap-0.5 font-mono">
                              <strong className="text-gray-950 font-black text-xs">
                                ₹{Number(q.totalAmount || 0).toLocaleString("en-IN")}
                              </strong>
                              <span className="text-[9px] text-gray-500">
                                Taxable: ₹{Number(q.taxableAmount || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </td>

                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                  q.status === "Approved"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : q.status === "Sent"
                                    ? "bg-blue-50 text-blue-800 border-blue-300"
                                    : q.status === "Expired"
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : q.status === "Cancelled"
                                    ? "bg-rose-50 text-rose-800 border-rose-300"
                                    : "bg-slate-100 text-slate-800 border-slate-300"
                                }`}
                              >
                                {q.status === "Approved" && <FaCheckCircle className="text-[9px] text-emerald-600" />}
                                <span>{q.status || "Draft"}</span>
                              </span>

                              {/* 1-Click Convert to SRF Button right here in Status column */}
                              {q.convertedToSrf ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleConvertQuotationToSrf(q)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-md text-[9.5px] font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                    title="Quotation already converted. Click to generate another SRF order or re-convert."
                                  >
                                    <FaClipboardList className="text-[9px]" /> Re-convert to SRF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab("srf_orders");
                                      setSrfSearch(q.quotationNo || "");
                                    }}
                                    className="text-[9px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer flex items-center justify-center gap-0.5"
                                    title="View existing SRF in SRF Tab"
                                  >
                                    <FaCheckCircle className="text-[8px] text-emerald-600" /> View in SRF
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleConvertQuotationToSrf(q)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-md text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  title="1-Click Convert this Quotation into Inward SRF & Commercial Order"
                                >
                                  <FaClipboardList className="text-[9px]" /> Convert to SRF
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openDocViewer("quotation", q)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="View & Print Official Quotation Sheet (Exact 1:1 Calibration Design with Photos)"
                              >
                                <FaFilePdf className="text-red-600" /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePrintQuotation(q)}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                                title="Direct Print Official Quotation PDF (Exact same 1:1 layout as downloaded PDF with product images)"
                              >
                                <FaPrint className="text-purple-600 text-[10px]" /> Print
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadQuotation(q)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Download Official Binary PDF with Product Photos"
                              >
                                <FaDownload className="text-blue-600" /> PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenShareModal("quotation", q)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-md transition cursor-pointer"
                                title="Share via WhatsApp / Email"
                              >
                                <FaShareAlt className="text-[10px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConvertQuotationToSrf(q)}
                                className={`px-2 py-1 ${
                                  q.convertedToSrf
                                    ? "bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border-indigo-200"
                                    : "bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border-emerald-300"
                                } border rounded-md text-[10px] font-black transition flex items-center gap-1 cursor-pointer`}
                                title="Convert this Quotation into Inward SRF & Commercial Order"
                              >
                                <FaClipboardList className="text-[9px]" /> {q.convertedToSrf ? "Re-convert SRF" : "Convert to SRF"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenQuotationModal(q)}
                                className="p-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-md transition cursor-pointer"
                                title="Edit Quotation"
                              >
                                <FaEdit className="text-[10px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuotation(q)}
                                className="p-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 rounded-md transition cursor-pointer"
                                title="Delete Quotation"
                              >
                                <FaTrash className="text-[10px]" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Line Items Sub-Row With Photo Column */}
                        {isExpanded && (
                          <tr className="bg-slate-50/95 border-b-2 border-indigo-200 animate-fadeIn">
                            <td colSpan={8} className="p-3 pl-10">
                              <div className="bg-white rounded-xl border border-indigo-100 p-3 shadow-xs space-y-2">
                                <div className="text-xs font-bold text-gray-800 flex items-center justify-between border-b border-gray-100 pb-1.5 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span>Quotation Line Items Breakdown ({items.length} Products):</span>
                                    <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Ref: {q.quotationNo}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintQuotation(q)}
                                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                      title="Direct Print Official PDF"
                                    >
                                      <FaPrint className="text-[9px]" /> Print PDF
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadQuotation(q)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                      title="Download Official PDF"
                                    >
                                      <FaDownload className="text-[9px]" /> Download PDF
                                    </button>
                                  </div>
                                </div>
                                <table className="w-full text-left text-xs border border-gray-200 rounded overflow-hidden">
                                  <thead>
                                    <tr className="bg-gray-100 text-[10px] font-bold text-gray-700">
                                      <th className="p-1.5 text-center w-10">#</th>
                                      <th className="p-1.5 text-center w-14">Photo</th>
                                      <th className="p-1.5">Item Description</th>
                                      <th className="p-1.5 w-24">HSN/SAC</th>
                                      <th className="p-1.5 w-16 text-center">Qty</th>
                                      <th className="p-1.5 w-24 text-right">Rate (₹)</th>
                                      <th className="p-1.5 w-20 text-center">GST%</th>
                                      <th className="p-1.5 w-28 text-right">Amount (₹)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {items.map((it, itIdx) => (
                                      <tr key={itIdx} className="hover:bg-gray-50">
                                        <td className="p-1.5 text-center font-bold text-gray-600">{it.itemNo || itIdx + 1}</td>
                                        <td className="p-1.5 text-center">
                                          {it.productImage ? (
                                            <img
                                              src={it.productImage}
                                              alt={it.itemName}
                                              className="w-14 h-14 rounded-xl object-cover border border-gray-200 mx-auto shadow-xs hover:scale-105 transition cursor-pointer"
                                              onClick={() => window.open(it.productImage, "_blank")}
                                              title="Click to view full photo"
                                            />
                                          ) : (
                                            <div className="w-9 h-9 rounded-md bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-[9px] font-bold border border-gray-200">
                                              ARCL
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-1.5">
                                          <div className="font-bold text-gray-900">{it.itemName}</div>
                                          {Array.isArray(it.specifications) && it.specifications.length > 0 ? (
                                            <div className="mt-1 space-y-0.5">
                                              {it.specifications.map((s, sIdx) => (
                                                <div key={sIdx} className="text-[10px] text-gray-600 flex items-start gap-1">
                                                  <span className="font-bold text-blue-700">{sIdx + 1}.</span>
                                                  <span>{s}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : it.description ? (
                                            <div className="text-[10px] text-gray-500 whitespace-pre-line">{it.description}</div>
                                          ) : null}
                                        </td>
                                        <td className="p-1.5 font-mono text-[11px] text-gray-600">{it.hsnSac || "998346"}</td>
                                        <td className="p-1.5 text-center font-bold">{it.qty} {it.qtyUnit || "NOS"}</td>
                                        <td className="p-1.5 text-right font-mono">₹{Number(it.rate || 0).toLocaleString("en-IN")}</td>
                                        <td className="p-1.5 text-center font-bold">{it.taxRate || 18}%</td>
                                        <td className="p-1.5 text-right font-mono font-black text-gray-900">
                                          ₹{Number(it.amount || (it.qty * it.rate)).toLocaleString("en-IN")}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
      )}

      {/* =========================================================================
          TAB 2: SRF & COMMERCIAL ORDERS (With Product Photos)
          ========================================================================= */}
      {activeTab === "srf_orders" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Top Title & Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <FaClipboardList className="text-lg" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    SRF &amp; Commercial Orders Master
                  </h2>
                  <p className="text-xs text-gray-500">
                    Complete inward sales request forms, order delivery stages &amp; full multi-installment financial clearance ledger
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportSrfsExcel}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Export all SRF order records to CSV / Excel spreadsheet"
              >
                <FaFileExcel className="text-emerald-600" /> Export to Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenSrfModal(null)}
                className="px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <FaPlus /> + Inward Sales SRF
              </button>
            </div>
          </div>

          {/* SRF KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-3.5 rounded-xl border border-blue-100">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaClipboardList className="text-blue-500" /> Total Inward SRFs
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {stats.srfs?.totalSrfs || srfs.length}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Commercial sales orders inwarded</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-3.5 rounded-xl border border-amber-100">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaMoneyBillWave className="text-amber-500" /> Total Orders Value
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                ₹{Number(stats.srfs?.totalOrderValue || srfs.reduce((acc, s) => acc + (s.commercialDocs?.totalAmount || 0), 0)).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">Total billing value</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-3.5 rounded-xl border border-emerald-100">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaCheckCircle className="text-emerald-500" /> Cleared Payments
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                ₹{Number(stats.srfs?.totalPaid || srfs.reduce((acc, s) => acc + (s.commercialDocs?.paidAmount || 0), 0)).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Collected revenue via UPI / Bank</div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-50/40 p-3.5 rounded-xl border border-rose-100">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <FaExclamationTriangle className="text-rose-500" /> Outstanding Due
              </div>
              <div className="text-2xl font-black text-rose-900 mt-1">
                ₹{Number(stats.srfs?.totalDue || srfs.reduce((acc, s) => acc + (s.commercialDocs?.dueAmount || 0), 0)).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">Pending client receivables</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-6 relative flex items-center">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search SRF by SRF No, DC No, Customer, Product, Serial No..."
                value={srfSearch}
                onChange={(e) => setSrfSearch(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800 font-medium"
              />
              {srfSearch && (
                <button
                  type="button"
                  onClick={() => setSrfSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <select
                value={srfStageFilter}
                onChange={(e) => setSrfStageFilter(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-bold"
              >
                <option value="all">All Delivery Stages (1-5)</option>
                <option value="Order Confirmed">1. Order Confirmed</option>
                <option value="In Production / Packing">2. In Production / Packing</option>
                <option value="Ready for Dispatch">3. Ready for Dispatch</option>
                <option value="Dispatched">4. Dispatched</option>
                <option value="Delivered">5. Delivered</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={srfPaymentFilter}
                onChange={(e) => setSrfPaymentFilter(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-bold"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Paid 🟢</option>
                <option value="Pending">Pending 🟡</option>
                <option value="Partial">Partial 🔴</option>
              </select>
            </div>
          </div>

          {/* Table Container with 4 Grouped Colored Sections matching the approved SRF Design */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-inner">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead>
                <tr className="text-center font-bold text-white uppercase text-[10px] tracking-wider">
                  <th colSpan="5" className="bg-blue-900 border-r border-blue-800 p-2">
                    1. CLIENT &amp; PRODUCT DETAILS
                  </th>
                  <th colSpan="5" className="bg-emerald-800 border-r border-emerald-700 p-2">
                    2. ORDER &amp; DELIVERY DETAILS
                  </th>
                  <th colSpan="4" className="bg-amber-800 border-r border-amber-700 p-2">
                    3. COMMERCIAL DOCUMENTS &amp; PAYMENT
                  </th>
                  <th colSpan="2" className="bg-indigo-900 border-r border-indigo-800 p-2">
                    4. ORDER STAGE &amp; ACTION
                  </th>
                </tr>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 text-[10px]">
                  {/* 1. Client & Product Details */}
                  <th className="p-2.5 border-r border-gray-200">Sr. No.</th>
                  <th className="p-2.5 border-r border-gray-200 min-w-[200px]">Company / Customer &amp; Equipment</th>
                  <th className="p-2.5 border-r border-gray-200">Make</th>
                  <th className="p-2.5 border-r border-gray-200">Model No.</th>
                  <th className="p-2.5 border-r border-gray-200">Serial No.</th>

                  {/* 2. Order & Delivery Details */}
                  <th className="p-2.5 border-r border-gray-200">Order Date</th>
                  <th className="p-2.5 border-r border-gray-200">Delivery Due</th>
                  <th className="p-2.5 border-r border-gray-200">Inward SRF / DC No.</th>
                  <th className="p-2.5 border-r border-gray-200">Challan Date</th>
                  <th className="p-2.5 border-r border-gray-200">Site / Delivery Address</th>

                  {/* 3. Commercial Documents & Payment */}
                  <th className="p-2.5 border-r border-gray-200 text-center min-w-[120px]">PO Raised</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Proforma Invoice</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Tax Invoice</th>
                  <th className="p-2.5 border-r border-gray-200 text-center min-w-[180px]">
                    PAYMANTE MOAD (Mode &amp; Status)
                  </th>

                  {/* 4. Order Stage & Action */}
                  <th className="p-2.5 border-r border-gray-200 text-center min-w-[130px]">Stage</th>
                  <th className="p-2.5 text-center min-w-[140px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-gray-800 font-medium bg-white">
                {filteredSrfs.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-12 text-center text-gray-500 bg-slate-50/40">
                      <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl shadow-inner">
                          <FaClipboardList />
                        </div>
                        <p className="font-bold text-gray-900 text-sm">No Sales SRF Orders Found</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {srfSearch
                            ? `No records match "${srfSearch}". Try clearing filters.`
                            : "Create your first inward sales request form by clicking '+ Inward Sales SRF' or convert an approved quotation."}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenSrfModal(null)}
                          className="mt-2 px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FaPlus /> + Add Real Sales SRF
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSrfs.map((srf, idx) => {
                    const items = Array.isArray(srf.items) ? srf.items : [];
                    const isMulti = items.length > 1;
                    const fin = srf.commercialDocs || {};
                    const isExpandedPayment = expandedSrfPaymentKeys.has(srf._id || idx);
                    const primaryItem = items[0] || {};

                    // Makes and Models
                    const makes = Array.from(new Set(items.map((i) => i.make).filter(Boolean)));
                    const makeDisplay = makes.length > 0 ? makes.join(", ") : "ARCL";
                    const models = Array.from(new Set(items.map((i) => i.modelNo).filter(Boolean)));
                    const modelDisplay = models.length > 0 ? models.join(", ") : "-";
                    const serials = Array.from(new Set(items.map((i) => i.serialNo).filter(Boolean)));
                    const serialDisplay = serials.length > 0 ? serials.join(", ") : "-";

                    const modeBg =
                      fin.paymentMode === "UPI"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : fin.paymentMode === "Net Banking"
                        ? "bg-blue-50 text-blue-800 border-blue-300"
                        : fin.paymentMode === "Cash"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-purple-50 text-purple-800 border-purple-300";

                    const statusBg =
                      fin.paymentStatus === "Paid"
                        ? "bg-emerald-600 text-white"
                        : fin.paymentStatus === "Pending"
                        ? "bg-rose-600 text-white"
                        : "bg-amber-500 text-white";

                    const hasPoAttached = Boolean(
                      fin.poFileUrl && fin.poFileUrl.trim() !== "" && fin.poFileUrl !== "/docs/sample-po.pdf"
                    );

                    return (
                      <React.Fragment key={srf._id || idx}>
                        <tr className="hover:bg-blue-50/50 transition">
                          {/* 1. Client & Equipment Details (No image in SRF as requested) */}
                          <td className="p-2.5 font-bold text-center border-r border-gray-200 bg-gray-50/50">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 font-bold">
                                <FaBox className="text-xs" />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-gray-950 text-xs">
                                    {srf.clientCompany}
                                  </span>
                                  {isMulti && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 font-mono">
                                      {items.length} Items
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-900 font-bold truncate max-w-[210px]">
                                  {primaryItem.itemName || "Precision Equipment"}
                                </p>
                                {primaryItem.description && (
                                  <p className="text-[9.5px] text-gray-500 font-normal truncate max-w-[210px]">
                                    {primaryItem.description}
                                  </p>
                                )}
                                {srf.clientPhone && (
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    Phone: {srf.clientPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-gray-600">{makeDisplay}</td>
                          <td className="p-2.5 border-r border-gray-200 text-gray-600">{modelDisplay}</td>
                          <td className="p-2.5 border-r border-gray-200 font-mono text-gray-800 font-bold">{serialDisplay}</td>

                          {/* 2. Order & Delivery Details */}
                          <td className="p-2.5 border-r border-gray-200 font-mono text-gray-600">
                            {srf.orderDate ? new Date(srf.orderDate).toLocaleDateString("en-IN") : "-"}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono text-amber-800 font-bold">
                            {srf.deliveryDueDate ? new Date(srf.deliveryDueDate).toLocaleDateString("en-IN") : "-"}
                          </td>
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs font-black text-blue-950">
                                {srf.dcNo || "DC/SLS/26-27/01"}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openDocViewer("srf", srf)}
                                  className="text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer text-[9px] font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 transition shadow-2xs"
                                  title={`View Inward SRF Slip (${items.length} Products)`}
                                >
                                  <FaFilePdf className="text-[9px] text-amber-600" />
                                  <span>{srf.srfNo}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintSrfDoc(srf, "srf")}
                                  className="p-1 rounded text-[8px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                                  title="Direct Print Official SRF Slip PDF"
                                >
                                  <FaPrint className="text-[8px] text-purple-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSrfDoc(srf, "srf")}
                                  className="p-1 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                  title="Download Official SRF Slip PDF"
                                >
                                  <FaDownload className="text-[8px] text-blue-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenShareModal("srf", srf)}
                                  className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                                  title="Send SRF Slip to Customer via Email/WhatsApp"
                                >
                                  ✉️
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono text-gray-600">
                            {srf.challanDate ? new Date(srf.challanDate).toLocaleDateString("en-IN") : "-"}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-gray-600 truncate max-w-[160px]" title={srf.deliverySite || srf.clientAddress}>
                            {srf.deliverySite || srf.clientAddress || "Airoli, Navi Mumbai"}
                          </td>

                          {/* 3. Commercial Documents & Payment */}
                          <td className={`p-2.5 border-r border-gray-200 text-center transition ${hasPoAttached ? "bg-emerald-50/70" : "bg-slate-50/30"}`}>
                            {hasPoAttached ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <FaCheckCircle className="text-emerald-600 text-[9px]" />
                                  <span>PO Attached</span>
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleViewPo(srf)}
                                    className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <FaFilePdf className="text-xs" /> View
                                  </button>
                                  {srf.commercialDocs?.poFileUrl && (
                                    <button
                                      type="button"
                                      onClick={() => handlePrintPdf(srf.commercialDocs.poFileUrl)}
                                      className="p-1 rounded text-[8px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                                      title="Print Attached PO"
                                    >
                                      <FaPrint className="text-[8px] text-purple-600" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerPoUpload(srf)}
                                    className="p-1 rounded text-[8px] font-bold bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 border border-gray-300 transition cursor-pointer"
                                    title="Re-upload PO"
                                  >
                                    <FaUpload className="text-[8px]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePoFile(srf)}
                                    className="p-1 rounded text-[8px] font-bold bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-gray-300 transition cursor-pointer"
                                    title="Delete PO"
                                  >
                                    <FaTrash className="text-[8px]" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTriggerPoUpload(srf)}
                                  disabled={uploadingPo}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs hover:shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                                >
                                  <FaUpload className="text-[9px]" />
                                  <span>Upload PO</span>
                                </button>
                                <span className="text-[8px] text-amber-600 font-bold">⚠️ No PO Attached</span>
                              </div>
                            )}
                          </td>

                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-[9px] font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">
                                PI/26-27/{String(idx + 1).padStart(2, "0")}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap justify-center">
                                <button
                                  type="button"
                                  onClick={() => openDocViewer("pi", srf)}
                                  className="text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                  title="View Proforma Invoice"
                                >
                                  <FaFilePdf className="text-xs" />
                                  <span className="text-[9px] underline font-bold">View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintSrfDoc(srf, "pi")}
                                  className="p-1 rounded text-[8px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                                  title="Direct Print Official PI (Exact PDF Layout)"
                                >
                                  <FaPrint className="text-[8px] text-purple-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSrfDoc(srf, "pi")}
                                  className="p-1 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                  title="Download Official PI PDF"
                                >
                                  <FaDownload className="text-[8px] text-blue-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenShareModal("pi", srf)}
                                  className="px-1 py-0.5 rounded text-[8px] font-bold bg-gray-50 text-gray-700 hover:bg-blue-600 hover:text-white border border-gray-200 transition cursor-pointer"
                                  title="Send Proforma Invoice to Customer"
                                >
                                  ✉️
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-[9px] font-bold text-purple-900 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                                INV/26-27/{String(idx + 1).padStart(2, "0")}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap justify-center">
                                <button
                                  type="button"
                                  onClick={() => openDocViewer("tax_invoice", srf)}
                                  className="text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                  title="View Tax Invoice"
                                >
                                  <FaFilePdf className="text-xs" />
                                  <span className="text-[9px] underline font-bold">View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintSrfDoc(srf, "tax_invoice")}
                                  className="p-1 rounded text-[8px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition cursor-pointer"
                                  title="Direct Print Official Tax Invoice (Exact PDF Layout)"
                                >
                                  <FaPrint className="text-[8px] text-purple-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSrfDoc(srf, "tax_invoice")}
                                  className="p-1 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                                  title="Download Official Tax Invoice PDF"
                                >
                                  <FaDownload className="text-[8px] text-blue-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenShareModal("tax_invoice", srf)}
                                  className="px-1 py-0.5 rounded text-[8px] font-bold bg-gray-50 text-gray-700 hover:bg-blue-600 hover:text-white border border-gray-200 transition cursor-pointer"
                                  title="Send Tax Invoice to Customer"
                                >
                                  ✉️
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* PAYMANTE MOAD (Mode & Status) */}
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSrfPaymentModal(srf)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 cursor-pointer transition hover:opacity-90 shadow-2xs ${modeBg}`}
                                  title="Click to edit payment mode & installments"
                                >
                                  <FaCreditCard className="text-[9px]" /> {fin.paymentMode || "UPI"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSrfPaymentModal(srf)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer transition hover:opacity-90 shadow-2xs ${statusBg}`}
                                  title="Click to change payment status & details"
                                >
                                  {fin.paymentStatus || "Pending"}
                                </button>
                              </div>

                              {/* Financial clearance summary */}
                              <div className="text-[10px] font-bold">
                                {fin.paymentStatus === "Paid" ? (
                                  <span className="text-emerald-700 flex items-center gap-1">
                                    <FaCheckCircle className="text-[10px] text-emerald-600" /> ₹{Number(fin.paidAmount || 0).toLocaleString("en-IN")} (100% Cleared)
                                  </span>
                                ) : fin.paymentStatus === "Partial" ? (
                                  <div className="flex items-center gap-1 flex-wrap text-[10px]">
                                    <span className="text-emerald-700">Paid: ₹{Number(fin.paidAmount || 0).toLocaleString("en-IN")}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-rose-700 font-bold bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                      Due: ₹{Number(fin.dueAmount || 0).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-rose-600 font-bold">
                                    Pending: ₹{Number(fin.totalAmount || 0).toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>

                              {/* Arrow toggle to view installment history */}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandSrfPayment(srf._id || idx)}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 cursor-pointer w-fit transition shadow-2xs"
                                  title="Click arrow to expand and view payment installments history"
                                >
                                  {isExpandedPayment ? (
                                    <FaChevronDown className="text-[9px] text-indigo-600" />
                                  ) : (
                                    <FaChevronRight className="text-[9px] text-indigo-600" />
                                  )}
                                  <span>{(fin.payments || []).length || 1} Installment{((fin.payments || []).length || 1) > 1 ? "s" : ""}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSrfPaymentModal(srf)}
                                  className="p-1 rounded text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                                  title="Manage SRF Payment Installments"
                                >
                                  <FaEdit className="text-[10px]" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 4. Order Stage & Actions */}
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1 ${
                                srf.stage === "Delivered"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : srf.stage === "Dispatched"
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : srf.stage === "Ready for Dispatch"
                                  ? "bg-purple-100 text-purple-800 border-purple-300"
                                  : srf.stage === "In Production / Packing"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              <span>{srf.stage || "Order Confirmed"}</span>
                            </span>
                          </td>

                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAdvanceStage(srf)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 rounded-lg transition shadow-2xs cursor-pointer"
                                title="Advance to Next Stage"
                              >
                                <FaSlidersH className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSrfModal(srf)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition shadow-2xs cursor-pointer"
                                title="Edit Inward SRF Order"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSrf(srf)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-rose-700 rounded-lg transition shadow-2xs cursor-pointer"
                                title="Delete Inward SRF Order"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Multi-Installments Sub-Row for SRF */}
                        {isExpandedPayment && (
                          <tr className="bg-slate-50/95 border-b-2 border-indigo-300 animate-fadeIn">
                            <td colSpan={16} className="p-3 pl-8">
                              <div className="bg-white rounded-xl border border-indigo-200 p-3.5 shadow-sm space-y-2.5">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1 rounded-md bg-indigo-100 text-indigo-800 text-xs">
                                      <FaCreditCard />
                                    </span>
                                    <span className="font-bold text-xs text-indigo-950">
                                      Payment Installments &amp; UTR History for SRF ({srf.srfNo}) • DC: {srf.dcNo}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      (Client: <strong className="text-gray-800">{srf.clientCompany}</strong>)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] font-mono">
                                    <span className="text-gray-600">
                                      Total Valuation: <strong>₹{Number(fin.totalAmount || 0).toLocaleString("en-IN")}</strong>
                                    </span>
                                    <span className="text-emerald-700 font-bold">
                                      Paid: ₹{Number(fin.paidAmount || 0).toLocaleString("en-IN")}
                                    </span>
                                    {Number(fin.dueAmount || 0) > 0 && (
                                      <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                        Remaining Due: ₹{Number(fin.dueAmount).toLocaleString("en-IN")}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSrfPaymentModal(srf)}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                                    >
                                      <FaEdit className="text-[9px]" /> Manage Installments
                                    </button>
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
                                    <thead>
                                      <tr className="bg-gradient-to-r from-slate-100 to-indigo-50 text-[10px] font-bold text-gray-700 border-b border-gray-200">
                                        <th className="p-2 text-center w-12 border-r border-gray-200">#</th>
                                        <th className="p-2 min-w-[110px] border-r border-gray-200">Payment Date (Kab)</th>
                                        <th className="p-2 min-w-[120px] border-r border-gray-200">Paymante Moad</th>
                                        <th className="p-2 min-w-[180px] border-r border-gray-200">Transaction / UTR Ref</th>
                                        <th className="p-2 min-w-[130px] text-right border-r border-gray-200">Amount Paid (₹)</th>
                                        <th className="p-2 min-w-[180px] border-r border-gray-200">Stage / Notes</th>
                                        <th className="p-2 text-center w-24">Clearance</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                      {(fin.payments || []).length === 0 ? (
                                        <tr>
                                          <td colSpan={7} className="p-4 text-center text-gray-400">
                                            No payment installments recorded yet. Click &quot;Manage Installments&quot; to add.
                                          </td>
                                        </tr>
                                      ) : (
                                        (fin.payments || []).map((p, pIdx) => (
                                          <tr key={pIdx} className="hover:bg-indigo-50/40 transition">
                                            <td className="p-2 text-center font-bold text-indigo-900 border-r border-gray-200 bg-slate-50/50">
                                              Installment #{p.installmentNo || pIdx + 1}
                                            </td>
                                            <td className="p-2 font-medium text-gray-800 border-r border-gray-200">
                                              {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "-"}
                                            </td>
                                            <td className="p-2 border-r border-gray-200">
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                                {p.paymentMode || "UPI"}
                                              </span>
                                            </td>
                                            <td className="p-2 font-mono text-[11px] text-gray-700 border-r border-gray-200">
                                              {p.transactionRef || "-"}
                                            </td>
                                            <td className="p-2 text-right font-mono font-black text-emerald-800 border-r border-gray-200">
                                              ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-2 text-gray-600 text-[11px] border-r border-gray-200">
                                              {p.notes || "-"}
                                            </td>
                                            <td className="p-2 text-center">
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                                <FaCheck className="text-[8px]" /> Cleared
                                              </span>
                                            </td>
                                          </tr>
                                        ))
                                      )}
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
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE / EDIT COMMERCIAL QUOTATION (With Product Photos & Auto-Suggest)
          ========================================================================= */}
      {isQuotationModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-100 max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#021C57] to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-white/10 rounded-xl text-amber-400">
                  <FaFileInvoiceDollar className="text-xl" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {editingQuotationId ? "Edit Commercial Sales Quotation" : "Create New Commercial Sales Quotation"}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Official ARCL Quotation with product photos, catalog auto-suggestion &amp; automatic GST calculations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuotationModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveQuotation} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Row 1: Quotation No & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Quotation Number</label>
                  <input
                    type="text"
                    required
                    value={quotationForm.quotationNo}
                    onChange={(e) => setQuotationForm({ ...quotationForm, quotationNo: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Quotation Date</label>
                  <input
                    type="date"
                    required
                    value={quotationForm.quotationDate}
                    onChange={(e) => setQuotationForm({ ...quotationForm, quotationDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Validity Date</label>
                  <input
                    type="date"
                    value={quotationForm.validityDate}
                    onChange={(e) => setQuotationForm({ ...quotationForm, validityDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Place of Supply</label>
                  <input
                    type="text"
                    value={quotationForm.placeOfSupply}
                    onChange={(e) => setQuotationForm({ ...quotationForm, placeOfSupply: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-800"
                  />
                </div>
              </div>

              {/* Row 2: Customer / Bill To Details with GSTIN Verification */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                    <FaBuilding className="text-blue-700" /> Bill To Customer Details
                  </span>
                  <span className="text-[11px] text-gray-500">Enter GSTIN to auto-fill verified business info</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Customer / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sumeet Industries Pvt. Ltd."
                      value={quotationForm.clientCompany}
                      onChange={(e) => setQuotationForm({ ...quotationForm, clientCompany: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">GSTIN Number</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="15-digit GSTIN"
                        value={quotationForm.clientGst}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                          setQuotationForm((prev) => ({ ...prev, clientGst: val }));
                          if (val.length === 15) {
                            handleVerifyGst(val, "quotation");
                          }
                        }}
                        onBlur={() => {
                          if (quotationForm.clientGst?.length === 15) {
                            handleVerifyGst(quotationForm.clientGst, "quotation");
                          }
                        }}
                        maxLength={15}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono text-xs uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyGst(quotationForm.clientGst, "quotation")}
                        disabled={verifyingGst}
                        className="px-2.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-[10px] shrink-0 transition cursor-pointer"
                      >
                        {verifyingGst ? "..." : "Verify"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={quotationForm.clientContactPerson}
                      onChange={(e) => setQuotationForm({ ...quotationForm, clientContactPerson: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={quotationForm.clientPhone}
                      onChange={(e) => setQuotationForm({ ...quotationForm, clientPhone: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="purchase@company.com"
                      value={quotationForm.clientEmail}
                      onChange={(e) => setQuotationForm({ ...quotationForm, clientEmail: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Billing &amp; Delivery Address</label>
                    <input
                      type="text"
                      placeholder="Full factory or site address with PIN code"
                      value={quotationForm.clientAddress}
                      onChange={(e) => setQuotationForm({ ...quotationForm, clientAddress: e.target.value, billingAddress: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Product Line Items Table (With Photos, Catalog Auto-Suggest & Dynamic Add/Remove) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-xs">Quotation Products Scope</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {quotationForm.items.length} Line Item{quotationForm.items.length > 1 ? "s" : ""} (With Photos)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCustomProductModal(null)}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      title="Add a custom product with photo uploaded to Cloudinary & saved to internal quotation catalog"
                    >
                      <FaCamera className="text-xs" /> + Add Custom Product with Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleAddQuotationItem}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                    >
                      <FaPlus className="text-xs" /> + Add Line Item
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-visible shadow-xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold text-[10px] border-b border-gray-200">
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 text-center w-14">Photo</th>
                        <th className="p-2 min-w-[220px]">Product / Equipment Name (Auto-Suggest)</th>
                        <th className="p-2 w-24">HSN/SAC</th>
                        <th className="p-2 w-16 text-center">Qty</th>
                        <th className="p-2 w-20">Unit</th>
                        <th className="p-2 w-24 text-right">Rate (₹)</th>
                        <th className="p-2 w-20 text-center">GST %</th>
                        <th className="p-2 w-28 text-right">Amount (₹)</th>
                        <th className="p-2 text-center w-10">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quotationForm.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="p-2 text-center font-bold text-gray-500 bg-gray-50/50">{idx + 1}</td>

                          {/* Product Image / Photo Column */}
                          <td className="p-2 text-center">
                            <div className="relative group w-11 h-11 mx-auto rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shadow-2xs">
                              {it.productImage ? (
                                <img
                                  src={it.productImage}
                                  alt={it.itemName || "Item"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaImage className="text-gray-400 text-base" />
                              )}
                              <label
                                className="absolute inset-0 bg-black/65 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[8px] font-bold"
                                title="Click to upload/change product photo from gallery"
                              >
                                <FaCamera className="text-[10px]" />
                                <span>Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleItemImageUpload(idx, "quotation", e.target.files?.[0])}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </td>

                          {/* Product Name Input with Auto-Suggest */}
                          <td className="p-2 relative">
                            <input
                              type="text"
                              required
                              placeholder="Type product name (e.g. Sieve, Machine, Gauge...)"
                              value={it.itemName}
                              onChange={(e) => {
                                handleQuotationItemChange(idx, "itemName", e.target.value);
                                setActiveSuggestRow({ modalType: "quotation", rowIndex: idx });
                                setSuggestQuery(e.target.value);
                              }}
                              onFocus={() => {
                                setActiveSuggestRow({ modalType: "quotation", rowIndex: idx });
                                setSuggestQuery(it.itemName || "");
                              }}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Optional Photo URL direct link */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="text"
                                placeholder="Photo URL or auto-fills from catalog..."
                                value={it.productImage || ""}
                                onChange={(e) => handleQuotationItemChange(idx, "productImage", e.target.value)}
                                className="w-full px-1.5 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded font-mono text-gray-600 focus:bg-white"
                              />
                              {it.productImage && (
                                <button
                                  type="button"
                                  onClick={() => handleQuotationItemChange(idx, "productImage", "")}
                                  className="text-gray-400 hover:text-rose-600 p-0.5 text-[10px]"
                                  title="Clear photo"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>

                            {/* Numbered Specifications List (Point 1, 2, 3...) */}
                            <div className="mt-2 pt-1.5 border-t border-dashed border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                                  Product Specifications (Points):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddQuotationItemSpec(idx)}
                                  className="text-[9px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1.5 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                                  title="Add new numbered specification point"
                                >
                                  <FaPlus className="text-[8px]" /> + Point {(it.specifications || []).length + 1}
                                </button>
                              </div>

                              {Array.isArray(it.specifications) && it.specifications.length > 0 ? (
                                <div className="space-y-1">
                                  {it.specifications.map((spec, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-1.5 group">
                                      <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-black flex items-center justify-center shrink-0 border border-blue-200">
                                        {sIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        placeholder={`Spec ${sIdx + 1} (e.g. Accuracy ±0.5%, Capacity 200 kN)...`}
                                        value={spec}
                                        onChange={(e) => handleQuotationItemSpecChange(idx, sIdx, e.target.value)}
                                        className="flex-1 px-2 py-0.5 text-[10px] bg-slate-50 border border-gray-200 rounded-md focus:bg-white focus:border-blue-500 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveQuotationItemSpec(idx, sIdx)}
                                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition text-[10px] cursor-pointer"
                                        title="Delete specification point"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddQuotationItemSpec(idx)}
                                  className="text-[10px] text-gray-400 hover:text-blue-600 underline decoration-dotted flex items-center gap-1 cursor-pointer py-0.5"
                                >
                                  <FaPlus className="text-[8px]" /> + Add numbered specifications (1, 2, 3...)
                                </button>
                              )}
                            </div>

                            {/* Auto-suggest dropdown with Photo Thumbnail & Quick Add Custom Option */}
                            {activeSuggestRow?.modalType === "quotation" &&
                              activeSuggestRow?.rowIndex === idx &&
                              suggestQuery.trim().length > 0 && (
                                <div className="absolute left-2 right-2 top-full mt-1 bg-white border border-blue-300 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100 animate-fadeIn">
                                  {filteredSuggestions.length > 0 ? (
                                    <>
                                      <div className="p-1.5 bg-blue-50 text-[10px] font-bold text-blue-900 flex items-center justify-between">
                                        <span>Select from Catalog ({filteredSuggestions.length} matches with photos):</span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveSuggestRow(null)}
                                          className="text-gray-400 hover:text-gray-700"
                                        >
                                          <FaTimes />
                                        </button>
                                      </div>
                                      {filteredSuggestions.map((prod, pIdx) => (
                                        <div
                                          key={pIdx}
                                          onClick={() => handleSelectProductSuggestion(prod, "quotation", idx)}
                                          className="p-2 hover:bg-blue-50 transition cursor-pointer flex items-center justify-between gap-2.5"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {prod.image ? (
                                              <img
                                                src={prod.image}
                                                alt={prod.name}
                                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 shadow-2xs"
                                              />
                                            ) : (
                                              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold text-xs">
                                                <FaBox />
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <div className="font-bold text-gray-900 text-xs truncate">{prod.name}</div>
                                              <div className="text-[10px] text-gray-500 truncate">
                                                {prod.category} • SKU: {prod.sku} • HSN: {prod.hsn}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <div className="font-mono font-bold text-emerald-700 text-xs">
                                              ₹{Number(prod.price).toLocaleString("en-IN")}
                                            </div>
                                            <div className="text-[9px] text-gray-400">per {prod.unit}</div>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Quick custom product create bar */}
                                      <div
                                        onClick={() => {
                                          setActiveSuggestRow(null);
                                          handleOpenCustomProductModal(idx);
                                        }}
                                        className="p-2 bg-emerald-50/80 hover:bg-emerald-100 transition cursor-pointer flex items-center justify-between text-emerald-950 font-bold text-xs"
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <FaCamera className="text-emerald-600" />
                                          <span>Add New Product with Photo: "{suggestQuery}"</span>
                                        </div>
                                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded shadow-2xs">
                                          + Add to Catalog
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="p-3 text-center text-xs text-gray-500 bg-white space-y-2">
                                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                                        <span>Koi matching catalog product nahi mila</span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveSuggestRow(null)}
                                          className="text-gray-400 hover:text-gray-700"
                                        >
                                          <FaTimes />
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveSuggestRow(null);
                                          handleOpenCustomProductModal(idx);
                                        }}
                                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                                      >
                                        <FaCamera />
                                        <span>"{suggestQuery}" with Photo to Catalog</span>
                                      </button>
                                      <p className="text-[10px] text-gray-400">
                                        Cloudinary pe photo upload hogi aur hamesha ke liye suggestions me add ho jayegi
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              value={it.hsnSac}
                              onChange={(e) => handleQuotationItemChange(idx, "hsnSac", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg font-mono text-[11px]"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={(e) => handleQuotationItemChange(idx, "qty", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-center font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={it.qtyUnit}
                              onChange={(e) => handleQuotationItemChange(idx, "qtyUnit", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                            >
                              <option value="NOS">NOS</option>
                              <option value="SET">SET</option>
                              <option value="PKT">PKT</option>
                              <option value="MTR">MTR</option>
                              <option value="KG">KG</option>
                              <option value="LOT">LOT</option>
                            </select>
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={it.rate}
                              onChange={(e) => handleQuotationItemChange(idx, "rate", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-right font-mono font-bold"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <select
                              value={it.taxRate}
                              onChange={(e) => handleQuotationItemChange(idx, "taxRate", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-center font-bold"
                            >
                              <option value="18">18%</option>
                              <option value="12">12%</option>
                              <option value="5">5%</option>
                              <option value="0">0%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>
                          <td className="p-2 text-right font-mono font-black text-gray-900">
                            ₹{Number(it.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveQuotationItem(idx)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                              title="Delete row"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 4: Taxes & Grand Total Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-gray-800 text-xs">Terms &amp; Conditions</span>
                    <button
                      type="button"
                      onClick={handleAddQuotationTerm}
                      className="text-[10px] text-blue-700 hover:underline font-bold"
                    >
                      + Add Term
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {quotationForm.terms.map((t, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={t}
                          onChange={(e) => handleQuotationTermChange(tIdx, e.target.value)}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuotationTerm(tIdx)}
                          className="p-1 text-gray-400 hover:text-rose-600"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-600 font-medium">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-bold text-gray-900">
                      ₹{quotationTotals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>CGST (9.0%):</span>
                    <span className="font-mono">
                      ₹{quotationTotals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>SGST (9.0%):</span>
                    <span className="font-mono">
                      ₹{quotationTotals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {quotationTotals.roundOff !== 0 && (
                    <div className="flex items-center justify-between text-gray-500 text-[11px]">
                      <span>Round Off:</span>
                      <span className="font-mono">₹{quotationTotals.roundOff}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 flex items-center justify-between text-sm">
                    <span className="font-black text-gray-900">Grand Total (Incl. GST):</span>
                    <span className="font-mono font-black text-blue-950 text-base">
                      ₹{quotationTotals.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-gray-200 flex-wrap">
                <div className="flex items-center gap-2">
                  {editingQuotationId && (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePrintQuotation({ _id: editingQuotationId })}
                        className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                        title="Print Official PDF (Exact same 1:1 layout as downloaded PDF)"
                      >
                        <FaPrint className="text-purple-600 text-xs" /> Print Official PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQuotation({ _id: editingQuotationId })}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                        title="Download Official Binary PDF"
                      >
                        <FaDownload className="text-blue-600 text-xs" /> Download PDF
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsQuotationModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingQuotation}
                    className="px-6 py-2.5 bg-[#021C57] hover:bg-blue-900 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingQuotation ? (
                      <>
                        <FaSync className="animate-spin text-xs" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaCheck className="text-xs" /> Save Quotation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CREATE / EDIT SALES SRF ORDER (With Product Photos)
          ========================================================================= */}
      {isSrfModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-100 max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#021C57] to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-white/10 rounded-xl text-emerald-400">
                  <FaClipboardList className="text-xl" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {editingSrfId ? "Edit Sales Request Form (SRF Inward)" : "Create New Inward Sales SRF Order"}
                  </h3>
                  <p className="text-xs text-blue-200">
                    Inward sales job form with equipment line items, photos &amp; delivery tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSrfModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSrf} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Row 1: SRF & DC References */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">SRF Number</label>
                  <input
                    type="text"
                    required
                    value={srfForm.srfNo}
                    onChange={(e) => setSrfForm({ ...srfForm, srfNo: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">DC / Challan No.</label>
                  <input
                    type="text"
                    required
                    value={srfForm.dcNo}
                    onChange={(e) => setSrfForm({ ...srfForm, dcNo: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    required
                    value={srfForm.orderDate}
                    onChange={(e) => setSrfForm({ ...srfForm, orderDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Delivery Due Date</label>
                  <input
                    type="date"
                    value={srfForm.deliveryDueDate}
                    onChange={(e) => setSrfForm({ ...srfForm, deliveryDueDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-medium text-amber-800 font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Customer Details */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/70 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                    <FaBuilding className="text-emerald-700" /> Customer &amp; Delivery Destination
                  </span>
                  <span className="text-[11px] text-gray-500">Auto-fill via GSTIN verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Customer / Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sumeet Industries Pvt. Ltd."
                      value={srfForm.clientCompany}
                      onChange={(e) => setSrfForm({ ...srfForm, clientCompany: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">GSTIN</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="15-digit GSTIN"
                        value={srfForm.clientGst}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                          setSrfForm((prev) => ({ ...prev, clientGst: val }));
                          if (val.length === 15) {
                            handleVerifyGst(val, "srf");
                          }
                        }}
                        onBlur={() => {
                          if (srfForm.clientGst?.length === 15) {
                            handleVerifyGst(srfForm.clientGst, "srf");
                          }
                        }}
                        maxLength={15}
                        className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono text-xs uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyGst(srfForm.clientGst, "srf")}
                        disabled={verifyingGst}
                        className="px-2.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-[10px] shrink-0 transition"
                      >
                        {verifyingGst ? "..." : "Verify"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Quality Manager"
                      value={srfForm.clientContactPerson}
                      onChange={(e) => setSrfForm({ ...srfForm, clientContactPerson: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={srfForm.clientPhone}
                      onChange={(e) => setSrfForm({ ...srfForm, clientPhone: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="accounts@client.com"
                      value={srfForm.clientEmail}
                      onChange={(e) => setSrfForm({ ...srfForm, clientEmail: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Site / Delivery Destination Address</label>
                    <input
                      type="text"
                      placeholder="Full site destination address"
                      value={srfForm.deliverySite}
                      onChange={(e) => setSrfForm({ ...srfForm, deliverySite: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Inward Products List (Equipment & Technical Scope) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-xs">Inward Order Products</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {srfForm.items.length} Product{srfForm.items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSrfItem}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <FaPlus className="text-xs" /> + Add Product Item
                  </button>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-visible shadow-xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold text-[10px] border-b border-gray-200">
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2 min-w-[200px]">Product Name (Auto-Suggest)</th>
                        <th className="p-2 w-24">Make</th>
                        <th className="p-2 w-24">Model No.</th>
                        <th className="p-2 w-24">Serial No.</th>
                        <th className="p-2 w-16 text-center">Qty</th>
                        <th className="p-2 w-24 text-right">Rate (₹)</th>
                        <th className="p-2 w-28 text-right">Amount (₹)</th>
                        <th className="p-2 text-center w-10">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {srfForm.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/30">
                          <td className="p-2 text-center font-bold text-gray-500 bg-gray-50/50">{idx + 1}</td>

                          <td className="p-2 relative">
                            <input
                              type="text"
                              required
                              placeholder="Type product name..."
                              value={it.itemName}
                              onChange={(e) => {
                                handleSrfItemChange(idx, "itemName", e.target.value);
                                setActiveSuggestRow({ modalType: "srf", rowIndex: idx });
                                setSuggestQuery(e.target.value);
                              }}
                              onFocus={() => {
                                setActiveSuggestRow({ modalType: "srf", rowIndex: idx });
                                setSuggestQuery(it.itemName || "");
                              }}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />

                            {/* Auto-suggest dropdown */}
                            {activeSuggestRow?.modalType === "srf" &&
                              activeSuggestRow?.rowIndex === idx &&
                              filteredSuggestions.length > 0 && (
                                <div className="absolute left-2 right-2 top-full mt-1 bg-white border border-emerald-300 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-gray-100 animate-fadeIn">
                                  <div className="p-1.5 bg-emerald-50 text-[10px] font-bold text-emerald-900 flex items-center justify-between">
                                    <span>Select from Catalog ({filteredSuggestions.length} matches with photos):</span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveSuggestRow(null)}
                                      className="text-gray-400 hover:text-gray-700"
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                  {filteredSuggestions.map((prod, pIdx) => (
                                    <div
                                      key={pIdx}
                                      onClick={() => handleSelectProductSuggestion(prod, "srf", idx)}
                                      className="p-2 hover:bg-emerald-50 transition cursor-pointer flex items-center justify-between gap-2.5"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        {prod.image ? (
                                          <img
                                            src={prod.image}
                                            alt={prod.name}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 shadow-2xs"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 font-bold text-xs">
                                            <FaBox />
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <div className="font-bold text-gray-900 text-xs truncate">{prod.name}</div>
                                          <div className="text-[10px] text-gray-500 truncate">{prod.category}</div>
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="font-mono font-bold text-emerald-700 text-xs">
                                          ₹{Number(prod.price).toLocaleString("en-IN")}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={it.make}
                              onChange={(e) => handleSrfItemChange(idx, "make", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={it.modelNo}
                              onChange={(e) => handleSrfItemChange(idx, "modelNo", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. SN-001"
                              value={it.serialNo}
                              onChange={(e) => handleSrfItemChange(idx, "serialNo", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg font-mono text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={(e) => handleSrfItemChange(idx, "qty", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-center font-bold"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={it.rate}
                              onChange={(e) => handleSrfItemChange(idx, "rate", e.target.value)}
                              className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-right font-mono font-bold"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-black text-gray-900">
                            ₹{Number(it.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSrfItem(idx)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                              title="Delete row"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 4: Commercial & Payment Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Total Valuation (₹)</label>
                  <input
                    type="number"
                    value={srfForm.commercialDocs.totalAmount}
                    onChange={(e) => {
                      const total = Number(e.target.value) || 0;
                      const paid = srfForm.commercialDocs.paidAmount || 0;
                      setSrfForm({
                        ...srfForm,
                        commercialDocs: {
                          ...srfForm.commercialDocs,
                          totalAmount: total,
                          dueAmount: Math.max(0, total - paid),
                        },
                      });
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono font-black text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Initial Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={srfForm.commercialDocs.paidAmount}
                    onChange={(e) => {
                      const paid = Number(e.target.value) || 0;
                      const total = srfForm.commercialDocs.totalAmount || 0;
                      const due = Math.max(0, total - paid);
                      const status = due <= 0 && total > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
                      setSrfForm({
                        ...srfForm,
                        commercialDocs: {
                          ...srfForm.commercialDocs,
                          paidAmount: paid,
                          dueAmount: due,
                          paymentStatus: status,
                        },
                      });
                    }}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={srfForm.commercialDocs.paymentMode}
                    onChange={(e) =>
                      setSrfForm({
                        ...srfForm,
                        commercialDocs: { ...srfForm.commercialDocs, paymentMode: e.target.value },
                      })
                    }
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-800"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsSrfModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSrf}
                  className="px-6 py-2.5 bg-[#021C57] hover:bg-blue-900 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingSrf ? (
                    <>
                      <FaSync className="animate-spin text-xs" /> Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="text-xs" /> Save SRF Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: SRF PAYMENT & INSTALLMENTS MANAGER (Same as Purchasing)
          ========================================================================= */}
      {isSrfPaymentModalOpen && srfPaymentTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-blue-900 to-[#021C57] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-white/10 rounded-xl text-amber-300">
                  <FaCreditCard className="text-xl" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    SRF Payment &amp; Installments Tracker
                  </h3>
                  <p className="text-xs text-blue-200">
                    Order Ref: <strong>{srfPaymentTarget.srfNo}</strong> • DC: {srfPaymentTarget.dcNo} ({srfPaymentTarget.clientCompany})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSrfPaymentModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Financial Balance Summary Card */}
              <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Total Valuation</span>
                  <div className="text-xl font-black text-gray-950 font-mono mt-0.5">
                    ₹{Number(srfPaymentForm.totalAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Paid So Far</span>
                  <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">
                    ₹{Number(srfPaymentForm.paidAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Remaining Due</span>
                  <div className="text-xl font-black text-rose-800 font-mono mt-0.5">
                    ₹{Number(srfPaymentForm.dueAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Top Controls: Payment Mode & Status & 1-Click Clear */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Primary Payment Mode</label>
                  <select
                    value={srfPaymentForm.paymentMode}
                    onChange={(e) => setSrfPaymentForm({ ...srfPaymentForm, paymentMode: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-800"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={srfPaymentForm.paymentStatus}
                    onChange={(e) => setSrfPaymentForm({ ...srfPaymentForm, paymentStatus: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-800"
                  >
                    <option value="Paid">Paid 🟢</option>
                    <option value="Pending">Pending 🟡</option>
                    <option value="Partial">Partial 🔴</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end pt-4 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleClearRemainingDue}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FaCheckCircle className="text-sm" /> Clear Remaining Due
                  </button>
                </div>
              </div>

              {/* Installments Ledger Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 text-xs">
                    Installment Ledger Entries ({srfPaymentForm.payments.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPaymentInstallment}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <FaPlus className="text-[10px]" /> + Add Installment
                  </button>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold text-[10px] border-b border-gray-200">
                        <th className="p-2 text-center w-10">#</th>
                        <th className="p-2 w-32">Date (Kab)</th>
                        <th className="p-2 w-32">Mode</th>
                        <th className="p-2 min-w-[140px]">Transaction / UTR Ref</th>
                        <th className="p-2 w-32 text-right">Amount (₹)</th>
                        <th className="p-2 min-w-[140px]">Notes</th>
                        <th className="p-2 text-center w-10">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {srfPaymentForm.payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-gray-400">
                            No installments recorded. Click &quot;+ Add Installment&quot; to record a payment.
                          </td>
                        </tr>
                      ) : (
                        srfPaymentForm.payments.map((p, pIdx) => (
                          <tr key={pIdx} className="hover:bg-indigo-50/20">
                            <td className="p-2 text-center font-bold text-indigo-900 border-r border-gray-200 bg-slate-50/50">
                              #{p.installmentNo || pIdx + 1}
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={p.paymentDate ? new Date(p.paymentDate).toISOString().split("T")[0] : ""}
                                onChange={(e) => handleInstallmentChange(pIdx, "paymentDate", e.target.value)}
                                className="w-full p-1 bg-white border border-gray-300 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={p.paymentMode || "UPI"}
                                onChange={(e) => handleInstallmentChange(pIdx, "paymentMode", e.target.value)}
                                className="w-full p-1 bg-white border border-gray-300 rounded-lg text-xs"
                              >
                                <option value="UPI">UPI</option>
                                <option value="Net Banking">Net Banking</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Card">Card</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="UTR / Ref No."
                                value={p.transactionRef || ""}
                                onChange={(e) => handleInstallmentChange(pIdx, "transactionRef", e.target.value)}
                                className="w-full p-1 bg-white border border-gray-300 rounded-lg font-mono text-xs"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={p.amount}
                                onChange={(e) => handleInstallmentChange(pIdx, "amount", parseFloat(e.target.value) || 0)}
                                className="w-full p-1 bg-white border border-gray-300 rounded-lg text-right font-mono font-bold text-emerald-800"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Stage / remark"
                                value={p.notes || ""}
                                onChange={(e) => handleInstallmentChange(pIdx, "notes", e.target.value)}
                                className="w-full p-1 bg-white border border-gray-300 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePaymentInstallment(pIdx)}
                                className="p-1 text-gray-400 hover:text-rose-600 transition"
                                title="Remove installment"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit / Save Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsSrfPaymentModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSrfPayment}
                  disabled={savingPayment}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingPayment ? (
                    <>
                      <FaSync className="animate-spin text-xs" /> Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="text-xs" /> Update Payment &amp; Installments
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DOCUMENT VIEWER & PRINT MODAL (Exact 1:1 Calibration Design with Product Photos)
          ========================================================================= */}
      {isDocViewerOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-blue-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Top Toolbar matching Calibration */}
            <div className="p-4 bg-gradient-to-r from-[#021C57] to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30 text-xl">
                  <FaFilePdf />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {selectedDoc.type === "quotation"
                        ? "Official Commercial Quotation Sheet"
                        : selectedDoc.type === "srf"
                        ? "Official Service Request Form (SRF Inward Slip)"
                        : selectedDoc.type === "pi"
                        ? "Official Proforma Invoice"
                        : "Official Commercial Tax Invoice"}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                      Exact 1:1 ARCL Format
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Ref: {selectedDoc.data?.quotationNo || selectedDoc.data?.srfNo || "DOC-REF"} • {selectedDoc.data?.clientCompany || "Client"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* 1. Download Official Binary PDF */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDoc.type === "quotation" && selectedDoc.data?._id) {
                      handleDownloadQuotation(selectedDoc.data);
                    } else if (selectedDoc.data?._id) {
                      handleDownloadSrfDoc(selectedDoc.data, selectedDoc.type);
                    } else {
                      window.print();
                    }
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Download High-Resolution Official Vector PDF with Product Images, QR & Signatures"
                >
                  <FaDownload /> Download Official PDF
                </button>

                {/* 2. Direct Print Official PDF (Exact 1:1 match with downloaded PDF) */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDoc.type === "quotation" && selectedDoc.data?._id) {
                      handlePrintQuotation(selectedDoc.data);
                    } else if (selectedDoc.data?._id) {
                      handlePrintSrfDoc(selectedDoc.data, selectedDoc.type);
                    } else {
                      window.print();
                    }
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Print Official PDF (Same exact layout as PDF Download)"
                >
                  <FaPrint /> Print Official PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDocViewerOpen(false);
                    handleOpenShareModal(selectedDoc.type, selectedDoc.data);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Share with Customer via WhatsApp / Email"
                >
                  <FaPaperPlane /> Dispatch to Customer
                </button>

                <button
                  type="button"
                  onClick={() => setIsDocViewerOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Main Interactive Paper Sheet Canvas - Exact PURE WHITE PAPER from Calibration */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70 flex justify-center print:p-0 print:bg-white">
              <div
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
                className="max-w-4xl w-full rounded-2xl shadow-2xl p-5 sm:p-8 space-y-4 border border-gray-300 text-xs font-sans print:shadow-none print:border-none print:p-0 print:max-w-none"
              >
                {/* 1. Header Banner */}
                <div
                  style={{ backgroundColor: "#2563eb" }}
                  className="text-white text-center py-2 rounded-t-lg font-bold text-sm tracking-wider shadow-sm uppercase"
                >
                  {selectedDoc.type === "quotation"
                    ? "COMMERCIAL QUOTATION & COST ESTIMATE"
                    : selectedDoc.type === "srf"
                    ? "SERVICE REQUEST FORM & INWARD JOB SLIP"
                    : selectedDoc.type === "pi"
                    ? "PROFORMA INVOICE"
                    : "TAX INVOICE"}
                </div>

                {/* 2. Top Header Grid (2-Column Exact ARCL Calibration Layout) */}
                <div
                  style={{ borderColor: "#000000", backgroundColor: "#ffffff" }}
                  className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black"
                >
                  {/* Left: ARCL Official Details & Quotation To */}
                  <div className="p-3 space-y-3">
                    <div style={{ borderColor: "#000000" }} className="flex items-start gap-3 border-b pb-3">
                      <img src="/assets/LOGO.png" alt="ARCL Logo" className="h-12 object-contain" />
                      <div className="space-y-0.5 text-[11px] text-gray-900">
                        <h2 className="font-black text-black">ARCL INSTRUMENTS PRIVATE LIMITED</h2>
                        <p className="font-bold text-gray-800">GSTIN: 27ABDCA3876F1ZL</p>
                        <p className="font-bold text-gray-800">PAN: ABDCA3876F</p>
                        <p className="text-gray-700 text-[10px]">Shop No. 6, Siddivinayak Park CHS, Sector 8A,</p>
                        <p className="text-gray-700 text-[10px]">Airoli, Navi Mumbai, Maharashtra - 400708</p>
                        <p className="text-gray-700 text-[10px]">Mobile: +91 8369458583, +91 6205691085</p>
                        <p className="text-gray-700 text-[10px]">Email: arclinstruments@gmail.com</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="font-black text-black text-[11px]">
                        {selectedDoc.type === "quotation" ? "Quotation To (Client Details):" : "Customer / Client Details:"}
                      </p>
                      <div className="font-bold text-blue-900 text-xs">{selectedDoc.data?.clientCompany}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-[10px]">GSTIN:</span>
                        <span className="font-mono text-gray-900 text-[11px] font-bold">
                          {selectedDoc.data?.clientGst || "N/A"}
                        </span>
                      </div>
                      {selectedDoc.data?.clientContactPerson && (
                        <p className="text-gray-700 text-[10px]">
                          <span className="font-bold">Contact Person:</span> {selectedDoc.data.clientContactPerson}{" "}
                          {selectedDoc.data.clientPhone ? `(${selectedDoc.data.clientPhone})` : ""}
                        </p>
                      )}
                      {selectedDoc.data?.clientEmail && (
                        <p className="text-gray-700 text-[10px]">
                          <span className="font-bold">Email:</span> {selectedDoc.data.clientEmail}
                        </p>
                      )}
                      <p className="text-gray-700 text-[10px] leading-tight">
                        <span className="font-bold">Billing Address:</span>{" "}
                        {selectedDoc.data?.billingAddress || selectedDoc.data?.clientAddress || "Airoli, Navi Mumbai, Maharashtra"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quotation Metadata */}
                  <div className="p-3 space-y-3">
                    <div
                      style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                      className="grid grid-cols-2 gap-2 p-2.5 border rounded"
                    >
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">
                          {selectedDoc.type === "quotation" ? "Quotation #:" : "Ref Order #:"}
                        </span>
                        <p className="font-mono font-bold text-blue-900 text-[11px]">
                          {selectedDoc.data?.quotationNo || selectedDoc.data?.srfNo}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Date:</span>
                        <p className="font-bold text-gray-900 text-[11px]">
                          {selectedDoc.data?.quotationDate || selectedDoc.data?.srfDate || new Date().toISOString().split("T")[0]}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Validity:</span>
                        <p className="text-gray-900 text-[11px]">
                          {selectedDoc.data?.validityDate || "30 Days from date of issue"}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Place of Supply:</span>
                        <p className="text-gray-900 font-bold text-[11px]">
                          {selectedDoc.data?.placeOfSupply || "27-MAHARASHTRA"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 text-[10px]">Site / Delivery Location:</p>
                      <p className="text-gray-700 text-[10px] leading-relaxed">
                        {selectedDoc.data?.shippingAddress || selectedDoc.data?.clientAddress || "Client Factory / Site Premises"}
                      </p>
                    </div>

                    {selectedDoc.data?.dcNo && (
                      <div className="space-y-1 pt-1">
                        <span className="font-bold text-gray-800 text-[10px]">DC Challan Ref:</span>
                        <p className="font-mono font-bold text-blue-900 text-[10px]">{selectedDoc.data.dcNo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Items Table With Dedicated PHOTO COLUMN */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border overflow-x-auto rounded">
                  <table style={{ backgroundColor: "#ffffff", color: "#111827" }} className="w-full text-left text-[11px] border-collapse">
                    <thead style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="font-bold text-[10px]">
                      <tr>
                        <th className="p-1.5 border-r border-blue-400 w-8 text-center text-white">#</th>
                        {selectedDoc.type === "quotation" && (
                          <th className="p-1.5 border-r border-blue-400 w-16 text-center text-white">Photo</th>
                        )}
                        <th className="p-1.5 border-r border-blue-400 min-w-[200px] text-white">
                          Product / Equipment &amp; Specification Scope
                        </th>
                        <th className="p-1.5 border-r border-blue-400 w-20 text-center text-white">HSN/SAC</th>
                        <th className="p-1.5 border-r border-blue-400 w-16 text-center text-white">Qty</th>
                        <th className="p-1.5 border-r border-blue-400 w-24 text-right text-white">Rate (INR)</th>
                        <th className="p-1.5 w-28 text-right text-white">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: "#ffffff" }} className="divide-y divide-gray-300">
                      {(selectedDoc.data?.items || []).map((it, idx) => (
                        <tr
                          key={idx}
                          style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                          className="hover:bg-blue-50/40"
                        >
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 border-r text-center font-bold text-gray-800">
                            {it.itemNo || idx + 1}
                          </td>

                          {/* EXACT PRODUCT PHOTO ON QUOTATION ONLY - STRICTLY NO PHOTO IN SALES SRF */}
                          {selectedDoc.type === "quotation" && (
                            <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 border-r text-center">
                              {it.productImage && String(it.productImage).trim() !== "" ? (
                                <img
                                  src={it.productImage}
                                  alt={it.itemName}
                                  className="w-12 h-12 rounded object-cover border border-gray-300 mx-auto shadow-2xs"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-[9px] font-bold border border-gray-200">
                                  ARCL
                                </div>
                              )}
                            </td>
                          )}

                          <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 border-r space-y-0.5">
                            <div className="font-bold text-gray-900 text-[11px]">{it.itemName}</div>
                            {it.description && <div className="text-[10px] text-gray-600">{it.description}</div>}
                            {(it.make || it.modelNo) && (
                              <div className="text-[9px] text-gray-500 font-mono">
                                Make: {it.make || "ARCL"} | Model: {it.modelNo || "-"}
                              </div>
                            )}
                          </td>

                          <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 border-r text-center font-mono text-[10px] text-gray-700">
                            {it.hsnSac || "998346"}
                          </td>

                          <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 border-r text-center font-bold text-gray-900">
                            {it.qty} {it.qtyUnit || "NOS"}
                          </td>

                          <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 border-r text-right font-mono text-gray-800">
                            ₹ {Number(it.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          <td style={{ borderColor: "#cbd5e1" }} className="p-1.5 text-right font-mono font-bold text-black">
                            ₹ {Number(it.amount || (it.qty * it.rate)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Live Taxable Summary & Amount in Words */}
                <div
                  style={{ borderColor: "#000000", backgroundColor: "#ffffff" }}
                  className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black"
                >
                  <div className="p-3 space-y-2">
                    <p className="font-bold text-gray-800 text-[11px]">Amount Chargeable (in words):</p>
                    <p className="font-bold text-gray-900 text-xs">
                      {numberToWords(selectedDoc.data?.totalAmount || selectedDoc.data?.grandTotal || 0)}
                    </p>
                  </div>

                  <div className="p-3 space-y-1 text-right text-xs">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Taxable Amount:</span>
                      <span className="font-mono">
                        ₹ {Number(selectedDoc.data?.taxableAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>CGST 9.0%:</span>
                      <span className="font-mono">
                        ₹ {Number(selectedDoc.data?.cgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>SGST 9.0%:</span>
                      <span className="font-mono">
                        ₹ {Number(selectedDoc.data?.sgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ borderColor: "#000000" }} className="flex justify-between font-black text-black text-sm border-t pt-1">
                      <span>Total ({selectedDoc.data?.items?.reduce((s, it) => s + Number(it.qty || 1), 0) || 0} Qty):</span>
                      <span className="font-mono text-blue-900">
                        ₹ {Number(selectedDoc.data?.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Bank Details, Dual QR Codes, Stamp & Signatory */}
                <div
                  style={{ borderColor: "#000000", backgroundColor: "#ffffff" }}
                  className="border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black p-3 text-[11px]"
                >
                  <div className="space-y-0.5 text-gray-900">
                    <p className="font-black text-black">Company's Bank Details:</p>
                    <p>Bank: <strong>HDFC Bank</strong></p>
                    <p>Account #: <strong className="font-mono">50200111763991</strong></p>
                    <p>IFSC Code: <strong className="font-mono">HDFC0000582</strong></p>
                    <p>Branch: <strong>Kandivali East - Thakur Village</strong></p>
                  </div>

                  {/* Dual QR Codes Column: Static Official Bank QR + Dynamic Auto Pay UPI QR */}
                  <div className="flex items-center justify-around p-1 text-center gap-2">
                    {/* QR 1: Static Official Bank QR */}
                    <div className="flex flex-col items-center space-y-0.5">
                      <p className="font-bold text-gray-800 text-[9px]">Official Bank QR:</p>
                      <div className="w-14 h-14 bg-white border border-gray-300 rounded p-0.5 flex items-center justify-center shadow-2xs overflow-hidden">
                        <img
                          src="/assets/hdfc_qr.png"
                          onError={(e) => {
                            e.target.src = "/assets/hdfc_qr.jpg";
                          }}
                          alt="Official Bank QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="font-mono text-[8px] text-gray-600 font-semibold">8572995533.2@hdfc</p>
                    </div>

                    {/* QR 2: Dynamic Auto-Generated Fixed Amount UPI QR */}
                    <div className="flex flex-col items-center space-y-0.5">
                      <p className="font-bold text-blue-700 text-[9px]">
                        Auto Pay ₹{Number(selectedDoc.data?.totalAmount || 0).toLocaleString("en-IN")}:
                      </p>
                      <div className="w-14 h-14 bg-white border border-blue-400 rounded p-0.5 flex items-center justify-center shadow-2xs overflow-hidden">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=3&data=${encodeURIComponent(
                            `upi://pay?pa=8572995533.2@hdfc&pn=ARCL&am=${(Number(selectedDoc.data?.totalAmount) || 1).toFixed(2)}&cu=INR`
                          )}`}
                          alt="Dynamic Auto Pay UPI QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="font-bold text-[8px] text-blue-700">
                        ₹{Number(selectedDoc.data?.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1 flex flex-col justify-between items-end">
                    <p className="font-bold text-black text-[10px]">For ARCL INSTRUMENTS PRIVATE LIMITED</p>
                    <div className="w-20 h-16 flex items-center justify-center overflow-hidden">
                      <img src="/assets/arcl_stamp.png" alt="ARCL Seal & Sign" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-bold text-black text-[10px]">Authorized Signatory</p>
                  </div>
                </div>

                {/* 6. Terms and Conditions (Dynamic & Official Format) */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border p-3 space-y-2 rounded text-xs text-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                    <span className="font-bold text-black text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                      Terms and Conditions:
                      <span className="text-[10px] font-normal text-indigo-700 lowercase">(Official ARCL Commercial Terms)</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(selectedDoc.data?.terms && selectedDoc.data.terms.length > 0
                      ? selectedDoc.data.terms
                      : DEFAULT_SALES_TERMS
                    ).map((term, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-5 text-right font-mono text-[11px] shrink-0">
                          {tIdx + 1}.
                        </span>
                        <p className="text-[11px] text-gray-800 flex-1 leading-relaxed">{term}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: PO DOCUMENT FULL-SCREEN PREVIEW
          ========================================================================= */}
      {isPoPreviewOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
            <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FaFilePdf className="text-emerald-400 text-lg" />
                <span>Purchase Order Document: {poPreviewFileName}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPoPreviewOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <FaTimes className="text-base" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-gray-100 min-h-[500px]">
              {poPreviewUrl.startsWith("data:image/") ||
              poPreviewUrl.endsWith(".jpg") ||
              poPreviewUrl.endsWith(".png") ||
              poPreviewUrl.endsWith(".jpeg") ? (
                <img src={poPreviewUrl} alt="Uploaded PO" className="max-w-full max-h-[80vh] rounded-xl shadow-md object-contain" />
              ) : (
                <iframe src={poPreviewUrl} title="PO Document Preview" className="w-full h-[78vh] rounded-xl border border-gray-300" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: SHARE DOCUMENT VIA EMAIL / WHATSAPP
          ========================================================================= */}
      {isShareModalOpen && shareData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="p-4 bg-[#021C57] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FaShareAlt className="text-amber-400" />
                <span>Share Document with Client</span>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-white/70 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-600">
                Share official <strong>{shareData.type.toUpperCase()}</strong> with customer: <strong>{shareData.data?.clientCompany}</strong>
              </p>
              <div className="space-y-2">
                <a
                  href={`https://wa.me/${String(shareData.data?.clientPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    `Hello ${shareData.data?.clientCompany},\nPlease find your official ${shareData.type.toUpperCase()} from ARCL Instruments Private Limited.\nRef: ${shareData.data?.quotationNo || shareData.data?.srfNo}\nThank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <span>Share on WhatsApp (Direct Link)</span>
                </a>
                <a
                  href={`mailto:${shareData.data?.clientEmail || ""}?subject=${encodeURIComponent(
                    `ARCL Instruments: Official ${shareData.type.toUpperCase()} Ref ${shareData.data?.quotationNo || shareData.data?.srfNo}`
                  )}&body=${encodeURIComponent(
                    `Dear ${shareData.data?.clientCompany},\n\nPlease find attached the official documentation for your order.\n\nBest Regards,\nARCL Instruments Private Limited`
                  )}`}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <FaEnvelope /> Share via Official Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: DATE-WISE SALES EXPORT MODAL (EXCEL / CSV)
          ========================================================================= */}
      {isSalesExportModalOpen && (
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
                    Date-wise Sales Export (Excel / CSV)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Download sales records for selected dates to Excel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSalesExportModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs bg-slate-50/60 max-h-[80vh] overflow-y-auto">
              {/* Export Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sales Document Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSalesExportType("srf")}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                      salesExportType === "srf"
                        ? "border-[#021C57] bg-blue-50 text-[#021C57] font-bold ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaClipboardList className="text-blue-600 text-base shrink-0" />
                    <div>
                      <div className="text-xs font-black">Sales Orders &amp; SRF</div>
                      <div className="text-[10px] text-slate-500 font-normal">Inwards, Stage &amp; Payment</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesExportType("quotations")}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                      salesExportType === "quotations"
                        ? "border-[#021C57] bg-blue-50 text-[#021C57] font-bold ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaFileInvoiceDollar className="text-amber-600 text-base shrink-0" />
                    <div>
                      <div className="text-xs font-black">Sales Quotations</div>
                      <div className="text-[10px] text-slate-500 font-normal">Commercial Quotes</div>
                    </div>
                  </button>
                </div>
              </div>

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
                      onClick={() => applySalesExportPreset(pr.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        salesExportPreset === pr.id
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
                      value={salesExportFromDate}
                      onChange={(e) => {
                        setSalesExportFromDate(e.target.value);
                        setSalesExportPreset("custom");
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
                      value={salesExportToDate}
                      onChange={(e) => {
                        setSalesExportToDate(e.target.value);
                        setSalesExportPreset("custom");
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
                    onClick={() => setSalesExportFormat("xlsx")}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                      salesExportFormat === "xlsx"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <FaFileExcel className="text-emerald-600 text-lg shrink-0" />
                    <div>
                      <div className="text-xs font-black">Excel (.xlsx)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Formatted Spreadsheet</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesExportFormat("csv")}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                      salesExportFormat === "csv"
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

              {/* Live Count Banner */}
              {(() => {
                const count = salesExportType === "srf" ? exportFilteredSrfs.length : exportFilteredQuotations.length;
                const totalVal = salesExportType === "srf"
                  ? exportFilteredSrfs.reduce((sum, s) => sum + (Number(s.commercialDocs?.totalAmount) || 0), 0)
                  : exportFilteredQuotations.reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);

                return (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      count > 0
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-black text-xs flex items-center gap-1.5">
                        {count > 0 ? (
                          <>
                            <FaCheckCircle className="text-emerald-600" />
                            <span>
                              {count} {salesExportType === "srf" ? "Sales Orders (SRFs)" : "Quotations"} Found
                            </span>
                          </>
                        ) : (
                          <>
                            <FaTimes className="text-rose-600" />
                            <span>Is date range me koi record nahi mila</span>
                          </>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {salesExportFromDate || salesExportToDate ? (
                          <span>
                            Range: <strong>{salesExportFromDate || "Beginning"}</strong> se{" "}
                            <strong>{salesExportToDate || "Till Date"}</strong>
                          </span>
                        ) : (
                          <span>Sabhi records download honge (All-Time)</span>
                        )}
                      </div>
                    </div>
                    {count > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">
                          Total Value
                        </span>
                        <strong className="text-sm font-mono text-emerald-950">
                          ₹{Math.round(totalVal).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSalesExportModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              {(() => {
                const count = salesExportType === "srf" ? exportFilteredSrfs.length : exportFilteredQuotations.length;
                return (
                  <button
                    type="button"
                    onClick={() => handleExecuteSalesExport(salesExportFormat)}
                    disabled={isExportingSales || count === 0}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {salesExportFormat === "xlsx" ? <FaFileExcel /> : <FaDownload />}
                    <span>
                      {isExportingSales
                        ? "Generating File..."
                        : `Download ${salesExportFormat === "xlsx" ? "Excel (.xlsx)" : "CSV"} (${count})`}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 8: ADD CUSTOM PRODUCT WITH PHOTO (CLOUDINARY & INTERNAL CATALOG)
          ========================================================================= */}
      {isCustomProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#021C57] to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/30">
                  <FaCamera />
                </span>
                <div>
                  <h3 className="font-black text-sm tracking-wide">
                    Add Custom Product to Quotation Scope
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Photo Cloudinary pe upload hogi, internal catalog me save hogi aur suggestions me aayegi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomProductModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs bg-slate-50/60 flex-1">
              {/* Product Photo Upload Section */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  📸 Product Photo (Uploads to Cloudinary):
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group shadow-xs">
                    {customProductForm.imagePreview ? (
                      <img
                        src={customProductForm.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <FaImage className="text-2xl mx-auto mb-1" />
                        <span className="text-[9px] font-bold block">No Photo</span>
                      </div>
                    )}
                    <label
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-[10px] font-bold"
                      title="Upload product photo"
                    >
                      <FaUpload className="text-xs mb-1" />
                      <span>{customProductForm.imagePreview ? "Change" : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.warning("Photo size must be less than 10MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCustomProductForm((prev) => ({
                                ...prev,
                                imageFile: file,
                                imagePreview: ev.target?.result || "",
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95">
                      <FaCamera className="text-xs" />
                      <span>{customProductForm.imagePreview ? "Replace Photo" : "Choose Photo from Device"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.warning("Photo size must be less than 10MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCustomProductForm((prev) => ({
                                ...prev,
                                imageFile: file,
                                imagePreview: ev.target?.result || "",
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Supports JPG, PNG, WEBP, JPEG up to 10MB. Photo will be uploaded to Cloudinary CDN and will show in Quotations with high resolution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Details Form */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  🏷️ Product Specification &amp; Pricing:
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Product / Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Digital Concrete Test Hammer, Diamond Core Drill..."
                    value={customProductForm.name}
                    onChange={(e) => setCustomProductForm({ ...customProductForm, name: e.target.value })}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Product Code / SKU
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ARCL-CTH-200"
                      value={customProductForm.productCode}
                      onChange={(e) => setCustomProductForm({ ...customProductForm, productCode: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={customProductForm.category}
                      onChange={(e) => setCustomProductForm({ ...customProductForm, category: e.target.value })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Civil Lab Equipment">Civil Lab Equipment</option>
                      <option value="Cement & Concrete Testing">Cement &amp; Concrete Testing</option>
                      <option value="Soil Testing Equipment">Soil Testing Equipment</option>
                      <option value="Bitumen & Asphalt Testing">Bitumen &amp; Asphalt Testing</option>
                      <option value="Calibration Standards & Masters">Calibration Standards &amp; Masters</option>
                      <option value="Metrology & Measuring Tools">Metrology &amp; Measuring Tools</option>
                      <option value="Glassware & Plasticware">Glassware &amp; Plasticware</option>
                      <option value="Lab Consumables & Spares">Lab Consumables &amp; Spares</option>
                      <option value="Custom Machining & Scope">Custom Machining &amp; Scope</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      HSN / SAC Code
                    </label>
                    <input
                      type="text"
                      placeholder="9031"
                      value={customProductForm.hsnCode}
                      onChange={(e) => setCustomProductForm({ ...customProductForm, hsnCode: e.target.value })}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:bg-white focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit
                    </label>
                    <select
                      value={customProductForm.unit}
                      onChange={(e) => setCustomProductForm({ ...customProductForm, unit: e.target.value })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="NOS">NOS</option>
                      <option value="SET">SET</option>
                      <option value="PCS">PCS</option>
                      <option value="PKT">PKT</option>
                      <option value="BOX">BOX</option>
                      <option value="MTR">MTR</option>
                      <option value="LOT">LOT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Default Rate (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      value={customProductForm.defaultRate}
                      onChange={(e) => setCustomProductForm({ ...customProductForm, defaultRate: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      GST %
                    </label>
                    <select
                      value={customProductForm.taxRate}
                      onChange={(e) => setCustomProductForm({ ...customProductForm, taxRate: Number(e.target.value) })}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value={0}>0% (Nil)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18% (Standard)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                {/* Numbered Specifications List (Points 1, 2, 3...) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Technical Specifications (Numbered 1, 2, 3...):
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCustomProductSpec}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaPlus className="text-[9px]" /> + Add Point {(customProductForm.specifications || []).length + 1}
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(customProductForm.specifications || [""]).map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-black flex items-center justify-center shrink-0 border border-indigo-200">
                          {sIdx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={`Specification point ${sIdx + 1} (e.g. Capacity 2000 kN, Digital display)...`}
                          value={spec}
                          onChange={(e) => handleCustomProductSpecChange(sIdx, e.target.value)}
                          className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                        {(customProductForm.specifications || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomProductSpec(sIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs cursor-pointer"
                            title="Remove point"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Additional Scope Notes / General Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Any extra notes or NABL calibration standard references..."
                    value={customProductForm.description}
                    onChange={(e) => setCustomProductForm({ ...customProductForm, description: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Security & Website Shield Info Banner */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5">
                <span className="text-emerald-700 text-sm mt-0.5 shrink-0">
                  <FaCheckCircle />
                </span>
                <div className="space-y-0.5">
                  <strong className="text-xs block font-bold text-emerald-900">
                    Internal Catalog Protection Active
                  </strong>
                  <p className="text-[11px] text-emerald-800">
                    Yeh product Cloudinary par secure upload hoga aur future quotations ke auto-suggestions me hamesha aayega, lekin <strong>website ke public frontend par show NAHI hoga</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCustomProductModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomProduct}
                disabled={savingCustomProduct || !customProductForm.name.trim()}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCheck />
                <span>
                  {savingCustomProduct
                    ? "Uploading to Cloudinary..."
                    : "Save to Catalog & Add to Quotation"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
