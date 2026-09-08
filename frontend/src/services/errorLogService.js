import {
  getAdminErrorLogsApi,
  getAdminErrorStatsApi,
  toggleResolveErrorLogApi,
  deleteErrorLogApi,
  clearResolvedErrorLogsApi,
} from "../api/errorLogApi.js";

export const errorLogService = {
  getLogs: async (params = {}) => {
    const res = await getAdminErrorLogsApi(params);
    return res.data?.data || { logs: [], pagination: {} };
  },

  getStats: async () => {
    const res = await getAdminErrorStatsApi();
    return res.data?.data || { total: 0, unresolved: 0, critical: 0, last24h: 0 };
  },

  toggleResolve: async (id, notes = "") => {
    const res = await toggleResolveErrorLogApi(id, { notes });
    return res.data?.data;
  },

  delete: async (id) => {
    const res = await deleteErrorLogApi(id);
    return res.data;
  },

  clearResolved: async () => {
    const res = await clearResolvedErrorLogsApi();
    return res.data?.data;
  },
};
