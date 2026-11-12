import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import mongoose from "mongoose";
import ObservationTemplate from "../models/ObservationTemplate.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";
import { parseExcelObservationSheet } from "../services/excelTemplateParser.js";

const isValidMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

const execFileAsync = promisify(execFile);

/**
 * Fetch PDF Buffer from Cloudinary URL, Base64, or local disk with robust fallbacks
 */
export const fetchPdfBufferFromUrl = async (pdfUrl, preferredFileName = "") => {
  if (!pdfUrl) throw new Error("No PDF URL provided");

  // 1. Try remote network fetch if HTTP/HTTPS
  if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
    try {
      const response = await fetch(pdfUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      console.warn(`Cloudinary URL returned status ${response.status}, checking local disk fallback...`);
    } catch (netErr) {
      console.warn("Cloudinary fetch network notice:", netErr.message);
    }
  }

  // 2. Base64 data URI
  if (pdfUrl.startsWith("data:application/pdf;base64,")) {
    const base64 = pdfUrl.split(",")[1];
    return Buffer.from(base64, "base64");
  }

  // 3. Search local directories
  const uploadDirs = [
    path.resolve(process.cwd(), "backend/public/uploads/observation_templates"),
    path.resolve(process.cwd(), "public/uploads/observation_templates"),
    path.resolve(process.cwd(), "frontend/public/uploads/observation_templates"),
    path.resolve(process.cwd(), "uploads/observation_templates"),
    path.resolve(process.cwd(), "backend/uploads/observation_templates"),
  ];

  const rawBase = path.basename(pdfUrl.split("?")[0]);
  const cleanPref = preferredFileName ? path.basename(preferredFileName.split("?")[0]) : "";

  const directNames = [
    rawBase,
    rawBase.endsWith(".pdf") ? rawBase : `${rawBase}.pdf`,
    rawBase.endsWith(".xlsx") ? rawBase : `${rawBase}.xlsx`,
    rawBase.endsWith(".xls") ? rawBase : `${rawBase}.xls`,
    cleanPref,
    cleanPref.endsWith(".pdf") ? cleanPref : `${cleanPref}.pdf`,
    cleanPref.endsWith(".xlsx") ? cleanPref : `${cleanPref}.xlsx`,
    cleanPref.endsWith(".xls") ? cleanPref : `${cleanPref}.xls`,
  ].filter(Boolean);

  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of directNames) {
      const p = path.join(dir, name);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return await fs.promises.readFile(p);
      }
    }
  }

  // 4. Fuzzy match in upload dirs based on instrument keywords
  const combinedStr = `${rawBase} ${cleanPref}`.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const keywords = combinedStr
    .split(" ")
    .filter((w) => w.length > 2 && !["obs", "tmpl", "pdf", "raw", "upload", "v17", "arcl", "gauge", "format", "observation", "sheet", "file", "blank", "sample"].includes(w));

  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.toLowerCase().endsWith(".pdf")) continue;
        const fLower = file.toLowerCase();
        if (keywords.some((kw) => fLower.includes(kw))) {
          console.log(`[fetchPdfBufferFromUrl] Fuzzy matched local backup: ${file} for ${pdfUrl}`);
          return await fs.promises.readFile(path.join(dir, file));
        }
      }
    } catch (_) {}
  }

  // 5. Direct relative path if specified
  const rel = pdfUrl.replace(/^\//, "");
  const directPathCandidates = [
    path.resolve(process.cwd(), "backend/public", rel),
    path.resolve(process.cwd(), "public", rel),
    path.resolve(process.cwd(), "frontend/public", rel),
    path.resolve(process.cwd(), rel),
  ];
  for (const p of directPathCandidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return await fs.promises.readFile(p);
    }
  }

  throw new Error(`Failed to locate PDF buffer for URL: ${pdfUrl} (preferred: ${preferredFileName})`);
};

/**
 * Upload buffer to Cloudinary with fallback to Base64 data URI
 */
const uploadTemplatePdf = async (fileBuffer, originalname = "template.pdf") => {
  let cloudinaryUrl = "";
  try {
    const baseNameOnly = originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const pubId = `obs_${Date.now()}_${baseNameOnly}`;
    cloudinaryUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "arcl_observation_templates",
          resource_type: "raw",
          public_id: pubId,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          console.log("Cloudinary upload successful:", result?.secure_url);
          resolve(result?.secure_url);
        }
      );
      stream.end(fileBuffer);
    });
  } catch (err) {
    console.warn("Cloudinary upload notice (falling back):", err.message);
  }

  // Also maintain local disk copy for offline access & redundancy
  try {
    const cleanFileName = `tmpl_${Date.now()}_${originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const dirs = [
      path.resolve(process.cwd(), "public/uploads/observation_templates"),
      path.resolve(process.cwd(), "backend/public/uploads/observation_templates"),
      path.resolve(process.cwd(), "frontend/public/uploads/observation_templates"),
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(dir, cleanFileName), fileBuffer);
    }
    if (cloudinaryUrl) return cloudinaryUrl;
    return `/uploads/observation_templates/${cleanFileName}`;
  } catch (diskErr) {
    if (cloudinaryUrl) return cloudinaryUrl;
    const base64 = fileBuffer.toString("base64");
    return `data:application/pdf;base64,${base64}`;
  }
};

/**
 * Run python parser on temporary PDF file
 */
export const parsePdfWithPython = async (fileBuffer) => {
  const tempPath = path.join(os.tmpdir(), `obs_tmpl_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  const compressedPath = path.join(os.tmpdir(), `obs_comp_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  try {
    await fs.promises.writeFile(tempPath, fileBuffer);
    const candidate1 = path.resolve(process.cwd(), "backend/src/services/pdfTemplateParser.py");
    const candidate2 = path.resolve(process.cwd(), "src/services/pdfTemplateParser.py");
    const parserScript = fs.existsSync(candidate1) ? candidate1 : candidate2;
    const { stdout, stderr } = await execFileAsync("python", [parserScript, tempPath, compressedPath], {
      timeout: 30000,
      maxBuffer: 25 * 1024 * 1024,
    });

    // Find JSON in stdout (ignoring any warning lines)
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to parse python output: ${stdout || stderr}`);
    }
    const parsed = JSON.parse(jsonMatch[0]);

    let finalBuffer = fileBuffer;
    if (fs.existsSync(compressedPath)) {
      try {
        const compBuf = await fs.promises.readFile(compressedPath);
        if (compBuf && compBuf.length > 0 && compBuf.length < fileBuffer.length) {
          finalBuffer = compBuf;
        }
      } catch (_) {}
    }

    return { parsed, compressedBuffer: finalBuffer };
  } finally {
    try {
      if (fs.existsSync(tempPath)) await fs.promises.unlink(tempPath);
      if (fs.existsSync(compressedPath)) await fs.promises.unlink(compressedPath);
    } catch (_) {}
  }
};

