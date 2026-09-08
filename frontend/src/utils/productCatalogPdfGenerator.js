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
 * 1:1 identical to the website catalog brochure design (3-page A4 format)
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

  // 1. ATTEMPT 1:1 PIXEL-PERFECT DOM RENDER OF EXACT USER DESIGN (3 PAGES)
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

  // 2. FALLBACK: NATIVE VECTOR PDF GENERATOR (3 PAGES)
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
  doc.text(`CATALOG SPEC: ${docRef}`, pageWidth - margin, y - 2, { align: "right" });

  y += 4.5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandEmerald);
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
  doc.text("Standard: IS / ASTM / BS / EN Compliant", pageWidth - margin, y, { align: "right" });

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
  const displayVal = specsObj["Display Unit"] || specsObj["Display"] || specsObj["display"] || "10-INCH Touch / Digital";
  const operationVal = specsObj["Control System"] || specsObj["Operation"] || specsObj["operation"] || "SERVO CONTROLLED";

  const highlightCards = [
    { title: "Capacity", val: String(capacityVal).split("/")[0].trim() || "2000 kN" },
    { title: "Loading Accuracy", val: String(accuracyVal).split("(")[0].trim() || "±1%" },
    { title: "Display Unit", val: String(displayVal).split("/")[0].trim() || "10-INCH Digital" },
    { title: "Operation", val: String(operationVal).split("/")[0].trim() || "SERVO CONTROLLED" },
  ];

  highlightCards.forEach((c, idx) => {
    const cx = margin + idx * (cardWidth + 3);
    doc.setFillColor(...bgLight);
    doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(cx, y, cardWidth, cardHeight, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...brandNavy);
    const shortVal = c.val.length > 15 ? c.val.substring(0, 14) + "..." : c.val;
    doc.text(shortVal, cx + cardWidth / 2, y + 7.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...textMuted);
    doc.text(c.title, cx + cardWidth / 2, y + 13, { align: "center" });
  });

  y += cardHeight + 7;

  // Page 1 Bottom: Key Features Summary
  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, y, contentWidth, 38, 2.5, 2.5, "F");
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 38, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandNavy);
  doc.text("ENGINEERING HIGHLIGHTS & SAFETY ASSURANCE", margin + 5, y + 6);

  const p1Highlights = [
    "High-Rigidity 4-Column Solid Loading Frame for minimal deflection under peak stress",
    "Closed-Loop Digital Servo Pace Rate Regulation ensuring repeatable test cycles",
    "Automatic Specimen Failure Peak Detection with instant auto-release valve",
    "Direct USB & Ethernet LAN Port for automated test data export and PC software logging",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  p1Highlights.forEach((h, idx) => {
    doc.text(`•  ${h}`, margin + 6, y + 13 + idx * 6);
  });

  // Page 1 Footer
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Brochure"}`, margin, pageHeight - 7);
  doc.text("Page 1 of 3", pageWidth - margin, pageHeight - 7, { align: "right" });

  // =========================================================================
  // PAGE 2 — TECHNICAL SPECIFICATIONS + HOW IT WORKS
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
  doc.text("ARCL INSTRUMENTS PVT. LTD. — TECHNICAL SPECIFICATIONS & WORKFLOW", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(docRef, pageWidth - margin, y, { align: "right" });

  y += 3;
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Technical Specifications Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...brandNavy);
  doc.text("TECHNICAL SPECIFICATIONS", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text("Standard compliance & certified technical ratings", margin, y + 4.5);
  y += 7;

  let specRows = [];
  if (product.specifications && Object.keys(product.specifications).length > 0) {
    specRows = Object.entries(product.specifications).map(([k, v]) => [
      formatTitleCase(k),
      String(v),
    ]);
  } else {
    specRows = [
      ["Frame Capacity", "500 kN / 2000 kN / 3000 kN"],
      ["Loading Accuracy", "±1% of indicated load (Class 1)"],
      ["Platen Hardness & Surface", "55 HRC Hardened & Fine Ground"],
      ["Piston Travel / Stroke", "50 mm with Over-Travel Limit Switch"],
      ["Power Supply", "415V AC, 3 Phase, 50 Hz"],
      ["Standard Compliance", "IS 14858, IS 516, ASTM C39, BS 1881"],
    ];
  }

  autoTable(doc, {
    startY: y,
    head: [["Parameter / Specification", "Standard Technical Value"]],
    body: specRows.slice(0, 10),
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

  // How It Works / Working Principle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...brandNavy);
  doc.text("HOW IT WORKS / WORKING PRINCIPLE", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text("Step-by-step standardized testing procedure", margin, y + 4.5);
  y += 7;

  if (product.category?.howItWorks) {
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...brandNavy);
    const splitHow = doc.splitTextToSize(product.category.howItWorks, contentWidth - 6);
    doc.text(splitHow.slice(0, 3), margin + 3, y + 4.5);
    y += 17;
  }

  const stepList =
    product.category?.howItWorksSteps && product.category.howItWorksSteps.length > 0
      ? product.category.howItWorksSteps
      : [
          {
            title: "Sample Preparation & Centering",
            description: "Place the prepared specimen symmetrically on lower platen using concentric centering guides.",
          },
          {
            title: "Pace Rate & Parameter Setting",
            description: "Configure testing parameters, specimen dimensions, and target pace rate (e.g. 5.2 kN/s) on digital HMI.",
          },
          {
            title: "Automatic Servo Loading Execution",
            description: "Initiate test with one-touch start; electro-hydraulic servo system applies uniform, shock-free compression.",
          },
          {
            title: "Peak Failure Detection & Logging",
            description: "Automatic specimen break detection stops loading, records peak stress/load, and logs data to memory.",
          },
        ];

  const stepBoxWidth = (contentWidth - 6) / 2;
  const stepBoxHeight = 22;

  stepList.slice(0, 4).forEach((st, idx) => {
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
    doc.text(String(idx + 1), sx + 5.5, sy + 6.8, { align: "center" });

    // Step Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...brandNavy);
    doc.text(st.title, sx + 10, sy + 6.8);

    // Step Desc
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...textDark);
    const splitDesc = doc.splitTextToSize(st.description, stepBoxWidth - 6);
    doc.text(splitDesc.slice(0, 3), sx + 3, sy + 12);
  });

  // Page 2 Footer
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(`ARCL Instruments Pvt. Ltd. | ${product.name || "Brochure"}`, margin, pageHeight - 7);
  doc.text("Page 2 of 3", pageWidth - margin, pageHeight - 7, { align: "right" });

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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(docRef, pageWidth - margin, y, { align: "right" });

  y += 3;
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // 2-Column: Applications & System Advantages
  const colWidth = (contentWidth - 6) / 2;
  const colHeight = 54;

  // Left: Applications
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(margin, y, colWidth, colHeight, 2.5, 2.5, "F");
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, colWidth, colHeight, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text("KEY INDUSTRIAL & LAB APPLICATIONS", margin + 4, y + 6);

  const defaultApps = [
    "Ready-Mix Concrete (RMC) & Commercial Batching Plants",
    "Civil Engineering, Material Testing & Calibration Laboratories",
    "Highway, Expressway, Bridge & Metro Infrastructure Projects",
    "NABL / Quality Assurance & Government Research Institutions",
    "Precast Concrete, Block & Construction Materials Manufacturing",
  ];
  const appsToRender =
    product.applications && product.applications.length > 0
      ? product.applications
      : defaultApps;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  appsToRender.slice(0, 5).forEach((app, i) => {
    const splitApp = doc.splitTextToSize(`•  ${app}`, colWidth - 8);
    doc.text(splitApp.slice(0, 2), margin + 4, y + 13 + i * 8);
  });

  // Right: System Advantages & Safety
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(rightColX, y, colWidth, colHeight, 2.5, 2.5, "F");
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(rightColX, y, colWidth, colHeight, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...brandNavy);
  doc.text("SYSTEM ADVANTAGES & SAFETY", rightColX + 4, y + 6);

  const advList = [
    "Precision load cell / pressure transducer for high linearity",
    "Emergency stop button & transparent fragment safety door",
    "Over-load & over-travel hydraulic safety cut-off protection",
    "Real-time load vs time graphical display on touchscreen",
    "Optional RS232 / USB interface for automated PC logging",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  advList.forEach((adv, i) => {
    const splitAdv = doc.splitTextToSize(`•  ${adv}`, colWidth - 8);
    doc.text(splitAdv.slice(0, 2), rightColX + 4, y + 13 + i * 8);
  });

  y += colHeight + 8;

  // Complete Set Includes (Standard Supply Outfit)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brandNavy);
  doc.text("COMPLETE SET INCLUDES (STANDARD SUPPLY OUTFIT)", margin, y);
  y += 4.5;

  const defaultOutfit = [
    "Main Heavy-Duty Loading Frame with High-Rigidity Construction",
    "Hydraulic Power Pack with High-Precision Servo Valve",
    "Advanced Digital Microprocessor / Touchscreen Controller Unit",
    "Hardened & Ground Upper & Lower Compression Platens",
    "Distance Pieces / Spacers Set for Multiple Specimen Sizes",
    "Traceable National Calibration Certificate & Operating Manual",
  ];
  const outfitList =
    product.completeSetIncludes && product.completeSetIncludes.length > 0
      ? product.completeSetIncludes
      : defaultOutfit;

  const outfitBoxWidth = (contentWidth - 6) / 2;
  const outfitBoxHeight = 12;

  outfitList.slice(0, 6).forEach((item, idx) => {
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

  y += 3 * (outfitBoxHeight + 3) + 7;

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
  doc.text("Page 3 of 3", pageWidth - margin, pageHeight - 7, { align: "right" });

  // Save PDF
  doc.save(filename);
  return filename;
};
