import SalesQuotation from "../../models/SalesQuotation.js";
import SalesSrf from "../../models/SalesSrf.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import cloudinary from "../../config/cloudinary.js";
import mongoose from "mongoose";
import {
  generateQuotationPdf,
  generateSrfSlipPdf,
  generateProformaInvoicePdf,
  generateTaxInvoicePdf,
} from "../../utils/pdfService.js";
import Product from "../../models/product.js";
import Category from "../../models/category.js";
import EquipmentType from "../../models/equipmentType.js";
import Inventory from "../../models/Inventory.js";
import {
  syncSalesOutward,
  syncSalesUpdate,
  syncSalesRevert,
} from "../../services/inventorySyncService.js";

const escapeRegex = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Upload buffer helper for PO attachments (returns guaranteed self-contained data URI)
 */
const uploadBufferToCloudinary = async (fileBuffer, mimetype, originalname = "sales_po.pdf") => {
  const mime = mimetype || (originalname.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:${mime};base64,${base64}`;

  try {
    const cleanPublicId = `SALES_PO_${Date.now()}_${originalname.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "sales_po",
          resource_type: "raw",
          public_id: cleanPublicId,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url);
        }
      );
      stream.end(fileBuffer);
    });
  } catch (cloudErr) {
    console.warn("Cloudinary sales PO sync notice:", cloudErr.message);
  }

  return dataUri;
};

// ==========================================
// 1. SALES QUOTATIONS CONTROLLERS
// ==========================================

export const getSalesQuotations = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 100 } = req.query;
  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    const regex = new RegExp(term, "i");
    query.$or = [
      { quotationNo: regex },
      { clientCompany: regex },
      { clientContactPerson: regex },
      { clientPhone: regex },
      { clientGst: regex },
      { "items.itemName": regex },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [quotations, totalCount] = await Promise.all([
    SalesQuotation.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    SalesQuotation.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { quotations, totalCount, page: parseInt(page), limit: parseInt(limit) },
      "Sales quotations fetched successfully"
    )
  );
});

export const createSalesQuotation = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Auto-generate sequential quotation number if not provided
  let qNo = body.quotationNo;
  if (!qNo || qNo.trim() === "") {
    const count = await SalesQuotation.countDocuments();
    const seq = String(count + 1).padStart(2, "0");
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);
    qNo = `ARCL/SQ/${currentYear}-${nextYear}/${seq}`;
  }

  // Recalculate financial breakdown
  const rawItems = Array.isArray(body.items) ? body.items : [];
  let taxable = 0;
  const items = rawItems.map((it, idx) => {
    const qty = parseFloat(it.qty) || 1;
    const rate = parseFloat(it.rate) || 0;
    const amt = qty * rate;
    taxable += amt;
    return {
      itemNo: it.itemNo || idx + 1,
      itemName: it.itemName || `Item ${idx + 1}`,
      description: it.description || "",
      specifications: Array.isArray(it.specifications)
        ? it.specifications.map((s) => String(s || "").trim()).filter(Boolean)
        : typeof it.specifications === "string" && it.specifications.trim()
        ? it.specifications.split("\n").map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
        : [],
      productImage: it.productImage || "",
      hsnSac: it.hsnSac || "998346",
      make: it.make || "ARCL",
      modelNo: it.modelNo || "",
      qty,
      qtyUnit: it.qtyUnit || "NOS",
      rate,
      taxRate: parseFloat(it.taxRate) || 18,
      amount: amt,
    };
  });

  const cgstRate = parseFloat(body.cgstRate ?? 9);
  const sgstRate = parseFloat(body.sgstRate ?? 9);
  const igstRate = parseFloat(body.igstRate ?? 0);

  const cgstAmount = Math.round(((taxable * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxable * sgstRate) / 100) * 100) / 100;
  const igstAmount = Math.round(((taxable * igstRate) / 100) * 100) / 100;
  const totalRaw = taxable + cgstAmount + sgstAmount + igstAmount;
  const roundOff = Math.round((Math.round(totalRaw) - totalRaw) * 100) / 100;
  const totalAmount = Math.round(totalRaw);

  const quotation = await SalesQuotation.create({
    ...body,
    quotationNo: qNo,
    items,
    taxableAmount: taxable,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOff,
    totalAmount,
    status: body.status || "Draft",
  });

  return res.status(201).json(
    new ApiResponse(201, quotation, "Sales quotation created successfully")
  );
});

