import XLSX from "xlsx";
import fs from "fs";
import path from "path";

/**
 * Intelligent Multi-Sheet Excel Parser for ARCL Calibration Workbooks (.xlsx / .xls)
 * Automatically classifies and separates:
 * 1. Observation Worksheet (OB) -> Raw readings, test points, environmental parameters, master equipment
 * 2. Calibration Report / Certificate (Report) -> NABL certificate layout, result tables, pass/fail remarks
 * 3. AMU (Analysis of Measurement Uncertainty) -> Type A (repeatability), Type B (resolution, master uncertainty),
 *    Combined Uncertainty (uc), Coverage Factor (k=2), Expanded Uncertainty (UE), and Uncertainty Budget Table!
 * 4. Master Values (MV / Slip Gauge / Proving Ring) -> Calibrated master correction points
 */

// Helper to classify sheets in workbook
export const classifyWorkbookSheets = (sheetNames) => {
  let obsSheet = null;
  let reportSheet = null;
  const amuSheets = [];
  const masterSheets = [];

  // Pass 1: Identify Observation Sheet
  for (const s of sheetNames) {
    const low = s.toLowerCase().trim();
    if (/\bob\b|^ob|ob$|\bobs\b|obcervation|observation|obser/i.test(low)) {
      if (!obsSheet) obsSheet = s;
    }
  }

  // Pass 2: Identify AMU / Uncertainty Sheets
  for (const s of sheetNames) {
    if (s === obsSheet) continue;
    const low = s.toLowerCase().trim();
    if (/\bmu\b|mu$|^mu|\bamu\b|uncertainty|upto/i.test(low)) {
      amuSheets.push(s);
    }
  }

  // Pass 3: Identify Master Values / Mass Value / Slip Gauge
  for (const s of sheetNames) {
    if (s === obsSheet || amuSheets.includes(s)) continue;
    const low = s.toLowerCase().trim();
    if (/mass|slip|\bmv\b|^mv|pitch|tollerance|value of k/i.test(low)) {
      masterSheets.push(s);
    }
  }

  // Pass 4: Identify Report / Certificate Sheet
  for (const s of sheetNames) {
    if (s === obsSheet || amuSheets.includes(s) || masterSheets.includes(s)) continue;
    const low = s.toLowerCase().trim();
    if (/report|cert/i.test(low)) {
      reportSheet = s;
      break;
    }
  }

  // Pass 5: If Report sheet not explicitly named 'report', assign first non-obs, non-mu, non-mv sheet
  if (!reportSheet) {
    for (const s of sheetNames) {
      if (s !== obsSheet && !amuSheets.includes(s) && !masterSheets.includes(s)) {
        reportSheet = s;
        break;
      }
    }
  }

  // Fallback: If still no observation sheet, take first sheet
  if (!obsSheet && sheetNames.length > 0) {
    obsSheet = sheetNames[0];
  }

  return { obsSheet, reportSheet, amuSheets, masterSheets };
};

// Helper to build Excel merge lookup & formatted cell reader
const buildSheetHelpers = (worksheet) => {
  const merges = Array.isArray(worksheet?.["!merges"]) ? worksheet["!merges"] : [];

  const getMergeAt = (r, c) =>
    merges.find((m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) || null;

  const formatCellVal = (r, c, fallbackRaw = "") => {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = worksheet?.[addr];
    if (!cell) return String(fallbackRaw ?? "").trim();

    if (cell.t === "d" && cell.v instanceof Date && !isNaN(cell.v.getTime())) {
      const dd = String(cell.v.getDate()).padStart(2, "0");
      const mm = String(cell.v.getMonth() + 1).padStart(2, "0");
      const yyyy = cell.v.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

    if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== "") {
      return String(cell.w).trim();
    }

    return String(cell.v ?? fallbackRaw ?? "").trim();
  };

  const getCellFormula = (r, c) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = worksheet?.[addr];
    return cell?.f ? String(cell.f).trim() : "";
  };

  const formatExcelSerialDateIfNeeded = (val) => {
    const s = String(val ?? "").trim();
    if (!s) return "";
    if (/^\d{5}$/.test(s)) {
      const num = Number(s);
      if (num > 30000 && num < 70000 && XLSX.SSF?.parse_date_code) {
        const dt = XLSX.SSF.parse_date_code(num);
        if (dt && dt.y && dt.m && dt.d) {
          return `${String(dt.d).padStart(2, "0")}/${String(dt.m).padStart(2, "0")}/${dt.y}`;
        }
      }
    }
    return s;
  };

  return { merges, getMergeAt, formatCellVal, getCellFormula, formatExcelSerialDateIfNeeded };
};

