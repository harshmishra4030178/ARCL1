import { collectReferencedSheetCells } from "./exactFormulaEngine.js";

const IS_CALCULATED_COL = (col) =>
  col?.type === "calculated" ||
  col?.type === "formula" ||
  col?.readOnly === true ||
  col?.fixed === true ||
  /^(error|inderror|errorrpm|uncertainty|relativeerror|repeatabilityerror)/i.test(col?.key || "") ||
  /error|uncertainty|tolerance|relative\s*repeatability|expanded/i.test(col?.label || "");

export const isCellUnfilled = (val) =>
  val === undefined || val === null || String(val).trim() === "";

export const getFillableObservationColumns = (columns = []) => {
  const allCols = Array.isArray(columns) ? columns.filter((c) => c && (c.key || c.label)) : [];
  const rawCols = allCols.filter((c) => !IS_CALCULATED_COL(c));
  return rawCols.length > 0 ? rawCols : allCols;
};

/**
 * Determine if a cell at (rowIdx, col.key) is empty and safe to fill by Voice.
 * Pre-filled / fixed cells (Nominal values, pre-populated template cells, or already typed values)
 * return false so Voice never overwrites existing fixed data.
 */
export const isObservationCellEmpty = (readings = [], rowIdx = 0, colKey = "", lockedCellMap = null) => {
  if (!colKey) return false;
  if (lockedCellMap && lockedCellMap.has(`${rowIdx}:${colKey}`)) {
    return false;
  }
  const rowVal = readings?.[rowIdx]?.[colKey];
  return isCellUnfilled(rowVal);
};

/**
 * Collect ordered list of unfilled (empty) cell slots across `readings`,
 * starting forward from (startRowIdx, startColIdx).
 */
export const getEmptyCellSlotsForward = (
  readings = [],
  columns = [],
  startRowIdx = 0,
  startColIdx = 0,
  lockedCellMap = null
) => {
  const fillableCols = getFillableObservationColumns(columns);
  const rows = Array.isArray(readings) ? readings : [];
  const slots = [];

  for (let r = Math.max(0, startRowIdx); r < rows.length; r++) {
    const cStart = r === startRowIdx ? Math.max(0, startColIdx) : 0;
    for (let c = cStart; c < fillableCols.length; c++) {
      const col = fillableCols[c];
      if (isObservationCellEmpty(rows, r, col.key, lockedCellMap)) {
        slots.push({
          rowIdx: r,
          colIdx: c,
          colKey: col.key,
          colLabel: col.label || col.key,
        });
      }
    }
  }
  return slots;
};

/**
 * Find the first empty (unfilled) cell position from (startRowIdx, startColIdx),
 * wrapping to search from the top (0, 0) if none remain below.
 */
export const findFirstEmptyCellCursor = (
  readings = [],
  columns = [],
  startRowIdx = 0,
  startColIdx = 0,
  lockedCellMap = null
) => {
  const forward = getEmptyCellSlotsForward(readings, columns, startRowIdx, startColIdx, lockedCellMap);
  if (forward.length > 0) {
    return { rowIdx: forward[0].rowIdx, colIdx: forward[0].colIdx, hasEmpty: true };
  }
  const fromTop = getEmptyCellSlotsForward(readings, columns, 0, 0, lockedCellMap);
  if (fromTop.length > 0) {
    return { rowIdx: fromTop[0].rowIdx, colIdx: fromTop[0].colIdx, hasEmpty: true };
  }
  return { rowIdx: Math.max(0, (readings?.length || 1) - 1), colIdx: 0, hasEmpty: false };
};

