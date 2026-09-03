import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },

    // Product Code / SKU (Always Upper Case, e.g. "ARCL-LPM-60")
    productCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // HSN Code (Harmonized System of Nomenclature, Always Upper Case, e.g. "8474" or "9031")
    hsnCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    // Specifications stored as Mixed Object for reliable JSON serialization
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    applications: [
      {
        type: String,
        trim: true,
      },
    ],

    features: [
      {
        type: String,
        trim: true,
      },
    ],

    // Complete Set Includes (Accessories, items & components supplied with the machine)
    completeSetIncludes: [
      {
        type: String,
        trim: true,
      },
    ],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: [String],

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, minimize: false }
);

// High-performance compound indexes
productSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, name: 1 });

export default mongoose.model("Product", productSchema);