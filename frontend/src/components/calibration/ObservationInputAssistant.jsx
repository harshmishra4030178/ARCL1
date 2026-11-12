"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCamera,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFileAlt,
  FaKeyboard,
  FaLock,
  FaMagic,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperclip,
  FaPrint,
  FaSync,
  FaTimes,
  FaUndo,
  FaUpload,
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../api/axios.js";
import {
  directHardwareScanObservationApi,
  getHardwareScannersApi,
  parseFilledObservationApi,
} from "../../api/calibrationApi.js";
import useVoiceInput from "../../hooks/useVoiceInput.js";
import {
  findFirstEmptyCellCursor,
  getEmptyCellSlotsForward,
  getFillableObservationColumns,
  isObservationCellEmpty,
  parseRawOcrTextForObservation,
  parseSpokenObservationCommand,
} from "../../utils/observationInputParser.js";

/**
 * Unified multi-mode observation entry assistant for Section 6 (Draft / Unlocked only):
 * 1. Manual Typing (standard worksheet / 1:1 Excel sheet)
 * 2. Direct Hardware Scanner (Windows WIA) + Live Camera Scan + File Upload -> Format-Matched Pen-Only Auto-Fill
 * 3. Hands-Free Voice Dictation (strictly fills ONLY unfilled/empty cells — fixed data stays untouched)
 */
