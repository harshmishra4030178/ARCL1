import API from "./axios";

// =========================
// ADMIN CALIBRATION APIS
// =========================

export const getAdminCalibrationRecords = (params = {}) =>
  API.get("/admin/calibration", { params });

export const getAdminCalibrationStats = () =>
  API.get("/admin/calibration/stats");

export const createCalibrationRecordApi = (data) =>
  API.post("/admin/calibration", data);

export const updateCalibrationRecordApi = (id, data) =>
  API.put(`/admin/calibration/${id}`, data);

export const deleteCalibrationRecordApi = (id) =>
  API.delete(`/admin/calibration/${id}`);

export const clearAllCalibrationRecordsApi = () =>
  API.post("/admin/calibration/clear-all");

export const sendCalibrationReminderApi = (data) =>
  API.post("/admin/calibration/send-reminder", data);

export const autoDispatchAllDueRemindersApi = (data = {}) =>
  API.post("/admin/calibration/auto-dispatch-all", data);

export const sendCertificateDeliveryApi = (data) =>
  API.post("/admin/calibration/send-certificate-delivery", data);

export const getAutoReminderStatusApi = () =>
  API.get("/admin/calibration/auto-reminder/status");

export const triggerAutoReminderScanApi = (data = {}) =>
  API.post("/admin/calibration/auto-reminder/trigger", data);

export const toggleAutoReminderApi = (data = {}) =>
  API.post("/admin/calibration/auto-reminder/toggle", data);

// =========================
// CLIENT CALIBRATION APIS
// =========================

export const trackInstrumentApi = (query) =>
  API.get("/client/calibration/track", { params: { query } });

export const getClientCalibrationStats = () =>
  API.get("/client/calibration/stats");

export const sendSpecificDocumentApi = (data) =>
  API.post("/admin/calibration/send-document", data);

export const getQuotationApi = (params = {}) =>
  API.get("/admin/calibration/quotation", { params });

export const saveQuotationApi = (data) =>
  API.post("/admin/calibration/quotation/save", data);

export const getTaxInvoiceApi = (params = {}) =>
  API.get("/admin/calibration/tax-invoice", { params });

export const saveTaxInvoiceApi = (data) =>
  API.post("/admin/calibration/tax-invoice/save", data);

export const getProformaApi = (params = {}) =>
  API.get("/admin/calibration/proforma", { params });

export const saveProformaApi = (data) =>
  API.post("/admin/calibration/proforma/save", data);

// =========================
// NABL LAB SCOPE APIS
// =========================

export const getNablLabScopeApi = () =>
  API.get("/admin/calibration/lab-scope");

export const updateNablLabScopeApi = (data) =>
  API.put("/admin/calibration/lab-scope", data);

export const addNablScopeItemApi = (data) =>
  API.post("/admin/calibration/lab-scope/item", data);

export const updateNablScopeItemApi = (itemId, data) =>
  API.put(`/admin/calibration/lab-scope/item/${itemId}`, data);

export const deleteNablScopeItemApi = (itemId) =>
  API.delete(`/admin/calibration/lab-scope/item/${itemId}`);

export const resetNablLabScopeApi = () =>
  API.post("/admin/calibration/lab-scope/reset");


