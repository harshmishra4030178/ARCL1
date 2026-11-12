import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
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
      index: true,
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
      uppercase: true,
      trim: true,
    },
    movementType: {
      type: String,
      enum: [
        "OPENING_STOCK",
        "PURCHASE_RECEIPT",
        "SALES_RESERVATION",
        "SALES_DISPATCH",
        "SALES_CANCEL_RELEASE",
        "TRANSFER_DISPATCH",
        "TRANSFER_RECEIPT",
        "DAMAGE_QUARANTINE",
        "DAMAGE_RESTORE",
        "RETURN_RESTOCK",
        "MANUAL_ADJUSTMENT",
        "AUDIT_RECONCILIATION",
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    reservedBefore: {
      type: Number,
      default: 0,
    },
    reservedAfter: {
      type: Number,
      default: 0,
    },
    referenceType: {
      type: String,
      enum: [
        "PURCHASE_ORDER",
        "SALES_ORDER",
        "INQUIRY",
        "WAREHOUSE_TRANSFER",
        "MANUAL_ADJUSTMENT",
        "AUDIT",
        "OPENING_STOCK",
      ],
      default: "MANUAL_ADJUSTMENT",
    },
    referenceId: {
      type: String,
      default: "",
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
      default: "Authorized Admin",
      trim: true,
    },
    performedByEmail: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ warehouse: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1, createdAt: -1 });
stockMovementSchema.index({ referenceId: 1 });

export default mongoose.model("StockMovement", stockMovementSchema);
