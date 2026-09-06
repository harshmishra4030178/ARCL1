"use client";

import React, { useMemo } from "react";
import { useCompareStore } from "../../store/useCompareStore.js";
import { useQuoteCartStore } from "../../store/useQuoteCartStore.js";
import { Link } from "../../utils/navigation.jsx";
import { formatTitleCase } from "../../utils/stringUtils.js";
import {
  X,
  Scale,
  Trash2,
  Check,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Printer,
  ChevronRight,
  Info,
} from "lucide-react";

export default function ProductComparisonModal() {
  const { items, isCompareModalOpen, closeCompareModal, removeFromCompare, clearCompare } =
    useCompareStore();
  const { addItem, isInCart } = useQuoteCartStore();

  // Extract all unique specification keys across all products
  const allSpecKeys = useMemo(() => {
    const keys = new Set();
    items.forEach((item) => {
      if (item.specifications && typeof item.specifications === "object") {
        Object.keys(item.specifications).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [items]);

  if (!isCompareModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#021C57] to-[#0A2E7A] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Scale className="text-amber-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                Side-by-Side Equipment Comparison
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {items.length} {items.length === 1 ? "Instrument" : "Instruments"}
                </span>
              </h2>
              <p className="text-xs text-blue-200 hidden sm:block">
                Compare laboratory testing machines, technical capacities, and IS/ASTM standard compliances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => window.print()}
                title="Print Comparison Matrix"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
              >
                <Printer size={14} /> Print
              </button>
            )}

            {items.length > 0 && (
              <button
                onClick={clearCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold transition border border-red-400/30"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}

            <button
              onClick={closeCompareModal}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-2"
              aria-label="Close comparison"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY / TABLE ================= */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-slate-50">
          {items.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto border border-blue-100">
                <Scale size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Instruments Added to Compare</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Browse our product catalogue and click <strong>[+ Compare]</strong> on any equipment card to compare technical specifications side by side.
              </p>
              <button
                onClick={closeCompareModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#021C57] text-white font-bold text-sm hover:bg-blue-900 transition shadow-md"
              >
                Browse Product Catalogue
              </button>
            </div>
          ) : (
            <div className="min-w-[650px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-4 w-48 font-bold text-slate-700 bg-slate-100/90 sticky left-0 z-10 border-r border-slate-200">
                      Feature / Attribute
                    </th>
                    {items.map((prod) => (
                      <th
                        key={prod._id}
                        className="p-4 w-64 min-w-[220px] font-bold text-slate-900 align-top relative border-r last:border-r-0 border-slate-200"
                      >
                        <button
                          onClick={() => removeFromCompare(prod._id)}
                          title="Remove from comparison"
                          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <X size={16} />
                        </button>

                        <div className="space-y-3 pr-6">
                          {/* Product Image */}
                          <div className="h-32 w-full bg-slate-50 rounded-xl p-2 flex items-center justify-center border border-slate-100">
                            <img
                              src={
                                Array.isArray(prod.images) && prod.images[0]
                                  ? prod.images[0]
                                  : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600"
                              }
                              alt={prod.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          {/* Product Title */}
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 min-h-[36px]">
                            {formatTitleCase(prod.name)}
                          </h4>

                          {/* SKU / Code */}
                          {prod.productCode && (
                            <span className="inline-block text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              SKU: {prod.productCode}
                            </span>
                          )}

                          {/* Actions */}
                          <div className="pt-2 flex flex-col gap-2">
                            <button
                              onClick={() => addItem(prod, 1)}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                                isInCart(prod._id)
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-[#021C57] text-white hover:bg-blue-900 shadow-xs"
                              }`}
                            >
                              {isInCart(prod._id) ? (
                                <>
                                  <Check size={14} /> Added in Quote
                                </>
                              ) : (
                                <>
                                  <ShoppingBag size={14} /> Add to Quote
                                </>
                              )}
                            </button>

                            <Link
                              to={`/products/${prod.slug || prod._id}`}
                              onClick={closeCompareModal}
                              className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 text-center transition flex items-center justify-center gap-1"
                            >
                              <span>View Details</span>
                              <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {/* Category & Segment */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 border-r border-slate-200">
                      Category
                    </td>
                    {items.map((prod) => (
                      <td key={prod._id} className="p-3 border-r last:border-r-0 border-slate-200">
                        {prod.category?.name || "Laboratory Testing Equipment"}
                      </td>
                    ))}
                  </tr>

                  {/* Equipment Type */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 border-r border-slate-200">
                      Equipment Group
                    </td>
                    {items.map((prod) => (
                      <td key={prod._id} className="p-3 border-r last:border-r-0 border-slate-200 font-medium">
                        {prod.category?.equipmentType?.name || prod.equipmentTypeName || "Civil Engineering"}
                      </td>
                    ))}
                  </tr>

                  {/* Standard Compliance */}
                  <tr className="hover:bg-slate-50/70 transition bg-blue-50/30">
                    <td className="p-3 font-semibold text-blue-950 bg-blue-50/80 sticky left-0 border-r border-blue-100">
                      Testing Standards
                    </td>
                    {items.map((prod) => {
                      const standards =
                        prod.specifications?.Standard ||
                        prod.specifications?.["Conforming Standard"] ||
                        prod.specifications?.Standards ||
                        "IS / ASTM / BS Standard Compliant";
                      return (
                        <td key={prod._id} className="p-3 border-r last:border-r-0 border-slate-200">
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-900 text-xs bg-blue-50 border border-blue-200/70 px-2 py-1 rounded-md">
                            <ShieldCheck size={13} className="text-blue-600" />
                            {standards}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* All Dynamic Technical Specifications */}
                  {allSpecKeys.map((key) => (
                    <tr key={key} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 border-r border-slate-200">
                        {key}
                      </td>
                      {items.map((prod) => {
                        const val = prod.specifications?.[key];
                        return (
                          <td key={prod._id} className="p-3 border-r last:border-r-0 border-slate-200">
                            {val ? (
                              <span className="font-medium text-slate-900">{val}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">- Not Specified -</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Key Features */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 border-r border-slate-200 align-top">
                      Key Highlights & Features
                    </td>
                    {items.map((prod) => (
                      <td key={prod._id} className="p-3 border-r last:border-r-0 border-slate-200 align-top">
                        {Array.isArray(prod.features) && prod.features.length > 0 ? (
                          <ul className="space-y-1.5 text-xs">
                            {prod.features.slice(0, 4).map((feat, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Heavy-duty engineered construction</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Applications */}
                  <tr className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 border-r border-slate-200 align-top">
                      Applications & Usage
                    </td>
                    {items.map((prod) => (
                      <td key={prod._id} className="p-3 border-r last:border-r-0 border-slate-200 align-top">
                        {Array.isArray(prod.applications) && prod.applications.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {prod.applications.slice(0, 3).map((app, i) => (
                              <span
                                key={i}
                                className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                              >
                                {app}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">R&D, Concrete & Material Testing</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-600" />
            <span>Specifications comply with relevant ISO/IS/ASTM civil laboratory test standards.</span>
          </div>
          <button
            onClick={closeCompareModal}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
