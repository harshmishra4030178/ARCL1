import React from "react";
import {
  X,
  Mail,
  Phone,
  Building2,
  Package,
  Calendar,
  MessageSquare,
  MapPin,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { formatTitleCase } from "../../../utils/stringUtils.js";

const InquiryDetailsModal = ({ inquiry, onClose }) => {
  if (!inquiry) return null;

  const hasMultipleItems =
    inquiry.isInquiryBasket || (Array.isArray(inquiry.items) && inquiry.items.length > 1);

  const totalQuantity =
    inquiry.totalItems ||
    (Array.isArray(inquiry.items)
      ? inquiry.items.reduce((sum, it) => sum + (it.quantity || 1), 0)
      : inquiry.quantity || 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* MODAL */}
      <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-10 w-10 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                inquiry.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : inquiry.status === "contacted"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              ● Status: {inquiry.status}
            </span>

            {hasMultipleItems && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <ShoppingBag size={13} />
                Multi-Product Basket ({inquiry.items?.length || 0} Instruments / {totalQuantity} Units)
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#021C57] mt-3">
            Quotation Inquiry Details
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Submitted by {inquiry.customerName} on {new Date(inquiry.createdAt).toLocaleString()}
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
          
          {/* 1. CUSTOMER INFORMATION */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Customer & Institution Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <p className="text-xs text-gray-400 font-semibold uppercase">Customer Name</p>
                <h4 className="mt-1 font-bold text-[#021C57] text-sm sm:text-base">
                  {inquiry.customerName}
                </h4>
              </div>

              {/* Company / Lab */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase">
                  <Building2 className="w-3.5 h-3.5" /> Organization / Lab
                </div>
                <h4 className="mt-1 font-bold text-[#021C57] text-sm sm:text-base">
                  {inquiry.company || "N/A"}
                </h4>
              </div>

              {/* Email */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </div>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="mt-1 font-bold text-blue-600 hover:underline block text-sm sm:text-base truncate"
                >
                  {inquiry.email}
                </a>
              </div>

              {/* Phone */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase">
                  <Phone className="w-3.5 h-3.5" /> Phone / WhatsApp
                </div>
                <a
                  href={`tel:${inquiry.phone}`}
                  className="mt-1 font-bold text-[#021C57] hover:underline block text-sm sm:text-base"
                >
                  {inquiry.phone}
                </a>
              </div>

              {/* City / Location */}
              {(inquiry.city || inquiry.state) && (
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold uppercase">
                    <MapPin className="w-3.5 h-3.5" /> Location / Region
                  </div>
                  <h4 className="mt-1 font-bold text-[#021C57] text-sm sm:text-base">
                    {[inquiry.city, inquiry.state].filter(Boolean).join(", ")}
                  </h4>
                </div>
              )}
            </div>
          </div>

          {/* 2. PRODUCT / BASKET INFORMATION */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              {hasMultipleItems
                ? `Requested Equipment Basket (${inquiry.items?.length || 0} Instruments)`
                : "Requested Equipment Details"}
            </h3>

            {hasMultipleItems && Array.isArray(inquiry.items) ? (
              /* MULTI-ITEM TABLE */
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-3.5 pl-4">#</th>
                        <th className="p-3.5">Instrument / Machine Name</th>
                        <th className="p-3.5">Category / Code</th>
                        <th className="p-3.5 text-right pr-4">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {inquiry.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40 transition">
                          <td className="p-3.5 pl-4 font-bold text-gray-400">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-[#021C57]">
                            {formatTitleCase(item.productName)}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.category && (
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {formatTitleCase(item.category)}
                                </span>
                              )}
                              {item.productCode && (
                                <span className="font-mono text-gray-500 font-bold text-[10px]">
                                  {item.productCode.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 pr-4 text-right">
                            <span className="font-bold text-[#021C57] bg-gray-100 px-2.5 py-1 rounded-lg">
                              {item.quantity} Unit{item.quantity > 1 ? "s" : ""}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50/80 border-t border-gray-200 font-bold text-[#021C57]">
                      <tr>
                        <td colSpan={3} className="p-3.5 pl-4 uppercase tracking-wider text-[11px]">
                          Total Units in Quote Proposal:
                        </td>
                        <td className="p-3.5 pr-4 text-right text-sm">
                          {totalQuantity} Units
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              /* SINGLE ITEM CARD */
              <div className="border border-gray-100 rounded-2xl p-5 bg-blue-50/30 flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100/70 text-[#021C57] flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-[#021C57]">
                    {formatTitleCase(inquiry.productName)}
                  </h4>
                  {inquiry.category && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Category: {formatTitleCase(inquiry.category)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-2xs">
                      Quantity: {inquiry.quantity || 1} Unit(s)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. CUSTOMER MESSAGE / SPECIAL REQUIREMENTS */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Customer Requirements & Notes
            </h3>
            <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50 text-gray-700 text-xs sm:text-sm leading-relaxed">
              <div className="flex gap-2.5">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p>{inquiry.message || "No special requirements or notes provided."}</p>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${inquiry.email}?subject=ARCL%20Quotation%20Proposal%20for%20${encodeURIComponent(
                inquiry.productName
              )}&body=Dear%20${encodeURIComponent(inquiry.customerName)},%0A%0AThank%20you%20for%20your%20inquiry.`}
              className="inline-flex items-center gap-1.5 bg-[#021C57] hover:bg-blue-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Mail size={14} /> Send Official Quote Email
            </a>

            <a
              href={`https://wa.me/${inquiry.phone?.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(
                inquiry.customerName
              )},%20thank%20you%20for%20your%20quote%20request%20with%20ARCL%20Instruments.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Phone size={14} /> WhatsApp Client
            </a>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default InquiryDetailsModal;
