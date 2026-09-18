import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../../public/assets/LOGO.png");
const QR_IMAGE_PATH = path.resolve(__dirname, "../../public/assets/hdfc_qr.png");
const STAMP_IMAGE_PATH = path.resolve(__dirname, "../../public/assets/arcl_stamp.png");

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
 * Buffer Builder
 */
const buildPdfBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));
    doc.end();
  });
};

/**
 * Common Header for Technical Calibration Documents
 */
const drawOfficialHeader = (doc, title = "Official Document", accentColor = "#b91c1c") => {
  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, 35, 22, { width: 75 });
    } catch (e) {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 35, 22);
    }
  } else {
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 35, 22);
  }

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#021C57")
    .text("ARCL INSTRUMENTS PRIVATE LIMITED", 115, 22);

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor("#059669")
    .text("NABL ACCREDITED CALIBRATION LABORATORY (CC-4313) | ISO/IEC 17025:2017", 115, 38);

  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor("#475569")
    .text(
      "Shop No. 6, Siddivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708 | Phone: +91 8369458583 / +91 6205691085 | Email: arclinstruments@gmail.com",
      115,
      50,
      { width: 445 }
    );

  doc.moveTo(35, 76).lineTo(560, 76).lineWidth(1).strokeColor("#cbd5e1").stroke();

  doc
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .fillColor(accentColor)
    .text(title.toUpperCase(), 35, 82, { align: "center", width: 525 });

  doc.moveTo(35, 96).lineTo(560, 96).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
  return 104;
};

/**
 * Common Footer for Technical Calibration Documents
 */
