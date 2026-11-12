import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import XLSX from "xlsx";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WINDOWS_OCR_PS1 = path.join(__dirname, "windowsOcr.ps1");
const WINDOWS_SCANNER_PS1 = path.join(__dirname, "windowsScanner.ps1");
const RAPID_SCAN_PY = path.join(__dirname, "rapidScanParser.py");

const IS_CALCULATED_COL = (col) =>
  col?.type === "calculated" ||
  col?.type === "formula" ||
  /^(error|inderror|errorrpm|uncertainty|relativeerror|repeatabilityerror)/i.test(col?.key || "") ||
  /error|uncertainty|tolerance|relative\s*repeatability|expanded/i.test(col?.label || "");

const normalizeColumns = (columns = []) => {
  const allCols = Array.isArray(columns) ? columns.filter((c) => c && (c.key || c.label)) : [];
  const rawCols = allCols.filter((c) => !IS_CALCULATED_COL(c));
  return {
    allCols,
    rawCols: rawCols.length > 0 ? rawCols : allCols,
  };
};

const extractNumbers = (str = "") => {
  const matches = String(str).match(/[+-]?\d+(?:\.\d+)?/g);
  return matches || [];
};

const isSkippableRowText = (text = "") => {
  const low = text.toLowerCase();
  if (!low.trim()) return true;
  if (
    /\b(temp|temperature|humidity|\brh\b|calibrated\s*by|reviewed|approved|format\s*no|issue\s*no|page\s*no|inward|srf\s*no|ulr|certificate|client|date\s*of|due\s*date|repeatability|master\s*equip|id\s*mark|traceable|arcl\s*instruments|shop\s*no|gstin|phone|email|method|reference|least\s*count|condition)\b/i.test(
      low
    )
  ) {
    return true;
  }
  // Skip standalone dates like 11-11-2026 or 11/11/2026
  if (/^\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s*$/.test(low)) return true;
  return false;
};

/**
 * Shared text-line parser: maps extracted lines (from OCR, PDF, or text) into
 * observation metadata + readings rows matching active template columns.
 */
