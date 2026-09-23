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
  Sparkles,
  Zap,
  Layers,
  PackageCheck,
  QrCode,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatTitleCase } from "../utils/stringUtils.js";
import { downloadProductCatalogPdf } from "../utils/productCatalogPdfGenerator.js";
import { encodeCode128B } from "../utils/barcodeGenerator.js";

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
      const toastId = toast.loading("Generating High-Resolution Technical Brochure with Barcode & Watermark...");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#021C57] to-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
          {/* Logo with spinning indicator */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-400 animate-spin"></div>
            <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-lg flex items-center justify-center">
              <img src="/assets/LOGO.png" alt="ARCL" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              ARCL Technical Brochure
            </h2>
            <p className="text-xs text-blue-200 font-medium">
              Generating High-Resolution Technical Brochure & Security Watermark...
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-amber-400 rounded-full animate-pulse w-3/4 mx-auto"></div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300 font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Formatting Single-Page Vector Layout & Barcode...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md">
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">
            Catalog Not Available
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {error || "Could not locate the requested product catalog."}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#043399] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition"
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
    : "";

  const imageUrl =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string" && product.images
      ? product.images
      : null;

  // Real backend specifications
  const specsEntries =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications).filter(([k, v]) => Boolean(k && String(v).trim()))
      : [];

  const highlightSpecs = specsEntries.slice(0, 4);

  // Real backend features
  const featuresList = Array.isArray(product.features)
    ? product.features.filter((f) => Boolean(f && String(f).trim()))
    : [];

  // Real backend applications
  const applicationsList = Array.isArray(product.applications)
    ? product.applications.filter((a) => Boolean(a && String(a).trim()))
    : [];

  // Real backend how it works
  const howItWorksText = product.category?.howItWorks || product.howItWorks || "";
  const howItWorksSteps = Array.isArray(product.category?.howItWorksSteps)
    ? product.category.howItWorksSteps.filter((s) => Boolean(s && (s.title || s.description)))
    : Array.isArray(product.howItWorksSteps)
    ? product.howItWorksSteps.filter((s) => Boolean(s && (s.title || s.description)))
    : [];

  // Real backend complete set includes
  const supplyOutfitList = Array.isArray(product.completeSetIncludes)
    ? product.completeSetIncludes.filter((item) => Boolean(item && String(item).trim()))
    : [];

  const categoryTitle =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    product.equipmentTypeName ||
    "";

  const qrImageUrl =
    product.qrCode ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&data=${encodeURIComponent(
      `https://arclinstruments.com/products/${product.slug || product._id || "catalog"}`
    )}`;

  const skuCode = (product.productCode || product.slug || "ARCL-SPEC").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100/90 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* NATIVE PRINT STYLES - ZERO HORIZONTAL SPLITTING */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
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
            padding: 20px 24px !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
          .print-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 10px !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* 1. TOP ACTION TOOLBAR (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
          <Link href="/" className="hover:text-[#021C57] font-semibold transition">
            Home
          </Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link href="/products" className="hover:text-[#021C57] font-semibold transition">
            Laboratory Equipments
          </Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link
            href={`/products/${product.slug}`}
            className="hover:text-[#021C57] max-w-[180px] sm:max-w-[240px] truncate font-semibold transition"
          >
            {formatTitleCase(product.name)}
          </Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <span className="font-extrabold text-[#021C57]">Technical Brochure</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`https://wa.me/918169695728?text=Hello%2C%20I%20have%20reviewed%20the%20catalog%20for%20${encodeURIComponent(
              formatTitleCase(product.name)
            )}%20and%20would%20like%20a%20quote.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm hover:shadow active:scale-95"
          >
            <MessageCircle size={15} /> WhatsApp Quote
          </a>

          <button
            onClick={handleDirectDownload}
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#043399] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md hover:shadow-lg cursor-pointer uppercase tracking-wider active:scale-95"
          >
            <Download size={15} />
            <span>DOWNLOAD BROCHURE (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL CATALOG PRINTABLE BROCHURE SHEET */}
      <div
        id="catalog-document"
        className="relative overflow-hidden max-w-4xl mx-auto bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 text-slate-800 space-y-6"
      >
        {/* Repeating Watermark Overlay (Tiles 100% Seamlessly from Top to Bottom Across the ENTIRE Sheet) */}
        <div
          id="catalog-watermark-overlay"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-30 opacity-[0.09]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='140' viewBox='0 0 280 140'%3E%3Cg transform='rotate(-30 140 70)'%3E%3Ctext x='140' y='45' fill='%23021C57' font-size='11.5' font-weight='900' font-family='sans-serif' text-anchor='middle' letter-spacing='1.5'%3EARCL INSTRUMENTS PVT. LTD.%3C/text%3E%3Ctext x='280' y='115' fill='%23021C57' font-size='11.5' font-weight='900' font-family='sans-serif' text-anchor='middle' letter-spacing='1.5'%3EARCL INSTRUMENTS PVT. LTD.%3C/text%3E%3Ctext x='0' y='115' fill='%23021C57' font-size='11.5' font-weight='900' font-family='sans-serif' text-anchor='middle' letter-spacing='1.5'%3EARCL INSTRUMENTS PVT. LTD.%3C/text%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "280px 140px",
            minHeight: "100%",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* TOP MOTTO LINE & HEADER LETTERHEAD */}
        <div className="relative z-10 print-section space-y-2.5 border-b-2 border-[#021C57] pb-4">
          <div className="flex items-center justify-between text-[11px] font-black text-[#021C57] tracking-wider border-b border-red-600/30 pb-1">
            <span>PRECISION • PERFORMANCE • RELIABILITY</span>
            <span className="text-slate-400 font-semibold text-[10px] hidden sm:inline">OFFICIAL TECHNICAL PRODUCT CATALOG</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="bg-white p-1.5 rounded-xl border border-slate-100 shadow-xs shrink-0">
                <img
                  src={logo}
                  alt="ARCL Logo"
                  crossOrigin="anonymous"
                  className="w-18 md:w-22 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-[#021C57] tracking-tight">
                  ARCL INSTRUMENTS PVT. LTD.
                </h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Award size={12} className="text-emerald-600" /> ISO 9001:2015 Certified
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Precision Laboratory & Civil Testing Equipment
                  </span>
                </div>
              </div>
            </div>

            {/* VERIFIED QR CODE IN HEADER */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 shadow-xs">
                <img
                  src={qrImageUrl}
                  alt="Product Verification QR"
                  crossOrigin="anonymous"
                  className="w-11 h-11 object-contain bg-white rounded-lg p-0.5 border border-slate-100"
                />
                <div className="text-[9px] font-extrabold text-[#021C57] leading-tight text-left pr-1">
                  <span>VERIFIED QR</span><br />
                  <span className="text-emerald-600 font-bold">SCAN LINK</span><br />
                  <span className="text-slate-400 font-mono text-[8px]">{product._id ? `DOC #${product._id.slice(-6).toUpperCase()}` : "ARCL-SPEC"}</span>
                </div>
              </div>

              {currentDate && (
                <div className="hidden sm:flex flex-col text-right text-[10px] text-slate-400 font-medium space-y-0.5">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar size={11} /> Issued: {currentDate}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HERO PRODUCT BANNER (WITH BARCODE) */}
        <div className="print-section bg-gradient-to-r from-[#021C57] via-[#052d87] to-[#0A47B8] rounded-2xl p-4 sm:p-5 text-white space-y-2.5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 flex-wrap relative z-10">
            {categoryTitle && (
              <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                {formatTitleCase(categoryTitle)}
              </span>
            )}

            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1 border border-amber-300">
              ★ FLAGSHIP INSTRUMENT
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight relative z-10">
            {formatTitleCase(product.name)}
          </h2>

          <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap relative z-10">
            <div className="flex items-center gap-2 text-[11px] text-blue-100 font-semibold flex-wrap">
              {product.productCode && (
                <span className="bg-black/25 px-2.5 py-0.5 rounded-lg border border-white/10">
                  Product Code: <strong className="text-white font-mono">{product.productCode.toUpperCase()}</strong>
                </span>
              )}
              {product.hsnCode && (
                <span className="bg-black/25 px-2.5 py-0.5 rounded-lg border border-white/10">
                  HSN Code: <strong className="text-white font-mono">{product.hsnCode.toUpperCase()}</strong>
                </span>
              )}
            </div>

            {/* SCANNABLE SMART PRODUCT BARCODE & QR BADGE */}
            <div className="bg-white text-slate-900 p-1.5 px-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 shrink-0">
              {/* Scannable High-Density QR Code for Mobile Link */}
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
                <img
                  src={qrImageUrl}
                  alt="Scan for Product Link"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Mathematically Scannable Code-128 Barcode & SKU */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center h-4 max-w-[125px] overflow-hidden">
                  {encodeCode128B(skuCode).map((m, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${m.width * 0.95}px` }}
                      className={`h-full ${m.isBar ? "bg-slate-900" : "bg-transparent"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-mono font-black text-slate-800 tracking-wider">
                    {skuCode}
                  </span>
                  <span className="text-[6.5px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded uppercase tracking-tight">
                    SCAN LINK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO AREA: PRODUCT OVERVIEW & KEY FEATURES (MATCHING REFERENCE SHEET CAPSULES) */}
        <div className="print-section grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PRODUCT OVERVIEW CARD */}
          {product.description && (
            <div className="bg-white/95 rounded-2xl border border-slate-300 p-4 space-y-2 shadow-xs relative">
              <div className="inline-block bg-[#021C57] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                PRODUCT OVERVIEW
              </div>
              <p className="text-slate-700 text-xs leading-relaxed text-justify font-normal pt-1">
                {product.description}
              </p>
            </div>
          )}

          {/* FEATURES CARD WITH NAVY/EMERALD CHECKMARKS */}
          {featuresList.length > 0 && (
            <div className="bg-white/95 rounded-2xl border border-slate-300 p-4 space-y-2 shadow-xs relative">
              <div className="inline-block bg-[#021C57] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                FEATURES
              </div>
              <div className="space-y-1.5 pt-1 text-xs text-slate-800">
                {featuresList.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[#021C57] shrink-0 mt-0.5" />
                    <span className="leading-tight font-medium text-slate-800">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* IMAGE & SPECIFICATION CARDS (CAPACITY / MODEL SPECIFICATION CARDS) */}
        <div className="print-section grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {imageUrl && (
            <div className="md:col-span-4 bg-white/95 rounded-2xl border border-slate-300 p-3 flex flex-col items-center justify-center shadow-xs">
              <div className="w-full h-44 sm:h-48 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt={product.name}
                  crossOrigin="anonymous"
                  className="max-w-full max-h-full object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
                />
              </div>
            </div>
          )}

          <div className={`${imageUrl ? "md:col-span-8" : "md:col-span-12"} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            {highlightSpecs.slice(0, 4).map(([k, v], idx) => (
              <div
                key={k}
                className="bg-white/95 rounded-2xl border border-slate-300 p-3.5 space-y-2 shadow-xs"
              >
                <div className="inline-block bg-[#021C57] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  {formatTitleCase(k)}
                </div>

                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-[#021C57]">Rating / Value</span>
                    <span className="font-bold text-slate-900">{String(v)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-medium text-slate-500">Standard</span>
                    <span className="font-semibold text-slate-800">IS / ASTM / BS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-500">Calibration</span>
                    <span className="font-semibold text-emerald-700">NABL Traceable</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TECHNICAL SPECIFICATIONS TABLE */}
        {specsEntries.length > 0 && (
          <div className="print-section space-y-2.5 pt-1">
            <div className="inline-block bg-[#021C57] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
              TECHNICAL SPECIFICATIONS
            </div>

            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs bg-white/95">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#021C57] text-white">
                  <tr>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[10px] w-1/2">Parameter / Specification</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-[10px] w-1/2">Technical Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {specsEntries.map(([key, val], idx) => (
                    <tr
                      key={key}
                      className={idx % 2 === 0 ? "bg-white/80" : "bg-slate-50/70"}
                    >
                      <td className="p-2.5 font-bold text-[#021C57]">
                        {formatTitleCase(key)}
                      </td>
                      <td className="p-2.5 text-slate-900 font-medium">
                        {String(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* APPLICATIONS & COMPLETE SUPPLY OUTFIT */}
        {(applicationsList.length > 0 || supplyOutfitList.length > 0) && (
          <div className="print-section grid grid-cols-1 sm:grid-cols-2 gap-4">
            {applicationsList.length > 0 && (
              <div className="bg-white/95 rounded-2xl border border-slate-300 p-4 space-y-2 shadow-xs">
                <div className="inline-block bg-[#021C57] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                  APPLICATIONS
                </div>
                <div className="space-y-1.5 text-xs text-slate-800 pt-1">
                  {applicationsList.map((app, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight font-medium text-slate-800">{app}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {supplyOutfitList.length > 0 && (
              <div className="bg-white/95 rounded-2xl border border-slate-300 p-4 space-y-2 shadow-xs">
                <div className="inline-block bg-[#021C57] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                  SUPPLY OUTFIT
                </div>
                <div className="space-y-1.5 text-xs text-slate-800 pt-1">
                  {supplyOutfitList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded bg-blue-100 text-blue-900 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700 leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HOW IT WORKS / WORKING PRINCIPLE */}
        {(howItWorksText || howItWorksSteps.length > 0) && (
          <div className="print-section space-y-2.5">
            <div className="inline-block bg-[#021C57] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
              WORKING PRINCIPLE & PROCEDURE
            </div>

            {howItWorksText && (
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-blue-50/50 p-3 rounded-xl border border-blue-200">
                {howItWorksText}
              </p>
            )}

            {howItWorksSteps.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {howItWorksSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-white/95 border border-slate-200 rounded-xl p-2.5 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-[#021C57] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                        {step.stepNumber || idx + 1}
                      </span>
                      <h4 className="text-[11px] font-bold text-[#021C57] leading-tight">
                        {step.title}
                      </h4>
                    </div>
                    {step.description && (
                      <p className="text-[10px] text-slate-600 leading-tight pl-7">
                        {step.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QUALITY TRUST BADGES & COMPANY FOOTER */}
        <div className="print-section space-y-3 pt-2">
          {/* Quality Trust Badges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-1.5 border border-amber-200">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-[#021C57]">ISO 9001:2015</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Quality Certified</div>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1.5 border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-emerald-800">100% Quality Tested</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">Pre-Dispatch Inspection</div>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-1.5 border border-blue-200">
                <Building className="w-4 h-4" />
              </div>
              <div className="text-xs font-black text-blue-900">Pan-India Support</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">On-Site Calibration</div>
            </div>
          </div>

          <div className="bg-[#021C57] text-white rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2.5">
              <div>
                <h4 className="text-sm sm:text-base font-black tracking-tight">ARCL Instruments Private Limited</h4>
                <p className="text-[10px] text-blue-200 font-medium">
                  Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  ISO 9001:2015
                </span>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  MADE IN INDIA
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px] text-blue-100">
              <div className="flex items-start gap-2">
                <Building size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Phone size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  +91 83694 58583 (Sales)<br />
                  +91 62056 91085 (Calibration)<br />
                  +91 81696 95728 (Support)
                </span>
              </div>

              <div className="flex items-start gap-2">
                <Mail size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  arclinstruments@gmail.com<br />
                  info@arclinstruments.com<br />
                  www.arclinstruments.com
                </span>
              </div>
            </div>
          </div>

          <p className="text-[8px] text-slate-400 text-center leading-tight">
            © 2026 ARCL Instruments Pvt. Ltd. All rights reserved. Specifications are subject to continuous technical enhancement without prior notice.
          </p>
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
