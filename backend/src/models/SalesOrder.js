import mongoose from "mongoose";

const salesOrderItemSchema = new mongoose.Schema(
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
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    dispatchedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    returnedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    damagedReturnQty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const salesOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    inquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inquiry",
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    shippingAddress: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "Maharashtra",
      trim: true,
    },
    pincode: {
      type: String,
      default: "",
      trim: true,
    },
    gstin: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    items: [salesOrderItemSchema],
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
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED", // Reserved stock
        "PARTIALLY_DISPATCHED",
        "DISPATCHED", // Deducted from on-hand and reservation released
        "CANCELLED", // Reservation released
        "RETURNED", // Returns processed
      ],
      default: "PENDING",
      index: true,
    },
    isStockReserved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStockDeducted: {
      type: Boolean,
      default: false,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    dispatchDetails: {
      dispatchedAt: Date,
      dispatchedBy: String,
      courier: String,
      trackingNo: String,
      notes: String,
    },
    returnDetails: {
      returnedAt: Date,
      reason: String,
      inspectedBy: String,
      restockedQty: Number,
      damagedQty: Number,
      notes: String,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      default: "Authorized Admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalesOrder", salesOrderSchema);
