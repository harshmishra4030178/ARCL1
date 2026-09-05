import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "other"],
      default: "desktop",
      index: true,
    },
    browser: {
      type: String,
      default: "Other",
      index: true,
    },
    os: {
      type: String,
      default: "Other",
      index: true,
    },
    path: {
      type: String,
      default: "/",
    },
    referrer: {
      type: String,
      default: "",
    },
    screenResolution: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient date range querying and aggregation
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model("Visitor", visitorSchema);
