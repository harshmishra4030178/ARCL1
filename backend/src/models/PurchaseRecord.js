import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  category: { type: String, default: "Lab Equipment", trim: true },
  qty: { type: Number, default: 1, min: 0 },
  unit: { type: String, default: "NOS", trim: true },
  rate: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 18 },
  amount: { type: Number, default: 0 },
});

const paymentHistorySchema = new mongoose.Schema({
  installmentNo: { type: Number, default: 1 },
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: Date, default: Date.now },
  paymentMode: {
    type: String,
    enum: ["UPI", "Net Banking / NEFT", "Net Banking", "Cash", "Cheque / DD", "Cheque", "Credit Card", "Debit Card", "Card", "Other"],
    default: "UPI",
    trim: true,
  },
  transactionRef: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
});

const purchaseRecordSchema = new mongoose.Schema(
  {
    purchaseNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    billNo: {
      type: String,
      default: "",
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    vendorLocation: {
      type: String,
      default: "Mumbai, Maharashtra",
      trim: true,
    },
    vendorGstin: {
      type: String,
      default: "",
      trim: true,
    },
    vendorPhone: {
      type: String,
      default: "",
      trim: true,
    },
    vendorEmail: {
      type: String,
      default: "",
      trim: true,
    },
    placeOfSupply: {
      type: String,
      default: "27-MAHARASHTRA",
      trim: true,
    },
    warehouse: {
      type: String,
      default: "Main Lab - Airoli / Navi Mumbai",
      trim: true,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["RECEIVED", "ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "CANCELLED"],
      default: "RECEIVED",
      trim: true,
      index: true,
    },
    orderStage: {
      type: String,
      enum: [
        "PO Created",
        "Vendor Confirmed",
        "In Transit",
        "Under Inspection",
        "Received & Stocked",
        "Completed",
        "Cancelled",
      ],
      default: "Received & Stocked",
      trim: true,
      index: true,
    },
    reverseCharge: {
      type: String,
      enum: ["N", "Y"],
      default: "N",
      trim: true,
    },
    category: {
      type: String,
      default: "Lab Equipment",
      trim: true,
      index: true,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ["UPI", "Net Banking / NEFT", "Net Banking", "Cash", "Cheque / DD", "Cheque", "Credit Card", "Debit Card", "Card", "Other"],
      default: "UPI",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partial"],
      default: "Paid",
      index: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    payments: [paymentHistorySchema],
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    transactionRef: {
      type: String,
      default: "",
      trim: true,
    },
    billUrl: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

purchaseRecordSchema.index({
  purchaseNo: "text",
  billNo: "text",
  vendorName: "text",
  vendorLocation: "text",
  warehouse: "text",
  category: "text",
  orderStage: "text",
  transactionRef: "text",
});

const PurchaseRecord =
  mongoose.models.PurchaseRecord ||
  mongoose.model("PurchaseRecord", purchaseRecordSchema);

export default PurchaseRecord;
