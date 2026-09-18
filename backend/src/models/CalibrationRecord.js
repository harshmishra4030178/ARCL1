import mongoose from "mongoose";

const calibrationRecordSchema = new mongoose.Schema(
  {
    clientCompany: {
      type: String,
      default: "Sumeet Industries Pvt. Ltd.",
      trim: true,
      index: true,
    },
    clientContactPerson: {
      type: String,
      default: "Rahul Sharma",
      trim: true,
    },
    clientEmail: {
      type: String,
      default: "qa@sumeetindustries.com",
      trim: true,
    },
    clientPhone: {
      type: String,
      default: "+91 9876543210",
      trim: true,
    },
    labCode: {
      type: String,
      default: "ARCL-LAB-01",
      trim: true,
      index: true,
    },
    srNo: {
      type: Number,
      default: 1,
    },
    instrument: {
      type: String,
      required: [true, "Instrument name is required"],
      trim: true,
      index: true,
    },
    make: {
      type: String,
      default: "ARCL",
      trim: true,
    },
    modelNo: {
      type: String,
      default: "GEN-01",
      trim: true,
    },
    serialNo: {
      type: String,
      required: [true, "Serial number is required"],
      trim: true,
      unique: true,
      index: true,
    },
    instrumentRange: {
      type: String,
      default: "0 - 100",
      trim: true,
    },
    calibrationDate: {
      type: Date,
      default: Date.now,
    },
    calibrationDueDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      index: true,
    },
    dcNo: {
      type: String,
      default: "DC/25-26/0154",
      trim: true,
      index: true,
    },
    challanDate: {
      type: Date,
      default: Date.now,
    },
    sentToLab: {
      type: String,
      default: "Sacandande Calibration Lab",
      trim: true,
    },
    broughtToCompanyDate: {
      type: Date,
      default: Date.now,
    },
    invoiceSharedDate: {
      type: Date,
      default: Date.now,
    },
    commercialDocs: {
      quotation: {
        type: String,
        default: "/docs/sample-quotation.pdf",
      },
      poRaised: {
        type: String,
        default: "/docs/sample-po.pdf",
      },
      proformaInvoice: {
        type: String,
        default: "/docs/sample-pi.pdf",
      },
      taxInvoice: {
        type: String,
        default: "/docs/sample-tax-invoice.pdf",
      },
      paymentStatus: {
        type: String,
        enum: ["Paid", "Pending", "Partial"],
        default: "Paid",
        index: true,
      },
      paymentDate: {
        type: Date,
        default: Date.now,
      },
    },
    records: {
      certificate: {
        type: String,
        default: "/docs/sample-calibration-certificate.pdf",
      },
      certificateNo: {
        type: String,
        default: "ARCL-CAL-2026-001",
      },
      recordExcel: {
        type: String,
        default: "/docs/calibration-records.xlsx",
      },
      stickerCheck: {
        type: Boolean,
        default: true,
      },
    },
    stage: {
      type: String,
      default: "Calibration Done",
      index: true,
    },
    draftStatus: {
      type: String,
      default: "Approved",
    },
    remarks: {
      type: String,
      default: "",
    },
    quotationData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    taxInvoiceData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    proformaData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    autoReminderEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

calibrationRecordSchema.index({
  instrument: "text",
  serialNo: "text",
  modelNo: "text",
  make: "text",
  dcNo: "text",
  clientCompany: "text",
});

const CalibrationRecord =
  mongoose.models.CalibrationRecord ||
  mongoose.model("CalibrationRecord", calibrationRecordSchema);

export default CalibrationRecord;
