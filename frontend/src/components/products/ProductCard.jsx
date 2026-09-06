"use client";

import { Link } from "../../utils/navigation.jsx";
import { ArrowRight, MessageCircle, FileText, Sparkles, ArrowUpRight, Layers, ShoppingBag } from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";
import { useQuoteCartStore } from "../../store/useQuoteCartStore.js";
import { useCompareStore } from "../../store/useCompareStore.js";
import { Scale, Check } from "lucide-react";

const ProductCard = ({ product }) => {
  const { addItem, isInCart } = useQuoteCartStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  if (!product) return null;

  const inCompare = isInCompare(product._id);

  const imageUrl =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string"
      ? product.images
      : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600";

  // Quick specs array for preview pills
  const specsEntries =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications).slice(0, 2)
      : [];

  // const categoryName = product.category?.name
  //   ? formatTitleCase(product.category.name)
  //   : typeof product.category === "string" && product.category.length < 24
  //   ? formatTitleCase(product.category)
  //   : "Testing Equipment";

  const equipmentTypeName = product.category?.equipmentType?.name
    ? formatTitleCase(product.category.equipmentType.name)
    : product.equipmentTypeName
    ? formatTitleCase(product.equipmentTypeName)
    : "";

  return (
    <div className="group relative flex flex-col justify-between h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-blue-200 shadow-xs hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 overflow-hidden">
      
      {/* Top Subtle Hover Accent Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#021C57] via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
      
      <div>
        {/* ================= 1. COMPACT IMAGE CONTAINER ================= */}
        <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-50/70 p-3 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600";
            }}
          />
          
          {/* Top Left Compare Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(product);
            }}
            title={inCompare ? "Remove from comparison" : "Add to comparison"}
            className={`absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition shadow-xs cursor-pointer ${
              inCompare
                ? "bg-[#021C57] text-white border border-blue-400"
                : "bg-white/90 hover:bg-white text-slate-700 hover:text-[#021C57] border border-slate-200"
            }`}
          >
            {inCompare ? <Check size={10} className="text-emerald-400" /> : <Scale size={10} />}
            <span>{inCompare ? "Comparing" : "Compare"}</span>
          </button>

          {/* Top Floating Featured Badge */}
          {product.isFeatured && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-amber-950 bg-amber-200/90 shadow-xs border border-amber-300">
                <Sparkles size={10} className="text-amber-800" />
                Featured
              </span>
            </div>
          )}
        </div>

        {/* ================= 2. CARD CONTENT ================= */}
        <div className="p-4 sm:p-5 space-y-2.5">
          
          {/* CATEGORY & EQUIPMENT & SKU BADGES */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-[#021C57] bg-blue-50/90 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#021C57]" />
              {categoryName}
            </span> */}

            {equipmentTypeName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium text-slate-500 bg-slate-100">
                <Layers size={9} className="text-slate-400" />
                {equipmentTypeName}
              </span>
            )}

            {product.productCode && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold text-blue-900 bg-blue-50/70 border border-blue-100">
                {product.productCode.toUpperCase()}
              </span>
            )}
          </div>

          {/* TITLE */}
          <Link
            to={`/products/${product.slug}`}
            className="group/title block text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#021C57] transition-colors leading-snug line-clamp-2 min-h-[38px]"
          >
            <span>{formatTitleCase(product.name)}</span>
          </Link>

          {/* COMPACT SPECS PREVIEW CHIPS */}
          {specsEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {specsEntries.slice(0, 2).map(([k, v], idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-[9px] sm:text-[10px] text-slate-700"
                >
                  <span className="text-slate-400 font-normal">{formatTitleCase(k)}:</span>
                  <span className="font-bold truncate max-w-[80px]">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. COMPACT STREAMLINED ACTIONS ================= */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          {/* Main Action: View Details */}
          <Link
            to={`/products/${product.slug}`}
            className="flex-1 group/btn py-2 px-3 bg-[#021C57] hover:bg-[#032980] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs active:scale-[0.98]"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </Link>
          
          {/* Add to Quote Basket Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addItem(product, 1);
            }}
            title={isInCart(product._id) ? "In Quote Basket (Click to add +1)" : "Add to Quote Basket"}
            className={`p-2 rounded-xl border transition cursor-pointer shrink-0 active:scale-95 ${
              isInCart(product._id)
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs"
                : "bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#021C57] border-slate-200"
            }`}
          >
            <ShoppingBag
              className={`w-4 h-4 ${
                isInCart(product._id) ? "text-amber-600 font-bold" : "text-slate-600"
              }`}
            />
          </button>

          {/* PDF Catalog Icon Button */}
          <Link
            to={`/products/${product.slug}/catalog`}
            title="Download PDF Catalog Brochure"
            className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-[#021C57] border border-slate-200 rounded-xl transition cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4 text-blue-600" />
          </Link>

          {/* WhatsApp Quote Icon Button */}
          <a
            href={`https://wa.me/918169695728?text=Hello%20ARCL%20Team,%20I%20am%20interested%20in%20obtaining%20a%20technical%20quote%20for%20${encodeURIComponent(
              formatTitleCase(product.name)
            )}%20(SKU:%20${product.slug})`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp Quote"
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition cursor-pointer shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default ProductCard;
