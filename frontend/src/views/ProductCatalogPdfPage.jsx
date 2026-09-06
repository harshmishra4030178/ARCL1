"use client";

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "../utils/navigation.jsx";
import { useProductStore } from "../store/useProductStore.js";
const logo = "/assets/LOGO.png";
import {
  Download,
  ArrowLeft,
  MessageCircle,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Award,
  Building,
  Mail,
  Phone,
  Calendar,
  Cog,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatTitleCase } from "../utils/stringUtils.js";

const ProductCatalogPdfPage = ({ initialSlug }) => {
  const routeParams = useParams();
  const slug = initialSlug || routeParams.slug;
  const navigate = useNavigate();
  const { product, loading, error, fetchSingleProduct } = useProductStore();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchSingleProduct(slug);
    }
  }, [slug]);

  const handlePrintDownload = () => {
    try {
      setDownloading(true);
      window.print();
      toast.info("Preparing PDF catalog for print/download...");
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate PDF print. Please use Ctrl+P.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#021C57] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-semibold text-lg">
          Generating Technical Catalog Document...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Catalog Not Available
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {error || "Could not locate the requested product catalog."}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#021C57] text-white px-6 py-2.5 rounded-xl font-medium text-sm"
          >
            <ArrowLeft size={16} /> Return to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imageUrl =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string"
      ? product.images
      : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600";

  const hasHowItWorks = Boolean(
    product.category?.howItWorks ||
      (product.category?.howItWorksSteps &&
        product.category.howItWorksSteps.length > 0)
  );

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* 1. TOP ACTION TOOLBAR (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(`/products/${product.slug}`)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-[#021C57] transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Product
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`https://wa.me/918169695728?text=Hello%2C%20I%20have%20reviewed%20the%20catalog%20for%20${encodeURIComponent(
              formatTitleCase(product.name)
            )}%20and%20would%20like%20a%20quote.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <MessageCircle size={15} /> WhatsApp Quote
          </a>

          <button
            onClick={handlePrintDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#043399] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer"
          >
            <Download size={15} /> Download Catalog (PDF)
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL CATALOG PRINTABLE BROCHURE SHEET */}
      <div
        id="catalog-document"
        className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-12 text-gray-800 space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full"
      >
        {/* HEADER LETTERHEAD */}
        <div className="border-b-2 border-[#021C57] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="ARCL Logo"
              className="w-20 md:w-24 object-contain"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#021C57] tracking-tight">
                ARCL INSTRUMENTS PVT. LTD.
              </h1>
              <p className="text-xs md:text-sm font-semibold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <Award size={14} /> An ISO 9001:2015 Certified Company
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Building Trust Through Precision Quality & Engineered Reliability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {product.qrCode && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-1.5 flex items-center gap-2">
                <img
                  src={product.qrCode}
                  alt="Product QR"
                  className="w-14 h-14 object-contain bg-white rounded-lg p-0.5 border border-blue-100"
                />
                <div className="text-[9px] font-bold text-[#021C57] leading-tight text-left">
                  <span>SCAN FOR LIVE</span><br />
                  <span className="text-gray-500 font-normal">SPECS & CERT</span>
                </div>
              </div>
            )}

            <div className="text-left md:text-right text-[11px] text-gray-500 space-y-1">
              <div className="font-mono bg-blue-50 text-[#021C57] px-2.5 py-1 rounded-md font-bold inline-block">
                CATALOG DOC #{product._id?.slice(-6).toUpperCase()}
              </div>
              <div className="flex items-center md:justify-end gap-1 text-gray-400">
                <Calendar size={12} /> Issued: {currentDate}
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCT BANNER & TITLE */}
        <div className="bg-gradient-to-r from-[#021C57] to-[#043399] rounded-2xl p-6 text-white space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {formatTitleCase(product.category?.equipmentType?.name || "Laboratory Equipment")}
            </span>

            {product.isFeatured && (
              <span className="bg-amber-400 text-gray-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                ★ Flagship Instrument
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {formatTitleCase(product.name)}
          </h2>
        </div>

        {/* PRODUCT OVERVIEW & IMAGE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* IMAGE */}
          <div className="md:col-span-5 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner flex items-center justify-center p-3">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-64 object-contain rounded-xl"
            />
          </div>

          {/* OVERVIEW */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-lg font-bold text-[#021C57] border-b border-gray-100 pb-2">
              Product Overview
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              {product.description ||
                "Engineered with high-grade components for demanding laboratory and industrial testing workflows. Fully calibrated to comply with relevant national and international testing standards."}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {product.productCode && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs">
                  <span className="text-gray-500 block font-medium uppercase tracking-wider text-[10px]">Product Code / SKU:</span>
                  <span className="font-mono font-black text-[#021C57] text-sm">
                    {product.productCode.toUpperCase()}
                  </span>
                </div>
              )}

              {product.hsnCode && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs">
                  <span className="text-gray-500 block font-medium uppercase tracking-wider text-[10px]">HSN Code:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {product.hsnCode.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <span className="text-gray-400 block font-medium">Reliability:</span>
                <span className="font-bold text-[#021C57]">
                  Tested & Trusted
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <span className="text-gray-400 block font-medium">Availability:</span>
                <span className="font-bold text-[#021C57]">
                  Ready to Dispatch
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TECHNICAL SPECIFICATIONS TABLE */}
        {product.specifications &&
          Object.keys(product.specifications).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Technical Specifications
              </h3>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#021C57] text-white">
                    <tr>
                      <th className="p-3.5 font-semibold w-1/2">Parameter / Specification</th>
                      <th className="p-3.5 font-semibold w-1/2">Standard Technical Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(product.specifications).map(
                      ([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                        >
                          <td className="p-3.5 font-semibold text-gray-700">
                            {formatTitleCase(key)}
                          </td>
                          <td className="p-3.5 text-gray-900 font-medium">
                            {String(val)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* WORKING PRINCIPLE & OPERATING MECHANISM (IF AVAILABLE FOR THIS CATEGORY) */}
        {hasHowItWorks && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-2">
              <Cog className="w-5 h-5 text-amber-600" /> Working Principle & Operating Mechanism
            </h3>

            {product.category.howItWorks && (
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium bg-amber-50/40 p-4 rounded-xl border border-amber-200/70">
                {product.category.howItWorks}
              </p>
            )}

            {product.category.howItWorksSteps &&
              product.category.howItWorksSteps.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {product.category.howItWorksSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-1"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FEATURES */}
          {product.features && product.features.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#021C57] uppercase tracking-wider">
                Key Features & Advantages
              </h3>
              <ul className="space-y-2 text-xs text-gray-700">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* APPLICATIONS */}
          {product.applications && product.applications.length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                Industrial & Lab Applications
              </h3>
              <ul className="space-y-2 text-xs text-gray-700">
                {product.applications.map((app, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{app}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT) */}
        {product.completeSetIncludes && product.completeSetIncludes.length > 0 && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                ✓
              </span>
              Complete Set Includes (Standard Supply Outfit)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-800">
              {product.completeSetIncludes.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2 shadow-2xs"
                >
                  <span className="font-bold text-emerald-700 shrink-0">{idx + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUALITY ASSURANCE & FOOTER */}
        <div className="border-t-2 border-gray-200 pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left text-xs text-gray-600 bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <Building size={16} className="text-[#021C57] shrink-0" />
              <span>Shop No. 6, Siddivinayak Park CHS, Sector 8A Airoli, Navi Mumbai - 400708</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone size={16} className="text-[#021C57] shrink-0" />
              <span>+91 8169695728 (Head) / +91 8369458583 (Sales) / +91 6205691085 (Calib)</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#021C57] shrink-0" />
              <span>
                <a href="mailto:arclinstruments@gmail.com" className="hover:underline">
                  arclinstruments@gmail.com
                </a>
                {" / "}
                <a href="mailto:info@arclinstruments.com" className="hover:underline">
                  info@arclinstruments.com
                </a>
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            © {new Date().getFullYear()} ARCL Instruments Pvt. Ltd. All rights reserved. Technical specifications are subject to continuous engineering enhancement without prior notification.
          </p>
        </div>

      </div>

      {/* 3. FLOATING PRINT BUTTON (Bottom Mobile Friendly) */}
      <div className="max-w-4xl mx-auto mt-6 text-center print:hidden">
        <button
          onClick={handlePrintDownload}
          className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#043399] text-white px-8 py-3 rounded-2xl font-bold shadow-lg transition duration-200 cursor-pointer text-sm"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>
    </div>
  );
};

export default ProductCatalogPdfPage;
