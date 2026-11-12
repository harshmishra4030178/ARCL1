// ==========================================
// GST STATE CODES & EXPORT HELPERS (GSTR-2 FORMAT)
// ==========================================
export const GST_STATE_CODE_MAP = {
  "01": "01-JAMMU AND KASHMIR",
  "02": "02-HIMACHAL PRADESH",
  "03": "03-PUNJAB",
  "04": "04-CHANDIGARH",
  "05": "05-UTTARAKHAND",
  "06": "06-HARYANA",
  "07": "07-DELHI",
  "08": "08-RAJASTHAN",
  "09": "09-UTTAR PRADESH",
  "10": "10-BIHAR",
  "11": "11-SIKKIM",
  "12": "12-ARUNACHAL PRADESH",
  "13": "13-NAGALAND",
  "14": "14-MANIPUR",
  "15": "15-MIZORAM",
  "16": "16-TRIPURA",
  "17": "17-MEGHALAYA",
  "18": "18-ASSAM",
  "19": "19-WEST BENGAL",
  "20": "20-JHARKHAND",
  "21": "21-ODISHA",
  "22": "22-CHATTISGARH",
  "23": "23-MADHYA PRADESH",
  "24": "24-GUJARAT",
  "26": "26-DADRA AND NAGAR HAVELI AND DAMAN AND DIU",
  "27": "27-MAHARASHTRA",
  "29": "29-KARNATAKA",
  "30": "30-GOA",
  "31": "31-LAKSHADWEEP",
  "32": "32-KERALA",
  "33": "33-TAMIL NADU",
  "34": "34-PUDUCHERRY",
  "35": "35-ANDAMAN AND NICOBAR ISLANDS",
  "36": "36-TELANGANA",
  "37": "37-ANDHRA PRADESH",
  "38": "38-LADAKH"
};

export const getGstPlaceOfSupply = (gstin = "", location = "", existingPos = "") => {
  if (existingPos && typeof existingPos === "string" && existingPos.trim()) {
    const trimmed = existingPos.trim().toUpperCase();
    if (Object.values(GST_STATE_CODE_MAP).includes(trimmed)) return trimmed;
  }
  const cleanGstin = String(gstin || "").trim().toUpperCase();
  if (cleanGstin.length >= 2) {
    const code = cleanGstin.slice(0, 2);
    if (GST_STATE_CODE_MAP[code]) {
      return GST_STATE_CODE_MAP[code];
    }
  }
  const locUpper = String(location || "").toUpperCase();
  for (const [code, nameWithCode] of Object.entries(GST_STATE_CODE_MAP)) {
    const stateName = nameWithCode.replace(/^\d+-/, "");
    if (
      locUpper.includes(stateName) ||
      (code === "27" &&
        (locUpper.includes("MUMBAI") ||
          locUpper.includes("PUNE") ||
          locUpper.includes("THANE") ||
          locUpper.includes("NAGPUR") ||
          locUpper.includes("NAVI MUMBAI")))
    ) {
      return nameWithCode;
    }
  }
  return "27-MAHARASHTRA";
};

export const formatGstExportDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const dt = new Date(dateVal);
    if (!isNaN(dt.getTime())) {
      const d = String(dt.getDate()).padStart(2, "0");
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const y = dt.getFullYear();
      return `${d}-${m}-${y}`;
    }
  } catch (err) {}
  const str = String(dateVal).trim();
  const mYMD = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (mYMD) {
    return `${String(mYMD[3]).padStart(2, "0")}-${String(mYMD[2]).padStart(2, "0")}-${mYMD[1]}`;
  }
  return str;
};

export const toSafeLocaleDate = (dateVal, fallback = "-") => {
  if (!dateVal) return fallback;
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return fallback;
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (_) {
    return fallback;
  }
};

export const toSafeIsoDate = (dateVal, fallback = "") => {
  if (!dateVal) return fallback;
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return fallback;
    return dt.toISOString().slice(0, 10);
  } catch (_) {
    return fallback;
  }
};

