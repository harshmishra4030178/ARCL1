import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export const ENVELOPE_SPECS = {
  widthCm: 28,
  heightCm: 12.4,
  widthMm: 280,
  heightMm: 124,
  qrSizeCm: 3.2,
  qrSizeMm: 32,
  orientation: "landscape",
};

export const ENVELOPE_PRESETS = [
  {
    id: "custom_arcl",
    label: "ARCL Standard (280 × 124 mm)",
    widthMm: 280,
    heightMm: 124,
    widthCm: 28.0,
    heightCm: 12.4,
    description: "Official ARCL Custom Envelope",
  },
  {
    id: "dl",
    label: "DL Commercial (220 × 110 mm)",
    widthMm: 220,
    heightMm: 110,
    widthCm: 22.0,
    heightCm: 11.0,
    description: "Standard Business Envelope (1/3 A4)",
  },
  {
    id: "c5",
    label: "C5 Medium (229 × 162 mm)",
    widthMm: 229,
    heightMm: 162,
    widthCm: 22.9,
    heightCm: 16.2,
    description: "Fits folded A4 (A5 size)",
  },
  {
    id: "c4",
    label: "C4 Large (324 × 229 mm)",
    widthMm: 324,
    heightMm: 229,
    widthCm: 32.4,
    heightCm: 22.9,
    description: "Full A4 Unfolded Sheets",
  },
  {
    id: "c6_5",
    label: "C6/C5 Standard (229 × 114 mm)",
    widthMm: 229,
    heightMm: 114,
    widthCm: 22.9,
    heightCm: 11.4,
    description: "General Mailing Envelope",
  },
  {
    id: "no10",
    label: "#10 Business (241 × 105 mm)",
    widthMm: 241,
    heightMm: 105,
    widthCm: 24.1,
    heightCm: 10.5,
    description: "Standard #10 Commercial Envelope",
  },
  {
    id: "custom",
    label: "Custom Dimensions (Specify W × H)",
    widthMm: 280,
    heightMm: 124,
    widthCm: 28.0,
    heightCm: 12.4,
    description: "Enter any width & height in mm",
  },
];

export const DEFAULT_ENVELOPE_CONFIG = {
  headerCompanyName: "ARCL INSTRUMENTS PRIVATE LIMITED",
  headerSubtitle: "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017",
  headerAddress: "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra • GSTIN: 27AATCA7874C1ZB",
  phone: "+91 81696 95728",
  email: "info@arclinstruments.com",
  emailPrimary: "info@arclinstruments.com",
  emailSecondary: "arclinstruments@gmail.com",
  website: "https://arclinstruments.com/",
  showHeaderSubtitle: true,
  fromCompanyName: "ARCL INSTRUMENTS",
  address: "Shop No. 6, Siddhivinayak Park CHS, Sector-8A, Airoli, Navi Mumbai, Maharashtra 400708, India",
  footerServices: [
    "Calibration",
    "Manufacturing",
    "Sales",
    "Service",
    "Spares",
  ],
  footerThankYouTitle: "Thank You for Choosing ARCL Instruments! We Greatly Value Your Trust & Association.",
  footerThankYouSubtitle: "For any new requirements, calibration, servicing, spares, or technical support, please feel free to contact us.",
};

/**
 * Computes proportional width/height and centered x/y offset to fit an image
 * strictly inside a bounding box without stretching, distorting, or cropping.
 */
export const computeAspectFitBox = (imgWidth, imgHeight, boxX, boxY, boxW, boxH) => {
  const w = Number(imgWidth) || 0;
  const h = Number(imgHeight) || 0;
  if (w <= 0 || h <= 0) {
    return { x: boxX, y: boxY, width: boxW, height: boxH };
  }
  const scale = Math.min(boxW / w, boxH / h);
  const drawW = w * scale;
  const drawH = h * scale;
  return {
    x: boxX + (boxW - drawW) / 2,
    y: boxY + (boxH - drawH) / 2,
    width: drawW,
    height: drawH,
  };
};

export const generateCustomerEnvelopeQrPng = async (verifyUrl) => {
  if (!verifyUrl) return null;
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    width: 340,
    margin: 1,
    color: { dark: "#021C57", light: "#ffffff" },
  });
  return {
    dataUrl,
    width: 340,
    height: 340,
    fileName: "Customer_Envelope_QR.png",
    fileSizeKb: Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024)),
  };
};