/**
 * Default verified NABL Calibration Templates for laboratory equipment
 */
const DEFAULT_PRESET_TEMPLATES = [
  {
    name: "Compression Testing Machine (CTM / UTM) 2000 kN",
    equipmentType: "Force",
    standardReference: "IS : 1828-Part-1 / ISO 7500-1",
    calibrationMethod: "ARCL-CP-16",
    parameters: {
      range: "3000 kN",
      leastCount: "0.1 kN",
      conditionOfItem: "OK",
      temperature: "29.4 °C",
      humidity: "56 % RH",
      masterEquipment: "Proving Ring / Load Cell",
      masterId: "ARCL/PR/01/325132",
      masterCertNo: "SCPL/CC/3663/02/2025-2026",
      masterDueDate: "2028-04-25",
      masterTraceable: "NABL CC-2874",
    },
    tableColumns: [
      { key: "nominal", label: "Nominal Force, KN", type: "number", unit: "KN", minWidth: "110px" },
      { key: "masterLoad", label: "Master True Load (KN) at Site EC", type: "number", unit: "KN", minWidth: "130px" },
      { key: "indicated", label: "Average Indicated Load (KN)", type: "number", unit: "KN", minWidth: "130px" },
      { key: "indError", label: "Relative Indication Error(%)", type: "formula", formula: "((indicated - masterLoad) / masterLoad) * 100", unit: "%", minWidth: "120px" },
      { key: "repError", label: "Relative Repeatability Error(%)", type: "number", unit: "%", minWidth: "120px" },
      { key: "uncertainty", label: "± Expanded Uncertainity(%rdg)", type: "text", unit: "%", minWidth: "120px" },
    ],
    defaultReadings: [
      { nominal: "300", masterLoad: "300.4", indicated: "301.4", indError: "0.32", repError: "0.00", uncertainty: "0.61" },
      { nominal: "900", masterLoad: "901.3", indicated: "902.3", indError: "0.11", repError: "0.00", uncertainty: "0.61" },
      { nominal: "1200", masterLoad: "1201.7", indicated: "1200.3", indError: "-0.12", repError: "0.01", uncertainty: "0.61" },
      { nominal: "1800", masterLoad: "1802.6", indicated: "1800.2", indError: "-0.13", repError: "0.00", uncertainty: "0.61" },
      { nominal: "2700", masterLoad: "2703.9", indicated: "2706.3", indError: "0.09", repError: "0.02", uncertainty: "0.61" },
    ],
    formulaType: "force_kn",
    notes: "NABL Class 1.0 compression machine observation format.",
  },
  {
    name: "Digital / Vernier Caliper (0-300 mm)",
    equipmentType: "Dimensional",
    standardReference: "IS : 3651 (Part 1 & 2)",
    calibrationMethod: "ARCL-CP-DIM-01",
    parameters: {
      range: "0 - 300 mm",
      leastCount: "0.01 mm",
      conditionOfItem: "OK",
      temperature: "20.0 ± 1°C",
      humidity: "50 ± 10% RH",
      masterEquipment: "Caliper Checker / Grade 0 Gauge Blocks",
      masterId: "ARCL/MST/DIM/04",
      masterCertNo: "CC-DIM-2025-081",
      masterDueDate: "2027-08-15",
      masterTraceable: "NPL / NABL CC-2190",
    },
    tableColumns: [
      { key: "nominal", label: "Nominal Size (mm)", type: "number", unit: "mm", minWidth: "110px" },
      { key: "reading1", label: "Trial 1 (mm)", type: "number", unit: "mm", minWidth: "100px" },
      { key: "reading2", label: "Trial 2 (mm)", type: "number", unit: "mm", minWidth: "100px" },
      { key: "average", label: "Mean Observed (mm)", type: "formula", formula: "(reading1 + reading2) / 2", unit: "mm", minWidth: "120px" },
      { key: "error", label: "Error (mm)", type: "formula", formula: "average - nominal", unit: "mm", minWidth: "100px" },
      { key: "uncertainty", label: "± Uncertainty (µm)", type: "text", unit: "µm", minWidth: "110px" },
    ],
    defaultReadings: [
      { nominal: "10.00", reading1: "10.002", reading2: "10.001", average: "10.002", error: "+0.002", uncertainty: "± 4.5" },
      { nominal: "50.00", reading1: "50.003", reading2: "50.002", average: "50.003", error: "+0.003", uncertainty: "± 4.5" },
      { nominal: "100.00", reading1: "100.005", reading2: "100.004", average: "100.005", error: "+0.005", uncertainty: "± 4.8" },
      { nominal: "200.00", reading1: "200.008", reading2: "200.007", average: "200.008", error: "+0.008", uncertainty: "± 5.2" },
      { nominal: "300.00", reading1: "300.010", reading2: "300.009", average: "300.010", error: "+0.010", uncertainty: "± 5.5" },
    ],
    formulaType: "dimensional_mm",
    notes: "External & internal jaw calibration format for calipers.",
  },
  {
    name: "External Micrometer (0-25 mm / 0-100 mm)",
    equipmentType: "Dimensional",
    standardReference: "IS : 2967 / DIN 863",
    calibrationMethod: "ARCL-CP-DIM-02",
    parameters: {
      range: "0 - 25 mm",
      leastCount: "0.001 mm",
      conditionOfItem: "OK",
      temperature: "20.0 ± 1°C",
      humidity: "50 ± 10% RH",
      masterEquipment: "Grade 0 Gauge Blocks & Optical Flats",
      masterId: "ARCL/MST/DIM/02",
      masterCertNo: "CC-DIM-2025-014",
      masterDueDate: "2027-05-20",
      masterTraceable: "NPL / NABL CC-2190",
    },
    tableColumns: [
      { key: "nominal", label: "Nominal Size (mm)", type: "number", unit: "mm", minWidth: "110px" },
      { key: "reading1", label: "Trial 1 (mm)", type: "number", unit: "mm", minWidth: "100px" },
      { key: "reading2", label: "Trial 2 (mm)", type: "number", unit: "mm", minWidth: "100px" },
      { key: "average", label: "Mean Observed (mm)", type: "formula", formula: "(reading1 + reading2) / 2", unit: "mm", minWidth: "120px" },
      { key: "error", label: "Error (µm)", type: "formula", formula: "(average - nominal) * 1000", unit: "µm", minWidth: "100px" },
      { key: "uncertainty", label: "± Uncertainty (µm)", type: "text", unit: "µm", minWidth: "110px" },
    ],
    defaultReadings: [
      { nominal: "2.500", reading1: "2.5005", reading2: "2.5004", average: "2.5005", error: "+0.5", uncertainty: "± 1.2" },
      { nominal: "5.100", reading1: "5.1008", reading2: "5.1007", average: "5.1008", error: "+0.8", uncertainty: "± 1.2" },
      { nominal: "10.000", reading1: "10.0010", reading2: "10.0009", average: "10.0010", error: "+1.0", uncertainty: "± 1.4" },
      { nominal: "15.000", reading1: "15.0012", reading2: "15.0011", average: "15.0012", error: "+1.2", uncertainty: "± 1.4" },
      { nominal: "25.000", reading1: "25.0015", reading2: "25.0014", average: "25.0015", error: "+1.5", uncertainty: "± 1.6" },
    ],
    formulaType: "dimensional_micrometer",
    notes: "High precision micrometer format with automatic micron conversion.",
  },
  {
    name: "Hydraulic & Pneumatic Pressure Gauge (0-250 bar)",
    equipmentType: "Pressure",
    standardReference: "IS : 3624 / DKD-R 6-1",
    calibrationMethod: "ARCL-CP-PRS-01",
    parameters: {
      range: "0 - 250 bar",
      leastCount: "1 bar",
      conditionOfItem: "OK",
      temperature: "23.0 ± 2°C",
      humidity: "55 ± 10% RH",
      masterEquipment: "Digital Pressure Calibrator / Dead Weight Tester",
      masterId: "ARCL/MST/PRS/01",
      masterCertNo: "CC-PRS-2025-102",
      masterDueDate: "2027-10-10",
      masterTraceable: "NABL CC-1892",
    },
    tableColumns: [
      { key: "nominal", label: "Nominal Pressure (bar)", type: "number", unit: "bar", minWidth: "120px" },
      { key: "increasing", label: "Increasing Load (bar)", type: "number", unit: "bar", minWidth: "120px" },
      { key: "decreasing", label: "Decreasing Load (bar)", type: "number", unit: "bar", minWidth: "120px" },
      { key: "mean", label: "Mean Indicated (bar)", type: "formula", formula: "(increasing + decreasing) / 2", unit: "bar", minWidth: "120px" },
      { key: "hysteresis", label: "Hysteresis (bar)", type: "formula", formula: "abs(increasing - decreasing)", unit: "bar", minWidth: "100px" },
      { key: "error", label: "Span Error (%)", type: "formula", formula: "((mean - nominal) / 250) * 100", unit: "%", minWidth: "110px" },
      { key: "uncertainty", label: "± Uncertainty", type: "text", unit: "bar", minWidth: "110px" },
    ],
    defaultReadings: [
      { nominal: "50", increasing: "49.8", decreasing: "50.1", mean: "49.95", hysteresis: "0.3", error: "-0.02", uncertainty: "± 0.25" },
      { nominal: "100", increasing: "99.9", decreasing: "100.2", mean: "100.05", hysteresis: "0.3", error: "+0.02", uncertainty: "± 0.25" },
      { nominal: "150", increasing: "150.1", decreasing: "150.3", mean: "150.20", hysteresis: "0.2", error: "+0.08", uncertainty: "± 0.25" },
      { nominal: "200", increasing: "200.2", decreasing: "200.4", mean: "200.30", hysteresis: "0.2", error: "+0.12", uncertainty: "± 0.25" },
      { nominal: "250", increasing: "250.3", decreasing: "250.5", mean: "250.40", hysteresis: "0.2", error: "+0.16", uncertainty: "± 0.25" },
    ],
    formulaType: "pressure_bar",
    notes: "Ascending & descending pressure cycles with hysteresis calculation.",
  },
  {
    name: "Precision Electronic Weighing Balance (0-500 g)",
    equipmentType: "Mass",
    standardReference: "EURAMET cg-18 / OIML R76",
    calibrationMethod: "ARCL-CP-MASS-01",
    parameters: {
      range: "0 - 500 g",
      leastCount: "0.001 g",
      conditionOfItem: "OK",
      temperature: "22.0 ± 2°C",
      humidity: "50 ± 10% RH",
      masterEquipment: "F1 Class Standard Weight Box",
      masterId: "ARCL/MST/MASS/03",
      masterCertNo: "CC-MASS-2025-055",
      masterDueDate: "2027-11-01",
      masterTraceable: "NPL / NABL CC-1950",
    },
    tableColumns: [
      { key: "nominal", label: "Standard Weight (g)", type: "number", unit: "g", minWidth: "120px" },
      { key: "measured", label: "Observed Indication (g)", type: "number", unit: "g", minWidth: "130px" },
      { key: "deviation", label: "Error / Deviation (g)", type: "formula", formula: "measured - nominal", unit: "g", minWidth: "110px" },
      { key: "repeatability", label: "Repeatability (g)", type: "number", unit: "g", minWidth: "120px" },
      { key: "uncertainty", label: "± Uncertainty (mg)", type: "text", unit: "mg", minWidth: "110px" },
    ],
    defaultReadings: [
      { nominal: "10.000", measured: "10.0002", deviation: "+0.0002", repeatability: "0.0001", uncertainty: "± 0.05" },
      { nominal: "50.000", measured: "50.0004", deviation: "+0.0004", repeatability: "0.0001", uncertainty: "± 0.08" },
      { nominal: "100.000", measured: "100.0007", deviation: "+0.0007", repeatability: "0.0002", uncertainty: "± 0.12" },
      { nominal: "200.000", measured: "200.0011", deviation: "+0.0011", repeatability: "0.0002", uncertainty: "± 0.18" },
      { nominal: "500.000", measured: "500.0018", deviation: "+0.0018", repeatability: "0.0003", uncertainty: "± 0.25" },
    ],
    formulaType: "mass_gram",
    notes: "High accuracy mass metrology observation format.",
  },
];