const drawOfficialFooter = (doc, customY = null) => {
  const y = customY !== null ? customY : 725;
  doc.moveTo(35, y).lineTo(560, y).lineWidth(0.8).strokeColor("#cbd5e1").stroke();

  doc.rect(40, y + 6, 120, 38).lineWidth(0.8).strokeColor("#021C57").stroke();
  doc
    .fontSize(6.5)
    .font("Helvetica-Bold")
    .fillColor("#021C57")
    .text("NABL CC-4313", 45, y + 10, { width: 110, align: "center" })
    .fillColor("#059669")
    .text("DIGITALLY VERIFIED", 45, y + 19, { width: 110, align: "center" })
    .fillColor("#64748b")
    .text("ISO/IEC 17025 SEAL", 45, y + 28, { width: 110, align: "center" });

  doc
    .fontSize(6.5)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(
      "This is an authentic computer-generated metrological document issued under the authority of ARCL Instruments Calibration Division. Verified authentic as per NABL guidelines.",
      175,
      y + 12,
      { width: 220, align: "center" }
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
    .text("Quality Manager, ARCL Metrology", 420, y + 48, { width: 130, align: "center" });
};

/**
 * =========================================================================
 * 1. DYNAMIC AUTO-SPACED & PAGINATED OFFICIAL ARCL TAX INVOICE PDF
 * =========================================================================
 */
export const generateTaxInvoicePdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const inv = customData.taxInvoiceData || customData;
  const invoiceNo = inv.invoiceNo || "ARCL/26-27/74";
  const invoiceDate = inv.invoiceDate
    ? (inv.invoiceDate instanceof Date ? inv.invoiceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(inv.invoiceDate))
    : "22 Jun 2026";
  const dueDate = inv.dueDate
    ? (inv.dueDate instanceof Date ? inv.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(inv.dueDate))
    : "23 Jun 2026";
  const placeOfSupply = inv.placeOfSupply || "27-MAHARASHTRA";

  const clientCompany = inv.clientCompany || inv.billTo?.companyName || "RDSS QUALITY CONTROL LAB PRIVATE LIMITED";
  const clientGstin = inv.clientGstin || inv.billTo?.gstin || "27AAOCR3275P1ZH";
  const clientAddress = inv.clientAddress || (inv.billTo?.address ? `${inv.billTo.address}\n${inv.billTo.cityStatePin || ""}`.trim() : "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath\nThane, MAHARASHTRA, 421503");

  let items = inv.items && Array.isArray(inv.items) && inv.items.length > 0 ? inv.items : defaultTaxInvoiceItems;

  const formattedItems = items.map((it, idx) => ({
    itemNo: it.itemNo || idx + 1,
    name: it.name || it.description || `Calibration Service ${idx + 1}`,
    subText: it.subText || it.remarks || "",
    hsnSac: String(it.hsnSac || it.hsnCode || "998346"),
    taxRate: String(it.taxRate || it.gstRate || "18%"),
    qty: Number(it.qty || 1),
    qtyUnit: it.qtyUnit || it.uom || "NOS",
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

  // Bank & UPI QR Code (Generated from .env / Account details)
  const bankName = (inv.bankName || process.env.BANK_NAME || "HDFC Bank").trim();
  const accountNo = (inv.accountNo || process.env.BANK_ACCOUNT_NO || "50200111763991").trim();
  const branchName = (inv.bankBranch || process.env.BANK_BRANCH || "Kandivali East - Thakur Village").trim();
  const ifscCode = (inv.ifscCode || process.env.BANK_IFSC || "HDFC0000582").trim();
  const payeeName = (process.env.UPI_PAYEE_NAME || inv.payeeName || "ARCL INSTRUMENTS PRIVATE LIMITED").trim();
  const upiId = (process.env.UPI_ID || inv.upiId || "8572995533.2@hdfc").trim();

  let qrBuffer = null;
  if (fs.existsSync(QR_IMAGE_PATH)) {
    try {
      qrBuffer = fs.readFileSync(QR_IMAGE_PATH);
    } catch (e) {
      qrBuffer = null;
    }
  }

  // Auto-Spacing calculation
  const isSinglePage = formattedItems.length <= 8;
  const rowH = isSinglePage
    ? Math.max(24, Math.min(38, Math.floor(260 / Math.max(1, formattedItems.length))))
    : 22;

  // Draw Full Header for Page 1
  const drawFullTaxHeader = (doc) => {
    let topY = 25;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, 30, topY, { width: 75 });
      } catch (e) {
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 30, topY);
      }
    } else {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 30, topY);
    }

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#021C57").text("ARCL INSTRUMENTS PRIVATE LIMITED", 110, topY);
    doc.fontSize(6.5).font("Helvetica").fillColor("#334155");
    doc.text("Shop No. 6, Siddivinayak Park CHS, Sector 8A,", 110, topY + 14);
    doc.text("Airoli, Navi Mumbai, Maharashtra - 400708", 110, topY + 23);
    doc.text("GSTIN: 27AATCA7874C1ZB | Phone: +91 8369458583 / +91 6205691085 | Email: arclinstruments@gmail.com", 110, topY + 32);

    doc.rect(430, topY, 135, 38).fillColor("#021C57").fill();
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#ffffff").text("TAX INVOICE", 430, topY + 6, { width: 135, align: "center" });
    doc.fontSize(6).font("Helvetica").text("Original for Recipient", 430, topY + 22, { width: 135, align: "center" });

    doc.moveTo(30, topY + 48).lineTo(565, topY + 48).lineWidth(1).strokeColor("#021C57").stroke();

    const boxY = topY + 54;
    const boxH = 58;
    doc.rect(30, boxY, 535, boxH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(290, boxY).lineTo(290, boxY + boxH).lineWidth(0.5).strokeColor("#000000").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#000000").text("Billed To (Customer):", 36, boxY + 5);
    doc.font("Helvetica-Bold").text(clientCompany, 36, boxY + 15, { width: 245 });
    doc.font("Helvetica").fontSize(6).fillColor("#334155").text(clientAddress, 36, boxY + 25, { width: 245, lineGap: 1 });
    doc.font("Helvetica-Bold").fillColor("#000000").text(`GSTIN: ${clientGstin}`, 36, boxY + 46);

    doc.fontSize(6.5).font("Helvetica-Bold").text("Invoice Details:", 296, boxY + 5);
    doc.font("Helvetica").fontSize(6.5);
    doc.text("Invoice No.:", 296, boxY + 16);
    doc.font("Helvetica-Bold").text(invoiceNo, 365, boxY + 16);
    doc.text("Invoice Date:", 296, boxY + 27);
    doc.text(invoiceDate, 365, boxY + 27);
    doc.text("Due Date:", 296, boxY + 38);
    doc.text(dueDate, 365, boxY + 38);
    doc.text("Place of Supply:", 296, boxY + 48);
    doc.text(placeOfSupply, 365, boxY + 48);

    return boxY + boxH;
  };

  // Draw Compact Header for Continuation Pages
  const drawCompactTaxHeader = (doc) => {
    let topY = 25;
    doc.rect(30, topY, 535, 24).fillColor("#021C57").fill();
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff").text(`ARCL INSTRUMENTS - TAX INVOICE (${invoiceNo})`, 36, topY + 7);
    doc.fontSize(7.5).font("Helvetica").text(`Date: ${invoiceDate}  |  Place of Supply: ${placeOfSupply}`, 320, topY + 8, { width: 235, align: "right" });
    return topY + 28;
  };

  // Draw Table Columns Header
  const drawTaxTableHeader = (doc, startY) => {
    const thH = 18;
    doc.rect(30, startY, 535, thH).fillColor("#021C57").fill();
    doc.moveTo(48, startY).lineTo(48, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(275, startY).lineTo(275, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(330, startY).lineTo(330, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(390, startY).lineTo(390, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(460, startY).lineTo(460, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("#", 30, startY + 5, { width: 18, align: "center" });
    doc.text("Description of Services / Calibration Scope", 52, startY + 5);
    doc.text("HSN/SAC", 275, startY + 5, { width: 55, align: "center" });
    doc.text("Qty", 330, startY + 5, { width: 60, align: "center" });
    doc.text("Rate (INR)", 390, startY + 5, { width: 70, align: "right" });
    doc.text("Amount (INR)", 460, startY + 5, { width: 100, align: "right" });

    return startY + thH;
  };

  // Draw Summary, HSN Tax Breakdown & Bank Details Block
  const drawTaxInvoiceSummaryBlock = (doc, startY) => {
    let cur = startY;

    // 1. Total & Words Box
    const sumH = 48;
    doc.rect(30, cur, 535, sumH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(390, cur).lineTo(390, cur + sumH).lineWidth(0.5).strokeColor("#000000").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#000000").text("Total in Words:", 36, cur + 5);
    doc.font("Helvetica").fontSize(6.5).text(numberToWords(totalAmount.toFixed(2)), 36, cur + 15, { width: 345 });

    doc.font("Helvetica").fontSize(6.5);
    doc.text("Taxable Amount:", 395, cur + 5);
    doc.text(taxableAmount.toFixed(2), 485, cur + 5, { width: 75, align: "right" });
    doc.text("Total GST Amount:", 395, cur + 15);
    doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), 485, cur + 15, { width: 75, align: "right" });
    doc.font("Helvetica-Bold").text("Grand Total (INR):", 395, cur + 30);
    doc.text(totalAmount.toFixed(2), 485, cur + 30, { width: 75, align: "right" });

    cur += sumH;

    // 2. HSN Table
    const hsnH = 42;
    doc.rect(30, cur, 535, hsnH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.rect(30, cur, 535, 14).fillColor("#f1f5f9").fill();

    doc.fontSize(6).font("Helvetica-Bold").fillColor("#000000");
    doc.text("HSN/SAC", 35, cur + 4);
    doc.text("Taxable Value", 145, cur + 4, { width: 80, align: "right" });
    doc.text("CGST Rate", 232, cur + 4, { width: 55, align: "center" });
    doc.text("CGST Amt", 292, cur + 4, { width: 55, align: "right" });
    doc.text("SGST Rate", 352, cur + 4, { width: 55, align: "center" });
    doc.text("SGST Amt", 412, cur + 4, { width: 55, align: "right" });
    doc.text("Total Tax Amt", 475, cur + 4, { width: 85, align: "right" });

    doc.font("Helvetica").fontSize(6);
    doc.text("998346", 35, cur + 18);
    doc.text(taxableAmount.toFixed(2), 145, cur + 18, { width: 80, align: "right" });
    doc.text(`${cgstRate.toFixed(1)}%`, 232, cur + 18, { width: 55, align: "center" });
    doc.text(cgstAmount.toFixed(2), 292, cur + 18, { width: 55, align: "right" });
    doc.text(`${sgstRate.toFixed(1)}%`, 352, cur + 18, { width: 55, align: "center" });
    doc.text(sgstAmount.toFixed(2), 412, cur + 18, { width: 55, align: "right" });
    doc.text((cgstAmount + sgstAmount).toFixed(2), 475, cur + 18, { width: 85, align: "right" });

    cur += hsnH;

    // 3. Bank Details, Terms & Signatures
    const botH = 135;
    doc.rect(30, cur, 535, botH).lineWidth(0.8).strokeColor("#000000").stroke();
    doc.moveTo(270, cur).lineTo(270, cur + botH).lineWidth(0.8).strokeColor("#000000").stroke();

    doc.fontSize(7).font("Helvetica-Bold").fillColor("#000000").text("Bank Details:", 36, cur + 6);
    doc.font("Helvetica").fontSize(6.5);
    doc.text(`Bank Name: ${bankName}`, 36, cur + 18);
    doc.text(`A/C No: ${accountNo}`, 36, cur + 29);
    doc.text(`Branch: ${branchName}`, 36, cur + 40);
    doc.text(`IFSC Code: ${ifscCode}`, 36, cur + 51);

    if (qrBuffer) {
      doc.image(qrBuffer, 175, cur + 8, { width: 68 });
      doc.fontSize(6).font("Helvetica-Bold").text("Scan to Pay UPI", 175, cur + 80, { width: 68, align: "center" });
    }

    doc.fontSize(7).font("Helvetica-Bold").text("Terms & Conditions:", 276, cur + 6);
    doc.font("Helvetica").fontSize(6);
    doc.text("1. Calibration reports will be issued as per ISO/IEC 17025 norms.", 276, cur + 18, { width: 280 });
    doc.text("2. Interest @ 18% p.a. will be charged if payment is delayed.", 276, cur + 28, { width: 280 });
    doc.text("3. Subject to Mumbai Jurisdiction.", 276, cur + 38, { width: 280 });

    doc.fontSize(7).font("Helvetica-Bold").text("For ARCL INSTRUMENTS PRIVATE LIMITED", 276, cur + 68, { width: 280, align: "right" });
    
    if (fs.existsSync(STAMP_IMAGE_PATH)) {
      try {
        doc.image(STAMP_IMAGE_PATH, 455, cur + 72, { width: 85 });
      } catch (e) {}
    } else {
      const stampX = 500;
      const stampY = cur + 105;
      doc.save();
      doc.circle(stampX, stampY, 20).lineWidth(1).strokeColor("#1e3a8a").stroke();
      doc.circle(stampX, stampY, 17).lineWidth(0.5).strokeColor("#1e3a8a").stroke();
      doc.fontSize(4).font("Helvetica-Bold").fillColor("#1e3a8a").text("ARCL INSTRUMENTS", stampX - 18, stampY - 6, { width: 36, align: "center" });
      doc.restore();
    }

    doc.fontSize(6.5).font("Helvetica").fillColor("#000000").text("Authorized Signatory", 276, cur + 120, { width: 280, align: "right" });
    return cur + botH;
  };

  // Execution Flow
  let curY = drawFullTaxHeader(doc);
  curY = drawTaxTableHeader(doc, curY);

  for (let i = 0; i < formattedItems.length; i++) {
    const it = formattedItems[i];
    const itemH = it.subText && it.subText.includes("\n") ? rowH + 8 : rowH;

    if (curY + itemH > 750) {
      doc.addPage({ size: "A4", margin: 25 });
      curY = drawCompactTaxHeader(doc);
      curY = drawTaxTableHeader(doc, curY);
    }

    doc.rect(30, curY, 535, itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(48, curY).lineTo(48, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(275, curY).lineTo(275, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(330, curY).lineTo(330, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(390, curY).lineTo(390, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(460, curY).lineTo(460, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();

    const textYOffset = (itemH / 2) - 4;
    doc.fontSize(6.5).font("Helvetica").fillColor("#000000");
    doc.text(String(it.itemNo), 30, curY + textYOffset, { width: 18, align: "center" });

    doc.font("Helvetica-Bold").text(it.name, 52, curY + 3, { width: 220 });
    if (it.subText) {
      doc.font("Helvetica").fontSize(5.5).fillColor("#475569").text(it.subText, 52, curY + 12, { width: 220, lineGap: 1 });
    }
    doc.fontSize(6.5).font("Helvetica").fillColor("#000000");
    doc.text(it.hsnSac, 275, curY + textYOffset, { width: 55, align: "center" });
    doc.text(`${it.qty} ${it.qtyUnit}`, 330, curY + textYOffset, { width: 60, align: "center" });
    doc.text(it.rate.toFixed(2), 390, curY + textYOffset, { width: 65, align: "right" });
    doc.text(it.amount.toFixed(2), 460, curY + textYOffset, { width: 100, align: "right" });

    curY += itemH;
  }

  // Check if complete summary fits on current page (requires ~235 pt)
  if (curY + 235 > 775) {
    doc.addPage({ size: "A4", margin: 25 });
    curY = drawCompactTaxHeader(doc);
  }

  drawTaxInvoiceSummaryBlock(doc, curY);

  // Dynamic Footer on all pages with Page X of Y
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    const footerText = `Page ${p + 1} of ${range.count}  •  ${invoiceNo}  •  Digitally Authenticated Tax Invoice`;
    doc.fontSize(7).font("Helvetica").fillColor("#475569").text(footerText, 30, 805, { width: 535, align: "center" });
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 2. DYNAMIC AUTO-SPACED OFFICIAL ARCL QUOTATION PDF
 * =========================================================================
 */
export const generateQuotationPdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const qtn = customData.quotationData || customData;
  const qtnNo = qtn.quotationNo || "ARCL/QTN/26-27/47";
  const qtnDate = qtn.quotationDate
    ? (qtn.quotationDate instanceof Date ? qtn.quotationDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(qtn.quotationDate))
    : "22 Apr 2026";
  const validityDate = qtn.validityDate
    ? (qtn.validityDate instanceof Date ? qtn.validityDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : String(qtn.validityDate))
    : "29 Apr 2026";
  const placeOfSupply = qtn.placeOfSupply || "27-MAHARASHTRA";

  const clientCompany = qtn.billTo?.companyName || qtn.clientCompany || "RDSS QUALITY CONTROL LAB PRIVATE LIMITED";
  const clientGstin = qtn.billTo?.gstin || qtn.clientGstin || "27AAOCR3275P1ZH";
  const clientAddress = qtn.billTo?.address
    ? (qtn.billTo.cityStatePin ? `${qtn.billTo.address}\n${qtn.billTo.cityStatePin}` : qtn.billTo.address)
    : (qtn.clientAddress || "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath\nThane, MAHARASHTRA, 421503");

  let rawItems = qtn.items && Array.isArray(qtn.items) && qtn.items.length > 0 ? qtn.items : defaultQuotationItems;

  const formattedItems = rawItems.map((it, idx) => ({
    itemNo: it.itemNo || idx + 1,
    name: it.name || it.description || `Calibration Item ${idx + 1}`,
    subText: it.subText || it.remarks || "",
    hsnSac: String(it.hsnSac || it.hsnCode || "998346"),
    qty: `${it.qty || 1} ${it.qtyUnit || "NOS"}`,
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

  // Bank & UPI QR Code (Generated from .env / Account details)
  const bankName = (qtn.bankName || process.env.BANK_NAME || "HDFC Bank").trim();
  const accountNo = (qtn.accountNo || process.env.BANK_ACCOUNT_NO || "50200111763991").trim();
  const branchName = (qtn.bankBranch || process.env.BANK_BRANCH || "Kandivali East - Thakur Village").trim();
  const ifscCode = (qtn.ifscCode || process.env.BANK_IFSC || "HDFC0000582").trim();
  const payeeName = (process.env.UPI_PAYEE_NAME || qtn.payeeName || "ARCL INSTRUMENTS PRIVATE LIMITED").trim();
  const upiId = (process.env.UPI_ID || qtn.upiId || "8572995533.2@hdfc").trim();

  let qrBuffer = null;
  if (fs.existsSync(QR_IMAGE_PATH)) {
    try {
      qrBuffer = fs.readFileSync(QR_IMAGE_PATH);
    } catch (e) {
      qrBuffer = null;
    }
  }

  const isSinglePage = formattedItems.length <= 8;
  const rowH = isSinglePage
    ? Math.max(24, Math.min(38, Math.floor(260 / Math.max(1, formattedItems.length))))
    : 22;

  const drawPageHeader = (doc) => {
    let topY = 25;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, 30, topY, { width: 75 });
      } catch (e) {
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 30, topY);
      }
    } else {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 30, topY);
    }

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#2563EB").text("ARCL INSTRUMENTS PRIVATE LIMITED", 110, topY);
    doc.fontSize(6.5).font("Helvetica").fillColor("#334155");
    doc.text("Shop No. 6, Siddivinayak Park CHS, Sector 8A,", 110, topY + 14);
    doc.text("Airoli, Navi Mumbai, Maharashtra - 400708", 110, topY + 23);
    doc.text("GSTIN: 27AATCA7874C1ZB | Phone: +91 8369458583 / +91 6205691085 | Email: arclinstruments@gmail.com", 110, topY + 32);

    doc.rect(430, topY, 135, 38).fillColor("#2563EB").fill();
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#ffffff").text("QUOTATION", 430, topY + 6, { width: 135, align: "center" });
    doc.fontSize(6).font("Helvetica").text("Official Metrological Estimate", 430, topY + 22, { width: 135, align: "center" });

    doc.moveTo(30, topY + 48).lineTo(565, topY + 48).lineWidth(1).strokeColor("#2563EB").stroke();

    const boxY = topY + 54;
    const boxH = 58;
    doc.rect(30, boxY, 535, boxH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(290, boxY).lineTo(290, boxY + boxH).lineWidth(0.5).strokeColor("#000000").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#000000").text("Quotation To (Customer):", 36, boxY + 5);
    doc.font("Helvetica-Bold").text(clientCompany, 36, boxY + 15, { width: 245 });
    doc.font("Helvetica").fontSize(6).fillColor("#334155").text(clientAddress, 36, boxY + 25, { width: 245, lineGap: 1 });
    doc.font("Helvetica-Bold").fillColor("#000000").text(`GSTIN: ${clientGstin}`, 36, boxY + 46);

    doc.fontSize(6.5).font("Helvetica-Bold").text("Quotation Details:", 296, boxY + 5);
    doc.font("Helvetica").fontSize(6.5);
    doc.text("Quotation No.:", 296, boxY + 16);
    doc.font("Helvetica-Bold").text(qtnNo, 365, boxY + 16);
    doc.text("Date:", 296, boxY + 27);
    doc.text(qtnDate, 365, boxY + 27);
    doc.text("Valid Till:", 296, boxY + 38);
    doc.text(validityDate, 365, boxY + 38);
    doc.text("Place of Supply:", 296, boxY + 48);
    doc.text(placeOfSupply, 365, boxY + 48);

    return boxY + boxH;
  };

  const drawCompactQtnHeader = (doc) => {
    let topY = 25;
    doc.rect(30, topY, 535, 24).fillColor("#2563EB").fill();
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff").text(`ARCL INSTRUMENTS - QUOTATION (${qtnNo})`, 36, topY + 7);
    doc.fontSize(7.5).font("Helvetica").text(`Date: ${qtnDate}  |  Place of Supply: ${placeOfSupply}`, 320, topY + 8, { width: 235, align: "right" });
    return topY + 28;
  };

  const drawTableHeader = (doc, startY) => {
    const thH = 18;
    doc.rect(30, startY, 535, thH).fillColor("#2563EB").fill();
    doc.moveTo(48, startY).lineTo(48, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(275, startY).lineTo(275, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(330, startY).lineTo(330, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(390, startY).lineTo(390, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(460, startY).lineTo(460, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("#", 30, startY + 5, { width: 18, align: "center" });
    doc.text("Item & Calibration Scope", 52, startY + 5);
    doc.text("HSN/SAC", 275, startY + 5, { width: 55, align: "center" });
    doc.text("Qty", 330, startY + 5, { width: 60, align: "center" });
    doc.text("Rate (INR)", 390, startY + 5, { width: 70, align: "right" });
    doc.text("Amount (INR)", 460, startY + 5, { width: 100, align: "right" });

    return startY + thH;
  };

  const drawQuotationSummary = (doc, curY) => {
    let sumY = curY;
    const sumH = 48;
    doc.rect(30, sumY, 535, sumH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(390, sumY).lineTo(390, sumY + sumH).lineWidth(0.5).strokeColor("#000000").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#000000").text("Total in Words:", 36, sumY + 5);
    doc.font("Helvetica").fontSize(6.5).text(numberToWords(totalAmount.toFixed(2)), 36, sumY + 15, { width: 345 });

    doc.font("Helvetica").fontSize(6.5);
    doc.text("Taxable Amount:", 395, sumY + 5);
    doc.text(taxableAmount.toFixed(2), 485, sumY + 5, { width: 75, align: "right" });
    doc.text("Total Tax (GST):", 395, sumY + 15);
    doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), 485, sumY + 15, { width: 75, align: "right" });
    doc.font("Helvetica-Bold").text("Grand Total (INR):", 395, sumY + 30);
    doc.text(totalAmount.toFixed(2), 485, sumY + 30, { width: 75, align: "right" });

    let nextY = sumY + sumH;
    const hsnY = nextY;
    const hsnH = 42;
    doc.rect(30, hsnY, 535, hsnH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.rect(30, hsnY, 535, 14).fillColor("#f1f5f9").fill();

    doc.fontSize(6).font("Helvetica-Bold").fillColor("#000000");
    doc.text("HSN/SAC", 35, hsnY + 4);
    doc.text("Taxable Value", 145, hsnY + 4, { width: 80, align: "right" });
    doc.text("CGST Rate", 232, hsnY + 4, { width: 55, align: "center" });
    doc.text("CGST Amt", 292, hsnY + 4, { width: 55, align: "right" });
    doc.text("SGST Rate", 352, hsnY + 4, { width: 55, align: "center" });
    doc.text("SGST Amt", 412, hsnY + 4, { width: 55, align: "right" });
    doc.text("Total Tax Amt", 475, hsnY + 4, { width: 85, align: "right" });

    doc.font("Helvetica").fontSize(6);
    doc.text("998346", 35, hsnY + 18);
    doc.text(taxableAmount.toFixed(2), 145, hsnY + 18, { width: 80, align: "right" });
    doc.text(`${cgstRate.toFixed(1)}%`, 232, hsnY + 18, { width: 55, align: "center" });
    doc.text(cgstAmount.toFixed(2), 292, hsnY + 18, { width: 55, align: "right" });
    doc.text(`${sgstRate.toFixed(1)}%`, 352, hsnY + 18, { width: 55, align: "center" });
    doc.text(sgstAmount.toFixed(2), 412, hsnY + 18, { width: 55, align: "right" });
    doc.text((cgstAmount + sgstAmount).toFixed(2), 475, hsnY + 18, { width: 85, align: "right" });

    nextY = hsnY + hsnH;

    const botY = nextY;
    const botH = 135;
    doc.rect(30, botY, 535, botH).lineWidth(0.8).strokeColor("#000000").stroke();
    doc.moveTo(270, botY).lineTo(270, botY + botH).lineWidth(0.8).strokeColor("#000000").stroke();

    doc.fontSize(7).font("Helvetica-Bold").text("Bank Details:", 36, botY + 6);
    doc.font("Helvetica").fontSize(6.5);
    doc.text(`Bank Name: ${bankName}`, 36, botY + 18);
    doc.text(`A/C No: ${accountNo}`, 36, botY + 29);
    doc.text(`Branch: ${branchName}`, 36, botY + 40);
    doc.text(`IFSC Code: ${ifscCode}`, 36, botY + 51);

    if (qrBuffer) {
      doc.image(qrBuffer, 175, botY + 8, { width: 68 });
      doc.fontSize(6).font("Helvetica-Bold").text("Scan to Pay UPI", 175, botY + 80, { width: 68, align: "center" });
    }

    doc.fontSize(7).font("Helvetica-Bold").text("Terms & Conditions:", 276, botY + 6);
    doc.font("Helvetica").fontSize(6);
    doc.text("1. Payment: 100% advance along with PO.", 276, botY + 18, { width: 280 });
    doc.text("2. Calibration reports will be issued as per ISO/IEC 17025 norms.", 276, botY + 28, { width: 280 });
    doc.text("3. Validity: 30 days from the date of quotation.", 276, botY + 38, { width: 280 });
    doc.text("4. Subject to Mumbai Jurisdiction.", 276, botY + 48, { width: 280 });

    doc.fontSize(7).font("Helvetica-Bold").text("For ARCL INSTRUMENTS PRIVATE LIMITED", 276, botY + 68, { width: 280, align: "right" });
    
    if (fs.existsSync(STAMP_IMAGE_PATH)) {
      try {
        doc.image(STAMP_IMAGE_PATH, 455, botY + 72, { width: 85 });
      } catch (e) {}
    } else {
      const stampX = 500;
      const stampY = botY + 105;
      doc.save();
      doc.circle(stampX, stampY, 20).lineWidth(1).strokeColor("#1e3a8a").stroke();
      doc.circle(stampX, stampY, 17).lineWidth(0.5).strokeColor("#1e3a8a").stroke();
      doc.fontSize(4).font("Helvetica-Bold").fillColor("#1e3a8a").text("ARCL INSTRUMENTS", stampX - 18, stampY - 6, { width: 36, align: "center" });
      doc.restore();
    }

    doc.fontSize(6.5).font("Helvetica").fillColor("#000000").text("Authorized Signatory", 276, botY + 120, { width: 280, align: "right" });
    return botY + botH;
  };

  let curY = drawPageHeader(doc);
  curY = drawTableHeader(doc, curY);

  for (let i = 0; i < formattedItems.length; i++) {
    const it = formattedItems[i];
    const itemH = it.subText && it.subText.includes("\n") ? rowH + 8 : rowH;

    if (curY + itemH > 750) {
      doc.addPage({ size: "A4", margin: 25 });
      curY = drawCompactQtnHeader(doc);
      curY = drawTableHeader(doc, curY);
    }

    doc.rect(30, curY, 535, itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(48, curY).lineTo(48, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(275, curY).lineTo(275, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(330, curY).lineTo(330, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(390, curY).lineTo(390, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(460, curY).lineTo(460, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();

    const textYOffset = (itemH / 2) - 4;
    doc.fontSize(6.5).font("Helvetica").fillColor("#000000");
    doc.text(String(it.itemNo), 30, curY + textYOffset, { width: 18, align: "center" });
    doc.font("Helvetica-Bold").text(it.name, 52, curY + 3, { width: 220 });
    if (it.subText) {
      doc.font("Helvetica").fontSize(5.5).fillColor("#475569").text(it.subText, 52, curY + 12, { width: 220, lineGap: 1 });
    }
    doc.fontSize(6.5).font("Helvetica").fillColor("#000000");
    doc.text(it.hsnSac, 275, curY + textYOffset, { width: 55, align: "center" });
    doc.text(it.qty, 330, curY + textYOffset, { width: 60, align: "center" });
    doc.text(it.rate, 390, curY + textYOffset, { width: 65, align: "right" });
    doc.text(it.amount, 460, curY + textYOffset, { width: 100, align: "right" });

    curY += itemH;
  }

  if (curY + 235 > 775) {
    doc.addPage({ size: "A4", margin: 25 });
    curY = drawCompactQtnHeader(doc);
  }
  drawQuotationSummary(doc, curY);

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    const footerText = `Page ${p + 1} of ${range.count}  •  ${qtnNo}  •  Digitally Signed Quotation`;
    doc.fontSize(7).font("Helvetica").fillColor("#475569").text(footerText, 30, 805, { width: 535, align: "center" });
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 3. DYNAMIC AUTO-SPACED PROFORMA INVOICE PDF
 * =========================================================================
 */
export const generateProformaInvoicePdf = async (customData = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const pi = customData.proformaData || customData;
  const piNo = pi.piNo || pi.proformaNo || "ARCL/PI/26-27/08";
  const piDate = pi.piDate || pi.proformaDate || "22 Jun 2026";
  const dueDate = pi.dueDate || "23 Jun 2026";
  const placeOfSupply = pi.placeOfSupply || "27-MAHARASHTRA";

  const clientCompany = pi.clientCompany || pi.buyerCompany || pi.billTo?.companyName || "RDSS QUALITY CONTROL LAB PRIVATE LIMITED";
  const clientGstin = pi.clientGstin || pi.buyerGstin || pi.billTo?.gstin || "27AAOCR3275P1ZH";
  const clientAddress = pi.clientAddress || pi.buyerAddress || (pi.billTo?.address ? `${pi.billTo.address}\n${pi.billTo.cityStatePin || ""}`.trim() : "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath\nThane, MAHARASHTRA, 421503");

  let items = pi.items && Array.isArray(pi.items) && pi.items.length > 0 ? pi.items : defaultProformaInvoiceItems;

  const formattedItems = items.map((it, idx) => ({
    itemNo: it.itemNo || idx + 1,
    name: it.name || it.description || `Service Item ${idx + 1}`,
    subText: it.subText || it.remarks || "",
    hsnSac: String(it.hsnSac || it.hsnCode || "998346"),
    qty: `${it.qty || 1} ${it.qtyUnit || "NOS"}`,
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

  // Bank & UPI QR Code (Generated from .env / Account details)
  const bankName = (pi.bankName || process.env.BANK_NAME || "HDFC Bank").trim();
  const accountNo = (pi.accountNo || process.env.BANK_ACCOUNT_NO || "50200111763991").trim();
  const branchName = (pi.bankBranch || process.env.BANK_BRANCH || "Kandivali East - Thakur Village").trim();
  const ifscCode = (pi.ifscCode || process.env.BANK_IFSC || "HDFC0000582").trim();
  const payeeName = (process.env.UPI_PAYEE_NAME || pi.payeeName || "ARCL INSTRUMENTS PRIVATE LIMITED").trim();
  const upiId = (process.env.UPI_ID || pi.upiId || "8572995533.2@hdfc").trim();

  let qrBuffer = null;
  if (fs.existsSync(QR_IMAGE_PATH)) {
    try {
      qrBuffer = fs.readFileSync(QR_IMAGE_PATH);
    } catch (e) {
      qrBuffer = null;
    }
  }

  const isSinglePage = formattedItems.length <= 8;
  const rowH = isSinglePage
    ? Math.max(24, Math.min(38, Math.floor(260 / Math.max(1, formattedItems.length))))
    : 22;

  const drawPiHeader = (doc) => {
    let topY = 25;
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, 30, topY, { width: 75 });
      } catch (e) {
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 30, topY);
      }
    } else {
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#021C57").text("ARCL", 30, topY);
    }

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0d9488").text("ARCL INSTRUMENTS PRIVATE LIMITED", 110, topY);
    doc.fontSize(6.5).font("Helvetica").fillColor("#334155");
    doc.text("Shop No. 6, Siddivinayak Park CHS, Sector 8A,", 110, topY + 14);
    doc.text("Airoli, Navi Mumbai, Maharashtra - 400708", 110, topY + 23);
    doc.text("GSTIN: 27AATCA7874C1ZB | Phone: +91 8369458583 / +91 6205691085 | Email: arclinstruments@gmail.com", 110, topY + 32);

    doc.rect(430, topY, 135, 38).fillColor("#0d9488").fill();
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#ffffff").text("PROFORMA INVOICE", 430, topY + 6, { width: 135, align: "center" });
    doc.fontSize(6).font("Helvetica").text("Advance Commercial Estimate", 430, topY + 22, { width: 135, align: "center" });

    doc.moveTo(30, topY + 48).lineTo(565, topY + 48).lineWidth(1).strokeColor("#0d9488").stroke();

    const boxY = topY + 54;
    const boxH = 58;
    doc.rect(30, boxY, 535, boxH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(290, boxY).lineTo(290, boxY + boxH).lineWidth(0.5).strokeColor("#000000").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#000000").text("Proforma To (Customer):", 36, boxY + 5);
    doc.font("Helvetica-Bold").text(clientCompany, 36, boxY + 15, { width: 245 });
    doc.font("Helvetica").fontSize(6).fillColor("#334155").text(clientAddress, 36, boxY + 25, { width: 245, lineGap: 1 });
    doc.font("Helvetica-Bold").fillColor("#000000").text(`GSTIN: ${clientGstin}`, 36, boxY + 46);

    doc.fontSize(6.5).font("Helvetica-Bold").text("Proforma Details:", 296, boxY + 5);
    doc.font("Helvetica").fontSize(6.5);
    doc.text("Proforma No.:", 296, boxY + 16);
    doc.font("Helvetica-Bold").text(piNo, 365, boxY + 16);
    doc.text("Proforma Date:", 296, boxY + 27);
    doc.text(piDate, 365, boxY + 27);
    doc.text("Due Date:", 296, boxY + 38);
    doc.text(dueDate, 365, boxY + 38);
    doc.text("Place of Supply:", 296, boxY + 48);
    doc.text(placeOfSupply, 365, boxY + 48);

    return boxY + boxH;
  };

  const drawCompactPiHeader = (doc) => {
    let topY = 25;
    doc.rect(30, topY, 535, 24).fillColor("#0d9488").fill();
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#ffffff").text(`ARCL INSTRUMENTS - PROFORMA INVOICE (${piNo})`, 36, topY + 7);
    doc.fontSize(7.5).font("Helvetica").text(`Date: ${piDate}  |  Place of Supply: ${placeOfSupply}`, 320, topY + 8, { width: 235, align: "right" });
    return topY + 28;
  };

  const drawPiTableHeader = (doc, startY) => {
    const thH = 18;
    doc.rect(30, startY, 535, thH).fillColor("#0d9488").fill();
    doc.moveTo(48, startY).lineTo(48, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(275, startY).lineTo(275, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(330, startY).lineTo(330, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(390, startY).lineTo(390, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();
    doc.moveTo(460, startY).lineTo(460, startY + thH).lineWidth(0.5).strokeColor("#ffffff").stroke();

    doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("#", 30, startY + 5, { width: 18, align: "center" });
    doc.text("Item & Calibration Scope", 52, startY + 5);
    doc.text("HSN/SAC", 275, startY + 5, { width: 55, align: "center" });
    doc.text("Qty", 330, startY + 5, { width: 60, align: "center" });
    doc.text("Rate (INR)", 390, startY + 5, { width: 70, align: "right" });
    doc.text("Amount (INR)", 460, startY + 5, { width: 100, align: "right" });

    return startY + thH;
  };

  let curY = drawPiHeader(doc);
  curY = drawPiTableHeader(doc, curY);

  for (let i = 0; i < formattedItems.length; i++) {
    const it = formattedItems[i];
    const itemH = it.subText && it.subText.includes("\n") ? rowH + 8 : rowH;

    if (curY + itemH > 750) {
      doc.addPage({ size: "A4", margin: 25 });
      curY = drawCompactPiHeader(doc);
      curY = drawPiTableHeader(doc, curY);
    }

    doc.rect(30, curY, 535, itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(48, curY).lineTo(48, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(275, curY).lineTo(275, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(330, curY).lineTo(330, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(390, curY).lineTo(390, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();
    doc.moveTo(460, curY).lineTo(460, curY + itemH).lineWidth(0.5).strokeColor("#000000").stroke();

    const textYOffset = (itemH / 2) - 4;
    doc.fontSize(6.5).font("Helvetica").fillColor("#000000");
    doc.text(String(it.itemNo), 30, curY + textYOffset, { width: 18, align: "center" });
    doc.font("Helvetica-Bold").text(it.name, 52, curY + 3, { width: 220 });
    if (it.subText) {
      doc.font("Helvetica").fontSize(5.5).fillColor("#475569").text(it.subText, 52, curY + 12, { width: 220, lineGap: 1 });
    }
    doc.fontSize(6.5).font("Helvetica").fillColor("#000000");
    doc.text(it.hsnSac, 275, curY + textYOffset, { width: 55, align: "center" });
    doc.text(it.qty, 330, curY + textYOffset, { width: 60, align: "center" });
    doc.text(it.rate, 390, curY + textYOffset, { width: 65, align: "right" });
    doc.text(it.amount, 460, curY + textYOffset, { width: 100, align: "right" });

    curY += itemH;
  }

  if (curY + 235 > 775) {
    doc.addPage({ size: "A4", margin: 25 });
    curY = drawCompactPiHeader(doc);
  }

  // Summary
  const sumH = 48;
  doc.rect(30, curY, 535, sumH).lineWidth(0.5).strokeColor("#000000").stroke();
  doc.moveTo(390, curY).lineTo(390, curY + sumH).lineWidth(0.5).strokeColor("#000000").stroke();

  doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#000000").text("Total in Words:", 36, curY + 5);
  doc.font("Helvetica").fontSize(6.5).text(numberToWords(totalAmount.toFixed(2)), 36, curY + 15, { width: 345 });

  doc.font("Helvetica").fontSize(6.5);
  doc.text("Taxable Amount:", 395, curY + 5);
  doc.text(taxableAmount.toFixed(2), 485, curY + 5, { width: 75, align: "right" });
  doc.text("Total Tax (GST):", 395, curY + 15);
  doc.text((cgstAmount + sgstAmount + igstAmount).toFixed(2), 485, curY + 15, { width: 75, align: "right" });
  doc.font("Helvetica-Bold").text("Grand Total (INR):", 395, curY + 30);
  doc.text(totalAmount.toFixed(2), 485, curY + 30, { width: 75, align: "right" });

  curY += sumH;

  const hsnH = 42;
  doc.rect(30, curY, 535, hsnH).lineWidth(0.5).strokeColor("#000000").stroke();
  doc.rect(30, curY, 535, 14).fillColor("#f1f5f9").fill();

  doc.fontSize(6).font("Helvetica-Bold").fillColor("#000000");
  doc.text("HSN/SAC", 35, curY + 4);
  doc.text("Taxable Value", 145, curY + 4, { width: 80, align: "right" });
  doc.text("CGST Rate", 232, curY + 4, { width: 55, align: "center" });
  doc.text("CGST Amt", 292, curY + 4, { width: 55, align: "right" });
  doc.text("SGST Rate", 352, curY + 4, { width: 55, align: "center" });
  doc.text("SGST Amt", 412, curY + 4, { width: 55, align: "right" });
  doc.text("Total Tax Amt", 475, curY + 4, { width: 85, align: "right" });

  doc.font("Helvetica").fontSize(6);
  doc.text("998346", 35, curY + 18);
  doc.text(taxableAmount.toFixed(2), 145, curY + 18, { width: 80, align: "right" });
  doc.text(`${cgstRate.toFixed(1)}%`, 232, curY + 18, { width: 55, align: "center" });
  doc.text(cgstAmount.toFixed(2), 292, curY + 18, { width: 55, align: "right" });
  doc.text(`${sgstRate.toFixed(1)}%`, 352, curY + 18, { width: 55, align: "center" });
  doc.text(sgstAmount.toFixed(2), 412, curY + 18, { width: 55, align: "right" });
  doc.text((cgstAmount + sgstAmount).toFixed(2), 475, curY + 18, { width: 85, align: "right" });

  curY += hsnH;

  const botH = 135;
  doc.rect(30, curY, 535, botH).lineWidth(0.8).strokeColor("#000000").stroke();
  doc.moveTo(270, curY).lineTo(270, curY + botH).lineWidth(0.8).strokeColor("#000000").stroke();

  doc.fontSize(7).font("Helvetica-Bold").text("Bank Details:", 36, curY + 6);
  doc.font("Helvetica").fontSize(6.5);
  doc.text(`Bank Name: ${bankName}`, 36, curY + 18);
  doc.text(`A/C No: ${accountNo}`, 36, curY + 29);
  doc.text(`Branch: ${branchName}`, 36, curY + 40);
  doc.text(`IFSC Code: ${ifscCode}`, 36, curY + 51);

  if (qrBuffer) {
    doc.image(qrBuffer, 175, curY + 8, { width: 68 });
    doc.fontSize(6).font("Helvetica-Bold").text("Scan to Pay UPI", 175, curY + 80, { width: 68, align: "center" });
  }

  doc.fontSize(7).font("Helvetica-Bold").text("Terms & Conditions:", 276, curY + 6);
  doc.font("Helvetica").fontSize(6);
  doc.text("1. Proforma Invoice for advance processing & material inward.", 276, curY + 18, { width: 280 });
  doc.text("2. Reports issued strictly upon receipt of confirmed payment.", 276, curY + 28, { width: 280 });
  doc.text("3. Subject to Mumbai Jurisdiction.", 276, curY + 38, { width: 280 });

  doc.fontSize(7).font("Helvetica-Bold").text("For ARCL INSTRUMENTS PRIVATE LIMITED", 276, curY + 68, { width: 280, align: "right" });

  if (fs.existsSync(STAMP_IMAGE_PATH)) {
    try {
      doc.image(STAMP_IMAGE_PATH, 455, curY + 72, { width: 85 });
    } catch (e) {}
  } else {
    const stampX = 500;
    const stampY = curY + 105;
    doc.save();
    doc.circle(stampX, stampY, 20).lineWidth(1).strokeColor("#0d9488").stroke();
    doc.circle(stampX, stampY, 17).lineWidth(0.5).strokeColor("#0d9488").stroke();
    doc.fontSize(4).font("Helvetica-Bold").fillColor("#0d9488").text("ARCL INSTRUMENTS", stampX - 18, stampY - 6, { width: 36, align: "center" });
    doc.restore();
  }

  doc.fontSize(6.5).font("Helvetica").fillColor("#000000").text("Authorized Signatory", 276, curY + 120, { width: 280, align: "right" });

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    const footerText = `Page ${p + 1} of ${range.count}  •  ${piNo}  •  Proforma Commercial Document`;
    doc.fontSize(7).font("Helvetica").fillColor("#475569").text(footerText, 30, 805, { width: 535, align: "center" });
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 4. DYNAMIC AUTO-SPACED & PAGINATED CALIBRATION CERTIFICATE PDF
 * =========================================================================
 */
export const generateCalibrationCertificatePdf = async (data = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const certNo = data.certificateNo || data.certificateNumber || "ARCL-CAL-2026-HM01";
  const calDate = data.calibrationDate ? new Date(data.calibrationDate).toLocaleDateString("en-GB") : "15/05/2026";
  const dueDate = data.calibrationDueDate || data.suggestedDueDate ? new Date(data.calibrationDueDate || data.suggestedDueDate).toLocaleDateString("en-GB") : "14/05/2027";
  const clientCompany = data.clientCompany || data.customer?.name || "Harsh Mishra Technologies Pvt. Ltd.";
  const clientAddress = data.clientAddress || data.customer?.address || "Vasai East, Palghar, Maharashtra - 401208";
  const instrument = data.instrument || data.instrument?.name || "Digital Compression Testing Machine 2000 kN";
  const serialNo = data.serialNo || data.instrument?.serialNumber || "ARCL-CTM-9842";
  const make = data.make || data.instrument?.manufacturer || "-";
  const modelNo = data.modelNo || data.instrument?.model || "-";
  const instrumentRange = data.instrumentRange || data.instrument?.range || "0 - 2000 kN";
  const leastCount = data.leastCount || data.instrument?.leastCount || "0.1 kN";
  const dcNo = data.dcNo || data.srfNo || "DC/26-27/0188";

  let results = data.calibrationResults && Array.isArray(data.calibrationResults) && data.calibrationResults.length > 0
    ? data.calibrationResults
    : [
        { sr: "1", nominal: "200.0 kN", observed: "199.8 kN", error: "-0.2 kN (-0.10%)", uncertainty: "± 0.25%", result: "PASS ✓" },
        { sr: "2", nominal: "500.0 kN", observed: "500.1 kN", error: "+0.1 kN (+0.02%)", uncertainty: "± 0.25%", result: "PASS ✓" },
        { sr: "3", nominal: "1000.0 kN", observed: "1000.4 kN", error: "+0.4 kN (+0.04%)", uncertainty: "± 0.25%", result: "PASS ✓" },
        { sr: "4", nominal: "1500.0 kN", observed: "1500.2 kN", error: "+0.2 kN (+0.01%)", uncertainty: "± 0.25%", result: "PASS ✓" },
        { sr: "5", nominal: "2000.0 kN", observed: "1999.7 kN", error: "-0.3 kN (-0.01%)", uncertainty: "± 0.25%", result: "PASS ✓" },
      ];

  let standards = data.standardsUsed && Array.isArray(data.standardsUsed) && data.standardsUsed.length > 0
    ? data.standardsUsed
    : [
        { name: "Master Proving Ring 2000 kN", serialNo: "PR-2024-09", certNo: "NPL/2025/112", validTill: "15-01-2027" },
        { name: "Digital Pressure Indicator Calibrator", serialNo: "DPI-88", certNo: "NABL/2025/889", validTill: "20-03-2027" }
      ];

  const isSinglePage = results.length <= 8;
  const numRows = results.length;
  const rowH = isSinglePage ? Math.max(16, Math.min(24, Math.floor(140 / Math.max(1, numRows)))) : 18;
  const sectionSpacing = isSinglePage ? 10 : 8;

  let curY = drawOfficialHeader(doc, "Official Calibration Certificate (ISO/IEC 17025:2017)", "#b91c1c");

  const infoH = 88;
  doc.rect(35, curY, 525, infoH).fillColor("#f8fafc").strokeColor("#cbd5e1").lineWidth(0.8).fillAndStroke();
  
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#021C57");
  doc.text(`Certificate No: ${certNo}`, 45, curY + 8);
  doc.text(`Calibration Date: ${calDate}`, 320, curY + 8);

  doc.font("Helvetica").fontSize(7.5).fillColor("#334155");
  doc.text(`Customer Name: `, 45, curY + 23).font("Helvetica-Bold").fillColor("#0f172a").text(clientCompany, 130, curY + 23, { width: 180, lineBreak: false });
  doc.font("Helvetica").fillColor("#334155").text(`Suggested Due Date: `, 320, curY + 23).font("Helvetica-Bold").fillColor("#059669").text(dueDate, 420, curY + 23);

  doc.font("Helvetica").fillColor("#334155").text(`Address: `, 45, curY + 38).font("Helvetica").fillColor("#0f172a").text(clientAddress, 130, curY + 38, { width: 180, lineBreak: false });
  doc.font("Helvetica").fillColor("#334155").text(`Challan / SRF Ref: `, 320, curY + 38).font("Helvetica-Bold").fillColor("#0f172a").text(dcNo, 420, curY + 38);

  doc.font("Helvetica").fillColor("#334155").text(`Instrument: `, 45, curY + 53).font("Helvetica-Bold").fillColor("#0f172a").text(instrument, 130, curY + 53, { width: 180, lineBreak: false });
  doc.font("Helvetica").fillColor("#334155").text(`Serial / Asset No: `, 320, curY + 53).font("Helvetica-Bold").fillColor("#2563eb").text(serialNo, 420, curY + 53);

  doc.font("Helvetica").fillColor("#334155").text(`Make / Model: `, 45, curY + 68).font("Helvetica-Bold").fillColor("#0f172a").text(`${make} / ${modelNo}`, 130, curY + 68);
  doc.font("Helvetica").fillColor("#334155").text(`Range / Least Count: `, 320, curY + 68).font("Helvetica-Bold").fillColor("#0f172a").text(`${instrumentRange} | LC: ${leastCount}`, 420, curY + 68);

  curY += infoH + sectionSpacing;

  // Standards Table
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#021C57").text("Reference Standards Traceability & Environmental Conditions:", 35, curY);
  curY += 12;

  const stdH = 15;
  doc.rect(35, curY, 525, stdH).fillColor("#f1f5f9").strokeColor("#cbd5e1").lineWidth(0.5).fillAndStroke();
  doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#334155");
  doc.text("Standard Instrument", 45, curY + 4);
  doc.text("Serial No.", 220, curY + 4);
  doc.text("Certificate Ref", 320, curY + 4);
  doc.text("Validity Due", 460, curY + 4);
  curY += stdH;

  standards.forEach((std, i) => {
    const sH = 14;
    doc.rect(35, curY, 525, sH).fillColor(i % 2 === 0 ? "#ffffff" : "#f8fafc").strokeColor("#e2e8f0").lineWidth(0.5).fillAndStroke();
    doc.fontSize(6.5).font("Helvetica").fillColor("#1e293b");
    doc.text(std.name || std.standardName || "Master Reference", 45, curY + 3, { width: 170, lineBreak: false });
    doc.text(std.serialNo || std.serial || "-", 220, curY + 3);
    doc.text(std.certNo || std.certificate || "-", 320, curY + 3);
    doc.text(std.validTill || std.validity || "-", 460, curY + 3);
    curY += sH;
  });

  curY += sectionSpacing;

  const drawCertResultsHeader = (yPos) => {
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#021C57").text("Multi-Point Metrological Calibration Readings & Uncertainty:", 35, yPos);
    yPos += 12;
    doc.rect(35, yPos, 525, 18).fillColor("#021C57").strokeColor("#021C57").fillAndStroke();
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Sr.", 45, yPos + 5);
    doc.text("Nominal Standard Load", 75, yPos + 5);
    doc.text("Observed Indication", 200, yPos + 5);
    doc.text("Error of Indication", 310, yPos + 5);
    doc.text("Expanded Uncertainty (k=2)", 405, yPos + 5);
    doc.text("Metrological Status", 495, yPos + 5);
    return yPos + 18;
  };

  curY = drawCertResultsHeader(curY);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const sr = r.sr || String(i + 1);
    const nominal = r.nominal || r.standardValue || r.parameter || `${(i + 1) * 100} units`;
    const observed = r.observed || r.indicatedValue || `${(i + 1) * 100} units`;
    const error = r.error || "0.00%";
    const uncertainty = r.uncertainty || "± 0.25%";
    const result = r.result || "PASS ✓";

    if (curY + rowH > 710) {
      drawOfficialFooter(doc, 725);
      doc.addPage({ size: "A4", margin: 25 });
      curY = drawOfficialHeader(doc, "Calibration Certificate - Continued Readings", "#b91c1c");
      curY = drawCertResultsHeader(curY);
    }

    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(35, curY, 525, rowH).fillColor(bg).strokeColor("#e2e8f0").lineWidth(0.5).fillAndStroke();
    doc.fontSize(7).font("Helvetica").fillColor("#1e293b");
    doc.text(sr, 45, curY + (rowH / 2) - 4);
    doc.text(nominal, 75, curY + (rowH / 2) - 4);
    doc.text(observed, 200, curY + (rowH / 2) - 4);
    doc.font("Helvetica-Bold").fillColor(error.startsWith("-") ? "#b91c1c" : "#059669").text(error, 310, curY + (rowH / 2) - 4);
    doc.font("Helvetica").fillColor("#1e293b").text(uncertainty, 405, curY + (rowH / 2) - 4);
    doc.font("Helvetica-Bold").fillColor("#059669").text(result, 495, curY + (rowH / 2) - 4);
    curY += rowH;
  }

  curY += sectionSpacing;

  const remarksH = isSinglePage ? 52 : 46;
  if (curY + remarksH > 710) {
    drawOfficialFooter(doc, 725);
    doc.addPage({ size: "A4", margin: 25 });
    curY = drawOfficialHeader(doc, "Calibration Certificate - Compliance & Authorization", "#b91c1c");
  }

  doc.rect(35, curY, 525, remarksH).fillColor("#f8fafc").strokeColor("#cbd5e1").lineWidth(0.8).fillAndStroke();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#021C57").text("Metrological Standards & Compliance Remarks:", 45, curY + 6);
  doc.font("Helvetica").fontSize(6.5).fillColor("#475569").text(
    "• Traceability: The reference standards used are traceable to National Physical Laboratory (NPL), New Delhi / National Standards.\n" +
    "• Uncertainty Statement: The reported expanded uncertainty is stated at a confidence level of approx 95% with coverage factor k=2.\n" +
    "• Conformity: The calibrated unit conforms to ISO/IEC 17025:2017 specifications and applicable IS/ISO accuracy criteria.",
    45,
    curY + 17,
    { width: 505, lineGap: 1.5 }
  );

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    drawOfficialFooter(doc, 725);
    doc.fontSize(6.5).font("Helvetica").fillColor("#64748b").text(
      `Page ${p + 1} of ${range.count}  •  ${certNo}  •  Digitally Authenticated Certificate`,
      35,
      785,
      { width: 525, align: "center" }
    );
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 5. DYNAMIC AUTO-SPACED OBSERVATION SHEET & WORKSHEET PDF
 * =========================================================================
 */
export const generateObservationSheetPdf = async (data = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const serialNo = data.serialNo || "ARCL-CTM-9842";
  const instrument = data.instrument || data.instrumentName || "Digital Compression Testing Machine 2000 kN";
  const calDate = data.calibrationDate ? new Date(data.calibrationDate).toLocaleDateString("en-GB") : "15/05/2026";
  const temperature = data.temperature || "23.2 °C";
  const humidity = data.humidity || "52% RH";
  const masterCell = data.masterLoadCell || "ARCL-MTR-01 (NPL Traceable)";

  let readings = data.observations && Array.isArray(data.observations) && data.observations.length > 0
    ? data.observations
    : [
        { nominal: "200.0 kN", master: "200.00 kN", up: "199.80 kN", down: "199.85 kN", mean: "199.82 kN", error: "-0.18 kN (-0.09%)", unc: "± 0.25%" },
        { nominal: "500.0 kN", master: "500.00 kN", up: "500.10 kN", down: "500.15 kN", mean: "500.12 kN", error: "+0.12 kN (+0.02%)", unc: "± 0.25%" },
        { nominal: "1000.0 kN", master: "1000.00 kN", up: "1000.35 kN", down: "1000.40 kN", mean: "1000.37 kN", error: "+0.37 kN (+0.03%)", unc: "± 0.25%" },
        { nominal: "1500.0 kN", master: "1500.00 kN", up: "1500.20 kN", down: "1500.25 kN", mean: "1500.22 kN", error: "+0.22 kN (+0.01%)", unc: "± 0.25%" },
        { nominal: "2000.0 kN", master: "2000.00 kN", up: "1999.60 kN", down: "1999.70 kN", mean: "1999.65 kN", error: "-0.35 kN (-0.01%)", unc: "± 0.25%" },
      ];

  const isSinglePage = readings.length <= 10;
  const rowH = isSinglePage ? Math.max(16, Math.min(24, Math.floor(180 / Math.max(1, readings.length)))) : 18;

  let curY = drawOfficialHeader(doc, "Metrological Raw Observation & Readings Worksheet", "#0f766e");

  const infoH = 68;
  doc.rect(35, curY, 525, infoH).fillColor("#f0fdfa").strokeColor("#99f6e4").lineWidth(0.8).fillAndStroke();
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#0f766e");
  doc.text(`Worksheet Ref: WS-ARCL-2026-${serialNo}`, 45, curY + 8);
  doc.text(`Testing Date: ${calDate}`, 320, curY + 8);

  doc.font("Helvetica").fontSize(7.5).fillColor("#334155");
  doc.text(`Environmental: `, 45, curY + 24).font("Helvetica-Bold").fillColor("#0f172a").text(`${temperature} | ${humidity}`, 125, curY + 24);
  doc.font("Helvetica").fillColor("#334155").text(`Master Load Cell: `, 320, curY + 24).font("Helvetica-Bold").fillColor("#0f172a").text(masterCell, 410, curY + 24);

  doc.font("Helvetica").fillColor("#334155").text(`Unit Under Test: `, 45, curY + 42).font("Helvetica-Bold").fillColor("#0f172a").text(`${instrument} (${serialNo})`, 125, curY + 42);

  curY += infoH + 12;

  const drawObsHeader = (yPos) => {
    doc.rect(35, yPos, 525, 18).fillColor("#0f766e").strokeColor("#0f766e").fillAndStroke();
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Nominal", 40, yPos + 5);
    doc.text("Master (kN)", 110, yPos + 5);
    doc.text("Observed Up", 185, yPos + 5);
    doc.text("Observed Down", 260, yPos + 5);
    doc.text("Mean (kN)", 345, yPos + 5);
    doc.text("Error", 415, yPos + 5);
    doc.text("Uncertainty (k=2)", 480, yPos + 5);
    return yPos + 18;
  };

  curY = drawObsHeader(curY);

  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];
    const nom = r.nominal || r.standard || `${(i + 1) * 100}`;
    const m = r.master || r.standard || `${(i + 1) * 100}`;
    const up = r.up || r.trial1 || "-";
    const down = r.down || r.trial2 || "-";
    const mean = r.mean || r.trial3 || "-";
    const err = r.error || "0.00";
    const unc = r.unc || r.uncertainty || "± 0.25%";

    if (curY + rowH > 710) {
      drawOfficialFooter(doc, 725);
      doc.addPage({ size: "A4", margin: 25 });
      curY = drawOfficialHeader(doc, "Observation Sheet - Continued Readings", "#0f766e");
      curY = drawObsHeader(curY);
    }

    const bg = i % 2 === 0 ? "#ffffff" : "#f0fdfa";
    doc.rect(35, curY, 525, rowH).fillColor(bg).strokeColor("#e2e8f0").lineWidth(0.5).fillAndStroke();
    doc.fontSize(7).font("Helvetica").fillColor("#1e293b");
    doc.text(nom, 40, curY + (rowH / 2) - 4);
    doc.text(m, 110, curY + (rowH / 2) - 4);
    doc.text(up, 185, curY + (rowH / 2) - 4);
    doc.text(down, 260, curY + (rowH / 2) - 4);
    doc.text(mean, 345, curY + (rowH / 2) - 4);
    doc.font("Helvetica-Bold").fillColor(err.startsWith("-") ? "#b91c1c" : "#059669").text(err, 415, curY + (rowH / 2) - 4);
    doc.font("Helvetica").fillColor("#1e293b").text(unc, 480, curY + (rowH / 2) - 4);
    curY += rowH;
  }

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    drawOfficialFooter(doc, 725);
    doc.fontSize(6.5).font("Helvetica").fillColor("#64748b").text(
      `Page ${p + 1} of ${range.count}  •  Worksheet Ref: WS-ARCL-2026-${serialNo}`,
      35,
      785,
      { width: 525, align: "center" }
    );
  }

  return buildPdfBuffer(doc);
};

/**
 * =========================================================================
 * 6. DYNAMIC AUTO-SPACED SRF INWARD SLIP PDF
 * =========================================================================
 */
export const generateSrfSlipPdf = async (data = {}) => {
  const doc = new PDFDocument({ size: "A4", margin: 25, bufferPages: true });

  const srfNo = data.srfNo || data.srfNumber || "SRF/2026/0842";
  const calDate = data.calibrationDate
    ? (data.calibrationDate instanceof Date ? data.calibrationDate.toLocaleDateString("en-GB") : String(data.calibrationDate).slice(0, 10))
    : new Date().toLocaleDateString("en-GB");
  const challanDate = data.challanDate
    ? (data.challanDate instanceof Date ? data.challanDate.toLocaleDateString("en-GB") : String(data.challanDate).slice(0, 10))
    : calDate;
  const clientCompany = data.clientCompany || data.customer?.name || "Tata Projects Ltd. / Valued Client";
  const contactPerson = data.clientContactPerson || data.contactPerson || "Quality Lead";
  const clientGst = data.clientGst || data.clientGstin || "N/A";
  const clientAddress = data.clientAddress || "Plot No. 12, TTC Industrial Area, MIDC, Airoli, Navi Mumbai - 400708";
  const clientPhone = data.clientPhone || data.phone || "+91 8009559900";
  const dcNo = data.dcNo || "N/A";
  const rawSentToLab = data.sentToLab || "ARCL Calibration Lab";
  const sentToLab = rawSentToLab.includes("Metrology") || rawSentToLab.includes("Central") ? "ARCL Calibration Lab" : rawSentToLab;

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

  let curY = drawOfficialHeader(doc, "Service Request Form (SRF Inward & Metrology Job Slip)", "#b45309");

  // Client & Inward Metadata Card
  const infoH = 88;
  doc.rect(35, curY, 525, infoH).fillColor("#fffbeb").strokeColor("#fde68a").lineWidth(0.8).fillAndStroke();

  doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#b45309");
  doc.text(`SRF Job Number: ${srfNo}`, 45, curY + 8);
  doc.text(`Inward Date: ${calDate}`, 320, curY + 8);

  doc.font("Helvetica").fontSize(7.5).fillColor("#334155");
  doc.text(`Client Company: `, 45, curY + 23).font("Helvetica-Bold").fillColor("#0f172a").text(clientCompany, 125, curY + 23);
  doc.font("Helvetica").fillColor("#334155").text(`Contact Person: `, 320, curY + 23).font("Helvetica-Bold").fillColor("#0f172a").text(`${contactPerson} (${clientPhone})`, 395, curY + 23);

  doc.font("Helvetica").fillColor("#334155").text(`GST No. (GSTIN): `, 45, curY + 38).font("Helvetica-Bold").fillColor("#0f172a").text(clientGst, 125, curY + 38);
  doc.font("Helvetica").fillColor("#334155").text(`Inward DC / Challan: `, 320, curY + 38).font("Helvetica-Bold").fillColor("#0f172a").text(`${dcNo} (Dt: ${challanDate})`, 410, curY + 38);

  doc.font("Helvetica").fillColor("#334155").text(`Site / Address: `, 45, curY + 53).font("Helvetica-Bold").fillColor("#0f172a").text(clientAddress, 125, curY + 53, { width: 390 });
  doc.font("Helvetica").fillColor("#334155").text(`Assigned Lab: `, 45, curY + 70).font("Helvetica-Bold").fillColor("#059669").text(sentToLab, 125, curY + 70);

  curY += infoH + 10;

  // Draw Table Header
  const drawSrfHeader = (yPos) => {
    doc.rect(35, yPos, 525, 18).fillColor("#b45309").strokeColor("#b45309").fillAndStroke();
    doc.fontSize(7).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("Sr.", 40, yPos + 5, { width: 20, align: "center" });
    doc.text("Equipment / Instrument Description", 65, yPos + 5, { width: 170 });
    doc.text("Make / Model", 240, yPos + 5, { width: 85 });
    doc.text("Serial No / ID", 330, yPos + 5, { width: 75 });
    doc.text("Range / Capacity", 410, yPos + 5, { width: 75 });
    doc.text("Inward Status", 490, yPos + 5, { width: 65, align: "center" });
    return yPos + 18;
  };

  curY = drawSrfHeader(curY);

  const rowH = 22;
  rawInstruments.forEach((it, idx) => {
    if (curY + rowH > 680) {
      drawOfficialFooter(doc, 725);
      doc.addPage({ size: "A4", margin: 25 });
      curY = drawOfficialHeader(doc, "Service Request Form - Continued Equipments", "#b45309");
      curY = drawSrfHeader(curY);
    }

    const bg = idx % 2 === 0 ? "#ffffff" : "#fffdfa";
    doc.rect(35, curY, 525, rowH).fillColor(bg).strokeColor("#e2e8f0").lineWidth(0.5).fillAndStroke();

    doc.fontSize(7).font("Helvetica-Bold").fillColor("#475569");
    doc.text(String(idx + 1), 40, curY + 6, { width: 20, align: "center" });

    doc.font("Helvetica-Bold").fillColor("#0f172a");
    doc.text(it.instrument || "Testing Equipment", 65, curY + 4, { width: 170 });
    doc.font("Helvetica").fontSize(6.5).fillColor("#64748b");
    doc.text(`Scope: ISO/IEC 17025 Calibration`, 65, curY + 12, { width: 170 });

    doc.fontSize(7).font("Helvetica").fillColor("#334155");
    const makeModelStr = [it.make, it.modelNo].filter(Boolean).join(" / ") || "-";
    doc.text(makeModelStr, 240, curY + 6, { width: 85 });

    doc.font("Helvetica-Bold").fillColor("#1d4ed8");
    doc.text(it.serialNo || "N/A", 330, curY + 6, { width: 75 });

    doc.font("Helvetica").fillColor("#334155");
    doc.text(it.instrumentRange || "Standard Range", 410, curY + 6, { width: 75 });

    doc.font("Helvetica-Bold").fillColor("#059669");
    doc.text("Received ✓", 490, curY + 6, { width: 65, align: "center" });

    curY += rowH;
  });

  // Technical Receiving Checklist
  if (curY + 75 > 680) {
    drawOfficialFooter(doc, 725);
    doc.addPage({ size: "A4", margin: 25 });
    curY = drawOfficialHeader(doc, "Service Request Form - Inward Technical Signoff", "#b45309");
  }

  curY += 8;
  doc.rect(35, curY, 525, 52).fillColor("#f8fafc").strokeColor("#cbd5e1").lineWidth(0.5).fillAndStroke();
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#0f172a").text("Inward Quality & Technical Acceptance Review:", 45, curY + 6);

  doc.fontSize(7).font("Helvetica").fillColor("#334155");
  doc.text(`• Total Inward Equipments: ${rawInstruments.length} Item(s) Verified & Logged in Pipeline.`, 45, curY + 18);
  doc.text("• Physical Condition: No structural cracks, zero mechanical damage, cables & sensors intact.", 45, curY + 28);
  doc.text("• Metrological Traceability: National Physical Laboratory (NPL, New Delhi) & ERTL standards.", 45, curY + 38);
  doc.text("• Calibration Sticker: Physical holographic compliance sticker approved for application post calibration.", 300, curY + 18, { width: 250 });

  curY += 60;

  // Signatures
  if (curY + 50 > 710) {
    drawOfficialFooter(doc, 725);
    doc.addPage({ size: "A4", margin: 25 });
    curY = 30;
  }

  doc.rect(35, curY, 255, 45).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#334155").text("Handed Over By (Customer / Logistics Rep):", 40, curY + 5);
  doc.fontSize(6.5).font("Helvetica").fillColor("#64748b").text(`Name: ${contactPerson} (${clientCompany})`, 40, curY + 30);

  doc.rect(305, curY, 255, 45).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#334155").text("Received & Accepted By (ARCL Metrology Incharge):", 310, curY + 5);
  doc.fontSize(6.5).font("Helvetica").fillColor("#059669").text("Authorized Quality Acceptance • CC-4313", 310, curY + 30);

  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(p);
    drawOfficialFooter(doc, 725);
    doc.fontSize(6.5).font("Helvetica").fillColor("#64748b").text(
      `Page ${p + 1} of ${range.count}  •  SRF Ref: ${srfNo}  •  Inward Challan: ${dcNo}`,
      35,
      785,
      { width: 525, align: "center" }
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

  const drawPoHeader = (doc) => {
    let topY = 20;
    doc.rect(20, topY, 802, 30).fillColor("#1e293b").fill();
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#ffffff").text("PURCHASE ORDER", 20, topY + 8, { width: 802, align: "center" });

    const boxY = topY + 35;
    const boxH = 45;
    doc.rect(20, boxY, 802, boxH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    doc.moveTo(420, boxY).lineTo(420, boxY + boxH).lineWidth(0.5).strokeColor("#cbd5e1").stroke();

    doc.fontSize(7).font("Helvetica-Bold").fillColor("#0f172a").text("Supplier / Service Provider:", 26, boxY + 5);
    doc.font("Helvetica").fontSize(6.5).text(supplierName, 26, boxY + 16);
    doc.text(supplierAddress, 26, boxY + 26, { width: 380 });
    doc.font("Helvetica-Bold").text(`GSTIN: ${supplierGstin}`, 26, boxY + 36);

    doc.fontSize(7).font("Helvetica-Bold").text("PO Details:", 426, boxY + 5);
    doc.font("Helvetica").fontSize(6.5);
    doc.text(`PO Number: ${poNo}`, 426, boxY + 16);
    doc.text(`PO Date: ${poDate}`, 426, boxY + 26);
    doc.text(`Payment Terms: 100% Advance Against Proforma Invoice / Calibration Schedule`, 426, boxY + 36);

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

  if (curY + 60 > 535) {
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
    curY = 30;
  }

  // Summary Row
  doc.rect(20, curY, 802, 22).fillColor("#1e293b").fill();
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#ffffff");
  doc.text("Grand Total PO Value (INR):", 30, curY + 6);
  doc.text(numberToWords(grandTotal.toFixed(2)), 180, curY + 6, { width: 450 });
  doc.text(`INR ${grandTotal.toFixed(2)}`, 660, curY + 6, { width: 150, align: "right" });

  // PO Signatory & Stamp Box
  const poSigY = curY + 28;
  if (poSigY + 55 > 550) {
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
  }
  const finalSigY = poSigY + 55 > 550 ? 30 : poSigY;

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
    case "recordExcel":
    case "readings":
      return generateObservationSheetPdf(data);
    case "srf":
      return generateSrfSlipPdf(data);
    case "certificate":
    default:
      return generateCalibrationCertificatePdf(data);
  }
};