export const loadImageDetails = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    if (typeof src === "string" && src.startsWith("data:image/")) {
      resolve({
        dataUrl: src,
        width: 320,
        height: 180,
      });
      return;
    }
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Generates an exact 280 mm x 124 mm (28 cm x 12.4 cm) landscape print-ready PDF.
 * When `recipient` is omitted/empty, TO stays completely blank for handwritten addressing.
 * When `recipient` is provided, customer Name, Contact, Address & Phone auto-fill cleanly.
 */
export const buildEnvelopePdfDocument = async ({
  config = DEFAULT_ENVELOPE_CONFIG,
  recipient = null,
  qrImage = null,
  envelopeSize = null,
  widthMm: paramWidthMm = null,
  heightMm: paramHeightMm = null,
  logoSrc = "/assets/LOGO.png",
  fallbackLogoSrc = "/assets/cert_assets/arcl_logo.png",
  watermarkSrc = "/assets/cert_assets/arcl_watermark.png",
  iconPhoneSrc = "/assets/cert_assets/icon_phone.png",
  iconMailSrc = "/assets/cert_assets/icon_mail.png",
  iconWebSrc = "/assets/cert_assets/icon_web.png",
} = {}) => {
  const widthMm = Number(
    paramWidthMm ||
      envelopeSize?.widthMm ||
      config?.widthMm ||
      ENVELOPE_SPECS.widthMm
  );
  const heightMm = Number(
    paramHeightMm ||
      envelopeSize?.heightMm ||
      config?.heightMm ||
      ENVELOPE_SPECS.heightMm
  );
  const scaleRatio = Math.min(1.25, Math.max(0.72, widthMm / 280));
  const qrSizeMm = Math.min(32, Math.max(20, heightMm * 0.25));

  const doc = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
    compress: true,
    putOnlyUsedFonts: true,
  });

  // White background across full canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, widthMm, heightMm, "F");

  // Load branding assets concurrently
  const [logoImg, watermarkImg, phIconImg, mailIconImg, webIconImg] = await Promise.all([
    (async () => {
      let l = await loadImageDetails(fallbackLogoSrc || logoSrc);
      if (!l && logoSrc) l = await loadImageDetails(logoSrc);
      return l;
    })(),
    loadImageDetails(watermarkSrc),
    loadImageDetails(iconPhoneSrc),
    loadImageDetails(iconMailSrc),
    loadImageDetails(iconWebSrc),
  ]);

  // 1. FAINT BACKGROUND WATERMARK (Centered behind TO writing area)
  if (watermarkImg?.dataUrl) {
    const wmW = Math.min(138, widthMm * 0.52);
    const wmH = wmW * (79 / 138);
    const wmX = (widthMm - wmW) / 2;
    const wmY = Math.max(26, (heightMm - wmH) / 2 - 3);
    doc.addImage(watermarkImg.dataUrl, "PNG", wmX, wmY, wmW, wmH, undefined, "FAST");
  }

  // Brand top bars (Dark Navy + Orange corporate accent)
  doc.setFillColor(2, 28, 87);
  doc.rect(0, 0, widthMm, 3.2, "F");
  doc.setFillColor(245, 130, 32);
  doc.rect(0, 3.2, widthMm, 0.9, "F");

  // Header Logo + 4-Line Company Header (Matching User Request)
  const marginX = Math.min(12, widthMm * 0.05);
  const headerBottomY = Math.min(27.5, heightMm * 0.23);

  const logoCardX = marginX;
  const logoCardY = 4.8;
  const logoCardW = Math.min(29, 29 * scaleRatio);
  const logoCardH = Math.min(20.8, 20.8 * scaleRatio);

  // Logo Card with subtle rounded border (matching Image 1 badge)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(logoCardX, logoCardY, logoCardW, logoCardH, 2.0, 2.0, "S");
  } else {
    doc.rect(logoCardX, logoCardY, logoCardW, logoCardH, "S");
  }

  if (logoImg?.dataUrl) {
    const logoBox = computeAspectFitBox(
      logoImg.width,
      logoImg.height,
      logoCardX + 1.2,
      logoCardY + 1.0,
      logoCardW - 2.4,
      logoCardH - 2.0
    );
    doc.addImage(logoImg.dataUrl, "PNG", logoBox.x, logoBox.y, logoBox.width, logoBox.height, undefined, "FAST");
  }

  const textStartX = logoCardX + logoCardW + 4.0;
  const headerName = String(config.headerCompanyName || DEFAULT_ENVELOPE_CONFIG.headerCompanyName).trim();
  const headerSub = String(config.headerSubtitle || DEFAULT_ENVELOPE_CONFIG.headerSubtitle).trim();
  const headerAddr = String(config.headerAddress || DEFAULT_ENVELOPE_CONFIG.headerAddress).trim();

  // Line 1: Full Company Name - Scaled proportionately
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.round(20.5 * scaleRatio * 10) / 10);
  doc.setTextColor(2, 28, 87);
  doc.text(headerName, textStartX, 10.2);

  // Line 2: NABL Accreditation Laboratory & Standard (Bold Emerald Green #047857)
  if (config.showHeaderSubtitle !== false && headerSub) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.round(9.8 * scaleRatio * 10) / 10);
    doc.setTextColor(4, 120, 87);
    doc.text(headerSub, textStartX, 14.8);
  }

  // Line 3: Official Address & GSTIN - Scaled font size (Slate #334155)
  if (headerAddr) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(Math.round(8.6 * scaleRatio * 10) / 10);
    doc.setTextColor(51, 65, 85);
    doc.text(headerAddr, textStartX, 19.0);
  }

  // Line 4: Contact Strip with Phone, Email & Website Icons (Moved to Header)
  const phoneVal = String(config.phone || DEFAULT_ENVELOPE_CONFIG.phone).trim();
  const emailVal = String(config.email || config.emailPrimary || DEFAULT_ENVELOPE_CONFIG.email).trim();
  const websiteVal = String(config.website || DEFAULT_ENVELOPE_CONFIG.website).trim();
  const iconY = 21.0;
  const line4Y = 23.3;
  let curContactX = textStartX;
  const contactFontSize = Math.round(8.0 * scaleRatio * 10) / 10;

  if (phoneVal) {
    if (phIconImg?.dataUrl) {
      doc.addImage(phIconImg.dataUrl, "PNG", curContactX, iconY, 2.8, 2.8);
      curContactX += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(2, 28, 87);
    doc.text(phoneVal, curContactX, line4Y);
    curContactX += doc.getTextWidth(phoneVal) + 4.0;
  }

  if (emailVal) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(245, 130, 32);
    doc.text("|", curContactX, line4Y);
    curContactX += 4.0;

    if (mailIconImg?.dataUrl) {
      doc.addImage(mailIconImg.dataUrl, "PNG", curContactX, iconY, 2.8, 2.8);
      curContactX += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(2, 28, 87);
    doc.text(emailVal, curContactX, line4Y);
    curContactX += doc.getTextWidth(emailVal) + 4.0;
  }

  if (websiteVal) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(245, 130, 32);
    doc.text("|", curContactX, line4Y);
    curContactX += 4.0;

    if (webIconImg?.dataUrl) {
      doc.addImage(webIconImg.dataUrl, "PNG", curContactX, iconY, 2.8, 2.8);
      curContactX += 3.6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(contactFontSize);
    doc.setTextColor(29, 78, 216);
    doc.text(websiteVal, curContactX, line4Y);
  }

  // Clean horizontal header divider rules (Navy + Accent Orange)
  doc.setDrawColor(2, 28, 87);
  doc.setLineWidth(0.45);
  doc.line(marginX, headerBottomY, widthMm - marginX, headerBottomY);
  doc.setDrawColor(245, 130, 32);
  doc.setLineWidth(0.35);
  doc.line(marginX, headerBottomY + 0.8, widthMm - marginX, headerBottomY + 0.8);

  // Body layout coordinates (mm)
  const bodyTopY = headerBottomY + 5.5;

  // ==========================================
  // RIGHT ZONE: QR CODE AREA
  // ==========================================
  const qrX = widthMm - marginX - qrSizeMm;
  const qrY = Math.max(headerBottomY + 6, (heightMm - qrSizeMm) / 2 - 4);

  // ==========================================
  // CENTER/LEFT ZONE: TO SECTION (ONLY SECTION IN BODY - FROM REMOVED)
  // Kept completely blank for handwritten address when no recipient is passed
  // ==========================================
  const toX = 18;
  const toMaxW = Math.max(70, qrX - toX - 10);
  let toY = bodyTopY + 3.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(8.5, 10.0 * scaleRatio));
  doc.setTextColor(29, 78, 216);
  doc.text("TO", toX, toY);

  const recCompany = String(recipient?.companyName || "").trim();
  const recContact = String(recipient?.contactPerson || "").trim();
  const recAddress = String(recipient?.address || "").trim();
  const recPhone = String(recipient?.phone || "").trim();

  if (recCompany || recContact || recAddress || recPhone) {
    toY += 7.0;
    if (recCompany) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(10.5, 13.0 * scaleRatio));
      doc.setTextColor(2, 28, 87);
      const compLines = doc.splitTextToSize(recCompany, toMaxW);
      doc.text(compLines, toX, toY, { lineHeightFactor: 1.25 });
      toY += compLines.length * 5.6 + 2.0;
    }
    if (recContact && recContact.toLowerCase() !== recCompany.toLowerCase()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(8.5, 10.0 * scaleRatio));
      doc.setTextColor(51, 65, 85);
      doc.text(`Attn: ${recContact}`, toX, toY);
      toY += 5.5;
    }
    if (recAddress) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(Math.max(8.5, 10.2 * scaleRatio));
      doc.setTextColor(30, 41, 59);
      const recAddrLines = doc.splitTextToSize(recAddress, toMaxW);
      doc.text(recAddrLines, toX, toY, { lineHeightFactor: 1.4 });
      toY += recAddrLines.length * 4.8 + 3.0;
    }
    if (recPhone) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(Math.max(8.0, 9.8 * scaleRatio));
      doc.setTextColor(2, 28, 87);
      doc.text("Phone:", toX, toY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(recPhone, toX + 15, toY);
    }
  }

  // Draw QR Image / Box
  if (qrImage?.dataUrl) {
    const qrFit = computeAspectFitBox(
      qrImage.width,
      qrImage.height,
      qrX,
      qrY,
      qrSizeMm,
      qrSizeMm
    );
    doc.addImage(
      qrImage.dataUrl,
      "PNG",
      qrFit.x,
      qrFit.y,
      qrFit.width,
      qrFit.height,
      undefined,
      "NONE"
    );
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.35);
    if (typeof doc.setLineDashPattern === "function") {
      doc.setLineDashPattern([1.2, 1.2], 0);
    }
    doc.rect(qrX, qrY, qrSizeMm, qrSizeMm, "S");
    if (typeof doc.setLineDashPattern === "function") {
      doc.setLineDashPattern([], 0);
    }
  }

  // DESCRIPTIVE CAPTION UNDER QR CODE (What the QR is for)
  const qrCenterX = qrX + qrSizeMm / 2;
  let curQrTextY = qrY + qrSizeMm + 3.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(6.0, 7.5 * scaleRatio));
  doc.setTextColor(2, 28, 87);
  doc.text("SCAN TO VERIFY", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 3.2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(5.2, 6.3 * scaleRatio));
  doc.setTextColor(29, 78, 216);
  doc.text("CALIBRATION CERTIFICATES", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 2.8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(Math.max(4.6, 5.4 * scaleRatio));
  doc.setTextColor(71, 85, 105);
  doc.text("NABL CC-4313  \u2022  ISO/IEC 17025", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 2.5;
  doc.setFontSize(Math.max(4.2, 4.8 * scaleRatio));
  doc.setTextColor(100, 116, 139);
  doc.text("ARCL Instruments Pvt. Ltd.", qrCenterX, curQrTextY, { align: "center" });

  // ==========================================
  // FOOTER SERVICES SECTION (Matching User Request)
  // Calibration | Manufacturing | Sales | Service | Spares
  // ==========================================
  const footerServices = Array.isArray(config.footerServices) && config.footerServices.length > 0
    ? config.footerServices
    : ["Calibration", "Manufacturing", "Sales", "Service", "Spares"];

  const footerH = Math.min(8.2, Math.max(6.2, heightMm * 0.068));
  const footerY = heightMm - 10.2 - footerH;
  const footerW = widthMm - 2 * marginX;

  doc.setDrawColor(245, 130, 32);
  doc.setLineWidth(0.65);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(marginX, footerY, footerW, footerH, 1.8, 1.8, "S");
  } else {
    doc.rect(marginX, footerY, footerW, footerH, "S");
  }

  const slotW = footerW / footerServices.length;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(6.8, 8.8 * scaleRatio));
  doc.setTextColor(2, 28, 87);

  footerServices.forEach((svc, i) => {
    const slotCenterX = marginX + i * slotW + slotW / 2;
    doc.text(String(svc), slotCenterX, footerY + footerH * 0.68, { align: "center" });

    if (i < footerServices.length - 1) {
      const divX = marginX + (i + 1) * slotW;
      doc.setDrawColor(245, 130, 32);
      doc.setLineWidth(0.55);
      doc.line(divX, footerY + 1.2, divX, footerY + footerH - 1.2);
    }
  });

  // Customer Courtesy & Thank You Note (Clearly positioned below services box)
  const centerPageX = widthMm / 2;
  const thankTitle = String(
    config.footerThankYouTitle || DEFAULT_ENVELOPE_CONFIG.footerThankYouTitle
  ).trim();
  const thankSub = String(
    config.footerThankYouSubtitle || DEFAULT_ENVELOPE_CONFIG.footerThankYouSubtitle
  ).trim();

  const thankY1 = heightMm - 7.2;
  const thankY2 = heightMm - 4.4;

  if (thankTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(Math.max(5.2, 6.6 * scaleRatio));
    doc.setTextColor(2, 28, 87);
    doc.text(thankTitle, centerPageX, thankY1, { align: "center" });
  }

  if (thankSub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(Math.max(4.5, 5.5 * scaleRatio));
    doc.setTextColor(71, 85, 105);
    doc.text(thankSub, centerPageX, thankY2, { align: "center" });
  }

  // Bottom framing bar (Accent Orange + Corporate Navy)
  doc.setFillColor(245, 130, 32);
  doc.rect(0, heightMm - 3.4, widthMm, 0.8, "F");
  doc.setFillColor(2, 28, 87);
  doc.rect(0, heightMm - 2.6, widthMm, 2.6, "F");

  return doc;
};

