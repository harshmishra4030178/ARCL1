import API from "./axios.js";

// ==========================================
// ARCL INVENTORY MANAGEMENT API CLIENT
// ==========================================

// Dashboard & Stats
export const getInventoryDashboardStatsApi = async () => {
  const response = await API.get("/admin/inventory/dashboard-stats");
  return response.data;
};

// Stock Management
export const getInventoryListApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/stock", { params });
  return response.data;
};

export const getInventoryByIdApi = async (id) => {
  const response = await API.get(`/admin/inventory/stock/${id}`);
  return response.data;
};

export const initializeProductStockApi = async (data) => {
  const response = await API.post("/admin/inventory/stock/initialize", data);
  return response.data;
};

export const adjustStockApi = async (data) => {
  const response = await API.post("/admin/inventory/stock/adjust", data);
  return response.data;
};

export const updateInventorySettingsApi = async (id, data) => {
  const response = await API.put(`/admin/inventory/stock/${id}/settings`, data);
  return response.data;
};

// Stock Movements Audit Trail
export const getStockMovementsApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/movements", { params });
  return response.data;
};

export const updateStockMovementApi = async (id, data) => {
  const response = await API.put(`/admin/inventory/movements/${id}`, data);
  return response.data;
};

export const deleteStockMovementApi = async (id, data = {}) => {
  const response = await API.delete(`/admin/inventory/movements/${id}`, { data });
  return response.data;
};

// Warehouses
export const getWarehousesApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/warehouses", { params });
  return response.data;
};

export const createWarehouseApi = async (data) => {
  const response = await API.post("/admin/inventory/warehouses", data);
  return response.data;
};

export const updateWarehouseApi = async (id, data) => {
  const response = await API.put(`/admin/inventory/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouseApi = async (id) => {
  const response = await API.delete(`/admin/inventory/warehouses/${id}`);
  return response.data;
};

// Suppliers
export const getSuppliersApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/suppliers", { params });
  return response.data;
};

export const createSupplierApi = async (data) => {
  const response = await API.post("/admin/inventory/suppliers", data);
  return response.data;
};

export const updateSupplierApi = async (id, data) => {
  const response = await API.put(`/admin/inventory/suppliers/${id}`, data);
  return response.data;
};

// Purchase Orders
export const getPurchaseOrdersApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/purchases", { params });
  return response.data;
};

export const getPurchaseOrderByIdApi = async (id) => {
  const response = await API.get(`/admin/inventory/purchases/${id}`);
  return response.data;
};

export const createPurchaseOrderApi = async (data) => {
  const response = await API.post("/admin/inventory/purchases", data);
  return response.data;
};

export const approvePurchaseOrderApi = async (id, data = {}) => {
  const response = await API.put(`/admin/inventory/purchases/${id}/approve`, data);
  return response.data;
};

export const receivePurchaseOrderGoodsApi = async (id, data) => {
  const response = await API.post(`/admin/inventory/purchases/${id}/receive`, data);
  return response.data;
};

export const cancelPurchaseOrderApi = async (id, data = {}) => {
  const response = await API.put(`/admin/inventory/purchases/${id}/cancel`, data);
  return response.data;
};

// Warehouse Transfers
export const getWarehouseTransfersApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/transfers", { params });
  return response.data;
};

export const createWarehouseTransferApi = async (data) => {
  const response = await API.post("/admin/inventory/transfers", data);
  return response.data;
};

export const dispatchWarehouseTransferApi = async (id, data) => {
  const response = await API.put(`/admin/inventory/transfers/${id}/dispatch`, data);
  return response.data;
};

export const receiveWarehouseTransferApi = async (id, data) => {
  const response = await API.post(`/admin/inventory/transfers/${id}/receive`, data);
  return response.data;
};

// Sales Orders
export const getSalesOrdersApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/sales-orders", { params });
  return response.data;
};

export const createSalesOrderApi = async (data) => {
  const response = await API.post("/admin/inventory/sales-orders", data);
  return response.data;
};

export const confirmSalesOrderApi = async (id) => {
  const response = await API.put(`/admin/inventory/sales-orders/${id}/confirm`);
  return response.data;
};

export const dispatchSalesOrderApi = async (id, data = {}) => {
  const response = await API.put(`/admin/inventory/sales-orders/${id}/dispatch`, data);
  return response.data;
};

export const cancelSalesOrderApi = async (id, data = {}) => {
  const response = await API.put(`/admin/inventory/sales-orders/${id}/cancel`, data);
  return response.data;
};

export const processSalesReturnApi = async (id, data) => {
  const response = await API.post(`/admin/inventory/sales-orders/${id}/return`, data);
  return response.data;
};

// Alerts
export const getAlertsApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/alerts", { params });
  return response.data;
};

export const acknowledgeAlertApi = async (id) => {
  const response = await API.put(`/admin/inventory/alerts/${id}/acknowledge`);
  return response.data;
};

export const resolveAlertApi = async (id, data = {}) => {
  const response = await API.put(`/admin/inventory/alerts/${id}/resolve`, data);
  return response.data;
};

export const generateReorderPOFromAlertApi = async (id) => {
  const response = await API.post(`/admin/inventory/alerts/${id}/reorder-po`);
  return response.data;
};

// Reports
export const getInventoryReportApi = async (params = {}) => {
  const response = await API.get("/admin/inventory/reports", { params });
  return response.data;
};

// Auto-Sync All Sales & Purchases to Inventory
export const syncAllInventoryApi = async () => {
  const response = await API.post("/admin/inventory/sync-all");
  return response.data;
};