// Parse Observation Sheet (OB)
const parseObservationData = (worksheet, sheetName, cleanBaseName) => {
  // Preserve exact row indices (blankrows: true) so worksheet['!merges'] aligns 1:1
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  if (!rawRows || rawRows.length === 0 || rawRows.every((r) => r.every((v) => String(v || "").trim() === ""))) {
    return {
      sheetName,
      name: cleanBaseName,
      equipmentType: "General Metrology",
      standardReference: "IS / ISO Metrology Standard",
      calibrationMethod: "ARCL-CP-STANDARD",
      parameters: {},
      tableColumns: [],
      defaultReadings: [],
    };
  }

  const { getMergeAt, formatCellVal, getCellFormula, formatExcelSerialDateIfNeeded } =
    buildSheetHelpers(worksheet);

  let detectedName = "";
  let detectedDiscipline = "";
  let defaultObsUnit = "";
  let detectedFormatNo = "";
  let detectedFormatIssueNo = "";
  let detectedFormatIssueDate = "";
  let detectedCalibDate = "";
  let detectedDueDate = "";
  let detectedInwardNo = "";
  let detectedReceiptDate = "";

  let detectedCondition = "OK";
  let detectedTemp = "25.0 ± 2°C";
  let detectedHumidity = "50 ± 10% RH";
  let detectedMethod = "ARCL-CP-STANDARD";
  let detectedStandard = "";
  let detectedRange = "";
  let detectedLeastCount = "";
  let detectedLocation = "";

  const masterEquipments = [];

  // 1. Title / Name from Header (R0 to R4)
  for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
    const rowStr = rawRows[r].join(" ");
    const m = rowStr.match(/Observation\s+(?:Sheet\s+)?of\s+([^|:]+)/i);
    if (m && m[1]?.trim().length > 2) {
      detectedName = m[1].replace(/\s+/g, " ").trim();
      break;
    }
  }

  // Detect Discipline & Observation Unit anywhere in sheet header rows
  for (let r = 0; r < Math.min(rawRows.length, 22); r++) {
    for (let c = 0; c < (rawRows[r] || []).length; c++) {
      const cell = String(rawRows[r][c] || "").trim();
      const discM = cell.match(/Discipline\s*:\s*(.+)/i);
      if (discM && !detectedDiscipline) {
        detectedDiscipline = discM[1].replace(/\s+/g, " ").trim();
      }
      const unitM = cell.match(/observ(?:a|t)ion\s*\(([^)]+)\)/i);
      if (unitM && !defaultObsUnit) {
        defaultObsUnit = unitM[1].trim();
      }
    }
  }

  // 2. Metadata Table Scan (Header Row with Values Row Below or Inline)
  const isSectionRow = (rowArr) => {
    const firstNonEmpty = String((rowArr || []).find((v) => String(v || "").trim() !== "") || "").trim();
    return /^(?:\d+\.|description\s+of|condition\s+of|environmental|method\s+of|reference\s+standard|details?\s+of)/i.test(firstNonEmpty);
  };
  const isMetadataLabel = (txt) =>
    /format|issue|inward|rec(?:ei)?pt|calib|due\s*date|ulr|cert/i.test(String(txt || ""));

  for (let r = 0; r < Math.min(rawRows.length, 6); r++) {
    const row = rawRows[r] || [];
    if (isSectionRow(row)) break;
    const prevRow = r > 0 ? rawRows[r - 1] || [] : [];
    const nextRow = r + 1 < rawRows.length && !isSectionRow(rawRows[r + 1]) ? rawRows[r + 1] : [];

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || "").trim();
      if (!cell || !isMetadataLabel(cell)) continue;
      const valBelow = String(nextRow[c] || "").trim();
      const belowIsLabel = isMetadataLabel(valBelow);
      const valInline =
        !isMetadataLabel(prevRow[c + 1]) && !isMetadataLabel(row[c + 1])
          ? String(row[c + 1] || "").trim()
          : "";
      const val = !belowIsLabel && valBelow ? valBelow : valInline;
      if (!val || isMetadataLabel(val)) continue;

      if (/^format\s*no(?:\.|\b)/i.test(cell) && !detectedFormatNo) detectedFormatNo = val;
      if (/format(?:e)?\s*issue\s*no|^issue\s*no(?:\.|\b)/i.test(cell) && !detectedFormatIssueNo) detectedFormatIssueNo = val;
      if (/format(?:e)?\s*issue\s*date|^issue\s*date(?:\.|\b)/i.test(cell) && !detectedFormatIssueDate) detectedFormatIssueDate = formatExcelSerialDateIfNeeded(val);
      if (/^date\s*of\s*calib/i.test(cell) && !detectedCalibDate) detectedCalibDate = formatExcelSerialDateIfNeeded(val);
      if (/^(?:next\s*)?due\s*date/i.test(cell) && !/^ARCL\//i.test(val) && !detectedDueDate) detectedDueDate = formatExcelSerialDateIfNeeded(val);
      if (/^inward\s*no/i.test(cell) && !detectedInwardNo) detectedInwardNo = val;
      if (/^date\s*of\s*rec(?:ei)?pt/i.test(cell) && !detectedReceiptDate) detectedReceiptDate = formatExcelSerialDateIfNeeded(val);
    }
  }

  // Helper to read inline field value without bleeding into adjacent labels or template row placeholders
  const readAdjacentFieldValue = (row, startCol, maxSteps = 5) => {
    const rightLabelStopRe = /^(?:location|condition|environmental|temp|rh|humidity|method|reference|sr\.?\s*no|make|instrument|range|least\s*count|id\s*no|\d+\.)/i;
    for (let k = startCol + 1; k < Math.min(row.length, startCol + 1 + maxSteps); k++) {
      const v = String(row[k] || "").trim();
      if (!v || v === ":-" || v === ":" || v === "-") continue;
      if (rightLabelStopRe.test(v)) break;
      return v;
    }
    return "";
  };

  // 3. Sections 1 to 5 (Condition, Environmental, Method, Standard, Range, Least Count)
  for (let r = 0; r < Math.min(rawRows.length, 16); r++) {
    const row = rawRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || "").trim();
      if (!cell) continue;

      if (/condition\s*of\s*item/i.test(cell)) {
        const v = readAdjacentFieldValue(row, c, 8);
        if (v && v !== "0") detectedCondition = v;
      }
      if (/temp(?:\.|\b)/i.test(cell) && !/master/i.test(cell)) {
        for (let k = c; k < Math.min(row.length, c + 4); k++) {
          const v = String(row[k] || "").trim();
          if (v && (v.includes("°") || v.includes("C") || /^\(?\d+/.test(v)) && !v.toLowerCase().startsWith("temp")) {
            detectedTemp = v;
            break;
          }
        }
      }
      if (/^(?:rh|humidity)\b/i.test(cell) || /environmental/i.test(row[0] || "")) {
        if (/^(?:rh|humidity)/i.test(cell)) {
          for (let k = c; k < Math.min(row.length, c + 4); k++) {
            const v = String(row[k] || "").trim();
            if (v && (v.includes("%") || /^\(?\d+/.test(v)) && !v.toLowerCase().startsWith("rh") && !v.toLowerCase().startsWith("humidity")) {
              detectedHumidity = v;
              break;
            }
          }
        }
      }
      if (/method\s*of\s*calib/i.test(cell)) {
        const v = readAdjacentFieldValue(row, c, 8);
        if (v) {
          detectedMethod = v;
          if (!detectedStandard && /(?:IS|ISO|ASTM|BS|DIN|NABL|IEC|OIML|DKD)/i.test(v)) {
            const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
            const stdParts = parts.filter((s) => !/^ARCL[-\s]?CP/i.test(s));
            const cpParts = parts.filter((s) => /^ARCL[-\s]?CP/i.test(s));
            if (stdParts.length > 0) detectedStandard = stdParts.join(", ");
            if (cpParts.length > 0) detectedMethod = cpParts.join(", ");
          }
        }
      }
      if (/reference\s*standard/i.test(cell)) {
        const v = readAdjacentFieldValue(row, c, 8);
        if (v) detectedStandard = v;
      }
      if (/^range(?:\s*\([^)]+\))?/i.test(cell) && !detectedRange) {
        const v = readAdjacentFieldValue(row, c, 3);
        // Ignore placeholder field index "4" or "0" from empty templates
        if (v && !/^[0-5]$/.test(v)) {
          detectedRange = v;
        }
      }
      if (/^(?:least\s*count|l\.?\s*c\.?)/i.test(cell) && !detectedLeastCount) {
        const v = readAdjacentFieldValue(row, c, 3);
        if (v && !/^[0-5]$/.test(v)) {
          detectedLeastCount = v;
        }
      }
      if (/^location\b/i.test(cell) && !detectedLocation) {
        const v = readAdjacentFieldValue(row, c, 4);
        if (v && !/^location$/i.test(v)) {
          detectedLocation = v;
        }
      }
    }
  }

  // 4. Master Equipment Table (Section 5 or 6)
  let masterHeaderRow = -1;
  let masterEndRow = -1;
  for (let r = 0; r < Math.min(rawRows.length, 20); r++) {
    const rowStr = (rawRows[r] || []).join(" ");
    if (/equip(?:e)?ment\s*description/i.test(rowStr) && /id\s*mark|certificate/i.test(rowStr)) {
      masterHeaderRow = r;
      break;
    }
  }

  if (masterHeaderRow >= 0) {
    const hRow = rawRows[masterHeaderRow] || [];
    let descCol = -1, idCol = -1, certCol = -1, calDateCol = -1, dueDateCol = -1, traceCol = -1;
    hRow.forEach((val, c) => {
      const s = String(val || "").toLowerCase();
      if (/equip(?:e)?ment\s*desc/i.test(s)) descCol = c;
      else if (/id\s*mark/i.test(s)) idCol = c;
      else if (/certificate/i.test(s)) certCol = c;
      else if (/calib(?:ration)?\s*date/i.test(s) && !/due/i.test(s)) calDateCol = c;
      else if (/due\s*date/i.test(s)) dueDateCol = c;
      else if (/traceab/i.test(s)) traceCol = c;
    });

    masterEndRow = masterHeaderRow;
    for (let r = masterHeaderRow + 1; r < Math.min(rawRows.length, masterHeaderRow + 8); r++) {
      const row = rawRows[r] || [];
      const rowStr = row.join(" ").toLowerCase();
      if (!rowStr.trim() || /sr\.?\s*no|nominal|specification|observ|discipline/i.test(rowStr)) break;
      const desc = descCol >= 0 ? String(row[descCol] || "").trim() : "";
      const idMark = idCol >= 0 ? String(row[idCol] || "").trim() : "";
      if (!desc && !idMark) break;

      const rawDue = dueDateCol >= 0 ? formatCellVal(r, dueDateCol, row[dueDateCol]) : "";
      const rawCal = calDateCol >= 0 ? formatCellVal(r, calDateCol, row[calDateCol]) : "";

      masterEquipments.push({
        description: desc,
        idMark: idMark,
        certNo: certCol >= 0 ? formatCellVal(r, certCol, row[certCol]) : "",
        calibDate: formatExcelSerialDateIfNeeded(rawCal),
        dueDate: formatExcelSerialDateIfNeeded(rawDue),
        traceableBy: traceCol >= 0 ? formatCellVal(r, traceCol, row[traceCol]) : "",
      });
      masterEndRow = r;
    }
  }

  // Locate start anchor for Observation Section ("6. Observation" / "7. Observation")
  let obsTitleRow = -1;
  for (let r = Math.max(0, masterEndRow + 1); r < Math.min(rawRows.length, 30); r++) {
    const firstNonEmpty = String((rawRows[r] || []).find((v) => String(v || "").trim() !== "") || "").trim();
    if (/^(?:\d+\.?\s*)?observ(?:a|t)ion\b/i.test(firstNonEmpty)) {
      obsTitleRow = r;
      break;
    }
  }

  // 5. Pure Observation Table Header Detection (supports any equipment format 1:1)
  let tableHeaderRow = -1;
  let bestScore = -100;
  const searchStartRow = obsTitleRow >= 0 ? obsTitleRow + 1 : Math.max(0, masterEndRow + 1);

  for (let r = searchStartRow; r < Math.min(rawRows.length, searchStartRow + 16); r++) {
    const row = rawRows[r] || [];
    const nonEmpties = row.map((v, c) => ({ c, v: String(v || "").replace(/\s+/g, " ").trim() })).filter((x) => x.v);
    if (nonEmpties.length === 0) continue;

    const firstCell = nonEmpties[0].v;
    const rowStr = nonEmpties.map((x) => x.v).join(" ");

    // Strictly skip section titles & footers
    if (
      /^(?:\d+\.?\s*)?(?:observ(?:a|t)ion|details?\s+of\s+master|description\s+of\s+equip|condition\s+of\s+item|environmental|method\s+of|reference\s+standard)\b/i.test(firstCell) ||
      /calibrat(?:ed?|ion)\s*by|checked\s*by|reviewed|authorized|approved|page\s*no|for\s*(?:repeatability\s*)?mu|for\s*mu\s*repeatability/i.test(rowStr) ||
      (nonEmpties.length <= 2 && /^discipline\s*:/i.test(nonEmpties[nonEmpties.length - 1].v))
    ) {
      continue;
    }

    if (nonEmpties.length < 2) continue;

    let score = 0;
    nonEmpties.forEach(({ v }) => {
      if (/\b(?:sr\.?\s*no|s\.?\s*no|sl\.?\s*no|item\s*no|mould\s*no)\b/i.test(v)) score += 18;
      if (/\b(?:nominal|denom|specification|gap\s*size|set\s*point|applied|load|speed|rpm|temp|pressure|dimension|size|aperture|sieve|mesh|standard\s*value|value\s*slip|parameter|description|requirement)\b/i.test(v)) score += 16;
      if (/\b(?:reading|observed|measured|actual|uuc|duc|indicated|master|trial|increasing|decreasing)\b/i.test(v)) score += 14;
      if (/\b(?:average|mean|error|deviation|correction|tolerance|permissible|uncertainty|remarks|unit|range|least\s*count|length|width|height|depth|dia(?:meter)?|thickness|squareness|weight|mass|voltage|current|resistance|time|angle)\b/i.test(v)) score += 10;
      if (/^\s*parameter\s*$/i.test(v) || /\bi\s*st\b|\bii\s*nd\b/i.test(v)) score -= 5;
      // Penalize rows that look like pure measurement data (e.g. "63-50", "33.9±0.1", pure numbers)
      if (/^\d+(?:\.\d+)?(?:\s*[-\u2013±]\s*\d+(?:\.\d+)?)?$/.test(v)) score -= 18;
    });

    if (score > bestScore && score > 0) {
      bestScore = score;
      tableHeaderRow = r;
    }
  }

  // Extract distinct column spans on a row using worksheet['!merges']
  const getRowCellSpans = (rIdx) => {
    const row = rawRows[rIdx] || [];
    const spans = [];
    const visitedCols = new Set();

    // Find max active column across row & merges on this row
    let maxCol = row.length - 1;
    row.forEach((v, c) => {
      const m = getMergeAt(rIdx, c);
      if (m && m.e.c > maxCol) maxCol = m.e.c;
    });

    for (let c = 0; c <= maxCol; c++) {
      if (visitedCols.has(c)) continue;
      const m = getMergeAt(rIdx, c);
      const startC = m ? m.s.c : c;
      const endC = m ? m.e.c : c;
      const startR = m ? m.s.r : rIdx;
      const text = String((rawRows[startR] || [])[startC] || row[c] || "").replace(/\s+/g, " ").trim();
      for (let k = startC; k <= endC; k++) visitedCols.add(k);
      if (text) {
        spans.push({
          cStart: startC,
          cEnd: endC,
          rStart: startR,
          rEnd: m ? m.e.r : rIdx,
          text,
        });
      }
    }
    return spans;
  };

  const tableColumns = [];
  let dataStartRow = tableHeaderRow >= 0 ? tableHeaderRow + 1 : searchStartRow;

  if (tableHeaderRow >= 0) {
    const topSpans = getRowCellSpans(tableHeaderRow);
    const subRowIdx = tableHeaderRow + 1;
    const subSpansRaw = subRowIdx < rawRows.length ? getRowCellSpans(subRowIdx) : [];

    // Exclude vertical merges inherited from topSpans
    const ownSubSpans = subSpansRaw.filter((sp) => sp.rStart === subRowIdx);

    const isSubHeaderKeyword = (txt) =>
      /^(?:1st|2nd|3rd|4th|5th|r\s*[1-5]|trial|uuc|duc|master|reading|obs|observed|measured|actual|od|id|depth|inc|increasing|dec|decreasing|up|down|warp|weft|left|right|top|mid|middle|bot|bottom|x|y|z|zero|mean|avg|average|error|std|unit|\(?[a-zA-Z°%µμ/]+\)?)$/i.test(
        txt.trim()
      ) || /\b(?:reading\s*\d+|trial\s*\d+|uuc|duc|increasing|decreasing|r\([id]\))\b/i.test(txt);

    const hasSubHeader =
      ownSubSpans.length >= 2 &&
      ownSubSpans.every((sp) => !/^\d+(?:\.\d+)?\s*[-\u2013±]\s*\d+(?:\.\d+)?$/.test(sp.text)) &&
      ownSubSpans.some((sp) => isSubHeaderKeyword(sp.text));

    const headerColumnSpecs = [];
    if (hasSubHeader) {
      dataStartRow = tableHeaderRow + 2;
      topSpans.forEach((top) => {
        // Check child sub-columns that fall horizontally inside this top span
        const children = ownSubSpans.filter(
          (sub) => sub.cStart >= top.cStart && sub.cEnd <= top.cEnd
        );
        if (children.length > 0 && top.rEnd === tableHeaderRow) {
          children.forEach((child) => {
            const topClean = top.text;
            const childClean = child.text;
            let fullLabel = childClean;
            if (topClean && childClean && !/^(?:observation|readings?)$/i.test(topClean) && topClean.toLowerCase() !== childClean.toLowerCase()) {
              fullLabel = `${topClean} — ${childClean}`;
            }
            headerColumnSpecs.push({
              label: fullLabel,
              cStart: child.cStart,
              cEnd: child.cEnd,
            });
          });
        } else {
          headerColumnSpecs.push({
            label: top.text,
            cStart: top.cStart,
            cEnd: top.cEnd,
          });
        }
      });

      // Also include any trailing sub-columns not enclosed by topSpans
      ownSubSpans.forEach((sub) => {
        const covered = headerColumnSpecs.some(
          (hc) => sub.cStart >= hc.cStart && sub.cEnd <= hc.cEnd
        );
        if (!covered) {
          headerColumnSpecs.push({
            label: sub.text,
            cStart: sub.cStart,
            cEnd: sub.cEnd,
          });
        }
      });
      headerColumnSpecs.sort((a, b) => a.cStart - b.cStart);
    } else {
      topSpans.forEach((sp) => {
        headerColumnSpecs.push({
          label: sp.text,
          cStart: sp.cStart,
          cEnd: sp.cEnd,
        });
      });
    }

    const seenKeys = new Set();
    const extractColUnit = (label) => {
      const mParen = label.match(/\(([^)]+)\)\s*$/);
      if (mParen && /^(?:mm|cm|m|µm|um|km|kg|g|mg|kN|N|bar|psi|kPa|MPa|Pa|°C|C|F|rpm|%|Hz|V|mV|A|mA|Ω|s|sec|min|hr|ml|ltr)$/i.test(mParen[1].trim())) {
        return mParen[1].trim();
      }
      const mInParens = label.match(/\((mm|kN|N|bar|psi|kPa|MPa|°C|rpm|%|µm|um|g|kg|mg|V|A|Ω)\)/i);
      if (mInParens) return mInParens[1].trim();
      const mComma = label.match(/,\s*(mm|kN|N|bar|psi|kPa|MPa|°C|rpm|%|µm|um|g|kg|mg)\s*$/i);
      if (mComma) return mComma[1].trim();
      return "";
    };

    headerColumnSpecs.forEach((spec) => {
      const fullLabel = spec.label.replace(/\s+/g, " ").trim();
      let key = `col_${spec.cStart}`;
      const l = fullLabel.toLowerCase();

      if (/^(?:sr|sl|s)\.?\s*no\.?$/i.test(l) || /^sr\.?\s*no/i.test(l)) key = "sNo";
      else if (/denom|nominal/i.test(l)) key = "nominal";
      else if (/specification|size\s*range/i.test(l)) key = "specification";
      else if (/gap\s*size/i.test(l)) key = "gapSize";
      else if (/value\s*slip|standard\s*weight|true\s*load|calibrated\s*value/i.test(l)) key = "standardValue";
      else if (/reading\s*on\s*master|master\s*value|observed.*master/i.test(l)) key = "masterValue";
      else if (/measured\s*gap/i.test(l)) key = "measuredGap";
      else if (/reading\s*,?\s*1|uuc\s*reading\s*,?\s*1|1st|trial\s*1/i.test(l)) key = "reading1";
      else if (/reading\s*,?\s*2|uuc\s*reading\s*,?\s*2|2nd|trial\s*2/i.test(l)) key = "reading2";
      else if (/reading\s*,?\s*3|uuc\s*reading\s*,?\s*3|3rd|trial\s*3/i.test(l)) key = "reading3";
      else if (/mean|average|duc\s*reading/i.test(l)) key = "average";
      else if (/error|deviation/i.test(l)) key = "error";
      else if (/measurement\s*desc|description/i.test(l)) key = "description";
      else if (/requirement/i.test(l)) key = "requirement";
      else if (/remark/i.test(l)) key = "remarks";

      let uniqueKey = key;
      let counter = 1;
      while (seenKeys.has(uniqueKey)) {
        counter++;
        uniqueKey = `${key}_${counter}`;
      }
      seenKeys.add(uniqueKey);

      // Inspect sample cells in this column span to determine accurate type & formula
      let hasFormula = "";
      let hasTextSample = false;
      for (let sr = dataStartRow; sr < Math.min(rawRows.length, dataStartRow + 6); sr++) {
        for (let sc = spec.cStart; sc <= spec.cEnd; sc++) {
          const f = getCellFormula(sr, sc);
          if (f && !hasFormula) hasFormula = f;
          const sample = String((rawRows[sr] || [])[sc] || "").trim();
          if (sample && (/±|[a-zA-Z]/.test(sample) || /^\d+(?:\.\d+)?\s*[-\u2013/]\s*\d+(?:\.\d+)?$/.test(sample))) {
            hasTextSample = true;
          }
        }
      }

      const isTextCol =
        key === "sNo" ||
        key === "specification" ||
        key === "gapSize" ||
        key === "description" ||
        key === "requirement" ||
        key === "remarks" ||
        hasTextSample;

      const isFormulaCol =
        Boolean(hasFormula) ||
        /^(?:error|deviation|indError|average|mean)/i.test(key);

      const unit = extractColUnit(fullLabel) || (!isTextCol && !isFormulaCol && defaultObsUnit ? defaultObsUnit : "");
      const minWidth = key === "sNo" ? "70px" : fullLabel.length > 26 ? "180px" : "120px";

      tableColumns.push({
        key: uniqueKey,
        label: fullLabel,
        unit,
        type: isFormulaCol ? "formula" : isTextCol ? "text" : "number",
        formula: hasFormula || "",
        minWidth,
        _cStart: spec.cStart,
        _cEnd: spec.cEnd,
      });
    });
  }

  // Fallback ONLY if no table header could be extracted at all (< 2 columns)
  const lowMeta = (cleanBaseName + " " + detectedName).toLowerCase();
  if (tableColumns.length < 2) {
    if (lowMeta.includes("mould") || lowMeta.includes("mold")) {
      tableColumns.length = 0;
      tableColumns.push(
        { key: "sNo", label: "Mould No.", type: "text", unit: "", minWidth: "80px" },
        { key: "serialNo", label: "Serial No. / ID No.", type: "text", unit: "", minWidth: "130px" },
        { key: "makeModel", label: "Make / Model", type: "text", unit: "", minWidth: "120px" },
        { key: "length", label: "Length, mm", type: "number", unit: "mm", minWidth: "100px" },
        { key: "width", label: "Width, mm", type: "number", unit: "mm", minWidth: "100px" },
        { key: "height", label: "Height / Depth, mm", type: "number", unit: "mm", minWidth: "110px" },
        { key: "squareness", label: "Squareness, mm", type: "number", unit: "mm", minWidth: "110px" },
        { key: "tolerance", label: "Specified Tolerance", type: "text", unit: "mm", minWidth: "130px" }
      );
    } else if (lowMeta.includes("sieve")) {
      tableColumns.length = 0;
      tableColumns.push(
        { key: "sNo", label: "S.No.", type: "text", unit: "", minWidth: "70px" },
        { key: "aperture", label: "Sieve Nominal Aperture, mm/µm", type: "text", unit: "", minWidth: "150px" },
        { key: "warp", label: "Measured Warp Aperture, mm/µm", type: "number", unit: "", minWidth: "140px" },
        { key: "weft", label: "Measured Weft Aperture, mm/µm", type: "number", unit: "", minWidth: "140px" },
        { key: "average", label: "Average Aperture, mm/µm", type: "formula", unit: "", minWidth: "130px" },
        { key: "tolerance", label: "Permissible Tolerance (IS 460)", type: "text", unit: "", minWidth: "150px" }
      );
    } else {
      tableColumns.length = 0;
      tableColumns.push(
        { key: "sNo", label: "S. No.", unit: "", type: "text", minWidth: "70px" },
        { key: "nominal", label: "Specified Nominal Value", unit: "", type: "number", minWidth: "130px" },
        { key: "reading1", label: "Observed Reading 1", unit: "", type: "number", minWidth: "120px" },
        { key: "reading2", label: "Observed Reading 2", unit: "", type: "number", minWidth: "120px" },
        { key: "reading3", label: "Observed Reading 3", unit: "", type: "number", minWidth: "120px" },
        { key: "average", label: "Average", unit: "", type: "formula", minWidth: "110px" },
        { key: "error", label: "Deviation / Error", unit: "", type: "formula", minWidth: "120px" }
      );
    }
  }

  // 6. Extract Exact Data Rows & Repeatability MU directly from sheet
  const defaultReadings = [];
  let repeatabilityMu = "";
  let repeatabilityReadings = [];
  for (let r = dataStartRow; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    const rowStr = row.join(" ").toLowerCase();
    if (/for\s*(?:repeatability\s*)?mu/i.test(rowStr) || /for\s*mu\s*repeatability/i.test(rowStr)) {
      let vals = row.filter((v) => String(v).trim() && !/for|repeatability|mu/i.test(String(v)));
      if (vals.length === 0 && r + 1 < rawRows.length) {
        const nextR = rawRows[r + 1] || [];
        const nextStr = nextR.join(" ").toLowerCase();
        if (!/calibrated?\s*by|reviewed|signature|page\s*no|authorized|approved/i.test(nextStr)) {
          vals = nextR.filter((v) => String(v).trim() !== "");
        }
      }
      repeatabilityMu = vals.join(", ");
      repeatabilityReadings = vals.slice(0, 5).map((v) => String(v).trim());
      while (repeatabilityReadings.length < 5) repeatabilityReadings.push("");
      continue;
    }
    if (/calibrat(?:ed?|ion)\s*by|checked\s*by|reviewed|signature|page\s*no|authorized|approved/i.test(rowStr)) break;

    const rowObj = {};
    let hasAnyVal = false;
    tableColumns.forEach((col) => {
      if (col._cStart === undefined) return;
      let val = "";
      for (let sc = col._cStart; sc <= (col._cEnd ?? col._cStart); sc++) {
        const cellText = String(row[sc] ?? "").trim();
        if (cellText !== "") {
          val = cellText;
          break;
        }
      }
      rowObj[col.key] = val;
      if (val !== "") hasAnyVal = true;
    });
    if (hasAnyVal) defaultReadings.push(rowObj);
  }

  const obsColSpans = tableColumns
    .filter((c) => c._cStart !== undefined)
    .map((c) => ({
      key: c.key,
      label: c.label,
      type: c.type,
      cStart: c._cStart,
      cEnd: c._cEnd ?? c._cStart,
    }));

  tableColumns.forEach((c) => {
    delete c._cStart;
    delete c._cEnd;
  });

  // If no readings found in sheet, generate 5 clean fillable rows matching column keys
  if (defaultReadings.length === 0) {
    for (let i = 1; i <= 5; i++) {
      const row = {};
      tableColumns.forEach((c) => {
        row[c.key] = /^sNo(?:_\d+)?$/i.test(c.key) ? String(i) : "";
      });
      defaultReadings.push(row);
    }
  }

  // Infer discipline
  const finalName = detectedName || cleanBaseName || "Observation Format";
  const nameLower = `${finalName} ${detectedDiscipline}`.toLowerCase();
  let detectedDisciplineFinal = "General Metrology";
  if (nameLower.includes("centrifuge") || nameLower.includes("rpm") || nameLower.includes("tachometer") || nameLower.includes("speed")) {
    detectedDisciplineFinal = "Speed / RPM";
  } else if (nameLower.includes("utm") || nameLower.includes("compression") || nameLower.includes("tensile") || nameLower.includes("testing machine") || nameLower.includes("force") || nameLower.includes("kn")) {
    detectedDisciplineFinal = "Force";
  } else if (nameLower.includes("caliper") || nameLower.includes("micrometer") || nameLower.includes("gauge") || nameLower.includes("dial") || nameLower.includes("scale") || nameLower.includes("mould") || nameLower.includes("sieve") || nameLower.includes("dimension")) {
    detectedDisciplineFinal = "Dimensional";
  } else if (nameLower.includes("pressure") || nameLower.includes("vacuum") || nameLower.includes("barometer")) {
    detectedDisciplineFinal = "Pressure";
  } else if (nameLower.includes("oven") || nameLower.includes("furnace") || nameLower.includes("temperature") || nameLower.includes("thermometer") || nameLower.includes("thermal")) {
    detectedDisciplineFinal = "Thermal";
  } else if (nameLower.includes("balance") || nameLower.includes("mass") || nameLower.includes("weight")) {
    detectedDisciplineFinal = "Mass";
  }

  const primaryMaster = masterEquipments[0] || {};

  return {
    sheetName,
    name: finalName,
    equipmentType: detectedDisciplineFinal,
    standardReference: detectedStandard || "IS / ISO Metrology Standard",
    calibrationMethod: detectedMethod || "ARCL-CP-STANDARD",
    repeatabilityMu,
    repeatabilityReadings,
    parameters: {
      mode: "Standard",
      discipline: detectedDiscipline || detectedDisciplineFinal,
      range: detectedRange,
      leastCount: detectedLeastCount,
      location: detectedLocation,
      conditionOfItem: detectedCondition,
      temperature: detectedTemp,
      humidity: detectedHumidity,
      formatNo: detectedFormatNo,
      formatIssueNo: detectedFormatIssueNo,
      formatIssueDate: detectedFormatIssueDate,
      inwardNo: detectedInwardNo,
      receiptDate: detectedReceiptDate,
      calibDate: detectedCalibDate,
      dueDate: detectedDueDate,
      masterDescription: primaryMaster.description || "",
      masterId: primaryMaster.idMark || "",
      masterCertNo: primaryMaster.certNo || "",
      masterDueDate: primaryMaster.dueDate || "",
      masterTraceable: primaryMaster.traceableBy || "NABL",
      masterEquipments,
      repeatabilityMu,
      repeatabilityReadings,
    },
    tableColumns,
    defaultReadings,
    _obsLayoutMeta: {
      sheetName,
      tableHeaderRow,
      dataStartRow,
      dataEndRow: dataStartRow + defaultReadings.length - 1,
      colSpans: obsColSpans,
    },
  };
};

