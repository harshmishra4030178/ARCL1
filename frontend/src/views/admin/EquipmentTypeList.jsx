"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaStar, FaRegStar } from "react-icons/fa";
import { GripVertical, ArrowUp, ArrowDown, Sparkles, Check, Move } from "lucide-react";
import EquipmentTypeModal from "../../components/admin/equipmentType/EquipmentTypeModal.jsx";
import EquipmentTypeEditModal from "../../components/admin/equipmentType/EquipmentTypeEditModal.jsx";
import Tooltip from "../../components/admin/common/Tooltip.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import useEquipmentType from "../../hooks/useEquipmentType.js";
import { useEquipmentTypeStore } from "../../store/useEquipmentTypeStore.js";
import { formatTitleCase } from "../../utils/stringUtils.js";
import { toast } from "react-toastify";

const EquipmentTypeList = () => {
  const {
    equipmentTypes,
    fetchEquipmentTypes,
    loading,
    error,
    selectedItem,
    deletingId,
    togglingFeaturedId,
    handleEdit,
    handleToggleFeatured,
    handleDelete,
  } = useEquipmentType();

  const { reorderEquipmentTypes } = useEquipmentTypeStore();

  const [openModal, setOpenModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [itemsList, setItemsList] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  useEffect(() => {
    if (Array.isArray(equipmentTypes)) {
      setItemsList(equipmentTypes);
    }
  }, [equipmentTypes]);

  const onDeleteConfirm = async (id) => {
    try {
      await handleDelete(id);
    } catch (err) {
      // Handled inside hook
    }
  };

  // Reorder handlers
  const saveOrder = async (newList) => {
    setItemsList(newList);
    setIsSavingOrder(true);
    try {
      await reorderEquipmentTypes(newList);
      toast.success("Showcase order updated and saved! ✨");
    } catch (err) {
      toast.error("Failed to save order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= itemsList.length) return;

    const copy = [...itemsList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    saveOrder(copy);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const copy = [...itemsList];
    const [moved] = copy.splice(draggedIndex, 1);
    copy.splice(targetIndex, 0, moved);

    setDraggedIndex(null);
    setDragOverIndex(null);
    saveOrder(copy);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Equipment Types</h1>
            {isSavingOrder && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                Saving Order...
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Drag rows or use arrow buttons to adjust the order of homepage sections ({itemsList.length} total)
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer shrink-0"
        >
          <FaPlus size={14} /> Add Equipment Type
        </button>
      </div>

      {/* DRAG INSTRUCTION BANNER */}
      {!loading && itemsList.length > 1 && (
        <div className="flex items-center gap-2 text-xs bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200/80 font-medium">
          <Move size={14} className="text-[#021C57]" />
          <span>
            <strong>Tip:</strong> Drag the grip handle <span className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">⠿</span> to reorder sections. The order updates on the homepage instantly.
          </span>
        </div>
      )}

      {/* LOADING */}
      {loading && <SkeletonLoader />}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && itemsList.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-gray-100 text-center">
          <p className="text-gray-500 mb-4">No equipment types found.</p>
          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white px-5 py-2.5 rounded-xl font-medium transition cursor-pointer"
          >
            <FaPlus /> Create First Equipment Type
          </button>
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && itemsList.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 w-12 text-center">Order</th>
                <th className="p-4">Equipment Type Name</th>
                <th className="p-4 text-center">Featured on Home</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {itemsList.map((item, index) => {
                const isFeatured = Boolean(item.isFeatured);
                const isToggling = togglingFeaturedId === item._id;
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <tr
                    key={item._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`transition duration-150 ${
                      isDragging
                        ? "opacity-40 bg-blue-50 border-2 border-dashed border-blue-400"
                        : isOver
                        ? "bg-blue-50/70 border-t-2 border-blue-500"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* DRAG HANDLE & POSITION */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 hover:text-gray-700 rounded transition"
                          title="Drag to reorder"
                        >
                          <GripVertical size={16} />
                        </div>
                        <span className="font-mono text-xs font-bold text-gray-500 w-4 text-center">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleMove(index, -1)}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-[#021C57] disabled:opacity-20 p-0.5 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 1)}
                            disabled={index === itemsList.length - 1}
                            className="text-gray-400 hover:text-[#021C57] disabled:opacity-20 p-0.5 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* NAME */}
                    <td className="p-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#021C57]"></span>
                        <span>{formatTitleCase(item.name)}</span>
                      </div>
                    </td>

                    {/* FEATURED TOGGLE BUTTON */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(item._id)}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer ${
                          isFeatured
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                        } disabled:opacity-50`}
                        title={
                          isFeatured
                            ? "Click to remove from homepage showcase"
                            : "Click to feature this equipment type on homepage"
                        }
                      >
                        {isToggling ? (
                          <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : isFeatured ? (
                          <FaStar className="text-amber-500" size={13} />
                        ) : (
                          <FaRegStar className="text-gray-400" size={13} />
                        )}
                        <span>{isFeatured ? "Featured" : "Standard"}</span>
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-3">
                        <Tooltip text="Edit">
                          <button
                            onClick={() => handleEdit(item, setEditModalOpen)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <FaEdit size={16} />
                          </button>
                        </Tooltip>

                        <Tooltip text="Delete">
                          <button
                            onClick={() => onDeleteConfirm(item._id)}
                            disabled={deletingId === item._id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === item._id ? (
                              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <FaTrash size={16} />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      <EquipmentTypeModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      />

      <EquipmentTypeEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        selected={selectedItem}
      />
    </div>
  );
};

export default EquipmentTypeList;