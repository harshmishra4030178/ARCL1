import API from "./axios";

// =========================
// SALES KPI & STATS
// =========================
export const getSalesStatsApi = () => API.get("/admin/sales/stats");

// =========================
// SALES QUOTATIONS APIS
// =========================
export const getSalesQuotationsApi = (params = {}) =>
  API.get("/admin/sales/quotations", { params: { limit: 1000, ...params } });

export const createSalesQuotationApi = (data) =>
  API.post("/admin/sales/quotations", data);

export const updateSalesQuotationApi = (id, data) =>
  API.put(`/admin/sales/quotations/${id}`, data);

export const deleteSalesQuotationApi = (id) =>
  API.delete(`/admin/sales/quotations/${id}`);

export const convertQuotationToSrfApi = (id) =>
  API.post(`/admin/sales/quotations/${id}/convert-to-srf`);

// =========================
// SALES SRF & ORDERS APIS
// =========================
export const getSalesSrfsApi = (params = {}) =>
  API.get("/admin/sales/srfs", { params: { limit: 1000, ...params } });

export const createSalesSrfApi = (data) =>
  API.post("/admin/sales/srfs", data);

export const updateSalesSrfApi = (id, data) =>
  API.put(`/admin/sales/srfs/${id}`, data);

export const updateSalesSrfPaymentApi = (id, data) =>
  API.put(`/admin/sales/srfs/${id}/payment`, data);

export const advanceSalesSrfStageApi = (id) =>
  API.put(`/admin/sales/srfs/${id}/advance-stage`);

export const deleteSalesSrfApi = (id) =>
  API.delete(`/admin/sales/srfs/${id}`);

// =========================
// PO UPLOAD / DELETE APIS
// =========================
export const uploadSalesPoApi = (formData) =>
  API.post("/admin/sales/upload-po", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteSalesPoApi = (data) =>
  API.post("/admin/sales/delete-po", data);

// =========================
// CUSTOM PRODUCT API
// =========================
export const createCustomQuotationProductApi = (formData) =>
  API.post("/admin/sales/custom-product", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