// Parse Calibration Report Sheet (Report)
const parseReportData = (worksheet, sheetName) => {
  if (!worksheet) return { sheetName: "", reportColumns: [], reportReadings: [], notes: [] };

  const { getMergeAt, formatCellVal } = buildSheetHelpers(worksheet);
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });

  let certTitle = "CALIBRATION CERTIFICATE / REPORT";
  let ulrNo = "";
  let certNo = "";
  let formatNo = "";
  const notes = [];

  let resultHeaderRow = -1;
  const resultKeywords = [
    "specification",
    "gap size",
    "measured",
    "reading",
    "measurement value",
    "average",
    "uncertainty",
    "nominal",
    "error",
    "permissible",
  ];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || "").trim();
      const nextCell = String(row[c + 1] || "").trim();

      if (/ulr\s*no/i.test(cell)) {
        const m = cell.match(/ulr\s*no\s*[:=-]?\s*(.+)/i);
        ulrNo = m ? m[1].trim() : nextCell;
      }
      if (/cert(?:ificate)?\s*no/i.test(cell) && !certNo) {
        const m = cell.match(/cert(?:ificate)?\s*no\s*[:=-]?\s*(.+)/i);
        certNo = m ? m[1].trim() : nextCell;
      }
      if (/format\s*no/i.test(cell)) {
        formatNo = cell;
      }
      if (cell.startsWith("*") || cell.toLowerCase().includes("note:") || cell.toLowerCase().includes("calibration certificate referes")) {
        if (!notes.includes(cell)) notes.push(cell);
      }
    }

    const firstCell = String((row || []).find((v) => String(v || "").trim() !== "") || "").trim();
    const rowStr = row.join(" ").toLowerCase();
    const isTitleRow = /^(?:\d+\.?\s*)?(?:results?|observation|details?\s+of|description\s+of)\b/i.test(firstCell);
    if (!isTitleRow && resultKeywords.some((kw) => rowStr.includes(kw)) && row.filter(Boolean).length >= 2 && resultHeaderRow === -1) {
      resultHeaderRow = r;
    }
  }

  // Extract Report Result Columns & Rows using exact horizontal merges
  const reportColumns = [];
  const reportReadings = [];

  if (resultHeaderRow >= 0 && resultHeaderRow < rawRows.length) {
    const headerRow = rawRows[resultHeaderRow] || [];
    const seenRepKeys = new Set();
    const headerSpans = [];
    for (let c = 0; c < headerRow.length; c++) {
      const label = String(headerRow[c] || "").replace(/\s+/g, " ").trim();
      if (!label) continue;
      const mg = getMergeAt(resultHeaderRow, c);
      if (mg && (mg.s.r !== resultHeaderRow || mg.s.c !== c)) continue;
      headerSpans.push({
        label,
        cStart: mg ? mg.s.c : c,
        cEnd: mg ? mg.e.c : c,
      });
    }

    headerSpans.forEach((sp, idx) => {
      const l = sp.label.toLowerCase();
      let key = l.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      if (/^(?:sr|sl|s)\.?\s*no/.test(l)) key = "sNo";
      else if (l.includes("permissible")) key = "permissibleDeparture";
      else if (l.includes("nominal") || l.includes("speed")) key = "nominal";
      else if (l.includes("specification")) key = "specification";
      else if (l.includes("gap size")) key = "gapSize";
      else if (l.includes("reading on master") || l.includes("master value")) key = "masterValue";
      else if (l.includes("measured")) key = "measured";
      else if (l.includes("average") || l.includes("mean") || l.includes("measurement value")) key = "average";
      else if (l.includes("uncertaint")) key = "uncertainty";
      else if (l.includes("error") || l.includes("deviation")) key = "error";
      else key = `col_${idx + 1}`;

      let uniq = key;
      let n = 1;
      while (seenRepKeys.has(uniq)) {
        n++;
        uniq = `${key}_${n}`;
      }
      seenRepKeys.add(uniq);

      reportColumns.push({ key: uniq, label: sp.label, _cStart: sp.cStart, _cEnd: sp.cEnd });
    });

    for (let r = resultHeaderRow + 1; r < rawRows.length; r++) {
      const row = rawRows[r] || [];
      const rowLow = row.join(" ").toLowerCase().trim();
      if (!rowLow) continue;
      if (rowLow.startsWith("note") || rowLow.startsWith("*") || rowLow.includes("reviewed") || rowLow.includes("calibrated at") || rowLow.includes("format no")) break;

      const obj = {};
      let hasData = false;
      reportColumns.forEach((col) => {
        let v = "";
        for (let sc = col._cStart; sc <= col._cEnd; sc++) {
          const txt = formatCellVal(r, sc, row[sc]);
          if (txt !== "") {
            v = txt;
            break;
          }
        }
        if (v !== "") {
          hasData = true;
          obj[col.key] = v;
        } else {
          obj[col.key] = "";
        }
      });
      if (hasData) reportReadings.push(obj);
    }
    reportColumns.forEach((c) => {
      delete c._cStart;
      delete c._cEnd;
    });
  }

  if (reportColumns.length === 0) {
    reportColumns.push(
      { key: "nominal", label: "Nominal / Calibration Point" },
      { key: "average", label: "Measurement Value (Average)" },
      { key: "uncertainty", label: "Measurement Uncertainty (±)" }
    );
  }

  return {
    sheetName,
    certTitle,
    ulrNo,
    certNo,
    formatNo,
    reportColumns,
    reportReadings,
    notes,
  };
};

