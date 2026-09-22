import API from "./axios.js";

// ==========================================
// PUBLIC CUSTOMER PAYMENT APIS
// ==========================================

export const getCalibrationPaymentDetailsApi = (id) =>
  API.get(`/client/calibration-payment/details/${id}`);

export const submitCalibrationPaymentApi = (id, formData) =>
  API.post(`/client/calibration-payment/submit/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// ==========================================
// PROTECTED ADMIN VERIFICATION APIS
// ==========================================

export const getAdminPendingPaymentsApi = (params = {}) =>
  API.get("/admin/calibration-payment/admin/list", { params });

export const verifyAdminPaymentApi = (paymentId, data = {}) =>
  API.post(`/admin/calibration-payment/admin/verify/${paymentId}`, data);

export const rejectAdminPaymentApi = (paymentId, data = {}) =>
  API.post(`/admin/calibration-payment/admin/reject/${paymentId}`, data);

export const recordManualAdminPaymentApi = (data = {}) =>
  API.post("/admin/calibration-payment/admin/manual-record", data);

export const deleteAdminPaymentApi = (paymentId) =>
  API.delete(`/admin/calibration-payment/admin/${paymentId}`);

export const bulkDeleteAdminPaymentsApi = (paymentIds = []) =>
  API.post("/admin/calibration-payment/admin/bulk-delete", { paymentIds });

export const updateAdminPaymentDetailsApi = (paymentId, data = {}) =>
  API.put(`/admin/calibration-payment/admin/update/${paymentId}`, data);

export const updateAdminPaymentStatusApi = (paymentId, data = {}) =>
  API.patch(`/admin/calibration-payment/admin/status/${paymentId}`, data);

export const sendAdminPaymentReceiptApi = (paymentId, data = {}) =>
  API.post(`/admin/calibration-payment/admin/send-receipt/${paymentId}`, data);

export const syncAdminCalibrationPaymentsApi = () =>
  API.post("/admin/calibration-payment/admin/sync");