/**
 * 1. GET ALL OBSERVATION TEMPLATES
 */
export const getObservationTemplates = async (req, res, next) => {
  try {
    const templates = await mongoose.connection
      .collection("observationtemplates")
      .find({ isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(
      new ApiResponse(200, templates || [], "Observation templates retrieved successfully")
    );
  } catch (err) {
    console.error("Error in getObservationTemplates:", err);
    return res.status(200).json(
      new ApiResponse(200, [], "Error retrieving observation templates")
    );
  }
};

/**
 * 2. GET SINGLE OBSERVATION TEMPLATE BY ID
 */
export const getObservationTemplateById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid Template ID");
  }

  const objId = new mongoose.Types.ObjectId(id);
  const template = await mongoose.connection
    .collection("observationtemplates")
    .findOne({ _id: objId });
  if (!template) {
    throw new ApiError(404, "Observation template not found");
  }

  return res.status(200).json(
    new ApiResponse(200, template, "Observation template details retrieved")
  );
});

/**
 * 3. CREATE NEW OBSERVATION TEMPLATE (WITH OPTIONAL PDF AUTO-PARSER)
 */
export const createObservationTemplate = asyncHandler(async (req, res) => {
  console.log("--> [API] POST /observation-templates called, body name:", req.body?.name, "file:", req.file?.originalname);
  const {
    name,
    equipmentType = "General Metrology",
    standardReference = "IS / ISO Metrology Standard",
    calibrationMethod = "ARCL-CP-STANDARD",
    parameters: rawParams,
    tableColumns: rawCols,
    defaultReadings: rawReadings,
    formulaType = "custom",
    notes = "",
  } = req.body;

  let parsedData = null;
  let pdfUrl = "";
  let pdfFileName = "";
  let pdfFileSize = 0;
  let fileType = "pdf";

  if (req.file && req.file.buffer) {
    const isExcel =
      Boolean(req.file.originalname?.match(/\.(xlsx|xls|csv)$/i)) ||
      req.file.mimetype?.includes("sheet") ||
      req.file.mimetype?.includes("excel") ||
      req.file.mimetype?.includes("csv");

    if (isExcel) {
      fileType = "xlsx";
      pdfFileName = req.file.originalname || "observation_format.xlsx";
      pdfFileSize = req.file.size || req.file.buffer.length;

      try {
        parsedData = parseExcelObservationSheet(req.file.buffer, pdfFileName);
      } catch (excelErr) {
        console.warn("Excel auto-parsing notice (falling back to user inputs):", excelErr.message);
      }

      pdfUrl = await uploadTemplatePdf(req.file.buffer, pdfFileName);
    } else {
      fileType = "pdf";
      pdfFileName = req.file.originalname || "observation_format.pdf";
      pdfFileSize = req.file.size || req.file.buffer.length;

      let finalBuffer = req.file.buffer;
      try {
        const parseResult = await parsePdfWithPython(req.file.buffer);
        parsedData = parseResult.parsed;
        finalBuffer = parseResult.compressedBuffer;
        pdfFileSize = finalBuffer.length;
      } catch (parseErr) {
        console.warn("PDF auto-parsing notice (falling back to user inputs):", parseErr.message);
      }

      // Upload ultra-compressed PDF to save storage and ensure lightning-fast downloads
      pdfUrl = await uploadTemplatePdf(finalBuffer, pdfFileName);
    }
  }

  const preserveUserEdits =
    String(req.body?.preserveEditedStructure || "").toLowerCase() === "true";

  const mergeNonEmptyParams = (baseObj = {}, incomingObj = {}, preferIncoming = false) => {
    const out = { ...(baseObj || {}) };
    Object.entries(incomingObj || {}).forEach(([k, v]) => {
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);
      if (isEmpty) return;
      if (preferIncoming || out[k] === undefined || out[k] === null || String(out[k]).trim() === "" || (Array.isArray(out[k]) && out[k].length === 0)) {
        out[k] = v;
      }
    });
    return out;
  };

  let parsedRawCols = [];
  if (rawCols) {
    const raw = typeof rawCols === "string" ? JSON.parse(rawCols) : rawCols;
    parsedRawCols = (Array.isArray(raw) ? raw : []).map((c) => ({
      ...c,
      type: c.type === "calculated" ? "formula" : (c.type || "number"),
    }));
  }

  let parsedRawReadings = [];
  if (rawReadings) {
    const rr = typeof rawReadings === "string" ? JSON.parse(rawReadings) : rawReadings;
    if (Array.isArray(rr)) parsedRawReadings = rr;
  }

  // File extracted data wins on fresh/bulk uploads, while Studio customized preview wins when preserveEditedStructure=true
  let parsedColumns = [];
  if (preserveUserEdits && parsedRawCols.length > 0) {
    parsedColumns = parsedRawCols;
  } else if (parsedData?.tableColumns && Array.isArray(parsedData.tableColumns) && parsedData.tableColumns.length > 0) {
    parsedColumns = parsedData.tableColumns;
  } else {
    parsedColumns = parsedRawCols;
  }

  let parsedParams = {};
  if (rawParams) {
    parsedParams = typeof rawParams === "string" ? JSON.parse(rawParams) : rawParams;
  }
  if (parsedData?.parameters) {
    parsedParams = mergeNonEmptyParams(parsedParams, parsedData.parameters, !preserveUserEdits);
  }

  let parsedReadings = [];
  if (preserveUserEdits && parsedRawReadings.length > 0) {
    parsedReadings = parsedRawReadings;
  } else if (parsedData?.defaultReadings && Array.isArray(parsedData.defaultReadings) && parsedData.defaultReadings.length > 0) {
    parsedReadings = parsedData.defaultReadings;
  } else {
    parsedReadings = parsedRawReadings;
  }

  const templateName = name || parsedData?.name || `${equipmentType} Observation Format`;
  const detectedCategory = preserveUserEdits
    ? (equipmentType || parsedData?.equipmentType || "General Metrology")
    : (parsedData?.equipmentType || equipmentType || "General Metrology");

  const docToInsert = {
    name: templateName,
    equipmentType: detectedCategory,
    standardReference: preserveUserEdits
      ? (standardReference || parsedData?.standardReference || "IS / ISO Metrology Standard")
      : ((parsedData?.standardReference && !parsedData.standardReference.includes("Metrology Standard")) ? parsedData.standardReference : (standardReference || "IS / ISO Metrology Standard")),
    calibrationMethod: preserveUserEdits
      ? (calibrationMethod || parsedData?.calibrationMethod || "ARCL-CP-STANDARD")
      : ((parsedData?.calibrationMethod && parsedData.calibrationMethod !== "ARCL-CP-STANDARD") ? parsedData.calibrationMethod : (calibrationMethod || "ARCL-CP-STANDARD")),
    pdfUrl,
    pdfFileName,
    pdfFileSize,
    fileType,
    parameters: parsedParams,
    tableColumns: parsedColumns,
    defaultReadings: parsedReadings,
    reportData: parsedData?.reportData || {},
    amuData: parsedData?.amuData || {},
    sheetsSummary: parsedData?.sheetsSummary || [],
    exactSheets: parsedData?.exactSheets || [],
    exactSheetValues: req.body?.exactSheetValues
      ? (typeof req.body.exactSheetValues === "string" ? JSON.parse(req.body.exactSheetValues) : req.body.exactSheetValues)
      : {},
    formulaType,
    notes,
    isActive: true,
    createdBy: req.user?.name || "Lab Engineer",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertResult = await mongoose.connection
    .collection("observationtemplates")
    .insertOne(docToInsert);

  const newTemplate = { ...docToInsert, _id: insertResult.insertedId };

  return res.status(201).json(
    new ApiResponse(201, newTemplate, "Observation format template created successfully")
  );
});