export const parseObservationTextLines = (lines = [], columns = []) => {
  const normalizedLines = (Array.isArray(lines) ? lines : [])
    .map((l) => (typeof l === "string" ? { text: l, words: [] } : l))
    .filter((l) => l && String(l.text || "").trim());

  const fullText = normalizedLines.map((l) => l.text).join("\n");
  const metadata = {};
  let repeatabilityReadings = null;

  for (const line of normalizedLines) {
    const txt = String(line.text || "").trim();

    if (!metadata.temperature) {
      const m =
        txt.match(/(?:temp(?:erature)?)\s*[:=\-]?\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?(?:\s*±\s*\d+(?:\.\d+)?)?)\s*(?:°\s*C|C\b|deg)/i) ||
        txt.match(/(?:temp(?:erature)?)\s*[:=\-]\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?)/i);
      if (m && m[1]) {
        metadata.temperature = m[1].replace(/\s+/g, " ").trim();
      }
    }

    if (!metadata.humidity) {
      const m =
        txt.match(/(?:humidity|\bRH\b|relative\s*humidity)\s*[:=\-]?\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?(?:\s*[±-]\s*\d+(?:\.\d+)?)?)\s*%/i) ||
        txt.match(/(?:humidity|\bRH\b|relative\s*humidity)\s*[:=\-]\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?(?:\s*[±-]\s*\d+(?:\.\d+)?)?)/i);
      if (m && m[1] && /\d/.test(m[1])) {
        const cleaned = m[1].replace(/\s+/g, " ").trim();
        if (cleaned) metadata.humidity = cleaned;
      }
    }

    if (!metadata.calibratedBySite) {
      const m = txt.match(/(?:calibrated\s*by|calibration\s*by|tested\s*by)\s*[:=\-]\s*([A-Za-z][A-Za-z0-9.\s]{1,40})$/i);
      if (m && m[1]) {
        metadata.calibratedBySite = m[1].trim();
      }
    }

    if (!metadata.calibrationMethod) {
      const m = txt.match(/(?:method\s*of\s*calibration|cal\.?\s*method)\s*[:=\-]\s*(.+)$/i);
      if (m && m[1] && m[1].trim().length <= 60) {
        metadata.calibrationMethod = m[1].trim();
      }
    }

    if (!metadata.referenceStandard) {
      const m = txt.match(/(?:reference\s*standard)\s*[:=\-]\s*(.+)$/i);
      if (m && m[1] && m[1].trim().length <= 90) {
        metadata.referenceStandard = m[1].trim();
      }
    }

    if (!metadata.remarks) {
      const m = txt.match(/(?:remarks?)\s*[:=\-]\s*(.+)$/i);
      if (m && m[1] && m[1].trim().length >= 3) {
        metadata.remarks = m[1].trim();
      }
    }

    if (!repeatabilityReadings && /(?:repeatability|\bMU\b|\bR1\b)/i.test(txt)) {
      const nums = extractNumbers(txt).filter((n) => !/^([1-5])$/.test(n) || !/R[1-5]/i.test(txt));
      if (nums.length >= 2) {
        const five = nums.slice(-5);
        while (five.length < 5) five.push("");
        repeatabilityReadings = five;
      }
    }
  }

  // Extract tabular readings
  const { allCols, rawCols } = normalizeColumns(columns);
  const readings = [];

  for (const line of normalizedLines) {
    const txt = String(line.text || "").trim();
    if (isSkippableRowText(txt)) continue;

    // Prefer spatially grouped numeric tokens when word boxes exist
    let rowTokens = [];
    if (Array.isArray(line.words) && line.words.length > 0) {
      const sortedWords = [...line.words].sort((a, b) => (a.x || 0) - (b.x || 0));
      for (const w of sortedWords) {
        const wText = String(w.text || "").trim();
        if (!wText) continue;
        // Split merged OCR digits safely while keeping signed decimals
        const nums = extractNumbers(wText);
        if (nums.length > 0 && /^[\d+\-.,%°()/\s]+$/.test(wText)) {
          rowTokens.push(...nums);
        } else if (nums.length === 1 && wText.length <= 14) {
          rowTokens.push(nums[0]);
        }
      }
    } else {
      rowTokens = extractNumbers(txt);
    }

    // Require at least 2 numeric values in a line to treat as a calibration reading row
    if (rowTokens.length < 2) continue;

    // Drop trailing/leading date-like noise or single Sr.No if rowTokens has 1 extra leading integer 1..25
    const targetCols =
      allCols.length > 0 && rowTokens.length >= allCols.length
        ? allCols
        : rawCols.length > 0
        ? rawCols
        : allCols;

    if (targetCols.length === 0) continue;

    // If first column is NOT "sr" / "sl" / "sno", but row has exact length = targetCols.length + 1 starting with small integer index
    let usableTokens = [...rowTokens];
    const firstColKey = String(targetCols[0]?.key || "").toLowerCase();
    const firstColLabel = String(targetCols[0]?.label || "").toLowerCase();
    const firstIsSr = /^(sr|sl|s_?no|serial)/i.test(firstColKey) || /\bsr\.?\s*no\b/i.test(firstColLabel);
    if (!firstIsSr && usableTokens.length === targetCols.length + 1 && /^\d{1,2}$/.test(usableTokens[0])) {
      usableTokens = usableTokens.slice(1);
    }

    const rowObj = {};
    let populatedCount = 0;
    for (let i = 0; i < Math.min(targetCols.length, usableTokens.length); i++) {
      const col = targetCols[i];
      if (!col?.key) continue;
      rowObj[col.key] = String(usableTokens[i]);
      populatedCount += 1;
    }

    if (populatedCount >= 2) {
      readings.push(rowObj);
    }
  }

  return {
    rawText: fullText,
    metadata,
    repeatabilityReadings,
    readings,
  };
};

const formatXlsxCell = (cell) => {
  if (!cell) return "";
  if (cell.t === "d" && cell.v instanceof Date && !isNaN(cell.v.getTime())) {
    const dd = String(cell.v.getDate()).padStart(2, "0");
    const mm = String(cell.v.getMonth() + 1).padStart(2, "0");
    const yyyy = cell.v.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== "") {
    return String(cell.w).trim();
  }
  return cell.v !== undefined && cell.v !== null ? String(cell.v).trim() : "";
};

/**
 * Parse a filled Excel/CSV sheet uploaded by the technician and map both:
 * 1. Exact cell references for 1:1 ExactSheetRenderer (`exactSheetValues`)
 * 2. Metadata & table readings for Standard ARCL Form
 */
