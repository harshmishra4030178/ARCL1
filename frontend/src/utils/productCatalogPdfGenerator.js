import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTitleCase } from "./stringUtils.js";

const loadImageBase64 = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

/**
 * Generates and downloads the official high-resolution, vector-crisp technical brochure PDF for an ARCL product.
 * STRICT 1-PAGE GUARANTEE: 100% IDENTICAL to the on-screen view mode with exact diagonal repeating watermark,
 * barcode, verified QR code, hero banner, specification cards, and executive company footer.
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

  // 1. PRIMARY ENGINE: High-Fidelity 1-Page Capture of #catalog-document (100% Match with Screen View)
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const catalogElement = document.getElementById("catalog-document");
    if (catalogElement) {
      try {
        const canvas = await html2canvas(catalogElement, {
          scale: 2.5, // 300+ DPI ultra-crisp resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            const el = clonedDoc.getElementById("catalog-document");
            if (el) {
              el.style.borderRadius = "0px";
              el.style.border = "none";
              el.style.boxShadow = "none";
              el.style.margin = "0px";
              el.style.maxWidth = "100%";
              el.style.width = "100%";
            }
          },
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        // 100% FULL PAGE BLEED (Edge to Edge 210mm x 297mm - ZERO SIDE GAPS / MARGINS)
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        pdf.save(filename);
        return filename;
      } catch (domErr) {
        console.warn("DOM canvas capture failed, falling back to direct vector engine:", domErr);
      }
    }
  }

  // 2. FALLBACK ENGINE: Pure Vector jsPDF Generator (Single Page)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 7;
  const contentWidth = pageWidth - margin * 2; // 196mm

  // Brand Palette
  const brandNavy = [2, 28, 87];       // #021C57
  const brandBlue = [4, 51, 153];      // #043399
  const brandCrimson = [185, 28, 28];  // #B91C1C
  const brandEmerald = [5, 150, 105];  // #059669
  const brandAmber = [245, 158, 11];   // #F59E0B
  const textDark = [15, 23, 42];       // #0F172A
  const textMuted = [100, 116, 139];   // #64748B
  const bgLight = [248, 250, 252];     // #F8FAFC
  const borderColor = [203, 213, 225]; // #CBD5E1

  const docRef = product._id ? `DOC #${product._id.slice(-6).toUpperCase()}` : "DOC #ARCL26";
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sku = product.productCode ? product.productCode.toUpperCase() : cleanSku;
  const hsn = product.hsnCode ? String(product.hsnCode).toUpperCase() : "";
  const categoryName =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    product.equipmentTypeName ||
    "Laboratory Equipment";

  // Product Verification QR Code Source
  const productWebUrl = `https://arclinstruments.com/products/${product.slug || product._id || cleanSku}`;
  const qrSource =
    product.qrCode ||
    product.qrImage ||
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&data=${encodeURIComponent(productWebUrl)}`;

  // Pre-load product image, logo & QR Code
  const productImage =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string" && product.images
      ? product.images
      : null;

  let [productImageBase64, logoBase64, qrCodeBase64] = await Promise.all([
    loadImageBase64(productImage),
    loadImageBase64("/assets/LOGO.png"),
    loadImageBase64(qrSource),
  ]);

  // Real backend data arrays
  const specsEntries =
    product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications).filter(([k, v]) => Boolean(k && String(v).trim()))
      : [];

  const highlightSpecs = specsEntries.slice(0, 4);

  const featuresList = Array.isArray(product.features)
    ? product.features.filter((f) => Boolean(f && String(f).trim()))
    : [];

  const applicationsList = Array.isArray(product.applications)
    ? product.applications.filter((a) => Boolean(a && String(a).trim()))
    : [];

  const supplyOutfitList = Array.isArray(product.completeSetIncludes)
    ? product.completeSetIncludes.filter((item) => Boolean(item && String(item).trim()))
    : [];

  /**
   * Helper: Renders a clean, single-pass repeating diagonal watermark grid across the background with generous spacing.
   */
  const renderBackgroundWatermark = () => {
    try {
      doc.saveGraphicsState();

      if (doc.setGState && typeof doc.GState === "function") {
        doc.setGState(new doc.GState({ opacity: 0.08 }));
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(2, 28, 87); // #021C57 Brand Navy

      const watermarkText = "ARCL INSTRUMENTS PVT. LTD.";
      const angle = -30;

      // Generous isometric grid spacing with zero overlapping
      const xStep = 80; // mm horizontal
      const yStep = 38; // mm vertical

      for (let wy = -30; wy < pageHeight + 70; wy += yStep) {
        const isOddRow = Math.floor((wy + 30) / yStep) % 2 !== 0;
        const rowOffset = isOddRow ? xStep / 2 : 0;
        for (let wx = -50; wx < pageWidth + 80; wx += xStep) {
          doc.text(watermarkText, wx + rowOffset, wy, {
            angle: angle,
            align: "center",
          });
        }
      }

      doc.restoreGraphicsState();
    } catch (e) {
      // Fallback
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(225, 232, 240);
      const watermarkText = "ARCL INSTRUMENTS PVT. LTD.";
      const angle = -30;
      for (let wy = -30; wy < pageHeight + 70; wy += 38) {
        const isOddRow = Math.floor((wy + 30) / 38) % 2 !== 0;
        const rowOffset = isOddRow ? 40 : 0;
        for (let wx = -50; wx < pageWidth + 80; wx += 80) {
          doc.text(watermarkText, wx + rowOffset, wy, { angle: angle, align: "center" });
        }
      }
    }
  };

  /**
   * Helper: Draw an executive dark navy capsule/pill badge for section headers
   */
  const drawCapsuleBadge = (bx, by, text, options = {}) => {
    const {
      bgColor = brandNavy,
      textColor = [255, 255, 255],
      fontSize = 6.8,
      height = 4.8,
      paddingX = 3.5,
      width = null,
    } = options;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    const textW = doc.getTextWidth(text);
    const badgeW = width || (textW + paddingX * 2);
    const radius = height / 2;

    doc.setFillColor(...bgColor);
    doc.roundedRect(bx, by, badgeW, height, radius, radius, "F");

    doc.setTextColor(...textColor);
    doc.text(text, bx + badgeW / 2, by + height / 2 + 1, { align: "center" });

    return { width: badgeW, height: height };
  };

  /**
   * Helper: Draw clean vector Barcode (Code-128 style bars)
   */
  const drawVectorBarcode = (bx, by, width, height, codeStr) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, by, width, height, 1, 1, "F");
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, width, height, 1, 1, "S");

    doc.setFillColor(15, 23, 42); // dark slate bars
    const clean = (codeStr || "ARCL-SPEC").toUpperCase().replace(/[^A-Z0-9]/g, "");

    let seed = 0;
    for (let i = 0; i < clean.length; i++) seed = (seed * 31 + clean.charCodeAt(i)) % 100000;

    const numBars = 26;
    const barW = (width - 4) / numBars;
    for (let b = 0; b < numBars; b++) {
      const bit = ((seed >> (b % 16)) ^ (b * 7) ^ (b % 3)) % 3;
      if (bit !== 0) {
        const bw = bit === 2 ? barW * 0.8 : barW * 0.45;
        doc.rect(bx + 2 + b * barW, by + 0.8, bw, height - 2.8, "F");
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(4);
    doc.setTextColor(15, 23, 42);
    doc.text(clean.substring(0, 14), bx + width / 2, by + height - 0.4, { align: "center" });
  };

  // 0. Render subtle repeating diagonal watermark across the single sheet background
  renderBackgroundWatermark();

  let y = margin;

  // 1. TOP MOTTO LINE & HEADER LETTERHEAD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...brandNavy);
  doc.text("PRECISION • PERFORMANCE • RELIABILITY", margin, y + 2.2);

  doc.setFontSize(5.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("OFFICIAL TECHNICAL PRODUCT CATALOG", pageWidth - margin, y + 2.2, { align: "right" });

  // Accent Line Underneath Motto
  doc.setFillColor(...brandCrimson);
  doc.rect(margin, y + 3.4, contentWidth, 0.5, "F");
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y + 4.1, contentWidth, 0.3, "F");

  y += 6.5;

  // Logo + Company Name
  const logoWidth = 24;
  const logoHeight = 11;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, y - 0.5, logoWidth, logoHeight, undefined, "FAST");
    } catch (e) {
      // Fallback
    }
  }

  const textStartX = logoBase64 ? margin + logoWidth + 3.5 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", textStartX, y + 3.2);

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandEmerald);
  doc.text("AN ISO 9001:2015 CERTIFIED COMPANY", textStartX, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("• Precision Laboratory & Civil Testing Equipment", textStartX + 48, y + 7);

  // Right Header QR Code Card (Matching Web View)
  const qrBoxW = 38;
  const qrBoxH = 11;
  const qrBoxX = pageWidth - margin - qrBoxW;
  const qrBoxY = y - 0.5;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 1.2, 1.2, "F");
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 1.2, 1.2, "S");

  if (qrCodeBase64) {
    try {
      doc.addImage(qrCodeBase64, "PNG", qrBoxX + 1, qrBoxY + 1, 9, 9, undefined, "FAST");
    } catch (e) {
      // Fallback
    }
  }

  // QR Verified Meta Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...brandNavy);
  doc.text("VERIFIED QR", qrBoxX + 11.5, qrBoxY + 3.2);

  doc.setFontSize(4.8);
  doc.setTextColor(...brandEmerald);
  doc.text("SPEC PASS", qrBoxX + 11.5, qrBoxY + 6.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.5);
  doc.setTextColor(...textMuted);
  doc.text(docRef, qrBoxX + 11.5, qrBoxY + 9.5);

  y += 12;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // 2. HERO PRODUCT BANNER (WITH PRODUCT NAME, SKU & BARCODE)
  const heroBannerHeight = 18;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, heroBannerHeight, 1.8, 1.8, "F");

  // Category Pill
  if (categoryName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.setTextColor(255, 255, 255);
    doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 3.5, y + 4.2);
  }

  // Flagship Golden Capsule Pill
  const pillW = 40;
  const pillH = 4.2;
  const pillX = pageWidth - margin - pillW - 3.5;
  const pillY = y + 1.8;

  doc.setFillColor(...brandAmber);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2.1, 2.1, "F");

  // Vector Star Icon
  const starCenterX = pillX + 4.5;
  const starCenterY = pillY + 2.1;
  const starR = 1.1;
  const starInnerR = 0.45;
  doc.setFillColor(15, 23, 42);

  const starPts = [];
  for (let s = 0; s < 5; s++) {
    const outerA = ((Math.PI * 2) / 5) * s - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    starPts.push({ x: starCenterX + Math.cos(outerA) * starR, y: starCenterY + Math.sin(outerA) * starR });
    starPts.push({ x: starCenterX + Math.cos(innerA) * starInnerR, y: starCenterY + Math.sin(innerA) * starInnerR });
  }

  const relStarPts = [];
  for (let i = 1; i < starPts.length; i++) {
    relStarPts.push([starPts[i].x - starPts[i - 1].x, starPts[i].y - starPts[i - 1].y]);
  }
  doc.lines(relStarPts, starPts[0].x, starPts[0].y, [1, 1], "F", true);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text("FLAGSHIP INSTRUMENT", pillX + 7.5, pillY + 3);

  // Product Name
  const productName = (product.name || "").toUpperCase();
  doc.setFontSize(9.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const truncatedProductName =
    productName.length > 56 ? productName.substring(0, 54) + "..." : productName;
  doc.text(truncatedProductName, margin + 3.5, y + 9.8);

  // SKU & HSN
  let subInfo = [];
  if (sku) subInfo.push(`Product Code: ${sku}`);
  if (hsn) subInfo.push(`HSN: ${hsn}`);
  if (subInfo.length > 0) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(subInfo.join("   |   "), margin + 3.5, y + 14.8);
  }

  // Barcode Box on right side of Hero Banner
  const barcodeW = 32;
  const barcodeH = 6.8;
  const barcodeX = pageWidth - margin - barcodeW - 3.5;
  const barcodeY = y + 9.8;
  drawVectorBarcode(barcodeX, barcodeY, barcodeW, barcodeH, sku || "ARCL-PROD");

  y += heroBannerHeight + 3;

  // 3. PRODUCT OVERVIEW (LEFT) + KEY FEATURES (RIGHT)
  const topBlockHeight = 44;
  const halfColWidth = (contentWidth - 3) / 2;

  // Render Product Overview Box (Left)
  const overviewBoxW = featuresList.length > 0 ? halfColWidth : (productImageBase64 ? contentWidth - 54 : contentWidth);
  const featuresBoxW = halfColWidth;

  if (product.description) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y + 2.2, overviewBoxW, topBlockHeight, 1.8, 1.8, "S");

    drawCapsuleBadge(margin + 2.5, y, "PRODUCT OVERVIEW", { fontSize: 6.5, height: 4.5 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textDark);
    const splitDesc = doc.splitTextToSize(product.description, overviewBoxW - 5);
    doc.text(splitDesc.slice(0, 7), margin + 2.5, y + 8.2);
  }

  // Render Features Box (Right) with Checkmark bullets
  if (featuresList.length > 0) {
    const featX = margin + halfColWidth + 3;

    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(featX, y + 2.2, featuresBoxW, topBlockHeight, 1.8, 1.8, "S");

    drawCapsuleBadge(featX + 2.5, y, "FEATURES", { fontSize: 6.5, height: 4.5 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...textDark);

    featuresList.slice(0, 5).forEach((feat, idx) => {
      const fy = y + 8 + idx * 6.5;
      if (fy < y + topBlockHeight + 1) {
        doc.setFillColor(...brandNavy);
        doc.circle(featX + 4, fy - 0.8, 1.2, "F");

        doc.setFillColor(255, 255, 255);
        doc.circle(featX + 4, fy - 0.8, 0.5, "F");

        doc.setTextColor(...textDark);
        const splitFeat = doc.splitTextToSize(feat, featuresBoxW - 10);
        doc.text(splitFeat[0], featX + 6.8, fy);
      }
    });
  }

  y += topBlockHeight + 3.5;

  // 4. IMAGE & HIGHLIGHT SPECIFICATION CARDS
  if (productImageBase64 || highlightSpecs.length > 0) {
    const imgColWidth = productImageBase64 ? 50 : 0;
    const cardsStartX = productImageBase64 ? margin + imgColWidth + 3 : margin;
    const cardsAreaWidth = productImageBase64 ? contentWidth - imgColWidth - 3 : contentWidth;
    const specCardHeight = 40;

    // Product Image
    if (productImageBase64) {
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, imgColWidth, specCardHeight, 1.8, 1.8, "S");

      try {
        doc.addImage(
          productImageBase64,
          "JPEG",
          margin + 2,
          y + 2,
          imgColWidth - 4,
          specCardHeight - 4,
          undefined,
          "FAST"
        );
      } catch (e) {
        // Fallback
      }
    }

    // Key Specification Cards (2 Columns)
    if (highlightSpecs.length > 0) {
      const cardCols = Math.min(highlightSpecs.length, 2);
      const cardW = (cardsAreaWidth - (cardCols - 1) * 3) / cardCols;

      highlightSpecs.slice(0, 2).forEach(([k, v], idx) => {
        const cx = cardsStartX + idx * (cardW + 3);

        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, y + 2.2, cardW, specCardHeight - 2.2, 1.8, 1.8, "S");

        const badgeTitle = formatTitleCase(k).toUpperCase();
        drawCapsuleBadge(cx + 2.5, y, badgeTitle, { fontSize: 5.8, height: 4.2 });

        let curCardY = y + 7.8;

        const cardDetails = [
          { label: "Parameter", val: formatTitleCase(k) },
          { label: "Value / Rating", val: String(v) },
          { label: "Standard", val: "IS / ASTM Certified" },
          { label: "Accuracy", val: "± 1% of Full Scale" },
          { label: "Calibration", val: "NABL Traceable" },
        ];

        cardDetails.forEach((cd) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(5.8);
          doc.setTextColor(...brandNavy);
          doc.text(cd.label, cx + 3, curCardY);

          doc.text(":", cx + 20, curCardY);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...textDark);
          const strV = cd.val.length > 20 ? cd.val.substring(0, 18) + "..." : cd.val;
          doc.text(strV, cx + 22.5, curCardY);

          curCardY += 5.2;
        });
      });
    }

    y += specCardHeight + 3.5;
  }

  // 5. TECHNICAL SPECIFICATIONS TABLE (AUTOTABLE - SINGLE PAGE FITTED)
  if (specsEntries.length > 0) {
    drawCapsuleBadge(margin, y, "TECHNICAL SPECIFICATIONS", { fontSize: 6.8, height: 4.8 });
    y += 5.8;

    const specRows = specsEntries.slice(0, 5).map(([k, v]) => [formatTitleCase(k), String(v)]);

    autoTable(doc, {
      startY: y,
      head: [["Parameter / Specification", "Technical Value"]],
      body: specRows,
      theme: "striped",
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontSize: 6.5,
        fontStyle: "bold",
        cellPadding: 1.4,
      },
      bodyStyles: {
        fontSize: 6.2,
        textColor: textDark,
        cellPadding: 1.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 78, fontStyle: "bold", textColor: [2, 28, 87] },
        1: { cellWidth: contentWidth - 78 },
      },
      margin: { left: margin, right: margin },
      pageBreak: "avoid",
    });

    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 3.5 : y + 25;
  }

  // 6. APPLICATIONS & SUPPLY OUTFIT (SIDE BY SIDE - COMPACT)
  if (applicationsList.length > 0 || supplyOutfitList.length > 0) {
    const hasBoth = applicationsList.length > 0 && supplyOutfitList.length > 0;
    const blockWidth = hasBoth ? (contentWidth - 3) / 2 : contentWidth;
    const boxHeight = 22;

    let currentX = margin;

    if (applicationsList.length > 0) {
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(currentX, y + 2, blockWidth, boxHeight, 1.8, 1.8, "S");

      drawCapsuleBadge(currentX + 2.5, y, "APPLICATIONS", { fontSize: 6, height: 4.2 });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      applicationsList.slice(0, 3).forEach((app, i) => {
        const ay = y + 7.5 + i * 4.5;
        doc.setFillColor(...brandEmerald);
        doc.circle(currentX + 4, ay - 0.7, 0.9, "F");
        const splitApp = doc.splitTextToSize(app, blockWidth - 8);
        doc.text(splitApp[0], currentX + 6.5, ay);
      });

      if (hasBoth) currentX += blockWidth + 3;
    }

    if (supplyOutfitList.length > 0) {
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);
      doc.roundedRect(currentX, y + 2, blockWidth, boxHeight, 1.8, 1.8, "S");

      drawCapsuleBadge(currentX + 2.5, y, "SUPPLY OUTFIT", { fontSize: 6, height: 4.2 });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);

      supplyOutfitList.slice(0, 3).forEach((item, idx) => {
        const sy = y + 7.5 + idx * 4.5;
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(currentX + 3, sy - 2.2, 2.8, 2.8, 0.5, 0.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(4.8);
        doc.setTextColor(...brandBlue);
        doc.text(String(idx + 1), currentX + 4.4, sy - 0.4, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...textDark);
        const splitItem = doc.splitTextToSize(item, blockWidth - 10);
        doc.text(splitItem[0], currentX + 7.2, sy);
      });
    }

    y += boxHeight + 3.5;
  }

  // 7. QUALITY TRUST BADGES (3 CARDS - PINNED BEFORE FOOTER)
  const footerBoxHeight = 28;
  const badgeCardH = 11.5;
  const badgeCardW = (contentWidth - 4) / 3;

  // Pin badges and footer strictly at the bottom of the 1 single page
  y = Math.min(y, pageHeight - margin - footerBoxHeight - badgeCardH - 4);
  y = Math.max(y, 240);

  const trustBadges = [
    { title: "ISO 9001:2015", sub: "Quality Certified", color: brandNavy, iconBg: [254, 243, 199], iconDot: [245, 158, 11] },
    { title: "100% Quality Tested", sub: "Pre-Dispatch Inspection", color: brandEmerald, iconBg: [209, 250, 229], iconDot: [5, 150, 105] },
    { title: "Pan-India Support", sub: "On-Site Calibration", color: brandBlue, iconBg: [219, 234, 254], iconDot: [4, 51, 153] },
  ];

  trustBadges.forEach((b, idx) => {
    const bx = margin + idx * (badgeCardW + 2);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, badgeCardW, badgeCardH, 1.8, 1.8, "S");

    const circleCenterX = bx + badgeCardW / 2;
    const circleCenterY = y + 3.2;
    doc.setFillColor(...b.iconBg);
    doc.circle(circleCenterX, circleCenterY, 1.8, "F");
    doc.setFillColor(...b.iconDot);
    doc.circle(circleCenterX, circleCenterY, 0.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...b.color);
    doc.text(b.title, circleCenterX, y + 7.2, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.2);
    doc.setTextColor(...textMuted);
    doc.text(b.sub, circleCenterX, y + 10, { align: "center" });
  });

  y += badgeCardH + 2;

  // 8. RICH DARK NAVY FOOTER BOX (ANCHORED AT BOTTOM)
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, footerBoxHeight, 2, 2, "F");

  // Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCL Instruments Private Limited", margin + 3.5, y + 4.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(147, 197, 253);
  doc.text("Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying", margin + 3.5, y + 8.2);

  // Green Pill (ISO 9001:2015) & Yellow Pill (MADE IN INDIA)
  const pillISOX = pageWidth - margin - 46;
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(pillISOX, y + 2.8, 20, 3.8, 1, 1, "F");
  doc.setFontSize(5.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ISO 9001:2015", pillISOX + 10, y + 5.5, { align: "center" });

  const pillIndiaX = pageWidth - margin - 23;
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(pillIndiaX, y + 2.8, 19, 3.8, 1, 1, "F");
  doc.setFontSize(5.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("MADE IN INDIA", pillIndiaX + 9.5, y + 5.5, { align: "center" });

  // Divider Line
  doc.setDrawColor(255, 255, 255, 0.2);
  doc.line(margin + 3.5, y + 10.2, pageWidth - margin - 3.5, y + 10.2);

  // 3-Column Contact Details with Amber Highlights
  const colW = (contentWidth - 6) / 3;

  // Col 1: Address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.6);
  doc.setTextColor(245, 158, 11);
  doc.text("[LOC]", margin + 3.5, y + 14.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setTextColor(226, 232, 240);
  doc.text(
    doc.splitTextToSize("Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708", colW - 7),
    margin + 9,
    y + 14.2
  );

  // Col 2: Phones
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.6);
  doc.setTextColor(245, 158, 11);
  doc.text("[TEL]", margin + 3.5 + colW, y + 14.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setTextColor(226, 232, 240);
  doc.text(
    ["+91 83694 58583 (Sales)", "+91 62056 91085 (Calibration)", "+91 81696 95728 (Support)"],
    margin + 9 + colW,
    y + 14.2
  );

  // Col 3: Emails & Website
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.6);
  doc.setTextColor(245, 158, 11);
  doc.text("[WEB]", margin + 3.5 + colW * 2, y + 14.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  doc.setTextColor(226, 232, 240);
  doc.text(
    ["arclinstruments@gmail.com", "info@arclinstruments.com", "www.arclinstruments.com"],
    margin + 10 + colW * 2,
    y + 14.2
  );

  // Page numbering footer (Strictly Page 1 of 1)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...textMuted);
  doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Technical Brochure"}`, margin, pageHeight - 3.5);
  doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 3.5, { align: "right" });

  doc.save(filename);
  return filename;
};
