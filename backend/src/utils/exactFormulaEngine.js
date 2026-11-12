/**
 * Shared Excel/Sheet Formula Evaluator & Metrological Workbook Calculation Engine
 * Used by both ExactSheetRenderer (1:1 live worksheet) and CalibrationPage (QA Authorization & Certificate/Report).
 * Zero `eval` / `Function` calls: uses a clean recursive-descent expression parser.
 */

export const colLettersToIdx = (letters) => {
  let idx = 0;
  const up = String(letters || "").toUpperCase();
  for (let i = 0; i < up.length; i++) {
    idx = idx * 26 + (up.charCodeAt(i) - 64);
  }
  return idx - 1;
};

export const colIdxToLetters = (idx) => {
  let n = idx + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
};

export const parseCellAddr = (refStr) => {
  const m = String(refStr || "").replace(/\$/g, "").trim().match(/^([A-Za-z]{1,3})(\d{1,5})$/);
  if (!m) return null;
  return { c: colLettersToIdx(m[1]), r: parseInt(m[2], 10) - 1, ref: `${m[1].toUpperCase()}${m[2]}` };
};

export const toNumOrNull = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  const s = String(val).trim();
  if (s === "" || s === "-" || s === "---" || s === "N/A") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * Parses nominal + tolerance strings like "33.9±0.1", "63.0 +/- 0.2", "100 +- 0.5",
 * while keeping range spec labels like "63-50" safely marked as specification labels.
 */
export const parseNominalTolerance = (rawVal) => {
  const s = String(rawVal ?? "").trim();
  if (!s) return { target: null, tolerance: null, isSpecRange: false, label: "" };

  const tolMatch = s.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:±|\+\/-|\+-)\s*(\d+(?:\.\d+)?)(?:\s*[a-zA-Z%°]+)?$/);
  if (tolMatch) {
    return {
      target: Number(tolMatch[1]),
      tolerance: Number(tolMatch[2]),
      isSpecRange: false,
      label: s,
    };
  }

  // Range spec like "63-50" or "50 - 40"
  if (/^\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?$/.test(s)) {
    return { target: null, tolerance: null, isSpecRange: true, label: s };
  }

  const plainNum = toNumOrNull(s);
  if (plainNum !== null) {
    return { target: plainNum, tolerance: null, isSpecRange: false, label: s };
  }

  return { target: null, tolerance: null, isSpecRange: false, label: s };
};

const shiftExcelFormulaRows = (formulaStr, deltaRows) => {
  if (!deltaRows) return formulaStr;
  return String(formulaStr || "").replace(
    /(\$?[A-Za-z]{1,3})(\$?)(\d{1,5})/g,
    (full, colPart, rowDollar, rowNumStr) => {
      if (rowDollar === "$") return full; // Keep absolute $row fixed
      const nextRow = Math.max(1, parseInt(rowNumStr, 10) + deltaRows);
      return `${colPart}${nextRow}`;
    }
  );
};

/**
 * Safely evaluate standard Excel arithmetic & functions (=A1+B1, AVERAGE(B16:D16), 'Sheet'!B17, etc.)
 */
