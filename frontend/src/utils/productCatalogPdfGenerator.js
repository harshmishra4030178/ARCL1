import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";
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
 * Generates and directly downloads the official technical catalog PDF brochure for an ARCL product
 * 1:1 identical to the website catalog brochure design using STRICTLY real backend data
 * @param {Object} product The product object
 */
export const downloadProductCatalogPdf = async (product) => {
  if (!product) {
    throw new Error("Product data is required to generate catalog");
  }

  const cleanSku = (product.productCode || product.slug || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-");
  const filename = `ARCL-${cleanSku}-Technical-Brochure.pdf`;

  // 1. ATTEMPT 1:1 PIXEL-PERFECT DOM RENDER OF EXACT USER DESIGN
  if (typeof window !== "undefined") {
    const page1El = document.querySelector(".catalog-page-1");
    const page2El = document.querySelector(".catalog-page-2");
    const page3El = document.querySelector(".catalog-page-3");
    const catalogDocEl = document.querySelector("#catalog-document");

    if (page1El || catalogDocEl) {
      try {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        if (page1El) {
          const canvas1 = await html2canvas(page1El, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          });

          const imgData1 = canvas1.toDataURL("image/jpeg", 0.98);
          pdf.addImage(imgData1, "JPEG", 6, 6, pdfWidth - 12, pdfHeight - 12, undefined, "FAST");

          if (page2El) {
            const canvas2 = await html2canvas(page2El, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              logging: false,
            });

            const imgData2 = canvas2.toDataURL("image/jpeg", 0.98);
            pdf.addPage();
            pdf.addImage(imgData2, "JPEG", 6, 6, pdfWidth - 12, pdfHeight - 12, undefined, "FAST");
          }

          if (page3El) {
            const canvas3 = await html2canvas(page3El, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              logging: false,
            });

            const imgData3 = canvas3.toDataURL("image/jpeg", 0.98);
            pdf.addPage();
            pdf.addImage(imgData3, "JPEG", 6, 6, pdfWidth - 12, pdfHeight - 12, undefined, "FAST");
          }

          pdf.save(filename);
          return filename;
        } else if (catalogDocEl) {
          const canvas = await html2canvas(catalogDocEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.98);
          pdf.addImage(imgData, "JPEG", 6, 6, pdfWidth - 12, pdfHeight - 12, undefined, "FAST");
          pdf.save(filename);
          return filename;
        }
      } catch (domErr) {
        console.warn("DOM canvas capture fallback to vector generator:", domErr);
      }
    }
  }

  // 2. FALLBACK: NATIVE VECTOR PDF GENERATOR (STRICTLY REAL BACKEND DATA)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const brandNavy = [2, 28, 87]; // #021C57
  const brandBlue = [4, 51, 153]; // #043399
  const brandEmerald = [16, 149, 106]; // #10956a
  const textDark = [15, 23, 42]; // #0f172a
  const textMuted = [100, 116, 139]; // #64748b
  const bgLight = [248, 250, 252]; // #f8fafc
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

  // Pre-fetch product image
  const productImage =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string" && product.images
      ? product.images
      : null;

  let imageBase64 = null;
  if (productImage) {
    imageBase64 = await loadImageBase64(productImage);
  }

  // Real data arrays
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

  // =========================================================================
  // PAGE 1 — PRODUCT COVER + OVERVIEW
  // =========================================================================
  let y = margin;

  // Top Accent Bar
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y, contentWidth, 2.5, "F");
  y += 8;

  // Header Letterhead
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", margin, y);

  if (docRef) {
    doc.setFontSize(8.5);
    doc.text(`CATALOG SPEC: ${docRef}`, pageWidth - margin, y - 2, { align: "right" });
  }

  y += 4.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandEmerald);
  doc.text("AN ISO 9001:2015 CERTIFIED COMPANY", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Date: ${issueDate}`, pageWidth - margin, y, { align: "right" });

  if (categoryName) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...brandBlue);
    doc.text(`CATEGORY: ${formatTitleCase(categoryName).toUpperCase()}`, margin, y);
  }

  y += 3.5;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Hero Product Banner & Title
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, "F");

  if (categoryName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 5, y + 6);
  }

  if (product.isFeatured) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - margin - 42, y + 3, 37, 5, 1.5, 1.5, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text("★ FLAGSHIP INSTRUMENT", pageWidth - margin - 40, y + 6.5);
  }

  const productName = (product.name || "").toUpperCase();
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  const truncatedProductName =
    productName.length > 52 ? productName.substring(0, 50) + "..." : productName;
  doc.text(truncatedProductName, margin + 5, y + 14.5);

  let subInfo = [];
  if (sku) subInfo.push(`Product Code: ${sku}`);
  if (hsn) subInfo.push(`HSN Code: ${hsn}`);
  if (subInfo.length > 0) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(subInfo.join("   |   "), margin + 5, y + 19);
  }

  y += 28;

  // Hero Area: Real Product Image + Overview
  const heroImageWidth = 72;
  const heroImageHeight = 62;
  const overviewX = imageBase64 ? margin + heroImageWidth + 6 : margin;
  const overviewWidth = imageBase64 ? contentWidth - heroImageWidth - 6 : contentWidth;

  if (imageBase64) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, heroImageWidth, heroImageHeight, 2.5, 2.5, "F");
      doc.setDrawColor(...borderColor);
      doc.roundedRect(margin, y, heroImageWidth, heroImageHeight, 2.5, 2.5, "S");
      doc.addImage(
        imageBase64,
        "JPEG",
        margin + 3,
        y + 3,
        heroImageWidth - 6,
        heroImageHeight - 6,
        undefined,
        "FAST"
      );
    } catch (e) {
      console.warn("Could not render hero image:", e);
    }
  }

  if (product.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...brandNavy);
    doc.text("PRODUCT OVERVIEW", overviewX, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const splitDesc = doc.splitTextToSize(product.description, overviewWidth);
    doc.text(splitDesc.slice(0, 9), overviewX, y + 12);
  }

  y += imageBase64 ? heroImageHeight + 6 : 40;

  // Real Highlight Cards (from specs)
  if (highlightSpecs.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...brandNavy);
    doc.text("KEY SPECIFICATIONS", margin, y);
    y += 4;

    const cardWidth = (contentWidth - (highlightSpecs.length - 1) * 3) / highlightSpecs.length;
    const cardHeight = 18;

    highlightSpecs.forEach(([k, v], idx) => {
      const cx = margin + idx * (cardWidth + 3);
      doc.setFillColor(...bgLight);
      doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, "F");
      doc.setDrawColor(...borderColor);
      doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...brandNavy);
      const strVal = String(v);
      const shortVal = strVal.length > 15 ? strVal.substring(0, 14) + "..." : strVal;
      doc.text(shortVal, cx + cardWidth / 2, y + 7.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...textMuted);
      doc.text(formatTitleCase(k), cx + cardWidth / 2, y + 13, { align: "center" });
    });

    y += cardHeight + 7;
  }

  // Real Key Features
  if (featuresList.length > 0) {
    doc.setFillColor(...bgLight);
    doc.roundedRect(margin, y, contentWidth, 34, 2.5, 2.5, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, contentWidth, 34, 2.5, 2.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...brandNavy);
    doc.text("KEY FEATURES & ADVANTAGES", margin + 5, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    featuresList.slice(0, 4).forEach((h, idx) => {
      doc.text(`•  ${h}`, margin + 6, y + 13 + idx * 5.5);
    });
  }

  // Page 1 Footer
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Brochure"}`, margin, pageHeight - 7);
  doc.text("Page 1", pageWidth - margin, pageHeight - 7, { align: "right" });

  // =========================================================================
  // PAGE 2 — TECHNICAL SPECIFICATIONS + HOW IT WORKS (IF EXISTS)
  // =========================================================================
  if (specsEntries.length > 0 || howItWorksText || howItWorksSteps.length > 0) {
    doc.addPage();
    y = margin;

    // Top Mini Header
    doc.setFillColor(...brandNavy);
    doc.rect(margin, y, contentWidth, 1.5, "F");
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...brandNavy);
    doc.text("ARCL INSTRUMENTS PVT. LTD. — TECHNICAL SPECIFICATIONS & WORKFLOW", margin, y);

    if (docRef) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text(docRef, pageWidth - margin, y, { align: "right" });
    }

    y += 3;
    doc.setDrawColor(...borderColor);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Technical Specifications Table (Real)
    if (specsEntries.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...brandNavy);
      doc.text("TECHNICAL SPECIFICATIONS", margin, y);
      y += 5;

      const specRows = specsEntries.map(([k, v]) => [formatTitleCase(k), String(v)]);

      autoTable(doc, {
        startY: y,
        head: [["Parameter / Specification", "Technical Value"]],
        body: specRows,
        theme: "striped",
        headStyles: {
          fillColor: brandNavy,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: textDark,
          cellPadding: 2.2,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: "bold", textColor: [2, 28, 87] },
          1: { cellWidth: contentWidth - 80 },
        },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 60;
    }

    // How It Works / Working Principle (Real)
    if (howItWorksText || howItWorksSteps.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...brandNavy);
      doc.text("HOW IT WORKS / WORKING PRINCIPLE", margin, y);
      y += 6;

      if (howItWorksText) {
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...brandNavy);
        const splitHow = doc.splitTextToSize(howItWorksText, contentWidth - 6);
        doc.text(splitHow.slice(0, 3), margin + 3, y + 4.5);
        y += 17;
      }

      if (howItWorksSteps.length > 0) {
        const stepBoxWidth = (contentWidth - 6) / 2;
        const stepBoxHeight = 22;

        howItWorksSteps.forEach((st, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const sx = margin + col * (stepBoxWidth + 6);
          const sy = y + row * (stepBoxHeight + 4);

          doc.setFillColor(...bgLight);
          doc.roundedRect(sx, sy, stepBoxWidth, stepBoxHeight, 2, 2, "F");
          doc.setDrawColor(...borderColor);
          doc.roundedRect(sx, sy, stepBoxWidth, stepBoxHeight, 2, 2, "S");

          // Number Badge
          doc.setFillColor(...brandNavy);
          doc.roundedRect(sx + 3, sy + 3, 5, 5, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text(String(st.stepNumber || idx + 1), sx + 5.5, sy + 6.8, { align: "center" });

          // Step Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(...brandNavy);
          doc.text(st.title || "Step", sx + 10, sy + 6.8);

          // Step Desc
          if (st.description) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.8);
            doc.setTextColor(...textDark);
            const splitDesc = doc.splitTextToSize(st.description, stepBoxWidth - 6);
            doc.text(splitDesc.slice(0, 3), sx + 3, sy + 12);
          }
        });
      }
    }

    // Page 2 Footer
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Brochure"}`, margin, pageHeight - 7);
    doc.text("Page 2", pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  // =========================================================================
  // PAGE 3 — APPLICATIONS + STANDARD SUPPLY + CONTACT / FOOTER
  // =========================================================================
  doc.addPage();
  y = margin;

  // Top Mini Header
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y, contentWidth, 1.5, "F");
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD. — APPLICATIONS & SUPPLY OUTFIT", margin, y);

  if (docRef) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(docRef, pageWidth - margin, y, { align: "right" });
  }

  y += 3;
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Real Applications
  if (applicationsList.length > 0) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, y, contentWidth, 38, 2.5, 2.5, "F");
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, y, contentWidth, 38, 2.5, 2.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(6, 78, 59);
    doc.text("KEY INDUSTRIAL & LAB APPLICATIONS", margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    applicationsList.slice(0, 4).forEach((app, i) => {
      doc.text(`•  ${app}`, margin + 4, y + 13 + i * 6);
    });

    y += 44;
  }

  // Real Complete Set Includes
  if (supplyOutfitList.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...brandNavy);
    doc.text("COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT)", margin, y);
    y += 4.5;

    const outfitBoxWidth = (contentWidth - 6) / 2;
    const outfitBoxHeight = 12;

    supplyOutfitList.slice(0, 6).forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ox = margin + col * (outfitBoxWidth + 6);
      const oy = y + row * (outfitBoxHeight + 3);

      doc.setFillColor(...bgLight);
      doc.roundedRect(ox, oy, outfitBoxWidth, outfitBoxHeight, 1.5, 1.5, "F");
      doc.setDrawColor(...borderColor);
      doc.roundedRect(ox, oy, outfitBoxWidth, outfitBoxHeight, 1.5, 1.5, "S");

      doc.setFillColor(219, 234, 254);
      doc.roundedRect(ox + 2.5, oy + 2.5, 4, 7, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...brandBlue);
      doc.text(String(idx + 1), ox + 4.5, oy + 6.8, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...textDark);
      const splitItem = doc.splitTextToSize(item, outfitBoxWidth - 10);
      doc.text(splitItem.slice(0, 2), ox + 8, oy + 5.5);
    });

    y += Math.ceil(Math.min(supplyOutfitList.length, 6) / 2) * (outfitBoxHeight + 3) + 7;
  }

  // 3 Badges Row
  const badgeWidth = (contentWidth - 6) / 3;
  const badgeHeight = 13;
  const badges = [
    { title: "ISO 9001:2015", sub: "Quality Certified" },
    { title: "100% Quality Tested", sub: "Pre-Dispatch Inspection" },
    { title: "Pan-India Support", sub: "On-Site Calibration" },
  ];

  badges.forEach((b, i) => {
    const bx = margin + i * (badgeWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, y, badgeWidth, badgeHeight, 1.5, 1.5, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(bx, y, badgeWidth, badgeHeight, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...brandNavy);
    doc.text(b.title, bx + badgeWidth / 2, y + 5.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(b.sub, bx + badgeWidth / 2, y + 10, { align: "center" });
  });

  y += badgeHeight + 6;

  // Company Contact & Certification Footer Box
  const contactBoxHeight = 36;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, contactBoxHeight, 2.5, 2.5, "F");

  // Title in contact box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", margin + 5, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text("Precision Testing Instruments for Concrete, Cement, Soil, Bitumen & Surveying", margin + 5, y + 10.5);

  doc.setDrawColor(255, 255, 255, 0.2);
  doc.line(margin + 5, y + 13, pageWidth - margin - 5, y + 13);

  // 3 Contact Columns
  const cColWidth = (contentWidth - 10) / 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(226, 232, 240);

  // Col 1: Address
  doc.text(
    doc.splitTextToSize("Shop No. 6, Siddivinayak Park CHS, Sector 8A Airoli, Navi Mumbai - 400708", cColWidth - 4),
    margin + 5,
    y + 18
  );

  // Col 2: Phones
  doc.text(
    ["+91 8169695728 (Head)", "+91 8369458583 (Sales)", "+91 6205691085 (Calib)"],
    margin + 5 + cColWidth,
    y + 18
  );

  // Col 3: Email & Web
  doc.text(
    ["arclinstruments@gmail.com", "info@arclinstruments.com", "www.arclinstruments.com"],
    margin + 5 + cColWidth * 2,
    y + 18
  );

  // Page 3 Footer
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Brochure"}`, margin, pageHeight - 7);
  doc.text("Page 3", pageWidth - margin, pageHeight - 7, { align: "right" });

  // Save PDF
  doc.save(filename);
  return filename;
};