/**
 * 4. UPDATE OBSERVATION TEMPLATE
 */
export const updateObservationTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    throw new ApiError(400, "Invalid Template ID");
  }

  const {
    name,
    equipmentType,
    standardReference,
    calibrationMethod,
    parameters,
    tableColumns,
    defaultReadings,
    formulaType,
    notes,
    isActive,
  } = req.body;

  const objId = new mongoose.Types.ObjectId(id);
  const existing = await mongoose.connection
    .collection("observationtemplates")
    .findOne({ _id: objId });
  if (!existing) {
    throw new ApiError(404, "Observation template not found");
  }

  if (name !== undefined) existing.name = name.trim();
  if (equipmentType !== undefined) existing.equipmentType = equipmentType.trim();
  if (standardReference !== undefined) existing.standardReference = standardReference.trim();
  if (calibrationMethod !== undefined) existing.calibrationMethod = calibrationMethod.trim();
  if (parameters !== undefined) {
    existing.parameters = typeof parameters === "string" ? JSON.parse(parameters) : parameters;
  }
  if (tableColumns !== undefined) {
    const cols = typeof tableColumns === "string" ? JSON.parse(tableColumns) : tableColumns;
    existing.tableColumns = (Array.isArray(cols) ? cols : []).map((c) => ({
      ...c,
      type: c.type === "calculated" ? "formula" : (c.type || "number"),
    }));
  }
  if (defaultReadings !== undefined) {
    existing.defaultReadings = typeof defaultReadings === "string" ? JSON.parse(defaultReadings) : defaultReadings;
  }
  if (req.body?.exactSheetValues !== undefined) {
    existing.exactSheetValues =
      typeof req.body.exactSheetValues === "string"
        ? JSON.parse(req.body.exactSheetValues)
        : req.body.exactSheetValues;
  }
  if (formulaType !== undefined) existing.formulaType = formulaType;
  if (notes !== undefined) existing.notes = notes;
  if (isActive !== undefined) existing.isActive = isActive;

  if (req.file && req.file.buffer) {
    const preserveUserEdits =
      String(req.body?.preserveEditedStructure || "").toLowerCase() === "true";

    const applyParsedUpdate = (parsedData) => {
      if (!parsedData) return;
      if (!preserveUserEdits) {
        if (Array.isArray(parsedData.tableColumns) && parsedData.tableColumns.length > 0) {
          existing.tableColumns = parsedData.tableColumns;
        }
        if (Array.isArray(parsedData.defaultReadings) && parsedData.defaultReadings.length > 0) {
          existing.defaultReadings = parsedData.defaultReadings;
        }
        if (parsedData.equipmentType) existing.equipmentType = parsedData.equipmentType;
        if (parsedData.standardReference) existing.standardReference = parsedData.standardReference;
        if (parsedData.calibrationMethod) existing.calibrationMethod = parsedData.calibrationMethod;
      }
      if (parsedData.parameters) {
        const merged = { ...(existing.parameters || {}) };
        Object.entries(parsedData.parameters).forEach(([k, v]) => {
          const isEmpty =
            v === undefined ||
            v === null ||
            (typeof v === "string" && v.trim() === "") ||
            (Array.isArray(v) && v.length === 0);
          if (!isEmpty && (!preserveUserEdits || !merged[k])) {
            merged[k] = v;
          }
        });
        existing.parameters = merged;
      }
      if (parsedData.reportData) existing.reportData = parsedData.reportData;
      if (parsedData.amuData) existing.amuData = parsedData.amuData;
      if (parsedData.sheetsSummary) existing.sheetsSummary = parsedData.sheetsSummary;
      if (parsedData.exactSheets) existing.exactSheets = parsedData.exactSheets;
    };

    const isExcel =
      Boolean(req.file.originalname?.match(/\.(xlsx|xls|csv)$/i)) ||
      req.file.mimetype?.includes("sheet") ||
      req.file.mimetype?.includes("excel") ||
      req.file.mimetype?.includes("csv");

    if (isExcel) {
      try {
        const parsedData = parseExcelObservationSheet(req.file.buffer, req.file.originalname);
        applyParsedUpdate(parsedData);
      } catch (err) {
        console.warn("Excel update parse notice:", err.message);
      }
      existing.pdfFileName = req.file.originalname;
      existing.pdfFileSize = req.file.buffer.length;
      existing.fileType = "xlsx";
      existing.pdfUrl = await uploadTemplatePdf(req.file.buffer, req.file.originalname);
    } else {
      let finalBuffer = req.file.buffer;
      try {
        const parseResult = await parsePdfWithPython(req.file.buffer);
        finalBuffer = parseResult.compressedBuffer;
        applyParsedUpdate(parseResult.parsed);
      } catch (_) {}
      existing.pdfFileName = req.file.originalname;
      existing.pdfFileSize = finalBuffer.length;
      existing.fileType = "pdf";
      existing.pdfUrl = await uploadTemplatePdf(finalBuffer, req.file.originalname);
    }
  }

  await mongoose.connection
    .collection("observationtemplates")
    .updateOne({ _id: objId }, { $set: { ...existing, updatedAt: new Date() } });

  const updatedDoc = await mongoose.connection
    .collection("observationtemplates")
    .findOne({ _id: objId });

  return res.status(200).json(
    new ApiResponse(200, updatedDoc, "Observation template updated successfully")
  );
});