export const parseFilledExcelBuffer = (fileBuffer, columns = [], exactSheets = []) => {
  const wb = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
  const sheetNames = wb.SheetNames || [];
  const exactSheetValues = {};
  const mappedReadingsFromExact = [];
  const textLines = [];

  for (const sName of sheetNames) {
    const ws = wb.Sheets[sName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    rows.forEach((rowArr) => {
      const cleaned = (Array.isArray(rowArr) ? rowArr : [])
        .map((v) => String(v ?? "").trim())
        .filter((v) => v !== "");
      if (cleaned.length > 0) {
        textLines.push(cleaned.join("   "));
      }
    });
  }

  // If template has 1:1 cloned exactSheets, copy every filled input cell cleanly
  if (Array.isArray(exactSheets) && exactSheets.length > 0) {
    exactSheets.forEach((tmplSheet, idx) => {
      const targetSheetName = tmplSheet.sheetName || `Sheet ${idx + 1}`;
      const matchedName =
        sheetNames.find((n) => n.toLowerCase().trim() === targetSheetName.toLowerCase().trim()) ||
        (idx === 0 ? sheetNames[0] : null);
      const ws = matchedName ? wb.Sheets[matchedName] : null;
      if (!ws) return;

      const blockRows = Array.isArray(tmplSheet.blocks)
        ? tmplSheet.blocks.flatMap((b) => (Array.isArray(b?.rows) ? b.rows : []))
        : [];
      const directRows = Array.isArray(tmplSheet.rows) ? tmplSheet.rows : [];
      const allSheetRows = [...blockRows, ...directRows];

      allSheetRows.forEach((rowMeta) => {
        (rowMeta?.cells || []).forEach((cellMeta) => {
          if (!cellMeta?.ref || (cellMeta.kind !== "input" && !cellMeta.editable)) return;
          const wsCell = ws[cellMeta.ref];
          const val = formatXlsxCell(wsCell);
          if (val !== "") {
            exactSheetValues[`${targetSheetName}!${cellMeta.ref}`] = val;
            if (cellMeta.obsKey && typeof cellMeta.obsRowIdx === "number" && cellMeta.obsRowIdx >= 0) {
              while (mappedReadingsFromExact.length <= cellMeta.obsRowIdx) {
                mappedReadingsFromExact.push({});
              }
              mappedReadingsFromExact[cellMeta.obsRowIdx][cellMeta.obsKey] = val;
            }
          }
        });
      });
    });
  }

  const parsedLines = parseObservationTextLines(textLines, columns);
  const nonEmptyExactReadings = mappedReadingsFromExact.filter(
    (r) => r && Object.values(r).some((v) => String(v || "").trim() !== "")
  );

  return {
    engine: "Excel Cell Mapper (Offline Exact)",
    rawText: parsedLines.rawText,
    extracted: {
      metadata: parsedLines.metadata,
      repeatabilityReadings: parsedLines.repeatabilityReadings,
      exactSheetValues,
      readings:
        nonEmptyExactReadings.length > 0 ? nonEmptyExactReadings : parsedLines.readings,
    },
    warnings: [],
  };
};

/**
 * Use Python PyMuPDF to extract selectable text AND rasterize page 1 if the PDF is a scanned image.
 */
const extractPdfTextAndRaster = async (fileBuffer) => {
  const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const pdfPath = path.join(os.tmpdir(), `arcl_filled_${tmpId}.pdf`);
  const pngPath = path.join(os.tmpdir(), `arcl_filled_${tmpId}.png`);

  const pyCode = [
    "import sys, json",
    "try:\n  import pymupdf as fitz\nexcept ImportError:\n  import fitz",
    "doc = fitz.open(sys.argv[1])",
    "lines = []",
    "for p in doc:",
    "  txt = p.get_text('text') or ''",
    "  for ln in txt.splitlines():",
    "    if ln.strip(): lines.append(ln.strip())",
    "has_text = sum(len(x) for x in lines) >= 35",
    "if (not has_text or len(sys.argv) > 2) and len(doc) > 0:",
    "  pix = doc[0].get_pixmap(dpi=210)",
    "  pix.save(sys.argv[2])",
    "print(json.dumps({'lines': lines, 'pages': len(doc), 'hasText': has_text}))",
  ].join("\n");

  try {
    await fs.promises.writeFile(pdfPath, fileBuffer);
    const { stdout } = await execFileAsync("python", ["-c", pyCode, pdfPath, pngPath], {
      timeout: 25000,
      maxBuffer: 15 * 1024 * 1024,
    });
    const jsonMatch = String(stdout || "").match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    let renderedPngBuffer = null;
    if (fs.existsSync(pngPath)) {
      renderedPngBuffer = await fs.promises.readFile(pngPath);
    }
    return {
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
      hasText: Boolean(parsed.hasText),
      renderedPngBuffer,
    };
  } finally {
    if (fs.existsSync(pdfPath)) await fs.promises.unlink(pdfPath).catch(() => {});
    if (fs.existsSync(pngPath)) await fs.promises.unlink(pngPath).catch(() => {});
  }
};

/**
 * Normalize camera photos (fix EXIF orientation, convert WebP/JPG to crisp PNG, upscale small scans).
 */
const normalizeImageForOcr = async (imageBuffer, ext = ".png") => {
  const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const inPath = path.join(os.tmpdir(), `arcl_in_${tmpId}${ext || ".png"}`);
  const outPath = path.join(os.tmpdir(), `arcl_norm_${tmpId}.png`);

  const pyCode = [
    "import sys",
    "from PIL import Image, ImageOps",
    "im = ImageOps.exif_transpose(Image.open(sys.argv[1]))",
    "if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGB')",
    "w, h = im.size",
    "if max(w, h) < 1200:",
    "  scale = min(2.5, 1400.0 / max(1, max(w, h)))",
    "  im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)",
    "elif max(w, h) > 3200:",
    "  im.thumbnail((2800, 2800), Image.Resampling.LANCZOS)",
    "im.save(sys.argv[2], format='PNG')",
  ].join("\n");

  try {
    await fs.promises.writeFile(inPath, imageBuffer);
    await execFileAsync("python", ["-c", pyCode, inPath, outPath], { timeout: 15000 });
    return await fs.promises.readFile(outPath);
  } catch {
    return imageBuffer;
  } finally {
    if (fs.existsSync(inPath)) await fs.promises.unlink(inPath).catch(() => {});
    if (fs.existsSync(outPath)) await fs.promises.unlink(outPath).catch(() => {});
  }
};

/**
 * Inspect Soft Copy structure (template defaults + exactSheets + current unsaved state)
 * so the scanner knows EXACTLY which columns/cells are fixed vs unfilled.
 */
const buildFormatContext = (
  columns = [],
  currentReadings = [],
  activeTemplate = null,
  activeRecord = null,
  currentExactSheetValues = {},
  currentRepeatability = null
) => {
  const { allCols, rawCols } = normalizeColumns(columns);
  const templateDefaults = Array.isArray(activeTemplate?.defaultReadings) ? activeTemplate.defaultReadings : [];
  const rawReadings =
    Array.isArray(currentReadings) && currentReadings.length > 0 ? currentReadings : templateDefaults;

  // Exclude trailing all-blank extra rows (e.g., rows 9..11 in Excel template) from row anchor matching
  const rowHasAnyText = (row) =>
    row && typeof row === "object" && Object.values(row).some((v) => String(v ?? "").trim() !== "");
  let nonEmptyDefaults = templateDefaults.filter(rowHasAnyText);
  let nonEmptyCurrent = rawReadings.filter(rowHasAnyText);
  const rows = nonEmptyDefaults.length > 0 ? nonEmptyDefaults : nonEmptyCurrent.length > 0 ? nonEmptyCurrent : rawReadings;

  // Map 1:1 exactSheets layout (table cells, read-only label columns, and 5 Repeatability MU boxes)
  const labelObsKeys = new Set();
  const exactTableCellMap = {};
  const exactRepeatabilityCells = [];
  const sheets = Array.isArray(activeTemplate?.exactSheets) ? activeTemplate.exactSheets : [];

  const savedExact =
    currentExactSheetValues && typeof currentExactSheetValues === "object" && Object.keys(currentExactSheetValues).length > 0
      ? currentExactSheetValues
      : activeRecord?.observationData?.exactSheetValues || {};

  const savedRep = Array.isArray(currentRepeatability) && currentRepeatability.length > 0
    ? currentRepeatability
    : Array.isArray(activeRecord?.observationData?.repeatabilityReadings)
    ? activeRecord.observationData.repeatabilityReadings
    : [];

  sheets.forEach((sh, shIdx) => {
    const sName = sh.sheetName || `Sheet ${shIdx + 1}`;
    const blockRows = Array.isArray(sh.blocks)
      ? sh.blocks.flatMap((b) => (Array.isArray(b?.rows) ? b.rows : []))
      : [];

    blockRows.forEach((rw) => {
      const cells = Array.isArray(rw?.cells) ? rw.cells : [];
      const rowJoined = cells.map((c) => `${c?.value ?? ""} ${c?.placeholder ?? ""}`).join(" ");
      const isRepRow = /repeatability/i.test(rowJoined) && exactRepeatabilityCells.length === 0;

      cells.forEach((cell) => {
        if (!cell?.ref) return;
        const cellKey = `${sName}!${cell.ref}`;
        if (cell.obsKey && typeof cell.obsRowIdx === "number" && cell.obsRowIdx >= 0) {
          if (cell.kind === "label") {
            labelObsKeys.add(cell.obsKey);
          }
          exactTableCellMap[`${cell.obsRowIdx}:${cell.obsKey}`] = cellKey;
        }
        if (isRepRow && cell.kind === "input" && exactRepeatabilityCells.length < 5) {
          const idx = exactRepeatabilityCells.length;
          const liveVal =
            savedExact[cellKey] !== undefined
              ? savedExact[cellKey]
              : savedRep[idx] !== undefined
              ? savedRep[idx]
              : cell.value ?? "";
          exactRepeatabilityCells.push({
            idx,
            ref: cell.ref,
            sheetName: sName,
            cellKey,
            currentVal: String(liveVal ?? "").trim(),
            isEmpty: String(liveVal ?? "").trim() === "",
          });
        }
      });
    });
  });

  const emptyColKeys = [];
  const fixedColKeys = [];

  for (const col of rawCols) {
    if (!col?.key) continue;
    if (col.readOnly || col.fixed || IS_CALCULATED_COL(col) || labelObsKeys.has(col.key)) {
      fixedColKeys.push(col.key);
      continue;
    }
    const refRows = nonEmptyDefaults.length > 0 ? nonEmptyDefaults : rows;
    if (refRows.length === 0) {
      emptyColKeys.push(col.key);
      continue;
    }
    const filledInDefaults = refRows.filter((r) => String(r?.[col.key] ?? "").trim() !== "").length;
    if (filledInDefaults >= Math.ceil(refRows.length * 0.7)) {
      fixedColKeys.push(col.key);
    } else {
      emptyColKeys.push(col.key);
    }
  }

  // Track which fillable table cells ALREADY have a value in the current Soft Copy so scanner won't overwrite them
  const alreadyFilledTableCells = [];
  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    for (const cKey of emptyColKeys) {
      const fromRow = String(currentReadings?.[rIdx]?.[cKey] ?? "").trim();
      const mappedKey = exactTableCellMap[`${rIdx}:${cKey}`];
      const fromExact = mappedKey ? String(savedExact?.[mappedKey] ?? "").trim() : "";
      if (fromRow !== "" || fromExact !== "") {
        alreadyFilledTableCells.push(`${rIdx}:${cKey}`);
      }
    }
  }

  return {
    formatNo: activeTemplate?.parameters?.formatNo || activeRecord?.observationData?.formatNo || "",
    templateName: activeTemplate?.name || activeRecord?.instrument || "",
    instrument: activeRecord?.instrument || activeTemplate?.name || "",
    columns: allCols.map((c) => ({
      key: c.key,
      label: c.label || c.key,
      type: c.type || "number",
      unit: c.unit || "",
      readOnly: Boolean(c.readOnly || c.fixed || labelObsKeys.has(c.key) || IS_CALCULATED_COL(c)),
    })),
    emptyColKeys: emptyColKeys.length > 0 ? emptyColKeys : rawCols.map((c) => c.key),
    fixedColKeys,
    fixedRows: rows,
    alreadyFilledTableCells,
    exactTableCellMap,
    exactRepeatabilityCells,
  };
};

