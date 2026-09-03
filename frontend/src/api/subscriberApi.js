import API from "./axios";

// Admin APIs
export const getAdminSubscribers = () => API.get("/admin/subscribers");
export const getAdminSubscribersApi = getAdminSubscribers;

export const deleteSubscriber = (id) => API.delete(`/admin/subscribers/${id}`);
export const deleteSubscriberApi = deleteSubscriber;

// Client Public API
export const subscribeClient = (data) => API.post("/client/subscribers", data);
export const subscribeApi = subscribeClient;