export const buildGstPurchaseRows = (purchasesList) => {
  if (!Array.isArray(purchasesList)) return [];

  const rows = [];

  purchasesList.forEach((p) => {
    const gstin = (p.vendorGstin || "").trim().toUpperCase();
    const vendorName = (p.vendorName || "").trim();
    const purchaseNumber = (p.billNo || p.purchaseNo || "").trim();
    const supplierInvoiceSerial = "";
    const purchaseDate = formatGstExportDate(p.purchaseDate);
    const placeOfSupply = getGstPlaceOfSupply(p.vendorGstin, p.vendorLocation, p.placeOfSupply);
    const reverseCharge = (p.reverseCharge || "N").toUpperCase();
    const orderStage = p.orderStage || "Received & Stocked";
    const applicableTaxRate = "";
    const cessAmount = 0;

    const isIntraState = placeOfSupply.startsWith("27");

    const items = Array.isArray(p.items) && p.items.length > 0 ? p.items : null;

    if (items) {
      const groups = new Map();
      items.forEach((it) => {
        const rate = Number(it.taxRate) >= 0 ? Number(it.taxRate) : 18;
        const qty = Number(it.qty) || 1;
        const unitRate = Number(it.rate) || 0;
        const taxable = qty * unitRate;
        const tax = taxable * (rate / 100);
        if (!groups.has(rate)) {
          groups.set(rate, { taxable: 0, tax: 0 });
        }
        const g = groups.get(rate);
        g.taxable += taxable;
        g.tax += tax;
      });

      if (groups.size <= 1) {
        const [rate, g] =
          groups.size === 1
            ? Array.from(groups.entries())[0]
            : [18, { taxable: Number(p.subtotal || 0), tax: Number(p.taxAmount || 0) }];
        const taxableVal = Number(
          p.subtotal !== undefined && Number(p.subtotal) > 0 ? p.subtotal : g.taxable
        );
        const taxAmt = Number(p.taxAmount !== undefined ? p.taxAmount : g.tax);
        const purchaseVal = Number(
          p.totalAmount !== undefined && Number(p.totalAmount) > 0
            ? p.totalAmount
            : taxableVal + taxAmt
        );

        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        if (isIntraState) {
          cgst = Math.round((taxAmt / 2) * 100) / 100;
          sgst = Math.round((taxAmt / 2) * 100) / 100;
          igst = 0;
        } else {
          cgst = 0;
          sgst = 0;
          igst = Math.round(taxAmt * 100) / 100;
        }

        rows.push({
          gstin,
          vendorName,
          purchaseNumber,
          supplierInvoiceSerial,
          purchaseDate,
          orderStage,
          purchaseValue: purchaseVal,
          placeOfSupply,
          reverseCharge,
          applicableTaxRate,
          taxableValue: taxableVal,
          cessAmount,
          cgst,
          sgst,
          igst,
          taxPercent: rate,
          taxAmount: taxAmt,
        });
      } else {
        groups.forEach((g, rate) => {
          const taxableVal = Math.round(g.taxable * 100) / 100;
          const taxAmt = Math.round(g.tax * 100) / 100;
          const purchaseVal = Math.round((taxableVal + taxAmt) * 100) / 100;

          let cgst = 0;
          let sgst = 0;
          let igst = 0;
          if (isIntraState) {
            cgst = Math.round((taxAmt / 2) * 100) / 100;
            sgst = Math.round((taxAmt / 2) * 100) / 100;
            igst = 0;
          } else {
            cgst = 0;
            sgst = 0;
            igst = Math.round(taxAmt * 100) / 100;
          }

          rows.push({
            gstin,
            vendorName,
            purchaseNumber,
            supplierInvoiceSerial,
            purchaseDate,
            orderStage,
            purchaseValue: purchaseVal,
            placeOfSupply,
            reverseCharge,
            applicableTaxRate,
            taxableValue: taxableVal,
            cessAmount,
            cgst,
            sgst,
            igst,
            taxPercent: rate,
            taxAmount: taxAmt,
          });
        });
      }
    } else {
      const taxableVal = Number(p.subtotal || 0);
      const taxAmt = Number(p.taxAmount || 0);
      const purchaseVal = Number(p.totalAmount || taxableVal + taxAmt);
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      if (isIntraState) {
        cgst = Math.round((taxAmt / 2) * 100) / 100;
        sgst = Math.round((taxAmt / 2) * 100) / 100;
        igst = 0;
      } else {
        cgst = 0;
        sgst = 0;
        igst = Math.round(taxAmt * 100) / 100;
      }

      rows.push({
        gstin,
        vendorName,
        purchaseNumber,
        supplierInvoiceSerial,
        purchaseDate,
        orderStage,
        purchaseValue: purchaseVal,
        placeOfSupply,
        reverseCharge,
        applicableTaxRate,
        taxableValue: taxableVal,
        cessAmount,
        cgst,
        sgst,
        igst,
        taxPercent: 18,
        taxAmount: taxAmt,
      });
    }
  });

  return rows;
};