export const buildFormulaEvaluator = (exactSheets, liveValues, rowVarResolver = null) => {
  const baseValueMap = new Map();
  const formulaMap = new Map();
  const sheetNamesLower = new Map();

  (exactSheets || []).forEach((sheet) => {
    const sName = sheet?.sheetName || "Sheet";
    sheetNamesLower.set(sName.toLowerCase(), sName);
    (sheet?.blocks || []).forEach((blk) => {
      if (blk.kind !== "table") return;
      (blk.rows || []).forEach((rw) => {
        (rw.cells || []).forEach((cell) => {
          if (!cell?.ref) return;
          const fullKey = `${sName}!${cell.ref}`;
          baseValueMap.set(fullKey, cell.value ?? "");
          if (cell.formula) {
            formulaMap.set(fullKey, cell.formula);
          }
        });
      });
    });
  });

  const evalCache = new Map();

  const resolveSheetName = (rawName) => {
    const cleaned = String(rawName || "").replace(/^'+|'+$/g, "").trim();
    return sheetNamesLower.get(cleaned.toLowerCase()) || cleaned;
  };

  const getCellVal = (sheetName, cellRef, depth = 0) => {
    if (depth > 10) return "";
    const normRef = String(cellRef || "").replace(/\$/g, "").toUpperCase();
    const key = `${sheetName}!${normRef}`;

    if (liveValues && liveValues[key] !== undefined && liveValues[key] !== "") {
      return liveValues[key];
    }
    if (formulaMap.has(key)) {
      return evalFormula(formulaMap.get(key), sheetName, depth + 1);
    }
    if (liveValues && liveValues[key] !== undefined) {
      return liveValues[key];
    }
    return baseValueMap.get(key) ?? "";
  };

  const getRangeNums = (defaultSheet, rangeExpr, depth) => {
    let targetSheet = defaultSheet;
    let body = String(rangeExpr || "").trim();
    const sheetBang = body.match(/^(?:'([^']+)'|([A-Za-z0-9_.\- ]+))!(.+)$/);
    if (sheetBang) {
      targetSheet = resolveSheetName(sheetBang[1] || sheetBang[2]);
      body = sheetBang[3];
    }
    const parts = body.split(":");
    if (parts.length === 1) {
      const n = toNumOrNull(getCellVal(targetSheet, parts[0], depth));
      return n !== null ? [n] : [];
    }
    const p1 = parseCellAddr(parts[0]);
    const p2 = parseCellAddr(parts[1]);
    if (!p1 || !p2) return [];
    const r0 = Math.min(p1.r, p2.r);
    const r1 = Math.max(p1.r, p2.r);
    const c0 = Math.min(p1.c, p2.c);
    const c1 = Math.max(p1.c, p2.c);
    const nums = [];
    for (let r = r0; r <= r1 && nums.length < 300; r++) {
      for (let c = c0; c <= c1; c++) {
        const ref = `${colIdxToLetters(c)}${r + 1}`;
        const n = toNumOrNull(getCellVal(targetSheet, ref, depth));
        if (n !== null) nums.push(n);
      }
    }
    return nums;
  };

  const splitArgs = (argStr) => {
    const args = [];
    let cur = "";
    let paren = 0;
    let inQuote = false;
    let quoteChar = "";
    for (let i = 0; i < argStr.length; i++) {
      const ch = argStr[i];
      if (inQuote) {
        cur += ch;
        if (ch === quoteChar) inQuote = false;
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
        cur += ch;
      } else if (ch === "(") {
        paren++;
        cur += ch;
      } else if (ch === ")") {
        paren--;
        cur += ch;
      } else if (ch === "," && paren === 0) {
        args.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    if (cur.trim() !== "") args.push(cur.trim());
    return args;
  };

  const evalExpr = (exprRaw, currentSheet, depth) => {
    const expr = String(exprRaw || "").trim();
    if (!expr) return "";

    if (/^"[^"]*"$/.test(expr)) {
      return expr.slice(1, -1);
    }

    const splitComparisonExpr = (condStr) => {
      const s = String(condStr || "").trim();
      let paren = 0;
      let inDouble = false;
      let inSingle = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (inDouble) {
          if (ch === '"') inDouble = false;
        } else if (inSingle) {
          if (ch === "'") inSingle = false;
        } else if (ch === '"') {
          inDouble = true;
        } else if (ch === "'") {
          inSingle = true;
        } else if (ch === "(") {
          paren++;
        } else if (ch === ")") {
          paren--;
        } else if (paren === 0) {
          const two = s.slice(i, i + 2);
          if (two === "<=" || two === ">=" || two === "<>" || two === "!=") {
            return { leftStr: s.slice(0, i), op: two, rightStr: s.slice(i + 2) };
          }
          if (ch === "=" || ch === "<" || ch === ">") {
            return { leftStr: s.slice(0, i), op: ch, rightStr: s.slice(i + 1) };
          }
        }
      }
      return null;
    };

    const normalizeDimOrText = (val) => {
      const base = String(val ?? "").trim().toLowerCase();
      if (/^\d+(?:\.\d+)?\s*[x×*]\s*\d+(?:\.\d+)?(?:\s*[x×*]\s*\d+(?:\.\d+)?)?(?:\s*mm)?$/i.test(base)) {
        return base.replace(/\s*mm$/i, "").replace(/\s*[x×*]\s*/g, "*");
      }
      return base;
    };

    const evalComparison = (condStr) => {
      const parts = splitComparisonExpr(condStr);
      if (!parts) {
        const v = evalExpr(condStr, currentSheet, depth);
        if (typeof v === "boolean") return v;
        return Boolean(toNumOrNull(v));
      }
      const left = evalExpr(parts.leftStr, currentSheet, depth);
      const op = parts.op;
      const right = evalExpr(parts.rightStr, currentSheet, depth);
      const ln = toNumOrNull(left);
      const rn = toNumOrNull(right);
      const lVal = ln !== null && rn !== null ? ln : normalizeDimOrText(left);
      const rVal = ln !== null && rn !== null ? rn : normalizeDimOrText(right);
      if (op === "=") return lVal === rVal;
      if (op === "<>" || op === "!=") return lVal !== rVal;
      if (op === "<") return lVal < rVal;
      if (op === ">") return lVal > rVal;
      if (op === "<=") return lVal <= rVal;
      if (op === ">=") return lVal >= rVal;
      return false;
    };

    let pos = 0;
    const len = expr.length;

    const skipWs = () => {
      while (pos < len && /\s/.test(expr[pos])) pos++;
    };

    const parseConcat = () => {
      let left = parseAddSub();
      while (true) {
        skipWs();
        if (expr[pos] === "&") {
          pos++;
          const right = parseAddSub();
          left = `${left ?? ""}${right ?? ""}`;
        } else {
          break;
        }
      }
      return left;
    };

    const parseAddSub = () => {
      let left = parseMulDiv();
      while (true) {
        skipWs();
        if (expr[pos] === "+" || expr[pos] === "-") {
          const op = expr[pos++];
          const right = parseMulDiv();
          const ln = toNumOrNull(left);
          const rn = toNumOrNull(right);
          if (ln === null && rn === null) left = "";
          else {
            const a = ln ?? 0;
            const b = rn ?? 0;
            left = op === "+" ? a + b : a - b;
          }
        } else {
          break;
        }
      }
      return left;
    };

    const parseMulDiv = () => {
      let left = parsePow();
      while (true) {
        skipWs();
        if (expr[pos] === "*" || expr[pos] === "/") {
          const op = expr[pos++];
          const right = parsePow();
          const ln = toNumOrNull(left);
          const rn = toNumOrNull(right);
          if (ln === null || rn === null) left = "";
          else if (op === "/" && rn === 0) left = "";
          else left = op === "*" ? ln * rn : ln / rn;
        } else {
          break;
        }
      }
      return left;
    };

    const parsePow = () => {
      let left = parseUnary();
      skipWs();
      if (expr[pos] === "^") {
        pos++;
        const right = parsePow();
        const ln = toNumOrNull(left);
        const rn = toNumOrNull(right);
        return ln !== null && rn !== null ? Math.pow(ln, rn) : "";
      }
      return left;
    };

    const parseUnary = () => {
      skipWs();
      if (expr[pos] === "-") {
        pos++;
        const v = toNumOrNull(parseUnary());
        return v !== null ? -v : "";
      }
      if (expr[pos] === "+") {
        pos++;
        return parseUnary();
      }
      return parsePrimary();
    };

    const parsePrimary = () => {
      skipWs();
      if (expr[pos] === "(") {
        pos++;
        const val = parseConcat();
        skipWs();
        if (expr[pos] === ")") pos++;
        return val;
      }

      if (expr[pos] === '"') {
        pos++;
        const start = pos;
        while (pos < len && expr[pos] !== '"') pos++;
        const str = expr.slice(start, pos);
        if (expr[pos] === '"') pos++;
        return str;
      }

      // Cross-sheet quoted ref: 'Sheet Name'!$A$1
      if (expr[pos] === "'") {
        const rest = expr.slice(pos);
        const m = rest.match(/^'([^']+)'!\$?([A-Za-z]{1,3})\$?(\d+)/);
        if (m) {
          pos += m[0].length;
          const targetSheet = resolveSheetName(m[1]);
          return getCellVal(targetSheet, `${m[2]}${m[3]}`, depth + 1);
        }
      }

      // Number literal (with optional % suffix)
      const numMatch = expr.slice(pos).match(/^\d+(?:\.\d+)?/);
      if (numMatch) {
        pos += numMatch[0].length;
        let numVal = Number(numMatch[0]);
        skipWs();
        if (expr[pos] === "%") {
          pos++;
          numVal = numVal / 100;
        }
        return numVal;
      }

      // Function call: NAME(...)
      const fnMatch = expr.slice(pos).match(/^([A-Za-z_.]+)\s*\(/);
      if (fnMatch) {
        const fnName = fnMatch[1].toUpperCase();
        pos += fnMatch[0].length;
        let depthParen = 1;
        const startArgs = pos;
        let inQ = false;
        while (pos < len && depthParen > 0) {
          const ch = expr[pos];
          if (ch === '"') inQ = !inQ;
          else if (!inQ && ch === "(") depthParen++;
          else if (!inQ && ch === ")") depthParen--;
          pos++;
        }
        const rawArgsStr = expr.slice(startArgs, pos - 1);
        const args = splitArgs(rawArgsStr);

        if (fnName === "PI") return Math.PI;
        if (fnName === "CHAR") {
          const code = toNumOrNull(evalExpr(args[0] || "", currentSheet, depth + 1));
          return code !== null && code >= 0 ? String.fromCharCode(Math.floor(code)) : "";
        }
        if (fnName === "TRIM") {
          return String(evalExpr(args[0] || "", currentSheet, depth + 1) ?? "").trim();
        }
        if (fnName === "UPPER") {
          return String(evalExpr(args[0] || "", currentSheet, depth + 1) ?? "").toUpperCase();
        }
        if (fnName === "LOWER") {
          return String(evalExpr(args[0] || "", currentSheet, depth + 1) ?? "").toLowerCase();
        }
        if (fnName === "AND") {
          return args.every((a) => evalComparison(a));
        }
        if (fnName === "OR") {
          return args.some((a) => evalComparison(a));
        }
        if (fnName === "IF") {
          const cond = evalComparison(args[0] || "");
          return evalExpr(cond ? (args[1] || '""') : (args[2] || '""'), currentSheet, depth + 1);
        }
        if (fnName === "IFERROR") {
          const v = evalExpr(args[0] || "", currentSheet, depth + 1);
          return v === "" || v === null || Number.isNaN(v)
            ? evalExpr(args[1] || '""', currentSheet, depth + 1)
            : v;
        }
        if (fnName === "POWER") {
          const a = toNumOrNull(evalExpr(args[0] || "", currentSheet, depth + 1));
          const b = toNumOrNull(evalExpr(args[1] || "", currentSheet, depth + 1));
          return a !== null && b !== null ? Math.pow(a, b) : "";
        }

        const collectNums = () => {
          const out = [];
          args.forEach((a) => {
            if (a.includes(":")) {
              out.push(...getRangeNums(currentSheet, a, depth + 1));
            } else {
              const v = toNumOrNull(evalExpr(a, currentSheet, depth + 1));
              if (v !== null) out.push(v);
            }
          });
          return out;
        };

        if (fnName === "SUM") {
          const ns = collectNums();
          return ns.length ? ns.reduce((s, x) => s + x, 0) : "";
        }
        if (fnName === "AVERAGE" || fnName === "AVG") {
          const ns = collectNums();
          return ns.length ? ns.reduce((s, x) => s + x, 0) / ns.length : "";
        }
        if (fnName === "MEDIAN") {
          const ns = collectNums().sort((a, b) => a - b);
          if (!ns.length) return "";
          const mid = Math.floor(ns.length / 2);
          return ns.length % 2 !== 0 ? ns[mid] : (ns[mid - 1] + ns[mid]) / 2;
        }
        if (fnName === "MIN") {
          const ns = collectNums();
          return ns.length ? Math.min(...ns) : "";
        }
        if (fnName === "MAX") {
          const ns = collectNums();
          return ns.length ? Math.max(...ns) : "";
        }
        if (fnName === "COUNT" || fnName === "COUNTA") {
          return collectNums().length;
        }
        if (fnName === "ABS") {
          const v = toNumOrNull(evalExpr(args[0] || "", currentSheet, depth + 1));
          return v !== null ? Math.abs(v) : "";
        }
        if (fnName === "SQRT") {
          const v = toNumOrNull(evalExpr(args[0] || "", currentSheet, depth + 1));
          return v !== null && v >= 0 ? Math.sqrt(v) : "";
        }
        if (fnName === "ROUND") {
          const v = toNumOrNull(evalExpr(args[0] || "", currentSheet, depth + 1));
          const dec = toNumOrNull(evalExpr(args[1] || "0", currentSheet, depth + 1)) ?? 0;
          if (v === null) return "";
          const factor = Math.pow(10, Math.max(0, Math.min(8, Math.round(dec))));
          return Math.round(v * factor) / factor;
        }
        if (fnName === "STDEV" || fnName === "STDEV.S" || fnName === "STDEVP" || fnName === "STDEV.P") {
          const ns = collectNums();
          if (ns.length < 2) return ns.length === 1 ? 0 : "";
          const mean = ns.reduce((s, x) => s + x, 0) / ns.length;
          const denom = fnName === "STDEVP" || fnName === "STDEV.P" ? ns.length : ns.length - 1;
          const variance = ns.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / denom;
          return Math.sqrt(variance);
        }
        return "";
      }

      // Unquoted multi-word or single-word cross-sheet cell ref: e.g. upto 300!I83 or OB!H15
      const unquotedSheetMatch = expr.slice(pos).match(/^([A-Za-z][A-Za-z0-9_. ]*?)!\$?([A-Za-z]{1,3})\$?(\d+)/);
      if (unquotedSheetMatch) {
        pos += unquotedSheetMatch[0].length;
        const targetSheet = resolveSheetName(unquotedSheetMatch[1]);
        return getCellVal(targetSheet, `${unquotedSheetMatch[2]}${unquotedSheetMatch[3]}`, depth + 1);
      }

      // Local cell ref ($A$1 or B17) — only treat as cell ref if there is no rowVar override OR it matches Excel A1..XFD99999
      const cellRefMatch = expr.slice(pos).match(/^\$?([A-Za-z]{1,3})\$?(\d{1,5})(?![A-Za-z0-9_])/);
      if (cellRefMatch) {
        const token = `${cellRefMatch[1]}${cellRefMatch[2]}`;
        if (rowVarResolver) {
          const resolvedVar = rowVarResolver(token);
          if (resolvedVar !== undefined) {
            pos += cellRefMatch[0].length;
            return resolvedVar;
          }
        }
        pos += cellRefMatch[0].length;
        return getCellVal(currentSheet, token, depth + 1);
      }

      // Symbolic variable identifier (for tableColumns formulas like ((indicated - masterLoad) / masterLoad) * 100)
      if (rowVarResolver) {
        const idMatch = expr.slice(pos).match(/^([A-Za-z_][A-Za-z0-9_]*)/);
        if (idMatch) {
          pos += idMatch[0].length;
          const val = rowVarResolver(idMatch[1]);
          return val !== undefined ? val : "";
        }
      }

      pos++;
      return "";
    };

    try {
      return parseConcat();
    } catch {
      return "";
    }
  };

  const evalFormula = (rawFormula, currentSheet, depth = 0) => {
    const clean = String(rawFormula || "").replace(/^=+/, "").trim();
    if (!clean) return "";
    const cacheKey = `${currentSheet}::${clean}`;
    if (!rowVarResolver && evalCache.has(cacheKey)) return evalCache.get(cacheKey);
    const out = evalExpr(clean, currentSheet, depth);
    if (!rowVarResolver) evalCache.set(cacheKey, out);
    return out;
  };

  const formatOutput = (val, numFormat = "", fallback = "") => {
    if (val === undefined || val === null || val === "") return fallback;
    if (typeof val === "number") {
      if (!Number.isFinite(val)) return fallback;
      if (/%/.test(numFormat)) {
        const pct = val * 100;
        const dec = numFormat.includes("0.00") ? 2 : numFormat.includes("0.0") ? 1 : 2;
        return `${pct.toFixed(dec)}%`;
      }
      const decMatch = String(numFormat || "").match(/\.([0]+)/);
      if (decMatch) {
        return val.toFixed(Math.min(6, decMatch[1].length));
      }
      return String(Number(val.toFixed(4)));
    }
    return String(val);
  };

  return { evalFormula, formatOutput, formulaMap, baseValueMap, getCellVal };
};