export const updateSalesQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid Quotation ID");
  }

  const existing = await SalesQuotation.findById(id);
  if (!existing) {
    throw new ApiError(404, "Sales quotation not found");
  }

  const body = req.body || {};

  // Recalculate totals if items or rates were sent
  let taxable = 0;
  let items = existing.items;
  if (Array.isArray(body.items)) {
    items = body.items.map((it, idx) => {
      const qty = parseFloat(it.qty) || 1;
      const rate = parseFloat(it.rate) || 0;
      const amt = qty * rate;
      taxable += amt;
      return {
        itemNo: it.itemNo || idx + 1,
        itemName: it.itemName || `Item ${idx + 1}`,
        description: it.description || "",
        productImage: it.productImage || "",
        hsnSac: it.hsnSac || "998346",
        make: it.make || "ARCL",
        modelNo: it.modelNo || "",
        qty,
        qtyUnit: it.qtyUnit || "NOS",
        rate,
        taxRate: parseFloat(it.taxRate) || 18,
        amount: amt,
      };
    });
  } else {
    items.forEach((it) => {
      taxable += (parseFloat(it.qty) || 1) * (parseFloat(it.rate) || 0);
    });
  }

  const cgstRate = parseFloat(body.cgstRate ?? existing.cgstRate ?? 9);
  const sgstRate = parseFloat(body.sgstRate ?? existing.sgstRate ?? 9);
  const igstRate = parseFloat(body.igstRate ?? existing.igstRate ?? 0);

  const cgstAmount = Math.round(((taxable * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxable * sgstRate) / 100) * 100) / 100;
  const igstAmount = Math.round(((taxable * igstRate) / 100) * 100) / 100;
  const totalRaw = taxable + cgstAmount + sgstAmount + igstAmount;
  const roundOff = Math.round((Math.round(totalRaw) - totalRaw) * 100) / 100;
  const totalAmount = Math.round(totalRaw);

  const updated = await SalesQuotation.findByIdAndUpdate(
    id,
    {
      ...body,
      items,
      taxableAmount: taxable,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      roundOff,
      totalAmount,
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, updated, "Sales quotation updated successfully")
  );
});

export const deleteSalesQuotation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid Quotation ID");
  }

  const deleted = await SalesQuotation.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Sales quotation not found");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Sales quotation deleted successfully")
  );
});

// ==========================================
// 2. SALES SRF & COMMERCIAL ORDERS CONTROLLERS
// ==========================================