/**
 * Tier 1 Vision AI Extractor (Google Gemini Vision) when GEMINI_API_KEY is configured.
 * Strictly respects same-to-same format structure: extracts ONLY empty pen-filled cells.
 */
const extractWithGeminiVision = async (imageBuffer, mimeType, formatContext, activeRecord = null) => {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return null;

  const targetCols = (formatContext.columns || []).filter((c) =>
    (formatContext.emptyColKeys || []).includes(c.key)
  );

  const prompt = [
    "You are an ISO/IEC 17025 metrology assistant extracting handwritten pen data from a filled calibration observation sheet.",
    `Format No: ${formatContext.formatNo || "Standard"} | Instrument: ${activeRecord?.instrument || formatContext.instrument || "Calibration Equipment"}`,
    `FIXED/PRE-PRINTED ROWS ALREADY IN SYSTEM (DO NOT MODIFY THESE COLUMNS): ${JSON.stringify(formatContext.fixedRows || [])}`,
    `EMPTY TARGET COLUMNS TO EXTRACT FROM PEN HANDWRITING ONLY: ${JSON.stringify(targetCols)}`,
    "Extract ONLY the handwritten pen readings written in the empty target columns + the 5 'For Repeatability MU' handwritten boxes + any blank header fields.",
    "Match each row accurately against the pre-printed row anchor on the left. Never overwrite or duplicate pre-printed fixed columns.",
    "Return strict valid JSON (no markdown fences) in this shape:",
    '{"metadata":{"temperature":"","humidity":"","calibratedBySite":"","calibrationMethod":"","referenceStandard":"","remarks":""},"repeatabilityReadings":["","","","",""],"readings":[{}],"rawText":""}',
    "Inside readings[], align index 0..N-1 with FIXED ROWS and include ONLY keys from EMPTY TARGET COLUMNS.",
  ].join("\n");

  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType || "image/png",
                data: imageBuffer.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini Vision HTTP ${res.status}: ${errText.slice(0, 180)}`);
  }

  const data = await res.json();
  const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = textOut.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  const filledSet = new Set(formatContext.alreadyFilledTableCells || []);
  const tableMap = formatContext.exactTableCellMap || {};
  const repCells = formatContext.exactRepeatabilityCells || [];
  const exactSheetValues = {};
  const filteredReadings = (Array.isArray(parsed.readings) ? parsed.readings : []).map((row, rIdx) => {
    const outRow = {};
    Object.entries(row || {}).forEach(([k, v]) => {
      if ((formatContext.fixedColKeys || []).includes(k) || filledSet.has(`${rIdx}:${k}`)) return;
      const valStr = String(v ?? "").trim();
      if (!valStr) return;
      outRow[k] = valStr;
      if (tableMap[`${rIdx}:${k}`]) {
        exactSheetValues[tableMap[`${rIdx}:${k}`]] = valStr;
      }
    });
    return outRow;
  });

  const repArr = Array.isArray(parsed.repeatabilityReadings)
    ? parsed.repeatabilityReadings.slice(0, 5).map((v, idx) => {
        if (repCells[idx] && !repCells[idx].isEmpty) return "";
        const s = String(v ?? "").trim();
        if (s && repCells[idx]?.cellKey) exactSheetValues[repCells[idx].cellKey] = s;
        return s;
      })
    : null;

  return {
    engine: "Gemini Vision AI (Format-Matched Handwriting)",
    rawText: String(parsed.rawText || ""),
    formatMatch: {
      matched: true,
      formatNo: formatContext.formatNo,
      fixedColumnsProtected: formatContext.fixedColKeys || [],
      emptyTargetColumns: formatContext.emptyColKeys || [],
      matchedRows: (formatContext.fixedRows || []).length,
    },
    extracted: {
      metadata: parsed.metadata && typeof parsed.metadata === "object" ? parsed.metadata : {},
      repeatabilityReadings: repArr,
      exactSheetValues,
      readings: filteredReadings,
    },
    cellPreviews: [],
    repeatabilityPreviews: [],
    warnings: [],
  };
};

/**
 * Tier 2 Offline Format-Matched Pen Extractor (RapidOCR + OpenCV spatial alignment)
 */
const extractWithRapidScanParser = async (imageBuffer, ext = ".png", formatContext = {}) => {
  if (!fs.existsSync(RAPID_SCAN_PY)) return null;

  const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const tmpImg = path.join(os.tmpdir(), `arcl_rapid_${tmpId}${ext || ".png"}`);
  const tmpCtx = path.join(os.tmpdir(), `arcl_ctx_${tmpId}.json`);

  try {
    await fs.promises.writeFile(tmpImg, imageBuffer);
    await fs.promises.writeFile(tmpCtx, JSON.stringify(formatContext), "utf-8");

    const { stdout } = await execFileAsync("python", [RAPID_SCAN_PY, tmpImg, tmpCtx], {
      timeout: 45000,
      maxBuffer: 25 * 1024 * 1024,
    });

    const jsonMatch = String(stdout || "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed?.ok) return null;

    const readings = Array.isArray(parsed.readings) ? parsed.readings : [];
    const filledCount = readings.filter((r) => r && Object.values(r).some((v) => String(v || "").trim() !== "")).length;
    const repCount = (parsed.repeatabilityReadings || []).filter((v) => String(v || "").trim() !== "").length;
    const reviewCount = Number(parsed?.formatMatch?.needsReviewCount || 0);
    const totalRows = (formatContext.fixedRows || []).length;
    const warnings = [];
    if (filledCount === 0 && repCount === 0) {
      warnings.push("Format anchors matched, but offline OCR could not confidently read the handwritten pen numbers. Use the zoomed pen cell boxes below to enter/confirm them (or add GEMINI_API_KEY in backend/.env for handwritten AI OCR).");
    } else if (filledCount < totalRows || repCount < 5 || reviewCount > 0) {
      warnings.push(
        `Matched Soft Copy vs Scan: auto-filled ${filledCount}/${totalRows} table row(s) and ${repCount}/5 Repeatability boxes without changing fixed data.${reviewCount > 0 ? ` Please confirm ${reviewCount} unclear handwritten cell(s) using the zoomed crop below.` : ""}`
      );
    }

    return {
      engine: parsed.engine || "RapidOCR Format-Matched Pen Extractor",
      rawText: parsed.rawText || "",
      formatMatch: parsed.formatMatch || null,
      extracted: {
        metadata: parsed.metadata || {},
        repeatabilityReadings: parsed.repeatabilityReadings || null,
        exactSheetValues:
          parsed.exactSheetValues && typeof parsed.exactSheetValues === "object"
            ? parsed.exactSheetValues
            : {},
        readings,
      },
      cellPreviews: Array.isArray(parsed.cellPreviews) ? parsed.cellPreviews : [],
      repeatabilityPreviews: Array.isArray(parsed.repeatabilityPreviews) ? parsed.repeatabilityPreviews : [],
      warnings,
    };
  } catch (err) {
    console.warn("RapidScanParser fallback notice:", err.message);
    return null;
  } finally {
    if (fs.existsSync(tmpImg)) await fs.promises.unlink(tmpImg).catch(() => {});
    if (fs.existsSync(tmpCtx)) await fs.promises.unlink(tmpCtx).catch(() => {});
  }
};

/**
 * Tier 3 Offline OCR via Windows.Media.Ocr (zero external dependencies fallback).
 */
const extractWithWindowsOcr = async (pngBuffer, columns = [], formatContext = null) => {
  if (process.platform !== "win32" || !fs.existsSync(WINDOWS_OCR_PS1)) {
    return null;
  }

  const tmpImg = path.join(os.tmpdir(), `arcl_winocr_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
  try {
    await fs.promises.writeFile(tmpImg, pngBuffer);
    const { stdout } = await execFileAsync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", WINDOWS_OCR_PS1, "-ImagePath", tmpImg],
      { timeout: 25000, maxBuffer: 10 * 1024 * 1024 }
    );
    const jsonMatch = String(stdout || "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const ocr = JSON.parse(jsonMatch[0]);
    if (!ocr?.ok) return null;

    // Never overwrite fixed columns if formatContext already defines empty targets
    const targetCols = formatContext?.emptyColKeys?.length
      ? columns.filter((c) => formatContext.emptyColKeys.includes(c.key))
      : columns;

    const parsed = parseObservationTextLines(ocr.lines || [], targetCols);
    return {
      engine: "Windows Built-In Offline OCR",
      rawText: parsed.rawText || ocr.text || "",
      formatMatch: null,
      extracted: {
        metadata: parsed.metadata,
        repeatabilityReadings: parsed.repeatabilityReadings,
        exactSheetValues: {},
        readings: parsed.readings,
      },
      cellPreviews: [],
      repeatabilityPreviews: [],
      warnings:
        parsed.readings.length === 0
          ? ["Image text was scanned, but handwritten/table numbers may need manual review below or a GEMINI_API_KEY in backend/.env for handwriting AI."]
          : ["Offline OCR extracted printed/clear numbers — please verify all cells before locking."],
    };
  } finally {
    if (fs.existsSync(tmpImg)) await fs.promises.unlink(tmpImg).catch(() => {});
  }
};

