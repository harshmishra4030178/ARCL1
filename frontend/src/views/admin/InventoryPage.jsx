"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  FaBoxes,
  FaWarehouse,
  FaHistory,
  FaFileInvoiceDollar,
  FaTruckLoading,
  FaExclamationTriangle,
  FaChartLine,
  FaPlus,
  FaSync,
  FaSearch,
  FaFilter,
  FaFileExcel,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaPencilAlt,
  FaTrash,
  FaList,
  FaThLarge,
  FaChevronDown,
  FaChevronUp,
  FaExclamationCircle,
  FaEye,
  FaArrowRight,
  FaBan,
  FaBuilding,
  FaBarcode,
  FaShieldAlt,
  FaExchangeAlt,
  FaShoppingBag,
} from "react-icons/fa";
import { MdOutlineInventory2, MdPendingActions, MdLocalShipping } from "react-icons/md";
import { RiTruckLine } from "react-icons/ri";
import { useAuthStore } from "../../store/useAuthStore.js";
import { hasModuleAccess, isSuperAdmin } from "../../utils/rbac.js";
import {
  getInventoryDashboardStatsApi,
  getInventoryListApi,
  getInventoryByIdApi,
  initializeProductStockApi,
  adjustStockApi,
  updateInventorySettingsApi,
  getStockMovementsApi,
  updateStockMovementApi,
  deleteStockMovementApi,
  getWarehousesApi,
  createWarehouseApi,
  updateWarehouseApi,
  deleteWarehouseApi,
  getSuppliersApi,
  createSupplierApi,
  updateSupplierApi,
  getPurchaseOrdersApi,
  createPurchaseOrderApi,
  approvePurchaseOrderApi,
  receivePurchaseOrderGoodsApi,
  cancelPurchaseOrderApi,
  getWarehouseTransfersApi,
  createWarehouseTransferApi,
  dispatchWarehouseTransferApi,
  receiveWarehouseTransferApi,
  getAlertsApi,
  acknowledgeAlertApi,
  resolveAlertApi,
  generateReorderPOFromAlertApi,
  getInventoryReportApi,
  syncAllInventoryApi,
} from "../../api/inventoryApi.js";
import { getAdminProducts } from "../../api/productApi.js";
import ProductAutoSuggest from "../../components/admin/inventory/ProductAutoSuggest.jsx";
import { verifyGstApi } from "../../api/calibrationApi.js";
import PurchaseManagementSection from "../../components/admin/inventory/PurchaseManagementSection.jsx";