export const getSalesSrfs = asyncHandler(async (req, res) => {
  const { search, stage, paymentStatus, page = 1, limit = 100 } = req.query;
  const query = {};

  if (stage && stage !== "all") {
    query.stage = stage;
  }

  if (paymentStatus && paymentStatus !== "all") {
    query["commercialDocs.paymentStatus"] = paymentStatus;
  }

  if (search && search.trim() !== "") {
    const term = search.trim();
    const regex = new RegExp(term, "i");
    query.$or = [
      { srfNo: regex },
      { dcNo: regex },
      { clientCompany: regex },
      { clientContactPerson: regex },
      { clientPhone: regex },
      { clientGst: regex },
      { "items.itemName": regex },
      { "items.serialNo": regex },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [srfs, totalCount] = await Promise.all([
    SalesSrf.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    SalesSrf.countDocuments(query),
  ]);

  // Ensure SRF items are strictly image-free (name and specifications only)
  const sanitizedSrfs = srfs.map((s) => {
    const sObj = s.toObject ? s.toObject() : s;
    if (Array.isArray(sObj.items)) {
      sObj.items = sObj.items.map((it) => ({ ...it, productImage: "" }));
    }
    return sObj;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { srfs: sanitizedSrfs, totalCount, page: parseInt(page), limit: parseInt(limit) },
      "Sales SRF records fetched successfully"
    )
  );
});

export const createSalesSrf = asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Auto-generate sequential SRF number & DC number
  const count = await SalesSrf.countDocuments();
  const seq = String(count + 1).padStart(2, "0");
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);

  const srfNo = body.srfNo || `SRF/SLS/${currentYear}-${nextYear}/${seq}`;
  const dcNo = body.dcNo || `DC/SLS/${currentYear}-${nextYear}/${seq}`;

  // Process items
  const rawItems = Array.isArray(body.items) && body.items.length > 0 ? body.items : [
    {
      itemNo: 1,
      itemName: body.itemName || "Standard Instrument",
      description: body.description || "",
      make: body.make || "ARCL",
      modelNo: body.modelNo || "",
      serialNo: body.serialNo || "",
      qty: 1,
      unit: "NOS",
      rate: body.rate || 0,
      taxRate: 18,
      amount: body.rate || 0,
    },
  ];

  let calculatedTotal = 0;
  const items = rawItems.map((it, idx) => {
    const qty = parseFloat(it.qty) || 1;
    const rate = parseFloat(it.rate) || 0;
    const amt = qty * rate;
    const tax = Math.round((amt * ((parseFloat(it.taxRate) || 18) / 100)) * 100) / 100;
    calculatedTotal += amt + tax;
    return {
      itemNo: it.itemNo || idx + 1,
      itemName: it.itemName || `Item ${idx + 1}`,
      description: it.description || "",
      specifications: Array.isArray(it.specifications)
        ? it.specifications.map((s) => String(s || "").trim()).filter(Boolean)
        : typeof it.specifications === "string" && it.specifications.trim()
        ? it.specifications.split("\n").map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
        : [],
      productImage: it.productImage || "",
      make: it.make || "ARCL",
      modelNo: it.modelNo || "",
      serialNo: it.serialNo || "",
      qty,
      unit: it.unit || "NOS",
      rate,
      taxRate: parseFloat(it.taxRate) || 18,
      amount: amt,
    };
  });

  const grandTotal = Math.round(parseFloat(body.commercialDocs?.totalAmount) || calculatedTotal);
  const initialPaid = parseFloat(body.commercialDocs?.paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - initialPaid);
  const paymentStatus =
    initialPaid >= grandTotal && grandTotal > 0
      ? "Paid"
      : initialPaid > 0
      ? "Partial"
      : "Pending";

  const defaultPayments = Array.isArray(body.commercialDocs?.payments) && body.commercialDocs.payments.length > 0
    ? body.commercialDocs.payments
    : initialPaid > 0
    ? [
        {
          installmentNo: 1,
          amount: initialPaid,
          paymentDate: new Date(),
          paymentMode: body.commercialDocs?.paymentMode || "UPI",
          transactionRef: body.commercialDocs?.transactionRef || "",
          notes: "Initial Down Payment / Booking",
        },
      ]
    : [];

  const commercialDocs = {
    poRaised: body.commercialDocs?.poRaised || "",
    poFileUrl: body.commercialDocs?.poFileUrl || "",
    poFileName: body.commercialDocs?.poFileName || "",
    poUploadedAt: body.commercialDocs?.poUploadedAt || null,
    proformaInvoice: body.commercialDocs?.proformaInvoice || "/docs/sample-pi.pdf",
    taxInvoice: body.commercialDocs?.taxInvoice || "/docs/sample-tax-invoice.pdf",
    paymentMode: body.commercialDocs?.paymentMode || "UPI",
    paymentStatus: body.commercialDocs?.paymentStatus || paymentStatus,
    totalAmount: grandTotal,
    paidAmount: initialPaid,
    dueAmount,
    transactionRef: body.commercialDocs?.transactionRef || "",
    payments: defaultPayments,
    paymentDate: body.commercialDocs?.paymentDate || new Date(),
  };

  const srf = await SalesSrf.create({
    ...body,
    srfNo,
    dcNo,
    items,
    commercialDocs,
    stage: body.stage || "Order Confirmed",
  });

  // Auto-sync sold goods outwards from Inventory Management & Stock Movements
  try {
    await syncSalesOutward(srf);
  } catch (syncErr) {
    console.warn("Auto-sync sales to inventory notice:", syncErr.message);
  }

  return res.status(201).json(
    new ApiResponse(201, srf, "Sales SRF & Order created successfully")
  );
});

export const updateSalesSrf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid SRF ID");
  }

  const existing = await SalesSrf.findById(id);
  if (!existing) {
    throw new ApiError(404, "Sales SRF record not found");
  }

  const body = req.body || {};

  const updated = await SalesSrf.findByIdAndUpdate(
    id,
    { ...body },
    { new: true }
  );

  // Auto-sync updated sales items in Inventory Management
  try {
    await syncSalesUpdate(existing, updated);
  } catch (syncErr) {
    console.warn("Auto-sync sales update notice:", syncErr.message);
  }

  return res.status(200).json(
    new ApiResponse(200, updated, "Sales SRF updated successfully")
  );
});

