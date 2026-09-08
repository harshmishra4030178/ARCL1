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
 * Uses 100% vector layout math with dynamic auto-pagination to ensure ZERO horizontal cuts.
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
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm

  // Brand Palette
  const brandNavy = [2, 28, 87];      // #021C57
  const brandBlue = [4, 51, 153];     // #043399
  const brandEmerald = [5, 150, 105]; // #059669
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

  // Real backend arrays
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

  // Space helper that moves to next page cleanly with continuation header if space is insufficient
  const ensureSpace = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;

      // Continuation Header
      doc.setFillColor(...brandNavy);
      doc.rect(margin, y, contentWidth, 1.5, "F");
      y += 4.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...brandNavy);
      doc.text(`ARCL INSTRUMENTS PVT. LTD. — ${(product.name || "").toUpperCase()}`, margin, y);

      if (docRef) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text(docRef, pageWidth - margin, y, { align: "right" });
      }

      y += 2.5;
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    }
  };

  // 1. TOP HEADER LETTERHEAD
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y, contentWidth, 2, "F");
  y += 6;

  // Logo + Company Name
  const logoWidth = 26;
  const logoHeight = 13;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, y - 1, logoWidth, logoHeight, undefined, "FAST");
    } catch (e) {
      // Fallback
    }
  }

  const textStartX = logoBase64 ? margin + logoWidth + 4 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", textStartX, y + 3.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandEmerald);
  doc.text("AN ISO 9001:2015 CERTIFIED COMPANY", textStartX, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("• Precision Laboratory & Testing Instruments", textStartX + 52, y + 8);

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
  doc.text(`Issued: ${issueDate}`, pageWidth - margin, y + 8, { align: "right" });

  y += 14;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // 2. HERO PRODUCT BANNER
  const heroBannerHeight = 20;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, heroBannerHeight, 2, 2, "F");

  // Category Pill
  if (categoryName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 4, y + 5.5);
  }

  // Flagship / Certified Pill
  if (product.isFeatured) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - margin - 36, y + 2.5, 32, 4.5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(15, 23, 42);
    doc.text("★ FLAGSHIP INSTRUMENT", pageWidth - margin - 34, y + 5.5);
  } else {
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(pageWidth - margin - 34, y + 2.5, 30, 4.5, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text("● PRECISION CERTIFIED", pageWidth - margin - 32, y + 5.5);
  }

  // Product Name
  const productName = (product.name || "").toUpperCase();
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const truncatedProductName =
    productName.length > 58 ? productName.substring(0, 56) + "..." : productName;
  doc.text(truncatedProductName, margin + 4, y + 12);

  // SKU & HSN
  let subInfo = [];
  if (sku) subInfo.push(`Product Code: ${sku}`);
  if (hsn) subInfo.push(`HSN: ${hsn}`);
  if (subInfo.length > 0) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(subInfo.join("   |   "), margin + 4, y + 17);
  }

  y += heroBannerHeight + 4;

  // 3. PRODUCT HERO AREA: IMAGE (LEFT) + OVERVIEW & METRICS (RIGHT)
  const imageBoxWidth = 60;
  const imageBoxHeight = 50;
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
    doc.setFontSize(9);
    doc.setTextColor(...brandNavy);
    doc.text("PRODUCT OVERVIEW", overviewX, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    const splitDesc = doc.splitTextToSize(product.description, overviewWidth);
    doc.text(splitDesc.slice(0, 6), overviewX, y + 9.5);
  }

  // Highlight KPI Metric Cards (2x2 Grid)
  if (highlightSpecs.length > 0) {
    const kpiStartX = overviewX;
    const kpiStartY = y + 27;
    const kpiWidth = (overviewWidth - 3) / 2;
    const kpiHeight = 10;

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
      doc.text(shortVal, kx + 2.5, ky + 8);
    });
  }

  y += Math.max(imageBoxHeight, 52) + 4;

  // 4. TECHNICAL SPECIFICATIONS TABLE (AUTOTABLE WITH AUTO ROW-SPLITTING)
  if (specsEntries.length > 0) {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...brandNavy);
    doc.text("TECHNICAL SPECIFICATIONS", margin, y);
    y += 3.5;

    const specRows = specsEntries.map(([k, v]) => [formatTitleCase(k), String(v)]);

    autoTable(doc, {
      startY: y,
      head: [["Parameter / Specification", "Technical Value"]],
      body: specRows,
      theme: "striped",
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: textDark,
        cellPadding: 1.8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 75, fontStyle: "bold", textColor: [2, 28, 87] },
        1: { cellWidth: contentWidth - 75 },
      },
      margin: { left: margin, right: margin },
      pageBreak: "auto",
    });

    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 5 : y + 40;
  }

  // 5. KEY FEATURES & ENGINEERING ADVANTAGES
  if (featuresList.length > 0) {
    const fCount = featuresList.length;
    const fBoxHeight = Math.ceil(fCount / 2) * 6 + 10;
    ensureSpace(Math.min(fBoxHeight, 35));

    doc.setFillColor(...bgLight);
    doc.roundedRect(margin, y, contentWidth, fBoxHeight, 2, 2, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, contentWidth, fBoxHeight, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...brandNavy);
    doc.text("KEY FEATURES & ENGINEERING ADVANTAGES", margin + 4, y + 5.5);

    const featColWidth = (contentWidth - 10) / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textDark);

    featuresList.forEach((feat, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const fx = margin + 4 + col * (featColWidth + 4);
      const fy = y + 10.5 + row * 6;

      // Emerald Check
      doc.setFillColor(...brandEmerald);
      doc.circle(fx + 1.2, fy - 1, 1.2, "F");

      const splitFeat = doc.splitTextToSize(feat, featColWidth - 6);
      doc.text(splitFeat[0], fx + 4, fy);
    });

    y += fBoxHeight + 5;
  }

  // 6. APPLICATIONS & STANDARD SUPPLY OUTFIT (SIDE BY SIDE)
  if (applicationsList.length > 0 || supplyOutfitList.length > 0) {
    const hasBoth = applicationsList.length > 0 && supplyOutfitList.length > 0;
    const blockWidth = hasBoth ? (contentWidth - 4) / 2 : contentWidth;
    const maxItems = Math.max(applicationsList.length, supplyOutfitList.length);
    const boxHeight = Math.min(maxItems * 5.5 + 10, 40);

    ensureSpace(boxHeight + 4);

    let currentX = margin;

    // Applications Box
    if (applicationsList.length > 0) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(currentX, y, blockWidth, boxHeight, 2, 2, "F");
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(currentX, y, blockWidth, boxHeight, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(6, 78, 59);
      doc.text("KEY INDUSTRIAL & LAB APPLICATIONS", currentX + 3.5, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);

      applicationsList.slice(0, 6).forEach((app, i) => {
        const ay = y + 10 + i * 5;
        doc.setFillColor(...brandEmerald);
        doc.circle(currentX + 4.5, ay - 0.8, 1, "F");
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
      doc.setFontSize(8);
      doc.setTextColor(...brandNavy);
      doc.text("COMPLETE SET INCLUDES (SUPPLY OUTFIT)", currentX + 3.5, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);

      supplyOutfitList.slice(0, 6).forEach((item, idx) => {
        const sy = y + 10 + idx * 5;
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(currentX + 3.5, sy - 2.8, 3.5, 3.5, 0.8, 0.8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.5);
        doc.setTextColor(...brandBlue);
        doc.text(String(idx + 1), currentX + 5.2, sy - 0.5, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(...textDark);
        const splitItem = doc.splitTextToSize(item, blockWidth - 11);
        doc.text(splitItem[0], currentX + 8.5, sy);
      });
    }

    y += boxHeight + 5;
  }

  // 7. HOW IT WORKS / WORKING PRINCIPLE
  if (howItWorksText || howItWorksSteps.length > 0) {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brandNavy);
    doc.text("HOW IT WORKS / WORKING PRINCIPLE", margin, y);
    y += 4;

    if (howItWorksText) {
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, "F");
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...brandNavy);
      const splitHow = doc.splitTextToSize(howItWorksText, contentWidth - 6);
      doc.text(splitHow.slice(0, 2), margin + 3, y + 4.5);
      y += 14;
    }

    if (howItWorksSteps.length > 0) {
      const stepWidth = (contentWidth - 4) / 2;
      const stepHeight = 16;

      howItWorksSteps.slice(0, 4).forEach((st, idx) => {
        ensureSpace(stepHeight + 3);
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const sx = margin + col * (stepWidth + 4);
        const sy = y + row * (stepHeight + 3);

        doc.setFillColor(...bgLight);
        doc.roundedRect(sx, sy, stepWidth, stepHeight, 1.5, 1.5, "F");
        doc.setDrawColor(...borderColor);
        doc.roundedRect(sx, sy, stepWidth, stepHeight, 1.5, 1.5, "S");

        doc.setFillColor(...brandNavy);
        doc.roundedRect(sx + 2.5, sy + 2.5, 4, 4, 0.8, 0.8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(255, 255, 255);
        doc.text(String(st.stepNumber || idx + 1), sx + 4.5, sy + 5.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...brandNavy);
        doc.text(st.title || "Procedure Step", sx + 8, sy + 5.5);

        if (st.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(...textDark);
          const splitDesc = doc.splitTextToSize(st.description, stepWidth - 6);
          doc.text(splitDesc.slice(0, 2), sx + 3, sy + 10);
        }
      });

      y += Math.ceil(Math.min(howItWorksSteps.length, 4) / 2) * (stepHeight + 3) + 4;
    }
  }

  // 8. COMPANY CONTACT FOOTER (NEVER SPLIT IN HALF)
  ensureSpace(38);
  const footerBoxHeight = 32;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, footerBoxHeight, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text("Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying", margin + 4, y + 9.5);

  doc.setDrawColor(255, 255, 255, 0.2);
  doc.line(margin + 4, y + 11.5, pageWidth - margin - 4, y + 11.5);

  const colW = (contentWidth - 8) / 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240);

  doc.text(
    doc.splitTextToSize("Shop No. 6, Siddivinayak Park CHS, Sector 8A Airoli, Navi Mumbai - 400708", colW - 2),
    margin + 4,
    y + 16
  );

  doc.text(
    ["+91 8169695728 (Head)", "+91 8369458583 (Sales)", "+91 6205691085 (Calibration)"],
    margin + 4 + colW,
    y + 16
  );

  doc.text(
    ["arclinstruments@gmail.com", "info@arclinstruments.com", "www.arclinstruments.com"],
    margin + 4 + colW * 2,
    y + 16
  );

  // 9. DYNAMIC ACCURATE PAGE NUMBERING ACROSS ALL PAGES
  const totalDocPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalDocPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Technical Brochure"}`, margin, pageHeight - 5);
    doc.text(`Page ${p} of ${totalDocPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  doc.save(filename);
  return filename;
};
