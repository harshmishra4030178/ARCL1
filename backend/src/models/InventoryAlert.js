import mongoose from "mongoose";

const inventoryAlertSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
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
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    warehouseCode: {
      type: String,
      required: true,
      trim: true,
    },
    alertType: {
      type: String,
      enum: ["LOW_STOCK", "OUT_OF_STOCK", "OVERDUE_PO", "RECEIVING_DISCREPANCY"],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL"],
      default: "WARNING",
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    minThreshold: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"],
      default: "ACTIVE",
      index: true,
    },
    acknowledgedBy: {
      type: String,
      default: "",
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate active alerts for the same product & warehouse condition
inventoryAlertSchema.index(
  { product: 1, warehouse: 1, alertType: 1, status: 1 }
);

export default mongoose.model("InventoryAlert", inventoryAlertSchema);
