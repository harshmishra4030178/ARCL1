"use client";

import React from "react";
import { useCompareStore } from "../../store/useCompareStore.js";
import ProductComparisonModal from "./ProductComparisonModal.jsx";
import { Scale, X, ArrowRight, Trash2 } from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";

export default function CompareFloatingBar() {
  const { items, openCompareModal, removeFromCompare, clearCompare } = useCompareStore();

  if (!items || items.length === 0) return <ProductComparisonModal />;

  return (
    <>
      {/* Floating Bottom Compare Bar */}
      <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-[9990] flex justify-center px-4 pointer-events-none animate-slideUp">
        <div className="bg-[#021C57] text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-400/30 p-2 sm:p-3 pointer-events-auto flex items-center gap-3 sm:gap-4 max-w-2xl w-full backdrop-blur-xl">
          
          {/* Badge & Icon */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#021C57] flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <Scale size={16} />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-xs font-bold block text-white">Compare List</span>
              <span className="text-[10px] text-blue-200">{items.length}/4 Selected</span>
            </div>
          </div>

          {/* Product Thumbnails */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto py-1 scrollbar-none">
            {items.map((prod) => (
              <div
                key={prod._id}
                className="relative group flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl px-2 py-1 shrink-0 transition"
              >
                <img
                  src={
                    Array.isArray(prod.images) && prod.images[0]
                      ? prod.images[0]
                      : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=100"
                  }
                  alt={prod.name}
                  className="w-6 h-6 object-contain rounded bg-white p-0.5"
                />
                <span className="text-[11px] font-semibold text-white max-w-[90px] sm:max-w-[120px] truncate">
                  {formatTitleCase(prod.name)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCompare(prod._id);
                  }}
                  className="text-blue-300 hover:text-red-400 p-0.5 rounded-full"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Compare Now CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openCompareModal}
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition shadow-md hover:scale-105"
            >
              <span>Compare ({items.length})</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={clearCompare}
              title="Clear comparison"
              className="p-2 text-blue-300 hover:text-white rounded-xl hover:bg-white/10 transition hidden sm:block"
            >
              <Trash2 size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* Actual Comparison Fullscreen Modal */}
      <ProductComparisonModal />
    </>
  );
}
