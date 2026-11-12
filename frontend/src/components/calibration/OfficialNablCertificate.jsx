"use client";
import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const buildOrangeQrSvgDataUrl = (text) => {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const size = qr.modules.size;
    const data = qr.modules.data;
    const margin = 1;
    const total = size + margin * 2;
    let pathD = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (data[r * size + c]) {
          pathD += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${pathD}" fill="#FA9703"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  } catch {
    return "/assets/cert_assets/orange_qr.png";
  }
};

const formatCertDisplayDate = (d, fallback = "-") => {
  if (!d) return fallback;
  const s = String(d).trim();
  if (!s || s === "0" || s === "00-01-1900" || s === "1900-01-00") return fallback;
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(s)) return s;
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const [y, m, day] = s.slice(0, 10).split("-").map(Number);
      const localDate = new Date(y, m - 1, day);
      if (!isNaN(localDate.getTime()) && localDate.getFullYear() >= 1950) {
        return localDate.toLocaleDateString("en-GB");
      }
    }
    const parsed = new Date(s);
    if (isNaN(parsed.getTime()) || parsed.getFullYear() < 1950) return fallback;
    return parsed.toLocaleDateString("en-GB");
  } catch {
    return fallback;
  }
};

export default function OfficialNablCertificate({
  rec = {},
  itemIdx = 0,
  isObsDoc = false,
  matchedTmpl = null,
  calc = null,
  fixedA4 = false,
  currentUserName = "",
}) {
  const obs = rec?.observationData || {};
  const auth = rec?.authorizationData || {};
  const params = matchedTmpl?.parameters || {};

  const activeReportTable =
    auth.reportResultTable?.rows?.length > 0
      ? auth.reportResultTable
      : calc?.reportTable || obs.computedReportTable || null;

  const hasDynamicRows = Boolean(
    activeReportTable?.columns?.length >= 2 && activeReportTable?.rows?.length > 0
  );

  const resolvedSrfRef = rec.inwardRegister?.srfNo || rec.srfNo || "SRF";
  const cNo = isObsDoc
    ? obs.worksheetNo || `WS-ARCL-2026-${rec.serialNo || itemIdx + 1}`
    : rec.records?.certificateNo ||
      auth.certificateNo ||
      `ARCL/F/${resolvedSrfRef}/${String(rec.srNo || itemIdx + 1).padStart(2, "0")}`;

  const isForceInst =
    String(rec.instrument || obs.instrument || "").toLowerCase().includes("testing machine") ||
    String(rec.instrument || "").toLowerCase().includes("ctm");

  const readRows =
    Array.isArray(calc?.evaluatedReadings) && calc.evaluatedReadings.length > 0
      ? calc.evaluatedReadings
      : Array.isArray(obs.readings) && obs.readings.length > 0
      ? obs.readings
      : [
          { nominal: "300", master: "300.4", indicated: "301.4", error: "0.32", repeatability: "0.00", uncertainty: "0.61" },
          { nominal: "900", master: "901.3", indicated: "902.3", error: "0.11", repeatability: "0.00", uncertainty: "0.61" },
          { nominal: "1200", master: "1201.7", indicated: "1200.3", error: "-0.12", repeatability: "0.01", uncertainty: "0.61" },
          { nominal: "1800", master: "1802.6", indicated: "1800.2", error: "-0.13", repeatability: "0.00", uncertainty: "0.61" },
          { nominal: "2700", master: "2703.9", indicated: "2706.3", error: "0.09", repeatability: "0.02", uncertainty: "0.61" },
        ];

  const resolvedUncertainty =
    activeReportTable?.uncertaintyValue ||
    auth.uncertaintyBudget?.expandedUncertainty ||
    calc?.amu?.expandedUncertainty ||
    "";

  const resolvedMode = obs.mode || params.mode || (isForceInst ? "Compression" : "Standard");
  const resolvedDiscipline =
    obs.discipline ||
    params.discipline ||
    matchedTmpl?.equipmentType ||
    (isForceInst ? "Mechanical Calibration (Force)" : "Mechanical / Dimensional Calibration");
  const resolvedLocation = obs.location || params.location || rec.location || "";
  const ulrNo =
    rec.records?.ulrNo ||
    rec.inwardRegister?.ulrNo ||
    auth.ulrNo ||
    obs.ulrNo ||
    rec.ulrNo ||
    matchedTmpl?.reportData?.ulrNo ||
    "";

  const { verifyRelativePath, verifyFullUrl } = useMemo(() => {
    const paramsObj = new URLSearchParams();
    const recId = rec?._id || rec?.id || rec?.recordId;
    if (recId && /^[a-f0-9]{24}$/i.test(String(recId))) {
      paramsObj.set("id", String(recId));
    } else {
      if (cNo && !isObsDoc) paramsObj.set("cert", String(cNo).trim());
      if (ulrNo) paramsObj.set("ulr", String(ulrNo).trim());
      if (rec?.serialNo && String(rec.serialNo).trim() !== "-") {
        paramsObj.set("sn", String(rec.serialNo).trim());
      }
    }
    if (isObsDoc) paramsObj.set("doc", "obs");
    const qs = paramsObj.toString();
    const rel = qs ? `/certificate-verify?${qs}` : "/certificate-verify";

    let base =
      (typeof globalThis !== "undefined" &&
        (globalThis.process?.env?.NEXT_PUBLIC_SITE_URL ||
          globalThis.process?.env?.NEXT_PUBLIC_FRONTEND_URL)) ||
      "https://arcl-1.vercel.app";
    if (typeof window !== "undefined" && window.location?.origin) {
      const host = window.location.hostname || "";
      const isLocalLoopback =
        host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
      if (!isLocalLoopback) {
        base = window.location.origin;
      }
    }
    const cleanBase = String(base).trim().replace(/\/+$/, "");
    return {
      verifyRelativePath: rel,
      verifyFullUrl: `${cleanBase}${rel}`,
    };
  }, [rec?._id, rec?.id, rec?.recordId, rec?.serialNo, cNo, ulrNo, isObsDoc]);

  const qrSvgDataUrl = useMemo(
    () => buildOrangeQrSvgDataUrl(verifyFullUrl),
    [verifyFullUrl]
  );
  const [qrPngDataUrl, setQrPngDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(verifyFullUrl, {
      errorCorrectionLevel: "M",
      width: 240,
      margin: 1,
      color: { dark: "#FA9703", light: "#ffffff" },
    })
      .then((url) => {
        if (active && url) setQrPngDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [verifyFullUrl]);
  const isLegacyPlaceholderSigner = (v) =>
    /^(|rupak\s*kumar|quality\s*manager|authorized\s*signatory|technical\s*manager.*|dr\.?\s*r\.?\s*k\.?\s*verma.*)$/i.test(
      String(v || "").trim()
    );
  const authorizedByName =
    (!isLegacyPlaceholderSigner(auth.authorizedBy) ? auth.authorizedBy : "") ||
    currentUserName ||
    (!isLegacyPlaceholderSigner(obs.reviewedBy) ? obs.reviewedBy : "") ||
    "Authorized Signatory";
  const formatNoStr =
    obs.formatNo ||
    params.formatNo ||
    matchedTmpl?.reportData?.formatNo ||
    "FM/CC/05 Rev-01 Dt 10-11-2026";
  const resultUnitRaw =
    obs.unit ||
    params.unit ||
    matchedTmpl?.tableColumns?.find((c) => c.unit)?.unit ||
    "";
  const resolvedTemp = String(obs.temperature || params.temperature || "(25±2)°C").trim();
  const resolvedHumidity = String(obs.humidity || params.humidity || "(30-80)%").trim();
  const resolvedRange =
    obs.range || params.range || rec.instrumentRange || (isForceInst ? "3000 kN" : "-");
  const resolvedLeastCount =
    obs.leastCount || params.leastCount || rec.leastCount || (isForceInst ? "0.1 kN" : "-");

  const receiptDateStr = formatCertDisplayDate(
    obs.receiptDate || params.receiptDate || rec.inwardDate || rec.challanDate || rec.calibrationDate,
    "-"
  );
  const calDateStr = formatCertDisplayDate(obs.calibrationDate || rec.calibrationDate, "-");
  const dueDateStr = formatCertDisplayDate(obs.calibrationDueDate || rec.calibrationDueDate, "-");
  const issueDateStr = formatCertDisplayDate(
    obs.issueDate || auth.authorizedAt || rec.calibrationDate,
    formatCertDisplayDate(new Date())
  );

  const masterList =
    Array.isArray(obs.masterEquipments) && obs.masterEquipments.length > 0
      ? obs.masterEquipments
      : [
          {
            description: obs.masterDescription || params.masterDescription || "Proving Ring",
            idMark: obs.masterId || params.masterId || "ARCL/MST/01",
            certNo: obs.masterCertNo || params.masterCertNo || "CERT-NABL-001",
            dueDate: obs.masterDueDate || params.masterDueDate || "-",
            traceableBy: obs.masterTraceable || params.masterTraceable || "NABL Accredited",
          },
        ];

  return (
    <div
      data-a4-cert-page={fixedA4 ? "true" : undefined}
      style={
        fixedA4
          ? {
              width: "794px",
              minHeight: "1123px",
              backgroundColor: "#ffffff",
              color: "#000000",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              boxSizing: "border-box",
            }
          : undefined
      }
      className={
        fixedA4
          ? "bg-white text-black relative overflow-hidden text-xs font-sans"
          : "relative border border-slate-300 bg-white text-slate-950 shadow-xl overflow-hidden text-xs font-sans flex flex-col justify-between"
      }
    >
      {/* Top & Body Content */}
      <div>
        {/* Top Header Band with Orange Wave + IQMC / ISO 9001 / ARCL Logos */}
        <div
          style={{ height: "120px" }}
          className="relative flex items-start justify-between px-4 pt-3 pb-2 overflow-hidden"
        >
          <svg
            viewBox="0 0 320 135"
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: 0, width: "52%", height: "100%", pointerEvents: "none" }}
          >
            <path d="M0,0 L300,0 C306,45 270,84 210,98 C142,115 52,108 0,132 Z" fill="#FF6F00" />
          </svg>

          {/* Left Title */}
          <div className="relative z-10 leading-none pt-1">
            <div className="text-2xl sm:text-[32px] font-black tracking-tight text-black leading-none">
              {isObsDoc ? "METROLOGICAL" : "CALIBRATION"}
            </div>
            <div className="text-xl sm:text-[24px] font-black tracking-tight text-black leading-none mt-1.5">
              {isObsDoc ? "OBSERVATION 2026" : "CERTIFICATE 2026"}
            </div>
          </div>

          {/* Right Official Seals, ARCL Logo & Helpline */}
          <div className="relative z-10 flex flex-col items-end">
            <div className="flex items-center gap-2">
              <img
                src="/assets/cert_assets/iqmc_logo.png"
                alt="IQMC"
                style={{ width: "64px", height: "64px", objectFit: "contain" }}
              />
              <img
                src="/assets/cert_assets/iso_9001_logo.png"
                alt="ISO 9001:2015"
                style={{ width: "64px", height: "64px", objectFit: "contain" }}
              />
              <img
                src="/assets/cert_assets/arcl_logo.png"
                alt="ARCL"
                style={{ width: "136px", height: "62px", objectFit: "contain" }}
              />
            </div>
            <div className="text-[11px] font-black text-slate-900 mt-1">
              Helpline No. 8369458583
            </div>
          </div>
        </div>

        {/* Main Grid Body with Official Faint Watermarks */}
        <div className="relative px-4 pb-2">
          <img
            src="/assets/cert_assets/arcl_watermark.png"
            alt=""
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: "32px",
              width: "290px",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          />
          <img
            src="/assets/cert_assets/circuit_watermark.png"
            alt=""
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              top: "215px",
              width: "390px",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          />

          <div className="relative z-10">
            {/* Top 5-Column Metadata Bar */}
            <div className="grid grid-cols-5 border border-black text-center text-[10.5px] divide-x divide-black">
              <div className="divide-y divide-black">
                <div className="p-1 font-bold">Date of Receipt</div>
                <div className="p-1 font-medium">{receiptDateStr}</div>
              </div>
              <div className="divide-y divide-black">
                <div className="p-1 font-bold">Date of Calibration</div>
                <div className="p-1 font-medium">{calDateStr}</div>
              </div>
              <div className="divide-y divide-black">
                <div className="p-1 font-bold">Due Date of Calibration</div>
                <div className="p-1 font-medium">{dueDateStr}</div>
              </div>
              <div className="divide-y divide-black">
                <div className="p-1 font-bold">{isObsDoc ? "Worksheet No." : "Certificate No."}</div>
                <div className="p-1 font-mono font-bold text-[#002B66]">{cNo}</div>
              </div>
              <div className="divide-y divide-black">
                <div className="p-1 font-bold">Date of Issue</div>
                <div className="p-1 font-medium">{issueDateStr}</div>
              </div>
            </div>

            {/* 1. Calibrated for + ULR No. */}
            <div className="p-2 border border-t-0 border-black text-[11px] flex items-start justify-between gap-4 min-h-[54px]">
              <div className="space-y-0.5 flex-1">
                <div className="font-bold text-black">1. Calibrated for :</div>
                <div className="font-bold text-black text-xs uppercase pl-3">{rec.clientCompany}</div>
                {(obs.clientAddress || rec.clientAddress) && (
                  <div className="text-slate-800 text-[10.5px] pl-3">
                    {obs.clientAddress || rec.clientAddress}
                  </div>
                )}
              </div>
              <div className="min-w-[205px] shrink-0 text-left whitespace-nowrap">
                <span className="font-bold text-black">ULR No.</span>{" "}
                {ulrNo && <span className="font-mono font-bold text-black ml-2">{ulrNo}</span>}
              </div>
            </div>

            {/* 2 to 6 Two Columns Matching Reference Certificate */}
            <div className="grid grid-cols-12 border border-t-0 border-black divide-x divide-black text-[10.5px]">
              <div className="col-span-6 p-2 space-y-0.5">
                <div className="font-bold text-black mb-1">2. Description of Equipment :</div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4">Instrument Name</span>
                  <span className="col-span-1 text-center">:-</span>
                  <strong className="col-span-7 font-bold text-black">{rec.instrument}</strong>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4">Make/Model</span>
                  <span className="col-span-1 text-center">:-</span>
                  <span className="col-span-7">
                    {obs.makeModel || [rec.make, rec.modelNo].filter(Boolean).join(" / ") || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4">Sr. No./ID No.</span>
                  <span className="col-span-1 text-center">:-</span>
                  <span className="col-span-7 font-mono">{obs.serialNo || rec.serialNo || "-"}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4">
                    {isForceInst ? "Range(kN)" : /mm/i.test(resultUnitRaw) ? "Range(mm)" : "Range"}
                  </span>
                  <span className="col-span-1 text-center">:-</span>
                  <span className="col-span-7">{resolvedRange}</span>
                </div>
                {resolvedLeastCount && resolvedLeastCount !== "-" && (
                  <div className="grid grid-cols-12">
                    <span className="col-span-4">Least Count</span>
                    <span className="col-span-1 text-center">:-</span>
                    <span className="col-span-7">{resolvedLeastCount}</span>
                  </div>
                )}
                <div className="grid grid-cols-12">
                  <span className="col-span-4">Location</span>
                  <span className="col-span-1 text-center">:-</span>
                  <span className="col-span-7">{resolvedLocation || "-"}</span>
                </div>
              </div>

              <div className="col-span-6 divide-y divide-black">
                <div className="grid grid-cols-12">
                  <div className="col-span-5 p-1 font-bold border-r border-black">3. Condition of Item</div>
                  <div className="col-span-1 p-1 text-center font-bold border-r border-black">:</div>
                  <div className="col-span-6 p-1 text-center">{obs.conditionOfItem || "OK"}</div>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-5 p-1 font-bold border-r border-black flex items-center">
                    4. Environmental Conditions
                  </div>
                  <div className="col-span-7 divide-y divide-black">
                    <div className="grid grid-cols-12">
                      <div className="col-span-2 p-1 text-center font-bold border-r border-black">:</div>
                      <div className="col-span-10 p-1 text-center">Temp. : {resolvedTemp}</div>
                    </div>
                    <div className="grid grid-cols-12">
                      <div className="col-span-2 p-1 text-center font-bold border-r border-black">:</div>
                      <div className="col-span-10 p-1 text-center">RH : {resolvedHumidity}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-5 p-1 font-bold border-r border-black">5. Method of Calibration</div>
                  <div className="col-span-1 p-1 text-center font-bold border-r border-black">:</div>
                  <div className="col-span-6 p-1 text-center">
                    {obs.calibrationMethod || matchedTmpl?.calibrationMethod || "ARCL-CP-STANDARD"}
                  </div>
                </div>
                <div className="grid grid-cols-12">
                  <div className="col-span-5 p-1 font-bold border-r border-black flex items-center">
                    6. Reference Standard
                  </div>
                  <div className="col-span-1 p-1 text-center font-bold border-r border-black flex items-center justify-center">
                    :
                  </div>
                  <div className="col-span-6 p-1 text-center flex items-center justify-center">
                    {obs.referenceStandard || matchedTmpl?.standardReference || "IS / ISO Metrology Standard"}
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Details of Master Equipment */}
            <div className="border border-t-0 border-black text-[10.5px]">
              <div className="p-1 font-bold border-b border-black">7. Details of Master Equipment :</div>
              <table className="w-full text-center divide-y divide-black">
                <thead className="divide-x divide-black font-normal">
                  <tr>
                    <th className="p-1 font-normal">Equipment Description</th>
                    <th className="p-1 font-normal">ID Mark</th>
                    <th className="p-1 font-normal">Certificate No.</th>
                    <th className="p-1 font-normal">Calibration Due Date</th>
                    <th className="p-1 font-normal">Traceable By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {masterList.map((mItem, mIdx) => (
                    <tr key={mIdx} className="divide-x divide-black">
                      <td className="p-1">{mItem.description || "-"}</td>
                      <td className="p-1 font-mono">{mItem.idMark || "-"}</td>
                      <td className="p-1 font-mono">{mItem.certNo || "-"}</td>
                      <td className="p-1">{mItem.dueDate || "-"}</td>
                      <td className="p-1">{mItem.traceableBy || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 8. Results */}
            <div className="border border-t-0 border-black text-[10.5px]">
              <div className="p-1 font-bold border-b border-black flex justify-between flex-wrap gap-2">
                <span>{resultUnitRaw ? `8. Results(${resultUnitRaw}) :` : "8. Results :"}</span>
                <span>
                  {resolvedMode && !/^standard$/i.test(resolvedMode)
                    ? `Mode: ${resolvedMode}  |  Discipline: ${resolvedDiscipline}`
                    : `Discipline: ${resolvedDiscipline}`}
                </span>
              </div>
              {hasDynamicRows ? (
                <table className="w-full text-center divide-y divide-black">
                  <thead className="divide-x divide-black text-[10px]">
                    <tr>
                      {activeReportTable.columns.map((col, cIdx) => (
                        <th key={cIdx} className="p-1.5 font-normal whitespace-pre-line">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {activeReportTable.rows.map((rRow, i) => (
                      <tr key={i} className="divide-x divide-black">
                        {activeReportTable.columns.map((col, cIdx) => {
                          const cellVal = rRow[col.key];
                          return (
                            <td
                              key={cIdx}
                              className="p-1 font-mono"
                              title={rRow._formulas?.[col.key] ? `Evaluated Formula: ${rRow._formulas[col.key]}` : ""}
                            >
                              {cellVal !== undefined && cellVal !== "" ? String(cellVal) : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-center divide-y divide-black">
                  <thead className="divide-x divide-black text-[10px]">
                    <tr>
                      <th className="p-1.5 font-normal">Nominal Force, KN</th>
                      <th className="p-1.5 font-normal">Master True Load (KN) at Site EC</th>
                      <th className="p-1.5 font-normal">Average Indicated Load (KN)</th>
                      <th className="p-1.5 font-normal">Relative Indication Error(%)</th>
                      <th className="p-1.5 font-normal">Relative Repeatability Error(%)</th>
                      <th className="p-1.5 font-normal">± Expanded Uncertainity(%rdg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {readRows.map((r, i) => (
                      <tr key={i} className="divide-x divide-black">
                        <td className="p-1 font-mono">{r.nominal}</td>
                        <td className="p-1 font-mono">{r.master || r.masterValue}</td>
                        <td className="p-1 font-mono">{r.indicated || r.mean || r.average}</td>
                        <td className="p-1 font-mono">{r.error}</td>
                        <td className="p-1 font-mono">{r.repeatability || "0.00"}</td>
                        <td className="p-1 font-mono">
                          {r.uncertainty || resolvedUncertainty || "0.61"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Notes, Measurement Uncertainty & Signatory */}
            <div className="pt-2 pb-1 text-[10.5px] space-y-1">
              <div className="font-bold text-black">
                Note: The Calibration Certificate referes only to the Particular Calibrated Items(s).
              </div>
              {resolvedUncertainty !== "" && Number(resolvedUncertainty) > 0 && (
                <div className="font-bold text-black pl-12">
                  Measurement Uncertainty {obs.muUnit ? `±${obs.muUnit}` : "±"} &nbsp;&nbsp;{" "}
                  {resolvedUncertainty}
                </div>
              )}
              <div className="space-y-0.5 text-slate-900 text-[10px] pt-0.5">
                <div>* The Calibration has been carried out without adjustment.</div>
                <div>
                  * The reported Uncertainty is at coverage factor k=2 with coverage prob. of approx. 95% for a normal distribution.
                </div>
                <div>
                  * Our Masters are calibrated through NABL accredited calibration lab, India having traceability with national/International standard.
                </div>
                <div>
                  * This Certificate shall not be reproduced except in full, without the written approval of ARCL Instruments Pvt Ltd.
                </div>
                <div>
                  * Due date of calibration and calibration points are given based on customer requirements.
                </div>
              </div>

              <div className="flex items-end justify-between pt-4">
                <div className="space-y-2">
                  <div className="text-[10.5px]">
                    * Calibrated By: {obs.calibratedBySite || obs.calibratedBy || "VK"}
                  </div>
                  <div className="text-[8px] text-slate-700 pt-2">Format No. {formatNoStr}</div>
                </div>
                <div className="relative text-center font-bold text-[10px] leading-tight pr-2">
                  <img
                    src="/assets/arcl_stamp.png"
                    alt="ARCL Stamp"
                    style={{
                      width: "56px",
                      height: "56px",
                      objectFit: "contain",
                      margin: "0 auto -10px",
                      opacity: 0.3,
                      pointerEvents: "none",
                    }}
                  />
                  <div>{isObsDoc ? "Calibrated & Verified By" : "Reviewed & Approved By"}</div>
                  <div>({authorizedByName})</div>
                  <div>Technical Manager</div>
                </div>
              </div>

              <div className="text-center text-[8.5px] font-bold tracking-wider pt-1">
                — ✦ {isObsDoc ? "END OF OBSERVATION SHEET" : "END OF CERTIFICATE"} ✦ —
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Official Footer + Orange QR + 3 Layered Right Waves */}
      <div className="relative px-4 pt-2 pb-4 flex items-end justify-between overflow-hidden">
        <div className="space-y-0.5 text-slate-900 z-10 max-w-[72%]">
          <div className="font-black text-base tracking-tight text-slate-950">
            ARCL INSTRUMENTS PRIVATE LIMITED
          </div>
          <div className="text-xs font-medium text-slate-800">
            (An ISO 9001:2015 Certified Company)
          </div>
          <div className="flex items-start gap-2 pt-1 text-[11px]">
            <img
              src="/assets/cert_assets/icon_location.png"
              alt=""
              style={{ width: "16px", height: "16px", marginTop: "2px", flexShrink: 0 }}
            />
            <span>
              Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai, MAHARASHTRA, 400708.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <img
              src="/assets/cert_assets/icon_phone.png"
              alt=""
              style={{ width: "16px", height: "16px", flexShrink: 0 }}
            />
            <span>+91 - 8369458583 / 6205691085</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] flex-wrap">
            <span className="flex items-center gap-2">
              <img
                src="/assets/cert_assets/icon_mail.png"
                alt=""
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
              />
              info@arclinstruments.com
            </span>
            <span className="flex items-center gap-2">
              <img
                src="/assets/cert_assets/icon_web.png"
                alt=""
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
              />
              www.arclinstruments.com
            </span>
          </div>
        </div>

        <div className="z-10 pr-7 shrink-0">
          <a
            href={verifyRelativePath}
            target="_blank"
            rel="noopener noreferrer"
            title="Scan QR or Click to Open 3-Section NABL Verification Dashboard (Certificate, Scope & Website)"
            style={{
              display: "block",
              border: "3px solid #FA9703",
              borderRadius: "6px",
              padding: "4px",
              backgroundColor: "#ffffff",
            }}
          >
            <img
              src={qrPngDataUrl || qrSvgDataUrl}
              alt="Scan for NABL Certificate, Scope & ARCL Website"
              style={{ width: "80px", height: "80px", objectFit: "contain", display: "block" }}
            />
          </a>
        </div>

        <svg
          viewBox="0 0 60 150"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: 0, right: 0, width: "44px", height: "132px", pointerEvents: "none" }}
        >
          <path d="M60,0 C18,22 10,90 14,150 L60,150 Z" fill="#FF6F00" />
          <path d="M60,24 C28,45 22,102 26,150 L60,150 Z" fill="#283194" />
          <path d="M60,46 C38,65 34,112 38,150 L60,150 Z" fill="#4CC58A" />
        </svg>
      </div>
    </div>
  );
}
