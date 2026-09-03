"use client";

import { Link } from "../../../utils/navigation.jsx";
import {
  FaEdit,
  FaStar,
  FaLayerGroup,
  FaCalendarAlt,
  FaSlidersH,
  FaCogs,
} from "react-icons/fa";
import { X, CheckCircle2, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { formatTitleCase } from "../../../utils/stringUtils.js";

const CategoryDetailsModal = ({ isOpen, onClose, category }) => {
  if (!isOpen || !category) return null;

  const hasHowItWorks = Boolean(
    category.howItWorks || (category.howItWorksSteps && category.howItWorksSteps.length > 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 relative animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 p-2 rounded-xl text-sm font-bold">
              <FaLayerGroup />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-800 line-clamp-1">
                Category & Master Specifications
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                ID: {category._id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* HEADER INFO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#021C57] text-white text-xs font-semibold px-3 py-1 rounded-full">
                {formatTitleCase(category.equipmentType?.name || "Equipment Type")}
              </span>

              {category.isFeatured && (
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <FaStar size={10} className="text-amber-500" /> Featured Category
                </span>
              )}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 leading-snug">
              {formatTitleCase(category.name)}
            </h3>

            <p className="text-xs text-gray-400 font-mono">
              Slug: <span className="text-blue-600">/categories/{category.slug}</span>
            </p>

            {/* DESCRIPTION */}
            <div className="bg-gray-50 border border-gray-200/80 p-4 rounded-2xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Master Category Description
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {category.description || "No category description provided."}
              </p>
            </div>

            {/* HOW IT WORKS / WORKING PRINCIPLE & DYNAMIC STEPS */}
            {hasHowItWorks && (
              <div className="bg-amber-50/50 border border-amber-200/70 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <FaCogs className="text-amber-600" /> Working Principle & Operating Steps
                </h4>

                {category.howItWorks && (
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {category.howItWorks}
                  </p>
                )}

                {category.howItWorksSteps && category.howItWorksSteps.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                    {category.howItWorksSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {step.stepNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-amber-950 truncate">
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

            <div className="pt-1 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FaCalendarAlt size={11} /> Created:{" "}
                {new Date(category.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* DYNAMIC SPECIFICATION FILTERS */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-2">
              <FaSlidersH size={14} className="text-blue-600" />
              Dynamic Product Filters ({category.filters?.length || 0})
            </h4>

            {category.filters && category.filters.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {category.filters.map((filter, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-xs uppercase tracking-wide">
                        {formatTitleCase(filter.name)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        ({filter.key})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {filter.values && filter.values.length > 0 ? (
                        filter.values.map((val, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg shadow-2xs font-bold"
                          >
                            {val}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Custom value input allowed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl">
                No dynamic specification filters defined for this category.
              </p>
            )}
          </div>

          {/* MASTER FEATURES & APPLICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Features */}
            {category.features && category.features.length > 0 && (
              <div className="bg-blue-50/60 p-4.5 rounded-2xl border border-blue-100 space-y-2">
                <h4 className="text-xs font-bold text-[#021C57] uppercase tracking-wider">
                  Master Key Features ({category.features.length})
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {category.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Applications */}
            {category.applications && category.applications.length > 0 && (
              <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-100 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Master Applications ({category.applications.length})
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {category.applications.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* GENERAL TECHNICAL SPECIFICATIONS */}
          {category.generalSpecifications && category.generalSpecifications.length > 0 && (
            <div className="bg-indigo-50/50 p-4.5 rounded-2xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <FaCogs className="text-indigo-600" />
                General Technical Specifications ({category.generalSpecifications.length})
              </h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {category.generalSpecifications.map((spec, i) => (
                  <div
                    key={i}
                    className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between text-xs gap-2 shadow-2xs"
                  >
                    <span className="font-semibold text-gray-600">{spec.key}:</span>
                    <span className="font-bold text-[#021C57] text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 rounded-b-3xl flex items-center justify-between gap-4">
          <Link
            to={`/categories/${category.slug}`}
            target="_blank"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Open Category Storefront Page →
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Close
            </button>

            <Link
              to={`/admin/categories/edit/${category.slug}`}
              className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <FaEdit size={12} /> Edit Category
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CategoryDetailsModal;
