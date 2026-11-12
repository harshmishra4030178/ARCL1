import mongoose from "mongoose";
import PurchaseRecord from "../models/PurchaseRecord.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { generatePurchaseInvoicePdf } from "../utils/pdfService.js";
import { saveGstRecord } from "../services/gstService.js";
import {
  syncPurchaseInward,
  syncPurchaseUpdate,
  syncPurchaseRevert,
} from "../services/inventorySyncService.js";

const isValidMongoId = (id) => {
  return Boolean(id && typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id);
};

const escapeRegex = (s) => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Seed realistic initial purchase records if collection is completely empty
const initialSeedPurchases = [
  {
    purchaseNo: "ARCL/PUR/26-27/01",
    billNo: "BORO-INV-8842",
    purchaseDate: new Date("2026-04-15"),
    vendorName: "Borosil Scientific Ltd",
    vendorLocation: "Andheri East, Mumbai, Maharashtra",
    vendorGstin: "27AAACB2345M1Z1",
    vendorPhone: "+91 9820123456",
    vendorEmail: "sales@borosilscientific.com",
    category: "Glassware",
    items: [
      { itemName: "Measuring Cylinder 1000ml Class A", description: "Heavy Duty Borosilicate Glass with Hexagonal Base", category: "Glassware", qty: 5, unit: "NOS", rate: 650, taxRate: 18, amount: 3835 },
      { itemName: "Volumetric Flask 500ml with Poly Stopper", description: "Grade A Calibration Grade Glassware", category: "Glassware", qty: 4, unit: "NOS", rate: 520, taxRate: 18, amount: 2454.40 },
    ],
    subtotal: 5330,
    taxAmount: 959.40,
    totalAmount: 6289.40,
    paymentMode: "UPI",
    paymentStatus: "Paid",
    paidAmount: 6289.40,
    paymentDate: new Date("2026-04-15"),
    transactionRef: "UPI/410589632145",
    notes: "Official laboratory glassware inward for metrological inspection.",
  },
  {
    purchaseNo: "ARCL/PUR/26-27/02",
    billNo: "MITU-2026-092",
    purchaseDate: new Date("2026-04-18"),
    vendorName: "Mitutoyo South Asia Pvt Ltd",
    vendorLocation: "Kandivali West, Mumbai, Maharashtra",
    vendorGstin: "27AABCM6789D1Z5",
    vendorPhone: "+91 9821987654",
    vendorEmail: "support@mitutoyoindia.com",
    category: "Calibration Standards",
    items: [
      { itemName: "Caliper Checker 300mm Master Reference Block", description: "Grade 0 Reference Standard with NPL Traceability", category: "Calibration Standards", qty: 1, unit: "NOS", rate: 22000, taxRate: 18, amount: 25960 },
      { itemName: "Standard Gauge Block Set (103 Pcs Grade 1)", description: "Tungsten Carbide Alloy master standards", category: "Calibration Standards", qty: 1, unit: "SET", rate: 38000, taxRate: 18, amount: 44840 },
    ],
    subtotal: 60000,
    taxAmount: 10800,
    totalAmount: 70800,
    paymentMode: "Net Banking / NEFT",
    paymentStatus: "Paid",
    paidAmount: 70800,
    paymentDate: new Date("2026-04-18"),
    transactionRef: "NEFT-HDFC26110984",
    notes: "Reference standard equipment purchased for NABL Lab CC-4313 metrology extension.",
  },
  {
    purchaseNo: "ARCL/PUR/26-27/03",
    billNo: "SIGMA-INV-4412",
    purchaseDate: new Date("2026-04-20"),
    vendorName: "Sigma-Aldrich Chemicals Pvt Ltd",
    vendorLocation: "MIDC Rabale, Navi Mumbai, Maharashtra",
    vendorGstin: "27AABCS1234F1Z8",
    vendorPhone: "+91 9833445566",
    vendorEmail: "orders@sigmaaldrich.in",
    category: "Chemicals & Reagents",
    items: [
      { itemName: "Hydraulic Oil ISO VG 68 (20 Litre Drum)", description: "High-grade hydraulic fluid for CTM Machine pressure lines", category: "Consumables", qty: 2, unit: "DRUM", rate: 4200, taxRate: 18, amount: 9912 },
      { itemName: "Standard Buffer Solutions pH 4.0, 7.0, 10.0", description: "Traceable metrological buffer calibration liquids", category: "Chemicals & Reagents", qty: 3, unit: "BOTTLE", rate: 850, taxRate: 18, amount: 3009 },
    ],
    subtotal: 10950,
    taxAmount: 1971,
    totalAmount: 12921,
    paymentMode: "UPI",
    paymentStatus: "Paid",
    paidAmount: 12921,
    paymentDate: new Date("2026-04-20"),
    transactionRef: "UPI/411299884512",
    notes: "Monthly lab consumable reagents and hydraulic oils inward.",
  },
  {
    purchaseNo: "ARCL/PUR/26-27/04",
    billNo: "AVERY-B-7128",
    purchaseDate: new Date("2026-04-21"),
    vendorName: "Avery Weigh-Tronix India Ltd",
    vendorLocation: "Wagle Estate, Thane, Maharashtra",
    vendorGstin: "27AAACA9988G1ZQ",
    vendorPhone: "+91 9819001122",
    vendorEmail: "support@averyweigh-tronix.com",
    category: "Lab Equipment",
    items: [
      { itemName: "F1 Class Cast Iron Test Weights Set (1mg to 5kg)", description: "Certified standard weights for balance metrology", category: "Lab Equipment", qty: 1, unit: "SET", rate: 16500, taxRate: 18, amount: 19470 },
    ],
    subtotal: 16500,
    taxAmount: 2970,
    totalAmount: 19470,
    paymentMode: "Cheque / DD",
    paymentStatus: "Paid",
    paidAmount: 19470,
    paymentDate: new Date("2026-04-21"),
    transactionRef: "CHQ-004821",
    notes: "Delivered at ARCL Airoli Metrology Lab with original manufacturer calibration certificate.",
  },
  {
    purchaseNo: "ARCL/PUR/26-27/05",
    billNo: "SEC-PRINT-119",
    purchaseDate: new Date("2026-04-22"),
    vendorName: "SecurePrint Solutions & Holograms",
    vendorLocation: "Sector 8A, Airoli, Navi Mumbai",
    vendorGstin: "27AAZCS4455P1ZU",
    vendorPhone: "+91 8369458583",
    vendorEmail: "print@secureprint.in",
    category: "Consumables",
    items: [
      { itemName: "NABL QR Holographic Calibration Stickers (Pack of 500)", description: "Tamper-evident holographic security seals", category: "Consumables", qty: 2, unit: "PACK", rate: 1800, taxRate: 18, amount: 4248 },
      { itemName: "Certificate High-Bond Watermark Papers (1000 Sheets)", description: "Official 120 GSM tamper-proof certificate sheets", category: "Consumables", qty: 1, unit: "BOX", rate: 2500, taxRate: 18, amount: 2950 },
    ],
    subtotal: 6100,
    taxAmount: 1098,
    totalAmount: 7198,
    paymentMode: "Cash",
    paymentStatus: "Paid",
    paidAmount: 7198,
    paymentDate: new Date("2026-04-22"),
    transactionRef: "CASH-RCPT-26-09",
    notes: "Security stickers & certificates stationary inward.",
  },
];