const WORD_NUMBER_VALUES = {
  zero: 0, shunya: 0, oh: 0,
  one: 1, ek: 1,
  two: 2, do: 2,
  three: 3, teen: 3,
  four: 4, char: 4, chaar: 4,
  five: 5, paanch: 5, panch: 5,
  six: 6, chhe: 6, che: 6,
  seven: 7, saat: 7,
  eight: 8, aath: 8,
  nine: 9, nau: 9,
  ten: 10, das: 10,
  eleven: 11, gyarah: 11,
  twelve: 12, barah: 12,
  thirteen: 13, terah: 13,
  fourteen: 14, chaudah: 14,
  fifteen: 15, pandrah: 15,
  sixteen: 16, solah: 16,
  seventeen: 17, satrah: 17,
  eighteen: 18, atharah: 18,
  nineteen: 19, unnees: 19,
  twenty: 20, bees: 20,
  thirty: 30, tees: 30,
  forty: 40, chalis: 40, chaalis: 40,
  fifty: 50, pachas: 50, pachaas: 50,
  sixty: 60, saath: 60,
  seventy: 70, sattar: 70,
  eighty: 80, assi: 80,
  ninety: 90, nabbe: 90,
};

/**
 * Convert Hinglish / English spoken phrases like "minus zero point five", "twenty five point two",
 * or "teen sau ek" into normalized text containing decimal digits before extracting values.
 */
export const normalizeSpokenNumbers = (rawTranscript = "") => {
  let text = ` ${String(rawTranscript || "").toLowerCase().trim()} `;
  text = text.replace(/[,;]+/g, " ");
  text = text.replace(/\b(dashamlav|point|dot|decimal|bindu)\b/g, ".");
  text = text.replace(/\b(minus|negative|ghata)\b/g, " -");
  text = text.replace(/\b(plus|positive)\b/g, " +");

  // Map individual number words to digits first
  Object.entries(WORD_NUMBER_VALUES).forEach(([word, num]) => {
    text = text.replace(new RegExp(`\\b${word}\\b`, "g"), String(num));
  });

  // Resolve compound tens + unit e.g. "20 5" -> "25", "30 3" -> "33"
  text = text.replace(/\b(20|30|40|50|60|70|80|90)\s+([1-9])\b/g, (_, t, u) => String(Number(t) + Number(u)));

  // Resolve hundreds ("1 hundred 50" / "1 sau 50" / "2 hundred")
  text = text.replace(/(\d+)\s+(?:hundred|sau)\s+(\d{1,2})\b/g, (_, h, r) => String(Number(h) * 100 + Number(r)));
  text = text.replace(/(\d+)\s+(?:hundred|sau)\b/g, (_, h) => String(Number(h) * 100));
  text = text.replace(/\b(?:hundred|sau)\s+(\d{1,2})\b/g, (_, r) => String(100 + Number(r)));
  text = text.replace(/\b(?:hundred|sau)\b/g, "100");

  // Resolve thousands ("2 thousand 500" / "2 hazaar 50")
  text = text.replace(/(\d+)\s+(?:thousand|hazaar|hazar)\s+(\d+)\b/g, (_, th, rest) => String(Number(th) * 1000 + Number(rest)));
  text = text.replace(/(\d+)\s+(?:thousand|hazaar|hazar)\b/g, (_, th) => String(Number(th) * 1000));

  // Join decimal points: "33 . 5" -> "33.5", " . 5" -> "0.5"
  text = text.replace(/\s*\.\s*/g, ".");
  text = text.replace(/(^|\s)([+-]?)\.(\d+)/g, "$1$20.$3");
  text = text.replace(/\s+-\s+/g, " -");

  return text.replace(/\s+/g, " ").trim();
};

const extractNumberTokens = (str = "") => {
  const raw = String(str).match(/[+-]?(?:\d+(?:\.\d+)?|\.\d+)/g) || [];
  return raw.map((tok) => {
    if (tok.startsWith(".")) return `0${tok}`;
    if (tok.startsWith("-.")) return `-0${tok.slice(1)}`;
    if (tok.startsWith("+.")) return `0${tok.slice(2)}`;
    return tok;
  });
};

const isExactMeasurementRowContext = (rowCells, colArrIdx) => {
  for (let k = colArrIdx - 1; k >= 0; k--) {
    const prevTxt = String(rowCells[k]?.value ?? "").trim();
    if (!prevTxt) continue;
    const cleanLbl = prevTxt.replace(/^\d+(?:\.\d+)?\s*\.\s*/g, "").replace(/[:-]+$/g, "").trim();
    return /^(?:size(?:\([^)]*\))?|range(?:\([^)]*\))?|capacity(?:\([^)]*\))?|serial\s*no\.?\s*\/?\s*id\s*no\.?|sr\.?\s*no\.?\s*\/?\s*id\s*no\.?|id\s*no\.?|length|width|height|diameter|dia\.?|thickness|depth)$/i.test(cleanLbl);
  }
  return false;
};