// Parse AMU (Analysis of Measurement Uncertainty) Sheet
const parseAmuData = (amuWorksheets, amuSheetNames) => {
  if (!amuWorksheets || amuWorksheets.length === 0) {
    return {
      sheetName: "",
      typeA: { n: 5, mean: 0, stdDev: 0, uA: 0 },
      typeB: { uB1: 0, uB2: 0, uB3: 0, uB: 0 },
      combinedUncertainty: 0,
      coverageFactor: 2.0,
      expandedUncertainty: 0,
      budgetTable: [],
      sheetsCount: 0,
    };
  }

  // Parse the primary AMU sheet
  const primaryWs = amuWorksheets[0];
  const primarySheetName = amuSheetNames[0];

  const rawRows = XLSX.utils.sheet_to_json(primaryWs, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  let uB1 = 0; // Resolution
  let uB2 = 0; // Master Uncertainty
  let uB3 = 0; // Accuracy / Drift
  let uB = 0;  // Combined Type B
  let uC = 0;  // Combined Standard Uncertainty
  let veff = "∞";
  let coverageFactor = 2.0;
  let expandedUncertainty = 0;
  let repeatabilityCount = 5;
  let repeatabilityStdDev = 0;
  let repeatabilityUa = 0;

  const budgetTable = [];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    const rowStr = row.join(" ").toLowerCase();

    // Check Type B Components
    if (rowStr.includes("ub1") || rowStr.includes("resolution")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) uB1 = Number(num);
    }
    if (rowStr.includes("ub2") || rowStr.includes("master")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) uB2 = Number(num);
    }
    if (rowStr.includes("ub3") || rowStr.includes("accuracy")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) uB3 = Number(num);
    }
    if ((rowStr.includes("type - b") || rowStr.includes("type b uncertainty")) && !rowStr.includes("ub1")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) uB = Number(num);
    }

    // Check Combined Uncertainty (uC)
    if (rowStr.includes("combined standard uncertainty") || rowStr.includes("uc")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) uC = Number(num);
    }

    // Coverage Factor (k)
    if (rowStr.includes("coverage factor") || rowStr.includes("k = 2") || rowStr.includes("k=")) {
      const num = row.find((c) => Number(c) === 2 || Number(c) === 2.0);
      if (num) coverageFactor = Number(num);
    }

    // Expanded Uncertainty (UE)
    if (rowStr.includes("expanded uncertainty") || rowStr.includes("ue") || rowStr.includes("expended uncertainty")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) expandedUncertainty = Number(num);
    }

    // Repeatability / Type A evaluation
    if (rowStr.includes("number of readings") || rowStr.includes("readings taken")) {
      const num = row.find((c) => !isNaN(Number(c)) && Number(c) >= 3 && Number(c) <= 20);
      if (num) repeatabilityCount = Number(num);
    }
    if (rowStr.includes("std. dev") || rowStr.includes("standard deviation")) {
      const num = row.find((c) => typeof c === "number" || (!isNaN(Number(c)) && Number(c) > 0 && !String(c).includes("/")));
      if (num) repeatabilityStdDev = Number(num);
    }

    // Uncertainty Budget Table Rows
    const firstCell = String(row[0] || row[1] || "").trim();
    if (/^[0-9]+$/.test(firstCell) && (rowStr.includes("normal") || rowStr.includes("rectangular") || rowStr.includes("type a") || rowStr.includes("type b"))) {
      budgetTable.push({
        sNo: firstCell,
        source: row[2] || row[1] || "Uncertainty Source",
        estimates: row[4] || row[3] || "-",
        limits: row[7] || row[6] || "-",
        distribution: rowStr.includes("normal") ? "Normal (Type B)" : (rowStr.includes("rectangular") ? "Rectangular (Type B)" : "Type A"),
        factor: rowStr.includes("rectangular") ? "√3" : "2",
        standardUncertainty: row[11] || row[10] || row[12] || 0,
      });
    }
  }

  // Auto-calculate combined if not explicitly extracted
  if (!uB && (uB1 || uB2 || uB3)) {
    uB = Math.sqrt(Math.pow(uB1, 2) + Math.pow(uB2, 2) + Math.pow(uB3, 2));
  }
  if (!uC && (repeatabilityUa || uB)) {
    uC = Math.sqrt(Math.pow(repeatabilityUa, 2) + Math.pow(uB, 2));
  }
  if (!expandedUncertainty && uC) {
    expandedUncertainty = uC * coverageFactor;
  }

  // If budgetTable is empty, provide standard ISO 17025 budget components
  if (budgetTable.length === 0) {
    budgetTable.push(
      { sNo: "1", source: "Resolution of Device (uB1)", distribution: "Rectangular", factor: "√3", standardUncertainty: uB1 || "0.01" },
      { sNo: "2", source: "Master Standard Calibration (uB2)", distribution: "Normal", factor: "2.0", standardUncertainty: uB2 || "0.05" },
      { sNo: "3", source: "Repeatability / Type A (uA)", distribution: "Normal", factor: `√${repeatabilityCount}`, standardUncertainty: repeatabilityUa || "0.02" },
      { sNo: "4", source: "Combined Uncertainty (uc)", distribution: "Normal", factor: "1.0", standardUncertainty: uC || "0.054" },
      { sNo: "5", source: "Expanded Uncertainty (U)", distribution: "Normal (k=2)", factor: "2.0", standardUncertainty: expandedUncertainty || "0.11" }
    );
  }

  return {
    sheetName: primarySheetName,
    allAmuSheets: amuSheetNames,
    typeA: {
      n: repeatabilityCount,
      stdDev: repeatabilityStdDev,
      uA: repeatabilityUa || (repeatabilityStdDev ? repeatabilityStdDev / Math.sqrt(repeatabilityCount) : 0),
    },
    typeB: {
      uB1,
      uB2,
      uB3,
      uB,
    },
    combinedUncertainty: uC,
    effectiveDof: veff,
    coverageFactor,
    expandedUncertainty,
    budgetTable,
    sheetsCount: amuSheetNames.length,
  };
};