/**
 * Main entrypoint for scanning / uploading filled observation sheets
 * (Mobile Photo, Scanner Image, Filled PDF, or Filled Excel/CSV).
 */
export const extractFromFilledObservationFile = async ({
  fileBuffer,
  originalName = "upload.png",
  mimeType = "",
  activeTemplate = null,
  currentColumns = [],
  currentReadings = [],
  currentExactSheetValues = {},
  currentRepeatabilityReadings = null,
  activeRecord = null,
}) => {
  const columns =
    Array.isArray(currentColumns) && currentColumns.length > 0
      ? currentColumns
      : Array.isArray(activeTemplate?.tableColumns)
      ? activeTemplate.tableColumns
      : [];
  const exactSheets = Array.isArray(activeTemplate?.exactSheets) ? activeTemplate.exactSheets : [];
  const lowerName = String(originalName || "").toLowerCase();
  const formatContext = buildFormatContext(
    columns,
    currentReadings,
    activeTemplate,
    activeRecord,
    currentExactSheetValues,
    currentRepeatabilityReadings
  );

  // 1. Filled Excel / CSV
  if (/\.(xlsx|xls|csv)$/i.test(lowerName) || mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) {
    return parseFilledExcelBuffer(fileBuffer, columns, exactSheets);
  }

  // 2. Filled PDF (Digital text PDF or Scanned Image PDF)
  if (/\.pdf$/i.test(lowerName) || mimeType === "application/pdf") {
    const warnings = [];
    const { lines, hasText, renderedPngBuffer } = await extractPdfTextAndRaster(fileBuffer);
    if (hasText && lines.length > 0) {
      const parsed = parseObservationTextLines(lines, columns);
      if (parsed.readings.length > 0 || Object.keys(parsed.metadata).length > 0) {
        return {
          engine: "PDF Direct Text & Table Extractor",
          rawText: parsed.rawText,
          formatMatch: null,
          extracted: {
            metadata: parsed.metadata,
            repeatabilityReadings: parsed.repeatabilityReadings,
            exactSheetValues: {},
            readings: parsed.readings,
          },
          cellPreviews: [],
          repeatabilityPreviews: [],
          warnings,
        };
      }
    }

    // Scanned PDF fallback -> pass rendered page 1 PNG into Vision / RapidOCR pipeline
    if (renderedPngBuffer) {
      return await extractFromImagePipeline(renderedPngBuffer, "image/png", ".png", columns, formatContext, activeRecord);
    }

    return {
      engine: "PDF Extractor",
      rawText: lines.join("\n"),
      formatMatch: null,
      extracted: { metadata: {}, repeatabilityReadings: null, exactSheetValues: {}, readings: [] },
      cellPreviews: [],
      repeatabilityPreviews: [],
      warnings: ["Could not detect readable table rows inside the uploaded PDF."],
    };
  }

  // 3. Hard-copy Camera Photo or Physical Scanner Image (.bmp, .png, .jpg, .webp)
  const ext = path.extname(lowerName) || ".png";
  return await extractFromImagePipeline(fileBuffer, mimeType || "image/png", ext, columns, formatContext, activeRecord);
};

