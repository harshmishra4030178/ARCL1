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
 * Generates and directly downloads the official technical catalog PDF for an ARCL product
 * @param {Object} product The product object
 */
export const downloadProductCatalogPdf = async (product) => {
  if (!product) {
    throw new Error("Product data is required to generate catalog");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const brandNavy = [2, 28, 87]; // #021C57
  const brandAmber = [217, 119, 6]; // #d97706
  const brandEmerald = [22, 163, 74]; // #16a34a
  const textDark = [15, 23, 42]; // #0f172a
  const textMuted = [100, 116, 139]; // #64748b
  const bgLight = [248, 250, 252]; // #f8fafc

  let y = margin;

  // 1. TOP LETTERHEAD / HEADER
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y, contentWidth, 2, "F");
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandAmber);
  doc.text("AN ISO 9001:2015 CERTIFIED MANUFACTURER", margin, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(
    "Civil Engineering & Material Testing Equipment | Web: arclinstruments.com | +91 81696 95728",
    margin,
    y + 8.5
  );

  const docRef = `DOC #${(product._id || "ARCL").slice(-6).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandNavy);
  doc.text(`CATALOG SPEC SHEET: ${docRef}`, pageWidth - margin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Date: ${issueDate}`, pageWidth - margin, y + 4.5, { align: "right" });
  doc.text("Standard: Industry Compliant", pageWidth - margin, y + 8.5, { align: "right" });

  y += 13;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // 2. PRODUCT BANNER
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");

  const categoryName =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    "Laboratory Testing Equipment";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 5, y + 5.5);

  const productName = formatTitleCase(product.name || "Equipment");
  doc.setFontSize(13);
  const truncatedProductName =
    productName.length > 55 ? productName.substring(0, 52) + "..." : productName;
  doc.text(truncatedProductName, margin + 5, y + 13);

  if (product.productCode) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(253, 230, 138);
    doc.text(`SKU: ${product.productCode.toUpperCase()}`, pageWidth - margin - 5, y + 13, {
      align: "right",
    });
  }

  y += 24;

  // 3. PRODUCT OVERVIEW & IMAGE SECTION
  const productImage =
    Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : typeof product.images === "string"
      ? product.images
      : null;

  let imageBase64 = null;
  if (productImage) {
    imageBase64 = await loadImageBase64(productImage);
  }

  const overviewBoxX = imageBase64 ? margin + 52 : margin;
  const overviewBoxWidth = imageBase64 ? contentWidth - 52 : contentWidth;

  if (imageBase64) {
    try {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, 48, 48, 2, 2, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, 48, 48, 2, 2, "S");
      doc.addImage(imageBase64, "JPEG", margin + 2, y + 2, 44, 44, undefined, "FAST");
    } catch (e) {
      console.warn("Could not render image to PDF:", e);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brandNavy);
  doc.text("PRODUCT OVERVIEW", overviewBoxX, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const descText =
    product.description ||
    "Engineered with high-grade components for demanding laboratory and industrial testing workflows. Fully calibrated to comply with relevant national and international testing standards.";
  const splitDesc = doc.splitTextToSize(descText, overviewBoxWidth);
  doc.text(splitDesc.slice(0, 5), overviewBoxX, y + 9.5);

  const metaY = y + (imageBase64 ? 32 : 24);
  doc.setFillColor(...bgLight);
  doc.roundedRect(overviewBoxX, metaY, overviewBoxWidth, 14, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(overviewBoxX, metaY, overviewBoxWidth, 14, 2, 2, "S");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandNavy);
  doc.text("Product Code / SKU:", overviewBoxX + 3, metaY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text((product.productCode || "ARCL-STD").toUpperCase(), overviewBoxX + 3, metaY + 10);

  if (product.hsnCode) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandNavy);
    doc.text("HSN Code:", overviewBoxX + (overviewBoxWidth * 0.35), metaY + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textDark);
    doc.text(product.hsnCode.toUpperCase(), overviewBoxX + (overviewBoxWidth * 0.35), metaY + 10);
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandEmerald);
  doc.text("Availability:", overviewBoxX + (overviewBoxWidth * 0.68), metaY + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textDark);
  doc.text("Ready to Dispatch", overviewBoxX + (overviewBoxWidth * 0.68), metaY + 10);

  y += imageBase64 ? 54 : 44;

  // 4. TECHNICAL SPECIFICATIONS TABLE
  const specs = product.specifications || {};
  const specKeys = Object.keys(specs);

  if (specKeys.length > 0) {
    const tableBody = specKeys.map((key) => [
      formatTitleCase(key),
      String(specs[key]),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Technical Parameter / Feature", "Standard Specification Value"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: brandNavy,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textDark,
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: "bold", width: contentWidth * 0.45 },
        1: { width: contentWidth * 0.55 },
      },
    });

    y = doc.lastAutoTable.finalY + 6;
  }

  // 5. WORKING PRINCIPLE (IF PRESENT)
  const howItWorks = product.category?.howItWorks;
  if (howItWorks && y < pageHeight - 45) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...brandNavy);
    doc.text("WORKING PRINCIPLE & OPERATING MECHANISM", margin, y + 2);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    const splitHow = doc.splitTextToSize(howItWorks, contentWidth - 8);
    const boxHeight = Math.min(splitHow.length * 3.8 + 6, 25);

    doc.setFillColor(254, 243, 199);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "F");
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "S");

    doc.text(splitHow.slice(0, 5), margin + 4, y + 4.5);
    y += boxHeight + 6;
  }

  // 6. CERTIFICATION BADGES
  if (y < pageHeight - 35) {
    doc.setFillColor(...bgLight);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandNavy);
    doc.text("ISO 9001:2015 Certified Quality", margin + 6, y + 6);
    doc.text("Factory Calibrated & Tested", margin + (contentWidth * 0.35), y + 6);
    doc.text("Direct Manufacturer Warranty", margin + (contentWidth * 0.7), y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textMuted);
    doc.text("Rigorous multi-stage inspection", margin + 6, y + 10.5);
    doc.text("Compliant with ASTM/IS standards", margin + (contentWidth * 0.35), y + 10.5);
    doc.text("Complete spares & service support", margin + (contentWidth * 0.7), y + 10.5);
  }

  // 7. FOOTER
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      "ARCL Instruments Pvt. Ltd. | Official Equipment Catalog | Contact: arclinstruments@gmail.com | +91 81696 95728",
      margin,
      footerY + 2
    );

    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY + 2, {
      align: "right",
    });
  }

  const cleanName = (product.name || "Product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const filename = `ARCL-${cleanName}-Catalog.pdf`;

  doc.save(filename);
  return filename;
};
