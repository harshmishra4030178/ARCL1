"use client";
import React, { useMemo, useState } from "react";
import { FaCalculator, FaFileExcel, FaFilePdf, FaPlus, FaTable, FaTrashAlt } from "react-icons/fa";
import { buildFormulaEvaluator } from "../../utils/exactFormulaEngine";

export default function ExactSheetRenderer({
  exactSheets = [],
  values = {},
  onCellChange,
  onAddExtraRow,
  onRemoveExtraRow,
  readOnly = false,
  pdfUrl = "",
  title = "",
  allowAddRows = false,
}) {
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);

  const sheets = useMemo(
    () => (Array.isArray(exactSheets) ? exactSheets.filter(Boolean) : []),
    [exactSheets]
  );

  const safeIdx = activeSheetIdx < sheets.length ? activeSheetIdx : 0;
  const activeSheet = sheets[safeIdx] || null;

  const evaluator = useMemo(
    () => buildFormulaEvaluator(sheets, values),
    [sheets, values]
  );

  if (!activeSheet) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        1:1 sheet grid not available for this template yet. Click <b>Re-Convert</b> on the template card to generate exact sheet layout.
      </div>
    );
  }

  const sheetName = activeSheet.sheetName || `Sheet ${safeIdx + 1}`;
  const extraRowsKey = `__extraRows__${sheetName}`;
  const extraRows = Array.isArray(values?.[extraRowsKey]) ? values[extraRowsKey] : [];

  const getCellDisplayValue = (cell) => {
    const key = `${sheetName}!${cell.ref}`;
    if (values && values[key] !== undefined) return values[key];
    return cell.value ?? "";
  };

  const handleInputChange = (cell, nextVal) => {
    if (!onCellChange || readOnly) return;
    const key = `${sheetName}!${cell.ref}`;
    onCellChange({
      cellKey: key,
      sheetName,
      ref: cell.ref,
      value: nextVal,
      obsKey: cell.obsKey,
      obsRowIdx: cell.obsRowIdx,
      isExtra: Boolean(cell.isExtra),
    });
  };

  const roleBadgeClass = (role) => {
    if (role === "observation") return "bg-emerald-500/20 text-emerald-200 border-emerald-400/40";
    if (role === "report") return "bg-blue-500/20 text-blue-200 border-blue-400/40";
    if (role === "amu") return "bg-amber-500/20 text-amber-200 border-amber-400/40";
    return "bg-slate-500/20 text-slate-200 border-slate-400/40";
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-lg overflow-hidden text-slate-900">
      {/* Top Sheet Switcher & Info Bar */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-[#021C57] to-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-teal-300">
            {activeSheet.kind === "pdf" ? <FaFilePdf className="text-rose-400" /> : <FaFileExcel className="text-emerald-400" />}
            <span>1:1 Exact {activeSheet.kind === "pdf" ? "PDF" : "Excel"} Worksheet</span>
          </span>
          {title && <span className="text-xs font-bold text-slate-200">• {title}</span>}
        </div>

        {/* Multi-sheet / Multi-page Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {sheets.map((sh, idx) => (
            <button
              key={`${sh.sheetName}-${idx}`}
              type="button"
              onClick={() => setActiveSheetIdx(idx)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                idx === safeIdx
                  ? "bg-teal-500 text-slate-950 border-teal-300 shadow-xs"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/15"
              }`}
            >
              {sh.role === "amu" ? (
                <FaCalculator className="text-[10px]" />
              ) : (
                <FaTable className="text-[10px]" />
              )}
              <span>{sh.sheetName}</span>
              <span className={`text-[9px] uppercase px-1.5 rounded border ${
                idx === safeIdx ? "bg-slate-950/15 border-slate-950/25 text-slate-950" : roleBadgeClass(sh.role)
              }`}>
                {sh.role === "observation" ? "OB" : sh.role === "amu" ? "AMU" : sh.role === "report" ? "REPORT" : "SHEET"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scanned PDF Fallback Notice & Live Viewer */}
      {activeSheet.isScanned && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 space-y-2">
          <div className="text-xs font-bold text-amber-900">
            This PDF page appears to be a scanned image. Showing original PDF page preview below:
          </div>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title={sheetName}
              className="w-full h-[540px] rounded-lg border border-slate-300 bg-white"
            />
          )}
        </div>
      )}

      {/* Sheet Blocks */}
      <div className="p-2.5 sm:p-4 bg-slate-100/70 space-y-2.5 overflow-x-auto">
        {(activeSheet.blocks || []).map((block, bIdx) => {
          if (block.kind === "line") {
            return (
              <div
                key={`ln-${bIdx}`}
                className="bg-white border border-slate-400 rounded px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                {(block.items || []).map((it, iIdx) => {
                  if (it.kind === "input") {
                    const key = `${sheetName}!${it.ref}`;
                    const val = values && values[key] !== undefined ? values[key] : (it.value ?? "");
                    return (
                      <input
                        key={iIdx}
                        type="text"
                        disabled={readOnly}
                        value={val}
                        placeholder={it.placeholder || "Enter value"}
                        onChange={(e) =>
                          onCellChange &&
                          onCellChange({
                            cellKey: key,
                            sheetName,
                            ref: it.ref,
                            value: e.target.value,
                          })
                        }
                        className="min-w-[140px] flex-1 max-w-xs px-2 py-1 text-xs font-mono border border-sky-300 rounded bg-sky-50/50 focus:bg-white focus:outline-none focus:border-teal-600 text-slate-900 disabled:bg-slate-50"
                      />
                    );
                  }
                  return (
                    <span
                      key={iIdx}
                      className={`${
                        it.kind === "title"
                          ? "font-black text-sm text-slate-950"
                          : it.kind === "section"
                          ? "font-extrabold text-slate-900"
                          : it.bold
                          ? "font-bold text-slate-900"
                          : "font-medium text-slate-800"
                      }`}
                    >
                      {it.value}
                    </span>
                  );
                })}
              </div>
            );
          }

          // GRID / TABLE BLOCK
          const colsMeta = block.colsMeta || [];
          const rows = block.rows || [];
          if (rows.length === 0) return null;

          // Inject any dynamically appended extra observation rows right after the last obs row
          let lastObsIdx = -1;
          rows.forEach((rw, idx) => {
            if (rw.isObsDataRow) lastObsIdx = idx;
          });

          const totalColsCount = colsMeta.length || 1;
          const totalWidth = colsMeta.reduce((sum, cm) => sum + (cm.wpx || 78), 0) || 800;

          const renderCellContent = (cell) => {
            if (cell.kind === "formula") {
              const evalRaw = evaluator.evalFormula(cell.formula, sheetName, 0);
              const formatted = evaluator.formatOutput(evalRaw, cell.numFormat, cell.value || "0");
              return (
                <div
                  className="px-1.5 py-1 font-mono font-bold text-indigo-950 bg-indigo-50/40 w-full h-full flex items-center justify-center text-[11px]"
                  title={`Formula: =${cell.formula}`}
                >
                  {formatted}
                </div>
              );
            }

            if (cell.kind === "input") {
              const val = getCellDisplayValue(cell);
              if (readOnly) {
                return (
                  <div className="px-1.5 py-1 font-mono text-slate-900 text-[11px] min-h-[22px]">
                    {val !== "" ? val : <span className="text-slate-300">-</span>}
                  </div>
                );
              }
              return (
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleInputChange(cell, e.target.value)}
                  placeholder={cell.placeholder || ""}
                  className={`w-full min-w-[44px] px-1.5 py-1 text-[11px] font-mono bg-sky-50/55 hover:bg-sky-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400/80 placeholder:text-[9.5px] ${
                    cell.align === "left" ? "text-left" : cell.align === "right" ? "text-right" : "text-center"
                  }`}
                />
              );
            }

            return (
              <div
                className={`px-1.5 py-1 whitespace-pre-line leading-snug ${
                  cell.align === "center" ? "text-center" : cell.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {cell.value}
              </div>
            );
          };

          const rowElements = [];
          rows.forEach((rw, rArrIdx) => {
            const isSpacerRow = rw.cells.length === 0 || (rw.hpx <= 12 && rw.cells.every((c) => !c.value && c.kind !== "input"));
            rowElements.push(
              <tr
                key={`r-${rw.r}-${rArrIdx}`}
                style={isSpacerRow ? { height: "8px" } : undefined}
                className={isSpacerRow ? "bg-slate-50/30" : ""}
              >
                {rw.cells.length === 0 ? (
                  <td colSpan={totalColsCount} className="border-x border-slate-300 h-2" />
                ) : (
                  rw.cells.map((cell, cIdx) => {
                    const hasAnyValue = Boolean(cell.value || cell.formula || cell.kind === "input");
                    let bgClass = "bg-white";
                    if (cell.kind === "title") bgClass = "bg-slate-100 font-black text-xs sm:text-sm text-slate-950";
                    else if (cell.kind === "section") bgClass = "bg-slate-200/75 font-extrabold text-[11.5px] text-slate-950";
                    else if (cell.kind === "header") bgClass = "bg-slate-100/90 font-bold text-[11px] text-slate-950";
                    else if (cell.bold) bgClass = "bg-white font-bold text-slate-900";

                    return (
                      <td
                        key={`${cell.ref}-${cIdx}`}
                        rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                        colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                        className={`p-0 align-middle border ${
                          hasAnyValue ? "border-slate-700" : "border-slate-300"
                        } ${bgClass}`}
                      >
                        {renderCellContent(cell)}
                      </td>
                    );
                  })
                )}
              </tr>
            );

            // Render dynamically added extra observation rows right after the observation data block
            if (rArrIdx === lastObsIdx && extraRows.length > 0 && activeSheet.obsTableMeta?.colSpans) {
              const colSpans = activeSheet.obsTableMeta.colSpans;
              extraRows.forEach((exRow, exIdx) => {
                const exCells = [];
                let cursorC = 0;
                colSpans.forEach((sp, spIdx) => {
                  if (sp.cStart > cursorC) {
                    exCells.push(
                      <td key={`pad-${spIdx}`} colSpan={sp.cStart - cursorC} className="border border-slate-700 bg-slate-50" />
                    );
                  }
                  const spanW = sp.cEnd - sp.cStart + 1;
                  const cellRef = `EXTRA_${exIdx}_${sp.key}`;
                  const cellObj = {
                    ref: cellRef,
                    kind: sp.key.startsWith("sNo") ? "input" : "input",
                    align: "center",
                    placeholder: sp.label,
                    obsKey: sp.key,
                    obsRowIdx: (lastObsIdx - (activeSheet.obsTableMeta.dataStartRow || 0)) + 1 + exIdx,
                    isExtra: true,
                  };
                  exCells.push(
                    <td key={cellRef} colSpan={spanW > 1 ? spanW : undefined} className="p-0 border border-slate-700 bg-white">
                      {renderCellContent(cellObj)}
                    </td>
                  );
                  cursorC = sp.cEnd + 1;
                });
                if (cursorC < totalColsCount) {
                  exCells.push(
                    <td key="tail-pad" colSpan={totalColsCount - cursorC} className="border border-slate-700 bg-slate-50 text-center">
                      {!readOnly && onRemoveExtraRow && (
                        <button
                          type="button"
                          onClick={() => onRemoveExtraRow(sheetName, exIdx)}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="Remove added row"
                        >
                          <FaTrashAlt className="text-[10px]" />
                        </button>
                      )}
                    </td>
                  );
                }
                rowElements.push(<tr key={`ex-${exIdx}`}>{exCells}</tr>);
              });
            }
          });

          return (
            <div key={`tbl-${bIdx}`} className="bg-white shadow-sm rounded-lg border border-slate-800 overflow-x-auto">
              <table
                className="w-full border-collapse text-[11px] bg-white"
                style={{ minWidth: `${Math.min(Math.max(totalWidth, 640), 1150)}px` }}
              >
                {colsMeta.length > 0 && (
                  <colgroup>
                    {colsMeta.map((cm, idx) => (
                      <col key={idx} style={{ width: `${((cm.wpx || 78) / totalWidth) * 100}%` }} />
                    ))}
                  </colgroup>
                )}
                <tbody>{rowElements}</tbody>
              </table>

              {allowAddRows && !readOnly && onAddExtraRow && lastObsIdx >= 0 && activeSheet.obsTableMeta?.colSpans?.length > 0 && (
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-300 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">
                    Need extra calibration points?
                  </span>
                  <div className="flex items-center gap-2">
                    {extraRows.length > 0 && onRemoveExtraRow && (
                      <button
                        type="button"
                        onClick={() => onRemoveExtraRow(sheetName, extraRows.length - 1)}
                        className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] cursor-pointer"
                      >
                        Remove Last Extra Row
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAddExtraRow(sheetName)}
                      className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <FaPlus className="text-[9px]" /> Add Test Row
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
