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
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatTitleCase } from "../utils/stringUtils.js";
import { downloadProductCatalogPdf } from "../utils/productCatalogPdfGenerator.js";
import { reportClientError } from "../utils/clientErrorLogger.js";

const ProductCatalogPdfPage = ({ initialSlug, initialProduct = null }) => {
  const routeParams = useParams();
  const slug = initialSlug || routeParams?.slug;
  const navigate = useNavigate();
  const { product: storeProduct, loading: storeLoading, error, fetchSingleProduct } = useProductStore();
  const [product, setProduct] = useState(initialProduct || null);
  const [downloading, setDownloading] = useState(false);
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

  const handleDirectDownload = async () => {
    if (downloading || !product) return;
    try {
      setDownloading(true);
      const toastId = toast.loading("Generating 3-page PDF catalog document...");

      const pageElements = document.querySelectorAll(".catalog-page");
      if (!pageElements || pageElements.length === 0) {
        toast.update(toastId, {
          render: "Catalog pages not found.",
          type: "error",
          isLoading: false,
          autoClose: 2500,
        });
        setDownloading(false);
        return;
      }

      // Pre-convert all images in all pages to base64 Data URLs so canvas is never tainted
      const allImages = document.querySelectorAll("#catalog-document img");
      await Promise.all(
        Array.from(allImages).map(async (img) => {
          if (!img.src || img.src.startsWith("data:")) return;
          try {
            const res = await fetch(img.src, { mode: "cors" });
            if (!res.ok) return;
            const blob = await res.blob();
            await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                img.src = reader.result;
                resolve();
              };
              reader.onerror = () => resolve();
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            // Ignore individual image failure
          }
        })
      );

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const { toCanvas } = await import("html-to-image");

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        if (i > 0) {
          pdf.addPage();
        }

        let pageCanvas = null;
        try {
          pageCanvas = await toCanvas(pageEl, {
            quality: 0.98,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            cacheBust: true,
            style: {
              margin: "0",
              boxShadow: "none",
            },
          });
        } catch (toImgErr) {
          console.warn("html-to-image fallback to html2canvas-pro:", toImgErr);
          const html2canvasProModule = await import("html2canvas-pro");
          const html2canvasPro = html2canvasProModule.default || html2canvasProModule;
          pageCanvas = await html2canvasPro(pageEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          });
        }

        if (pageCanvas) {
          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
          pdf.addImage(pageImgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }
      }

      const cleanName = (product?.name || "Product")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const filename = `ARCL-${cleanName}-Catalog.pdf`;

      pdf.save(filename);

      toast.update(toastId, {
        render: "Catalog PDF downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Direct PDF download error:", err);
      reportClientError({
        message: `Catalog PDF Generation Exception: ${err.message || "Canvas Export Failed"}`,
        stack: err.stack,
        severity: "error",
        metadata: { product: product?.name, slug: product?.slug },
      });

      try {
        await downloadProductCatalogPdf(product);
        toast.dismiss();
        toast.success("Catalog PDF generated and downloaded to your device!");
      } catch (fallbackErr) {
        toast.dismiss();
        toast.error("Could not download PDF. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
    : "";

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

  const docId = (product._id || "ARCL").slice(-6).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .catalog-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            padding: 12mm 14mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            box-sizing: border-box !important;
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
          <span className="font-bold text-[#021C57]">PDF Catalog (3 Pages)</span>
        </div>

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
            onClick={handleDirectDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-[#021C57] hover:bg-[#043399] disabled:bg-blue-950 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Download Catalog (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL CATALOG PRINTABLE PAGES CONTAINER */}
      <div id="catalog-document" className="max-w-4xl mx-auto space-y-8 print:space-y-0">
        
        {/* ==================== PAGE 1 ==================== */}
        <div className="catalog-page bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-12 text-gray-800 flex flex-col justify-between min-h-[1050px] relative">
          <div className="space-y-6">
            {/* HEADER LETTERHEAD */}
            <div className="border-b-2 border-[#021C57] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

              <div className="flex items-center gap-3 self-start sm:self-auto">
                {product.qrCode && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-1.5 flex items-center gap-2">
                    <img
                      src={product.qrCode}
                      alt="Product QR"
                      crossOrigin="anonymous"
                      className="w-13 h-13 object-contain bg-white rounded-lg p-0.5 border border-blue-100"
                    />
                    <div className="text-[8.5px] font-bold text-[#021C57] leading-tight text-left">
                      <span>SCAN FOR LIVE</span><br />
                      <span className="text-gray-500 font-normal">SPECS & CERT</span>
                    </div>
                  </div>
                )}

                <div className="text-left sm:text-right text-[11px] text-gray-500 space-y-1">
                  <div className="font-mono bg-blue-50 text-[#021C57] px-2.5 py-1 rounded-md font-bold inline-block">
                    CATALOG DOC #{docId}
                  </div>
                  <div className="flex items-center sm:justify-end gap-1 text-gray-400">
                    <Calendar size={12} /> Issued: {currentDate}
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT BANNER & TITLE */}
            <div className="bg-gradient-to-r from-[#021C57] to-[#043399] rounded-2xl p-5 text-white space-y-2 shadow-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* IMAGE */}
              <div className="md:col-span-5 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner flex items-center justify-center p-3">
                <img
                  src={imageUrl}
                  alt={product.name}
                  crossOrigin="anonymous"
                  className="w-full h-64 object-contain rounded-xl"
                />
              </div>

              {/* OVERVIEW */}
              <div className="md:col-span-7 space-y-3.5">
                <h3 className="text-base font-bold text-[#021C57] border-b border-gray-100 pb-1.5 flex items-center gap-2">
                  <span>Product Overview & Summary</span>
                </h3>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed text-justify">
                  {product.description ||
                    "Engineered with high-grade components for demanding laboratory and industrial testing workflows. Fully calibrated to comply with relevant national and international testing standards."}
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {product.productCode && (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 text-xs">
                      <span className="text-gray-500 block font-medium uppercase tracking-wider text-[9px]">Product Code / SKU:</span>
                      <span className="font-mono font-black text-[#021C57] text-xs sm:text-sm">
                        {product.productCode.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {product.hsnCode && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs">
                      <span className="text-gray-500 block font-medium uppercase tracking-wider text-[9px]">HSN Code:</span>
                      <span className="font-mono font-black text-emerald-800 text-xs sm:text-sm">
                        {product.hsnCode.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                    <span className="text-gray-400 block font-medium text-[9px]">Standard:</span>
                    <span className="font-bold text-[#021C57] text-xs">
                      ASTM / IS Compliant
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                    <span className="text-gray-400 block font-medium text-[9px]">Availability:</span>
                    <span className="font-bold text-[#021C57] text-xs">
                      Ready to Dispatch
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* QUALITY HIGHLIGHTS PILLS */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-[#021C57] block">ISO 9001:2015 Quality</span>
                <span className="text-[10px] text-gray-500">Multi-stage inspection</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-[#021C57] block">Factory Calibrated</span>
                <span className="text-[10px] text-gray-500">Traceable certificate</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-xs font-bold text-[#021C57] block">Manufacturer Warranty</span>
                <span className="text-[10px] text-gray-500">Genuine parts support</span>
              </div>
            </div>
          </div>

          {/* PAGE 1 FOOTER */}
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[10px] text-gray-400">
            <span>ARCL Instruments Pvt. Ltd. • Official Technical Brochure</span>
            <span className="font-bold text-[#021C57]">Page 1 of 3</span>
            <span>www.arclinstruments.com</span>
          </div>
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div className="catalog-page bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-12 text-gray-800 flex flex-col justify-between min-h-[1050px] relative">
          <div className="space-y-6">
            {/* MINI HEADER */}
            <div className="border-b border-[#021C57] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logo} alt="ARCL Logo" className="w-12 object-contain" />
                <span className="text-sm font-bold text-[#021C57]">ARCL INSTRUMENTS PVT. LTD.</span>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">
                {formatTitleCase(product.name)} • DOC #{docId}
              </span>
            </div>

            {/* TECHNICAL SPECIFICATIONS TABLE */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> Technical Specifications
                </h3>

                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#021C57] text-white">
                      <tr>
                        <th className="p-3 font-semibold w-1/2">Parameter / Specification</th>
                        <th className="p-3 font-semibold w-1/2">Standard Technical Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(product.specifications).map(([key, val], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                          <td className="p-2.5 font-semibold text-gray-700">
                            {formatTitleCase(key)}
                          </td>
                          <td className="p-2.5 text-gray-900 font-medium">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WORKING PRINCIPLE & OPERATING MECHANISM */}
            {hasHowItWorks && (
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-[#021C57] flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Cog className="w-5 h-5 text-amber-600" /> Working Principle & Operating Mechanism
                </h3>

                {product.category.howItWorks && (
                  <p className="text-xs text-gray-700 leading-relaxed font-medium bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70">
                    {product.category.howItWorks}
                  </p>
                )}

                {product.category.howItWorksSteps && product.category.howItWorksSteps.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {product.category.howItWorksSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {step.stepNumber || idx + 1}
                          </span>
                          <span className="font-bold text-xs text-[#021C57] truncate">
                            {step.title || `Step ${idx + 1}`}
                          </span>
                        </div>
                        {step.description && (
                          <p className="text-[10.5px] text-gray-600 leading-relaxed pl-6">
                            {step.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PAGE 2 FOOTER */}
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[10px] text-gray-400">
            <span>ARCL Instruments Pvt. Ltd. • Technical Specifications</span>
            <span className="font-bold text-[#021C57]">Page 2 of 3</span>
            <span>www.arclinstruments.com</span>
          </div>
        </div>

        {/* ==================== PAGE 3 ==================== */}
        <div className="catalog-page bg-white border border-gray-300 rounded-3xl shadow-xl p-8 md:p-12 text-gray-800 flex flex-col justify-between min-h-[1050px] relative">
          <div className="space-y-6">
            {/* MINI HEADER */}
            <div className="border-b border-[#021C57] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logo} alt="ARCL Logo" className="w-12 object-contain" />
                <span className="text-sm font-bold text-[#021C57]">ARCL INSTRUMENTS PVT. LTD.</span>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">
                {formatTitleCase(product.name)} • DOC #{docId}
              </span>
            </div>

            {/* FEATURES & APPLICATIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* FEATURES */}
              {product.features && product.features.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-[#021C57] uppercase tracking-wider">
                    Key Features & Advantages
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* APPLICATIONS */}
              {product.applications && product.applications.length > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2.5">
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Industrial & Lab Applications
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {product.applications.map((app, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT) */}
            {product.completeSetIncludes && product.completeSetIncludes.length > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                    ✓
                  </span>
                  Complete Set Includes (Standard Supply Outfit)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-800">
                  {product.completeSetIncludes.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2 rounded-xl border border-emerald-100 flex items-start gap-2 shadow-2xs"
                    >
                      <span className="font-bold text-emerald-700 shrink-0 text-xs">{idx + 1}.</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QUALITY ASSURANCE & OFFICIAL FOOTER */}
            <div className="space-y-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:divide-x md:divide-slate-200">
                  {/* 1. Office Address */}
                  <div className="flex items-start gap-2.5 md:pr-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#021C57] flex items-center justify-center shrink-0 mt-0.5">
                      <Building size={14} />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#021C57] block">
                        Head Office & Works
                      </span>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                        Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra, India
                      </p>
                    </div>
                  </div>

                  {/* 2. Contact Helplines */}
                  <div className="flex items-start gap-2.5 md:px-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone size={14} />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                        Helplines & Sales
                      </span>
                      <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                        <p><span className="text-slate-500 text-[10px]">Head:</span> +91 81696 95728</p>
                        <p><span className="text-slate-500 text-[10px]">Sales:</span> +91 83694 58583</p>
                        <p><span className="text-slate-500 text-[10px]">Calib:</span> +91 62056 91085</p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Email & Web Portal */}
                  <div className="flex items-start gap-2.5 md:pl-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail size={14} />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                        Email & Web Portal
                      </span>
                      <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                        <p>
                          <a href="mailto:arclinstruments@gmail.com" className="hover:text-[#021C57]">
                            arclinstruments@gmail.com
                          </a>
                        </p>
                        <p>
                          <a href="mailto:info@arclinstruments.com" className="hover:text-[#021C57]">
                            info@arclinstruments.com
                          </a>
                        </p>
                        <p className="text-[#021C57] font-semibold text-[10.5px]">
                          www.arclinstruments.com
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                © {new Date().getFullYear()} ARCL Instruments Pvt. Ltd. All rights reserved. An ISO 9001:2015 Certified Manufacturer. Technical specifications are subject to continuous engineering enhancement without prior notification.
              </p>
            </div>
          </div>

          {/* PAGE 3 FOOTER */}
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[10px] text-gray-400">
            <span>ARCL Instruments Pvt. Ltd. • Quality & Warranty</span>
            <span className="font-bold text-[#021C57]">Page 3 of 3</span>
            <span>www.arclinstruments.com</span>
          </div>
        </div>

      </div>

      {/* 3. FLOATING PRINT BUTTON (Bottom Mobile Friendly) */}
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
