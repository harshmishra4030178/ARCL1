import API from "./axios";

// Admin APIs
export const getAdminSubscribers = () => API.get("/admin/subscribers");
export const getAdminSubscribersApi = getAdminSubscribers;

export const deleteSubscriber = (id) => API.delete(`/admin/subscribers/${id}`);
export const deleteSubscriberApi = deleteSubscriber;

// Bulk Campaign APIs (SMS, Email, Images)
export const getSmsAudiencesApi = () => API.get("/admin/subscribers/audiences");
export const sendBulkSmsApi = (data) => {
  const isFormData = data instanceof FormData;
  return API.post("/admin/subscribers/send-bulk-sms", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};
export const getSmsCampaignsApi = () => API.get("/admin/subscribers/campaigns");

// Client Public API
export const subscribeClient = (data) => {
  const payload = typeof data === "string" ? { email: data } : data;
  return API.post("/client/subscribers", payload);
};
export const subscribeApi = subscribeClient;