export default function InventoryPage() {
  const { user } = useAuthStore();

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview");

  // Global Refresh State
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalCatalogProducts: 0,
    totalInventorySkus: 0,
    totalOnHandUnits: 0,
    totalAvailableUnits: 0,
    totalReservedUnits: 0,
    totalIncomingUnits: 0,
    totalDamagedUnits: 0,
    totalInventoryValuation: 0,
    lowStockProductsCount: 0,
    outOfStockProductsCount: 0,
    activeAlertsCount: 0,
    pendingPurchaseOrdersCount: 0,
    pendingTransfersInTransitCount: 0,
    totalActiveWarehouses: 0,
    totalActiveSuppliers: 0,
    recentMovements: [],
    criticalAlerts: [],
  });

  // Data Collections
  const [stockItems, setStockItems] = useState([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockPage, setStockPage] = useState(1);
  const [stockSearch, setStockSearch] = useState("");
  const [stockWarehouseFilter, setStockWarehouseFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("");

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poSearch, setPoSearch] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("");
  const [poWarehouseFilter, setPoWarehouseFilter] = useState("");
  const [poFromDate, setPoFromDate] = useState("");
  const [poToDate, setPoToDate] = useState("");
  const [poDatePreset, setPoDatePreset] = useState("all");

  const applyPoDatePreset = (preset) => {
    setPoDatePreset(preset);
    const now = new Date();
    const toDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "all") {
      setPoFromDate("");
      setPoToDate("");
      return;
    }
    if (preset === "today") {
      const s = toDateStr(now);
      setPoFromDate(s);
      setPoToDate(s);
      return;
    }
    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const s = toDateStr(y);
      setPoFromDate(s);
      setPoToDate(s);
      return;
    }
    if (preset === "this_week") {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      setPoFromDate(toDateStr(start));
      setPoToDate(toDateStr(now));
      return;
    }
    if (preset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setPoFromDate(toDateStr(start));
      setPoToDate(toDateStr(now));
      return;
    }
    if (preset === "last_30_days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      setPoFromDate(toDateStr(start));
      setPoToDate(toDateStr(now));
      return;
    }
    if (preset === "this_year") {
      const start = new Date(now.getFullYear(), 0, 1);
      setPoFromDate(toDateStr(start));
      setPoToDate(toDateStr(now));
      return;
    }
  };

  const [transfers, setTransfers] = useState([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferStatusFilter, setTransferStatusFilter] = useState("");

  const [alerts, setAlerts] = useState([]);
  const [alertSearch, setAlertSearch] = useState("");
  const [alertStatusFilter, setAlertStatusFilter] = useState("");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("");

  const [movements, setMovements] = useState([]);
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("");

  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // Product Catalog for dropdown pickers
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Modals state
  const [showInitModal, setShowInitModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showEditWarehouseModal, setShowEditWarehouseModal] = useState(false);
  const [editWarehouseForm, setEditWarehouseForm] = useState(null);
  const [showDeleteWarehouseModal, setShowDeleteWarehouseModal] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState(null);
  const [showEditMovementModal, setShowEditMovementModal] = useState(false);
  const [editMovementForm, setEditMovementForm] = useState(null);
  const [showDeleteMovementModal, setShowDeleteMovementModal] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState(null);
  const [deleteRevertStock, setDeleteRevertStock] = useState(true);
  const [showAllOverviewWarehouses, setShowAllOverviewWarehouses] = useState(false);
  const [overviewWarehouseLimit, setOverviewWarehouseLimit] = useState(3);
  const [warehouseViewMode, setWarehouseViewMode] = useState("cards"); // 'cards' | 'table'
  const [warehousePageSize, setWarehousePageSize] = useState(12); // 6, 12, 24, or 999
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReceiveTransferModal, setShowReceiveTransferModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Form States
  const [initForm, setInitForm] = useState({
    productId: "",
    productName: "",
    sku: "",
    categoryName: "General Lab Equipment",
    isNewProduct: false,
    warehouseId: "",
    openingQty: 10,
    minThreshold: 5,
    reorderQty: 10,
    unitCost: 0,
    locationBin: "BAY-1",
    notes: "Opening Stock Audit",
  });

  const [adjustForm, setAdjustForm] = useState({
    type: "CORRECTION_ADD",
    quantity: 1,
    reason: "",
    notes: "",
  });

  const [settingsForm, setSettingsForm] = useState({
    minThreshold: 5,
    reorderQty: 10,
    locationBin: "BAY-1",
    unitCost: 0,
    status: "IN_STOCK",
  });

  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    address: "",
    city: "Navi Mumbai",
    state: "Maharashtra",
    pincode: "400701",
    manager: "ARCL Operations",
    contactPhone: "",
    contactEmail: "",
    isDefault: false,
    notes: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    code: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    gstin: "",
    paymentTerms: "Net 30 Days",
    categories: ["Lab Equipment"],
    notes: "",
  });

  const [isVerifyingSupplierGst, setIsVerifyingSupplierGst] = useState(false);

  const handleAutoFetchSupplierGst = async (rawGst) => {
    const clean = String(rawGst || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean || clean.length < 15) return;
    try {
      setIsVerifyingSupplierGst(true);
      const res = await verifyGstApi(clean);
      const payload = res?.data?.data || res?.data;
      if (res?.data?.success && payload) {
        const comp = payload.companyName || payload.tradeName || payload.legalName || "";
        const addr = payload.addr || payload.address?.line1 || (typeof payload.address === "string" ? payload.address : "");
        const city = payload.city || payload.address?.city || "";
        const state = payload.stateName || payload.state || "";
        const pin = payload.pincode || payload.address?.pincode || "";

        const finalGst = payload.gstin || clean;
        setSupplierForm((prev) => ({
          ...prev,
          gstin: finalGst,
          name: comp || prev.name,
          address: addr || prev.address,
          city: city || prev.city,
          state: state || prev.state,
          pincode: pin || prev.pincode,
        }));
        toast.success(`GSTIN Verified: ${comp}`);
      } else {
        toast.info(res?.data?.error || "GSTIN format valid hai. Details manually enter kar sakte hain.");
      }
    } catch (_) {
    } finally {
      setIsVerifyingSupplierGst(false);
    }
  };

  const [poForm, setPoForm] = useState({
    supplierId: "",
    destinationWarehouseId: "",
    expectedDeliveryDate: "",
    items: [{ productId: "", orderedQty: 1, unitPrice: 0 }],
    notes: "",
  });

  const [receiveForm, setReceiveForm] = useState({
    challanNo: "",
    invoiceNo: "",
    notes: "",
    itemsReceived: [],
  });

  const [transferForm, setTransferForm] = useState({
    sourceWarehouseId: "",
    destinationWarehouseId: "",
    trackingRef: "",
    vehicleNumber: "",
    notes: "",
    items: [{ productId: "", requestedQty: 1 }],
  });

  const [receiveTransferForm, setReceiveTransferForm] = useState({
    receivingNotes: "",
    itemsReceived: [],
  });

  // Permissions checks
  const canAdjust = isSuperAdmin(user) || hasModuleAccess(user, "inventory", "adjust");
  const canPurchases = isSuperAdmin(user) || hasModuleAccess(user, "inventory", "purchases");
  const canReceive = isSuperAdmin(user) || hasModuleAccess(user, "inventory", "receive");
  const canTransfers = isSuperAdmin(user) || hasModuleAccess(user, "inventory", "transfers");
  const canWarehouses = isSuperAdmin(user) || hasModuleAccess(user, "inventory", "warehouses");
  const canAlerts = isSuperAdmin(user) || hasModuleAccess(user, "inventory", "alerts");

  // Load Dashboard Stats
  const loadDashboardStats = useCallback(async () => {
    try {
      const res = await getInventoryDashboardStatsApi();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn("loadDashboardStats error:", err);
    }
  }, []);

  // Load Stock Inventory
  const loadStockList = useCallback(async () => {
    try {
      const res = await getInventoryListApi({
        search: stockSearch,
        warehouse: stockWarehouseFilter,
        status: stockStatusFilter,
        page: stockPage,
        limit: 20,
      });
      if (res?.data) {
        setStockItems(res.data.items || []);
        setStockTotal(res.data.total || 0);
      }
    } catch (err) {
      console.warn("loadStockList error:", err);
    }
  }, [stockSearch, stockWarehouseFilter, stockStatusFilter, stockPage]);

  // Load Warehouses
  const loadWarehouses = useCallback(async () => {
    try {
      const res = await getWarehousesApi();
      if (res?.data) {
        setWarehouses(res.data || []);
      }
    } catch (err) {
      console.warn("loadWarehouses error:", err);
    }
  }, []);

  // Load Suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      const res = await getSuppliersApi({
        search: supplierSearch,
        isActive: supplierStatusFilter,
        limit: 100,
      });
      if (res?.data) {
        setSuppliers(res.data.suppliers || []);
      }
    } catch (err) {
      console.warn("loadSuppliers error:", err);
    }
  }, [supplierSearch, supplierStatusFilter]);

  // Load Purchase Orders
  const loadPurchaseOrders = useCallback(async () => {
    try {
      const res = await getPurchaseOrdersApi({
        search: poSearch,
        status: poStatusFilter,
        warehouse: poWarehouseFilter || undefined,
        fromDate: poFromDate || undefined,
        toDate: poToDate || undefined,
        limit: 100,
      });
      if (res?.data) {
        setPurchaseOrders(res.data.orders || []);
      }
    } catch (err) {
      console.warn("loadPurchaseOrders error:", err);
    }
  }, [poSearch, poStatusFilter, poWarehouseFilter, poFromDate, poToDate]);

  // Load Transfers
  const loadTransfers = useCallback(async () => {
    try {
      const res = await getWarehouseTransfersApi({
        status: transferStatusFilter,
        limit: 50,
      });
      if (res?.data) {
        setTransfers(res.data.transfers || []);
      }
    } catch (err) {
      console.warn("loadTransfers error:", err);
    }
  }, [transferStatusFilter]);

  // Load Alerts
  const loadAlerts = useCallback(async () => {
    try {
      const res = await getAlertsApi({
        status: alertStatusFilter || "ALL",
        severity: alertSeverityFilter,
        limit: 50,
      });
      if (res?.data) {
        setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.warn("loadAlerts error:", err);
    }
  }, [alertStatusFilter, alertSeverityFilter]);

  // Load Movements
  const loadMovements = useCallback(async () => {
    try {
      const res = await getStockMovementsApi({
        search: movementSearch,
        movementType: movementTypeFilter,
        limit: 100,
      });
      if (res?.data) {
        setMovements(res.data.movements || []);
      }
    } catch (err) {
      console.warn("loadMovements error:", err);
    }
  }, [movementSearch, movementTypeFilter]);

  // Load Catalog Products for Selector
  const loadCatalogProducts = useCallback(async () => {
    try {
      const res = await getAdminProducts({ limit: 200 });
      if (res?.data) {
        const prods = Array.isArray(res.data) ? res.data : res.data.products || [];
        setCatalogProducts(prods);
      }
    } catch (err) {
      console.warn("loadCatalogProducts error:", err);
    }
  }, []);

  // Combined Sales & Purchases Stock Register Report States
  const [combinedReport, setCombinedReport] = useState([]);
  const [combinedReportLoading, setCombinedReportLoading] = useState(false);
  const [combinedSummary, setCombinedSummary] = useState({
    totalSkus: 0,
    totalOnHandUnits: 0,
    totalAvailableUnits: 0,
    totalPurchasedUnits: 0,
    totalSoldUnits: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [reportSearch, setReportSearch] = useState("");
  const [reportWarehouseFilter, setReportWarehouseFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const loadCombinedReport = useCallback(async () => {
    setCombinedReportLoading(true);
    try {
      const res = await getInventoryReportApi({ reportType: "COMBINED_STOCK_REGISTER" });
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setCombinedReport(list);
        if (res.data.summary) {
          setCombinedSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.warn("Failed to load combined inventory report:", err.message);
    } finally {
      setCombinedReportLoading(false);
    }
  }, []);

  const handleSyncAllSalesPurchases = async () => {
    setIsSyncingAll(true);
    try {
      const res = await syncAllInventoryApi();
      toast.success(res?.message || "Sales, Purchases & Stock synchronized successfully!");
      await refreshAll();
      await loadCombinedReport();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Auto-sync failed.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Master Refresh
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardStats(),
        loadStockList(),
        loadWarehouses(),
        loadSuppliers(),
        loadPurchaseOrders(),
        loadTransfers(),
        loadAlerts(),
        loadMovements(),
        loadCombinedReport(),
      ]);
      setLastRefreshed(new Date());
    } catch (err) {
      toast.error("Failed to refresh inventory data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [
    loadDashboardStats,
    loadStockList,
    loadWarehouses,
    loadSuppliers,
    loadPurchaseOrders,
    loadTransfers,
    loadAlerts,
    loadMovements,
    loadCombinedReport,
  ]);

  useEffect(() => {
    refreshAll();
    loadCatalogProducts();
  }, [refreshAll, loadCatalogProducts]);

  // Live Auto-Refresh (Every 30 seconds when enabled)
  useEffect(() => {
    if (!isAutoRefresh) return;
    const timer = setInterval(() => {
      refreshAll();
    }, 30000);
    return () => clearInterval(timer);
  }, [isAutoRefresh, refreshAll]);

  // ==========================================
  // HANDLERS: STOCK INITIALIZATION & ADJUSTMENTS
  // ==========================================

  const handleOpenInitModal = () => {
    const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0];
    setInitForm({
      productId: "",
      productName: "",
      sku: "",
      categoryName: "General Lab Equipment",
      isNewProduct: false,
      warehouseId: defaultWh?._id || "",
      openingQty: 10,
      minThreshold: 5,
      reorderQty: 10,
      unitCost: 0,
      locationBin: "BAY-1",
      notes: "Opening Stock Audit",
    });
    setShowInitModal(true);
  };

  const handleInitStockSubmit = async (e) => {
    e.preventDefault();
    if (!initForm.productId && !initForm.productName?.trim()) {
      toast.error("Please select an existing product or enter a product name.");
      return;
    }
    try {
      setLoading(true);
      await initializeProductStockApi(initForm);
      toast.success(
        initForm.isNewProduct
          ? `✓ New product '${initForm.productName}' onboarded and saved into Inventory permanently!`
          : "✓ Product stock initialized successfully with opening balance audit."
      );
      setShowInitModal(false);
      await loadCatalogProducts();
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to initialize stock.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjustModal = (item) => {
    setSelectedInventory(item);
    setAdjustForm({
      type: "CORRECTION_ADD",
      quantity: 1,
      reason: "",
      notes: "",
    });
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.reason.trim()) {
      toast.error("Mandatory reason code is required for stock adjustment.");
      return;
    }
    try {
      setLoading(true);
      await adjustStockApi({
        inventoryId: selectedInventory._id,
        type: adjustForm.type,
        quantity: parseInt(adjustForm.quantity, 10),
        reason: adjustForm.reason.trim(),
        notes: adjustForm.notes.trim(),
      });
      toast.success("✓ Stock adjusted successfully with permanent audit trail.");
      setShowAdjustModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Adjustment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettingsModal = (item) => {
    setSelectedInventory(item);
    setSettingsForm({
      minThreshold: item.minThreshold || 5,
      reorderQty: item.reorderQty || 10,
      locationBin: item.locationBin || "BAY-1",
      unitCost: item.unitCost || 0,
      status: item.status || "IN_STOCK",
    });
    setShowSettingsModal(true);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateInventorySettingsApi(selectedInventory._id, settingsForm);
      toast.success("✓ Inventory thresholds and location updated.");
      setShowSettingsModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Settings update failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: WAREHOUSES & TRANSFERS
  // ==========================================

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseForm.code || !warehouseForm.name) {
      toast.error("Code and Name are required.");
      return;
    }
    try {
      setLoading(true);
      await createWarehouseApi(warehouseForm);
      toast.success(`✓ Warehouse '${warehouseForm.name}' created successfully.`);
      setShowWarehouseModal(false);
      setWarehouseForm({
        code: "",
        name: "",
        address: "",
        city: "Navi Mumbai",
        state: "Maharashtra",
        pincode: "400701",
        manager: "ARCL Operations",
        contactPhone: "",
        contactEmail: "",
        isDefault: false,
        notes: "",
      });
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create warehouse.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditWarehouse = (w) => {
    setEditWarehouseForm({
      _id: w._id,
      code: w.code || "",
      name: w.name || "",
      address: w.address || "",
      city: w.city || "",
      state: w.state || "",
      pincode: w.pincode || "",
      manager: w.manager || "",
      contactPhone: w.contactPhone || "",
      contactEmail: w.contactEmail || "",
      isDefault: !!w.isDefault,
      isActive: w.isActive !== undefined ? w.isActive : true,
      notes: w.notes || "",
    });
    setShowEditWarehouseModal(true);
  };

  const handleEditWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!editWarehouseForm?._id) return;
    if (!editWarehouseForm.code || !editWarehouseForm.name) {
      toast.error("Warehouse Code and Name are required.");
      return;
    }
    try {
      setLoading(true);
      await updateWarehouseApi(editWarehouseForm._id, editWarehouseForm);
      toast.success(`✓ Warehouse '${editWarehouseForm.name}' updated successfully.`);
      setShowEditWarehouseModal(false);
      setEditWarehouseForm(null);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update warehouse.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteWarehouse = (w) => {
    setWarehouseToDelete(w);
    setShowDeleteWarehouseModal(true);
  };

  const handleConfirmDeleteWarehouse = async () => {
    if (!warehouseToDelete?._id) return;
    try {
      setLoading(true);
      const res = await deleteWarehouseApi(warehouseToDelete._id);
      toast.success(res.message || `✓ Warehouse '${warehouseToDelete.name}' deleted successfully.`);
      setShowDeleteWarehouseModal(false);
      setWarehouseToDelete(null);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete warehouse.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: AUDIT MOVEMENTS EDIT & DELETE
  // ==========================================

  const handleOpenEditMovement = (m) => {
    setEditMovementForm({
      _id: m._id,
      productName: m.productName,
      sku: m.sku,
      warehouseCode: m.warehouseCode,
      movementType: m.movementType,
      quantity: m.quantity,
      referenceId: m.referenceId || "",
      reason: m.reason || "",
      notes: m.notes || "",
      syncInventory: true,
      balanceBefore: m.balanceBefore,
      balanceAfter: m.balanceAfter,
      createdAt: m.createdAt,
    });
    setShowEditMovementModal(true);
  };

  const handleEditMovementSubmit = async (e) => {
    e.preventDefault();
    if (!editMovementForm?._id) return;
    if (!editMovementForm.reason?.trim()) {
      toast.error("Adjustment reason is required.");
      return;
    }
    try {
      setLoading(true);
      await updateStockMovementApi(editMovementForm._id, {
        movementType: editMovementForm.movementType,
        quantity: Number(editMovementForm.quantity),
        referenceId: editMovementForm.referenceId,
        reason: editMovementForm.reason,
        notes: editMovementForm.notes,
        syncInventory: editMovementForm.syncInventory,
      });
      toast.success("✓ Audit movement record updated successfully.");
      setShowEditMovementModal(false);
      setEditMovementForm(null);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update movement.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteMovement = (m) => {
    setMovementToDelete(m);
    setDeleteRevertStock(true);
    setShowDeleteMovementModal(true);
  };

  const handleConfirmDeleteMovement = async () => {
    if (!movementToDelete?._id) return;
    try {
      setLoading(true);
      await deleteStockMovementApi(movementToDelete._id, { revertStock: deleteRevertStock });
      toast.success("✓ Audit movement record deleted successfully.");
      setShowDeleteMovementModal(false);
      setMovementToDelete(null);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete movement.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTransferModal = () => {
    if (warehouses.length < 2) {
      toast.error("At least two warehouses are required to perform a transfer.");
      return;
    }
    setTransferForm({
      sourceWarehouseId: warehouses[0]?._id || "",
      destinationWarehouseId: warehouses[1]?._id || "",
      trackingRef: "",
      vehicleNumber: "",
      notes: "",
      items: [{ productId: stockItems[0]?.product?._id || "", requestedQty: 1 }],
    });
    setShowTransferModal(true);
  };

  const handleCreateTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createWarehouseTransferApi(transferForm);
      toast.success("✓ Warehouse transfer order created in Draft status.");
      setShowTransferModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create transfer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchTransfer = async (transfer) => {
    if (!confirm(`Are you sure you want to DISPATCH transfer ${transfer.transferNumber}? Stock will be deducted from ${transfer.sourceWarehouseCode} and set In-Transit.`)) {
      return;
    }
    try {
      setLoading(true);
      await dispatchWarehouseTransferApi(transfer._id, {
        trackingRef: transfer.trackingRef || "N/A",
        vehicleNumber: transfer.vehicleNumber || "N/A",
        dispatchNotes: "Dispatched from warehouse dock.",
      });
      toast.success(`✓ Transfer ${transfer.transferNumber} marked Dispatched.`);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Dispatch failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveTransferModal = (transfer) => {
    setSelectedTransfer(transfer);
    setReceiveTransferForm({
      receivingNotes: "Accepted into destination stock.",
      itemsReceived: transfer.items.map((i) => ({
        itemId: i._id,
        productId: i.product?._id || i.product,
        productName: i.productName,
        sku: i.sku,
        dispatchedQty: i.dispatchedQty,
        acceptedQty: Math.max(0, i.dispatchedQty - (i.receivedQty || 0)),
        damagedQty: 0,
      })),
    });
    setShowReceiveTransferModal(true);
  };

  const handleReceiveTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await receiveWarehouseTransferApi(selectedTransfer._id, receiveTransferForm);
      toast.success(`✓ Goods accepted into destination warehouse.`);
      setShowReceiveTransferModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Receiving failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: SUPPLIERS & PURCHASE ORDERS
  // ==========================================

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.name) {
      toast.error("Supplier name is required.");
      return;
    }
    try {
      setLoading(true);
      await createSupplierApi(supplierForm);
      toast.success(`✓ Supplier '${supplierForm.name}' created successfully.`);
      setShowSupplierModal(false);
      setSupplierForm({
        code: "",
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "Maharashtra",
        pincode: "",
        gstin: "",
        paymentTerms: "Net 30 Days",
        categories: ["Lab Equipment"],
        notes: "",
      });
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create supplier.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPOModal = () => {
    const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0];
    setPoForm({
      supplierId: suppliers[0]?._id || "",
      destinationWarehouseId: defaultWh?._id || "",
      expectedDeliveryDate: "",
      items: [{ productId: "", orderedQty: 5, unitPrice: 25000 }],
      notes: "Standard monthly batch procurement.",
    });
    setShowPOModal(true);
  };

  const handleAddPOLine = () => {
    setPoForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", orderedQty: 1, unitPrice: 0 }],
    }));
  };

  const handleRemovePOLine = (index) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handlePOSubmit = async (e) => {
    e.preventDefault();
    if (!poForm.supplierId || !poForm.destinationWarehouseId) {
      toast.error("Supplier and destination warehouse are required.");
      return;
    }
    try {
      setLoading(true);
      const res = await createPurchaseOrderApi(poForm);
      toast.success(`✓ Purchase Order ${res.data?.poNumber} created in Draft.`);
      setShowPOModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create PO.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePO = async (po) => {
    if (!confirm(`Are you sure you want to approve PO ${po.poNumber}? Incoming stock count will be allocated.`)) {
      return;
    }
    try {
      setLoading(true);
      await approvePurchaseOrderApi(po._id, { notes: "Approved by Admin" });
      toast.success(`✓ PO ${po.poNumber} approved and marked ORDERED.`);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Approval failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveModal = (po) => {
    setSelectedPO(po);
    setReceiveForm({
      challanNo: `CH-${Date.now().toString().slice(-6)}`,
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      notes: "Received at warehouse dock and verified.",
      itemsReceived: po.items.map((i) => ({
        itemId: i._id,
        productId: i.product?._id || i.product,
        productName: i.productName,
        sku: i.sku,
        orderedQty: i.orderedQty,
        receivedQty: i.receivedQty || 0,
        pendingQty: i.orderedQty - (i.receivedQty || 0),
        acceptedQty: Math.max(0, i.orderedQty - (i.receivedQty || 0)),
        damagedQty: 0,
      })),
    });
    setShowReceiveModal(true);
  };

  const handleReceivePOSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await receivePurchaseOrderGoodsApi(selectedPO._id, receiveForm);
      toast.success("✓ Goods inward successfully recorded. Stock and Weighted Cost updated!");
      setShowReceiveModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Inward failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: ALERTS & REORDERS
  // ==========================================

  const handleAcknowledgeAlert = async (id) => {
    try {
      setLoading(true);
      await acknowledgeAlertApi(id);
      toast.success("✓ Alert acknowledged.");
      refreshAll();
    } catch (err) {
      toast.error(err.message || "Failed to acknowledge alert.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      setLoading(true);
      await resolveAlertApi(id, { resolutionNotes: "Manually resolved from alert desk." });
      toast.success("✓ Alert resolved.");
      refreshAll();
    } catch (err) {
      toast.error(err.message || "Failed to resolve alert.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReorderPO = async (id) => {
    try {
      setLoading(true);
      const res = await generateReorderPOFromAlertApi(id);
      toast.success(`✓ Draft Reorder PO ${res.data?.poNumber} generated successfully!`);
      refreshAll();
      setActiveTab("purchases");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to generate PO.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS: EXPORTS (EXCEL & CSV)
  // ==========================================

  const handleExportStockExcel = () => {
    if (stockItems.length === 0) {
      toast.warn("No stock items to export.");
      return;
    }
    const exportData = stockItems.map((item) => ({
      "Product SKU": item.sku,
      "Product Name": item.productName,
      Category: item.categoryName || item.category?.name || "General",
      Warehouse: item.warehouseCode,
      "On-Hand Units": item.onHand,
      "Reserved Units": item.reserved,
      "Available Units": Math.max(0, item.onHand - item.reserved),
      "Incoming Units": item.incoming || 0,
      "Quarantined / Damaged": item.damaged || 0,
      "Min Threshold": item.minThreshold,
      "Reorder Quantity": item.reorderQty,
      "Unit Cost (₹)": item.unitCost || 0,
      "Total Valuation (₹)": (item.onHand || 0) * (item.unitCost || 0),
      "Bin / Rack": item.locationBin || "BAY-1",
      Status: item.status,
      "Last Movement Date": item.lastMovementDate ? new Date(item.lastMovementDate).toLocaleDateString("en-IN") : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_Stock");
    XLSX.writeFile(wb, `ARCL_Inventory_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("✓ Inventory stock exported to Excel (.xlsx) successfully.");
  };

  const handleExportMovementsExcel = () => {
    if (movements.length === 0) {
      toast.warn("No movements to export.");
      return;
    }
    const exportData = movements.map((m) => ({
      "Date & Time": new Date(m.createdAt).toLocaleString("en-IN"),
      SKU: m.sku,
      "Product Name": m.productName,
      Warehouse: m.warehouseCode,
      "Movement Type": m.movementType,
      "Quantity Change": m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`,
      "Balance Before": m.balanceBefore,
      "Balance After": m.balanceAfter,
      "Reference ID": m.referenceId,
      Reason: m.reason,
      "Performed By": m.performedByName,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock_Movements");
    XLSX.writeFile(wb, `ARCL_Stock_Movements_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("✓ Movements audit log exported to Excel (.xlsx) successfully.");
  };

  const handleExportCombinedExcel = () => {
    const listToExport = filteredCombinedReport.length > 0 ? filteredCombinedReport : combinedReport;
    if (listToExport.length === 0) {
      toast.warn("No stock records to export.");
      return;
    }
    const exportData = listToExport.map((r, idx) => ({
      "#": idx + 1,
      "Product SKU": r.sku,
      "Product Name": r.productName,
      Category: r.category,
      Warehouse: r.warehouse || r.warehouseName,
      "Total Purchased (Inward)": r.purchasedQty || 0,
      "Total Sold (Outward)": r.soldQty || 0,
      "Opening Stock": r.openingStock || 0,
      "Current Stock On Hand": r.onHand || 0,
      "Available Saleable Units": r.available || 0,
      "Reserved Units": r.reserved || 0,
      "Weighted Unit Cost (₹)": r.unitCost || 0,
      "Selling Price (₹)": r.sellingPrice || 0,
      "Total Stock Valuation (₹)": r.totalValuation || 0,
      "Stock Health Status": r.status,
      "Location Bin": r.bin || "BAY-1",
      "Last Purchase Date": r.lastPurchaseDate ? new Date(r.lastPurchaseDate).toLocaleDateString("en-IN") : "N/A",
      "Last Sale Date": r.lastSaleDate ? new Date(r.lastSaleDate).toLocaleDateString("en-IN") : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales_Purchase_Stock");
    XLSX.writeFile(wb, `ARCL_Sales_Purchase_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("✓ Complete Sales & Purchase Stock Register exported to Excel (.xlsx)!");
  };

  const handleExportCombinedCsv = () => {
    const listToExport = filteredCombinedReport.length > 0 ? filteredCombinedReport : combinedReport;
    if (listToExport.length === 0) {
      toast.warn("No stock records to export.");
      return;
    }
    const exportData = listToExport.map((r, idx) => ({
      "#": idx + 1,
      "Product SKU": r.sku,
      "Product Name": r.productName,
      Category: r.category,
      Warehouse: r.warehouse || r.warehouseName,
      "Total Purchased (Inward)": r.purchasedQty || 0,
      "Total Sold (Outward)": r.soldQty || 0,
      "Current Stock On Hand": r.onHand || 0,
      "Available Saleable Units": r.available || 0,
      "Unit Cost (₹)": r.unitCost || 0,
      "Total Stock Valuation (₹)": r.totalValuation || 0,
      "Stock Health Status": r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ARCL_Sales_Purchase_Stock_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("✓ CSV exported successfully!");
  };

  const filteredCombinedReport = useMemo(() => {
    return combinedReport.filter((r) => {
      if (reportWarehouseFilter !== "all" && r.warehouse !== reportWarehouseFilter) return false;
      if (reportStatusFilter !== "all" && r.status !== reportStatusFilter) return false;
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase().trim();
        const sku = (r.sku || "").toLowerCase();
        const name = (r.productName || "").toLowerCase();
        const cat = (r.category || "").toLowerCase();
        const wh = (r.warehouse || "").toLowerCase();
        if (!sku.includes(q) && !name.includes(q) && !cat.includes(q) && !wh.includes(q)) return false;
      }
      return true;
    });
  }, [combinedReport, reportWarehouseFilter, reportStatusFilter, reportSearch]);

  // Dynamic client-side filtered warehouses
  const filteredWarehouses = useMemo(() => {
    if (!warehouseSearch.trim()) return warehouses;
    const q = warehouseSearch.toLowerCase().trim();
    return warehouses.filter(
      (w) =>
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.city && w.city.toLowerCase().includes(q)) ||
        (w.manager && w.manager.toLowerCase().includes(q))
    );
  }, [warehouses, warehouseSearch]);

  // Dynamic client-side filtered transfers
  const filteredTransfers = useMemo(() => {
    if (!transferSearch.trim()) return transfers;
    const q = transferSearch.toLowerCase().trim();
    return transfers.filter(
      (t) =>
        (t.transferNumber && t.transferNumber.toLowerCase().includes(q)) ||
        (t.sourceWarehouse?.name && t.sourceWarehouse.name.toLowerCase().includes(q)) ||
        (t.destinationWarehouse?.name && t.destinationWarehouse.name.toLowerCase().includes(q)) ||
        (t.vehicleNumber && t.vehicleNumber.toLowerCase().includes(q))
    );
  }, [transfers, transferSearch]);

  // Dynamic client-side filtered alerts
  const filteredAlerts = useMemo(() => {
    if (!alertSearch.trim()) return alerts;
    const q = alertSearch.toLowerCase().trim();
    return alerts.filter(
      (a) =>
        (a.sku && a.sku.toLowerCase().includes(q)) ||
        (a.productName && a.productName.toLowerCase().includes(q)) ||
        (a.warehouseCode && a.warehouseCode.toLowerCase().includes(q)) ||
        (a.message && a.message.toLowerCase().includes(q))
    );
  }, [alerts, alertSearch]);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen text-slate-800">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TELEMETRY */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <FaWarehouse className="text-xl" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Inventory & Stock Management Hub
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider border border-blue-200">
                  Production Ready
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Enterprise Multi-Warehouse Stock, Inter-Warehouse Transfers, Procurements & Audit Trail • ARCL Instruments Private Limited
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-mono">Last Synchronized</span>
            <span className="text-xs font-medium text-slate-700 font-mono">
              {lastRefreshed.toLocaleTimeString("en-IN")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !isAutoRefresh;
              setIsAutoRefresh(next);
              if (next) toast.info("✓ Live Auto-Sync activated (30s refresh cycle)");
              else toast.info("Live Auto-Sync paused");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border shadow-xs transition-colors cursor-pointer ${
              isAutoRefresh
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
            title="Toggle 30s Automated Background Sync"
          >
            <span className={`w-2 h-2 rounded-full ${isAutoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>{isAutoRefresh ? "Live Sync: ON" : "Live Sync: OFF"}</span>
          </button>

          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-xs transition-colors cursor-pointer"
          >
            <FaSync className={loading ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>Refresh</span>
          </button>

          {canAdjust && (
            <button
              onClick={handleOpenInitModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
            >
              <FaPlus />
              <span>Record Opening Stock</span>
            </button>
          )}

          {canPurchases && (
            <button
              onClick={handleOpenPOModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              <FaFileInvoiceDollar />
              <span>New Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB NAVIGATION */}
      {/* ======================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200 scrollbar-thin">
        {[
          { id: "overview", label: "Overview & KPIs", icon: <FaChartLine /> },
          { id: "stock", label: "Stock Management", count: stats.totalInventorySkus, icon: <FaBoxes /> },
          { id: "movements", label: "Audit Movements", icon: <FaHistory /> },
          { id: "warehouses", label: "Warehouses", count: stats.totalActiveWarehouses, icon: <FaWarehouse /> },
          { id: "purchases", label: "Purchases & Expenses", icon: <FaShoppingBag /> },
          { id: "suppliers", label: "Suppliers", count: stats.totalActiveSuppliers, icon: <FaBuilding /> },
          { id: "alerts", label: "Low-Stock Alerts", count: stats.activeAlertsCount, isAlert: stats.activeAlertsCount > 0, icon: <FaExclamationTriangle /> },
          { id: "reports", label: "Sales & Purchase Ledger", icon: <FaFileExcel /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab.isAlert
                    ? "bg-red-500 text-white animate-pulse"
                    : activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & DASHBOARD KPIS */}
      {/* ======================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          
          {/* CRITICAL ALERTS BANNER IF ANY */}
          {stats.activeAlertsCount > 0 && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    Attention Required: {stats.activeAlertsCount} Active Stock Alert{stats.activeAlertsCount > 1 ? "s" : ""}
                  </h4>
                  <p className="text-[11px] text-red-700">
                    {stats.outOfStockProductsCount} item(s) are completely out of stock and {stats.lowStockProductsCount} item(s) have breached minimum safety thresholds.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("alerts")}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                Review & Auto-Reorder →
              </button>
            </div>
          )}

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            
            {/* 1. On Hand */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Physical On-Hand</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-sm">
                  <FaBoxes />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {stats.totalOnHandUnits.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Across {stats.totalInventorySkus} registered SKUs
              </div>
            </div>

            {/* 2. Available for Sale */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Available for Sale</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm">
                  <FaCheckCircle />
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                {stats.totalAvailableUnits.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                On-Hand ({stats.totalOnHandUnits}) minus Reserved ({stats.totalReservedUnits})
              </div>
            </div>

            {/* 3. Reserved / Quarantined */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Reserved & Damaged</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-sm">
                  <FaShieldAlt />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-700 font-mono">
                {stats.totalReservedUnits} <span className="text-xs font-normal text-slate-400">/</span> {stats.totalDamagedUnits}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.totalReservedUnits} order holds • {stats.totalDamagedUnits} in QA quarantine
              </div>
            </div>

            {/* 4. Total Valuation */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Stock Valuation</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm">
                  <FaFileInvoiceDollar />
                </span>
              </div>
              <div className="text-2xl font-bold text-indigo-700 font-mono">
                ₹{stats.totalInventoryValuation.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Weighted Average Purchase Cost (FIFO/WAC)
              </div>
            </div>

            {/* 5. Incoming on POs */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Incoming on POs</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-sm">
                  <RiTruckLine />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {stats.totalIncomingUnits.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.pendingPurchaseOrdersCount} active purchase order(s)
              </div>
            </div>

            {/* 6. In-Transit Transfers */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inter-WH In Transit</span>
                <span className="p-2 bg-sky-50 text-sky-600 rounded-lg text-sm">
                  <FaExchangeAlt />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {stats.pendingTransfersInTransitCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Transfers awaiting destination acceptance
              </div>
            </div>

            {/* 7. Low Stock Alerts */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Low Stock SKUs</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-sm">
                  <FaExclamationTriangle />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600 font-mono">
                {stats.lowStockProductsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Available &lt;= Minimum Threshold
              </div>
            </div>

            {/* 8. Out of Stock */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Out of Stock</span>
                <span className="p-2 bg-red-50 text-red-600 rounded-lg text-sm">
                  <FaTimesCircle />
                </span>
              </div>
              <div className="text-2xl font-bold text-red-600 font-mono">
                {stats.outOfStockProductsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Zero available saleable stock
              </div>
            </div>

          </div>

          {/* LOWER SECTION: RECENT MOVEMENTS & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Movements Feed (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaHistory className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Stock Movements (Audit Trail)</h3>
                </div>
                <button
                  onClick={() => setActiveTab("movements")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  View All Movements →
                </button>
              </div>

              {stats.recentMovements.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No stock movements recorded yet. Record opening stock or inward delivery to see live audits.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentMovements.map((m) => (
                    <div key={m._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{m.productName}</span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                            {m.sku}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{new Date(m.createdAt).toLocaleString("en-IN")}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">{m.warehouseCode}</span>
                          <span>•</span>
                          <span className="italic">{m.reason}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            m.quantity > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : m.quantity < 0
                              ? "bg-red-50 text-red-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Bal: {m.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions & Warehouse Quickview (1 col) */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FaWarehouse className="text-slate-600" />
                    <span>ARCL Warehouse Network</span>
                  </h3>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {warehouses.length} {warehouses.length === 1 ? "Hub" : "Hubs"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(showAllOverviewWarehouses ? warehouses : warehouses.slice(0, overviewWarehouseLimit)).map((w) => (
                    <div
                      key={w._id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-lg border border-slate-200 text-xs transition-colors group"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5 truncate pr-2">
                          <span className="truncate">{w.name}</span>
                          {w.isDefault && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold shrink-0">
                              PRIMARY
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-slate-600 text-[11px] mr-1">{w.code}</span>
                          {canWarehouses && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditWarehouse(w)}
                                title={`Edit ${w.name}`}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              >
                                <FaPencilAlt className="text-[11px]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteWarehouse(w)}
                                title={`Delete ${w.name}`}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              >
                                <FaTrash className="text-[11px]" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                        <span>{w.city}, {w.state}</span>
                        <span className="font-mono text-slate-700 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {w.stats?.totalOnHand || 0} units
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dynamic Row Expansion ("roww bhadha sake") */}
                {warehouses.length > 3 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllOverviewWarehouses(!showAllOverviewWarehouses)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      {showAllOverviewWarehouses ? (
                        <>
                          <FaChevronUp className="text-[10px]" />
                          <span>Show Less (Top 3)</span>
                        </>
                      ) : (
                        <>
                          <FaChevronDown className="text-[10px]" />
                          <span>Show All Warehouses ({warehouses.length} Total)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  {canWarehouses && (
                    <button
                      onClick={() => {
                        setShowWarehouseModal(true);
                      }}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      + Add Warehouse
                    </button>
                  )}
                  {canTransfers && (
                    <button
                      onClick={handleOpenTransferModal}
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      New Transfer
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Export Widget */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                  Compliance & Audit Exports
                </h4>
                <p className="text-xs text-slate-300 mb-4">
                  Download live inventory sheets formatted for physical stock audits, GST reconciliation & purchase planning.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportStockExcel}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <FaFileExcel />
                    <span>Stock Sheet (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleExportMovementsExcel}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FaHistory />
                    <span>Audit Log</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STOCK MANAGEMENT TABLE */}
      {/* ======================================================== */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by Product Name, SKU, or Location Bin..."
                  value={stockSearch}
                  onChange={(e) => {
                    setStockSearch(e.target.value);
                    setStockPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Warehouse Filter */}
              <select
                value={stockWarehouseFilter}
                onChange={(e) => {
                  setStockWarehouseFilter(e.target.value);
                  setStockPage(1);
                }}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setStockPage(1);
                }}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>

              {/* Export Button */}
              <button
                onClick={handleExportStockExcel}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <FaFileExcel className="text-emerald-600" />
                <span>Export (.xlsx)</span>
              </button>

              {canAdjust && (
                <button
                  onClick={handleOpenInitModal}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FaPlus />
                  <span>Onboard SKU</span>
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse / Bin</th>
                  <th className="px-4 py-3 text-right">On-Hand</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right">Incoming</th>
                  <th className="px-4 py-3 text-right">Damaged</th>
                  <th className="px-4 py-3 text-right">Threshold</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {stockItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-12 text-slate-400">
                      <MdOutlineInventory2 className="text-4xl mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No inventory records found</p>
                      <p className="text-[11px] mt-0.5">Click "Record Opening Stock" to initialize catalog products into inventory.</p>
                    </td>
                  </tr>
                ) : (
                  stockItems.map((item) => {
                    const avail = Math.max(0, (item.onHand || 0) - (item.reserved || 0));
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Product & SKU */}
                        <td className="px-4 py-3 font-medium">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded text-slate-600 border border-slate-200">
                              {item.sku}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.categoryName || item.category?.name || "General"}
                            </span>
                          </div>
                        </td>

                        {/* Warehouse & Bin */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{item.warehouseCode}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>Bin:</span>
                            <span className="font-mono font-bold text-slate-600">{item.locationBin || "BAY-1"}</span>
                          </div>
                        </td>

                        {/* On-Hand */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                          {item.onHand}
                        </td>

                        {/* Reserved */}
                        <td className="px-4 py-3 text-right font-mono text-amber-700 font-semibold">
                          {item.reserved > 0 ? `${item.reserved}` : "-"}
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              avail === 0
                                ? "bg-red-100 text-red-800 font-black"
                                : avail <= (item.minThreshold || 5)
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {avail}
                          </span>
                        </td>

                        {/* Incoming */}
                        <td className="px-4 py-3 text-right font-mono text-purple-700">
                          {item.incoming > 0 ? `+${item.incoming}` : "-"}
                        </td>

                        {/* Damaged */}
                        <td className="px-4 py-3 text-right font-mono text-red-600">
                          {item.damaged > 0 ? `${item.damaged}` : "-"}
                        </td>

                        {/* Min Threshold */}
                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {item.minThreshold || 5}
                        </td>

                        {/* Unit Cost */}
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          ₹{(item.unitCost || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === "OUT_OF_STOCK" || avail === 0
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : item.status === "LOW_STOCK" || avail <= (item.minThreshold || 5)
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {item.status || "IN_STOCK"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {canAdjust && (
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              title="Adjust Stock (Opening, Receipts, Damage, Return, Audit)"
                              className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              Adjust
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenSettingsModal(item)}
                            title="Edit Thresholds & Location Bin"
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] transition-colors cursor-pointer"
                          >
                            <FaEdit className="inline" />
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
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
            <span>
              Showing {stockItems.length} of {stockTotal} records
            </span>
            <div className="flex gap-1">
              <button
                disabled={stockPage <= 1}
                onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={stockItems.length < 20}
                onClick={() => setStockPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: AUDIT MOVEMENTS HISTORY */}
      {/* ======================================================== */}
      {activeTab === "movements" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by SKU, Product, Reference ID, Performed By..."
                  value={movementSearch}
                  onChange={(e) => setMovementSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">All Movement Types</option>
                <option value="OPENING_STOCK">OPENING_STOCK</option>
                <option value="PURCHASE_RECEIPT">PURCHASE_RECEIPT</option>
                <option value="SALES_RESERVATION">SALES_RESERVATION</option>
                <option value="SALES_DISPATCH">SALES_DISPATCH</option>
                <option value="SALES_CANCEL_RELEASE">SALES_CANCEL_RELEASE</option>
                <option value="TRANSFER_DISPATCH">TRANSFER_DISPATCH</option>
                <option value="TRANSFER_RECEIPT">TRANSFER_RECEIPT</option>
                <option value="DAMAGE_QUARANTINE">DAMAGE_QUARANTINE</option>
                <option value="RETURN_RESTOCK">RETURN_RESTOCK</option>
                <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</option>
                <option value="AUDIT_RECONCILIATION">AUDIT_RECONCILIATION</option>
              </select>

              <button
                onClick={handleExportMovementsExcel}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <FaFileExcel className="text-emerald-600" />
                <span>Export (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3 text-right">Quantity Change</th>
                  <th className="px-4 py-3 text-right">Balance (Before → After)</th>
                  <th className="px-4 py-3">Reference / Order</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-10 text-slate-400">
                      No stock movements match the specified filter.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{m.productName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {m.warehouseCode}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            m.movementType.includes("RECEIPT") || m.movementType.includes("ADD") || m.movementType === "OPENING_STOCK" || m.movementType === "RETURN_RESTOCK"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.movementType.includes("DISPATCH") || m.movementType.includes("SUBTRACT")
                              ? "bg-red-100 text-red-800"
                              : m.movementType.includes("DAMAGE")
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                        <span className={m.quantity > 0 ? "text-emerald-600" : m.quantity < 0 ? "text-red-600" : "text-slate-500"}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {m.balanceBefore} → <span className="font-bold text-slate-900">{m.balanceAfter}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {m.referenceId || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">
                        <div className="font-medium truncate">{m.reason}</div>
                        {m.notes && <div className="text-[10px] text-slate-400 italic truncate">{m.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {m.performedByName}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canAdjust && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMovement(m)}
                              title="Edit Audit Movement"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <FaPencilAlt className="text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteMovement(m)}
                              title="Delete Audit Movement"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: WAREHOUSES & INTER-WAREHOUSE TRANSFERS */}
      {/* ======================================================== */}
      {activeTab === "warehouses" && (
        <div className="space-y-6">
          
          {/* WAREHOUSE CARDS & SEARCH & ROW CONTROLS */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaWarehouse className="text-blue-600" />
                <span>Physical Storage Locations & Central Warehouses</span>
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {filteredWarehouses.length} {filteredWarehouses.length === 1 ? "Location" : "Locations"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-60">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search code, city, manager..."
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Rows selector ("roww bhadha sake") */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Rows:</span>
                <select
                  value={warehousePageSize}
                  onChange={(e) => setWarehousePageSize(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value={6}>6 Rows</option>
                  <option value={12}>12 Rows</option>
                  <option value={24}>24 Rows</option>
                  <option value={999}>All Rows ({filteredWarehouses.length})</option>
                </select>
              </div>

              {/* View Switcher: Cards vs Table */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setWarehouseViewMode("cards")}
                  title="Grid Cards View"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                    warehouseViewMode === "cards" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FaThLarge className="text-[11px]" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWarehouseViewMode("table")}
                  title="Rows / Table View"
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                    warehouseViewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FaList className="text-[11px]" />
                  <span>Rows</span>
                </button>
              </div>

              {canWarehouses && (
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <FaPlus />
                  <span>Add Warehouse</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE: CARDS GRID */}
          {warehouseViewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWarehouses.slice(0, warehousePageSize).map((w) => (
                <div key={w._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold font-mono">
                          {w.code}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{w.name}</h4>
                          <span className="text-[11px] text-slate-400">{w.city}, {w.state} - {w.pincode}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {w.isDefault && (
                          <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                            PRIMARY HUB
                          </span>
                        )}
                        {!w.isActive && (
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            INACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 mb-4 pt-2 border-t border-slate-100">
                      <p><span className="text-slate-400">Address:</span> {w.address || "N/A"}</p>
                      <p><span className="text-slate-400">Manager:</span> {w.manager || "ARCL Operations"}</p>
                      <p><span className="text-slate-400">Contact:</span> {w.contactPhone || "N/A"} • {w.contactEmail || "N/A"}</p>
                      {w.notes && <p className="text-slate-500 italic text-[11px] line-clamp-1"><span className="text-slate-400 font-normal">Notes:</span> {w.notes}</p>}
                    </div>

                    {/* Warehouse Stock Stats */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center text-xs font-mono mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">On-Hand</span>
                        <span className="font-bold text-slate-900">{w.stats?.totalOnHand || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Reserved</span>
                        <span className="font-bold text-amber-700">{w.stats?.totalReserved || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">SKUs</span>
                        <span className="font-bold text-blue-700">{w.stats?.totalSkus || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  {canWarehouses && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditWarehouse(w)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FaPencilAlt className="text-[10px]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteWarehouse(w)}
                        className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FaTrash className="text-[10px]" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE: ROWS / TABLE */}
          {warehouseViewMode === "table" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-3">Code / Type</th>
                      <th className="px-4 py-3">Warehouse Name & City</th>
                      <th className="px-4 py-3">Address & Pincode</th>
                      <th className="px-4 py-3">Manager & Contact</th>
                      <th className="px-4 py-3 text-right">On-Hand</th>
                      <th className="px-4 py-3 text-right">Reserved</th>
                      <th className="px-4 py-3 text-right">SKUs</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWarehouses.slice(0, warehousePageSize).map((w) => (
                      <tr key={w._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-800">{w.code}</div>
                          {w.isDefault ? (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                              PRIMARY
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500">SATELLITE</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{w.name}</div>
                          <div className="text-[11px] text-slate-500">{w.city}, {w.state}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          <div>{w.address || "N/A"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">PIN: {w.pincode}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{w.manager || "ARCL Operations"}</div>
                          <div className="text-[11px] text-slate-500">{w.contactPhone}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {w.stats?.totalOnHand || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                          {w.stats?.totalReserved || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                          {w.stats?.totalSkus || 0}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {w.isActive !== false ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {canWarehouses && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditWarehouse(w)}
                                title={`Edit ${w.name}`}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <FaPencilAlt className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteWarehouse(w)}
                                title={`Delete ${w.name}`}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dynamic Row Expansion Footer ("roww bhadha sake") */}
          {warehousePageSize < filteredWarehouses.length && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 text-xs text-slate-600 shadow-xs">
              <span>
                Showing <strong>{Math.min(warehousePageSize, filteredWarehouses.length)}</strong> of <strong>{filteredWarehouses.length}</strong> warehouses
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWarehousePageSize((prev) => prev + 12)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FaChevronDown className="text-[10px]" />
                  <span>Show More Rows (+12)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWarehousePageSize(999)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Show All ({filteredWarehouses.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* INTER-WAREHOUSE TRANSFERS SECTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FaExchangeAlt className="text-blue-600" />
                  <span>Inter-Warehouse Stock Transfers</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Stock is deducted from the source warehouse upon dispatch, placed in In-Transit, and added to the destination only upon physical inward receipt.
                </p>
              </div>

              {canTransfers && (
                <button
                  onClick={handleOpenTransferModal}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FaPlus />
                  <span>Initiate Transfer</span>
                </button>
              )}
            </div>

            {/* TRANSFER SEARCH & FILTERS BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4">
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search Transfer #, Route..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={transferStatusFilter}
                onChange={(e) => setTransferStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Transfer Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="DISPATCHED">In-Transit / Dispatched</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Transfer #</th>
                    <th className="px-4 py-2.5">Route</th>
                    <th className="px-4 py-2.5">Items</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Tracking / Vehicle</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-slate-400">
                        No warehouse transfers found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((tr) => (
                      <tr key={tr._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {tr.transferNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{tr.sourceWarehouseCode}</span> → <span className="font-semibold text-blue-700">{tr.destinationWarehouseCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          {tr.items.map((i, idx) => (
                            <div key={idx} className="text-[11px]">
                              {i.productName} ({i.requestedQty} units)
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              tr.status === "DISPATCHED"
                                ? "bg-sky-100 text-sky-800 animate-pulse border border-sky-200"
                                : tr.status === "RECEIVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {tr.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">
                          {tr.trackingRef || tr.vehicleNumber ? `${tr.trackingRef || ""} ${tr.vehicleNumber || ""}` : "Direct Handover"}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {tr.status === "DRAFT" && canTransfers && (
                            <button
                              onClick={() => handleDispatchTransfer(tr)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Dispatch →
                            </button>
                          )}
                          {(tr.status === "DISPATCHED" || tr.status === "PARTIALLY_RECEIVED") && canReceive && (
                            <button
                              onClick={() => handleOpenReceiveTransferModal(tr)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Receive Inward
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: PROCUREMENT & PURCHASES / EXPENSES */}
      {/* ======================================================== */}
      {activeTab === "purchases" && (
        <PurchaseManagementSection />
      )}

      {/* ======================================================== */}
      {/* TAB 6: SUPPLIERS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === "suppliers" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaBuilding className="text-blue-600" />
                <span>Approved Vendors & Equipment Suppliers</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Manage external laboratory equipment manufacturers, calibration providers & component vendors.
              </p>
            </div>

            {canPurchases && (
              <button
                onClick={() => setShowSupplierModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto"
              >
                <FaPlus />
                <span>Add Supplier</span>
              </button>
            )}
          </div>

          {/* DYNAMIC SEARCH & FILTERS BAR */}
          <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search Supplier Name, Code, Contact Person, GSTIN..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={supplierStatusFilter}
                onChange={(e) => setSupplierStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Suppliers</option>
                <option value="true">Active Vendors Only</option>
                <option value="false">Inactive Vendors Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Code / Supplier Name</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Phone & Email</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">Payment Terms</th>
                  <th className="px-4 py-3">Categories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      No suppliers registered yet.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((sup) => (
                    <tr key={sup._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{sup.name}</div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                          {sup.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {sup.contactPerson || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        <div>{sup.phone || "N/A"}</div>
                        <div className="text-blue-600 font-sans">{sup.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {sup.city ? `${sup.city}, ${sup.state}` : sup.state}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {sup.gstin || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {sup.paymentTerms}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sup.categories.map((c, i) => (
                            <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: LOW-STOCK ALERTS & AUTO-REORDER ENGINE */}
      {/* ======================================================== */}
      {activeTab === "alerts" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaExclamationTriangle className="text-amber-500" />
                <span>Low-Stock, Stockout & Discrepancy Alerts Desk</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated threshold breaches with 1-click Draft Purchase Order generation.
              </p>
            </div>
          </div>

          {/* DYNAMIC SEARCH & FILTERS BAR */}
          <div className="p-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search Alert SKU, Product Name, Warehouse..."
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={alertStatusFilter}
                onChange={(e) => setAlertStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNRESOLVED">Active / Unresolved</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved Only</option>
              </select>

              <select
                value={alertSeverityFilter}
                onChange={(e) => setAlertSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical (Out of Stock)</option>
                <option value="WARNING">Warning (Low Stock)</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Stock vs Threshold</th>
                  <th className="px-4 py-3">Alert Message</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-emerald-600 font-semibold">
                      ✓ All stock levels are healthy! No active threshold breaches detected.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((al) => (
                    <tr key={al._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            al.severity === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {al.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{al.productName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{al.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {al.warehouseCode}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-red-600">{al.currentStock} units</span> available / Min {al.minThreshold}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm">
                        {al.message}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            al.status === "ACTIVE"
                              ? "bg-red-100 text-red-800 animate-pulse"
                              : al.status === "ACKNOWLEDGED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {al.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        {al.status === "ACTIVE" && canAlerts && (
                          <button
                            onClick={() => handleAcknowledgeAlert(al._id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {al.status !== "RESOLVED" && canAlerts && (
                          <button
                            onClick={() => handleResolveAlert(al._id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                        {canPurchases && (
                          <button
                            onClick={() => handleGenerateReorderPO(al._id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs"
                          >
                            ⚡ Reorder PO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: UNIFIED SALES, PURCHASE & LIVE STOCK REGISTER */}
      {/* ======================================================== */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaFileExcel className="text-emerald-600 text-lg" />
                <span>Unified Sales, Purchase &amp; Live Stock Ledger (Master Report)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Puri report ek jagah: Kharida hua stock (Purchases), Bika hua stock (Sales), aur live warehouse on-hand stock hamesha real-time 100% synchronized rehta hai.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAllSalesPurchases}
                disabled={isSyncingAll}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition"
                title="Sync all Sales & Purchases into Inventory now"
              >
                <FaSync className={isSyncingAll ? "animate-spin" : ""} />
                <span>{isSyncingAll ? "Synchronizing..." : "⚡ Auto-Sync Sales & Purchases"}</span>
              </button>
              <button
                type="button"
                onClick={handleExportCombinedExcel}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
                title="Download complete Sales & Purchase Stock Register in Excel format"
              >
                <FaFileExcel />
                <span>Export Ledger (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCombinedCsv}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300 cursor-pointer transition"
                title="Export as CSV file"
              >
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* 4 TOP KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Current Stock On Hand</span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs"><FaBoxes /></span>
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {(combinedSummary.totalOnHandUnits || stats.totalOnHandUnits).toLocaleString("en-IN")} <span className="text-xs font-semibold text-emerald-700">units</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Valuation: ₹{(combinedSummary.totalValuation || stats.totalInventoryValuation).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/70 to-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">Total Purchased (Inward)</span>
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700 text-xs"><FaTruckLoading /></span>
              </div>
              <div className="text-2xl font-black text-teal-950 mt-1">
                +{(combinedSummary.totalPurchasedUnits || 0).toLocaleString("en-IN")} <span className="text-xs font-semibold text-teal-700">units</span>
              </div>
              <p className="text-[11px] text-teal-700 mt-0.5">Procured via Purchases &amp; POs</p>
            </div>

            <div className="p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Total Sold (Outward)</span>
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs"><FaFileInvoiceDollar /></span>
              </div>
              <div className="text-2xl font-black text-blue-950 mt-1">
                -{(combinedSummary.totalSoldUnits || 0).toLocaleString("en-IN")} <span className="text-xs font-semibold text-blue-700">units</span>
              </div>
              <p className="text-[11px] text-blue-700 mt-0.5">Dispatched via Sales &amp; Orders</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Stock Health &amp; Alerts</span>
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs"><FaExclamationTriangle /></span>
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {combinedSummary.lowStockCount || stats.lowStockProductsCount} <span className="text-xs font-semibold text-amber-700">low stock</span>
              </div>
              <p className="text-[11px] text-rose-600 font-bold mt-0.5">
                {combinedSummary.outOfStockCount || stats.outOfStockProductsCount} items Out of Stock
              </p>
            </div>
          </div>

          {/* DYNAMIC SEARCH & FILTERS BAR */}
          <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search Product Name, SKU, Category, Warehouse..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                />
                {reportSearch && (
                  <button
                    type="button"
                    onClick={() => setReportSearch("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <FaTimesCircle className="text-xs" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={reportWarehouseFilter}
                onChange={(e) => setReportWarehouseFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Warehouses</option>
                {(warehouses || []).map((w) => (
                  <option key={w._id} value={w.code}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>

              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock (Healthy)</option>
                <option value="LOW_STOCK">Low Stock (Alert)</option>
                <option value="OUT_OF_STOCK">Out of Stock (Zero)</option>
              </select>

              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap pl-2 border-l border-slate-300">
                Showing: <strong className="text-slate-900">{filteredCombinedReport.length}</strong> of {combinedReport.length} SKUs
              </span>
            </div>
          </div>

          {/* COMBINED REGISTER TABLE */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-center w-10">#</th>
                  <th className="px-3 py-3 min-w-[200px]">Product SKU &amp; Name</th>
                  <th className="px-3 py-3 min-w-[120px]">Warehouse</th>
                  <th className="px-3 py-3 min-w-[130px] text-center">Purchased (Inward)</th>
                  <th className="px-3 py-3 min-w-[130px] text-center">Sold (Outward)</th>
                  <th className="px-3 py-3 min-w-[130px] text-right">Stock On Hand</th>
                  <th className="px-3 py-3 min-w-[100px] text-right">Unit Cost (₹)</th>
                  <th className="px-3 py-3 min-w-[120px] text-right">Total Valuation (₹)</th>
                  <th className="px-3 py-3 min-w-[110px] text-center">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {combinedReportLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <FaSync className="animate-spin text-blue-600" />
                        <span>Loading live Sales &amp; Purchase Stock Register...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCombinedReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FaBoxes className="text-3xl text-slate-300" />
                        <span className="font-semibold text-sm">No items found in stock register</span>
                        <p className="text-xs text-slate-400">Click "Auto-Sync Sales &amp; Purchases" above to synchronize historical records.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCombinedReport.map((r, idx) => (
                    <tr key={r.inventoryId || idx} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3 text-center font-mono text-slate-400 font-bold">
                        {idx + 1}
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900">{r.productName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {r.sku}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {r.category}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800">{r.warehouse}</div>
                        {r.bin && <div className="text-[10px] text-slate-400 font-mono">Bin: {r.bin}</div>}
                      </td>

                      {/* PURCHASED (INWARD) */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          +{r.purchasedQty || 0} units
                        </span>
                        {r.lastPurchaseDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Last: {new Date(r.lastPurchaseDate).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* SOLD (OUTWARD) */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          -{r.soldQty || 0} units
                        </span>
                        {r.lastSaleDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Last: {new Date(r.lastSaleDate).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* CURRENT STOCK ON HAND */}
                      <td className="px-3 py-3 text-right">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {r.onHand || 0} <span className="text-xs font-semibold text-slate-500">units</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                          {r.available || 0} available
                        </div>
                      </td>

                      {/* UNIT COST */}
                      <td className="px-3 py-3 text-right font-mono text-slate-700">
                        ₹{(r.unitCost || 0).toLocaleString("en-IN")}
                      </td>

                      {/* VALUATION */}
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                        ₹{(r.totalValuation || 0).toLocaleString("en-IN")}
                      </td>

                      {/* STATUS */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                            r.status === "IN_STOCK"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : r.status === "LOW_STOCK"
                              ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }`}
                        >
                          <FaCheckCircle className="text-[9px]" />
                          <span>{r.status === "IN_STOCK" ? "In Stock" : r.status === "LOW_STOCK" ? "Low Stock" : "Out of Stock"}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: RECORD OPENING STOCK / ONBOARD SKU */}
      {/* ======================================================== */}
      {showInitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaBoxes className="text-blue-600" />
                <span>Onboard Product SKU & Record Opening Stock</span>
              </h3>
              <button
                onClick={() => setShowInitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitStockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Product (Auto-Suggest Search) *
                </label>
                <ProductAutoSuggest
                  products={catalogProducts}
                  inventoryProducts={stockItems}
                  selectedProductId={initForm.productId}
                  selectedProduct={
                    initForm.isNewProduct
                      ? {
                          _id: null,
                          isNewProduct: true,
                          name: initForm.productName,
                          productCode: initForm.sku,
                          categoryName: initForm.categoryName,
                        }
                      : null
                  }
                  onSelect={(p) => {
                    setInitForm((prev) => ({
                      ...prev,
                      productId: p._id || "",
                      productName: p.name || "",
                      sku: p.productCode || p.sku || "",
                      categoryName: p.categoryName || "General Lab Equipment",
                      isNewProduct: !!p.isNewProduct || !p._id,
                    }));
                  }}
                  onClear={() => {
                    setInitForm((prev) => ({
                      ...prev,
                      productId: "",
                      productName: "",
                      sku: "",
                      isNewProduct: false,
                    }));
                  }}
                  allowCreate={true}
                  placeholder="Type product name, SKU or model (e.g. Compression, DFTM)..."
                />
              </div>

              {/* If user selected a new non-catalog product to onboard */}
              {initForm.isNewProduct && (
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                    <span>✨ Registering Non-Catalog Product</span>
                    <span className="text-[10px] font-normal text-amber-700">
                      Will be saved in Inventory & auto-suggested everywhere
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Product Title / Name *</label>
                      <input
                        type="text"
                        value={initForm.productName}
                        onChange={(e) => setInitForm({ ...initForm, productName: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">SKU / Model Code *</label>
                      <input
                        type="text"
                        value={initForm.sku}
                        onChange={(e) => setInitForm({ ...initForm, sku: e.target.value.toUpperCase() })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono uppercase font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Warehouse *</label>
                  <select
                    value={initForm.warehouseId}
                    onChange={(e) => setInitForm({ ...initForm, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Opening Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={initForm.openingQty}
                    onChange={(e) => setInitForm({ ...initForm, openingQty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={initForm.minThreshold}
                    onChange={(e) => setInitForm({ ...initForm, minThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={initForm.reorderQty}
                    onChange={(e) => setInitForm({ ...initForm, reorderQty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Est. Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={initForm.unitCost}
                    onChange={(e) => setInitForm({ ...initForm, unitCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Rack / Bin</label>
                <input
                  type="text"
                  placeholder="e.g. BAY-1 / RACK-B2"
                  value={initForm.locationBin}
                  onChange={(e) => setInitForm({ ...initForm, locationBin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  rows="2"
                  value={initForm.notes}
                  onChange={(e) => setInitForm({ ...initForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Dynamic Opening Stock Valuation Display */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Estimated Opening Valuation:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{((parseFloat(initForm.openingQty) || 0) * (parseFloat(initForm.unitCost) || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInitModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {loading ? "Recording..." : "Save Opening Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: STOCK ADJUSTMENT WITH MANDATORY REASON */}
      {/* ======================================================== */}
      {showAdjustModal && selectedInventory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock Adjustment (Audit Controlled)</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedInventory.sku} • {selectedInventory.productName}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs font-mono grid grid-cols-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">On-Hand</span>
                <span className="font-bold text-slate-900">{selectedInventory.onHand}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Reserved</span>
                <span className="font-bold text-amber-700">{selectedInventory.reserved}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Available</span>
                <span className="font-bold text-emerald-700">
                  {Math.max(0, selectedInventory.onHand - selectedInventory.reserved)}
                </span>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  <option value="CORRECTION_ADD">Correction: Stock Addition (+)</option>
                  <option value="CORRECTION_SUBTRACT">Correction: Stock Deduction (-)</option>
                  <option value="DAMAGE_FOUND">Quarantine: Damage Identified (Move to Quarantine)</option>
                  <option value="DAMAGE_RESTORE">Restore: Repaired / Tested Goods Back to Stock</option>
                  <option value="INTERNAL_USE">Internal Use / Lab Demo Unit (-)</option>
                  <option value="RETURN_RESTOCK">Customer Return Restock (+)</option>
                  <option value="AUDIT_RECONCILIATION">Physical Audit Count Overwrite</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Reason Code / Explanation *</label>
                <input
                  type="text"
                  placeholder="e.g. Physical stock verification, Calibration calibration damage..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows="2"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Dynamic Live Stock Projection Card */}
              {(() => {
                const curOnHand = selectedInventory.onHand || 0;
                const qty = parseInt(adjustForm.quantity, 10) || 0;
                let projOnHand = curOnHand;
                let diffLabel = "";

                if (
                  adjustForm.type === "CORRECTION_ADD" ||
                  adjustForm.type === "DAMAGE_RESTORE" ||
                  adjustForm.type === "RETURN_RESTOCK"
                ) {
                  projOnHand = curOnHand + qty;
                  diffLabel = `+${qty}`;
                } else if (
                  adjustForm.type === "CORRECTION_SUBTRACT" ||
                  adjustForm.type === "DAMAGE_FOUND" ||
                  adjustForm.type === "INTERNAL_USE"
                ) {
                  projOnHand = curOnHand - qty;
                  diffLabel = `-${qty}`;
                } else if (adjustForm.type === "AUDIT_RECONCILIATION") {
                  projOnHand = qty;
                  const d = qty - curOnHand;
                  diffLabel = d >= 0 ? `+${d}` : `${d}`;
                }

                const isNegative = projOnHand < 0;

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      isNegative
                        ? "bg-red-50 border-red-300 text-red-900"
                        : "bg-blue-50/60 border-blue-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>Live Stock Projection:</span>
                      <span className="font-mono">{diffLabel ? `(${diffLabel})` : ""}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span>Resulting On-Hand Balance:</span>
                      <span className="font-mono font-bold">
                        {curOnHand} →{" "}
                        <span
                          className={
                            isNegative
                              ? "text-red-600 underline font-extrabold"
                              : "text-blue-700 font-extrabold"
                          }
                        >
                          {projOnHand}
                        </span>{" "}
                        units
                      </span>
                    </div>
                    {isNegative && (
                      <div className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                        ⚠️ Cannot reduce stock below 0. Adjustment exceeds on-hand physical stock.
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {loading ? "Recording..." : "Apply & Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: INVENTORY SETTINGS & THRESHOLDS */}
      {/* ======================================================== */}
      {showSettingsModal && selectedInventory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inventory Thresholds</h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedInventory.sku}</p>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.minThreshold}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recommended Reorder Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={settingsForm.reorderQty}
                  onChange={(e) => setSettingsForm({ ...settingsForm, reorderQty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Bin / Rack Code</label>
                <input
                  type="text"
                  value={settingsForm.locationBin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, locationBin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settingsForm.unitCost}
                  onChange={(e) => setSettingsForm({ ...settingsForm, unitCost: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CREATE PURCHASE ORDER */}
      {/* ======================================================== */}
      {showPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-emerald-600 text-lg" />
                <span>Create Purchase Order (Procurement)</span>
              </h3>
              <button
                onClick={() => setShowPOModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePOSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                  <select
                    value={poForm.supplierId}
                    onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Warehouse *</label>
                  <select
                    value={poForm.destinationWarehouseId}
                    onChange={(e) => setPoForm({ ...poForm, destinationWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Order Items (Auto-Suggest Enabled)</span>
                  <button
                    type="button"
                    onClick={handleAddPOLine}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer text-xs flex items-center gap-1"
                  >
                    <span>+ Add Product Line</span>
                  </button>
                </div>

                {poForm.items.map((it, idx) => {
                  const lineTotal = (parseInt(it.orderedQty, 10) || 0) * (parseFloat(it.unitPrice) || 0);
                  return (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Line #{idx + 1}
                        </span>
                        {poForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePOLine(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                          >
                            ✕ Remove Line
                          </button>
                        )}
                      </div>

                      {/* Product Auto-Suggest Search Input */}
                      <div>
                        <ProductAutoSuggest
                          products={catalogProducts}
                          inventoryProducts={stockItems}
                          selectedProductId={it.productId}
                          selectedProduct={
                            it.isNewProduct
                              ? {
                                  _id: null,
                                  isNewProduct: true,
                                  name: it.productName,
                                  productCode: it.sku,
                                }
                              : null
                          }
                          onSelect={(p) => {
                            setPoForm((prev) => {
                              const newItems = [...prev.items];
                              newItems[idx].productId = p._id || "";
                              newItems[idx].productName = p.name || "";
                              newItems[idx].sku = p.productCode || p.sku || "";
                              newItems[idx].isNewProduct = !!p.isNewProduct || !p._id;
                              return { ...prev, items: newItems };
                            });
                          }}
                          onClear={() => {
                            setPoForm((prev) => {
                              const newItems = [...prev.items];
                              newItems[idx].productId = "";
                              newItems[idx].productName = "";
                              newItems[idx].sku = "";
                              newItems[idx].isNewProduct = false;
                              return { ...prev, items: newItems };
                            });
                          }}
                          size="sm"
                          allowCreate={true}
                          placeholder="Type product name, SKU or model (e.g. DFTM)..."
                        />
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-slate-100">
                        <div className="col-span-5">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Ordered Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={it.orderedQty}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPoForm((prev) => {
                                const newItems = [...prev.items];
                                newItems[idx].orderedQty = val;
                                return { ...prev, items: newItems };
                              });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                            required
                          />
                        </div>

                        <div className="col-span-4">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Unit Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Price (₹)"
                            value={it.unitPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPoForm((prev) => {
                                const newItems = [...prev.items];
                                newItems[idx].unitPrice = val;
                                return { ...prev, items: newItems };
                              });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                            required
                          />
                        </div>

                        <div className="col-span-3 text-right">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Line Total
                          </label>
                          <div className="font-mono font-bold text-slate-900 text-xs py-1.5">
                            ₹{lineTotal.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Dynamic PO Financial Summary Card */}
                <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs mt-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                      Total Order Summary
                    </span>
                    <span className="font-semibold text-slate-200">
                      {poForm.items.length} line item(s) •{" "}
                      {poForm.items.reduce((s, it) => s + (parseInt(it.orderedQty, 10) || 0), 0)} total units
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
                      Estimated PO Total
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ₹
                      {poForm.items
                        .reduce(
                          (s, it) =>
                            s +
                            (parseInt(it.orderedQty, 10) || 0) * (parseFloat(it.unitPrice) || 0),
                          0
                        )
                        .toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procurement Notes</label>
                <textarea
                  rows="2"
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {loading ? "Creating..." : "Save Draft PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: RECEIVE GOODS INWARD (PARTIAL OR FULL) */}
      {/* ======================================================== */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Inward Goods Receipt</h3>
                <p className="text-[11px] text-slate-500 font-mono">PO: {selectedPO.poNumber} • Supplier: {selectedPO.supplierName}</p>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceivePOSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Challan No. *</label>
                  <input
                    type="text"
                    value={receiveForm.challanNo}
                    onChange={(e) => setReceiveForm({ ...receiveForm, challanNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Tax Invoice No.</label>
                  <input
                    type="text"
                    value={receiveForm.invoiceNo}
                    onChange={(e) => setReceiveForm({ ...receiveForm, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <span className="font-semibold text-slate-700 block">Verify Quantities Received</span>

                {receiveForm.itemsReceived.map((item, idx) => {
                  const accepted = parseInt(item.acceptedQty, 10) || 0;
                  const damaged = parseInt(item.damagedQty, 10) || 0;
                  const totalRcv = accepted + damaged;
                  const remainingPending = Math.max(0, item.pendingQty - totalRcv);
                  const isOver = totalRcv > item.pendingQty;

                  return (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">
                            Total Pending: {item.pendingQty} units
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOver
                                ? "bg-red-100 text-red-800"
                                : remainingPending === 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isOver
                              ? `⚠️ Exceeds by ${totalRcv - item.pendingQty}`
                              : remainingPending === 0
                              ? "✓ Line Complete"
                              : `${remainingPending} units still pending`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-emerald-700 font-semibold mb-0.5">Accepted Saleable Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.pendingQty}
                            value={item.acceptedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setReceiveForm((prev) => {
                                const copy = [...prev.itemsReceived];
                                copy[idx].acceptedQty = val;
                                return { ...prev, itemsReceived: copy };
                              });
                            }}
                            className="w-full px-2.5 py-1.5 border border-emerald-300 rounded text-xs font-mono font-bold text-emerald-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-red-700 font-semibold mb-0.5">Damaged / Rejected Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.pendingQty}
                            value={item.damagedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setReceiveForm((prev) => {
                                const copy = [...prev.itemsReceived];
                                copy[idx].damagedQty = val;
                                return { ...prev, itemsReceived: copy };
                              });
                            }}
                            className="w-full px-2.5 py-1.5 border border-red-300 rounded text-xs font-mono font-bold text-red-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection & Dock Notes</label>
                <textarea
                  rows="2"
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Inward Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: ADD WAREHOUSE */}
      {/* ======================================================== */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaWarehouse className="text-blue-600" />
                <span>Add Warehouse Location</span>
              </h3>
              <button
                onClick={() => setShowWarehouseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWarehouseSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. WH-PUN-03"
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. ARCL Pune Hub"
                    value={warehouseForm.name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={warehouseForm.city}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={warehouseForm.state}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={warehouseForm.pincode}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager In-Charge</label>
                  <input
                    type="text"
                    value={warehouseForm.manager}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={warehouseForm.contactPhone}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wh-default"
                  checked={warehouseForm.isDefault}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, isDefault: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="wh-default" className="text-slate-700 font-medium">Set as Default Primary Warehouse</label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT WAREHOUSE */}
      {/* ======================================================== */}
      {showEditWarehouseModal && editWarehouseForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaPencilAlt className="text-blue-600" />
                <span>Edit Warehouse Location</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditWarehouseModal(false);
                  setEditWarehouseForm(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditWarehouseSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse Code *</label>
                  <input
                    type="text"
                    value={editWarehouseForm.code}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse Name *</label>
                  <input
                    type="text"
                    value={editWarehouseForm.name}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editWarehouseForm.address}
                  onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editWarehouseForm.city}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editWarehouseForm.state}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editWarehouseForm.pincode}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manager In-Charge</label>
                  <input
                    type="text"
                    value={editWarehouseForm.manager}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editWarehouseForm.contactPhone}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editWarehouseForm.contactEmail}
                  onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-wh-default"
                    checked={editWarehouseForm.isDefault}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, isDefault: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="edit-wh-default" className="text-slate-700 font-medium cursor-pointer">Default Primary Hub</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-wh-active"
                    checked={editWarehouseForm.isActive}
                    onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="edit-wh-active" className="text-slate-700 font-medium cursor-pointer">Active Warehouse</label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operational Notes</label>
                <textarea
                  rows="2"
                  value={editWarehouseForm.notes}
                  onChange={(e) => setEditWarehouseForm({ ...editWarehouseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Notes, transit guidelines, or storage specifications..."
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditWarehouseModal(false);
                    setEditWarehouseForm(null);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE WAREHOUSE CONFIRMATION */}
      {/* ======================================================== */}
      {showDeleteWarehouseModal && warehouseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <FaTrash className="text-base text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Warehouse</h3>
                <p className="text-[11px] text-slate-500">Confirm warehouse removal</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{warehouseToDelete.name}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">Code: {warehouseToDelete.code}</div>
                <div className="text-slate-500 text-[11px]">{warehouseToDelete.city}, {warehouseToDelete.state}</div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-slate-600 font-sans">Physical Stock On Hand:</span>
                  <span className="font-bold text-slate-900">{warehouseToDelete.stats?.totalOnHand || 0} units</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-mono">
                  <span className="text-slate-600 font-sans">Reserved Units:</span>
                  <span className="font-bold text-amber-700">{warehouseToDelete.stats?.totalReserved || 0} units</span>
                </div>
              </div>

              {(warehouseToDelete.stats?.totalOnHand || 0) > 0 || (warehouseToDelete.stats?.totalReserved || 0) > 0 ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-2">
                  <FaExclamationTriangle className="text-red-500 text-base shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Cannot Delete Active Inventory Warehouse</p>
                    <p className="text-[11px] mt-0.5 text-red-700 leading-relaxed">
                      This warehouse currently holds <strong>{warehouseToDelete.stats?.totalOnHand || 0} physical units</strong> and <strong>{warehouseToDelete.stats?.totalReserved || 0} reserved units</strong>.
                      Please transfer the stock or adjust inventory quantities to 0 before deleting.
                    </p>
                  </div>
                </div>
              ) : warehouses.length <= 1 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2">
                  <FaExclamationTriangle className="text-amber-500 text-base shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Primary Hub Protection</p>
                    <p className="text-[11px] mt-0.5 text-amber-700 leading-relaxed">
                      This is the only remaining warehouse in the system. The ARCL network requires at least one active warehouse.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900">{warehouseToDelete.name}</strong> (<span className="font-mono">{warehouseToDelete.code}</span>)?
                  This operation will permanently remove this location from the warehouse network.
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteWarehouseModal(false);
                    setWarehouseToDelete(null);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteWarehouse}
                  disabled={
                    loading ||
                    (warehouseToDelete.stats?.totalOnHand || 0) > 0 ||
                    (warehouseToDelete.stats?.totalReserved || 0) > 0 ||
                    warehouses.length <= 1
                  }
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT STOCK MOVEMENT AUDIT */}
      {/* ======================================================== */}
      {showEditMovementModal && editMovementForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaPencilAlt className="text-blue-600" />
                <span>Edit Audit Movement Record</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditMovementModal(false);
                  setEditMovementForm(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{editMovementForm.productName}</span>
                <span className="font-mono text-slate-500 font-semibold">{editMovementForm.sku}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Warehouse: <strong>{editMovementForm.warehouseCode}</strong></span>
                <span>Date: {new Date(editMovementForm.createdAt).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <form onSubmit={handleEditMovementSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Movement Type</label>
                  <select
                    value={editMovementForm.movementType}
                    onChange={(e) => setEditMovementForm({ ...editMovementForm, movementType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="OPENING_STOCK">OPENING_STOCK</option>
                    <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT</option>
                    <option value="AUDIT_RECONCILIATION">AUDIT_RECONCILIATION</option>
                    <option value="PURCHASE_RECEIPT">PURCHASE_RECEIPT</option>
                    <option value="SALES_DISPATCH">SALES_DISPATCH</option>
                    <option value="SALES_CANCEL_RELEASE">SALES_CANCEL_RELEASE</option>
                    <option value="TRANSFER_DISPATCH">TRANSFER_DISPATCH</option>
                    <option value="TRANSFER_RECEIPT">TRANSFER_RECEIPT</option>
                    <option value="DAMAGE_QUARANTINE">DAMAGE_QUARANTINE</option>
                    <option value="RETURN_RESTOCK">RETURN_RESTOCK</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Change (+/-)</label>
                  <input
                    type="number"
                    value={editMovementForm.quantity}
                    onChange={(e) => setEditMovementForm({ ...editMovementForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference / Document ID</label>
                <input
                  type="text"
                  placeholder="e.g. ADJ-2026-001, PO-1029, INV-889"
                  value={editMovementForm.referenceId}
                  onChange={(e) => setEditMovementForm({ ...editMovementForm, referenceId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Adjustment / Movement *</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory count verified, discrepancy corrected"
                  value={editMovementForm.reason}
                  onChange={(e) => setEditMovementForm({ ...editMovementForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Notes / Comments</label>
                <textarea
                  rows="2"
                  value={editMovementForm.notes}
                  onChange={(e) => setEditMovementForm({ ...editMovementForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Detailed remarks or verification details..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sync-inv-qty"
                  checked={editMovementForm.syncInventory}
                  onChange={(e) => setEditMovementForm({ ...editMovementForm, syncInventory: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="sync-inv-qty" className="text-slate-700 font-medium cursor-pointer">
                  Synchronize Live On-Hand Inventory with Quantity Delta
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMovementModal(false);
                    setEditMovementForm(null);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE STOCK MOVEMENT CONFIRMATION */}
      {/* ======================================================== */}
      {showDeleteMovementModal && movementToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <FaTrash className="text-base text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Audit Movement</h3>
                <p className="text-[11px] text-slate-500">Remove stock movement record</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{movementToDelete.productName}</span>
                  <span className="font-mono text-slate-500">{movementToDelete.sku}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Warehouse: <strong className="text-slate-700">{movementToDelete.warehouseCode}</strong></span>
                  <span>Type: <strong className="text-slate-700">{movementToDelete.movementType}</strong></span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-slate-600 font-sans">Recorded Quantity Change:</span>
                  <span className={`font-bold text-sm ${movementToDelete.quantity > 0 ? "text-emerald-600" : movementToDelete.quantity < 0 ? "text-red-600" : "text-slate-600"}`}>
                    {movementToDelete.quantity > 0 ? `+${movementToDelete.quantity}` : movementToDelete.quantity} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Reason:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{movementToDelete.reason}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="revert-stock-cb"
                    checked={deleteRevertStock}
                    onChange={(e) => setDeleteRevertStock(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="revert-stock-cb" className="font-bold text-slate-900 cursor-pointer">
                    Revert physical stock impact ({deleteRevertStock ? (movementToDelete.quantity > 0 ? `-${movementToDelete.quantity}` : `+${Math.abs(movementToDelete.quantity)}`) : "No Change"})
                  </label>
                </div>
                <p className="text-[11px] text-amber-700 mt-1 pl-5 leading-relaxed">
                  When enabled, deleting this movement will automatically adjust current live stock to undo this operation.
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this movement record from the audit log?
              </p>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteMovementModal(false);
                    setMovementToDelete(null);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteMovement}
                  disabled={loading}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: ADD SUPPLIER */}
      {/* ======================================================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaBuilding className="text-blue-600" />
                <span>Register Approved Vendor / Supplier</span>
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aimil Ltd / Mitutoyo India"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">GSTIN</label>
                    <span className="text-[10px] text-emerald-600 font-bold">⚡ Auto-Fetch</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="15-digit GSTIN"
                      value={supplierForm.gstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        setSupplierForm((prev) => ({ ...prev, gstin: val }));
                        if (val.length === 15) {
                          handleAutoFetchSupplierGst(val);
                        }
                      }}
                      onBlur={() => {
                        if (supplierForm.gstin?.length === 15) {
                          handleAutoFetchSupplierGst(supplierForm.gstin);
                        }
                      }}
                      maxLength={15}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoFetchSupplierGst(supplierForm.gstin)}
                      disabled={isVerifyingSupplierGst}
                      className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shrink-0 transition cursor-pointer"
                      title="Auto-fetch supplier name and address from GSTIN"
                    >
                      {isVerifyingSupplierGst ? "..." : "Fetch"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={supplierForm.paymentTerms}
                    onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 8: INITIATE INTER-WAREHOUSE TRANSFER */}
      {/* ======================================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FaExchangeAlt className="text-blue-600" />
                <span>Inter-Warehouse Stock Transfer Order</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransferSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Warehouse (Dispatch From) *</label>
                  <select
                    value={transferForm.sourceWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Warehouse (Receive At) *</label>
                  <select
                    value={transferForm.destinationWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, destinationWarehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    required
                  >
                    {warehouses
                      .filter((w) => String(w._id) !== String(transferForm.sourceWarehouseId))
                      .map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Product to Transfer (Auto-Suggest) *
                </label>
                <div className="space-y-2">
                  <ProductAutoSuggest
                    products={catalogProducts}
                    inventoryProducts={stockItems}
                    selectedProductId={transferForm.items[0]?.productId}
                    onSelect={(p) => {
                      setTransferForm((prev) => ({
                        ...prev,
                        items: [{ ...prev.items[0], productId: p._id }],
                      }));
                    }}
                    onClear={() => {
                      setTransferForm((prev) => ({
                        ...prev,
                        items: [{ ...prev.items[0], productId: "" }],
                      }));
                    }}
                    size="sm"
                    placeholder="Search product name or SKU..."
                  />

                  {/* Dynamic stock availability check at source warehouse */}
                  {(() => {
                    const selProdId = transferForm.items[0]?.productId;
                    const srcWhId = transferForm.sourceWarehouseId;
                    const stockMatch = stockItems.find(
                      (s) =>
                        String(s.product?._id || s.product) === String(selProdId) &&
                        String(s.warehouse?._id || s.warehouse) === String(srcWhId)
                    );
                    const avail = stockMatch ? Math.max(0, stockMatch.onHand - stockMatch.reserved) : 0;
                    const reqQty = parseInt(transferForm.items[0]?.requestedQty, 10) || 1;
                    const isOver = reqQty > avail;

                    return (
                      <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Available at Source Hub: </span>
                          <span
                            className={`font-mono font-bold ${
                              avail > 0 ? "text-emerald-700" : "text-amber-600"
                            }`}
                          >
                            {avail} units
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-600">Transfer Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={transferForm.items[0]?.requestedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setTransferForm((prev) => ({
                                ...prev,
                                items: [{ ...prev.items[0], requestedQty: val }],
                              }));
                            }}
                            className={`w-20 px-2 py-1 text-xs border rounded-lg font-mono font-bold text-center ${
                              isOver ? "border-red-500 bg-red-50 text-red-900" : "border-slate-300 bg-white"
                            }`}
                            required
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle / Truck Number</label>
                  <input
                    type="text"
                    placeholder="MH-04-XX-1234"
                    value={transferForm.vehicleNumber}
                    onChange={(e) => setTransferForm({ ...transferForm, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LR / Tracking Ref</label>
                  <input
                    type="text"
                    placeholder="AWB / Challan Ref"
                    value={transferForm.trackingRef}
                    onChange={(e) => setTransferForm({ ...transferForm, trackingRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Notes</label>
                <textarea
                  rows="2"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Create Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 9: RECEIVE IN-TRANSIT TRANSFER AT DESTINATION */}
      {/* ======================================================== */}
      {showReceiveTransferModal && selectedTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Accept Transfer Delivery</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedTransfer.transferNumber} • At {selectedTransfer.destinationWarehouseCode}
                </p>
              </div>
              <button
                onClick={() => setShowReceiveTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceiveTransferSubmit} className="space-y-4 text-xs">
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {receiveTransferForm.itemsReceived.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="font-semibold text-slate-900">
                      {item.productName} ({item.dispatchedQty} in-transit)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-emerald-700 font-semibold">Accepted Intact</label>
                        <input
                          type="number"
                          min="0"
                          max={item.dispatchedQty}
                          value={item.acceptedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setReceiveTransferForm((prev) => {
                              const copy = [...prev.itemsReceived];
                              copy[idx].acceptedQty = val;
                              return { ...prev, itemsReceived: copy };
                            });
                          }}
                          className="w-full px-2.5 py-1.5 border border-emerald-300 rounded font-mono font-bold text-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-red-700 font-semibold">In-Transit Damaged</label>
                        <input
                          type="number"
                          min="0"
                          max={item.dispatchedQty}
                          value={item.damagedQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setReceiveTransferForm((prev) => {
                              const copy = [...prev.itemsReceived];
                              copy[idx].damagedQty = val;
                              return { ...prev, itemsReceived: copy };
                            });
                          }}
                          className="w-full px-2.5 py-1.5 border border-red-300 rounded font-mono font-bold text-red-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receiving Remarks</label>
                <textarea
                  rows="2"
                  value={receiveTransferForm.receivingNotes}
                  onChange={(e) => setReceiveTransferForm({ ...receiveTransferForm, receivingNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceiveTransferModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Inward Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
