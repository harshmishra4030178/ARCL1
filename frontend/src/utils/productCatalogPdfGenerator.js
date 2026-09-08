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
 * 1:1 identical to the website catalog brochure design
 * @param {Object} product The product object
 */
export const downloadProductCatalogPdf = async (product) => {
  if (!product) {
    throw new Error("Product data is required to generate catalog");
  }

  const cleanSku = (product.productCode || product.slug || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-");
  const filename = `ARCL-${cleanSku}-Product-Brochure.pdf`;

  // 1. ATTEMPT 1:1 PIXEL-PERFECT DOM RENDER OF EXACT USER DESIGN
  if (typeof window !== "undefined") {
    const page1El = document.querySelector(".catalog-page-1");
    const page2El = document.querySelector(".catalog-page-2");
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
          pdf.addImage(imgData1, "JPEG", 8, 8, pdfWidth - 16, pdfHeight - 16, undefined, "FAST");

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
            pdf.addImage(imgData2, "JPEG", 8, 8, pdfWidth - 16, pdfHeight - 16, undefined, "FAST");
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
          pdf.addImage(imgData, "JPEG", 8, 8, pdfWidth - 16, pdfHeight - 16, undefined, "FAST");
          pdf.save(filename);
          return filename;
        }
      } catch (domErr) {
        console.warn("DOM canvas capture fallback to vector generator:", domErr);
      }
    }
  }

  // 2. FALLBACK: NATIVE VECTOR PDF GENERATOR
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
  const brandAmber = [217, 119, 6]; // #d97706
  const brandEmerald = [16, 149, 106]; // #10956a
  const textDark = [15, 23, 42]; // #0f172a
  const textMuted = [100, 116, 139]; // #64748b
  const bgLight = [248, 250, 252]; // #f8fafc
  const borderColor = [226, 232, 240];

  const docRef = `DOC #${(product._id || "ARCL").slice(-6).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sku = (product.productCode || "ARCL-STD").toUpperCase();
  const hsn = product.hsnCode ? String(product.hsnCode).toUpperCase() : "9024";
  const categoryName =
    product.category?.equipmentType?.name ||
    product.category?.name ||
    "CONCRETE TESTING EQUIPMENTS";

  // Pre-fetch product image and QR code
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

  let qrBase64 = null;
  if (product.qrCode) {
    qrBase64 = await loadImageBase64(product.qrCode);
  }

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

  doc.setFontSize(8.5);
  doc.text(`CATALOG SPEC SHEET: ${docRef}`, pageWidth - margin, y - 2, { align: "right" });

  y += 4.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandAmber);
  doc.text("AN ISO 9001:2015 CERTIFIED COMPANY", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`Date: ${issueDate}`, pageWidth - margin, y, { align: "right" });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...brandBlue);
  doc.text(`CATEGORY: ${formatTitleCase(categoryName).toUpperCase()}`, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("Standard: Industry Compliant", pageWidth - margin, y, { align: "right" });

  y += 3.5;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Hero Product Banner & Title
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatTitleCase(categoryName).toUpperCase(), margin + 5, y + 6);

  if (product.isFeatured) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - margin - 42, y + 3, 37, 5, 1.5, 1.5, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text("★ FLAGSHIP INSTRUMENT", pageWidth - margin - 40, y + 6.5);
  }

  const productName = (product.name || "Precision Testing Machine").toUpperCase();
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  const truncatedProductName =
    productName.length > 52 ? productName.substring(0, 50) + "..." : productName;
  doc.text(truncatedProductName, margin + 5, y + 14.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`Product Code: ${sku}   |   HSN Code: ${hsn}`, margin + 5, y + 19);

  y += 28;

  // Hero Area: Large Product Image + Overview
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

  // Right / Side: Tagline + Overview
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandAmber);
  doc.text("Precision • Automation • Safety • Reliability", overviewX, y + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...brandNavy);
  doc.text("PRODUCT OVERVIEW", overviewX, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  const desc =
    product.description ||
    "The ARCL Compression Testing Machine is a heavy-duty, precision-engineered testing solution designed for determining the compressive strength of concrete cubes, cylinders, blocks, and construction materials with highest repeatability and automated compliance.";
  const splitDesc = doc.splitTextToSize(desc, overviewWidth);
  doc.text(splitDesc.slice(0, 8), overviewX, y + 17.5);

  y += heroImageHeight + 6;

  // 4 Highlight Cards
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...brandNavy);
  doc.text("KEY PERFORMANCE HIGHLIGHTS", margin, y);
  y += 4;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 18;

  const specsObj = product.specifications || {};
  const capacityVal = specsObj["Capacity"] || specsObj["capacity"] || "500 / 2000 / 3000 kN";
  const accuracyVal = specsObj["Accuracy"] || specsObj["accuracy"] || "±1% (Class 1)";
  const displayVal = specsObj["Display Unit"] || specsObj["display"] || "10-INCH Touch / Digital";
  const operationVal = specsObj["Control System"] || specsObj["operation"] || "SERVO CONTROLLED";

  const highlightCards = [
    { title: "Capacity", val: String(capacityVal).split("/")[0].trim() || "2000 kN" },
    { title: "Loading Accuracy", val: String(accuracyVal).split("(")[0].trim() || "±1%" },
    { title: "Display Unit", val: String(displayVal).split("/")[0].trim() || "10-INCH Digital" },
    { title: "Operation", val: String(operationVal).split("/")[0].trim() || "Automatic Servo" },
  ];

  highlightCards.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(...bgLight);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brandNavy);
    const splitVal = doc.splitTextToSize(c.val, cardWidth - 4);
    doc.text(splitVal[0] || c.val, cardX + cardWidth / 2, y + 7, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textMuted);
    doc.text(c.title, cardX + cardWidth / 2, y + 13.5, { align: "center" });
  });

  y += cardHeight + 7;

  // QR Code + Certification Box at bottom of Page 1
  const qrBoxHeight = 24;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, y, contentWidth, qrBoxHeight, 2, 2, "F");
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, contentWidth, qrBoxHeight, 2, 2, "S");

  if (qrBase64) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin + 3, y + 2.5, 19, 19, 1.5, 1.5, "F");
      doc.addImage(qrBase64, "PNG", margin + 4, y + 3.5, 17, 17, undefined, "FAST");
    } catch (e) {}
  }

  const qrTextX = qrBase64 ? margin + 26 : margin + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandNavy);
  doc.text("SCAN FOR LIVE SPECS & DIGITAL CERTIFICATE", qrTextX, y + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...textDark);
  doc.text(
    "Scan the official QR code to view live engineering specifications, test certificates, standard operating procedures, and direct factory calibration data on arclinstruments.com.",
    qrTextX,
    y + 12.5,
    { maxWidth: contentWidth - (qrBase64 ? 30 : 10) }
  );

  // =========================================================================
  // PAGE 2 — TECHNICAL INFORMATION & FEATURES
  // =========================================================================
  doc.addPage();
  y = margin;

  // Page 2 Mini Header
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y, contentWidth, 1.5, "F");
  y += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD. — TECHNICAL SPECIFICATIONS & FEATURES", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(docRef, pageWidth - margin, y, { align: "right" });

  y += 2.5;
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Technical Specifications Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...brandNavy);
  doc.text("TECHNICAL SPECIFICATIONS", margin, y);
  y += 4;

  const specKeys = Object.keys(specsObj);
  let tableBody = [];

  if (specKeys.length > 0) {
    tableBody = specKeys.map((key) => {
      const val = String(specsObj[key]);
      const standard =
        key.toLowerCase().includes("platen") || key.toLowerCase().includes("frame")
          ? "IS 516 / IS 14858"
          : key.toLowerCase().includes("accuracy")
          ? "IS 1828 / ASTM E4"
          : "—";
      return [formatTitleCase(key), standard, val];
    });
  } else {
    tableBody = [
      ["Capacity", "—", "500 kN / 2000 kN / 3000 kN"],
      ["Loading Accuracy", "IS 1828 / ASTM E4", "±1% (Class 1)"],
      ["Upper & Lower Platens", "IS 516 / IS 14858", "Hardened & Ground Steel"],
      ["Pace-Rate Control", "Automatic", "Servo Controlled via Microcontroller"],
      ["Flexural Testing Attachments", "On Customer Demand", "Available"],
    ];
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["PARAMETER", "STANDARD", "TECHNICAL VALUE"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: brandNavy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
      cellPadding: 2.4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: contentWidth * 0.38 },
      1: { cellWidth: contentWidth * 0.25 },
      2: { cellWidth: contentWidth * 0.37 },
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Key Features & Advantages (2-Column Grid)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...brandNavy);
  doc.text("KEY FEATURES & ADVANTAGES", margin, y);
  y += 5;

  const defaultFeatures = [
    "Servo Controlled Operation with advanced automatic load control",
    "10-Inch Touchscreen Display for easy operation and monitoring",
    "Upper & Lower Platens as per applicable IS 516 / IS 14858 requirements",
    "Automatic Pace-Rate Control through Software",
    "Auto Pace-Rate Display for real-time monitoring of loading rate",
    "Data Backup Facility for secure storage and retrieval of test results",
    "Silent Operation for a comfortable laboratory environment",
    "User Safety Feature with Metal Door / Guard",
    "Loading Accuracy up to ±1%",
  ];

  const features = product.features && product.features.length > 0 ? product.features : defaultFeatures;
  const colWidth = (contentWidth - 6) / 2;
  const leftFeatures = features.filter((_, i) => i % 2 === 0);
  const rightFeatures = features.filter((_, i) => i % 2 === 1);

  const startFeaturesY = y;
  let leftY = startFeaturesY;
  leftFeatures.forEach((feat) => {
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(224, 242, 254);
    const splitFeat = doc.splitTextToSize(feat, colWidth - 10);
    const cardH = Math.max(splitFeat.length * 3.4 + 4, 10);

    doc.roundedRect(margin, leftY, colWidth, cardH, 1.5, 1.5, "F");
    doc.roundedRect(margin, leftY, colWidth, cardH, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...brandEmerald);
    doc.text("✓", margin + 3, leftY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    doc.text(splitFeat, margin + 7.5, leftY + 4.5);

    leftY += cardH + 2.5;
  });

  let rightY = startFeaturesY;
  rightFeatures.forEach((feat) => {
    const col2X = margin + colWidth + 6;
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(224, 242, 254);
    const splitFeat = doc.splitTextToSize(feat, colWidth - 10);
    const cardH = Math.max(splitFeat.length * 3.4 + 4, 10);

    doc.roundedRect(col2X, rightY, colWidth, cardH, 1.5, 1.5, "F");
    doc.roundedRect(col2X, rightY, colWidth, cardH, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...brandEmerald);
    doc.text("✓", col2X + 3, rightY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    doc.text(splitFeat, col2X + 7.5, rightY + 4.5);

    rightY += cardH + 2.5;
  });

  y = Math.max(leftY, rightY) + 4;

  // Product Status Highlights (Reliability & Availability)
  const statusCardWidth = (contentWidth - 6) / 2;
  const statusH = 14;

  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, y, statusCardWidth, statusH, 2, 2, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, statusCardWidth, statusH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...brandNavy);
  doc.text("RELIABILITY", margin + 4, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandAmber);
  doc.text("Tested & Trusted", margin + 4, y + 10.5);

  const statusCard2X = margin + statusCardWidth + 6;
  doc.setFillColor(...bgLight);
  doc.roundedRect(statusCard2X, y, statusCardWidth, statusH, 2, 2, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(statusCard2X, y, statusCardWidth, statusH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...brandNavy);
  doc.text("AVAILABILITY", statusCard2X + 4, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandEmerald);
  doc.text("Ready to Dispatch", statusCard2X + 4, y + 10.5);

  // =========================================================================
  // PAGE 3 — APPLICATIONS + COMPANY INFORMATION
  // =========================================================================
  doc.addPage();
  y = margin;

  // Page 3 Mini Header
  doc.setFillColor(...brandNavy);
  doc.rect(margin, y, contentWidth, 1.5, "F");
  y += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...brandNavy);
  doc.text("ARCL INSTRUMENTS PVT. LTD. — APPLICATIONS & COMPANY INFORMATION", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(docRef, pageWidth - margin, y, { align: "right" });

  y += 2.5;
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Heading: INDUSTRIAL & LABORATORY APPLICATIONS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...brandNavy);
  doc.text("INDUSTRIAL & LABORATORY APPLICATIONS", margin, y);
  y += 5;

  const defaultApplications = [
    "Concrete Cube Compression Testing",
    "Concrete Cylinder Compression Testing",
    "Testing of Concrete Blocks and Paver Blocks",
    "Quality Control of Ready-Mix Concrete (RMC)",
    "Testing in Civil Engineering and Construction Material Laboratories",
    "Research & Development Laboratories",
    "Educational Institutions and Engineering Colleges",
    "Infrastructure and Construction Project Laboratories",
  ];

  const applications =
    product.applications && product.applications.length > 0
      ? product.applications
      : defaultApplications;

  const leftApps = applications.filter((_, i) => i % 2 === 0);
  const rightApps = applications.filter((_, i) => i % 2 === 1);

  const startAppsY = y;
  let leftAppY = startAppsY;
  leftApps.forEach((app) => {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(220, 252, 231);
    const splitApp = doc.splitTextToSize(app, colWidth - 10);
    const cardH = Math.max(splitApp.length * 3.4 + 4, 10);

    doc.roundedRect(margin, leftAppY, colWidth, cardH, 1.5, 1.5, "F");
    doc.roundedRect(margin, leftAppY, colWidth, cardH, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brandEmerald);
    doc.text("•", margin + 3.5, leftAppY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    doc.text(splitApp, margin + 7.5, leftAppY + 4.5);

    leftAppY += cardH + 2.5;
  });

  let rightAppY = startAppsY;
  rightApps.forEach((app) => {
    const col2X = margin + colWidth + 6;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(220, 252, 231);
    const splitApp = doc.splitTextToSize(app, colWidth - 10);
    const cardH = Math.max(splitApp.length * 3.4 + 4, 10);

    doc.roundedRect(col2X, rightAppY, colWidth, cardH, 1.5, 1.5, "F");
    doc.roundedRect(col2X, rightAppY, colWidth, cardH, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...brandEmerald);
    doc.text("•", col2X + 3.5, rightAppY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    doc.text(splitApp, col2X + 7.5, rightAppY + 4.5);

    rightAppY += cardH + 2.5;
  });

  y = Math.max(leftAppY, rightAppY) + 6;

  // Section: ENGINEERED FOR RELIABLE TESTING
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brandNavy);
  doc.text("ENGINEERED FOR RELIABLE TESTING", margin, y);
  y += 4;

  const summaryText =
    "ARCL Instruments Pvt. Ltd. designs and manufactures high-precision testing machinery compliant with rigorous national and international standards. Each instrument is calibrated and verified to guarantee superior accuracy, long-term operational stability, and uncompromised operator safety across heavy-duty laboratory and industrial conditions.";
  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text(doc.splitTextToSize(summaryText, contentWidth - 8), margin + 4, y + 5);

  y += 24;

  // Complete Set Includes (if available)
  if (product.completeSetIncludes && product.completeSetIncludes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brandNavy);
    doc.text("COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT)", margin, y);
    y += 4;

    product.completeSetIncludes.slice(0, 4).forEach((item, idx) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...brandEmerald);
      doc.text(`${idx + 1}.`, margin + 2, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...textDark);
      doc.text(item, margin + 6, y);
      y += 4;
    });
    y += 2;
  }

  // Contact / Company Section Card
  const contactCardHeight = 36;
  doc.setFillColor(...brandNavy);
  doc.roundedRect(margin, y, contentWidth, contactCardHeight, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("ARCL INSTRUMENTS PVT. LTD.", margin + 6, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708, Maharashtra, India",
    margin + 6,
    y + 13
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(253, 230, 138);
  doc.text(
    "Head: +91 8169695728   |   Sales: +91 8369458583   |   Calibration: +91 6205691085",
    margin + 6,
    y + 20
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "Email: arclinstruments@gmail.com / info@arclinstruments.com   |   Website: arclinstruments.com",
    margin + 6,
    y + 27
  );

  // =========================================================================
  // FOOTER (PAGES 1, 2, 3)
  // =========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 13;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(...brandNavy);
    doc.text("Website: arclinstruments.com", margin, footerY + 2.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...textDark);
    doc.text(`Product Code: ${sku}`, pageWidth / 2, footerY + 2.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY + 2.5, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "© 2026 ARCL Instruments Pvt. Ltd. All rights reserved. | An ISO 9001:2015 Certified Company",
      margin,
      footerY + 7
    );
  }

  doc.save(filename);
  return filename;
};
