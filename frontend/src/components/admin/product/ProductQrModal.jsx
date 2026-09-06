"use client";

import { useState } from "react";
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useProductStore } from "../../../store/useProductStore.js";
import { formatTitleCase } from "../../../utils/stringUtils.js";

const ProductQrModal = ({ isOpen, onClose, product }) => {
  const { generateProductQr } = useProductStore();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!isOpen || !product) return null;

  // Compute canonical product URL
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://arcl-1.vercel.app";
  const productUrl = `${origin}/products/${product.slug || product._id}`;
  const qrImage = product.qrCode || "";

  // COPY PRODUCT URL
  const handleCopyUrl = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = productUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Product URL copied to clipboard! 📋");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("Failed to copy URL");
    }
  };

  // DOWNLOAD QR CODE PNG
  const handleDownloadQr = () => {
    if (!qrImage) {
      toast.warn("No QR code available to download.");
      return;
    }

    const link = document.createElement("a");
    link.href = qrImage;
    const safeName = (product.slug || product.productCode || "product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    link.download = `ARCL-QR-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded as PNG image! 📥");
  };

  // PRINT EQUIPMENT LABEL
  const handlePrintLabel = () => {
    if (!qrImage) {
      toast.warn("Please generate a QR code first before printing.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) {
      toast.error("Please allow popups to print equipment label.");
      return;
    }

    const categoryName = product.category?.name || "Laboratory Equipment";
    const skuCode = product.productCode || product.slug?.toUpperCase() || "N/A";
    const hsnCode = product.hsnCode || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Equipment QR Label - ${product.name}</title>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .label-card {
            width: 380px;
            border: 2px solid #021C57;
            border-radius: 12px;
            padding: 18px;
            text-align: center;
            box-sizing: border-box;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #021C57;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 900;
            color: #021C57;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin: 2px 0 0 0;
          }
          .product-name {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin: 8px 0 4px 0;
            line-height: 1.3;
          }
          .meta-row {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 10px;
            font-size: 11px;
            font-weight: 700;
          }
          .sku-badge {
            background: #eff6ff;
            color: #021C57;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
          }
          .qr-box {
            display: inline-block;
            padding: 8px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin: 6px 0;
          }
          .qr-img {
            width: 190px;
            height: 190px;
            display: block;
          }
          .instructions {
            font-size: 10px;
            font-weight: 700;
            color: #021C57;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 8px 0 4px 0;
          }
          .url-text {
            font-size: 9px;
            color: #64748b;
            word-break: break-all;
            margin: 0 0 10px 0;
          }
          .footer {
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
            font-size: 9px;
            color: #475569;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="header">
            <h1 class="brand-title">ARCL INSTRUMENTS</h1>
            <p class="brand-sub">Laboratory & Industrial Testing Equipment</p>
          </div>

          <div class="product-name">${product.name}</div>

          <div class="meta-row">
            <span class="sku-badge">SKU: ${skuCode}</span>
            ${hsnCode ? `<span class="sku-badge">HSN: ${hsnCode}</span>` : ""}
          </div>

          <div class="qr-box">
            <img class="qr-img" src="${qrImage}" alt="Product QR" />
          </div>

          <div class="instructions">Scan For Specifications & Calibration</div>
          <div class="url-text">${productUrl}</div>

          <div class="footer">
            <span>ISO 9001:2015 Certified</span>
            <span>Support: +91 8009559900</span>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // REGENERATE QR CODE
  const handleRegenerateQr = async () => {
    try {
      setGenerating(true);
      const res = await generateProductQr(product._id);
      toast.success(res.message || "QR Code generated successfully! 🎉");
    } catch (err) {
      toast.error("Failed to generate QR Code");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden relative animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#021C57] to-[#0a2e7a] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <QrCode size={20} className="text-sky-300" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Product QR Code Tag
              </h2>
              <p className="text-[11px] text-sky-200">
                Direct Scan & Equipment Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5">
          
          {/* PRODUCT SUMMARY BANNER */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 shrink-0 p-1 flex items-center justify-center overflow-hidden">
              <img
                src={
                  Array.isArray(product.images) && product.images[0]
                    ? product.images[0]
                    : typeof product.images === "string"
                    ? product.images
                    : "/placeholder.png"
                }
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                {formatTitleCase(product.name)}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
                <span className="text-blue-700 font-semibold flex items-center gap-1">
                  <Layers size={11} /> {formatTitleCase(product.category?.name || "Equipment")}
                </span>
                {product.productCode && (
                  <span className="bg-gray-200/80 text-gray-700 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
                    {product.productCode.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* QR CODE CARD DISPLAY */}
          <div className="bg-gradient-to-b from-blue-50/50 to-white rounded-2xl border-2 border-blue-100 p-6 flex flex-col items-center justify-center text-center relative shadow-xs">
            {qrImage ? (
              <>
                <div className="bg-white p-3.5 rounded-2xl shadow-md border border-gray-200">
                  <img
                    src={qrImage}
                    alt={`${product.name} QR Code`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain block mx-auto"
                  />
                </div>

                <div className="mt-3.5 space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={12} /> Permanent Product ID Link
                  </span>
                  <p className="text-xs text-gray-500 font-medium">
                    Scan with any mobile camera to view full specifications
                  </p>
                </div>
              </>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <QrCode size={32} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    No QR Code Generated Yet
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                    Generate an instant, unique QR code linked directly to this product's page.
                  </p>
                </div>
                <button
                  onClick={handleRegenerateQr}
                  disabled={generating}
                  className="inline-flex items-center gap-2 bg-[#021C57] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#03308f] transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {generating ? "Generating QR Code..." : "Generate QR Code Now"}
                </button>
              </div>
            )}
          </div>

          {/* PRODUCT DIRECT URL BOX */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <span>Target Product URL</span>
              <a
                href={productUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 lowercase font-medium flex items-center gap-1"
              >
                Open Page <ExternalLink size={11} />
              </a>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-600 truncate select-all">
                {productUrl}
              </div>
              <button
                onClick={handleCopyUrl}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer shadow-2xs"
                title="Copy URL"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS (DOWNLOAD / PRINT / REGENERATE) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {/* DOWNLOAD PNG */}
            <button
              onClick={handleDownloadQr}
              disabled={!qrImage}
              className="inline-flex items-center justify-center gap-1.5 bg-[#021C57] hover:bg-[#03308f] text-white text-xs font-bold px-3 py-2.5 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              <span>Download PNG</span>
            </button>

            {/* PRINT LABEL */}
            <button
              onClick={handlePrintLabel}
              disabled={!qrImage}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} />
              <span>Print Label</span>
            </button>

            {/* REGENERATE */}
            <button
              onClick={handleRegenerateQr}
              disabled={generating}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
              <span>{generating ? "Updating..." : "Regenerate"}</span>
            </button>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>ARCL Instruments • Equipment QR Tag</span>
          <button
            onClick={onClose}
            className="font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductQrModal;
