"use client";

import { Link } from "../../utils/navigation.jsx";
import { Layers, ChevronRight, X, Sparkles } from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";

const ProductSidebar = ({
  categories = [],
  equipmentTypes = [],
  selectedEquipmentType,
  setSelectedEquipmentType,
  onReset,
  hasActiveFilters,
}) => {
  // Filter categories based on selected equipment type if chosen
  const filteredCategories = selectedEquipmentType
    ? categories.filter(
        (c) =>
          c.equipmentType?._id === selectedEquipmentType ||
          c.equipmentType?.slug === selectedEquipmentType ||
          c.equipmentType === selectedEquipmentType
      )
    : categories;

  return (
    <aside className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* HEADER & RESET */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="font-bold text-[#021C57] text-base flex items-center gap-2">
          <Layers className="w-4 h-4" /> Filter Catalogue
        </h3>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* 1. EQUIPMENT TYPES */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Equipment Type
        </h4>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedEquipmentType("")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
              !selectedEquipmentType
                ? "bg-[#021C57] text-white shadow-xs font-bold"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>All Types</span>
            {!selectedEquipmentType && <span className="text-[10px]">●</span>}
          </button>

          {equipmentTypes.map((type) => (
            <button
              key={type._id}
              onClick={() =>
                setSelectedEquipmentType(
                  selectedEquipmentType === type._id ? "" : type._id
                )
              }
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                selectedEquipmentType === type._id
                  ? "bg-[#021C57] text-white shadow-xs font-bold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="truncate pr-2">{formatTitleCase(type.name)}</span>
              {selectedEquipmentType === type._id && (
                <span className="text-[10px]">●</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. CATEGORIES (CLICK DIRECTLY NAVIGATES TO CATEGORY FILTER PAGE) */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Categories & Instruments
          </h4>
          <span className="text-[11px] text-gray-400 font-semibold">
            {filteredCategories.length}
          </span>
        </div>

        <p className="text-[11px] text-gray-400">
          Select a category to view associated equipment and technical filters:
        </p>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filteredCategories.map((cat) => (
            <Link
              key={cat._id}
              to={`/categories/${cat.slug}`}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:text-[#021C57] hover:bg-blue-50/70 border border-transparent hover:border-blue-200/60 transition flex items-center justify-between group"
            >
              <span className="truncate pr-2 group-hover:font-semibold">
                {formatTitleCase(cat.name)}
              </span>
              <ChevronRight
                size={14}
                className="text-gray-400 group-hover:text-[#021C57] group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          ))}
        </div>
      </div>

    </aside>
  );
};

export default ProductSidebar;