const describeExactCellSlot = (rowCells, colArrIdx, cell) => {
  let rowLabel = "";
  for (let k = colArrIdx - 1; k >= 0; k--) {
    const txt = String(rowCells[k]?.value ?? "").trim();
    if (txt && txt !== ":" && txt !== ":-") {
      rowLabel = txt.replace(/[:-]+$/g, "").trim();
      break;
    }
  }
  const cleanLabel =
    cell.placeholder ||
    rowLabel ||
    (cell.obsKey ? cell.obsKey : "") ||
    cell.ref;
  return `${cleanLabel} (${cell.ref})`;
};

/**
 * Collect ordered list of EMPTY editable cells from 1:1 exactSheets (observation sheet first),
 * excluding pre-filled / fixed cells and header/format cells.
 */
export const getExactSheetEmptySlots = (exactSheets = [], exactSheetValues = {}) => {
  const sheets = Array.isArray(exactSheets) ? exactSheets.filter(Boolean) : [];
  if (sheets.length === 0) return [];

  const referenced = collectReferencedSheetCells(sheets);
  const obsSheets = sheets.filter((sh) => sh?.role === "observation" || /obs/i.test(sh?.sheetName || ""));
  const targetSheets = obsSheets.length > 0 ? obsSheets : [sheets[0]];

  const slots = [];
  targetSheets.forEach((sh, shIdx) => {
    const sheetName = sh.sheetName || `Sheet ${shIdx + 1}`;
    (sh.blocks || []).forEach((blk) => {
      if (blk.kind !== "table") return;
      (blk.rows || []).forEach((rw) => {
        const rowCells = rw.cells || [];
        rowCells.forEach((cell, cIdx) => {
          if (!cell?.ref || cell.kind === "formula") return;
          const cellKey = `${sheetName}!${cell.ref}`;
          const baseVal = String(cell.value ?? "").trim();
          const liveVal = exactSheetValues?.[cellKey];
          const effectiveVal = liveVal !== undefined ? String(liveVal).trim() : baseVal;

          // Never touch already-filled / fixed cells!
          if (effectiveVal !== "") return;

          const isEditable =
            cell.kind === "input" ||
            (cell.kind === "label" &&
              baseVal === "" &&
              (referenced.has(cellKey) || isExactMeasurementRowContext(rowCells, cIdx)));

          if (!isEditable) return;

          const label = describeExactCellSlot(rowCells, cIdx, cell);
          // Skip meta rows if user doesn't normally dictate into top inward header unless Size/Range
          const isTopMeta = /\b(format\s*no|format\s*issue|inward\s*no|receipt|calibration\s*by|reviewed)\b/i.test(label);
          if (isTopMeta) return;

          slots.push({
            cellKey,
            sheetName,
            ref: cell.ref,
            label,
            isSizeOrRange: /\b(size|range)\b/i.test(label),
            obsKey: cell.obsKey || "",
            obsRowIdx: typeof cell.obsRowIdx === "number" ? cell.obsRowIdx : -1,
          });
        });
      });
    });
  });

  // Order measurement & Size/Range cells smoothly in natural sheet order
  return slots;
};

/**
 * Parse a live voice transcript into structured updates strictly targeting UNFILLED cells.
 * Already-filled or pre-fixed cells are NEVER overwritten.
 */
