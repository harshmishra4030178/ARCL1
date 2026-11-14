"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  FaDownload,
  FaEnvelopeOpenText,
  FaImage,
  FaPalette,
  FaPrint,
  FaQrcode,
  FaRedo,
  FaRulerCombined,
  FaSyncAlt,
  FaTrashAlt,
  FaUpload,
} from "react-icons/fa";
import {
  DEFAULT_ENVELOPE_CONFIG,
  ENVELOPE_PRESETS,
  ENVELOPE_SPECS,
  downloadEnvelopePdf,
  printEnvelopeHtmlDirectly,
} from "../../utils/envelopePdfGenerator.js";
import EnvelopeSheetPreview from "../../components/calibration/EnvelopeSheetPreview.jsx";

const MM_TO_PX = 96 / 25.4;

export default function EnvelopeDesignerPage() {
  const [config, setConfig] = useState({ ...DEFAULT_ENVELOPE_CONFIG });
  const [selectedPresetId, setSelectedPresetId] = useState("custom_arcl");
  const [widthMm, setWidthMm] = useState(280);
  const [heightMm, setHeightMm] = useState(124);
  const [qrImage, setQrImage] = useState(null); // { dataUrl, width, height, fileName, fileSizeKb }
  const [showRulerGuides, setShowRulerGuides] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);

  const fileInputRef = useRef(null);
  const previewContainerRef = useRef(null);

  const envelopeWidthPx = useMemo(() => widthMm * MM_TO_PX, [widthMm]);
  const envelopeHeightPx = useMemo(() => heightMm * MM_TO_PX, [heightMm]);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateScale = () => {
      const availW = Math.max(280, el.clientWidth - 24);
      const nextScale = Math.min(1.05, availW / envelopeWidthPx);
      setPreviewScale(Number(nextScale.toFixed(4)));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [envelopeWidthPx]);

  const handlePresetChange = (presetId) => {
    setSelectedPresetId(presetId);
    const preset = ENVELOPE_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.id !== "custom") {
      setWidthMm(preset.widthMm);
      setHeightMm(preset.heightMm);
    }
  };

  const handleFieldChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleQrFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isPng =
      file.type === "image/png" ||
      String(file.name || "").toLowerCase().endsWith(".png");
    if (!isPng) {
      toast.error("Please upload a valid PNG QR code image (.png).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        setQrImage({
          dataUrl,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          fileName: file.name,
          fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        });
        toast.success("QR PNG uploaded into 3.2 × 3.2 cm slot!");
      };
      img.onerror = () => {
        toast.error("Could not read the uploaded PNG image.");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setQrImage(null);
    toast.info("QR image removed. Dotted 3.2 × 3.2 cm area restored.");
  };

  const handleResetDesign = () => {
    setConfig({ ...DEFAULT_ENVELOPE_CONFIG });
    setSelectedPresetId("custom_arcl");
    setWidthMm(280);
    setHeightMm(124);
    setQrImage(null);
    setShowRulerGuides(false);
    toast.success("Envelope design reset to official ARCL defaults.");
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      await downloadEnvelopePdf(
        { config, qrImage, widthMm, heightMm },
        `ARCL_Instruments_Envelope_${widthMm}x${heightMm}mm.pdf`
      );
      toast.success(`Print-ready Envelope PDF (${widthMm} × ${heightMm} mm) downloaded!`);
    } catch (err) {
      console.error("Envelope PDF export failed:", err);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintEnvelope = async () => {
    try {
      await printEnvelopeHtmlDirectly({
        elementId: "arcl-envelope-print-sheet",
        widthMm,
        heightMm,
      });
      toast.success(`Direct print dialog opened (${widthMm} × ${heightMm} mm)!`);
    } catch (err) {
      console.error("Direct print failed:", err);
      toast.error("Opening fallback browser print...");
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Dedicated Dynamic Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0mm;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            overflow: visible !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #arcl-envelope-print-sheet,
          #arcl-envelope-print-sheet * {
            visibility: visible !important;
          }
          #arcl-envelope-print-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${widthMm}mm !important;
            height: ${heightMm}mm !important;
            margin: 0 !important;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            z-index: 99999 !important;
          }
          .arcl-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Hidden PNG Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,.png"
        onChange={handleQrFileSelected}
        className="hidden"
      />

      {/* Page Header & Action Bar */}
      <div className="arcl-no-print bg-gradient-to-r from-[#021C57] via-[#0B2A72] to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-blue-900/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <FaEnvelopeOpenText /> ARCL CORPORATE STATIONERY • PRINT-READY
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            ARCL Instruments Envelope Designer
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-mono font-bold">
              <FaRulerCombined className="text-sky-300" />
              28.0 cm × 12.4 cm ({ENVELOPE_SPECS.widthMm} × {ENVELOPE_SPECS.heightMm} mm) • Landscape
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-mono font-bold">
              <FaQrcode className="text-sky-300" />
              QR Slot: 3.2 × 3.2 cm ({ENVELOPE_SPECS.qrSizeMm} × {ENVELOPE_SPECS.qrSizeMm} mm)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            {qrImage ? <FaSyncAlt /> : <FaUpload />}
            {qrImage ? "Replace QR PNG" : "Upload QR PNG"}
          </button>

          {qrImage && (
            <button
              type="button"
              onClick={handleRemoveQr}
              className="px-3.5 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <FaTrashAlt /> Remove QR
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <FaDownload /> {isExporting ? "Exporting..." : `Download PDF (${widthMm}×${heightMm}mm)`}
          </button>

          <button
            type="button"
            onClick={handlePrintEnvelope}
            className="px-4 py-2.5 bg-white text-[#021C57] hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <FaPrint /> Direct Print ({widthMm}×${heightMm}mm)
          </button>

          <button
            type="button"
            onClick={handleResetDesign}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FaRedo /> Reset
          </button>
        </div>
      </div>

      {/* Main Workspace: Live Preview + Editor Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Live Exact-Dimensions Envelope Preview */}
        <div className="xl:col-span-8 space-y-3">
          <div className="arcl-no-print bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-[#021C57] uppercase tracking-wide">
                  Live Print-Ready Preview ({widthMm} × {heightMm} mm)
                </h2>
                <p className="text-xs text-slate-500">
                  Preview scale: {(previewScale * 100).toFixed(0)}% on screen • Direct prints &amp; exports at exact{" "}
                  <strong>100% actual size ({(widthMm / 10).toFixed(1)} × {(heightMm / 10).toFixed(1)} cm)</strong>
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={showRulerGuides}
                  onChange={(e) => setShowRulerGuides(e.target.checked)}
                  className="rounded accent-[#021C57]"
                />
                Show Layout Guides (Screen Only)
              </label>
            </div>

            {/* Responsive Outer Frame Holding Scaled Physical Millimetre Sheet */}
            <div
              ref={previewContainerRef}
              className="w-full bg-slate-100 rounded-2xl border border-slate-200 p-3 sm:p-5 flex justify-center overflow-hidden"
            >
              <div
                style={{
                  width: `${envelopeWidthPx * previewScale}px`,
                  height: `${envelopeHeightPx * previewScale}px`,
                  position: "relative",
                  transition: "width 0.2s, height 0.2s",
                }}
              >
                <EnvelopeSheetPreview
                  config={config}
                  recipient={null}
                  qrImage={qrImage}
                  widthMm={widthMm}
                  heightMm={heightMm}
                  scale={previewScale}
                  showRulerGuides={showRulerGuides}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-blue-50/70 border border-blue-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>Direct Native Print:</strong> <strong>Direct Print</strong> button browser ke print dialog ko seedha physical printer ke sath open karta hai (Adobe Reader ki zaroorat nahi hai aur koi PDF download nahi karni padti).
              </span>
            </div>
          </div>
        </div>

        {/* Right Control Panel: Theme Selector + Size Selector + QR Upload + Editable Details */}
        <div className="arcl-no-print xl:col-span-4 space-y-4">
          {/* Envelope Background Theme Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#021C57] flex items-center gap-2">
                <FaPalette className="text-amber-500" /> Background Color Theme
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Aapke Hisab Se
              </span>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: "classic_white",
                  title: "Classic Pure White (Pehle Wala)",
                  subtitle: "Original standard design with faint ARCL logo watermark",
                  gradientPreview: "#ffffff",
                  badge: "Pehle Wala / Standard",
                  badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
                },
                {
                  id: "amber_emerald_vibrant",
                  title: "Amber → Emerald Gradient",
                  subtitle: "Vibrant button gradient (#F59E0B → #10B981)",
                  gradientPreview: "linear-gradient(90deg, #F59E0B 0%, #84CC16 45%, #10B981 100%)",
                  badge: "Punch-In Style",
                  badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
                },
                {
                  id: "amber_emerald_soft",
                  title: "Soft Pastel Gradient",
                  subtitle: "Light ink-saver pastel tint for office printing",
                  gradientPreview: "linear-gradient(90deg, #FEF3C7 0%, #ECFCCB 45%, #D1FAE5 100%)",
                  badge: "Ink Saver",
                  badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
                },
                {
                  id: "custom",
                  title: "Custom (Apne Hisab Se Color / Gradient)",
                  subtitle: "Pick any 2-color gradient or solid single color",
                  gradientPreview:
                    config.customBgMode === "solid"
                      ? config.customColorSolid || "#FFFFFF"
                      : `linear-gradient(90deg, ${config.customColorStart || "#F59E0B"} 0%, ${config.customColorEnd || "#10B981"} 100%)`,
                  badge: "Full Control",
                  badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
                },
              ].map((themeOpt) => {
                const isSelected = (config.backgroundTheme || "classic_white") === themeOpt.id;
                return (
                  <button
                    key={themeOpt.id}
                    type="button"
                    onClick={() => handleFieldChange("backgroundTheme", themeOpt.id)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? "border-[#021C57] bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      style={{ background: themeOpt.gradientPreview }}
                      className="w-12 h-10 rounded-lg border border-slate-300 shadow-sm shrink-0 flex items-center justify-center"
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md ring-2 ring-[#021C57]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-black ${isSelected ? "text-[#021C57]" : "text-slate-800"}`}>
                          {themeOpt.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${themeOpt.badgeClass}`}>
                          {themeOpt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {themeOpt.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sub-panel when 'custom' theme is selected */}
            {(config.backgroundTheme || "classic_white") === "custom" && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Custom Color Type</label>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("customBgMode", "gradient")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        config.customBgMode !== "solid"
                          ? "bg-white text-[#021C57] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      2-Color Gradient
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("customBgMode", "solid")}
                      className={`px-2.5 py-1 rounded-md transition ${
                        config.customBgMode === "solid"
                          ? "bg-white text-[#021C57] shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Solid Color
                    </button>
                  </div>
                </div>

                {config.customBgMode !== "solid" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Start Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={config.customColorStart || "#F59E0B"}
                            onChange={(e) => handleFieldChange("customColorStart", e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={config.customColorStart || "#F59E0B"}
                            onChange={(e) => handleFieldChange("customColorStart", e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          End Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={config.customColorEnd || "#10B981"}
                            onChange={(e) => handleFieldChange("customColorEnd", e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={config.customColorEnd || "#10B981"}
                            onChange={(e) => handleFieldChange("customColorEnd", e.target.value)}
                            className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Quick Gradient Presets:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Punch-In", start: "#F59E0B", end: "#10B981" },
                          { label: "Navy-Sky", start: "#021C57", end: "#38BDF8" },
                          { label: "Royal-Purple", start: "#4C1D95", end: "#A78BFA" },
                          { label: "Sunset-Fire", start: "#BE123C", end: "#FB923C" },
                          { label: "Forest-Mint", start: "#064E3B", end: "#34D399" },
                          { label: "Slate-Steel", start: "#334155", end: "#94A3B8" },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              handleFieldChange("customColorStart", preset.start);
                              handleFieldChange("customColorEnd", preset.end);
                            }}
                            className="px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 bg-white hover:border-slate-400 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span
                              style={{
                                background: `linear-gradient(90deg, ${preset.start}, ${preset.end})`,
                              }}
                              className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                            />
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Solid Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.customColorSolid || "#FFFFFF"}
                          onChange={(e) => handleFieldChange("customColorSolid", e.target.value)}
                          className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                        />
                        <input
                          type="text"
                          value={config.customColorSolid || "#FFFFFF"}
                          onChange={(e) => handleFieldChange("customColorSolid", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Quick Solid Presets:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "White", color: "#FFFFFF" },
                          { label: "Ivory", color: "#FFFBEB" },
                          { label: "Ice Blue", color: "#F0F9FF" },
                          { label: "Soft Mint", color: "#ECFDF5" },
                          { label: "Slate", color: "#F1F5F9" },
                          { label: "Deep Navy", color: "#021C57" },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleFieldChange("customColorSolid", preset.color)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 bg-white hover:border-slate-400 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span
                              style={{ background: preset.color }}
                              className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                            />
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Envelope Size & Presets Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#021C57] flex items-center gap-2">
                <FaRulerCombined className="text-blue-600" /> Envelope Size &amp; Paper
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {(widthMm / 10).toFixed(1)} × {(heightMm / 10).toFixed(1)} cm
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Size Preset</label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:border-[#021C57] cursor-pointer"
                >
                  {ENVELOPE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Width (mm)</label>
                  <input
                    type="number"
                    min={80}
                    max={450}
                    value={widthMm}
                    onChange={(e) => {
                      setSelectedPresetId("custom");
                      setWidthMm(Math.max(80, Math.min(450, Number(e.target.value) || 280)));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-[#021C57] focus:outline-none focus:border-[#021C57]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Height (mm)</label>
                  <input
                    type="number"
                    min={60}
                    max={350}
                    value={heightMm}
                    onChange={(e) => {
                      setSelectedPresetId("custom");
                      setHeightMm(Math.max(60, Math.min(350, Number(e.target.value) || 124)));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-[#021C57] focus:outline-none focus:border-[#021C57]"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* QR Code Manager Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#021C57] flex items-center gap-2">
                <FaQrcode className="text-blue-600" /> Right QR Slot (3.2 × 3.2 cm)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                32 × 32 mm
              </span>
            </div>

            {qrImage ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={qrImage.dataUrl}
                      alt="QR Thumbnail"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-xs space-y-0.5">
                    <div className="font-bold text-slate-900 truncate">{qrImage.fileName}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {qrImage.width} × {qrImage.height} px • {qrImage.fileSizeKb} KB
                    </div>
                    <div className="text-[10.5px] font-semibold text-emerald-700">
                      Aspect ratio preserved (no stretch/crop)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaSyncAlt /> Replace PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveQr}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaTrashAlt /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 transition flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg">
                  <FaImage />
                </div>
                <div className="text-xs font-bold text-slate-800">Upload QR Code PNG</div>
                <div className="text-[11px] text-slate-500">
                  Blank dotted 3.2 × 3.2 cm box stays clear until a PNG is uploaded
                </div>
              </button>
            )}
          </div>

          {/* Editable Header & Contact Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-[#021C57]">
                Top Header &amp; Contact Details
              </h3>
              <button
                type="button"
                onClick={handleResetDesign}
                className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Restore Defaults
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Top Header Full Company Name
                </label>
                <input
                  type="text"
                  value={config.headerCompanyName}
                  onChange={(e) => handleFieldChange("headerCompanyName", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57] font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Header Subtitle (NABL CC-4313)</label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showHeaderSubtitle}
                      onChange={(e) => handleFieldChange("showHeaderSubtitle", e.target.checked)}
                      className="accent-[#021C57]"
                    />
                    Show
                  </label>
                </div>
                <input
                  type="text"
                  value={config.headerSubtitle || ""}
                  onChange={(e) => handleFieldChange("headerSubtitle", e.target.value)}
                  disabled={!config.showHeaderSubtitle}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Header Address &amp; GSTIN
                </label>
                <input
                  type="text"
                  value={config.headerAddress || ""}
                  onChange={(e) => handleFieldChange("headerAddress", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57] text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number (with Phone Icon)</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email ID (with Mail Icon)</label>
                <input
                  type="email"
                  value={config.email || config.emailPrimary || ""}
                  onChange={(e) => {
                    handleFieldChange("email", e.target.value);
                    handleFieldChange("emailPrimary", e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Website URL (with Web Icon)</label>
                <input
                  type="text"
                  value={config.website}
                  onChange={(e) => handleFieldChange("website", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Footer Courtesy &amp; Thank You Note
                </label>
                <input
                  type="text"
                  value={config.footerThankYouTitle || ""}
                  onChange={(e) => handleFieldChange("footerThankYouTitle", e.target.value)}
                  placeholder="Thank You Title"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57] text-xs mb-1.5"
                />
                <input
                  type="text"
                  value={config.footerThankYouSubtitle || ""}
                  onChange={(e) => handleFieldChange("footerThankYouSubtitle", e.target.value)}
                  placeholder="Contact Support Subtitle"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#021C57] text-xs text-slate-600"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>
                <strong>TO Section Only:</strong> FROM section completely removed; all company contact details are now in the top header with phone, email, and web icons.
              </div>
              <div>
                <strong>Background Watermark:</strong> Subtle ARCL logo watermark is automatically rendered in the background behind the recipient writing area.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