/**
 * Specifically updates Payment Mode, Status, and Installments
 */
export const updateSalesSrfPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid SRF ID");
  }

  const existing = await SalesSrf.findById(id);
  if (!existing) {
    throw new ApiError(404, "Sales SRF record not found");
  }

  const {
    totalAmount,
    paidAmount,
    dueAmount,
    paymentStatus,
    paymentMode,
    payments,
    transactionRef,
  } = req.body;

  const total = Number(totalAmount ?? existing.commercialDocs?.totalAmount ?? 0);
  const rawPayments = Array.isArray(payments) ? payments : existing.commercialDocs?.payments || [];

  // Compute total paid from payments array
  let computedPaid = 0;
  rawPayments.forEach((p) => {
    computedPaid += Number(p.amount) || 0;
  });

  const finalPaid = paidAmount !== undefined ? Number(paidAmount) : computedPaid;
  const finalDue = dueAmount !== undefined ? Number(dueAmount) : Math.max(0, total - finalPaid);

  let finalStatus = paymentStatus;
  if (!finalStatus) {
    finalStatus = finalDue <= 0 && total > 0 ? "Paid" : finalPaid > 0 ? "Partial" : "Pending";
  }

  existing.commercialDocs.totalAmount = total;
  existing.commercialDocs.paidAmount = finalPaid;
  existing.commercialDocs.dueAmount = finalDue;
  existing.commercialDocs.paymentStatus = finalStatus;
  if (paymentMode) existing.commercialDocs.paymentMode = paymentMode;
  if (transactionRef !== undefined) existing.commercialDocs.transactionRef = transactionRef;
  existing.commercialDocs.payments = rawPayments;
  existing.commercialDocs.paymentDate = new Date();

  await existing.save();

  return res.status(200).json(
    new ApiResponse(200, existing, "SRF payment installments updated successfully")
  );
});

/**
 * Advance SRF stage (1-click stage progression)
 */
export const advanceSalesSrfStage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid SRF ID");
  }

  const existing = await SalesSrf.findById(id);
  if (!existing) {
    throw new ApiError(404, "Sales SRF record not found");
  }

  const stages = [
    "Order Confirmed",
    "In Production / Packing",
    "Ready for Dispatch",
    "Dispatched",
    "Delivered",
  ];

  const currentIndex = stages.indexOf(existing.stage);
  const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : stages[stages.length - 1];

  existing.stage = nextStage;
  await existing.save();

  return res.status(200).json(
    new ApiResponse(200, existing, `Order stage advanced to ${nextStage}`)
  );
});

export const deleteSalesSrf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid SRF ID");
  }

  const deleted = await SalesSrf.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Sales SRF not found");
  }

  // Auto-restore stock from deleted sales order
  try {
    await syncSalesRevert(deleted);
  } catch (syncErr) {
    console.warn("Auto-sync sales revert notice:", syncErr.message);
  }

  return res.status(200).json(
    new ApiResponse(200, null, "Sales SRF deleted successfully")
  );
});

// ==========================================
// 3. PO DOCUMENT UPLOAD & DELETE
// ==========================================

