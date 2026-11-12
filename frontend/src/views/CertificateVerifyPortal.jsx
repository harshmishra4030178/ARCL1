"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaAward,
  FaCheckCircle,
  FaDownload,
  FaExternalLinkAlt,
  FaFilePdf,
  FaGlobe,
  FaQrcode,
  FaSearch,
  FaShieldAlt,
  FaStamp,
  FaTimes,
} from "react-icons/fa";
import API from "../api/axios.js";
import { verifyCalibrationCertificateApi } from "../api/calibrationApi.js";

const formatDisplayDate = (val, fallback = "-") => {
  if (!val) return fallback;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function CertificateVerifyPortal() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") || searchParams.get("recordId") || "";
  const certParam = searchParams.get("cert") || searchParams.get("certificateNo") || "";
  const ulrParam = searchParams.get("ulr") || searchParams.get("ulrNo") || "";
  const snParam = searchParams.get("sn") || searchParams.get("serialNo") || "";
  const docParam = searchParams.get("doc") || "";

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [lookupInput, setLookupInput] = useState("");
  const [showScopePanel, setShowScopePanel] = useState(false);
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopeDiscipline, setScopeDiscipline] = useState("all");
  const [activeDocModal, setActiveDocModal] = useState(null);

  const scopePanelRef = useRef(null);

  const fetchVerification = useCallback(async (queryOverrides = {}) => {
    setLoading(true);
    try {
      const params = {
        id: queryOverrides.id ?? idParam,
        cert: queryOverrides.cert ?? certParam,
        ulr: queryOverrides.ulr ?? ulrParam,
        sn: queryOverrides.sn ?? snParam,
        doc: queryOverrides.doc ?? docParam,
      };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await verifyCalibrationCertificateApi(params);
      setPayload(res?.data?.data || null);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [idParam, certParam, ulrParam, snParam, docParam]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const cert = payload?.certificate || null;
  const labProfile = payload?.labProfile || {};
  const website = payload?.website || {};

  const backendBase = useMemo(() => {
    const raw = String(API?.defaults?.baseURL || "http://localhost:5000/api/v1").replace(/\/+$/, "");
    return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
  }, []);

  const backendOrigin = useMemo(
    () => backendBase.replace(/\/api\/v1\/?$/, ""),
    [backendBase]
  );

  const govtCert = labProfile?.govtNablCertificate || null;

  const govtCertUrl = useMemo(() => {
    if (!govtCert) return "";
    if (govtCert.cloudUrl) return govtCert.cloudUrl;
    if (govtCert.url) {
      return govtCert.url.startsWith("http")
        ? govtCert.url
        : `${backendOrigin}${govtCert.url.startsWith("/") ? "" : "/"}${govtCert.url}`;
    }
    return "";
  }, [backendOrigin, govtCert]);

  const isGovtCertImage = Boolean(
    govtCert?.mimeType?.startsWith("image/") ||
      /\.(png|jpe?g|webp|gif)(\?|$)/i.test(govtCertUrl)
  );

  const certificatePdfUrl = useMemo(() => {
    if (cert?.certificatePdfPath || cert?.recordId) {
      const path =
        cert.certificatePdfPath ||
        `/calibration/download-document?recordId=${encodeURIComponent(cert.recordId)}&docType=certificate&single=true`;
      return `${backendBase}${path.startsWith("/") ? "" : "/"}${path}`;
    }
    if (idParam || certParam || snParam) {
      const qs = new URLSearchParams();
      if (idParam) qs.set("recordId", idParam);
      if (certParam) qs.set("certificateNo", certParam);
      if (snParam) qs.set("serialNo", snParam);
      qs.set("docType", docParam === "obs" ? "observation_sheet" : "certificate");
      qs.set("single", "true");
      return `${backendBase}/calibration/download-document?${qs.toString()}`;
    }
    return "";
  }, [backendBase, cert, idParam, certParam, snParam, docParam]);

  const observationPdfUrl = useMemo(() => {
    const rid = cert?.recordId || idParam;
    if (!rid && !snParam) return "";
    const qs = new URLSearchParams();
    if (rid) qs.set("recordId", rid);
    if (snParam) qs.set("serialNo", snParam);
    qs.set("docType", "observation_sheet");
    qs.set("single", "true");
    return `${backendBase}/calibration/download-document?${qs.toString()}`;
  }, [backendBase, cert?.recordId, idParam, snParam]);

  const scopeItems = useMemo(
    () => (Array.isArray(labProfile.scopeItems) ? labProfile.scopeItems : []),
    [labProfile.scopeItems]
  );
  const matchedScopeItems = useMemo(
    () => (Array.isArray(labProfile.matchedScopeItems) ? labProfile.matchedScopeItems : []),
    [labProfile.matchedScopeItems]
  );

  const disciplines = useMemo(
    () => ["all", ...Array.from(new Set(scopeItems.map((s) => s?.discipline).filter(Boolean)))],
    [scopeItems]
  );

  const filteredScopeItems = useMemo(() => {
    const q = scopeSearch.trim().toLowerCase();
    return scopeItems.filter((item) => {
      const discOk = scopeDiscipline === "all" || item?.discipline === scopeDiscipline;
      const textOk =
        !q ||
        String(item?.parameter || "").toLowerCase().includes(q) ||
        String(item?.discipline || "").toLowerCase().includes(q) ||
        String(item?.range || "").toLowerCase().includes(q) ||
        String(item?.standardMethod || "").toLowerCase().includes(q) ||
        String(item?.cmc || "").toLowerCase().includes(q);
      return discOk && textOk;
    });
  }, [scopeItems, scopeDiscipline, scopeSearch]);

  const handleOpenNablScope = () => {
    setShowScopePanel(true);
    setTimeout(() => {
      scopePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleManualLookup = (e) => {
    e.preventDefault();
    const val = lookupInput.trim();
    if (!val) return;
    const isUlr = /^cc-/i.test(val);
    const isCert = /arcl\/cert/i.test(val);
    fetchVerification({
      id: "",
      cert: isCert ? val : "",
      ulr: isUlr ? val : "",
      sn: !isCert && !isUlr ? val : "",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-14">
      {/* Top Official ARCL Verification Header */}
      <div className="bg-gradient-to-r from-[#021C57] via-slate-900 to-[#021C57] text-white border-b-4 border-[#FA9703] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center">
              <img src="/assets/LOGO.png" alt="ARCL Instruments" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 mb-1">
                <FaQrcode className="text-[#FA9703]" /> Official ARCL NABL QR Dashboard
              </div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight truncate">
                {labProfile.labName || "ARCL Instruments Pvt. Ltd."}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-300">
                {labProfile.accreditationStandard || "ISO/IEC 17025:2017"} • NABL Cert No:{" "}
                <strong className="text-white font-mono">{labProfile.certificateNo || "CC-4313"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {cert?.found ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                <FaCheckCircle /> {cert.statusLabel || "Verified Authentic"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-amber-200 border border-white/20">
                <FaShieldAlt /> Official Verification Portal
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Verified Record Overview Strip (if matched) */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500 animate-pulse shadow-xs">
            Loading official certificate &amp; NABL lab scope verification details...
          </div>
        ) : cert?.found ? (
          <div className="bg-white rounded-2xl border-2 border-emerald-500/40 shadow-sm p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-[10px] font-bold uppercase text-emerald-800">Instrument / Equipment</div>
              <div className="font-black text-slate-900 text-sm mt-0.5">{cert.instrument}</div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">S/N: <strong>{cert.serialNo}</strong></div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-500">Certificate &amp; ULR No.</div>
              <div className="font-mono font-black text-[#021C57] text-sm mt-0.5">{cert.certificateNo || "Issued"}</div>
              <div className="text-[11px] font-mono text-teal-700 font-bold mt-0.5">
                {cert.ulrNo ? `ULR: ${cert.ulrNo}` : `DC: ${cert.dcNo}`}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-500">Calibrated For</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{cert.clientCompany}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Discipline: {cert.discipline}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-500">Validity &amp; Signatory</div>
              <div className="font-bold text-slate-900 text-xs mt-0.5">
                Cal: {formatDisplayDate(cert.calibrationDate)} • Due: <span className="text-emerald-700">{formatDisplayDate(cert.calibrationDueDate)}</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 truncate">Approved: <strong>{cert.authorizedBy}</strong></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900">Find / Verify Any Calibration Certificate</h2>
              <p className="text-xs text-slate-500">Enter Certificate No., ULR No., or Equipment Serial No. to view its official PDF.</p>
            </div>
            <form onSubmit={handleManualLookup} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder="e.g. ARCL/CERT/... or CC-4313... or Serial No"
                className="flex-1 md:w-72 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#021C57]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <FaSearch /> Verify
              </button>
            </form>
          </div>
        )}

        {/* MAIN 4-SECTION QR DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* SECTION 1: GO TO THE NABL CERTIFICATE */}
          <section className="bg-white rounded-3xl border-2 border-[#021C57]/20 shadow-md p-6 flex flex-col justify-between space-y-5 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-[#021C57] border border-blue-200">
                  Section 01
                </span>
                <div className="w-11 h-11 rounded-2xl bg-[#021C57] text-white flex items-center justify-center text-lg shadow-sm">
                  <FaFilePdf />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900">Go to the NABL Certificate</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {cert?.found
                  ? `Official digitally verifiable ${cert.isCertified ? "NABL Calibration Certificate" : "Calibration Report"} for ${cert.instrument} (Cert: ${cert.certificateNo || "Issued"}).`
                  : "Open and verify official ARCL NABL Calibration Certificate PDFs directly from our laboratory server."}
              </p>

              {cert?.found && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 font-mono text-slate-700">
                  <div><strong>Cert No:</strong> {cert.certificateNo || "-"}</div>
                  {cert.ulrNo && <div><strong>ULR No:</strong> {cert.ulrNo}</div>}
                  <div><strong>S/N:</strong> {cert.serialNo}</div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {certificatePdfUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const targetCert = cert?.certificateNo || certParam || snParam || "Official Certificate";
                      const chosenUrl =
                        (docParam === "obs" || cert?.isObservationDoc) && observationPdfUrl
                          ? observationPdfUrl
                          : certificatePdfUrl;
                      setActiveDocModal({
                        title:
                          docParam === "obs" || cert?.isObservationDoc
                            ? `Observation Report (${cert?.serialNo || snParam || targetCert})`
                            : `NABL Certificate (${targetCert})`,
                        url: chosenUrl,
                        downloadUrl: `${chosenUrl}${chosenUrl.includes("?") ? "&" : "?"}download=true`,
                        isImage: false,
                      });
                    }}
                    className="w-full py-3 px-4 bg-[#021C57] hover:bg-blue-900 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaFilePdf /> Go to the NABL Certificate →
                  </button>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${certificatePdfUrl}&download=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <FaDownload /> Download Certificate
                    </a>
                    <a
                      href={certificatePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                      title="Open PDF in new browser tab"
                    >
                      <FaExternalLinkAlt /> New Tab
                    </a>
                  </div>
                </>
              ) : (
                <Link
                  href="/calibration-services"
                  className="w-full py-3 px-4 bg-[#021C57] hover:bg-blue-900 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2"
                >
                  <FaSearch /> Track Certificate by S/N →
                </Link>
              )}
            </div>
          </section>

          {/* SECTION 2: GO TO THE NABL SCOPE */}
          <section className="bg-white rounded-3xl border-2 border-emerald-500/30 shadow-md p-6 flex flex-col justify-between space-y-5 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Section 02
                </span>
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm">
                  <FaAward />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900">Go to the NABL Scope</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Explore ARCL Calibration Laboratory&apos;s live accredited capabilities, CMC uncertainties, measurement ranges, and standard test methods under{" "}
                <strong>{labProfile.accreditationStandard || "ISO/IEC 17025:2017"}</strong>.
              </p>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] space-y-1 text-emerald-950">
                <div><strong>Accreditation Cert:</strong> <span className="font-mono font-black">{labProfile.certificateNo || "CC-4313"}</span></div>
                <div><strong>Accredited Parameters:</strong> <span className="font-mono font-black">{labProfile.totalScopeParameters || scopeItems.length} Parameters</span></div>
                {matchedScopeItems.length > 0 && (
                  <div className="text-emerald-800 font-semibold">
                    ✓ {matchedScopeItems.length} matching NABL scope item(s) found for this instrument
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenNablScope}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaShieldAlt /> Go to the NABL Scope →
              </button>
              <Link
                href="/calibration-services"
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <FaExternalLinkAlt className="text-[10px]" /> Open Calibration Services Page
              </Link>
            </div>
          </section>

          {/* SECTION 3: GOVT / NABL ACCREDITATION CERTIFICATE */}
          <section className="bg-white rounded-3xl border-2 border-indigo-500/30 shadow-md p-6 flex flex-col justify-between space-y-5 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                  Section 03
                </span>
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
                  <FaStamp />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900">Govt NABL Certificate</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                View ARCL Calibration Laboratory&apos;s official Government-recognized{" "}
                <strong>NABL Accreditation Certificate</strong> under{" "}
                <strong>{labProfile.accreditationStandard || "ISO/IEC 17025:2017"}</strong>.
              </p>

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-[11px] space-y-1 text-indigo-950">
                <div>
                  <strong>NABL Cert No:</strong>{" "}
                  <span className="font-mono font-black">{labProfile.certificateNo || "CC-4313"}</span>
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="font-bold text-emerald-700">{labProfile.status || "Active"}</span>
                  {labProfile.validUntil && ` • Valid: ${formatDisplayDate(labProfile.validUntil)}`}
                </div>
                {govtCert?.fileName && (
                  <div className="text-indigo-800 font-semibold truncate" title={govtCert.fileName}>
                    ✓ File: {govtCert.fileName}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {govtCertUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDocModal({
                        title: `Govt NABL Accreditation Certificate (${labProfile.certificateNo || "CC-4313"})`,
                        url: govtCertUrl,
                        downloadUrl: govtCertUrl,
                        isImage: isGovtCertImage,
                      })
                    }
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaStamp /> View Govt NABL Certificate →
                  </button>
                  <div className="flex items-center gap-2">
                    <a
                      href={govtCertUrl}
                      download={govtCert?.fileName || "ARCL_Govt_NABL_Certificate"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <FaDownload /> Download
                    </a>
                    <a
                      href={govtCertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                      title="Open Govt NABL Certificate in new tab"
                    >
                      <FaExternalLinkAlt /> New Tab
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-center font-semibold">
                  Govt NABL Certificate document will be viewable &amp; downloadable here once uploaded in Admin Lab Scope.
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: GO TO WEBSITE */}
          <section className="bg-white rounded-3xl border-2 border-[#FA9703]/40 shadow-md p-6 flex flex-col justify-between space-y-5 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
                  Section 04
                </span>
                <div className="w-11 h-11 rounded-2xl bg-[#FA9703] text-slate-950 flex items-center justify-center text-lg shadow-sm">
                  <FaGlobe />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900">Go to Website</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Visit the official website of <strong>ARCL Instruments Private Limited</strong> to explore civil engineering lab testing machines, product catalogs, and customer support.
              </p>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-[11px] space-y-1 text-slate-800">
                <div className="font-bold text-slate-900">www.arclinstruments.com</div>
                <div>📞 {website.phone || "+91 - 8369458583 / 6205691085"}</div>
                <div>✉️ {website.email || "info@arclinstruments.com"}</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/"
                className="w-full py-3 px-4 bg-gradient-to-r from-[#FA9703] to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2"
              >
                <FaGlobe /> Go to Website →
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/products"
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center transition"
                >
                  Equipment Catalog
                </Link>
                <Link
                  href="/contact"
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center transition"
                >
                  Contact Lab
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* EXPANDED LIVE NABL ACCREDITED SCOPE TABLE (Opens when Section 2 clicked) */}
        {showScopePanel && (
          <div
            ref={scopePanelRef}
            className="bg-white rounded-3xl border-2 border-emerald-500/40 shadow-lg p-5 sm:p-6 space-y-4 animate-fadeIn"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Live Accredited Scope • {labProfile.certificateNo || "CC-4313"}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  ARCL NABL Scope &amp; Calibration Capabilities ({filteredScopeItems.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Master Traceability: {labProfile.masterTraceability || "National Physical Laboratory (NPL), New Delhi & ERTL"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={scopeSearch}
                  onChange={(e) => setScopeSearch(e.target.value)}
                  placeholder="Search scope parameter, standard..."
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs w-56 focus:outline-none focus:border-emerald-600"
                />
                <select
                  value={scopeDiscipline}
                  onChange={(e) => setScopeDiscipline(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                >
                  {disciplines.map((d) => (
                    <option key={d} value={d}>
                      {d === "all" ? "All Disciplines" : d}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowScopePanel(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <FaTimes /> Hide
                </button>
              </div>
            </div>

            {matchedScopeItems.length > 0 && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="text-xs font-black text-emerald-950">
                  Highlighted Match for {cert?.instrument || "Calibrated Instrument"}:
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedScopeItems.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-[11px] font-bold text-emerald-900"
                    >
                      {m.parameter} ({m.range}) • CMC: {m.cmc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#021C57] text-white uppercase text-[10.5px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Discipline</th>
                    <th className="p-3">Parameter / Instrument Measured</th>
                    <th className="p-3">Range</th>
                    <th className="p-3">CMC (±)</th>
                    <th className="p-3">Standard Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredScopeItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        No NABL scope items matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredScopeItems.map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-700">{item.discipline || "-"}</td>
                        <td className="p-3 font-black text-slate-900">{item.parameter || "-"}</td>
                        <td className="p-3 font-mono text-slate-700">{item.range || "-"}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">{item.cmc || "-"}</td>
                        <td className="p-3 text-slate-600">{item.standardMethod || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Document / Certificate Modal */}
      {activeDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-4 py-3 bg-[#021C57] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm truncate">
                <FaFilePdf className="text-amber-400 shrink-0" />
                <span className="truncate">{activeDocModal.title || "Official NABL Document"}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeDocModal.downloadUrl || activeDocModal.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black inline-flex items-center gap-1"
                >
                  <FaDownload /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setActiveDocModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <FaTimes /> Close
                </button>
              </div>
            </div>
            {activeDocModal.isImage ? (
              <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
                <img
                  src={activeDocModal.url}
                  alt={activeDocModal.title || "Official NABL Certificate"}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <iframe
                src={activeDocModal.url}
                title={activeDocModal.title || "Official ARCL Certificate"}
                className="flex-1 w-full bg-slate-100"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
