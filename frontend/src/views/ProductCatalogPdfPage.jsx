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
  Globe,
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

  const specsObj = product.specifications || {};
  const capacityVal = specsObj["Capacity"] || specsObj["capacity"] || "500 / 2000 / 3000 kN";
  const accuracyVal = specsObj["Accuracy"] || specsObj["accuracy"] || "±1% (Class 1)";
  const displayVal = specsObj["Display Unit"] || specsObj["Display"] || specsObj["display"] || "10-INCH Touch / Digital";
  const operationVal = specsObj["Control System"] || specsObj["Operation"] || specsObj["operation"] || "SERVO CONTROLLED";

  // Fallback Steps
  const howItWorksSteps =
    product.category?.howItWorksSteps && product.category.howItWorksSteps.length > 0
      ? product.category.howItWorksSteps
      : [
          {
            title: "Sample Preparation & Centering",
            description: "Place the prepared concrete cube, cylinder, or specimen symmetrically on the hardened lower platen using centering guides.",
          },
          {
            title: "Pace Rate & Parameter Setting",
            description: "Configure testing parameters, specimen dimensions, and required pace rate (e.g. 5.2 kN/s) via digital touchscreen HMI.",
          },
          {
            title: "Automatic Servo Loading Execution",
            description: "Initiate test with one-touch start; electro-hydraulic servo controls deliver smooth, uniform, shock-free compression.",
          },
          {
            title: "Peak Failure Detection & Logging",
            description: "Automatic specimen break detection stops loading upon failure, calculates compressive strength (N/mm²), and logs data to memory.",
          },
        ];

  // Fallback Applications
  const applicationsList =
    product.applications && product.applications.length > 0
      ? product.applications
      : [
          "Ready-Mix Concrete (RMC) & Commercial Batching Plants",
          "Civil Engineering, Material Testing & Calibration Laboratories",
          "Highway, Expressway, Bridge & Metro Infrastructure Projects",
          "NABL / Quality Assurance & Government Research Institutions",
          "Precast Concrete, Block & Construction Materials Manufacturing",
        ];

  // Fallback Supply Outfit
  const supplyOutfitList =
    product.completeSetIncludes && product.completeSetIncludes.length > 0
      ? product.completeSetIncludes
      : [
          "Main Heavy-Duty Loading Frame with High-Rigidity 4-Column Construction",
          "Hydraulic Power Pack with High-Precision Servo Proportional Valve",
          "Advanced Digital Microprocessor / Touchscreen Controller Unit",
          "Hardened & Ground Upper & Lower Compression Platens",
          "Distance Pieces / Spacers Set for Multiple Specimen Sizes",
          "Traceable National Calibration Certificate & Comprehensive Operating Manual",
        ];

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
          .catalog-page-1,
          .catalog-page-2,
          .catalog-page-3 {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 275mm;
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
          <span className="font-bold text-[#021C57]">3-Page Technical Brochure</span>
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
            <span>DOWNLOAD 3-PAGE PDF</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL CATALOG PRINTABLE BROCHURE SHEET */}
      <div
        id="catalog-document"
        className="max-w-4xl mx-auto space-y-8 print:space-y-0"
      >
        {/* =========================================================================
            PAGE 1 — PRODUCT COVER + OVERVIEW + HIGHLIGHT CARDS
        ========================================================================= */}
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
                    Manufacturer of Civil, Material & Laboratory Testing Instruments
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
                      <span>VERIFIED QR</span><br />
                      <span className="text-gray-500 font-normal">SPEC PASS</span>
                    </div>
                  </div>
                )}

                <div className="text-left md:text-right text-[11px] text-gray-500 space-y-1">
                  <div className="font-mono bg-blue-50 text-[#021C57] px-2.5 py-1 rounded-md font-bold inline-block">
                    CATALOG SPEC: #{product._id?.slice(-6).toUpperCase() || "ARCL2026"}
                  </div>
                  <div className="flex items-center md:justify-end gap-1 text-gray-400">
                    <Calendar size={12} /> Issued: {currentDate}
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT BANNER & TITLE */}
            <div className="print-avoid-break bg-gradient-to-r from-[#021C57] via-[#032b82] to-[#043399] rounded-2xl p-5 text-white space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider">
                  {formatTitleCase(product.category?.equipmentType?.name || product.category?.name || "Concrete Testing Equipments")}
                </span>

                {product.isFeatured ? (
                  <span className="bg-amber-400 text-gray-900 text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                    ★ FLAGSHIP INSTRUMENT
                  </span>
                ) : (
                  <span className="bg-emerald-400 text-gray-900 text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
                    ● PRECISION CERTIFIED
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                {formatTitleCase(product.name)}
              </h2>

              <div className="flex items-center gap-4 text-xs text-blue-100 font-medium pt-1">
                <span>Product Code: <strong>{product.productCode ? product.productCode.toUpperCase() : "ARCL-STD"}</strong></span>
                <span>•</span>
                <span>HSN Code: <strong>{product.hsnCode || "9024"}</strong></span>
                <span>•</span>
                <span className="text-amber-300 font-bold">Standard: IS / ASTM / BS / EN Compliant</span>
              </div>
            </div>

            {/* PRODUCT HERO AREA: IMAGE + OVERVIEW */}
            <div className="print-avoid-break grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* IMAGE BOX (PRESERVES ASPECT RATIO WITH CLEAN WHITE PADDING) */}
              <div className="md:col-span-5 bg-slate-50 rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center shadow-inner">
                <div className="w-full h-48 sm:h-52 flex items-center justify-center overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full object-contain drop-shadow-md"
                  />
                </div>
                <div className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase mt-2 text-center">
                  ARCL Precision Testing Apparatus
                </div>
              </div>

              {/* OVERVIEW & TAGLINE */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Precision • Automation • Safety • Reliability
                  </div>
                  <h3 className="text-base font-bold text-[#021C57] border-b border-gray-100 pb-1">
                    Product Overview
                  </h3>
                  <p className="text-gray-700 text-xs sm:text-[13px] leading-relaxed text-justify">
                    {product.description ||
                      "The ARCL Compression Testing Machine is a heavy-duty, precision-engineered testing solution designed for determining the compressive strength of concrete cubes, cylinders, blocks, and construction materials with highest repeatability and automated compliance."}
                  </p>
                </div>

                {/* 4 HIGHLIGHT CARDS */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5">
                    <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">CAPACITY:</span>
                    <span className="font-extrabold text-[#021C57] text-xs sm:text-sm">
                      {String(capacityVal).split("/")[0].trim() || "2000 kN"}
                    </span>
                  </div>

                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5">
                    <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">LOADING ACCURACY:</span>
                    <span className="font-extrabold text-emerald-800 text-xs sm:text-sm">
                      {String(accuracyVal).split("(")[0].trim() || "±1% (Class 1)"}
                    </span>
                  </div>

                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5">
                    <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">DISPLAY / HMI:</span>
                    <span className="font-extrabold text-amber-900 text-xs sm:text-sm">
                      {String(displayVal).split("/")[0].trim() || "10-INCH Touch"}
                    </span>
                  </div>

                  <div className="bg-slate-100 border border-slate-300 rounded-xl p-2.5">
                    <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">CONTROL SYSTEM:</span>
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {String(operationVal).split("/")[0].trim() || "SERVO CONTROLLED"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KEY FEATURES SUMMARY (PAGE 1 BOTTOM) */}
            <div className="print-avoid-break bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-[#021C57] uppercase tracking-wider">
                Key Features & Engineering Highlights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>High-Rigidity 4-Column Solid Loading Frame</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Closed-Loop Digital Servo Pace Rate Regulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Automatic Specimen Failure Peak Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Direct USB & LAN Test Data Storage / Export</span>
                </div>
              </div>
            </div>

          </div>

          {/* PAGE 1 FOOTER */}
          <div className="hidden print:flex items-center justify-between text-[9px] text-gray-400 pt-3 border-t border-gray-200">
            <span>ARCL Instruments Pvt. Ltd. | {formatTitleCase(product.name)}</span>
            <span>Page 1 of 3</span>
          </div>
        </div>

        {/* =========================================================================
            PAGE 2 — TECHNICAL SPECIFICATIONS + HOW IT WORKS
        ========================================================================= */}
        <div className="catalog-page-2 bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-10 text-gray-800 space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
          <div className="space-y-5">
            
            {/* MINI HEADER FOR PAGE 2 */}
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="ARCL Logo"
                  crossOrigin="anonymous"
                  className="w-12 h-6 object-contain"
                />
                <div>
                  <span className="text-xs font-bold text-[#021C57] tracking-tight block">
                    ARCL INSTRUMENTS PVT. LTD. &mdash; TECHNICAL SPECIFICATIONS & WORKFLOW
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Model: {product.productCode ? product.productCode.toUpperCase() : "ARCL-STD"} | {formatTitleCase(product.name)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                DOC #{product._id?.slice(-6).toUpperCase() || "ARCL2026"}
              </div>
            </div>

            {/* TECHNICAL SPECIFICATIONS TABLE */}
            <div className="print-avoid-break space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <h3 className="text-sm font-bold text-[#021C57] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> TECHNICAL SPECIFICATIONS
                </h3>
                <span className="text-[10px] text-gray-500 font-semibold">
                  Standard compliance & technical ratings
                </span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#021C57] text-white">
                    <tr>
                      <th className="p-2.5 sm:p-3 font-semibold w-1/2">Parameter / Specification</th>
                      <th className="p-2.5 sm:p-3 font-semibold w-1/2">Standard Technical Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      Object.entries(product.specifications).map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/80"}
                        >
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">
                            {formatTitleCase(key)}
                          </td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">
                            {String(val)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="bg-white">
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">Frame Capacity</td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">500 kN / 2000 kN / 3000 kN</td>
                        </tr>
                        <tr className="bg-slate-50/80">
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">Loading Accuracy</td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">±1% of indicated load (Class 1)</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">Platen Hardness & Surface</td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">55 HRC Hardened & Fine Ground</td>
                        </tr>
                        <tr className="bg-slate-50/80">
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">Piston Travel / Stroke</td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">50 mm with Over-Travel Limit Switch</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="p-2.5 sm:p-3 font-semibold text-gray-700">Power Supply</td>
                          <td className="p-2.5 sm:p-3 text-gray-900 font-medium">415V AC, 3 Phase, 50 Hz</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HOW IT WORKS / WORKING PRINCIPLE */}
            <div className="print-avoid-break space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                <h3 className="text-sm font-bold text-[#021C57] flex items-center gap-2">
                  <Cog className="w-4 h-4 text-amber-600" /> HOW IT WORKS / WORKING PRINCIPLE
                </h3>
                <span className="text-[10px] text-gray-500 font-semibold">
                  Step-by-step standardized testing procedure
                </span>
              </div>

              {product.category?.howItWorks && (
                <p className="text-xs text-gray-700 leading-relaxed font-medium bg-blue-50/40 p-3 rounded-xl border border-blue-200/70">
                  {product.category.howItWorks}
                </p>
              )}

              {/* 4 NUMBERED WORKFLOW CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {howItWorksSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#021C57] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-[#021C57] leading-snug">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed pl-8">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PAGE 2 FOOTER */}
          <div className="hidden print:flex items-center justify-between text-[9px] text-gray-400 pt-3 border-t border-gray-200">
            <span>ARCL Instruments Pvt. Ltd. | {formatTitleCase(product.name)}</span>
            <span>Page 2 of 3</span>
          </div>
        </div>

        {/* =========================================================================
            PAGE 3 — APPLICATIONS + STANDARD SUPPLY + CONTACT / FOOTER
        ========================================================================= */}
        <div className="catalog-page-3 bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-10 text-gray-800 space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
          <div className="space-y-5">
            
            {/* MINI HEADER FOR PAGE 3 */}
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="ARCL Logo"
                  crossOrigin="anonymous"
                  className="w-12 h-6 object-contain"
                />
                <div>
                  <span className="text-xs font-bold text-[#021C57] tracking-tight block">
                    ARCL INSTRUMENTS PVT. LTD. &mdash; APPLICATIONS & SUPPLY OUTFIT
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    National & International Laboratory Standard Equipment
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                DOC #{product._id?.slice(-6).toUpperCase() || "ARCL2026"}
              </div>
            </div>

            {/* 2-COLUMN SECTION: APPLICATIONS & FEATURES */}
            <div className="print-avoid-break grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* KEY APPLICATIONS */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-200 pb-1.5 flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-700" /> KEY INDUSTRIAL & LAB APPLICATIONS
                </h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  {applicationsList.map((app, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ADVANCED PRODUCT CAPABILITIES */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider border-b border-blue-200 pb-1.5 flex items-center gap-1.5">
                  <Zap size={14} className="text-blue-700" /> SYSTEM ADVANTAGES & SAFETY
                </h3>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Precision load cell / pressure transducer for high linearity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Emergency stop button & transparent fragment safety door</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Over-load & over-travel hydraulic safety cut-off protection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Real-time load vs time graphical display on touchscreen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Optional RS232 / USB interface for automated PC logging</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* COMPLETE SET INCLUDES / STANDARD SUPPLY OUTFIT */}
            <div className="print-avoid-break bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider border-b border-slate-200 pb-1">
                COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-gray-800">
                {supplyOutfitList.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QUALITY CERTIFICATION & BADGES */}
            <div className="print-avoid-break grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center shadow-2xs">
                <div className="text-xs font-bold text-[#021C57]">ISO 9001:2015</div>
                <div className="text-[10px] text-gray-400">Quality Certified</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center shadow-2xs">
                <div className="text-xs font-bold text-emerald-800">100% Quality Tested</div>
                <div className="text-[10px] text-gray-400">Pre-Dispatch Inspection</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center shadow-2xs">
                <div className="text-xs font-bold text-blue-800">Pan-India Support</div>
                <div className="text-[10px] text-gray-400">On-Site Calibration</div>
              </div>
            </div>

            {/* COMPANY CONTACT & CERTIFICATION FOOTER BOX */}
            <div className="print-avoid-break bg-[#021C57] text-white rounded-2xl p-5 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/20 pb-3">
                <div className="text-center sm:text-left">
                  <h4 className="text-base font-extrabold tracking-tight">ARCL INSTRUMENTS PVT. LTD.</h4>
                  <p className="text-[11px] text-blue-200 font-medium">
                    Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                    ISO 9001:2015
                  </span>
                  <span className="bg-amber-400 text-gray-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                    MADE IN INDIA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-100">
                <div className="flex items-start gap-2">
                  <Building size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">
                    Shop No. 6, Siddivinayak Park CHS, Sector 8A Airoli, Navi Mumbai - 400708
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Phone size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">
                    +91 8169695728 (Head)<br />
                    +91 8369458583 (Sales)<br />
                    +91 6205691085 (Calibration)
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <Mail size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug">
                    arclinstruments@gmail.com<br />
                    info@arclinstruments.com<br />
                    www.arclinstruments.com
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-gray-400 text-center leading-relaxed">
              © 2026 ARCL Instruments Pvt. Ltd. All rights reserved. Technical specifications and designs are subject to continuous engineering enhancement without prior notification.
            </p>

          </div>

          {/* PAGE 3 FOOTER */}
          <div className="hidden print:flex items-center justify-between text-[9px] text-gray-400 pt-3 border-t border-gray-200">
            <span>ARCL Instruments Pvt. Ltd. | {formatTitleCase(product.name)}</span>
            <span>Page 3 of 3</span>
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
          <span>Print / Save as 3-Page PDF</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCatalogPdfPage;
