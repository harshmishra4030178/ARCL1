import API from "./axios";

// Admin Error Log APIs
export const getAdminErrorLogsApi = (params = {}) =>
  API.get("/admin/error-logs", { params });

export const getAdminErrorStatsApi = () =>
  API.get("/admin/error-logs/stats");

export const toggleResolveErrorLogApi = (id, data = {}) =>
  API.patch(`/admin/error-logs/${id}/resolve`, data);

export const deleteErrorLogApi = (id) =>
  API.delete(`/admin/error-logs/${id}`);

export const clearResolvedErrorLogsApi = () =>
  API.delete("/admin/error-logs/actions/clear-resolved");

// Client Error Report API
export const reportClientErrorApi = (data) =>
  API.post("/client/error-logs", data);
