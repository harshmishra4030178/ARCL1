"use client";

import { Link } from "../../../utils/navigation.jsx";
import {
  FaEdit,
  FaCheck,
  FaTimes,
  FaStar,
  FaLayerGroup,
  FaCalendarAlt,
  FaTag,
} from "react-icons/fa";
import { X, CheckCircle2, ShieldCheck, FileText, Cog, QrCode } from "lucide-react";
import { formatTitleCase } from "../../../utils/stringUtils.js";

const ProductDetailsModal = ({ isOpen, onClose, product, onOpenQr }) => {
  if (!isOpen || !product) return null;

  const imageUrl =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string"
      ? product.images
      : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600";

  const description =
    product.description || product.category?.description || "No description provided.";

  const features =
    product.features?.length > 0
      ? product.features
      : product.category?.features || [];

  const applications =
    product.applications?.length > 0
      ? product.applications
      : product.category?.applications || [];

  const howItWorks = product.howItWorks || product.category?.howItWorks;
  const howItWorksSteps =
    (product.howItWorksSteps && product.howItWorksSteps.length > 0)
      ? product.howItWorksSteps
      : (product.category?.howItWorksSteps && product.category.howItWorksSteps.length > 0)
      ? product.category.howItWorksSteps
      : [];

  const hasHowItWorks = Boolean(howItWorks || (howItWorksSteps && howItWorksSteps.length > 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 relative animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-[#021C57] p-2 rounded-xl text-sm font-bold">
              <FaTag />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-800 line-clamp-1">
                Product Quick Details
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                ID: {product._id}
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
          
          {/* TOP SECTION: IMAGE + DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Image & QR Code Column */}
            <div className="md:col-span-4 space-y-3">
              <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner flex items-center justify-center p-2">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-44 object-contain rounded-xl"
                />
              </div>

              {/* QR Code Quick Card */}
              {onOpenQr && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#021C57] uppercase tracking-wider flex items-center gap-1">
                      <QrCode size={12} /> Equipment QR
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      {product.qrCode ? "Active" : "Not Set"}
                    </span>
                  </div>

                  {product.qrCode ? (
                    <div className="flex items-center justify-center py-1">
                      <img
                        src={product.qrCode}
                        alt="Product QR"
                        className="w-20 h-20 bg-white p-1 rounded-xl border border-blue-200 shadow-2xs"
                      />
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500">
                      Generate a unique QR code for physical labeling.
                    </p>
                  )}

                  <button
                    onClick={() => onOpenQr(product)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#021C57] hover:bg-[#03308f] text-white text-xs font-semibold py-1.5 px-3 rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    <QrCode size={12} />
                    <span>{product.qrCode ? "Print / View QR" : "Generate QR"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="md:col-span-8 space-y-2.5">
              
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#021C57] text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FaLayerGroup size={11} /> {formatTitleCase(product.category?.name || "Equipment")}
                </span>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                    product.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.isActive ? <FaCheck size={10} /> : <FaTimes size={10} />}
                  {product.isActive ? "Active (Live)" : "Inactive (Hidden)"}
                </span>

                {product.isFeatured && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <FaStar size={10} className="text-amber-500" /> Featured Item
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
                {formatTitleCase(product.name)}
              </h3>

              {/* Slug & Product/HSN Codes */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                <span className="text-gray-400">
                  Slug: <span className="text-blue-600">/products/{product.slug}</span>
                </span>
                {product.productCode && (
                  <span className="bg-blue-50 text-[#021C57] font-bold px-2 py-0.5 rounded-md border border-blue-200">
                    SKU: {product.productCode.toUpperCase()}
                  </span>
                )}
                {product.hsnCode && (
                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    HSN: {product.hsnCode.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed pt-1">
                {description}
              </p>

              {/* Timestamps */}
              <div className="pt-2 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <FaCalendarAlt size={11} /> Created:{" "}
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>

            </div>

          </div>

          {/* DYNAMIC SPECIFICATIONS / FILTERS */}
          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ShieldCheck size={16} className="text-blue-600" /> Dynamic Technical Specifications
                </h4>

                <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs sm:text-sm shadow-2xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3.5 border-b border-gray-200 w-1/2">Specification Parameter</th>
                        <th className="p-3.5 border-b border-gray-200 w-1/2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(product.specifications).map(
                        ([key, val], idx) => (
                          <tr
                            key={key}
                            className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                          >
                            <td className="p-3.5 font-semibold text-gray-700">
                              {formatTitleCase(key)}
                            </td>
                            <td className="p-3.5 text-gray-900 font-bold">{String(val)}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* HOW IT WORKS / WORKING PRINCIPLE & OPERATIONAL STEPS */}
          {hasHowItWorks && (
            <div className="bg-amber-50/50 border border-amber-200/70 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Cog size={15} className="text-amber-700" /> Working Principle & Operating Mechanism
              </h4>

              {howItWorks && (
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {howItWorks}
                </p>
              )}

              {howItWorksSteps.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                  {howItWorksSteps.map((step, idx) => (
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

          {/* FEATURES & APPLICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Features */}
            {features.length > 0 && (
              <div className="bg-blue-50/60 p-4.5 rounded-2xl border border-blue-100 space-y-2">
                <h4 className="text-xs font-bold text-[#021C57] uppercase tracking-wider flex items-center justify-between">
                  <span>Key Features ({features.length})</span>
                  <span className="text-[10px] text-blue-600 font-normal">Category Master</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Applications */}
            {applications.length > 0 && (
              <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-100 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Applications ({applications.length})</span>
                  <span className="text-[10px] text-emerald-700 font-normal">Category Master</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {applications.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* COMPLETE SET INCLUDES */}
          {product.completeSetIncludes && product.completeSetIncludes.length > 0 && (
            <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-200/80 space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-black">
                  ✓
                </span>
                Complete Set Includes / Standard Supply Outfit ({product.completeSetIncludes.length} Items)
              </h4>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-gray-800">
                {product.completeSetIncludes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-emerald-600">{idx + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <Link
              to={`/products/${product.slug}/catalog`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <FileText size={14} /> Live Catalog
            </Link>

            {onOpenQr && (
              <button
                onClick={() => onOpenQr(product)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#021C57] hover:text-blue-800 cursor-pointer"
              >
                <QrCode size={14} /> Equipment QR Code
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              Close
            </button>

            <Link
              to={`/admin/products/edit/${product._id}`}
              className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#03308f] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <FaEdit size={12} /> Edit Product
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailsModal;