export const uploadSalesPo = asyncHandler(async (req, res) => {
  const { srfId } = req.body;
  if (!req.file) {
    throw new ApiError(400, "Please select a valid PDF or document file to upload");
  }

  const fileUrl = await uploadBufferToCloudinary(
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );

  if (srfId && isValidMongoId(srfId)) {
    await SalesSrf.findByIdAndUpdate(srfId, {
      "commercialDocs.poRaised": fileUrl,
      "commercialDocs.poFileUrl": fileUrl,
      "commercialDocs.poFileName": req.file.originalname,
      "commercialDocs.poUploadedAt": new Date(),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { fileUrl, fileName: req.file.originalname, uploadedAt: new Date() },
      "PO document uploaded successfully"
    )
  );
});

export const deleteSalesPo = asyncHandler(async (req, res) => {
  const { srfId } = req.body;
  if (srfId && isValidMongoId(srfId)) {
    await SalesSrf.findByIdAndUpdate(srfId, {
      "commercialDocs.poRaised": "",
      "commercialDocs.poFileUrl": "",
      "commercialDocs.poFileName": "",
      "commercialDocs.poUploadedAt": null,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, null, "PO document deleted successfully")
  );
});

// ==========================================
// 4. CONVERT QUOTATION TO SRF ORDER
// ==========================================

export const convertQuotationToSrf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid Quotation ID");
  }

  const quotation = await SalesQuotation.findById(id);
  if (!quotation) {
    throw new ApiError(404, "Quotation not found");
  }

  const count = await SalesSrf.countDocuments();
  const seq = String(count + 1).padStart(2, "0");
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const nextYear = (new Date().getFullYear() + 1).toString().slice(-2);

  const srfNo = `SRF/SLS/${currentYear}-${nextYear}/${seq}`;
  const dcNo = `DC/SLS/${currentYear}-${nextYear}/${seq}`;

  const items = quotation.items.map((it, idx) => ({
    itemNo: idx + 1,
    itemName: it.itemName,
    description: it.description,
    specifications: Array.isArray(it.specifications) ? it.specifications : [],
    // In SRF, no product image is transferred - only equipment name and technical details:
    productImage: "",
    make: it.make || "ARCL",
    modelNo: it.modelNo || "",
    serialNo: "",
    qty: it.qty,
    unit: it.qtyUnit || "NOS",
    rate: it.rate,
    taxRate: it.taxRate || 18,
    amount: it.amount,
  }));

  const grandTotal = quotation.totalAmount || 0;

  const srf = await SalesSrf.create({
    srfNo,
    dcNo,
    orderDate: new Date(),
    challanDate: new Date(),
    deliveryDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    clientCompany: quotation.clientCompany,
    clientContactPerson: quotation.clientContactPerson,
    clientPhone: quotation.clientPhone,
    clientEmail: quotation.clientEmail,
    clientGst: quotation.clientGst,
    clientAddress: quotation.clientAddress || quotation.billingAddress,
    deliverySite: quotation.shippingAddress || quotation.clientAddress,
    quotationRef: quotation.quotationNo,
    quotationId: quotation._id,
    items,
    commercialDocs: {
      proformaInvoice: "/docs/sample-pi.pdf",
      taxInvoice: "/docs/sample-tax-invoice.pdf",
      paymentMode: "UPI",
      paymentStatus: "Pending",
      totalAmount: grandTotal,
      paidAmount: 0,
      dueAmount: grandTotal,
      payments: [],
      paymentDate: new Date(),
    },
    stage: "Order Confirmed",
  });

  quotation.convertedToSrf = true;
  quotation.srfId = srf._id;
  quotation.status = "Approved";
  await quotation.save();

  // Auto-sync converted sales order outward from Inventory Management
  try {
    await syncSalesOutward(srf);
  } catch (syncErr) {
    console.warn("Auto-sync converted sales quotation to inventory notice:", syncErr.message);
  }

  return res.status(201).json(
    new ApiResponse(201, srf, "Quotation converted to active Sales SRF order successfully")
  );
});

// ==========================================
// 5. SALES STATS & KPI METRICS
// ==========================================

