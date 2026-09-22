import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { formatTitleCase } from "./stringUtils.js";

/**
 * Captures a DOM element and exports it as a STRICTLY 1-PAGE high-resolution A4 PDF.
 * Ensures the downloaded PDF is 100% IDENTICAL to the on-screen view (same watermark, barcode, colors, layout).
 */
const elementToSinglePagePdf = async (element, filename) => {
  let imgData = null;

  // 1. Try html-to-image (preserves SVG patterns, modern CSS & Tailwind v4)
  try {
    imgData = await toPng(element, {
      pixelRatio: 2.2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      skipAutoScale: false,
    });
  } catch (err) {
    // 2. Fallback to html2canvas
    try {
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      imgData = canvas.toDataURL("image/png");
    } catch (e2) {
      console.error("DOM capture error:", e2);
    }
  }

  if (!imgData) {
    throw new Error("Could not capture catalog document");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210; // mm
  const pageHeight = 297; // mm

  // Wait for image dimensions
  const img = new Image();
  img.src = imgData;
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  const imgW = img.width || 800;
  const imgH = img.height || 1130;
  const aspectRatio = imgW / imgH;

  // Fit strictly on 1 single A4 page with 4mm safe margin
  const margin = 4;
  const targetW = pageWidth - margin * 2; // 202mm
  let finalW = targetW;
  let finalH = finalW / aspectRatio;

  if (finalH > pageHeight - margin * 2) {
    finalH = pageHeight - margin * 2;
    finalW = finalH * aspectRatio;
  }

  const posX = (pageWidth - finalW) / 2;
  const posY = (pageHeight - finalH) / 2;

  // Guarantee strictly 1 single page
  pdf.addImage(imgData, "PNG", posX, posY, finalW, finalH, undefined, "FAST");
  pdf.save(filename);
  return filename;
};

/**
 * Generates an offscreen DOM element with the exact same template when downloaded from outside the catalog page.
 */
const createOffscreenCatalogElement = (product) => {
  const cleanSku = (product.productCode || product.slug || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-");
  const sku = product.productCode ? product.productCode.toUpperCase() : cleanSku;
  const hsn = product.hsnCode ? String(product.hsnCode).toUpperCase() : "";
  const categoryName =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    product.equipmentTypeName ||
    "Laboratory Equipment";

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const docRef = product._id ? `DOC #${product._id.slice(-6).toUpperCase()}` : "DOC #ARCL26";

  const qrImageUrl =
    product.qrCode ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&data=${encodeURIComponent(
      `https://arclinstruments.com/products/${product.slug || product._id || cleanSku}`
    )}`;

  const imageUrl =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string" && product.images
      ? product.images
      : null;

  const specsEntries =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications).filter(([k, v]) => Boolean(k && String(v).trim()))
      : [];
  const highlightSpecs = specsEntries.slice(0, 4);

  const featuresList = Array.isArray(product.features)
    ? product.features.filter((f) => Boolean(f && String(f).trim()))
    : [];

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "820px";
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-1000";
  container.style.fontFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

  container.innerHTML = `
    <div style="position: relative; overflow: hidden; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 24px 28px; color: #1e293b; box-sizing: border-box;">
      <!-- Watermark Overlay -->
      <div style="position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 20; opacity: 0.09;">
        <svg style="width: 100%; height: 100%;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="offscreenWatermark" width="220" height="110" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
              <text x="110" y="32" fill="#021C57" font-size="12" font-weight="900" font-family="Inter, Arial, sans-serif" text-anchor="middle" letter-spacing="1.2px">ARCL INSTRUMENTS PVT. LTD.</text>
              <text x="220" y="87" fill="#021C57" font-size="12" font-weight="900" font-family="Inter, Arial, sans-serif" text-anchor="middle" letter-spacing="1.2px">ARCL INSTRUMENTS PVT. LTD.</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#offscreenWatermark)" />
        </svg>
      </div>

      <!-- Top Motto Line -->
      <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 900; color: #021C57; letter-spacing: 0.5px; border-bottom: 1px solid rgba(220, 38, 38, 0.3); padding-bottom: 4px; margin-bottom: 8px;">
        <span>PRECISION • PERFORMANCE • RELIABILITY</span>
        <span style="color: #64748b; font-size: 9px; font-weight: 600;">OFFICIAL TECHNICAL PRODUCT CATALOG</span>
      </div>

      <!-- Header Letterhead -->
      <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #021C57; padding-bottom: 10px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="background: #ffffff; padding: 4px 6px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <img src="/assets/LOGO.png" alt="ARCL Logo" crossorigin="anonymous" style="width: 76px; object-fit: contain;" />
          </div>
          <div>
            <h1 style="font-size: 18px; font-weight: 900; color: #021C57; margin: 0; line-height: 1.2;">ARCL INSTRUMENTS PVT. LTD.</h1>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
              <span style="background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">ISO 9001:2015 Certified</span>
              <span style="color: #94a3b8; font-size: 11px;">•</span>
              <span style="color: #64748b; font-size: 10.5px; font-weight: 500;">Precision Laboratory & Civil Testing Equipment</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 4px 8px; display: flex; align-items: center; gap: 8px;">
            <img src="${qrImageUrl}" alt="QR" crossorigin="anonymous" style="width: 38px; height: 38px; object-fit: contain; border-radius: 6px;" />
            <div style="font-size: 8px; font-weight: 900; color: #021C57; line-height: 1.2;">
              <span>VERIFIED QR</span><br />
              <span style="color: #059669; font-weight: 800;">SPEC PASS</span><br />
              <span style="color: #64748b; font-family: monospace;">${docRef}</span>
            </div>
          </div>
          <div style="font-size: 9px; color: #64748b; text-align: right;">
            Issued: ${currentDate}
          </div>
        </div>
      </div>

      <!-- Hero Banner -->
      <div style="position: relative; z-index: 10; background: linear-gradient(135deg, #021C57, #043399); border-radius: 14px; padding: 14px 18px; color: #ffffff; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="background: rgba(255, 255, 255, 0.18); font-size: 9.5px; font-weight: 800; padding: 2px 10px; border-radius: 9999px; text-transform: uppercase;">${formatTitleCase(categoryName)}</span>
          <span style="background: #f59e0b; color: #0f172a; font-size: 9.5px; font-weight: 900; padding: 3px 10px; border-radius: 9999px;">★ FLAGSHIP INSTRUMENT</span>
        </div>
        <h2 style="font-size: 19px; font-weight: 900; color: #ffffff; margin: 0 0 6px 0; line-height: 1.2;">${formatTitleCase(product.name)}</h2>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 8px; font-size: 10px; color: #dbeafe; font-weight: 600;">
            ${sku ? `<span style="background: rgba(0,0,0,0.25); padding: 2px 8px; border-radius: 6px;">Product Code: <strong style="color: #ffffff; font-family: monospace;">${sku}</strong></span>` : ""}
            ${hsn ? `<span style="background: rgba(0,0,0,0.25); padding: 2px 8px; border-radius: 6px;">HSN Code: <strong style="color: #ffffff; font-family: monospace;">${hsn}</strong></span>` : ""}
          </div>
          <div style="background: #ffffff; padding: 2px 8px; border-radius: 6px; display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 2px; height: 12px; align-items: center;">
              ${[3, 2, 4, 1, 3, 2, 4, 2, 3, 1, 4, 2, 3, 2, 4, 1, 3, 2].map((w, idx) => `<div style="background: #0f172a; height: 100%; width: ${w % 2 === 0 ? "1.5px" : "2.5px"};"></div>`).join("")}
            </div>
            <span style="font-size: 7.5px; font-family: monospace; font-weight: 800; color: #0f172a;">${sku}</span>
          </div>
        </div>
      </div>

      <!-- Product Overview & Features Side by Side -->
      <div style="position: relative; z-index: 10; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div style="background: rgba(255, 255, 255, 0.95); border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; position: relative;">
          <div style="display: inline-block; background: #021C57; color: #ffffff; font-size: 9px; font-weight: 900; padding: 3px 10px; border-radius: 9999px; margin-bottom: 6px;">PRODUCT OVERVIEW</div>
          <p style="font-size: 10.5px; color: #334155; line-height: 1.45; margin: 0; text-align: justify;">${product.description || "Precision engineered testing instrument conforming to national and international metrological standards."}</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.95); border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; position: relative;">
          <div style="display: inline-block; background: #021C57; color: #ffffff; font-size: 9px; font-weight: 900; padding: 3px 10px; border-radius: 9999px; margin-bottom: 6px;">FEATURES</div>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10.5px; color: #1e293b;">
            ${(featuresList.length > 0 ? featuresList.slice(0, 5) : ["High accuracy and repeatability", "Heavy-duty rigid frame for laboratory use", "Easy-to-use digital readout and controls", "Supplied with traceable calibration chart", "Durable construction for long service life"]).map(feat => `
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #021C57; font-weight: 900; font-size: 11px;">✔</span>
                <span style="font-weight: 500;">${feat}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Technical Specifications Table -->
      <div style="position: relative; z-index: 10; margin-bottom: 12px;">
        <div style="display: inline-block; background: #021C57; color: #ffffff; font-size: 9px; font-weight: 900; padding: 3px 10px; border-radius: 9999px; margin-bottom: 6px;">TECHNICAL SPECIFICATIONS</div>
        <div style="border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
            <thead style="background: #021C57; color: #ffffff;">
              <tr>
                <th style="padding: 6px 10px; font-weight: 800; width: 50%;">Parameter / Specification</th>
                <th style="padding: 6px 10px; font-weight: 800; width: 50%;">Technical Value</th>
              </tr>
            </thead>
            <tbody>
              ${(specsEntries.length > 0 ? specsEntries.slice(0, 5) : [["Standard", "IS / ASTM Compliant"], ["Display", "Digital Load & Displacement Indicator"], ["Accuracy", "Class 1 / ± 1% of F.S."], ["Calibration", "NABL Traceable Calibration"], ["Power Supply", "230V AC, 50Hz Single Phase"]]).map(([k, v], idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                  <td style="padding: 5px 10px; font-weight: 700; color: #021C57;">${formatTitleCase(k)}</td>
                  <td style="padding: 5px 10px; font-weight: 500; color: #0f172a;">${String(v)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Trust Badges -->
      <div style="position: relative; z-index: 10; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; text-align: center;">
          <div style="font-size: 10.5px; font-weight: 900; color: #021C57;">ISO 9001:2015</div>
          <div style="font-size: 8.5px; color: #64748b;">Quality Certified</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; text-align: center;">
          <div style="font-size: 10.5px; font-weight: 900; color: #065f46;">100% Quality Tested</div>
          <div style="font-size: 8.5px; color: #64748b;">Pre-Dispatch Inspection</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; text-align: center;">
          <div style="font-size: 10.5px; font-weight: 900; color: #1e3a8a;">Pan-India Support</div>
          <div style="font-size: 8.5px; color: #64748b;">On-Site Calibration</div>
        </div>
      </div>

      <!-- Corporate Footer -->
      <div style="position: relative; z-index: 10; background: #021C57; border-radius: 12px; padding: 10px 14px; color: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; margin-bottom: 6px;">
          <div>
            <h4 style="font-size: 12px; font-weight: 900; margin: 0;">ARCL Instruments Private Limited</h4>
            <p style="font-size: 8.5px; color: #93c5fd; margin: 0;">Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying</p>
          </div>
          <div style="display: flex; gap: 6px;">
            <span style="background: #059669; color: #ffffff; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 9999px;">ISO 9001:2015</span>
            <span style="background: #f59e0b; color: #0f172a; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 9999px;">MADE IN INDIA</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; font-size: 8.5px; color: #dbeafe;">
          <div>Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708</div>
          <div>+91 83694 58583 (Sales)<br />+91 62056 91085 (Calibration)</div>
          <div>arclinstruments@gmail.com<br />www.arclinstruments.com</div>
        </div>
      </div>
    </div>
  `;

  return container;
};

/**
 * Generates and downloads the official single-page technical brochure PDF for an ARCL product.
 * 100% IDENTICAL to the on-screen view, GUARANTEED STRICTLY 1 PAGE.
 * @param {Object} product The product object from backend/database
 */
export const downloadProductCatalogPdf = async (product) => {
  if (!product) {
    throw new Error("Product data is required to generate catalog");
  }

  const cleanSku = (product.productCode || product.slug || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-");
  const filename = `ARCL-${cleanSku}-Technical-Brochure.pdf`;

  // 1. If currently on the catalog preview page, capture the live on-screen element directly
  const liveCatalogDoc = document.getElementById("catalog-document");
  if (liveCatalogDoc) {
    return await elementToSinglePagePdf(liveCatalogDoc, filename);
  }

  // 2. If outside catalog page, render offscreen matching template and export
  const offscreenEl = createOffscreenCatalogElement(product);
  document.body.appendChild(offscreenEl);

  try {
    // Wait briefly for images to mount
    await new Promise((resolve) => setTimeout(resolve, 80));
    await elementToSinglePagePdf(offscreenEl, filename);
    return filename;
  } finally {
    if (offscreenEl && offscreenEl.parentNode) {
      offscreenEl.parentNode.removeChild(offscreenEl);
    }
  }
};
