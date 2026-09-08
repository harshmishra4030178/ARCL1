"use client";

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "../utils/navigation.jsx";
import { useProductStore } from "../store/useProductStore.js";
const logo = "/assets/LOGO.png";
import {
  Download,
  ArrowLeft,
  ChevronRight,
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
import { downloadProductCatalogPdf } from "../utils/productCatalogPdfGenerator.js";

const ProductCatalogPdfPage = ({ initialSlug, initialProduct = null }) => {
  const routeParams = useParams();
  const slug = initialSlug || routeParams?.slug;
  const navigate = useNavigate();
  const { product: storeProduct, loading: storeLoading, error, fetchSingleProduct } = useProductStore();
  const [product, setProduct] = useState(initialProduct || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
    } else if (slug) {
      fetchSingleProduct(slug)
        .then((data) => {
          if (data) setProduct(data);
        })
        .catch((err) => console.error("Catalog product fetch error:", err));
    }
  }, [slug, initialProduct]);

  useEffect(() => {
    if (storeProduct && !product) {
      setProduct(storeProduct);
    }
  }, [storeProduct]);

  const loading = !product && (storeLoading || !mounted);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownload = async () => {
    if (!product) return;
    try {
      const toastId = toast.loading("Generating Official 3-Page Technical Brochure PDF...");
      const filename = await downloadProductCatalogPdf(product);
      toast.update(toastId, {
        render: `Brochure (${filename}) downloaded successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 2500,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
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

  const currentDate = mounted
    ? new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "8 September 2026";

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
      {/* NATIVE PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #catalog-document {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            background: transparent !important;
          }
          .catalog-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 265mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .catalog-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            min-height: 265mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* 1. TOP ACTION TOOLBAR (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-[#021C57] transition">
            Home
          </Link>
          <ChevronRight size={12} className="text-gray-400 shrink-0" />
          <Link href="/products" className="hover:text-[#021C57] transition">
            Laboratory Equipments
          </Link>
          <ChevronRight size={12} className="text-gray-400 shrink-0" />
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[#021C57] max-w-[180px] sm:max-w-[240px] truncate transition"
          >
            {formatTitleCase(product.name)}
          </Link>
          <ChevronRight size={12} className="text-gray-400 shrink-0" />
          <span className="font-bold text-[#021C57]">PDF Technical Brochure</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`https://wa.me/918169695728?text=Hello%2C%20I%20have%20reviewed%20the%20catalog%20for%20${encodeURIComponent(
              formatTitleCase(product.name)
            )}%20and%20would%20like%20a%20quote.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <MessageCircle size={15} /> WhatsApp Quote
          </a>

          <button
            onClick={handleDirectDownload}
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#043399] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer uppercase tracking-wider"
          >
            <Download size={15} />
            <span>DOWNLOAD PRODUCT PDF</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL CATALOG PRINTABLE BROCHURE SHEET */}
      <div
        id="catalog-document"
        className="max-w-4xl mx-auto space-y-8 print:space-y-0"
      >
        {/* ================= PAGE 1 ================= */}
        <div className="catalog-page-1 bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-10 text-gray-800 space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
          <div className="space-y-5">
            {/* HEADER LETTERHEAD */}
            <div className="print-avoid-break border-b-2 border-[#021C57] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={logo}
                  alt="ARCL Logo"
                  crossOrigin="anonymous"
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
                      crossOrigin="anonymous"
                      className="w-12 h-12 object-contain bg-white rounded-lg p-0.5 border border-blue-100"
                    />
                    <div className="text-[9px] font-bold text-[#021C57] leading-tight text-left">
                      <span>SCAN FOR LIVE</span><br />
                      <span className="text-gray-500 font-normal">SPECS & CERT</span>
                    </div>
                  </div>
                )}

                <div className="text-left md:text-right text-[11px] text-gray-500 space-y-1">
                  <div className="font-mono bg-blue-50 text-[#021C57] px-2.5 py-1 rounded-md font-bold inline-block">
                    CATALOG DOC #{product._id?.slice(-6).toUpperCase() || "CE215A"}
                  </div>
                  <div className="flex items-center md:justify-end gap-1 text-gray-400">
                    <Calendar size={12} /> Issued: {currentDate}
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT BANNER & TITLE */}
            <div className="print-avoid-break bg-gradient-to-r from-[#021C57] to-[#043399] rounded-2xl p-5 text-white space-y-1.5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  {formatTitleCase(product.category?.equipmentType?.name || "Concrete Testing Equipments")}
                </span>

                {product.isFeatured && (
                  <span className="bg-amber-400 text-gray-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    ★ FLAGSHIP INSTRUMENT
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                {formatTitleCase(product.name)}
              </h2>
            </div>

            {/* PRODUCT OVERVIEW & IMAGE */}
            <div className="print-avoid-break grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* IMAGE */}
              <div className="md:col-span-5 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner flex items-center justify-center p-3">
                <img
                  src={imageUrl}
                  alt={product.name}
                  crossOrigin="anonymous"
                  className="w-full h-44 sm:h-48 object-contain rounded-xl"
                />
              </div>

              {/* OVERVIEW */}
              <div className="md:col-span-7 space-y-2.5">
                <h3 className="text-base font-bold text-[#021C57] border-b border-gray-100 pb-1">
                  Product Overview
                </h3>
                <p className="text-gray-700 text-xs sm:text-[13px] leading-relaxed text-justify line-clamp-5">
                  {product.description ||
                    "ARCL Servo Controlled Digital Compression Testing Machine is a high-performance, precision-engineered testing system designed for accurate and reliable compression strength testing of concrete cubes, cylinders and other construction materials."}
                </p>

                {/* 4 STATUS BADGES */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {product.productCode && (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 text-xs">
                      <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">PRODUCT CODE / SKU:</span>
                      <span className="font-mono font-black text-[#021C57] text-xs">
                        {product.productCode.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {product.hsnCode && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs">
                      <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">HSN CODE:</span>
                      <span className="font-mono font-black text-emerald-800 text-xs">
                        {product.hsnCode.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                    <span className="text-gray-400 block font-medium text-[9px]">Reliability:</span>
                    <span className="font-bold text-[#021C57]">
                      Tested & Trusted
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                    <span className="text-gray-400 block font-medium text-[9px]">Availability:</span>
                    <span className="font-bold text-[#021C57]">
                      Ready to Dispatch
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TECHNICAL SPECIFICATIONS TABLE */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="print-avoid-break space-y-2.5 pt-1">
                <h3 className="text-base font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Technical Specifications
                </h3>

                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#021C57] text-white">
                      <tr>
                        <th className="p-2.5 sm:p-3 font-semibold w-1/2">Parameter / Specification</th>
                        <th className="p-2.5 sm:p-3 font-semibold w-1/2">Standard Technical Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(product.specifications).map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                        >
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">
                            {formatTitleCase(key)}
                          </td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="hidden print:flex items-center justify-between text-[9px] text-gray-400 pt-3 border-t border-gray-200">
            <span>ARCL Instruments Pvt. Ltd. | {formatTitleCase(product.name)}</span>
            <span>Page 1 of 2</span>
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
        <div className="catalog-page-2 bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-10 text-gray-800 space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
          <div className="space-y-5">
            {/* MINI HEADER FOR PAGE 2 */}
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={logo}
                  alt="ARCL Logo"
                  crossOrigin="anonymous"
                  className="w-12 h-6 object-contain"
                />
                <span className="text-xs font-bold text-[#021C57] tracking-tight">
                  ARCL INSTRUMENTS PVT. LTD. &mdash; TECHNICAL SPECIFICATIONS & APPLICATIONS
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                DOC #{product._id?.slice(-6).toUpperCase() || "CE215A"}
              </div>
            </div>

            {/* WORKING PRINCIPLE (IF PRESENT) */}
            {hasHowItWorks && (
              <div className="print-avoid-break space-y-2">
                <h3 className="text-sm font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-1">
                  <Cog className="w-4 h-4 text-amber-600" /> Working Principle & Operating Mechanism
                </h3>

                {product.category.howItWorks && (
                  <p className="text-xs text-gray-700 leading-relaxed font-medium bg-amber-50/40 p-3 rounded-xl border border-amber-200/70">
                    {product.category.howItWorks}
                  </p>
                )}
              </div>
            )}

            {/* 2-COLUMN FEATURES & APPLICATIONS */}
            <div className="print-avoid-break grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* KEY FEATURES & ADVANTAGES */}
              {product.features && product.features.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider border-b border-blue-100 pb-1.5">
                    KEY FEATURES & ADVANTAGES
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* INDUSTRIAL & LAB APPLICATIONS */}
              {product.applications && product.applications.length > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-100 pb-1.5">
                    INDUSTRIAL & LAB APPLICATIONS
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {product.applications.map((app, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* COMPLETE SET INCLUDES (IF PRESENT) */}
            {product.completeSetIncludes && product.completeSetIncludes.length > 0 && (
              <div className="print-avoid-break bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider">
                  Complete Set Includes (Standard Supply Outfit)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-800">
                  {product.completeSetIncludes.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2 rounded-xl border border-gray-200 flex items-start gap-2"
                    >
                      <span className="font-bold text-emerald-700 shrink-0">{idx + 1}.</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* EXACT ORIGINAL FOOTER FROM SCREENSHOT */}
          <div className="print-avoid-break pt-3 space-y-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-700">
              {/* Address */}
              <div className="flex items-center gap-2.5 text-left">
                <Building className="w-4 h-4 text-[#021C57] shrink-0" />
                <span className="font-medium text-[11px]">
                  Shop No. 6, Siddivinayak Park CHS, Sector 8A Airoli, Navi Mumbai - 400708
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2.5 text-left">
                <Phone className="w-4 h-4 text-[#021C57] shrink-0" />
                <span className="font-medium text-[11px]">
                  +91 8169695728 (Head) / +91 8369458583 (Sales) / +91 6205691085 (Calib)
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5 text-left">
                <Mail className="w-4 h-4 text-[#021C57] shrink-0" />
                <span className="font-medium text-[11px]">
                  arclinstruments@gmail.com / info@arclinstruments.com
                </span>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              © 2026 ARCL Instruments Pvt. Ltd. All rights reserved. Technical specifications are subject to continuous engineering enhancement without prior notification.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FLOATING PRINT / DOWNLOAD BUTTON (Bottom Mobile Friendly) */}
      <div className="max-w-4xl mx-auto mt-6 text-center print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2.5 bg-[#021C57] hover:bg-[#043399] text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl transition duration-200 cursor-pointer text-sm active:scale-95"
        >
          <Printer size={18} />
          <span>Print / Save as PDF</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCatalogPdfPage;
