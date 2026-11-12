import mongoose from "mongoose";
import {
  allocateNextUlrNumbers,
  extractRecordUlrNo,
  normalizeUlrNo,
} from "../utils/ulrGenerator.js";
import {
  allocateNextSrfNo,
  extractRecordSrfNo,
  getRecordReceiptDate,
} from "../utils/srfGenerator.js";

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
    clientGst: {
      type: String,
      default: "",
      trim: true,
    },
    clientAddress: {
      type: String,
      default: "",
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
      default: "",
      trim: true,
    },
    modelNo: {
      type: String,
      default: "",
      trim: true,
    },
    serialNo: {
      type: String,
      required: [true, "Serial number is required"],
      trim: true,
      index: true,
    },
    instrumentRange: {
      type: String,
      default: "",
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
      quotationStatus: {
        type: String,
        enum: ["Draft", "Sent to Client", "Under Review", "Approved", "PO Confirmed", "Invoiced", "Declined"],
        default: "Draft",
      },
      quotationSentAt: {
        type: Date,
        default: null,
      },
      quotationApprovedAt: {
        type: Date,
        default: null,
      },
      poRaised: {
        type: String,
        default: "",
      },
      poFileUrl: {
        type: String,
        default: "",
      },
      poFileName: {
        type: String,
        default: "",
      },
      poUploadedAt: {
        type: Date,
        default: null,
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
      paymentMode: {
        type: String,
        default: "UPI",
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      dueAmount: {
        type: Number,
        default: 0,
      },
      transactionRef: {
        type: String,
        default: "",
      },
      payments: {
        type: Array,
        default: [],
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
        default: "",
      },
      ulrNo: {
        type: String,
        default: "",
        trim: true,
        index: true,
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
      default: "Instrument Received",
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
    observationData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    authorizationData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    labPermission: {
      granted: {
        type: Boolean,
        default: false,
      },
      releaseDate: {
        type: Date,
        default: null,
      },
      grantedAt: {
        type: Date,
        default: null,
      },
      grantedBy: {
        type: String,
        default: "",
      },
      notes: {
        type: String,
        default: "",
      },
    },
    srfNo: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    inwardRegister: {
      srfDone: { type: Boolean, default: false },
      srfDoneAt: { type: Date, default: null },
      srfDoneBy: { type: String, default: "" },
      srfNo: { type: String, default: "" },
      inwardNo: { type: String, default: "" },
      dateOfReceipt: { type: Date, default: null },
      range: { type: String, default: "" },
      unit: { type: String, default: "" },
      leastCount: { type: String, default: "" },
      dia: { type: String, default: "" },
      makeModel: { type: String, default: "" },
      calibrationDoneAt: { type: String, default: "Lab" },
      certificateNo: { type: String, default: "" },
      ulrNo: { type: String, default: "", trim: true, index: true },
      deliveryCommittedDays: { type: Number, default: 2 },
      dateOfDelivery: { type: Date, default: null },
      remarks: { type: String, default: "" },
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

// Auto-generate sequential 18-char unique ULR No whenever an inward/calibration record is created or saved without one
calibrationRecordSchema.pre("save", async function () {
  const existingUlr = extractRecordUlrNo(this);
  let finalUlr = existingUlr;

  if (!finalUlr) {
    const [allocated] = await allocateNextUlrNumbers(1, {
      CalibrationRecord: this.constructor,
      mongoose,
    });
    finalUlr = allocated;
  }

  if (finalUlr) {
    if (!this.records) this.records = {};
    if (normalizeUlrNo(this.records.ulrNo) !== finalUlr) {
      this.records.ulrNo = finalUlr;
      this.markModified("records");
    }
    if (!this.inwardRegister) this.inwardRegister = {};
    if (normalizeUlrNo(this.inwardRegister.ulrNo) !== finalUlr) {
      this.inwardRegister.ulrNo = finalUlr;
      this.markModified("inwardRegister");
    }
  }

  // Auto-generate per-customer-batch sequential SRF No. (YYMMDD/NN) whenever a record is saved without one
  if (!extractRecordSrfNo(this)) {
    const dcClean = String(this.dcNo || "").trim();
    const hasValidDc = dcClean && dcClean !== "-" && dcClean !== "N/A";
    const siblingWithSrf =
      this.clientCompany && hasValidDc
        ? await this.constructor
            .findOne({
              _id: { $ne: this._id },
              clientCompany: this.clientCompany,
              dcNo: dcClean,
              $or: [
                { srfNo: { $exists: true, $ne: "" } },
                { "inwardRegister.srfNo": { $exists: true, $ne: "" } },
              ],
            })
            .select("srfNo inwardRegister.srfNo")
            .lean()
        : null;

    const assignedSrf =
      extractRecordSrfNo(siblingWithSrf) ||
      (await allocateNextSrfNo(getRecordReceiptDate(this), {
        CalibrationRecord: this.constructor,
      }));

    if (assignedSrf) {
      this.srfNo = assignedSrf;
      if (!this.inwardRegister) this.inwardRegister = {};
      this.inwardRegister.srfNo = assignedSrf;
      this.markModified("inwardRegister");
    }
  }
});

const CalibrationRecord =
  mongoose.models.CalibrationRecord ||
  mongoose.model("CalibrationRecord", calibrationRecordSchema);

export default CalibrationRecord;
