import { create } from "zustand";
import { errorLogService } from "../services/errorLogService.js";
import { toast } from "react-toastify";

export const useErrorLogStore = create((set, get) => ({
  logs: [],
  stats: { total: 0, unresolved: 0, critical: 0, last24h: 0 },
  pagination: { page: 1, limit: 20, total: 0, pages: 1 },
  loading: false,
  error: null,
  filters: {
    search: "",
    severity: "all",
    source: "all",
    resolved: "all",
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchLogs();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchLogs();
  },

  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, pagination } = get();
      const data = await errorLogService.getLogs({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      set({
        logs: data.logs || [],
        pagination: data.pagination || pagination,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || "Failed to fetch error logs", loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await errorLogService.getStats();
      set({ stats });
    } catch (err) {
      console.warn("Could not fetch error stats:", err.message);
    }
  },

  toggleResolve: async (id, notes = "") => {
    try {
      const updatedLog = await errorLogService.toggleResolve(id, notes);
      set((state) => ({
        logs: state.logs.map((log) =>
          log._id === id ? { ...log, ...updatedLog } : log
        ),
      }));
      get().fetchStats();
      toast.success(
        updatedLog.resolved
          ? "Error marked as Resolved"
          : "Error marked as Unresolved"
      );
    } catch (err) {
      toast.error(err.message || "Failed to update error log");
    }
  },

  deleteLog: async (id) => {
    try {
      await errorLogService.delete(id);
      set((state) => ({
        logs: state.logs.filter((log) => log._id !== id),
      }));
      get().fetchStats();
      toast.success("Error log deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete error log");
    }
  },

  clearResolvedLogs: async () => {
    try {
      const data = await errorLogService.clearResolved();
      get().fetchLogs();
      get().fetchStats();
      toast.success(`Cleared ${data?.deletedCount || 0} resolved logs`);
    } catch (err) {
      toast.error(err.message || "Failed to clear resolved logs");
    }
  },
}));