/**
 * 5. DELETE OBSERVATION TEMPLATE
 */
export const deleteObservationTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !isValidMongoId(id)) {
      throw new ApiError(400, "Invalid Template ID");
    }

    const objId = new mongoose.Types.ObjectId(id);

    // 1. Delete from MongoDB Atlas collection directly
    const deleted = await mongoose.connection
      .collection("observationtemplates")
      .findOneAndDelete({ _id: objId });

    const doc = deleted?.value || deleted;

    // 2. Clean up local PDF file from disk across all folders
    if (doc?.pdfUrl && doc.pdfUrl.startsWith("/uploads/observation_templates/")) {
      const relPath = doc.pdfUrl.replace(/^\//, "");
      const dirs = [
        path.resolve(process.cwd(), "public", relPath),
        path.resolve(process.cwd(), "backend/public", relPath),
        path.resolve(process.cwd(), "frontend/public", relPath),
      ];
      for (const f of dirs) {
        try {
          if (fs.existsSync(f)) await fs.promises.unlink(f);
        } catch (_) {}
      }
    }

    console.log(`[API] Observation format ${id} deleted from database.`);
    return res.status(200).json(
      new ApiResponse(200, null, "Observation template deleted successfully")
    );
  } catch (err) {
    next(err);
  }
};