export const getSalesStats = asyncHandler(async (req, res) => {
  const [quotationStats, srfStats] = await Promise.all([
    SalesQuotation.aggregate([
      {
        $group: {
          _id: null,
          totalQuotations: { $sum: 1 },
          totalQuotedValuation: { $sum: "$totalAmount" },
          approvedQuotations: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
          },
        },
      },
    ]),
    SalesSrf.aggregate([
      {
        $group: {
          _id: null,
          totalSrfs: { $sum: 1 },
          totalOrderValue: { $sum: "$commercialDocs.totalAmount" },
          totalPaid: { $sum: "$commercialDocs.paidAmount" },
          totalDue: { $sum: "$commercialDocs.dueAmount" },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$stage", "Delivered"] }, 1, 0] },
          },
          activeOrders: {
            $sum: { $cond: [{ $ne: ["$stage", "Delivered"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const q = quotationStats[0] || {
    totalQuotations: 0,
    totalQuotedValuation: 0,
    approvedQuotations: 0,
  };

  const s = srfStats[0] || {
    totalSrfs: 0,
    totalOrderValue: 0,
    totalPaid: 0,
    totalDue: 0,
    deliveredOrders: 0,
    activeOrders: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        quotations: q,
        srfs: s,
      },
      "Sales KPI stats fetched successfully"
    )
  );
});

/**
 * @desc Download Official ARCL Sales Quotation PDF (1:1 Calibration Design with Product Photos)
 * @route GET /api/v1/admin/sales/quotations/:id/download-pdf
 */
export const downloadSalesQuotationPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let quotation = null;
  if (isValidMongoId(id)) {
    quotation = await SalesQuotation.findById(id).lean();
  }
  if (!quotation) {
    quotation = await SalesQuotation.findOne({ quotationNo: id }).lean();
  }
  if (!quotation) {
    throw new ApiError(404, "Sales Quotation not found");
  }

  let needsDbUpdate = false;
  const items = await Promise.all(
    (quotation.items || []).map(async (it, idx) => {
      let img = (it.productImage || "").trim();
      if (!img) {
        const cleanName = (it.itemName || "").trim();
        if (cleanName) {
          const words = cleanName.split(/[\s-]+/).filter((w) => w.length > 2);
          const regexStr = words.length > 0 ? words.map((w) => escapeRegex(w)).join(".*") : escapeRegex(cleanName);
          const prod = await Product.findOne({
            $or: [
              { name: { $regex: new RegExp(escapeRegex(cleanName), "i") } },
              { name: { $regex: new RegExp(regexStr, "i") } },
            ],
          }).lean();
          if (prod?.images?.[0]) {
            img = prod.images[0];
            needsDbUpdate = true;
          } else {
            const inv = await Inventory.findOne({
              itemName: { $regex: new RegExp(escapeRegex(cleanName), "i") },
            }).lean();
            if (inv?.image || inv?.imageUrl) {
              img = inv.image || inv.imageUrl;
              needsDbUpdate = true;
            }
          }
        }
      }

      return {
        itemNo: it.itemNo || idx + 1,
        name: it.itemName,
        description: it.description || "",
        specifications: Array.isArray(it.specifications) ? it.specifications : [],
        subText: [
          it.description,
          (it.make || it.modelNo) ? `Make: ${it.make || "ARCL"} | Model: ${it.modelNo || "-"}` : "",
        ]
          .filter(Boolean)
          .join(" • "),
        productImage: img,
        hsnSac: it.hsnSac || "998346",
        qty: it.qty,
        qtyUnit: it.qtyUnit || "NOS",
        rate: it.rate,
        amount: it.amount || (it.qty * it.rate),
      };
    })
  );

  // If missing images were auto-discovered, update quotation record in MongoDB
  if (needsDbUpdate && quotation._id) {
    try {
      await SalesQuotation.updateOne(
        { _id: quotation._id },
        {
          $set: {
            items: (quotation.items || []).map((it, idx) => ({
              ...it,
              productImage: items[idx]?.productImage || it.productImage || "",
            })),
          },
        }
      );
    } catch (_) {}
  }

  const customData = {
    quotationNo: quotation.quotationNo,
    quotationDate: quotation.quotationDate,
    validityDate: quotation.validityDate,
    placeOfSupply: quotation.placeOfSupply || "27-MAHARASHTRA",
    billTo: {
      companyName: quotation.clientCompany,
      gstin: quotation.clientGst,
      address: quotation.clientAddress || quotation.billingAddress,
      phone: quotation.clientPhone,
      email: quotation.clientEmail,
      contactPerson: quotation.clientContactPerson,
    },
    items,
    terms: quotation.terms && quotation.terms.length > 0 ? quotation.terms : undefined,
  };

  const pdfBuffer = await generateQuotationPdf(customData);
  const safeQNo = String(quotation.quotationNo || "QTN").replace(/[^a-zA-Z0-9_-]/g, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${req.query.download === "true" ? "attachment" : "inline"}; filename="Quotation_${safeQNo}.pdf"`
  );
  return res.send(pdfBuffer);
});

/**
 * Universal Binary PDF Download & Print Endpoint for Sales SRF, PI, and Tax Invoice
 * Generates exact high-resolution vector PDF buffers matching ARCL calibration standard
 */
export const downloadSalesSrfDocumentPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const docType = String(req.query.docType || "srf").toLowerCase();

  let srf = null;
  if (isValidMongoId(id)) {
    srf = await SalesSrf.findById(id).lean();
  }
  if (!srf) {
    srf = await SalesSrf.findOne({
      $or: [{ srfNo: id }, { dcNo: id }],
    }).lean();
  }
  if (!srf) {
    throw new ApiError(404, "Sales SRF record not found");
  }

  // Map SRF items to standard format (No product image in SRF - only equipment name and scope)
  const mappedItems = (srf.items || []).map((it, idx) => ({
    itemNo: it.itemNo || idx + 1,
    instrument: it.itemName,
    itemName: it.itemName,
    description: it.description || (Array.isArray(it.specifications) ? it.specifications.join(" • ") : ""),
    specifications: it.specifications || [],
    productImage: "",
    make: it.make || "ARCL",
    modelNo: it.modelNo || "-",
    serialNo: it.serialNo || "-",
    qty: it.qty || 1,
    unit: it.unit || "NOS",
    qtyUnit: it.unit || "NOS",
    rate: it.rate || 0,
    taxRate: it.taxRate || 18,
    amount: it.amount || (it.qty * it.rate),
    total: it.amount || (it.qty * it.rate),
  }));

  let pdfBuffer;
  let filename = `${docType.toUpperCase()}_${String(srf.srfNo || "DOC").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  if (docType === "tax_invoice" || docType === "invoice") {
    const invData = {
      invoiceNo: `INV/${srf.srfNo?.replace(/^SRF\/?/i, "") || "26-27/01"}`,
      invoiceDate: srf.orderDate || new Date(),
      dueDate: srf.deliveryDueDate || new Date(),
      clientCompany: srf.clientCompany,
      clientGstin: srf.clientGst,
      clientAddress: srf.clientAddress,
      clientPhone: srf.clientPhone,
      clientEmail: srf.clientEmail,
      placeOfSupply: "27-MAHARASHTRA",
      items: mappedItems,
      taxableAmount: srf.totalAmount,
      totalGst: srf.gstAmount,
      grandTotal: srf.grandTotal,
    };
    pdfBuffer = await generateTaxInvoicePdf(invData);
    filename = `Tax_Invoice_${String(srf.srfNo || "INV").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  } else if (docType === "pi" || docType === "proforma_invoice") {
    const piData = {
      piNo: `PI/${srf.srfNo?.replace(/^SRF\/?/i, "") || "26-27/01"}`,
      piDate: srf.orderDate || new Date(),
      dueDate: srf.deliveryDueDate || new Date(),
      clientCompany: srf.clientCompany,
      clientGstin: srf.clientGst,
      clientAddress: srf.clientAddress,
      clientPhone: srf.clientPhone,
      clientEmail: srf.clientEmail,
      placeOfSupply: "27-MAHARASHTRA",
      items: mappedItems,
      taxableAmount: srf.totalAmount,
      totalGst: srf.gstAmount,
      grandTotal: srf.grandTotal,
    };
    pdfBuffer = await generateProformaInvoicePdf(piData);
    filename = `Proforma_Invoice_${String(srf.srfNo || "PI").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  } else {
    // Default: SRF Slip
    const srfData = {
      srfNo: srf.srfNo,
      dcNo: srf.dcNo,
      calibrationDate: srf.orderDate || new Date(),
      challanDate: srf.challanDate || srf.orderDate || new Date(),
      clientCompany: srf.clientCompany,
      clientContactPerson: srf.clientContactPerson,
      clientGst: srf.clientGst,
      clientAddress: srf.clientAddress,
      clientPhone: srf.clientPhone,
      deliverySite: srf.deliverySite,
      instruments: mappedItems,
      totalAmount: srf.totalAmount,
      gstAmount: srf.gstAmount,
      finalPayableAmount: srf.grandTotal,
    };
    pdfBuffer = await generateSrfSlipPdf(srfData);
    filename = `SRF_Slip_${String(srf.srfNo || "SRF").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${req.query.download === "true" ? "attachment" : "inline"}; filename="${filename}"`
  );
  return res.send(pdfBuffer);
});

/**
 * @desc    Create Custom Product from Quotation Scope (Cloudinary Photo & Internal Catalog)
 * @route   POST /api/v1/admin/sales/custom-product
 * @access  Admin
 */
export const createCustomQuotationProduct = asyncHandler(async (req, res) => {
  const {
    name,
    productCode,
    category,
    hsnCode,
    unit = "NOS",
    defaultRate = 0,
    taxRate = 18,
    description = "",
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Product name is required");
  }

  const cleanName = name.trim();
  let imageUrl = "";

  // 1. Upload image to Cloudinary (from req.file buffer or base64)
  if (req.file && req.file.buffer) {
    try {
      const secureUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products/quotation_custom",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = secureUrl;
    } catch (cloudErr) {
      console.warn("Cloudinary upload failed, using Data URI fallback:", cloudErr.message);
      const base64 = req.file.buffer.toString("base64");
      imageUrl = `data:${req.file.mimetype || "image/jpeg"};base64,${base64}`;
    }
  } else if (req.body.imageBase64 && typeof req.body.imageBase64 === "string" && req.body.imageBase64.startsWith("data:")) {
    try {
      const result = await cloudinary.uploader.upload(req.body.imageBase64, {
        folder: "products/quotation_custom",
        resource_type: "image",
      });
      imageUrl = result.secure_url;
    } catch (cloudErr) {
      console.warn("Cloudinary base64 upload failed, using data URI:", cloudErr.message);
      imageUrl = req.body.imageBase64;
    }
  } else if (req.body.imageUrl && typeof req.body.imageUrl === "string") {
    imageUrl = req.body.imageUrl;
  }

  // 2. Resolve or fallback Category (required by Product schema)
  let categoryDoc = null;
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryDoc = await Category.findById(category);
    }
    if (!categoryDoc) {
      categoryDoc = await Category.findOne({
        name: { $regex: `^${category.trim()}$`, $options: "i" },
      });
    }
  }

  if (!categoryDoc) {
    categoryDoc = await Category.findOne({ name: /quotation|custom|equipment/i });
  }

  if (!categoryDoc) {
    let eqType = await EquipmentType.findOne();
    if (!eqType) {
      eqType = await EquipmentType.create({
        name: "General Laboratory Equipment",
        slug: "general-laboratory-equipment",
        isActive: true,
      });
    }
    categoryDoc = await Category.create({
      name: "Quotation & Custom Equipment",
      slug: `quotation-custom-${Date.now()}`,
      equipmentType: eqType._id,
      isActive: true,
    });
  }

  // 3. Generate unique slug
  const baseSlug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let uniqueSlug = baseSlug || `item-${Date.now()}`;
  const slugExists = await Product.findOne({ slug: uniqueSlug });
  if (slugExists) {
    uniqueSlug = `${uniqueSlug}-${Date.now().toString().slice(-6)}`;
  }

  // 4. Parse Numbered Specifications (1, 2, 3...)
  let specsList = [];
  if (Array.isArray(req.body.specifications)) {
    specsList = req.body.specifications.map((s) => String(s || "").trim()).filter(Boolean);
  } else if (typeof req.body.specifications === "string" && req.body.specifications.trim()) {
    try {
      const parsed = JSON.parse(req.body.specifications);
      if (Array.isArray(parsed)) {
        specsList = parsed.map((s) => String(s || "").trim()).filter(Boolean);
      }
    } catch (_) {
      specsList = req.body.specifications
        .split("\n")
        .map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim())
        .filter(Boolean);
    }
  }

  const formattedSpecsText = specsList.length > 0
    ? specsList.map((s, idx) => `${idx + 1}. ${s}`).join("\n")
    : (description ? description.trim() : "");

  // 5. Generate Product Code / SKU if not provided
  const cleanProductCode = (productCode && productCode.trim())
    ? productCode.trim().toUpperCase()
    : `ARCL-QT-${Date.now().toString().slice(-5)}`;

  // 6. Create Product in DB with isInternalOnly = true (so NEVER on website frontend)
  const newProduct = await Product.create({
    name: cleanName,
    slug: uniqueSlug,
    productCode: cleanProductCode,
    hsnCode: hsnCode ? hsnCode.trim().toUpperCase() : "9031",
    description: formattedSpecsText,
    specifications: {
      unit: unit || "NOS",
      defaultRate: Number(defaultRate) || 0,
      taxRate: Number(taxRate) || 18,
      points: specsList,
    },
    category: categoryDoc._id,
    images: imageUrl ? [imageUrl] : [],
    isInternalOnly: true, // Guarantees 100% hidden from public website
    isActive: true,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: newProduct._id,
        name: newProduct.name,
        sku: newProduct.productCode,
        price: Number(defaultRate) || 0,
        category: categoryDoc.name,
        hsn: newProduct.hsnCode,
        unit: unit || "NOS",
        taxRate: Number(taxRate) || 18,
        description: newProduct.description,
        specifications: specsList,
        image: imageUrl || "",
      },
      "Custom product saved to quotation catalog & Cloudinary successfully!"
    )
  );
});
