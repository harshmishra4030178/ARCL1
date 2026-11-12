import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: "Calibration Engineer",
      trim: true,
    },
    department: {
      type: String,
      default: "Calibration Lab",
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "probation", "inactive", "resigned"],
      default: "active",
    },
    // Base monthly compensation
    monthlyCtc: {
      type: Number,
      required: true,
      default: 25000,
    },
    // Earnings breakdown
    earnings: {
      basic: { type: Number, default: 12500 }, // Typically 50% of CTC
      hra: { type: Number, default: 5000 },    // Typically 40% of Basic
      conveyance: { type: Number, default: 1600 },
      medicalAllowance: { type: Number, default: 1250 },
      specialAllowance: { type: Number, default: 4650 },
      performanceBonus: { type: Number, default: 0 },
    },
    // Standard Deductions setup
    deductions: {
      epfApplicable: { type: Boolean, default: true },
      epfAmount: { type: Number, default: 1500 }, // 12% of basic or fixed
      esiApplicable: { type: Boolean, default: false },
      esiAmount: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 200 },
      tds: { type: Number, default: 0 },
    },
    // Bank & Government ID / Statutory Info
    bankDetails: {
      bankName: { type: String, default: "", trim: true },
      accountHolderName: { type: String, default: "", trim: true },
      accountNumber: { type: String, default: "", trim: true },
      ifscCode: { type: String, default: "", trim: true, uppercase: true },
      upiId: { type: String, default: "", trim: true },
      panNumber: { type: String, default: "", trim: true, uppercase: true },
      uanNumber: { type: String, default: "", trim: true },
      esiNumber: { type: String, default: "", trim: true },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryStructure", salaryStructureSchema);