/**
 * 6. PARSE PDF PREVIEW / CONVERT TO FORM ON DEMAND (FROM UPLOAD OR CLOUDINARY URL)
 */
export const parsePdfPreview = asyncHandler(async (req, res) => {
  let fileBuffer = req.file?.buffer;
  let fileName = req.file?.originalname || "template.pdf";
  let fileSize = req.file?.size || 0;

  // Support on-demand conversion from Cloudinary URL or templateId
  const requestedUrl = req.body?.pdfUrl || req.query?.pdfUrl;
  const templateId = req.body?.templateId || req.query?.templateId;

  if (!fileBuffer && templateId) {
    if (isValidMongoId(templateId)) {
      const tmpl = await mongoose.connection
        .collection("observationtemplates")
        .findOne({ _id: new mongoose.Types.ObjectId(templateId) });
      if (tmpl?.pdfUrl) {
        fileBuffer = await fetchPdfBufferFromUrl(tmpl.pdfUrl);
        fileName = tmpl.pdfFileName || "template.pdf";
        fileSize = fileBuffer.length;
      }
    }
  }

  if (!fileBuffer && requestedUrl) {
    fileBuffer = await fetchPdfBufferFromUrl(requestedUrl);
    fileName = path.basename(requestedUrl.split("?")[0]) || "template.pdf";
    fileSize = fileBuffer.length;
  }

  if (!fileBuffer) {
    throw new ApiError(400, "Please upload a valid PDF or Excel (.xlsx / .xls) document to convert into form");
  }

  const isExcel =
    Boolean(fileName?.match(/\.(xlsx|xls|csv)$/i)) ||
    req.file?.mimetype?.includes("sheet") ||
    req.file?.mimetype?.includes("excel") ||
    req.file?.mimetype?.includes("csv");

  if (isExcel) {
    const parsed = parseExcelObservationSheet(fileBuffer, fileName);
    const origSize = fileSize || fileBuffer.length;
    const outputData = {
      ...parsed,
      compression: {
        originalBytes: origSize,
        compressedBytes: origSize,
        savedPercent: "0%",
      },
    };
    return res.status(200).json(
      new ApiResponse(200, outputData, "Excel observation format parsed and converted into form successfully")
    );
  }

  const { parsed, compressedBuffer } = await parsePdfWithPython(fileBuffer);
  const origSize = fileSize || fileBuffer.length;
  const compSize = compressedBuffer?.length || origSize;
  const outputData = {
    ...parsed,
    compression: {
      originalBytes: origSize,
      compressedBytes: compSize,
      savedPercent: origSize > compSize ? `${Math.round((1 - compSize / origSize) * 100)}%` : "0%",
    },
  };

  return res.status(200).json(
    new ApiResponse(200, outputData, "PDF observation format parsed and converted into form successfully")
  );
});

