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
 * Generates and downloads the official high-resolution technical brochure PDF for an ARCL product.
 * DENSE & BOTTOM-ANCHORED: Executive layout matching official ARCL standards with repeating watermark,
 * official Product QR Code & Barcode, dark navy capsule badges, clean key-value specification cards,
 * features checkmarks, and company footer.
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

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 8;
  const contentWidth = pageWidth - margin * 2; // 194mm

  // Bottom footer allocation: Trust Badges (13.5mm) + Gap (2.5mm) + Company Footer (31mm) + Margin (4.5mm) = ~51.5mm
  const totalFooterHeight = 49;
  const bottomFooterAnchorY = pageHeight - margin - totalFooterHeight; // 297 - 8 - 49 = 240mm
  const maxContentY = bottomFooterAnchorY - 3; // 237mm

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
    "";

  // Product Verification QR Code Source (Uses product.qrCode or dynamic scannable product link)
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

  const howItWorksText = product.category?.howItWorks || product.howItWorks || "";
  const howItWorksSteps = Array.isArray(product.category?.howItWorksSteps)
    ? product.category.howItWorksSteps.filter((s) => Boolean(s && (s.title || s.description)))
    : Array.isArray(product.howItWorksSteps)
    ? product.howItWorksSteps.filter((s) => Boolean(s && (s.title || s.description)))
    : [];

  const supplyOutfitList = Array.isArray(product.completeSetIncludes)
    ? product.completeSetIncludes.filter((item) => Boolean(item && String(item).trim()))
    : [];

  let y = margin;

  /**
   * Helper: Renders a crisp, highly visible yet elegant repeating diagonal watermark grid.
   * Text: "ARCL INSTRUMENTS PVT. LTD."
   * Renders in light slate-steel color [210, 220, 232] so it is visible in ALL PDF viewers without fading.
   */
  const renderBackgroundWatermark = () => {
    try {
      doc.saveGraphicsState();

      if (doc.setGState && typeof doc.GState === "function") {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(2, 28, 87); // #021C57 Brand Navy

      const watermarkText = "ARCL INSTRUMENTS PVT. LTD.";
      const angle = -32;

      // Staggered isometric grid spacing
      const xStep = 68; // mm horizontal
      const yStep = 28; // mm vertical

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
    }
  };

  /**
   * Helper: Draw an executive dark navy capsule/pill badge for section headers
   */
  const drawCapsuleBadge = (bx, by, text, options = {}) => {
    const {
      bgColor = brandNavy,
      textColor = [255, 255, 255],
      fontSize = 7,
      height = 5.2,
      paddingX = 4,
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
    doc.text(text, bx + badgeW / 2, by + height / 2 + 1.1, { align: "center" });

    return { width: badgeW, height: height };
  };

  /**
   * Helper: Draw clean vector Barcode (Code-128 style bars)
   */
  const drawVectorBarcode = (bx, by, width, height, codeStr) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, by, width, height, 1, 1, "F");
    doc.setDrawColor(203, 213, 225);
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
        doc.rect(bx + 2 + b * barW, by + 1, bw, height - 3.2, "F");
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.2);
    doc.setTextColor(15, 23, 42);
    doc.text(clean.substring(0, 14), bx + width / 2, by + height - 0.5, { align: "center" });
  };

  // FULL OFFICIAL LETTERHEAD (IDENTICAL ON PAGE 1, PAGE 2, PAGE 3)
  const renderOfficialLetterhead = () => {
    // Top Motto Line: PRECISION • PERFORMANCE • RELIABILITY
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...brandNavy);
    doc.text("PRECISION. PERFORMANCE. RELIABILITY.", margin, y + 2.5);

    // Top Red & Navy Dual Accent Bar
    doc.setFillColor(...brandCrimson);
    doc.rect(margin + 58, y + 1.2, contentWidth - 58, 1.2, "F");
    doc.setFillColor(...brandNavy);
    doc.rect(margin, y + 3.8, contentWidth, 0.8, "F");

    y += 6.5;

    // Logo + Company Name
    const logoWidth = 26;
    const logoHeight = 12;
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, y - 0.5, logoWidth, logoHeight, undefined, "FAST");
      } catch (e) {
        // Fallback
      }
    }

    const textStartX = logoBase64 ? margin + logoWidth + 4 : margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...brandNavy);
    doc.text("ARCL INSTRUMENTS PVT. LTD.", textStartX, y + 3.5);

    doc.setFontSize(7.2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandEmerald);
    doc.text("AN ISO 9001:2015 CERTIFIED COMPANY", textStartX, y + 7.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
    doc.text("• Precision Laboratory & Civil Testing Equipment", textStartX + 52, y + 7.5);

    // Right Header QR Code & Barcode Verification Card
    const qrBoxW = 42;
    const qrBoxH = 12;
    const qrBoxX = pageWidth - margin - qrBoxW;
    const qrBoxY = y - 0.5;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 1.5, 1.5, "F");
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 1.5, 1.5, "S");

    if (qrCodeBase64) {
      try {
        doc.addImage(qrCodeBase64, "PNG", qrBoxX + 1, qrBoxY + 1, 10, 10, undefined, "FAST");
      } catch (e) {
        // Fallback
      }
    }

    // QR Verified Meta Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(...brandNavy);
    doc.text("VERIFIED QR", qrBoxX + 12.5, qrBoxY + 3.5);

    doc.setFontSize(5);
    doc.setTextColor(...brandEmerald);
    doc.text("SPEC PASS", qrBoxX + 12.5, qrBoxY + 6.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.8);
    doc.setTextColor(...textMuted);
    doc.text(docRef, qrBoxX + 12.5, qrBoxY + 10.2);

    y += 13.5;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3.5;
  };

  // Safe Space helper for content sections
  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > maxContentY) {
      doc.addPage();
      y = margin;
      renderOfficialLetterhead();
    }
  };

  // 1. RENDER OFFICIAL LETTERHEAD ON PAGE 1
  renderOfficialLetterhead();

  // 2. HERO PRODUCT BANNER (WITH PRODUCT NAME, SKU & BARCODE)
  const heroBannerHeight = 20;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, heroBannerHeight, 2, 2, "F");

  // Category Pill
  if (categoryName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 4, y + 4.8);
  }

  // Flagship Golden Capsule Pill
  const pillW = 44;
  const pillH = 4.8;
  const pillX = pageWidth - margin - pillW - 4;
  const pillY = y + 2.2;

  doc.setFillColor(...brandAmber);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2.4, 2.4, "F");

  // Crisp Vector Star Icon
  const starCenterX = pillX + 5;
  const starCenterY = pillY + 2.4;
  const starR = 1.2;
  const starInnerR = 0.5;
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
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text("FLAGSHIP INSTRUMENT", pillX + 8.2, pillY + 3.4);

  // Product Name
  const productName = (product.name || "").toUpperCase();
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const truncatedProductName =
    productName.length > 58 ? productName.substring(0, 56) + "..." : productName;
  doc.text(truncatedProductName, margin + 4, y + 10.8);

  // SKU & HSN
  let subInfo = [];
  if (sku) subInfo.push(`Product Code: ${sku}`);
  if (hsn) subInfo.push(`HSN: ${hsn}`);
  if (subInfo.length > 0) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(subInfo.join("   |   "), margin + 4, y + 16);
  }

  // Barcode Box on right side of Hero Banner
  const barcodeW = 34;
  const barcodeH = 7.5;
  const barcodeX = pageWidth - margin - barcodeW - 4;
  const barcodeY = y + 10.5;
  drawVectorBarcode(barcodeX, barcodeY, barcodeW, barcodeH, sku || "ARCL-PROD");

  y += heroBannerHeight + 3.5;

  // 3. PRODUCT OVERVIEW (LEFT) + KEY FEATURES (RIGHT)
  const topBlockHeight = 48;
  const halfColWidth = (contentWidth - 4) / 2;

  // Render Product Overview Box (Left)
  const overviewBoxW = featuresList.length > 0 ? halfColWidth : (productImageBase64 ? contentWidth - 58 : contentWidth);
  const featuresBoxW = halfColWidth;

  if (product.description) {
    // Outer border card
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y + 2.5, overviewBoxW, topBlockHeight, 2, 2, "S");

    // Navy Capsule Badge sitting at top left
    drawCapsuleBadge(margin + 3, y, "PRODUCT OVERVIEW", { fontSize: 6.8, height: 5 });

    // Description text inside
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textDark);
    const splitDesc = doc.splitTextToSize(product.description, overviewBoxW - 6);
    doc.text(splitDesc.slice(0, 7), margin + 3, y + 9);
  }

  // Render Features Box (Right) with Checkmark bullets if present
  if (featuresList.length > 0) {
    const featX = margin + halfColWidth + 4;

    // Outer border card
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(featX, y + 2.5, featuresBoxW, topBlockHeight, 2, 2, "S");

    // Navy Capsule Badge sitting at top left
    drawCapsuleBadge(featX + 3, y, "FEATURES", { fontSize: 6.8, height: 5 });

    // Bullet items with crisp dark navy checkmarks
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(...textDark);

    featuresList.slice(0, 6).forEach((feat, idx) => {
      const fy = y + 8.5 + idx * 6.2;
      if (fy < y + topBlockHeight + 1) {
        // Dark Navy check circle icon
        doc.setFillColor(...brandNavy);
        doc.circle(featX + 4.5, fy - 0.8, 1.4, "F");

        // Tiny white check dot
        doc.setFillColor(255, 255, 255);
        doc.circle(featX + 4.5, fy - 0.8, 0.6, "F");

        doc.setTextColor(...textDark);
        const splitFeat = doc.splitTextToSize(feat, featuresBoxW - 12);
        doc.text(splitFeat[0], featX + 7.5, fy);
      }
    });
  }

  y += topBlockHeight + 4.5;

  // 4. IMAGE & HIGHLIGHT SPECIFICATION CARDS (CAPACITY / MODEL CARDS - AS IN REFERENCE IMAGE)
  if (productImageBase64 || highlightSpecs.length > 0) {
    const imgColWidth = productImageBase64 ? 54 : 0;
    const cardsStartX = productImageBase64 ? margin + imgColWidth + 3 : margin;
    const cardsAreaWidth = productImageBase64 ? contentWidth - imgColWidth - 3 : contentWidth;
    const specCardHeight = 44;

    ensureSpace(specCardHeight + 3);

    // Product Image in clean bordered card
    if (productImageBase64) {
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, imgColWidth, specCardHeight, 2, 2, "S");

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

    // Capacity / Specification highlight cards (2 Columns with navy top capsules and aligned key-values)
    if (highlightSpecs.length > 0) {
      const cardCols = Math.min(highlightSpecs.length, 2);
      const cardW = (cardsAreaWidth - (cardCols - 1) * 3) / cardCols;

      highlightSpecs.slice(0, 2).forEach(([k, v], idx) => {
        const cx = cardsStartX + idx * (cardW + 3);

        // Outer bordered card
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.4);
        doc.roundedRect(cx, y + 2.5, cardW, specCardHeight - 2.5, 2, 2, "S");

        // Navy Capsule Badge for Card Header
        const badgeTitle = formatTitleCase(k).toUpperCase();
        drawCapsuleBadge(cx + 3, y, badgeTitle, { fontSize: 6.2, height: 4.8 });

        // Structured key-value specs with aligned colons
        let curCardY = y + 8.5;

        const cardDetails = [
          { label: "Parameter", val: formatTitleCase(k) },
          { label: "Value / Rating", val: String(v) },
          { label: "Standard", val: "IS / ASTM / BS Certified" },
          { label: "Accuracy", val: "± 1% of Full Scale" },
          { label: "Calibration", val: "NABL Traceable" },
        ];

        cardDetails.forEach((cd) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.2);
          doc.setTextColor(...brandNavy);
          doc.text(cd.label, cx + 3.5, curCardY);

          doc.text(":", cx + 22, curCardY);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...textDark);
          const strV = cd.val.length > 22 ? cd.val.substring(0, 20) + "..." : cd.val;
          doc.text(strV, cx + 24.5, curCardY);

          curCardY += 5.2;
        });
      });
    }

    y += specCardHeight + 4;
  }

  // 5. TECHNICAL SPECIFICATIONS TABLE (AUTOTABLE)
  if (specsEntries.length > 0) {
    ensureSpace(24);

    // Section Capsule Badge
    drawCapsuleBadge(margin, y, "TECHNICAL SPECIFICATIONS", { fontSize: 7.2, height: 5.4 });
    y += 6.5;

    const specRows = specsEntries.map(([k, v]) => [formatTitleCase(k), String(v)]);

    autoTable(doc, {
      startY: y,
      head: [["Parameter / Specification", "Technical Value"]],
      body: specRows,
      theme: "striped",
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontSize: 7.2,
        fontStyle: "bold",
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: textDark,
        cellPadding: 1.6,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 78, fontStyle: "bold", textColor: [2, 28, 87] },
        1: { cellWidth: contentWidth - 78 },
      },
      margin: { left: margin, right: margin, top: margin + 24, bottom: totalFooterHeight + 10 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          const oldY = y;
          y = margin;
          renderOfficialLetterhead();
          y = oldY;
        }
      },
      pageBreak: "auto",
    });

    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : y + 35;
  }

  // 6. APPLICATIONS & STANDARD SUPPLY OUTFIT (SIDE BY SIDE)
  if (applicationsList.length > 0 || supplyOutfitList.length > 0) {
    const hasBoth = applicationsList.length > 0 && supplyOutfitList.length > 0;
    const blockWidth = hasBoth ? (contentWidth - 4) / 2 : contentWidth;
    const maxItems = Math.max(applicationsList.length, supplyOutfitList.length);
    const boxHeight = Math.min(maxItems * 5 + 9, 36);

    ensureSpace(boxHeight + 5);

    let currentX = margin;

    // Applications Box
    if (applicationsList.length > 0) {
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.4);
      doc.roundedRect(currentX, y + 2.5, blockWidth, boxHeight, 2, 2, "S");

      drawCapsuleBadge(currentX + 3, y, "APPLICATIONS", {
        bgColor: brandNavy,
        fontSize: 6.5,
        height: 4.8,
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      applicationsList.slice(0, 5).forEach((app, i) => {
        const ay = y + 8.5 + i * 5;
        doc.setFillColor(...brandEmerald);
        doc.circle(currentX + 4.5, ay - 0.8, 1, "F");
        const splitApp = doc.splitTextToSize(app, blockWidth - 9);
        doc.text(splitApp[0], currentX + 7, ay);
      });

      if (hasBoth) currentX += blockWidth + 4;
    }

    // Supply Outfit Box
    if (supplyOutfitList.length > 0) {
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.4);
      doc.roundedRect(currentX, y + 2.5, blockWidth, boxHeight, 2, 2, "S");

      drawCapsuleBadge(currentX + 3, y, "SUPPLY OUTFIT", {
        bgColor: brandNavy,
        fontSize: 6.5,
        height: 4.8,
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      supplyOutfitList.slice(0, 5).forEach((item, idx) => {
        const sy = y + 8.5 + idx * 5;
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(currentX + 3.5, sy - 2.6, 3.2, 3.2, 0.6, 0.6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.2);
        doc.setTextColor(...brandBlue);
        doc.text(String(idx + 1), currentX + 5.1, sy - 0.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...textDark);
        const splitItem = doc.splitTextToSize(item, blockWidth - 11);
        doc.text(splitItem[0], currentX + 8.2, sy);
      });
    }

    y += boxHeight + 4.5;
  }

  // 7. HOW IT WORKS / WORKING PRINCIPLE
  if (howItWorksText || howItWorksSteps.length > 0) {
    ensureSpace(24);

    drawCapsuleBadge(margin, y, "WORKING PRINCIPLE & PROCEDURE", { fontSize: 7, height: 5.2 });
    y += 6.5;

    if (howItWorksText) {
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(margin, y, contentWidth, 9.5, 1.5, 1.5, "F");
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(margin, y, contentWidth, 9.5, 1.5, 1.5, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.6);
      doc.setTextColor(...brandNavy);
      const splitHow = doc.splitTextToSize(howItWorksText, contentWidth - 6);
      doc.text(splitHow.slice(0, 2), margin + 3, y + 4);
      y += 11.5;
    }

    if (howItWorksSteps.length > 0) {
      const stepWidth = (contentWidth - 4) / 2;
      const stepHeight = 14.5;

      howItWorksSteps.slice(0, 4).forEach((st, idx) => {
        ensureSpace(stepHeight + 2);
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const sx = margin + col * (stepWidth + 4);
        const sy = y + row * (stepHeight + 2.5);

        doc.setDrawColor(...borderColor);
        doc.roundedRect(sx, sy, stepWidth, stepHeight, 1.5, 1.5, "S");

        doc.setFillColor(...brandNavy);
        doc.roundedRect(sx + 2.5, sy + 2.5, 3.8, 3.8, 0.8, 0.8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.8);
        doc.setTextColor(255, 255, 255);
        doc.text(String(st.stepNumber || idx + 1), sx + 4.4, sy + 5.2, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        doc.setTextColor(...brandNavy);
        doc.text(st.title || "Procedure Step", sx + 7.5, sy + 5.2);

        if (st.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.2);
          doc.setTextColor(...textDark);
          const splitDesc = doc.splitTextToSize(st.description, stepWidth - 6);
          doc.text(splitDesc.slice(0, 2), sx + 2.5, sy + 9.5);
        }
      });

      y += Math.ceil(Math.min(howItWorksSteps.length, 4) / 2) * (stepHeight + 2.5) + 3.5;
    }
  }

  // 8. QUALITY TRUST BADGES (3 CARDS) & COMPANY CONTACT FOOTER (ANCHORED AT BOTTOM)
  if (y > bottomFooterAnchorY) {
    doc.addPage();
    y = margin;
    renderOfficialLetterhead();
  }

  // Pin footer to bottom of current page
  y = Math.max(y, bottomFooterAnchorY);

  const badgeCardW = (contentWidth - 6) / 3;
  const badgeCardH = 13.5;

  const trustBadges = [
    { title: "ISO 9001:2015", sub: "Quality Certified", color: brandNavy, iconBg: [254, 243, 199], iconDot: [245, 158, 11] },
    { title: "100% Quality Tested", sub: "Pre-Dispatch Inspection", color: brandEmerald, iconBg: [209, 250, 229], iconDot: [5, 150, 105] },
    { title: "Pan-India Support", sub: "On-Site Calibration", color: brandBlue, iconBg: [219, 234, 254], iconDot: [4, 51, 153] },
  ];

  trustBadges.forEach((b, idx) => {
    const bx = margin + idx * (badgeCardW + 3);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(bx, y, badgeCardW, badgeCardH, 2, 2, "S");

    // Circular Icon Badge
    const circleCenterX = bx + badgeCardW / 2;
    const circleCenterY = y + 3.6;
    doc.setFillColor(...b.iconBg);
    doc.circle(circleCenterX, circleCenterY, 2, "F");
    doc.setFillColor(...b.iconDot);
    doc.circle(circleCenterX, circleCenterY, 0.9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...b.color);
    doc.text(b.title, circleCenterX, y + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.6);
    doc.setTextColor(...textMuted);
    doc.text(b.sub, circleCenterX, y + 11.2, { align: "center" });
  });

  y += badgeCardH + 2.5;

  // Rich Dark Navy Footer Box
  const footerBoxHeight = 31;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, footerBoxHeight, 2.5, 2.5, "F");

  // Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCL Instruments Private Limited", margin + 4, y + 5.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(147, 197, 253); // #93C5FD
  doc.text("Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying", margin + 4, y + 9);

  // Green Pill (ISO 9001:2015) & Yellow Pill (MADE IN INDIA)
  const pillISOX = pageWidth - margin - 48;
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(pillISOX, y + 3.2, 22, 4.2, 1, 1, "F");
  doc.setFontSize(5.6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ISO 9001:2015", pillISOX + 11, y + 6.2, { align: "center" });

  const pillIndiaX = pageWidth - margin - 24;
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(pillIndiaX, y + 3.2, 20, 4.2, 1, 1, "F");
  doc.setFontSize(5.6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("MADE IN INDIA", pillIndiaX + 10, y + 6.2, { align: "center" });

  // Divider Line
  doc.setDrawColor(255, 255, 255, 0.2);
  doc.line(margin + 4, y + 11.2, pageWidth - margin - 4, y + 11.2);

  // 3-Column Contact Details with Amber Highlights
  const colW = (contentWidth - 8) / 3;

  // Col 1: Address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(245, 158, 11);
  doc.text("[LOC]", margin + 4, y + 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(226, 232, 240);
  doc.text(
    doc.splitTextToSize("Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708", colW - 8),
    margin + 10,
    y + 15.5
  );

  // Col 2: Phones
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(245, 158, 11);
  doc.text("[TEL]", margin + 4 + colW, y + 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(226, 232, 240);
  doc.text(
    ["+91 83694 58583 (Sales)", "+91 62056 91085 (Calibration)", "+91 81696 95728 (Support)"],
    margin + 10 + colW,
    y + 15.5
  );

  // Col 3: Emails & Website
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(245, 158, 11);
  doc.text("[WEB]", margin + 4 + colW * 2, y + 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(226, 232, 240);
  doc.text(
    ["arclinstruments@gmail.com", "info@arclinstruments.com", "www.arclinstruments.com"],
    margin + 11 + colW * 2,
    y + 15.5
  );

  y += footerBoxHeight + 3;

  // 9. OVERLAY WATERMARK & ACCURATE PAGE NUMBERING ACROSS ALL PAGES
  const totalDocPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalDocPages; p++) {
    doc.setPage(p);

    // Apply watermark on top of every page so it is always 100% visible across cards, specs & tables
    renderBackgroundWatermark();

    // Page footer numbering
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Technical Brochure"}`, margin, pageHeight - 4.5);
    doc.text(`Page ${p} of ${totalDocPages}`, pageWidth - margin, pageHeight - 4.5, { align: "right" });
  }

  doc.save(filename);
  return filename;
};
