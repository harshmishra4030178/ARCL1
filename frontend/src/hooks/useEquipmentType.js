import { useState } from "react";
import { useEquipmentTypeStore } from "../store/useEquipmentTypeStore.js";
import { toast } from "react-toastify";

const useEquipmentType = () => {
  const {
    equipmentTypes,
    fetchAdminEquipmentTypes,
    fetchEquipmentTypes,
    removeEquipmentType,
    toggleStatus,
    toggleFeatured,
    loading,
    error,
  } = useEquipmentTypeStore();

  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState(null);

  const handleEdit = (item, openEditModal) => {
    setSelectedItem(item);
    openEditModal(true);
  };

  const handleToggle = async (id) => {
    try {
      setTogglingId(id);
      await toggleStatus(id);
      toast.success("Equipment type status updated!");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      setTogglingFeaturedId(id);
      await toggleFeatured(id);
      toast.success("Featured status updated successfully! ⭐");
    } catch (err) {
      toast.error("Failed to update featured status");
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "⚠️ Warning: Deletion May Affect Related Data\n\n" +
        "This record is linked to one or more products or dependent records. " +
        "Deleting it may impact associated data and system relationships.\n\n" +
        "Please verify all related products and dependencies before confirming this action. " +
        "This operation may not be reversible.\n\n" +
        "Do you want to proceed with deletion?"
      )
    ) return;

    try {
      setDeletingId(id);
      await removeEquipmentType(id);
      toast.success("Equipment type deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete equipment type");
    } finally {
      setDeletingId(null);
    }
  };

  return {
    equipmentTypes,
    fetchEquipmentTypes: fetchAdminEquipmentTypes || fetchEquipmentTypes,
    loading,
    error,
    selectedItem,
    deletingId,
    togglingId,
    togglingFeaturedId,
    handleEdit,
    handleToggle,
    handleToggleFeatured,
    handleDelete,
  };
};

export default useEquipmentType;