import { Router } from "express";
import {
  // Warehouses
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  // Suppliers
  getSuppliers,
  createSupplier,
  updateSupplier,
  // Inventory & Stock
  getInventoryList,
  getInventoryById,
  initializeProductStock,
  adjustStock,
  updateInventorySettings,
  // Movements
  getStockMovements,
  updateStockMovement,
  deleteStockMovement,
  // Purchase Orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrderGoods,
  cancelPurchaseOrder,
  // Warehouse Transfers
  getWarehouseTransfers,
  createWarehouseTransfer,
  dispatchWarehouseTransfer,
  receiveWarehouseTransfer,
  // Sales Orders
  getSalesOrders,
  createSalesOrder,
  confirmSalesOrder,
  dispatchSalesOrder,
  cancelSalesOrder,
  processSalesReturn,
  // Alerts
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  generateReorderPOFromAlert,
  // Dashboard & Reports
  getInventoryDashboardStats,
  getInventoryReport,
  syncAllInventory,
} from "../../controllers/admin/inventoryController.js";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";

const router = Router();

// ================= DASHBOARD & STATS =================
router.get("/dashboard-stats", getInventoryDashboardStats);
router.get("/overview", getInventoryDashboardStats);

// ================= INVENTORY & STOCK =================
router.get("/stock", getInventoryList);
router.get("/stock/:id", getInventoryById);
router.post("/stock/initialize", checkModulePermission("inventory", "adjust"), initializeProductStock);
router.post("/stock/adjust", checkModulePermission("inventory", "adjust"), adjustStock);
router.put("/stock/:id/settings", checkModulePermission("inventory", "adjust"), updateInventorySettings);

// ================= STOCK MOVEMENTS =================
router.get("/movements", getStockMovements);
router.put("/movements/:id", checkModulePermission("inventory", "adjust"), updateStockMovement);
router.delete("/movements/:id", checkModulePermission("inventory", "adjust"), deleteStockMovement);

// ================= WAREHOUSES =================
router.get("/warehouses", getWarehouses);
router.post("/warehouses", checkModulePermission("inventory", "warehouses"), createWarehouse);
router.put("/warehouses/:id", checkModulePermission("inventory", "warehouses"), updateWarehouse);
router.delete("/warehouses/:id", checkModulePermission("inventory", "warehouses"), deleteWarehouse);

// ================= SUPPLIERS =================
router.get("/suppliers", getSuppliers);
router.post("/suppliers", checkModulePermission("inventory", "purchases"), createSupplier);
router.put("/suppliers/:id", checkModulePermission("inventory", "purchases"), updateSupplier);

// ================= PURCHASE ORDERS =================
router.get("/purchases", getPurchaseOrders);
router.get("/purchases/:id", getPurchaseOrderById);
router.post("/purchases", checkModulePermission("inventory", "purchases"), createPurchaseOrder);
router.put("/purchases/:id/approve", checkModulePermission("inventory", "purchases"), approvePurchaseOrder);
router.post("/purchases/:id/receive", checkModulePermission("inventory", "receive"), receivePurchaseOrderGoods);
router.put("/purchases/:id/cancel", checkModulePermission("inventory", "purchases"), cancelPurchaseOrder);

// ================= WAREHOUSE TRANSFERS =================
router.get("/transfers", getWarehouseTransfers);
router.post("/transfers", checkModulePermission("inventory", "transfers"), createWarehouseTransfer);
router.put("/transfers/:id/dispatch", checkModulePermission("inventory", "transfers"), dispatchWarehouseTransfer);
router.post("/transfers/:id/receive", checkModulePermission("inventory", "receive"), receiveWarehouseTransfer);

// ================= SALES ORDERS =================
router.get("/sales-orders", getSalesOrders);
router.post("/sales-orders", createSalesOrder);
router.put("/sales-orders/:id/confirm", confirmSalesOrder);
router.put("/sales-orders/:id/dispatch", dispatchSalesOrder);
router.put("/sales-orders/:id/cancel", cancelSalesOrder);
router.post("/sales-orders/:id/return", processSalesReturn);

// ================= ALERTS =================
router.get("/alerts", getAlerts);
router.put("/alerts/:id/acknowledge", checkModulePermission("inventory", "alerts"), acknowledgeAlert);
router.put("/alerts/:id/resolve", checkModulePermission("inventory", "alerts"), resolveAlert);
router.post("/alerts/:id/reorder-po", checkModulePermission("inventory", "purchases"), generateReorderPOFromAlert);

// ================= REPORTS & RE-SYNC =================
router.get("/reports", getInventoryReport);
router.post("/sync-all", syncAllInventory);

export default router;