export const downloadEnvelopePdf = async (opts = {}, fileName = null) => {
  const doc = await buildEnvelopePdfDocument(opts);
  const w = opts.widthMm || opts.envelopeSize?.widthMm || 280;
  const h = opts.heightMm || opts.envelopeSize?.heightMm || 124;
  const outName = fileName || `ARCL_Instruments_Envelope_${w}x${h}mm.pdf`;
  doc.save(outName);
  return doc;
};

export const getEnvelopePdfBlobUrl = async (opts = {}) => {
  const doc = await buildEnvelopePdfDocument(opts);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
};

/**
 * Direct 100% Native Print to Printer via Hidden DOM Iframe.
 * Bypasses PDF downloads, file saving dialogs, and Adobe Acrobat completely!
 */
export const printEnvelopeHtmlDirectly = async ({
  elementId = "arcl-envelope-print-sheet",
  widthMm = 280,
  heightMm = 124,
} = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const sourceEl = document.getElementById(elementId);
      if (!sourceEl) {
        throw new Error(`Envelope preview element #${elementId} not found in DOM`);
      }

      const existingFrame = document.getElementById("arcl-direct-envelope-print-frame");
      if (existingFrame) {
        existingFrame.remove();
      }

      const iframe = document.createElement("iframe");
      iframe.id = "arcl-direct-envelope-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const printDoc = iframe.contentWindow.document;
      printDoc.open();
      printDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>ARCL Instruments Envelope Print (${widthMm} × ${heightMm} mm)</title>
            <style>
              @page {
                size: ${widthMm}mm ${heightMm}mm;
                margin: 0mm !important;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;
                background: #ffffff !important;
                overflow: hidden !important;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              }
              #${elementId} {
                width: ${widthMm}mm !important;
                height: ${heightMm}mm !important;
                transform: none !important;
                box-shadow: none !important;
                border: none !important;
                position: relative !important;
                overflow: hidden !important;
              }
              .arcl-no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${sourceEl.outerHTML}
          </body>
        </html>
      `);
      printDoc.close();

      const imgs = Array.from(printDoc.getElementsByTagName("img"));
      const imgLoads = imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = () => res();
          img.onerror = () => res();
        });
      });

      Promise.all(imgLoads).then(() => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            resolve(true);
          } catch (err) {
            console.error("Direct print iframe failed:", err);
            reject(err);
          } finally {
            setTimeout(() => {
              try {
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
              } catch (cleanupErr) {
                void cleanupErr;
              }
            }, 60000);
          }
        }, 150);
      });
    } catch (err) {
      reject(err);
    }
  });
};
