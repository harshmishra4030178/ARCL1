import mongoose from "mongoose";

const salaryAdvanceSchema = new mongoose.Schema(
  {
    advanceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeCode: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    disbursementDate: {
      type: Date,
      default: Date.now,
    },
    monthlyEmi: {
      type: Number,
      required: true,
      min: 1,
    },
    tenureMonths: {
      type: Number,
      default: 1,
    },
    recoveredAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "Personal Emergency / Advance",
    },
    status: {
      type: String,
      enum: ["active", "cleared", "cancelled"],
      default: "active",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryAdvance", salaryAdvanceSchema);
