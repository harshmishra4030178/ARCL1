import mongoose from "mongoose";

const salaryPaymentSchema = new mongoose.Schema(
  {
    slipNumber: {
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
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: "Calibration Engineer",
    },
    department: {
      type: String,
      default: "Calibration Lab",
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    periodString: {
      type: String,
      required: true, // e.g. "November 2026"
    },
    // Working days & Attendance
    attendance: {
      totalDays: { type: Number, default: 30 },
      workingDays: { type: Number, default: 26 },
      presentDays: { type: Number, default: 26 },
      paidLeaves: { type: Number, default: 0 },
      unpaidLeaves: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
      overtimePay: { type: Number, default: 0 },
      lopDeduction: { type: Number, default: 0 },
    },
    // Earnings breakdown for this month
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      performanceBonus: { type: Number, default: 0 },
      incentive: { type: Number, default: 0 },
      expenseReimbursement: { type: Number, default: 0 },
      overtimePay: { type: Number, default: 0 },
      totalGrossEarnings: { type: Number, default: 0 },
    },
    // Deductions breakdown for this month
    deductions: {
      epf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      advanceDeduction: { type: Number, default: 0 },
      lopDeduction: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
    },
    // Final Net Pay
    netSalary: {
      type: Number,
      required: true,
    },
    netSalaryInWords: {
      type: String,
      default: "",
    },
    // Status & Payment Disbursal
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "paid", "on_hold"],
      default: "pending",
    },
    paymentDetails: {
      paymentDate: { type: Date },
      paymentMode: {
        type: String,
        enum: ["bank_transfer", "upi", "cheque", "cash", "neft_rtgs", "other"],
        default: "bank_transfer",
      },
      transactionReference: { type: String, default: "", trim: true },
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      paidByName: { type: String, default: "" },
      paymentRemarks: { type: String, default: "" },
    },
    // Bank info snapshot for this pay slip
    bankSnapshot: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      uanNumber: { type: String, default: "" },
    },
    salaryAdvanceRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryAdvance",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index to quickly find user salary for specific month & year
salaryPaymentSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("SalaryPayment", salaryPaymentSchema);
