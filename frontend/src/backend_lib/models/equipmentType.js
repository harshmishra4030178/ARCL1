import mongoose from 'mongoose';

const equipmentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// High-performance compound indexes
equipmentTypeSchema.index({ isActive: 1, displayOrder: 1, isFeatured: -1 });

export default mongoose.model("EquipmentType", equipmentTypeSchema);