export const PURCHASE_ORDER_STAGES = [
  { id: "PO Created", label: "PO Created", color: "bg-slate-100 text-slate-800 border-slate-300", dot: "bg-slate-500" },
  { id: "Vendor Confirmed", label: "Vendor Confirmed", color: "bg-blue-100 text-blue-800 border-blue-300", dot: "bg-blue-600" },
  { id: "In Transit", label: "In Transit", color: "bg-indigo-100 text-indigo-800 border-indigo-300", dot: "bg-indigo-600" },
  { id: "Under Inspection", label: "Under Inspection", color: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-600" },
  { id: "Received & Stocked", label: "Received & Stocked", color: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-600" },
  { id: "Completed", label: "Completed", color: "bg-teal-100 text-teal-800 border-teal-300", dot: "bg-teal-600" },
  { id: "Cancelled", label: "Cancelled", color: "bg-rose-100 text-rose-800 border-rose-300", dot: "bg-rose-600" },
];

export const defaultInitialPurchases = [
  {
    _id: "pur-01",
    purchaseNo: "ARCL/PUR/26-27/01",
    billNo: "BORO-INV-8842",
    purchaseDate: "2026-04-15",
    vendorName: "Borosil Scientific Ltd",
    vendorLocation: "Andheri East, Mumbai, Maharashtra",
    vendorGstin: "27AAACB2345M1Z1",
    vendorPhone: "+91 9820123456",
    vendorEmail: "sales@borosilscientific.com",
    warehouse: "Main Lab - Airoli / Navi Mumbai",
    deliveryStatus: "RECEIVED",
    orderStage: "Received & Stocked",
    category: "Glassware",
    items: [
      {
        itemName: "Measuring Cylinder 1000ml Class A",
        description: "Heavy Duty Borosilicate Glass with Hexagonal Base",
        category: "Glassware",
        qty: 5,
        unit: "NOS",
        rate: 650,
        taxRate: 18,
        amount: 3835,
      },
      {
        itemName: "Volumetric Flask 500ml with Poly Stopper",
        description: "Grade A Calibration Grade Glassware",
        category: "Glassware",
        qty: 4,
        unit: "NOS",
        rate: 520,
        taxRate: 18,
        amount: 2454.4,
      },
    ],
    subtotal: 5330,
    taxAmount: 959.4,
    totalAmount: 6289.4,
    paymentMode: "UPI",
    paymentStatus: "Paid",
    paidAmount: 6289.4,
    dueAmount: 0,
    payments: [
      {
        installmentNo: 1,
        amount: 6289.4,
        paymentDate: "2026-04-15",
        paymentMode: "UPI",
        transactionRef: "UPI/410589632145",
        notes: "Full Instant UPI Settlement",
      },
    ],
    paymentDate: "2026-04-15",
    transactionRef: "UPI/410589632145",
    notes: "Official laboratory glassware inward for metrological inspection.",
  },
  {
    _id: "pur-02",
    purchaseNo: "ARCL/PUR/26-27/02",
    billNo: "MITU-2026-092",
    purchaseDate: "2026-04-10",
    vendorName: "Mitutoyo South Asia Pvt Ltd",
    vendorLocation: "Kandivali West, Mumbai, Maharashtra",
    vendorGstin: "27AABCM6789D1Z5",
    vendorPhone: "+91 9821987654",
    vendorEmail: "support@mitutoyoindia.com",
    warehouse: "Main Lab - Airoli / Navi Mumbai",
    deliveryStatus: "RECEIVED",
    orderStage: "Received & Stocked",
    category: "Calibration Standards",
    items: [
      {
        itemName: "Caliper Checker 300mm Master Reference Block",
        description: "Grade 0 Reference Standard with NPL Traceability",
        category: "Calibration Standards",
        qty: 1,
        unit: "SET",
        rate: 120000,
        taxRate: 18,
        amount: 141600,
      },
      {
        itemName: "Standard Gauge Block Set (103 Pcs Grade 1 Tungsten)",
        description: "High-precision Tungsten Carbide alloy master standards",
        category: "Calibration Standards",
        qty: 1,
        unit: "SET",
        rate: 134237.29,
        taxRate: 18,
        amount: 158400,
      },
    ],
    subtotal: 254237.29,
    taxAmount: 45762.71,
    totalAmount: 300000,
    paymentMode: "Net Banking",
    paymentStatus: "Paid",
    paidAmount: 300000,
    dueAmount: 0,
    payments: [
      {
        installmentNo: 1,
        amount: 100000,
        paymentDate: "2026-04-10",
        paymentMode: "Net Banking",
        transactionRef: "NEFT-HDFC-993821094",
        notes: "1st Advance Payment (33.3%)",
      },
      {
        installmentNo: 2,
        amount: 100000,
        paymentDate: "2026-04-18",
        paymentMode: "UPI",
        transactionRef: "UPI/410589632145",
        notes: "2nd Material Inward Delivery Payment (33.3%)",
      },
      {
        installmentNo: 3,
        amount: 100000,
        paymentDate: "2026-04-22",
        paymentMode: "Cheque",
        transactionRef: "CHQ-008192-HDFC",
        notes: "3rd Final Balance Payment Cleared (100% Settled)",
      },
    ],
    paymentDate: "2026-04-10",
    transactionRef: "NEFT-HDFC-993821094",
    notes: "Reference standard equipment purchased for NABL Lab CC-4313 metrology extension.",
  },
  {
    _id: "pur-03",
    purchaseNo: "ARCL/PUR/26-27/03",
    billNo: "SIGMA-INV-4412",
    purchaseDate: "2026-04-20",
    vendorName: "Sigma-Aldrich Chemicals Pvt Ltd",
    vendorLocation: "MIDC Rabale, Navi Mumbai, Maharashtra",
    vendorGstin: "27AABCS1234F1Z8",
    vendorPhone: "+91 9820556677",
    vendorEmail: "orders@sigmaaldrich.in",
    warehouse: "Main Lab - Airoli / Navi Mumbai",
    deliveryStatus: "ORDERED",
    orderStage: "In Transit",
    category: "Reagents & Chemicals",
    items: [
      {
        itemName: "Buffer Solution pH 4.00, 7.00 & 10.01 NIST Traceable (500ml x 3)",
        description: "Certified reference buffer solutions for electrode calibration",
        category: "Reagents & Chemicals",
        qty: 2,
        unit: "SET",
        rate: 3400,
        taxRate: 18,
        amount: 8024,
      },
      {
        itemName: "Standard Conductivity Solution 1413 µS/cm (500ml)",
        description: "Electrolytic conductivity primary standard",
        category: "Reagents & Chemicals",
        qty: 3,
        unit: "NOS",
        rate: 1850,
        taxRate: 18,
        amount: 6549,
      },
    ],
    subtotal: 12350,
    taxAmount: 2223,
    totalAmount: 14573,
    paymentMode: "UPI",
    paymentStatus: "Paid",
    paidAmount: 14573,
    dueAmount: 0,
    payments: [
      {
        installmentNo: 1,
        amount: 14573,
        paymentDate: "2026-04-20",
        paymentMode: "UPI",
        transactionRef: "UPI/902188410293",
        notes: "Full UPI Payment",
      },
    ],
    paymentDate: "2026-04-20",
    transactionRef: "UPI/902188410293",
    notes: "Standard chemicals inward for chemical calibration testing bench.",
  },
];
