"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "../../utils/navigation.jsx";
import { Layers, ChevronLeft, ChevronRight, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import ProductCard from "./ProductCard.jsx";
import { formatTitleCase } from "../../utils/stringUtils.js";

const EquipmentTypeProductRow = ({
  section,
  canReorder = false,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  dragHandleProps,
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 15);
    }
  }, []);

  useEffect(() => {
    checkScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollState, { passive: true });
      window.addEventListener("resize", checkScrollState);
      
      // Check after a brief delay in case images/fonts load
      const timer = setTimeout(checkScrollState, 300);

      return () => {
        el.removeEventListener("scroll", checkScrollState);
        window.removeEventListener("resize", checkScrollState);
        clearTimeout(timer);
      };
    }
  }, [section.products, checkScrollState]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollDistance = Math.max(clientWidth * 0.75, 320);
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollDistance : scrollDistance,
        behavior: "smooth",
      });
    }
  };

  const typeName = formatTitleCase(section.equipmentType?.name || "Equipment");

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 md:p-8 space-y-6 shadow-xs relative group">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3.5">
          {/* DRAG HANDLE FOR REORDERING */}
          {canReorder && (
            <div
              {...dragHandleProps}
              className="p-2 rounded-xl bg-gray-100 hover:bg-[#021C57] text-gray-500 hover:text-white transition cursor-grab active:cursor-grabbing shrink-0"
              title="Drag section to reorder"
            >
              <GripVertical size={18} />
            </div>
          )}

          <div className="w-11 h-11 rounded-2xl bg-[#021C57] text-white flex items-center justify-center shadow-md shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#021C57] tracking-tight">
              {typeName}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Showing 1 flagship instrument per represented category ({section.products.length} categories represented)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* UP / DOWN REORDER BUTTONS */}
          {canReorder && (
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1.5 rounded-lg text-gray-500 hover:text-[#021C57] hover:bg-white disabled:opacity-20 transition cursor-pointer disabled:cursor-not-allowed"
                title="Move Section Up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1.5 rounded-lg text-gray-500 hover:text-[#021C57] hover:bg-white disabled:opacity-20 transition cursor-pointer disabled:cursor-not-allowed"
                title="Move Section Down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          )}

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>View full {typeName} range</span>
            <ChevronRight size={15} />
          </Link>

          {/* Mini Header Nav Buttons */}
          {section.products.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-gray-200">
              <button
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label={`Scroll ${typeName} left`}
                title="Scroll Left"
                className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#021C57] text-gray-700 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-50 disabled:hover:text-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label={`Scroll ${typeName} right`}
                title="Scroll Right"
                className="w-8 h-8 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#021C57] text-gray-700 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-50 disabled:hover:text-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. CAROUSEL TRACK WITH FLOATING NAVIGATION ARROWS */}
      <div className="relative group/track">
        
        {/* Floating Left Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            aria-label={`Scroll ${typeName} left`}
            title="View previous items"
            className="absolute left-1 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-[#021C57] text-[#021C57] hover:text-white border-2 border-gray-200 hover:border-[#021C57] shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft size={24} className="stroke-[2.5]" />
          </button>
        )}

        {/* Left Gradient Edge Mask */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white via-white/70 to-transparent pointer-events-none z-10 rounded-l-3xl transition-opacity"></div>
        )}

        {/* Floating Right Arrow Button (">") */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            aria-label={`Scroll ${typeName} right`}
            title="View more items"
            className="absolute right-1 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-[#021C57] text-[#021C57] hover:text-white border-2 border-gray-200 hover:border-[#021C57] shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md group-hover/track:shadow-2xl"
          >
            <ChevronRight size={24} className="stroke-[2.5]" />
          </button>
        )}

        {/* Right Gradient Edge Mask */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white via-white/70 to-transparent pointer-events-none z-10 rounded-r-3xl transition-opacity"></div>
        )}

        {/* Scrollable Horizontal Product Cards Row */}
        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {section.products.map((product) => (
            <div
              key={product._id}
              className="shrink-0 w-[280px] sm:w-[310px] lg:w-[320px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

export default EquipmentTypeProductRow;