/**
 * Extract 1:1 Exact Visual + Fillable Grid Representation of ALL Excel Sheets
 * Preserves exact merged cells (rowSpan / colSpan), widths, heights, Excel formulas,
 * titles, sections, pre-filled standard tolerances, and live fillable input boxes.
 */
const extractExactExcelSheets = (workbook, roleInfo, obsLayoutMeta) => {
  const { obsSheet, reportSheet, amuSheets, masterSheets } = roleInfo;

  const cleanSheetDisplayText = (rawStr) => {
    if (!rawStr) return "";
    let s = String(rawStr);
    // Split giant Excel centering gaps (12+ consecutive spaces inside one wide cell) cleanly
    s = s.replace(/[ \t]{12,}/g, " \u2014 ");
    // Collapse excess horizontal spaces inside a single line while keeping explicit line breaks
    return s
      .split(/\r?\n/)
      .map((ln) => ln.replace(/[ \t]+/g, " ").trim())
      .filter((ln, idx, arr) => ln !== "" || (idx > 0 && idx < arr.length - 1))
      .join("\n")
      .trim();
  };

  return workbook.SheetNames.map((sheetName) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws || !ws["!ref"]) return null;

    let role = "general";
    if (sheetName === obsSheet) role = "observation";
    else if (sheetName === reportSheet) role = "report";
    else if (amuSheets.includes(sheetName)) role = "amu";
    else if (masterSheets.includes(sheetName)) role = "master";

    const { merges, getMergeAt, formatCellVal, getCellFormula, formatExcelSerialDateIfNeeded } =
      buildSheetHelpers(ws);

    const decoded = XLSX.utils.decode_range(ws["!ref"]);
    const rawMaxR = Math.min(decoded.e.r, 120);
    const rawMaxC = Math.min(decoded.e.c, 28);

    // Determine exact tight content bounding box (ignoring empty phantom trailing style columns like M..AH)
    let maxRow = 0;
    let maxCol = 0;
    const rowHasContent = new Map();

    for (let r = 0; r <= rawMaxR; r++) {
      let hasAny = false;
      for (let c = 0; c <= rawMaxC; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        const txt = cell && cell.t !== "z" ? formatCellVal(r, c, "") : "";
        const formula = cell?.f ? String(cell.f).trim() : "";
        if (txt !== "" || formula !== "") {
          hasAny = true;
          if (r > maxRow) maxRow = r;
          if (c > maxCol) maxCol = c;
        }
      }
      if (hasAny) rowHasContent.set(r, true);
    }

    // Expand maxRow / maxCol only for merges anchored at populated cells or bordered inside active rows
    merges.forEach((m) => {
      if (m.s.r > rawMaxR || m.s.c > rawMaxC) return;
      const addr = XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c });
      const cell = ws[addr];
      const txt = cell && cell.t !== "z" ? formatCellVal(m.s.r, m.s.c, "") : "";
      const formula = cell?.f ? String(cell.f).trim() : "";
      if (txt !== "" || formula !== "" || rowHasContent.get(m.s.r)) {
        maxRow = Math.max(maxRow, Math.min(m.e.r, 120));
        maxCol = Math.max(maxCol, Math.min(m.e.c, 28));
      }
    });

    if (maxRow === 0 && maxCol === 0 && !rowHasContent.get(0)) return null;

    const colsMeta = [];
    const wsCols = ws["!cols"] || [];
    for (let c = 0; c <= maxCol; c++) {
      const wRaw = wsCols[c]?.wpx;
      const wpx = typeof wRaw === "number" && wRaw > 0 ? Math.round(Math.max(22, Math.min(240, wRaw))) : 78;
      colsMeta.push({ c, wpx });
    }

    const wsRows = ws["!rows"] || [];
    const headerRowSet = new Set();
    const obsColMap =
      role === "observation" && obsLayoutMeta?.sheetName === sheetName
        ? obsLayoutMeta
        : null;

    if (obsColMap && obsColMap.tableHeaderRow >= 0) {
      headerRowSet.add(obsColMap.tableHeaderRow);
      if (obsColMap.dataStartRow > obsColMap.tableHeaderRow + 1) {
        headerRowSet.add(obsColMap.tableHeaderRow + 1);
      }
    }

    // Pre-pass row classification so empty value boxes below headers / beside :- labels become crisp editable inputs
    const rowStrings = [];
    const rowDateFlags = [];
    for (let r = 0; r <= maxRow; r++) {
      const vals = [];
      for (let c = 0; c <= maxCol; c++) {
        const txt = formatCellVal(r, c, "");
        if (txt) vals.push(txt);
      }
      const joined = vals.join(" ");
      rowStrings.push(joined);
      rowDateFlags.push(/\b(?:date|due|valid|receipt|recipt)\b/i.test(joined));

      const lowJoined = joined.toLowerCase();
      const hasColonSep = vals.some((v) => v === ":" || v === ":-");
      const startsWithFormLabel = /^(?:sr\.?\s*no\.?\s*\/|instrument\s*name|make\s*\/|range(?:\s*\(|$)|least\s*count|location\b|\d+\s*\.)/i.test(vals[0] || "");
      const isDuplicateMetaRow =
        headerRowSet.has(r - 1) &&
        /\b(?:inward\s*no|format\s*no|date\s*of\s*rec|due\s*date)\b/i.test(lowJoined);
      if (
        !hasColonSep &&
        !startsWithFormLabel &&
        !isDuplicateMetaRow &&
        vals.length >= 2 &&
        (
          /\b(?:inward\s*no|format\s*no|date\s*of\s*rec|due\s*date)\b/i.test(lowJoined) ||
          /\b(?:equip(?:e)?ment\s*desc|id\s*mark|certificate\s*no|traceab)\b/i.test(lowJoined) ||
          /\b(?:sr\.?\s*no|nominal|specification|gap\s*size|measured\s*gap|reading\s*on\s*master|source\s*of\s*uncertaint)\b/i.test(lowJoined)
        )
      ) {
        headerRowSet.add(r);
      }
    }

    const isValueInputLabel = (txt) =>
      /^(?:instrument\s*name|make\s*\/?\s*model|sr\.?\s*no\.?\s*\/?\s*id\s*no\.?|serial\s*no\.?\s*\/?\s*id\s*no\.?|id\s*no\.?|range(?:\([^)]*\))?|size(?:\([^)]*\))?|capacity(?:\([^)]*\))?|length|width|height|diameter|dia\.?|thickness|depth|least\s*count(?:\([^)]*\))?|location|inward\s*no\.?|ulr\s*no\.?|cert(?:ificate)?\s*no\.?|date\s*of\s*(?:rec(?:eip|ie|i)pt|calibration|issue)|(?:next\s*)?due\s*date(?:\s*of\s*calibration)?|format\s*no\.?|format\s*issue\s*no\.?|format\s*issue\s*date\.?|calibrated\s*for|client|temp\.?|temperature|rh|humidity|condition\s*of\s*item|method\s*of\s*calibration|reference\s*standard|calibrat(?:ed?|ion)\s*by)/i.test(
        txt.replace(/^\d+(?:\.\d+)?\s*\.\s*/g, "").replace(/[:\-]+$/g, "").trim()
      );

    const gridRows = [];
    for (let r = 0; r <= maxRow; r++) {
      const rowJoined = rowStrings[r] || "";
      const rowLow = rowJoined.toLowerCase();
      const hasContent = Boolean(rowHasContent.get(r));
      const isFooterRow = /calibrat(?:ed?|ion)\s*by|checked\s*by|reviewed\s*&?\s*approved|page\s*no|authorized\s*by|approved\s*by/i.test(rowLow);
      const isRepeatabilityRow = /for\s*(?:repeatability\s*)?mu|for\s*mu\s*repeatability|repeatability\s*:/i.test(rowLow);
      const isNoteRow = /^\s*\*|^note\s*:/i.test(rowLow);
      const isTitleRow = r === 0 || /arcl\s+instruments|evaluation\s+of\s+uncertainty|calibration\s+certificate/i.test(rowLow);
      const isSectionRow = /^\s*\d+(?:\.\d+)?\s*\.\s*[a-z]/i.test(rowLow) && !headerRowSet.has(r);
      const isObsTableRow =
        Boolean(obsColMap) &&
        obsColMap.dataStartRow >= 0 &&
        r >= obsColMap.dataStartRow &&
        !isRepeatabilityRow &&
        !isFooterRow &&
        !isNoteRow;

      // Determine prev non-empty cell label on same row to identify "Label :- [InputValue]" pairs
      let prevLabelText = "";
      const cells = [];

      for (let c = 0; c <= maxCol; c++) {
        const mg = getMergeAt(r, c);
        if (mg && (mg.s.r !== r || mg.s.c !== c)) {
          continue; // Covered by top-left merge cell
        }

        const rowSpan = mg ? Math.min(mg.e.r, maxRow) - r + 1 : 1;
        const colSpan = mg ? Math.min(mg.e.c, maxCol) - c + 1 : 1;
        const addr = XLSX.utils.encode_cell({ r, c });
        const wsCell = ws[addr];
        const rawVal = wsCell && wsCell.t !== "z" ? formatCellVal(r, c, "") : "";
        const formula = getCellFormula(r, c);
        const numFormat = wsCell?.z ? String(wsCell.z) : "";

        let displayVal = cleanSheetDisplayText(rawVal);
        if (
          rowDateFlags[r] ||
          (r > 0 && rowDateFlags[r - 1]) ||
          /due|date|valid/i.test(rowLow)
        ) {
          displayVal = formatExcelSerialDateIfNeeded(displayVal);
        }

        // Check header above (r-1 or r-2)
        let headerAboveText = "";
        if (r > 0 && headerRowSet.has(r - 1)) {
          headerAboveText = cleanSheetDisplayText(formatCellVal(r - 1, c, ""));
          if (!headerAboveText) {
            const topMg = getMergeAt(r - 1, c);
            if (topMg) headerAboveText = cleanSheetDisplayText(formatCellVal(topMg.s.r, topMg.s.c, ""));
          }
        }

        // Observation table binding
        let obsColMatch = null;
        if (obsColMap && Array.isArray(obsColMap.colSpans)) {
          obsColMatch = obsColMap.colSpans.find((sp) => c >= sp.cStart && c <= sp.cEnd) || null;
        }

        // Determine cell kind ("title" | "section" | "header" | "formula" | "input" | "label")
        let kind = "label";
        let placeholder = "";
        const cellLow = displayVal.toLowerCase();

        const isColonSep = displayVal === ":" || displayVal === ":-";
        const isSerialCounter =
          /^\d{1,3}$/.test(displayVal) &&
          (obsColMatch?.key?.startsWith("sNo") || /sr\.?\s*no|s\.?\s*no/i.test(headerAboveText));

        // Look ahead to check if empty cell is just spacing right before ":" or ":-"
        let nextCellBeforeSep = "";
        if (displayVal === "") {
          for (let nc = c + colSpan; nc <= Math.min(maxCol, c + colSpan + 1); nc++) {
            const nxt = cleanSheetDisplayText(formatCellVal(r, nc, ""));
            if (nxt) {
              nextCellBeforeSep = nxt;
              break;
            }
          }
        }
        const isSpacerBeforeColon = displayVal === "" && (nextCellBeforeSep === ":" || nextCellBeforeSep === ":-");
        const isDuplicateHeaderPlaceholder =
          Boolean(headerAboveText) &&
          displayVal !== "" &&
          displayVal.toLowerCase() === headerAboveText.toLowerCase() &&
          isValueInputLabel(displayVal);

        if (formula) {
          kind = "formula";
        } else if (isColonSep) {
          kind = "label";
        } else if (isTitleRow && displayVal) {
          kind = "title";
        } else if (isSectionRow && /^(\d+(?:\.\d+)?\s*\.|discipline)/i.test(cellLow)) {
          kind = "section";
        } else if (headerRowSet.has(r) && displayVal) {
          kind = "header";
        } else if (isNoteRow || isSpacerBeforeColon) {
          kind = "label";
        } else if (isDuplicateHeaderPlaceholder) {
          kind = "input";
          placeholder = headerAboveText;
          displayVal = "";
        } else if (displayVal === "" && !isTitleRow) {
          // Empty cell: make fillable input ONLY in genuine form slots (under table/meta headers, right of :- labels, obs data cells, repeatability)
          const prevRepeatability =
            isRepeatabilityRow || (r > 0 && /for\s*(?:repeatability\s*)?mu/i.test((rowStrings[r - 1] || "").toLowerCase()));
          const aboveIsInputHeader = Boolean(headerAboveText) && !/format\s*no/i.test(headerAboveText);
          const hasLeftFieldLabel =
            prevLabelText !== "" && (prevLabelText === ":" || prevLabelText === ":-" || isValueInputLabel(prevLabelText));
          const inActiveObsCell = isObsTableRow && Boolean(obsColMatch);
          if (!isNoteRow && !isColonSep && (!isSectionRow || (prevLabelText !== "" && isValueInputLabel(prevLabelText))) && (inActiveObsCell || aboveIsInputHeader || hasLeftFieldLabel || (prevRepeatability && c <= 11))) {
            kind = "input";
            placeholder = headerAboveText || (prevLabelText && !/^[:\-]+$/.test(prevLabelText) ? prevLabelText.replace(/[:\-]+$/g, "").trim() : "");
          }
        } else if (isObsTableRow && obsColMatch) {
          // Inside Observation Data Table
          if (isSerialCounter) {
            kind = "label";
          } else if (
            obsColMatch.key === "specification" ||
            obsColMatch.key === "gapSize" ||
            /±/.test(displayVal) ||
            /^\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?$/.test(displayVal)
          ) {
            kind = "label"; // Standard tolerance / nominal specification text
          } else {
            kind = "input";
          }
        } else if (
          prevLabelText &&
          (prevLabelText === ":" || prevLabelText === ":-" || isValueInputLabel(prevLabelText)) &&
          !isColonSep &&
          !/^calibrat/i.test(cellLow) &&
          !/^reviewed/i.test(cellLow) &&
          !/^page\s*no/i.test(cellLow)
        ) {
          kind = "input";
          placeholder = prevLabelText.replace(/[:\-]+$/g, "").trim();
        } else if (
          headerRowSet.has(r - 1) &&
          !headerRowSet.has(r) &&
          headerAboveText &&
          !headerAboveText.toLowerCase().startsWith("format no") &&
          !/^(?:date of recipt|date of calibration|next due date)/i.test(cellLow)
        ) {
          kind = "input";
          placeholder = headerAboveText;
        }

        // Determine alignment
        let align = "left";
        const rawAlign = wsCell?.s?.alignment?.horizontal;
        if (rawAlign) align = rawAlign;
        else if (kind === "title" || kind === "header" || kind === "formula" || isObsTableRow || headerRowSet.has(r - 1) || isColonSep) {
          align = "center";
        }

        // Bold styling
        const bold =
          Boolean(wsCell?.s?.font?.bold) ||
          kind === "title" ||
          kind === "section" ||
          kind === "header" ||
          isRepeatabilityRow ||
          isFooterRow;

        const cellObj = {
          r,
          c,
          ref: addr,
          rowSpan,
          colSpan,
          value: displayVal,
          formula,
          numFormat,
          kind,
          align,
          bold,
        };
        if (placeholder) cellObj.placeholder = placeholder;
        if (isObsTableRow && obsColMatch) {
          cellObj.obsKey = obsColMatch.key;
          cellObj.obsRowIdx = r - obsColMap.dataStartRow;
        }
        cells.push(cellObj);

        if (kind === "input" && prevLabelText && !isObsTableRow) {
          prevLabelText = "";
        } else if (displayVal && !isColonSep) {
          prevLabelText = displayVal;
        } else if (isColonSep && !prevLabelText) {
          prevLabelText = displayVal;
        }
      }

      // Skip trailing blank footer rows only if beyond all merges & content
      const hRaw = wsRows[r]?.hpx || wsRows[r]?.hpt;
      const hpx = !hasContent && !cells.some((x) => x.kind === "input")
        ? 10
        : (typeof hRaw === "number" && hRaw > 0 ? Math.round(Math.max(20, Math.min(72, hRaw))) : 24);

      gridRows.push({
        r,
        hpx,
        isHeaderRow: headerRowSet.has(r),
        isObsDataRow: isObsTableRow,
        cells,
      });
    }

    return {
      sheetName,
      role,
      kind: "excel",
      maxRow,
      maxCol,
      obsTableMeta:
        obsColMap && obsColMap.dataStartRow >= 0
          ? {
              dataStartRow: obsColMap.dataStartRow,
              dataEndRow: Math.max(obsColMap.dataEndRow, obsColMap.dataStartRow),
              colSpans: obsColMap.colSpans,
            }
          : null,
      blocks: [
        {
          kind: "table",
          colsMeta,
          rows: gridRows,
        },
      ],
    };
  }).filter(Boolean);
};

