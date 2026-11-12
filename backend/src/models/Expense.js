import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    expenseCode: {
      type: String,
      unique: true,
      index: true,
    },
    // User who incurred / recorded the expense
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userRole: {
      type: String,
      default: "admin",
    },
    userPicture: {
      type: String,
      default: "",
    },

    // Financial Details
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      enum: [
        "Travel & Conveyance",
        "Client Hospitality & Food",
        "Laboratory Chemicals & Consumables",
        "Courier & Logistics",
        "Tools & Hardware Spare Parts",
        "Office & Utilities",
        "Equipment Maintenance & Repairs",
        "Staff Welfare",
        "Miscellaneous",
      ],
      default: "Travel & Conveyance",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: [
        "Company UPI / Card",
        "Personal UPI (Claim Reimbursement)",
        "Company Cash",
        "Company Bank Transfer / NEFT",
      ],
      default: "Company UPI / Card",
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    receiptOriginalName: {
      type: String,
      default: "",
    },

    // Zero-expense day flag (when user marks "No expenses incurred today" to clear reminder)
    isZeroExpenseDay: {
      type: Boolean,
      default: false,
    },

    // Reimbursement & Approval Status
    isReimbursementClaim: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Approved", "Pending", "Rejected", "Reimbursed"],
      default: "Approved",
    },
    reviewedBy: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate human-readable expense code before save if not provided
expenseSchema.pre("save", async function () {
  if (!this.expenseCode) {
    const d = new Date(this.expenseDate || Date.now());
    const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const count = await mongoose.model("Expense").countDocuments();
    this.expenseCode = `EXP-${yearMonth}-${String(count + 1).padStart(4, "0")}-${rand}`;
  }
});

const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