/**
 * Evaluate a symbolic key-based formula like "((indicated - masterLoad) / masterLoad) * 100"
 */
export const evalKeyFormula = (formulaStr, rowObj, fallbackKeys = {}) => {
  const clean = String(formulaStr || "").replace(/^=+/, "").trim();
  if (!clean) return "";
  const ev = buildFormulaEvaluator([], {}, (name) => {
    if (rowObj && rowObj[name] !== undefined && rowObj[name] !== "") return rowObj[name];
    const mapped = fallbackKeys[name];
    if (mapped && rowObj && rowObj[mapped] !== undefined && rowObj[mapped] !== "") return rowObj[mapped];
    return undefined;
  });
  return ev.evalFormula(clean, "__ROW__", 0);
};

const normalizeReportColKey = (label, idx) => {
  const l = String(label || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (/^(?:sr|sl|s)\.?\s*no/.test(l)) return "sNo";
  if (/permissible/.test(l)) return "permissibleError";
  if (/specification|size\s*range/.test(l)) return "specification";
  if (/gap\s*size/.test(l)) return "gapSize";
  if (/nominal|denom/.test(l)) return "nominal";
  if (/measured\s*gap/.test(l)) return "measuredGap";
  if (/reading\s*on\s*master|master\s*(?:true\s*load|value)/.test(l)) return "masterValue";
  if (/average|mean|indicated/.test(l)) return "indicated";
  if (/repeatabil/.test(l)) return "repeatability";
  if (/uncertain/.test(l)) return "uncertainty";
  if (/error|deviation/.test(l)) return "error";
  if (/remark/.test(l)) return "remarks";
  return `rep_col_${idx}`;
};

/**
 * Extract live formula-evaluated Report Sheet table & Uncertainty cell from exactSheets (if any report sheet exists).
 */
const extractEvaluatedReportSheetTable = (exactSheets, liveValues, evaluator) => {
  const reportSheet = (exactSheets || []).find(
    (sh) => sh?.role === "report" || /report/i.test(sh?.sheetName || "")
  );
  if (!reportSheet) return null;

  const sName = reportSheet.sheetName || "Report";
  const allRows = [];
  (reportSheet.blocks || []).forEach((blk) => {
    if (blk.kind === "table" && Array.isArray(blk.rows)) {
      allRows.push(...blk.rows);
    }
  });
  if (allRows.length === 0) return null;

  // Locate header row inside report sheet
  let headerRowArrIdx = -1;
  for (let i = 0; i < allRows.length; i++) {
    const rw = allRows[i];
    const texts = (rw.cells || []).map((c) => String(c.value || "").toLowerCase().trim()).filter(Boolean);
    const joined = texts.join(" ");
    const hasMatch =
      texts.length >= 2 &&
      (/(?:nominal|specification|gap\s*size|measured\s*gap|reading\s*on\s*master|average\s*indicated|master\s*true\s*load|standard\s*value)/.test(joined) ||
        (/sr\.?\s*no/.test(joined) && /(?:error|reading|measured|value|uncertainty)/.test(joined)));
    if (hasMatch) {
      headerRowArrIdx = i;
      break;
    }
  }

  let reportUncertaintyVal = "";
  let reportUncertaintyFormula = "";
  for (let i = 0; i < allRows.length; i++) {
    const rw = allRows[i];
    const rowText = (rw.cells || []).map((c) => String(c.value || "")).join(" ").toLowerCase();
    if (/uncertain|mu\s*\(±|±\s*mu/.test(rowText)) {
      for (const c of rw.cells || []) {
        if (c.formula) {
          const val = evaluator.evalFormula(c.formula, sName, 0);
          const fmt = evaluator.formatOutput(val, c.numFormat, c.value || "");
          if (fmt !== "") {
            reportUncertaintyVal = fmt;
            reportUncertaintyFormula = `=${c.formula.replace(/^=+/, "")} (${sName}!${c.ref})`;
            break;
          }
        }
      }
    }
  }

  if (headerRowArrIdx < 0) {
    return reportUncertaintyVal
      ? { sheetName: sName, columns: [], rows: [], uncertaintyValue: reportUncertaintyVal, uncertaintyFormula: reportUncertaintyFormula, source: "excel_report_meta" }
      : null;
  }

  const headerRow = allRows[headerRowArrIdx];
  const seenKeys = new Set();
  const columns = [];
  (headerRow.cells || []).forEach((cell, idx) => {
    const rawLabel = String(cell.value || "").replace(/\s+/g, " ").trim();
    if (!rawLabel) return;
    let baseKey = normalizeReportColKey(rawLabel, idx);
    let key = baseKey;
    let n = 1;
    while (seenKeys.has(key)) {
      n++;
      key = `${baseKey}_${n}`;
    }
    seenKeys.add(key);
    columns.push({
      key,
      label: rawLabel,
      cStart: cell.c,
      cEnd: cell.c + Math.max(1, cell.colSpan || 1) - 1,
    });
  });

  if (columns.length < 2) return null;

  const repRows = [];
  for (let i = headerRowArrIdx + 1; i < allRows.length; i++) {
    const rw = allRows[i];
    const cells = rw.cells || [];
    const plainTexts = cells
      .map((c) => String(liveValues?.[`${sName}!${c.ref}`] ?? c.value ?? "").trim())
      .filter(Boolean);
    const joinedLow = plainTexts.join(" ").toLowerCase();

    if (/^(?:note|\*|reviewed|authorized|calibrated\s*by|format\s*no|page\s*no|certificate\s*issued)/i.test(joinedLow)) {
      break;
    }
    if (/measurement\s*uncertainty|expanded\s*uncertainty/i.test(joinedLow) && cells.some((c) => c.formula)) {
      break;
    }

    const rowObj = {};
    const formulaCols = {};
    let hasValue = false;
    let hasFormulaOrLive = false;

    columns.forEach((col) => {
      const matchedCell = cells.find((c) => {
        const cEnd = c.c + Math.max(1, c.colSpan || 1) - 1;
        return c.c <= col.cEnd && cEnd >= col.cStart;
      });
      if (!matchedCell) {
        rowObj[col.key] = "";
        return;
      }
      const keyName = `${sName}!${matchedCell.ref}`;
      let resolved = "";
      if (matchedCell.formula) {
        const rawOut = evaluator.evalFormula(matchedCell.formula, sName, 0);
        resolved = evaluator.formatOutput(rawOut, matchedCell.numFormat, matchedCell.value ?? "");
        formulaCols[col.key] = `=${matchedCell.formula.replace(/^=+/, "")} (${sName}!${matchedCell.ref})`;
        hasFormulaOrLive = true;
      } else if (liveValues?.[keyName] !== undefined && liveValues[keyName] !== "") {
        resolved = String(liveValues[keyName]);
        hasFormulaOrLive = true;
      } else {
        resolved = String(matchedCell.value ?? "").trim();
      }
      if (resolved !== "") hasValue = true;
      rowObj[col.key] = resolved;
    });

    if (hasValue || hasFormulaOrLive) {
      rowObj._formulas = formulaCols;
      repRows.push(rowObj);
    }
  }

  return {
    sheetName: sName,
    columns: columns.map(({ key, label }) => ({ key, label })),
    rows: repRows,
    uncertaintyValue: reportUncertaintyVal,
    uncertaintyFormula: reportUncertaintyFormula,
    source: "excel_report_sheet",
  };
};

/**
 * Extract AMU formula outputs (uA, uB, uC, k, expandedUncertainty) from any AMU exactSheet.
 */
const extractEvaluatedAmuSheet = (exactSheets, evaluator) => {
  const amuSheet = (exactSheets || []).find(
    (sh) => sh?.role === "amu" || /amu|\bmu\b|uncertaint|upto/i.test(sh?.sheetName || "")
  );
  if (!amuSheet) return null;

  const sName = amuSheet.sheetName || "AMU";
  let uA = null;
  let uB = null;
  let uC = null;
  let expandedUncertainty = null;
  let coverageFactor = 2.0;
  let formulaCount = 0;
  const evaluatedItems = [];

  (amuSheet.blocks || []).forEach((blk) => {
    if (blk.kind !== "table") return;
    (blk.rows || []).forEach((rw) => {
      const cells = rw.cells || [];
      const rowLabel = cells
        .filter((c) => !c.formula && c.kind !== "input")
        .map((c) => String(c.value || "").trim())
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      cells.forEach((cell) => {
        if (!cell.formula) return;
        formulaCount++;
        const rawOut = evaluator.evalFormula(cell.formula, sName, 0);
        const num = toNumOrNull(rawOut);
        const fmt = evaluator.formatOutput(rawOut, cell.numFormat, cell.value ?? "");
        if (num === null) return;

        if (/expanded\s*uncertain|u\s*\(\s*at\s*95|\bue\b|\bu_?e\b/i.test(rowLabel)) {
          expandedUncertainty = num;
        } else if (/combined\s*(?:standard\s*)?uncertain|\buc\b|\bu_?c\b/i.test(rowLabel)) {
          uC = num;
        } else if (/type\s*a|repeatabil|\bua\b|\bu_?a\b/i.test(rowLabel)) {
          uA = num;
        } else if (/type\s*b|\bub\b|\bu_?b\b/i.test(rowLabel)) {
          uB = num;
        } else if (/coverage\s*factor|\bk\s*=/.test(rowLabel) && num >= 1 && num <= 4) {
          coverageFactor = num;
        }

        if (evaluatedItems.length < 18 && fmt !== "") {
          evaluatedItems.push({
            ref: `${sName}!${cell.ref}`,
            label: rowLabel.slice(0, 60) || cell.ref,
            formula: `=${cell.formula.replace(/^=+/, "")}`,
            value: fmt,
          });
        }
      });
    });
  });

  if (formulaCount === 0) return null;
  return {
    sheetName: sName,
    uA,
    uB,
    uC,
    coverageFactor,
    expandedUncertainty,
    evaluatedItems,
  };
};

/**
 * Unified workbook calculation used by Section 4 (Save/Submit), Section 5 (Authorization Inspect),
 * Certificate preview, and Backend PDF Certificate/Report generation.
 */
export const evaluateTemplateWorkbookResults = ({ template = null, observationData = {}, record = {} } = {}) => {
  const obs = observationData || {};
  const exactSheets = Array.isArray(template?.exactSheets) && template.exactSheets.length > 0
    ? template.exactSheets
    : Array.isArray(obs.exactSheets)
    ? obs.exactSheets
    : [];

  // 1. Merge exactSheetValues with readings so formulas evaluate regardless of which view technician filled
  const liveValues = { ...(obs.exactSheetValues && typeof obs.exactSheetValues === "object" ? obs.exactSheetValues : {}) };
  const inputReadings = Array.isArray(obs.readings) && obs.readings.length > 0
    ? obs.readings
    : Array.isArray(template?.defaultReadings)
    ? template.defaultReadings
    : [];

  const obsFormulaMetaByRowKey = new Map();
  let obsExtraFormulaShiftBase = {};
  let maxMappedRowIdx = -1;

  exactSheets.forEach((sheet) => {
    const sName = sheet?.sheetName || "Sheet";
    (sheet?.blocks || []).forEach((blk) => {
      if (blk.kind !== "table") return;
      (blk.rows || []).forEach((rw) => {
        (rw.cells || []).forEach((cell) => {
          if (cell.obsRowIdx !== undefined && cell.obsKey) {
            if (cell.obsRowIdx > maxMappedRowIdx) maxMappedRowIdx = cell.obsRowIdx;
            const cKey = `${sName}!${cell.ref}`;
            const rowItem = inputReadings[cell.obsRowIdx];
            if (
              rowItem &&
              rowItem[cell.obsKey] !== undefined &&
              rowItem[cell.obsKey] !== "" &&
              (liveValues[cKey] === undefined || liveValues[cKey] === "")
            ) {
              liveValues[cKey] = rowItem[cell.obsKey];
            }
            if (cell.formula) {
              obsFormulaMetaByRowKey.set(`${cell.obsRowIdx}::${cell.obsKey}`, {
                sheetName: sName,
                ref: cell.ref,
                r: cell.r,
                formula: cell.formula,
                numFormat: cell.numFormat || "",
              });
              obsExtraFormulaShiftBase[cell.obsKey] = {
                sheetName: sName,
                baseObsRowIdx: cell.obsRowIdx,
                baseRef: cell.ref,
                formula: cell.formula,
                numFormat: cell.numFormat || "",
              };
            }
          }
        });
      });
    });
  });

  // Also capture any dynamically added __extraRows__ entries from ExactSheetRenderer
  const extraMergedRows = [];
  exactSheets.forEach((sheet) => {
    const sName = sheet?.sheetName || "Sheet";
    const exArr = liveValues[`__extraRows__${sName}`];
    if (Array.isArray(exArr)) {
      exArr.forEach((exRow) => {
        if (exRow && typeof exRow === "object") extraMergedRows.push(exRow);
      });
    }
  });

  const evaluator = buildFormulaEvaluator(exactSheets, liveValues);

  // Collect all formula cells across workbook for transparent QA inspection
  const formulaCells = [];
  exactSheets.forEach((sheet) => {
    const sName = sheet?.sheetName || "Sheet";
    (sheet?.blocks || []).forEach((blk) => {
      if (blk.kind !== "table") return;
      (blk.rows || []).forEach((rw) => {
        (rw.cells || []).forEach((cell) => {
          if (!cell?.formula) return;
          const rawVal = evaluator.evalFormula(cell.formula, sName, 0);
          const formatted = evaluator.formatOutput(rawVal, cell.numFormat, cell.value ?? "");
          formulaCells.push({
            sheetName: sName,
            role: sheet.role || "sheet",
            ref: cell.ref,
            fullRef: `${sName}!${cell.ref}`,
            formula: `=${cell.formula.replace(/^=+/, "")}`,
            value: formatted,
            numericValue: toNumOrNull(rawVal),
          });
        });
      });
    });
  });

  // 2. Build evaluatedReadings + calculatedRows for QA Authorization & Certificate Results
  const cols = Array.isArray(obs.tableColumns) && obs.tableColumns.length > 0
    ? obs.tableColumns
    : Array.isArray(template?.tableColumns)
    ? template.tableColumns
    : [];

  const totalRowCount = Math.max(inputReadings.length, maxMappedRowIdx + 1);
  const workingRows = [];
  for (let i = 0; i < totalRowCount; i++) {
    workingRows.push({ ...(inputReadings[i] || {}) });
  }
  if (extraMergedRows.length > 0 && workingRows.length < maxMappedRowIdx + 1 + extraMergedRows.length) {
    extraMergedRows.forEach((er, idx) => {
      const targetIdx = maxMappedRowIdx + 1 + idx;
      if (!workingRows[targetIdx]) workingRows[targetIdx] = { ...er };
    });
  }

  // Pull live values back into workingRows from exactSheets cells
  exactSheets.forEach((sheet) => {
    const sName = sheet?.sheetName || "Sheet";
    (sheet?.blocks || []).forEach((blk) => {
      if (blk.kind !== "table") return;
      (blk.rows || []).forEach((rw) => {
        (rw.cells || []).forEach((cell) => {
          if (cell.obsRowIdx === undefined || !cell.obsKey) return;
          const rowObj = workingRows[cell.obsRowIdx];
          if (!rowObj) return;
          const cKey = `${sName}!${cell.ref}`;
          if (cell.formula) {
            const rawVal = evaluator.evalFormula(cell.formula, sName, 0);
            const formatted = evaluator.formatOutput(rawVal, cell.numFormat, cell.value ?? "");
            if (formatted !== "") {
              rowObj[cell.obsKey] = formatted;
              rowObj._formulas = { ...(rowObj._formulas || {}), [cell.obsKey]: `=${cell.formula.replace(/^=+/, "")} (${cKey})` };
            }
          } else if (liveValues[cKey] !== undefined && liveValues[cKey] !== "") {
            rowObj[cell.obsKey] = liveValues[cKey];
          } else if ((rowObj[cell.obsKey] === undefined || rowObj[cell.obsKey] === "") && cell.value !== undefined && cell.value !== "") {
            rowObj[cell.obsKey] = cell.value;
          }
        });
      });
    });
  });

  // Extract live Excel Report Sheet & AMU Sheet evaluations before per-row mapping so report formulas (e.g. =B17-D17, =OB!H15) hydrate rows!
  const reportTable = extractEvaluatedReportSheetTable(exactSheets, liveValues, evaluator);
  const excelAmu = extractEvaluatedAmuSheet(exactSheets, evaluator);

  const leastCount = parseFloat(obs.leastCount || record?.leastCount || template?.parameters?.leastCount || "0.01") || 0.01;
  const instLower = String(record?.instrument || obs.instrument || template?.name || "").toLowerCase();
  const isForce = instLower.includes("testing machine") || instLower.includes("ctm") || instLower.includes("utm");

  const calculatedRows = [];
  const evaluatedReadings = [];
  let maxAbsError = 0;
  let hasAnyFail = false;

  workingRows.forEach((rawRow, idx) => {
    const r = { ...rawRow };
    const rowFormulas = { ...(r._formulas || {}) };

    // Apply any explicit tableColumns formulas
    cols.forEach((col) => {
      if (!col?.formula) return;
      const cleanF = String(col.formula).replace(/^=+/, "").trim();
      const obsMeta = obsFormulaMetaByRowKey.get(`${idx}::${col.key}`);
      if (obsMeta) {
        const rawOut = evaluator.evalFormula(obsMeta.formula, obsMeta.sheetName, 0);
        const fmt = evaluator.formatOutput(rawOut, obsMeta.numFormat, "");
        if (fmt !== "") {
          r[col.key] = fmt;
          rowFormulas[col.key] = `=${obsMeta.formula.replace(/^=+/, "")} (${obsMeta.sheetName}!${obsMeta.ref})`;
        }
        return;
      }

      // If Excel cell formula on base row exists and this is an extra appended row, shift relative row numbers
      const shiftMeta = obsExtraFormulaShiftBase[col.key];
      const looksExcelRefFormula = /!/.test(cleanF) || /\b[A-Z]{1,3}\d{1,4}\b/.test(cleanF);
      if (shiftMeta && looksExcelRefFormula) {
        const delta = idx - shiftMeta.baseObsRowIdx;
        const shiftedF = shiftExcelFormulaRows(shiftMeta.formula, delta);
        const rawOut = evaluator.evalFormula(shiftedF, shiftMeta.sheetName, 0);
        const fmt = evaluator.formatOutput(rawOut, "", "");
        if (fmt !== "") {
          r[col.key] = fmt;
          rowFormulas[col.key] = `=${shiftedF}`;
        }
        return;
      }

      if (!looksExcelRefFormula) {
        const keyOut = evalKeyFormula(cleanF, r, {
          masterLoad: "masterValue",
          average: "mean",
          indicated: "mean",
          uuc: "mean",
        });
        const numOut = toNumOrNull(keyOut);
        if (numOut !== null) {
          const fmt = String(Number(numOut.toFixed(4)));
          r[col.key] = fmt;
          rowFormulas[col.key] = `=${cleanF}`;
        } else if (keyOut !== "") {
          r[col.key] = String(keyOut);
          rowFormulas[col.key] = `=${cleanF}`;
        }
      }
    });

    // Hydrate from corresponding Report sheet row if it holds a formula (e.g. Report Feeler Gauge E17 = B17 - D17)
    const matchingRepRow = reportTable?.rows?.[idx];
    if (matchingRepRow) {
      ["error", "indicated", "nominal", "masterValue", "measuredGap"].forEach((k) => {
        if ((r[k] === undefined || r[k] === "") && matchingRepRow[k] !== undefined && matchingRepRow[k] !== "") {
          r[k] = matchingRepRow[k];
        }
        if (matchingRepRow._formulas?.[k] && !rowFormulas[k]) {
          rowFormulas[k] = matchingRepRow._formulas[k];
        }
      });
    }

    // Collect trial readings if any
    const rTrials = ["reading1", "reading2", "reading3", "r1", "r2", "r3"]
      .map((k) => toNumOrNull(r[k]))
      .filter((n) => n !== null);
    const trialMean = rTrials.length > 0 ? rTrials.reduce((a, b) => a + b, 0) / rTrials.length : null;

    if (trialMean !== null && (r.average === undefined || r.average === "")) {
      r.average = String(Number(trialMean.toFixed(4)));
      if (!rowFormulas.average) rowFormulas.average = `=AVERAGE(${rTrials.join(", ")})`;
    }
    if (trialMean !== null && (r.indicated === undefined || r.indicated === "") && !r.measuredGap && !r.masterValue) {
      r.indicated = String(Number(trialMean.toFixed(4)));
    }

    // Determine nominal/tolerance target
    const tolSourceStr = r.gapSize || r.nominal || r.requirement || r.specification || "";
    const tolParsed = parseNominalTolerance(r.gapSize) || { target: null, tolerance: null };
    const nomTolParsed = parseNominalTolerance(tolSourceStr);
    const activeTol = tolParsed.tolerance !== null ? tolParsed : nomTolParsed;

    const nominalDisplay = String(
      r.nominal ?? r.gapSize ?? r.specification ?? r.description ?? r.standardValue ?? `Point ${idx + 1}`
    ).trim();
    const nominalNum = toNumOrNull(r.nominal) ?? activeTol.target ?? toNumOrNull(r.standardValue) ?? toNumOrNull(r.masterValue) ?? 0;
    const masterNum = toNumOrNull(r.masterValue ?? r.masterLoad ?? r.master ?? r.standardValue);
    const observedNum =
      toNumOrNull(r.measuredGap ?? r.indicated ?? r.average ?? r.mean ?? r.observed) ??
      trialMean ??
      masterNum ??
      nominalNum;

    // Formula error takes highest precedence, else fallback deviation calculation
    let formulaErrorNum = toNumOrNull(r.error ?? r.indError ?? r.deviation);
    if (formulaErrorNum === null && activeTol.target !== null && observedNum !== null && toNumOrNull(r.measuredGap ?? r.indicated ?? r.average ?? r.mean) !== null) {
      formulaErrorNum = observedNum - activeTol.target;
      if (!rowFormulas.error) rowFormulas.error = `Observed (${observedNum}) - Target (${activeTol.target})`;
    } else if (formulaErrorNum === null && masterNum !== null && nominalNum !== null && toNumOrNull(r.nominal) !== null && r.masterValue !== undefined) {
      formulaErrorNum = nominalNum - masterNum;
      if (!rowFormulas.error) rowFormulas.error = `Nominal (${nominalNum}) - Master (${masterNum})`;
    } else if (formulaErrorNum === null && masterNum !== null && observedNum !== null) {
      formulaErrorNum = observedNum - masterNum;
      if (!rowFormulas.error) rowFormulas.error = `Observed (${observedNum}) - Master (${masterNum})`;
    } else if (formulaErrorNum === null) {
      formulaErrorNum = 0;
    }

    const baseDenom = Math.abs(nominalNum || masterNum || 1);
    const percentError = isForce
      ? (masterNum ? (formulaErrorNum / masterNum) * 100 : 0)
      : (baseDenom ? (formulaErrorNum / baseDenom) * 100 : 0);

    let maxPermissible = null;
    if (activeTol.tolerance !== null) {
      maxPermissible = activeTol.tolerance;
    } else if (isForce) {
      maxPermissible = 1.0; // ±1.0% Class 1 IS 1828
    } else {
      const colTol = parseNominalTolerance(r.permissibleError ?? r.tolerance ?? r.limit);
      maxPermissible = colTol.tolerance ?? colTol.target ?? Math.max(leastCount * 2, 0.05);
    }

    const absErrToCheck = isForce ? Math.abs(percentError) : Math.abs(formulaErrorNum);
    const hasMeasurement =
      (r.measuredGap !== undefined && r.measuredGap !== "") ||
      (r.masterValue !== undefined && r.masterValue !== "") ||
      (r.indicated !== undefined && r.indicated !== "") ||
      (r.average !== undefined && r.average !== "") ||
      (r.mean !== undefined && r.mean !== "") ||
      rTrials.length > 0;

    const isWithinTol = !hasMeasurement ? true : absErrToCheck <= maxPermissible + 1e-9;
    if (hasMeasurement && !isWithinTol) hasAnyFail = true;
    if (hasMeasurement && Math.abs(formulaErrorNum) > maxAbsError) maxAbsError = Math.abs(formulaErrorNum);

    if (r.error === undefined || r.error === "") {
      r.error = Number(formulaErrorNum.toFixed(4)).toString();
    }
    if (!r.indicated && observedNum !== null && (r.average !== undefined || rTrials.length > 0)) {
      r.indicated = Number(observedNum.toFixed(4)).toString();
    }

    const firstFormula =
      rowFormulas.error ||
      rowFormulas.measuredGap ||
      rowFormulas.indicated ||
      rowFormulas.average ||
      Object.values(rowFormulas)[0] ||
      (activeTol.tolerance !== null
        ? `|Measured - ${activeTol.target}| ≤ ${activeTol.tolerance}`
        : isForce
        ? "((Observed - Master) / Master) × 100%"
        : "Observed - Nominal/Master");

    delete r._formulas;
    evaluatedReadings.push(r);

    calculatedRows.push({
      srNo: r.sNo || idx + 1,
      sNo: r.sNo || idx + 1,
      nominal: nominalDisplay,
      specification: r.specification || "",
      gapSize: r.gapSize || "",
      standard: masterNum !== null ? masterNum : nominalNum,
      masterValue: masterNum !== null ? masterNum : nominalNum,
      avgObserved: Number((observedNum ?? 0).toFixed(4)),
      mean: Number((observedNum ?? 0).toFixed(4)),
      indicated: Number((observedNum ?? 0).toFixed(4)),
      error: Number(formulaErrorNum.toFixed(4)),
      percentError: Number(percentError.toFixed(3)),
      maxPermissible: Number(Number(maxPermissible).toFixed(4)),
      tolerance: isForce ? `±${maxPermissible}%` : `±${maxPermissible}`,
      permissibleLabel: isForce ? `±${maxPermissible}%` : `±${maxPermissible}`,
      isWithinTol,
      appliedFormula: firstFormula,
      hasMeasurement,
      uncertainty: r.uncertainty || reportTable?.uncertaintyValue || (excelAmu?.expandedUncertainty ? Number(excelAmu.expandedUncertainty).toFixed(4) : ""),
    });
  });

  // 3. Calculate Live AMU (ISO 17025 Type A + Type B -> Expanded Uncertainty U)
  const rawRep =
    Array.isArray(obs.repeatabilityReadings) && obs.repeatabilityReadings.length > 0
      ? obs.repeatabilityReadings
      : String(obs.repeatabilityMu || template?.repeatabilityMu || "")
          .split(/[,\s]+/)
          .filter(Boolean);
  const parsedRep = rawRep.map((x) => parseFloat(x)).filter((n) => Number.isFinite(n));
  const repMean = parsedRep.length > 0 ? parsedRep.reduce((a, b) => a + b, 0) / parsedRep.length : 0;
  const repVariance =
    parsedRep.length > 1
      ? parsedRep.reduce((a, b) => a + Math.pow(b - repMean, 2), 0) / (parsedRep.length - 1)
      : 0;
  const repStdDev = Math.sqrt(repVariance);
  const uA = parsedRep.length > 0 ? repStdDev / Math.sqrt(parsedRep.length) : (excelAmu?.uA ?? template?.amuData?.typeA?.uA ?? 0);

  const uB_res = (leastCount / 2) / Math.sqrt(3);
  const masterUncRaw = parseFloat(template?.amuData?.typeB?.uB2 || 0) || 0;
  const uB_master = masterUncRaw > 0 ? masterUncRaw : (isForce ? 0.25 : uB_res * 1.2);
  const uB = excelAmu?.uB ?? Math.sqrt(uB_res * uB_res + uB_master * uB_master);
  const uC = excelAmu?.uC ?? Math.sqrt(uA * uA + uB * uB);
  const coverageFactor = excelAmu?.coverageFactor || 2.0;

  let expandedUncertainty = coverageFactor * uC;
  const repCertUnc = toNumOrNull(reportTable?.uncertaintyValue);
  if (excelAmu?.expandedUncertainty && excelAmu.expandedUncertainty > 0) {
    expandedUncertainty = excelAmu.expandedUncertainty;
  } else if (repCertUnc !== null && repCertUnc > 0) {
    expandedUncertainty = repCertUnc;
  }

  const amu = {
    sourceSheet: excelAmu?.sheetName || reportTable?.sheetName || template?.amuData?.sheetName || "",
    n: parsedRep.length || 5,
    readings: parsedRep,
    repeatabilityReadings: parsedRep,
    mean: Number(repMean.toFixed(4)),
    repMean: Number(repMean.toFixed(4)),
    repStdDev: Number(repStdDev.toFixed(5)),
    uA: Number(Number(uA).toFixed(5)),
    uB_res: Number(uB_res.toFixed(5)),
    uB_master: Number(uB_master.toFixed(5)),
    uB: Number(Number(uB).toFixed(5)),
    uc: Number(Number(uC).toFixed(5)),
    uC: Number(Number(uC).toFixed(5)),
    k: coverageFactor,
    expandedUncertainty: Number(Number(expandedUncertainty).toFixed(4)),
    expandedUncertaintyFormula:
      reportTable?.uncertaintyFormula ||
      excelAmu?.evaluatedItems?.[excelAmu.evaluatedItems.length - 1]?.formula ||
      "U = k × √(uA² + uB²)",
    evaluatedItems: excelAmu?.evaluatedItems || [],
  };

  // Backfill uncertainty onto calculatedRows & evaluatedReadings if blank
  const uncStr = amu.expandedUncertainty > 0 ? String(amu.expandedUncertainty) : "";
  if (uncStr) {
    calculatedRows.forEach((cr) => {
      if (!cr.uncertainty) cr.uncertainty = uncStr;
    });
    evaluatedReadings.forEach((er) => {
      if (er.uncertainty === undefined || er.uncertainty === "") {
        er.uncertainty = uncStr;
      }
    });
  }

  // Fallback reportTable from dynamic columns + evaluatedReadings if sheet lacked a Report grid
  const finalReportTable =
    reportTable && reportTable.rows && reportTable.rows.length > 0
      ? {
          ...reportTable,
          uncertaintyValue: reportTable.uncertaintyValue || uncStr,
          uncertaintyFormula: reportTable.uncertaintyFormula || amu.expandedUncertaintyFormula,
        }
      : {
          sheetName: obs.templateName || template?.name || "Calibration Results",
          columns:
            cols.length >= 2
              ? [
                  ...cols.map((c) => ({ key: c.key, label: c.label })),
                  ...(cols.some((c) => /error|deviation/i.test(c.key + c.label)) ? [] : [{ key: "error", label: "Error" }]),
                  ...(cols.some((c) => /uncertain/i.test(c.key + c.label)) ? [] : [{ key: "uncertainty", label: "± Expanded Uncertainty" }]),
                ]
              : [
                  { key: "nominal", label: "Nominal / Point" },
                  { key: "masterValue", label: "Master Reading" },
                  { key: "indicated", label: "Observed Mean" },
                  { key: "error", label: "Indication Error" },
                  { key: "uncertainty", label: "± Expanded Uncertainty" },
                ],
          rows: evaluatedReadings.map((er, i) => ({
            ...er,
            nominal: er.nominal || calculatedRows[i]?.nominal,
            masterValue: er.masterValue ?? calculatedRows[i]?.masterValue,
            indicated: er.indicated ?? calculatedRows[i]?.indicated,
            error: er.error ?? calculatedRows[i]?.error,
            uncertainty: er.uncertainty || uncStr,
            _formulas: {},
          })),
          uncertaintyValue: uncStr,
          uncertaintyFormula: amu.expandedUncertaintyFormula,
          source: "computed_dynamic_table",
        };

  return {
    rows: calculatedRows,
    calculatedRows,
    evaluatedReadings,
    reportTable: finalReportTable,
    amu,
    overallVerdict: hasAnyFail ? "FAIL" : "PASS",
    maxError: Number(maxAbsError.toFixed(5)),
    formulaCells,
    liveValues,
  };
};
