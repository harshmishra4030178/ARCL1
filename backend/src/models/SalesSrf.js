import mongoose from "mongoose";

const salesSrfItemSchema = new mongoose.Schema(
  {
    itemNo: { type: Number, default: 1 },
    itemName: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    specifications: [{ type: String, trim: true }],
    productImage: { type: String, default: "", trim: true },
    make: { type: String, default: "ARCL", trim: true },
    modelNo: { type: String, default: "", trim: true },
    serialNo: { type: String, default: "", trim: true },
    qty: { type: Number, default: 1, min: 1 },
    unit: { type: String, default: "NOS", trim: true },
    rate: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 18 },
    amount: { type: Number, default: 0 },
  },
  { _id: true }
);

const salesSrfPaymentSchema = new mongoose.Schema(
  {
    installmentNo: { type: Number, default: 1 },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: {
      type: String,
      enum: ["UPI", "Net Banking", "Cash", "Cheque", "Card", "Other"],
      default: "UPI",
      trim: true,
    },
    transactionRef: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const salesSrfSchema = new mongoose.Schema(
  {
    srfNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    dcNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    challanDate: {
      type: Date,
      default: Date.now,
    },
    deliveryDueDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    clientCompany: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    clientContactPerson: {
      type: String,
      default: "",
      trim: true,
    },
    clientPhone: {
      type: String,
      default: "",
      trim: true,
    },
    clientEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    clientGst: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    clientAddress: {
      type: String,
      default: "",
      trim: true,
    },
    deliverySite: {
      type: String,
      default: "",
      trim: true,
    },
    quotationRef: {
      type: String,
      default: "",
      trim: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesQuotation",
      default: null,
    },
    items: [salesSrfItemSchema],
    commercialDocs: {
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
        default: "Pending",
        index: true,
      },
      paymentMode: {
        type: String,
        enum: ["UPI", "Net Banking", "Cash", "Cheque", "Card", "Other"],
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
      payments: [salesSrfPaymentSchema],
      paymentDate: {
        type: Date,
        default: Date.now,
      },
    },
    stage: {
      type: String,
      enum: [
        "Order Confirmed",
        "In Production / Packing",
        "Ready for Dispatch",
        "Dispatched",
        "Delivered",
      ],
      default: "Order Confirmed",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      default: "Sales Admin",
    },
  },
  { timestamps: true }
);

salesSrfSchema.index({
  srfNo: "text",
  dcNo: "text",
  clientCompany: "text",
  clientContactPerson: "text",
  clientPhone: "text",
});

const SalesSrf =
  mongoose.models.SalesSrf ||
  mongoose.model("SalesSrf", salesSrfSchema);

export default SalesSrf;
