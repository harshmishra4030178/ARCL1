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

export const DEFAULT_ENVELOPE_CONFIG = {
  headerCompanyName: "ARCL INSTRUMENTS PRIVATE LIMITED",
  headerSubtitle: "NABL Accredited Calibration Laboratory (CC-4313) • ISO/IEC 17025:2017",
  headerAddress: "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra • GSTIN: 27AATCA7874C1ZB",
  showHeaderSubtitle: true,
  fromCompanyName: "ARCL INSTRUMENTS",
  address: "Shop No. 6, Siddhivinayak Park CHS, Sector-8A, Airoli, Navi Mumbai, Maharashtra 400708, India",
  phone: "+91 81696 95728",
  emailPrimary: "arclinstruments@gmail.com",
  emailSecondary: "info@arclinstruments.com",
  website: "https://arclinstruments.com/",
  footerServices: [
    "Calibration",
    "Service",
    "Sales",
    "Spares",
    "Manufacturing",
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
  logoSrc = "/assets/cert_assets/arcl_logo.png",
  fallbackLogoSrc = "/assets/LOGO.png",
} = {}) => {
  const { widthMm, heightMm, qrSizeMm } = ENVELOPE_SPECS;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [widthMm, heightMm],
    compress: true,
    putOnlyUsedFonts: true,
  });

  // White background across full 280 x 124 mm canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, widthMm, heightMm, "F");

  // Brand top bars (Dark Navy + Orange corporate accent)
  doc.setFillColor(2, 28, 87);
  doc.rect(0, 0, widthMm, 3.2, "F");
  doc.setFillColor(245, 130, 32);
  doc.rect(0, 3.2, widthMm, 0.9, "F");

  // Header Logo + 3-Line Company Header (Matching User Image 1)
  const marginX = 12;
  const headerBottomY = 24.5;
  let logoImg = await loadImageDetails(fallbackLogoSrc || logoSrc);
  if (!logoImg && logoSrc) {
    logoImg = await loadImageDetails(logoSrc);
  }

  const logoCardX = marginX;
  const logoCardY = 5.2;
  const logoCardW = 28;
  const logoCardH = 16.8;

  // Logo Card with subtle rounded border (matching Image 1 badge)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(logoCardX, logoCardY, logoCardW, logoCardH, 2.2, 2.2, "S");
  } else {
    doc.rect(logoCardX, logoCardY, logoCardW, logoCardH, "S");
  }

  if (logoImg?.dataUrl) {
    const logoBox = computeAspectFitBox(
      logoImg.width,
      logoImg.height,
      logoCardX + 1.4,
      logoCardY + 1.2,
      logoCardW - 2.8,
      logoCardH - 2.4
    );
    doc.addImage(logoImg.dataUrl, "PNG", logoBox.x, logoBox.y, logoBox.width, logoBox.height, undefined, "FAST");
  }

  const textStartX = logoCardX + logoCardW + 4.5;
  const headerName = String(config.headerCompanyName || DEFAULT_ENVELOPE_CONFIG.headerCompanyName).trim();
  const headerSub = String(config.headerSubtitle || DEFAULT_ENVELOPE_CONFIG.headerSubtitle).trim();
  const headerAddr = String(config.headerAddress || DEFAULT_ENVELOPE_CONFIG.headerAddress).trim();

  // Line 1: Full Company Name (Bold Navy #021C57)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.8);
  doc.setTextColor(2, 28, 87);
  doc.text(headerName, textStartX, 10.5);

  // Line 2: NABL Accreditation Laboratory & Standard (Bold Emerald Green #047857)
  if (config.showHeaderSubtitle !== false && headerSub) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.3);
    doc.setTextColor(4, 120, 87);
    doc.text(headerSub, textStartX, 15.2);
  }

  // Line 3: Official Address & GSTIN (Slate #475569)
  if (headerAddr) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.1);
    doc.setTextColor(71, 85, 105);
    doc.text(headerAddr, textStartX, 19.5);
  }

  // Clean horizontal header divider rules (Navy + Accent Orange)
  doc.setDrawColor(2, 28, 87);
  doc.setLineWidth(0.45);
  doc.line(marginX, headerBottomY, widthMm - marginX, headerBottomY);
  doc.setDrawColor(245, 130, 32);
  doc.setLineWidth(0.35);
  doc.line(marginX, headerBottomY + 0.8, widthMm - marginX, headerBottomY + 0.8);

  // Body layout coordinates (mm)
  const bodyTopY = 30.0;
  const bodyBottomY = 99.0;

  // ==========================================
  // LEFT ZONE: FROM SECTION (x: 12 .. 110 mm)
  // ==========================================
  const fromX = marginX;
  const fromMaxW = 94;

  doc.setFillColor(2, 28, 87);
  doc.rect(fromX, bodyTopY, 1.4, 66, "F");

  const fromTextX = fromX + 4.2;
  let curY = bodyTopY + 3.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(29, 78, 216);
  doc.text("FROM", fromTextX, curY);
  curY += 5.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.8);
  doc.setTextColor(2, 28, 87);
  doc.text(String(config.fromCompanyName || DEFAULT_ENVELOPE_CONFIG.fromCompanyName).trim(), fromTextX, curY);
  curY += 5.5;

  // Address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(2, 28, 87);
  doc.text("Address:", fromTextX, curY);
  curY += 3.8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.9);
  doc.setTextColor(30, 41, 59);
  const addrLines = doc.splitTextToSize(
    String(config.address || DEFAULT_ENVELOPE_CONFIG.address).trim(),
    fromMaxW - 4.2
  );
  doc.text(addrLines, fromTextX, curY, { lineHeightFactor: 1.30 });
  curY += addrLines.length * 3.6 + 2.5;

  // Phone
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.9);
  doc.setTextColor(2, 28, 87);
  doc.text("Phone:", fromTextX, curY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(String(config.phone || DEFAULT_ENVELOPE_CONFIG.phone).trim(), fromTextX + 11.5, curY);
  curY += 4.8;

  // Email
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 28, 87);
  doc.text("Email:", fromTextX, curY);
  curY += 3.8;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  const email1 = String(config.emailPrimary || DEFAULT_ENVELOPE_CONFIG.emailPrimary).trim();
  const email2 = String(config.emailSecondary || DEFAULT_ENVELOPE_CONFIG.emailSecondary).trim();
  if (email1) {
    doc.text(email1, fromTextX, curY);
    curY += 3.7;
  }
  if (email2) {
    doc.text(email2, fromTextX, curY);
    curY += 4.2;
  }

  // Website
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 28, 87);
  doc.text("Website:", fromTextX, curY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(29, 78, 216);
  doc.text(String(config.website || DEFAULT_ENVELOPE_CONFIG.website).trim(), fromTextX + 13.8, curY);

  // Subtle vertical divider between FROM and TO
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(113, bodyTopY, 113, bodyBottomY);

  // ==========================================
  // CENTER ZONE: TO SECTION (Blank when no recipient; auto-filled when customer row selected)
  // ==========================================
  const toX = 120;
  const toMaxW = 104;
  let toY = bodyTopY + 3.0;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text("TO", toX, toY);

  const recCompany = String(recipient?.companyName || "").trim();
  const recContact = String(recipient?.contactPerson || "").trim();
  const recAddress = String(recipient?.address || "").trim();
  const recPhone = String(recipient?.phone || "").trim();

  if (recCompany || recContact || recAddress || recPhone) {
    toY += 6.5;
    if (recCompany) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(2, 28, 87);
      const compLines = doc.splitTextToSize(recCompany, toMaxW);
      doc.text(compLines, toX, toY, { lineHeightFactor: 1.25 });
      toY += compLines.length * 4.8 + 2.0;
    }
    if (recContact && recContact.toLowerCase() !== recCompany.toLowerCase()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.8);
      doc.setTextColor(51, 65, 85);
      doc.text(`Attn: ${recContact}`, toX, toY);
      toY += 5.0;
    }
    if (recAddress) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(30, 41, 59);
      const recAddrLines = doc.splitTextToSize(recAddress, toMaxW);
      doc.text(recAddrLines, toX, toY, { lineHeightFactor: 1.38 });
      toY += recAddrLines.length * 4.4 + 3.0;
    }
    if (recPhone) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.8);
      doc.setTextColor(2, 28, 87);
      doc.text("Phone:", toX, toY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(recPhone, toX + 13, toY);
    }
  }

  // ==========================================
  // RIGHT ZONE: QR CODE AREA (32 mm x 32 mm)
  // ==========================================
  const qrX = widthMm - marginX - qrSizeMm; // 236 mm
  const qrY = 47.5;

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
  const qrCenterX = qrX + qrSizeMm / 2; // 252 mm
  let curQrTextY = qrY + qrSizeMm + 3.2; // 82.7 mm

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(2, 28, 87);
  doc.text("SCAN TO VERIFY", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 3.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.3);
  doc.setTextColor(29, 78, 216);
  doc.text("CALIBRATION CERTIFICATES", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 3.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.4);
  doc.setTextColor(71, 85, 105);
  doc.text("NABL CC-4313  \u2022  ISO/IEC 17025", qrCenterX, curQrTextY, { align: "center" });

  curQrTextY += 2.6;
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text("ARCL Instruments Pvt. Ltd.", qrCenterX, curQrTextY, { align: "center" });

  // ==========================================
  // FOOTER SERVICES SECTION (Matching User Image 2)
  // Calibration | Service | Sales | Spares | Manufacturing
  // ==========================================
  const footerBoxX = marginX; // 12 mm
  const footerBoxY = 100.5; // 100.5 mm
  const footerBoxW = widthMm - marginX * 2; // 256 mm
  const footerBoxH = 8.8; // 8.8 mm

  // Orange framed box with rounded corners
  doc.setDrawColor(245, 130, 32); // #F58220 Image 2 orange
  doc.setLineWidth(0.65);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(footerBoxX, footerBoxY, footerBoxW, footerBoxH, 1.8, 1.8, "S");
  } else {
    doc.rect(footerBoxX, footerBoxY, footerBoxW, footerBoxH, "S");
  }

  // Render 5 services with orange vertical pipe dividers
  const services = Array.isArray(config.footerServices) && config.footerServices.length > 0
    ? config.footerServices
    : ["Calibration", "Service", "Sales", "Spares", "Manufacturing"];

  const totalSlots = services.length;
  const slotW = footerBoxW / totalSlots;
  const textBaselineY = footerBoxY + 5.8;

  services.forEach((serviceName, idx) => {
    const slotCenterX = footerBoxX + slotW * idx + slotW / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.0);
    doc.setTextColor(2, 28, 87); // #021C57 Navy
    doc.text(String(serviceName).trim(), slotCenterX, textBaselineY, { align: "center" });

    // Draw vertical orange divider pipe between items
    if (idx < totalSlots - 1) {
      const dividerX = footerBoxX + slotW * (idx + 1);
      doc.setDrawColor(245, 130, 32);
      doc.setLineWidth(0.55);
      doc.line(dividerX, footerBoxY + 1.6, dividerX, footerBoxY + footerBoxH - 1.6);
    }
  });

  // ==========================================
  // CUSTOMER COURTESY & THANK YOU SECTION (Marked Area)
  // ==========================================
  const thankTitle = String(
    config.footerThankYouTitle || DEFAULT_ENVELOPE_CONFIG.footerThankYouTitle
  ).trim();
  const thankSub = String(
    config.footerThankYouSubtitle || DEFAULT_ENVELOPE_CONFIG.footerThankYouSubtitle
  ).trim();
  const centerPageX = widthMm / 2; // 140 mm

  if (thankTitle) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.1);
    doc.setTextColor(2, 28, 87); // #021C57 Navy
    doc.text(thankTitle, centerPageX, 113.8, { align: "center" });
  }

  if (thankSub) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.9);
    doc.setTextColor(71, 85, 105); // #475569 Slate
    doc.text(thankSub, centerPageX, 117.4, { align: "center" });
  }

  // Bottom framing bar (Accent Orange + Corporate Navy)
  doc.setFillColor(245, 130, 32);
  doc.rect(0, heightMm - 3.4, widthMm, 0.8, "F");
  doc.setFillColor(2, 28, 87);
  doc.rect(0, heightMm - 2.6, widthMm, 2.6, "F");

  return doc;
};

export const downloadEnvelopePdf = async (opts = {}, fileName = "ARCL_Instruments_Envelope_280x124mm.pdf") => {
  const doc = await buildEnvelopePdfDocument(opts);
  doc.save(fileName);
  return doc;
};

export const getEnvelopePdfBlobUrl = async (opts = {}) => {
  const doc = await buildEnvelopePdfDocument(opts);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
};
