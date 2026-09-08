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
 * DENSE & BOTTOM-ANCHORED: No empty floating gaps. Header at top, Footer anchored to bottom.
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

  // Bottom footer allocation: Trust Badges (13.5mm) + Gap (3mm) + Company Footer (31mm) + Margin (4.5mm) = ~52mm
  const totalFooterHeight = 49;
  const bottomFooterAnchorY = pageHeight - margin - totalFooterHeight; // 297 - 8 - 49 = 240mm
  const maxContentY = bottomFooterAnchorY - 3; // 237mm

  // Brand Palette
  const brandNavy = [2, 28, 87];      // #021C57
  const brandBlue = [4, 51, 153];     // #043399
  const brandEmerald = [5, 150, 105]; // #059669
  const brandAmber = [245, 158, 11];  // #F59E0B
  const textDark = [15, 23, 42];      // #0F172A
  const textMuted = [100, 116, 139];  // #64748B
  const bgLight = [248, 250, 252];    // #F8FAFC
  const borderColor = [226, 232, 240];

  const docRef = product._id ? `DOC #${product._id.slice(-6).toUpperCase()}` : "";
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sku = product.productCode ? product.productCode.toUpperCase() : "";
  const hsn = product.hsnCode ? String(product.hsnCode).toUpperCase() : "";
  const categoryName =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    product.equipmentTypeName ||
    "";

  // Pre-load product image & logo
  const productImage =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string" && product.images
      ? product.images
      : null;

  let [productImageBase64, logoBase64] = await Promise.all([
    loadImageBase64(productImage),
    loadImageBase64("/assets/LOGO.png"),
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

  // FULL OFFICIAL LETTERHEAD (IDENTICAL ON PAGE 1, PAGE 2, PAGE 3)
  const renderOfficialLetterhead = () => {
    // Top Accent Bar
    doc.setFillColor(...brandNavy);
    doc.rect(margin, y, contentWidth, 2, "F");
    y += 5.5;

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
    doc.setFontSize(13.5);
    doc.setTextColor(...brandNavy);
    doc.text("ARCL INSTRUMENTS PVT. LTD.", textStartX, y + 3.5);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandEmerald);
    doc.text("AN ISO 9001:2015 CERTIFIED COMPANY", textStartX, y + 7.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
    doc.text("• Precision Laboratory & Testing Instruments", textStartX + 52, y + 7.5);

    // Right Header Meta
    if (docRef) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...brandNavy);
      doc.text(docRef, pageWidth - margin, y + 3.5, { align: "right" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(`Issued: ${issueDate}`, pageWidth - margin, y + 7.5, { align: "right" });

    y += 13;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
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

  // 2. HERO PRODUCT BANNER
  const heroBannerHeight = 19;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, heroBannerHeight, 2, 2, "F");

  // Category Pill
  if (categoryName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 4, y + 5);
  }

  // Flagship / Precision Pill
  if (product.isFeatured) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - margin - 38, y + 2, 34, 4.2, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("★ FLAGSHIP INSTRUMENT", pageWidth - margin - 36, y + 5);
  } else {
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(pageWidth - margin - 38, y + 2, 34, 4.2, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("● PRECISION CERTIFIED", pageWidth - margin - 34, y + 5);
  }

  // Product Name
  const productName = (product.name || "").toUpperCase();
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const truncatedProductName =
    productName.length > 60 ? productName.substring(0, 58) + "..." : productName;
  doc.text(truncatedProductName, margin + 4, y + 11);

  // SKU & HSN
  let subInfo = [];
  if (sku) subInfo.push(`Product Code: ${sku}`);
  if (hsn) subInfo.push(`HSN: ${hsn}`);
  if (subInfo.length > 0) {
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(subInfo.join("   |   "), margin + 4, y + 16);
  }

  y += heroBannerHeight + 3.5;

  // 3. PRODUCT HERO AREA: IMAGE (LEFT) + OVERVIEW & METRICS (RIGHT)
  const imageBoxWidth = 62;
  const imageBoxHeight = 52;
  const overviewX = productImageBase64 ? margin + imageBoxWidth + 4 : margin;
  const overviewWidth = productImageBase64 ? contentWidth - imageBoxWidth - 4 : contentWidth;

  if (productImageBase64) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, imageBoxWidth, imageBoxHeight, 2, 2, "F");
      doc.setDrawColor(...borderColor);
      doc.roundedRect(margin, y, imageBoxWidth, imageBoxHeight, 2, 2, "S");
      doc.addImage(
        productImageBase64,
        "JPEG",
        margin + 2,
        y + 2,
        imageBoxWidth - 4,
        imageBoxHeight - 4,
        undefined,
        "FAST"
      );
    } catch (e) {
      // Fallback
    }
  }

  if (product.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...brandNavy);
    doc.text("PRODUCT OVERVIEW", overviewX, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    const splitDesc = doc.splitTextToSize(product.description, overviewWidth);
    doc.text(splitDesc.slice(0, 6), overviewX, y + 9);
  }

  // Highlight KPI Metric Cards (2x2 Grid)
  if (highlightSpecs.length > 0) {
    const kpiStartX = overviewX;
    const kpiStartY = y + 28;
    const kpiWidth = (overviewWidth - 3) / 2;
    const kpiHeight = 10.5;

    highlightSpecs.slice(0, 4).forEach(([k, v], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const kx = kpiStartX + col * (kpiWidth + 3);
      const ky = kpiStartY + row * (kpiHeight + 2);

      doc.setFillColor(...bgLight);
      doc.roundedRect(kx, ky, kpiWidth, kpiHeight, 1.5, 1.5, "F");
      doc.setDrawColor(...borderColor);
      doc.roundedRect(kx, ky, kpiWidth, kpiHeight, 1.5, 1.5, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...textMuted);
      doc.text(formatTitleCase(k).toUpperCase(), kx + 2.5, ky + 3.8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(...brandNavy);
      const strVal = String(v);
      const shortVal = strVal.length > 20 ? strVal.substring(0, 19) + "..." : strVal;
      doc.text(shortVal, kx + 2.5, ky + 8.2);
    });
  }

  y += Math.max(imageBoxHeight, 52) + 3.5;

  // 4. TECHNICAL SPECIFICATIONS TABLE
  if (specsEntries.length > 0) {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brandNavy);
    doc.text("TECHNICAL SPECIFICATIONS", margin, y);
    y += 3;

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
        fontSize: 7,
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

  // 5. KEY FEATURES & ENGINEERING ADVANTAGES
  if (featuresList.length > 0) {
    const fCount = featuresList.length;
    const fBoxHeight = Math.ceil(fCount / 2) * 5.5 + 9;
    ensureSpace(Math.min(fBoxHeight, 28));

    doc.setFillColor(...bgLight);
    doc.roundedRect(margin, y, contentWidth, fBoxHeight, 2, 2, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, contentWidth, fBoxHeight, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brandNavy);
    doc.text("KEY FEATURES & ENGINEERING ADVANTAGES", margin + 4, y + 5);

    const featColWidth = (contentWidth - 10) / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textDark);

    featuresList.forEach((feat, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const fx = margin + 4 + col * (featColWidth + 4);
      const fy = y + 9.8 + row * 5.5;

      // Emerald Check Dot
      doc.setFillColor(...brandEmerald);
      doc.circle(fx + 1.2, fy - 1, 1.2, "F");

      const splitFeat = doc.splitTextToSize(feat, featColWidth - 6);
      doc.text(splitFeat[0], fx + 3.8, fy);
    });

    y += fBoxHeight + 4;
  }

  // 6. APPLICATIONS & STANDARD SUPPLY OUTFIT (SIDE BY SIDE)
  if (applicationsList.length > 0 || supplyOutfitList.length > 0) {
    const hasBoth = applicationsList.length > 0 && supplyOutfitList.length > 0;
    const blockWidth = hasBoth ? (contentWidth - 4) / 2 : contentWidth;
    const maxItems = Math.max(applicationsList.length, supplyOutfitList.length);
    const boxHeight = Math.min(maxItems * 5 + 9, 36);

    ensureSpace(boxHeight + 3);

    let currentX = margin;

    // Applications Box
    if (applicationsList.length > 0) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(currentX, y, blockWidth, boxHeight, 2, 2, "F");
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(currentX, y, blockWidth, boxHeight, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(6, 78, 59);
      doc.text("KEY INDUSTRIAL & LAB APPLICATIONS", currentX + 3.5, y + 4.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      applicationsList.slice(0, 6).forEach((app, i) => {
        const ay = y + 9 + i * 4.6;
        doc.setFillColor(...brandEmerald);
        doc.circle(currentX + 4.5, ay - 0.8, 0.9, "F");
        const splitApp = doc.splitTextToSize(app, blockWidth - 9);
        doc.text(splitApp[0], currentX + 7, ay);
      });

      if (hasBoth) currentX += blockWidth + 4;
    }

    // Supply Outfit Box
    if (supplyOutfitList.length > 0) {
      doc.setFillColor(...bgLight);
      doc.roundedRect(currentX, y, blockWidth, boxHeight, 2, 2, "F");
      doc.setDrawColor(...borderColor);
      doc.roundedRect(currentX, y, blockWidth, boxHeight, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...brandNavy);
      doc.text("COMPLETE SET INCLUDES (SUPPLY OUTFIT)", currentX + 3.5, y + 4.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      supplyOutfitList.slice(0, 6).forEach((item, idx) => {
        const sy = y + 9 + idx * 4.6;
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

    y += boxHeight + 4;
  }

  // 7. HOW IT WORKS / WORKING PRINCIPLE
  if (howItWorksText || howItWorksSteps.length > 0) {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...brandNavy);
    doc.text("HOW IT WORKS / WORKING PRINCIPLE", margin, y);
    y += 3.5;

    if (howItWorksText) {
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "F");
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...brandNavy);
      const splitHow = doc.splitTextToSize(howItWorksText, contentWidth - 6);
      doc.text(splitHow.slice(0, 2), margin + 3, y + 4.2);
      y += 12.5;
    }

    if (howItWorksSteps.length > 0) {
      const stepWidth = (contentWidth - 4) / 2;
      const stepHeight = 15;

      howItWorksSteps.slice(0, 4).forEach((st, idx) => {
        ensureSpace(stepHeight + 2);
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const sx = margin + col * (stepWidth + 4);
        const sy = y + row * (stepHeight + 2.5);

        doc.setFillColor(...bgLight);
        doc.roundedRect(sx, sy, stepWidth, stepHeight, 1.5, 1.5, "F");
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
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, y, badgeCardW, badgeCardH, 2, 2, "F");
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

  y += badgeCardH + 3;

  // Rich Dark Navy Footer Box
  const footerBoxHeight = 31;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, footerBoxHeight, 2.5, 2.5, "F");

  // Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", margin + 4, y + 5.2);

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
    doc.splitTextToSize("Shop No. 6, Siddivinayak Park CHS, Sector 8A Airoli, Navi Mumbai - 400708", colW - 8),
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
    ["+91 8169695728 (Head)", "+91 8369458583 (Sales)", "+91 6205691085 (Calibration)"],
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

  // 9. DYNAMIC ACCURATE PAGE NUMBERING ACROSS ALL PAGES
  const totalDocPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalDocPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Technical Brochure"}`, margin, pageHeight - 4.5);
    doc.text(`Page ${p} of ${totalDocPages}`, pageWidth - margin, pageHeight - 4.5, { align: "right" });
  }

  doc.save(filename);
  return filename;
};