/**
 * Main Multi-Sheet Parser Function
 */
export const parseExcelObservationSheet = (fileInput, originalName = "template.xlsx") => {
  if (!fileInput || (typeof fileInput !== "string" && !Buffer.isBuffer(fileInput) && fileInput.length === 0)) {
    throw new Error("Empty Excel file input provided");
  }

  let workbook;
  let cleanBaseName = originalName;
  const readOpts = { cellDates: false, cellFormula: true, cellStyles: true, cellNF: true };

  if (typeof fileInput === "string") {
    if (fs.existsSync(fileInput)) {
      workbook = XLSX.readFile(fileInput, readOpts);
      if (originalName === "template.xlsx") {
        cleanBaseName = path.basename(fileInput);
      }
    } else {
      workbook = XLSX.read(fileInput, { type: "string", ...readOpts });
    }
  } else {
    workbook = XLSX.read(fileInput, { type: "buffer", ...readOpts });
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("No worksheets found in the Excel workbook");
  }

  cleanBaseName = cleanBaseName
    .replace(/^tmpl_\d+_/, "")
    .replace(/\.(xlsx|xls|csv)$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

  // 1. Classify all sheets in the workbook
  const { obsSheet, reportSheet, amuSheets, masterSheets } = classifyWorkbookSheets(workbook.SheetNames);

  // 2. Parse Observation Sheet
  const obsWs = workbook.Sheets[obsSheet];
  const obsData = parseObservationData(obsWs, obsSheet, cleanBaseName);
  const obsLayoutMeta = obsData._obsLayoutMeta;
  delete obsData._obsLayoutMeta;

  // 3. Parse Report Sheet
  const reportWs = reportSheet ? workbook.Sheets[reportSheet] : null;
  const reportData = parseReportData(reportWs, reportSheet || "");

  // 4. Parse AMU Sheet(s)
  const amuWorksheets = amuSheets.map((name) => workbook.Sheets[name]).filter(Boolean);
  const amuData = parseAmuData(amuWorksheets, amuSheets);

  // 5. Extract True 1:1 Exact Workbook Grids (Cells, Merges, Widths, Formulas, Input Slots)
  const exactSheets = extractExactExcelSheets(
    workbook,
    { obsSheet, reportSheet, amuSheets, masterSheets },
    obsLayoutMeta
  );

  // 6. Generate Sheets Summary
  const sheetsSummary = workbook.SheetNames.map((name) => {
    let role = "general";
    if (name === obsSheet) role = "observation";
    else if (name === reportSheet) role = "report";
    else if (amuSheets.includes(name)) role = "amu";
    else if (masterSheets.includes(name)) role = "master";

    const ws = workbook.Sheets[name];
    const range = ws && ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : null;
    return {
      name,
      role,
      rowCount: range ? range.e.r + 1 : 0,
      colCount: range ? range.e.c + 1 : 0,
    };
  });

  return {
    // Root level fields for backward compatibility
    name: obsData.name,
    equipmentName: obsData.name,
    equipmentType: obsData.equipmentType,
    standardReference: obsData.standardReference,
    calibrationMethod: obsData.calibrationMethod,
    parameters: obsData.parameters,
    repeatabilityMu: obsData.repeatabilityMu,
    repeatabilityReadings: obsData.repeatabilityReadings,
    tableColumns: obsData.tableColumns,
    defaultReadings: obsData.defaultReadings,
    formulaType: "percentage_error",
    fileType: "xlsx",
    notes: `Multi-Sheet ARCL Workbook: ${sheetsSummary.map((s) => `${s.role.toUpperCase()} [${s.name}]`).join(" | ")}`,

    // Partitioned sections & 1:1 Exact Cloned Workbook Sheets
    observation: obsData,
    reportData,
    amuData,
    masterSheets,
    sheetsSummary,
    exactSheets,
  };
};

export const parseExcelMultiSheetWorkbook = parseExcelObservationSheet;
