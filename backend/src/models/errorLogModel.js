import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    stack: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      default: "frontend",
      index: true,
    },
    url: {
      type: String,
      default: "",
    },
    route: {
      type: String,
      default: "",
    },
    method: {
      type: String,
      default: "",
    },
    statusCode: {
      type: Number,
      default: 500,
    },
    severity: {
      type: String,
      enum: ["critical", "error", "warning", "info"],
      default: "error",
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

errorLogSchema.index({ createdAt: -1, severity: 1, resolved: 1 });

const ErrorLog = mongoose.models.ErrorLog || mongoose.model("ErrorLog", errorLogSchema);

export default ErrorLog;
