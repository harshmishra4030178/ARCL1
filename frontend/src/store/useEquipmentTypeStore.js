import { create } from "zustand";
import { equipmentTypeService } from "../services/equipmentTypeService.js";

export const useEquipmentTypeStore = create((set) => ({
  equipmentTypes: [],
  adminEquipmentTypes: [],
  loading: false,
  error: null,

  // =========================
  // PUBLIC CLIENT: FETCH ALL EQUIPMENT TYPES (No Auth Required)
  // =========================
  fetchEquipmentTypes: async () => {
    try {
      set({ loading: true, error: null });
      const data = await equipmentTypeService.getAll();
      const list = Array.isArray(data) ? data : [];

      set({ equipmentTypes: list, loading: false });
      return list;
    } catch (err) {
      console.error("Fetch equipment types error:", err);
      set({ error: err.message || "Fetch failed", loading: false });
    }
  },

  // =========================
  // ADMIN: FETCH ALL EQUIPMENT TYPES
  // =========================
  fetchAdminEquipmentTypes: async () => {
    try {
      set({ loading: true, error: null });
      const data = await equipmentTypeService.getAdminAll();
      const list = Array.isArray(data) ? data : [];

      set({ adminEquipmentTypes: list, equipmentTypes: list, loading: false });
      return list;
    } catch (err) {
      console.error("Fetch admin equipment types error:", err);
      set({ error: err.message || "Fetch failed", loading: false });
    }
  },

  // =========================
  // CREATE EQUIPMENT TYPE (Admin)
  // =========================
  addEquipmentType: async (payload) => {
    try {
      set({ error: null });
      const newItem = await equipmentTypeService.create(payload);

      set((state) => ({
        equipmentTypes: [newItem, ...state.equipmentTypes],
        adminEquipmentTypes: [newItem, ...state.adminEquipmentTypes],
      }));
      return newItem;
    } catch (err) {
      set({ error: err.message || "Create failed" });
      throw err;
    }
  },

  // =========================
  // EDIT EQUIPMENT TYPE (Admin)
  // =========================
  editEquipmentType: async (id, payload) => {
    try {
      set({ error: null });
      const updated = await equipmentTypeService.update(id, payload);

      set((state) => ({
        equipmentTypes: state.equipmentTypes.map((item) =>
          item._id === id ? updated : item
        ),
        adminEquipmentTypes: state.adminEquipmentTypes.map((item) =>
          item._id === id ? updated : item
        ),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message || "Update failed" });
      throw err;
    }
  },

  // =========================
  // REMOVE EQUIPMENT TYPE (Admin)
  // =========================
  removeEquipmentType: async (id) => {
    try {
      set({ error: null });
      await equipmentTypeService.remove(id);

      set((state) => ({
        equipmentTypes: state.equipmentTypes.filter((item) => item._id !== id),
        adminEquipmentTypes: state.adminEquipmentTypes.filter((item) => item._id !== id),
      }));
    } catch (err) {
      set({ error: err.message || "Delete failed" });
    }
  },

  // =========================
  // TOGGLE STATUS (Admin)
  // =========================
  toggleStatus: async (id) => {
    try {
      const updated = await equipmentTypeService.toggle(id);

      set((state) => ({
        equipmentTypes: state.equipmentTypes.map((item) =>
          item._id === id ? { ...item, isActive: updated.data?.isActive ?? !item.isActive } : item
        ),
        adminEquipmentTypes: state.adminEquipmentTypes.map((item) =>
          item._id === id ? { ...item, isActive: updated.data?.isActive ?? !item.isActive } : item
        ),
      }));
      return updated;
    } catch (err) {
      set({ error: "Toggle failed" });
    }
  },

  // =========================
  // TOGGLE FEATURED (Admin)
  // =========================
  toggleFeatured: async (id) => {
    try {
      const res = await equipmentTypeService.toggleFeatured(id);
      const updated = res.data?.data || res.data || res;

      set((state) => ({
        equipmentTypes: state.equipmentTypes.map((item) =>
          item._id === id ? { ...item, isFeatured: updated.isFeatured ?? !item.isFeatured } : item
        ),
        adminEquipmentTypes: state.adminEquipmentTypes.map((item) =>
          item._id === id ? { ...item, isFeatured: updated.isFeatured ?? !item.isFeatured } : item
        ),
      }));
      return updated;
    } catch (err) {
      set({ error: "Toggle featured failed" });
      throw err;
    }
  },

  // =========================
  // REORDER EQUIPMENT TYPES (Admin)
  // =========================
  reorderEquipmentTypes: async (orderedList) => {
    try {
      set({ error: null });
      // Optimistic update
      set({ equipmentTypes: orderedList, adminEquipmentTypes: orderedList });

      const orderedIds = orderedList.map((item) => item._id);
      const data = await equipmentTypeService.reorder({ orderedIds });
      const updatedList = Array.isArray(data) ? data : orderedList;

      set({ equipmentTypes: updatedList, adminEquipmentTypes: updatedList });
      return updatedList;
    } catch (err) {
      set({ error: err.message || "Reorder failed" });
      throw err;
    }
  },
}));