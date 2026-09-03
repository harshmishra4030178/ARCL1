"use client";

import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  MessageCircle,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { Link } from "../../utils/navigation.jsx";
import { useQuoteCartStore } from "../../store/useQuoteCartStore.js";
import { useInquiryStore } from "../../store/useInquiryStore.js";
import { toast } from "react-toastify";
import { formatTitleCase } from "../../utils/stringUtils.js";

const QuoteCartDrawer = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalQuantity,
  } = useQuoteCartStore();

  const { createInquiry, loading } = useInquiryStore();

  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    state: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const totalUnits = getTotalQuantity();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // SUBMIT MULTI-ITEM INQUIRY TO BACKEND
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your quote basket is empty. Please add items first.");
      return;
    }

    if (
      !formData.customerName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      toast.error("Please fill in your Name, Email, and Phone number.");
      return;
    }

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        message: formData.message.trim(),
        items: items.map((item) => ({
          productId: item.product._id,
          productName: item.product.name,
          productCode: item.product.productCode || "",
          productSlug: item.product.slug,
          category: item.product.category,
          quantity: item.quantity,
        })),
      };

      await createInquiry(payload);
      setSubmitted(true);
      toast.success(
        "Multi-product quote inquiry submitted successfully! Our technical sales engineer will contact you shortly. 🎉"
      );
      clearCart();
    } catch (err) {
      console.error("Quote basket submit error:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit quote request. Please try again."
      );
    }
  };

  // 1-CLICK WHATSAPP SHARE OF ENTIRE QUOTE BASKET
  const handleWhatsAppSend = () => {
    if (items.length === 0) {
      toast.error("Your quote basket is empty.");
      return;
    }

    const nameStr = formData.customerName.trim() || "Client";
    const companyStr = formData.company.trim()
      ? ` (${formData.company.trim()})`
      : "";

    let messageText = `*ARCL Multi-Product Quote Request*\n`;
    messageText += `*From:* ${nameStr}${companyStr}\n`;
    if (formData.phone.trim()) messageText += `*Phone:* ${formData.phone.trim()}\n`;
    if (formData.email.trim()) messageText += `*Email:* ${formData.email.trim()}\n`;
    if (formData.city.trim()) messageText += `*Location:* ${formData.city.trim()}\n`;
    messageText += `\n*Requested Testing Equipment List (${items.length} Items / ${totalUnits} Units):*\n`;

    items.forEach((item, index) => {
      const codeStr = item.product.productCode ? ` [Code: ${item.product.productCode}]` : "";
      messageText += `${index + 1}. *${formatTitleCase(item.product.name)}*${codeStr}\n   Quantity: *${item.quantity} Unit(s)*\n`;
    });

    if (formData.message.trim()) {
      messageText += `\n*Special Notes / Requirements:*\n${formData.message.trim()}\n`;
    }

    const whatsappUrl = `https://wa.me/918169695728?text=${encodeURIComponent(
      messageText
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* BACKDROP */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* DRAWER CONTAINER */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
          
          {/* 1. DRAWER HEADER */}
          <div className="p-5 sm:p-6 bg-[#021C57] text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-cyan-300">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Quote Basket
                  {items.length > 0 && (
                    <span className="bg-amber-400 text-gray-900 text-xs font-black px-2 py-0.5 rounded-full">
                      {items.length} Items ({totalUnits} Units)
                    </span>
                  )}
                </h2>
                <p className="text-xs text-blue-200">
                  Bulk Quotation & Institutional Inquiries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-blue-200 hover:text-white transition px-2.5 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Clear all items"
                >
                  Clear All
                </button>
              )}

              <button
                onClick={closeCart}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 2. DRAWER BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* SUCCESS STATE */}
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-md">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-[#021C57]">
                  Quote Request Submitted!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Thank you for submitting your multi-instrument requirements. Our technical sales engineers will prepare the official ARCL quotation and connect with you shortly.
                </p>
                <div className="pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      closeCart();
                    }}
                    className="w-full py-3 bg-[#021C57] text-white text-xs font-bold rounded-xl transition cursor-pointer hover:bg-blue-900"
                  >
                    Continue Browsing Catalogue
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              /* EMPTY BASKET STATE */
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#021C57] flex items-center justify-center mx-auto shadow-inner">
                  <ShoppingBag size={30} className="text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  Your Quote Basket is Empty
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Browse our testing equipment inventory and click <strong>"+ Quote"</strong> on any instrument to build your multi-product proposal.
                </p>
                <div className="pt-2">
                  <Link
                    to="/products"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 bg-[#021C57] text-white text-xs font-bold px-6 py-3 rounded-xl transition hover:bg-blue-900 shadow-md cursor-pointer"
                  >
                    <span>Browse Equipment Catalogue</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              /* ACTIVE ITEMS LIST + SUBMISSION FORM */
              <div className="space-y-6">
                
                {/* ITEMS LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>Selected Instruments ({items.length})</span>
                    <span>Quantity</span>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 divide-y divide-gray-100">
                    {items.map((item) => {
                      const img =
                        Array.isArray(item.product.images) && item.product.images[0]
                          ? item.product.images[0]
                          : typeof item.product.images === "string"
                          ? item.product.images
                          : "/placeholder.png";

                      return (
                        <div
                          key={item.product._id}
                          className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                        >
                          {/* Image & Title */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                              <img
                                src={img}
                                alt={item.product.name}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-gray-900 truncate">
                                {formatTitleCase(item.product.name)}
                              </h4>
                              
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {item.product.category && (
                                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 truncate max-w-[120px]">
                                    {formatTitleCase(item.product.category)}
                                  </span>
                                )}

                                {item.product.productCode && (
                                  <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                                    {item.product.productCode.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stepper & Delete */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/80 p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product._id,
                                    Math.max(1, item.quantity - 1)
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="w-6 h-6 rounded-lg bg-white disabled:opacity-30 text-gray-600 hover:text-black flex items-center justify-center shadow-2xs cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>

                              <span className="w-7 text-center font-bold text-xs text-[#021C57]">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product._id,
                                    item.quantity + 1
                                  )
                                }
                                className="w-6 h-6 rounded-lg bg-white text-gray-600 hover:text-black flex items-center justify-center shadow-2xs cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.product._id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MULTI-ITEM PROPOSAL SUBMISSION FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="bg-slate-50/80 border border-gray-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5"
                >
                  <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-600" />
                    Enter Contact & Institutional Details
                  </h3>

                  {/* Name */}
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      name="customerName"
                      required
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Your Full Name *"
                      className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email Address *"
                        className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone / WhatsApp *"
                        className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  {/* Company & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Institution / Company Name"
                        className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City / State"
                        className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  {/* Notes / Special requirements */}
                  <div>
                    <textarea
                      name="message"
                      rows={2}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Special requirements (e.g. calibration certificate needed, installation site, urgent tender deadline)..."
                      className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-2 space-y-2">
                    {/* 1. OFFICIAL SUBMIT BUTTON */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#021C57] hover:bg-[#032d88] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60 cursor-pointer active:scale-[0.99]"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Send size={14} />
                      )}
                      <span>
                        {loading
                          ? "Submitting Quote Proposal..."
                          : `Submit Official Quote Request (${totalUnits} Units)`}
                      </span>
                    </button>

                    {/* 2. DIRECT WHATSAPP BUTTON */}
                    <button
                      type="button"
                      onClick={handleWhatsAppSend}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-[0.99]"
                    >
                      <MessageCircle size={15} />
                      <span>Send Complete Basket via WhatsApp</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* 3. DRAWER FOOTER */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-[11px] text-gray-500 shrink-0">
            <span>🔒 Direct Manufacturer Pricing • ISO 9001:2015 Assured</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuoteCartDrawer;
