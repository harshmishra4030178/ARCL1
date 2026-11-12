import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "Navi Mumbai",
      trim: true,
    },
    state: {
      type: String,
      default: "Maharashtra",
      trim: true,
    },
    pincode: {
      type: String,
      default: "400701",
      trim: true,
    },
    manager: {
      type: String,
      default: "ARCL Operations Team",
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "+91-9820000000",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "inventory@arclinstruments.com",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Warehouse", warehouseSchema);