export const parseSpokenObservationCommand = (
  transcript = "",
  {
    columns = [],
    readings = [],
    activeRowIdx = 0,
    activeColIdx = 0,
    lockedCellMap = null,
    exactSlots = null,
    activeExactCellKey = "",
  } = {}
) => {
  const raw = String(transcript || "").trim();
  if (!raw) return { type: "noop" };

  const low = raw.toLowerCase().trim();

  // 1. Safe Navigation & Undo commands (no wipe of fixed data)
  if (/^(undo|wapas|pichhla\s*undo|revert)$/.test(low)) {
    return { type: "undo" };
  }
  if (/^(new\s*row|add\s*row|nayi\s*row)$/.test(low)) {
    return { type: "add_row" };
  }

  // Exact 1:1 Excel sheet voice navigation (when 1:1 sheet mode is active)
  if (Array.isArray(exactSlots)) {
    const startIdx = Math.max(
      0,
      activeExactCellKey ? exactSlots.findIndex((s) => s.cellKey === activeExactCellKey) : 0
    );
    if (/^(next|agla|aage|skip|next\s*row|agla\s*row|agla\s*line|next\s*line)$/.test(low)) {
      const nextSlot = exactSlots[startIdx + 1] || exactSlots[0];
      if (!nextSlot) {
        return { type: "all_filled", message: "Is 1:1 sheet me sabhi khali boxes bhar chuke hain." };
      }
      return {
        type: "move_exact",
        nextExactCellKey: nextSlot.cellKey,
        message: `Moved to ${nextSlot.label}`,
      };
    }
    if (/^(prev(?:ious)?|pichhla|back|prev(?:ious)?\s*row|pichhla\s*row|back\s*row)$/.test(low)) {
      const prevSlot = exactSlots[Math.max(0, startIdx - 1)] || exactSlots[0];
      if (!prevSlot) return { type: "noop" };
      return {
        type: "move_exact",
        nextExactCellKey: prevSlot.cellKey,
        message: `Moved back to ${prevSlot.label}`,
      };
    }
  } else {
    if (/^(next\s*row|agla\s*row|agla\s*line|next\s*line)$/.test(low)) {
      const nextCursor = findFirstEmptyCellCursor(readings, columns, activeRowIdx + 1, 0, lockedCellMap);
      return {
        type: "move",
        nextRowIdx: nextCursor.rowIdx,
        nextColIdx: nextCursor.colIdx,
        message: `Moved to Row ${nextCursor.rowIdx + 1}, ${getFillableObservationColumns(columns)[nextCursor.colIdx]?.label || `Col ${nextCursor.colIdx + 1}`}`,
      };
    }
    if (/^(prev(?:ious)?\s*row|pichhla\s*row|back\s*row)$/.test(low)) {
      const prevRow = Math.max(0, activeRowIdx - 1);
      const prevCursor = findFirstEmptyCellCursor(readings, columns, prevRow, 0, lockedCellMap);
      return {
        type: "move",
        nextRowIdx: prevCursor.rowIdx,
        nextColIdx: prevCursor.colIdx,
        message: `Moved to Row ${prevCursor.rowIdx + 1}`,
      };
    }
    if (/^(next|agla|aage|skip)$/.test(low)) {
      const forward = getEmptyCellSlotsForward(readings, columns, activeRowIdx, activeColIdx, lockedCellMap);
      const target = forward[1] || forward[0];
      if (!target) {
        return { type: "all_filled", message: "All cells in existing rows are already filled/fixed." };
      }
      return {
        type: "move",
        nextRowIdx: target.rowIdx,
        nextColIdx: target.colIdx,
        message: `Skipped to next empty: Row ${target.rowIdx + 1}, ${target.colLabel}`,
      };
    }
  }

  const normalized = normalizeSpokenNumbers(raw);

  // 2. Spoken metadata (appliers in CalibrationPage skip already-filled values unless empty)
  const metadataUpdates = {};
  let repeatabilityReadings = null;

  const tempMatch = normalized.match(/\b(?:temp(?:erature)?|taapman)\b[^0-9+-]*([+-]?\d+(?:\.\d+)?)/i);
  if (tempMatch) metadataUpdates.temperature = tempMatch[1];

  const rhMatch = normalized.match(/\b(?:humidity|nami|\brh\b)\b[^0-9+-]*([+-]?\d+(?:\.\d+)?)/i);
  if (rhMatch) metadataUpdates.humidity = rhMatch[1];

  const calByMatch = raw.match(/^(?:calibrated\s*by|engineer)\s+(.+)$/i);
  if (calByMatch) metadataUpdates.calibratedBySite = calByMatch[1].trim();

  const remarkMatch = raw.match(/^(?:remarks?|note|tippani)\s+(.+)$/i);
  if (remarkMatch) metadataUpdates.remarks = remarkMatch[1].trim();

  if (/\b(repeatability|mu|repeat)\b/i.test(low)) {
    const nums = extractNumberTokens(normalized).slice(0, 5);
    if (nums.length > 0) {
      repeatabilityReadings = nums;
    }
  }

  if (Object.keys(metadataUpdates).length > 0 || repeatabilityReadings) {
    return {
      type: "metadata",
      metadata: metadataUpdates,
      repeatabilityReadings,
      message: "Checked parameters (only empty fields updated)",
    };
  }

  // 3A. Exact 1:1 Excel sheet cell filling mode
  if (Array.isArray(exactSlots)) {
    const startIdx = Math.max(
      0,
      activeExactCellKey ? exactSlots.findIndex((s) => s.cellKey === activeExactCellKey) : 0
    );
    const activeSlot = exactSlots[startIdx] || exactSlots[0] || null;

    // Handle Size/Range dictation like "100 by 500" / "100 into 500" / "150 x 700" -> "100*500"
    if (activeSlot?.isSizeOrRange || /\b(size|range)\b/i.test(low)) {
      const dimMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:\*|x|×|by|into|cross|guna)\s*(\d+(?:\.\d+)?)/i);
      if (dimMatch) {
        const sizeVal = `${dimMatch[1]}*${dimMatch[2]}`;
        const targetSlot =
          exactSlots.find((s) => s.cellKey === activeExactCellKey) ||
          exactSlots.find((s) => s.isSizeOrRange) ||
          activeSlot;
        if (targetSlot) {
          const targetIdx = exactSlots.findIndex((s) => s.cellKey === targetSlot.cellKey);
          const nextSlot = exactSlots[targetIdx + 1] || null;
          return {
            type: "exact_cells",
            cells: [{ ...targetSlot, value: sizeVal }],
            nextExactCellKey: nextSlot ? nextSlot.cellKey : "",
            message: `Filled ${targetSlot.label} = ${sizeVal}`,
          };
        }
      }
    }

    const exactValues = extractNumberTokens(normalized);
    if (exactValues.length > 0) {
      if (exactSlots.length === 0) {
        return {
          type: "all_filled",
          message: "Sheet ke sabhi khali boxes pehle hi bhar chuke hain — fixed data protected hai.",
        };
      }
      const forwardSlots = exactSlots.slice(startIdx);
      const useSlots = forwardSlots.length > 0 ? forwardSlots : exactSlots;
      const count = Math.min(exactValues.length, useSlots.length);
      const cells = [];
      for (let i = 0; i < count; i++) {
        cells.push({ ...useSlots[i], value: exactValues[i] });
      }
      const nextSlot = useSlots[count] || null;
      return {
        type: "exact_cells",
        cells,
        nextExactCellKey: nextSlot ? nextSlot.cellKey : "",
        message: `Filled ${cells.map((c) => `${c.ref}=${c.value}`).join(", ")}`,
      };
    }

    if (activeSlot && !activeSlot.isSizeOrRange && /^(make|model|serial|id|location|condition)/i.test(activeSlot.label)) {
      const nextSlot = exactSlots[startIdx + 1] || null;
      return {
        type: "exact_cells",
        cells: [{ ...activeSlot, value: raw }],
        nextExactCellKey: nextSlot ? nextSlot.cellKey : "",
        message: `Filled ${activeSlot.label} = ${raw}`,
      };
    }

    return { type: "unmatched", raw };
  }

  // 3B. Spoken measurement values -> pour strictly into EMPTY slots starting from active cursor
  const values = extractNumberTokens(normalized);
  if (values.length === 0) {
    return { type: "unmatched", raw };
  }

  const emptySlots = getEmptyCellSlotsForward(
    readings,
    columns,
    activeRowIdx,
    activeColIdx,
    lockedCellMap
  );

  if (emptySlots.length === 0) {
    return {
      type: "all_filled",
      message: "Koi khali cell nahi bacha — fixed/filled cells change nahi kiye gaye. Naya row jodne ke liye 'New row' bolein.",
    };
  }

  const assignCount = Math.min(values.length, emptySlots.length);
  const cells = [];
  for (let i = 0; i < assignCount; i++) {
    const slot = emptySlots[i];
    cells.push({
      rowIdx: slot.rowIdx,
      colIdx: slot.colIdx,
      colKey: slot.colKey,
      colLabel: slot.colLabel,
      value: values[i],
    });
  }

  // Advance cursor to the next remaining empty cell
  const nextSlot = emptySlots[assignCount] || null;
  const fallbackCursor = nextSlot
    ? { rowIdx: nextSlot.rowIdx, colIdx: nextSlot.colIdx }
    : {
        rowIdx: cells[cells.length - 1].rowIdx,
        colIdx: cells[cells.length - 1].colIdx,
      };

  const skippedExtra = values.length > assignCount ? ` (${values.length - assignCount} skipped — no empty cells left)` : "";

  return {
    type: "cells",
    cells,
    nextRowIdx: fallbackCursor.rowIdx,
    nextColIdx: fallbackCursor.colIdx,
    message: `Filled ${cells.length} empty cell${cells.length > 1 ? "s" : ""}${skippedExtra}`,
  };
};

