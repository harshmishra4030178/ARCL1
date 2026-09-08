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
      const toastId = toast.loading("Generating Technical Brochure PDF...");
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
          Loading Technical Catalog Document...
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
    : "";

  const imageUrl =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string" && product.images
      ? product.images
      : null;

  // Real specifications from backend
  const specsEntries =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications).filter(([k, v]) => Boolean(k && String(v).trim()))
      : [];

  const highlightSpecs = specsEntries.slice(0, 4);

  // Real features from backend
  const featuresList = Array.isArray(product.features)
    ? product.features.filter((f) => Boolean(f && String(f).trim()))
    : [];

  // Real applications from backend
  const applicationsList = Array.isArray(product.applications)
    ? product.applications.filter((a) => Boolean(a && String(a).trim()))
    : [];

  // Real how it works from backend
  const howItWorksText = product.category?.howItWorks || product.howItWorks || "";
  const howItWorksSteps = Array.isArray(product.category?.howItWorksSteps)
    ? product.category.howItWorksSteps.filter((s) => Boolean(s && (s.title || s.description)))
    : Array.isArray(product.howItWorksSteps)
    ? product.howItWorksSteps.filter((s) => Boolean(s && (s.title || s.description)))
    : [];

  // Real complete set includes from backend
  const supplyOutfitList = Array.isArray(product.completeSetIncludes)
    ? product.completeSetIncludes.filter((item) => Boolean(item && String(item).trim()))
    : [];

  const categoryTitle =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    product.equipmentTypeName ||
    "";

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* NATIVE PRINT STYLES - AUTO PAGINATION */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
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
          <span className="font-bold text-[#021C57]">Technical Brochure</span>
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
            <span>DOWNLOAD BROCHURE (PDF)</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL CATALOG PRINTABLE BROCHURE SHEET (AUTO-PAGINATED CONTINUOUS FLOW) */}
      <div
        id="catalog-document"
        className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-10 text-gray-800 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none"
      >
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
              {product._id && (
                <div className="font-mono bg-blue-50 text-[#021C57] px-2.5 py-1 rounded-md font-bold inline-block">
                  DOC #{product._id.slice(-6).toUpperCase()}
                </div>
              )}
              {currentDate && (
                <div className="flex items-center md:justify-end gap-1 text-gray-400">
                  <Calendar size={12} /> Issued: {currentDate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCT BANNER & TITLE */}
        <div className="print-avoid-break bg-gradient-to-r from-[#021C57] via-[#032b82] to-[#043399] rounded-2xl p-5 text-white space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {categoryTitle && (
              <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider">
                {formatTitleCase(categoryTitle)}
              </span>
            )}

            {product.isFeatured && (
              <span className="bg-amber-400 text-gray-900 text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
                ★ FLAGSHIP INSTRUMENT
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
            {formatTitleCase(product.name)}
          </h2>

          <div className="flex items-center gap-3 text-xs text-blue-100 font-medium pt-1 flex-wrap">
            {product.productCode && (
              <span>Product Code: <strong>{product.productCode.toUpperCase()}</strong></span>
            )}
            {product.productCode && product.hsnCode && <span>•</span>}
            {product.hsnCode && (
              <span>HSN Code: <strong>{product.hsnCode.toUpperCase()}</strong></span>
            )}
          </div>
        </div>

        {/* PRODUCT HERO AREA: IMAGE + OVERVIEW + HIGHLIGHT CARDS */}
        <div className="print-avoid-break grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* IMAGE BOX */}
          {imageUrl && (
            <div className="md:col-span-5 bg-slate-50 rounded-2xl border border-gray-200 p-4 flex flex-col items-center justify-center shadow-inner">
              <div className="w-full h-48 sm:h-52 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt={product.name}
                  crossOrigin="anonymous"
                  className="max-w-full max-h-full object-contain drop-shadow-md"
                />
              </div>
            </div>
          )}

          {/* OVERVIEW & DYNAMIC HIGHLIGHT CARDS */}
          <div className={`${imageUrl ? "md:col-span-7" : "md:col-span-12"} flex flex-col justify-between space-y-3`}>
            {product.description && (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#021C57] border-b border-gray-100 pb-1">
                  Product Overview
                </h3>
                <p className="text-gray-700 text-xs sm:text-[13px] leading-relaxed text-justify">
                  {product.description}
                </p>
              </div>
            )}

            {/* DYNAMIC HIGHLIGHT CARDS FROM REAL SPECS */}
            {highlightSpecs.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {highlightSpecs.map(([k, v], idx) => {
                  const bgClasses = [
                    "bg-blue-50/90 border-blue-200 text-[#021C57]",
                    "bg-emerald-50/90 border-emerald-200 text-emerald-900",
                    "bg-amber-50/90 border-amber-200 text-amber-900",
                    "bg-slate-100 border-slate-300 text-slate-900",
                  ];
                  const currentBg = bgClasses[idx % bgClasses.length];

                  return (
                    <div key={k} className={`border rounded-xl p-2.5 ${currentBg}`}>
                      <span className="text-gray-500 block font-bold uppercase tracking-wider text-[9px]">
                        {formatTitleCase(k)}:
                      </span>
                      <span className="font-extrabold text-xs sm:text-sm truncate block mt-0.5">
                        {String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* TECHNICAL SPECIFICATIONS TABLE (ONLY REAL ENTRIES FROM ADMIN) */}
        {specsEntries.length > 0 && (
          <div className="print-avoid-break space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h3 className="text-sm font-bold text-[#021C57] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> TECHNICAL SPECIFICATIONS
              </h3>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#021C57] text-white">
                  <tr>
                    <th className="p-2.5 sm:p-3 font-semibold w-1/2">Parameter / Specification</th>
                    <th className="p-2.5 sm:p-3 font-semibold w-1/2">Technical Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {specsEntries.map(([key, val], idx) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* KEY FEATURES (ONLY IF PRESENT IN BACKEND) */}
        {featuresList.length > 0 && (
          <div className="print-avoid-break bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-[#021C57] uppercase tracking-wider border-b border-slate-200/80 pb-1">
              Key Features & Advantages
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
              {featuresList.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOW IT WORKS / WORKING PRINCIPLE (ONLY IF PRESENT IN BACKEND) */}
        {(howItWorksText || howItWorksSteps.length > 0) && (
          <div className="print-avoid-break space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h3 className="text-sm font-bold text-[#021C57] flex items-center gap-2">
                <Cog className="w-4 h-4 text-amber-600" /> HOW IT WORKS / WORKING PRINCIPLE
              </h3>
            </div>

            {howItWorksText && (
              <p className="text-xs text-gray-700 leading-relaxed font-medium bg-blue-50/40 p-3 rounded-xl border border-blue-200/70">
                {howItWorksText}
              </p>
            )}

            {howItWorksSteps.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {howItWorksSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#021C57] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {step.stepNumber || idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-[#021C57] leading-snug">
                        {step.title}
                      </h4>
                    </div>
                    {step.description && (
                      <p className="text-[11px] text-gray-600 leading-relaxed pl-8">
                        {step.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KEY APPLICATIONS (ONLY REAL ENTRIES FROM ADMIN) */}
        {applicationsList.length > 0 && (
          <div className="print-avoid-break bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-200 pb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-700" /> KEY INDUSTRIAL & LAB APPLICATIONS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
              {applicationsList.map((app, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{app}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLETE SET INCLUDES (ONLY REAL ENTRIES FROM ADMIN) */}
        {supplyOutfitList.length > 0 && (
          <div className="print-avoid-break bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <PackageCheck size={14} className="text-[#021C57]" /> COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT)
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
        )}

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
