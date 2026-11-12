import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    categoryName: {
      type: String,
      default: "",
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
      uppercase: true,
      trim: true,
    },
    warehouseName: {
      type: String,
      default: "",
      trim: true,
    },
    onHand: {
      type: Number,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    incoming: {
      type: Number,
      default: 0,
      min: 0,
    },
    damaged: {
      type: Number,
      default: 0,
      min: 0,
    },
    minThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    reorderQty: {
      type: Number,
      default: 10,
      min: 1,
    },
    unit: {
      type: String,
      default: "NOS",
      trim: true,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    locationBin: {
      type: String,
      default: "BAY-1",
      trim: true,
    },
    lastMovementDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"],
      default: "IN_STOCK",
      index: true,
    },
    isInitialized: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Available Quantity = onHand - reserved (never negative)
inventorySchema.virtual("available").get(function () {
  return Math.max(0, (this.onHand || 0) - (this.reserved || 0));
});

// Pre-save middleware to synchronize status
inventorySchema.pre("save", function () {
  const avail = Math.max(0, (this.onHand || 0) - (this.reserved || 0));
  if (this.status !== "DISCONTINUED") {
    if (avail === 0) {
      this.status = "OUT_OF_STOCK";
    } else if (avail <= (this.minThreshold || 5)) {
      this.status = "LOW_STOCK";
    } else {
      this.status = "IN_STOCK";
    }
  }
});

// Compound Unique Index: One inventory record per product & warehouse combination
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
inventorySchema.index({ sku: 1, warehouse: 1 });
inventorySchema.index({ warehouse: 1, status: 1 });
inventorySchema.index({ onHand: 1, minThreshold: 1 });

export default mongoose.model("Inventory", inventorySchema);