/**
 * 7. STREAM / VIEW TEMPLATE PDF OR EXCEL (FROM CLOUDINARY OR LOCAL DISK)
 */
export const streamTemplatePdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetId = String(id || "").trim();
  console.log("[streamTemplatePdf] Requested ID:", targetId);

  let tmpl = null;
  if (targetId && isValidMongoId(targetId)) {
    tmpl = await mongoose.connection
      .collection("observationtemplates")
      .findOne({ _id: new mongoose.Types.ObjectId(targetId) });
  }

  if (!tmpl && targetId) {
    tmpl = await mongoose.connection
      .collection("observationtemplates")
      .findOne({ _id: targetId });
  }

  // If ID not found directly, check if equipment/instrument/name was provided in query
  const searchName = req.query.equipment || req.query.instrument || req.query.name;
  if (!tmpl && searchName) {
    const clean = String(searchName).trim();
    if (clean) {
      tmpl = await mongoose.connection
        .collection("observationtemplates")
        .findOne({
          $or: [
            { name: { $regex: clean, $options: "i" } },
            { equipmentType: { $regex: clean, $options: "i" } },
          ],
          pdfUrl: { $exists: true, $ne: "" },
        });
      if (tmpl) {
        console.log(`[streamTemplatePdf] Found template by equipment query "${clean}": ${tmpl.name} (${tmpl._id})`);
      }
    }
  }

  console.log("[streamTemplatePdf] Resolved tmpl:", tmpl?._id, tmpl?.name, "pdfFileName:", tmpl?.pdfFileName, "fileType:", tmpl?.fileType);

  if (!tmpl || !tmpl.pdfUrl) {
    throw new ApiError(404, "Document format not available for this template");
  }

  const isExcel = Boolean(tmpl.pdfFileName?.match(/\.(xlsx|xls|csv)$/i)) || tmpl.fileType === "xlsx";
  const fileName = tmpl.pdfFileName || `${tmpl.name || "observation_format"}.${isExcel ? "xlsx" : "pdf"}`;

  try {
    const fileBuffer = await fetchPdfBufferFromUrl(tmpl.pdfUrl, fileName);

    res.removeHeader("X-Frame-Options");
    res.setHeader(
      "Content-Type",
      isExcel
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf"
    );
    res.setHeader(
      "Content-Disposition",
      `${isExcel ? "attachment" : "inline"}; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader("Content-Length", fileBuffer.length);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(fileBuffer);
  } catch (err) {
    console.error(`[streamTemplatePdf] Failed to stream file for ${tmpl.name}:`, err.message);
    throw new ApiError(500, `Failed to load document: ${err.message}`);
  }
});

/**
 * 8. CONVERT PDF FROM CLOUDINARY TO DIGITAL OBSERVATION FORM ON DEMAND
 */
export const convertCloudinaryPdfToForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pdfUrl, templateId } = req.body || {};

  let targetPdfUrl = pdfUrl;
  let targetTmpl = null;
  const targetId = id || templateId;

  if (targetId && isValidMongoId(targetId)) {
    targetTmpl = await mongoose.connection
      .collection("observationtemplates")
      .findOne({ _id: new mongoose.Types.ObjectId(targetId) });
    if (targetTmpl?.pdfUrl) {
      targetPdfUrl = targetTmpl.pdfUrl;
    }
  }

  if (!targetPdfUrl) {
    throw new ApiError(400, "Please provide a valid Cloudinary PDF URL or Template ID to convert into form");
  }

  console.log(`[API] Converting document to form on request from: ${targetPdfUrl}`);
  const preferredName = targetTmpl?.pdfFileName || targetTmpl?.name || "";
  const fileBuffer = await fetchPdfBufferFromUrl(targetPdfUrl, preferredName);

  const isExcel =
    Boolean(targetPdfUrl?.match(/\.(xlsx|xls|csv)$/i)) ||
    Boolean(preferredName?.match(/\.(xlsx|xls|csv)$/i)) ||
    targetTmpl?.fileType === "xlsx";

  let parsed = null;
  let compressedBuffer = null;
  if (isExcel) {
    parsed = parseExcelObservationSheet(fileBuffer, preferredName || "template.xlsx");
  } else {
    const res = await parsePdfWithPython(fileBuffer);
    parsed = res.parsed;
    compressedBuffer = res.compressedBuffer;
  }

  // If targetPdfUrl was local, auto-upload to Cloudinary so it becomes a real Cloudinary asset
  if (targetPdfUrl && !targetPdfUrl.startsWith("http://") && !targetPdfUrl.startsWith("https://")) {
    try {
      const origName = targetTmpl?.pdfFileName || path.basename(targetPdfUrl);
      const cldUrl = await uploadTemplatePdf(fileBuffer, origName);
      if (cldUrl && (cldUrl.startsWith("http://") || cldUrl.startsWith("https://"))) {
        targetPdfUrl = cldUrl;
        if (targetTmpl) {
          await mongoose.connection.collection("observationtemplates").updateOne(
            { _id: targetTmpl._id },
            { $set: { pdfUrl: cldUrl } }
          );
        }
      }
    } catch (cldSyncErr) {
      console.warn("Cloudinary sync notice:", cldSyncErr.message);
    }
  }

  // If a template exists, update its tableColumns, parameters, and defaultReadings
  if (targetTmpl) {
    const mergedParams = { ...(targetTmpl.parameters || {}) };
    if (/^[0-5]$/.test(String(mergedParams.range || "").trim())) mergedParams.range = "";
    if (/^[0-5]$/.test(String(mergedParams.leastCount || "").trim())) mergedParams.leastCount = "";
    if (/^location$/i.test(String(mergedParams.location || "").trim())) mergedParams.location = "";
    Object.entries(parsed.parameters || {}).forEach(([k, v]) => {
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0);
      if (!isEmpty) mergedParams[k] = v;
    });
    await mongoose.connection.collection("observationtemplates").updateOne(
      { _id: targetTmpl._id },
      {
        $set: {
          tableColumns: parsed.tableColumns || targetTmpl.tableColumns,
          defaultReadings: parsed.defaultReadings || targetTmpl.defaultReadings,
          parameters: mergedParams,
          standardReference: (parsed.standardReference && !parsed.standardReference.includes("Metrology Standard"))
            ? parsed.standardReference
            : targetTmpl.standardReference,
          calibrationMethod: (parsed.calibrationMethod && parsed.calibrationMethod !== "ARCL-CP-STANDARD")
            ? parsed.calibrationMethod
            : targetTmpl.calibrationMethod,
          reportData: parsed.reportData || targetTmpl.reportData || {},
          amuData: parsed.amuData || targetTmpl.amuData || {},
          sheetsSummary: parsed.sheetsSummary || targetTmpl.sheetsSummary || [],
          exactSheets: parsed.exactSheets || targetTmpl.exactSheets || [],
          formulaType: parsed.formulaType || targetTmpl.formulaType,
          equipmentType: parsed.equipmentType || targetTmpl.equipmentType,
          updatedAt: new Date(),
        },
      }
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...parsed,
        pdfUrl: targetPdfUrl,
        templateId: targetTmpl?._id,
      },
      "PDF converted from Cloudinary into Digital Observation Form successfully! 🚀"
    )
  );
});

/**
 * 9. SYNC ALL MASTER TEMPLATES FROM LOCAL DIRECTORY (e.g. D:\ARCL OBSERVATION REPORT AMU)
 */
export const resolveTemplateSyncDirectory = (customDir) => {
  if (customDir && fs.existsSync(customDir)) {
    const customFiles = fs.readdirSync(customDir).filter((f) => f.match(/\.(xlsx|xls)$/i));
    if (customFiles.length > 5) return customDir;
  }
  const candidates = [
    path.resolve(process.cwd(), "public/uploads/observation_templates"),
    path.resolve(process.cwd(), "backend/public/uploads/observation_templates"),
    "D:\\ARCL OBSERVATION REPORT AMU",
    path.resolve(process.cwd(), "frontend/public/uploads/observation_templates"),
    path.resolve(process.cwd(), "uploads/observation_templates"),
  ];
  let bestDir = null;
  let maxCount = 0;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const files = fs.readdirSync(c).filter((f) => f.match(/\.(xlsx|xls)$/i));
      if (files.length > maxCount) {
        maxCount = files.length;
        bestDir = c;
      }
    }
  }
  return bestDir || candidates[0];
};

export const syncTemplatesFromDirectory = asyncHandler(async (req, res) => {
  // Auto-sync is completely disabled as per user instruction. All formats must come from user uploads.
  return res.status(200).json(
    new ApiResponse(
      200,
      { syncedCount: 0, importedCount: 0, updatedCount: 0, syncedList: [] },
      "Automatic template sync is disabled. Only user-uploaded formats are loaded."
    )
  );
});