export default function ObservationInputAssistant({
  activeRecord,
  activeTemplate,
  tableColumns = [],
  readings = [],
  repeatabilityReadings = [],
  exactSheetValues = {},
  onApplyExtractedData,
  onUpdateScannedCell,
  onUpdateScannedRepeatability,
  onVoiceFillCell,
  onVoiceRevertCell,
  onVoiceUpdateMeta,
  onVoiceAddRow,
  hardCopyScan = null,
  inputMode: controlledInputMode,
  onInputModeChange,
}) {
  const [internalInputMode, setInternalInputMode] = useState("manual"); // "manual" | "scan" | "voice"
  const inputMode = controlledInputMode !== undefined ? controlledInputMode : internalInputMode;
  const setInputMode = (next) => {
    const val = typeof next === "function" ? next(inputMode) : next;
    setInternalInputMode(val);
    onInputModeChange?.(val);
  };

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [editableOcrText, setEditableOcrText] = useState("");
  const [hwScanners, setHwScanners] = useState([]);
  const [selectedScannerId, setSelectedScannerId] = useState("");
  const [scannerStatusMsg, setScannerStatusMsg] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [cursorRowIdx, setCursorRowIdx] = useState(0);
  const [cursorColIdx, setCursorColIdx] = useState(0);
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [voiceUndoStack, setVoiceUndoStack] = useState([]);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const fillableCols = useMemo(
    () => getFillableObservationColumns(tableColumns),
    [tableColumns]
  );

  // Build map of cells locked/fixed by 1:1 Excel template (non-input cells or pre-fixed values)
  const lockedCellMap = useMemo(() => {
    const map = new Set();
    const sheets = Array.isArray(activeTemplate?.exactSheets) ? activeTemplate.exactSheets : [];
    sheets.forEach((sh, shIdx) => {
      const sName = sh.sheetName || `Sheet ${shIdx + 1}`;
      const blockRows = Array.isArray(sh.blocks)
        ? sh.blocks.flatMap((b) => (Array.isArray(b?.rows) ? b.rows : []))
        : [];
      blockRows.forEach((rw) => {
        (rw?.cells || []).forEach((cell) => {
          if (!cell?.obsKey || typeof cell.obsRowIdx !== "number") return;
          const cellVal = exactSheetValues?.[`${sName}!${cell.ref}`] ?? cell.value ?? "";
          if (cell.kind !== "input" || String(cellVal).trim() !== "") {
            map.add(`${cell.obsRowIdx}:${cell.obsKey}`);
          }
        });
      });
    });
    return map;
  }, [activeTemplate?.exactSheets, exactSheetValues]);

  const emptySlotsTotal = useMemo(
    () => getEmptyCellSlotsForward(readings, tableColumns, 0, 0, lockedCellMap),
    [readings, tableColumns, lockedCellMap]
  );

  useEffect(() => {
    const currentCol = fillableCols[cursorColIdx];
    const currentStillEmpty =
      currentCol &&
      isObservationCellEmpty(readings, cursorRowIdx, currentCol.key, lockedCellMap);

    if (!currentStillEmpty) {
      const next = findFirstEmptyCellCursor(readings, tableColumns, cursorRowIdx, cursorColIdx, lockedCellMap);
      if (next.rowIdx !== cursorRowIdx) setCursorRowIdx(next.rowIdx);
      if (next.colIdx !== cursorColIdx) setCursorColIdx(next.colIdx);
    }
  }, [readings, tableColumns, fillableCols, cursorRowIdx, cursorColIdx, lockedCellMap]);

  const stopLiveCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  useEffect(() => () => stopLiveCamera(), [stopLiveCamera]);

  // Load connected WIA hardware scanners when Scan mode opens
  const refreshHardwareScanners = useCallback(async () => {
    try {
      setScannerStatusMsg("Checking connected scanners...");
      const res = await getHardwareScannersApi();
      const d = res?.data?.data;
      const list = Array.isArray(d?.scanners) ? d.scanners : [];
      setHwScanners(list);
      if (list.length > 0) {
        setSelectedScannerId((prev) => prev || list[0].id);
      }
      setScannerStatusMsg(
        list.length > 0
          ? `${list.length} scanner ready: ${list.map((s) => s.name).join(", ")}`
          : d?.message || "No USB/Wi-Fi WIA scanner detected yet (connect scanner or use Live Camera Scan / Upload)."
      );
    } catch {
      setScannerStatusMsg("Scanner probe unavailable — use Live Camera Scan or Choose File.");
    }
  }, []);

  useEffect(() => {
    if (inputMode === "scan") {
      refreshHardwareScanners();
    } else {
      stopLiveCamera();
    }
  }, [inputMode, refreshHardwareScanners, stopLiveCamera]);

  const latestRef = useRef({});
  latestRef.current = {
    readings,
    tableColumns,
    cursorRowIdx,
    cursorColIdx,
    lockedCellMap,
    voiceUndoStack,
  };

  const resolveAttachmentUrl = (rawUrl) => {
    if (!rawUrl) return "";
    if (/^(https?:|blob:|data:)/i.test(rawUrl)) return rawUrl;
    const apiBase = (API?.defaults?.baseURL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
    const backendRoot = apiBase.replace(/\/api\/v1$/, "");
    return `${backendRoot}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  };

  const pushVoiceLog = (msg, ok = true) => {
    setVoiceHistory((prev) => [{ id: Date.now() + Math.random(), msg, ok }, ...(prev || [])].slice(0, 5));
  };

  const handleUndoLastVoice = () => {
    const stack = latestRef.current.voiceUndoStack || [];
    if (stack.length === 0) {
      toast.info("Nothing to undo — fixed/pre-filled cells are protected.");
      return;
    }
    const lastBatch = stack[0];
    lastBatch.cells.forEach((cell) => {
      onVoiceRevertCell?.(cell.rowIdx, cell.colKey);
    });
    setCursorRowIdx(lastBatch.cells[0].rowIdx);
    setCursorColIdx(lastBatch.cells[0].colIdx);
    setVoiceUndoStack((prev) => prev.slice(1));
    pushVoiceLog(`Reverted ${lastBatch.cells.length} voice cell(s)`, true);
  };

  const handleVoiceTranscript = (spokenText) => {
    const state = latestRef.current;
    const cmd = parseSpokenObservationCommand(spokenText, {
      columns: state.tableColumns,
      readings: state.readings,
      activeRowIdx: state.cursorRowIdx,
      activeColIdx: state.cursorColIdx,
      lockedCellMap: state.lockedCellMap,
    });

    if (cmd.type === "noop") return;

    if (cmd.type === "undo") {
      handleUndoLastVoice();
      return;
    }

    if (cmd.type === "add_row") {
      const newIdx = Array.isArray(state.readings) ? state.readings.length : 0;
      onVoiceAddRow?.();
      setCursorRowIdx(newIdx);
      setCursorColIdx(0);
      pushVoiceLog(`Added blank Row ${newIdx + 1}`);
      return;
    }

    if (cmd.type === "all_filled") {
      toast.info(cmd.message);
      pushVoiceLog(cmd.message, false);
      return;
    }

    if (cmd.type === "move") {
      setCursorRowIdx(cmd.nextRowIdx);
      setCursorColIdx(cmd.nextColIdx);
      pushVoiceLog(cmd.message);
      return;
    }

    if (cmd.type === "metadata") {
      const updateSummary = onVoiceUpdateMeta?.(cmd.metadata, cmd.repeatabilityReadings);
      const label = updateSummary?.appliedCount > 0
        ? `Updated ${updateSummary.appliedCount} empty parameter(s)`
        : "Already fixed/filled — no existing fields changed";
      pushVoiceLog(`"${spokenText}" -> ${label}`, updateSummary?.appliedCount > 0);
      return;
    }

    if (cmd.type === "cells" && Array.isArray(cmd.cells)) {
      const appliedCells = [];
      cmd.cells.forEach((cell) => {
        const applied = onVoiceFillCell?.(cell.rowIdx, cell.colKey, cell.value);
        if (applied !== false) appliedCells.push(cell);
      });
      if (appliedCells.length > 0) {
        setVoiceUndoStack((prev) => [{ cells: appliedCells }, ...(prev || [])].slice(0, 15));
      }
      setCursorRowIdx(cmd.nextRowIdx);
      setCursorColIdx(cmd.nextColIdx);
      pushVoiceLog(`"${spokenText}" -> ${cmd.message}`);
      return;
    }

    pushVoiceLog(`Not recognized as numbers/command: "${spokenText}"`, false);
  };

  const obsVoice = useVoiceInput({
    lang: voiceLang,
    continuous: true,
    interimResults: true,
    onFinal: handleVoiceTranscript,
    onError: (err) => {
      const msg = err?.error === "not-allowed"
        ? "Mic permission blocked — allow microphone access in browser settings."
        : "Speech recognition stopped or unavailable.";
      toast.warn(msg);
    },
  });

  const applyBackendScanPayload = (payload, labelPrefix = "Scanned") => {
    if (!payload) return;
    setScanResult(payload);
    setEditableOcrText(payload.rawText || "");
    const summary = onApplyExtractedData?.(payload.extracted, {
      hardCopyFile: payload.hardCopyFile,
      engine: payload.engine,
    });
    const repPart = summary?.repAppliedCount ? ` + ${summary.repAppliedCount} Repeatability box(es)` : "";
    toast.success(
      `${labelPrefix} (${payload.engine})! Filled ${summary?.rowsApplied || 0} table row(s)${repPart} into Soft Copy without touching fixed data.`
    );
  };

  const handleScanUpload = async (file) => {
    if (!file) return;
    try {
      setIsScanning(true);
      setInputMode("scan");
      const fd = new FormData();
      fd.append("file", file);
      if (activeRecord?._id) fd.append("recordId", activeRecord._id);
      if (activeTemplate?._id) fd.append("templateId", activeTemplate._id);
      fd.append("tableColumns", JSON.stringify(tableColumns || []));
      fd.append("currentReadings", JSON.stringify(readings || []));
      fd.append("currentExactSheetValues", JSON.stringify(exactSheetValues || {}));
      fd.append("currentRepeatabilityReadings", JSON.stringify(repeatabilityReadings || []));

      const res = await parseFilledObservationApi(fd);
      applyBackendScanPayload(res?.data?.data, "Scanned");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to scan uploaded observation sheet.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDirectHardwareScan = async () => {
    try {
      setIsScanning(true);
      setInputMode("scan");
      setScannerStatusMsg("Scanning from physical scanner... Matching Soft Copy vs Scanned Sheet...");
      const res = await directHardwareScanObservationApi({
        recordId: activeRecord?._id,
        templateId: activeTemplate?._id,
        tableColumns,
        currentReadings: readings || [],
        currentExactSheetValues: exactSheetValues || {},
        currentRepeatabilityReadings: repeatabilityReadings || [],
        deviceId: selectedScannerId || "",
        dpi: 200,
      });
      const payload = res?.data?.data;
      if (payload) {
        setScannerStatusMsg(`Scanned cleanly from: ${payload.scannerName || "Scanner"}`);
        applyBackendScanPayload(payload, `Scanned from ${payload.scannerName || "Scanner"}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Hardware scanner not responding or not connected.";
      setScannerStatusMsg(msg);
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenLiveCamera = async () => {
    setCameraError("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Browser live camera access unavailable. Use Choose File or Hardware Scanner button.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch (err) {
      setCameraError(err?.message || "Camera permission denied or no camera found.");
    }
  };

  const handleCaptureCameraFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.warn("Camera stream is still warming up — try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        stopLiveCamera();
        if (!blob) return;
        const capturedFile = new File([blob], `camera_scan_${Date.now()}.png`, { type: "image/png" });
        handleScanUpload(capturedFile);
      },
      "image/png",
      0.95
    );
  };

  const handleReParseEditedText = () => {
    if (!editableOcrText.trim()) {
      toast.warn("OCR text box is empty.");
      return;
    }
    const parsed = parseRawOcrTextForObservation(editableOcrText, tableColumns);
    const summary = onApplyExtractedData?.(parsed, {
      engine: "Manual OCR Text Re-Parse",
    });
    toast.success(`Applied ${summary?.rowsApplied || 0} unfilled row(s) safely into soft copy Draft.`);
  };

  const activeProof = scanResult?.hardCopyFile || hardCopyScan;
  const activeProofUrl = resolveAttachmentUrl(activeProof?.url || activeProof?.cloudUrl);
  const safeRowIdx = Math.min(cursorRowIdx, Math.max(0, (readings?.length || 1) - 1));
  const activeTargetCol = fillableCols[cursorColIdx] || fillableCols[0];
  const cellPreviews = Array.isArray(scanResult?.cellPreviews) ? scanResult.cellPreviews : [];
  const repPreviews = Array.isArray(scanResult?.repeatabilityPreviews) ? scanResult.repeatabilityPreviews : [];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3 min-w-0">
      {/* Mode Switcher Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            Observation Entry Mode:
          </span>
          <button
            type="button"
            onClick={() => {
              if (obsVoice.isListening) obsVoice.stopListening();
              setInputMode("manual");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer border ${
              inputMode === "manual"
                ? "bg-[#021C57] text-white border-[#021C57] shadow-xs"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            <FaKeyboard /> Type Manually
          </button>

          <button
            type="button"
            onClick={() => {
              if (obsVoice.isListening) obsVoice.stopListening();
              setInputMode((m) => (m === "scan" ? "manual" : "scan"));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer border ${
              inputMode === "scan"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-indigo-800 border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <FaPrint /> Direct Scan / Upload Hard Copy
          </button>

          <button
            type="button"
            onClick={() => setInputMode((m) => (m === "voice" ? "manual" : "voice"))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer border ${
              inputMode === "voice" || obsVoice.isListening
                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                : "bg-white text-teal-800 border-teal-300 hover:bg-teal-50"
            }`}
          >
            <FaMicrophone className={obsVoice.isListening ? "animate-pulse" : ""} />
            {obsVoice.isListening ? "Voice Listening..." : "Bol Ke Bharein (Voice)"}
          </button>
        </div>

        {/* Attached Hard-Copy Proof Chip */}
        {activeProof?.url && (
          <a
            href={activeProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition self-start xl:self-auto max-w-full"
            title="View attached filled hard-copy proof"
          >
            <FaPaperclip className="shrink-0" />
            <span className="truncate max-w-[200px]">Scan: {activeProof.fileName || "Attached"}</span>
            <FaExternalLinkAlt className="text-[9px] shrink-0" />
          </a>
        )}
      </div>

      {/* Mode 2: Direct Hardware Scanner + Live Camera + File Upload Auto-Fill */}
      {inputMode === "scan" && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-3.5 sm:p-4 space-y-3.5 animate-fadeIn min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                  <FaMagic className="text-indigo-600 shrink-0" />
                  Direct Scanner / Live Camera / Sheet Upload → Pen-Only Soft-Copy Auto-Fill
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                  <FaLock className="text-[9px]" /> Fixed Columns Protected
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Same format ko pen se bhar ke scan karne par fixed/printed values unchanged rehti hain aur <b>sirf pen se likhi khali values</b> soft copy me fill hoti hain.
              </p>
              {scannerStatusMsg && (
                <p className="text-[10.5px] text-indigo-700 font-semibold mt-1 break-words">
                  🖨️ {scannerStatusMsg}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hwScanners.length > 1 && (
                <select
                  value={selectedScannerId}
                  onChange={(e) => setSelectedScannerId(e.target.value)}
                  className="px-2.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 max-w-[180px]"
                >
                  {hwScanners.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleDirectHardwareScan}
                disabled={isScanning}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition disabled:opacity-50"
                title="Acquire scan directly from connected Windows USB/Wi-Fi flatbed scanner"
              >
                {isScanning ? <FaSync className="animate-spin" /> : <FaPrint />}
                {isScanning ? "Scanning..." : "Scan from Scanner"}
              </button>

              <button
                type="button"
                onClick={isCameraOpen ? stopLiveCamera : handleOpenLiveCamera}
                disabled={isScanning}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                {isCameraOpen ? <FaTimes /> : <FaCamera />}
                {isCameraOpen ? "Close Camera" : "Live Camera Scan"}
              </button>

              <label className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition">
                <FaUpload /> Choose Scan / PDF / Excel
                <input
                  type="file"
                  accept="image/*,.pdf,.xlsx,.xls,.csv"
                  className="hidden"
                  disabled={isScanning}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleScanUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={refreshHardwareScanners}
                disabled={isScanning}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs cursor-pointer transition"
                title="Refresh connected scanners list"
              >
                <FaSync className={isScanning ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {cameraError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-3 py-2 text-xs">
              {cameraError}
            </div>
          )}

          {/* Live Browser Camera Viewfinder */}
          {isCameraOpen && (
            <div className="bg-slate-950 rounded-2xl p-3 space-y-2.5 border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-72 object-contain rounded-xl bg-black"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-slate-300">
                  Hard-copy sheet ko clear light me camera ke saamne rakhein aur Capture dabayein.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureCameraFrame}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FaCamera /> Capture &amp; Auto-Fill
                  </button>
                </div>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="space-y-3 pt-2 border-t border-slate-200 min-w-0">
              {/* Format Match Status Strip */}
              {scanResult.formatMatch && (
                <div className={`px-3 py-2 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                  scanResult.formatMatch.matched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-amber-50 border-amber-300 text-amber-950"
                }`}>
                  <div className="flex items-center gap-2 flex-wrap font-bold">
                    <FaCheckCircle className={scanResult.formatMatch.matched ? "text-emerald-600" : "text-amber-600"} />
                    <span>
                      {scanResult.formatMatch.matched ? "Format Matched" : "Partial Format Match"}
                      {scanResult.formatMatch.formatNo ? ` (${scanResult.formatMatch.formatNo})` : ""}
                    </span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-current/20">
                      {scanResult.formatMatch.matchedRows || 0} Fixed Rows Aligned
                    </span>
                  </div>
                  {(scanResult.formatMatch.fixedColumnsProtected || []).length > 0 && (
                    <span className="text-[11px] font-semibold">
                      Protected Fixed Cols: <b>{scanResult.formatMatch.fixedColumnsProtected.join(", ")}</b>
                    </span>
                  )}
                </div>
              )}

              {/* Warnings */}
              {Array.isArray(scanResult.warnings) && scanResult.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-3 py-2 text-[11px] flex items-start gap-2">
                  <FaExclamationTriangle className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    {scanResult.warnings.map((w, idx) => (
                      <div key={idx}>{w}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pen-Cell Zoomed Crops Verification Grid (Verify handwritten pen strokes directly next to soft copy box!) */}
              {(cellPreviews.length > 0 || repPreviews.length > 0) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      ✍️ Pen-Written Cells — Zoomed Verification &amp; Quick Edit
                    </span>
                    <span className="text-[10.5px] text-slate-600 font-medium">
                      Check pen scan image vs filled soft-copy box (live synced with worksheet below)
                    </span>
                  </div>

                  {cellPreviews.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {cellPreviews.map((cp, pIdx) => {
                        const liveVal = readings?.[cp.rowIdx]?.[cp.colKey] ?? "";
                        const isFilled = String(liveVal).trim() !== "";
                        return (
                          <div
                            key={`${cp.rowIdx}-${cp.colKey}-${pIdx}`}
                            className={`p-2 rounded-xl border bg-white flex items-center justify-between gap-2 min-w-0 ${
                              isFilled ? "border-emerald-300" : "border-amber-300"
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 truncate" title={`${cp.rowLabel} → ${cp.colLabel}`}>
                                <span className="truncate">#{cp.rowIdx + 1} • {cp.rowLabel}</span>
                                {!isFilled && cp.needsReview && (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-black shrink-0">
                                    Check crop
                                  </span>
                                )}
                              </div>
                              {cp.cropDataUrl && (
                                <img
                                  src={cp.cropDataUrl}
                                  alt={`Pen crop Row ${cp.rowIdx + 1}`}
                                  className="h-9 max-w-full object-contain rounded border border-slate-200 bg-white px-1"
                                />
                              )}
                            </div>
                            <input
                              type="text"
                              value={liveVal}
                              onChange={(e) => onUpdateScannedCell?.(cp.rowIdx, cp.colKey, e.target.value)}
                              placeholder="Type"
                              className={`w-20 shrink-0 px-2 py-1.5 text-center font-mono font-black text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                                isFilled
                                  ? "border-emerald-400 bg-emerald-50/40 text-emerald-950 focus:ring-emerald-400"
                                  : "border-amber-400 bg-amber-50/60 text-slate-900 focus:ring-amber-400"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {repPreviews.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700">For Repeatability MU (Pen Boxes R1–R5):</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {repPreviews.map((rp) => {
                          const liveRep = repeatabilityReadings?.[rp.idx] ?? "";
                          const isFilled = String(liveRep).trim() !== "";
                          return (
                            <div
                              key={rp.idx}
                              className={`p-2 rounded-xl border bg-white space-y-1 ${
                                isFilled ? "border-emerald-300" : "border-amber-300"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-black text-slate-600">
                                <span>{rp.label}</span>
                                {!isFilled && rp.needsReview && (
                                  <span className="px-1 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                                    Check
                                  </span>
                                )}
                              </div>
                              {rp.cropDataUrl && (
                                <img
                                  src={rp.cropDataUrl}
                                  alt={`Repeatability ${rp.label}`}
                                  className="h-9 w-full object-contain rounded border border-slate-200 bg-white"
                                />
                              )}
                              <input
                                type="text"
                                value={liveRep}
                                onChange={(e) => onUpdateScannedRepeatability?.(rp.idx, e.target.value)}
                                placeholder={rp.label}
                                className={`w-full px-1.5 py-1 text-center font-mono font-black text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                                  isFilled
                                    ? "border-emerald-400 bg-emerald-50/40 text-emerald-950 focus:ring-emerald-400"
                                    : "border-amber-400 bg-amber-50/60 text-slate-900 focus:ring-amber-400"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Scan Image Preview & Raw OCR Text Box */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-w-0">
                <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-700">
                    <span className="truncate">{scanResult.engine}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] whitespace-nowrap">
                      {cellPreviews.filter((c) => String(c.extractedValue || "").trim() !== "").length || (scanResult.extracted?.readings?.length || 0)} Auto-Read
                    </span>
                  </div>
                  {activeProof?.mimeType?.startsWith("image/") && activeProofUrl ? (
                    <img
                      src={activeProofUrl}
                      alt="Uploaded hard-copy observation sheet"
                      className="w-full max-h-52 object-contain rounded-lg border border-slate-200 bg-white"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                      <FaFileAlt className="text-indigo-600 text-lg shrink-0" />
                      <span className="truncate font-semibold">{activeProof?.fileName || "Uploaded Document"}</span>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-8 flex flex-col gap-2 min-w-0">
                  <label className="text-[11px] font-bold text-slate-700">
                    Detected OCR / Document Text (optional manual re-parse):
                  </label>
                  <textarea
                    rows={3}
                    value={editableOcrText}
                    onChange={(e) => setEditableOcrText(e.target.value)}
                    placeholder="Detected text appears here."
                    className="w-full px-2.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                      <FaCheckCircle /> Existing fixed data preserved • verify below before Submit &amp; Lock.
                    </span>
                    <button
                      type="button"
                      onClick={handleReParseEditedText}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      ↺ Re-Parse Text → Fill Empty Boxes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Voice Dictation Panel (Empty-Only Protected) */}
      {inputMode === "voice" && (
        <div className="bg-white border-2 border-teal-300 rounded-2xl p-3.5 sm:p-4 space-y-3 animate-fadeIn min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black text-teal-950 flex items-center gap-1.5">
                  <FaMicrophone className="text-teal-600 shrink-0" />
                  Bol Ke Bharein — Empty Cells Only
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                  <FaLock className="text-[9px]" /> Fixed / Filled Data Safe
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Jo data pehle se fixed ya filled hai vo <b>change nahi hoga</b> — voice sirf khali boxes me bharega (e.g. <b>&quot;33 27 21&quot;</b>, <b>&quot;Undo&quot;</b>, <b>&quot;New row&quot;</b>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value)}
                disabled={obsVoice.isListening}
                className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="en-IN">English / Hinglish (en-IN)</option>
                <option value="hi-IN">Hindi (hi-IN)</option>
              </select>

              {voiceUndoStack.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoLastVoice}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  title="Revert only the last voice-entered values"
                >
                  <FaUndo className="text-[10px]" /> Undo Last
                </button>
              )}

              <button
                type="button"
                onClick={() => obsVoice.toggleListening({ lang: voiceLang, continuous: true })}
                disabled={!obsVoice.isSupported}
                className={`px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition ${
                  obsVoice.isListening
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : "bg-teal-600 hover:bg-teal-700 text-white"
                } disabled:opacity-50`}
              >
                {obsVoice.isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                {obsVoice.isListening ? "Stop Mic" : "Start Speaking"}
              </button>
            </div>
          </div>

          {!obsVoice.isSupported && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-3 py-2 text-xs">
              Voice Recognition sirf Chrome / Edge browser me supported hai.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 bg-teal-50/70 border border-teal-200 rounded-xl p-2.5 text-xs">
            <span className="font-black text-teal-950">Next Empty Box:</span>
            <label className="inline-flex items-center gap-1 font-bold text-slate-700">
              Row:
              <select
                value={safeRowIdx}
                onChange={(e) => {
                  const nextR = Number(e.target.value);
                  const found = findFirstEmptyCellCursor(readings, tableColumns, nextR, 0, lockedCellMap);
                  setCursorRowIdx(found.rowIdx);
                  setCursorColIdx(found.colIdx);
                }}
                className="px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-mono font-bold"
              >
                {Array.from({ length: Math.max(1, readings?.length || 1) }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    Row {idx + 1}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-1 font-bold text-slate-700">
              Column:
              <select
                value={cursorColIdx}
                onChange={(e) => setCursorColIdx(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-bold max-w-[230px]"
              >
                {fillableCols.map((col, idx) => {
                  const isEmpty = isObservationCellEmpty(readings, safeRowIdx, col.key, lockedCellMap);
                  return (
                    <option key={col.key || idx} value={idx} disabled={!isEmpty}>
                      {col.label || col.key} {isEmpty ? "" : "(Fixed / Filled)"}
                    </option>
                  );
                })}
              </select>
            </label>

            <span className="text-[11px] font-semibold text-teal-900">
              {emptySlotsTotal.length > 0 && activeTargetCol && isObservationCellEmpty(readings, safeRowIdx, activeTargetCol.key, lockedCellMap)
                ? <>→ Will fill <b>Row {safeRowIdx + 1} ({activeTargetCol.label || activeTargetCol.key})</b> • {emptySlotsTotal.length} empty cells left</>
                : <span className="text-amber-800 font-bold">All cells in existing rows are filled/fixed — say &quot;New row&quot; to add more.</span>}
            </span>
          </div>

          {(obsVoice.statusText || obsVoice.transcript || voiceHistory.length > 0) && (
            <div className="space-y-1.5 text-xs">
              {(obsVoice.statusText || obsVoice.transcript) && (
                <div className="bg-slate-900 text-teal-200 font-mono px-3 py-2 rounded-xl text-[11px] flex items-center justify-between gap-2">
                  <span className="truncate">{obsVoice.statusText || obsVoice.transcript}</span>
                </div>
              )}
              {voiceHistory.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {voiceHistory.map((item) => (
                    <span
                      key={item.id}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        item.ok
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {item.msg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