// Helper to calculate sequential purchase number (ARCL/PUR/26-27/01, 02, ...)
export const computeNextPurchaseNo = async () => {
  try {
    const count = await PurchaseRecord.countDocuments();
    const pad = String(count + 1).padStart(2, "0");
    return `ARCL/PUR/26-27/${pad}`;
  } catch (e) {
    return `ARCL/PUR/26-27/01`;
  }
};

// 1. Get All Purchases with Search & Filters
export const getPurchases = async (req, res, next) => {
  try {
    const existingCount = await PurchaseRecord.countDocuments();
    if (existingCount === 0) {
      await PurchaseRecord.insertMany(initialSeedPurchases);
    }

    const { search, category, paymentMode, paymentStatus, deliveryStatus, orderStage, warehouse, fromDate, toDate, page = 1, limit = 1000 } = req.query;

    const query = {};

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { purchaseNo: { $regex: escapeRegex(q), $options: "i" } },
        { billNo: { $regex: escapeRegex(q), $options: "i" } },
        { vendorName: { $regex: escapeRegex(q), $options: "i" } },
        { vendorLocation: { $regex: escapeRegex(q), $options: "i" } },
        { warehouse: { $regex: escapeRegex(q), $options: "i" } },
        { deliveryStatus: { $regex: escapeRegex(q), $options: "i" } },
        { orderStage: { $regex: escapeRegex(q), $options: "i" } },
        { category: { $regex: escapeRegex(q), $options: "i" } },
        { paymentMode: { $regex: escapeRegex(q), $options: "i" } },
        { transactionRef: { $regex: escapeRegex(q), $options: "i" } },
        { "items.itemName": { $regex: escapeRegex(q), $options: "i" } },
      ];
    }

    if (orderStage && orderStage !== "all") {
      query.orderStage = { $regex: `^${escapeRegex(orderStage)}$`, $options: "i" };
    }

    if (category && category !== "all") {
      query.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
    }

    if (paymentMode && paymentMode !== "all") {
      query.paymentMode = { $regex: `^${escapeRegex(paymentMode)}$`, $options: "i" };
    }

    if (paymentStatus && paymentStatus !== "all") {
      query.paymentStatus = { $regex: `^${escapeRegex(paymentStatus)}$`, $options: "i" };
    }

    if (deliveryStatus && deliveryStatus !== "all") {
      query.deliveryStatus = { $regex: `^${escapeRegex(deliveryStatus)}$`, $options: "i" };
    }

    if (warehouse && warehouse !== "all") {
      query.warehouse = { $regex: escapeRegex(warehouse), $options: "i" };
    }

    if (fromDate || toDate) {
      query.purchaseDate = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.purchaseDate.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.purchaseDate.$lte = end;
      }
    }

    const purchases = await PurchaseRecord.find(query).sort({ purchaseDate: -1, createdAt: -1 });

    // Compute live stats across all purchases
    const allRecords = await PurchaseRecord.find();
    let totalPurchases = allRecords.length;
    let totalSpent = 0;
    let totalPaid = 0;
    let totalPending = 0;

    allRecords.forEach((p) => {
      const tot = Number(p.totalAmount) || 0;
      const pd = Number(p.paidAmount !== undefined ? p.paidAmount : (p.paymentStatus === "Paid" ? tot : 0));
      totalSpent += tot;
      totalPaid += pd;
      totalPending += Math.max(0, tot - pd);
    });

    const stats = {
      totalPurchases,
      totalSpent: Math.round(totalSpent),
      totalPaid: Math.round(totalPaid),
      totalPending: Math.round(totalPending),
    };

    return res.status(200).json(
      new ApiResponse(200, { purchases, count: purchases.length, stats }, "Purchases retrieved successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 2. Get Purchase Stats
export const getPurchaseStats = async (req, res, next) => {
  try {
    const allRecords = await PurchaseRecord.find();
    let totalSpent = 0;
    let totalPaid = 0;
    let totalPending = 0;
    const categoryCount = {};

    allRecords.forEach((p) => {
      const tot = Number(p.totalAmount) || 0;
      const pd = Number(p.paidAmount !== undefined ? p.paidAmount : (p.paymentStatus === "Paid" ? tot : 0));
      totalSpent += tot;
      totalPaid += pd;
      totalPending += Math.max(0, tot - pd);
      const cat = p.category || "General";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalPurchases: allRecords.length,
          totalSpent: Math.round(totalSpent),
          totalPaid: Math.round(totalPaid),
          totalPending: Math.round(totalPending),
          categoryBreakdown: categoryCount,
        },
        "Purchase stats retrieved successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

// 3. Create a New Purchase Record
export const createPurchase = async (req, res, next) => {
  try {
    const data = req.body || {};

    if (!data.vendorName || !data.vendorName.trim()) {
      throw new ApiError(400, "Vendor / Supplier name is required (kaha se kharida)");
    }

    if (!data.purchaseNo || !data.purchaseNo.trim()) {
      data.purchaseNo = await computeNextPurchaseNo();
    }

    // Compute line item totals
    const items = Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : [
          {
            itemName: data.itemName || "Lab Consumable Item",
            description: data.description || "",
            category: data.category || "Lab Equipment",
            qty: Number(data.qty) || 1,
            unit: data.unit || "NOS",
            rate: Number(data.rate) || Number(data.totalAmount) || 1000,
            taxRate: Number(data.taxRate) || 18,
            amount: Number(data.totalAmount) || 1000,
          },
        ];

    let subtotal = 0;
    let taxAmount = 0;
    items.forEach((it) => {
      const q = Number(it.qty) || 1;
      const r = Number(it.rate) || 0;
      const tPct = Number(it.taxRate) || 18;
      const base = q * r;
      const tax = base * (tPct / 100);
      it.amount = base + tax;
      subtotal += base;
      taxAmount += tax;
    });

    const totalAmount = data.totalAmount !== undefined && Number(data.totalAmount) > 0
      ? Number(data.totalAmount)
      : Math.round(subtotal + taxAmount);

    let payments = Array.isArray(data.payments) && data.payments.length > 0 ? data.payments : [];
    if (payments.length > 0) {
      payments = payments.map((p, idx) => ({
        installmentNo: p.installmentNo || idx + 1,
        amount: Number(p.amount) || 0,
        paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
        paymentMode: p.paymentMode || data.paymentMode || "UPI",
        transactionRef: p.transactionRef || "",
        notes: p.notes || "",
      }));
    } else if (Number(data.paidAmount) > 0 || data.paymentStatus === "Paid") {
      payments = [
        {
          installmentNo: 1,
          amount: Number(data.paidAmount) || totalAmount,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          paymentMode: data.paymentMode || "UPI",
          transactionRef: data.transactionRef || "",
          notes: "Full / Advance Payment",
        },
      ];
    }

    const paidAmount = payments.length > 0
      ? payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      : (data.paidAmount !== undefined ? Number(data.paidAmount) : (data.paymentStatus === "Paid" ? totalAmount : 0));
    const dueAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = paidAmount >= totalAmount ? "Paid" : (paidAmount > 0 ? "Partial" : "Pending");

    const newRecord = new PurchaseRecord({
      ...data,
      items,
      payments,
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      totalAmount,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMode: payments.length > 0 ? payments[payments.length - 1].paymentMode : (data.paymentMode || "UPI"),
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
    });

    await newRecord.save();

    // Auto-sync inward goods into Inventory Management & Stock Movements
    try {
      await syncPurchaseInward(newRecord);
    } catch (syncErr) {
      console.warn("Auto-sync purchase to inventory notice:", syncErr.message);
    }

    if (newRecord.vendorGstin && newRecord.vendorName) {
      saveGstRecord({
        gstin: newRecord.vendorGstin,
        legalName: newRecord.vendorName,
        tradeName: newRecord.vendorName,
        addr: newRecord.vendorLocation,
        state: newRecord.placeOfSupply,
        source: "purchase",
      }).catch((e) => console.warn("Failed to auto-cache purchase GST record:", e.message));
    }

    return res.status(201).json(
      new ApiResponse(201, newRecord, "Purchase record created successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 4. Update an Existing Purchase Record
export const updatePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidMongoId(id)) {
      throw new ApiError(400, "Invalid purchase record ID");
    }

    const existing = await PurchaseRecord.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Purchase record not found");
    }

    const data = req.body || {};

    if (Array.isArray(data.items) && data.items.length > 0) {
      let subtotal = 0;
      let taxAmount = 0;
      data.items.forEach((it) => {
        const q = Number(it.qty) || 1;
        const r = Number(it.rate) || 0;
        const tPct = Number(it.taxRate) || 18;
        const base = q * r;
        const tax = base * (tPct / 100);
        it.amount = base + tax;
        subtotal += base;
        taxAmount += tax;
      });
      data.subtotal = Math.round(subtotal);
      data.taxAmount = Math.round(taxAmount);
      if (!data.totalAmount || Number(data.totalAmount) === 0) {
        data.totalAmount = Math.round(subtotal + taxAmount);
      }
    }

    const totalAmount = Number(data.totalAmount) || 0;

    if (Array.isArray(data.payments)) {
      data.payments = data.payments.map((p, idx) => ({
        installmentNo: p.installmentNo || idx + 1,
        amount: Number(p.amount) || 0,
        paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
        paymentMode: p.paymentMode || data.paymentMode || "UPI",
        transactionRef: p.transactionRef || "",
        notes: p.notes || "",
      }));
      const paid = data.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      data.paidAmount = paid;
      data.dueAmount = Math.max(0, totalAmount - paid);
      data.paymentStatus = paid >= totalAmount ? "Paid" : (paid > 0 ? "Partial" : "Pending");
      if (data.payments.length > 0) {
        data.paymentMode = data.payments[data.payments.length - 1].paymentMode;
        data.transactionRef = data.payments.map((p) => p.transactionRef).filter(Boolean).join(", ") || data.transactionRef;
      }
    } else if (data.paidAmount !== undefined) {
      const paid = Number(data.paidAmount) || 0;
      data.dueAmount = Math.max(0, totalAmount - paid);
      data.paymentStatus = paid >= totalAmount ? "Paid" : (paid > 0 ? "Partial" : "Pending");
    }

    const updated = await PurchaseRecord.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });

    if (!updated) {
      throw new ApiError(404, "Purchase record not found");
    }

    // Auto-sync updated items to Inventory Management
    try {
      await syncPurchaseUpdate(existing, updated);
    } catch (syncErr) {
      console.warn("Auto-sync purchase update notice:", syncErr.message);
    }

    if (updated.vendorGstin && updated.vendorName) {
      saveGstRecord({
        gstin: updated.vendorGstin,
        legalName: updated.vendorName,
        tradeName: updated.vendorName,
        addr: updated.vendorLocation,
        state: updated.placeOfSupply,
        source: "purchase",
      }).catch((e) => console.warn("Failed to auto-cache updated purchase GST record:", e.message));
    }

    return res.status(200).json(
      new ApiResponse(200, updated, "Purchase record updated successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 5. Delete a Purchase Record
export const deletePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidMongoId(id)) {
      throw new ApiError(400, "Invalid purchase record ID");
    }

    const deleted = await PurchaseRecord.findByIdAndDelete(id);
    if (!deleted) {
      throw new ApiError(404, "Purchase record not found");
    }

    // Auto-revert deleted purchase from Inventory stock
    try {
      await syncPurchaseRevert(deleted);
    } catch (syncErr) {
      console.warn("Auto-sync purchase deletion notice:", syncErr.message);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Purchase record deleted successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 6. Download Purchase Invoice & Inward Expense Voucher PDF
export const downloadPurchasePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const queryId = req.query.id || req.query.purchaseId || id;
    let purchase = null;

    if (queryId && isValidMongoId(queryId)) {
      purchase = await PurchaseRecord.findById(queryId).lean();
    }
    if (!purchase && req.query.purchaseNo) {
      purchase = await PurchaseRecord.findOne({ purchaseNo: req.query.purchaseNo }).lean();
    }
    if (!purchase && req.query.data) {
      try {
        purchase = JSON.parse(req.query.data);
      } catch (e) {}
    }

    if (!purchase) {
      let parsedItems = [];
      try {
        parsedItems = req.query.items ? JSON.parse(req.query.items) : [];
      } catch (e) {}

      let parsedPayments = [];
      try {
        parsedPayments = req.query.payments ? JSON.parse(req.query.payments) : [];
      } catch (e) {}

      purchase = {
        purchaseNo: req.query.purchaseNo || "ARCL/PUR/26-27/01",
        billNo: req.query.billNo || "INV-001",
        purchaseDate: req.query.purchaseDate || new Date(),
        vendorName: req.query.vendorName || "Borosil Scientific Ltd",
        vendorLocation: req.query.vendorLocation || "Andheri East, Mumbai",
        vendorGstin: req.query.vendorGstin || "27AAACB2345M1Z1",
        vendorPhone: req.query.vendorPhone || "+91 9820123456",
        vendorEmail: req.query.vendorEmail || "sales@borosilscientific.com",
        category: req.query.category || "Glassware",
        items: parsedItems.length > 0 ? parsedItems : [
          { itemName: "Laboratory Equipment & Standards", qty: 1, unit: "NOS", rate: 5000, taxRate: 18, amount: 5900 }
        ],
        subtotal: Number(req.query.subtotal) || 5000,
        taxAmount: Number(req.query.taxAmount) || 900,
        totalAmount: Number(req.query.totalAmount) || 5900,
        paidAmount: Number(req.query.paidAmount) || 5900,
        dueAmount: Number(req.query.dueAmount) || 0,
        paymentMode: req.query.paymentMode || "UPI",
        paymentStatus: req.query.paymentStatus || "Paid",
        payments: parsedPayments,
        transactionRef: req.query.transactionRef || "UPI/410589632145",
      };
    }

    const pdfBuffer = await generatePurchaseInvoicePdf(purchase);
    const safePurchaseNo = (purchase.purchaseNo || "ARCL_PUR").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Purchase_Invoice_${safePurchaseNo}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });

    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
