import mongoose from "mongoose";

const gstDirectorySchema = new mongoose.Schema(
  {
    gstin: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: "",
    },
    tradeName: {
      type: String,
      trim: true,
      default: "",
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    status: {
      type: String,
      trim: true,
      default: "Active",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    stateCode: {
      type: String,
      trim: true,
      default: "",
    },
    stateName: {
      type: String,
      trim: true,
      default: "",
    },
    addr: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    entityType: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      default: "database",
    },
  },
  { timestamps: true }
);

export default mongoose.models.GstDirectory || mongoose.model("GstDirectory", gstDirectorySchema);