/**
 * Browser-side fallback parser for OCR text pasted/edited by the technician.
 */
export const parseRawOcrTextForObservation = (rawText = "", columns = []) => {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const allCols = Array.isArray(columns) ? columns.filter((c) => c && (c.key || c.label)) : [];
  const rawCols = getFillableObservationColumns(allCols);
  const metadata = {};
  let repeatabilityReadings = null;
  const readings = [];

  for (const line of lines) {
    if (!metadata.temperature) {
      const m =
        line.match(/(?:temp(?:erature)?)\s*[:=-]?\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?(?:\s*±\s*\d+(?:\.\d+)?)?)\s*(?:°\s*C|C\b|deg)/i) ||
        line.match(/(?:temp(?:erature)?)\s*[:=-]\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?)/i);
      if (m?.[1]) metadata.temperature = m[1].trim();
    }
    if (!metadata.humidity) {
      const m =
        line.match(/(?:humidity|\bRH\b)\s*[:=-]?\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?(?:\s*[±-]\s*\d+(?:\.\d+)?)?)\s*%/i) ||
        line.match(/(?:humidity|\bRH\b)\s*[:=-]\s*(\([^)]+\)|[+-]?\d+(?:\.\d+)?(?:\s*[±-]\s*\d+(?:\.\d+)?)?)/i);
      if (m?.[1] && /\d/.test(m[1])) metadata.humidity = m[1].trim();
    }
    if (!metadata.calibratedBySite) {
      const m = line.match(/(?:calibrated\s*by|calibration\s*by|tested\s*by)\s*[:=-]\s*([A-Za-z][A-Za-z0-9.\s]{1,40})$/i);
      if (m?.[1]) metadata.calibratedBySite = m[1].trim();
    }
    if (!metadata.remarks) {
      const m = line.match(/(?:remarks?)\s*[:=-]\s*(.+)$/i);
      if (m?.[1]) metadata.remarks = m[1].trim();
    }
    if (!repeatabilityReadings && /(?:repeatability|\bMU\b|\bR1\b)/i.test(line)) {
      const nums = extractNumberTokens(line).slice(-5);
      if (nums.length >= 2) {
        while (nums.length < 5) nums.push("");
        repeatabilityReadings = nums;
      }
    }

    if (/(temp|humidity|\brh\b|repeatability|date|cert|ulr|srf|page|format|calibrated\s*by|reviewed)/i.test(line)) {
      continue;
    }

    const nums = extractNumberTokens(line);
    if (nums.length < 2 || allCols.length === 0) continue;

    const targetCols = nums.length >= allCols.length ? allCols : rawCols;
    const rowObj = {};
    for (let i = 0; i < Math.min(targetCols.length, nums.length); i++) {
      if (targetCols[i]?.key) rowObj[targetCols[i].key] = nums[i];
    }
    if (Object.keys(rowObj).length >= 2) readings.push(rowObj);
  }

  return { metadata, repeatabilityReadings, readings };
};
