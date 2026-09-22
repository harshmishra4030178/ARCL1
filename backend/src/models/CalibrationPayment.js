import mongoose from "mongoose";

const calibrationPaymentSchema = new mongoose.Schema(
  {
    calibrationRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CalibrationRecord",
      required: true,
      index: true,
    },
    calibrationRequestId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    clientCompany: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    clientEmail: {
      type: String,
      default: "",
      trim: true,
    },
    clientPhone: {
      type: String,
      default: "",
      trim: true,
    },
    clientGst: {
      type: String,
      default: "",
      trim: true,
    },
    instrument: {
      type: String,
      required: true,
      trim: true,
    },
    serialNo: {
      type: String,
      required: true,
      trim: true,
    },
    modelNo: {
      type: String,
      default: "",
      trim: true,
    },
    make: {
      type: String,
      default: "",
      trim: true,
    },
    dcNo: {
      type: String,
      default: "",
      trim: true,
    },
    calibrationCharges: {
      type: Number,
      required: true,
      min: 0,
    },
    gstRate: {
      type: Number,
      default: 18, // 18% GST
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    finalPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAYMENT_SUBMITTED",
        "UNDER_VERIFICATION",
        "PAYMENT_VERIFIED",
        "PAYMENT_REJECTED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
    utr: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentScreenshotUrl: {
      type: String,
      default: "",
    },
    paymentScreenshotPublicId: {
      type: String,
      default: "",
    },
    customerNotes: {
      type: String,
      default: "",
      trim: true,
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedByAdminName: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    upiPayeeVpa: {
      type: String,
      default: process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc",
    },
    upiPayeeName: {
      type: String,
      default: process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
    },
    auditLog: [
      {
        action: {
          type: String,
          required: true,
        },
        performedBy: {
          type: String,
          default: "System / Customer",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
calibrationPaymentSchema.index({
  utr: "text",
  calibrationRequestId: "text",
  clientCompany: "text",
  serialNo: "text",
  instrument: "text",
});

const CalibrationPayment =
  mongoose.models.CalibrationPayment ||
  mongoose.model("CalibrationPayment", calibrationPaymentSchema);

export default CalibrationPayment;