async function extractFromImagePipeline(imageBuffer, mimeType, ext, columns, formatContext, activeRecord) {
  const warnings = [];
  const normPng = await normalizeImageForOcr(imageBuffer, ext);

  if (process.env.GEMINI_API_KEY) {
    try {
      const aiRes = await extractWithGeminiVision(normPng, "image/png", formatContext, activeRecord);
      if (aiRes) return aiRes;
    } catch (aiErr) {
      warnings.push(`Vision AI fallback triggered: ${aiErr.message}`);
    }
  }

  const rapidRes = await extractWithRapidScanParser(normPng, ".png", formatContext);
  if (rapidRes) {
    rapidRes.warnings = [...warnings, ...(rapidRes.warnings || [])];
    return rapidRes;
  }

  const winOcrRes = await extractWithWindowsOcr(normPng, columns, formatContext);
  if (winOcrRes) {
    winOcrRes.warnings = [...warnings, ...(winOcrRes.warnings || [])];
    return winOcrRes;
  }

  return {
    engine: "Hard-Copy Proof Attached (Manual Assist)",
    rawText: "",
    formatMatch: null,
    extracted: { metadata: {}, repeatabilityReadings: null, exactSheetValues: {}, readings: [] },
    cellPreviews: [],
    repeatabilityPreviews: [],
    warnings: [
      ...warnings,
      "Image attached safely as hard-copy proof. Automatic OCR could not read text cleanly — add GEMINI_API_KEY in backend/.env for handwritten scanning, or paste/edit readings below.",
    ],
  };
}

