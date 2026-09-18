"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FaCertificate,
  FaFilePdf,
  FaFileExcel,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaFilter,
  FaPlus,
  FaDownload,
  FaPaperPlane,
  FaCalculator,
  FaTools,
  FaSlidersH,
  FaCheck,
  FaTimes,
  FaSync,
  FaBuilding,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaQrcode,
  FaShareAlt,
  FaChevronDown,
  FaChevronRight,
  FaPrint,
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaTrash,
  FaEllipsisV,
  FaExclamationTriangle,
  FaShieldAlt,
  FaWhatsapp,
  FaBolt,
  FaInfoCircle,
  FaBell,
  FaCopy,
  FaUpload,
  FaCheckSquare,
  FaUsers,
} from "react-icons/fa";
import API from "../../api/axios.js";
import {
  getAdminCalibrationRecords,
  getAdminCalibrationStats,
  createCalibrationRecordApi,
  updateCalibrationRecordApi,
  updateCalibrationBatchApi,
  deleteCalibrationRecordApi,
  clearAllCalibrationRecordsApi,
  sendCalibrationReminderApi,
  autoDispatchAllDueRemindersApi,
  sendCertificateDeliveryApi,
  sendSpecificDocumentApi,
  getAutoReminderStatusApi,
  triggerAutoReminderScanApi,
  toggleAutoReminderApi,
  getQuotationApi,
  saveQuotationApi,
  getTaxInvoiceApi,
  saveTaxInvoiceApi,
  getProformaApi,
  saveProformaApi,
  getNablLabScopeApi,
  updateNablLabScopeApi,
  addNablScopeItemApi,
  updateNablScopeItemApi,
  deleteNablScopeItemApi,
  resetNablLabScopeApi,
  uploadPoApi,
  deletePoApi,
} from "../../api/calibrationApi.js";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/useAuthStore.js";
import { hasModuleAccess, isSuperAdmin } from "../../utils/rbac.js";

// Safe Date formatting helper utilities to avoid any RangeError / runtime exception
const toSafeIsoDate = (d, fallback = "") => {
  if (!d) return fallback;
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return fallback;
    return parsed.toISOString().slice(0, 10);
  } catch (e) {
    return fallback;
  }
};

const toSafeLocaleDate = (d, fallback = "-", locale = "en-GB", options) => {
  if (!d) return fallback;
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return fallback;
    return parsed.toLocaleDateString(locale, options);
  } catch (e) {
    return fallback;
  }
};

// ==========================================
// SCIENTIFIC & ENGINEERING CALCULATORS COMPONENT
// ==========================================
function ScientificCalculators() {
  const [activeCategory, setActiveCategory] = useState("pressure");
  const [activeCalc, setActiveCalc] = useState("psi_bar");

  // Calculator States
  const [psiVal, setPsiVal] = useState("100");
  const [barVal, setBarVal] = useState("6.89476");

  const [psiKgVal, setPsiKgVal] = useState("100");
  const [kgCm2Val, setKgCm2Val] = useState("7.0307");

  const [celsiusVal, setCelsiusVal] = useState("25");
  const [fahrenheitVal, setFahrenheitVal] = useState("77");

  const [mACurrent, setMACurrent] = useState("12");
  const [rangeMin, setRangeMin] = useState("0");
  const [rangeMax, setRangeMax] = useState("10");

  // Weight Calc States
  const [pipeOD, setPipeOD] = useState("114.3"); // mm
  const [pipeWT, setPipeWT] = useState("6.02"); // mm
  const [pipeLength, setPipeLength] = useState("6"); // m

  const [plateL, setPlateL] = useState("2000"); // mm
  const [plateW, setPlateW] = useState("1000"); // mm
  const [plateT, setPlateT] = useState("10"); // mm

  const [tankRadius, setTankRadius] = useState("1.5"); // m
  const [tankHeight, setTankHeight] = useState("3.0"); // m

  // Power & Flow States
  const [hpVal, setHpVal] = useState("10");
  const [kwVal, setKwVal] = useState("7.457");

  const [nmVal, setNmVal] = useState("100");
  const [ftlbVal, setFtlbVal] = useState("73.756");

  const [lpmVal, setLpmVal] = useState("100");
  const [gpmVal, setGpmVal] = useState("26.417");

  const [kgVal, setKgVal] = useState("50");
  const [lbVal, setLbVal] = useState("110.231");

  const [mmVal, setMmVal] = useState("25.4");
  const [inchVal, setInchVal] = useState("1");

  // Handler functions for instant calculations
  const handlePsiChange = (val) => {
    setPsiVal(val);
    const num = parseFloat(val);
    setBarVal(isNaN(num) ? "" : (num * 0.0689476).toFixed(4));
  };
  const handleBarChange = (val) => {
    setBarVal(val);
    const num = parseFloat(val);
    setPsiVal(isNaN(num) ? "" : (num * 14.5038).toFixed(2));
  };

  const handleCelsiusChange = (val) => {
    setCelsiusVal(val);
    const num = parseFloat(val);
    setFahrenheitVal(isNaN(num) ? "" : ((num * 9) / 5 + 32).toFixed(2));
  };
  const handleFahrenheitChange = (val) => {
    setFahrenheitVal(val);
    const num = parseFloat(val);
    setCelsiusVal(isNaN(num) ? "" : (((num - 32) * 5) / 9).toFixed(2));
  };

  // 4-20mA Output
  const calcPercentage = useMemo(() => {
    const ma = parseFloat(mACurrent);
    if (isNaN(ma) || ma < 4) return 0;
    if (ma > 20) return 100;
    return (((ma - 4) / 16) * 100).toFixed(1);
  }, [mACurrent]);

  const calcProcessVal = useMemo(() => {
    const ma = parseFloat(mACurrent);
    const min = parseFloat(rangeMin) || 0;
    const max = parseFloat(rangeMax) || 100;
    if (isNaN(ma)) return min;
    const clamped = Math.max(4, Math.min(20, ma));
    const factor = (clamped - 4) / 16;
    return (min + factor * (max - min)).toFixed(3);
  }, [mACurrent, rangeMin, rangeMax]);

  // Pipe Weight: (OD - WT) * WT * 0.0246615 * Length
  const pipeWeightTotal = useMemo(() => {
    const od = parseFloat(pipeOD);
    const wt = parseFloat(pipeWT);
    const len = parseFloat(pipeLength);
    if (isNaN(od) || isNaN(wt) || isNaN(len) || od <= wt) return 0;
    return ((od - wt) * wt * 0.0246615 * len).toFixed(2);
  }, [pipeOD, pipeWT, pipeLength]);

  // Steel Plate Weight: L(m) * W(m) * T(mm) * 7.85
  const plateWeightTotal = useMemo(() => {
    const l = parseFloat(plateL) / 1000;
    const w = parseFloat(plateW) / 1000;
    const t = parseFloat(plateT);
    if (isNaN(l) || isNaN(w) || isNaN(t)) return 0;
    return (l * w * t * 7.85).toFixed(2);
  }, [plateL, plateW, plateT]);

  // Tank Volume: pi * r^2 * h
  const tankVolumeTotal = useMemo(() => {
    const r = parseFloat(tankRadius);
    const h = parseFloat(tankHeight);
    if (isNaN(r) || isNaN(h)) return { m3: 0, liters: 0 };
    const m3 = Math.PI * r * r * h;
    return {
      m3: m3.toFixed(3),
      liters: (m3 * 1000).toFixed(0),
    };
  }, [tankRadius, tankHeight]);

  return (
    <div className="bg-[#111827] text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
            <FaCalculator />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Scientific Calculators</h3>
            <p className="text-[10px] text-slate-400 font-mono">QA & Calibration Lab Utilities</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2 text-xs">
        {/* Category Selector */}
        <div className="flex gap-1 border-b border-slate-800 pb-2">
          <button
            onClick={() => {
              setActiveCategory("pressure");
              setActiveCalc("psi_bar");
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              activeCategory === "pressure"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Pressure & Units
          </button>
          <button
            onClick={() => {
              setActiveCategory("weight");
              setActiveCalc("pipe_wt");
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              activeCategory === "weight"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Weights & Tanks ⭐
          </button>
          <button
            onClick={() => {
              setActiveCategory("power");
              setActiveCalc("hp_kw");
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              activeCategory === "power"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Power & Flow
          </button>
        </div>

        {/* 1. PRESSURE & UNITS */}
        {activeCategory === "pressure" && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCalc("psi_bar")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeCalc === "psi_bar" ? "bg-slate-700 text-blue-300 font-bold" : "text-slate-400"
                }`}
              >
                PSI ↔ Bar
              </button>
              <button
                onClick={() => setActiveCalc("c_f")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeCalc === "c_f" ? "bg-slate-700 text-blue-300 font-bold" : "text-slate-400"
                }`}
              >
                Celsius ↔ °F
              </button>
              <button
                onClick={() => setActiveCalc("4_20ma")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeCalc === "4_20ma" ? "bg-slate-700 text-emerald-300 font-bold" : "text-slate-400"
                }`}
              >
                4-20 mA Loop
              </button>
            </div>

            {activeCalc === "psi_bar" && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300">PSI to Bar Converter</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">PSI (Pound/sq.in)</label>
                    <input
                      type="number"
                      value={psiVal}
                      onChange={(e) => handlePsiChange(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Bar</label>
                    <input
                      type="number"
                      value={barVal}
                      onChange={(e) => handleBarChange(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-blue-400 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-mono">1 Bar = 14.5038 PSI | 1 PSI = 0.0689476 Bar</p>
              </div>
            )}

            {activeCalc === "c_f" && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300">Temperature Converter</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Celsius (°C)</label>
                    <input
                      type="number"
                      value={celsiusVal}
                      onChange={(e) => handleCelsiusChange(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Fahrenheit (°F)</label>
                    <input
                      type="number"
                      value={fahrenheitVal}
                      onChange={(e) => handleFahrenheitChange(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-amber-400 font-mono text-xs font-bold"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-mono">°F = (°C × 9/5) + 32</p>
              </div>
            )}

            {activeCalc === "4_20ma" && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300">4-20 mA Transmitter Loop Calculator</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">Input mA (4-20)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={mACurrent}
                      onChange={(e) => setMACurrent(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Range Min</label>
                    <input
                      type="number"
                      value={rangeMin}
                      onChange={(e) => setRangeMin(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Range Max</label>
                    <input
                      type="number"
                      value={rangeMax}
                      onChange={(e) => setRangeMax(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="p-2 bg-slate-800/80 rounded border border-slate-700 flex justify-between items-center text-[11px]">
                  <span>
                    Loop Signal: <strong className="text-emerald-400 font-mono">{calcPercentage}%</strong>
                  </span>
                  <span>
                    Process Value: <strong className="text-blue-400 font-mono">{calcProcessVal} Units</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. WEIGHTS & TANKS */}
        {activeCategory === "weight" && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCalc("pipe_wt")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeCalc === "pipe_wt" ? "bg-slate-700 text-amber-300 font-bold" : "text-slate-400"
                }`}
              >
                Pipe Weight
              </button>
              <button
                onClick={() => setActiveCalc("steel_wt")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeCalc === "steel_wt" ? "bg-slate-700 text-amber-300 font-bold" : "text-slate-400"
                }`}
              >
                Steel Plate Weight
              </button>
              <button
                onClick={() => setActiveCalc("tank_vol")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeCalc === "tank_vol" ? "bg-slate-700 text-amber-300 font-bold" : "text-slate-400"
                }`}
              >
                Tank Volume
              </button>
            </div>

            {activeCalc === "pipe_wt" && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300">Steel Pipe Weight Calculator</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">Outer Dia (mm)</label>
                    <input
                      type="number"
                      value={pipeOD}
                      onChange={(e) => setPipeOD(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Wall Thk (mm)</label>
                    <input
                      type="number"
                      value={pipeWT}
                      onChange={(e) => setPipeWT(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Length (m)</label>
                    <input
                      type="number"
                      value={pipeLength}
                      onChange={(e) => setPipeLength(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="p-2 bg-amber-950/40 rounded border border-amber-600/40 flex justify-between items-center text-[11px]">
                  <span className="text-amber-300">Calculated Pipe Weight:</span>
                  <strong className="text-white font-mono text-sm">{pipeWeightTotal} kg</strong>
                </div>
              </div>
            )}

            {activeCalc === "steel_wt" && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300">Steel Plate Weight Calculator</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">Length (mm)</label>
                    <input
                      type="number"
                      value={plateL}
                      onChange={(e) => setPlateL(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Width (mm)</label>
                    <input
                      type="number"
                      value={plateW}
                      onChange={(e) => setPlateW(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Thk (mm)</label>
                    <input
                      type="number"
                      value={plateT}
                      onChange={(e) => setPlateT(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="p-2 bg-amber-950/40 rounded border border-amber-600/40 flex justify-between items-center text-[11px]">
                  <span className="text-amber-300">Plate Total Weight:</span>
                  <strong className="text-white font-mono text-sm">{plateWeightTotal} kg</strong>
                </div>
              </div>
            )}

            {activeCalc === "tank_vol" && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300">Cylindrical Tank Volume</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400">Radius (m)</label>
                    <input
                      type="number"
                      value={tankRadius}
                      onChange={(e) => setTankRadius(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Height (m)</label>
                    <input
                      type="number"
                      value={tankHeight}
                      onChange={(e) => setTankHeight(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="p-2 bg-amber-950/40 rounded border border-amber-600/40 flex justify-between items-center text-[11px]">
                  <span className="text-amber-300">Volume:</span>
                  <strong className="text-white font-mono text-xs">
                    {tankVolumeTotal.m3} m³ ({tankVolumeTotal.liters} L)
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. POWER & FLOW */}
        {activeCategory === "power" && (
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-300 mb-1">HP ↔ kW Power Converter</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={hpVal}
                    placeholder="HP"
                    onChange={(e) => {
                      setHpVal(e.target.value);
                      const n = parseFloat(e.target.value);
                      setKwVal(isNaN(n) ? "" : (n * 0.7457).toFixed(3));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                  />
                  <input
                    type="number"
                    value={kwVal}
                    placeholder="kW"
                    onChange={(e) => {
                      setKwVal(e.target.value);
                      const n = parseFloat(e.target.value);
                      setHpVal(isNaN(n) ? "" : (n * 1.34102).toFixed(3));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-purple-400 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-300 mb-1">mm ↔ Inches Dimensional Converter</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={mmVal}
                    placeholder="mm"
                    onChange={(e) => {
                      setMmVal(e.target.value);
                      const n = parseFloat(e.target.value);
                      setInchVal(isNaN(n) ? "" : (n / 25.4).toFixed(4));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs"
                  />
                  <input
                    type="number"
                    value={inchVal}
                    placeholder="Inches"
                    onChange={(e) => {
                      setInchVal(e.target.value);
                      const n = parseFloat(e.target.value);
                      setMmVal(isNaN(n) ? "" : (n * 25.4).toFixed(2));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded p-1.5 text-emerald-400 font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// DEFAULT VERIFIED CLIENT CALIBRATION RECORDS
// ==========================================
const defaultInitialCalibrationRecords = [];

export const defaultStandard37Items = [
  { itemNo: 1, name: "Rebound Hammer - Calibration", subText: "Non-NABL Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 2, name: "Rebar Scanner - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 3, name: "Le-Chatelier Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 200, qty: 6, qtyUnit: "NOS", amount: 1200 },
  { itemNo: 4, name: "Brass Test Sieve- Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 20, qtyUnit: "NOS", amount: 6000 },
  { itemNo: 5, name: "GI Test Sieve - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 10, qtyUnit: "NOS", amount: 3000 },
  { itemNo: 6, name: "ACT Machine - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 7, name: "Crushing Value - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 8, name: "Cube Mould 70.6mm - Calibration", subText: "50mm-6, 70.6mm-6\nNABL Thirdparty Report", hsnSac: "998346", rate: 200, qty: 12, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 9, name: "Bulk Density Cylinder - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 3, qtyUnit: "NOS", amount: 300 },
  { itemNo: 10, name: "Dial Gauge 25mm - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 11, name: "Weigh Balance 600g - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 12, name: "weighing Balance (5kg)-Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 13, name: "Weigh Balance (upto 100kg) - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 900, qty: 1, qtyUnit: "NOS", amount: 900 },
  { itemNo: 14, name: "Compression Testing Machine 2000kN - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 4500, qty: 1, qtyUnit: "NOS", amount: 4500 },
  { itemNo: 15, name: "Stop Watch - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 16, name: "Humidity Chamber - Calibration", subText: "NABL Thirdparty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 17, name: "Hygrometer - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 18, name: "Vernier Caliper - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 19, name: "Buoyancy Balance - Calibration", subText: "NABL Third Party Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 20, name: "Weigh Balance 30kg - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 21, name: "Elongation Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 22, name: "Flakiness Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 23, name: "Impact Value - Calibration", subText: "Nabl Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 24, name: "Measuring Cylinder - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 6, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 25, name: "Measuring Tape - Calibration", subText: "Nabl Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 26, name: "Pycnometer - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 1, qtyUnit: "NOS", amount: 400 },
  { itemNo: 27, name: "Hot Air Oven - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 28, name: "Vicat Apparatus - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 29, name: "Mortar Vibrating Machine - Calibration", subText: "Nabl ThirdParty Report(rpm)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 30, name: "Water Bath - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 31, name: "Core Cutter Dolly - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 32, name: "Sand Pouring Cylinder - Calibration", subText: "NABL Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 33, name: "Liquid Limit - Calibration", subText: "Non-NABL Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 34, name: "Plastic Limit - Calibration", subText: "Non-NABL Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 35, name: "Proctor Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 2, qtyUnit: "NOS", amount: 800 },
  { itemNo: 36, name: "Flow Table - Calibration", subText: "Nabl Traceable Report", hsnSac: "998346", rate: 100, qty: 1, qtyUnit: "NOS", amount: 100 },
  { itemNo: 37, name: "Mortar Mixer - Calibration", subText: "NABL Thirdparty Report(RPM)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
];

export const defaultTaxInvoice26Items = [
  { itemNo: 1, name: "Le-Chatelier Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 6, qtyUnit: "NOS", rate: 200, per: "NOS", amount: 1200 },
  { itemNo: 2, name: "Brass Test Sieve- Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 20, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 6000 },
  { itemNo: 3, name: "GI Test Sieve - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 10, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 3000 },
  { itemNo: 4, name: "ACT Machine - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 5, name: "Cube Mould 70.6mm - Calibration", subText: "50mm-6, 70.6mm-6\nNABL Thirdparty Report", hsnSac: "998346", taxRate: "18%", qty: 12, qtyUnit: "NOS", rate: 200, per: "NOS", amount: 2400 },
  { itemNo: 6, name: "Dial Gauge 25mm - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 7, name: "Weigh Balance 600g - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 8, name: "weighing Balance (5kg)-Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 9, name: "Weigh Balance (upto 100kg) - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 900, per: "NOS", amount: 900 },
  { itemNo: 10, name: "Compression Testing Machine 2000kN - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 5000, per: "NOS", amount: 5000 },
  { itemNo: 11, name: "Stop Watch - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 950, per: "NOS", amount: 950 },
  { itemNo: 12, name: "Humidity Chamber - Calibration", subText: "NABL Thirdparty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 950, per: "NOS", amount: 950 },
  { itemNo: 13, name: "Hygrometer - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 14, name: "Vernier Caliper - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 15, name: "Buoyancy Balance - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 16, name: "Weigh Balance 30kg - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 17, name: "Elongation Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 18, name: "Flakiness Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 19, name: "Measuring Cylinder - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 6, qtyUnit: "NOS", rate: 400, per: "NOS", amount: 2400 },
  { itemNo: 20, name: "Measuring Tape - Calibration", subText: "Nabl Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 300, per: "NOS", amount: 300 },
  { itemNo: 21, name: "Pycnometer - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 400, per: "NOS", amount: 400 },
  { itemNo: 22, name: "Hot Air Oven - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 23, name: "Mortar Vibrating Machine - Calibration", subText: "Nabl ThirdParty Report(rpm)", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
  { itemNo: 24, name: "Water Bath - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 500, per: "NOS", amount: 500 },
  { itemNo: 25, name: "Proctor Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", taxRate: "18%", qty: 2, qtyUnit: "NOS", rate: 400, per: "NOS", amount: 800 },
  { itemNo: 26, name: "Mortar Mixer - Calibration", subText: "NABL Thirdparty Report(RPM)", hsnSac: "998346", taxRate: "18%", qty: 1, qtyUnit: "NOS", rate: 700, per: "NOS", amount: 700 },
];

export const defaultProforma26Items = [
  { itemNo: 1, name: "Le-Chatelier Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 200, qty: 6, qtyUnit: "NOS", amount: 1200 },
  { itemNo: 2, name: "Brass Test Sieve- Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 20, qtyUnit: "NOS", amount: 6000 },
  { itemNo: 3, name: "GI Test Sieve - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 10, qtyUnit: "NOS", amount: 3000 },
  { itemNo: 4, name: "ACT Machine - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 5, name: "Cube Mould 70.6mm - Calibration", subText: "50mm-6, 70.6mm-6\nNABL Thirdparty Report", hsnSac: "998346", rate: 200, qty: 12, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 6, name: "Dial Gauge 25mm - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 7, name: "Weigh Balance 600g - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 8, name: "weighing Balance (5kg)-Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 9, name: "Weigh Balance (upto 100kg) - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 900, qty: 1, qtyUnit: "NOS", amount: 900 },
  { itemNo: 10, name: "Compression Testing Machine 2000kN - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 5000, qty: 1, qtyUnit: "NOS", amount: 5000 },
  { itemNo: 11, name: "Stop Watch - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 12, name: "Humidity Chamber - Calibration", subText: "NABL Thirdparty Report", hsnSac: "998346", rate: 950, qty: 1, qtyUnit: "NOS", amount: 950 },
  { itemNo: 13, name: "Hygrometer - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 14, name: "Vernier Caliper - Calibration", subText: "", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 15, name: "Buoyancy Balance - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 16, name: "Weigh Balance 30kg - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 17, name: "Elongation Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 18, name: "Flakiness Gauge - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 19, name: "Measuring Cylinder - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 6, qtyUnit: "NOS", amount: 2400 },
  { itemNo: 20, name: "Measuring Tape - Calibration", subText: "Nabl Report", hsnSac: "998346", rate: 300, qty: 1, qtyUnit: "NOS", amount: 300 },
  { itemNo: 21, name: "Pycnometer - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 1, qtyUnit: "NOS", amount: 400 },
  { itemNo: 22, name: "Hot Air Oven - Calibration", subText: "Nabl ThirdParty Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 23, name: "Mortar Vibrating Machine - Calibration", subText: "Nabl ThirdParty Report(rpm)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
  { itemNo: 24, name: "Water Bath - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 500, qty: 1, qtyUnit: "NOS", amount: 500 },
  { itemNo: 25, name: "Proctor Mould - Calibration", subText: "NABL Third party Report", hsnSac: "998346", rate: 400, qty: 2, qtyUnit: "NOS", amount: 800 },
  { itemNo: 26, name: "Mortar Mixer - Calibration", subText: "NABL Thirdparty Report(RPM)", hsnSac: "998346", rate: 700, qty: 1, qtyUnit: "NOS", amount: 700 },
];

export const defaultArclNablScope = [
  {
    discipline: "Mechanical & Force",
    parameter: "Compression Testing Machine (CTM)",
    range: "0 to 2000 kN / 3000 kN",
    cmc: "± 0.50%",
    masterStandard: "Class 0.5 Master Load Cell & Proving Ring",
    standardMethod: "IS 14858 / ISO 7500-1 / ASTM C39",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Mechanical & Force",
    parameter: "Universal Testing Machine (UTM)",
    range: "0 to 1000 kN",
    cmc: "± 0.50%",
    masterStandard: "Class 0.5 Master Load Cell",
    standardMethod: "IS 1828 / ISO 7500-1",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Mechanical & Force",
    parameter: "CBR Testing Machine & Marshall Apparatus",
    range: "0 to 50 kN / 100 kN",
    cmc: "± 0.50%",
    masterStandard: "Proving Ring Class 1 (NPL Traceable)",
    standardMethod: "IS 2720 (Part 16) / ASTM D6927",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Dimensional",
    parameter: "Vernier Caliper / Digital Caliper",
    range: "0 to 300 mm / 600 mm",
    cmc: "± 0.010 mm",
    masterStandard: "Grade 0 Slip Gauge Set & Caliper Checker",
    standardMethod: "IS 3651 / JIS B7507",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Dimensional",
    parameter: "Outside Micrometer & Depth Gauge",
    range: "0 to 150 mm",
    cmc: "± 0.002 mm",
    masterStandard: "Grade 0 Slip Gauges",
    standardMethod: "IS 2967 / ISO 3611",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Dimensional",
    parameter: "Dial Gauge (Plunger & Lever Type)",
    range: "0 to 25 mm / 50 mm",
    cmc: "± 0.003 mm",
    masterStandard: "Dial Calibration Tester with Grade 0 Blocks",
    standardMethod: "IS 2092 / DIN 878",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Dimensional",
    parameter: "Standard Test Sieves (Brass / GI Mesh)",
    range: "20 µm to 125 mm",
    cmc: "± 4.5 µm",
    masterStandard: "Optical Profile Projector / Video Measuring System",
    standardMethod: "IS 460 (Part 1, 2, 3) / ISO 3310-1",
    traceability: "NPL, New Delhi",
    facility: "Permanent Lab Only",
    active: true,
  },
  {
    discipline: "Dimensional",
    parameter: "Cube, Beam & Cylindrical Moulds",
    range: "50mm, 70.6mm, 150mm, 100x100x500mm",
    cmc: "± 0.020 mm",
    masterStandard: "Precision Vernier & Digital Height Master",
    standardMethod: "IS 10086 / IS 516 / BS 1881",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Thermal & Environmental",
    parameter: "Hot Air Oven & Laboratory Drying Oven",
    range: "Ambient to 300 °C",
    cmc: "± 0.8 °C",
    masterStandard: "9-Point Pt-100 Standard RTD Data Acquisition System",
    standardMethod: "IS 962 / ASTM E145 / DKD-R 5-7",
    traceability: "ERTL (West) / NPL",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Thermal & Environmental",
    parameter: "Humidity Chamber & Accelerated Curing Tank",
    range: "20 °C to 65 °C, 30% to 98% RH",
    cmc: "± 0.5 °C, ± 1.5% RH",
    masterStandard: "Master Multi-Channel Hygro-Thermometer Standard",
    standardMethod: "IS 962 / ASTM C511",
    traceability: "ERTL (West) / NPL",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Thermal & Environmental",
    parameter: "Water Bath & Le-Chatelier Water Bath",
    range: "Ambient to 100 °C",
    cmc: "± 0.4 °C",
    masterStandard: "High-Precision Master RTD Probe",
    standardMethod: "IS 516 / IS 4031 / DKD-R 5-7",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Mass & Volume",
    parameter: "Precision Analytical Electronic Weigh Balance",
    range: "0 to 600 g (Resolution: 0.1 mg / 1 mg)",
    cmc: "± 0.2 mg",
    masterStandard: "E2 Class Standard Weight Set (OIML Compliant)",
    standardMethod: "IS 9281 (Part 1, 2) / OIML R76 / EURAMET cg-18",
    traceability: "RRSL / NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Mass & Volume",
    parameter: "High Capacity Platform Weighing Scale",
    range: "0 to 30 kg / 100 kg / 300 kg",
    cmc: "± 0.5 g",
    masterStandard: "F1 / M1 Class Cast Iron Standard Weights",
    standardMethod: "IS 9281 / OIML R76",
    traceability: "RRSL / NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Mass & Volume",
    parameter: "Volumetric Glassware (Cylinders, Pycnometers)",
    range: "10 ml to 2000 ml",
    cmc: "± 0.05 ml",
    masterStandard: "Gravimetric Method using E2 Standard Weights & Pure Water",
    standardMethod: "ISO 4787 / IS 878",
    traceability: "NPL, New Delhi",
    facility: "Permanent Lab Only",
    active: true,
  },
  {
    discipline: "Pressure & Vacuum",
    parameter: "Hydraulic Pressure Gauge & Transducers",
    range: "0 to 700 bar (0 to 10000 psi)",
    cmc: "± 0.25% FS",
    masterStandard: "Digital Dead Weight Tester / Master Digital Test Gauge",
    standardMethod: "IS 3624 / EN 837-1 / DKD-R 6-1",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
  {
    discipline: "Speed & Time",
    parameter: "Stop Watch & Digital Timer / RPM Indicator",
    range: "0 to 24 Hours / 0 to 10000 RPM",
    cmc: "± 0.10 sec / ± 1.0 RPM",
    masterStandard: "Master Non-Contact Optical Tachometer & GPS Clock Standard",
    standardMethod: "IS 13876 / NIST SP 960-12",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  },
];

// ==========================================
// MAIN CALIBRATION PAGE VIEW
// ==========================================
export default function CalibrationPageView() {
  const { user } = useAuthStore();
  const canCreate = hasModuleAccess(user, "calibration", "create");
  const canEdit = hasModuleAccess(user, "calibration", "edit");
  const canDelete = hasModuleAccess(user, "calibration", "delete");

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("arcl_calibration_active_tab");
        if (saved && ["dashboard", "srf_history", "reminders", "lab_profile"].includes(saved)) {
          return saved;
        }
      } catch (e) {}
    }
    return "dashboard";
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("arcl_calibration_active_tab", tab);
      } catch (e) {}
    }
  };
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [autoSync, setAutoSync] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedReminderClient, setSelectedReminderClient] = useState("");
  const [selectedReminderRecord, setSelectedReminderRecord] = useState(null);
  const [customReminderEmail, setCustomReminderEmail] = useState("");
  const [customReminderPhone, setCustomReminderPhone] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  const [isSendDocModalOpen, setIsSendDocModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationRecordId, setQuotationRecordId] = useState(null);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const [expandedBatchKeys, setExpandedBatchKeys] = useState(new Set());
  const [isPoPreviewModalOpen, setIsPoPreviewModalOpen] = useState(false);
  const [poPreviewData, setPoPreviewData] = useState({
    url: "",
    directUrl: "",
    fileName: "",
    record: null,
    fileType: "pdf",
  });

  // Delete Management & Multi-Select Cleanup Modal States
  const [isDeleteManagerOpen, setIsDeleteManagerOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState({
    databaseRecords: true,
    customCandidates: true,
    dispatchLogs: true,
    localCache: true,
  });
  const [deleteCompanyFilterMode, setDeleteCompanyFilterMode] = useState("all"); // 'all' or 'selected'
  const [selectedDeleteCompanies, setSelectedDeleteCompanies] = useState([]);
  const [deleteStageFilterMode, setDeleteStageFilterMode] = useState("all"); // 'all' or 'selected'
  const [selectedDeleteStages, setSelectedDeleteStages] = useState([]);
  const [isDeletingScope, setIsDeletingScope] = useState(false);

  // Automated Background Scheduler States
  const [autoReminderStatus, setAutoReminderStatus] = useState(null);
  const [autoReminderTriggering, setAutoReminderTriggering] = useState(false);

  // Dynamic NABL Lab Scope & Real-Time Profile States
  const [labScopeData, setLabScopeData] = useState(null);
  const [labScopeStats, setLabScopeStats] = useState(null);
  const [labScopeLoading, setLabScopeLoading] = useState(false);
  const [labScopeSaving, setLabScopeSaving] = useState(false);
  const [labScopeFilterDiscipline, setLabScopeFilterDiscipline] = useState("all");
  const [labScopeSearch, setLabScopeSearch] = useState("");
  const [isEditLabProfileOpen, setIsEditLabProfileOpen] = useState(false);
  const [isAddScopeModalOpen, setIsAddScopeModalOpen] = useState(false);
  const [isEditScopeModalOpen, setIsEditScopeModalOpen] = useState(false);
  const [editingScopeItemId, setEditingScopeItemId] = useState(null);

  const defaultScopeItemForm = {
    discipline: "Mechanical & Force",
    parameter: "",
    range: "",
    cmc: "",
    masterStandard: "",
    standardMethod: "",
    traceability: "NPL, New Delhi",
    facility: "On-Site & Permanent Lab",
    active: true,
  };

  const [scopeItemForm, setScopeItemForm] = useState(defaultScopeItemForm);

  const [labProfileForm, setLabProfileForm] = useState({
    labName: "ARCL Instruments Pvt. Ltd.",
    labCode: "ARCL-LAB-01",
    accreditationStandard: "ISO/IEC 17025:2017",
    certificateNo: "CC-4313",
    validUntil: "2026-07-28",
    status: "Active",
    masterTraceability: "National Physical Laboratory (NPL), New Delhi & ERTL",
    referralCode: "ARCL-LAB-01",
    referralRate: 30,
    annualSubscriptionRate: 11000,
  });

  // Dynamic Recipients Directory States
  const [directorySearchTerm, setDirectorySearchTerm] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState("all"); // 'all', 'due', 'uptodate', 'custom'
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState([]);
  const [selectedAuditLogIds, setSelectedAuditLogIds] = useState([]);
  const [expandedRecipId, setExpandedRecipId] = useState(null);
  const [isEditCandidateModalOpen, setIsEditCandidateModalOpen] = useState(false);
  const [editCandidateForm, setEditCandidateForm] = useState({
    id: "",
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    instrumentName: "",
    serialNo: "",
    dueDate: "",
    isCustom: false,
    rawCandidate: null,
    rawRecord: null,
  });

  // Tax Invoice Visual Editor States
  const [isTaxInvoiceModalOpen, setIsTaxInvoiceModalOpen] = useState(false);
  const [taxInvoiceRecordId, setTaxInvoiceRecordId] = useState(null);
  const [taxInvoiceSaving, setTaxInvoiceSaving] = useState(false);
  const [taxInvoiceForm, setTaxInvoiceForm] = useState({
    invoiceNo: "ARCL/26-27/74",
    invoiceDate: "22 Jun 2026",
    dueDate: "23 Jun 2026",
    placeOfSupply: "27-MAHARASHTRA",
    clientCompany: "RDSS QUALITY CONTROL LAB PRIVATE LIMITED",
    clientGstin: "27AAOCR3275P1ZH",
    clientAddress: "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath\nThane, MAHARASHTRA, 421503",
    items: defaultTaxInvoice26Items,
  });

  // Proforma Invoice (PI) Visual Editor States
  const [isProformaInvoiceModalOpen, setIsProformaInvoiceModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poRecordId, setPoRecordId] = useState(null);
  const [poSaving, setPoSaving] = useState(false);
  const [poForm, setPoForm] = useState({
    poNo: "012425000572",
    poDate: "12-Apr-2024",
    paymentTerm: "30 Days",
    contactPerson: "Quality Manager",
    buyerCompany: "RDC CONCRETE (INDIA) PVT LTD",
    buyerAddress: "Gomes Industrial Estate, Lathiya Rubber Factory road, Off Andheri Kurla Road, Opp Maharaja Hotel, Sakinaka, Mumbai - 400072",
    buyerGstin: "27AAACU0108Q1Z8",
    buyerPan: "AAACU0108Q",
    buyerCin: "U74999MH1993PLC172842",
    supplierCompany: "ARCL INSTRUMENTS PRIVATE LIMITED",
    supplierAddr: "Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708",
    supplierGst: "27ABDCA3876F1ZL",
    items: [
      { slNo: "1", itemCode: "9000109", description: "Measuring Cylinder - 1000ml, PP, Hexagonal Base (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 400, cgstPct: 9, cgstAmt: 36, sgstPct: 9, sgstAmt: 36, igstPct: 0, igstAmt: 0, grossAmt: 472 },
      { slNo: "2", itemCode: "9000108", description: "Measuring Cylinder - 500ml, PP, Hexagonal Base (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 350, cgstPct: 9, cgstAmt: 31.5, sgstPct: 9, sgstAmt: 31.5, igstPct: 0, igstAmt: 0, grossAmt: 413 },
      { slNo: "3", itemCode: "9000107", description: "Measuring Cylinder - 250ml, PP, Hexagonal Base (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 300, cgstPct: 9, cgstAmt: 27, sgstPct: 9, sgstAmt: 27, igstPct: 0, igstAmt: 0, grossAmt: 354 },
      { slNo: "4", itemCode: "9000106", description: "Measuring Cylinder - 100ml, PP, Hexagonal Base (NABL Calibrated)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 2, rate: 250, cgstPct: 9, cgstAmt: 45, sgstPct: 9, sgstAmt: 45, igstPct: 0, igstAmt: 0, grossAmt: 590 },
      { slNo: "5", itemCode: "9000115", description: "Cube Mould 150x150x150mm ISI Marked (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 6, rate: 250, cgstPct: 9, cgstAmt: 135, sgstPct: 9, sgstAmt: 135, igstPct: 0, igstAmt: 0, grossAmt: 1770 },
      { slNo: "6", itemCode: "9000116", description: "Cube Mould 70.6x70.6x70.6mm ISI Marked (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 3, rate: 250, cgstPct: 9, cgstAmt: 67.5, sgstPct: 9, sgstAmt: 67.5, igstPct: 0, igstAmt: 0, grossAmt: 885 },
      { slNo: "7", itemCode: "9000117", description: "Compression Testing Machine 2000 kN (NABL Calibration Report & Seal)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 5000, cgstPct: 9, cgstAmt: 450, sgstPct: 9, sgstAmt: 450, igstPct: 0, igstAmt: 0, grossAmt: 5900 },
      { slNo: "8", itemCode: "9000118", description: "Digital Weighing Balance 30kg Cap (NABL Calibration Certificate)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 800, cgstPct: 9, cgstAmt: 72, sgstPct: 9, sgstAmt: 72, igstPct: 0, igstAmt: 0, grossAmt: 944 },
      { slNo: "9", itemCode: "9000119", description: "Precision Weighing Balance 600g (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 800, cgstPct: 9, cgstAmt: 72, sgstPct: 9, sgstAmt: 72, igstPct: 0, igstAmt: 0, grossAmt: 944 },
      { slNo: "10", itemCode: "9000120", description: "Hot Air Oven 14x14x14 Inch Digital (NABL Temperature Profile)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 1200, cgstPct: 9, cgstAmt: 108, sgstPct: 9, sgstAmt: 108, igstPct: 0, igstAmt: 0, grossAmt: 1416 },
      { slNo: "11", itemCode: "9000121", description: "Water Bath Digital Controller (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 1000, cgstPct: 9, cgstAmt: 90, sgstPct: 9, sgstAmt: 90, igstPct: 0, igstAmt: 0, grossAmt: 1180 },
      { slNo: "12", itemCode: "9000122", description: "Vicat Apparatus with Needle (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 600, cgstPct: 9, cgstAmt: 54, sgstPct: 9, sgstAmt: 54, igstPct: 0, igstAmt: 0, grossAmt: 708 },
      { slNo: "13", itemCode: "9000123", description: "Le-Chatelier Mould & Flask (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 2, rate: 400, cgstPct: 9, cgstAmt: 72, sgstPct: 9, sgstAmt: 72, igstPct: 0, igstAmt: 0, grossAmt: 944 },
      { slNo: "14", itemCode: "9000124", description: "Brass Test Sieves 200mm Dia (Set of 7) (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "SET", qty: 1, rate: 2100, cgstPct: 9, cgstAmt: 189, sgstPct: 9, sgstAmt: 189, igstPct: 0, igstAmt: 0, grossAmt: 2478 },
      { slNo: "15", itemCode: "9000125", description: "GI Test Sieves 300mm Dia (Set of 5) (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "SET", qty: 1, rate: 2000, cgstPct: 9, cgstAmt: 180, sgstPct: 9, sgstAmt: 180, igstPct: 0, igstAmt: 0, grossAmt: 2360 },
      { slNo: "16", itemCode: "9000126", description: "Slump Test Apparatus ISI Marked (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 2, rate: 500, cgstPct: 9, cgstAmt: 90, sgstPct: 9, sgstAmt: 90, igstPct: 0, igstAmt: 0, grossAmt: 1180 },
      { slNo: "17", itemCode: "9000127", description: "Digital Vernier Caliper 300mm (NABL)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 500, cgstPct: 9, cgstAmt: 45, sgstPct: 9, sgstAmt: 45, igstPct: 0, igstAmt: 0, grossAmt: 590 },
      { slNo: "18", itemCode: "9000128", description: "Stop Watch Digital (NABL Calibration)", hsnCode: "998346", reqDate: "27-07-2026", uom: "EA", qty: 1, rate: 400, cgstPct: 9, cgstAmt: 36, sgstPct: 9, sgstAmt: 36, igstPct: 0, igstAmt: 0, grossAmt: 472 },
      { slNo: "19", itemCode: "9000129", description: "On-site Calibration Technical Charges & Stamping", hsnCode: "998346", reqDate: "27-07-2026", uom: "LS", qty: 1, rate: 3000, cgstPct: 9, cgstAmt: 270, sgstPct: 9, sgstAmt: 270, igstPct: 0, igstAmt: 0, grossAmt: 3540 },
    ],
  });
  const [proformaRecordId, setProformaRecordId] = useState(null);
  const [proformaSaving, setProformaSaving] = useState(false);
  const [proformaForm, setProformaForm] = useState({
    piNo: "PI/26-27/12",
    piDate: "24 Apr 2026",
    dueDate: "25 May 2026",
    placeOfSupply: "27-MAHARASHTRA",
    clientCompany: "RDSS QUALITY CONTROL LAB PRIVATE LIMITED",
    clientGstin: "27AAOCR3275P1ZH",
    clientAddress: "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath\nThane, MAHARASHTRA, 421503",
    items: defaultProforma26Items,
  });
  const [quotationFilterSearch, setQuotationFilterSearch] = useState("");

  const [quotationForm, setQuotationForm] = useState({
    quotationNo: "ARCL/QTN/26-27/47",
    quotationDate: "2026-04-22",
    validityDate: "2026-04-29",
    placeOfSupply: "27-MAHARASHTRA",
    billTo: {
      companyName: "RDSS QUALITY CONTROL LAB PRIVATE LIMITED",
      gstin: "27AAOCR3275P1ZH",
      address: "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath",
      cityStatePin: "Thane, MAHARASHTRA, 421503",
      phone: "+91 8369458583",
      email: "arclinstruments@gmail.com",
    },
    items: defaultStandard37Items,
    cgstRate: 9.0,
    sgstRate: 9.0,
  });

  // Handlers for Purchase Order (PO) Items Editing
  const handlePoItemChange = (index, field, value) => {
    setPoForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : []).map((i) => ({ ...i }));
      const updated = { ...currentItems[index], [field]: value };
      if (field === "rate" || field === "qty") {
        const r = Number(field === "rate" ? value : updated.rate) || 0;
        const q = Number(field === "qty" ? value : updated.qty) || 1;
        const cgstPct = Number(updated.cgstPct) || 9;
        const sgstPct = Number(updated.sgstPct) || 9;
        const igstPct = Number(updated.igstPct) || 0;
        const baseAmt = r * q;
        const taxAmt = baseAmt * ((cgstPct + sgstPct + igstPct) / 100);
        updated.grossAmt = baseAmt + taxAmt;
      }
      currentItems[index] = updated;
      return { ...prev, items: currentItems };
    });
  };

  const handleAddPoItem = () => {
    setPoForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : []).map((i) => ({ ...i }));
      const newItem = {
        slNo: "1",
        itemCode: "9000" + (130 + currentItems.length),
        description: "New Calibration Instrument (NABL Calibration)",
        hsnCode: "998346",
        reqDate: "27-07-2026",
        uom: "EA",
        qty: 1,
        rate: 500,
        cgstPct: 9,
        cgstAmt: 45,
        sgstPct: 9,
        sgstAmt: 45,
        igstPct: 0,
        igstAmt: 0,
        grossAmt: 590,
      };
      const updated = [newItem, ...currentItems].map((item, idx) => ({ ...item, slNo: String(idx + 1) }));
      return { ...prev, items: updated };
    });
    toast.success("New row added at the top of Purchase Order!");
  };

  const handleRemovePoItem = (index) => {
    setPoForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : []).map((i) => ({ ...i }));
      const filtered = currentItems.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, slNo: String(idx + 1) }));
      return { ...prev, items: filtered };
    });
    toast.info("Item row removed.");
  };

  // Handlers for Proforma Invoice Items Editing
  const handleProformaItemChange = (index, field, value) => {
    setProformaForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultProforma26Items).map((i) => ({ ...i }));
      const updated = { ...currentItems[index], [field]: value };
      if (field === "rate" || field === "qty") {
        const r = Number(field === "rate" ? value : updated.rate) || 0;
        const q = Number(field === "qty" ? value : updated.qty) || 1;
        updated.amount = r * q;
      }
      currentItems[index] = updated;
      return { ...prev, items: currentItems };
    });
  };

  const handleAddProformaItem = () => {
    setProformaForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultProforma26Items).map((i) => ({ ...i }));
      const newItem = {
        itemNo: 1,
        name: "New Calibration Item",
        subText: "NABL Third party Report",
        hsnSac: "998346",
        qty: 1,
        qtyUnit: "NOS",
        rate: 500,
        amount: 500,
      };
      const updated = [newItem, ...currentItems].map((item, idx) => ({ ...item, itemNo: idx + 1 }));
      return { ...prev, items: updated };
    });
    toast.success("New item row added at the top of Proforma Invoice!");
  };

  const handleRemoveProformaItem = (index) => {
    setProformaForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultProforma26Items).map((i) => ({ ...i }));
      const filtered = currentItems.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, itemNo: idx + 1 }));
      return { ...prev, items: filtered };
    });
    toast.info("Item row removed.");
  };

  // Live Computed Proforma Totals
  const proformaTotals = useMemo(() => {
    const items = Array.isArray(proformaForm.items) ? proformaForm.items : defaultProforma26Items;
    let taxable = 0;
    let totalQty = 0;
    items.forEach((it) => {
      const r = Number(it.rate) || 0;
      const q = Number(it.qty) || 1;
      const amt = it.amount !== undefined ? Number(it.amount) : r * q;
      taxable += amt;
      totalQty += q;
    });
    const cgst = Math.round(taxable * 0.09);
    const sgst = Math.round(taxable * 0.09);
    const grand = taxable + cgst + sgst;
    return { taxable, cgst, sgst, grand, totalQty };
  }, [proformaForm.items]);

  const handleSaveProforma = async () => {
    try {
      setProformaSaving(true);
      const itemsToSave = Array.isArray(proformaForm.items) ? proformaForm.items : defaultProforma26Items;
      const res = await saveProformaApi({
        recordId: proformaRecordId || undefined,
        serialNo: proformaForm.piNo || undefined,
        proformaData: {
          ...proformaForm,
          items: itemsToSave,
          taxableAmount: proformaTotals.taxable,
          cgstAmount: proformaTotals.cgst,
          sgstAmount: proformaTotals.sgst,
          grandTotal: proformaTotals.grand,
        },
      });
      const savedRecordId = res?.data?.data?.record?._id;
      if (savedRecordId) {
        setProformaRecordId(savedRecordId);
      }
      toast.success("Official Proforma Invoice saved successfully!");
      fetchData(false);
      return savedRecordId || proformaRecordId;
    } catch (err) {
      console.error("Failed to save proforma:", err);
      toast.error(err?.response?.data?.message || "Failed to save proforma invoice data");
      return null;
    } finally {
      setProformaSaving(false);
    }
  };

  // Handlers for Tax Invoice Items Editing
  const handleTaxInvoiceItemChange = (index, field, value) => {
    setTaxInvoiceForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultTaxInvoice26Items).map((i) => ({ ...i }));
      const updated = { ...currentItems[index], [field]: value };
      if (field === "rate" || field === "qty") {
        const r = Number(field === "rate" ? value : updated.rate) || 0;
        const q = Number(field === "qty" ? value : updated.qty) || 1;
        updated.amount = r * q;
      }
      currentItems[index] = updated;
      return { ...prev, items: currentItems };
    });
  };

  const handleAddTaxInvoiceItem = () => {
    setTaxInvoiceForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultTaxInvoice26Items).map((i) => ({ ...i }));
      const newItem = {
        itemNo: 1,
        name: "New Calibration Instrument",
        subText: "NABL Third party Report",
        hsnSac: "998346",
        taxRate: "18%",
        qty: 1,
        qtyUnit: "NOS",
        rate: 500,
        per: "NOS",
        amount: 500,
      };
      const updated = [newItem, ...currentItems].map((item, idx) => ({ ...item, itemNo: idx + 1 }));
      return { ...prev, items: updated };
    });
    toast.success("New item row added at the top of Tax Invoice!");
  };

  const handleRemoveTaxInvoiceItem = (index) => {
    setTaxInvoiceForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultTaxInvoice26Items).map((i) => ({ ...i }));
      const filtered = currentItems.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, itemNo: idx + 1 }));
      return { ...prev, items: filtered };
    });
    toast.info("Item row removed.");
  };

  // Live Computed Tax Invoice Totals
  const taxInvoiceTotals = useMemo(() => {
    const items = Array.isArray(taxInvoiceForm.items) ? taxInvoiceForm.items : defaultTaxInvoice26Items;
    let taxable = 0;
    let totalQty = 0;
    items.forEach((it) => {
      const r = Number(it.rate) || 0;
      const q = Number(it.qty) || 1;
      const amt = it.amount !== undefined ? Number(it.amount) : r * q;
      taxable += amt;
      totalQty += q;
    });
    const cgst = Math.round(taxable * 0.09);
    const sgst = Math.round(taxable * 0.09);
    const grand = taxable + cgst + sgst;
    return { taxable: taxable || 0, cgst: cgst || 0, sgst: sgst || 0, grand: grand || 0, total: grand || 0, totalQty: totalQty || 0 };
  }, [taxInvoiceForm.items]);

  const handleSaveTaxInvoice = async () => {
    try {
      setTaxInvoiceSaving(true);
      const itemsToSave = Array.isArray(taxInvoiceForm.items) ? taxInvoiceForm.items : defaultTaxInvoice26Items;
      const res = await saveTaxInvoiceApi({
        recordId: taxInvoiceRecordId || undefined,
        serialNo: taxInvoiceForm.invoiceNo || undefined,
        taxInvoiceData: {
          ...taxInvoiceForm,
          items: itemsToSave,
          taxableAmount: taxInvoiceTotals.taxable,
          cgstAmount: taxInvoiceTotals.cgst,
          sgstAmount: taxInvoiceTotals.sgst,
          grandTotal: taxInvoiceTotals.grand,
        },
      });
      const savedRecordId = res?.data?.data?.record?._id;
      if (savedRecordId) {
        setTaxInvoiceRecordId(savedRecordId);
      }
      toast.success("Official Tax Invoice saved successfully!");
      fetchData(false);
      return savedRecordId || taxInvoiceRecordId;
    } catch (err) {
      console.error("Failed to save tax invoice:", err);
      toast.error(err?.response?.data?.message || "Failed to save tax invoice data");
      return null;
    } finally {
      setTaxInvoiceSaving(false);
    }
  };

  const handleOpenTaxInvoiceEditor = (rec = null) => {
    setTaxInvoiceRecordId(rec?._id || rec?.id || null);
    if (rec) {
      const batchList = records.filter(
        (r) =>
          (rec.dcNo && r.dcNo === rec.dcNo && r.clientCompany === rec.clientCompany) ||
          r._id === rec._id
      );
      const dynamicItems = (batchList.length > 0 ? batchList : [rec]).map((r, idx) => {
        const makeTrim = String(r?.make || "").trim();
        const makeStr = makeTrim ? `Make: ${makeTrim} | ` : "";
        return {
          itemNo: idx + 1,
          name: `${r?.instrument || "Calibration Equipment"} - Calibration & Testing`,
          subText: `NABL Accredited Metrological Calibration (${makeStr}S/N: ${r?.serialNo || "-"})`,
          hsnSac: "998346",
          taxRate: "18%",
          qty: 1,
          qtyUnit: "NOS",
          rate: 5000,
          per: "NOS",
          amount: 5000,
        };
      });

      if (rec.taxInvoiceData && rec.taxInvoiceData.items && rec.taxInvoiceData.items.length > 0) {
        setTaxInvoiceForm({
          ...rec.taxInvoiceData,
          clientCompany: rec.taxInvoiceData.clientCompany || rec.clientCompany || "",
          clientAddress: rec.taxInvoiceData.clientAddress || rec.clientAddress || "",
          clientGstin: rec.taxInvoiceData.clientGstin || rec.clientGst || "",
        });
      } else {
        setTaxInvoiceForm((prev) => ({
          ...prev,
          invoiceNo: `ARCL/26-27/${String(rec.serialNo || "").replace(/[^0-9]/g, "").slice(-3) || "074"}`,
          invoiceDate: toSafeLocaleDate(rec.calibrationDate, toSafeLocaleDate(new Date())),
          dueDate: toSafeLocaleDate(rec.calibrationDueDate, toSafeLocaleDate(Date.now() + 30 * 86400000)),
          clientCompany: rec.clientCompany || prev.clientCompany,
          clientAddress: rec.clientAddress || prev.clientAddress,
          clientGstin: rec.clientGst || prev.clientGstin,
          items: dynamicItems,
        }));
      }
    } else {
      setTaxInvoiceForm((prev) => ({ ...prev, items: defaultTaxInvoice26Items }));
    }
    setIsTaxInvoiceModalOpen(true);
  };

  const handleOpenProformaEditor = (rec = null) => {
    setProformaRecordId(rec?._id || rec?.id || null);
    if (rec) {
      const batchList = records.filter(
        (r) =>
          (rec.dcNo && r.dcNo === rec.dcNo && r.clientCompany === rec.clientCompany) ||
          r._id === rec._id
      );
      const dynamicItems = (batchList.length > 0 ? batchList : [rec]).map((r, idx) => {
        const makeTrim = String(r?.make || "").trim();
        const makeStr = makeTrim ? `Make: ${makeTrim} | ` : "";
        return {
          itemNo: idx + 1,
          name: `${r?.instrument || "Calibration Instrument"} - Calibration`,
          subText: `NABL Proforma Scope (${makeStr}S/N: ${r?.serialNo || "-"})`,
          hsnSac: "998346",
          rate: 1000,
          qty: 1,
          qtyUnit: "NOS",
          amount: 1000,
        };
      });

      if (rec.proformaData && rec.proformaData.items && rec.proformaData.items.length > 0) {
        setProformaForm({
          ...rec.proformaData,
          buyerCompany: rec.proformaData.buyerCompany || rec.clientCompany || "",
          buyerAddress: rec.proformaData.buyerAddress || rec.clientAddress || "",
          buyerGstin: rec.proformaData.buyerGstin || rec.clientGst || "",
        });
      } else {
        setProformaForm((prev) => ({
          ...prev,
          piNo: `ARCL/PI/26-27/${String(rec.serialNo || "").replace(/[^0-9]/g, "").slice(-3) || "088"}`,
          piDate: toSafeIsoDate(rec.calibrationDate, toSafeIsoDate(new Date())),
          buyerCompany: rec.clientCompany || prev.buyerCompany,
          buyerAddress: rec.clientAddress || prev.buyerAddress,
          buyerGstin: rec.clientGst || prev.buyerGstin,
          items: dynamicItems,
        }));
      }
    } else {
      setProformaForm((prev) => ({ ...prev, items: defaultProforma26Items }));
    }
    setIsProformaInvoiceModalOpen(true);
  };

  const handleOpenQuotationEditor = (rec = null) => {
    if (rec) {
      setQuotationRecordId(rec._id || rec.id);
      const batchList = records.filter(
        (r) =>
          (rec.dcNo && r.dcNo === rec.dcNo && r.clientCompany === rec.clientCompany) ||
          r._id === rec._id
      );
      const dynamicItems = (batchList.length > 0 ? batchList : [rec]).map((r, idx) => {
        const makeTrim = String(r?.make || "").trim();
        const makeStr = makeTrim ? `Make: ${makeTrim} | ` : "";
        return {
          itemNo: idx + 1,
          name: `${r?.instrument || "Calibration Instrument"} - Calibration`,
          subText: `NABL Traceable Report (${makeStr}S/N: ${r?.serialNo || "-"})`,
          hsnSac: "998346",
          rate: 1000,
          qty: 1,
          qtyUnit: "NOS",
          amount: 1000,
        };
      });

      if (rec.quotationData && rec.quotationData.items && rec.quotationData.items.length > 0) {
        setQuotationForm({
          ...rec.quotationData,
          billTo: {
            ...rec.quotationData.billTo,
            companyName: rec.quotationData.billTo?.companyName || rec.clientCompany || "",
            gstin: rec.quotationData.billTo?.gstin || rec.clientGst || "",
            address: rec.quotationData.billTo?.address || rec.clientAddress || "",
            phone: rec.quotationData.billTo?.phone || rec.clientPhone || "",
            email: rec.quotationData.billTo?.email || rec.clientEmail || "",
          },
        });
      } else {
        setQuotationForm({
          quotationNo: `ARCL/QTN/26-27/${String(rec.serialNo || "").replace(/[^0-9]/g, "").slice(-3) || "47"}`,
          quotationDate: toSafeIsoDate(rec.calibrationDate, toSafeIsoDate(new Date())),
          validityDate: toSafeIsoDate(rec.calibrationDueDate, toSafeIsoDate(Date.now() + 30 * 86400000)),
          placeOfSupply: "27-MAHARASHTRA",
          billTo: {
            companyName: rec.clientCompany || "",
            gstin: rec.clientGst || "27AAOCR3275P1ZH",
            address: rec.clientAddress || "Plot No. 12, TTC Industrial Area, MIDC, Airoli, Navi Mumbai - 400708",
            cityStatePin: "Thane, MAHARASHTRA, 421503",
            phone: rec.clientPhone || "+91 8009559900",
            email: rec.clientEmail || "arclinstruments@gmail.com",
          },
          items: dynamicItems,
          cgstRate: 9.0,
          sgstRate: 9.0,
        });
      }
    } else {
      setQuotationRecordId(null);
    }
    setIsQuotationModalOpen(true);
  };

  const handleQuotationItemChange = (index, field, value) => {
    setQuotationForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultStandard37Items).map((i) => ({ ...i }));
      const item = { ...currentItems[index], [field]: value };
      if (field === "rate" || field === "qty") {
        const rate = parseFloat(field === "rate" ? value : item.rate) || 0;
        const qty = parseFloat(field === "qty" ? value : item.qty) || 0;
        item.amount = rate * qty;
      }
      currentItems[index] = item;
      return { ...prev, items: currentItems };
    });
  };

  const handleAddQuotationItem = () => {
    setQuotationForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultStandard37Items).map((i) => ({ ...i }));
      const newItem = {
        itemNo: 1,
        name: "New Calibration Instrument",
        subText: "NABL Third party Report",
        hsnSac: "998346",
        rate: 500,
        qty: 1,
        qtyUnit: "NOS",
        amount: 500,
      };
      const updated = [newItem, ...currentItems].map((it, idx) => ({ ...it, itemNo: idx + 1 }));
      return { ...prev, items: updated };
    });
    toast.success("New item row added at the top of Quotation!");
  };

  const handleRemoveQuotationItem = (index) => {
    setQuotationForm((prev) => {
      const currentItems = (Array.isArray(prev.items) ? prev.items : defaultStandard37Items).map((i) => ({ ...i }));
      const filtered = currentItems.filter((_, i) => i !== index).map((it, idx) => ({
        ...it,
        itemNo: idx + 1,
      }));
      return { ...prev, items: filtered };
    });
    toast.info("Item row removed.");
  };

  // Live Computed Quotation Totals
  const quotationTotals = useMemo(() => {
    let taxable = 0;
    let qty = 0;
    const items = Array.isArray(quotationForm.items) ? quotationForm.items : defaultStandard37Items;
    items.forEach(it => {
      const amt = (parseFloat(it.rate) || 0) * (parseFloat(it.qty) || 0);
      taxable += amt;
      qty += (parseFloat(it.qty) || 0);
    });
    const cgst = (taxable * (parseFloat(quotationForm.cgstRate) || 0)) / 100;
    const sgst = (taxable * (parseFloat(quotationForm.sgstRate) || 0)) / 100;
    const total = taxable + cgst + sgst;
    return {
      taxable: taxable || 0,
      qty: qty || 0,
      totalQty: qty || 0,
      cgst: cgst || 0,
      sgst: sgst || 0,
      total: total || 0,
      grand: total || 0,
    };
  }, [quotationForm]);

  const handleSaveQuotation = async () => {
    try {
      setQuotationSaving(true);
      const itemsToSave = Array.isArray(quotationForm.items) ? quotationForm.items : defaultStandard37Items;
      const res = await saveQuotationApi({
        recordId: quotationRecordId || undefined,
        serialNo: quotationForm.quotationNo || undefined,
        quotationData: {
          ...quotationForm,
          items: itemsToSave,
          taxableAmount: quotationTotals.taxable,
          cgstAmount: quotationTotals.cgst,
          sgstAmount: quotationTotals.sgst,
          totalAmount: quotationTotals.total,
        }
      });
      const savedRecordId = res?.data?.data?.record?._id;
      if (savedRecordId) {
        setQuotationRecordId(savedRecordId);
      }
      toast.success("Official Quotation format saved successfully!");
      fetchData(false);
      return savedRecordId || quotationRecordId;
    } catch (err) {
      console.error("Save quotation error:", err);
      toast.error(err?.response?.data?.message || "Failed to save quotation changes.");
      return null;
    } finally {
      setQuotationSaving(false);
    }
  };
  const [docToSend, setDocToSend] = useState(null);
  const [selectedDocTypes, setSelectedDocTypes] = useState(["quotation"]);

  // Specific Doc Dispatch Targets
  const [docTargetEmail, setDocTargetEmail] = useState("harsh.mishra9023@gmail.com");
  const [docTargetPhone, setDocTargetPhone] = useState("+91 9369962486");
  const [docCustomNote, setDocCustomNote] = useState("");

  // Audit Dispatch History
  const [dispatchHistory, setDispatchHistory] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("arcl_calibration_dispatch_history");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const recordDispatchLog = (entry) => {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setDispatchHistory((prev) => {
      const updated = [newEntry, ...prev.slice(0, 99)];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("arcl_calibration_dispatch_history", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  // Custom Candidates in Directory
  const [customCandidates, setCustomCandidates] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("arcl_calibration_custom_candidates");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [manualDispatchForm, setManualDispatchForm] = useState({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
  });

  const [candidateForm, setCandidateForm] = useState({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    instrumentName: "",
    serialNo: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const handleAddCandidateSubmit = (e) => {
    e.preventDefault();
    if (!candidateForm.email && !candidateForm.phone) {
      toast.warning("Please provide an email or phone number!");
      return;
    }
    const newCand = {
      id: "cand-" + Date.now(),
      company: candidateForm.company || "External Organization",
      contactPerson: candidateForm.contactPerson || "Quality Manager",
      email: candidateForm.email || "arclinstruments@gmail.com",
      phone: candidateForm.phone || "+91 8009559900",
      instrumentName: candidateForm.instrumentName || "Precision Testing Instrument",
      serialNo: candidateForm.serialNo || "N/A",
      dueDate: candidateForm.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
    setCustomCandidates((prev) => {
      const updated = [newCand, ...(Array.isArray(prev) ? prev : [])];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("arcl_calibration_custom_candidates", JSON.stringify(updated));
        } catch (err) {}
      }
      return updated;
    });
    toast.success(`Candidate ${newCand.company} added to Due Directory! ✅`);
    setIsAddCandidateModalOpen(false);
    setCandidateForm({
      company: "",
      contactPerson: "",
      email: "",
      phone: "",
      instrumentName: "",
      serialNo: "",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  };

  // Fetch Data (Records & Stats)
  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setLoading(true);
      const [recordsRes, statsRes] = await Promise.all([
        getAdminCalibrationRecords(),
        getAdminCalibrationStats(),
      ]);

      if (recordsRes.data) {
        const raw =
          recordsRes.data.data?.records ||
          recordsRes.data.records ||
          recordsRes.data.data ||
          recordsRes.data;
        if (Array.isArray(raw)) {
          setRecords(raw);
        } else {
          setRecords([]);
        }
      }
      if (statsRes.data) {
        setStats(statsRes.data.data || statsRes.data || null);
      }

      if (showToast) {
        toast.success("Calibration records & analytics refreshed successfully!");
      }
    } catch (err) {
      console.error("Error fetching calibration data:", err);
      if (showToast) {
        toast.error("Failed to refresh calibration data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial saved Quotation, Tax Invoice, and Proforma data once
  const fetchTemplates = async () => {
    try {
      const [qRes, invRes, piRes] = await Promise.allSettled([
        getQuotationApi(),
        getTaxInvoiceApi(),
        getProformaApi(),
      ]);
      if (qRes.status === "fulfilled" && qRes.value?.data?.data?.quotationData) {
        const qd = qRes.value.data.data.quotationData;
        setQuotationForm((prev) => ({
          ...prev,
          ...qd,
          billTo: {
            ...(prev.billTo || {}),
            ...(qd.billTo || {}),
          },
          items: qd.items && qd.items.length > 0 ? qd.items : (Array.isArray(prev.items) ? prev.items : defaultStandard37Items),
        }));
        if (qRes.value.data.data.recordId) {
          setQuotationRecordId(qRes.value.data.data.recordId);
        }
      }
      if (invRes.status === "fulfilled" && invRes.value?.data?.data?.taxInvoiceData) {
        const id = invRes.value.data.data.taxInvoiceData;
        setTaxInvoiceForm((prev) => ({
          ...prev,
          ...id,
          items: id.items && id.items.length > 0 ? id.items : (Array.isArray(prev.items) ? prev.items : defaultTaxInvoice26Items),
        }));
        if (invRes.value.data.data.recordId) {
          setTaxInvoiceRecordId(invRes.value.data.data.recordId);
        }
      }
      if (piRes.status === "fulfilled" && piRes.value?.data?.data?.proformaData) {
        const pd = piRes.value.data.data.proformaData;
        setProformaForm((prev) => ({
          ...prev,
          ...pd,
          items: pd.items && pd.items.length > 0 ? pd.items : (Array.isArray(prev.items) ? prev.items : defaultProforma26Items),
        }));
        if (piRes.value.data.data.recordId) {
          setProformaRecordId(piRes.value.data.data.recordId);
        }
      }
    } catch (docErr) {
      console.warn("Template fetch error:", docErr);
    }
  };

  const fetchAutoReminderStatus = async () => {
    try {
      const res = await getAutoReminderStatusApi();
      if (res.data?.data) {
        setAutoReminderStatus(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load auto-reminder status:", err);
    }
  };

  const handleTriggerAutoReminderScan = async () => {
    try {
      setAutoReminderTriggering(true);
      const res = await triggerAutoReminderScanApi({
        thresholdDays: reminderTemplate?.thresholdDays || 30,
        forceSend: true,
        customSubject: reminderTemplate?.subject,
        customMessage: reminderTemplate?.introMessage,
      });
      toast.success(res.data?.message || "Automated due reminders dispatched to customers! 🚀");
      await fetchAutoReminderStatus();
      await fetchData(false);
    } catch (err) {
      console.error("Auto-reminder scan error:", err);
      toast.error(err.response?.data?.message || "Failed to trigger auto reminder scan.");
    } finally {
      setAutoReminderTriggering(false);
    }
  };

  const handleToggleAutoScheduler = async () => {
    try {
      const newEnabledState = !autoReminderStatus?.isEnabled;
      const res = await toggleAutoReminderApi({ enabled: newEnabledState });
      toast.success(res.data?.message || `Auto-reminder background scheduler ${newEnabledState ? "enabled" : "disabled"}.`);
      await fetchAutoReminderStatus();
    } catch (err) {
      console.error("Auto-reminder toggle error:", err);
      toast.error("Failed to toggle auto scheduler.");
    }
  };

  const fetchLabScope = async () => {
    try {
      setLabScopeLoading(true);
      const res = await getNablLabScopeApi();
      if (res.data?.data) {
        const { labScope, stats } = res.data.data;
        setLabScopeData(labScope);
        setLabScopeStats(stats);
        if (labScope) {
          setLabProfileForm({
            labName: labScope.labName || "ARCL Instruments Pvt. Ltd.",
            labCode: labScope.labCode || "ARCL-LAB-01",
            accreditationStandard: labScope.accreditationStandard || "ISO/IEC 17025:2017",
            certificateNo: labScope.certificateNo || "CC-4313",
            validUntil: labScope.validUntil ? new Date(labScope.validUntil).toISOString().slice(0, 10) : "2026-07-28",
            status: labScope.status || "Active",
            masterTraceability: labScope.masterTraceability || "National Physical Laboratory (NPL), New Delhi & ERTL",
            referralCode: labScope.referralCode || "ARCL-LAB-01",
            referralRate: labScope.referralRate || 30,
            annualSubscriptionRate: labScope.annualSubscriptionRate || 11000,
          });
        }
      }
    } catch (err) {
      console.warn("NABL lab scope fallback active:", err?.response?.data?.message || err?.message);
    } finally {
      setLabScopeLoading(false);
    }
  };

  const handleSaveLabProfile = async (e) => {
    e?.preventDefault?.();
    try {
      setLabScopeSaving(true);
      await updateNablLabScopeApi(labProfileForm);
      toast.success("NABL Lab Profile & Accreditation details updated successfully! ✅");
      setIsEditLabProfileOpen(false);
      await fetchLabScope();
    } catch (err) {
      console.error("Failed to save lab profile:", err);
      toast.error(err.response?.data?.message || "Failed to update lab profile");
    } finally {
      setLabScopeSaving(false);
    }
  };

  const handleOpenAddScopeModal = () => {
    setScopeItemForm({
      discipline: labScopeFilterDiscipline !== "all" ? labScopeFilterDiscipline : "Mechanical & Force",
      parameter: "",
      range: "",
      cmc: "",
      masterStandard: "",
      standardMethod: "",
      traceability: "NPL, New Delhi",
      facility: "On-Site & Permanent Lab",
      active: true,
    });
    setEditingScopeItemId(null);
    setIsAddScopeModalOpen(true);
  };

  const handleOpenEditScopeModal = (item) => {
    setScopeItemForm({
      discipline: item.discipline || "Mechanical & Force",
      parameter: item.parameter || "",
      range: item.range || "",
      cmc: item.cmc || "",
      masterStandard: item.masterStandard || "",
      standardMethod: item.standardMethod || "",
      traceability: item.traceability || "NPL, New Delhi",
      facility: item.facility || "On-Site & Permanent Lab",
      active: item.active !== undefined ? item.active : true,
    });
    setEditingScopeItemId(item._id || item.id);
    setIsEditScopeModalOpen(true);
  };

  const handleSaveScopeItem = async (e) => {
    e?.preventDefault?.();
    if (!scopeItemForm.parameter?.trim()) {
      toast.error("Please enter Parameter / Instrument Name");
      return;
    }
    try {
      setLabScopeSaving(true);
      if (editingScopeItemId) {
        await updateNablScopeItemApi(editingScopeItemId, scopeItemForm);
        toast.success(`Scope parameter "${scopeItemForm.parameter}" updated successfully! ✅`);
        setIsEditScopeModalOpen(false);
      } else {
        await addNablScopeItemApi(scopeItemForm);
        toast.success(`Scope parameter "${scopeItemForm.parameter}" added to NABL Scope! 🎯`);
        setIsAddScopeModalOpen(false);
      }
      await fetchLabScope();
    } catch (err) {
      console.error("Failed to save scope parameter:", err);
      toast.error(err.response?.data?.message || "Failed to save scope parameter");
    } finally {
      setLabScopeSaving(false);
    }
  };

  const handleDeleteScopeItem = async (itemId, paramName) => {
    if (!window.confirm(`Are you sure you want to remove "${paramName || 'this item'}" from NABL Accreditation Scope?`)) {
      return;
    }
    try {
      await deleteNablScopeItemApi(itemId);
      toast.success("Scope parameter removed from NABL matrix.");
      await fetchLabScope();
    } catch (err) {
      console.error("Failed to delete scope item:", err);
      toast.error(err.response?.data?.message || "Failed to remove scope parameter");
    }
  };

  const handleResetScope = async () => {
    if (!window.confirm("Are you sure you want to reset NABL Scope to official ARCL certified baseline?")) {
      return;
    }
    try {
      setLabScopeLoading(true);
      await resetNablLabScopeApi();
      toast.success("NABL Scope reset to official ARCL certified baseline! 🚀");
      await fetchLabScope();
    } catch (err) {
      console.error("Failed to reset scope:", err);
      toast.error("Failed to reset NABL Scope");
    } finally {
      setLabScopeLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTemplates();
    fetchAutoReminderStatus();
    fetchLabScope();
  }, []);

  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchData(false);
      fetchAutoReminderStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoSync]);

  // Unique Clients List
  const uniqueClients = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    const set = new Set();
    list.forEach((r) => {
      if (r?.clientCompany) set.add(r.clientCompany);
    });
    return Array.from(set);
  }, [records]);

  // Filtered Records based on Search, Stage, Payment, and Client
  const filteredRecords = useMemo(() => {
    const list = Array.isArray(records) ? records : [];
    return list.filter((r) => {
      const q = String(searchTerm || "").toLowerCase().trim();
      const matchesSearch =
        !q ||
        String(r?.instrument || "").toLowerCase().includes(q) ||
        String(r?.serialNo || "").toLowerCase().includes(q) ||
        String(r?.clientCompany || "").toLowerCase().includes(q) ||
        String(r?.modelNo || "").toLowerCase().includes(q) ||
        String(r?.make || "").toLowerCase().includes(q) ||
        String(r?.dcNo || "").toLowerCase().includes(q);

      const matchesStage = stageFilter === "all" || r?.stage === stageFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        String(r?.commercialDocs?.paymentStatus || "Paid").toLowerCase() === String(paymentFilter).toLowerCase();

      const matchesClient = selectedClient === "all" || r?.clientCompany === selectedClient;

      return matchesSearch && matchesStage && matchesPayment && matchesClient;
    });
  }, [records, searchTerm, stageFilter, paymentFilter, selectedClient]);

  // Group filtered records by Batch (DC No + Client Company) so multiple products appear in 1 consolidated row
  const groupedBatches = useMemo(() => {
    const list = filteredRecords;
    const batchMap = new Map();

    list.forEach((r) => {
      const dcClean = String(r?.dcNo || "").trim();
      const compClean = String(r?.clientCompany || "External Client").trim();
      const key =
        dcClean && dcClean !== "-"
          ? `${compClean.toLowerCase()}___${dcClean.toLowerCase()}`
          : `${compClean.toLowerCase()}___${
              r?.challanDate
                ? toSafeLocaleDate(r.challanDate, "batch-date")
                : r?.calibrationDate
                ? toSafeLocaleDate(r.calibrationDate, "batch-date")
                : "batch"
            }`;

      if (!batchMap.has(key)) {
        batchMap.set(key, {
          batchKey: key,
          primaryRecord: r,
          items: [],
          clientCompany: compClean,
          clientContactPerson: r?.clientContactPerson || "Quality Manager",
          clientEmail: r?.clientEmail || "",
          clientPhone: r?.clientPhone || "",
          clientGst: r?.clientGst || "",
          clientAddress: r?.clientAddress || "",
          dcNo: r?.dcNo || "-",
          challanDate: r?.challanDate,
          sentToLab: r?.sentToLab || "ARCL Laboratory",
          broughtToCompanyDate: r?.broughtToCompanyDate,
          invoiceSharedDate: r?.invoiceSharedDate,
          calibrationDate: r?.calibrationDate,
          calibrationDueDate: r?.calibrationDueDate,
          commercialDocs: r?.commercialDocs || {},
          stage: r?.stage || "Calibration Done",
          records: r?.records || {},
        });
      }
      const existingBatch = batchMap.get(key);
      if (existingBatch) {
        existingBatch.items.push(r);
        if (
          !existingBatch.commercialDocs?.poFileUrl &&
          (r?.commercialDocs?.poFileUrl || r?.commercialDocs?.poRaised)
        ) {
          existingBatch.commercialDocs = {
            ...existingBatch.commercialDocs,
            ...r.commercialDocs,
            poFileUrl: r.commercialDocs?.poFileUrl || r.commercialDocs?.poRaised,
            poRaised: r.commercialDocs?.poRaised || r.commercialDocs?.poFileUrl,
          };
          if (existingBatch.primaryRecord) {
            existingBatch.primaryRecord.commercialDocs = existingBatch.commercialDocs;
          }
        }
      }
    });

    return Array.from(batchMap.values());
  }, [filteredRecords]);

  const toggleExpandBatch = (batchKey) => {
    setExpandedBatchKeys((prev) => {
      const next = new Set(prev);
      if (next.has(batchKey)) {
        next.delete(batchKey);
      } else {
        next.add(batchKey);
      }
      return next;
    });
  };

  const handleDeleteBatch = async (batch) => {
    const itemCount = batch.items.length;
    const msg = itemCount > 1
      ? `Are you sure you want to delete all ${itemCount} instruments in batch for "${batch.clientCompany}" (DC: ${batch.dcNo})?`
      : `Are you sure you want to delete "${batch.items[0]?.instrument || batch.clientCompany}"?`;

    if (!window.confirm(msg)) return;

    try {
      const deletePromises = batch.items.map((it) => {
        const id = it._id || it.id;
        if (id && String(id).length > 5 && !String(id).startsWith("rec-")) {
          return deleteCalibrationRecordApi(id).catch((e) => console.warn(e));
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
      toast.success(`Deleted ${itemCount} instrument(s) from database! 🗑️`);
      fetchData(false);
    } catch (err) {
      console.error("Batch delete error:", err);
      toast.error("Failed to delete batch records");
    }
  };

  const handleAdvanceBatchStage = async (batch) => {
    const stages = [
      "Instrument Received",
      "Under Calibration",
      "Calibration Done",
      "Invoice Sent",
      "Certificate Uploaded",
    ];
    const current = batch.stage || "Instrument Received";
    const currentIdx = stages.indexOf(current);
    const nextIdx = currentIdx < stages.length - 1 ? currentIdx + 1 : currentIdx;
    const nextStage = stages[nextIdx];

    try {
      const updatePromises = batch.items.map((it) => {
        const id = it._id || it.id;
        if (id && String(id).length > 5 && !String(id).startsWith("rec-")) {
          return updateCalibrationRecordApi(id, { stage: nextStage });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      toast.success(`Batch advanced to: "${nextStage}" 🚀`);
      fetchData(false);
    } catch (err) {
      console.error("Advance batch stage error:", err);
      toast.error("Failed to advance batch stage");
    }
  };

  const handleCycleBatchPayment = async (batch) => {
    const current = batch.commercialDocs?.paymentStatus || "Paid";
    const nextStatus = current === "Paid" ? "Pending" : current === "Pending" ? "Partial" : "Paid";
    try {
      const updatePromises = batch.items.map((it) => {
        const id = it._id || it.id;
        if (id && String(id).length > 5 && !String(id).startsWith("rec-")) {
          return updateCalibrationRecordApi(id, { "commercialDocs.paymentStatus": nextStatus });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      toast.success(`Payment status changed to ${nextStatus} for all ${batch.items.length} items`);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to update payment status");
    }
  };

  const handleToggleBatchSticker = async (batch) => {
    try {
      const newVal = !batch.records?.stickerCheck;
      const updatePromises = batch.items.map((it) => {
        const id = it._id || it.id;
        if (id && String(id).length > 5 && !String(id).startsWith("rec-")) {
          return updateCalibrationRecordApi(id, { "records.stickerCheck": newVal });
        }
        return Promise.resolve();
      });
      await Promise.all(updatePromises);
      toast.success(`Sticker check marked ${newVal ? "Yes ✅" : "No ❌"} for all ${batch.items.length} items`);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to update sticker status");
    }
  };

  // Row Action Handlers for Add New Instrument / Batch Calibration
  const createDefaultInstrumentRow = () => ({
    id: "inst_" + Math.random().toString(36).substring(2, 9),
    instrument: "",
    make: "",
    modelNo: "",
    serialNo: "",
    instrumentRange: "",
    calibrationDate: new Date().toISOString().slice(0, 10),
    calibrationDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    stage: "Instrument Received",
    paymentStatus: "Paid",
    stickerCheck: true,
    remarks: "",
  });

  const initialFormData = {
    clientCompany: "",
    clientContactPerson: "",
    clientEmail: "",
    clientPhone: "",
    clientGst: "",
    clientAddress: "",
    dcNo: "",
    challanDate: new Date().toISOString().slice(0, 10),
    sentToLab: "ARCL Calibration Lab",
    instruments: [createDefaultInstrumentRow()],
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleAddInstrumentRow = () => {
    setFormData((prev) => ({
      ...prev,
      instruments: [...prev.instruments, createDefaultInstrumentRow()],
    }));
    toast.info("Added new equipment row!");
  };

  const handleDuplicateInstrumentRow = (index) => {
    setFormData((prev) => {
      const currentList = [...prev.instruments];
      const source = currentList[index];
      if (!source) return prev;
      const clone = {
        ...source,
        id: "inst_" + Math.random().toString(36).substring(2, 9),
        serialNo: source.serialNo ? `${source.serialNo}-COPY` : "",
      };
      currentList.splice(index + 1, 0, clone);
      return { ...prev, instruments: currentList };
    });
    toast.success("Equipment row duplicated!");
  };

  const handleRemoveInstrumentRow = (index) => {
    setFormData((prev) => {
      if (prev.instruments.length <= 1) {
        toast.warning("At least one equipment row is required!");
        return prev;
      }
      const updated = prev.instruments.filter((_, i) => i !== index);
      return { ...prev, instruments: updated };
    });
  };

  const handleInstrumentFieldChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.instruments];
      const item = { ...updated[index], [field]: value };
      if (field === "calibrationDate" && value) {
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const nextYear = new Date(d.getTime() + 365 * 24 * 60 * 60 * 1000);
            item.calibrationDueDate = nextYear.toISOString().slice(0, 10);
          }
        } catch (e) {}
      }
      updated[index] = item;
      return { ...prev, instruments: updated };
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientCompany?.trim()) {
      toast.error("Please enter Client / Company Name");
      return;
    }

    const items = formData.instruments || [];
    if (items.length === 0) {
      toast.error("Please add at least one instrument");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].instrument?.trim()) {
        toast.error(`Please enter Instrument Name for Equipment #${i + 1}`);
        return;
      }
      if (!items[i].serialNo?.trim()) {
        toast.error(`Please enter Serial Number for Equipment #${i + 1} (${items[i].instrument})`);
        return;
      }
    }

    // Check duplicate serial numbers within batch
    const serialSet = new Set();
    for (let i = 0; i < items.length; i++) {
      const s = items[i].serialNo.trim().toLowerCase();
      if (serialSet.has(s)) {
        toast.error(`Duplicate Serial Number "${items[i].serialNo}" in form (Row #${i + 1})`);
        return;
      }
      serialSet.add(s);
    }

    try {
      await createCalibrationRecordApi(formData);
      const totalCount = items.length;
      toast.success(
        `Successfully added ${totalCount} equipment${totalCount > 1 ? "s" : ""} for "${formData.clientCompany}"! ✅`
      );
      setIsAddModalOpen(false);
      setFormData({
        ...initialFormData,
        instruments: [createDefaultInstrumentRow()],
      });
      fetchData(false);
    } catch (err) {
      console.error("Add error:", err);
      toast.error(err.response?.data?.message || "Failed to add instrument records");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData) return;
    if (!editFormData.clientCompany?.trim()) {
      toast.error("Please enter Client / Company Name");
      return;
    }

    const items = editFormData.instruments || [];
    if (items.length === 0) {
      toast.error("At least one equipment item is required in the batch");
      return;
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].instrument?.trim()) {
        toast.error(`Equipment Name is required for Row #${i + 1}`);
        return;
      }
      if (!items[i].serialNo?.trim()) {
        toast.error(`Serial Number is required for Row #${i + 1} (${items[i].instrument})`);
        return;
      }
    }

    try {
      await updateCalibrationBatchApi(editFormData);
      toast.success(
        `Successfully saved all changes for ${items.length} equipment(s) under "${editFormData.clientCompany}"! ✅`
      );
      setIsEditModalOpen(false);
      fetchData(false);
    } catch (err) {
      console.error("Edit error:", err);
      toast.error(err.response?.data?.message || "Failed to update instrument records");
    }
  };

  const handleEditInstrumentFieldChange = (index, field, value) => {
    setEditFormData((prev) => {
      const updated = [...prev.instruments];
      const item = { ...updated[index], [field]: value };
      if (field === "calibrationDate" && value) {
        try {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            const nextYear = new Date(d.getTime() + 365 * 24 * 60 * 60 * 1000);
            item.calibrationDueDate = nextYear.toISOString().slice(0, 10);
          }
        } catch (e) {}
      }
      updated[index] = item;
      return { ...prev, instruments: updated };
    });
  };

  const handleAddEditInstrumentRow = () => {
    setEditFormData((prev) => ({
      ...prev,
      instruments: [...prev.instruments, createDefaultInstrumentRow()],
    }));
    toast.info("Added new equipment row in batch!");
  };

  const handleDuplicateEditInstrumentRow = (index) => {
    setEditFormData((prev) => {
      const currentList = [...prev.instruments];
      const source = currentList[index];
      if (!source) return prev;
      const clone = {
        ...source,
        _id: undefined,
        id: "inst_" + Math.random().toString(36).substring(2, 9),
        serialNo: source.serialNo ? `${source.serialNo}-COPY` : "",
      };
      currentList.splice(index + 1, 0, clone);
      return { ...prev, instruments: currentList };
    });
    toast.success("Equipment row duplicated!");
  };

  const handleRemoveEditInstrumentRow = (index) => {
    setEditFormData((prev) => {
      if (prev.instruments.length <= 1) {
        toast.warning("At least one equipment row is required in the batch!");
        return prev;
      }
      const itemToRemove = prev.instruments[index];
      const newDeletedIds = [...(prev.deletedItemIds || [])];
      if (itemToRemove._id) {
        newDeletedIds.push(itemToRemove._id);
      }
      const updated = prev.instruments.filter((_, i) => i !== index);
      return { ...prev, instruments: updated, deletedItemIds: newDeletedIds };
    });
  };

  // Selected Client specific records
  const displayedClientRecords = useMemo(() => {
    if (selectedClient === "all") return records;
    return records.filter((r) => r.clientCompany === selectedClient);
  }, [records, selectedClient]);

  // Active Client Info Header
  const activeClientInfo = useMemo(() => {
    if (selectedClient === "all") {
      const first = records[0];
      return {
        company: "All Registered Clients",
        contactPerson: first?.clientContactPerson || "Metrology Desk",
        email: first?.clientEmail || "arclinstruments@gmail.com",
        phone: first?.clientPhone || "+91 8009559900",
        totalCount: records.length,
      };
    }
    const match = records.find((r) => r.clientCompany === selectedClient);
    const count = records.filter((r) => r.clientCompany === selectedClient).length;
    return {
      company: selectedClient,
      contactPerson: match?.clientContactPerson || "Quality Manager",
      email: match?.clientEmail || "arclinstruments@gmail.com",
      phone: match?.clientPhone || "+91 8009559900",
      totalCount: count,
    };
  }, [records, selectedClient]);

  // Dynamic Metrics for Dashboard Cards
  const dynamicMetrics = useMemo(() => {
    const src = displayedClientRecords;
    const total = src.length;
    const totalDone = src.filter((r) => r.stage === "Delivered to Client" || r.records?.stickerCheck).length;
    const underCalib = src.filter((r) => r.stage === "Calibration In Progress" || r.stage === "SRF Received").length;
    const calibDone = src.filter((r) => r.stage === "Quality Reviewed" || r.records?.stickerCheck).length;
    const certUploaded = src.filter((r) => r.records?.certificateNo || r.stage === "Invoice Generated" || r.stage === "Delivered to Client").length;
    const percentage = total > 0 ? Math.round((totalDone / total) * 100) : 100;

    return {
      total,
      totalDone,
      underCalib,
      calibDone,
      certUploaded,
      percentage,
    };
  }, [displayedClientRecords]);
  const handleOpenEdit = (target) => {
    if (!target) return;

    let batchItems = [];
    let primary = target.primaryRecord || target;

    if (target.items && Array.isArray(target.items) && target.items.length > 0) {
      batchItems = target.items;
      primary = target.primaryRecord || target.items[0];
    } else {
      const matching = records.filter(
        (r) =>
          (target.dcNo && r.dcNo && r.dcNo === target.dcNo && r.clientCompany === target.clientCompany) ||
          r._id === target._id
      );
      batchItems = matching.length > 0 ? matching : [target];
      primary = batchItems[0] || target;
    }

    setEditFormData({
      clientCompany: primary.clientCompany || "",
      clientContactPerson: primary.clientContactPerson || "",
      clientEmail: primary.clientEmail || "",
      clientPhone: primary.clientPhone || "",
      clientGst: primary.clientGst || "",
      clientAddress: primary.clientAddress || "",
      dcNo: primary.dcNo || "",
      challanDate: toSafeIsoDate(primary.challanDate, ""),
      sentToLab: (primary.sentToLab && !String(primary.sentToLab).includes("Metrology") && !String(primary.sentToLab).includes("Central")) ? primary.sentToLab : "ARCL Calibration Lab",
      invoiceSharedDate: toSafeIsoDate(primary.invoiceSharedDate, ""),
      deletedItemIds: [],
      instruments: batchItems.map((it) => ({
        _id: it._id || it.id,
        id: it._id || it.id || "inst_" + Math.random().toString(36).slice(2, 9),
        instrument: it.instrument || "",
        make: it.make && it.make !== "ARCL" && it.make !== "ARCL Instruments" ? it.make : "",
        modelNo: it.modelNo && it.modelNo !== "GEN-01" && it.modelNo !== "ARCL-CTM-2000" ? it.modelNo : "",
        serialNo: it.serialNo || "",
        instrumentRange: it.instrumentRange || "",
        calibrationDate: toSafeIsoDate(it.calibrationDate, toSafeIsoDate(new Date())),
        calibrationDueDate: toSafeIsoDate(it.calibrationDueDate, ""),
        stage: it.stage || "Instrument Received",
        paymentStatus: it.commercialDocs?.paymentStatus || it.paymentStatus || "Paid",
        stickerCheck:
          it.records?.stickerCheck !== undefined
            ? it.records.stickerCheck
            : it.stickerCheck !== undefined
            ? it.stickerCheck
            : true,
        certificateNo: it.records?.certificateNo || it.certificateNo || "",
        remarks: it.remarks || "",
      })),
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteRecord = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || "this record"}"?`)) return;
    try {
      await deleteCalibrationRecordApi(id);
      toast.success("Calibration record deleted successfully");
      fetchData(false);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete calibration record");
    }
  };

  const handleClearAllData = () => {
    // Open multi-select modal and initialize selections
    setSelectedDeleteCompanies(uniqueClients);
    setSelectedDeleteStages([
      "Delivered to Client",
      "SRF Received",
      "Calibration In Progress",
      "Draft Certificate Generated",
      "Quality Reviewed",
      "Invoice Generated",
      "Instrument Received",
      "Under Calibration",
      "Calibration Done",
      "Invoice Sent",
      "Certificate Uploaded",
    ]);
    setIsDeleteManagerOpen(true);
  };

  const handleExecuteSelectiveDelete = async () => {
    try {
      setIsDeletingScope(true);
      const { databaseRecords, customCandidates: delCandidates, dispatchLogs: delLogs, localCache: delCache } = deleteTargets;

      if (!databaseRecords && !delCandidates && !delLogs && !delCache) {
        toast.warning("Please select at least one item to delete!");
        setIsDeletingScope(false);
        return;
      }

      let deletedRecordsCount = 0;

      // 1. Delete Database Records (with Company & Stage multi-selection support)
      if (databaseRecords) {
        const isAllCompanies = deleteCompanyFilterMode === "all";
        const isAllStages = deleteStageFilterMode === "all";

        if (isAllCompanies && isAllStages) {
          // Bulk delete all records
          let bulkSuccess = false;
          try {
            await clearAllCalibrationRecordsApi();
            bulkSuccess = true;
          } catch (e) {
            console.warn("Bulk clear endpoint fallback, using individual deletes:", e);
          }

          if (!bulkSuccess && records && records.length > 0) {
            const deletePromises = records.map((r) => {
              const id = r._id || r.id;
              if (id && String(id).length > 5) {
                return deleteCalibrationRecordApi(id).catch((err) => console.warn("Item delete skipped:", err));
              }
              return Promise.resolve();
            });
            await Promise.all(deletePromises);
          }
          deletedRecordsCount = records.length;
          setRecords([]);
        } else {
          // Filter matching selected companies and stages
          const targetRecords = records.filter((r) => {
            const matchComp = isAllCompanies || selectedDeleteCompanies.includes(r.clientCompany);
            const matchStg = isAllStages || selectedDeleteStages.includes(r.stage);
            return matchComp && matchStg;
          });

          if (targetRecords.length > 0) {
            const deletePromises = targetRecords.map((r) => {
              const id = r._id || r.id;
              if (id && String(id).length > 5) {
                return deleteCalibrationRecordApi(id).catch((err) => console.warn("Item delete skipped:", err));
              }
              return Promise.resolve();
            });
            await Promise.all(deletePromises);
            deletedRecordsCount = targetRecords.length;
          }
        }
      }

      // 2. Clear Custom Candidates
      if (delCandidates) {
        if (deleteCompanyFilterMode === "selected" && selectedDeleteCompanies.length > 0) {
          setCustomCandidates((prev) => {
            const updated = prev.filter((c) => !selectedDeleteCompanies.includes(c.company));
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("arcl_calibration_custom_candidates", JSON.stringify(updated));
              } catch (e) {}
            }
            return updated;
          });
        } else {
          setCustomCandidates([]);
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("arcl_calibration_custom_candidates");
            } catch (e) {}
          }
        }
      }

      // 3. Clear Dispatch Logs
      if (delLogs) {
        setDispatchHistory([]);
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("arcl_calibration_dispatch_history");
          } catch (e) {}
        }
      }

      // 4. Clear Local Storage Cache
      if (delCache && typeof window !== "undefined") {
        try {
          localStorage.removeItem("arcl_calibration_records");
          localStorage.removeItem("arcl_calibration_custom_candidates");
        } catch (e) {}
      }

      toast.success(
        `Multi-delete completed successfully! ${
          deletedRecordsCount > 0 ? `(${deletedRecordsCount} records removed)` : ""
        } 🗑️✅`
      );

      setIsDeleteManagerOpen(false);
      await fetchData(false);
    } catch (err) {
      console.error("Selective delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete selected data");
    } finally {
      setIsDeletingScope(false);
    }
  };

  const handleAdvanceStage = async (record) => {
    const stages = [
      "SRF Received",
      "Calibration In Progress",
      "Draft Certificate Generated",
      "Quality Reviewed",
      "Invoice Generated",
      "Delivered to Client",
    ];
    const currentIndex = stages.indexOf(record.stage);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      toast.info("Record is already at final stage or custom stage");
      return;
    }
    const nextStage = stages[currentIndex + 1];
    try {
      await updateCalibrationRecordApi(record._id, { stage: nextStage });
      toast.success(`Stage updated to "${nextStage}"`);
      fetchData(false);
    } catch (err) {
      console.error("Advance stage error:", err);
      toast.error("Failed to advance stage");
    }
  };

  const handleSaveTemplate = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("arcl_calibration_reminder_template", JSON.stringify(reminderTemplate));
      } catch (e) {}
    }
    toast.success("Automated Due Reminder Template saved successfully! ✅");
  };

  const handleResetTemplate = () => {
    setReminderTemplate(defaultReminderTemplate);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("arcl_calibration_reminder_template");
      } catch (e) {}
    }
    toast.info("Reminder template reset to default settings.");
  };

  const handleDeleteCandidate = (candId) => {
    setCustomCandidates((prev) => {
      const updated = prev.filter((c) => c.id !== candId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("arcl_calibration_custom_candidates", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    setSelectedDirectoryIds((prev) => prev.filter((id) => id !== candId));
    toast.success("Candidate removed from directory");
  };

  const handleDeleteDirectoryItem = async (recip) => {
    if (recip.isCustom) {
      handleDeleteCandidate(recip.id);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all calibration records for "${recip.company}" from database?`)) return;
    try {
      const matchingRecords = records.filter((r) => r.clientCompany === recip.company);
      if (matchingRecords.length > 0) {
        const deletePromises = matchingRecords.map((r) => {
          const id = r._id || r.id;
          if (id && String(id).length > 5 && !String(id).startsWith("rec-")) {
            return deleteCalibrationRecordApi(id).catch((e) => console.warn(e));
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }
      setRecords((prev) => prev.filter((r) => r.clientCompany !== recip.company));
      setSelectedDirectoryIds((prev) => prev.filter((id) => id !== recip.id));
      toast.success(`Removed records for ${recip.company} from database! 🗑️`);
      fetchData(false);
    } catch (err) {
      console.error("Delete directory item error:", err);
      toast.error("Failed to delete client records");
    }
  };

  const handleDeleteSelectedDirectory = async (recipientGroups) => {
    const selectedRecips = recipientGroups.filter((r) => selectedDirectoryIds.includes(r.id));
    if (selectedRecips.length === 0) {
      toast.warning("Please select at least one recipient to delete!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedRecips.length} selected client(s)/candidate(s)?`)) return;

    try {
      const customIdsToDelete = [];
      const dbCompaniesToDelete = [];

      selectedRecips.forEach((r) => {
        if (r.isCustom) {
          customIdsToDelete.push(r.id);
        } else {
          dbCompaniesToDelete.push(r.company);
        }
      });

      // 1. Delete custom candidates
      if (customIdsToDelete.length > 0) {
        setCustomCandidates((prev) => {
          const updated = prev.filter((c) => !customIdsToDelete.includes(c.id));
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("arcl_calibration_custom_candidates", JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        });
      }

      // 2. Delete database records
      if (dbCompaniesToDelete.length > 0) {
        const targetRecords = records.filter((r) => dbCompaniesToDelete.includes(r.clientCompany));
        const deletePromises = targetRecords.map((r) => {
          const id = r._id || r.id;
          if (id && String(id).length > 5 && !String(id).startsWith("rec-")) {
            return deleteCalibrationRecordApi(id).catch((e) => console.warn(e));
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
        setRecords((prev) => prev.filter((r) => !dbCompaniesToDelete.includes(r.clientCompany)));
      }

      setSelectedDirectoryIds([]);
      toast.success(`Deleted ${selectedRecips.length} selected recipients successfully! 🗑️`);
      fetchData(false);
    } catch (err) {
      console.error("Error deleting selected directory items:", err);
      toast.error("Failed to delete selected items");
    }
  };

  const handleToggleSelectAuditLog = (id) => {
    setSelectedAuditLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllAuditLogs = () => {
    if (selectedAuditLogIds.length === dispatchHistory.length) {
      setSelectedAuditLogIds([]);
    } else {
      setSelectedAuditLogIds(dispatchHistory.map((item) => item.id));
    }
  };

  const handleDeleteSingleAuditLog = (id) => {
    setDispatchHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("arcl_calibration_dispatch_history", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    setSelectedAuditLogIds((prev) => prev.filter((item) => item !== id));
    toast.success("Dispatch log entry removed 🗑️");
  };

  const handleDeleteSelectedAuditLogs = () => {
    if (selectedAuditLogIds.length === 0) {
      toast.warning("Please select at least one log entry to delete!");
      return;
    }
    setDispatchHistory((prev) => {
      const updated = prev.filter((item) => !selectedAuditLogIds.includes(item.id));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("arcl_calibration_dispatch_history", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    toast.success(`Deleted ${selectedAuditLogIds.length} audit log entries 🗑️`);
    setSelectedAuditLogIds([]);
  };

  const handleClearAllAuditLogs = () => {
    if (!window.confirm("Are you sure you want to clear all dispatch history?")) return;
    setDispatchHistory([]);
    setSelectedAuditLogIds([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("arcl_calibration_dispatch_history");
      } catch (e) {}
    }
    toast.info("Cleared audit trail history");
  };

  const handleToggleSelectCandidate = (id) => {
    setSelectedDirectoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCandidates = (recipientsList) => {
    if (selectedDirectoryIds.length === recipientsList.length) {
      setSelectedDirectoryIds([]);
    } else {
      setSelectedDirectoryIds(recipientsList.map((r) => r.id));
    }
  };

  const handleOpenEditCandidate = (recip) => {
    const firstInst = recip.allInstruments?.[0] || {};
    setEditCandidateForm({
      id: recip.id,
      company: recip.company,
      contactPerson: recip.contactPerson,
      email: recip.email,
      phone: recip.phone,
      instrumentName: firstInst.instrument || "Precision Testing Instrument",
      serialNo: firstInst.serialNo || "N/A",
      dueDate: firstInst.calibrationDueDate ? new Date(firstInst.calibrationDueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      isCustom: recip.isCustom,
      rawCandidate: recip.rawCandidate,
      rawRecord: recip.rawRecord,
    });
    setIsEditCandidateModalOpen(true);
  };

  const handleSaveEditedCandidateSubmit = async (e) => {
    e.preventDefault();
    const { id, company, contactPerson, email, phone, instrumentName, serialNo, dueDate, isCustom, rawRecord } = editCandidateForm;

    if (isCustom) {
      setCustomCandidates((prev) => {
        const updated = (Array.isArray(prev) ? prev : []).map((cand) => {
          if (cand.id === id) {
            return {
              ...cand,
              company,
              contactPerson,
              email,
              phone,
              instrumentName,
              serialNo,
              dueDate,
            };
          }
          return cand;
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("arcl_calibration_custom_candidates", JSON.stringify(updated));
          } catch (err) {}
        }
        return updated;
      });
      toast.success(`Candidate record for ${company} updated successfully! ✅`);
    } else {
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec._id === rawRecord?._id || rec.clientCompany === rawRecord?.clientCompany) {
            return {
              ...rec,
              clientCompany: company,
              clientContactPerson: contactPerson,
              clientEmail: email,
              clientPhone: phone,
              instrument: instrumentName || rec.instrument,
              serialNo: serialNo || rec.serialNo,
              calibrationDueDate: dueDate || rec.calibrationDueDate,
            };
          }
          return rec;
        })
      );
      if (rawRecord?._id && !rawRecord._id.startsWith("rec-")) {
        try {
          await updateCalibrationRecordApi(rawRecord._id, {
            clientCompany: company,
            clientContactPerson: contactPerson,
            clientEmail: email,
            clientPhone: phone,
            instrument: instrumentName,
            serialNo: serialNo,
            calibrationDueDate: dueDate,
          });
        } catch (err) {
          console.warn("DB update skipped:", err);
        }
      }
      toast.success(`Client details for ${company} updated successfully! ✅`);
    }
    setIsEditCandidateModalOpen(false);
  };

  const handleDirectEmailDispatch = async (recip) => {
    const toastId = toast.loading(`Dispatching due notice to ${recip.email}...`);
    try {
      await sendCalibrationReminderApi({
        clientEmail: recip.email,
        clientCompany: recip.company,
        contactPerson: recip.contactPerson,
        clientPhone: recip.phone,
        instruments: recip.dueInstruments.length > 0 ? recip.dueInstruments : recip.allInstruments,
        customSubject: (reminderTemplate.subject || "Calibration Due Notice for {{company}}").replace(/{{company}}/gi, recip.company),
        customMessage: reminderTemplate.introMessage,
        labContactPhone: reminderTemplate.labContactPhone,
        labContactEmail: reminderTemplate.labContactEmail,
      });

      recordDispatchLog({
        company: recip.company,
        contactPerson: recip.contactPerson,
        email: recip.email,
        phone: recip.phone,
        channel: "Email (SMTP Direct)",
        subject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, recip.company),
        instrumentsCount: recip.dueInstruments.length || 1,
        status: "Delivered (Direct Dispatch) ✅",
      });

      toast.update(toastId, {
        render: `✉️ Due notice email delivered to ${recip.email}! ✅`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: `Failed to dispatch email to ${recip.email}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleDirectWhatsAppDispatch = (recip) => {
    const targetInstruments = recip.dueInstruments.length > 0 ? recip.dueInstruments : recip.allInstruments;
    const instrumentsSummary = targetInstruments
      .map((i) => `• *${i.instrument}* (S/N: ${i.serialNo || "N/A"}) ➔ 🔴 *Due Date: ${i.calibrationDueDate ? new Date(i.calibrationDueDate).toLocaleDateString("en-GB") : "Due Soon"}*`)
      .join("\n");

    const resolvedIntro = (reminderTemplate.introMessage || "This is an automated quality compliance notice to inform you that testing & measuring instrument(s) registered with ARCL Calibration Laboratory are approaching their annual calibration validity due date. Below is the verified list of instruments due for NABL recalibration:")
      .replace(/{{company}}/gi, recip.company)
      .replace(/{{contactPerson}}/gi, recip.contactPerson)
      .replace(/{{count}}/gi, String(targetInstruments.length));

    let resolvedSubj = (reminderTemplate.subject || "🔴 [URGENT] Calibration Due Notice for {{company}} - ARCL Lab CC-4313")
      .replace(/{{company}}/gi, recip.company)
      .replace(/{{contactPerson}}/gi, recip.contactPerson)
      .replace(/{{count}}/gi, String(targetInstruments.length));

    if (!resolvedSubj.includes("🔴")) {
      resolvedSubj = `🔴 ${resolvedSubj}`;
    }

    const rawMessage =
      `*${resolvedSubj}*\n\n` +
      `Dear ${recip.contactPerson} (${recip.company}),\n` +
      `${resolvedIntro}\n\n` +
      `${instrumentsSummary}\n\n` +
      `Please schedule recalibration pickup or book on-site testing:\n` +
      `https://arclinstruments.com/calibration-services\n\n` +
      `ARCL Metrology Support Desk:\n` +
      `🔴 Phone: ${reminderTemplate.labContactPhone || "+91 6205691085 / +91 8369458583"}\n` +
      `🔴 Email: ${reminderTemplate.labContactEmail || "arclinstruments@gmail.com"}`;

    const cleanPhone = (recip.phone || "8369458583").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawMessage);
      }
    } catch (e) {}

    const waLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMessage)}`;

    window.open(waLink, "_blank");
    toast.success(`💬 WhatsApp opened for ${recip.company}! (Message copied to clipboard)`);
  };

  const handleBulkDispatchSelected = async (recipientGroups, channel = "email") => {
    const selectedRecips = recipientGroups.filter((r) => selectedDirectoryIds.includes(r.id));
    if (selectedRecips.length === 0) {
      toast.warning("Please select at least one recipient!");
      return;
    }

    const toastId = toast.loading(`Dispatching notice to ${selectedRecips.length} selected recipients...`);
    let sentCount = 0;

    for (const recip of selectedRecips) {
      try {
        if (channel === "email" || channel === "both") {
          await sendCalibrationReminderApi({
            clientEmail: recip.email,
            clientCompany: recip.company,
            contactPerson: recip.contactPerson,
            clientPhone: recip.phone,
            instruments: recip.dueInstruments.length > 0 ? recip.dueInstruments : recip.allInstruments,
            customSubject: (reminderTemplate.subject || "Calibration Due Notice for {{company}}").replace(/{{company}}/gi, recip.company),
            customMessage: reminderTemplate.introMessage,
            labContactPhone: reminderTemplate.labContactPhone,
            labContactEmail: reminderTemplate.labContactEmail,
          });

          recordDispatchLog({
            company: recip.company,
            contactPerson: recip.contactPerson,
            email: recip.email,
            phone: recip.phone,
            channel: channel === "both" ? "Email (SMTP) + WA" : "Email (SMTP Direct)",
            subject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, recip.company),
            instrumentsCount: recip.dueInstruments.length || 1,
            status: "Delivered (Bulk Selection) ✅",
          });
          sentCount++;
        }
      } catch (err) {
        console.error("Bulk dispatch error for:", recip.company, err);
      }
    }

    if (channel === "whatsapp" || channel === "both") {
      selectedRecips.forEach((r) => handleDirectWhatsAppDispatch(r));
    }

    toast.update(toastId, {
      render: `🚀 Dispatched notices to ${sentCount || selectedRecips.length} selected client organization(s)! ✅`,
      type: "success",
      isLoading: false,
      autoClose: 5000,
    });
    setSelectedDirectoryIds([]);
  };

  const handleExportDirectoryCSV = (filteredRecipients, days) => {
    const headers = [
      "Sr No",
      "Client Company",
      "Contact Person",
      "Recipient Email",
      "WhatsApp Mobile",
      "Total Instruments Registered",
      `Due Instruments (${days}d)`,
      "Reminder Status",
      "Due Instrument Details",
    ];

    const rows = filteredRecipients.map((r, i) => {
      const isDue = r.dueInstruments.length > 0;
      const statusStr = isDue ? `Due Soon (${r.dueInstruments.length} Due)` : "Up to Date";
      const instDetails = r.allInstruments.map((inst) => `${inst.instrument} [S/N: ${inst.serialNo || "N/A"}] (Due: ${inst.calibrationDueDate || "N/A"})`).join(" | ");
      return [
        i + 1,
        `"${r.company}"`,
        `"${r.contactPerson}"`,
        `"${r.email}"`,
        `"${r.phone}"`,
        r.allInstruments.length,
        r.dueInstruments.length,
        `"${statusStr}"`,
        `"${instDetails}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARCL_Recipients_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Recipients Directory exported to CSV successfully! 📊");
  };

  const handleSendManualCustomDispatch = async (channel = "email") => {
    const { company, contactPerson, email, phone } = manualDispatchForm;
    if (!email && !phone) {
      toast.warning("Please provide email or phone number!");
      return;
    }

    const toastId = toast.loading(`Dispatching notice to ${email || phone}...`);
    try {
      const res = await sendCalibrationReminderApi({
        clientEmail: email || "harsh.mishra9023@gmail.com",
        clientCompany: company || "Registered Organization",
        contactPerson: contactPerson || "Quality Head",
        clientPhone: phone || "9369962486",
        customSubject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, company || "Valued Client"),
        customMessage: reminderTemplate.introMessage,
        labContactPhone: reminderTemplate.labContactPhone,
        labContactEmail: reminderTemplate.labContactEmail,
      });

      const waLink = res.data?.data?.whatsappLink;

      if (channel === "email" || channel === "both") {
        recordDispatchLog({
          company: company || "Manual Entry",
          contactPerson: contactPerson || "Quality Manager",
          email: email || "arclinstruments@gmail.com",
          phone: phone || "+91 8009559900",
          channel: channel === "both" ? "Email + WhatsApp" : "Email (SMTP Direct)",
          subject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, company || "Client"),
          instrumentsCount: 1,
          status: "Delivered (Manual Entry) ✅",
        });

        toast.update(toastId, {
          render: `✉️ Notice successfully emailed to ${email}! ✅`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
      }

      if (channel === "whatsapp" || channel === "both") {
        const clientRecords = records.filter((r) => r.clientCompany === (company || ""));
        const targetInstruments = clientRecords.length > 0 ? clientRecords : [
          { instrument: "Testing & Measuring Equipment", serialNo: "N/A", calibrationDueDate: new Date() }
        ];

        const instrumentsSummary = targetInstruments
          .map((i) => `• *${i.instrument}* (S/N: ${i.serialNo || "N/A"}) \u2794 \uD83D\uDD34 *Due Date: ${i.calibrationDueDate ? new Date(i.calibrationDueDate).toLocaleDateString("en-GB") : "Due Soon"}*`)
          .join("\n");

        const resolvedIntro = (reminderTemplate.introMessage || "This is an automated quality compliance notice to inform you that testing & measuring instrument(s) registered with ARCL Calibration Laboratory are approaching their annual calibration validity due date. Below is the verified list of instruments due for NABL recalibration:")
          .replace(/{{company}}/gi, company || "Valued Client")
          .replace(/{{contactPerson}}/gi, contactPerson || "Quality Head")
          .replace(/{{count}}/gi, String(targetInstruments.length));

        let resolvedSubj = (reminderTemplate.subject || "\uD83D\uDD34 [URGENT] Calibration Due Notice for {{company}} - ARCL Lab CC-4313")
          .replace(/{{company}}/gi, company || "Valued Client")
          .replace(/{{contactPerson}}/gi, contactPerson || "Quality Head")
          .replace(/{{count}}/gi, String(targetInstruments.length));

        if (!resolvedSubj.includes("\uD83D\uDD34") && !resolvedSubj.includes("🔴")) {
          resolvedSubj = `\uD83D\uDD34 ${resolvedSubj}`;
        }

        const rawMessage =
          `*${resolvedSubj}*\n\n` +
          `Dear ${contactPerson || "Quality Manager"} (${company || "Valued Client"}),\n` +
          `${resolvedIntro}\n\n` +
          `${instrumentsSummary}\n\n` +
          `Please schedule recalibration pickup or book on-site testing:\n` +
          `https://arclinstruments.com/calibration-services\n\n` +
          `ARCL Metrology Support Desk:\n` +
          `🔴 Phone: ${reminderTemplate.labContactPhone || "+91 6205691085 / +91 8369458583"}\n` +
          `🔴 Email: ${reminderTemplate.labContactEmail || "arclinstruments@gmail.com"}`;

        const cleanPhone = (phone || "8369458583").replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

        try {
          if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(rawMessage);
          }
        } catch (e) {}

        const waLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMessage)}`;

        window.open(waLink, "_blank");
        toast.success(`💬 WhatsApp opened for ${phone}! (Message copied to clipboard)`);
      }

      setIsManualModalOpen(false);
    } catch (err) {
      toast.update(toastId, {
        render: "Failed to dispatch manual notice",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // ==========================================
  // DYNAMIC AUTOMATED DUE REMINDER TEMPLATE STATE
  // ==========================================
  const defaultReminderTemplate = {
    subject: "🔴 [URGENT] Calibration Due Notice for {{company}} - ARCL Lab CC-4313",
    salutation: "Dear {{contactPerson}} ({{company}}),",
    introMessage: "This is an automated quality compliance notice to inform you that {{count}} testing & measuring instrument(s) registered with ARCL Calibration Laboratory are approaching their annual calibration validity due date. Below is the verified list of instruments due for NABL recalibration:",
    thresholdDays: "30",
    labContactPhone: "+91 6205691085 / +91 8369458583",
    labContactEmail: "arclinstruments@gmail.com",
    labScope: "NABL ACCREDITED LABORATORY (CC-4313) • ISO/IEC 17025:2017",
    footerNote: "Need on-site calibration or immediate pickup? Contact our Metrology Desk.",
    actionBtnText: "Schedule Calibration & Pickup Online →",
  };

  const [reminderTemplate, setReminderTemplate] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("arcl_calibration_reminder_template");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.labContactPhone && (parsed.labContactPhone.includes("8009559900") || !parsed.labContactPhone)) {
            parsed.labContactPhone = "+91 6205691085 / +91 8369458583";
          }
          if (parsed.subject && !parsed.subject.includes("🔴")) {
            parsed.subject = `🔴 ${parsed.subject.replace(/^[🔴\s*]+/, "")}`;
          }
          return { ...defaultReminderTemplate, ...parsed };
        }
      } catch (e) {}
    }
    return defaultReminderTemplate;
  });

  const [templatePreviewMode, setTemplatePreviewMode] = useState("email"); // 'email', 'whatsapp'
  const [reminderSelectedClient, setReminderSelectedClient] = useState("all");
  const [dispatchAudienceMode, setDispatchAudienceMode] = useState("single"); // 'single' | 'multiple'
  const [selectedBatchCompanies, setSelectedBatchCompanies] = useState([]);
  const [customModalSubject, setCustomModalSubject] = useState("");
  const [customModalMessage, setCustomModalMessage] = useState("");
  const [isCustomizingModalMessage, setIsCustomizingModalMessage] = useState(false);

  const allAvailableDocOptions = [
    { type: "quotation", title: "Commercial Quotation & Cost Estimate", icon: "FaFilePdf", color: "text-red-500", desc: "Quotation PDF with pricing & terms" },
    { type: "po", title: "Purchase Order Document (PO)", icon: "FaFilePdf", color: "text-blue-500", desc: "Client verified purchase order" },
    { type: "pi", title: "Proforma Invoice (PI)", icon: "FaFilePdf", color: "text-amber-500", desc: "Advance proforma invoice copy" },
    { type: "tax_invoice", title: "Tax Invoice & GST Commercial Document", icon: "FaFilePdf", color: "text-purple-500", desc: "Final GST billed tax invoice" },
    { type: "certificate", title: "Official NABL Calibration Certificate (ISO 17025)", icon: "FaCertificate", color: "text-emerald-600", desc: "Signed calibration certificate" },
    { type: "recordExcel", title: "Observation Sheet & Calibration Readings", icon: "FaFileExcel", color: "text-teal-600", desc: "Master laboratory test readings" },
    { type: "srf", title: "Service Request Form (SRF Slip)", icon: "FaFilePdf", color: "text-indigo-600", desc: "Lab intake reception receipt" },
  ];

  const handleOpenSendDocModal = (docType = "quotation", record) => {
    const docLabels = {
      quotation: "Commercial Quotation & Cost Estimate (PDF)",
      po: "Purchase Order Document (PO PDF)",
      pi: "Proforma Invoice Document (PI PDF)",
      tax_invoice: "Tax Invoice & GST Commercial Document (PDF)",
      certificate: "Official NABL Calibration Certificate (PDF)",
      recordExcel: "Observation Sheet & Calibration Readings (Excel/PDF)",
      srf: "Service Request Form (SRF Slip PDF)",
    };

    setDocToSend({
      docType,
      docTitle: docLabels[docType] || "SRF Document PDF",
      record,
    });
    setSelectedDocTypes(docType === "all" ? allAvailableDocOptions.map((d) => d.type) : [docType]);
    setDocTargetEmail(record?.clientEmail || "harsh.mishra9023@gmail.com");
    setDocTargetPhone(record?.clientPhone || "+91 9369962486");
    setDocCustomNote("");
    setIsSendDocModalOpen(true);
  };

  const toggleSelectDocType = (dt) => {
    if (selectedDocTypes.includes(dt)) {
      if (selectedDocTypes.length === 1) {
        toast.warning("Kam se kam ek document select rehna chahiye!");
        return;
      }
      setSelectedDocTypes(selectedDocTypes.filter((t) => t !== dt));
    } else {
      setSelectedDocTypes([...selectedDocTypes, dt]);
    }
  };

  const handleSelectAllDocs = () => {
    if (selectedDocTypes.length === allAvailableDocOptions.length) {
      setSelectedDocTypes(["quotation"]);
    } else {
      setSelectedDocTypes(allAvailableDocOptions.map((d) => d.type));
    }
  };

  const handleDispatchSpecificDoc = async (channel = "email") => {
    if (!docToSend || !docToSend.record) return;
    const r = docToSend.record;
    const email = (docTargetEmail || r.clientEmail || "harsh.mishra9023@gmail.com").trim();
    const phone = (docTargetPhone || r.clientPhone || "9369962486").trim();
    const company = r.clientCompany || "Valued Client";
    const person = r.clientContactPerson || "Quality Manager";

    const activeSelected = selectedDocTypes && selectedDocTypes.length > 0 ? selectedDocTypes : ["quotation"];
    const docLabelsMap = {
      quotation: "Commercial Quotation",
      po: "PO Document",
      pi: "Proforma Invoice",
      tax_invoice: "Tax Invoice",
      certificate: "NABL Certificate",
      recordExcel: "Readings Sheet",
      srf: "SRF Slip",
    };
    const summaryTitles = activeSelected.map((dt) => docLabelsMap[dt] || dt).join(", ");
    const isMulti = activeSelected.length > 1;

    const toastId = toast.loading(`Dispatching ${activeSelected.length} document(s) to ${company}...`);

    try {
      const res = await sendSpecificDocumentApi({
        recordId: r._id || r.id,
        docType: activeSelected[0],
        selectedDocTypes: activeSelected,
        docTitle: summaryTitles,
        clientEmail: email,
        clientPhone: phone,
        clientCompany: company,
        contactPerson: person,
        instrument: r.instrument,
        serialNo: r.serialNo,
        certificateNo: r.records?.certificateNo,
        dcNo: r.dcNo,
        customNote: docCustomNote,
        taxInvoiceData: r.taxInvoiceData,
        quotationData: r.quotationData,
        proformaData: r.proformaData,
        poData: r.poData,
      });

      const waLink = res.data?.data?.whatsappLink;

      // 1. Email Send Log
      if (channel === "email" || channel === "both") {
        recordDispatchLog({
          company,
          contactPerson: person,
          email,
          phone,
          channel: channel === "both" ? "Email (SMTP) + WhatsApp" : "Email (SMTP Direct)",
          subject: isMulti
            ? `[SRF PACKAGE: ${activeSelected.length} DOCS] For ${r.instrument} (${r.serialNo})`
            : `[${summaryTitles.toUpperCase()}] For ${r.instrument}`,
          instrumentsCount: activeSelected.length,
          status: `Delivered (${activeSelected.length} Doc(s)) ✅`,
        });

        toast.update(toastId, {
          render: `✉️ ${activeSelected.length} document(s) successfully delivered to ${email}! ✅`,
          type: "success",
          isLoading: false,
          autoClose: 5000,
        });
      }

      // 2. WhatsApp Send
      if (channel === "whatsapp" || channel === "both") {
        if (waLink) {
          window.open(waLink, "_blank");
          toast.success(`💬 Opened WhatsApp with ${activeSelected.length} document(s) notice for ${phone}!`);
        }
        if (channel === "whatsapp") {
          recordDispatchLog({
            company,
            contactPerson: person,
            email,
            phone,
            channel: "WhatsApp Web",
            subject: `[${summaryTitles.toUpperCase()}] For ${r.instrument}`,
            instrumentsCount: activeSelected.length,
            status: `Dispatched (WhatsApp Link) ✅`,
          });
        }
      }

      setIsSendDocModalOpen(false);
    } catch (err) {
      console.error("Document dispatch error:", err);
      toast.update(toastId, {
        render: `Failed to dispatch documents: ${err.response?.data?.message || err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // PO Custom Document Upload (From Gallery/Device) Handlers
  const [uploadingPoId, setUploadingPoId] = useState(null);
  const poFileInputRef = React.useRef(null);
  const [activePoUploadTarget, setActivePoUploadTarget] = useState(null);

  const handleTriggerPoUpload = (record) => {
    setActivePoUploadTarget(record);
    if (poFileInputRef.current) {
      poFileInputRef.current.value = "";
      poFileInputRef.current.click();
    }
  };

  const handlePoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activePoUploadTarget) return;

    const toastId = toast.loading(`Uploading PO "${file.name}" from gallery/device...`);
    setUploadingPoId(activePoUploadTarget._id);
    try {
      const formData = new FormData();
      formData.append("poFile", file);
      formData.append("recordId", activePoUploadTarget._id);
      if (activePoUploadTarget.dcNo) formData.append("dcNo", activePoUploadTarget.dcNo);
      if (activePoUploadTarget.clientCompany) formData.append("clientCompany", activePoUploadTarget.clientCompany);
      if (activePoUploadTarget.serialNo) formData.append("serialNo", activePoUploadTarget.serialNo);

      const res = await uploadPoApi(formData);
      const uploadedUrl = res.data?.data?.poFileUrl;
      const uploadedName = res.data?.data?.poFileName || file.name;

      // Instantly update local React state so UI turns GREEN and View button works immediately
      setRecords((prev) =>
        prev.map((rec) => {
          const isTarget =
            rec._id === activePoUploadTarget._id ||
            (activePoUploadTarget.dcNo && rec.dcNo === activePoUploadTarget.dcNo && rec.clientCompany === activePoUploadTarget.clientCompany) ||
            rec.serialNo === activePoUploadTarget.serialNo;
          if (isTarget) {
            return {
              ...rec,
              commercialDocs: {
                ...rec.commercialDocs,
                poFileUrl: uploadedUrl,
                poRaised: uploadedUrl,
                poFileName: uploadedName,
                poUploadedAt: new Date().toISOString(),
              },
            };
          }
          return rec;
        })
      );

      toast.update(toastId, {
        render: `📄 PO Document "${file.name}" uploaded successfully! ✅`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
      fetchData(false);
    } catch (err) {
      console.error("PO Upload Error:", err);
      toast.update(toastId, {
        render: `Failed to upload PO: ${err.response?.data?.message || err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setUploadingPoId(null);
      setActivePoUploadTarget(null);
    }
  };

  const handleDeletePoFile = async (record) => {
    if (!window.confirm(`Are you sure you want to remove the uploaded PO document for "${record.clientCompany || "this client"}"?`)) return;
    const toastId = toast.loading("Removing PO document...");
    try {
      await deletePoApi({
        recordId: record._id,
        dcNo: record.dcNo,
        clientCompany: record.clientCompany,
        serialNo: record.serialNo,
      });

      // Instantly clear local state
      setRecords((prev) =>
        prev.map((rec) => {
          const isTarget =
            rec._id === record._id ||
            (record.dcNo && rec.dcNo === record.dcNo && rec.clientCompany === record.clientCompany) ||
            rec.serialNo === record.serialNo;
          if (isTarget) {
            return {
              ...rec,
              commercialDocs: {
                ...rec.commercialDocs,
                poFileUrl: "",
                poRaised: "",
                poFileName: "",
                poUploadedAt: null,
              },
            };
          }
          return rec;
        })
      );

      toast.update(toastId, {
        render: "PO document removed successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchData(false);
    } catch (err) {
      toast.update(toastId, {
        render: `Failed to remove PO: ${err.response?.data?.message || err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  // Safe Universal Interactive Viewer for Uploaded PO Document (Handles In-App Preview, Blob, Data URI & Remote)
  const handleViewPoDocument = (record) => {
    let poUrl =
      record?.commercialDocs?.poFileUrl ||
      record?.items?.find((i) => i.commercialDocs?.poFileUrl)?.commercialDocs?.poFileUrl ||
      record?.commercialDocs?.poRaised;

    if (!poUrl || poUrl === "/docs/sample-po.pdf" || poUrl.trim() === "") {
      toast.info("No custom PO document uploaded yet for this equipment. Please click 'Upload PO'.");
      return;
    }

    const fileName =
      record?.commercialDocs?.poFileName ||
      record?.items?.find((i) => i.commercialDocs?.poFileName)?.commercialDocs?.poFileName ||
      `PO_${record?.serialNo || "Document"}.pdf`;

    let fileType = "pdf";
    if (
      poUrl.startsWith("data:image/") ||
      /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(poUrl) ||
      /\.(png|jpe?g|webp|gif|bmp)$/i.test(fileName)
    ) {
      fileType = "image";
    }

    let previewUrl = poUrl;
    if (poUrl.startsWith("data:")) {
      try {
        const parts = poUrl.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (fileType === "image" ? "image/png" : "application/pdf");
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        previewUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn("Blob creation fallback, using raw URI:", err);
        previewUrl = poUrl;
      }
    } else if (fileType === "pdf" && (poUrl.startsWith("http://") || poUrl.startsWith("https://"))) {
      // Universal embedded PDF viewer prevents Chrome/Edge "Failed to load PDF document" on cross-origin cloud assets
      previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(poUrl)}&embedded=true`;
    }

    setPoPreviewData({
      url: previewUrl,
      directUrl: poUrl,
      fileName,
      record,
      fileType,
    });
    setIsPoPreviewModalOpen(true);
  };

  const handleDownloadActivePo = () => {
    const targetUrl = poPreviewData.directUrl || poPreviewData.url;
    if (!targetUrl) return;
    try {
      const link = document.createElement("a");
      link.href = targetUrl;
      link.download = poPreviewData.fileName || "PO_Document.pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading "${poPreviewData.fileName || "PO_Document"}" 📥`);
    } catch (err) {
      window.open(targetUrl, "_blank");
    }
  };

  const handleOpenActivePoNewTab = () => {
    const targetUrl = poPreviewData.directUrl || poPreviewData.url;
    if (targetUrl) {
      window.open(targetUrl, "_blank");
    }
  };

  // Quick Toggle Sticker Check
  const handleToggleSticker = async (record) => {
    try {
      const newVal = !record.records?.stickerCheck;
      await updateCalibrationRecordApi(record._id, { "records.stickerCheck": newVal });
      toast.success(`Sticker check marked ${newVal ? "Yes ✅" : "No ❌"}`);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to update sticker status");
    }
  };

  // Quick Cycle Payment Status
  const handleCyclePayment = async (record) => {
    const current = record.commercialDocs?.paymentStatus || "Paid";
    const nextStatus = current === "Paid" ? "Pending" : current === "Pending" ? "Partial" : "Paid";
    try {
      await updateCalibrationRecordApi(record._id, { "commercialDocs.paymentStatus": nextStatus });
      toast.success(`Payment status changed to ${nextStatus}`);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to update payment status");
    }
  };

  
  // Quick Cycle Draft Status
  const handleCycleDraftStatus = async (record) => {
    const current = record.draftStatus || "Pending Approval";
    const nextStatus =
      current === "Pending Approval"
        ? "Approved"
        : current === "Approved"
        ? "Correction Suggested"
        : "Pending Approval";

    try {
      await updateCalibrationRecordApi(record._id, { draftStatus: nextStatus });
      toast.success(`Certificate draft status updated to "${nextStatus}"`);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to update draft status");
    }
  };

  // Quick Change Stage directly
  const handleChangeStage = async (record, newStage) => {
    try {
      await updateCalibrationRecordApi(record._id, { stage: newStage });
      toast.success(`Stage updated to "${newStage}"`);
      fetchData(false);
    } catch (err) {
      toast.error("Failed to change stage");
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = [
      "Sr No",
      "Instrument",
      "Make",
      "Model No",
      "Serial No",
      "Range",
      "Calib Date",
      "Due Date",
      "DC No",
      "Lab Name",
      "Payment Status",
      "Certificate No",
      "Stage",
    ];

    const rows = filteredRecords.map((r, i) => [
      i + 1,
      `"${r.instrument}"`,
      `"${r.make}"`,
      `"${r.modelNo}"`,
      `"${r.serialNo}"`,
      `"${r.instrumentRange}"`,
      r.calibrationDate ? new Date(r.calibrationDate).toLocaleDateString("en-GB") : "",
      r.calibrationDueDate ? new Date(r.calibrationDueDate).toLocaleDateString("en-GB") : "",
      `"${r.dcNo}"`,
      `"${r.sentToLab}"`,
      r.commercialDocs?.paymentStatus || "Pending",
      r.records?.certificateNo || "",
      r.stage || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARCL_Calibration_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Calibration history exported to CSV/Excel successfully!");
  };

  
  
  // Send Certificate to Client (Email + WhatsApp)
  const handleDeliverCertificate = async (record) => {
    if (!record) return;
    try {
      const res = await sendCertificateDeliveryApi({
        recordId: record._id,
        clientEmail: record.clientEmail,
        clientCompany: record.clientCompany,
        contactPerson: record.clientContactPerson,
        clientPhone: record.clientPhone,
        instrument: record.instrument,
        serialNo: record.serialNo,
        certificateNo: record.records?.certificateNo,
        calibrationDate: record.calibrationDate,
        calibrationDueDate: record.calibrationDueDate,
      });

      const waLink = res.data?.data?.whatsappLink;
      toast.success("Certificate Delivery Notice sent to client email!");

      if (waLink) {
        if (window.confirm("Email sent! Would you also like to open WhatsApp to send the certificate link directly to client?")) {
          window.open(waLink, "_blank");
        }
      }
    } catch (err) {
      console.error("Delivery error:", err);
      toast.error("Failed to dispatch certificate delivery notice");
    }
  };

  // Confirm Batch Dispatch Modal Trigger
  const handleOpenBatchConfirm = () => {
    setIsBatchConfirmOpen(true);
  };

  // Trigger Batch Automatic Reminders for ALL Clients with Dynamic Template
  const handleAutoDispatchAll = async () => {
    setIsBatchConfirmOpen(false);
    const days = parseInt(reminderTemplate.thresholdDays, 10) || 30;
    const toastId = toast.loading(`Auto-dispatching due reminders (within ${days} days window)...`);
    try {
      const res = await autoDispatchAllDueRemindersApi({
        thresholdDays: reminderTemplate.thresholdDays,
        customSubject: reminderTemplate.subject,
        customMessage: reminderTemplate.introMessage,
        labContactPhone: reminderTemplate.labContactPhone,
        labContactEmail: reminderTemplate.labContactEmail,
      });
      const count = res.data?.data?.totalClientsNotified || 0;
      const instrumentsCount = res.data?.data?.totalInstrumentsDue || 0;
      const batchSummary = res.data?.data?.batchSummary || [];

      // Record logs for each recipient
      batchSummary.forEach((item) => {
        recordDispatchLog({
          company: item.company,
          contactPerson: "Quality Manager",
          email: item.email,
          phone: reminderTemplate.labContactPhone,
          channel: "Email (SMTP Auto-Cron)",
          subject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, item.company),
          instrumentsCount: item.instrumentsCount || 1,
          status: "Delivered (Batch Dispatch) ✅",
        });
      });

      toast.update(toastId, {
        render: `Batch reminders dispatched to ${count} client organization(s) for ${instrumentsCount} instrument(s)!`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (err) {
      toast.update(toastId, {
        render: "Failed to auto-dispatch batch reminders",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // Open Single Client Reminder Modal from Tab 3 or anywhere with dynamic prefilled message
  const handleOpenSingleReminderModal = (clientName = "") => {
    const target = clientName || (reminderSelectedClient && reminderSelectedClient !== "all" ? reminderSelectedClient : uniqueClients[0] || "Sumeet Industries Pvt. Ltd.");
    const customCand = customCandidates.find((c) => c.company === target || c.id === target);
    const clientRecords = records.filter((r) => r.clientCompany === target);
    const clientRecord = clientRecords[0] || records.find((r) => r.clientCompany === target);
    const person = customCand?.contactPerson || clientRecord?.clientContactPerson || "Quality Manager";
    const company = customCand?.company || target;
    const count = clientRecords.length > 0 ? clientRecords.length : 1;

    setSelectedReminderClient(company);
    setSelectedReminderRecord(null); // Clear single instrument focus to send for entire company's due items
    setCustomReminderEmail(customCand?.email || clientRecord?.clientEmail || "harsh.mishra9023@gmail.com");
    setCustomReminderPhone(customCand?.phone || clientRecord?.clientPhone || "+91 9369962486");

    // Dynamic prefill
    setCustomModalSubject(
      (reminderTemplate.subject || "[URGENT] Calibration Due Notice for {{company}} - ARCL Lab CC-4313")
        .replace(/{{company}}/gi, company)
        .replace(/{{contactPerson}}/gi, person)
        .replace(/{{count}}/gi, String(count))
    );
    setCustomModalMessage(
      (reminderTemplate.introMessage || "This is an automated quality compliance notice to inform you that {{count}} testing & measuring instrument(s) registered with ARCL Calibration Laboratory are approaching their annual calibration validity due date.")
        .replace(/{{company}}/gi, company)
        .replace(/{{contactPerson}}/gi, person)
        .replace(/{{count}}/gi, String(count))
    );
    setIsCustomizingModalMessage(false);
    setIsReminderModalOpen(true);
  };

  // Click 🔔 bell on table row -> Open Interactive Choice Modal (Mail / WhatsApp / Both) with Dynamic Prefill
  const handleSendInstrumentReminder = (record) => {
    setSelectedReminderRecord(record);
    setSelectedReminderClient(record.clientCompany || "Tata Projects Ltd.");
    setCustomReminderEmail(record.clientEmail || "harsh.mishra9023@gmail.com");
    setCustomReminderPhone(record.clientPhone || "8009559900");

    const person = record.clientContactPerson || "Quality Manager";
    const company = record.clientCompany || "Valued Client";

    setCustomModalSubject(
      `[URGENT] Calibration Due Notice for ${record.instrument} (${record.serialNo}) - ARCL Lab CC-4313`
    );
    setCustomModalMessage(
      `This is an automated quality notice from ARCL Calibration Laboratory (NABL CC-4313). Your instrument *${record.instrument}* (Model: ${record.modelNo || "-"}, S/N: ${record.serialNo}) is due for annual recalibration on 🔴 *${record.calibrationDueDate ? new Date(record.calibrationDueDate).toLocaleDateString("en-GB") : "Due Soon"}*. Please arrange for pickup or on-site testing.`
    );
    setIsCustomizingModalMessage(false);
    setIsReminderModalOpen(true);
  };

  // 1. Dispatch Email Only (Bus Mail pe bhejo) with Dynamic Custom Subject & Message
  const handleDispatchEmailFromModal = async () => {
    const targetEmail = (customReminderEmail || "harsh.mishra9023@gmail.com").trim();
    const targetCompany = selectedReminderClient || (selectedReminderRecord?.clientCompany) || "Valued Client";
    const activeRec = selectedReminderRecord || records.find((r) => r.clientCompany === targetCompany);
    const contactPerson = activeRec?.clientContactPerson || "Quality Manager";
    const targetInstruments = selectedReminderRecord
      ? [selectedReminderRecord]
      : records.filter((r) => r.clientCompany === targetCompany);

    const toastId = toast.loading(`Sending calibration reminder email to ${targetEmail}...`);

    try {
      await sendCalibrationReminderApi({
        clientEmail: targetEmail,
        clientCompany: targetCompany,
        contactPerson: contactPerson,
        clientPhone: customReminderPhone || activeRec?.clientPhone || "8009559900",
        instrumentId: selectedReminderRecord?._id,
        instruments: targetInstruments.length > 0 ? targetInstruments : undefined,
        customSubject: customModalSubject,
        customMessage: customModalMessage,
        labContactPhone: reminderTemplate.labContactPhone,
        labContactEmail: reminderTemplate.labContactEmail,
        labScopeText: reminderTemplate.labScope,
        customFooterText: reminderTemplate.footerNote,
      });

      recordDispatchLog({
        company: targetCompany,
        contactPerson: contactPerson,
        email: targetEmail,
        phone: customReminderPhone || activeRec?.clientPhone || "8009559900",
        channel: "Email (SMTP Direct)",
        subject: customModalSubject || `Calibration Due Notice for ${targetCompany}`,
        instrumentsCount: targetInstruments.length || 1,
        status: "Delivered (Direct Email) ✅",
      });

      toast.update(toastId, {
        render: `✉️ Email successfully delivered to ${targetEmail}! ✅`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      setIsReminderModalOpen(false);
    } catch (err) {
      console.error("Email dispatch error:", err);
      toast.update(toastId, {
        render: "Failed to send email. Please check SMTP settings.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // 2. Open WhatsApp Only (Bus WhatsApp pe bhejo) with Dynamic Custom Text
  const handleDispatchWhatsAppFromModal = () => {
    const targetCompany = selectedReminderClient || (selectedReminderRecord?.clientCompany) || (reminderSelectedClient && reminderSelectedClient !== "all" ? reminderSelectedClient : uniqueClients[0]) || "Valued Client";
    const activeRec = selectedReminderRecord || (records.find((r) => r.clientCompany === targetCompany)) || records[0];
    const person = activeRec?.clientContactPerson || "Quality Manager";
    const company = targetCompany;
    const targetInstruments = selectedReminderRecord
      ? [selectedReminderRecord]
      : records.filter((r) => r.clientCompany === company);

    const instList = targetInstruments.length > 0 ? targetInstruments : [
      { instrument: "Testing Instrument", serialNo: "N/A", calibrationDueDate: new Date(), make: "ARCL", modelNo: "CTM-2000" }
    ];

    const instrumentsSummary = instList
      .map((i) => `• *${i.instrument}* (S/N: ${i.serialNo}) ➔ 🔴 *Due Date: ${i.calibrationDueDate ? new Date(i.calibrationDueDate).toLocaleDateString("en-GB") : "Due Soon"}*`)
      .join("\n");

    const resolvedIntro = (customModalMessage || reminderTemplate.introMessage || `This is an automated calibration due alert for your equipment:`)
      .replace(/{{company}}/gi, company)
      .replace(/{{contactPerson}}/gi, person)
      .replace(/{{count}}/gi, String(instList.length));

    let resolvedSubj = (customModalSubject || reminderTemplate.subject || "🔴 [URGENT] Calibration Due Notice for {{company}} - ARCL Lab CC-4313")
      .replace(/{{company}}/gi, company)
      .replace(/{{contactPerson}}/gi, person)
      .replace(/{{count}}/gi, String(instList.length));

    if (!resolvedSubj.includes("🔴")) {
      resolvedSubj = `🔴 ${resolvedSubj}`;
    }

    const rawMessage =
      `*${resolvedSubj}*\n\n` +
      `Dear ${person} (${company}),\n` +
      `${resolvedIntro}\n\n` +
      `${instrumentsSummary}\n\n` +
      `Please schedule recalibration pickup or book on-site testing:\n` +
      `https://arclinstruments.com/calibration-services\n\n` +
      `ARCL Metrology Support Desk:\n` +
      `🔴 Phone: ${reminderTemplate.labContactPhone || "+91 6205691085 / +91 8369458583"}\n` +
      `🔴 Email: ${reminderTemplate.labContactEmail || "arclinstruments@gmail.com"}`;

    const targetPhone = customReminderPhone || activeRec?.clientPhone || "8369458583";
    const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawMessage);
      }
    } catch (e) {}

    const waLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMessage)}`;

    window.open(waLink, "_blank");
    toast.success(`💬 Opened WhatsApp with pre-filled calibration notice for +${formattedPhone}! (Message copied to clipboard)`);
    setIsReminderModalOpen(false);
  };

  // 3. Dispatch Both Email + WhatsApp (Dono pe bhejo)
  const handleDispatchBothFromModal = async () => {
    await handleDispatchEmailFromModal();
    handleDispatchWhatsAppFromModal();
  };

  // Send Single Client Reminder from Modal
  const handleSendSingleClientReminder = async (viaWhatsApp = false) => {
    const clientRecords = records.filter((r) => r.clientCompany === selectedReminderClient);
    try {
      await sendCalibrationReminderApi({
        clientEmail: customReminderEmail,
        clientCompany: selectedReminderClient,
        clientPhone: customReminderPhone,
        instruments: clientRecords.length > 0 ? clientRecords : undefined,
      });

      if (viaWhatsApp) {
        handleDispatchWhatsAppFromModal();
      } else {
        toast.success(`Due reminder email dispatched to ${customReminderEmail} (${selectedReminderClient})!`);
        if (window.confirm("Email sent! Would you like to also open WhatsApp to send notice to client?")) {
          handleDispatchWhatsAppFromModal();
        }
      }
      setIsReminderModalOpen(false);
    } catch (err) {
      toast.error("Failed to send reminder notice");
    }
  };

  // Trigger automated reminder
  const handleSendReminder = async () => {
    try {
      await sendCalibrationReminderApi({
        clientEmail: "arclinstruments@gmail.com",
        clientCompany: "Sumeet Industries Pvt. Ltd.",
      });
      toast.success("Automatic Due Date Reminder sent successfully via Email & WhatsApp!");
      setIsReminderModalOpen(false);
    } catch (err) {
      toast.error("Failed to send reminder");
    }
  };

  // Open Document Modal
  const openDocViewer = (docType, record) => {
    if (docType === "quotation") {
      handleOpenQuotationEditor(record);
      return;
    }
    if (docType === "tax_invoice" || docType === "invoice") {
      handleOpenTaxInvoiceEditor(record);
      return;
    }
    if (docType === "pi" || docType === "proforma_invoice") {
      handleOpenProformaEditor(record);
      return;
    }
    if (docType === "po" || docType === "purchase_order") {
      handleOpenPoEditor(record);
      return;
    }
    // Fallback for certificate / observation sheet / srf
    setSelectedDoc({
      type: docType,
      record,
    });
    setIsDocModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hidden PO Document File Picker */}
      <input
        type="file"
        ref={poFileInputRef}
        onChange={handlePoFileChange}
        accept=".pdf,image/*,.doc,.docx"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#021C57] via-[#0B2A72] to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            <FaCertificate /> CALIBRATIONPRO • QA & LAB PORTAL
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            Calibration & QA Laboratory Management
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            NABL ISO/IEC 17025 Accredited (CC-4313) • Live Status Tracking • SRF Commercials • Scientific Tools
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
              autoSync
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
            title="Click to toggle live polling"
          >
            <span className={`w-2 h-2 rounded-full ${autoSync ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            {autoSync ? "LIVE SYNC ON" : "SYNC PAUSED"}
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FaPlus /> Add Instrument / SRF
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleClearAllData}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Open Data Cleanup & Delete Options Modal"
            >
              <FaTrashAlt /> Delete Options (Data Delete)
            </button>
          )}
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition"
            title="Refresh Data Now"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Client Profile Sub-Header with Active Client Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Client Selector Dropdown */}
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <FaBuilding className="text-blue-600 text-base" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#021C57] font-black rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer transition shadow-2xs"
            >
              <option value="all">🏢 View All Clients ({records.length} Total Instruments)</option>
              {uniqueClients.map((clientName) => {
                const count = records.filter((r) => r.clientCompany === clientName).length;
                return (
                  <option key={clientName} value={clientName}>
                    🏢 {clientName} ({count} Instruments)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-gray-600 font-medium">
            <FaUserTie className="text-gray-400" />
            <span>{activeClientInfo.contactPerson}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 font-mono">
            <FaEnvelope className="text-gray-400" />
            <span>{activeClientInfo.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 font-mono">
            <FaPhone className="text-gray-400" />
            <span>{activeClientInfo.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Active: <strong>{activeClientInfo.totalCount}</strong> Instruments</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-[#021C57] text-white shadow-md font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaSlidersH /> 1. Lab Dashboard
        </button>
        <button
          onClick={() => setActiveTab("srf_history")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "srf_history"
              ? "bg-[#021C57] text-white shadow-md font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaFilePdf /> 2. SRF &amp; History
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === "reminders"
              ? "bg-[#021C57] text-white shadow-md font-bold"
              : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
          }`}
        >
          <FaPaperPlane className="text-amber-500 animate-bounce" /> 
          <span>3. Automated Due Reminders (Kisko Jayega / Kisko Nahi)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold ml-1">
            LIVE DIRECTORY
          </span>
        </button>
        <button
          onClick={() => setActiveTab("lab_profile")}
          className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === "lab_profile"
              ? "bg-[#021C57] text-white shadow-md font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaShieldAlt /> 4. NABL Scope &amp; Lab Profile
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LAB & CLIENT DASHBOARD (Slides 7, 8, 9) */}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Quick Due Reminder Notice Bar on Dashboard */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-4 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">
                    Automated Due Reminders &amp; Recipients Directory
                  </h3>
                  <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Auto-Cron Active
                  </span>
                </div>
                <p className="text-xs text-amber-100 mt-0.5">
                  Dekhein kisko-kisko email/WhatsApp notice jayega aur kisko nahi (Recipients Directory &amp; Live Audit History).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("reminders")}
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <span>👉 View Due Reminders &amp; Directory Tab</span>
              <FaChevronRight />
            </button>
          </div>

          {/* Top 5 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Total Instruments</span>
              <p className="text-2xl font-extrabold text-gray-900">{dynamicMetrics.total}</p>
              <p className="text-[11px] text-gray-400">All inward jobs</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Calibrated</span>
              <p className="text-2xl font-extrabold text-emerald-600">{dynamicMetrics.totalDone}</p>
              <p className="text-[11px] text-emerald-600 font-bold font-mono">{dynamicMetrics.percentage}% of total</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Under Calibration</span>
              <p className="text-2xl font-extrabold text-amber-600">{dynamicMetrics.underCalib}</p>
              <p className="text-[11px] text-amber-600 font-mono">In Metrology Lab</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Calibration Done</span>
              <p className="text-2xl font-extrabold text-blue-600">{dynamicMetrics.calibDone}</p>
              <p className="text-[11px] text-blue-600 font-mono">Sticker Verified</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Certificates Uploaded</span>
              <p className="text-2xl font-extrabold text-purple-600">{dynamicMetrics.certUploaded}</p>
              <p className="text-[11px] text-purple-600 font-mono">ISO 17025 Issued</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Column (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Real-Time Calibration Status (5-Stage Stepper from Slide 7 & 8) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <FaBolt className="text-amber-500" /> Calibration Status (Live Pipeline)
                    </h3>
                    <p className="text-xs text-gray-500">Real-time step updates visible on customer portal</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
                    Overall Progress: {stats?.overallProgress || 75}%
                  </span>
                </div>

                {/* 5 Stages Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-md">
                      1
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Instrument Received</p>
                    <p className="text-lg font-black text-blue-600">{dynamicMetrics.received}</p>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-md">
                      2
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Under Calibration</p>
                    <p className="text-lg font-black text-amber-600">{dynamicMetrics.underCalib}</p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-md">
                      3
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Calibration Done</p>
                    <p className="text-lg font-black text-emerald-600">{dynamicMetrics.calibDone}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-md">
                      4
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Invoice Sent</p>
                    <p className="text-lg font-black text-indigo-600">{dynamicMetrics.invoiceSent}</p>
                  </div>

                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/60 space-y-1">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-md">
                      5
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Certificate Uploaded</p>
                    <p className="text-lg font-black text-purple-600">{dynamicMetrics.certUploaded}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Calibration Flow Progress</span>
                    <span className="font-bold text-gray-800 font-mono">Last Updated: Today, 10:30 AM</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats?.overallProgress || 75}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recent Instruments Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Recent Instruments (Live Workflow)</h3>
                    <p className="text-xs text-gray-500">Click Advance Stage to transition instrument to next stage</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("srf_history")}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View All SRF Records &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="p-3.5">Instrument Name</th>
                        <th className="p-3.5">Make / Model</th>
                        <th className="p-3.5">SR. No.</th>
                        <th className="p-3.5">Status Stage</th>
                        <th className="p-3.5 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {displayedClientRecords.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-400 bg-gray-50/40">
                            <p className="text-xs font-semibold text-gray-600">No active instruments currently in testing pipeline.</p>
                            <button
                              type="button"
                              onClick={() => setIsAddModalOpen(true)}
                              className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mx-auto"
                            >
                              <FaPlus className="text-[10px]" /> Add your first real instrument &rarr;
                            </button>
                          </td>
                        </tr>
                      ) : (
                        displayedClientRecords.slice(0, 8).map((r) => (
                        <tr key={r._id} className="hover:bg-blue-50/40 transition">
                          <td className="p-3.5 font-bold text-gray-900">{r.instrument}</td>
                          <td className="p-3.5 text-gray-500">
                            {[r.make, r.modelNo].filter(Boolean).join(" / ") || "-"}
                          </td>
                          <td className="p-3.5 font-mono text-gray-600 font-bold">{r.serialNo}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                r.stage === "Certificate Uploaded"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : r.stage === "Calibration Done"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : r.stage === "Under Calibration"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {r.stage}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleAdvanceStage(r)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs"
                              title="Advance to next calibration stage"
                            >
                              Advance Stage &rarr;
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drafted Certificate Status Box (Slide 8 & 9) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Drafted Certificate Status</h3>
                    <p className="text-xs text-gray-500">Review and approve calibration certificate drafts before final seal</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-800">
                      Total: {dynamicMetrics.total}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Approved: {dynamicMetrics.approvedDrafts}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800">
                      Pending: {dynamicMetrics.pendingDrafts}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800">
                      Correction: {dynamicMetrics.correctionDrafts}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 text-xs">
                  {displayedClientRecords.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      No instruments found for this client. Click "+ Add Instrument / SRF" to add one.
                    </div>
                  ) : (
                    displayedClientRecords.slice(0, 5).map((r) => (
                      <div key={r._id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{r.instrument}</span>
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              S/N: {r.serialNo}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">
                            Client: {r.clientCompany} • Calib Date: {r.calibrationDate ? new Date(r.calibrationDate).toLocaleDateString("en-GB") : "Today"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCycleDraftStatus(r)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer hover:scale-105 active:scale-95 ${
                              r.draftStatus === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : r.draftStatus === "Correction Suggested"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                            title="Click to cycle status (Pending ↔ Approved ↔ Correction)"
                          >
                            {r.draftStatus || "Pending Approval"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocViewer("certificate", r)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded-lg text-[11px] transition shadow-2xs"
                          >
                            View &amp; Print &rarr;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (4 Cols): Scientific Calculators */}
            <div className="lg:col-span-4 space-y-6">
              <ScientificCalculators />

              {/* Quick Due Reminders Box & 24/7 Background Scheduler */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                    <FaPaperPlane className="text-blue-600" />
                    <span>24/7 Auto Due Reminders</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      autoReminderStatus?.isEnabled !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse"
                        : "bg-slate-100 text-slate-500 border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        autoReminderStatus?.isEnabled !== false
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    ></span>
                    {autoReminderStatus?.isEnabled !== false
                      ? "Cron Active (24h)"
                      : "Cron Paused"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Daily automated background system checks calibration expirations and emails recalibration notices to customers before due date.
                </p>

                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-blue-950">
                    <span>Active Expiry Window:</span>
                    <span className="bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-md font-mono">
                      30 Days
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-normal">
                    Next automatic cycle runs in background every 24h. Customers with approaching due dates receive formatted NABL recalibration notices.
                  </p>
                  {autoReminderStatus?.lastRunAt && (
                    <p className="text-[10px] text-blue-600 font-mono">
                      Last scan: {new Date(autoReminderStatus.lastRunAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={autoReminderTriggering}
                    onClick={handleTriggerAutoReminderScan}
                    className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
                    title="Instantly run database scan and send due reminder emails to clients"
                  >
                    {autoReminderTriggering ? (
                      <span className="animate-spin text-xs">⏳</span>
                    ) : (
                      <FaBolt className="text-amber-300" />
                    )}
                    <span>{autoReminderTriggering ? "Scanning..." : "Scan & Send Now"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("reminders")}
                    className="py-2.5 px-2 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <FaPaperPlane />
                    <span>Open Reminders Tab &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION: 📋 RECIPIENTS DUE STATUS OVERVIEW (KISKO JA RAHA HAI / KISKO NAHI) */}
          {/* ========================================================================= */}
          {(() => {
            const safeRecords = Array.isArray(records) ? records : [];
            const days = parseInt(reminderTemplate.thresholdDays, 10) || 30;
            const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            
            const recipientMap = {};
            safeRecords.forEach((r) => {
              const key = (r?.clientEmail || r?.clientCompany || "External Client").toLowerCase();
              if (!recipientMap[key]) {
                recipientMap[key] = {
                  id: "db-" + (r?._id || key),
                  company: r?.clientCompany || "External Client",
                  contactPerson: r?.clientContactPerson || "Quality Manager",
                  email: r?.clientEmail || "arclinstruments@gmail.com",
                  phone: r?.clientPhone || "+91 8009559900",
                  allInstruments: [],
                  dueInstruments: [],
                };
              }
              recipientMap[key].allInstruments.push(r);
              const isDue = r?.calibrationDueDate ? new Date(r.calibrationDueDate) <= cutoffDate : false;
              if (isDue) {
                recipientMap[key].dueInstruments.push(r);
              }
            });

            const safeCandidates = Array.isArray(customCandidates) ? customCandidates : [];
            safeCandidates.forEach((cand) => {
              const key = (cand?.email || cand?.company || cand?.id || "").toLowerCase();
              if (key && !recipientMap[key]) {
                recipientMap[key] = {
                  id: cand.id,
                  company: cand.company,
                  contactPerson: cand.contactPerson,
                  email: cand.email,
                  phone: cand.phone,
                  allInstruments: [
                    {
                      instrument: cand.instrumentName || "Precision Instrument",
                      serialNo: cand.serialNo || "N/A",
                      calibrationDueDate: cand.dueDate,
                    }
                  ],
                  dueInstruments: [
                    {
                      instrument: cand.instrumentName || "Precision Instrument",
                      serialNo: cand.serialNo || "N/A",
                      calibrationDueDate: cand.dueDate,
                    }
                  ],
                };
              }
            });

            const list = Object.values(recipientMap);
            const totalDueClients = list.filter((g) => g.dueInstruments.length > 0).length;

            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FaPaperPlane className="text-amber-500 text-base" />
                      <h3 className="text-base font-black text-gray-900">
                        Automated Due Reminders Directory (Kisko Message/Mail Ja Raha Hai)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {totalDueClients} Due in Next {days} Days
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Live audience status: 🔴 <strong>Due Soon</strong> clients ko auto reminder jayega | 🟢 <strong>Up to Date</strong> clients ko abhi nahi jayega.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBatchConfirm()}
                      className="px-3.5 py-2 bg-gradient-to-r from-[#021C57] to-indigo-900 hover:from-blue-900 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <FaPaperPlane className="text-amber-300" /> Batch Dispatch ({totalDueClients})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("reminders")}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      Full Automation Studio &rarr;
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#021C57] text-white uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Client Organization</th>
                        <th className="p-3">Contact Person</th>
                        <th className="p-3">Recipient Email</th>
                        <th className="p-3">Mobile / WhatsApp</th>
                        <th className="p-3 text-center">Auto Reminder Eligibility</th>
                        <th className="p-3 text-right">Instant Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-sans text-xs">
                      {list.length > 0 ? (
                        list.map((recip, idx) => {
                          const isDueNow = recip.dueInstruments.length > 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                              <td className="p-3 font-bold text-gray-900">
                                {recip.company}
                                <span className="block text-[10px] text-gray-400 font-mono font-normal">
                                  {recip.allInstruments.length} Total Instrument(s)
                                </span>
                              </td>
                              <td className="p-3 font-medium text-gray-800">{recip.contactPerson}</td>
                              <td className="p-3 font-mono font-semibold text-blue-700">
                                <div className="flex items-center gap-1.5">
                                  <FaEnvelope className="text-blue-500" /> {recip.email}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-semibold text-gray-800">
                                <div className="flex items-center gap-1.5">
                                  <FaWhatsapp className="text-emerald-600" /> {recip.phone}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                {isDueNow ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <FaExclamationTriangle className="text-[10px]" /> 🔴 {recip.dueInstruments.length} Due Soon (Reminder Jayega)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <FaCheckCircle className="text-[10px]" /> 🟢 Up to Date (Nahi Jayega)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSingleReminderModal(recip.company)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1 cursor-pointer active:scale-95"
                                  title="Send reminder notice now"
                                >
                                  <FaPaperPlane className="text-[10px]" /> Send Notice
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-gray-400">
                            No clients registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SRF AND CALIBRATION HISTORY PAGE (Exact PDF Slide 5) */}
      {/* ========================================================================= */}
      {activeTab === "srf_history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Top Title & Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                Calibration History & Documents (SRF Master)
              </h2>
              <p className="text-xs text-gray-500">Complete record of instruments sent for calibration, commercial billing & NABL certificates</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <FaFileExcel className="text-emerald-600" /> Export to Excel
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <FaPlus /> Add Instrument
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-6 relative">
              <FaSearch className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Instrument / Serial No. / Model No. / Make..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-medium"
              >
                <option value="all">All Stages (1-5)</option>
                <option value="Instrument Received">1. Instrument Received</option>
                <option value="Under Calibration">2. Under Calibration</option>
                <option value="Calibration Done">3. Calibration Done</option>
                <option value="Invoice Sent">4. Invoice Sent</option>
                <option value="Certificate Uploaded">5. Certificate Uploaded</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-700 font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Paid">Paid 🟢</option>
                <option value="Pending">Pending 🟡</option>
                <option value="Partial">Partial 🔴</option>
              </select>
            </div>
          </div>

          {/* Table Container matching 4 Colored Sections from PDF Slide 5 */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-inner">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              {/* Grouped Header Rows */}
              <thead>
                <tr className="text-center font-bold text-white uppercase text-[10px] tracking-wider">
                  <th colSpan="6" className="bg-blue-900 border-r border-blue-800 p-2">
                    1. CLIENT &amp; INSTRUMENT DETAILS
                  </th>
                  <th colSpan="7" className="bg-emerald-800 border-r border-emerald-700 p-2">
                    2. CALIBRATION DETAILS
                  </th>
                  <th colSpan="5" className="bg-amber-800 border-r border-amber-700 p-2">
                    3. COMMERCIAL DOCUMENTS
                  </th>
                  <th colSpan="3" className="bg-indigo-900 border-r border-indigo-800 p-2">
                    4. RECORDS
                  </th>
                  <th rowSpan="2" className="bg-slate-900 p-2 align-middle">
                    ACTION
                  </th>
                </tr>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200 text-[10px]">
                  {/* 1. Client & Instrument Details */}
                  <th className="p-2.5 border-r border-gray-200">Sr. No.</th>
                  <th className="p-2.5 border-r border-gray-200">Company / Customer</th>
                  <th className="p-2.5 border-r border-gray-200">Make</th>
                  <th className="p-2.5 border-r border-gray-200">Model No.</th>
                  <th className="p-2.5 border-r border-gray-200">Serial No.</th>
                  <th className="p-2.5 border-r border-gray-200">Instrument Range</th>

                  {/* 2. Calibration Details */}
                  <th className="p-2.5 border-r border-gray-200">Calibration Date</th>
                  <th className="p-2.5 border-r border-gray-200">Calibration Due Date</th>
                  <th className="p-2.5 border-r border-gray-200">DC No.</th>
                  <th className="p-2.5 border-r border-gray-200">Challan Date</th>
                  <th className="p-2.5 border-r border-gray-200">Sent to (Lab Name)</th>
                  <th className="p-2.5 border-r border-gray-200">Brought to Company</th>
                  <th className="p-2.5 border-r border-gray-200">Invoice Shared Date</th>

                  {/* 3. Commercial Documents */}
                  <th className="p-2.5 border-r border-gray-200 text-center">Quotation</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">PO Raised</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Proforma Invoice</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Tax Invoice</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Payment Status</th>

                  {/* 4. Records */}
                  <th className="p-2.5 border-r border-gray-200 text-center">Certification</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Record (Excel)</th>
                  <th className="p-2.5 border-r border-gray-200 text-center">Sticker Check</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-gray-800 font-medium">
                {groupedBatches.length === 0 ? (
                  <tr>
                    <td colSpan="22" className="p-12 text-center text-gray-500 bg-slate-50/40">
                      <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl shadow-inner">
                          <FaCertificate />
                        </div>
                        <p className="font-bold text-gray-900 text-sm">No Calibration Records in Database</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Old sample data has been cleared. Start adding your real client instruments, DC Challans, and calibration records in real-time.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-2 px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FaPlus /> + Add Real Instrument / SRF
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedBatches.map((batch, idx) => {
                    const r = batch?.primaryRecord || batch?.items?.[0] || {};
                    const isExpanded = expandedBatchKeys.has(batch.batchKey);
                    const batchItems = Array.isArray(batch?.items) ? batch.items : [];
                    const isMulti = batchItems.length > 1;

                    // Compute clean aggregated displays
                    const makes = Array.from(
                      new Set(
                        batchItems
                          .map((i) => {
                            const m = String(i?.make || "").trim();
                            return m && m !== "ARCL" && m !== "ARCL Instruments" ? m : "";
                          })
                          .filter(Boolean)
                      )
                    );
                    const makeDisplay = makes.length === 1 ? makes[0] : makes.length > 1 ? `${makes[0]} (${makes.length})` : "";

                    const models = Array.from(
                      new Set(
                        batchItems
                          .map((i) => {
                            const mod = String(i?.modelNo || "").trim();
                            return mod && mod !== "GEN-01" && mod !== "ARCL-CTM-2000" ? mod : "";
                          })
                          .filter(Boolean)
                      )
                    );
                    const modelDisplay = models.length === 1 ? models[0] : models.length > 1 ? `${models[0]} (${models.length})` : "";

                    const serialDisplay = isMulti
                      ? `${batchItems[0]?.serialNo || "-"}, ${batchItems[1]?.serialNo || ""}... (${batchItems.length} S/N)`
                      : batchItems[0]?.serialNo || "-";

                    const ranges = Array.from(new Set(batchItems.map((i) => String(i?.instrumentRange || "").trim()).filter(Boolean)));
                    const rangeDisplay = ranges.length === 1 ? ranges[0] : ranges.length > 1 ? `Multi-Range (${batchItems.length})` : (ranges[0] || "");

                    return (
                      <React.Fragment key={batch.batchKey || idx}>
                        <tr className="hover:bg-blue-50/50 transition">
                          {/* 1. Client & Instrument Details */}
                          <td className="p-2.5 font-bold text-center border-r border-gray-200 bg-gray-50/50">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border-r border-gray-200">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-gray-950 text-xs">
                                  {batch.clientCompany}
                                </span>
                                {isMulti && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 font-mono">
                                    {batchItems.length} Products
                                  </span>
                                )}
                              </div>
                              {isMulti ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandBatch(batch.batchKey)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline flex items-center gap-1 cursor-pointer text-left mt-0.5"
                                >
                                  {isExpanded ? "▲ Hide Equipments" : `▼ View ${batchItems.length} Equipments List`}
                                </button>
                              ) : (
                                <p className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
                                  {batchItems[0]?.instrument || "Precision Equipment"}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-gray-600">{makeDisplay}</td>
                          <td className="p-2.5 border-r border-gray-200 font-mono text-gray-600">{modelDisplay}</td>
                          <td className="p-2.5 border-r border-gray-200 font-mono font-bold text-blue-700">
                            {serialDisplay}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono text-gray-600">{rangeDisplay}</td>

                          {/* 2. Calibration Details */}
                          <td className="p-2.5 border-r border-gray-200 font-mono">
                            {toSafeLocaleDate(batch.calibrationDate, "-")}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono font-bold text-emerald-700">
                            {toSafeLocaleDate(batch.calibrationDueDate, "-")}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono text-gray-600">
                            <div className="font-semibold text-slate-800">{batch.dcNo || "-"}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => openDocViewer("srf", r)}
                                className="text-amber-700 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer text-[9px] font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 transition"
                                title={`View Inward SRF Slip (${batchItems.length} Equipments PDF)`}
                              >
                                <FaFilePdf className="text-[9px] text-amber-600" />
                                <span>SRF Slip</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSendDocModal("srf", r)}
                                className="px-1 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                                title="Send SRF Slip to Customer (Email/WhatsApp)"
                              >
                                ✉️
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono">
                            {toSafeLocaleDate(batch.challanDate, "-")}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-gray-600">{batch.sentToLab}</td>
                          <td className="p-2.5 border-r border-gray-200 font-mono">
                            {toSafeLocaleDate(batch.broughtToCompanyDate, "-")}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 font-mono">
                            {toSafeLocaleDate(batch.invoiceSharedDate, "-")}
                          </td>

                          {/* 3. Commercial Documents */}
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => openDocViewer("quotation", r)}
                                className="text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                title={`View Quotation PDF (${batch.items.length} Equipments)`}
                              >
                                <FaFilePdf className="text-xs" />
                                <span className="text-[9px] underline font-bold">View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSendDocModal("quotation", r)}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                                title="Send Quotation PDF to Customer (Mail/WhatsApp)"
                              >
                                ✉️ Send
                              </button>
                            </div>
                          </td>
                          <td className={`p-2.5 border-r border-gray-200 text-center transition-colors duration-300 ${
                            Boolean(
                              r.commercialDocs?.poFileUrl &&
                              r.commercialDocs.poFileUrl.trim() !== "" &&
                              r.commercialDocs.poFileUrl !== "/docs/sample-po.pdf"
                            )
                              ? "bg-emerald-50/80 border-emerald-300"
                              : "bg-slate-50/30"
                          }`}>
                            {Boolean(
                              r.commercialDocs?.poFileUrl &&
                              r.commercialDocs.poFileUrl.trim() !== "" &&
                              r.commercialDocs.poFileUrl !== "/docs/sample-po.pdf"
                            ) ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <FaCheckCircle className="text-emerald-600 text-[10px]" />
                                  <span>PO Attached</span>
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleViewPoDocument(r)}
                                    className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition flex items-center gap-1 cursor-pointer active:scale-95"
                                    title={`Open & View Uploaded PO (${r.commercialDocs?.poFileName || "Custom PO"})`}
                                  >
                                    <FaFilePdf className="text-xs" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSendDocModal("po", r)}
                                    className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                                    title="Send Uploaded PO to Customer via Email/WhatsApp"
                                  >
                                    ✉️ Send
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerPoUpload(r)}
                                    className="p-1 rounded text-[8px] font-bold bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 border border-gray-300 transition cursor-pointer"
                                    title="Change / Re-upload PO from Gallery"
                                  >
                                    <FaUpload className="text-[8px]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePoFile(r)}
                                    className="p-1 rounded text-[8px] font-bold bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-gray-300 transition cursor-pointer"
                                    title="Delete uploaded PO document"
                                  >
                                    <FaTrash className="text-[8px]" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTriggerPoUpload(r)}
                                  disabled={uploadingPoId === r._id}
                                  className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs hover:shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                                  title="Upload PO document (PDF/Image) from your Gallery / Computer"
                                >
                                  {uploadingPoId === r._id ? (
                                    <>
                                      <FaSync className="text-[9px] animate-spin" />
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaUpload className="text-[9px]" />
                                      <span>Upload PO</span>
                                    </>
                                  )}
                                </button>
                                <span className="text-[8px] text-amber-600 font-bold">⚠️ No PO Attached</span>
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => openDocViewer("pi", r)}
                                className="text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                title="View Proforma Invoice"
                              >
                                <FaFilePdf className="text-xs" />
                                <span className="text-[9px] underline font-bold">View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSendDocModal("pi", r)}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                                title="Send Proforma Invoice to Customer"
                              >
                                ✉️ Send
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => openDocViewer("tax_invoice", r)}
                                className="text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                title="View Tax Invoice"
                              >
                                <FaFilePdf className="text-xs" />
                                <span className="text-[9px] underline font-bold">View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSendDocModal("tax_invoice", r)}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                                title="Send Tax Invoice PDF to Customer (Mail/WhatsApp)"
                              >
                                ✉️ Send
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-center font-bold">
                            <button
                              type="button"
                              onClick={() => handleCycleBatchPayment(batch)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition shadow-xs cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 mx-auto ${
                                batch.commercialDocs?.paymentStatus === "Paid"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                  : batch.commercialDocs?.paymentStatus === "Pending"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                                  : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300"
                              }`}
                              title="Click to toggle Payment Status for this Batch"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {batch.commercialDocs?.paymentStatus || "Paid"}
                            </button>
                          </td>

                          {/* 4. Records */}
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => openDocViewer("certificate", r)}
                                className="text-red-500 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                title="View Official Calibration Certificate"
                              >
                                <FaFilePdf className="text-xs text-red-600" />
                                <span className="text-[9px] underline font-bold">View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSendDocModal("certificate", r)}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition cursor-pointer"
                                title="Send NABL Certificate PDF to Customer"
                              >
                                🚀 Send
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <button
                              onClick={handleExportExcel}
                              className="text-emerald-600 hover:text-emerald-800 flex flex-col items-center mx-auto"
                              title="Download Calibration Readings Excel"
                            >
                              <FaFileExcel className="text-base text-emerald-600" />
                              <span className="text-[9px] underline font-bold">View</span>
                            </button>
                          </td>
                          <td className="p-2.5 border-r border-gray-200 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleBatchSticker(batch)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 mx-auto shadow-2xs hover:scale-105 active:scale-95 ${
                                batch.records?.stickerCheck !== false
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                                  : "bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100"
                              }`}
                              title="Click to toggle sticker compliance for this batch"
                            >
                              {batch.records?.stickerCheck !== false ? (
                                <>
                                  <FaCheckCircle className="text-emerald-600" />
                                  <span>Yes</span>
                                </>
                              ) : (
                                <>
                                  <FaTimesCircle className="text-rose-600" />
                                  <span>No</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Action */}
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSendDocModal("all", r)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg transition shadow-2xs cursor-pointer"
                                    title="Send All SRF & Calibration Documents to Customer (Mail/WhatsApp)"
                                  >
                                    <FaPaperPlane className="text-xs" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(r)}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition shadow-2xs cursor-pointer"
                                    title="Edit Inward Batch / Instrument Details"
                                  >
                                    <FaEdit className="text-xs" />
                                  </button>
                                </>
                              )}

                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleSendInstrumentReminder(r, batch.items)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Send Calibration Due Reminder (Email + WhatsApp) to this client"
                                >
                                  <FaBell className="text-xs" />
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvanceBatchStage(batch)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 rounded-lg transition shadow-2xs cursor-pointer"
                                  title="Advance Next Stage for Batch"
                                >
                                  <FaSlidersH className="text-xs" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBatch(batch)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg transition shadow-2xs cursor-pointer"
                                  title={`Delete Batch (${batch.items.length} Instruments)`}
                                >
                                  <FaTrashAlt className="text-xs" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Sub-Row with Breakdown of All Individual Equipments in this Batch */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 border-b-2 border-blue-300 animate-fadeIn">
                            <td colSpan={22} className="p-4">
                              <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                      📦
                                    </div>
                                    <span className="font-extrabold text-gray-900 text-xs">
                                      All {batch.items.length} Equipments for "{batch.clientCompany}" (DC: {batch.dcNo})
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandBatch(batch.batchKey)}
                                    className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline cursor-pointer"
                                  >
                                    ✕ Close List
                                  </button>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                                    <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                                      <tr>
                                        <th className="p-2 text-center w-8">#</th>
                                        <th className="p-2">Equipment Name</th>
                                        <th className="p-2">Make</th>
                                        <th className="p-2">Model No.</th>
                                        <th className="p-2">Serial No.</th>
                                        <th className="p-2">Range / Capacity</th>
                                        <th className="p-2">Calibration Date</th>
                                        <th className="p-2">Due Date</th>
                                        <th className="p-2">Stage</th>
                                        <th className="p-2 text-center">Sticker</th>
                                        <th className="p-2 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                                      {batch.items.map((item, iIdx) => (
                                        <tr key={item._id || iIdx} className="hover:bg-blue-50/40">
                                          <td className="p-2 text-center text-gray-400 font-bold">{iIdx + 1}</td>
                                          <td className="p-2 font-bold text-gray-900">{item.instrument}</td>
                                           <td className="p-2 text-gray-600">
                                             {item.make && item.make !== "ARCL" && item.make !== "ARCL Instruments" ? item.make : ""}
                                           </td>
                                           <td className="p-2 font-mono text-gray-600">
                                             {item.modelNo && item.modelNo !== "GEN-01" && item.modelNo !== "ARCL-CTM-2000" ? item.modelNo : ""}
                                           </td>
                                          <td className="p-2 font-mono font-bold text-blue-700">{item.serialNo}</td>
                                          <td className="p-2 text-gray-600">{item.instrumentRange}</td>
                                          <td className="p-2 font-mono">
                                            {item.calibrationDate ? new Date(item.calibrationDate).toLocaleDateString("en-GB") : "-"}
                                          </td>
                                          <td className="p-2 font-mono font-bold text-emerald-700">
                                            {item.calibrationDueDate ? new Date(item.calibrationDueDate).toLocaleDateString("en-GB") : "-"}
                                          </td>
                                          <td className="p-2">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                              {item.stage}
                                            </span>
                                          </td>
                                          <td className="p-2 text-center">
                                            {item.records?.stickerCheck !== false ? "✅ Yes" : "❌ No"}
                                          </td>
                                          <td className="p-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenEdit(item)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit this item"
                                              >
                                                <FaEdit className="text-xs" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteRecord(item._id, item.instrument)}
                                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                                title="Delete this item"
                                              >
                                                <FaTrashAlt className="text-xs" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Legend & Compliance Footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-xs text-gray-500 border-t border-gray-100">
            <div className="space-y-1">
              <p className="font-bold text-gray-800">LEGEND (PAYMENT STATUS)</p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> <strong>Paid:</strong> Payment received and completed
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> <strong>Pending:</strong> Payment is pending
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> <strong>Partial:</strong> Partial payment received
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-gray-800">DOCUMENT NOTES</p>
              <p>• Click on View to open or download official signed PDF certificates.</p>
              <p>• All documents are encrypted & stored in centralized cloud storage.</p>
              <p>• Retrievable even after 5 years for PWD / NABL audit reference.</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1 text-[11px] text-blue-900">
              <p className="font-bold flex items-center gap-1.5">
                <FaShieldAlt className="text-blue-600" /> ISO/IEC 17025 Compliant Storage
              </p>
              <p>Certified records are digitally hashed with certificate serial numbers for audit integrity.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUTOMATED DUE REMINDERS & CERTIFICATE DELIVERY (Slide 6 & 4) */}
      {/* ========================================================================= */}
      {activeTab === "reminders" && (() => {
        const safeRecords = Array.isArray(records) ? records : [];
        const days = parseInt(reminderTemplate.thresholdDays, 10) || 30;
        const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        
        // Determine preview client/company strictly so equipment from different companies never get mixed
        const previewCompany = (reminderSelectedClient && reminderSelectedClient !== "all")
          ? reminderSelectedClient
          : (uniqueClients[0] || safeRecords[0]?.clientCompany || "ABC Industries Pvt. Ltd.");

        const companyRecords = safeRecords.filter((r) => r?.clientCompany === previewCompany);
        const activeClientObj = companyRecords[0] || safeRecords.find((r) => r?.clientCompany === previewCompany) || safeRecords[0];

        // Filter real due records ONLY for the preview company
        const targetDueRecords = companyRecords.filter((r) => {
          return r?.calibrationDueDate ? new Date(r.calibrationDueDate) <= cutoffDate : true;
        });

        const previewPerson = activeClientObj?.clientContactPerson || "Quality Manager";
        const previewEmail = activeClientObj?.clientEmail || "qa@abcindustries.com";
        const previewPhone = activeClientObj?.clientPhone || "+91 9876543210";
        const previewCount = targetDueRecords.length;
        
        // Group all registered clients into recipient directories (combining MongoDB records + Custom Added Candidates)
        const recipientGroups = [];
        const map = {};
        safeRecords.forEach((r) => {
          const key = (r?.clientEmail || r?.clientCompany || "External Client").toLowerCase();
          if (!map[key]) {
            map[key] = {
              id: "db-" + (r?._id || key),
              company: r?.clientCompany || "External Client",
              contactPerson: r?.clientContactPerson || "Quality Manager",
              email: r?.clientEmail || "arclinstruments@gmail.com",
              phone: r?.clientPhone || "+91 8009559900",
              allInstruments: [],
              dueInstruments: [],
              isCustom: false,
              rawRecord: r,
            };
            recipientGroups.push(map[key]);
          }
          map[key].allInstruments.push(r);
          const isDue = r?.calibrationDueDate ? new Date(r.calibrationDueDate) <= cutoffDate : false;
          if (isDue) {
            map[key].dueInstruments.push(r);
          }
        });

        // Add custom candidate entries so every added email/candidate appears here
        const safeCandidates = Array.isArray(customCandidates) ? customCandidates : [];
        safeCandidates.forEach((cand) => {
          const key = (cand?.email || cand?.company || cand?.id || "").toLowerCase();
          if (key && !map[key]) {
            const isDue = cand?.dueDate ? new Date(cand.dueDate) <= cutoffDate : true;
            const instObj = {
              instrument: cand.instrumentName || "Precision Instrument",
              serialNo: cand.serialNo || "N/A",
              calibrationDueDate: cand.dueDate,
            };
            map[key] = {
              id: cand.id,
              company: cand.company,
              contactPerson: cand.contactPerson,
              email: cand.email,
              phone: cand.phone,
              allInstruments: [instObj],
              dueInstruments: isDue ? [instObj] : [],
              isCustom: true,
              rawCandidate: cand,
            };
            recipientGroups.push(map[key]);
          }
        });

        const dueRecipientGroups = recipientGroups.filter((g) => g.dueInstruments.length > 0);
        const selectedBatchRecips = recipientGroups.filter((g) => selectedBatchCompanies.includes(g.company));
        const selectedBatchDueCount = selectedBatchRecips.reduce((acc, r) => acc + (r.dueInstruments.length || 0), 0);

        const totalClientsWithDue = dueRecipientGroups.length;
        const totalClientsUpToDate = recipientGroups.filter((g) => g.dueInstruments.length === 0).length;
        const totalCustomCandidates = recipientGroups.filter((g) => g.isCustom).length;
        const totalInstrumentsDueInSystem = safeRecords.filter((r) => r?.calibrationDueDate && new Date(r.calibrationDueDate) <= cutoffDate).length;

        // Dynamic Filtering by Search and Status
        const filteredRecipients = recipientGroups.filter((recip) => {
          const q = (directorySearchTerm || "").toLowerCase().trim();
          const matchesSearch =
            !q ||
            recip.company.toLowerCase().includes(q) ||
            recip.contactPerson.toLowerCase().includes(q) ||
            recip.email.toLowerCase().includes(q) ||
            recip.phone.toLowerCase().includes(q) ||
            recip.allInstruments.some(
              (i) =>
                (i.instrument && i.instrument.toLowerCase().includes(q)) ||
                (i.serialNo && i.serialNo.toLowerCase().includes(q))
            );

          let matchesFilter = true;
          if (directoryFilter === "due") {
            matchesFilter = recip.dueInstruments.length > 0;
          } else if (directoryFilter === "uptodate") {
            matchesFilter = recip.dueInstruments.length === 0;
          } else if (directoryFilter === "custom") {
            matchesFilter = recip.isCustom;
          }

          return matchesSearch && matchesFilter;
        });

        // Resolved text for preview
        const resolvedSubject = (reminderTemplate.subject || "[URGENT] Calibration Due Notice for {{company}} - ARCL Lab CC-4313")
          .replace(/{{company}}/gi, previewCompany)
          .replace(/{{contactPerson}}/gi, previewPerson)
          .replace(/{{count}}/gi, String(previewCount));

        const resolvedIntro = (reminderTemplate.introMessage || "This is an automated quality compliance notice to inform you that {{count}} testing & measuring instrument(s) registered with ARCL Calibration Laboratory are approaching their annual calibration validity due date.")
          .replace(/{{company}}/gi, previewCompany)
          .replace(/{{contactPerson}}/gi, previewPerson)
          .replace(/{{count}}/gi, String(previewCount));

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Metric & Control Banner */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <FaBolt className="text-amber-500" /> DYNAMIC AUTOMATION STUDIO • ISO/IEC 17025
                </div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  Automated Calibration Due Mail &amp; Recipients Directory
                </h2>
                <p className="text-xs text-gray-500">
                  Manage recipient email addresses, customize notice templates, preview live dispatches, and track audit history.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleAutoScheduler}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                    autoReminderStatus?.isEnabled !== false
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  }`}
                  title="Enable/Disable automatic 24-hour background reminder cron"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autoReminderStatus?.isEnabled !== false
                        ? "bg-emerald-500 animate-ping"
                        : "bg-slate-400"
                    }`}
                  ></span>
                  <span>
                    {autoReminderStatus?.isEnabled !== false
                      ? "24/7 Auto Cron: ACTIVE"
                      : "24/7 Auto Cron: PAUSED"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={autoReminderTriggering}
                  onClick={handleTriggerAutoReminderScan}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Immediately scan database & dispatch due notices to all eligible customers"
                >
                  {autoReminderTriggering ? (
                    <span className="animate-spin text-xs">⏳</span>
                  ) : (
                    <FaBolt className="text-amber-300" />
                  )}
                  <span>
                    {autoReminderTriggering ? "Scanning & Sending..." : "⚡ Scan & Send Due Reminders Now"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FaCheck /> Save Template
                </button>

                <button
                  type="button"
                  onClick={handleOpenBatchConfirm}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#021C57] to-indigo-900 hover:from-blue-900 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
                  title="View recipient list & auto-dispatch batch due reminders"
                >
                  <FaPaperPlane className="text-amber-300" /> Batch Preview &amp; Send ({totalClientsWithDue})
                </button>
              </div>
            </div>

            {/* Recipient Audience Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">Registered Clients</span>
                  <FaBuilding className="text-blue-600 text-base" />
                </div>
                <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{uniqueClients.length}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Total registered organizations</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Clients Due in {days}d</span>
                  <FaClock className="text-amber-600 text-base" />
                </div>
                <p className="text-2xl font-black text-amber-600 mt-1 font-mono">{totalClientsWithDue}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Eligible for automated alert</p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-100 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">Instruments Due</span>
                  <FaExclamationTriangle className="text-rose-600 text-base" />
                </div>
                <p className="text-2xl font-black text-rose-600 mt-1 font-mono">{totalInstrumentsDueInSystem}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Recalibration required</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Dispatched Notices</span>
                  <FaCheckCircle className="text-emerald-600 text-base" />
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{dispatchHistory.length}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Logged audit entries</p>
              </div>
            </div>

            {/* Main 2-Column Studio Grid: Editor (Left) + Live Simulator (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: DYNAMIC TEMPLATE & DISPATCH STUDIO */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
                <div className="border-b border-gray-100 pb-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <FaEdit className="text-blue-600" /> Template Configuration &amp; Dispatch
                    </h3>
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Live Sync Active
                    </span>
                  </div>

                  {/* Mode Selector Tabs: Single vs Multiple/Batch */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDispatchAudienceMode("single")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        dispatchAudienceMode === "single"
                          ? "bg-white text-[#021C57] shadow-xs border border-gray-200 font-black"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span>🎯 Single Client (Ek Ko Bhejo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDispatchAudienceMode("multiple");
                        if (selectedBatchCompanies.length === 0) {
                          setSelectedBatchCompanies(dueRecipientGroups.map((g) => g.company));
                        }
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        dispatchAudienceMode === "multiple"
                          ? "bg-[#021C57] text-white shadow-xs font-black"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FaUsers className="text-xs" />
                      <span>👥 Batch / Multi (Ek Sath Bahut Logo Ko)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Mode 1: Single Client Target Selector */}
                  {dispatchAudienceMode === "single" && (
                    <div className="space-y-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Due Window (Days):
                          </label>
                          <select
                            value={reminderTemplate.thresholdDays}
                            onChange={(e) => setReminderTemplate({ ...reminderTemplate, thresholdDays: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                          >
                            <option value="15">Next 15 Days (Urgent)</option>
                            <option value="30">Next 30 Days (Standard NABL)</option>
                            <option value="45">Next 45 Days</option>
                            <option value="60">Next 60 Days (Advance)</option>
                            <option value="90">Next 90 Days (Quarterly)</option>
                            <option value="365">All Active Records (Annual)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Target Client / Company:
                          </label>
                          <select
                            value={reminderSelectedClient === "all" ? (uniqueClients[0] || "") : reminderSelectedClient}
                            onChange={(e) => setReminderSelectedClient(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                          >
                            {uniqueClients.map((client) => {
                              const cDue = safeRecords.filter((r) => r?.clientCompany === client && (r?.calibrationDueDate ? new Date(r.calibrationDueDate) <= cutoffDate : true)).length;
                              return (
                                <option key={client} value={client}>
                                  {client} ({cDue} due)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {/* Single Client Quick Info Card */}
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-950 truncate max-w-[220px]">
                            🏢 {previewCompany}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            {targetDueRecords.length} Due ({days}d)
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 font-mono">
                          <span>👤 {previewPerson}</span>
                          <span>✉️ {previewEmail}</span>
                          <span>📞 {previewPhone}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Multiple / Batch Target Selector (Ek Sath Bahut Logo Ko) */}
                  {dispatchAudienceMode === "multiple" && (
                    <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <FaCheckSquare className="text-blue-600" /> Select Target Companies ({selectedBatchCompanies.length} selected):
                        </label>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSelectedBatchCompanies(dueRecipientGroups.map((g) => g.company))}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-md border border-blue-200 transition cursor-pointer"
                          >
                            All Due ({dueRecipientGroups.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBatchCompanies(uniqueClients)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md border border-slate-200 transition cursor-pointer"
                          >
                            All ({uniqueClients.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBatchCompanies([])}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-md border border-gray-200 transition cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Scrollable multi-company selection box */}
                      <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white p-1 text-xs">
                        {recipientGroups.map((group) => {
                          const isChecked = selectedBatchCompanies.includes(group.company);
                          const dueCount = group.dueInstruments.length;
                          return (
                            <label
                              key={group.id}
                              className={`p-2 flex items-center justify-between rounded-lg transition cursor-pointer ${
                                isChecked ? "bg-blue-50/80" : "hover:bg-gray-100/70"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedBatchCompanies(selectedBatchCompanies.filter((c) => c !== group.company));
                                    } else {
                                      setSelectedBatchCompanies([...selectedBatchCompanies, group.company]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-gray-900 block text-xs">{group.company}</span>
                                  <span className="text-[10px] text-gray-500 font-mono">{group.email}</span>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                  dueCount > 0
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {dueCount > 0 ? `🔴 ${dueCount} Due` : "🟢 Valid"}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-1">
                        <span>Selected {selectedBatchCompanies.length} of {recipientGroups.length} companies</span>
                        <span className="font-mono font-bold text-rose-700">{selectedBatchDueCount} total due equipments</span>
                      </div>
                    </div>
                  )}

                  {/* Field 1: Email Subject */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Email Subject / Alert Title:</span>
                      <span className="text-[10px] text-gray-400 font-mono">Dynamic Tags Allowed</span>
                    </label>
                    <input
                      type="text"
                      value={reminderTemplate.subject}
                      onChange={(e) => setReminderTemplate({ ...reminderTemplate, subject: e.target.value })}
                      placeholder="[URGENT] Calibration Due Notice for {{company}}..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    {/* Quick Insert Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                      <span className="text-gray-400 font-semibold">Quick Tags:</span>
                      {["{{company}}", "{{contactPerson}}", "{{count}}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setReminderTemplate({ ...reminderTemplate, subject: reminderTemplate.subject + " " + tag })}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-mono font-bold cursor-pointer transition border border-blue-200"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 3: Notice Intro Body Message */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Notice Body / Intro Paragraph:</span>
                      <span className="text-[10px] text-gray-400 font-mono">Multilingual & Multiline</span>
                    </label>
                    <textarea
                      rows={4}
                      value={reminderTemplate.introMessage}
                      onChange={(e) => setReminderTemplate({ ...reminderTemplate, introMessage: e.target.value })}
                      placeholder="Type custom calibration due instructions..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs leading-relaxed"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                      <span className="text-gray-400 font-semibold">Insert Placeholders:</span>
                      {["{{company}}", "{{contactPerson}}", "{{count}}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setReminderTemplate({ ...reminderTemplate, introMessage: reminderTemplate.introMessage + " " + tag })}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-mono font-bold cursor-pointer transition border border-indigo-200"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 4: Accreditations & Scope Header */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lab Scope & Accreditations Line:
                    </label>
                    <input
                      type="text"
                      value={reminderTemplate.labScope}
                      onChange={(e) => setReminderTemplate({ ...reminderTemplate, labScope: e.target.value })}
                      placeholder="NABL ACCREDITED LABORATORY (CC-4313)..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* Field 5: Contact Desk Phone & Support Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Lab Contact Phone(s):
                      </label>
                      <input
                        type="text"
                        value={reminderTemplate.labContactPhone}
                        onChange={(e) => setReminderTemplate({ ...reminderTemplate, labContactPhone: e.target.value })}
                        placeholder="+91 8369458583"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Lab Support Email:
                      </label>
                      <input
                        type="email"
                        value={reminderTemplate.labContactEmail}
                        onChange={(e) => setReminderTemplate({ ...reminderTemplate, labContactEmail: e.target.value })}
                        placeholder="arclinstruments@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Field 6: Footer Instructions */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Footer Instructions / Remarks:
                    </label>
                    <input
                      type="text"
                      value={reminderTemplate.footerNote}
                      onChange={(e) => setReminderTemplate({ ...reminderTemplate, footerNote: e.target.value })}
                      placeholder="Need on-site calibration or immediate pickup? Contact our Metrology Desk."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Quick Action Footer in Editor (Single vs Batch Mode) */}
                {dispatchAudienceMode === "single" ? (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                        <span>⚡ Dispatch Single Notice:</span>
                        <span className="text-blue-700 truncate max-w-[140px]">{previewCompany}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSingleReminderModal(previewCompany)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        ⚙️ Full Modal Composer
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const targetRecip = recipientGroups.find((r) => r.company === previewCompany) || {
                            company: previewCompany,
                            contactPerson: previewPerson,
                            email: previewEmail,
                            phone: previewPhone,
                            dueInstruments: targetDueRecords,
                            allInstruments: companyRecords,
                          };
                          handleDirectEmailDispatch(targetRecip);
                        }}
                        className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        title="Send instant SMTP reminder email to this client only"
                      >
                        <FaEnvelope className="text-xs" /> Send Email
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const targetRecip = recipientGroups.find((r) => r.company === previewCompany) || {
                            company: previewCompany,
                            contactPerson: previewPerson,
                            email: previewEmail,
                            phone: previewPhone,
                            dueInstruments: targetDueRecords,
                            allInstruments: companyRecords,
                          };
                          handleDirectWhatsAppDispatch(targetRecip);
                        }}
                        className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        title="Open WhatsApp chat with prefilled due notice"
                      >
                        <FaWhatsapp className="text-sm" /> WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const targetRecip = recipientGroups.find((r) => r.company === previewCompany) || {
                            company: previewCompany,
                            contactPerson: previewPerson,
                            email: previewEmail,
                            phone: previewPhone,
                            dueInstruments: targetDueRecords,
                            allInstruments: companyRecords,
                          };
                          await handleDirectEmailDispatch(targetRecip);
                          handleDirectWhatsAppDispatch(targetRecip);
                        }}
                        className="px-2.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
                        title="Send both Email and open WhatsApp"
                      >
                        <FaBolt className="text-xs" /> Both
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                        <span>👥 Batch Dispatch to:</span>
                        <span className="text-blue-900 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {selectedBatchCompanies.length} Companies
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenBatchConfirm}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        ⚡ Preview All in Modal
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={selectedBatchCompanies.length === 0}
                        onClick={async () => {
                          const targetRecips = recipientGroups.filter((r) => selectedBatchCompanies.includes(r.company));
                          if (targetRecips.length === 0) {
                            toast.warning("Please select at least one company!");
                            return;
                          }
                          const toastId = toast.loading(`Sending batch email to ${targetRecips.length} organizations...`);
                          let sent = 0;
                          for (const recip of targetRecips) {
                            try {
                              await sendCalibrationReminderApi({
                                clientEmail: recip.email,
                                clientCompany: recip.company,
                                contactPerson: recip.contactPerson,
                                clientPhone: recip.phone,
                                instruments: recip.dueInstruments.length > 0 ? recip.dueInstruments : recip.allInstruments,
                                customSubject: (reminderTemplate.subject || "Calibration Due Notice for {{company}}").replace(/{{company}}/gi, recip.company),
                                customMessage: reminderTemplate.introMessage,
                                labContactPhone: reminderTemplate.labContactPhone,
                                labContactEmail: reminderTemplate.labContactEmail,
                                labScopeText: reminderTemplate.labScope,
                                customFooterText: reminderTemplate.footerNote,
                              });
                              recordDispatchLog({
                                company: recip.company,
                                contactPerson: recip.contactPerson,
                                email: recip.email,
                                phone: recip.phone,
                                channel: "Email (SMTP Direct)",
                                subject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, recip.company),
                                instrumentsCount: recip.dueInstruments.length || 1,
                                status: "Delivered (Batch Dispatch) ✅",
                              });
                              sent++;
                            } catch (e) {
                              console.error(e);
                            }
                          }
                          toast.update(toastId, {
                            render: `✉️ Successfully sent emails to ${sent} organizations! ✅`,
                            type: "success",
                            isLoading: false,
                            autoClose: 5000,
                          });
                        }}
                        className="px-2.5 py-2 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Send individual emails to all selected companies"
                      >
                        <FaEnvelope className="text-xs" /> Batch Email ({selectedBatchCompanies.length})
                      </button>

                      <button
                        type="button"
                        disabled={selectedBatchCompanies.length === 0}
                        onClick={() => {
                          const targetRecips = recipientGroups.filter((r) => selectedBatchCompanies.includes(r.company));
                          if (targetRecips.length === 0) {
                            toast.warning("Please select at least one company!");
                            return;
                          }
                          targetRecips.forEach((r) => handleDirectWhatsAppDispatch(r));
                        }}
                        className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Open WhatsApp chats for selected companies"
                      >
                        <FaWhatsapp className="text-sm" /> Batch WA ({selectedBatchCompanies.length})
                      </button>

                      <button
                        type="button"
                        disabled={selectedBatchCompanies.length === 0}
                        onClick={async () => {
                          const targetRecips = recipientGroups.filter((r) => selectedBatchCompanies.includes(r.company));
                          if (targetRecips.length === 0) {
                            toast.warning("Please select at least one company!");
                            return;
                          }
                          const toastId = toast.loading(`Dispatching Email & WhatsApp for ${targetRecips.length} companies...`);
                          let sent = 0;
                          for (const recip of targetRecips) {
                            try {
                              await sendCalibrationReminderApi({
                                clientEmail: recip.email,
                                clientCompany: recip.company,
                                contactPerson: recip.contactPerson,
                                clientPhone: recip.phone,
                                instruments: recip.dueInstruments.length > 0 ? recip.dueInstruments : recip.allInstruments,
                                customSubject: (reminderTemplate.subject || "Calibration Due Notice for {{company}}").replace(/{{company}}/gi, recip.company),
                                customMessage: reminderTemplate.introMessage,
                                labContactPhone: reminderTemplate.labContactPhone,
                                labContactEmail: reminderTemplate.labContactEmail,
                                labScopeText: reminderTemplate.labScope,
                                customFooterText: reminderTemplate.footerNote,
                              });
                              recordDispatchLog({
                                company: recip.company,
                                contactPerson: recip.contactPerson,
                                email: recip.email,
                                phone: recip.phone,
                                channel: "Email (SMTP) + WA",
                                subject: (reminderTemplate.subject || "Calibration Due Notice").replace(/{{company}}/gi, recip.company),
                                instrumentsCount: recip.dueInstruments.length || 1,
                                status: "Delivered (Multi-Channel Batch) ✅",
                              });
                              sent++;
                            } catch (e) {
                              console.error(e);
                            }
                            handleDirectWhatsAppDispatch(recip);
                          }
                          toast.update(toastId, {
                            render: `🚀 Dispatched notices to ${sent} organizations! ✅`,
                            type: "success",
                            isLoading: false,
                            autoClose: 5000,
                          });
                        }}
                        className="px-2.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Send both Email and WhatsApp for all selected companies"
                      >
                        <FaBolt className="text-xs" /> Both ({selectedBatchCompanies.length})
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: REAL-TIME DYNAMIC PREVIEW SIMULATOR */}
              <div className="lg:col-span-7 space-y-4">
                {/* Simulator Header & Channel Tabs */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-black text-gray-900">
                      Live Dispatch Preview Simulator
                    </h3>
                    <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {previewCompany} • ({targetDueRecords.length} due in {days}d)
                    </span>
                  </div>

                  <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTemplatePreviewMode("email")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        templatePreviewMode === "email"
                          ? "bg-[#021C57] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FaEnvelope /> HTML Email Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplatePreviewMode("whatsapp")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        templatePreviewMode === "whatsapp"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FaWhatsapp /> WhatsApp Message
                    </button>
                  </div>
                </div>

                {/* SIMULATOR SCREEN: HTML EMAIL VIEW */}
                {templatePreviewMode === "email" && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden font-sans text-xs">
                    {/* Simulated Email Client Header */}
                    <div className="bg-slate-100 px-5 py-3 border-b border-gray-200 text-gray-700 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-gray-400 font-mono">From:</span>{" "}
                          <strong className="text-gray-900">ARCL Instruments &lt;arclinstruments@gmail.com&gt;</strong>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          SMTP Ready ✓
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <span className="text-gray-400 font-mono">To:</span>{" "}
                        <strong className="text-gray-900">{previewPerson} &lt;{previewEmail}&gt; ({previewCompany})</strong>
                      </div>
                      <div className="text-[11px] pt-0.5 border-t border-gray-200">
                        <span className="text-gray-400 font-mono">Subject:</span>{" "}
                        <strong className="text-blue-900 font-bold">{resolvedSubject}</strong>
                      </div>
                    </div>

                    {/* Email Body Banner (Matches Live HTML Template) */}
                    <div className="p-6 bg-slate-50 space-y-5">
                      <div className="bg-gradient-to-r from-[#021C57] via-[#0B2A72] to-slate-900 text-white p-5 rounded-xl text-center space-y-1 shadow-sm">
                        <p className="text-[10px] font-extrabold tracking-widest text-blue-300 uppercase">
                          {reminderTemplate.labScope}
                        </p>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight">
                          ARCL INSTRUMENTS PRIVATE LIMITED
                        </h1>
                        <p className="text-[11px] text-blue-200">
                          Official Metrology & Quality Assurance Due Date Notice
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3.5 text-gray-800">
                        <p className="font-bold text-sm text-gray-900">
                          Dear {previewPerson} ({previewCompany}),
                        </p>
                        <div className="text-gray-700 text-xs leading-relaxed whitespace-pre-line">
                          {resolvedIntro}
                        </div>

                        {/* Real-time Dynamic Table of Instruments Due */}
                        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#021C57] text-white uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Sr.</th>
                                <th className="p-2.5">Instrument Name</th>
                                <th className="p-2.5">Serial No.</th>
                                <th className="p-2.5">Make / Model</th>
                                <th className="p-2.5">Due Date</th>
                                <th className="p-2.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                              {targetDueRecords.length > 0 ? (
                                targetDueRecords.map((inst, idx) => (
                                  <tr key={inst._id || idx} className="hover:bg-blue-50/50 transition">
                                    <td className="p-2.5 text-gray-400">{idx + 1}</td>
                                    <td className="p-2.5 font-sans font-bold text-gray-900">{inst.instrument}</td>
                                    <td className="p-2.5 text-blue-600 font-bold">{inst.serialNo}</td>
                                    <td className="p-2.5 text-gray-600">{[inst.make, inst.modelNo].filter(Boolean).join(" / ") || "-"}</td>
                                    <td className="p-2.5 text-rose-600 font-bold">
                                      {inst.calibrationDueDate ? new Date(inst.calibrationDueDate).toLocaleDateString("en-GB") : "Due Soon"}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-sans">
                                        Action Required
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-gray-400 font-sans">
                                    No records currently due in next {days} days for {previewCompany}.
                                    <span className="block text-[10px] text-gray-400 mt-0.5">
                                      (All instruments will be listed dynamically here when added or nearing due date)
                                    </span>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Call to action button */}
                        <div className="text-center py-2">
                          <span className="inline-block px-5 py-2.5 bg-[#021C57] text-white font-bold text-xs rounded-xl shadow-md cursor-default">
                            {reminderTemplate.actionBtnText}
                          </span>
                        </div>

                        {/* Support Info Box */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-gray-600 space-y-1">
                          <p className="font-bold text-gray-900">{reminderTemplate.footerNote}</p>
                          <p>
                            📞 Direct Desk: <strong>{reminderTemplate.labContactPhone}</strong> | ✉️ <strong>{reminderTemplate.labContactEmail}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Footer Note */}
                      <div className="text-center text-[10px] text-gray-400 space-y-0.5">
                        <p className="font-bold text-gray-600">ARCL Instruments Pvt. Ltd. — Calibration & QA Division</p>
                        <p>Airoli, Navi Mumbai - 400708 | ISO/IEC 17025:2017</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR SCREEN: WHATSAPP MESSAGE VIEW */}
                {templatePreviewMode === "whatsapp" && (
                  <div className="bg-[#E5DDD5] rounded-2xl border border-gray-300 shadow-md p-5 font-sans">
                    {/* Simulated WhatsApp Chat Top Header */}
                    <div className="bg-[#075E54] text-white p-3.5 rounded-xl shadow-xs flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                          QA
                        </div>
                        <div>
                          <p className="font-bold text-xs">{previewCompany}</p>
                          <p className="text-[10px] text-emerald-200">{previewPhone}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        WhatsApp Web Link Active
                      </span>
                    </div>

                    {/* WhatsApp Green Speech Bubble */}
                    <div className="bg-[#DCF8C6] text-gray-900 rounded-2xl rounded-tr-none p-4 max-w-lg ml-auto shadow-sm border border-emerald-200 space-y-2 text-xs leading-relaxed">
                      <p className="font-bold text-emerald-900 text-xs">
                        *{resolvedSubject}*
                      </p>
                      <p>
                        Dear {previewPerson} ({previewCompany}),
                      </p>
                      <p className="text-gray-800 whitespace-pre-line">
                        {resolvedIntro}
                      </p>

                      <div className="bg-white/80 rounded-xl p-2.5 space-y-1 font-mono text-[11px] border border-emerald-300/50">
                        {targetDueRecords.length > 0 ? (
                          targetDueRecords.map((inst, idx) => (
                            <p key={inst._id || idx} className="text-gray-800">
                              • *{inst.instrument}* (S/N: {inst.serialNo}) ➔ Due: 🔴 <span className="text-rose-600 font-bold font-mono">*{inst.calibrationDueDate ? new Date(inst.calibrationDueDate).toLocaleDateString("en-GB") : "Due Soon"}*</span>
                            </p>
                          ))
                        ) : (
                          <p className="text-gray-500 font-sans italic">
                            • Digital Compression Testing Machine 2000 kN (S/N: ARCL-CTM-9842) ➔ Due: 🔴 <span className="text-rose-600 font-bold font-mono">*15/05/2027*</span>
                          </p>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-700">
                        Please schedule recalibration pickup or book on-site testing:
                        <br />
                        <span className="text-blue-700 underline font-mono">https://arclinstruments.com/calibration-services</span>
                      </p>

                      <div className="pt-1.5 border-t border-emerald-300/60 text-[10px] text-gray-700 flex flex-col gap-0.5">
                        <p className="font-bold text-gray-800">ARCL Metrology Support Desk:</p>
                        <p>🔴 Phone: {reminderTemplate.labContactPhone}</p>
                        <p>🔴 Email: {reminderTemplate.labContactEmail}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleDispatchWhatsAppFromModal}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <FaWhatsapp className="text-base" /> Test Open in WhatsApp Web
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION: ⚡ DIRECT MANUAL RECIPIENT DISPATCHER (TYPE ANY EMAIL & PHONE) */}
            {/* ========================================================================= */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/60 pb-3">
                <div className="space-y-0.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                    ⚡ Ad-hoc Direct Dispatch
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <FaPaperPlane className="text-amber-400" /> Send Due Notice to Any Email &amp; WhatsApp Number
                  </h3>
                  <p className="text-xs text-blue-200">
                    Type any new or custom email ID &amp; mobile number below to instantly send a calibration due notice without adding to database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md self-start sm:self-auto cursor-pointer"
                >
                  <FaPlus /> Full Manual Composer
                </button>
              </div>

              {/* Quick Inline Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">
                    Company / Client Name:
                  </label>
                  <input
                    type="text"
                    value={manualDispatchForm.company}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, company: e.target.value })}
                    placeholder="e.g. Larsen & Toubro"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-700 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1">
                    Contact Person Name:
                  </label>
                  <input
                    type="text"
                    value={manualDispatchForm.contactPerson}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, contactPerson: e.target.value })}
                    placeholder="e.g. Mr. Rajesh Kumar"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-700 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1 flex items-center justify-between">
                    <span>Recipient Email ID:</span>
                    <span className="text-[10px] text-emerald-400">SMTP ✓</span>
                  </label>
                  <input
                    type="email"
                    value={manualDispatchForm.email}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, email: e.target.value })}
                    placeholder="client.qa@gmail.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-700 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-200 mb-1 flex items-center justify-between">
                    <span>WhatsApp Mobile:</span>
                    <span className="text-[10px] text-emerald-400">WhatsApp ✓</span>
                  </label>
                  <input
                    type="tel"
                    value={manualDispatchForm.phone}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-700 bg-slate-900/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-blue-300">
                  💡 Tip: Uses current dynamic template subject &amp; body with ISO/IEC 17025 letterhead.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendManualCustomDispatch("email")}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <FaEnvelope /> ✉️ Send Mail Only
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendManualCustomDispatch("whatsapp")}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                  >
                    <FaWhatsapp className="text-base" /> 💬 Send WhatsApp Only
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendManualCustomDispatch("both")}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95"
                  >
                    <FaBolt /> 🚀 Send Both (Mail + WhatsApp)
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION: 📋 DYNAMIC RECIPIENTS & CANDIDATES DUE DIRECTORY (KISKO JA RAHA HAI) */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              {/* Directory Top Header with Action Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center text-sm font-bold">
                      <FaEnvelope className="text-blue-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900">
                      All Registered Candidates &amp; Recipients Directory (Kisko Message/Mail Ja Raha Hai)
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    Live dynamic directory showing verified client companies, contact managers, emails, and automatic due evaluation within {days} days.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportDirectoryCSV(filteredRecipients, days)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Export Directory to CSV"
                  >
                    <FaFileExcel className="text-emerald-600" /> Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddCandidateModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                  >
                    <FaPlus className="text-xs" /> + Add Candidate Email
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Toolbar: Search, Filter Tabs & Threshold Window */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={directorySearchTerm}
                      onChange={(e) => setDirectorySearchTerm(e.target.value)}
                      placeholder="Search by company, contact person, email, phone, or instrument name..."
                      className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-gray-300 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                    {directorySearchTerm && (
                      <button
                        type="button"
                        onClick={() => setDirectorySearchTerm("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  {/* Window Threshold Quick Switcher */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[11px] font-bold text-gray-600 whitespace-nowrap">Due Window:</label>
                    <select
                      value={reminderTemplate.thresholdDays}
                      onChange={(e) => setReminderTemplate({ ...reminderTemplate, thresholdDays: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                    >
                      <option value="15">Next 15 Days (Urgent 🔴)</option>
                      <option value="30">Next 30 Days (Standard NABL)</option>
                      <option value="45">Next 45 Days</option>
                      <option value="60">Next 60 Days</option>
                      <option value="90">Next 90 Days</option>
                      <option value="365">Next 365 Days (All Annual)</option>
                    </select>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDirectoryFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      directoryFilter === "all"
                        ? "bg-[#021C57] text-white shadow-xs"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <span>All Candidates &amp; Clients</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${directoryFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                      {recipientGroups.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectoryFilter("due")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      directoryFilter === "due"
                        ? "bg-rose-700 text-white shadow-xs"
                        : "bg-white text-rose-800 hover:bg-rose-50 border border-rose-200"
                    }`}
                  >
                    <span>🔴 Reminder Jayega (Due Soon)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${directoryFilter === "due" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"}`}>
                      {totalClientsWithDue}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectoryFilter("uptodate")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      directoryFilter === "uptodate"
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                    }`}
                  >
                    <span>🟢 Nahi Jayega (Up to Date)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${directoryFilter === "uptodate" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                      {totalClientsUpToDate}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectoryFilter("custom")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      directoryFilter === "custom"
                        ? "bg-indigo-700 text-white shadow-xs"
                        : "bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200"
                    }`}
                  >
                    <span>⚡ Custom Candidates</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${directoryFilter === "custom" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"}`}>
                      {totalCustomCandidates}
                    </span>
                  </button>
                </div>
              </div>

              {/* Contextual Multi-Selection Bulk Actions Bar */}
              {selectedDirectoryIds.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold font-mono">
                      Selected {selectedDirectoryIds.length} recipient organization(s)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkDispatchSelected(recipientGroups, "email")}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <FaEnvelope className="text-xs" /> Send Email to Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkDispatchSelected(recipientGroups, "whatsapp")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <FaWhatsapp className="text-sm" /> Open WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkDispatchSelected(recipientGroups, "both")}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl font-black transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <FaBolt className="text-xs" /> Send Both
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSelectedDirectory(recipientGroups)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                      title="Delete selected recipients and candidate records"
                    >
                      <FaTrashAlt className="text-xs" /> Delete Selected ({selectedDirectoryIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDirectoryIds([])}
                      className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Recipients Directory Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#021C57] text-white uppercase text-[10px]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredRecipients.length > 0 && selectedDirectoryIds.length === filteredRecipients.length}
                          onChange={() => handleSelectAllCandidates(filteredRecipients)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="Select all recipients in view"
                        />
                      </th>
                      <th className="p-3">Client Organization &amp; Equipment</th>
                      <th className="p-3">Contact Person</th>
                      <th className="p-3">Recipient Email (SMTP)</th>
                      <th className="p-3">WhatsApp Mobile</th>
                      <th className="p-3 text-center">Due Status ({days}d)</th>
                      <th className="p-3 text-right">Interactive Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans text-xs">
                    {filteredRecipients.length > 0 ? (
                      filteredRecipients.map((recip, idx) => {
                        const isDueNow = recip.dueInstruments.length > 0;
                        const isSelected = selectedDirectoryIds.includes(recip.id);
                        const isExpanded = expandedRecipId === recip.id;
                        const firstDueInst = recip.dueInstruments[0] || recip.allInstruments[0] || {};
                        const dueDaysLeft = firstDueInst?.calibrationDueDate
                          ? Math.ceil((new Date(firstDueInst.calibrationDueDate) - new Date()) / (1000 * 60 * 60 * 24))
                          : 15;

                        return (
                          <React.Fragment key={recip.id || idx}>
                            <tr className={`hover:bg-blue-50/40 transition ${isSelected ? "bg-blue-50/70" : ""}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectCandidate(recip.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <FaBuilding className="text-blue-600 shrink-0" />
                                    <span className="font-bold text-gray-900 text-sm">{recip.company}</span>
                                    {recip.isCustom ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                                        ⚡ Custom
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                        ✓ Database
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRecipId(isExpanded ? null : recip.id)}
                                      className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1 cursor-pointer"
                                    >
                                      {isExpanded ? <FaChevronDown className="text-[9px]" /> : <FaChevronRight className="text-[9px]" />}
                                      <span>{recip.allInstruments.length} Registered Instrument(s)</span>
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1.5 font-medium text-gray-800">
                                  <FaUserTie className="text-gray-400" />
                                  <span>{recip.contactPerson}</span>
                                </div>
                              </td>

                              <td className="p-3 font-mono font-semibold text-blue-700">
                                <div className="flex items-center gap-1.5">
                                  <FaEnvelope className="text-blue-500 shrink-0" />
                                  <span className="hover:underline cursor-pointer" title="Click to copy email" onClick={() => {
                                    navigator.clipboard.writeText(recip.email);
                                    toast.info(`Copied ${recip.email}`);
                                  }}>
                                    {recip.email}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 font-mono font-semibold text-gray-800">
                                <div className="flex items-center gap-1.5">
                                  <FaWhatsapp className="text-emerald-600 shrink-0" />
                                  <span>{recip.phone}</span>
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                {isDueNow ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <FaExclamationTriangle className="text-[10px]" /> 🔴 Reminder Jayega ({recip.dueInstruments.length} Due)
                                    </span>
                                    <p className="text-[10px] text-rose-600 font-mono font-bold">
                                      {dueDaysLeft <= 0 ? "⚠️ Overdue Notice" : `Due in ${dueDaysLeft} Days`}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <FaCheckCircle className="text-[10px]" /> 🟢 Nahi Jayega (Up to Date)
                                    </span>
                                    <p className="text-[10px] text-emerald-600 font-mono">
                                      Valid for {dueDaysLeft > 0 ? `${dueDaysLeft} Days` : `> ${days} Days`}
                                    </p>
                                  </div>
                                )}
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick Mail Now Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDirectEmailDispatch(recip)}
                                    className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-xl transition cursor-pointer"
                                    title="Send instant SMTP reminder email now"
                                  >
                                    <FaEnvelope className="text-xs" />
                                  </button>

                                  {/* Quick WhatsApp Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDirectWhatsAppDispatch(recip)}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-xl transition cursor-pointer"
                                    title="Open direct WhatsApp chat with pre-filled message"
                                  >
                                    <FaWhatsapp className="text-sm" />
                                  </button>

                                  {/* Full Notice Composer Modal Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSingleReminderModal(recip.company)}
                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Customize & Send Notice"
                                  >
                                    <FaPaperPlane className="text-[10px]" /> Notice
                                  </button>

                                  {/* Edit Candidate / Organization Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCandidate(recip)}
                                    className="p-2 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 border border-amber-200 rounded-xl transition cursor-pointer"
                                    title="Edit candidate / organization details"
                                  >
                                    <FaEdit className="text-xs" />
                                  </button>

                                  {/* Delete Candidate / Organization Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDirectoryItem(recip)}
                                    className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-xl transition cursor-pointer"
                                    title={recip.isCustom ? "Remove candidate from directory" : "Delete client records from database"}
                                  >
                                    <FaTrashAlt className="text-xs" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Instrument Details Sub-Row */}
                            {isExpanded && (
                              <tr className="bg-slate-50 border-b border-gray-200 animate-fadeIn">
                                <td colSpan={7} className="p-4">
                                  <div className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                      <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                        <FaTools className="text-blue-600" /> Registered Equipment Details for {recip.company}:
                                      </p>
                                      <span className="text-[10px] font-mono text-gray-500">
                                        {recip.allInstruments.length} Total Registered
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                      {recip.allInstruments.map((inst, iIdx) => {
                                        const instDue = inst.calibrationDueDate
                                          ? new Date(inst.calibrationDueDate) <= cutoffDate
                                          : false;
                                        return (
                                          <div
                                            key={iIdx}
                                            className={`p-2.5 rounded-xl border ${
                                              instDue
                                                ? "bg-rose-50/70 border-rose-200"
                                                : "bg-emerald-50/50 border-emerald-200"
                                            }`}
                                          >
                                            <p className="font-bold text-gray-900">{inst.instrument}</p>
                                            <div className="flex justify-between text-[11px] mt-1 font-mono text-gray-600">
                                              <span>S/N: <strong className="text-blue-700">{inst.serialNo || "N/A"}</strong></span>
                                              <span>
                                                Due: <strong className={instDue ? "text-rose-700" : "text-emerald-700"}>
                                                  {inst.calibrationDueDate ? new Date(inst.calibrationDueDate).toLocaleDateString("en-GB") : "N/A"}
                                                </strong>
                                              </span>
                                            </div>
                                            <span className={`mt-1 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                              instDue ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                                            }`}>
                                              {instDue ? "🔴 Recalibration Due" : "🟢 Valid & Tested"}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400 space-y-1">
                          <p className="text-sm font-bold text-gray-700">No matching candidates or clients found</p>
                          <p className="text-xs text-gray-500">
                            Try adjusting your search terms or filter selection. You can also click <strong>+ Add Candidate Email</strong> to register a new recipient.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION: 📜 DISPATCH ACTIVITY & LIVE AUDIT TRAIL (KISKO BHEJA GAYA HAI) */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <FaClock className="text-emerald-600" /> Recent Dispatch Activity &amp; Audit Trail (Kisko Bheja Gaya Hai)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Real-time compliance record of all dispatched email and WhatsApp notifications with timestamps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedAuditLogIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedAuditLogs}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                    >
                      <FaTrashAlt className="text-xs" /> Delete Selected ({selectedAuditLogIds.length})
                    </button>
                  )}
                  {dispatchHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllAuditLogs}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FaTrashAlt className="text-xs" /> Clear All History
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Selection Banner */}
              {selectedAuditLogIds.length > 0 && (
                <div className="p-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-2 text-xs animate-fadeIn">
                  <span className="font-mono font-bold">
                    Selected {selectedAuditLogIds.length} of {dispatchHistory.length} audit log entries
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteSelectedAuditLogs}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaTrashAlt className="text-[10px]" /> Delete Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAuditLogIds([])}
                      className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition cursor-pointer text-[11px]"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Audit Trail Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-white uppercase text-[10px]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={dispatchHistory.length > 0 && selectedAuditLogIds.length === dispatchHistory.length}
                          onChange={handleSelectAllAuditLogs}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="Select all logs"
                        />
                      </th>
                      <th className="p-3">Time &amp; Date</th>
                      <th className="p-3">Recipient Organization</th>
                      <th className="p-3">Recipient Email</th>
                      <th className="p-3">Delivery Channel</th>
                      <th className="p-3">Notice Subject</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans text-xs">
                    {dispatchHistory.length > 0 ? (
                      dispatchHistory.map((item) => {
                        const isLogSelected = selectedAuditLogIds.includes(item.id);
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50/80 transition ${isLogSelected ? "bg-blue-50/60" : ""}`}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isLogSelected}
                                onChange={() => handleToggleSelectAuditLog(item.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono text-gray-500 whitespace-nowrap">
                              {new Date(item.timestamp).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3 font-bold text-gray-900">
                              {item.company}
                            </td>
                            <td className="p-3 font-mono font-semibold text-blue-700">
                              {item.email}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {item.channel}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-gray-700 max-w-xs truncate" title={item.subject}>
                              {item.subject}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleAuditLog(item.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-lg transition cursor-pointer"
                                title="Delete this log entry"
                              >
                                <FaTrashAlt className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-400">
                          No notices dispatched in this session yet. Reminders will be logged here automatically.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 4: REAL-TIME DYNAMIC NABL ACCREDITATION & METROLOGY LAB SCOPE */}
      {/* ========================================================================= */}
      {activeTab === "lab_profile" && (() => {
        const lab = labScopeData || {
          labName: "ARCL Instruments Pvt. Ltd.",
          labCode: "ARCL-LAB-01",
          accreditationStandard: "ISO/IEC 17025:2017",
          certificateNo: "CC-4313",
          validUntil: "2026-07-28",
          status: "Active",
          masterTraceability: "National Physical Laboratory (NPL), New Delhi & ERTL",
          referralCode: "ARCL-LAB-01",
          referralRate: 30,
          annualSubscriptionRate: 11000,
          scopeItems: defaultArclNablScope,
        };

        const rawScopeItems = Array.isArray(lab.scopeItems) ? lab.scopeItems : [];
        const disciplines = ["all", ...Array.from(new Set(rawScopeItems.map((s) => s.discipline).filter(Boolean)))];

        const filteredScope = rawScopeItems.filter((item) => {
          const matchDiscipline = labScopeFilterDiscipline === "all" || item.discipline === labScopeFilterDiscipline;
          const q = (labScopeSearch || "").toLowerCase();
          const matchSearch =
            !q ||
            (item.parameter && item.parameter.toLowerCase().includes(q)) ||
            (item.discipline && item.discipline.toLowerCase().includes(q)) ||
            (item.range && item.range.toLowerCase().includes(q)) ||
            (item.cmc && item.cmc.toLowerCase().includes(q)) ||
            (item.masterStandard && item.masterStandard.toLowerCase().includes(q)) ||
            (item.standardMethod && item.standardMethod.toLowerCase().includes(q));
          return matchDiscipline && matchSearch;
        });

        const totalDbCalibratedMatched = rawScopeItems.reduce((acc, curr) => acc + (curr.liveCalibratedCount || 0), 0);

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. Real-Time Status & Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-blue-800/60 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-200">Accreditation Standard</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    ● {lab.status || "Active"}
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-xl font-black tracking-tight">{lab.accreditationStandard || "ISO/IEC 17025:2017"}</h4>
                  <p className="text-xs text-blue-200 font-mono mt-0.5">Cert No: <strong className="text-amber-300">{lab.certificateNo || "CC-4313"}</strong></p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-800/80 flex items-center justify-between text-[11px] text-blue-200">
                  <span>Validity:</span>
                  <strong className="text-emerald-300">
                    {lab.validUntil ? new Date(lab.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "28 Jul 2026"}
                  </strong>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">NABL Accredited Scope</span>
                  <span className="p-1.5 rounded-xl bg-purple-100 text-purple-700 text-sm">
                    <FaCertificate />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-2xl font-black text-gray-900 font-mono">{rawScopeItems.length}</h4>
                  <p className="text-xs text-gray-500">Total Calibration Parameters</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                  <span>Disciplines:</span>
                  <strong className="text-purple-700 font-bold">{disciplines.length - 1} Main Disciplines</strong>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Real-Time DB Matches</span>
                  <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm">
                    <FaCheckCircle />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-2xl font-black text-emerald-600 font-mono">{totalDbCalibratedMatched}</h4>
                  <p className="text-xs text-gray-500">Customer Assets Under Scope</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                  <span>Live Database Total:</span>
                  <strong className="text-gray-900 font-mono">{records.length} Records</strong>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Audit Traceability</span>
                  <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700 text-sm">
                    <FaShieldAlt />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-black text-gray-900 truncate" title={lab.masterTraceability}>
                    {lab.masterTraceability || "NPL & ERTL Traceable"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">National Metrology Apex Standard</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
                  <span>Lab Code:</span>
                  <strong className="text-blue-700 font-mono font-black">{lab.labCode || "ARCL-LAB-01"}</strong>
                </div>
              </div>
            </div>

            {/* 2. Lab Profile Action Bar */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white font-black flex items-center justify-center text-lg shadow-md">
                  ARCL
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-gray-900">{lab.labName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ISO/IEC 17025 Certified
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Central Metrology Calibration Facility • Scope Valid Across Pan-India Projects
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditLabProfileOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaEdit className="text-blue-600" /> Edit Lab Profile
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddScopeModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FaPlus /> + Add Scope Parameter
                </button>
                <button
                  type="button"
                  onClick={handleResetScope}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Reset scope matrix to default standard"
                >
                  <FaSync className={labScopeLoading ? "animate-spin" : ""} /> Reset Scope
                </button>
                <button
                  type="button"
                  onClick={() => openDocViewer("certificate", records[0])}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaDownload /> NABL Cert (PDF)
                </button>
              </div>
            </div>

            {/* 3. Search & Discipline Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {disciplines.map((d) => {
                    const isSelected = labScopeFilterDiscipline === d;
                    const count = d === "all" ? rawScopeItems.length : rawScopeItems.filter((i) => i.discipline === d).length;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setLabScopeFilterDiscipline(d)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <span>{d === "all" ? "All Disciplines" : d}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-w-[240px]">
                  <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Search parameter, range, CMC or standard..."
                    value={labScopeSearch}
                    onChange={(e) => setLabScopeSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                  {labScopeSearch && (
                    <button
                      type="button"
                      onClick={() => setLabScopeSearch("")}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Dynamic Scope Matrix Table */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaTools className="text-blue-600" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-gray-900">
                    NABL Calibration Capabilities &amp; Measurement Matrix ({filteredScope.length} Parameters)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-gray-500">
                  ISO/IEC 17025:2017 Traceable
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-gray-700 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                      <th className="p-3.5 w-12 text-center">#</th>
                      <th className="p-3.5">Parameter / Machine</th>
                      <th className="p-3.5">Measuring Range</th>
                      <th className="p-3.5">CMC / Uncertainty (±)</th>
                      <th className="p-3.5">Reference Master Standard</th>
                      <th className="p-3.5">Standard Method</th>
                      <th className="p-3.5 text-center">Live DB Records</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {filteredScope.length > 0 ? (
                      filteredScope.map((item, idx) => (
                        <tr key={item._id || item.id || idx} className="hover:bg-blue-50/40 transition">
                          <td className="p-3 text-center font-mono font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="p-3">
                            <div className="font-black text-gray-900 text-xs sm:text-sm">
                              {item.parameter}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                                {item.discipline}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                {item.facility}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-900">
                            {item.range}
                          </td>
                          <td className="p-3 font-mono font-black text-emerald-700 bg-emerald-50/40 rounded-lg">
                            {item.cmc}
                          </td>
                          <td className="p-3 text-gray-700 max-w-xs">
                            <div className="font-medium">{item.masterStandard}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                              Traceability: {item.traceability}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-blue-900 font-bold">
                            {item.standardMethod}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-black border inline-flex items-center gap-1.5 ${
                              (item.liveCalibratedCount || 0) > 0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                (item.liveCalibratedCount || 0) > 0 ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                              }`} />
                              {item.liveCalibratedCount || 0} Assets
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditScopeModal(item)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition cursor-pointer"
                                title="Edit scope parameter"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteScopeItem(item._id || item.id, item.parameter)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg transition cursor-pointer"
                                title="Remove parameter"
                              >
                                <FaTrashAlt className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400">
                          No scope parameters found matching your search or filter. Click <strong>+ Add Scope Parameter</strong> to add one!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Partner Referral Program Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-[#0B1120] to-indigo-950 text-white rounded-3xl p-6 shadow-sm space-y-4 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  PARTNER REFERRAL PROGRAM
                </span>
                <span className="text-xs text-slate-400">Lab Code: <strong className="text-white font-mono">{lab.referralCode}</strong></span>
              </div>
              <h3 className="text-lg font-black text-white">Partner with ARCL — {lab.referralRate || 30}% Referral Revenue</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Provide the digital calibration portal as a complementary service to your equipment buyers with your unique Lab Code.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400">Annual Client Subscription:</span>
                  <div className="text-base font-black text-amber-400 font-mono mt-0.5">₹{(lab.annualSubscriptionRate || 11000).toLocaleString("en-IN")} + GST</div>
                </div>
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400">Total (Incl. 18% GST):</span>
                  <div className="text-base font-black text-white font-mono mt-0.5">₹{Math.round((lab.annualSubscriptionRate || 11000) * 1.18).toLocaleString("en-IN")} / Year</div>
                </div>
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-emerald-700/50">
                  <span className="text-emerald-400 font-bold">Your Referral Earnings ({lab.referralRate || 30}%):</span>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">₹{Math.round(((lab.annualSubscriptionRate || 11000) * (lab.referralRate || 30)) / 100).toLocaleString("en-IN")} / Customer</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator?.clipboard?.writeText(lab.referralCode || "ARCL-LAB-01");
                  toast.success(`Lab Referral Code ${lab.referralCode || "ARCL-LAB-01"} copied to clipboard!`);
                }}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <FaShareAlt /> Share ARCL Lab Referral Code ({lab.referralCode || "ARCL-LAB-01"})
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW CALIBRATION ENTRY (MULTI-EQUIPMENT / BATCH INWARD) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-5xl w-full shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
                  <FaPlus className="text-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">
                      Add Calibration Inward Entry
                    </h3>
                    <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Bulk / Multi-Equipment Enabled
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter client contact details once, then add one or multiple instruments below in a single inward batch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Block 1: Client & Inward Challan Details */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FaBuilding className="text-emerald-600" /> 1. Client Company &amp; Inward Details (Shared for this Batch)
                  </p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                    ⚡ Receives Auto Email &amp; WhatsApp Due Reminders
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Client / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Projects Ltd. / L&T / Walk-in Client"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel (QA Lead)"
                      value={formData.clientContactPerson}
                      onChange={(e) => setFormData({ ...formData, clientContactPerson: e.target.value })}
                      className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">GST No. (GSTIN)</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAACU0108Q1Z8"
                      value={formData.clientGst}
                      onChange={(e) => setFormData({ ...formData, clientGst: e.target.value.toUpperCase() })}
                      className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-gray-800 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Client Email (For Auto Reminders)</label>
                    <input
                      type="email"
                      placeholder="e.g. qa@company.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Client Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 8009559900"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Inward DC / Challan No.</label>
                    <input
                      type="text"
                      placeholder="e.g. DC/26-27/089"
                      value={formData.dcNo}
                      onChange={(e) => setFormData({ ...formData, dcNo: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl font-mono text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Client Address / Site Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot No. 12, TTC Industrial Area, MIDC, Airoli, Navi Mumbai, Maharashtra - 400708"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Block 2: Dynamic Multi-Equipment List */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FaTools className="text-blue-600 text-sm" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      2. Calibration Equipment List ({formData.instruments.length} Item{formData.instruments.length > 1 ? "s" : ""})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateInstrumentRow(formData.instruments.length - 1)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer"
                      title="Clone last equipment details"
                    >
                      <FaCopy /> Duplicate Last
                    </button>
                    <button
                      type="button"
                      onClick={handleAddInstrumentRow}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition text-[11px] cursor-pointer"
                    >
                      <FaPlus /> + Add Another Equipment
                    </button>
                  </div>
                </div>

                {/* List of Equipment Cards */}
                <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                  {formData.instruments.map((inst, index) => (
                    <div
                      key={inst.id || index}
                      className="p-3.5 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition shadow-xs space-y-3 relative"
                    >
                      {/* Equipment Card Header */}
                      <div className="flex items-center justify-between bg-slate-100/70 -mx-3.5 -mt-3.5 px-3.5 py-2 rounded-t-2xl border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-black text-gray-800 text-xs">
                            {inst.instrument ? inst.instrument : `Equipment #${index + 1}`}
                          </span>
                          {inst.serialNo && (
                            <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              S/N: {inst.serialNo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicateInstrumentRow(index)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs cursor-pointer"
                            title="Duplicate this equipment row"
                          >
                            <FaCopy />
                          </button>
                          {formData.instruments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInstrumentRow(index)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition text-xs cursor-pointer"
                              title="Remove this equipment row"
                            >
                              <FaTrashAlt />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1: Name & Serial No */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-bold text-gray-700 flex items-center justify-between">
                            <span>Instrument / Equipment Name *</span>
                            <span className="text-[10px] text-gray-400 font-normal">e.g. Compression Testing Machine</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Compression Testing Machine 2000 kN / Vernier Caliper"
                            value={inst.instrument}
                            onChange={(e) => handleInstrumentFieldChange(index, "instrument", e.target.value)}
                            className="w-full mt-1 p-2 bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 flex items-center justify-between">
                            <span>Serial No. (Unique Asset Tag) *</span>
                            <span className="text-[10px] text-blue-600 font-mono">Unique ID</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CTM-2026-998 / VC-348"
                            value={inst.serialNo}
                            onChange={(e) => handleInstrumentFieldChange(index, "serialNo", e.target.value)}
                            className="w-full mt-1 p-2 bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                          />
                        </div>
                      </div>

                      {/* Row 2: Make, Model, Range */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-gray-700">Make / Brand</label>
                          <input
                            type="text"
                            placeholder="Optional (Make / Brand)"
                            value={inst.make || ""}
                            onChange={(e) => handleInstrumentFieldChange(index, "make", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-medium"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Model No.</label>
                          <input
                            type="text"
                            placeholder="Optional (Model No.)"
                            value={inst.modelNo || ""}
                            onChange={(e) => handleInstrumentFieldChange(index, "modelNo", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Measuring Range / Capacity</label>
                          <input
                            type="text"
                            placeholder="e.g. 0 - 2000 kN / 0 - 300 mm"
                            value={inst.instrumentRange}
                            onChange={(e) => handleInstrumentFieldChange(index, "instrumentRange", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-medium"
                          />
                        </div>
                      </div>

                      {/* Row 3: Calib Date, Due Date, Stage, Payment */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="font-bold text-gray-700">Calibration Date</label>
                          <input
                            type="date"
                            value={inst.calibrationDate}
                            onChange={(e) => handleInstrumentFieldChange(index, "calibrationDate", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-mono font-bold text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Next Due Date (Auto +1Yr)</label>
                          <input
                            type="date"
                            value={inst.calibrationDueDate}
                            onChange={(e) => handleInstrumentFieldChange(index, "calibrationDueDate", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-mono font-bold text-emerald-700"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Initial Pipeline Stage</label>
                          <select
                            value={inst.stage}
                            onChange={(e) => handleInstrumentFieldChange(index, "stage", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-bold text-blue-900"
                          >
                            <option value="Instrument Received">1. Inward Received &amp; Inspected</option>
                            <option value="Under Calibration">2. Under Calibration in Lab</option>
                            <option value="Calibration Done">3. Calibrated &amp; Sticker Pasted</option>
                            <option value="Invoice Sent">4. Invoice Sent</option>
                            <option value="Certificate Uploaded">5. Certificate Uploaded / Dispatched</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Payment Status</label>
                          <select
                            value={inst.paymentStatus}
                            onChange={(e) => handleInstrumentFieldChange(index, "paymentStatus", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-bold"
                          >
                            <option value="Paid">Paid 🟢</option>
                            <option value="Pending">Pending 🟡</option>
                            <option value="Partial">Partial 🔴</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Sticker & Remarks */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100 items-center">
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                            <input
                              type="checkbox"
                              checked={inst.stickerCheck}
                              onChange={(e) => handleInstrumentFieldChange(index, "stickerCheck", e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>Physical Sticker Pasted</span>
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Remarks / Lab Notes (e.g. Master Standard NPL/ERTL Traceable)"
                            value={inst.remarks}
                            onChange={(e) => handleInstrumentFieldChange(index, "remarks", e.target.value)}
                            className="w-full p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add Button below list */}
                <button
                  type="button"
                  onClick={handleAddInstrumentRow}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 text-blue-700 rounded-2xl font-black flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <FaPlus /> + Add Another Equipment Row
                </button>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-600 font-medium">
                  Ready to add <strong className="text-emerald-700 font-black">{formData.instruments.length} equipment item{formData.instruments.length > 1 ? "s" : ""}</strong> for <strong className="text-gray-900">{formData.clientCompany || "Client"}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2 transition active:scale-95"
                  >
                    <FaCheck /> Save All ({formData.instruments.length}) to Calibration Pipeline
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1B: EDIT CALIBRATION INWARD ENTRY (MULTI-EQUIPMENT / BATCH INWARD) */}
      {/* ========================================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-5xl w-full shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 shadow-sm">
                  <FaEdit className="text-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">
                      Edit Calibration Inward &amp; Equipments
                    </h3>
                    <span className="text-[11px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-300 font-mono">
                      {editFormData.instruments?.length || 1} Equipment{(editFormData.instruments?.length || 1) > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Modify client company, delivery challan, or edit/add/delete any equipment in this batch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Block 1: Client & Inward Challan Details */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FaBuilding className="text-blue-600" /> 1. Client Company &amp; Inward Details (Shared for this Batch)
                  </p>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2.5 py-0.5 rounded-full">
                    ⚡ Auto Synced with Invoices &amp; Certificates
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Client / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tata Projects Ltd. / L&T / Walk-in Client"
                      value={editFormData.clientCompany || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, clientCompany: e.target.value })}
                      className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel (QA Lead)"
                      value={editFormData.clientContactPerson || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, clientContactPerson: e.target.value })}
                      className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">GST No. (GSTIN)</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAACU0108Q1Z8"
                      value={editFormData.clientGst || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, clientGst: e.target.value.toUpperCase() })}
                      className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-gray-800 uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Client Email (For Auto Reminders)</label>
                    <input
                      type="email"
                      placeholder="e.g. qa@company.com"
                      value={editFormData.clientEmail || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, clientEmail: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Client Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 8009559900"
                      value={editFormData.clientPhone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, clientPhone: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Inward DC / Challan No.</label>
                    <input
                      type="text"
                      placeholder="e.g. DC/26-27/089"
                      value={editFormData.dcNo || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, dcNo: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl font-mono text-gray-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-gray-700">Challan Date</label>
                    <input
                      type="date"
                      value={editFormData.challanDate ? editFormData.challanDate.slice(0, 10) : ""}
                      onChange={(e) => setEditFormData({ ...editFormData, challanDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Assigned Laboratory</label>
                    <input
                      type="text"
                      placeholder="e.g. ARCL Calibration Lab"
                      value={editFormData.sentToLab || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, sentToLab: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">Invoice Shared Date</label>
                    <input
                      type="date"
                      value={editFormData.invoiceSharedDate ? editFormData.invoiceSharedDate.slice(0, 10) : ""}
                      onChange={(e) => setEditFormData({ ...editFormData, invoiceSharedDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-white border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Client Address / Site Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot No. 12, TTC Industrial Area, MIDC, Airoli, Navi Mumbai, Maharashtra - 400708"
                    value={editFormData.clientAddress || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, clientAddress: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Block 2: Dynamic Multi-Equipment List */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FaTools className="text-blue-600 text-sm" />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      2. Calibration Equipment List ({editFormData.instruments?.length || 0} Item{(editFormData.instruments?.length || 0) > 1 ? "s" : ""})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateEditInstrumentRow(editFormData.instruments.length - 1)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer"
                      title="Clone last equipment details"
                    >
                      <FaCopy /> Duplicate Last
                    </button>
                    <button
                      type="button"
                      onClick={handleAddEditInstrumentRow}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition text-[11px] cursor-pointer"
                    >
                      <FaPlus /> + Add Another Equipment
                    </button>
                  </div>
                </div>

                {/* List of Equipment Cards */}
                <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                  {(editFormData.instruments || []).map((inst, index) => (
                    <div
                      key={inst.id || inst._id || index}
                      className="p-3.5 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition shadow-xs space-y-3 relative"
                    >
                      {/* Equipment Card Header */}
                      <div className="flex items-center justify-between bg-slate-100/70 -mx-3.5 -mt-3.5 px-3.5 py-2 rounded-t-2xl border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-black text-gray-800 text-xs">
                            {inst.instrument ? inst.instrument : `Equipment #${index + 1}`}
                          </span>
                          {inst.serialNo && (
                            <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              S/N: {inst.serialNo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDuplicateEditInstrumentRow(index)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs cursor-pointer"
                            title="Duplicate this equipment row"
                          >
                            <FaCopy />
                          </button>
                          {editFormData.instruments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEditInstrumentRow(index)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition text-xs cursor-pointer"
                              title="Remove this equipment row"
                            >
                              <FaTrashAlt />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1: Name & Serial No */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-bold text-gray-700 flex items-center justify-between">
                            <span>Instrument / Equipment Name *</span>
                            <span className="text-[10px] text-gray-400 font-normal">e.g. Compression Testing Machine</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Compression Testing Machine 2000 kN / Vernier Caliper"
                            value={inst.instrument || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "instrument", e.target.value)}
                            className="w-full mt-1 p-2 bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 flex items-center justify-between">
                            <span>Serial No. (Unique Asset Tag) *</span>
                            <span className="text-[10px] text-blue-600 font-mono">Unique ID</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CTM-2026-998 / VC-348"
                            value={inst.serialNo || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "serialNo", e.target.value)}
                            className="w-full mt-1 p-2 bg-gray-50/50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                          />
                        </div>
                      </div>

                      {/* Row 2: Make, Model, Range */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-gray-700">Make / Brand</label>
                          <input
                            type="text"
                            placeholder="Optional (Make / Brand)"
                            value={inst.make || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "make", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-medium"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Model No.</label>
                          <input
                            type="text"
                            placeholder="Optional (Model No.)"
                            value={inst.modelNo || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "modelNo", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Measuring Range / Capacity</label>
                          <input
                            type="text"
                            placeholder="e.g. 0 - 2000 kN / 0 - 300 mm"
                            value={inst.instrumentRange || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "instrumentRange", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-medium"
                          />
                        </div>
                      </div>

                      {/* Row 3: Calib Date, Due Date, Stage, Payment */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="font-bold text-gray-700">Calibration Date</label>
                          <input
                            type="date"
                            value={inst.calibrationDate || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "calibrationDate", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Due Date (+1 Year)</label>
                          <input
                            type="date"
                            value={inst.calibrationDueDate || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "calibrationDueDate", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-mono font-bold text-emerald-700"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Pipeline Stage</label>
                          <select
                            value={inst.stage || "Instrument Received"}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "stage", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-bold text-blue-900"
                          >
                            <option value="Instrument Received">1. Inward Received &amp; Inspected</option>
                            <option value="Under Calibration">2. Under Calibration in Lab</option>
                            <option value="Calibration Done">3. Calibrated &amp; Sticker Pasted</option>
                            <option value="Invoice Sent">4. Invoice Sent</option>
                            <option value="Certificate Uploaded">5. Certificate Uploaded / Dispatched</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-gray-700">Payment Status</label>
                          <select
                            value={inst.paymentStatus || "Paid"}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "paymentStatus", e.target.value)}
                            className="w-full mt-1 p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-bold"
                          >
                            <option value="Paid">Paid 🟢</option>
                            <option value="Pending">Pending 🟡</option>
                            <option value="Partial">Partial 🔴</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Sticker & Remarks */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100 items-center">
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                            <input
                              type="checkbox"
                              checked={inst.stickerCheck !== false}
                              onChange={(e) => handleEditInstrumentFieldChange(index, "stickerCheck", e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>Physical Sticker Pasted</span>
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Remarks / Lab Notes (e.g. Master Standard NPL/ERTL Traceable)"
                            value={inst.remarks || ""}
                            onChange={(e) => handleEditInstrumentFieldChange(index, "remarks", e.target.value)}
                            className="w-full p-1.5 bg-gray-50/50 border border-gray-300 rounded-xl font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add Button below list */}
                <button
                  type="button"
                  onClick={handleAddEditInstrumentRow}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 text-blue-700 rounded-2xl font-black flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <FaPlus /> + Add Another Equipment Row in Batch
                </button>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-600 font-medium">
                  Ready to update <strong className="text-blue-700 font-black">{editFormData.instruments?.length || 0} equipment item{(editFormData.instruments?.length || 0) > 1 ? "s" : ""}</strong> for <strong className="text-gray-900">{editFormData.clientCompany || "Client"}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl font-bold shadow-md cursor-pointer transition flex items-center gap-2"
                  >
                    <FaCheck /> Save All {editFormData.instruments?.length || 0} Equipment Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NABL CALIBRATION CERTIFICATE VIEWER MODAL */}
      {/* ========================================================================= */}
      {isDocModalOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
                <FaFilePdf className="text-red-600 text-xl" />
                <span>
                  {selectedDoc.type === "certificate"
                    ? "Official NABL Calibration Certificate (ISO/IEC 17025)"
                    : selectedDoc.type === "quotation"
                    ? "Commercial Quotation Sheet"
                    : selectedDoc.type === "po"
                    ? "Purchase Order (PO)"
                    : selectedDoc.type === "srf"
                    ? "Service Request Form (SRF Inward & Job Slip)"
                    : "Tax Invoice Document"}
                </span>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 text-lg"
              >
                <FaTimes />
              </button>
            </div>

            {/* Dynamic Document Simulation (SRF Inward vs Certificate) */}
            {(() => {
              const docBatchInstruments = selectedDoc.record
                ? records.filter(
                    (r) =>
                      (selectedDoc.record.dcNo &&
                        r.dcNo === selectedDoc.record.dcNo &&
                        r.clientCompany === selectedDoc.record.clientCompany) ||
                      r._id === selectedDoc.record._id
                  )
                : [];
              const instrumentsList =
                docBatchInstruments.length > 0
                  ? docBatchInstruments
                  : [selectedDoc.record || {}];

              if (selectedDoc.type === "srf") {
                return (
                  <div className="border-4 border-double border-amber-800/40 rounded-2xl p-6 bg-amber-50/25 space-y-4 text-xs font-sans shadow-inner">
                    {/* SRF Header */}
                    <div className="text-center border-b-2 border-amber-800 pb-3 space-y-1">
                      <p className="text-[10px] font-black tracking-widest text-amber-800 uppercase font-mono">
                        SERVICE REQUEST FORM (SRF INWARD &amp; JOB SLIP)
                      </p>
                      <h2 className="text-xl font-black text-[#021C57]">
                        ARCL INSTRUMENTS PRIVATE LIMITED
                      </h2>
                      <p className="text-[11px] text-gray-600">
                        NABL ISO/IEC 17025 Accredited Calibration Laboratory (CC-4313)
                      </p>
                      <p className="text-[10px] font-mono text-emerald-700 font-bold">
                        Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708
                      </p>
                    </div>

                    {/* SRF Inward Card */}
                    <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-amber-200 text-gray-800 shadow-2xs">
                      <div>
                        SRF Job Number:{" "}
                        <strong className="font-mono text-amber-800">
                          {selectedDoc.record?.srfNo ||
                            `SRF/2026/${String(selectedDoc.record?.serialNo || "0842")
                              .replace(/[^0-9]/g, "")
                              .slice(-4) || "0842"}`}
                        </strong>
                      </div>
                      <div>
                        Inward Date:{" "}
                        <strong>
                          {toSafeLocaleDate(selectedDoc.record?.calibrationDate, toSafeLocaleDate(new Date()))}
                        </strong>
                      </div>
                      <div>
                        Client Company:{" "}
                        <strong className="text-gray-900">
                          {selectedDoc.record?.clientCompany || "Valued Client"}
                        </strong>
                      </div>
                      <div>
                        Contact Person:{" "}
                        <strong>
                          {selectedDoc.record?.clientContactPerson || "Quality Lead"}{" "}
                          ({selectedDoc.record?.clientPhone || "-"})
                        </strong>
                      </div>
                      <div>
                        GST No. (GSTIN):{" "}
                        <strong className="font-mono text-blue-700">
                          {selectedDoc.record?.clientGst || "N/A"}
                        </strong>
                      </div>
                      <div>
                        DC / Challan:{" "}
                        <strong className="font-mono">
                          {selectedDoc.record?.dcNo || "N/A"} (Dt:{" "}
                          {toSafeLocaleDate(selectedDoc.record?.challanDate, "-")}
                          )
                        </strong>
                      </div>
                      <div className="col-span-2">
                        Site / Delivery Address:{" "}
                        <strong className="text-gray-700">
                          {selectedDoc.record?.clientAddress ||
                            "Plot No. 12, TTC Industrial Area, MIDC, Airoli, Navi Mumbai - 400708"}
                        </strong>
                      </div>
                      <div className="col-span-2">
                        Assigned Lab:{" "}
                        <strong className="text-emerald-700 font-bold">
                          {selectedDoc.record?.sentToLab && !String(selectedDoc.record.sentToLab).includes("Metrology") && !String(selectedDoc.record.sentToLab).includes("Central")
                            ? selectedDoc.record.sentToLab
                            : "ARCL Calibration Lab"}
                        </strong>
                      </div>
                    </div>

                    {/* Dynamic Inward Equipment Table */}
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 flex items-center justify-between">
                        <span>
                          Inward Equipment List ({instrumentsList.length} Item
                          {instrumentsList.length > 1 ? "s" : ""}):
                        </span>
                        <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100 px-2 py-0.5 rounded">
                          All Added Equipments in this Batch
                        </span>
                      </p>
                      <table className="w-full text-left text-[11px] border border-amber-300 rounded bg-white overflow-hidden shadow-2xs">
                        <thead className="bg-amber-700 text-white text-[10px] font-bold">
                          <tr>
                            <th className="p-2 border border-amber-600 text-center w-8">#</th>
                            <th className="p-2 border border-amber-600">
                              Equipment / Instrument Name
                            </th>
                            <th className="p-2 border border-amber-600">Make / Model</th>
                            <th className="p-2 border border-amber-600">Serial No / ID</th>
                            <th className="p-2 border border-amber-600">Range / Capacity</th>
                            <th className="p-2 border border-amber-600 text-center">
                              Inward Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-800 font-medium">
                          {instrumentsList.map((inst, idx) => (
                            <tr key={idx} className="hover:bg-amber-50/50 transition">
                              <td className="p-2 border border-gray-200 text-center font-bold text-gray-500">
                                {idx + 1}
                              </td>
                              <td className="p-2 border border-gray-200 font-bold text-slate-900">
                                {inst.instrument || "Measuring Instrument"}
                              </td>
                              <td className="p-2 border border-gray-200">
                                {[inst.make, inst.modelNo].filter(Boolean).join(" / ") || "-"}
                              </td>
                              <td className="p-2 border border-gray-200 font-mono text-blue-700 font-bold">
                                {inst.serialNo || "-"}
                              </td>
                              <td className="p-2 border border-gray-200">
                                {inst.instrumentRange || "-"}
                              </td>
                              <td className="p-2 border border-gray-200 text-center">
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                  Received ✓
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures & Verification */}
                    <div className="pt-3 border-t border-amber-300 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="w-28 border-b border-gray-400"></div>
                        <p className="font-bold text-gray-900 text-[10px]">
                          Customer / Carrier Signature
                        </p>
                        <p className="text-[9px] text-gray-500">Handed over in good condition</p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="w-32 border-b border-gray-400 mx-auto"></div>
                        <p className="font-bold text-gray-900 text-[10px]">
                          For ARCL INSTRUMENTS PVT LTD
                        </p>
                        <p className="text-[9px] text-emerald-700 font-bold">
                          Authorized Lab Inward Signatory
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Otherwise Certificate View
              return (
                <div className="border-4 border-double border-blue-900/40 rounded-2xl p-6 bg-amber-50/15 space-y-4 text-xs font-sans shadow-inner">
                  {/* Certificate Header */}
                  <div className="text-center border-b-2 border-blue-900 pb-3 space-y-1">
                    <p className="text-[10px] font-black tracking-widest text-blue-900 uppercase font-mono">
                      NABL ACCREDITED CALIBRATION LABORATORY (CC-4313)
                    </p>
                    <h2 className="text-xl font-black text-[#021C57]">
                      ARCL INSTRUMENTS PRIVATE LIMITED
                    </h2>
                    <p className="text-[11px] text-gray-600">
                      Shop No. 6, Siddhivinayak Park CHS, Sector 8A, Airoli, Navi Mumbai - 400708
                    </p>
                    <p className="text-[10px] font-mono text-emerald-700 font-bold">
                      ISO/IEC 17025:2017 Traceable to National Physical Laboratory (NPL)
                    </p>
                  </div>

                  {/* Certificate Metadata */}
                  <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-gray-800">
                    <div>
                      Certificate No:{" "}
                      <strong className="font-mono text-blue-700">
                        {selectedDoc.record?.records?.certificateNo || "ARCL-CAL-2026-001"}
                      </strong>
                    </div>
                    <div>
                      Calibration Date:{" "}
                      <strong>
                        {toSafeLocaleDate(selectedDoc.record?.calibrationDate, toSafeLocaleDate(new Date()))}
                      </strong>
                    </div>
                    <div>
                      Client:{" "}
                      <strong className="text-gray-900">
                        {selectedDoc.record?.clientCompany || "Valued Client"}
                      </strong>
                    </div>
                    <div>
                      Suggested Due Date:{" "}
                      <strong className="text-emerald-700">
                        {toSafeLocaleDate(selectedDoc.record?.calibrationDueDate, "1 Year (365 Days)")}
                      </strong>
                    </div>
                    <div>
                      Instrument:{" "}
                      <strong className="text-gray-900">
                        {selectedDoc.record?.instrument || "Digital Compression Testing Machine"}
                      </strong>
                    </div>
                    <div>
                      Serial No:{" "}
                      <strong className="font-mono">
                        {selectedDoc.record?.serialNo || "-"}
                      </strong>
                    </div>
                    <div>
                      Make / Model:{" "}
                      <strong>
                        {[selectedDoc.record?.make, selectedDoc.record?.modelNo].filter(Boolean).join(" / ") || "-"}
                      </strong>
                    </div>
                    <div>
                      Range / Capacity:{" "}
                      <strong>{selectedDoc.record?.instrumentRange || "0 - 2000 kN"}</strong>
                    </div>
                  </div>

                  {/* Calibration Readings Sample Table */}
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900">
                      Calibration Readings &amp; Metrological Traceability:
                    </p>
                    <table className="w-full text-left text-[11px] border border-gray-200 rounded bg-white">
                      <thead className="bg-gray-100 text-gray-700 text-[10px] font-bold">
                        <tr>
                          <th className="p-2 border">Nominal Set Value</th>
                          <th className="p-2 border">Observed Reading</th>
                          <th className="p-2 border">Error of Indication</th>
                          <th className="p-2 border">Expanded Uncertainty (k=2)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono divide-y divide-gray-200 text-gray-700">
                        <tr>
                          <td className="p-2 border">20.0% F.S.</td>
                          <td className="p-2 border">19.98 F.S.</td>
                          <td className="p-2 border text-emerald-600">-0.10%</td>
                          <td className="p-2 border">± 0.25%</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">50.0% F.S.</td>
                          <td className="p-2 border">50.01 F.S.</td>
                          <td className="p-2 border text-emerald-600">+0.02%</td>
                          <td className="p-2 border">± 0.25%</td>
                        </tr>
                        <tr>
                          <td className="p-2 border">100.0% F.S.</td>
                          <td className="p-2 border">100.04 F.S.</td>
                          <td className="p-2 border text-emerald-600">+0.04%</td>
                          <td className="p-2 border">± 0.25%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures & QR Code */}
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center text-xs">
                        <FaQrcode className="text-3xl" />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        <p className="font-bold text-gray-900">SCAN TO VERIFY</p>
                        <p>ISO 17025 Seal</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="w-32 border-b border-gray-400 mx-auto"></div>
                      <p className="font-bold text-gray-900 text-[11px]">Authorized Signatory</p>
                      <p className="text-[10px] text-gray-500">Quality Manager, ARCL Instruments</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-between items-center pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ✔ Formally Signed &amp; Approved (NABL CC-4313)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDoc.record && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDocModalOpen(false);
                        handleOpenSendDocModal(selectedDoc.type || "certificate", selectedDoc.record);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                      title="Send this exact PDF document to client via Email or WhatsApp"
                    >
                      <FaPaperPlane /> Send This PDF to Client (Mail / WhatsApp)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDocModalOpen(false);
                        handleOpenEdit(selectedDoc.record);
                      }}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FaEdit /> Edit Certificate Data
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaPrint /> Print Certificate
                </button>
                <a
                  href={`${API?.defaults?.baseURL || "http://localhost:5000/api/v1"}/client/calibration/download-document?docType=${selectedDoc.type || "certificate"}&download=true&serialNo=${encodeURIComponent(selectedDoc.record?.serialNo || "")}&id=${selectedDoc.record?._id || ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <FaDownload /> Download Official PDF
                </a>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL ARCL TAX INVOICE LIVE VISUAL SHEET EDITOR (2-PAGE 1:1 FORMAT) */}
      {/* ========================================================================= */}
      {isTaxInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-6xl w-full shadow-2xl border border-purple-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Top Toolbar */}
            <div className="p-4 bg-gradient-to-r from-[#021C57] via-purple-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/30 text-xl">
                  <FaFilePdf />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Official Tax Invoice Live Visual Editor
                    </h2>
                    <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-[10px] font-mono font-bold">
                      Exact 2-Page ARCL Format
                    </span>
                  </div>
                  <p className="text-xs text-purple-200">
                    Live editable 2-page GST Tax Invoice sheet matching the official ARCL layout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveTaxInvoice}
                  disabled={taxInvoiceSaving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <FaCheck /> {taxInvoiceSaving ? "Saving..." : "Save Invoice"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const savedId = await handleSaveTaxInvoice();
                    const sNo = taxInvoiceForm.invoiceNo || "ARCL/26-27/74";
                    const recId = savedId || taxInvoiceRecordId || "";
                    const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
                    window.open(`${base}/client/calibration/download-document?docType=tax_invoice&download=true&recordId=${recId}&invoiceNo=${encodeURIComponent(sNo)}&serialNo=${encodeURIComponent(sNo)}&t=${Date.now()}`, "_blank");
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <FaDownload /> Download Official PDF
                </button>


                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveTaxInvoice();
                    setIsTaxInvoiceModalOpen(false);
                    handleOpenSendDocModal("tax_invoice", {
                      _id: taxInvoiceRecordId,
                      recordId: taxInvoiceRecordId,
                      clientCompany: taxInvoiceForm.clientCompany || "Valued Client",
                      clientEmail: "harsh.mishra9023@gmail.com",
                      clientPhone: "9369962486",
                      instrument: taxInvoiceForm.items?.[0]?.name || "Calibration Package",
                      serialNo: taxInvoiceForm.invoiceNo,
                      taxInvoiceData: {
                        ...taxInvoiceForm,
                        items: taxInvoiceForm.items || defaultTaxInvoice26Items,
                        taxableAmount: taxInvoiceTotals.taxable,
                        cgstAmount: taxInvoiceTotals.cgst,
                        sgstAmount: taxInvoiceTotals.sgst,
                        grandTotal: taxInvoiceTotals.grand,
                      },
                    });
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <FaPaperPlane /> Dispatch to Client
                </button>

                <button
                  type="button"
                  onClick={() => setIsTaxInvoiceModalOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Main Interactive Paper Sheet Canvas - PURE WHITE PAPER */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70 flex justify-center">
              <div 
                style={{ backgroundColor: "#ffffff", color: "#111827" }} 
                className="max-w-4xl w-full rounded-2xl shadow-2xl p-5 sm:p-8 space-y-4 border border-gray-300 text-xs font-sans"
              >
                
                {/* 1. Header Banner */}
                <div style={{ borderColor: "#000000", backgroundColor: "#f8fafc" }} className="border flex items-center justify-between px-3 py-1.5">
                  <div className="w-24"></div>
                  <h1 className="text-sm font-black tracking-wider text-black">TAX INVOICE</h1>
                  <span className="text-[10px] font-bold text-gray-700">ORIGINAL FOR RECIPIENT</span>
                </div>

                {/* 2. Top Header Grid */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
                  {/* Left: ARCL Info & Customer Details */}
                  <div className="p-3 space-y-3">
                    <div style={{ borderColor: "#000000" }} className="flex items-start gap-3 border-b pb-3">
                      <img src="/assets/LOGO.png" alt="ARCL Logo" className="h-12 object-contain" />
                      <div className="space-y-0.5 text-[11px] text-gray-900">
                        <h2 className="font-black text-black">ARCL INSTRUMENTS PRIVATE LIMITED</h2>
                        <p className="font-bold text-gray-800">GSTIN: 27ABDCA3876F1ZL</p>
                        <p className="font-bold text-gray-800">PAN: ABDCA3876F</p>
                        <p className="text-gray-700 text-[10px]">Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli</p>
                        <p className="text-gray-700 text-[10px]">Navi Mumbai, MAHARASHTRA, 400708</p>
                        <p className="text-gray-700 text-[10px]">Mobile: +91 8369458583, 6205691085</p>
                        <p className="text-gray-700 text-[10px]">Email: arclinstruments@gmail.com</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="font-black text-black text-[11px]">Customer Details (Billed To):</p>
                      <input
                        type="text"
                        style={{ backgroundColor: "#fffbeb", color: "#1e3a8a", borderColor: "#d1d5db" }}
                        value={taxInvoiceForm.clientCompany}
                        onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, clientCompany: e.target.value })}
                        className="w-full font-bold border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        placeholder="Company Name"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-[10px]">GSTIN:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                          value={taxInvoiceForm.clientGstin}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, clientGstin: e.target.value })}
                          className="font-mono text-gray-900 border rounded px-2 py-0.5 text-[11px] flex-1 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                      </div>
                      <p className="font-bold text-gray-800 text-[10px]">Billing Address:</p>
                      <textarea
                        rows={2}
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                        value={taxInvoiceForm.clientAddress}
                        onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, clientAddress: e.target.value })}
                        className="w-full text-[10px] text-gray-900 border rounded p-1.5 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Right: Invoice Metadata & Shipping Address */}
                  <div className="p-3 space-y-3">
                    <div style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }} className="grid grid-cols-2 gap-2 p-2.5 border rounded">
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Invoice #:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#1e3a8a", borderColor: "#cbd5e1" }}
                          value={taxInvoiceForm.invoiceNo}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, invoiceNo: e.target.value })}
                          className="w-full font-mono font-bold border rounded px-1.5 py-0.5 text-[11px] focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Invoice Date:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                          value={taxInvoiceForm.invoiceDate}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, invoiceDate: e.target.value })}
                          className="w-full text-gray-900 border rounded px-1.5 py-0.5 text-[11px] focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Place of Supply:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                          value={taxInvoiceForm.placeOfSupply}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, placeOfSupply: e.target.value })}
                          className="w-full text-gray-900 border rounded px-1.5 py-0.5 text-[11px] focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Due Date:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                          value={taxInvoiceForm.dueDate}
                          onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, dueDate: e.target.value })}
                          className="w-full text-gray-900 border rounded px-1.5 py-0.5 text-[11px] focus:ring-2 focus:ring-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 text-[10px]">Shipping Address:</p>
                      <textarea
                        rows={2}
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                        value={taxInvoiceForm.clientAddress}
                        onChange={(e) => setTaxInvoiceForm({ ...taxInvoiceForm, clientAddress: e.target.value })}
                        className="w-full text-[10px] text-gray-900 border rounded p-1.5 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Control Bar */}
                <div style={{ backgroundColor: "#faf5ff", borderColor: "#e9d5ff" }} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-900">
                      Invoice Items: {((taxInvoiceForm.items || defaultTaxInvoice26Items).length)} Instruments
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTaxInvoiceForm({ ...taxInvoiceForm, items: defaultTaxInvoice26Items })}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaSync /> Reset to 26 Items
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTaxInvoiceItem}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <FaPlus /> Add Item Row
                    </button>
                  </div>
                </div>

                {/* 3. Fully Interactive Editable Items Table */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border overflow-x-auto rounded">
                  <table style={{ backgroundColor: "#ffffff", color: "#111827" }} className="w-full text-left text-[11px] border-collapse">
                    <thead style={{ backgroundColor: "#f1f5f9", borderColor: "#000000", color: "#000000" }} className="font-bold border-b text-[10px]">
                      <tr>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r w-8 text-center">#</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r min-w-[220px]">Item Name &amp; Subtitle</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r w-18 text-center">HSN/SAC</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r w-14 text-center">Tax</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r w-16 text-center">Qty</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r w-20 text-right">Rate (₹)</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 border-r w-14 text-center">Per</th>
                        <th style={{ borderColor: "#000000" }} className="p-1.5 w-24 text-right border-r">Amount (₹)</th>
                        <th className="p-1.5 w-8 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: "#ffffff" }} className="divide-y divide-gray-300">
                      {(taxInvoiceForm.items || defaultTaxInvoice26Items).map((it, idx) => (
                        <tr 
                          key={idx} 
                          style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                          className="hover:bg-amber-50/40"
                        >
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center font-bold text-gray-800">{it.itemNo || idx + 1}</td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r space-y-1">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#0f172a", borderColor: "#e2e8f0" }}
                              value={it.name}
                              onChange={(e) => handleTaxInvoiceItemChange(idx, 'name', e.target.value)}
                              className="w-full font-bold border rounded px-1.5 py-0.5 text-[11px] focus:border-purple-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }}
                              value={it.subText || ""}
                              onChange={(e) => handleTaxInvoiceItemChange(idx, 'subText', e.target.value)}
                              className="w-full text-[10px] border rounded px-1.5 py-0.5 focus:border-purple-500 focus:outline-none"
                              placeholder="Subtitle (e.g. NABL Third party Report)"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#334155", borderColor: "#e2e8f0" }}
                              value={it.hsnSac || "998346"}
                              onChange={(e) => handleTaxInvoiceItemChange(idx, 'hsnSac', e.target.value)}
                              className="w-16 font-mono text-center text-[10px] border rounded px-1 py-0.5 focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#334155", borderColor: "#e2e8f0" }}
                              value={it.taxRate || "18%"}
                              onChange={(e) => handleTaxInvoiceItemChange(idx, 'taxRate', e.target.value)}
                              className="w-12 text-center text-[10px] border rounded px-1 py-0.5 focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="number"
                              style={{ backgroundColor: "#faf5ff", color: "#581c87", borderColor: "#d8b4fe" }}
                              value={it.qty}
                              onChange={(e) => handleTaxInvoiceItemChange(idx, 'qty', e.target.value)}
                              className="w-12 font-bold text-center border rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-right">
                            <input
                              type="number"
                              style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}
                              value={it.rate}
                              onChange={(e) => handleTaxInvoiceItemChange(idx, 'rate', e.target.value)}
                              className="w-18 font-mono text-right border rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center text-gray-800 font-bold">{it.per || "NOS"}</td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-right font-mono font-bold text-black">
                            {Number(it.amount || it.rate * it.qty).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTaxInvoiceItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                              title="Delete Item"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Live Taxable Summary & Amount in Words */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
                  <div className="p-3 space-y-2">
                    <p className="font-bold text-gray-800 text-[11px]">Amount Chargeable (in words):</p>
                    <p className="font-bold text-gray-900 text-xs">INR Thirty-Seven Thousand, Four Hundred And Six Rupees Only. E &amp; O.E</p>
                    
                    <div style={{ backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" }} className="p-2 border rounded-lg flex items-center justify-between">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-[11px]">
                        <FaCheckCircle className="text-emerald-600" /> Amount Paid
                      </span>
                      <span className="font-bold text-black text-[11px]">₹{taxInvoiceTotals.grand.toLocaleString("en-IN")} Paid via Net Banking on {taxInvoiceForm.invoiceDate}</span>
                    </div>
                  </div>

                  <div className="p-3 space-y-1 text-right text-xs">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Taxable Amount:</span>
                      <span className="font-mono">₹ {taxInvoiceTotals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>CGST 9.0%:</span>
                      <span className="font-mono">₹ {taxInvoiceTotals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>SGST 9.0%:</span>
                      <span className="font-mono">₹ {taxInvoiceTotals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ borderColor: "#000000" }} className="flex justify-between font-black text-black text-sm border-t pt-1">
                      <span>Total ({taxInvoiceTotals.totalQty} Qty):</span>
                      <span className="font-mono text-purple-900">₹ {taxInvoiceTotals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Bank Details, Stamp & Signatory */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black p-3 text-[11px]">
                  <div className="space-y-0.5 text-gray-900">
                    <p className="font-black text-black">Bank Details:</p>
                    <p>Bank: <strong>HDFC Bank</strong></p>
                    <p>Account #: <strong className="font-mono">50200111763991</strong></p>
                    <p>IFSC Code: <strong className="font-mono">HDFC0000582</strong></p>
                    <p>Branch: <strong>Kandivali East - Thakur Village</strong></p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 text-center space-y-1">
                    <p className="font-bold text-gray-800 text-[10px]">Pay using UPI:</p>
                    <div className="w-16 h-16 bg-white border border-gray-300 rounded p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
                      <img src="/assets/hdfc_qr.png" alt="UPI QR" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-mono text-[9px] text-gray-700 font-bold">8572995533.2@hdfc</p>
                  </div>

                  <div className="text-right space-y-1 flex flex-col justify-between items-end">
                    <p className="font-bold text-black text-[10px]">For ARCL INSTRUMENTS PRIVATE LIMITED</p>
                    <div className="w-20 h-16 flex items-center justify-center overflow-hidden">
                      <img src="/assets/arcl_stamp.png" alt="ARCL Seal & Sign" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-bold text-black text-[10px]">Authorized Signatory</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL ARCL PROFORMA INVOICE LIVE VISUAL SHEET EDITOR (3-PAGE ARCL FORMAT) */}
      {/* ========================================================================= */}
      
      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL RDC PURCHASE ORDER LIVE VISUAL SHEET EDITOR (5-PAGE LANDSCAPE) */}
      {/* ========================================================================= */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-7xl w-full shadow-2xl border border-emerald-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Top Toolbar */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 text-xl">
                  <FaFilePdf />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Official Purchase Order (PO) Live Visual Editor
                    </h2>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                      5-Page Landscape RDC Format
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Live editable 5-page Landscape Purchase Order matching official RDC Concrete document
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`${API?.defaults?.baseURL || "http://localhost:5000/api/v1"}/client/calibration/download-document?docType=po&download=true`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <FaDownload /> Download 5-Page PO PDF
                </a>

                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Scrollable White Paper Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/80 flex justify-center">
              <div style={{ backgroundColor: "#ffffff", borderColor: "#000000" }} className="w-full max-w-[1100px] shadow-2xl p-6 sm:p-8 border space-y-6 text-gray-900 font-sans text-xs">
                
                {/* Header Box */}
                <div style={{ borderColor: "#000000" }} className="border p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="px-4 py-2 bg-emerald-700 text-white font-black text-lg rounded-lg inline-block">
                      RDC
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 mt-1">We Promise We Deliver</span>
                  </div>

                  <div className="text-center space-y-1">
                    <h1 className="text-base font-black text-black tracking-wide">PURCHASE ORDER</h1>
                    <input
                      type="text"
                      value={poForm.buyerCompany}
                      onChange={(e) => setPoForm({ ...poForm, buyerCompany: e.target.value })}
                      className="font-bold text-center text-xs w-full bg-blue-50/50 border border-blue-200 rounded px-2 py-0.5"
                    />
                    <p className="text-[10px] text-gray-600">{poForm.buyerAddress}</p>
                    <p className="text-[9px] font-mono font-bold text-gray-800">GSTIN: {poForm.buyerGstin} | PAN: {poForm.buyerPan} | CIN: {poForm.buyerCin}</p>
                  </div>

                  <div className="text-right text-[11px] space-y-1 font-mono">
                    <p>PO No: <strong className="text-emerald-700">{poForm.poNo}</strong></p>
                    <p>PO Date: <strong>{poForm.poDate}</strong></p>
                    <p>Payment Term: <strong>{poForm.paymentTerm}</strong></p>
                  </div>
                </div>

                {/* Supplier & Delivery Info */}
                <div style={{ borderColor: "#000000" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black text-[11px]">
                  <div className="p-3 space-y-1">
                    <p className="font-bold text-black uppercase">Supplier (To):</p>
                    <p className="font-black text-emerald-950">{poForm.supplierCompany}</p>
                    <p className="text-gray-700">{poForm.supplierAddr}</p>
                    <p className="font-mono">GSTIN: <strong>{poForm.supplierGst}</strong></p>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-bold text-black uppercase">Order Acceptance Details:</p>
                    <p className="text-gray-700">Ref: Quotation Acceptance for NABL Metrology Calibration Services</p>
                    <p className="text-gray-700">Scope: ISO/IEC 17025:2017 Calibration with Test Reports & Holographic Stickers</p>
                    <p className="font-mono">Contact: <strong>{poForm.contactPerson}</strong></p>
                  </div>
                </div>

                
                {/* Items Toolbar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black text-xs">Line Items</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                      {(poForm.items || []).length} Items
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <FaPlus /> Add Item Row
                  </button>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto border border-black rounded">
                  <table style={{ borderColor: "#000000" }} className="w-full text-left border text-[10px]">
                    <thead style={{ backgroundColor: "#f8fafc" }} className="border-b border-black font-black text-black">
                      <tr>
                        <th className="p-2 border-r border-black text-center w-8">#</th>
                        <th className="p-2 border-r border-black text-center w-16">Code</th>
                        <th className="p-2 border-r border-black min-w-[200px]">Item Description</th>
                        <th className="p-2 border-r border-black text-center w-14">HSN</th>
                        <th className="p-2 border-r border-black text-center w-12">UOM</th>
                        <th className="p-2 border-r border-black text-center w-14">Qty</th>
                        <th className="p-2 border-r border-black text-right w-20">Rate (₹)</th>
                        <th className="p-2 border-r border-black text-right w-14">CGST</th>
                        <th className="p-2 border-r border-black text-right w-14">SGST</th>
                        <th className="p-2 text-right w-24">Gross (₹)</th>
                        <th className="p-2 text-center w-8">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/30 font-medium">
                      {(poForm.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/40">
                          <td className="p-1 border-r border-black text-center font-bold">{it.slNo || idx + 1}</td>
                          <td className="p-1 border-r border-black text-center font-mono">
                            <input
                              type="text"
                              value={it.itemCode}
                              onChange={(e) => handlePoItemChange(idx, "itemCode", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded text-[10px]"
                            />
                          </td>
                          <td className="p-1 border-r border-black font-bold text-gray-900">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => handlePoItemChange(idx, "description", e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded text-[10px] font-bold"
                            />
                          </td>
                          <td className="p-1 border-r border-black text-center font-mono">
                            <input
                              type="text"
                              value={it.hsnCode}
                              onChange={(e) => handlePoItemChange(idx, "hsnCode", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded text-[10px]"
                            />
                          </td>
                          <td className="p-1 border-r border-black text-center">
                            <input
                              type="text"
                              value={it.uom}
                              onChange={(e) => handlePoItemChange(idx, "uom", e.target.value)}
                              className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded text-[10px]"
                            />
                          </td>
                          <td className="p-1 border-r border-black text-center font-bold">
                            <input
                              type="number"
                              value={it.qty}
                              onChange={(e) => handlePoItemChange(idx, "qty", e.target.value)}
                              className="w-12 text-center bg-emerald-50 text-emerald-950 font-bold border border-emerald-300 rounded text-[10px]"
                            />
                          </td>
                          <td className="p-1 border-r border-black text-right font-mono">
                            <input
                              type="number"
                              value={it.rate}
                              onChange={(e) => handlePoItemChange(idx, "rate", e.target.value)}
                              className="w-16 text-right bg-emerald-50 text-emerald-950 font-mono border border-emerald-300 rounded text-[10px]"
                            />
                          </td>
                          <td className="p-1 border-r border-black text-right font-mono">{it.cgstPct}%</td>
                          <td className="p-1 border-r border-black text-right font-mono">{it.sgstPct}%</td>
                          <td className="p-1 text-right font-mono font-bold text-emerald-900">
                            ₹{Number(it.grossAmt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoItem(idx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer transition"
                              title="Delete this row"
                            >
                              <FaTrash size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>


                {/* Terms and Signatures */}
                <div style={{ borderColor: "#000000" }} className="border p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
                  <div className="space-y-1 text-gray-800">
                    <p className="font-bold text-black text-xs">Standard Purchase Order Terms:</p>
                    <p>1. Calibration performed per ISO/IEC 17025 standard.</p>
                    <p>2. Payment Terms: 30 days credit after report delivery.</p>
                    <p>3. Holographic NABL stickers verified on all equipment.</p>
                    <p>4. All disputes subject to Mumbai jurisdiction.</p>
                  </div>
                  <div className="flex flex-col justify-between items-end text-right space-y-4">
                    <p className="text-xs font-bold text-gray-900">For RDC CONCRETE (INDIA) PVT LTD</p>
                    <div className="border-t border-black w-40 pt-1 text-center font-bold text-[10px]">
                      Authorized Signatory
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}


      {isProformaInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-6xl w-full shadow-2xl border border-blue-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Top Toolbar */}
            <div className="p-4 bg-gradient-to-r from-[#021C57] via-blue-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 text-xl">
                  <FaFilePdf />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Official ARCL Proforma Invoice Live Visual Editor
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full text-[10px] font-mono font-bold">
                      Exact 3-Page ARCL Format
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Live editable 3-page ARCL Proforma Invoice sheet matching the official ARCL layout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveProforma}
                  disabled={proformaSaving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <FaCheck /> {proformaSaving ? "Saving..." : "Save Proforma"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const savedId = await handleSaveProforma();
                    const sNo = proformaForm.piNo || "ARCL/PI/26-27/08";
                    const recId = savedId || proformaRecordId || "";
                    const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
                    window.open(`${base}/client/calibration/download-document?docType=pi&download=true&recordId=${recId}&proformaNo=${encodeURIComponent(sNo)}&serialNo=${encodeURIComponent(sNo)}&t=${Date.now()}`, "_blank");
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <FaDownload /> Download Official PDF
                </button>


                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveProforma();
                    setIsProformaInvoiceModalOpen(false);
                    handleOpenSendDocModal("pi", {
                      _id: proformaRecordId,
                      recordId: proformaRecordId,
                      clientCompany: proformaForm.clientCompany || "Valued Client",
                      clientEmail: "harsh.mishra9023@gmail.com",
                      clientPhone: "9369962486",
                      instrument: "Full Calibration Package",
                      serialNo: proformaForm.piNo,
                      proformaData: proformaForm,
                    });
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <FaPaperPlane /> Dispatch to Client
                </button>

                <button
                  type="button"
                  onClick={() => setIsProformaInvoiceModalOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Main Interactive Paper Sheet Canvas - PURE WHITE PAPER */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70 flex justify-center">
              <div 
                style={{ backgroundColor: "#ffffff", color: "#111827" }} 
                className="max-w-4xl w-full rounded-2xl shadow-2xl p-5 sm:p-8 space-y-4 border border-gray-300 text-xs font-sans"
              >
                
                {/* 1. Header Box */}
                <div style={{ backgroundColor: "#ffffff" }} className="flex items-start justify-between gap-4 pb-2 border-b border-gray-300">
                  <div className="flex items-start gap-3">
                    <img src="/assets/LOGO.png" alt="ARCL Logo" className="h-12 object-contain" />
                    <div className="space-y-0.5 text-[11px] text-gray-900">
                      <h2 className="font-black text-black">ARCL INSTRUMENTS PRIVATE LIMITED</h2>
                      <p className="font-bold text-gray-800">GSTIN 27ABDCA3876F1ZL   PAN ABDCA3876F</p>
                      <p className="text-gray-700 text-[10px]">Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli</p>
                      <p className="text-gray-700 text-[10px]">Navi Mumbai, MAHARASHTRA, 400708</p>
                      <p className="text-gray-700 text-[10px]">Mobile +91 8369458583, 6205691085</p>
                      <p className="text-gray-700 text-[10px]">Email arclinstruments@gmail.com</p>
                      <p className="text-gray-700 text-[10px]">Website www.arclinstruments.com</p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <h1 className="text-lg font-black text-blue-600 tracking-wide">PROFORMA INVOICE</h1>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">ORIGINAL FOR RECIPIENT</p>
                  </div>
                </div>

                {/* 2. Bill To & Metadata Grid */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black p-3 text-[11px]">
                  {/* Left: Bill To */}
                  <div className="space-y-1.5 pr-3">
                    <p className="font-black text-black text-[11px]">Bill To:</p>
                    <input
                      type="text"
                      style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#bfdbfe" }}
                      value={proformaForm.clientCompany}
                      onChange={(e) => setProformaForm({ ...proformaForm, clientCompany: e.target.value })}
                      className="w-full font-bold border rounded px-2 py-1 text-xs focus:outline-none"
                      placeholder="Company Name"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-[10px]">GSTIN:</span>
                      <input
                        type="text"
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                        value={proformaForm.clientGstin}
                        onChange={(e) => setProformaForm({ ...proformaForm, clientGstin: e.target.value })}
                        className="font-mono text-gray-900 border rounded px-2 py-0.5 text-[11px] flex-1 focus:outline-none"
                      />
                    </div>
                    <p className="font-bold text-gray-800 text-[10px]">Address:</p>
                    <textarea
                      rows={2}
                      style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                      value={proformaForm.clientAddress}
                      onChange={(e) => setProformaForm({ ...proformaForm, clientAddress: e.target.value })}
                      className="w-full text-[10px] text-gray-900 border rounded p-1.5 focus:outline-none"
                    />
                  </div>

                  {/* Right: Metadata */}
                  <div className="space-y-2 pl-3 pt-2 md:pt-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-[10px]">Pro Forma Invoice #:</span>
                      <input
                        type="text"
                        style={{ backgroundColor: "#ffffff", color: "#1e3a8a", borderColor: "#cbd5e1" }}
                        value={proformaForm.piNo}
                        onChange={(e) => setProformaForm({ ...proformaForm, piNo: e.target.value })}
                        className="font-mono font-bold border rounded px-1.5 py-0.5 text-xs text-right w-36 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-[10px]">Proforma Invoice Date:</span>
                      <input
                        type="text"
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                        value={proformaForm.piDate}
                        onChange={(e) => setProformaForm({ ...proformaForm, piDate: e.target.value })}
                        className="border rounded px-1.5 py-0.5 text-xs text-right w-36 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-[10px]">Due Date:</span>
                      <input
                        type="text"
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                        value={proformaForm.dueDate}
                        onChange={(e) => setProformaForm({ ...proformaForm, dueDate: e.target.value })}
                        className="border rounded px-1.5 py-0.5 text-xs text-right w-36 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-[10px]">Place of Supply:</span>
                      <input
                        type="text"
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                        value={proformaForm.placeOfSupply}
                        onChange={(e) => setProformaForm({ ...proformaForm, placeOfSupply: e.target.value })}
                        className="border rounded px-1.5 py-0.5 text-xs text-right w-36 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Control Bar */}
                <div style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900">
                      Proforma Items: {((proformaForm.items || defaultProforma26Items).length)} Items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProformaForm({ ...proformaForm, items: defaultProforma26Items })}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaSync /> Reset 26 Items
                    </button>
                    <button
                      type="button"
                      onClick={handleAddProformaItem}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <FaPlus /> Add Item Row
                    </button>
                  </div>
                </div>

                {/* 3. 26-Item Interactive Editable Table */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border overflow-x-auto rounded">
                  <table style={{ backgroundColor: "#ffffff", color: "#111827" }} className="w-full text-left text-[11px] border-collapse">
                    <thead style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="font-bold text-[10px]">
                      <tr>
                        <th className="p-1.5 border-r border-blue-400 w-8 text-center text-white">#</th>
                        <th className="p-1.5 border-r border-blue-400 min-w-[220px] text-white">Item</th>
                        <th className="p-1.5 border-r border-blue-400 w-20 text-center text-white">HSN/SAC</th>
                        <th className="p-1.5 border-r border-blue-400 w-24 text-right text-white">Rate / Item</th>
                        <th className="p-1.5 border-r border-blue-400 w-16 text-center text-white">Qty</th>
                        <th className="p-1.5 w-28 text-right border-r border-blue-400 text-white">Amount</th>
                        <th className="p-1.5 w-8 text-center text-white">Del</th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: "#ffffff" }} className="divide-y divide-gray-300">
                      {(proformaForm.items || defaultProforma26Items).map((it, idx) => (
                        <tr 
                          key={idx} 
                          style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                          className="hover:bg-blue-50/40"
                        >
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center font-bold text-gray-800">{it.itemNo || idx + 1}</td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r space-y-1">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#0f172a", borderColor: "#e2e8f0" }}
                              value={it.name}
                              onChange={(e) => handleProformaItemChange(idx, 'name', e.target.value)}
                              className="w-full font-bold border rounded px-1.5 py-0.5 text-[11px] focus:border-blue-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }}
                              value={it.subText || ""}
                              onChange={(e) => handleProformaItemChange(idx, 'subText', e.target.value)}
                              className="w-full text-[10px] border rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none"
                              placeholder="Subtitle"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#334155", borderColor: "#e2e8f0" }}
                              value={it.hsnSac || "998346"}
                              onChange={(e) => handleProformaItemChange(idx, 'hsnSac', e.target.value)}
                              className="w-16 font-mono text-center text-[10px] border rounded px-1 py-0.5 focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-right">
                            <input
                              type="number"
                              style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}
                              value={it.rate}
                              onChange={(e) => handleProformaItemChange(idx, 'rate', e.target.value)}
                              className="w-20 font-mono text-right border rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="number"
                              style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#bfdbfe" }}
                              value={it.qty}
                              onChange={(e) => handleProformaItemChange(idx, 'qty', e.target.value)}
                              className="w-12 font-bold text-center border rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-right font-mono font-bold text-black">
                            {Number(it.amount || it.rate * it.qty).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProformaItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                              title="Delete Item"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Live Taxable Summary & Amount in Words */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
                  <div className="p-3 space-y-2">
                    <p className="font-bold text-gray-800 text-[11px]">Total Items / Qty: {((proformaForm.items || defaultProforma26Items).length)} / {proformaTotals.totalQty}</p>
                    <p className="font-bold text-gray-900 text-xs">Total amount (in words): INR Thirty-Seven Thousand, Four Hundred And Six Rupees Only.</p>
                  </div>

                  <div className="p-3 space-y-1 text-right text-xs">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Taxable Amount:</span>
                      <span className="font-mono">₹ {proformaTotals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>CGST 9.0%:</span>
                      <span className="font-mono">₹ {proformaTotals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>SGST 9.0%:</span>
                      <span className="font-mono">₹ {proformaTotals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ borderColor: "#000000" }} className="flex justify-between font-black text-black text-sm border-t pt-1">
                      <span>Total:</span>
                      <span className="font-mono text-blue-900">₹ {proformaTotals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 5. GST Summary Table */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border overflow-x-auto rounded">
                  <table style={{ backgroundColor: "#ffffff", color: "#111827" }} className="w-full text-center text-[10px] border-collapse">
                    <thead style={{ backgroundColor: "#f1f5f9" }} className="font-bold border-b border-gray-300">
                      <tr>
                        <th className="p-1 border-r border-gray-300">HSN/SAC</th>
                        <th className="p-1 border-r border-gray-300">Taxable Value</th>
                        <th className="p-1 border-r border-gray-300">Central Tax</th>
                        <th className="p-1 border-r border-gray-300">State Tax</th>
                        <th className="p-1 text-right pr-2">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-1 border-r border-gray-300 font-mono">998346</td>
                        <td className="p-1 border-r border-gray-300 font-mono">{proformaTotals.taxable.toFixed(2)}</td>
                        <td className="p-1 border-r border-gray-300 font-mono">9% ({proformaTotals.cgst.toFixed(2)})</td>
                        <td className="p-1 border-r border-gray-300 font-mono">9% ({proformaTotals.sgst.toFixed(2)})</td>
                        <td className="p-1 text-right pr-2 font-mono">{(proformaTotals.cgst + proformaTotals.sgst).toFixed(2)}</td>
                      </tr>
                      <tr className="font-bold bg-slate-50">
                        <td className="p-1 border-r border-gray-300">TOTAL</td>
                        <td className="p-1 border-r border-gray-300 font-mono">{proformaTotals.taxable.toFixed(2)}</td>
                        <td className="p-1 border-r border-gray-300 font-mono">{proformaTotals.cgst.toFixed(2)}</td>
                        <td className="p-1 border-r border-gray-300 font-mono">{proformaTotals.sgst.toFixed(2)}</td>
                        <td className="p-1 text-right pr-2 font-mono">{(proformaTotals.cgst + proformaTotals.sgst).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. Bank Details, Stamp & Signatory */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black p-3 text-[11px]">
                  <div className="space-y-0.5 text-gray-900">
                    <p className="font-black text-black">Bank Details:</p>
                    <p>Bank: <strong>HDFC Bank</strong></p>
                    <p>Account #: <strong className="font-mono">50200111763991</strong></p>
                    <p>IFSC Code: <strong className="font-mono">HDFC0000582</strong></p>
                    <p>Branch: <strong>Kandivali East - Thakur Village</strong></p>
                    <p className="font-bold pt-1">ARCL Instruments Private Limited</p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 text-center space-y-1">
                    <p className="font-bold text-gray-800 text-[10px]">Pay using UPI:</p>
                    <div className="w-16 h-16 bg-white border border-gray-300 rounded p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
                      <img src="/assets/hdfc_qr.png" alt="UPI QR" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-mono text-[9px] text-gray-700 font-bold">8572995533.2@hdfc</p>
                  </div>

                  <div className="text-right space-y-1 flex flex-col justify-between items-end">
                    <p className="font-bold text-black text-[10px]">For ARCL INSTRUMENTS PRIVATE LIMITED</p>
                    <div className="w-20 h-16 flex items-center justify-center overflow-hidden">
                      <img src="/assets/arcl_stamp.png" alt="ARCL Seal & Sign" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-bold text-black text-[10px]">Authorized Signatory</p>
                  </div>
                </div>

                {/* 7. Terms and Conditions */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border p-3 space-y-1 text-[10px] text-gray-800">
                  <p className="font-bold text-black text-[11px]">Terms and Conditions:</p>
                  <p>1. This is an electronically generated document.</p>
                  <p>2. All disputes are subject to Mumbai jurisdiction</p>
                  <p>3. Payment: 100% advance.</p>
                  <p>4. Transportation as actual in customer scope.</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL ARCL QUOTATION LIVE VISUAL SHEET EDITOR (1:1 FORMAT) */}
      {/* ========================================================================= */}
      {isQuotationModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-6xl w-full shadow-2xl border border-blue-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-900">
            {/* Top Toolbar */}
            <div className="p-4 bg-gradient-to-r from-[#021C57] to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-cyan-300 rounded-xl border border-cyan-400/30 text-xl">
                  <FaFilePdf />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Official Quotation Live Visual Editor
                    </h2>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold">
                      Exact 1:1 ARCL Format
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Live editable paper sheet matching the official 3-page ARCL Commercial Quotation layout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  disabled={quotationSaving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <FaCheck /> {quotationSaving ? "Saving..." : "Save Quotation Changes"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const savedId = await handleSaveQuotation();
                    const sNo = quotationForm.quotationNo || "ARCL/QTN/26-27/47";
                    const recId = savedId || quotationRecordId || "";
                    const base = API?.defaults?.baseURL || "http://localhost:5000/api/v1";
                    window.open(`${base}/client/calibration/download-document?docType=quotation&download=true&recordId=${recId}&quotationNo=${encodeURIComponent(sNo)}&serialNo=${encodeURIComponent(sNo)}&t=${Date.now()}`, "_blank");
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <FaDownload /> Download Official PDF
                </button>


                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveQuotation();
                    setIsQuotationModalOpen(false);
                    handleOpenSendDocModal("quotation", {
                      _id: quotationRecordId,
                      recordId: quotationRecordId,
                      clientCompany: quotationForm.billTo?.companyName || "Valued Client",
                      clientEmail: quotationForm.billTo?.email || "harsh.mishra9023@gmail.com",
                      clientPhone: quotationForm.billTo?.phone || "9369962486",
                      instrument: quotationForm.items?.[0]?.name || "37 Instruments Package",
                      serialNo: quotationForm.quotationNo,
                      quotationData: quotationForm,
                    });
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <FaPaperPlane /> Dispatch to Customer
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuotationModalOpen(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>

            {/* Main Interactive Paper Sheet Canvas - PURE WHITE PAPER */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70 flex justify-center">
              <div 
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
                className="max-w-4xl w-full rounded-2xl shadow-2xl p-5 sm:p-8 space-y-4 border border-gray-300 text-xs font-sans"
              >
                
                {/* 1. Header Banner */}
                <div style={{ backgroundColor: "#2563eb" }} className="text-white text-center py-2 rounded-t-lg font-bold text-sm tracking-wider shadow-sm">
                  COMMERCIAL QUOTATION &amp; COST ESTIMATE
                </div>

                {/* 2. Top Header Grid */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
                  {/* Left: ARCL Info & Quotation To */}
                  <div className="p-3 space-y-3">
                    <div style={{ borderColor: "#000000" }} className="flex items-start gap-3 border-b pb-3">
                      <img src="/assets/LOGO.png" alt="ARCL Logo" className="h-12 object-contain" />
                      <div className="space-y-0.5 text-[11px] text-gray-900">
                        <h2 className="font-black text-black">ARCL INSTRUMENTS PRIVATE LIMITED</h2>
                        <p className="font-bold text-gray-800">GSTIN: 27ABDCA3876F1ZL</p>
                        <p className="font-bold text-gray-800">PAN: ABDCA3876F</p>
                        <p className="text-gray-700 text-[10px]">Shop No. 6, Siddivinayak Park CHS, Sector 8A,</p>
                        <p className="text-gray-700 text-[10px]">Airoli, Navi Mumbai, Maharashtra - 400708</p>
                        <p className="text-gray-700 text-[10px]">Mobile: +91 8369458583, +91 6205691085</p>
                        <p className="text-gray-700 text-[10px]">Email: arclinstruments@gmail.com</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="font-black text-black text-[11px]">Quotation To (Client Details):</p>
                      <input
                        type="text"
                        style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#bfdbfe" }}
                        value={quotationForm.billTo?.companyName || ""}
                        onChange={(e) => setQuotationForm({
                          ...quotationForm,
                          billTo: { ...(quotationForm.billTo || {}), companyName: e.target.value }
                        })}
                        className="w-full font-bold border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        placeholder="Client Company Name"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-[10px]">GSTIN:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                          value={quotationForm.billTo?.gstin || ""}
                          onChange={(e) => setQuotationForm({
                            ...quotationForm,
                            billTo: { ...(quotationForm.billTo || {}), gstin: e.target.value }
                          })}
                          className="font-mono text-gray-900 border rounded px-2 py-0.5 text-[11px] flex-1 focus:outline-none"
                        />
                      </div>
                      <p className="font-bold text-gray-800 text-[10px]">Billing Address:</p>
                      <textarea
                        rows={2}
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                        value={quotationForm.billTo?.address || ""}
                        onChange={(e) => setQuotationForm({
                          ...quotationForm,
                          billTo: { ...(quotationForm.billTo || {}), address: e.target.value }
                        })}
                        className="w-full text-[10px] text-gray-900 border rounded p-1.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Right: Quotation Metadata */}
                  <div className="p-3 space-y-3">
                    <div style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }} className="grid grid-cols-2 gap-2 p-2.5 border rounded">
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Quotation #:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#1e3a8a", borderColor: "#cbd5e1" }}
                          value={quotationForm.quotationNo}
                          onChange={(e) => setQuotationForm({ ...quotationForm, quotationNo: e.target.value })}
                          className="w-full font-mono font-bold border rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Quotation Date:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                          value={quotationForm.quotationDate}
                          onChange={(e) => setQuotationForm({ ...quotationForm, quotationDate: e.target.value })}
                          className="w-full text-gray-900 border rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Validity:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                          value={quotationForm.validityDate}
                          onChange={(e) => setQuotationForm({ ...quotationForm, validityDate: e.target.value })}
                          className="w-full text-gray-900 border rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 text-[10px]">Place of Supply:</span>
                        <input
                          type="text"
                          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#cbd5e1" }}
                          value={quotationForm.placeOfSupply}
                          onChange={(e) => setQuotationForm({ ...quotationForm, placeOfSupply: e.target.value })}
                          className="w-full text-gray-900 border rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 text-[10px]">Site / Delivery Location:</p>
                      <textarea
                        rows={2}
                        style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "#d1d5db" }}
                        value={quotationForm.billTo?.cityStatePin || "Thane, MAHARASHTRA, 421503"}
                        onChange={(e) => setQuotationForm({
                          ...quotationForm,
                          billTo: { ...(quotationForm.billTo || {}), cityStatePin: e.target.value }
                        })}
                        className="w-full text-[10px] text-gray-900 border rounded p-1.5 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Control Bar */}
                <div style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900">
                      Standard Items: {((quotationForm.items || defaultStandard37Items).length)} Instruments
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuotationForm({ ...quotationForm, items: defaultStandard37Items })}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <FaSync /> Reset 37 Items
                    </button>
                    <button
                      type="button"
                      onClick={handleAddQuotationItem}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <FaPlus /> Add Scope Item
                    </button>
                  </div>
                </div>

                {/* 3. Items Table */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border overflow-x-auto rounded">
                  <table style={{ backgroundColor: "#ffffff", color: "#111827" }} className="w-full text-left text-[11px] border-collapse">
                    <thead style={{ backgroundColor: "#2563eb", color: "#ffffff" }} className="font-bold text-[10px]">
                      <tr>
                        <th className="p-1.5 border-r border-blue-400 w-8 text-center text-white">#</th>
                        <th className="p-1.5 border-r border-blue-400 min-w-[220px] text-white">Item &amp; Calibration Scope</th>
                        <th className="p-1.5 border-r border-blue-400 w-20 text-center text-white">HSN/SAC</th>
                        <th className="p-1.5 border-r border-blue-400 w-16 text-center text-white">Qty</th>
                        <th className="p-1.5 border-r border-blue-400 w-24 text-right text-white">Rate (INR)</th>
                        <th className="p-1.5 w-28 text-right border-r border-blue-400 text-white">Amount (INR)</th>
                        <th className="p-1.5 w-8 text-center text-white">Del</th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: "#ffffff" }} className="divide-y divide-gray-300">
                      {(quotationForm.items || defaultStandard37Items).map((it, idx) => (
                        <tr 
                          key={idx} 
                          style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                          className="hover:bg-blue-50/40"
                        >
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center font-bold text-gray-800">{it.itemNo || idx + 1}</td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r space-y-1">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#0f172a", borderColor: "#e2e8f0" }}
                              value={it.name}
                              onChange={(e) => handleQuotationItemChange(idx, 'name', e.target.value)}
                              className="w-full font-bold border rounded px-1.5 py-0.5 text-[11px] focus:border-blue-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#475569", borderColor: "#e2e8f0" }}
                              value={it.subText || ""}
                              onChange={(e) => handleQuotationItemChange(idx, 'subText', e.target.value)}
                              className="w-full text-[10px] border rounded px-1.5 py-0.5 focus:border-blue-500 focus:outline-none"
                              placeholder="Subtitle"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="text"
                              style={{ backgroundColor: "#ffffff", color: "#334155", borderColor: "#e2e8f0" }}
                              value={it.hsnSac || "998346"}
                              onChange={(e) => handleQuotationItemChange(idx, 'hsnSac', e.target.value)}
                              className="w-16 font-mono text-center text-[10px] border rounded px-1 py-0.5 focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-center">
                            <input
                              type="number"
                              style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#bfdbfe" }}
                              value={it.qty}
                              onChange={(e) => handleQuotationItemChange(idx, 'qty', e.target.value)}
                              className="w-12 font-bold text-center border rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-right">
                            <input
                              type="number"
                              style={{ backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}
                              value={it.rate}
                              onChange={(e) => handleQuotationItemChange(idx, 'rate', e.target.value)}
                              className="w-20 font-mono text-right border rounded px-1 py-0.5 text-xs focus:outline-none"
                            />
                          </td>
                          <td style={{ borderColor: "#cbd5e1" }} className="p-1 border-r text-right font-mono font-bold text-black">
                            {Number(it.amount || it.rate * it.qty).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveQuotationItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs cursor-pointer"
                              title="Delete Item"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Live Taxable Summary & Amount in Words */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
                  <div className="p-3 space-y-2">
                    <p className="font-bold text-gray-800 text-[11px]">Amount Chargeable (in words):</p>
                    <p className="font-bold text-gray-900 text-xs">INR Thirty-Eight Thousand Three Hundred Fifty Only.</p>
                  </div>

                  <div className="p-3 space-y-1 text-right text-xs">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Taxable Amount:</span>
                      <span className="font-mono">₹ {(quotationTotals?.taxable || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>CGST 9.0%:</span>
                      <span className="font-mono">₹ {(quotationTotals?.cgst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>SGST 9.0%:</span>
                      <span className="font-mono">₹ {(quotationTotals?.sgst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ borderColor: "#000000" }} className="flex justify-between font-black text-black text-sm border-t pt-1">
                      <span>Total ({quotationTotals?.totalQty || 0} Qty):</span>
                      <span className="font-mono text-blue-900">₹ {(quotationTotals?.grand || quotationTotals?.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Bank Details, Stamp & Signatory */}
                <div style={{ borderColor: "#000000", backgroundColor: "#ffffff" }} className="border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black p-3 text-[11px]">
                  <div className="space-y-0.5 text-gray-900">
                    <p className="font-black text-black">Company's Bank Details:</p>
                    <p>Bank: <strong>HDFC Bank</strong></p>
                    <p>Account #: <strong className="font-mono">50200111763991</strong></p>
                    <p>IFSC Code: <strong className="font-mono">HDFC0000582</strong></p>
                    <p>Branch: <strong>Kandivali East - Thakur Village</strong></p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 text-center space-y-1">
                    <p className="font-bold text-gray-800 text-[10px]">Scan UPI to Pay:</p>
                    <div className="w-16 h-16 bg-white border border-gray-300 rounded p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
                      <img src="/assets/hdfc_qr.png" alt="UPI QR" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-mono text-[9px] text-gray-700 font-bold">8572995533.2@hdfc</p>
                  </div>

                  <div className="text-right space-y-1 flex flex-col justify-between items-end">
                    <p className="font-bold text-black text-[10px]">For ARCL INSTRUMENTS PRIVATE LIMITED</p>
                    <div className="w-20 h-16 flex items-center justify-center overflow-hidden">
                      <img src="/assets/arcl_stamp.png" alt="ARCL Seal & Sign" className="w-full h-full object-contain" />
                    </div>
                    <p className="font-bold text-black text-[10px]">Authorized Signatory</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: SEND SPECIFIC OR ALL SRF PDF DOCUMENTS TO CUSTOMER */}
      {/* ========================================================================= */}
      {isSendDocModalOpen && docToSend && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shadow-inner">
                  <FaFilePdf className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Dispatch SRF &amp; Calibration Documents
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Select individual documents or send all files together to customer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSendDocModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Instrument Summary Card */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50/50 to-slate-50 p-4 rounded-2xl border border-indigo-100 space-y-2 text-xs">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{docToSend.record?.instrument}</p>
                  <p className="text-gray-500 text-[11px]">Client: <strong className="text-gray-900">{docToSend.record?.clientCompany}</strong></p>
                </div>
                <span className="px-2.5 py-0.5 bg-[#021C57] text-white font-mono text-[10px] rounded-full font-bold shadow-xs">
                  S/N: {docToSend.record?.serialNo}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600 pt-2 border-t border-indigo-100/70 text-[11px]">
                <div>Make / Model: <strong>{docToSend.record?.make} {docToSend.record?.modelNo}</strong></div>
                <div>Status: <strong className="text-emerald-700">{docToSend.record?.stage || "Calibration Done"}</strong></div>
              </div>
            </div>

            {/* Document Selection Section (Select All / Individual Checkboxes) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <FaCertificate className="text-blue-600" /> Choose Documents to Dispatch ({selectedDocTypes.length} Selected):
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllDocs}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  {selectedDocTypes.length === allAvailableDocOptions.length ? "Deselect All" : "☑️ Select All (Sabhi Bhejo)"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allAvailableDocOptions.map((docOpt) => {
                  const isChecked = selectedDocTypes.includes(docOpt.type);
                  return (
                    <div
                      key={docOpt.type}
                      onClick={() => toggleSelectDocType(docOpt.type)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isChecked
                          ? "bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{docOpt.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{docOpt.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700 shrink-0">
                        PDF
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Editable Recipient Contacts */}
            <div className="space-y-3 text-xs pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span><FaEnvelope className="text-blue-600 inline mr-1" /> Customer Email:</span>
                    <span className="text-[10px] text-emerald-600 font-mono">SMTP ✓</span>
                  </label>
                  <input
                    type="email"
                    value={docTargetEmail}
                    onChange={(e) => setDocTargetEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span><FaWhatsapp className="text-emerald-600 inline mr-1" /> WhatsApp Mobile:</span>
                    <span className="text-[10px] text-emerald-600 font-mono">WhatsApp ✓</span>
                  </label>
                  <input
                    type="tel"
                    value={docTargetPhone}
                    onChange={(e) => setDocTargetPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Optional Custom Note to Customer:
                </label>
                <input
                  type="text"
                  value={docCustomNote}
                  onChange={(e) => setDocCustomNote(e.target.value)}
                  placeholder="e.g. Please find the official quotation / calibration certificate attached."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 3 Main Choice Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-800 text-center mb-1">
                Kaha bhejna chahte hain? ({selectedDocTypes.length} document(s) included)
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Option 1: Mail Only */}
                <button
                  type="button"
                  onClick={() => handleDispatchSpecificDoc("email")}
                  className="p-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 hover:border-blue-600 rounded-2xl font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaEnvelope className="text-lg group-hover:scale-110 transition" />
                  <span>Mail Only</span>
                  <span className="text-[10px] font-normal opacity-80">(Bus Email)</span>
                </button>

                {/* Option 2: WhatsApp Only */}
                <button
                  type="button"
                  onClick={() => handleDispatchSpecificDoc("whatsapp")}
                  className="p-3 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 hover:border-emerald-600 rounded-2xl font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaWhatsapp className="text-lg text-emerald-600 group-hover:text-white group-hover:scale-110 transition" />
                  <span>WhatsApp Only</span>
                  <span className="text-[10px] font-normal opacity-80">(Bus WhatsApp)</span>
                </button>

                {/* Option 3: Both (Email + WhatsApp) */}
                <button
                  type="button"
                  onClick={() => handleDispatchSpecificDoc("both")}
                  className="p-3 bg-gradient-to-r from-[#021C57] to-indigo-900 hover:from-blue-900 hover:to-indigo-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaBolt className="text-lg text-amber-400 group-hover:scale-110 transition" />
                  <span>Both (Mail + WA)</span>
                  <span className="text-[10px] font-normal text-amber-300">(Dono pe bhejo)</span>
                </button>
              </div>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setIsSendDocModalOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline cursor-pointer"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH AUTO-DISPATCH PREVIEW & CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isBatchConfirmOpen && (() => {
        const safeRecords = Array.isArray(records) && records.length > 0 ? records : defaultInitialCalibrationRecords;
        const days = parseInt(reminderTemplate.thresholdDays, 10) || 30;
        const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        const dueMap = {};

        // 1. Process Database Records
        safeRecords.forEach((r) => {
          const isDue = r?.calibrationDueDate ? new Date(r.calibrationDueDate) <= cutoffDate : true;
          if (isDue) {
            const org = r.clientCompany || "Registered Client";
            if (!dueMap[org]) {
              dueMap[org] = {
                company: org,
                contactPerson: r.clientContactPerson || "Quality Manager",
                email: r.clientEmail || "arclinstruments@gmail.com",
                phone: r.clientPhone || "+91 8009559900",
                instruments: [],
              };
            }
            dueMap[org].instruments.push(r);
          }
        });

        // 2. Process Custom Candidate Entries
        const safeCandidates = Array.isArray(customCandidates) ? customCandidates : [];
        safeCandidates.forEach((cand) => {
          const isDue = cand?.dueDate ? new Date(cand.dueDate) <= cutoffDate : true;
          if (isDue) {
            const org = cand.company || "External Candidate";
            if (!dueMap[org]) {
              dueMap[org] = {
                company: org,
                contactPerson: cand.contactPerson || "Quality Manager",
                email: cand.email || "arclinstruments@gmail.com",
                phone: cand.phone || "+91 8009559900",
                instruments: [],
              };
            }
            dueMap[org].instruments.push({
              instrument: cand.instrumentName || "Precision Testing Instrument",
              serialNo: cand.serialNo || "N/A",
              calibrationDueDate: cand.dueDate,
            });
          }
        });

        const dueOrgs = Object.keys(dueMap);
        let totalDueCount = 0;
        dueOrgs.forEach((org) => {
          totalDueCount += dueMap[org].instruments.length;
        });

        return (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center text-xl shadow-inner">
                    <FaPaperPlane className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Batch Due Notice Auto-Dispatch Preview
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Window: Next {days} Days | NABL ISO/IEC 17025 Metrology Desk
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchConfirmOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <FaTimes className="text-base" />
                </button>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <p className="text-gray-600 font-bold">Eligible Organizations:</p>
                  <p className="text-xl font-black text-blue-900 font-mono mt-1">{dueOrgs.length} Clients</p>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <p className="text-gray-600 font-bold">Total Instruments Due:</p>
                  <p className="text-xl font-black text-rose-700 font-mono mt-1">{totalDueCount} Units</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                  <p className="text-gray-600 font-bold">Dispatch Channel:</p>
                  <p className="text-xs font-black text-emerald-800 font-mono mt-2">SMTP Direct + WA Link</p>
                </div>
              </div>

              {/* Recipient List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>Target Client Organizations &amp; Recipients (Kisko Jayega):</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">● Live Verified Data</span>
                </p>
                <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                  {dueOrgs.length > 0 ? (
                    dueOrgs.map((org, i) => {
                      const clientObj = dueMap[org];
                      return (
                        <div key={i} className="p-3 hover:bg-blue-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                              <p className="font-bold text-gray-900 text-sm">{clientObj.company}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
                              <span className="font-mono text-blue-700 font-semibold flex items-center gap-1">
                                <FaEnvelope className="text-blue-500 text-[10px]" /> {clientObj.email}
                              </span>
                              <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                                <FaWhatsapp className="text-emerald-600 text-[10px]" /> {clientObj.phone}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {clientObj.instruments.map((inst, idx) => (
                                <span key={idx} className="block">
                                  • {inst.instrument} {inst.serialNo && inst.serialNo !== "N/A" ? `(S/N: ${inst.serialNo})` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1">
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full font-bold font-mono text-[11px] border border-rose-200 whitespace-nowrap">
                              🔴 Due Soon (Jayega)
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {clientObj.instruments.length} instrument(s)
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No instruments currently due within {days} days.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <FaBolt className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Dispatches official calibration due notice using the currently saved dynamic template subject, body, and ISO/IEC 17025 letterhead.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBatchConfirmOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAutoDispatchAll}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#021C57] to-indigo-900 hover:from-blue-900 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/30 cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <FaPaperPlane className="text-amber-300" /> Confirm &amp; Dispatch All ({dueOrgs.length} Clients)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: SINGLE RECIPIENT / CLIENT CALIBRATION DUE NOTICE COMPOSER */}
      {/* ========================================================================= */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center text-lg shadow-inner">
                  <FaPaperPlane className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Send Calibration Due Notice
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedReminderClient || "Direct Customer Notice"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Recipient Contact Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Recipient Email (SMTP):
                </label>
                <input
                  type="email"
                  value={customReminderEmail}
                  onChange={(e) => setCustomReminderEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Recipient WhatsApp / Mobile:
                </label>
                <input
                  type="tel"
                  value={customReminderPhone}
                  onChange={(e) => setCustomReminderPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Editable Subject & Body */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Notice Subject:</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomizingModalMessage(!isCustomizingModalMessage)}
                    className="text-[10px] text-blue-600 font-bold underline cursor-pointer"
                  >
                    {isCustomizingModalMessage ? "Lock Edits" : "✏️ Customize"}
                  </button>
                </label>
                <input
                  type="text"
                  value={customModalSubject}
                  onChange={(e) => setCustomModalSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Notice Message Body:
                </label>
                <textarea
                  rows={4}
                  value={customModalMessage}
                  onChange={(e) => setCustomModalMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>
            </div>

            {/* 3 Main Choice Dispatch Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-800 text-center mb-1">
                Kaha bhejna chahte hain?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleDispatchEmailFromModal}
                  className="p-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 hover:border-blue-600 rounded-2xl font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaEnvelope className="text-lg group-hover:scale-110 transition" />
                  <span>Mail Only</span>
                  <span className="text-[10px] font-normal opacity-80">(Bus Email)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchWhatsAppFromModal}
                  className="p-3 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 hover:border-emerald-600 rounded-2xl font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaWhatsapp className="text-lg text-emerald-600 group-hover:text-white group-hover:scale-110 transition" />
                  <span>WhatsApp Only</span>
                  <span className="text-[10px] font-normal opacity-80">(Bus WhatsApp)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchBothFromModal}
                  className="p-3 bg-gradient-to-r from-[#021C57] to-indigo-900 hover:from-blue-900 hover:to-indigo-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaBolt className="text-lg text-amber-400 group-hover:scale-110 transition" />
                  <span>Both (Mail + WA)</span>
                  <span className="text-[10px] font-normal text-amber-300">(Dono pe bhejo)</span>
                </button>
              </div>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline cursor-pointer"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FULL AD-HOC MANUAL DUE COMPOSER MODAL */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-900 flex items-center justify-center text-lg shadow-inner">
                  <FaEdit className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Full Manual Due Notice Composer
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Send ad-hoc notice to any client, email, or mobile number instantly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Company / Organization:</label>
                  <input
                    type="text"
                    value={manualDispatchForm.company}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Larsen & Toubro"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Contact Person:</label>
                  <input
                    type="text"
                    value={manualDispatchForm.contactPerson}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Mr. Rajesh Kumar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Recipient Email:</label>
                  <input
                    type="email"
                    value={manualDispatchForm.email}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="client.qa@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">WhatsApp Mobile:</label>
                  <input
                    type="tel"
                    value={manualDispatchForm.phone}
                    onChange={(e) => setManualDispatchForm({ ...manualDispatchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Notice Subject:</label>
                <input
                  type="text"
                  value={reminderTemplate.subject}
                  onChange={(e) => setReminderTemplate({ ...reminderTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Notice Message:</label>
                <textarea
                  rows={3}
                  value={reminderTemplate.introMessage}
                  onChange={(e) => setReminderTemplate({ ...reminderTemplate, introMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-800 text-center mb-1">
                Kaha bhejna chahte hain?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSendManualCustomDispatch("email")}
                  className="p-3 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 hover:border-blue-600 rounded-2xl font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaEnvelope className="text-lg group-hover:scale-110 transition" />
                  <span>Mail Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendManualCustomDispatch("whatsapp")}
                  className="p-3 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 hover:border-emerald-600 rounded-2xl font-bold text-xs shadow-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaWhatsapp className="text-lg text-emerald-600 group-hover:text-white group-hover:scale-110 transition" />
                  <span>WhatsApp Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendManualCustomDispatch("both")}
                  className="p-3 bg-gradient-to-r from-[#021C57] to-indigo-900 hover:from-blue-900 hover:to-indigo-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group"
                >
                  <FaBolt className="text-lg text-amber-400 group-hover:scale-110 transition" />
                  <span>Both (Mail + WA)</span>
                </button>
              </div>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline cursor-pointer"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CANDIDATE EMAIL / ORG TO DUE DIRECTORY */}
      {/* ========================================================================= */}
      {isAddCandidateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shadow-inner">
                  <FaPlus className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Add Candidate Email to Due Directory
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Register a client organization, email, and instrument due date in directory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCandidateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            <form onSubmit={handleAddCandidateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.company}
                    onChange={(e) => setCandidateForm({ ...candidateForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. ABC Tech Solutions"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={candidateForm.contactPerson}
                    onChange={(e) => setCandidateForm({ ...candidateForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Ramesh Patel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Recipient Email *</label>
                  <input
                    type="email"
                    required
                    value={candidateForm.email}
                    onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="qa@company.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">WhatsApp Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={candidateForm.phone}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Instrument Name</label>
                  <input
                    type="text"
                    value={candidateForm.instrumentName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, instrumentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Digital Compression Testing Machine"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Serial No.</label>
                  <input
                    type="text"
                    value={candidateForm.serialNo}
                    onChange={(e) => setCandidateForm({ ...candidateForm, serialNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold text-blue-700 focus:ring-2 focus:ring-emerald-500"
                    placeholder="ARCL-CTM-1029"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Calibration Due Date</label>
                <input
                  type="date"
                  value={candidateForm.dueDate}
                  onChange={(e) => setCandidateForm({ ...candidateForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold text-rose-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddCandidateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <FaCheck /> Add to Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: EDIT CANDIDATE / CLIENT DETAILS IN DIRECTORY */}
      {/* ========================================================================= */}
      {isEditCandidateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg shadow-inner">
                  <FaEdit className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Edit Recipient &amp; Instrument Schedule
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Modify client details, email address, phone, or recalibration due date
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCandidateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCandidateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={editCandidateForm.company}
                    onChange={(e) => setEditCandidateForm({ ...editCandidateForm, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={editCandidateForm.contactPerson}
                    onChange={(e) => setEditCandidateForm({ ...editCandidateForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Recipient Email (SMTP) *</label>
                  <input
                    type="email"
                    required
                    value={editCandidateForm.email}
                    onChange={(e) => setEditCandidateForm({ ...editCandidateForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">WhatsApp Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={editCandidateForm.phone}
                    onChange={(e) => setEditCandidateForm({ ...editCandidateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Instrument Name</label>
                  <input
                    type="text"
                    value={editCandidateForm.instrumentName}
                    onChange={(e) => setEditCandidateForm({ ...editCandidateForm, instrumentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Serial No.</label>
                  <input
                    type="text"
                    value={editCandidateForm.serialNo}
                    onChange={(e) => setEditCandidateForm({ ...editCandidateForm, serialNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Calibration Due Date:</span>
                  <span className="text-[10px] text-gray-500 font-mono">Changes recalculate due notice status instantly</span>
                </label>
                <input
                  type="date"
                  value={editCandidateForm.dueDate}
                  onChange={(e) => setEditCandidateForm({ ...editCandidateForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold text-rose-700 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditCandidateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <FaCheck /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MULTI-SELECT DELETE MANAGEMENT & CLEANUP MODAL (Data Delete Management Center) */}
      {/* ========================================================================= */}
      {isDeleteManagerOpen && (() => {
        // Calculate dynamic live count of records to be deleted
        let estimatedRecordsCount = 0;
        if (deleteTargets.databaseRecords) {
          if (deleteCompanyFilterMode === "all" && deleteStageFilterMode === "all") {
            estimatedRecordsCount = records.length;
          } else {
            estimatedRecordsCount = records.filter((r) => {
              const matchComp = deleteCompanyFilterMode === "all" || selectedDeleteCompanies.includes(r.clientCompany);
              const matchStg = deleteStageFilterMode === "all" || selectedDeleteStages.includes(r.stage);
              return matchComp && matchStg;
            }).length;
          }
        }

        const estimatedCandidatesCount = deleteTargets.customCandidates ? customCandidates.length : 0;
        const estimatedLogsCount = deleteTargets.dispatchLogs ? dispatchHistory.length : 0;
        const totalItemsCount = estimatedRecordsCount + estimatedCandidatesCount + estimatedLogsCount;

        const handleToggleSelectAll = (check) => {
          setDeleteTargets({
            databaseRecords: check,
            customCandidates: check,
            dispatchLogs: check,
            localCache: check,
          });
          if (check) {
            setDeleteCompanyFilterMode("all");
            setSelectedDeleteCompanies(uniqueClients);
            setDeleteStageFilterMode("all");
          }
        };

        const handleToggleCompany = (companyName) => {
          setSelectedDeleteCompanies((prev) =>
            prev.includes(companyName)
              ? prev.filter((c) => c !== companyName)
              : [...prev, companyName]
          );
        };

        const handleToggleStage = (stageName) => {
          setSelectedDeleteStages((prev) =>
            prev.includes(stageName)
              ? prev.filter((s) => s !== stageName)
              : [...prev, stageName]
          );
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden font-sans my-8">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/20 rounded-2xl text-rose-300 text-xl border border-rose-400/30">
                    <FaTrashAlt />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                      Multi-Select Data Cleanup Center
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 font-mono font-bold">
                        MULTI-SELECT
                      </span>
                    </h3>
                    <p className="text-xs text-rose-200">
                      Data Delete Management Center • Select &amp; Delete Multiple Items in One Go
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteManagerOpen(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Quick Preset Selector Buttons */}
              <div className="bg-slate-50 px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <FaSlidersH className="text-rose-600" /> Quick Presets:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    ✓ Select All Everything
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTargets({ databaseRecords: true, customCandidates: false, dispatchLogs: false, localCache: false });
                      setDeleteCompanyFilterMode("all");
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    🏢 Records Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTargets({ databaseRecords: false, customCandidates: false, dispatchLogs: true, localCache: true });
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    📜 Logs &amp; Cache Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    ✕ Clear All Checks
                  </button>
                </div>
              </div>

              {/* Modal Body with Checkbox Categories */}
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
                <p className="font-bold text-gray-900 text-xs flex items-center justify-between">
                  <span>1. Check all items you want to delete (Jo-jo hatana hai unhe tick karein):</span>
                  <span className="text-[11px] text-rose-600 font-mono font-bold">
                    {totalItemsCount} item(s) selected
                  </span>
                </p>

                {/* TARGET 1: Instrument & SRF Records */}
                <div
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    deleteTargets.databaseRecords
                      ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-100"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteTargets.databaseRecords}
                      onChange={(e) =>
                        setDeleteTargets({ ...deleteTargets, databaseRecords: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-black text-rose-950 text-xs sm:text-sm flex items-center gap-1.5">
                          <FaCertificate className="text-rose-600" /> 1. Customer Instruments &amp; SRF Records (Database Records)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-200 text-rose-900">
                          {records.length} Total in DB
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Deletes official calibration records, certificates, calibration due dates, and SRF entries.
                      </p>
                    </div>
                  </label>

                  {/* Sub-Filters for Database Records */}
                  {deleteTargets.databaseRecords && (
                    <div className="pl-7 pt-2 border-t border-rose-200/80 space-y-3">
                      {/* Company Selection Sub-filter */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-gray-800 text-[11px]">Filter by Organization / Companies:</span>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-gray-700 text-[11px]">
                              <input
                                type="radio"
                                name="compFilterMode"
                                checked={deleteCompanyFilterMode === "all"}
                                onChange={() => setDeleteCompanyFilterMode("all")}
                                className="text-rose-600"
                              />
                              All Companies ({records.length})
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-gray-700 text-[11px]">
                              <input
                                type="radio"
                                name="compFilterMode"
                                checked={deleteCompanyFilterMode === "selected"}
                                onChange={() => {
                                  setDeleteCompanyFilterMode("selected");
                                  if (selectedDeleteCompanies.length === 0) setSelectedDeleteCompanies(uniqueClients);
                                }}
                                className="text-rose-600"
                              />
                              Select Specific
                            </label>
                          </div>
                        </div>

                        {deleteCompanyFilterMode === "selected" && (
                          <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 border-b pb-1">
                              <span>Choose companies to delete:</span>
                              <div className="space-x-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDeleteCompanies(uniqueClients)}
                                  className="text-blue-600 hover:underline cursor-pointer"
                                >
                                  Select All ({uniqueClients.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDeleteCompanies([])}
                                  className="text-gray-500 hover:underline cursor-pointer"
                                >
                                  Deselect All
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                              {uniqueClients.map((client) => {
                                const count = records.filter((r) => r.clientCompany === client).length;
                                const isChecked = selectedDeleteCompanies.includes(client);
                                return (
                                  <label
                                    key={client}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] cursor-pointer transition ${
                                      isChecked
                                        ? "bg-rose-50 border-rose-300 font-bold text-rose-900"
                                        : "bg-gray-50 border-gray-200 text-gray-600"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleCompany(client)}
                                      className="text-rose-600 rounded"
                                    />
                                    <span className="truncate flex-1">{client}</span>
                                    <span className="font-mono text-[10px] text-gray-500 font-normal">
                                      ({count})
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stage Selection Sub-filter */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-gray-800 text-[11px]">Filter by Pipeline Stage:</span>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-gray-700 text-[11px]">
                              <input
                                type="radio"
                                name="stageFilterMode"
                                checked={deleteStageFilterMode === "all"}
                                onChange={() => setDeleteStageFilterMode("all")}
                                className="text-rose-600"
                              />
                              All Stages
                            </label>
                            <label className="inline-flex items-center gap-1 cursor-pointer font-semibold text-gray-700 text-[11px]">
                              <input
                                type="radio"
                                name="stageFilterMode"
                                checked={deleteStageFilterMode === "selected"}
                                onChange={() => {
                                  setDeleteStageFilterMode("selected");
                                  if (selectedDeleteStages.length === 0) {
                                    setSelectedDeleteStages([
                                      "Delivered to Client",
                                      "SRF Received",
                                      "Calibration In Progress",
                                      "Quality Reviewed",
                                      "Invoice Generated",
                                    ]);
                                  }
                                }}
                                className="text-rose-600"
                              />
                              Select Specific
                            </label>
                          </div>
                        </div>

                        {deleteStageFilterMode === "selected" && (
                          <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-1.5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {[
                                "Delivered to Client",
                                "SRF Received",
                                "Calibration In Progress",
                                "Quality Reviewed",
                                "Invoice Generated",
                                "Instrument Received",
                                "Under Calibration",
                                "Calibration Done",
                                "Invoice Sent",
                                "Certificate Uploaded",
                              ].map((stg) => {
                                const count = records.filter((r) => r.stage === stg).length;
                                const isChecked = selectedDeleteStages.includes(stg);
                                return (
                                  <label
                                    key={stg}
                                    className={`flex items-center gap-1.5 p-1 rounded-lg border text-[10px] cursor-pointer transition ${
                                      isChecked
                                        ? "bg-rose-50 border-rose-300 font-bold text-rose-900"
                                        : "bg-gray-50 border-gray-200 text-gray-600"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleStage(stg)}
                                      className="text-rose-600 rounded"
                                    />
                                    <span className="truncate flex-1">{stg}</span>
                                    <span className="font-mono text-gray-500">({count})</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* TARGET 2: Custom Candidates Directory */}
                <div
                  className={`p-4 rounded-2xl border transition ${
                    deleteTargets.customCandidates
                      ? "bg-purple-50/60 border-purple-300 ring-2 ring-purple-100"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteTargets.customCandidates}
                      onChange={(e) =>
                        setDeleteTargets({ ...deleteTargets, customCandidates: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-purple-950 text-xs sm:text-sm flex items-center gap-1.5">
                          <FaUserTie className="text-purple-600" /> 2. Custom Candidates &amp; Recipient Emails Directory (Extra Emails Directory)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-200 text-purple-900">
                          {customCandidates.length} Candidates
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Removes manually added email and WhatsApp contact recipients from the Due Notification Directory.
                      </p>
                    </div>
                  </label>
                </div>

                {/* TARGET 3: Email Dispatch Logs */}
                <div
                  className={`p-4 rounded-2xl border transition ${
                    deleteTargets.dispatchLogs
                      ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-100"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteTargets.dispatchLogs}
                      onChange={(e) =>
                        setDeleteTargets({ ...deleteTargets, dispatchLogs: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-950 text-xs sm:text-sm flex items-center gap-1.5">
                          <FaPaperPlane className="text-blue-600" /> 3. Email &amp; Notice Dispatch Audit Logs (Audit History)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-200 text-blue-900">
                          {dispatchHistory.length} Log Entries
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Clears the logged audit entries of previously dispatched calibration reminder emails and delivery notices.
                      </p>
                    </div>
                  </label>
                </div>

                {/* TARGET 4: Browser Local Cache */}
                <div
                  className={`p-4 rounded-2xl border transition ${
                    deleteTargets.localCache
                      ? "bg-slate-100 border-slate-300 ring-2 ring-slate-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteTargets.localCache}
                      onChange={(e) =>
                        setDeleteTargets({ ...deleteTargets, localCache: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-slate-700 rounded focus:ring-slate-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-950 text-xs sm:text-sm flex items-center gap-1.5">
                          <FaSync className="text-slate-600" /> 4. Browser Local Storage Cache &amp; Saved Drafts (Local Cache)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-900">
                          Storage Keys
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Clears locally cached candidate lists and unsaved browser form states.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Live Calculated Impact Banner */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <FaExclamationTriangle className="text-amber-600 text-sm" />
                    <span>Live Deletion Summary (Hatne wali cheezon ka vivran):</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Will delete: <strong>{estimatedRecordsCount} Instrument Record(s)</strong>,{" "}
                    <strong>{estimatedCandidatesCount} Custom Candidate(s)</strong>, and{" "}
                    <strong>{estimatedLogsCount} Dispatch Log(s)</strong>.
                  </p>
                  {totalItemsCount === 0 && (
                    <p className="text-[11px] text-rose-600 font-bold">
                      ⚠️ No items selected. Check at least one option above to proceed.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Confirmation Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteManagerOpen(false)}
                  disabled={isDeletingScope}
                  className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-300 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSelectiveDelete}
                  disabled={isDeletingScope || totalItemsCount === 0}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTrashAlt className={isDeletingScope ? "animate-spin" : ""} />
                  <span>
                    {isDeletingScope
                      ? "Deleting Selected Items..."
                      : `Confirm & Delete Selected Items (${totalItemsCount})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT NABL LAB PROFILE & ACCREDITATION SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {isEditLabProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <FaCertificate className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Edit NABL Lab Profile &amp; Settings</h3>
                  <p className="text-xs text-blue-200 font-medium">Accreditation details, certificate no., validity &amp; business rates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditLabProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveLabProfile} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Laboratory Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={labProfileForm.labName}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, labName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs transition"
                    placeholder="e.g. ARCL Instruments Pvt. Ltd."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Laboratory Identification Code
                  </label>
                  <input
                    type="text"
                    required
                    value={labProfileForm.labCode}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, labCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs transition"
                    placeholder="e.g. ARCL-LAB-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Accreditation Standard
                  </label>
                  <input
                    type="text"
                    required
                    value={labProfileForm.accreditationStandard}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, accreditationStandard: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs transition"
                    placeholder="e.g. ISO/IEC 17025:2017"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NABL Certificate Number
                  </label>
                  <input
                    type="text"
                    required
                    value={labProfileForm.certificateNo}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, certificateNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono font-bold text-indigo-900 text-xs transition"
                    placeholder="e.g. CC-4313"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Accreditation Validity Date
                  </label>
                  <input
                    type="date"
                    required
                    value={labProfileForm.validUntil}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Accreditation Status
                  </label>
                  <select
                    value={labProfileForm.status}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-900 text-xs transition"
                  >
                    <option value="Active">Active (Fully Accredited)</option>
                    <option value="Under Audit">Under Surveillance Audit</option>
                    <option value="Renewal Pending">Renewal Pending</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  National / International Master Traceability Body
                </label>
                <input
                  type="text"
                  value={labProfileForm.masterTraceability}
                  onChange={(e) => setLabProfileForm({ ...labProfileForm, masterTraceability: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-900 text-xs transition"
                  placeholder="e.g. National Physical Laboratory (NPL), New Delhi & ERTL"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Referral Lab Code
                  </label>
                  <input
                    type="text"
                    value={labProfileForm.referralCode}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, referralCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono text-xs transition"
                    placeholder="ARCL-LAB-01"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Partner Margin (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={labProfileForm.referralRate}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, referralRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono text-xs transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Annual Sub Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={labProfileForm.annualSubscriptionRate}
                    onChange={(e) => setLabProfileForm({ ...labProfileForm, annualSubscriptionRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono text-xs transition"
                  />
                </div>
              </div>

              <div className="bg-slate-50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditLabProfileOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={labScopeSaving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <FaCheck className={labScopeSaving ? "animate-spin" : ""} />
                  <span>{labScopeSaving ? "Saving..." : "Save Profile Settings"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT NABL SCOPE PARAMETER MATRIX ITEM */}
      {/* ------------------------------------------------------------- */}
      {(isAddScopeModalOpen || isEditScopeModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <FaTools className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isEditScopeModalOpen ? "Edit Scope Parameter" : "Add New NABL Scope Parameter"}
                  </h3>
                  <p className="text-xs text-emerald-200 font-medium">
                    Configure discipline, measurement range, CMC uncertainty &amp; standard methods
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddScopeModalOpen(false);
                  setIsEditScopeModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveScopeItem} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Calibration Discipline
                  </label>
                  <select
                    value={scopeItemForm.discipline}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, discipline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-bold text-slate-900 text-xs transition"
                  >
                    <option value="Mechanical & Force">Mechanical &amp; Force (CTM, UTM, Proving Rings, Torque)</option>
                    <option value="Thermal & Temperature">Thermal &amp; Temperature (Ovens, Thermocouples, Baths)</option>
                    <option value="Electro-Technical">Electro-Technical (Multimeters, Clamp Meters, Meggers)</option>
                    <option value="Fluid Flow & Pressure">Fluid Flow &amp; Pressure (Pressure Gauges, Transmitters)</option>
                    <option value="Dimensional & Metrology">Dimensional &amp; Metrology (Vernier, Micrometer, Gauges)</option>
                    <option value="Chemical & Soil/Cement">Chemical &amp; Soil/Cement (pH, Conductivity, Vicat)</option>
                    <option value="Speed & RPM">Speed &amp; RPM (Tachometers, Centrifuges)</option>
                    <option value="Acoustic & Vibration">Acoustic &amp; Vibration (Sound Level Meters, Accelerometers)</option>
                    <option value="Optical & Lux">Optical &amp; Lux (Lux Meters, Spectrophotometers)</option>
                    <option value="Other">Other Civil &amp; Material Testing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Parameter / Instrument Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={scopeItemForm.parameter}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, parameter: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-bold text-slate-900 text-xs transition"
                    placeholder="e.g. Compression Testing Machine (CTM)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Calibration Range / Scope
                  </label>
                  <input
                    type="text"
                    required
                    value={scopeItemForm.range}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, range: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-mono text-slate-900 text-xs transition"
                    placeholder="e.g. 0 to 2000 kN"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CMC / Measurement Uncertainty (±)
                  </label>
                  <input
                    type="text"
                    required
                    value={scopeItemForm.cmc}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, cmc: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-mono font-bold text-emerald-800 text-xs transition"
                    placeholder="e.g. ± 1.0 % or better"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Master Reference Standard / Equipment
                  </label>
                  <input
                    type="text"
                    value={scopeItemForm.masterStandard}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, masterStandard: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium text-slate-900 text-xs transition"
                    placeholder="e.g. Class 1 Load Cells & Proving Rings"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Calibration Standard Method
                  </label>
                  <input
                    type="text"
                    value={scopeItemForm.standardMethod}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, standardMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium text-slate-900 text-xs transition"
                    placeholder="e.g. IS 14858 / ISO 7500-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Master Traceability Origin
                  </label>
                  <input
                    type="text"
                    value={scopeItemForm.traceability}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, traceability: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium text-slate-900 text-xs transition"
                    placeholder="e.g. NPL, New Delhi"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Facility Type
                  </label>
                  <select
                    value={scopeItemForm.facility}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, facility: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-medium text-slate-900 text-xs transition"
                  >
                    <option value="On-Site & Permanent Lab">On-Site &amp; Permanent Lab (Dono Jagah)</option>
                    <option value="Permanent Lab Only">Permanent Lab Only (Lab Me Hi)</option>
                    <option value="On-Site Only">On-Site Only (Client Site Par)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={scopeItemForm.active}
                    onChange={(e) => setScopeItemForm({ ...scopeItemForm, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Active in NABL Scope (Portal aur Search me dikhega)</span>
                </label>
              </div>

              <div className="bg-slate-50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddScopeModalOpen(false);
                    setIsEditScopeModalOpen(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={labScopeSaving}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <FaCheck className={labScopeSaving ? "animate-spin" : ""} />
                  <span>{labScopeSaving ? "Saving..." : (isEditScopeModalOpen ? "Update Parameter" : "Add Parameter to Scope")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CUSTOM PO PREVIEW & VIEWER MODAL */}
      {/* ========================================================================= */}
      {isPoPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-6xl w-full shadow-2xl border border-emerald-500/30 max-h-[96vh] flex flex-col overflow-hidden text-gray-100">
            {/* Top Toolbar */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30 text-xl shrink-0">
                  <FaFilePdf />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white truncate">
                      Uploaded PO: {poPreviewData.fileName || "Purchase Order"}
                    </h2>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-mono font-bold shrink-0">
                      ✅ PO Attached
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200 truncate">
                    Client: <strong className="text-white">{poPreviewData.record?.clientCompany || "N/A"}</strong> • Equipment: <strong className="text-white">{poPreviewData.record?.instrument || "N/A"}</strong> (S/N: {poPreviewData.record?.serialNo || "N/A"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadActivePo}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Download PO to your device"
                >
                  <FaDownload /> Download PO
                </button>

                <button
                  type="button"
                  onClick={handleOpenActivePoNewTab}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  title="Open in new browser tab"
                >
                  <FaEye /> Open in New Tab
                </button>

                {poPreviewData.record && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPoPreviewModalOpen(false);
                      handleOpenSendDocModal("po", poPreviewData.record);
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    title="Send PO to customer via Email/WhatsApp"
                  >
                    <FaPaperPlane /> Dispatch to Client
                  </button>
                )}

                {poPreviewData.record && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPoPreviewModalOpen(false);
                      handleTriggerPoUpload(poPreviewData.record);
                    }}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    title="Replace or re-upload from device gallery"
                  >
                    <FaUpload /> Re-upload
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsPoPreviewModalOpen(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Close viewer"
                >
                  <FaTimes className="text-base" />
                </button>
              </div>
            </div>

            {/* Document Display Canvas */}
            <div className="flex-1 overflow-hidden p-3 sm:p-6 bg-slate-950/80 flex flex-col items-center justify-center">
              {poPreviewData.fileType === "image" ? (
                <div className="w-full h-[75vh] flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-auto">
                  <img
                    src={poPreviewData.url || poPreviewData.directUrl}
                    alt={poPreviewData.fileName || "Uploaded PO"}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : (
                <div className="w-full h-[75vh] rounded-2xl border border-slate-700 overflow-hidden bg-white shadow-2xl flex flex-col">
                  <iframe
                    src={poPreviewData.url || poPreviewData.directUrl}
                    title="PO Preview"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              )}

              {/* Bottom Quick Help Bar */}
              <div className="w-full mt-2.5 px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <span className="flex items-center gap-1.5">
                  <FaInfoCircle className="text-emerald-400" />
                  <span>Agar preview browser me load na ho ya blank dikhe to <strong>"Download PO"</strong> ya <strong>"Open in New Tab"</strong> par click karein.</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-300">
                  ARCL Calibration Metrology System
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}