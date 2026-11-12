import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    orderedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    damagedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const poReceivingLogSchema = new mongoose.Schema(
  {
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: String,
      default: "Authorized Admin",
      trim: true,
    },
    challanNo: {
      type: String,
      default: "",
      trim: true,
    },
    invoiceNo: {
      type: String,
      default: "",
      trim: true,
    },
    itemsReceived: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        sku: String,
        acceptedQty: Number,
        damagedQty: Number,
      },
    ],
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierGstin: {
      type: String,
      default: "",
      trim: true,
    },
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    warehouseCode: {
      type: String,
      default: "",
      trim: true,
    },
    warehouseName: {
      type: String,
      default: "",
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expectedDeliveryDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "ORDERED",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    items: [poItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    approval: {
      isApproved: { type: Boolean, default: false },
      approvedBy: { type: String, default: "" },
      approvedAt: { type: Date },
      notes: { type: String, default: "" },
    },
    receivingHistory: [poReceivingLogSchema],
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      default: "Authorized Admin",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
