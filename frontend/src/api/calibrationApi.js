import API from "./axios";

// =========================
// ADMIN CALIBRATION APIS
// =========================

export const getAdminCalibrationRecords = (params = {}) =>
  API.get("/admin/calibration", { params: { limit: 10000, ...params } });

export const getAdminCalibrationStats = () =>
  API.get("/admin/calibration/stats");

export const createCalibrationRecordApi = (data) =>
  API.post("/admin/calibration", data);

export const updateCalibrationRecordApi = (id, data) =>
  API.put(`/admin/calibration/${id}`, data);

export const updateCalibrationBatchApi = (data) =>
  API.put("/admin/calibration/batch/update", data);

export const updateCalibrationPaymentApi = (data) =>
  API.put("/admin/calibration/batch/payment", data);

export const updateCalibrationQuotationStatusApi = (data) =>
  API.put("/admin/calibration/batch/quotation-status", data);

export const releaseCalibrationEquipmentsApi = (data) =>
  API.post("/admin/calibration/batch/release-equipments", data);

export const markCalibrationSrfDoneApi = (data) =>
  API.post("/admin/calibration/batch/srf-done", data);

export const updateInwardRegisterRowApi = (recordId, data) =>
  API.put(`/admin/calibration/inward-register/${recordId}`, data);

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

export const saveCalibrationObservationApi = (data) =>
  API.post("/admin/calibration/observation/save", data);

export const parseFilledObservationApi = (formData) =>
  API.post("/admin/calibration/observation/parse-filled", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getHardwareScannersApi = () =>
  API.get("/admin/calibration/observation/scanners");

export const directHardwareScanObservationApi = (data) =>
  API.post("/admin/calibration/observation/direct-scan", data);

export const authorizeCalibrationObservationApi = (data) =>
  API.post("/admin/calibration/observation/authorize", data);

// ==========================================
// OBSERVATION FORMAT TEMPLATES & PDF TO FORM
// ==========================================

export const getObservationTemplatesApi = () =>
  API.get("/client/calibration/observation-templates");

export const createObservationTemplateApi = (formData) =>
  API.post("/client/calibration/observation-templates", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateObservationTemplateApi = (id, formData) =>
  API.put(`/client/calibration/observation-templates/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteObservationTemplateApi = (id) =>
  API.delete(`/client/calibration/observation-templates/${id}`);

export const parsePdfPreviewApi = (formData) =>
  API.post("/client/calibration/observation-templates/parse-preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// =========================
export const convertCloudinaryPdfToFormApi = (data) =>
  API.post("/client/calibration/observation-templates/convert-to-form", data);

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

export const resetNablLabScopeApi = () => API.post("/admin/calibration/lab-scope/reset");

export const uploadGovtNablCertificateApi = (formData) =>
  API.post("/admin/calibration/lab-scope/govt-certificate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadPoApi = (formData) =>
  API.post("/admin/calibration/upload-po", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deletePoApi = (data) =>
  API.post("/admin/calibration/delete-po", data);

// =========================
// PURCHASES & EXPENSES APIS
// =========================

export const getPurchasesApi = (params = {}) =>
  API.get("/admin/purchases", { params });

export const getPurchaseStatsApi = () =>
  API.get("/admin/purchases/stats");

export const createPurchaseApi = (data) =>
  API.post("/admin/purchases", data);

export const updatePurchaseApi = (id, data) =>
  API.put(`/admin/purchases/${id}`, data);

export const deletePurchaseApi = (id) =>
  API.delete(`/admin/purchases/${id}`);

// =========================
// CUSTOM EQUIPMENTS APIS (MONGODB DATABASE PERSISTENCE)
// =========================

export const getCustomEquipmentsApi = () =>
  API.get("/client/calibration/custom-equipments");

export const saveCustomEquipmentApi = (data) =>
  API.post("/client/calibration/custom-equipments", data);

// =========================
// GST VERIFICATION & AUTO-FETCH APIS
// =========================

export const verifyGstApi = (gstin) =>
  API.post("/client/gst/verify", { gstin });

export const fetchGstDetailsApi = (gstin) =>
  API.get(`/client/gst/fetch/${encodeURIComponent(gstin)}`);





export const syncTemplatesFromDirectoryApi = (directoryPath) =>
  API.post("/client/calibration/observation-templates/sync-from-directory", { directoryPath });

export const verifyCalibrationCertificateApi = (params = {}) =>
  API.get("/client/calibration/verify-certificate", { params });


// Real-time Voice Audio AI Transcription API
export const transcribeVoiceAudioApi = (data) =>
  API.post("/admin/calibration/transcribe-voice", data);
