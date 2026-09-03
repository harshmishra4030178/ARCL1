"use client";

import { Link } from "../../utils/navigation.jsx";
import {
  X,
  FileText,
  ArrowRight,
  MessageCircle,
  Layers,
  Sparkles,
  Package,
  Cog,
  SlidersHorizontal,
} from "lucide-react";
import { formatTitleCase } from "../../utils/stringUtils.js";

const CategoryProductsCatalogModal = ({
  isOpen,
  onClose,
  category,
  products = [],
}) => {
  if (!isOpen || !category) return null;

  // Filter products belonging to this category
  const categoryProducts = products.filter(
    (p) =>
      p.category?._id === category._id ||
      p.category === category._id ||
      p.category?.slug === category.slug
  );

  const hasHowItWorks = Boolean(
    category.howItWorks || (category.howItWorksSteps && category.howItWorksSteps.length > 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 relative animate-scale-up flex flex-col justify-between">
        
        {/* MODAL HEADER */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#021C57] flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#021C57] px-2.5 py-0.5 rounded-full">
                  {formatTitleCase(category.equipmentType?.name || "Equipment Collection")}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {categoryProducts.length} Instruments Available
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight mt-0.5">
                {formatTitleCase(category.name)}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Category Description */}
          {category.description && (
            <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-2xl text-xs sm:text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800">Category Overview: </span>
              {category.description}
            </div>
          )}

          {/* Working Principle & Operational Steps (If Available) */}
          {hasHowItWorks && (
            <div className="bg-amber-50/60 border border-amber-200/80 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Cog size={14} className="text-amber-700" /> Working Principle & Operational Steps
              </h4>

              {category.howItWorks && (
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {category.howItWorks}
                </p>
              )}

              {category.howItWorksSteps && category.howItWorksSteps.length > 0 && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {category.howItWorksSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {step.stepNumber || idx + 1}
                        </span>
                        <span className="font-bold text-xs text-[#021C57] truncate">
                          {step.title || `Step ${idx + 1}`}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-[11px] text-gray-600 leading-relaxed pl-7">
                          {step.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* General Technical Specifications (Category Master) */}
          {category.generalSpecifications && category.generalSpecifications.length > 0 && (
            <div className="bg-indigo-50/50 border border-indigo-200/80 p-4.5 rounded-2xl space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-indigo-600" /> General Technical Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {category.generalSpecifications.map((spec, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between shadow-2xs text-xs"
                  >
                    <span className="font-semibold text-gray-500 text-[11px]">{spec.key}</span>
                    <span className="font-bold text-[#021C57] mt-0.5">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Callout Notice */}
          <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-900">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" />
              Click any equipment below to view and download its official technical PDF catalog brochure.
            </span>
          </div>

          {/* Products List */}
          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categoryProducts.map((product) => {
                const img =
                  Array.isArray(product.images) && product.images[0]
                    ? product.images[0]
                    : typeof product.images === "string"
                    ? product.images
                    : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600";

                return (
                  <div
                    key={product._id}
                    className="bg-white border border-gray-200 hover:border-[#021C57] rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#021C57] group-hover:text-blue-600 transition line-clamp-1">
                          {formatTitleCase(product.name)}
                        </h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                          {product.description || "Testing instrument"}
                        </p>
                        {product.specifications && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {Object.keys(product.specifications).length} specifications
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                      {/* PDF Catalog Button (Primary Action) */}
                      <Link
                        to={`/products/${product.slug}/catalog`}
                        onClick={onClose}
                        className="flex-1 bg-gradient-to-r from-[#021C57] to-[#043399] hover:from-[#03308f] hover:to-[#052b7a] text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <FileText size={13} />
                        View PDF Catalog
                      </Link>

                      {/* WhatsApp Inquiry */}
                      <a
                        href={`https://wa.me/918169695728?text=Hello%20ARCL%20Team,%20I%20am%20interested%20in%20obtaining%20a%20technical%20quote%20for%20${encodeURIComponent(
                          formatTitleCase(product.name)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition"
                        title="WhatsApp Quote"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <Package className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-gray-500 text-sm">
                No products currently listed under this category.
              </p>
              <Link
                to="/products"
                onClick={onClose}
                className="text-xs font-bold text-blue-600 hover:underline inline-block"
              >
                Browse Full Catalogue →
              </Link>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 rounded-b-3xl flex items-center justify-between">
          <Link
            to={`/categories/${category.slug}`}
            onClick={onClose}
            className="text-xs font-bold text-[#021C57] hover:text-blue-700 flex items-center gap-1"
          >
            Go to Category Filter Page <ArrowRight size={13} />
          </Link>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default CategoryProductsCatalogModal;
