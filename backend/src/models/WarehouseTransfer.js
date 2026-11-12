import mongoose from "mongoose";

const transferItemSchema = new mongoose.Schema(
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
    requestedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    dispatchedQty: {
      type: Number,
      default: 0,
      min: 0,
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
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const warehouseTransferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    sourceWarehouseCode: {
      type: String,
      default: "",
      trim: true,
    },
    sourceWarehouseName: {
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
    destinationWarehouseCode: {
      type: String,
      default: "",
      trim: true,
    },
    destinationWarehouseName: {
      type: String,
      default: "",
      trim: true,
    },
    items: [transferItemSchema],
    status: {
      type: String,
      enum: [
        "DRAFT",
        "APPROVED",
        "DISPATCHED", // in-transit: deducted from source, not yet at destination
        "PARTIALLY_RECEIVED",
        "RECEIVED", // accepted at destination
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    dispatchedAt: { type: Date },
    dispatchedBy: { type: String, default: "" },
    dispatchNotes: { type: String, default: "" },
    trackingRef: { type: String, default: "" },
    vehicleNumber: { type: String, default: "" },
    receivedAt: { type: Date },
    receivedBy: { type: String, default: "" },
    receivingNotes: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: String, default: "Authorized Admin" },
  },
  { timestamps: true }
);

export default mongoose.model("WarehouseTransfer", warehouseTransferSchema);
