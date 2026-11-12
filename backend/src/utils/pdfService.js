import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import { computeCustomerQrSignature } from "./srfGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../../public/assets/LOGO.png");
const QR_IMAGE_PATH = path.resolve(__dirname, "../../public/assets/hdfc_qr.png");
const STAMP_IMAGE_PATH = path.resolve(__dirname, "../../public/assets/arcl_stamp.png");

// Helper to generate dynamic UPI QR PNG Buffer for PDF embedding
const upiQrCache = new Map();
const getDynamicUpiQrBuffer = async ({ vpa, payeeName, amount, refNote }) => {
  const upiVpa = (vpa || process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc").trim();
  const am = Number(amount || 0) > 0 ? Number(amount).toFixed(2) : "1.00";
  const upiString = `upi://pay?pa=${upiVpa}&pn=ARCL&am=${am}&cu=INR`;
  if (upiQrCache.has(upiString)) return upiQrCache.get(upiString);

  try {
    const pngBuffer = await QRCode.toBuffer(upiString, {
      width: 350,
      margin: 3,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    if (pngBuffer) upiQrCache.set(upiString, pngBuffer);
    return pngBuffer;
  } catch (err) {
    return null;
  }
};

// Helper to get static official bank QR code image buffer
const getStaticQrBuffer = () => {
  const pngPath = path.resolve(__dirname, "../../public/assets/hdfc_qr.png");
  const jpgPath = path.resolve(__dirname, "../../public/assets/hdfc_qr.jpg");
  if (fs.existsSync(pngPath)) {
    try { return fs.readFileSync(pngPath); } catch (e) {}
  }
  if (fs.existsSync(jpgPath)) {
    try { return fs.readFileSync(jpgPath); } catch (e) {}
  }
  return null;
};

// Default Official ARCL Terms & Conditions (4-Line Standard)
export const DEFAULT_TERMS = [
  "This is an electronically generated document.",
  "All disputes are subject to Mumbai jurisdiction.",
  "Payment: 100% advance.",
  "Transportation as actual in customer scope."
];

// Helper to reliably parse terms input as array of strings
export const parseTermsList = (termsInput, fallback = DEFAULT_TERMS) => {
  if (Array.isArray(termsInput) && termsInput.length > 0) {
    const cleaned = termsInput.map((t) => String(t || "").trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }
  if (typeof termsInput === "string" && termsInput.trim()) {
    try {
      const parsed = JSON.parse(termsInput);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t) => String(t || "").trim()).filter(Boolean);
      }
    } catch (_) {}
    const lines = termsInput.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return fallback;
};

// Helper to convert number to Indian Currency Words
export function numberToWords(num) {
  if (!num || isNaN(num)) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return "Overflow";
    const match = ("000000000" + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return "";
    let str = "";
    str += match[1] != 0 ? (a[Number(match[1])] || b[match[1][0]] + " " + a[match[1][1]]) + "Crore " : "";
    str += match[2] != 0 ? (a[Number(match[2])] || b[match[2][0]] + " " + a[match[2][1]]) + "Lakh " : "";
    str += match[3] != 0 ? (a[Number(match[3])] || b[match[3][0]] + " " + a[match[3][1]]) + "Thousand " : "";
    str += match[4] != 0 ? (a[Number(match[4])] || b[match[4][0]] + " " + a[match[4][1]]) + "Hundred " : "";
    str += match[5] != 0 ? ((str != "") ? "And " : "") + (a[Number(match[5])] || b[match[5][0]] + " " + a[match[5][1]]) : "";
    return str.trim();
  }

  const parts = Number(num).toFixed(2).split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? parseInt(parts[1].slice(0, 2), 10) : 0;

  let words = "INR " + inWords(integerPart);
  if (decimalPart > 0) {
    words += " And " + inWords(decimalPart) + " Paise";
  }
  return words + " Only.";
}

/**
 * Standard Default Data Sets
 */
export const defaultPurchaseOrder19Items = [
  { slNo: "1", itemCode: "9000109", description: "Measuring Cylinder - 1000ml, PP, Hexagonal\nBase (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "400.00", cgstPct: "9", cgstAmt: "36.00", sgstPct: "9", sgstAmt: "36.00", igstPct: "0", igstAmt: "0.00", grossAmt: "472.00" },
  { slNo: "2", itemCode: "9000108", description: "Measuring Cylinder - 500ml, PP, Hexagonal\nBase (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "350.00", cgstPct: "9", cgstAmt: "31.50", sgstPct: "9", sgstAmt: "31.50", igstPct: "0", igstAmt: "0.00", grossAmt: "413.00" },
  { slNo: "3", itemCode: "9000107", description: "Measuring Cylinder - 250ml, PP, Hexagonal\nBase (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "300.00", cgstPct: "9", cgstAmt: "27.00", sgstPct: "9", sgstAmt: "27.00", igstPct: "0", igstAmt: "0.00", grossAmt: "354.00" },
  { slNo: "4", itemCode: "9000106", description: "Measuring Cylinder - 100ml, PP, Hexagonal\nBase (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "2", rate: "250.00", cgstPct: "9", cgstAmt: "45.00", sgstPct: "9", sgstAmt: "45.00", igstPct: "0", igstAmt: "0.00", grossAmt: "590.00" },
  { slNo: "5", itemCode: "9000115", description: "Cube Mould 150x150x150mm ISI Marked (NABL\nCalibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "6", rate: "250.00", cgstPct: "9", cgstAmt: "135.00", sgstPct: "9", sgstAmt: "135.00", igstPct: "0", igstAmt: "0.00", grossAmt: "1770.00" },
  { slNo: "6", itemCode: "9000116", description: "Cube Mould 70.6x70.6x70.6mm ISI Marked (NABL\nCalibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "3", rate: "250.00", cgstPct: "9", cgstAmt: "67.50", sgstPct: "9", sgstAmt: "67.50", igstPct: "0", igstAmt: "0.00", grossAmt: "885.00" },
  { slNo: "7", itemCode: "9000117", description: "Compression Testing Machine 2000 kN (NABL\nCalibration Report & Seal)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "5000.00", cgstPct: "9", cgstAmt: "450.00", sgstPct: "9", sgstAmt: "450.00", igstPct: "0", igstAmt: "0.00", grossAmt: "5900.00" },
  { slNo: "8", itemCode: "9000118", description: "Digital Weighing Balance 30kg Cap (NABL\nCalibration Certificate)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "800.00", cgstPct: "9", cgstAmt: "72.00", sgstPct: "9", sgstAmt: "72.00", igstPct: "0", igstAmt: "0.00", grossAmt: "944.00" },
  { slNo: "9", itemCode: "9000119", description: "Precision Weighing Balance 600g (NABL\nCalibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "800.00", cgstPct: "9", cgstAmt: "72.00", sgstPct: "9", sgstAmt: "72.00", igstPct: "0", igstAmt: "0.00", grossAmt: "944.00" },
  { slNo: "10", itemCode: "9000120", description: "Hot Air Oven 14x14x14 Inch Digital (NABL\nTemperature Profile)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "1200.00", cgstPct: "9", cgstAmt: "108.00", sgstPct: "9", sgstAmt: "108.00", igstPct: "0", igstAmt: "0.00", grossAmt: "1416.00" },
  { slNo: "11", itemCode: "9000121", description: "Water Bath Digital Controller (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "1000.00", cgstPct: "9", cgstAmt: "90.00", sgstPct: "9", sgstAmt: "90.00", igstPct: "0", igstAmt: "0.00", grossAmt: "1180.00" },
  { slNo: "12", itemCode: "9000122", description: "Vicat Apparatus with Needle (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "600.00", cgstPct: "9", cgstAmt: "54.00", sgstPct: "9", sgstAmt: "54.00", igstPct: "0", igstAmt: "0.00", grossAmt: "708.00" },
  { slNo: "13", itemCode: "9000123", description: "Le-Chatelier Mould & Flask (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "2", rate: "400.00", cgstPct: "9", cgstAmt: "72.00", sgstPct: "9", sgstAmt: "72.00", igstPct: "0", igstAmt: "0.00", grossAmt: "944.00" },
  { slNo: "14", itemCode: "9000124", description: "Brass Test Sieves 200mm Dia (Set of 7) (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "SET", qty: "1", rate: "2100.00", cgstPct: "9", cgstAmt: "189.00", sgstPct: "9", sgstAmt: "189.00", igstPct: "0", igstAmt: "0.00", grossAmt: "2478.00" },
  { slNo: "15", itemCode: "9000125", description: "GI Test Sieves 300mm Dia (Set of 5) (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "SET", qty: "1", rate: "2000.00", cgstPct: "9", cgstAmt: "180.00", sgstPct: "9", sgstAmt: "180.00", igstPct: "0", igstAmt: "0.00", grossAmt: "2360.00" },
  { slNo: "16", itemCode: "9000126", description: "Slump Test Apparatus ISI Marked (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "2", rate: "500.00", cgstPct: "9", cgstAmt: "90.00", sgstPct: "9", sgstAmt: "90.00", igstPct: "0", igstAmt: "0.00", grossAmt: "1180.00" },
  { slNo: "17", itemCode: "9000127", description: "Digital Vernier Caliper 300mm (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "500.00", cgstPct: "9", cgstAmt: "45.00", sgstPct: "9", sgstAmt: "45.00", igstPct: "0", igstAmt: "0.00", grossAmt: "590.00" },
  { slNo: "18", itemCode: "9000128", description: "Stop Watch Digital (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: "1", rate: "400.00", cgstPct: "9", cgstAmt: "36.00", sgstPct: "9", sgstAmt: "36.00", igstPct: "0", igstAmt: "0.00", grossAmt: "472.00" },
  { slNo: "19", itemCode: "9000129", description: "On-site Calibration Technical Charges & Stamping", hsnCode: "998346", reqDate: "27-07-2026", uom: "LS", qty: "1", rate: "3000.00", cgstPct: "9", cgstAmt: "270.00", sgstPct: "9", sgstAmt: "270.00", igstPct: "0", igstAmt: "0.00", grossAmt: "3540.00" },
];

export const defaultQuotationItems = [
  { itemNo: 1, name: "Rebound Hammer - Calibration", subText: "Non-NABL Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 2, name: "Rebar Scanner - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 3, name: "Le-Chatelier Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 200, qty: 6, qtyUnit: "NOS", amount: 1200 },
  { itemNo: 4, name: "Brass Test Sieve- Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 20, qtyUnit: "NOS", amount: 6000 },
  { itemNo: 5, name: "GI Test Sieve - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 10, qtyUnit: "NOS", amount: 3000 },
  { itemNo: 6, name: "ACT Machine - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 7, name: "Crushing Value - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 8, name: "Cube Mould 70.6mm - Calibration", subText: "50mm-6, 70.6mm-6\nNABL Thirdparty Report", hsnSac: "998346", rate: 200, qty: 12, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 9, name: "Bulk Density Cylinder - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 3, qtyUnit: "NOS", amount: 300 },
  { itemNo: 10, name: "Dial Gauge 25mm - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 11, name: "Weigh Balance 600g - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 12, name: "weighing Balance (5kg)-Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 13, name: "Weigh Balance (upto 100kg) - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 900, qty: 1, qtyUnit: "NOS", amount: 900 },
  { itemNo: 14, name: "Compression Testing Machine 2000kN - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 4500, qty: 1, qtyUnit: "NOS", amount: 4500 },
  { itemNo: 15, name: "Stop Watch - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 16, name: "Humidity Chamber - Calibration", subText: "NABL Thirdparty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 17, name: "Hygrometer - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 18, name: "Vernier Caliper - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 19, name: "Buoyancy Balance - Calibration", subText: "NABL Third Party Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 20, name: "Weigh Balance 30kg - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 21, name: "Elongation Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 22, name: "Flakiness Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 23, name: "Impact Value - Calibration", subText: "Nabl Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 24, name: "Measuring Cylinder - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 6, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 25, name: "Measuring Tape - Calibration", subText: "Nabl Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 26, name: "Pycnometer - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 1, qtyUnit: "NOS", amount: 400 },
  { itemNo: 27, name: "Hot Air Oven - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 28, name: "Vicat Apparatus - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 29, name: "Mortar Vibrating Machine - Calibration", subText: "Nabl ThirdParty Report(rpm)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 30, name: "Water Bath - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 31, name: "Core Cutter Dolly - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 32, name: "Sand Pouring Cylinder - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 33, name: "Liquid Limit - Calibration", subText: "Non-NABL Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 34, name: "Plastic Limit - Calibration", subText: "Non-NABL Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 35, name: "Proctor Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 2, qtyUnit: "NOS", amount: 800 },
  { itemNo: 36, name: "Flow Table - Calibration", subText: "Nabl Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 37, name: "Mortar Mixer - Calibration", subText: "NABL Thirdparty Report(RPM)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
];

export const defaultTaxInvoiceItems = [
  { itemNo: 1, name: "Le-Chatelier Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 6, qtyUnit: "NOS", rate: 200, per: "NOS", amount: 1200 },
  { itemNo: 2, name: "Brass Test Sieve- Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 20, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 6000 },
  { itemNo: 3, name: "GI Test Sieve - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 10, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 3000 },
  { itemNo: 4, name: "ACT Machine - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 5, name: "Cube Mould 70.6mm - Calibration", subText: "50mm-6, 70.6mm-6\nNABL Thirdparty Report", hsnSac: "998346", taxRate: "18%", qty: 12, qtyUnit: "NOS", rate: 200, per: "NOS", amount: 2400 },
  { itemNo: 6, name: "Dial Gauge 25mm - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 7, name: "Weigh Balance 600g - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 8, name: "weighing Balance (5kg)-Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 9, name: "Weigh Balance (upto 100kg) - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 900, per: "NOS", amount: 900 },
  { itemNo: 10, name: "Compression Testing Machine 2000kN - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 5000, per: "NOS", amount: 5000 },
  { itemNo: 11, name: "Stop Watch - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 950, per: "NOS", amount: 950 },
  { itemNo: 12, name: "Humidity Chamber - Calibration", subText: "NABL Thirdparty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 950, per: "NOS", amount: 950 },
  { itemNo: 13, name: "Hygrometer - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 14, name: "Vernier Caliper - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 15, name: "Buoyancy Balance - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 16, name: "Weigh Balance 30kg - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 17, name: "Elongation Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 18, name: "Flakiness Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 19, name: "Measuring Cylinder - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 6, qtyUnit: "NOS", rate: 400, per: "NOS", amount: 2400 },
  { itemNo: 20, name: "Measuring Tape - Calibration", subText: "Nabl Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 21, name: "Pycnometer - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 400, per: "NOS", amount: 400 },
  { itemNo: 22, name: "Hot Air Oven - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 23, name: "Mortar Vibrating Machine - Calibration", subText: "Nabl ThirdParty Report(rpm)", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 24, name: "Water Bath - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 25, name: "Proctor Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 2, qtyUnit: "NOS", rate: 400, per: "NOS", amount: 800 },
  { itemNo: 26, name: "Mortar Mixer - Calibration", subText: "NABL Thirdparty Report(RPM)", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
];

export const defaultProformaInvoiceItems = [
  { itemNo: 1, name: "Le-Chatelier Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 200, qty: 6, qtyUnit: "NOS", amount: 1200 },
  { itemNo: 2, name: "Brass Test Sieve- Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 20, qtyUnit: "NOS", amount: 6000 },
  { itemNo: 3, name: "GI Test Sieve - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 10, qtyUnit: "NOS", amount: 3000 },
  { itemNo: 4, name: "ACT Machine - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 5, name: "Cube Mould 70.6mm - Calibration", subText: "50mm-6, 70.6mm-6\nNABL Thirdparty Report", hsnSac: "998346", rate: 200, qty: 12, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 6, name: "Dial Gauge 25mm - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 7, name: "Weigh Balance 600g - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 8, name: "weighing Balance (5kg)-Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 9, name: "Weigh Balance (upto 100kg) - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 900, qty: 1, qtyUnit: "NOS", amount: 900 },
  { itemNo: 10, name: "Compression Testing Machine 2000kN - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 5000, qty: 1, qtyUnit: "NOS", amount: 5000 },
  { itemNo: 11, name: "Stop Watch - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 12, name: "Humidity Chamber - Calibration", subText: "NABL Thirdparty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 13, name: "Hygrometer - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 14, name: "Vernier Caliper - Calibration", subText: "", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 15, name: "Buoyancy Balance - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 16, name: "Weigh Balance 30kg - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 17, name: "Elongation Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 18, name: "Flakiness Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 19, name: "Measuring Cylinder - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 6, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 20, name: "Measuring Tape - Calibration", subText: "Nabl Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 21, name: "Pycnometer - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 1, qtyUnit: "NOS", amount: 400 },
  { itemNo: 22, name: "Hot Air Oven - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 23, name: "Mortar Vibrating Machine - Calibration", subText: "Nabl ThirdParty Report(rpm)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 24, name: "Water Bath - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 25, name: "Proctor Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 2, qtyUnit: "NOS", amount: 800 },
  { itemNo: 26, name: "Mortar Mixer - Calibration", subText: "NABL Thirdparty Report(RPM)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
];

/**
 * Applies a subtle repeating diagonal watermark grid across all buffered pages in PDFKit.
 * Text: "ARCL INSTRUMENTS PVT. LTD."
 */
const applyPdfKitWatermark = (doc) => {
  try {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.save();
      doc.opacity(0.045);
      doc.fillColor("#021C57");
      doc.fontSize(9.5);
      doc.font("Helvetica-Bold");

      const text = "ARCL INSTRUMENTS PVT. LTD.";
      const angle = -32;
      const xStep = 185;
      const yStep = 80;
      const width = doc.page.width;
      const height = doc.page.height;

      for (let wy = -50; wy < height + 100; wy += yStep) {
        const isOdd = Math.floor((wy + 50) / yStep) % 2 !== 0;
        const rowOffset = isOdd ? xStep / 2 : 0;
        for (let wx = -80; wx < width + 100; wx += xStep) {
          doc.rotate(angle, { origin: [wx + rowOffset, wy] });
          doc.text(text, wx + rowOffset - 60, wy, { lineBreak: false });
          doc.rotate(-angle, { origin: [wx + rowOffset, wy] });
        }
      }

      doc.restore();
    }
  } catch (err) {
    // Failsafe
  }
};

/**
 * Buffer Builder
 */
const buildPdfBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));
    applyPdfKitWatermark(doc);
    doc.end();
  });
};

/**
 * Common Header for Technical Calibration Documents (Enlarged, Clear & Authoritative)
 */
const drawOfficialHeader = (doc, title = "Official Document", accentColor = "#b91c1c") => {
  const topY = 16;
  const logoWidth = 88;
  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, 35, topY, { width: logoWidth });
    } catch (e) {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 35, topY);
    }
  } else {
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 35, topY);
  }

  const headerTextX = 35 + logoWidth + 12; // 135
  const headerTextW = 560 - headerTextX;   // 425 pt

  let hCursorY = topY;
  doc
    .fontSize(15.0)
    .font("Helvetica-Bold")
    .fillColor("#021C57")
    .text("ARCL INSTRUMENTS PRIVATE LIMITED", headerTextX, hCursorY);
  hCursorY += 16;

  doc
    .fontSize(8.8)
    .font("Helvetica-Bold")
    .fillColor("#059669")
    .text("NABL ACCREDITED CALIBRATION LABORATORY (CC-4313)  |  ISO/IEC 17025:2017", headerTextX, hCursorY);
  hCursorY += 13;

  doc
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor("#334155")
    .text("Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708", headerTextX, hCursorY);
  hCursorY += 11;

  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("GSTIN: 27AATCA7874C1ZB  |  Phone: +91 8369458583 / +91 6205691085", headerTextX, hCursorY);
  hCursorY += 11;

  doc
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor("#334155")
    .text("Email: arclinstruments@gmail.com  |  Website: www.arcl.in  |  Maharashtra, India", headerTextX, hCursorY);
  hCursorY += 13;

  const sepY = Math.max(hCursorY, topY + 76);
  doc.moveTo(35, sepY).lineTo(560, sepY).lineWidth(2.0).strokeColor("#2563EB").stroke();

  doc.rect(35, sepY + 5, 525, 20).fillColor("#f1f5f9").fill();
  doc
    .fontSize(10.5)
    .font("Helvetica-Bold")
    .fillColor(accentColor)
    .text(title.toUpperCase(), 35, sepY + 10, { align: "center", width: 525 });

  return sepY + 30;
};

/**
 * Common Footer for Technical Calibration Documents
 */
let cachedUpiQrBuffer = null;
const getCachedUpiQrBuffer = async (amount = 0) => {
  const am = Number(amount || 0) > 0 ? Number(amount).toFixed(2) : "1.00";
  const upiVpa = (process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc").trim();
  const upiString = `upi://pay?pa=${upiVpa}&pn=ARCL&am=${am}&cu=INR`;
  try {
    const buf = await QRCode.toBuffer(upiString, { width: 350, margin: 3, color: { dark: "#0f172a", light: "#ffffff" } });
    if (!cachedUpiQrBuffer) cachedUpiQrBuffer = buf;
    return buf;
  } catch (e) {
    return cachedUpiQrBuffer;
  }
};

/**
 * Common Footer for Technical Calibration Documents (With Dual QR Codes)
 */
const drawOfficialFooter = (doc, customY = null, dynamicQrBuf = null) => {
  const y = customY !== null ? customY : 725;
  doc.moveTo(35, y).lineTo(560, y).lineWidth(0.8).strokeColor("#cbd5e1").stroke();

  const staticQrBuffer = getStaticQrBuffer();
  const dynQrBuffer = dynamicQrBuf || cachedUpiQrBuffer;

  // Box 1: Static Official Bank QR (Left: 38 to 120)
  doc.rect(38, y + 4, 82, 42).lineWidth(0.6).strokeColor("#021C57").stroke();
  if (staticQrBuffer) {
    try {
      doc.image(staticQrBuffer, 41, y + 6, { width: 38, height: 38 });
    } catch (e) {}
    doc
      .fontSize(5)
      .font("Helvetica-Bold")
      .fillColor("#021C57")
      .text("BANK QR", 78, y + 8, { width: 40, align: "center" })
      .fillColor("#059669")
      .text("VERIFIED", 78, y + 16, { width: 40, align: "center" })
      .fillColor("#64748b")
      .text("CC-4313", 78, y + 24, { width: 40, align: "center" });
  }

  // Box 2: Dynamic Auto-Pay UPI QR (Middle: 124 to 206)
  doc.rect(124, y + 4, 82, 42).lineWidth(0.6).strokeColor("#0284c7").stroke();
  if (dynQrBuffer) {
    try {
      doc.image(dynQrBuffer, 127, y + 6, { width: 38, height: 38 });
    } catch (e) {}
    doc
      .fontSize(5)
      .font("Helvetica-Bold")
      .fillColor("#0284c7")
      .text("AUTO PAY", 164, y + 8, { width: 40, align: "center" })
      .fillColor("#059669")
      .text("UPI PAY", 164, y + 16, { width: 40, align: "center" })
      .fillColor("#64748b")
      .text("FREE", 164, y + 24, { width: 40, align: "center" });
  }

  // Verification Statement Text in center (210 to 415)
  doc
    .fontSize(5.8)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(
      "Authentic metrological document issued under authority of ARCL Instruments. Dual-verified authentic as per ISO/IEC 17025 & NABL CC-4313.",
      210,
      y + 11,
      { width: 205, align: "center" }
    );

  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, 440, y - 8, { width: 80 });
    } catch (e) {}
  }

  doc.moveTo(420, y + 36).lineTo(550, y + 36).lineWidth(0.8).strokeColor("#475569").stroke();
  doc
    .fontSize(7.5)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text("Authorized Signatory", 420, y + 39, { width: 130, align: "center" });
  doc
    .fontSize(6.5)
    .font("Helvetica")
    .fillColor("#64748b")
    .text("Quality Manager, ARCL Calibration", 420, y + 48, { width: 130, align: "center" });
};

/**
 * =========================================================================
 * 1. DYNAMIC AUTO-SPACED & PAGINATED OFFICIAL ARCL TAX INVOICE PDF
 * =========================================================================
 */
export const generateTaxInvoicePdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 10, bufferPages: true });

  const inv = customData.taxInvoiceData || customData;
  const invoiceNo = inv.invoiceNo || "ARCL/26-27/74";
  const invoiceDate = inv.invoiceDate
    ? (inv.invoiceDate instanceof Date ? inv.invoiceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(inv.invoiceDate))
    : "22 Jun 2026";
  const dueDate = inv.dueDate
    ? (inv.dueDate instanceof Date ? inv.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(inv.dueDate))
    : "23 Jun 2026";
  const placeOfSupply = inv.placeOfSupply || "27-MAHARASHTRA";

  const rawCompany = inv.clientCompany || inv.billTo?.companyName || "RDSS QUALITY CONTROL LAB PRIVATE LIMITED";
  const clientCompany = String(rawCompany).replace(/\r?\n+/g, " ").trim();
  const rawGstin = inv.clientGstin || inv.billTo?.gstin || "27AAOCR3275P1ZH";
  const clientGstin = String(rawGstin).replace(/\r?\n+/g, " ").trim();
  const rawAddress = inv.clientAddress || (inv.billTo?.address ? `${inv.billTo.address}, ${inv.billTo.cityStatePin || ""}` : "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS, BELAVALI, Ambarnath, Thane, MAHARASHTRA, 421503");
  const clientAddress = String(rawAddress).replace(/\r?\n+/g, ", ").replace(/\s+,/g, ",").trim();

  let items = inv.items && Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : defaultTaxInvoiceItems;

  const formattedItems = items.map((it, idx) => ({
    itemNo: it.itemNo || idx + 1,
    name: String(it.name || it.description || `Calibration Service ${idx + 1}`).replace(/\r?\n+/g, " ").trim(),
    subText: String(it.subText || it.remarks || "").replace(/\r?\n+/g, " ").trim(),
    hsnSac: String(it.hsnSac || it.hsnCode || "998346").trim(),
    taxRate: String(it.taxRate || it.gstRate || "18%").trim(),
    qty: Number(it.qty || 1),
    qtyUnit: String(it.qtyUnit || it.uom || "NOS").trim(),
    rate: Number(it.rate || 0),
    amount: (Number(it.amount) || Number(it.qty || 1) * Number(it.rate || 0)),
  }));

  const taxableAmount = formattedItems.reduce((acc, curr) => acc + curr.amount, 0);
  const isInterstate = placeOfSupply && !placeOfSupply.startsWith("27");
  const cgstRate = isInterstate ? 0 : 9;
  const sgstRate = isInterstate ? 0 : 9;
  const igstRate = isInterstate ? 18 : 0;
  const cgstAmount = isInterstate ? 0 : taxableAmount * 0.09;
  const sgstAmount = isInterstate ? 0 : taxableAmount * 0.09;
  const igstAmount = isInterstate ? taxableAmount * 0.18 : 0;
  const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  // Bank & UPI QR Code
  const bankName = (inv.bankName || process.env.BANK_NAME || "HDFC Bank").trim();
  const accountNo = (inv.accountNo || process.env.BANK_ACCOUNT_NO || "50200111763991").trim();
  const branchName = (inv.bankBranch || process.env.BANK_BRANCH || "Kandivali East - Thakur Village").trim();
  const ifscCode = (inv.ifscCode || process.env.BANK_IFSC || "HDFC0000582").trim();

  const staticQrBuffer = getStaticQrBuffer();
  const dynamicQrBuffer = await getDynamicUpiQrBuffer({
    vpa: inv.upiVpa || process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc",
    payeeName: inv.upiName || process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
    amount: totalAmount,
    refNote: `CALIB-${String(invoiceNo || "TAX").replace(/[^a-zA-Z0-9]/g, "")}`,
  });

  const leftMargin = 30;
  const contentWidth = 535;

  // Header helper - exactly identical across Page 1, Page 2, Page 3, and all continuation pages
  const drawTaxInvoiceHeader = () => {
    const topY = 16;
    const logoWidth = 88;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, leftMargin, topY + 2, { width: logoWidth });
      } catch (e) {
        doc.fontSize(22).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
      }
    } else {
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
    }

    const badgeW = 118;
    const badgeH = 54;
    const badgeX = leftMargin + contentWidth - badgeW; // 447
    doc.rect(badgeX, topY + 2, badgeW, badgeH).fillColor("#021C57").fill();
    doc.fontSize(16.0).font("Helvetica-Bold").fillColor("#ffffff").text("TAX INVOICE", badgeX, topY + 8, { width: badgeW, align: "center" });
    doc.fontSize(7.8).font("Helvetica").fillColor("#ffffff").text("Original for Recipient", badgeX, topY + 31, { width: badgeW, align: "center" });

    const headerTextX = leftMargin + logoWidth + 12; // 130
    const headerTextW = badgeX - headerTextX - 6; // 311 pt width

    let hCursorY = topY + 2;
    doc.fontSize(15.0).font("Helvetica-Bold").fillColor("#021C57").text("ARCL INSTRUMENTS PRIVATE LIMITED", headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString("ARCL INSTRUMENTS PRIVATE LIMITED", { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica").fillColor("#334155");
    const compAddr = "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708";
    doc.text(compAddr, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compAddr, { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica-Bold").fillColor("#1e293b");
    const compGstinPhone = "GSTIN: 27AATCA7874C1ZB  |  Phone: +91 8369458583 / +91 6205691085";
    doc.text(compGstinPhone, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compGstinPhone, { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica").fillColor("#334155");
    const compWebEmail = "Email: arclinstruments@gmail.com  |  Website: www.arcl.in  |  Maharashtra, India";
    doc.text(compWebEmail, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compWebEmail, { width: headerTextW }) + 5.0;

    const sepY = Math.max(hCursorY, topY + badgeH + 6, topY + 76);
    doc.moveTo(leftMargin, sepY).lineTo(leftMargin + contentWidth, sepY).lineWidth(2.0).strokeColor("#021C57").stroke();
    return sepY;
  };

  // Header helper for multi-page continuation - exactly matches Page 1
  const drawContinuationHeader = () => {
    const sepY = drawTaxInvoiceHeader();
    return sepY + 8;
  };

  // 1. TOP OFFICIAL HEADER (Enlarged, Prominent, Zero Overlap Guarantee)
  const sepY = drawTaxInvoiceHeader();

  // 2. BILLED TO & INVOICE DETAILS CARD (Zero Overlap, Dynamic Heights, Prominent Fonts)
  const boxY = sepY + 7;
  const boxH = 106;
  const boxSplitX = leftMargin + 270;

  doc.rect(leftMargin, boxY, contentWidth, boxH).lineWidth(1.0).strokeColor("#000000").stroke();
  doc.moveTo(boxSplitX, boxY).lineTo(boxSplitX, boxY + boxH).lineWidth(1.0).strokeColor("#000000").stroke();

  // Left: Billed To
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#021C57").text("Billed To (Customer / Client):", leftMargin + 9, boxY + 6);
  const clientBoxW = 252;
  const clientNameY = boxY + 19;
  doc.fontSize(12.0).font("Helvetica-Bold").fillColor("#000000").text(clientCompany, leftMargin + 9, clientNameY, { width: clientBoxW });
  const clientNameH = doc.heightOfString(clientCompany, { width: clientBoxW });
  const addressY = clientNameY + clientNameH + 2;
  const gstinY = boxY + boxH - 16;
  const maxAddressH = Math.max(18, gstinY - addressY - 2);

  doc.fontSize(8.5).font("Helvetica").fillColor("#334155").text(clientAddress, leftMargin + 9, addressY, {
    width: clientBoxW,
    height: maxAddressH,
    lineGap: 1.2,
    ellipsis: true,
  });
  doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#000000").text(`GSTIN: ${clientGstin}`, leftMargin + 9, gstinY);

  // Right: Invoice Details
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#021C57").text("Tax Invoice Reference Details:", boxSplitX + 9, boxY + 6);
  const rStart = boxY + 20;
  const rGap = 20;

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Invoice No.:", boxSplitX + 9, rStart + 1);
  doc.font("Helvetica-Bold").fontSize(12.0).fillColor("#021C57").text(invoiceNo, boxSplitX + 98, rStart, { width: 156 });

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Invoice Date:", boxSplitX + 9, rStart + rGap + 1);
  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#000000").text(invoiceDate, boxSplitX + 98, rStart + rGap, { width: 156 });

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Due Date:", boxSplitX + 9, rStart + rGap * 2 + 1);
  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#000000").text(dueDate, boxSplitX + 98, rStart + rGap * 2, { width: 156 });

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Place of Supply:", boxSplitX + 9, rStart + rGap * 3 + 1);
  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#000000").text(placeOfSupply, boxSplitX + 98, rStart + rGap * 3, { width: 156 });

  // 3. TABLE COLUMNS & HEADER FUNCTION
  const colX = [
    leftMargin,                // 30  -> #: 22
    leftMargin + 22,           // 52  -> Scope: 270
    leftMargin + 292,          // 322 -> HSN: 48
    leftMargin + 340,          // 370 -> Qty: 40
    leftMargin + 380,          // 410 -> Rate (INR): 70
    leftMargin + 450,          // 480 -> Amount (INR): 85
    leftMargin + contentWidth, // 565
  ];

  const thH = 24;
  const drawTableHeader = (atY) => {
    doc.rect(leftMargin, atY, contentWidth, thH).fillColor("#021C57").fill();
    for (let i = 1; i < colX.length; i++) {
      doc.moveTo(colX[i], atY).lineTo(colX[i], atY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    }
    doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#ffffff");
    const hTextY = atY + 6.5;
    doc.text("#", colX[0], hTextY, { width: colX[1] - colX[0], align: "center" });
    doc.text("Description of Services / Calibration Scope", colX[1] + 6, hTextY);
    doc.text("HSN/SAC", colX[2], hTextY, { width: colX[3] - colX[2], align: "center" });
    doc.text("Qty", colX[3], hTextY, { width: colX[4] - colX[3], align: "center" });
    doc.text("Rate (INR)", colX[4], hTextY, { width: colX[5] - colX[4] - 2, align: "right" });
    doc.text("Amount (INR)", colX[5], hTextY, { width: colX[6] - colX[5] - 6, align: "right" });
    return atY + thH;
  };

  let curY = boxY + boxH + 6;
  curY = drawTableHeader(curY);

  // 4. ITEMS ROWS (Snug, Well-Proportioned, Multi-Page Safe)
  const N = formattedItems.length;
  for (let i = 0; i < N; i++) {
    const it = formattedItems[i];
    const scopeW = colX[2] - colX[1] - 12;

    doc.fontSize(10.5).font("Helvetica-Bold");
    const nameH = doc.heightOfString(it.name, { width: scopeW });

    let specsH = 0;
    if (it.subText) {
      doc.fontSize(8.5).font("Helvetica");
      specsH = doc.heightOfString(it.subText, { width: scopeW, lineGap: 1.15 });
    }

    const padTop = 5.0;
    const padBot = 5.0;
    const specGap = 2.5;
    const textReqH = padTop + nameH + (it.subText ? specGap + specsH : 0) + padBot;
    const rowH = Math.max(25, textReqH);

    // Multi-page auto page break check
    if (curY + rowH > 770) {
      doc.addPage();
      curY = drawContinuationHeader();
      curY = drawTableHeader(curY);
    }

    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(leftMargin, curY, contentWidth, rowH).fillColor(bg).strokeColor("#000000").lineWidth(0.5).fillAndStroke();

    for (let j = 1; j < colX.length; j++) {
      doc.moveTo(colX[j], curY).lineTo(colX[j], curY + rowH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    }

    const midY = curY + (rowH / 2) - 4.5;
    doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#000000").text(String(it.itemNo), colX[0], midY, { width: colX[1] - colX[0], align: "center" });

    doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#0f172a").text(it.name, colX[1] + 6, curY + padTop, { width: scopeW });
    if (it.subText) {
      doc.fontSize(8.5).font("Helvetica").fillColor("#334155").text(it.subText, colX[1] + 6, curY + padTop + nameH + specGap, {
        width: scopeW,
        lineGap: 1.15,
      });
    }

    doc.fontSize(9.5).font("Helvetica").fillColor("#334155").text(it.hsnSac, colX[2], midY, { width: colX[3] - colX[2], align: "center" });
    doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#0f172a").text(`${it.qty} ${it.qtyUnit}`, colX[3], midY, { width: colX[4] - colX[3], align: "center" });
    doc.fontSize(10.0).font("Helvetica").fillColor("#334155").text(it.rate.toFixed(2), colX[4], midY, { width: colX[5] - colX[4] - 2, align: "right" });
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#000000").text(it.amount.toFixed(2), colX[5], midY, { width: colX[6] - colX[5] - 6, align: "right" });

    curY += rowH;
  }

  // 5. SUMMARY BLOCK & BOTTOM DETAILS (Multi-Page Auto-Adjust)
  const invoiceTerms = parseTermsList(customData.terms);
  const sumH = 40;
  const hsnH = 26;
  const bankSigH = 76;
  const termsBoxH = 16 + 5 + (invoiceTerms.length * 11) + 5;
  const gap = 5;
  const totalBottomHeight = sumH + hsnH + bankSigH + termsBoxH + (gap * 2) + 6;

  if (curY + totalBottomHeight > 775) {
    doc.addPage();
    curY = drawContinuationHeader();
  } else {
    curY += 6;
  }

  // A. Summary Totals Box
  doc.rect(leftMargin, curY, contentWidth, sumH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(leftMargin + 325, curY).lineTo(leftMargin + 325, curY + sumH).lineWidth(0.8).strokeColor("#000000").stroke();

  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#021C57").text("Total in Words:", leftMargin + 8, curY + 5);
  doc.font("Helvetica").fontSize(8.0).fillColor("#1e293b").text(numberToWords(totalAmount.toFixed(2)), leftMargin + 8, curY + 16, { width: 310, lineGap: 1.15 });

  doc.font("Helvetica").fontSize(8.5).fillColor("#334155");
  doc.text("Taxable Amount:", leftMargin + 333, curY + 5);
  doc.text(taxableAmount.toFixed(2), leftMargin + 435, curY + 5, { width: 92, align: "right" });

  doc.text("Total Tax (GST):", leftMargin + 333, curY + 16);
  doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), leftMargin + 435, curY + 16, { width: 92, align: "right" });

  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#021C57").text("Grand Total (INR):", leftMargin + 333, curY + 27);
  doc.text(totalAmount.toFixed(2), leftMargin + 435, curY + 27, { width: 92, align: "right" });

  curY += sumH;

  // B. HSN / Tax Summary Table (Clear, Prominent 8.5pt Fonts)
  doc.rect(leftMargin, curY, contentWidth, hsnH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.rect(leftMargin, curY, contentWidth, 12).fillColor("#f1f5f9").fill();

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#021C57");
  doc.text("HSN/SAC", leftMargin + 6, curY + 2);
  doc.text("Taxable Value", leftMargin + 95, curY + 2, { width: 85, align: "right" });
  doc.text("CGST Rate", leftMargin + 195, curY + 2, { width: 55, align: "center" });
  doc.text("CGST Amt", leftMargin + 260, curY + 2, { width: 65, align: "right" });
  doc.text("SGST Rate", leftMargin + 335, curY + 2, { width: 55, align: "center" });
  doc.text("SGST Amt", leftMargin + 400, curY + 2, { width: 65, align: "right" });
  doc.text("Total Tax Amt", leftMargin + 470, curY + 2, { width: 58, align: "right" });

  doc.font("Helvetica").fontSize(7.5).fillColor("#1e293b");
  doc.text("998346", leftMargin + 6, curY + 14);
  doc.text(taxableAmount.toFixed(2), leftMargin + 95, curY + 14, { width: 85, align: "right" });
  doc.text(`${cgstRate.toFixed(1)}%`, leftMargin + 195, curY + 14, { width: 55, align: "center" });
  doc.text(cgstAmount.toFixed(2), leftMargin + 260, curY + 14, { width: 65, align: "right" });
  doc.text(`${sgstRate.toFixed(1)}%`, leftMargin + 335, curY + 14, { width: 55, align: "center" });
  doc.text(sgstAmount.toFixed(2), leftMargin + 400, curY + 14, { width: 65, align: "right" });
  doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), leftMargin + 470, curY + 14, { width: 58, align: "right" });

  curY += hsnH + gap;

  // C. BOX 1: Bank Details & Dual QR Codes (Left) + Official Signatory Block (Right)
  const botSplitX = leftMargin + 270;
  const rightWidth = contentWidth - 270; // 265 pt

  doc.rect(leftMargin, curY, contentWidth, bankSigH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(botSplitX, curY).lineTo(botSplitX, curY + bankSigH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Left: Bank Details
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#021C57").text("Company's Bank Details:", leftMargin + 8, curY + 6);
  doc.font("Helvetica").fontSize(7.5).fillColor("#1e293b");
  let bY = curY + 18;
  const bankValW = 150;
  doc.text(`Bank Name: ${bankName}`, leftMargin + 8, bY, { width: bankValW });
  bY += 11.5;
  doc.text(`Account No: ${accountNo}`, leftMargin + 8, bY, { width: bankValW });
  bY += 11.5;
  doc.text(`Branch: ${branchName}`, leftMargin + 8, bY, { width: bankValW });
  const brH = doc.heightOfString(`Branch: ${branchName}`, { width: bankValW });
  bY += Math.max(11.5, brH + 1.5);
  doc.text(`IFSC Code: ${ifscCode}`, leftMargin + 8, bY, { width: bankValW });

  // QR Codes
  const qr1X = leftMargin + 162;
  const qrSize = 36;
  const qrY = curY + 12;

  if (staticQrBuffer) {
    try {
      doc.image(staticQrBuffer, qr1X, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#0f172a").text("Official Bank QR", qr1X - 3, qrY + qrSize + 3, { width: qrSize + 6, align: "center" });
    } catch (e) {}
  }

  const qr2X = leftMargin + 212;
  if (dynamicQrBuffer) {
    try {
      doc.image(dynamicQrBuffer, qr2X, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#0284c7").text(`Auto Pay INR ${Math.round(totalAmount)}`, qr2X - 5, qrY + qrSize + 3, { width: qrSize + 10, align: "center" });
    } catch (e) {}
  }

  // Right Section: Official Signatory Block (Clean, Centered, Zero Text Clutter)
  const sigCenterX = botSplitX + (rightWidth / 2);
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#021C57").text(
    "For ARCL INSTRUMENTS PRIVATE LIMITED",
    botSplitX + 8,
    curY + 6,
    { width: rightWidth - 16, align: "center" }
  );

  const stampWidth = 48;
  const stampX = sigCenterX - (stampWidth / 2);
  const stampY = curY + 18;
  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, stampX, stampY, { width: stampWidth });
    } catch (e) {}
  }

  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#000000").text(
    "Authorized Signatory",
    botSplitX + 8,
    curY + bankSigH - 14,
    { width: rightWidth - 16, align: "center" }
  );

  curY += bankSigH + gap;

  // D. BOX 2: Dedicated Terms & Conditions Box (Neeche Alag Box)
  doc.rect(leftMargin, curY, contentWidth, termsBoxH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Header Strip of Terms Box
  doc.rect(leftMargin, curY, contentWidth, 16).fillColor("#f1f5f9").fill();
  doc.rect(leftMargin, curY, 3.5, 16).fillColor("#021C57").fill(); // Left Accent Bar in Navy
  doc.moveTo(leftMargin, curY + 16).lineTo(leftMargin + contentWidth, curY + 16).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#021C57").text(
    "Terms & Conditions:",
    leftMargin + 8,
    curY + 4
  );
  doc.fontSize(6.8).font("Helvetica-Oblique").fillColor("#64748b").text(
    "Standard Commercial Terms & Metrological Service Policy",
    leftMargin + 110,
    curY + 4.5,
    { width: contentWidth - 120, align: "right" }
  );

  // Terms Items inside Box 2
  let tY = curY + 16 + 5;
  const termTextWidth = contentWidth - 16;
  doc.fontSize(7.2);

  invoiceTerms.forEach((term, idx) => {
    const cleanTerm = term.replace(/^\d+[\.\)]\s*/, "").trim();
    const colonIdx = cleanTerm.indexOf(":");
    if (colonIdx > -1 && colonIdx < 25) {
      const label = cleanTerm.slice(0, colonIdx + 1).trim();
      const desc = cleanTerm.slice(colonIdx + 1).trim();
      doc.font("Helvetica-Bold").fillColor("#0f172a");
      const numLabel = `${idx + 1}. ${label} `;
      doc.text(numLabel, leftMargin + 8, tY, { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(desc, { width: termTextWidth });
    } else {
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(`${idx + 1}. `, leftMargin + 8, tY, { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(cleanTerm, { width: termTextWidth });
    }
    tY += 11;
  });

  curY += termsBoxH;

  // 6. MULTI-PAGE NUMBERING (Page X of Y) ACROSS ALL PAGES
  const pageRange = doc.bufferedPageRange();
  const totalPages = pageRange.count;
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    const footerText = `Page ${p + 1} of ${totalPages}  •  Invoice Ref: ${invoiceNo}  •  Digitally Authenticated Official ARCL Tax Invoice`;
    doc.fontSize(7.5).font("Helvetica").fillColor("#64748b").text(footerText, leftMargin, 822, {
      width: contentWidth,
      align: "center",
      lineBreak: false,
    });
  }

  return buildPdfBuffer(doc);
};

// Helper to resolve an image source (data URI, remote URL, local path) into a Buffer for PDFKit
const pdfImageCache = new Map();

export async function resolveImageBuffer(imgSource) {
  if (!imgSource || typeof imgSource !== "string") return null;
  const trimmed = imgSource.trim();
  if (!trimmed) return null;
  if (pdfImageCache.has(trimmed)) return pdfImageCache.get(trimmed);

  try {
    // 1. Base64 Data URI
    if (trimmed.startsWith("data:image/")) {
      const commaIdx = trimmed.indexOf(",");
      if (commaIdx > -1) {
        return Buffer.from(trimmed.slice(commaIdx + 1), "base64");
      }
    }

    // 2. Check local filesystem paths across all possible root directories
    const cleanPath = trimmed.replace(/^[\\\/]+/, "");
    const possiblePaths = [
      trimmed,
      path.resolve(process.cwd(), trimmed),
      path.resolve(process.cwd(), cleanPath),
      path.resolve(process.cwd(), "frontend/public", cleanPath),
      path.resolve(process.cwd(), "../frontend/public", cleanPath),
      path.resolve(process.cwd(), "public", cleanPath),
      path.resolve(__dirname, "../../public", cleanPath),
      path.resolve(__dirname, "../../../frontend/public", cleanPath),
      path.resolve(__dirname, "../../../assets", cleanPath),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          if (fs.statSync(p).isFile()) {
            const buf = fs.readFileSync(p);
            pdfImageCache.set(trimmed, buf);
            return buf;
          }
        } catch (_) {}
      }
    }

    // 3. Remote HTTP / HTTPS Image URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      let fetchUrl = trimmed;
      // For Cloudinary URLs, ensure format is jpg/png with reasonable width for PDF embedding
      if (fetchUrl.includes("res.cloudinary.com") && fetchUrl.includes("/upload/")) {
        if (!fetchUrl.includes("f_jpg")) {
          fetchUrl = fetchUrl.replace("/upload/", "/upload/f_jpg,w_400,c_limit/");
        }
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "image/jpeg,image/png,image/*",
        },
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        const buf = Buffer.from(ab);
        pdfImageCache.set(trimmed, buf);
        return buf;
      }
    }
  } catch (err) {
    console.warn("Notice: could not load image buffer for PDF:", trimmed.slice(0, 60), err.message);
  }
  return null;
}

/**
 * =========================================================================
 * 2. DYNAMIC AUTO-SPACED OFFICIAL ARCL QUOTATION PDF (HIGH LEGIBILITY & AUTO-SIZED)
 * =========================================================================
 */
export const generateQuotationPdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 10, bufferPages: true });

  const qtn = customData.quotationData || customData;
  const qtnNo = qtn.quotationNo || "ARCL/QTN/26-27/47";
  const qtnDate = qtn.quotationDate
    ? (qtn.quotationDate instanceof Date ? qtn.quotationDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(qtn.quotationDate))
    : "22 Apr 2026";
  const validityDate = qtn.validityDate
    ? (qtn.validityDate instanceof Date ? qtn.validityDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(qtn.validityDate))
    : "29 Apr 2026";
  const placeOfSupply = qtn.placeOfSupply || "27-MAHARASHTRA";

  const rawCompany = qtn.billTo?.companyName || qtn.clientCompany || "RDSS QUALITY CONTROL LAB PRIVATE LIMITED";
  const clientCompany = String(rawCompany).replace(/\r?\n+/g, " ").trim();
  const rawGstin = qtn.billTo?.gstin || qtn.clientGstin || "27AAOCR3275P1ZH";
  const clientGstin = String(rawGstin).replace(/\r?\n+/g, " ").trim();
  const rawAddress = qtn.billTo?.address
    ? (qtn.billTo.cityStatePin ? `${qtn.billTo.address}, ${qtn.billTo.cityStatePin}` : qtn.billTo.address)
    : (qtn.clientAddress || "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS, BELAVALI, Ambarnath, Thane, MAHARASHTRA, 421503");
  const clientAddress = String(rawAddress).replace(/\r?\n+/g, ", ").replace(/\s+,/g, ",").trim();

  let rawItems = qtn.items && Array.isArray(qtn.items) && qtn.items.length > 0 ? qtn.items : defaultQuotationItems;

  const formattedItems = rawItems.map((it, idx) => {
    let cleanName = String(it.name || it.itemName || it.description || `Item ${idx + 1}`).replace(/\r?\n+/g, " ").trim();
    // Clean duplicate " - Calibration - Calibration"
    cleanName = cleanName.replace(/(\s*-\s*Calibration\s*)+$/gi, " - Calibration");

    return {
      itemNo: it.itemNo || idx + 1,
      name: cleanName,
      specifications: Array.isArray(it.specifications) && it.specifications.length > 0
        ? it.specifications
        : typeof it.description === "string" && it.description.includes("\n")
        ? it.description.split("\n").map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
        : [],
      subText: (() => {
        if (Array.isArray(it.specifications) && it.specifications.length > 0) {
          return it.specifications
            .map((s, sIdx) => (String(s).match(/^\d+[\.\)]/) ? s : `${sIdx + 1}. ${s}`))
            .join(" • ");
        }
        return String(it.subText || it.description || it.remarks || "").replace(/\r?\n+/g, " • ").trim();
      })(),
      productImage: it.productImage || it.image || "",
      hsnSac: String(it.hsnSac || it.hsnCode || "998346").trim(),
      qty: /nos|pcs|set|unit/i.test(String(it.qty || "")) ? String(it.qty) : (String(it.qty || 1) + (it.qtyUnit ? ` ${it.qtyUnit}` : " NOS")),
      rate: Number(it.rate || 0).toFixed(2),
      amount: (Number(it.amount) || Number(it.qty || 1) * Number(it.rate || 0)).toFixed(2),
      rawAmount: Number(it.amount) || Number(it.qty || 1) * Number(it.rate || 0),
    };
  });

  // Check if any item has a product image or if sales quotation format with photo column is preferred
  const hasPhoto = formattedItems.some((it) => it.productImage && String(it.productImage).trim() !== "");
  let itemImageBuffers = [];
  if (hasPhoto) {
    itemImageBuffers = await Promise.all(
      formattedItems.map((it) => resolveImageBuffer(it.productImage))
    );
  }

  const taxableAmount = formattedItems.reduce((acc, curr) => acc + curr.rawAmount, 0);
  const isInterstate = placeOfSupply && !placeOfSupply.startsWith("27");
  const cgstRate = isInterstate ? 0 : 9;
  const sgstRate = isInterstate ? 0 : 9;
  const igstRate = isInterstate ? 18 : 0;
  const cgstAmount = isInterstate ? 0 : taxableAmount * 0.09;
  const sgstAmount = isInterstate ? 0 : taxableAmount * 0.09;
  const igstAmount = isInterstate ? taxableAmount * 0.18 : 0;
  const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  // Bank & UPI QR Code
  const bankName = (qtn.bankName || process.env.BANK_NAME || "HDFC Bank").trim();
  const accountNo = (qtn.accountNo || process.env.BANK_ACCOUNT_NO || "50200111763991").trim();
  const branchName = (qtn.bankBranch || process.env.BANK_BRANCH || "Kandivali East - Thakur Village").trim();
  const ifscCode = (qtn.ifscCode || process.env.BANK_IFSC || "HDFC0000582").trim();

  const staticQrBuffer = getStaticQrBuffer();
  const dynamicQrBuffer = await getDynamicUpiQrBuffer({
    vpa: qtn.upiVpa || process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc",
    payeeName: qtn.upiName || process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
    amount: totalAmount,
    refNote: `CALIB-${String(qtnNo || "QTN").replace(/[^a-zA-Z0-9]/g, "")}`,
  });

  const leftMargin = 30;
  const contentWidth = 535;

  // Header helper - exactly identical across Page 1, Page 2, Page 3, and all continuation pages
  const drawQuotationHeader = () => {
    const topY = 16;
    const logoWidth = 88;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, leftMargin, topY + 2, { width: logoWidth });
      } catch (e) {
        doc.fontSize(22).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
      }
    } else {
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
    }

    const badgeW = 118;
    const badgeH = 54;
    const badgeX = leftMargin + contentWidth - badgeW; // 447
    doc.rect(badgeX, topY + 2, badgeW, badgeH).fillColor("#2563EB").fill();
    doc.fontSize(16.5).font("Helvetica-Bold").fillColor("#ffffff").text("QUOTATION", badgeX, topY + 8, { width: badgeW, align: "center" });
    doc.fontSize(8.2).font("Helvetica").fillColor("#ffffff").text("Commercial Cost Estimate", badgeX, topY + 31, { width: badgeW, align: "center" });

    const headerTextX = leftMargin + logoWidth + 12; // 130
    const headerTextW = badgeX - headerTextX - 6; // 311 pt width

    let hCursorY = topY + 2;
    doc.fontSize(15.0).font("Helvetica-Bold").fillColor("#021C57").text("ARCL INSTRUMENTS PRIVATE LIMITED", headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString("ARCL INSTRUMENTS PRIVATE LIMITED", { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica").fillColor("#334155");
    const compAddress = "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708";
    doc.text(compAddress, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compAddress, { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica-Bold").fillColor("#1e293b");
    const compGstinPhone = "GSTIN: 27AATCA7874C1ZB  |  Phone: +91 8369458583 / +91 6205691085";
    doc.text(compGstinPhone, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compGstinPhone, { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica").fillColor("#334155");
    const compEmailWeb = "Email: arclinstruments@gmail.com  |  Website: www.arcl.in  |  Maharashtra, India";
    doc.text(compEmailWeb, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compEmailWeb, { width: headerTextW }) + 5.0;

    // Blue separator line placed safely below dynamic text:
    const sepY = Math.max(hCursorY, topY + badgeH + 6, topY + 76);
    doc.moveTo(leftMargin, sepY).lineTo(leftMargin + contentWidth, sepY).lineWidth(2.0).strokeColor("#2563EB").stroke();
    return sepY;
  };

  // Header helper for multi-page continuation - exactly matches Page 1
  const drawContinuationHeader = () => {
    const sepY = drawQuotationHeader();
    return sepY + 8;
  };

  // 1. TOP OFFICIAL HEADER (Enlarged, Prominent, Zero Overlap Guarantee)
  const sepY = drawQuotationHeader();

  // 2. QUOTATION TO & DETAILS CARD (Zero Overlap, Dynamic Heights, Prominent Fonts)
  const boxY = sepY + 7;
  const boxH = hasPhoto ? 112 : 106;
  const boxSplitX = leftMargin + 270;

  doc.rect(leftMargin, boxY, contentWidth, boxH).lineWidth(1.0).strokeColor("#000000").stroke();
  doc.moveTo(boxSplitX, boxY).lineTo(boxSplitX, boxY + boxH).lineWidth(1.0).strokeColor("#000000").stroke();

  // Left: Quotation To (Dynamically computed Y so clientCompany NEVER overlaps with address!)
  doc.fontSize(hasPhoto ? 10.5 : 9.5).font("Helvetica-Bold").fillColor("#021C57").text("Quotation To (Customer / Client):", leftMargin + 9, boxY + (hasPhoto ? 7 : 6));
  
  const clientBoxW = 252;
  const clientNameY = boxY + (hasPhoto ? 22 : 19);
  doc.fontSize(hasPhoto ? 13.0 : 12.0).font("Helvetica-Bold").fillColor("#000000");
  doc.text(clientCompany, leftMargin + 9, clientNameY, { width: clientBoxW });
  
  const clientNameH = doc.heightOfString(clientCompany, { width: clientBoxW });
  const addressY = clientNameY + clientNameH + 2;
  const gstinY = boxY + boxH - (hasPhoto ? 18 : 16);
  const maxAddressH = Math.max(18, gstinY - addressY - 2);

  doc.fontSize(hasPhoto ? 9.0 : 8.5).font("Helvetica").fillColor("#334155");
  doc.text(clientAddress, leftMargin + 9, addressY, {
    width: clientBoxW,
    height: maxAddressH,
    lineGap: 1.2,
    ellipsis: true,
  });

  doc.fontSize(hasPhoto ? 11.0 : 10.0).font("Helvetica-Bold").fillColor("#000000").text(`GSTIN: ${clientGstin}`, leftMargin + 9, gstinY);

  // Right: Details (Exact Row Positioning, Zero Overlap)
  doc.fontSize(hasPhoto ? 10.5 : 9.5).font("Helvetica-Bold").fillColor("#021C57").text("Quotation Reference Details:", boxSplitX + 9, boxY + (hasPhoto ? 7 : 6));
  
  const rStart = boxY + (hasPhoto ? 24 : 20);
  const rGap = hasPhoto ? 22 : 20;

  doc.font("Helvetica").fontSize(hasPhoto ? 9.5 : 9.0).fillColor("#334155");
  doc.text("Quotation No.:", boxSplitX + 9, rStart + 1);
  doc.font("Helvetica-Bold").fontSize(hasPhoto ? 13.0 : 12.0).fillColor("#021C57").text(qtnNo, boxSplitX + 98, rStart, { width: 156 });

  doc.font("Helvetica").fontSize(hasPhoto ? 9.5 : 9.0).fillColor("#334155");
  doc.text("Quotation Date:", boxSplitX + 9, rStart + rGap + 1);
  doc.font("Helvetica-Bold").fontSize(hasPhoto ? 10.5 : 10.0).fillColor("#000000").text(qtnDate, boxSplitX + 98, rStart + rGap, { width: 156 });

  doc.font("Helvetica").fontSize(hasPhoto ? 9.5 : 9.0).fillColor("#334155");
  doc.text("Valid Till:", boxSplitX + 9, rStart + rGap * 2 + 1);
  doc.font("Helvetica-Bold").fontSize(hasPhoto ? 10.5 : 10.0).fillColor("#000000").text(validityDate, boxSplitX + 98, rStart + rGap * 2, { width: 156 });

  doc.font("Helvetica").fontSize(hasPhoto ? 9.5 : 9.0).fillColor("#334155");
  doc.text("Place of Supply:", boxSplitX + 9, rStart + rGap * 3 + 1);
  doc.font("Helvetica-Bold").fontSize(hasPhoto ? 10.5 : 10.0).fillColor("#000000").text(placeOfSupply, boxSplitX + 98, rStart + rGap * 3, { width: 156 });

  // 3. TABLE COLUMNS & HEADER FUNCTION
  const colX = hasPhoto
    ? [
        leftMargin,                // 30  -> #: 18
        leftMargin + 18,           // 48  -> Photo: 86 (Clean 78x78 Image Frame)
        leftMargin + 104,          // 134 -> Product & Specification Scope: 245 (Single-Line Title!)
        leftMargin + 349,          // 379 -> HSN/SAC: 40
        leftMargin + 389,          // 419 -> Qty: 30
        leftMargin + 419,          // 449 -> Rate (INR): 52
        leftMargin + 471,          // 501 -> Amount (INR): 64
        leftMargin + contentWidth, // 565
      ]
    : [
        leftMargin,                // 30  -> #: 22
        leftMargin + 22,           // 52  -> Item & Calibration Scope: 270 (Wide & Clean)
        leftMargin + 292,          // 322 -> HSN/SAC: 48
        leftMargin + 340,          // 370 -> Qty: 40
        leftMargin + 380,          // 410 -> Rate (INR): 70
        leftMargin + 450,          // 480 -> Amount (INR): 85
        leftMargin + contentWidth, // 565
      ];

  const thH = hasPhoto ? 25 : 24;
  const drawTableHeader = (atY) => {
    doc.rect(leftMargin, atY, contentWidth, thH).fillColor("#2563EB").fill();
    for (let i = 1; i < colX.length; i++) {
      doc.moveTo(colX[i], atY).lineTo(colX[i], atY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    }
    doc.fontSize(hasPhoto ? 10.5 : 10.0).font("Helvetica-Bold").fillColor("#ffffff");
    const hTextY = atY + (hasPhoto ? 7.0 : 6.5);
    if (hasPhoto) {
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("#", colX[0], hTextY, { width: colX[1] - colX[0], align: "center" });
      doc.text("Product Image", colX[1], hTextY, { width: colX[2] - colX[1], align: "center" });
      doc.text("Product & Specification Scope", colX[2] + 6, hTextY);
      doc.fontSize(8.5).text("HSN/SAC", colX[3], hTextY + 0.5, { width: colX[4] - colX[3], align: "center" });
      doc.fontSize(9.0).text("Qty", colX[4], hTextY + 0.5, { width: colX[5] - colX[4], align: "center" });
      doc.fontSize(9.0).text("Rate (INR)", colX[5], hTextY + 0.5, { width: colX[6] - colX[5] - 2, align: "right" });
      doc.fontSize(9.0).text("Amount (INR)", colX[6], hTextY + 0.5, { width: colX[7] - colX[6] - 4, align: "right" });
    } else {
      doc.text("#", colX[0], hTextY, { width: colX[1] - colX[0], align: "center" });
      doc.text("Item & Calibration Scope", colX[1] + 6, hTextY);
      doc.text("HSN/SAC", colX[2], hTextY, { width: colX[3] - colX[2], align: "center" });
      doc.text("Qty", colX[3], hTextY, { width: colX[4] - colX[3], align: "center" });
      doc.text("Rate (INR)", colX[4], hTextY, { width: colX[5] - colX[4] - 2, align: "right" });
      doc.text("Amount (INR)", colX[5], hTextY, { width: colX[6] - colX[5] - 6, align: "right" });
    }
    return atY + thH;
  };

  let curY = boxY + boxH + (hasPhoto ? 8 : 6);
  curY = drawTableHeader(curY);

  // 4. ITEMS ROWS (EXTRA LARGE CLEAR PHOTOS FOR SALES, COMPACT & CLEAN FOR CALIBRATION)
  const N = formattedItems.length;

  for (let i = 0; i < N; i++) {
    const it = formattedItems[i];
    const scopeW = hasPhoto ? colX[3] - colX[2] - 12 : colX[2] - colX[1] - 12;

    // Calculate content required height
    const nameFontSize = hasPhoto ? 12.0 : 10.5;
    doc.fontSize(nameFontSize).font("Helvetica-Bold");
    // Single-line name height for sales quotation (always 1 line)
    const nameH = hasPhoto ? 15 : doc.heightOfString(it.name, { width: scopeW });

    let specsH = 0;
    let formattedSpecsText = "";
    if (Array.isArray(it.specifications) && it.specifications.length > 0) {
      formattedSpecsText = it.specifications
        .map((s, sIdx) => (String(s).match(/^\d+[\.\)]/) ? s : `${sIdx + 1}. ${s}`))
        .join("\n");
      doc.fontSize(hasPhoto ? 9.5 : 8.5).font("Helvetica");
      specsH = doc.heightOfString(formattedSpecsText, { width: scopeW, lineGap: hasPhoto ? 1.4 : 1.15 });
    } else if (it.subText) {
      doc.fontSize(hasPhoto ? 9.5 : 8.5).font("Helvetica");
      specsH = doc.heightOfString(it.subText, { width: scopeW, lineGap: hasPhoto ? 1.4 : 1.15 });
      formattedSpecsText = it.subText;
    }

    const minCellH = hasPhoto ? 96 : 25;
    const padTop = hasPhoto ? 8 : 5.0;
    const padBot = hasPhoto ? 8 : 5.0;
    const specGap = hasPhoto ? 5 : 2.5;
    const textReqH = padTop + nameH + (formattedSpecsText ? specGap + specsH : 0) + padBot;
    const rowH = Math.max(minCellH, textReqH);

    // Multi-page auto page break check
    if (curY + rowH > 770) {
      doc.addPage();
      curY = drawContinuationHeader();
      curY = drawTableHeader(curY);
    }

    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(leftMargin, curY, contentWidth, rowH).fillColor(bg).strokeColor("#000000").lineWidth(0.5).fillAndStroke();

    for (let j = 1; j < colX.length; j++) {
      doc.moveTo(colX[j], curY).lineTo(colX[j], curY + rowH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    }

    const midY = curY + (rowH / 2) - 4.5;

    if (hasPhoto) {
      // 1. Index
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#000000");
      doc.text(String(it.itemNo), colX[0], midY, { width: colX[1] - colX[0], align: "center" });

      // 2. High-Res Product Photo (Crisp, Clear, 78x78 Frame)
      const imgBuf = itemImageBuffers[i];
      const photoCellW = colX[2] - colX[1]; // 86 pt
      const imgSize = 78;
      const imgX = colX[1] + (photoCellW - imgSize) / 2;
      const imgY = curY + (rowH - imgSize) / 2;

      if (imgBuf) {
        try {
          doc.roundedRect(imgX, imgY, imgSize, imgSize, 4)
            .fillColor("#ffffff")
            .strokeColor("#94a3b8")
            .lineWidth(0.8)
            .fillAndStroke();
          doc.image(imgBuf, imgX + 2, imgY + 2, {
            fit: [imgSize - 4, imgSize - 4],
            align: "center",
            valign: "center",
          });
        } catch (e) {
          doc.roundedRect(imgX, imgY, imgSize, imgSize, 4)
            .lineWidth(0.8)
            .fillColor("#f1f5f9")
            .strokeColor("#94a3b8")
            .fillAndStroke();
          doc.fontSize(9.0).font("Helvetica-Bold").fillColor("#64748b")
            .text("PHOTO", imgX, imgY + (imgSize / 2) - 6, { width: imgSize, align: "center" });
        }
      } else {
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 4)
          .lineWidth(0.8)
          .fillColor("#f8fafc")
          .strokeColor("#cbd5e1")
          .fillAndStroke();
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#94a3b8")
          .text("ARCL\nEQUIPMENT", imgX, imgY + (imgSize / 2) - 10, { width: imgSize, align: "center" });
      }

      // 3. Name on strictly ONE SINGLE LINE & Numbered Specifications / SubText
      const scopeX = colX[2] + 6;
      doc.fontSize(12.0).font("Helvetica-Bold");
      const rawNameW = doc.widthOfString(it.name);
      if (rawNameW <= scopeW) {
        doc.fillColor("#0f172a").text(it.name, scopeX, curY + 8, {
          width: scopeW,
          lineBreak: false,
        });
      } else {
        // Horizontally condense so it stays strictly on 1 single line with same font size!
        const sx = scopeW / rawNameW;
        doc.save();
        doc.translate(scopeX, curY + 8);
        doc.scale(sx, 1);
        doc.fillColor("#0f172a").text(it.name, 0, 0, { lineBreak: false });
        doc.restore();
      }

      const specsStartY = curY + 8 + nameH + 5;
      if (formattedSpecsText) {
        doc.fontSize(9.5).font("Helvetica").fillColor("#1e293b");
        doc.text(formattedSpecsText, scopeX, specsStartY, {
          width: scopeW,
          lineGap: 1.4,
        });
      }

      // 4. HSN/SAC
      doc.fontSize(9.5).font("Helvetica").fillColor("#334155");
      doc.text(it.hsnSac, colX[3], midY, { width: colX[4] - colX[3], align: "center" });

      // 5. Qty
      doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#0f172a").text(it.qty, colX[4], midY, { width: colX[5] - colX[4], align: "center" });

      // 6. Rate
      doc.fontSize(9.5).font("Helvetica").fillColor("#334155").text(it.rate, colX[5], midY, { width: colX[6] - colX[5] - 2, align: "right" });

      // 7. Amount
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#000000").text(it.amount, colX[6], midY, { width: colX[7] - colX[6] - 4, align: "right" });
    } else {
      // Non-photo row (Calibration Quotation - Compact, Clean & Professional!)
      doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#000000");
      doc.text(String(it.itemNo), colX[0], midY, { width: colX[1] - colX[0], align: "center" });

      const scopeX = colX[1] + 6;
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#0f172a").text(it.name, scopeX, curY + padTop, { width: scopeW });

      if (formattedSpecsText) {
        const specsStartY = curY + padTop + nameH + specGap;
        doc.fontSize(8.5).font("Helvetica").fillColor("#334155").text(formattedSpecsText, scopeX, specsStartY, {
          width: scopeW,
          lineGap: 1.15,
        });
      }

      doc.fontSize(9.5).font("Helvetica").fillColor("#334155");
      doc.text(it.hsnSac, colX[2], midY, { width: colX[3] - colX[2], align: "center" });
      doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#0f172a").text(it.qty, colX[3], midY, { width: colX[4] - colX[3], align: "center" });
      doc.fontSize(10.0).font("Helvetica").fillColor("#334155").text(it.rate, colX[4], midY, { width: colX[5] - colX[4] - 2, align: "right" });
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#000000").text(it.amount, colX[5], midY, { width: colX[6] - colX[5] - 6, align: "right" });
    }

    curY += rowH;
  }

  // 5. SUMMARY BLOCK & BOTTOM DETAILS (Multi-Page Auto-Adjust)
  const qtnTerms = parseTermsList(customData.terms);
  const sumH = hasPhoto ? 44 : 38;
  const hsnH = hasPhoto ? 28 : 24;
  const bankSigH = hasPhoto ? 82 : 76;
  const termsBoxH = 16 + 5 + (qtnTerms.length * 11) + 5;
  const gap = 5;
  const totalBottomHeight = sumH + hsnH + bankSigH + termsBoxH + (gap * 2) + 6;

  // If bottom section cannot fit with breathing room, auto-flow to next page!
  if (curY + totalBottomHeight > 775) {
    doc.addPage();
    curY = drawContinuationHeader();
  } else {
    curY = Math.max(curY + (hasPhoto ? 8 : 6), curY);
  }

  // A. Summary Totals Box
  doc.rect(leftMargin, curY, contentWidth, sumH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(leftMargin + 325, curY).lineTo(leftMargin + 325, curY + sumH).lineWidth(0.8).strokeColor("#000000").stroke();

  doc.fontSize(hasPhoto ? 9.0 : 8.5).font("Helvetica-Bold").fillColor("#021C57").text("Total in Words:", leftMargin + 8, curY + 5);
  doc.font("Helvetica").fontSize(hasPhoto ? 8.5 : 8.0).fillColor("#1e293b").text(numberToWords(totalAmount.toFixed(2)), leftMargin + 8, curY + (hasPhoto ? 18 : 15), { width: 310, lineGap: 1.15 });

  doc.font("Helvetica").fontSize(hasPhoto ? 9.0 : 8.5).fillColor("#334155");
  doc.text("Taxable Amount:", leftMargin + 333, curY + 5);
  doc.text(taxableAmount.toFixed(2), leftMargin + 435, curY + 5, { width: 92, align: "right" });

  doc.text("Total Tax (GST):", leftMargin + 333, curY + (hasPhoto ? 18 : 15));
  doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), leftMargin + 435, curY + (hasPhoto ? 18 : 15), { width: 92, align: "right" });

  doc.font("Helvetica-Bold").fontSize(hasPhoto ? 11.0 : 10.0).fillColor("#021C57").text("Grand Total (INR):", leftMargin + 333, curY + (hasPhoto ? 30 : 26));
  doc.text(totalAmount.toFixed(2), leftMargin + 435, curY + (hasPhoto ? 30 : 26), { width: 92, align: "right" });

  curY += sumH;

  // B. HSN / Tax Summary Table (Clear, Prominent 8.5pt Fonts)
  doc.rect(leftMargin, curY, contentWidth, hsnH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.rect(leftMargin, curY, contentWidth, hasPhoto ? 14 : 12).fillColor("#f1f5f9").fill();

  doc.fontSize(hasPhoto ? 8.5 : 8.0).font("Helvetica-Bold").fillColor("#0f172a");
  const hsnY1 = curY + (hasPhoto ? 3 : 2);
  doc.text("HSN/SAC", leftMargin + 6, hsnY1);
  doc.text("Taxable Value", leftMargin + 105, hsnY1, { width: 90, align: "right" });
  doc.text("CGST Rate", leftMargin + 210, hsnY1, { width: 55, align: "center" });
  doc.text("CGST Amt", leftMargin + 270, hsnY1, { width: 55, align: "right" });
  doc.text("SGST Rate", leftMargin + 330, hsnY1, { width: 55, align: "center" });
  doc.text("SGST Amt", leftMargin + 390, hsnY1, { width: 55, align: "right" });
  doc.text("Total Tax Amt", leftMargin + 450, hsnY1, { width: 78, align: "right" });

  doc.font("Helvetica").fontSize(hasPhoto ? 8.5 : 8.0).fillColor("#1e293b");
  const hsnY2 = curY + (hasPhoto ? 15 : 13);
  doc.text("998346", leftMargin + 6, hsnY2);
  doc.text(taxableAmount.toFixed(2), leftMargin + 105, hsnY2, { width: 90, align: "right" });
  doc.text(`${cgstRate.toFixed(1)}%`, leftMargin + 210, hsnY2, { width: 55, align: "center" });
  doc.text(cgstAmount.toFixed(2), leftMargin + 270, hsnY2, { width: 55, align: "right" });
  doc.text(`${sgstRate.toFixed(1)}%`, leftMargin + 330, hsnY2, { width: 55, align: "center" });
  doc.text(sgstAmount.toFixed(2), leftMargin + 390, hsnY2, { width: 55, align: "right" });
  doc.text((cgstAmount + sgstAmount).toFixed(2), leftMargin + 450, hsnY2, { width: 78, align: "right" });

  curY += hsnH + gap;

  // C. BOX 1: Bank Details & Dual QR Codes (Left) + Official Signatory Block (Right)
  const botSplitX = leftMargin + 270;
  const rightWidth = contentWidth - 270; // 265 pt

  doc.rect(leftMargin, curY, contentWidth, bankSigH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(botSplitX, curY).lineTo(botSplitX, curY + bankSigH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Left Section: Bank Details & Dual QR Codes
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#021C57").text("Company's Bank Details:", leftMargin + 8, curY + 6);
  
  let bY = curY + 18;
  const bankValW = 150;
  doc.font("Helvetica").fontSize(7.5).fillColor("#1e293b");
  doc.text(`Bank Name: ${bankName}`, leftMargin + 8, bY, { width: bankValW });
  bY += 11.5;
  doc.text(`Account No: ${accountNo}`, leftMargin + 8, bY, { width: bankValW });
  bY += 11.5;
  doc.text(`Branch: ${branchName}`, leftMargin + 8, bY, { width: bankValW });
  const branchH = doc.heightOfString(`Branch: ${branchName}`, { width: bankValW });
  bY += Math.max(11.5, branchH + 1.5);
  doc.text(`IFSC Code: ${ifscCode}`, leftMargin + 8, bY, { width: bankValW });

  // 1. Static Official Bank QR
  const qr1X = leftMargin + 162;
  const qrSize = 36;
  const qrY = curY + 12;
  if (staticQrBuffer) {
    try {
      doc.image(staticQrBuffer, qr1X, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#0f172a").text("Official Bank QR", qr1X - 3, qrY + qrSize + 3, { width: qrSize + 6, align: "center" });
    } catch (e) {}
  }

  // 2. Dynamic Auto-Generated Fixed Amount QR
  const qr2X = leftMargin + 212;
  if (dynamicQrBuffer) {
    try {
      doc.image(dynamicQrBuffer, qr2X, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#0284c7").text(`Auto Pay INR ${Math.round(totalAmount)}`, qr2X - 5, qrY + qrSize + 3, { width: qrSize + 10, align: "center" });
    } catch (e) {}
  }

  // Right Section: Official Signatory Block (Clean, Centered, Zero Text Clutter)
  const sigCenterX = botSplitX + (rightWidth / 2);
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#021C57").text(
    "For ARCL INSTRUMENTS PRIVATE LIMITED",
    botSplitX + 8,
    curY + 6,
    { width: rightWidth - 16, align: "center" }
  );

  // Centered Official Stamp
  const stampWidth = hasPhoto ? 54 : 48;
  const stampX = sigCenterX - (stampWidth / 2);
  const stampY = curY + 18;
  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, stampX, stampY, { width: stampWidth });
    } catch (e) {}
  }

  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#000000").text(
    "Authorized Signatory",
    botSplitX + 8,
    curY + bankSigH - 14,
    { width: rightWidth - 16, align: "center" }
  );

  curY += bankSigH + gap;

  // D. BOX 2: Dedicated Terms & Conditions Box (Neeche Alag Box)
  doc.rect(leftMargin, curY, contentWidth, termsBoxH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Header Strip of Terms Box
  doc.rect(leftMargin, curY, contentWidth, 16).fillColor("#f1f5f9").fill();
  doc.rect(leftMargin, curY, 3.5, 16).fillColor("#2563EB").fill(); // Left Accent Bar in Blue
  doc.moveTo(leftMargin, curY + 16).lineTo(leftMargin + contentWidth, curY + 16).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#021C57").text(
    "Terms & Conditions:",
    leftMargin + 8,
    curY + 4
  );
  doc.fontSize(6.8).font("Helvetica-Oblique").fillColor("#64748b").text(
    "Standard Commercial Terms & Metrological Service Policy",
    leftMargin + 110,
    curY + 4.5,
    { width: contentWidth - 120, align: "right" }
  );

  // Terms Items inside Box 2
  let tY = curY + 16 + 5;
  const termTextWidth = contentWidth - 16;
  doc.fontSize(7.2);

  qtnTerms.forEach((term, idx) => {
    const cleanTerm = term.replace(/^\d+[\.\)]\s*/, "").trim();
    const colonIdx = cleanTerm.indexOf(":");
    if (colonIdx > -1 && colonIdx < 25) {
      const label = cleanTerm.slice(0, colonIdx + 1).trim();
      const desc = cleanTerm.slice(colonIdx + 1).trim();
      doc.font("Helvetica-Bold").fillColor("#0f172a");
      const numLabel = `${idx + 1}. ${label} `;
      doc.text(numLabel, leftMargin + 8, tY, { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(desc, { width: termTextWidth });
    } else {
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(`${idx + 1}. `, leftMargin + 8, tY, { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(cleanTerm, { width: termTextWidth });
    }
    tY += 11;
  });

  curY += termsBoxH;

  // 6. MULTI-PAGE NUMBERING (Page X of Y) ACROSS ALL PAGES
  const pageRange = doc.bufferedPageRange();
  const totalPages = pageRange.count;
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    const footerText = `Page ${p + 1} of ${totalPages}  •  Quotation Ref: ${qtnNo}  •  Digitally Authenticated Official ARCL Commercial Quotation`;
    doc.fontSize(7.5).font("Helvetica").fillColor("#64748b").text(footerText, leftMargin, 822, {
      width: contentWidth,
      align: "center",
      lineBreak: false,
    });
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 3. DYNAMIC AUTO-SPACED PROFORMA INVOICE PDF
 * =========================================================================
 */
export const generateProformaInvoicePdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 10, bufferPages: true });

  const pi = customData.proformaData || customData;
  const piNo = pi.piNo || pi.proformaNo || "ARCL/PI/26-27/08";
  const piDate = pi.piDate || pi.proformaDate || "22 Jun 2026";
  const dueDate = pi.dueDate || "23 Jun 2026";
  const placeOfSupply = pi.placeOfSupply || "27-MAHARASHTRA";

  const rawCompany = pi.clientCompany || pi.buyerCompany || pi.billTo?.companyName || "RDSS QUALITY CONTROL LAB PRIVATE LIMITED";
  const clientCompany = String(rawCompany).replace(/\r?\n+/g, " ").trim();
  const rawGstin = pi.clientGstin || pi.buyerGstin || pi.billTo?.gstin || "27AAOCR3275P1ZH";
  const clientGstin = String(rawGstin).replace(/\r?\n+/g, " ").trim();
  const rawAddress = pi.clientAddress || pi.buyerAddress || (pi.billTo?.address ? `${pi.billTo.address}, ${pi.billTo.cityStatePin || ""}`.trim() : "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS, BELAVALI, Ambarnath, Thane, MAHARASHTRA, 421503");
  const clientAddress = String(rawAddress).replace(/\r?\n+/g, ", ").replace(/\s+,/g, ",").trim();

  let rawItems = pi.items && Array.isArray(pi.items) && pi.items.length > 0 ? pi.items : defaultProformaInvoiceItems;

  const formattedItems = rawItems.map((it, idx) => ({
    itemNo: it.itemNo || idx + 1,
    name: String(it.name || it.description || `Service Item ${idx + 1}`).replace(/\r?\n+/g, " ").trim(),
    subText: String(it.subText || it.remarks || "").replace(/\r?\n+/g, " ").trim(),
    hsnSac: String(it.hsnSac || it.hsnCode || "998346").trim(),
    qty: String(it.qty || 1) + (it.qtyUnit ? ` ${it.qtyUnit}` : " NOS"),
    rate: Number(it.rate || 0).toFixed(2),
    amount: (Number(it.amount) || Number(it.qty || 1) * Number(it.rate || 0)).toFixed(2),
    rawAmount: Number(it.amount) || Number(it.qty || 1) * Number(it.rate || 0),
  }));

  const taxableAmount = formattedItems.reduce((acc, curr) => acc + curr.rawAmount, 0);
  const isInterstate = placeOfSupply && !placeOfSupply.startsWith("27");
  const cgstRate = isInterstate ? 0 : 9;
  const sgstRate = isInterstate ? 0 : 9;
  const igstRate = isInterstate ? 18 : 0;
  const cgstAmount = isInterstate ? 0 : taxableAmount * 0.09;
  const sgstAmount = isInterstate ? 0 : taxableAmount * 0.09;
  const igstAmount = isInterstate ? taxableAmount * 0.18 : 0;
  const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  // Bank & UPI QR Code
  const bankName = (pi.bankName || process.env.BANK_NAME || "HDFC Bank").trim();
  const accountNo = (pi.accountNo || process.env.BANK_ACCOUNT_NO || "50200111763991").trim();
  const branchName = (pi.bankBranch || process.env.BANK_BRANCH || "Kandivali East - Thakur Village").trim();
  const ifscCode = (pi.ifscCode || process.env.BANK_IFSC || "HDFC0000582").trim();

  const staticQrBuffer = getStaticQrBuffer();
  const dynamicQrBuffer = await getDynamicUpiQrBuffer({
    vpa: pi.upiVpa || process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc",
    payeeName: pi.upiName || process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
    amount: totalAmount,
    refNote: `CALIB-${String(piNo || "PI").replace(/[^a-zA-Z0-9]/g, "")}`,
  });

  const leftMargin = 30;
  const contentWidth = 535;

  // Header helper - exactly identical across Page 1, Page 2, Page 3, and all continuation pages
  const drawProformaHeader = () => {
    const topY = 16;
    const logoWidth = 88;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, leftMargin, topY + 2, { width: logoWidth });
      } catch (e) {
        doc.fontSize(22).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
      }
    } else {
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
    }

    const badgeW = 142;
    const badgeH = 54;
    const badgeX = leftMargin + contentWidth - badgeW; // 423
    doc.rect(badgeX, topY + 2, badgeW, badgeH).fillColor("#0d9488").fill();
    doc.fontSize(12.8).font("Helvetica-Bold").fillColor("#ffffff").text("PROFORMA INVOICE", badgeX, topY + 11, { width: badgeW, align: "center" });
    doc.fontSize(7.5).font("Helvetica").fillColor("#ffffff").text("Advance Commercial Estimate", badgeX, topY + 31, { width: badgeW, align: "center" });

    const headerTextX = leftMargin + logoWidth + 12; // 130
    const headerTextW = badgeX - headerTextX - 6; // 287 pt width

    let hCursorY = topY + 2;
    doc.fontSize(14.8).font("Helvetica-Bold").fillColor("#0d9488").text("ARCL INSTRUMENTS PRIVATE LIMITED", headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString("ARCL INSTRUMENTS PRIVATE LIMITED", { width: headerTextW }) + 3.0;

    doc.fontSize(8.4).font("Helvetica").fillColor("#334155");
    const compAddr = "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708";
    doc.text(compAddr, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compAddr, { width: headerTextW }) + 3.0;

    doc.fontSize(8.4).font("Helvetica-Bold").fillColor("#1e293b");
    const compGstinPhone = "GSTIN: 27AATCA7874C1ZB  |  Phone: +91 8369458583 / +91 6205691085";
    doc.text(compGstinPhone, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compGstinPhone, { width: headerTextW }) + 3.0;

    doc.fontSize(8.0).font("Helvetica").fillColor("#334155");
    const compWebEmail = "Email: arclinstruments@gmail.com  |  Website: www.arcl.in  |  Maharashtra, India";
    doc.text(compWebEmail, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compWebEmail, { width: headerTextW }) + 5.0;

    const sepY = Math.max(hCursorY, topY + badgeH + 6, topY + 76);
    doc.moveTo(leftMargin, sepY).lineTo(leftMargin + contentWidth, sepY).lineWidth(2.0).strokeColor("#0d9488").stroke();
    return sepY;
  };

  // Header helper for multi-page continuation - exactly matches Page 1
  const drawContinuationHeader = () => {
    const sepY = drawProformaHeader();
    return sepY + 8;
  };

  // 1. TOP OFFICIAL HEADER (Enlarged, Prominent, Zero Overlap Guarantee)
  const sepY = drawProformaHeader();

  // 2. PROFORMA TO & DETAILS CARD (Zero Overlap, Dynamic Heights, Prominent Fonts)
  const boxY = sepY + 7;
  const boxH = 106;
  const boxSplitX = leftMargin + 270;

  doc.rect(leftMargin, boxY, contentWidth, boxH).lineWidth(1.0).strokeColor("#000000").stroke();
  doc.moveTo(boxSplitX, boxY).lineTo(boxSplitX, boxY + boxH).lineWidth(1.0).strokeColor("#000000").stroke();

  // Left: Proforma To
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#0d9488").text("Proforma To (Customer / Client):", leftMargin + 9, boxY + 6);
  const clientBoxW = 252;
  const clientNameY = boxY + 19;
  doc.fontSize(12.0).font("Helvetica-Bold").fillColor("#000000").text(clientCompany, leftMargin + 9, clientNameY, { width: clientBoxW });
  const clientNameH = doc.heightOfString(clientCompany, { width: clientBoxW });
  const addressY = clientNameY + clientNameH + 2;
  const gstinY = boxY + boxH - 16;
  const maxAddressH = Math.max(18, gstinY - addressY - 2);

  doc.fontSize(8.5).font("Helvetica").fillColor("#334155").text(clientAddress, leftMargin + 9, addressY, {
    width: clientBoxW,
    height: maxAddressH,
    lineGap: 1.2,
    ellipsis: true,
  });
  doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#000000").text(`GSTIN: ${clientGstin}`, leftMargin + 9, gstinY);

  // Right: Proforma Details
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#0d9488").text("Proforma Invoice Reference Details:", boxSplitX + 9, boxY + 6);
  const rStart = boxY + 20;
  const rGap = 20;

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Proforma No.:", boxSplitX + 9, rStart + 1);
  doc.font("Helvetica-Bold").fontSize(12.0).fillColor("#0d9488").text(piNo, boxSplitX + 98, rStart, { width: 156 });

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Date:", boxSplitX + 9, rStart + rGap + 1);
  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#000000").text(piDate, boxSplitX + 98, rStart + rGap, { width: 156 });

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Due Date:", boxSplitX + 9, rStart + rGap * 2 + 1);
  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#000000").text(dueDate, boxSplitX + 98, rStart + rGap * 2, { width: 156 });

  doc.font("Helvetica").fontSize(9.0).fillColor("#334155").text("Place of Supply:", boxSplitX + 9, rStart + rGap * 3 + 1);
  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#000000").text(placeOfSupply, boxSplitX + 98, rStart + rGap * 3, { width: 156 });

  // 3. TABLE COLUMNS & HEADER FUNCTION
  const colX = [
    leftMargin,                // 30  -> #: 22
    leftMargin + 22,           // 52  -> Scope: 270
    leftMargin + 292,          // 322 -> HSN: 48
    leftMargin + 340,          // 370 -> Qty: 40
    leftMargin + 380,          // 410 -> Rate (INR): 70
    leftMargin + 450,          // 480 -> Amount (INR): 85
    leftMargin + contentWidth, // 565
  ];

  const thH = 24;
  const drawTableHeader = (atY) => {
    doc.rect(leftMargin, atY, contentWidth, thH).fillColor("#0d9488").fill();
    for (let i = 1; i < colX.length; i++) {
      doc.moveTo(colX[i], atY).lineTo(colX[i], atY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    }
    doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#ffffff");
    const hTextY = atY + 6.5;
    doc.text("#", colX[0], hTextY, { width: colX[1] - colX[0], align: "center" });
    doc.text("Item & Calibration Scope", colX[1] + 6, hTextY);
    doc.text("HSN/SAC", colX[2], hTextY, { width: colX[3] - colX[2], align: "center" });
    doc.text("Qty", colX[3], hTextY, { width: colX[4] - colX[3], align: "center" });
    doc.text("Rate (INR)", colX[4], hTextY, { width: colX[5] - colX[4] - 2, align: "right" });
    doc.text("Amount (INR)", colX[5], hTextY, { width: colX[6] - colX[5] - 6, align: "right" });
    return atY + thH;
  };

  let curY = boxY + boxH + 6;
  curY = drawTableHeader(curY);

  // 4. ITEMS ROWS (Snug, Well-Proportioned, Multi-Page Safe)
  const N = formattedItems.length;
  for (let i = 0; i < N; i++) {
    const it = formattedItems[i];
    const scopeW = colX[2] - colX[1] - 12;

    doc.fontSize(10.5).font("Helvetica-Bold");
    const nameH = doc.heightOfString(it.name, { width: scopeW });

    let specsH = 0;
    if (it.subText) {
      doc.fontSize(8.5).font("Helvetica");
      specsH = doc.heightOfString(it.subText, { width: scopeW, lineGap: 1.15 });
    }

    const padTop = 5.0;
    const padBot = 5.0;
    const specGap = 2.5;
    const textReqH = padTop + nameH + (it.subText ? specGap + specsH : 0) + padBot;
    const rowH = Math.max(25, textReqH);

    // Multi-page auto page break check
    if (curY + rowH > 770) {
      doc.addPage();
      curY = drawContinuationHeader();
      curY = drawTableHeader(curY);
    }

    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(leftMargin, curY, contentWidth, rowH).fillColor(bg).strokeColor("#000000").lineWidth(0.5).fillAndStroke();

    for (let j = 1; j < colX.length; j++) {
      doc.moveTo(colX[j], curY).lineTo(colX[j], curY + rowH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    }

    const midY = curY + (rowH / 2) - 4.5;
    doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#000000").text(String(it.itemNo), colX[0], midY, { width: colX[1] - colX[0], align: "center" });

    doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#0f172a").text(it.name, colX[1] + 6, curY + padTop, { width: scopeW });
    if (it.subText) {
      doc.fontSize(8.5).font("Helvetica").fillColor("#334155").text(it.subText, colX[1] + 6, curY + padTop + nameH + specGap, {
        width: scopeW,
        lineGap: 1.15,
      });
    }

    doc.fontSize(9.5).font("Helvetica").fillColor("#334155").text(it.hsnSac, colX[2], midY, { width: colX[3] - colX[2], align: "center" });
    doc.fontSize(10.0).font("Helvetica-Bold").fillColor("#0f172a").text(it.qty, colX[3], midY, { width: colX[4] - colX[3], align: "center" });
    doc.fontSize(10.0).font("Helvetica").fillColor("#334155").text(it.rate, colX[4], midY, { width: colX[5] - colX[4] - 2, align: "right" });
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#000000").text(it.amount, colX[5], midY, { width: colX[6] - colX[5] - 6, align: "right" });

    curY += rowH;
  }

  // 5. SUMMARY BLOCK & BOTTOM DETAILS (Multi-Page Auto-Adjust)
  const piTerms = parseTermsList(customData.terms);
  const sumH = 40;
  const hsnH = 26;
  const bankSigH = 76;
  const termsBoxH = 16 + 5 + (piTerms.length * 11) + 5;
  const gap = 5;
  const totalBottomHeight = sumH + hsnH + bankSigH + termsBoxH + (gap * 2) + 6;

  if (curY + totalBottomHeight > 775) {
    doc.addPage();
    curY = drawContinuationHeader();
  } else {
    curY += 6;
  }

  // A. Summary Totals Box
  doc.rect(leftMargin, curY, contentWidth, sumH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(leftMargin + 325, curY).lineTo(leftMargin + 325, curY + sumH).lineWidth(0.8).strokeColor("#000000").stroke();

  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0d9488").text("Total in Words:", leftMargin + 8, curY + 5);
  doc.font("Helvetica").fontSize(8.0).fillColor("#1e293b").text(numberToWords(totalAmount.toFixed(2)), leftMargin + 8, curY + 16, { width: 310, lineGap: 1.15 });

  doc.font("Helvetica").fontSize(8.5).fillColor("#334155");
  doc.text("Taxable Amount:", leftMargin + 333, curY + 5);
  doc.text(taxableAmount.toFixed(2), leftMargin + 435, curY + 5, { width: 92, align: "right" });

  doc.text("Total Tax (GST):", leftMargin + 333, curY + 16);
  doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), leftMargin + 435, curY + 16, { width: 92, align: "right" });

  doc.font("Helvetica-Bold").fontSize(10.0).fillColor("#0d9488").text("Grand Total (INR):", leftMargin + 333, curY + 27);
  doc.text(totalAmount.toFixed(2), leftMargin + 435, curY + 27, { width: 92, align: "right" });

  curY += sumH;

  // B. HSN / Tax Summary Table (Clear, Prominent 8.5pt Fonts)
  doc.rect(leftMargin, curY, contentWidth, hsnH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.rect(leftMargin, curY, contentWidth, 12).fillColor("#f1f5f9").fill();

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#0d9488");
  doc.text("HSN/SAC", leftMargin + 6, curY + 2);
  doc.text("Taxable Value", leftMargin + 95, curY + 2, { width: 85, align: "right" });
  doc.text("CGST Rate", leftMargin + 195, curY + 2, { width: 55, align: "center" });
  doc.text("CGST Amt", leftMargin + 260, curY + 2, { width: 65, align: "right" });
  doc.text("SGST Rate", leftMargin + 335, curY + 2, { width: 55, align: "center" });
  doc.text("SGST Amt", leftMargin + 400, curY + 2, { width: 65, align: "right" });
  doc.text("Total Tax Amt", leftMargin + 470, curY + 2, { width: 58, align: "right" });

  doc.font("Helvetica").fontSize(7.5).fillColor("#1e293b");
  doc.text("998346", leftMargin + 6, curY + 14);
  doc.text(taxableAmount.toFixed(2), leftMargin + 95, curY + 14, { width: 85, align: "right" });
  doc.text(`${cgstRate.toFixed(1)}%`, leftMargin + 195, curY + 14, { width: 55, align: "center" });
  doc.text(cgstAmount.toFixed(2), leftMargin + 260, curY + 14, { width: 65, align: "right" });
  doc.text(`${sgstRate.toFixed(1)}%`, leftMargin + 335, curY + 14, { width: 55, align: "center" });
  doc.text(sgstAmount.toFixed(2), leftMargin + 400, curY + 14, { width: 65, align: "right" });
  doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), leftMargin + 470, curY + 14, { width: 58, align: "right" });

  curY += hsnH + gap;

  // C. BOX 1: Bank Details & Dual QR Codes (Left) + Official Signatory Block (Right)
  const botSplitX = leftMargin + 270;
  const rightWidth = contentWidth - 270; // 265 pt

  doc.rect(leftMargin, curY, contentWidth, bankSigH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(botSplitX, curY).lineTo(botSplitX, curY + bankSigH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Left: Bank Details
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0d9488").text("Company's Bank Details:", leftMargin + 8, curY + 6);
  doc.font("Helvetica").fontSize(7.5).fillColor("#1e293b");
  let bY = curY + 18;
  const bankValW = 150;
  doc.text(`Bank Name: ${bankName}`, leftMargin + 8, bY, { width: bankValW });
  bY += 11.5;
  doc.text(`Account No: ${accountNo}`, leftMargin + 8, bY, { width: bankValW });
  bY += 11.5;
  doc.text(`Branch: ${branchName}`, leftMargin + 8, bY, { width: bankValW });
  const brH = doc.heightOfString(`Branch: ${branchName}`, { width: bankValW });
  bY += Math.max(11.5, brH + 1.5);
  doc.text(`IFSC Code: ${ifscCode}`, leftMargin + 8, bY, { width: bankValW });

  // QR Codes
  const qr1X = leftMargin + 162;
  const qrSize = 36;
  const qrY = curY + 12;

  if (staticQrBuffer) {
    try {
      doc.image(staticQrBuffer, qr1X, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#0f172a").text("Official Bank QR", qr1X - 3, qrY + qrSize + 3, { width: qrSize + 6, align: "center" });
    } catch (e) {}
  }

  const qr2X = leftMargin + 212;
  if (dynamicQrBuffer) {
    try {
      doc.image(dynamicQrBuffer, qr2X, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#0284c7").text(`Auto Pay INR ${Math.round(totalAmount)}`, qr2X - 5, qrY + qrSize + 3, { width: qrSize + 10, align: "center" });
    } catch (e) {}
  }

  // Right Section: Official Signatory Block (Clean, Centered, Zero Text Clutter)
  const sigCenterX = botSplitX + (rightWidth / 2);
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#0d9488").text(
    "For ARCL INSTRUMENTS PRIVATE LIMITED",
    botSplitX + 8,
    curY + 6,
    { width: rightWidth - 16, align: "center" }
  );

  const stampWidth = 48;
  const stampX = sigCenterX - (stampWidth / 2);
  const stampY = curY + 18;
  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, stampX, stampY, { width: stampWidth });
    } catch (e) {}
  }

  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#000000").text(
    "Authorized Signatory",
    botSplitX + 8,
    curY + bankSigH - 14,
    { width: rightWidth - 16, align: "center" }
  );

  curY += bankSigH + gap;

  // D. BOX 2: Dedicated Terms & Conditions Box (Neeche Alag Box)
  doc.rect(leftMargin, curY, contentWidth, termsBoxH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Header Strip of Terms Box
  doc.rect(leftMargin, curY, contentWidth, 16).fillColor("#f1f5f9").fill();
  doc.rect(leftMargin, curY, 3.5, 16).fillColor("#0d9488").fill(); // Left Accent Bar in Teal
  doc.moveTo(leftMargin, curY + 16).lineTo(leftMargin + contentWidth, curY + 16).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#0d9488").text(
    "Terms & Conditions:",
    leftMargin + 8,
    curY + 4
  );
  doc.fontSize(6.8).font("Helvetica-Oblique").fillColor("#64748b").text(
    "Standard Commercial Terms & Metrological Service Policy",
    leftMargin + 110,
    curY + 4.5,
    { width: contentWidth - 120, align: "right" }
  );

  // Terms Items inside Box 2
  let tY = curY + 16 + 5;
  const termTextWidth = contentWidth - 16;
  doc.fontSize(7.2);

  piTerms.forEach((term, idx) => {
    const cleanTerm = term.replace(/^\d+[\.\)]\s*/, "").trim();
    const colonIdx = cleanTerm.indexOf(":");
    if (colonIdx > -1 && colonIdx < 25) {
      const label = cleanTerm.slice(0, colonIdx + 1).trim();
      const desc = cleanTerm.slice(colonIdx + 1).trim();
      doc.font("Helvetica-Bold").fillColor("#0f172a");
      const numLabel = `${idx + 1}. ${label} `;
      doc.text(numLabel, leftMargin + 8, tY, { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(desc, { width: termTextWidth });
    } else {
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(`${idx + 1}. `, leftMargin + 8, tY, { continued: true });
      doc.font("Helvetica").fillColor("#334155").text(cleanTerm, { width: termTextWidth });
    }
    tY += 11;
  });

  curY += termsBoxH;

  // 6. MULTI-PAGE NUMBERING (Page X of Y) ACROSS ALL PAGES
  const pageRange = doc.bufferedPageRange();
  const totalPages = pageRange.count;
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    const footerText = `Page ${p + 1} of ${totalPages}  •  Proforma Ref: ${piNo}  •  Digitally Authenticated Official ARCL Proforma Invoice`;
    doc.fontSize(7.5).font("Helvetica").fillColor("#64748b").text(footerText, leftMargin, 822, {
      width: contentWidth,
      align: "center",
      lineBreak: false,
    });
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 4. EXACT 1:1 ARCL CALIBRATION CERTIFICATE & OBSERVATION WORKSHEET PDF
 * =========================================================================
 */
const CERT_ASSETS_DIR = path.resolve(__dirname, "../../public/assets/cert_assets");
const certAssetCache = new Map();
const getCertAssetBuffer = (fileName) => {
  if (certAssetCache.has(fileName)) return certAssetCache.get(fileName);
  const fullPath = path.join(CERT_ASSETS_DIR, fileName);
  if (fs.existsSync(fullPath)) {
    try {
      const buf = fs.readFileSync(fullPath);
      certAssetCache.set(fileName, buf);
      return buf;
    } catch {
      return null;
    }
  }
  return null;
};

const certificateQrCache = new Map();
export const buildCertificateVerifyUrl = (data = {}, isObservation = false) => {
  const rawBase =
    data.frontendUrl ||
    process.env.PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    "https://www.arclinstruments.com";
  const baseUrl = String(rawBase).trim().replace(/\/+$/, "");

  const params = new URLSearchParams();
  const recId = data.recordId || data._id;
  if (recId && /^[a-f0-9]{24}$/i.test(String(recId))) {
    params.set("id", String(recId));
  } else {
    if (data.certificateNo) params.set("cert", String(data.certificateNo).trim());
    if (data.ulrNo) params.set("ulr", String(data.ulrNo).trim());
    if (data.serialNo && String(data.serialNo).trim() !== "-") {
      params.set("sn", String(data.serialNo).trim());
    }
  }
  const ck = computeCustomerQrSignature(data.clientCompany);
  if (ck) {
    params.set("ck", ck);
  }
  if (isObservation) {
    params.set("doc", "obs");
  }

  const qs = params.toString();
  return qs ? `${baseUrl}/certificate-verify?${qs}` : `${baseUrl}/certificate-verify`;
};

const getCertificateQrBuffer = async (data = {}, isObservation = false) => {
  const verifyUrl = buildCertificateVerifyUrl(data, isObservation);
  if (certificateQrCache.has(verifyUrl)) {
    return certificateQrCache.get(verifyUrl);
  }
  try {
    const buf = await QRCode.toBuffer(verifyUrl, {
      errorCorrectionLevel: "M",
      width: 240,
      margin: 1,
      color: { dark: "#FA9703", light: "#ffffff" },
    });
    if (certificateQrCache.size > 300) {
      certificateQrCache.clear();
    }
    certificateQrCache.set(verifyUrl, buf);
    return buf;
  } catch (err) {
    return getCertAssetBuffer("orange_qr.png");
  }
};

const formatCertDate = (rawVal, fallback = "-") => {
  if (!rawVal) return fallback;
  const s = String(rawVal).trim();
  if (!s || s === "0" || s === "00-01-1900" || s === "1900-01-00") return fallback;
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1950) return fallback;
  return d.toLocaleDateString("en-GB");
};

const drawFourPointStar = (doc, cx, cy, r = 3) => {
  doc.save();
  doc.path(`M ${cx} ${cy - r} L ${cx + r * 0.32} ${cy - r * 0.32} L ${cx + r} ${cy} L ${cx + r * 0.32} ${cy + r * 0.32} L ${cx} ${cy + r} L ${cx - r * 0.32} ${cy + r * 0.32} L ${cx - r} ${cy} L ${cx - r * 0.32} ${cy - r * 0.32} Z`)
    .fillColor("#111827")
    .fill();
  doc.restore();
};

export function renderExactArclSinglePage(doc, data = {}, isObservation = false, qrBuffer = null) {
  const startX = 16;
  const contentW = 563;
  const endX = startX + contentW;

  const certNo = String(
    data.certificateNo || (isObservation ? (data.worksheetNo || "WS-ARCL-2026-001") : "ARCL/CAL/26-27/001")
  ).trim();
  const receiptDate = formatCertDate(data.receiptDate || data.challanDate || data.inwardDate, "-");
  const calDate = formatCertDate(data.calibrationDate, new Date().toLocaleDateString("en-GB"));
  const dueDate = formatCertDate(data.calibrationDueDate || data.suggestedDueDate, "-");
  const issueDate = formatCertDate(
    data.issueDate || data.calibrationDate,
    new Date().toLocaleDateString("en-GB")
  );
  const ulrNo = String(data.ulrNo || "").trim();

  const clientCompany = String(data.clientCompany || data.customer?.name || "Client Organization").trim();
  const clientAddress = String(data.clientAddress || data.customer?.address || "").trim();

  const instrument = String(data.instrument || data.instrumentName || "Compression Testing Machine").trim();
  const isForceInst = /testing\s*machine|\bctm\b|\butm\b/i.test(instrument);
  const makeModel = String(data.makeModel || [data.make, data.modelNo].filter(Boolean).join(" / ") || (data.make || "-")).trim();
  const serialNo = String(data.serialNo || "-").trim();
  const range = String(data.range || data.instrumentRange || (isForceInst ? "3000 kN" : "-")).trim();
  const leastCount = String(data.leastCount || (isForceInst ? "0.1 kN" : "-")).trim();
  const locationStr = String(data.location || "").trim();

  const conditionOfItem = String(data.conditionOfItem || "OK").trim();
  const temperature = String(data.temperature || "(25±2)°C").trim();
  const humidity = String(data.humidity || "(30-80)%").trim();
  const method = String(data.calibrationMethod || data.method || "ARCL-CP-STANDARD").trim();
  const referenceStandard = String(data.referenceStandard || "IS / ISO Metrology Standard").trim();

  const modeStr = String(data.mode || "").trim();
  const discStr = String(
    data.discipline || (isForceInst ? "Mechanical Calibration (Force)" : "Mechanical Calibration (Dimension)")
  ).trim();
  const resultUnitRaw = String(data.resultUnit || "").trim();
  const resultHeading = resultUnitRaw ? `8. Results(${resultUnitRaw}) :` : "8. Results :";

  // Master Equipment
  const masterDesc = String(data.masterDescription || data.masterEquipment || "Proving Ring").trim();
  const masterId = String(data.masterId || data.masterSerialNo || "ARCL/MST/01").trim();
  const masterCertNo = String(data.masterCertNo || "CERT-NABL-001").trim();
  const masterDueDate = String(data.masterDueDate || "-").trim();
  const masterTraceable = String(data.masterTraceable || "NABL Accredited").trim();

  const masterRows = Array.isArray(data.masterEquipments) && data.masterEquipments.length > 0
    ? data.masterEquipments.slice(0, 3).map((m) => [
        String(m.description || masterDesc || "-"),
        String(m.idMark || masterId || "-"),
        String(m.certNo || masterCertNo || "-"),
        String(m.dueDate || masterDueDate || "-"),
        String(m.traceableBy || masterTraceable || "-"),
      ])
    : [[masterDesc, masterId, masterCertNo, masterDueDate, masterTraceable]];

  // Results Table
  const customCols = Array.isArray(data.tableColumns) && data.tableColumns.length >= 2 ? data.tableColumns : null;
  const rawReadings = data.readings || data.observations || data.calibrationResults;
  let results = Array.isArray(rawReadings) && rawReadings.length > 0
    ? rawReadings.map((r, idx) => {
        if (customCols) {
          return {
            ...(typeof r === "object" && r !== null ? r : {}),
            master: r?.master ?? r?.masterValue ?? r?.masterLoad ?? r?.standardValue,
            indicated: r?.indicated ?? r?.mean ?? r?.average ?? r?.observed,
          };
        }
        const nom = String(r.nominal ?? r.gapSize ?? r.specification ?? r.standardValue ?? r.parameter ?? `${(idx + 1) * 300}`).trim();
        const mst = String(r.master ?? r.masterValue ?? r.masterLoad ?? r.standard ?? r.nominal ?? `${(idx + 1) * 300}`).trim();
        const ind = String(r.indicated ?? r.measuredGap ?? r.observed ?? r.mean ?? r.average ?? r.up ?? mst).trim();
        let err = r.error !== undefined && r.error !== "" ? String(r.error).replace(/%/g, "").trim() : String(r.indicationError || "").replace(/%/g, "").trim();
        const mstNum = parseFloat(mst);
        const indNum = parseFloat(ind);
        if (!err && Number.isFinite(mstNum) && Number.isFinite(indNum) && mstNum !== 0) {
          err = isForceInst
            ? (((indNum - mstNum) / mstNum) * 100).toFixed(2)
            : (indNum - mstNum).toFixed(4);
        }
        const rep = String(r.repeatability || r.repeatabilityError || "0.00").replace(/%/g, "").trim();
        const unc = String(r.uncertainty || data.expandedUncertainty || "0.61").replace(/[±% ]/g, "").trim() || "0.61";
        return {
          ...r,
          nominal: nom || `${idx + 1}`,
          master: mst || "-",
          indicated: ind || "-",
          error: err || "0.00",
          repeatability: rep || "0.00",
          uncertainty: unc,
        };
      })
    : [
        { nominal: "300", master: "300.4", indicated: "301.4", error: "0.32", repeatability: "0.00", uncertainty: "0.61" },
        { nominal: "900", master: "901.3", indicated: "902.3", error: "0.11", repeatability: "0.00", uncertainty: "0.61" },
        { nominal: "1200", master: "1201.7", indicated: "1200.3", error: "-0.12", repeatability: "0.01", uncertainty: "0.61" },
        { nominal: "1800", master: "1802.6", indicated: "1800.2", error: "-0.13", repeatability: "0.00", uncertainty: "0.61" },
        { nominal: "2700", master: "2703.9", indicated: "2706.3", error: "0.09", repeatability: "0.02", uncertainty: "0.61" },
      ];

  const calibratedBySite = String(data.calibratedBySite || data.calibratedBy || "VK").trim();
  const authorizedByName = String(data.authorizedBy || "Authorized Signatory").trim();
  const formatNoStr = String(data.formatNo || "FM/CC/05 Rev-01 Dt 10-11-2026").trim();

  // ==========================================
  // 1. TOP HEADER WAVE, TITLE & ACCREDITATION LOGOS
  // ==========================================
  doc.save();
  doc.path("M 0 0 L 304 0 C 312 46 278 86 218 100 C 145 117 52 108 0 132 Z")
    .fillColor("#FF6F00")
    .fill();
  doc.restore();

  doc.fontSize(31).font("Helvetica-Bold").fillColor("#000000").text(
    isObservation ? "METROLOGICAL" : "CALIBRATION",
    10,
    18,
    { lineBreak: false }
  );
  doc.fontSize(23.5).font("Helvetica-Bold").fillColor("#000000").text(
    isObservation ? "OBSERVATION 2026" : "CERTIFICATE 2026",
    10,
    62,
    { lineBreak: false }
  );

  // IQMC, ISO 9001 & ARCL Official Logos
  const iqmcBuf = getCertAssetBuffer("iqmc_logo.png");
  const isoBuf = getCertAssetBuffer("iso_9001_logo.png");
  const arclLogoBuf = getCertAssetBuffer("arcl_logo.png");

  if (iqmcBuf) doc.image(iqmcBuf, 297, 25, { width: 69, height: 69 });
  if (isoBuf) doc.image(isoBuf, 370, 26, { width: 68, height: 68 });
  if (arclLogoBuf) {
    doc.image(arclLogoBuf, 444, 24, { width: 138, height: 64 });
  } else {
    doc.roundedRect(448, 26, 132, 56, 3).strokeColor("#002B66").lineWidth(1).stroke();
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#002B66").text("ARCL", 456, 34, { width: 116, align: "center" });
    doc.fontSize(6.5).text("Building Trust Through Precision and Quality", 452, 62, { width: 124, align: "center" });
  }

  doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#111827").text(
    "Helpline No. 8369458583",
    440,
    92,
    { width: 142, align: "right" }
  );

  // ==========================================
  // 2. FAINT BACKGROUND WATERMARKS (behind grids)
  // ==========================================
  const arclWmBuf = getCertAssetBuffer("arcl_watermark.png");
  const circuitWmBuf = getCertAssetBuffer("circuit_watermark.png");
  if (arclWmBuf) {
    doc.image(arclWmBuf, 152, 200, { width: 292, height: 167 });
  }
  if (circuitWmBuf) {
    doc.image(circuitWmBuf, 102, 372, { width: 392, height: 315 });
  }

  // Helper for transparent bordered cells (lets watermarks show cleanly)
  const drawCell = (x, y, w, h, bg = null) => {
    if (bg) {
      doc.save();
      doc.rect(x, y, w, h).fillColor(bg).fillOpacity(0.55).fill();
      doc.restore();
    }
    doc.rect(x, y, w, h).strokeColor("#000000").lineWidth(0.75).stroke();
  };

  let curY = 138;

  // ==========================================
  // 3. TOP 5-COLUMN INFO BAR
  // ==========================================
  const metaCols = [
    { title: "Date of Receipt", val: receiptDate, w: 117 },
    { title: "Date of Calibration", val: calDate, w: 124 },
    { title: "Due Date of Calibration", val: dueDate, w: 127 },
    { title: isObservation ? "Worksheet No." : "Certificate No.", val: certNo, w: 122 },
    { title: "Date of Issue", val: issueDate, w: 73 },
  ];
  const metaHeadH = 14;
  const metaValH = 15;
  let mCurX = startX;
  metaCols.forEach((mc) => {
    drawCell(mCurX, curY, mc.w, metaHeadH);
    doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#000000").text(mc.title, mCurX + 2, curY + 3.5, { width: mc.w - 4, align: "center", lineBreak: false });
    drawCell(mCurX, curY + metaHeadH, mc.w, metaValH);
    doc.fontSize(7.8).font("Helvetica").fillColor("#000000").text(mc.val, mCurX + 2, curY + metaHeadH + 4, { width: mc.w - 4, align: "center", lineBreak: false });
    mCurX += mc.w;
  });
  curY += metaHeadH + metaValH;

  // ==========================================
  // 4. SECTION 1: CALIBRATED FOR & ULR NO.
  // ==========================================
  const sec1H = 58;
  drawCell(startX, curY, contentW, sec1H);
  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text("1. Calibrated for :", startX + 4, curY + 3.5);
  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text("ULR No.", startX + 362, curY + 3.5);
  if (ulrNo) {
    doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text(ulrNo, startX + 402, curY + 3.5, { width: 155, lineBreak: false });
  }
  doc.fontSize(9.0).font("Helvetica-Bold").fillColor("#000000").text(clientCompany, startX + 12, curY + 17, { width: 345 });
  if (clientAddress) {
    doc.fontSize(8.0).font("Helvetica").fillColor("#1f2937").text(clientAddress, startX + 12, curY + 30, { width: 345 });
  }
  curY += sec1H;

  // ==========================================
  // 5. SECTIONS 2 to 6: SPLIT TWO-COLUMN GRID
  // ==========================================
  const sec2LeftW = 295;
  const sec2RightW = contentW - sec2LeftW; // 268
  const sec2H = 88;

  // Left Column Box: 2. Description of Equipment
  drawCell(startX, curY, sec2LeftW, sec2H);
  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text("2. Description of Equipment :", startX + 4, curY + 3.5);

  const rangeLabel = isForceInst ? "Range(kN)" : (/mm/i.test(resultUnitRaw) ? "Range(mm)" : "Range");
  const leftLabels = [
    { label: "Instrument Name", value: instrument, bold: true },
    { label: "Make/Model", value: makeModel, bold: false },
    { label: "Sr. No./ID No.", value: serialNo, bold: false },
    { label: rangeLabel, value: range, bold: false },
    ...(leastCount && leastCount !== "-" ? [{ label: "Least Count", value: leastCount, bold: false }] : []),
    { label: "Location", value: locationStr || "-", bold: false },
  ];

  const rowStep = leftLabels.length >= 6 ? 11.5 : 13.5;
  leftLabels.forEach((row, i) => {
    const rowY = curY + 16 + i * rowStep;
    doc.fontSize(7.8).font("Helvetica").fillColor("#000000").text(row.label, startX + 4, rowY);
    doc.fontSize(7.8).font("Helvetica").fillColor("#000000").text(":-", startX + 94, rowY);
    doc.fontSize(7.8).font(row.bold ? "Helvetica-Bold" : "Helvetica").fillColor("#000000").text(row.value, startX + 114, rowY, { width: 176, lineBreak: false });
  });

  // Right Column: Rows 3, 4 (Temp/RH), 5, 6 with dedicated ":" center strip
  const rightX = startX + sec2LeftW;
  const rLblW = 123;
  const rColSepW = 10;
  const rValW = sec2RightW - rLblW - rColSepW; // 135
  const rSepX = rightX + rLblW;
  const rValX = rSepX + rColSepW;

  const h3 = 14;
  const h4 = 26;
  const h5 = 16;
  const h6 = sec2H - (h3 + h4 + h5); // 32

  // Row 3: Condition of Item
  drawCell(rightX, curY, rLblW, h3);
  drawCell(rSepX, curY, rColSepW, h3);
  drawCell(rValX, curY, rValW, h3);
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text("3. Condition of Item", rightX + 3, curY + 3.5);
  doc.text(":", rSepX, curY + 3.5, { width: rColSepW, align: "center" });
  doc.font("Helvetica").text(conditionOfItem, rValX + 3, curY + 3.5, { width: rValW - 6, align: "center", lineBreak: false });

  // Row 4: Environmental Conditions (Temp + RH subrows)
  const r4Y = curY + h3;
  drawCell(rightX, r4Y, rLblW, h4);
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text("4. Environmental Conditions", rightX + 3, r4Y + 9);
  drawCell(rSepX, r4Y, rColSepW, h4 / 2);
  drawCell(rValX, r4Y, rValW, h4 / 2);
  doc.text(":", rSepX, r4Y + 2.5, { width: rColSepW, align: "center" });
  doc.font("Helvetica").text(`Temp. : ${temperature}`, rValX + 3, r4Y + 2.5, { width: rValW - 6, align: "center", lineBreak: false });
  drawCell(rSepX, r4Y + h4 / 2, rColSepW, h4 / 2);
  drawCell(rValX, r4Y + h4 / 2, rValW, h4 / 2);
  doc.font("Helvetica-Bold").text(":", rSepX, r4Y + h4 / 2 + 2.5, { width: rColSepW, align: "center" });
  doc.font("Helvetica").text(`RH : ${humidity}`, rValX + 3, r4Y + h4 / 2 + 2.5, { width: rValW - 6, align: "center", lineBreak: false });

  // Row 5: Method of Calibration
  const r5Y = r4Y + h4;
  drawCell(rightX, r5Y, rLblW, h5);
  drawCell(rSepX, r5Y, rColSepW, h5);
  drawCell(rValX, r5Y, rValW, h5);
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text("5. Method of Calibration", rightX + 3, r5Y + 4);
  doc.text(":", rSepX, r5Y + 4, { width: rColSepW, align: "center" });
  doc.font("Helvetica").text(method, rValX + 3, r5Y + 4, { width: rValW - 6, align: "center", lineBreak: false });

  // Row 6: Reference Standard
  const r6Y = r5Y + h5;
  drawCell(rightX, r6Y, rLblW, h6);
  drawCell(rSepX, r6Y, rColSepW, h6);
  drawCell(rValX, r6Y, rValW, h6);
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text("6. Reference Standard", rightX + 3, r6Y + 11);
  doc.text(":", rSepX, r6Y + 11, { width: rColSepW, align: "center" });
  doc.fontSize(7.5).font("Helvetica").text(referenceStandard, rValX + 3, r6Y + 6, { width: rValW - 6, align: "center" });

  curY += sec2H;

  // ==========================================
  // 6. SECTION 7: DETAILS OF MASTER EQUIPMENT
  // ==========================================
  drawCell(startX, curY, contentW, 13);
  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text("7. Details of Master Equipment :", startX + 4, curY + 2.5);
  curY += 13;

  const mCols = [
    { title: "Equipment Description", w: 175 },
    { title: "ID Mark", w: 120 },
    { title: "Certificate No.", w: 99 },
    { title: "Calibration Due Date", w: 96 },
    { title: "Traceable By", w: 73 },
  ];

  let mX = startX;
  const mHeadH = 14;
  mCols.forEach(col => {
    drawCell(mX, curY, col.w, mHeadH);
    doc.fontSize(7.6).font("Helvetica").fillColor("#000000").text(col.title, mX + 2, curY + 3.5, { width: col.w - 4, align: "center", lineBreak: false });
    mX += col.w;
  });
  curY += mHeadH;

  const mDataH = masterRows.length > 1 ? 13 : 15;
  masterRows.forEach((mValues) => {
    mX = startX;
    mCols.forEach((col, idx) => {
      drawCell(mX, curY, col.w, mDataH);
      doc.fontSize(masterRows.length > 1 ? 7.0 : 7.6).font("Helvetica").fillColor("#000000").text(mValues[idx], mX + 2, curY + (masterRows.length > 1 ? 3 : 4), { width: col.w - 4, align: "center", lineBreak: false });
      mX += col.w;
    });
    curY += mDataH;
  });

  // ==========================================
  // 7. SECTION 8: RESULTS TABLE
  // ==========================================
  const rBarH = 14;
  drawCell(startX, curY, contentW, rBarH);
  doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text(resultHeading, startX + 4, curY + 3);
  const rightHeadingText =
    modeStr && !/^standard$/i.test(modeStr)
      ? `Mode: ${modeStr}  |  Discipline: ${discStr}`
      : `Discipline: ${discStr}`;
  doc.fontSize(7.6).font("Helvetica-Bold").fillColor("#000000").text(rightHeadingText, startX + 180, curY + 3.5, {
    width: contentW - 185,
    align: "right",
    lineBreak: false,
  });
  curY += rBarH;

  let rCols = [];
  if (customCols) {
    const colCount = customCols.length;
    const baseW = Math.floor(contentW / colCount);
    const rem = contentW - baseW * colCount;
    rCols = customCols.map((c, i) => ({
      title: (c.label || `Col ${i + 1}`).replace(" As Per ", "\nAs Per ").replace(" (", "\n("),
      key: c.key,
      w: baseW + (i === colCount - 1 ? rem : 0),
    }));
  } else {
    rCols = [
      { title: "Nominal Force\n,KN", key: "nominal", w: 78 },
      { title: "Master True Load (KN) at Site\nEC", key: "masterLoad", altKey: "master", w: 110 },
      { title: "Average Indicated Load\n(KN)", key: "indicated", w: 110 },
      { title: "Relative Indication\nError(%)", key: "indError", altKey: "error", w: 88 },
      { title: "Relative Repeatability\nError(%)", key: "repError", altKey: "repeatability", w: 88 },
      { title: "± Expanded\nUncertainity(%rdg)", key: "uncertainty", w: 89 },
    ];
  }

  let rX = startX;
  const rHeadH = 26;
  rCols.forEach(col => {
    drawCell(rX, curY, col.w, rHeadH);
    const lineCount = String(col.title).split("\n").length;
    const topPad = lineCount > 1 ? 4 : 9;
    doc.fontSize(customCols && rCols.length > 6 ? 6.4 : 7.6).font("Helvetica").fillColor("#000000").text(col.title, rX + 2, curY + topPad, { width: col.w - 4, align: "center" });
    rX += col.w;
  });
  curY += rHeadH;

  // Results Data Rows
  const rRowH = results.length > 14 ? 11.8 : results.length > 10 ? 13.2 : 15;
  results.forEach((row) => {
    if (curY + rRowH > 596) return;
    rX = startX;
    rCols.forEach((col, cIdx) => {
      drawCell(rX, curY, col.w, rRowH);
      let val = row[col.key];
      if (val === undefined && col.altKey) val = row[col.altKey];
      if (val === undefined) {
        if (Array.isArray(row)) val = row[cIdx];
        else if (!customCols) {
          const fallbackKeys = ["nominal", "master", "indicated", "error", "repeatability", "uncertainty"];
          val = row[fallbackKeys[cIdx]] || "-";
        } else {
          val = "-";
        }
      }
      doc.fontSize(results.length > 14 ? 6.6 : 7.8).font("Helvetica").fillColor("#000000").text(String(val !== undefined && val !== null && val !== "" ? val : "-"), rX + 2, curY + (results.length > 14 ? 2.2 : 3.8), { width: col.w - 4, align: "center", lineBreak: false });
      rX += col.w;
    });
    curY += rRowH;
  });

  // ==========================================
  // 8. NOTES, MEASUREMENT UNCERTAINTY & SIGNATORY
  // ==========================================
  curY += 5;
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#000000").text(
    "Note: The Calibration Certificate referes only to the Particular Calibrated Items(s).",
    startX,
    curY
  );
  curY += 12;

  const expUnc = String(data.expandedUncertainty || "").trim();
  if (expUnc && expUnc !== "0") {
    const muUnitLabel = data.muUnit ? `±${data.muUnit}` : "±";
    doc.fontSize(8.2).font("Helvetica-Bold").fillColor("#000000").text(
      `Measurement Uncertainty ${muUnitLabel}   ${expUnc}`,
      startX + 46,
      curY
    );
    curY += 12;
  }

  const notes = [
    "* The Calibration has been carried out without adjustment.",
    "* The reported Uncertainty is at coverage factor k=2 with coverage prob. of approx. 95% for a normal distribution.",
    "* Our Masters are calibrated through NABL accredited calibration lab, India having traceability with national/International standard.",
    "* This Certificate shall not be reproduced except in full, without the written approval of ARCL Instruments Pvt Ltd.",
    "* Due date of calibration and calibration points are given based on customer requirements.",
  ];

  notes.forEach(n => {
    doc.fontSize(7.6).font("Helvetica").fillColor("#000000").text(n, startX, curY);
    curY += 11;
  });

  curY += 2;
  doc.fontSize(7.8).font("Helvetica").fillColor("#000000").text(
    `* Calibrated By: ${calibratedBySite}`,
    startX,
    curY
  );

  // Subtle Official Stamp + Approved Signatory on lower right (above divider line)
  const stampImg = getCertAssetBuffer("arcl_stamp.png");
  if (stampImg) {
    doc.save();
    doc.opacity(0.28);
    doc.image(stampImg, 488, 624, { width: 52, height: 52 });
    doc.restore();
  }

  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text(
    isObservation ? "Calibrated & Verified By" : "Reviewed & Approved By",
    455,
    670,
    { width: 124, align: "center" }
  );
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text(
    `(${authorizedByName})`,
    455,
    680,
    { width: 124, align: "center" }
  );
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#000000").text(
    "Technical Manager",
    455,
    690,
    { width: 124, align: "center" }
  );

  // Format No. & End-of-Certificate Line with crisp vector diamond stars & em-dashes
  doc.fontSize(5.8).font("Helvetica").fillColor("#1f2937").text(
    `Format No. ${formatNoStr}`,
    startX,
    704
  );
  const endLabelText = isObservation ? "END OF OBSERVATION SHEET" : "END OF CERTIFICATE";
  doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#111827").text(
    endLabelText,
    startX,
    711,
    { width: contentW, align: "center" }
  );
  const midX = startX + contentW / 2;
  doc.moveTo(midX - 60, 714.5).lineTo(midX - 52, 714.5).lineWidth(0.7).strokeColor("#111827").stroke();
  drawFourPointStar(doc, midX - 46, 714.5, 2.8);
  drawFourPointStar(doc, midX + 46, 714.5, 2.8);
  doc.moveTo(midX + 52, 714.5).lineTo(midX + 60, 714.5).lineWidth(0.7).strokeColor("#111827").stroke();

  // ==========================================
  // 9. BOTTOM OFFICIAL ARCL FOOTER & ORANGE QR
  // ==========================================
  const footY = 730;
  doc.fontSize(15.5).font("Helvetica-Bold").fillColor("#0f172a").text(
    "ARCL INSTRUMENTS PRIVATE LIMITED",
    startX,
    footY
  );
  doc.fontSize(10.8).font("Helvetica").fillColor("#1f2937").text(
    "(An ISO 9001:2015 Certified Company)",
    startX,
    footY + 19
  );

  const locIcon = getCertAssetBuffer("icon_location.png");
  const phIcon = getCertAssetBuffer("icon_phone.png");
  const mailIcon = getCertAssetBuffer("icon_mail.png");
  const webIcon = getCertAssetBuffer("icon_web.png");

  if (locIcon) doc.image(locIcon, startX, footY + 38, { width: 13, height: 13 });
  else doc.circle(startX + 6, footY + 44, 3).fillColor("#000000").fill();
  doc.fontSize(10.5).font("Helvetica").fillColor("#111827").text(
    "Shop No. 6, Siddhivinayak Park CHS, Sector - 8A,\nAiroli, Navi Mumbai, MAHARASHTRA, 400708.",
    startX + 18,
    footY + 35,
    { lineGap: 1.5 }
  );

  if (phIcon) doc.image(phIcon, startX, footY + 64, { width: 12, height: 12 });
  doc.fontSize(10.5).font("Helvetica").fillColor("#111827").text(
    "+91 - 8369458583 / 6205691085",
    startX + 18,
    footY + 64
  );

  if (mailIcon) doc.image(mailIcon, startX, footY + 79, { width: 12, height: 12 });
  doc.fontSize(10.5).font("Helvetica").fillColor("#111827").text(
    "info@arclinstruments.com",
    startX + 18,
    footY + 79
  );
  if (webIcon) doc.image(webIcon, startX + 186, footY + 79, { width: 12, height: 12 });
  doc.fontSize(10.5).font("Helvetica").fillColor("#111827").text(
    "www.arclinstruments.com",
    startX + 203,
    footY + 79
  );

  // Orange QR Code with Rounded Border Frame
  const qrX = 447;
  const qrY = 733;
  const qrS = 84;
  doc.roundedRect(qrX, qrY, qrS, qrS, 4).strokeColor("#FA9703").lineWidth(2.6).stroke();
  const activeQrBuf = qrBuffer || getCertAssetBuffer("orange_qr.png");
  if (activeQrBuf) {
    doc.image(activeQrBuf, qrX + 5, qrY + 5, { width: qrS - 10, height: qrS - 10 });
  }

  // Right-Bottom 3 Layered Curved Waves (Orange, Indigo, Mint Green)
  doc.save();
  doc.path("M 595 708 C 562 722 558 785 561 842 L 595 842 Z").fillColor("#FF6F00").fill();
  doc.path("M 595 726 C 571 742 568 796 571 842 L 595 842 Z").fillColor("#283194").fill();
  doc.path("M 595 742 C 579 758 577 804 580 842 L 595 842 Z").fillColor("#4CC58A").fill();
  doc.restore();
}

export async function buildExactArclCertificateOrObservationPdf(data = {}, isObservation = false) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 16, bottom: 0, left: 24, right: 24 },
    bufferPages: true,
    autoFirstPage: true
  });

  const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : [data];

  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      doc.addPage({ size: "A4", margins: { top: 16, bottom: 0, left: 24, right: 24 } });
    }
    const itemData = {
      ...data,
      ...items[i],
    };
    const qrBuffer = await getCertificateQrBuffer(itemData, isObservation);
    renderExactArclSinglePage(doc, itemData, isObservation, qrBuffer);
  }

  return new Promise((resolve, reject) => {
    let chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export const generateCalibrationCertificatePdf = async (data = {}) => {
  return buildExactArclCertificateOrObservationPdf(data, false);
};

export const generateObservationSheetPdf = async (data = {}) => {
  return buildExactArclCertificateOrObservationPdf(data, true);
};

/**
 * =========================================================================
 * 6. DYNAMIC AUTO-SPACED SRF INWARD SLIP PDF
 * =========================================================================
 */
export const generateSrfSlipPdf = async (data = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const srfNo = data.srfNo || data.srfNumber || "SRF/26-27/01";
  const calDate = data.calibrationDate
    ? (data.calibrationDate instanceof Date ? data.calibrationDate.toLocaleDateString("en-GB") : String(data.calibrationDate).slice(0, 10))
    : new Date().toLocaleDateString("en-GB");
  const challanDate = data.challanDate
    ? (data.challanDate instanceof Date ? data.challanDate.toLocaleDateString("en-GB") : String(data.challanDate).slice(0, 10))
    : calDate;

  // Sanitize all strings to strip newline breaks that cause PDFKit vertical overflows
  const clientCompany = (data.clientCompany || data.customer?.name || "Tata Projects Ltd. / Valued Client").replace(/\r?\n+/g, " ").trim();
  const contactPerson = (data.clientContactPerson || data.contactPerson || "Quality Lead").replace(/\r?\n+/g, " ").trim();
  const clientGst = (data.clientGst || data.clientGstin || "N/A").replace(/\r?\n+/g, " ").trim();
  const clientAddress = (data.clientAddress || "Plot No. 12, TTC Industrial Area, MIDC, Airoli, Navi Mumbai - 400708").replace(/\r?\n+/g, ", ").replace(/\s+,/g, ",").trim();
  const clientPhone = (data.clientPhone || data.phone || "+91 8009559900").replace(/\r?\n+/g, " ").trim();
  const dcNo = (data.dcNo || "N/A").replace(/\r?\n+/g, " ").trim();
  const rawSentToLab = data.sentToLab || "ARCL Calibration Lab";
  const sentToLab = (rawSentToLab.includes("Metrology") || rawSentToLab.includes("Central") ? "ARCL Calibration Lab" : rawSentToLab).replace(/\r?\n+/g, " ").trim();

  const srfAmount = data.finalPayableAmount || data.totalAmount || data.grandTotal || data.charges || 2950;
  const dynamicQrBuffer = await getDynamicUpiQrBuffer({
    vpa: data.upiVpa || process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc",
    payeeName: data.upiName || process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
    amount: srfAmount,
    refNote: `CALIB-${String(srfNo).replace(/[^a-zA-Z0-9]/g, "")}`,
  });

  // Dynamic Inward Instruments List
  const rawInstruments = data.instruments && Array.isArray(data.instruments) && data.instruments.length > 0
    ? data.instruments
    : [
        {
          instrument: data.instrument || "Digital Compression Testing Machine 2000 kN",
          serialNo: data.serialNo || "ARCL-CTM-9842",
          make: data.make || "",
          modelNo: data.modelNo || "",
          instrumentRange: data.instrumentRange || "0 - 2000 kN",
          stickerCheck: true,
          remarks: data.remarks || "Standard NABL Calibration Required",
        }
      ];

  const leftMargin = 30;
  const contentWidth = 535;

  // 1. OFFICIAL ARCL HEADER
  let curY = drawOfficialHeader(doc, "Service Request Form (SRF Inward & Calibration Job Slip)", "#9a3412");

  // 2. CLIENT & INWARD DETAILS CARD (Polished, Perfectly Proportioned Layout)
  const infoH = 82;
  doc.rect(leftMargin, curY, contentWidth, infoH).fillColor("#f8fafc").strokeColor("#cbd5e1").lineWidth(0.8).fillAndStroke();
  doc.rect(leftMargin, curY, 4, infoH).fillColor("#d97706").fill(); // Left Amber accent bar

  // Row 1: SRF Job No | Inward Date | Inward DC / Challan
  const r1Y = curY + 6;
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("SRF Job No:", leftMargin + 10, r1Y, { width: 55 });
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#b45309").text(srfNo, leftMargin + 68, r1Y - 0.5, { width: 100, lineBreak: false });

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("Inward Date:", leftMargin + 175, r1Y, { width: 55 });
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#0f172a").text(calDate, leftMargin + 234, r1Y, { width: 70, lineBreak: false });

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("Inward DC / Challan:", leftMargin + 310, r1Y, { width: 85 });
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#021C57").text(`${dcNo} (Dt: ${challanDate})`, leftMargin + 398, r1Y, { width: 132, lineBreak: false });

  doc.moveTo(leftMargin + 6, curY + 26).lineTo(leftMargin + contentWidth - 6, curY + 26).lineWidth(0.5).strokeColor("#e2e8f0").stroke();

  // Row 2: Customer Name | Contact Person | Phone No | GSTIN (4 Separate Distinct Columns)
  const r2Y = curY + 31;
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("Customer:", leftMargin + 10, r2Y, { width: 45 });
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#0f172a").text(clientCompany, leftMargin + 58, r2Y - 0.5, { width: 110, lineBreak: false });

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("Contact:", leftMargin + 175, r2Y, { width: 45 });
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#0f172a").text(contactPerson, leftMargin + 222, r2Y - 0.5, { width: 80, lineBreak: false });

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("Phone:", leftMargin + 310, r2Y, { width: 38 });
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#0f172a").text(clientPhone, leftMargin + 350, r2Y - 0.5, { width: 75, lineBreak: false });

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("GSTIN:", leftMargin + 430, r2Y, { width: 35 });
  doc.fontSize(8.0).font("Helvetica-Bold").fillColor("#021C57").text(clientGst, leftMargin + 468, r2Y - 0.5, { width: 65, lineBreak: false });

  doc.moveTo(leftMargin + 6, curY + 52).lineTo(leftMargin + contentWidth - 6, curY + 52).lineWidth(0.5).strokeColor("#e2e8f0").stroke();

  // Row 3: Site / Address (Spanning full width)
  const r3Y = curY + 57;
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#64748b").text("Site / Address:", leftMargin + 10, r3Y, { width: 68 });
  doc.fontSize(7.5).font("Helvetica").fillColor("#334155").text(clientAddress, leftMargin + 80, r3Y, {
    width: contentWidth - 86,
    height: 20,
    lineGap: 1.2,
    ellipsis: true
  });

  curY += infoH + 8;

  // 3. INSTRUMENTS TABLE
  const thH = 17;
  doc.rect(leftMargin, curY, contentWidth, thH).fillColor("#021C57").fill();

  const colX = [
    leftMargin,
    leftMargin + 24,
    leftMargin + 225,
    leftMargin + 310,
    leftMargin + 395,
    leftMargin + 465,
    leftMargin + contentWidth
  ];

  for (let i = 1; i < colX.length; i++) {
    doc.moveTo(colX[i], curY).lineTo(colX[i], curY + thH).lineWidth(0.5).strokeColor("#3b82f6").stroke();
  }

  doc.fontSize(6.8).font("Helvetica-Bold").fillColor("#ffffff");
  doc.text("Sr.", colX[0], curY + 4.5, { width: colX[1] - colX[0], align: "center" });
  doc.text("Equipment / Instrument Description & Scope", colX[1] + 5, curY + 4.5, { width: colX[2] - colX[1] - 10 });
  doc.text("Make / Model", colX[2], curY + 4.5, { width: colX[3] - colX[2], align: "center" });
  doc.text("Serial / Asset No.", colX[3], curY + 4.5, { width: colX[4] - colX[3], align: "center" });
  doc.text("Range / Capacity", colX[4], curY + 4.5, { width: colX[5] - colX[4], align: "center" });
  doc.text("Inward Status", colX[5], curY + 4.5, { width: colX[6] - colX[5], align: "center" });

  curY += thH;

  const N = rawInstruments.length;
  // Calculate dynamic row height to fit all items cleanly on 1 page
  const maxTableHeight = 250;
  let rowH = 26;
  let showSub = true;
  if (N <= 3) {
    rowH = 30;
  } else if (N <= 6) {
    rowH = 24;
  } else if (N <= 10) {
    rowH = 18;
    showSub = false;
  } else {
    rowH = Math.max(13.5, Math.floor(maxTableHeight / N));
    showSub = false;
  }

  rawInstruments.forEach((it, idx) => {
    const bg = idx % 2 === 0 ? "#ffffff" : "#fdfcfb";
    doc.rect(leftMargin, curY, contentWidth, rowH).fillColor(bg).strokeColor("#cbd5e1").lineWidth(0.5).fillAndStroke();

    for (let i = 1; i < colX.length; i++) {
      doc.moveTo(colX[i], curY).lineTo(colX[i], curY + rowH).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
    }

    const midY = curY + (rowH / 2) - 3.5;

    // Sr.
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#475569").text(String(idx + 1), colX[0], midY, { width: colX[1] - colX[0], align: "center" });

    // Description & Scope
    const instName = (it.instrument || "Testing Equipment").replace(/\r?\n+/g, " ").trim();
    if (showSub && rowH >= 24) {
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#0f172a").text(instName, colX[1] + 5, curY + 3.5, { width: colX[2] - colX[1] - 10, lineBreak: false });
      doc.fontSize(5.8).font("Helvetica").fillColor("#64748b").text("Scope: ISO/IEC 17025 Calibration (NABL Traceable)", colX[1] + 5, curY + 13.5, { width: colX[2] - colX[1] - 10 });
    } else {
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#0f172a").text(instName, colX[1] + 5, midY, { width: colX[2] - colX[1] - 10, lineBreak: false });
    }

    // Make & Model
    const makeModelStr = [it.make, it.modelNo].filter(Boolean).join(" / ").replace(/\r?\n+/g, " ").trim() || "-";
    doc.fontSize(6.2).font("Helvetica").fillColor("#334155").text(makeModelStr, colX[2] + 3, midY, { width: colX[3] - colX[2] - 6, align: "center", lineBreak: false });

    // Serial No
    doc.fontSize(6.8).font("Helvetica-Bold").fillColor("#1d4ed8").text((it.serialNo || "N/A").replace(/\r?\n+/g, " ").trim(), colX[3] + 3, midY, { width: colX[4] - colX[3] - 6, align: "center", lineBreak: false });

    // Range
    doc.fontSize(6.2).font("Helvetica").fillColor("#334155").text((it.instrumentRange || "Standard").replace(/\r?\n+/g, " ").trim(), colX[4] + 3, midY, { width: colX[5] - colX[4] - 6, align: "center", lineBreak: false });

    // Inward Status Badge (Use standard text to avoid character encoding issue)
    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#059669").text("Received [OK]", colX[5], midY, { width: colX[6] - colX[5], align: "center" });

    curY += rowH;
  });

  curY += 8;

  // 4. TECHNICAL ACCEPTANCE REVIEW BOX
  const reviewH = 38;
  doc.rect(leftMargin, curY, contentWidth, reviewH).fillColor("#f8fafc").strokeColor("#cbd5e1").lineWidth(0.5).fillAndStroke();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#021C57").text("Inward Quality & Technical Acceptance Review:", leftMargin + 8, curY + 5);

  const halfW = (contentWidth - 20) / 2;
  const col1Left = leftMargin + 8;
  const col2Left = leftMargin + 10 + halfW;

  doc.fontSize(6.2).font("Helvetica").fillColor("#334155");
  doc.text(`• Total Inward Items: ${N} Equipment(s) Logged & Inspected.`, col1Left, curY + 15, { width: halfW, lineBreak: false });
  doc.text("• Physical Condition: Sound condition, zero structural damage, probes intact.", col1Left, curY + 25, { width: halfW, lineBreak: false });

  doc.text("• Standards Traceability: Reference standards traceable to NPL / ERTL India.", col2Left, curY + 15, { width: halfW, lineBreak: false });
  doc.text(`• Assigned Division: ${sentToLab} • Holographic Sticker Approved.`, col2Left, curY + 25, { width: halfW, lineBreak: false });

  curY += reviewH + 8;

  // 5. SIGNATURE & HANDOVER SECTION
  const signH = 44;
  const signW = (contentWidth - 10) / 2;

  // Customer Handover Box
  doc.rect(leftMargin, curY, signW, signH).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
  doc.fontSize(6.8).font("Helvetica-Bold").fillColor("#334155").text("Handed Over By (Customer / Logistics Rep):", leftMargin + 8, curY + 5);
  doc.fontSize(6.2).font("Helvetica").fillColor("#64748b").text(`Name: ${contactPerson} (${clientCompany})`, leftMargin + 8, curY + 28, { width: signW - 16, lineBreak: false });

  // ARCL Lab Incharge Box
  const sign2X = leftMargin + signW + 10;
  doc.rect(sign2X, curY, signW, signH).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
  doc.fontSize(6.8).font("Helvetica-Bold").fillColor("#334155").text("Received & Accepted By (ARCL Calibration Incharge):", sign2X + 8, curY + 5);
  doc.fontSize(6.2).font("Helvetica-Bold").fillColor("#059669").text("Authorized Quality Acceptance • CC-4313", sign2X + 8, curY + 28);

  curY += signH + 6;

  // 5.1 TERMS AND CONDITIONS BLOCK (DYNAMIC & EDITABLE)
  const srfTermsList = parseTermsList(data.terms);
  if (srfTermsList && srfTermsList.length > 0 && curY < 680) {
    const maxLines = Math.min(srfTermsList.length, 5);
    const termsBoxH = Math.min(55, 15 + (maxLines * 7.8));
    doc.rect(leftMargin, curY, contentWidth, termsBoxH).fillColor("#fdfcfb").strokeColor("#cbd5e1").lineWidth(0.5).fillAndStroke();
    doc.fontSize(6.2).font("Helvetica-Bold").fillColor("#0f172a").text("Terms & Conditions:", leftMargin + 8, curY + 3.5);
    doc.font("Helvetica").fontSize(5.2).fillColor("#334155");
    for (let i = 0; i < maxLines; i++) {
      const cleanTerm = srfTermsList[i].replace(/^\d+[\.\)]\s*/, "");
      const lineY = curY + 12 + (i * 7.8);
      if (lineY < curY + termsBoxH - 2) {
        doc.text(`${i + 1}. ${cleanTerm}`, leftMargin + 8, lineY, { width: contentWidth - 16, lineBreak: false });
      }
    }
  }

  // 6. OFFICIAL FOOTER (Positioned at 735, with clean non-overlapping bottom text)
  const footerY = 735;
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    drawOfficialFooter(doc, footerY, dynamicQrBuffer);
    // Position pagination text strictly on the left half to avoid collision with right-side Authorized Signatory & Stamp
    doc.fontSize(6).font("Helvetica").fillColor("#94a3b8").text(
      `Page ${p + 1} of ${range.count}  •  SRF Ref: ${srfNo}  •  Inward Challan: ${dcNo}`,
      leftMargin + 10,
      788,
      { width: 360, align: "left" }
    );
  }

  return buildPdfBuffer(doc);
};

export const generateSRFSlipPdf = generateSrfSlipPdf;

/**
 * =========================================================================
 * 7. DYNAMIC AUTO-SPACED PURCHASE ORDER PDF (LANDSCAPE)
 * =========================================================================
 */
export const generatePurchaseOrderPdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 20, bufferPages: true });

  const po = customData.poData || customData;
  const poNo = po.poNo || "4700018501";
  const poDate = po.poDate || "27-07-2026";
  const supplierName = po.supplierName || "ARCL INSTRUMENTS PRIVATE LIMITED";
  const supplierAddress = po.supplierAddress || "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708";
  const supplierGstin = po.supplierGstin || "27AATCA7874C1ZB";

  let rawItems = po.items && Array.isArray(po.items) && po.items.length > 0 ? po.items : defaultPurchaseOrder19Items;

  const formattedItems = rawItems.map((it, idx) => ({
    slNo: String(it.slNo || idx + 1),
    itemCode: String(it.itemCode || `9000${100 + idx}`),
    description: it.description || it.name || `Item Description ${idx + 1}`,
    hsnCode: String(it.hsnCode || it.hsnSac || "998346"),
    reqDate: it.reqDate || poDate,
    uom: it.uom || it.qtyUnit || "EA",
    qty: String(it.qty || "1"),
    rate: Number(it.rate || 0).toFixed(2),
    cgstPct: String(it.cgstPct || "9"),
    cgstAmt: Number(it.cgstAmt || Number(it.rate || 0) * Number(it.qty || 1) * 0.09).toFixed(2),
    sgstPct: String(it.sgstPct || "9"),
    sgstAmt: Number(it.sgstAmt || Number(it.rate || 0) * Number(it.qty || 1) * 0.09).toFixed(2),
    igstPct: String(it.igstPct || "0"),
    igstAmt: Number(it.igstAmt || 0).toFixed(2),
    grossAmt: (
      Number(it.rate || 0) * Number(it.qty || 1) +
      Number(it.cgstAmt || Number(it.rate || 0) * Number(it.qty || 1) * 0.09) +
      Number(it.sgstAmt || Number(it.rate || 0) * Number(it.qty || 1) * 0.09)
    ).toFixed(2),
    rawGross: Number(it.grossAmt) || (
      Number(it.rate || 0) * Number(it.qty || 1) +
      Number(it.rate || 0) * Number(it.qty || 1) * 0.18
    ),
  }));

  const grandTotal = formattedItems.reduce((acc, curr) => acc + curr.rawGross, 0);

  const staticQrBuffer = getStaticQrBuffer();
  const dynamicQrBuffer = await getDynamicUpiQrBuffer({
    vpa: po.upiVpa || process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc",
    payeeName: po.upiName || process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
    amount: grandTotal,
    refNote: `PO-${String(poNo).replace(/[^a-zA-Z0-9]/g, "")}`,
  });

  const drawPoHeader = (doc) => {
    let topY = 20;
    doc.rect(20, topY, 802, 30).fillColor("#1e293b").fill();
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#ffffff").text("PURCHASE ORDER", 20, topY + 8, { width: 802, align: "center" });

    const boxY = topY + 35;
    doc.fontSize(6).font("Helvetica");
    const addrH = doc.heightOfString(supplierAddress, { width: 380, lineGap: 1 });
    const boxH = Math.max(45, 16 + 10 + addrH + 4 + 10 + 4);

    doc.rect(20, boxY, 802, boxH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    doc.moveTo(420, boxY).lineTo(420, boxY + boxH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    doc.fontSize(7).font("Helvetica-Bold").fillColor("#0f172a").text("Supplier / Service Provider:", 26, boxY + 5);
    doc.font("Helvetica-Bold").fontSize(6.5).text(supplierName, 26, boxY + 16, { width: 380 });
    const sAddrY = boxY + 16 + 10;
    doc.font("Helvetica").fontSize(6).text(supplierAddress, 26, sAddrY, { width: 380, lineGap: 1 });
    const sGstinY = sAddrY + addrH + 4;
    doc.font("Helvetica-Bold").fontSize(6.5).text(`GSTIN: ${supplierGstin}`, 26, sGstinY);

    doc.fontSize(7).font("Helvetica-Bold").text("PO Details:", 426, boxY + 5);
    doc.font("Helvetica").fontSize(6.5);
    doc.text(`PO Number: ${poNo}`, 426, boxY + 16);
    doc.text(`PO Date: ${poDate}`, 426, boxY + 26);
    doc.text(`Payment Terms: 100% Advance Against Proforma Invoice / Calibration Schedule`, 426, boxY + 36, { width: 380 });

    return boxY + boxH + 8;
  };

  const drawPoTableHeader = (doc, startY) => {
    const thH = 16;
    doc.rect(20, startY, 802, thH).fillColor("#334155").fill();
    doc.fontSize(6).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Sl", 22, startY + 4, { width: 15, align: "center" });
    doc.text("Item Code", 40, startY + 4, { width: 45 });
    doc.text("Item Description & Calibration Scope", 90, startY + 4, { width: 230 });
    doc.text("HSN", 325, startY + 4, { width: 40 });
    doc.text("UOM", 370, startY + 4, { width: 25 });
    doc.text("Qty", 400, startY + 4, { width: 25, align: "right" });
    doc.text("Rate (INR)", 430, startY + 4, { width: 55, align: "right" });
    doc.text("CGST %", 490, startY + 4, { width: 35, align: "right" });
    doc.text("CGST Amt", 530, startY + 4, { width: 45, align: "right" });
    doc.text("SGST %", 580, startY + 4, { width: 35, align: "right" });
    doc.text("SGST Amt", 620, startY + 4, { width: 45, align: "right" });
    doc.text("Gross Amt (INR)", 675, startY + 4, { width: 70, align: "right" });
    return startY + thH;
  };

  let curY = drawPoHeader(doc);
  curY = drawPoTableHeader(doc, curY);

  for (let i = 0; i < formattedItems.length; i++) {
    const it = formattedItems[i];
    const itemH = it.description && it.description.includes("\n") ? 20 : 16;

    if (curY + itemH > 520) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
      curY = drawPoTableHeader(doc, 25);
    }

    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(20, curY, 802, itemH).fillColor(bg).strokeColor("#e2e8f0").lineWidth(0.5).fillAndStroke();
    doc.fontSize(6).font("Helvetica").fillColor("#0f172a");
    doc.text(it.slNo, 22, curY + 3, { width: 15, align: "center" });
    doc.text(it.itemCode, 40, curY + 3, { width: 45 });
    doc.text(it.description, 90, curY + 3, { width: 230 });
    doc.text(it.hsnCode, 325, curY + 3, { width: 40 });
    doc.text(it.uom, 370, curY + 3, { width: 25 });
    doc.text(it.qty, 400, curY + 3, { width: 25, align: "right" });
    doc.text(it.rate, 430, curY + 3, { width: 55, align: "right" });
    doc.text(it.cgstPct, 490, curY + 3, { width: 35, align: "right" });
    doc.text(it.cgstAmt, 530, curY + 3, { width: 45, align: "right" });
    doc.text(it.sgstPct, 580, curY + 3, { width: 35, align: "right" });
    doc.text(it.sgstAmt, 620, curY + 3, { width: 45, align: "right" });
    doc.font("Helvetica-Bold").text(it.grossAmt, 675, curY + 3, { width: 70, align: "right" });

    curY += itemH;
  }

  if (curY + 65 > 535) {
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
    curY = 30;
  }

  // Summary Row
  doc.rect(20, curY, 802, 22).fillColor("#1e293b").fill();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#ffffff");
  doc.text("Grand Total PO Value (INR):", 30, curY + 6);
  doc.text(numberToWords(grandTotal.toFixed(2)), 180, curY + 6, { width: 450 });
  doc.text(`INR ${grandTotal.toFixed(2)}`, 660, curY + 6, { width: 150, align: "right" });

  // PO Signatory & Stamp Box with Dual QR Codes
  const poSigY = curY + 28;
  if (poSigY + 55 > 550) {
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
  }
  const finalSigY = poSigY + 55 > 550 ? 30 : poSigY;

  // Render Dual QR in PO Footer
  if (staticQrBuffer) {
    try {
      doc.image(staticQrBuffer, 25, finalSigY + 2, { width: 44, height: 44 });
      doc.fontSize(4.5).font("Helvetica-Bold").fillColor("#0f172a").text("Official Bank QR", 25, finalSigY + 48, { width: 44, align: "center" });
    } catch (e) {}
  }
  if (dynamicQrBuffer) {
    try {
      doc.image(dynamicQrBuffer, 80, finalSigY + 2, { width: 44, height: 44 });
      doc.fontSize(4.5).font("Helvetica-Bold").fillColor("#0284c7").text(`Auto Pay ₹${grandTotal.toFixed(0)}`, 80, finalSigY + 48, { width: 44, align: "center" });
    } catch (e) {}
  }

  doc.rect(530, finalSigY, 292, 50).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#0f172a").text("For ARCL INSTRUMENTS PRIVATE LIMITED", 535, finalSigY + 5, { width: 282, align: "right" });
  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, 735, finalSigY + 6, { width: 68 });
    } catch (e) {}
  }
  doc.fontSize(6.5).font("Helvetica").fillColor("#334155").text("Authorized Signatory", 535, finalSigY + 38, { width: 282, align: "right" });

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    doc.fontSize(6.5).font("Helvetica").fillColor("#64748b").text(
      `Page ${p + 1} of ${range.count}  •  PO Ref: ${poNo}  •  ARCL Purchase Order`,
      20,
      570,
      { width: 802, align: "center" }
    );
  }

  return buildPdfBuffer(doc);
};

/**
 * Official ARCL Laboratory Purchase Invoice & Expense Voucher PDF
 * Displays: Kya (Items & Specs), Kab (Purchase Date & Ref), Kaha Se (Vendor & Location), Paymante Moad (Split Installments & UTR)
 */
export const generatePurchaseInvoicePdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 15, bufferPages: true });

  const pur = customData.purchaseData || customData;
  const purchaseNo = pur.purchaseNo || "ARCL/PUR/26-27/01";
  const billNo = pur.billNo || "-";
  const purchaseDate = pur.purchaseDate
    ? (pur.purchaseDate instanceof Date ? pur.purchaseDate.toLocaleDateString("en-GB") : String(pur.purchaseDate).slice(0, 10))
    : new Date().toLocaleDateString("en-GB");
  const vendorName = pur.vendorName || "Borosil Scientific Ltd";
  const vendorLocation = pur.vendorLocation || "Andheri East, Mumbai, Maharashtra";
  const vendorGstin = pur.vendorGstin || "27AAACB2345M1Z1";
  const vendorPhone = pur.vendorPhone || "+91 9820123456";
  const vendorEmail = pur.vendorEmail || "sales@vendor.com";
  const category = pur.category || "Laboratory Equipment";

  const rawItems = Array.isArray(pur.items) && pur.items.length > 0 ? pur.items : [
    { itemName: "Laboratory Equipment & Standards", description: "Inward Metrological Equipment", qty: 1, unit: "NOS", rate: Number(pur.totalAmount || 5000), taxRate: 18, amount: Number(pur.totalAmount || 5900) }
  ];

  const formattedItems = rawItems.map((it, idx) => {
    const q = Number(it.qty) || 1;
    const r = Number(it.rate) || 0;
    const tr = Number(it.taxRate !== undefined ? it.taxRate : 18) || 0;
    const base = q * r;
    const tax = base * (tr / 100);
    return {
      slNo: idx + 1,
      itemName: String(it.itemName || it.name || `Item #${idx + 1}`).trim(),
      description: String(it.description || it.subText || "").trim(),
      category: String(it.category || category).trim(),
      qty: q,
      unit: String(it.unit || it.qtyUnit || "NOS").trim(),
      rate: r,
      taxRate: tr,
      amount: Math.round((base + tax) * 100) / 100,
      baseAmount: Math.round(base * 100) / 100,
    };
  });

  const subtotal = formattedItems.reduce((acc, it) => acc + it.baseAmount, 0);
  const taxAmount = formattedItems.reduce((acc, it) => acc + (it.amount - it.baseAmount), 0);
  const totalAmount = Number(pur.totalAmount) || Math.round((subtotal + taxAmount) * 100) / 100;

  // Payments / Installments Handling
  let payments = Array.isArray(pur.payments) && pur.payments.length > 0 ? pur.payments : [];
  if (payments.length === 0 && (Number(pur.paidAmount) > 0 || pur.paymentStatus === "Paid")) {
    payments = [
      {
        installmentNo: 1,
        amount: Number(pur.paidAmount) || totalAmount,
        paymentDate: pur.paymentDate || pur.purchaseDate || new Date(),
        paymentMode: pur.paymentMode || "UPI",
        transactionRef: pur.transactionRef || "-",
        notes: "Full / Advance Payment",
      },
    ];
  }

  const paidAmount = payments.length > 0
    ? payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
    : (Number(pur.paidAmount) || (pur.paymentStatus === "Paid" ? totalAmount : 0));
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const leftMargin = 25;
  const contentWidth = 545;

  // Header helper - exactly identical across Page 1, Page 2, Page 3, and all continuation pages
  const drawPurchaseInvoiceHeader = () => {
    let topY = 16;
    const logoWidth = 88;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, leftMargin, topY + 2, { width: logoWidth });
      } catch (e) {
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
      }
    } else {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", leftMargin, topY + 2);
    }

    const badgeW = 140;
    const badgeH = 54;
    const badgeX = leftMargin + contentWidth - badgeW;
    doc.rect(badgeX, topY + 2, badgeW, badgeH).fillColor("#047857").fill();
    doc.fontSize(14.5).font("Helvetica-Bold").fillColor("#ffffff").text("PURCHASE INVOICE", badgeX, topY + 8, { width: badgeW, align: "center" });
    doc.fontSize(7.5).font("Helvetica").fillColor("#ffffff").text("Laboratory Inward & Expense Voucher", badgeX, topY + 31, { width: badgeW, align: "center" });

    const headerTextX = leftMargin + logoWidth + 12;
    const headerTextW = badgeX - headerTextX - 6;

    let hCursorY = topY + 2;
    doc.fontSize(15.0).font("Helvetica-Bold").fillColor("#047857").text("ARCL INSTRUMENTS PRIVATE LIMITED", headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString("ARCL INSTRUMENTS PRIVATE LIMITED", { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica").fillColor("#334155");
    const compAddr = "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708";
    doc.text(compAddr, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compAddr, { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica-Bold").fillColor("#1e293b");
    const compGstinPhone = "GSTIN: 27AATCA7874C1ZB  |  Phone: +91 8369458583 / +91 6205691085";
    doc.text(compGstinPhone, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compGstinPhone, { width: headerTextW }) + 3.0;

    doc.fontSize(8.7).font("Helvetica").fillColor("#334155");
    const compWebEmail = "Email: arclinstruments@gmail.com  |  Website: www.arcl.in  |  Maharashtra, India";
    doc.text(compWebEmail, headerTextX, hCursorY, { width: headerTextW });
    hCursorY += doc.heightOfString(compWebEmail, { width: headerTextW }) + 5.0;

    const sepY = Math.max(hCursorY, topY + badgeH + 6, topY + 76);
    doc.moveTo(leftMargin, sepY).lineTo(leftMargin + contentWidth, sepY).lineWidth(2.0).strokeColor("#047857").stroke();
    return sepY;
  };

  const drawContinuationHeader = () => {
    const sepY = drawPurchaseInvoiceHeader();
    return sepY + 8;
  };

  // 1. Official Header (Enlarged, Clear & Prominent)
  const sepY = drawPurchaseInvoiceHeader();

  // 2. Vendor & Purchase Reference Box
  const boxY = sepY + 7;
  const boxH = 88;
  const splitX = leftMargin + 285;
  doc.rect(leftMargin, boxY, contentWidth, boxH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(splitX, boxY).lineTo(splitX, boxY + boxH).lineWidth(0.8).strokeColor("#000000").stroke();

  // Left: Vendor / Supplier Details (Kaha Se)
  doc.fontSize(9.0).font("Helvetica-Bold").fillColor("#047857").text("Vendor / Supplier (Kaha Se):", leftMargin + 8, boxY + 6);
  doc.fontSize(11.0).font("Helvetica-Bold").fillColor("#000000").text(vendorName, leftMargin + 8, boxY + 20, { width: 270 });
  doc.fontSize(8.0).font("Helvetica").fillColor("#334155").text(vendorLocation, leftMargin + 8, boxY + 36, { width: 270 });
  doc.text(`GSTIN: ${vendorGstin || "Unregistered"}  |  Phone: ${vendorPhone || "-"}`, leftMargin + 8, boxY + 52, { width: 270 });
  doc.text(`Email: ${vendorEmail || "-"}`, leftMargin + 8, boxY + 66, { width: 270 });

  // Right: Voucher & Bill Details (Kab)
  doc.fontSize(9.0).font("Helvetica-Bold").fillColor("#047857").text("Voucher & Purchase Details (Kab):", splitX + 8, boxY + 6);
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#000000").text("Purchase Ref #:", splitX + 8, boxY + 21);
  doc.font("Helvetica-Bold").fillColor("#047857").text(purchaseNo, splitX + 98, boxY + 21);

  doc.font("Helvetica-Bold").fillColor("#000000").text("Vendor Bill / Inv #:", splitX + 8, boxY + 37);
  doc.font("Helvetica").text(billNo, splitX + 98, boxY + 37);

  doc.font("Helvetica-Bold").text("Purchase Date:", splitX + 8, boxY + 53);
  doc.font("Helvetica").text(purchaseDate, splitX + 98, boxY + 53);

  doc.font("Helvetica-Bold").text("Primary Category:", splitX + 8, boxY + 68);
  doc.font("Helvetica").text(category, splitX + 98, boxY + 68);

  // 3. Items Table (Kya)
  let tableY = boxY + boxH + 8;
  const colX = {
    sl: leftMargin,
    desc: leftMargin + 20,
    cat: leftMargin + 20 + 235,
    qty: leftMargin + 20 + 235 + 80,
    unit: leftMargin + 20 + 235 + 80 + 35,
    rate: leftMargin + 20 + 235 + 80 + 35 + 30,
    tax: leftMargin + 20 + 235 + 80 + 35 + 30 + 50,
    amt: leftMargin + 20 + 235 + 80 + 35 + 30 + 50 + 35,
  };

  // Header row
  doc.rect(leftMargin, tableY, contentWidth, 16).fillColor("#047857").fill();
  doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#ffffff");
  doc.text("#", colX.sl + 2, tableY + 5, { width: 16, align: "center" });
  doc.text("Item Name & Detailed Description (Kya)", colX.desc + 4, tableY + 5, { width: 230 });
  doc.text("Category", colX.cat + 2, tableY + 5, { width: 76, align: "center" });
  doc.text("Qty", colX.qty, tableY + 5, { width: 35, align: "center" });
  doc.text("Unit", colX.unit, tableY + 5, { width: 30, align: "center" });
  doc.text("Rate (Rs)", colX.rate, tableY + 5, { width: 48, align: "right" });
  doc.text("GST %", colX.tax, tableY + 5, { width: 35, align: "center" });
  doc.text("Total (Rs)", colX.amt, tableY + 5, { width: 56, align: "right" });

  let curY = tableY + 16;
  doc.lineWidth(0.5).strokeColor("#000000");

  formattedItems.forEach((it) => {
    const rowH = it.description ? 20 : 14;
    doc.rect(leftMargin, curY, contentWidth, rowH).stroke();

    // Column dividers
    doc.moveTo(colX.desc, curY).lineTo(colX.desc, curY + rowH).stroke();
    doc.moveTo(colX.cat, curY).lineTo(colX.cat, curY + rowH).stroke();
    doc.moveTo(colX.qty, curY).lineTo(colX.qty, curY + rowH).stroke();
    doc.moveTo(colX.unit, curY).lineTo(colX.unit, curY + rowH).stroke();
    doc.moveTo(colX.rate, curY).lineTo(colX.rate, curY + rowH).stroke();
    doc.moveTo(colX.tax, curY).lineTo(colX.tax, curY + rowH).stroke();
    doc.moveTo(colX.amt, curY).lineTo(colX.amt, curY + rowH).stroke();

    doc.fontSize(5.5).font("Helvetica").fillColor("#000000");
    doc.text(String(it.slNo), colX.sl + 2, curY + 4, { width: 16, align: "center" });

    doc.font("Helvetica-Bold").text(it.itemName, colX.desc + 4, curY + 3, { width: 226 });
    if (it.description) {
      doc.font("Helvetica").fontSize(5).fillColor("#475569").text(it.description, colX.desc + 4, curY + 11, { width: 226 });
    }

    doc.font("Helvetica").fontSize(5.2).fillColor("#000000");
    doc.text(it.category, colX.cat + 2, curY + 4, { width: 76, align: "center" });
    doc.font("Helvetica-Bold").text(String(it.qty), colX.qty, curY + 4, { width: 35, align: "center" });
    doc.font("Helvetica").text(it.unit, colX.unit, curY + 4, { width: 30, align: "center" });
    doc.text(it.rate.toFixed(2), colX.rate, curY + 4, { width: 48, align: "right" });
    doc.text(`${it.taxRate}%`, colX.tax, curY + 4, { width: 35, align: "center" });
    doc.font("Helvetica-Bold").text(it.amount.toFixed(2), colX.amt, curY + 4, { width: 56, align: "right" });

    curY += rowH;
  });

  // 4. Totals Block
  const totalBoxH = 46;
  doc.rect(leftMargin, curY, contentWidth, totalBoxH).lineWidth(0.5).strokeColor("#000000").stroke();
  doc.moveTo(splitX, curY).lineTo(splitX, curY + totalBoxH).lineWidth(0.5).strokeColor("#000000").stroke();

  // Left: Total in words
  doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#000000").text("Amount Chargeable (in words):", leftMargin + 6, curY + 5);
  doc.fontSize(6).font("Helvetica-Bold").fillColor("#047857").text(`INR ${numberToWords(Math.round(totalAmount))} Only`, leftMargin + 6, curY + 15, { width: 270 });
  doc.fontSize(5).font("Helvetica").fillColor("#475569").text("Goods & equipment received in inspected condition with valid test calibration certificates.", leftMargin + 6, curY + 32, { width: 270 });

  // Right: Calculation
  doc.fontSize(5.5).font("Helvetica").fillColor("#000000");
  doc.text("Taxable Subtotal:", splitX + 6, curY + 5);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, splitX + 160, curY + 5, { width: 90, align: "right" });

  doc.text("GST Amount (CGST + SGST):", splitX + 6, curY + 16);
  doc.text(`Rs. ${taxAmount.toFixed(2)}`, splitX + 160, curY + 16, { width: 90, align: "right" });

  doc.moveTo(splitX, curY + 28).lineTo(leftMargin + contentWidth, curY + 28).stroke();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#047857");
  doc.text("Total Purchase Valuation:", splitX + 6, curY + 32);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, splitX + 140, curY + 32, { width: 110, align: "right" });

  curY += totalBoxH + 8;

  // 5. Payment & Multi-Installments Record Box (Paymante Moad & Split Breakdown)
  const payBoxH = Math.max(68, 22 + (payments.length * 13) + 20);
  doc.rect(leftMargin, curY, contentWidth, payBoxH).lineWidth(0.5).strokeColor("#000000").stroke();

  // Header of payment box
  doc.rect(leftMargin, curY, contentWidth, 14).fillColor("#ecfdf5").fill();
  doc.fontSize(6).font("Helvetica-Bold").fillColor("#047857").text(
    `PAYMANTE MOAD & INSTALLMENTS RECORD (SPLIT PAYMENT HISTORY — ${payments.length} INSTALLMENT${payments.length > 1 ? "S" : ""})`,
    leftMargin + 6,
    curY + 4
  );

  let pY = curY + 16;
  doc.fontSize(5).font("Helvetica-Bold").fillColor("#334155");
  doc.text("Installment", leftMargin + 8, pY);
  doc.text("Payment Date", leftMargin + 70, pY);
  doc.text("Payment Mode", leftMargin + 140, pY);
  doc.text("Transaction / UTR Reference #", leftMargin + 220, pY);
  doc.text("Installment Amount (Rs)", leftMargin + 400, pY, { width: 75, align: "right" });
  doc.text("Status", leftMargin + 490, pY, { width: 50, align: "center" });

  pY += 9;
  doc.moveTo(leftMargin, pY).lineTo(leftMargin + contentWidth, pY).lineWidth(0.3).strokeColor("#94a3b8").stroke();
  pY += 3;

  payments.forEach((p, pIdx) => {
    const pDate = p.paymentDate
      ? (p.paymentDate instanceof Date ? p.paymentDate.toLocaleDateString("en-GB") : String(p.paymentDate).slice(0, 10))
      : "-";
    const pAmt = Number(p.amount) || 0;
    doc.fontSize(5.2).font("Helvetica").fillColor("#000000");
    doc.text(`Installment #${p.installmentNo || pIdx + 1}`, leftMargin + 8, pY);
    doc.text(pDate, leftMargin + 70, pY);
    doc.font("Helvetica-Bold").text(p.paymentMode || "UPI", leftMargin + 140, pY);
    doc.font("Helvetica").text(p.transactionRef || "-", leftMargin + 220, pY, { width: 175 });
    doc.font("Helvetica-Bold").text(`Rs. ${pAmt.toFixed(2)}`, leftMargin + 400, pY, { width: 75, align: "right" });
    doc.fillColor("#047857").text("Cleared ✅", leftMargin + 490, pY, { width: 50, align: "center" });
    pY += 11;
  });

  doc.moveTo(leftMargin, pY).lineTo(leftMargin + contentWidth, pY).lineWidth(0.5).strokeColor("#000000").stroke();
  pY += 3;

  doc.fontSize(6).font("Helvetica-Bold").fillColor("#000000");
  doc.text(`Total Bill: Rs. ${totalAmount.toFixed(2)}`, leftMargin + 8, pY);
  doc.fillColor("#047857").text(`Total Paid: Rs. ${paidAmount.toFixed(2)}`, leftMargin + 170, pY);
  if (dueAmount > 0) {
    doc.fillColor("#b91c1c").text(`Remaining Due: Rs. ${dueAmount.toFixed(2)} (PARTIAL)`, leftMargin + 320, pY);
  } else {
    doc.fillColor("#047857").text("100% Fully Paid & Settled ✅", leftMargin + 320, pY);
  }

  curY += payBoxH + 8;

  // 6. Signatory & Inspection Verification Block
  const sigBoxH = 50;
  doc.rect(leftMargin, curY, contentWidth, sigBoxH).lineWidth(0.5).strokeColor("#000000").stroke();
  doc.moveTo(splitX, curY).lineTo(splitX, curY + sigBoxH).lineWidth(0.5).strokeColor("#000000").stroke();

  doc.fontSize(5.5).font("Helvetica-Bold").fillColor("#000000").text("Inward Verification & Inspection:", leftMargin + 6, curY + 6);
  doc.fontSize(5.2).font("Helvetica").fillColor("#475569");
  doc.text("Received & Checked by Quality & Calibration Department.", leftMargin + 6, curY + 16);
  doc.text("ARCL Airoli Metrology Lab - Equipment Inward Desk", leftMargin + 6, curY + 26);
  doc.text("Authorized Inward Inspector Sign", leftMargin + 6, curY + 38);

  doc.fontSize(6).font("Helvetica-Bold").fillColor("#000000").text("For ARCL INSTRUMENTS PRIVATE LIMITED", splitX + 6, curY + 6);
  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, splitX + 160, curY + 12, { width: 65 });
    } catch (e) {}
  }
  doc.fontSize(5.5).font("Helvetica-Bold").text("Authorized Signatory", splitX + 6, curY + 38);

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    doc.fontSize(5.5).font("Helvetica").fillColor("#64748b").text(
      `Page ${p + 1} of ${range.count}  •  Voucher Ref: ${purchaseNo}  •  Official ARCL Laboratory Inward Expense Voucher`,
      leftMargin,
      820,
      { width: contentWidth, align: "center" }
    );
  }

  return buildPdfBuffer(doc);
};

/**
 * Universal Dispatcher: Generate PDF buffer for any document type
 */
export const generateDocumentPdf = async (docType = "certificate", data = {}) => {
  switch (docType) {
    case "quotation":
      return generateQuotationPdf(data);
    case "tax_invoice":
    case "invoice":
      return generateTaxInvoicePdf(data);
    case "pi":
    case "proforma_invoice":
      return generateProformaInvoicePdf(data);
    case "po":
    case "purchase_order":
      return generatePurchaseOrderPdf(data);
    case "purchase_invoice":
    case "purchase":
      return generatePurchaseInvoicePdf(data);
    case "recordExcel":
    case "readings":
    case "observation":
    case "observation_sheet":
      return generateObservationSheetPdf(data);
    case "srf":
      return generateSrfSlipPdf(data);
    case "certificate":
    default:
      return generateCalibrationCertificatePdf(data);
  }
};
