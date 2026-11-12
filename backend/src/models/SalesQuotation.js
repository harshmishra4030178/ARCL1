import mongoose from "mongoose";

const salesQuotationItemSchema = new mongoose.Schema(
  {
    itemNo: { type: Number, default: 1 },
    itemName: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    specifications: [{ type: String, trim: true }],
    productImage: { type: String, default: "", trim: true },
    hsnSac: { type: String, default: "998346", trim: true },
    make: { type: String, default: "ARCL", trim: true },
    modelNo: { type: String, default: "", trim: true },
    qty: { type: Number, default: 1, min: 1 },
    qtyUnit: { type: String, default: "NOS", trim: true },
    rate: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 18 },
    amount: { type: Number, default: 0 },
  },
  { _id: true }
);

const salesQuotationSchema = new mongoose.Schema(
  {
    quotationNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    quotationDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    validityDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    placeOfSupply: {
      type: String,
      default: "27-MAHARASHTRA",
      trim: true,
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
    billingAddress: {
      type: String,
      default: "",
      trim: true,
    },
    shippingAddress: {
      type: String,
      default: "",
      trim: true,
    },
    items: [salesQuotationItemSchema],
    taxableAmount: {
      type: Number,
      default: 0,
    },
    cgstRate: {
      type: Number,
      default: 9,
    },
    sgstRate: {
      type: Number,
      default: 9,
    },
    igstRate: {
      type: Number,
      default: 0,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    igstAmount: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    terms: {
      type: [String],
      default: [
        "Payment Terms: 100% advance or 30 days credit against approved PO.",
        "Prices: GST extra as applicable at current rates (18%).",
        "Delivery: Within 2-3 weeks from receipt of technically and commercially clear order.",
        "Validity: Quotation remains valid for 30 days from the date of issue.",
        "Warranty: 12 months comprehensive warranty against manufacturing defects from delivery date.",
        "Jurisdiction: All disputes subject to Mumbai/Thane jurisdiction only.",
      ],
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Approved", "Expired", "Cancelled"],
      default: "Draft",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    convertedToSrf: {
      type: Boolean,
      default: false,
    },
    srfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesSrf",
      default: null,
    },
    createdBy: {
      type: String,
      default: "Sales Admin",
    },
  },
  { timestamps: true }
);

salesQuotationSchema.index({
  quotationNo: "text",
  clientCompany: "text",
  clientContactPerson: "text",
  clientPhone: "text",
});

const SalesQuotation =
  mongoose.models.SalesQuotation ||
  mongoose.model("SalesQuotation", salesQuotationSchema);

export default SalesQuotation;
