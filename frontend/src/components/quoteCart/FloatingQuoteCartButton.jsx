import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useQuoteCartStore } from "../../store/useQuoteCartStore.js";

const FloatingQuoteCartButton = () => {
  const { items, openCart, getTotalQuantity, isOpen } = useQuoteCartStore();

  if (isOpen || items.length === 0) return null;

  const totalQuantity = getTotalQuantity();

  return (
    <div className="fixed bottom-6 left-6 z-40 animate-bounce-subtle">
      <button
        onClick={openCart}
        className="group bg-gradient-to-r from-[#021C57] to-[#043399] hover:from-[#032d88] hover:to-[#021C57] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20 cursor-pointer"
        title="Open Quote Basket"
      >
        <div className="relative flex items-center justify-center">
          <ShoppingBag size={20} className="text-cyan-300" />
          <span className="absolute -top-2 -right-2 bg-amber-400 text-gray-900 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {totalQuantity}
          </span>
        </div>

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider leading-none">
            Quote Basket
          </span>
          <span className="text-xs font-extrabold text-white leading-tight">
            {items.length} {items.length === 1 ? "Product" : "Products"} ({totalQuantity} Units)
          </span>
        </div>

        <ArrowRight
          size={16}
          className="hidden sm:block text-cyan-300 group-hover:translate-x-1 transition-transform"
        />
      </button>
    </div>
  );
};

export default FloatingQuoteCartButton;