/**
 * List physical USB / Wi-Fi WIA scanners attached to the Windows host.
 */
export const listConnectedHardwareScanners = async () => {
  if (process.platform !== "win32" || !fs.existsSync(WINDOWS_SCANNER_PS1)) {
    return { supported: false, scanners: [], message: "Direct WIA hardware scanning requires a Windows host." };
  }
  try {
    const { stdout } = await execFileAsync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", WINDOWS_SCANNER_PS1, "-Action", "list"],
      { timeout: 12000, maxBuffer: 2 * 1024 * 1024 }
    );
    const jsonMatch = String(stdout || "").match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return {
      supported: true,
      ok: Boolean(parsed.ok),
      scanners: Array.isArray(parsed.scanners) ? parsed.scanners : [],
      message: parsed.error || "",
    };
  } catch (err) {
    return { supported: true, ok: false, scanners: [], message: err.message };
  }
};

/**
 * Acquire a fresh scan directly from the connected Windows WIA flatbed/ADF scanner.
 */
export const acquireFromHardwareScanner = async ({ deviceId = "", dpi = 200 } = {}) => {
  if (process.platform !== "win32" || !fs.existsSync(WINDOWS_SCANNER_PS1)) {
    throw new Error("Direct WIA hardware scanning is only supported when backend runs on Windows.");
  }

  const tmpOut = path.join(os.tmpdir(), `arcl_hwscan_${Date.now()}_${Math.random().toString(36).slice(2)}.png`);
  try {
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      WINDOWS_SCANNER_PS1,
      "-Action",
      "scan",
      "-OutPath",
      tmpOut,
      "-Dpi",
      String(dpi || 200),
    ];
    if (deviceId) args.push("-DeviceId", String(deviceId));

    const { stdout } = await execFileAsync("powershell", args, {
      timeout: 90000,
      maxBuffer: 5 * 1024 * 1024,
    });
    const jsonMatch = String(stdout || "").match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    if (!parsed?.ok) {
      const err = new Error(parsed?.error || "Hardware scanner failed to return an image.");
      err.noScanner = Boolean(parsed?.noScanner);
      throw err;
    }

    const actualPath = parsed.outPath && fs.existsSync(parsed.outPath) ? parsed.outPath : tmpOut;
    if (!fs.existsSync(actualPath)) {
      throw new Error("Scanner finished but image file was not saved.");
    }

    const ext = String(parsed.fileExtension || "png").toLowerCase().replace(/^\./, "");
    const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    const fileBuffer = await fs.promises.readFile(actualPath);
    const safeScannerName = String(parsed.scannerName || "Scanner").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 24);

    return {
      fileBuffer,
      mimeType,
      originalName: `scan_${safeScannerName}_${Date.now()}.${ext || "png"}`,
      scannerName: parsed.scannerName || "WIA Hardware Scanner",
    };
  } finally {
    if (fs.existsSync(tmpOut)) await fs.promises.unlink(tmpOut).catch(() => {});
  }
};
