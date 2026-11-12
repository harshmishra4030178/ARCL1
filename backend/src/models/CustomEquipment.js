import mongoose from "mongoose";

const customEquipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      trim: true,
      default: "Equipment",
    },
    discipline: {
      type: String,
      trim: true,
      default: "Mechanical",
    },
    defaultMake: {
      type: String,
      trim: true,
      default: "ARCL",
    },
    defaultModel: {
      type: String,
      trim: true,
      default: "",
    },
    defaultRange: {
      type: String,
      trim: true,
      default: "",
    },
    rate: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "NOS",
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      default: "database",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CustomEquipment || mongoose.model("CustomEquipment", customEquipmentSchema);
