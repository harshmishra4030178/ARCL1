import mongoose from "mongoose";

const observationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template / Equipment name is required"],
      trim: true,
      index: true,
    },
    equipmentType: {
      type: String,
      default: "General Metrology",
      trim: true,
      index: true,
    },
    standardReference: {
      type: String,
      default: "IS / ISO / ASTM Metrology Standard",
      trim: true,
    },
    calibrationMethod: {
      type: String,
      default: "ARCL-CP-STANDARD",
      trim: true,
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    pdfFileName: {
      type: String,
      default: "",
    },
    pdfFileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      default: "pdf",
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        range: "Standard Range",
        leastCount: "0.01",
        unit: "mm",
        conditionOfItem: "OK",
        temperature: "25.0 ± 2°C",
        humidity: "50 ± 10% RH",
        masterEquipment: "Master Calibrator Standard",
        masterId: "ARCL/MST/01",
        masterCertNo: "CERT-NABL-001",
        masterDueDate: "2027-12-31",
        masterTraceable: "NABL Accredited Lab",
      }),
    },
    tableColumns: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, default: "number" },
        unit: { type: String, default: "" },
        formula: { type: String, default: "" },
        minWidth: { type: String, default: "110px" },
        readOnly: { type: Boolean, default: false },
      },
    ],
    defaultReadings: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },
    reportData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    amuData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    masterData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    sheetsSummary: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },
    exactSheets: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },
    formulaType: {
      type: String,
      default: "custom",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "Lab Engineer",
    },
  },
  {
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    bufferCommands: false,
  }
);

const ObservationTemplate =
  mongoose.models.ObservationTemplate ||
  mongoose.model("ObservationTemplate", observationTemplateSchema);

export default ObservationTemplate;
