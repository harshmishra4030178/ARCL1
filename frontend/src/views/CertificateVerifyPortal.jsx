"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaAward,
  FaCheckCircle,
  FaDownload,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFilePdf,
  FaGlobe,
  FaListUl,
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

const normalizeVerifyCompany = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export default function CertificateVerifyPortal() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") || searchParams.get("recordId") || "";
  const custParam = searchParams.get("cust") || "";
  const ckParam = searchParams.get("ck") || "";
  const certParam = searchParams.get("cert") || searchParams.get("certificateNo") || "";
  const ulrParam = searchParams.get("ulr") || searchParams.get("ulrNo") || "";
  const snParam = searchParams.get("sn") || searchParams.get("serialNo") || "";
  const docParam = searchParams.get("doc") || "";
  const srcParam = searchParams.get("src") || "";

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [lookupInput, setLookupInput] = useState("");
  const [showScopePanel, setShowScopePanel] = useState(false);
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopeDiscipline, setScopeDiscipline] = useState("all");
  const [activeDocModal, setActiveDocModal] = useState(null);
  const [showCustomerCertsModal, setShowCustomerCertsModal] = useState(false);
  const [certListSearch, setCertListSearch] = useState("");
  const [certListFilter, setCertListFilter] = useState("all");

  const scopePanelRef = useRef(null);

  const fetchVerification = useCallback(async (queryOverrides = {}) => {
    setLoading(true);
    try {
      const params = {
        id: queryOverrides.id ?? idParam,
        cust: queryOverrides.cust ?? custParam,
        ck: queryOverrides.ck ?? ckParam,
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
  }, [idParam, custParam, ckParam, certParam, ulrParam, snParam, docParam]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const cert = payload?.certificate || null;
  const customerCertificates = useMemo(() => {
    const rawList = Array.isArray(payload?.customerCertificates) ? payload.customerCertificates : [];
    if (!cert?.found) return [];
    const targetCompany = normalizeVerifyCompany(cert.clientCompany);
    const targetRecordId = String(cert.recordId || "");
    const completedOnly = rawList.filter((item) => Boolean(item && !item.isPendingCalibration && item.certificatePdfPath));
    if (!targetCompany || ["-", "n/a", "na", "nil", "valued client", "unknown"].includes(targetCompany)) {
      return completedOnly.filter(
        (item) => item?.isCurrentScan || (targetRecordId && String(item?.recordId || "") === targetRecordId)
      );
    }
    return completedOnly.filter((item) => {
      if (item?.isCurrentScan || (targetRecordId && String(item?.recordId || "") === targetRecordId)) return true;
      return normalizeVerifyCompany(item?.clientCompany) === targetCompany;
    });
  }, [cert?.clientCompany, cert?.found, cert?.recordId, payload?.customerCertificates]);
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
    if (!cert?.found || cert?.isPendingCalibration) return "";
    if (cert?.certificatePdfPath || cert?.recordId) {
      const path =
        cert.certificatePdfPath ||
        `/calibration/download-document?recordId=${encodeURIComponent(cert.recordId)}&docType=certificate&single=true`;
      return `${backendBase}${path.startsWith("/") ? "" : "/"}${path}`;
    }
    return "";
  }, [backendBase, cert]);

  const observationPdfUrl = useMemo(() => {
    if (!cert?.found || cert?.isPendingCalibration) return "";
    const rid = cert?.recordId || idParam;
    if (!rid) return "";
    const qs = new URLSearchParams();
    qs.set("recordId", rid);
    qs.set("docType", "observation_sheet");
    qs.set("single", "true");
    return `${backendBase}/calibration/download-document?${qs.toString()}`;
  }, [backendBase, cert?.found, cert?.isPendingCalibration, cert?.recordId, idParam]);

  const buildRecordPdfUrl = useCallback(
    (recItem, useObs = false) => {
      if (!recItem) return "";
      if (useObs && recItem.recordId) {
        return `${backendBase}/calibration/download-document?recordId=${encodeURIComponent(
          recItem.recordId
        )}&docType=observation_sheet&single=true`;
      }
      if (recItem.certificatePdfPath || recItem.recordId) {
        const path =
          recItem.certificatePdfPath ||
          `/calibration/download-document?recordId=${encodeURIComponent(
            recItem.recordId
          )}&docType=certificate&single=true`;
        return `${backendBase}${path.startsWith("/") ? "" : "/"}${path}`;
      }
      return "";
    },
    [backendBase]
  );

  const sameBatchCertCount = useMemo(
    () => customerCertificates.filter((c) => c?.isSameBatch).length,
    [customerCertificates]
  );

  const filteredCustomerCerts = useMemo(() => {
    const q = certListSearch.trim().toLowerCase();
    return customerCertificates.filter((item) => {
      const batchOk = certListFilter !== "batch" || item?.isSameBatch;
      const textOk =
        !q ||
        String(item?.instrument || "").toLowerCase().includes(q) ||
        String(item?.serialNo || "").toLowerCase().includes(q) ||
        String(item?.certificateNo || "").toLowerCase().includes(q) ||
        String(item?.ulrNo || "").toLowerCase().includes(q) ||
        String(item?.dcNo || "").toLowerCase().includes(q);
      return batchOk && textOk;
    });
  }, [customerCertificates, certListFilter, certListSearch]);

  const openCertificateInModal = useCallback(
    (recItem, { fromList = false, useObs = false } = {}) => {
      const targetCert =
        recItem?.certificateNo || certParam || snParam || "Calibration Certificate";
      const chosenUrl = buildRecordPdfUrl(recItem, useObs) || certificatePdfUrl;
      if (!chosenUrl) return;
      if (fromList) setShowCustomerCertsModal(false);
      setActiveDocModal({
        title: useObs
          ? `Observation Report (${recItem?.serialNo || snParam || targetCert})`
          : `${recItem?.instrument || "Calibration Certificate"} (${targetCert})`,
        url: chosenUrl,
        downloadUrl: `${chosenUrl}${chosenUrl.includes("?") ? "&" : "?"}download=true`,
        isImage: false,
        fromCertList: fromList,
      });
    },
    [buildRecordPdfUrl, certParam, certificatePdfUrl, snParam]
  );

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
    const isCert = /^arcl[-/]/i.test(val);
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
              cert?.isPendingCalibration ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                  <FaShieldAlt /> {cert.statusLabel || "Calibration / Observation Pending"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                  <FaCheckCircle /> {cert.statusLabel || "Verified Authentic"}
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-amber-200 border border-white/20">
                <FaShieldAlt /> Official Verification Portal
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Envelope Dispatch QR Verification Banner */}
        {srcParam === "envelope" && cert?.found && (
          <div className="bg-gradient-to-r from-[#021C57] via-blue-900 to-[#021C57] text-white p-4 rounded-2xl shadow-md border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#021C57] flex items-center justify-center shrink-0 text-xl font-black">
                <FaEnvelope />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <FaQrcode /> Envelope Dispatch Verification QR • Official ARCL Package
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {cert?.clientCompany ? `${cert.clientCompany} — Calibrated Instruments Package` : "Customer Calibration Verification Portal"}
                </div>
                <div className="text-[11px] text-blue-200 mt-0.5">
                  Is customer ke sabhi authorized NABL calibration certificates neeche verified state mein uplabdh hain.
                </div>
              </div>
            </div>
            {customerCertificates.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCustomerCertsModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FaListUl /> View All Certificates ({customerCertificates.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verified Record Overview Strip (if matched) */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500 animate-pulse shadow-xs">
            Loading official certificate &amp; NABL lab scope verification details...
          </div>
        ) : cert?.found ? (
          <div
            className={`bg-white rounded-2xl border-2 shadow-sm p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs ${
              cert.isPendingCalibration ? "border-amber-400/70" : "border-emerald-500/40"
            }`}
          >
            <div
              className={`p-3 rounded-xl border ${
                cert.isPendingCalibration
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-emerald-50/70 border-emerald-200"
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase ${
                  cert.isPendingCalibration ? "text-amber-800" : "text-emerald-800"
                }`}
              >
                {cert.isCustomerQrMode ? "Customer Verification Portal" : "Instrument / Equipment"}
              </div>
              <div className="font-black text-slate-900 text-sm mt-0.5">{cert.instrument}</div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                {cert.serialNo && cert.serialNo !== "-" ? (
                  <>
                    S/N: <strong>{cert.serialNo}</strong>
                  </>
                ) : (
                  <>Calibrated Reports: <strong>{customerCertificates.length}</strong></>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-500">Certificate &amp; ULR No.</div>
              <div
                className={`font-mono font-black text-sm mt-0.5 ${
                  cert.isPendingCalibration ? "text-amber-700" : "text-[#021C57]"
                }`}
              >
                {cert.isPendingCalibration ? "Pending Calibration" : cert.certificateNo || "Issued"}
              </div>
              <div className="text-[11px] font-mono text-teal-700 font-bold mt-0.5">
                {!cert.isPendingCalibration && cert.ulrNo ? `ULR: ${cert.ulrNo}` : `DC: ${cert.dcNo || "-"}`}
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
                {cert.isPendingCalibration ? (
                  <span className="text-amber-700">Calibration &amp; Observation Pending</span>
                ) : (
                  <>
                    Cal: {formatDisplayDate(cert.calibrationDate)} • Due:{" "}
                    <span className="text-emerald-700">{formatDisplayDate(cert.calibrationDueDate)}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                {cert.isPendingCalibration ? "Status:" : "Approved:"} <strong>{cert.authorizedBy}</strong>
              </div>
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
          {/* SECTION 1: GO TO THE CALIBRATION CERTIFICATE */}
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
              <h2 className="text-xl font-black text-slate-900">Go to the Calibration Certificate</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {cert?.found
                  ? cert?.isPendingCalibration
                    ? `Calibration / observation sheet is still pending for ${cert.instrument}. Official report will appear once calibration is completed.`
                    : `Official digitally verifiable ${cert.isCertified ? "NABL Calibration Certificate" : "Calibration Report"} for ${cert.instrument} (Cert: ${cert.certificateNo || "Issued"}).`
                  : "Open and verify official ARCL Calibration Certificate PDFs directly from our laboratory server."}
              </p>

              {cert?.found && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 font-mono text-slate-700">
                  <div><strong>Cert No:</strong> {cert.isPendingCalibration ? "Pending Calibration" : cert.certificateNo || "-"}</div>
                  {cert.ulrNo && !cert.isPendingCalibration && <div><strong>ULR No:</strong> {cert.ulrNo}</div>}
                  <div><strong>S/N:</strong> {cert.serialNo}</div>
                  {customerCertificates.length > 1 && (
                    <div className="pt-1 font-sans text-blue-800 font-bold flex items-center gap-1">
                      <FaListUl className="text-[10px]" /> {customerCertificates.length} Certificates available for this customer
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {certificatePdfUrl || customerCertificates.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (customerCertificates.length > 1) {
                        setCertListSearch("");
                        setCertListFilter("all");
                        setShowCustomerCertsModal(true);
                        return;
                      }
                      if (cert?.isPendingCalibration && customerCertificates.length === 1) {
                        openCertificateInModal(customerCertificates[0], { fromList: false });
                        return;
                      }
                      const targetCert = cert?.certificateNo || certParam || snParam || "Official Certificate";
                      const chosenUrl =
                        (docParam === "obs" || cert?.isObservationDoc) && observationPdfUrl
                          ? observationPdfUrl
                          : certificatePdfUrl;
                      if (!chosenUrl) return;
                      setActiveDocModal({
                        title:
                          docParam === "obs" || cert?.isObservationDoc
                            ? `Observation Report (${cert?.serialNo || snParam || targetCert})`
                            : `Calibration Certificate (${targetCert})`,
                        url: chosenUrl,
                        downloadUrl: `${chosenUrl}${chosenUrl.includes("?") ? "&" : "?"}download=true`,
                        isImage: false,
                        fromCertList: false,
                      });
                    }}
                    className="w-full py-3 px-4 bg-[#021C57] hover:bg-blue-900 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaFilePdf />
                    {customerCertificates.length > 1
                      ? `Go to the Calibration Certificate (${customerCertificates.length}) →`
                      : "Go to the Calibration Certificate →"}
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    {customerCertificates.length > 1 && certificatePdfUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          openCertificateInModal(cert, {
                            fromList: false,
                            useObs: docParam === "obs" || cert?.isObservationDoc,
                          })
                        }
                        className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#021C57] border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <FaFilePdf /> Scanned PDF
                      </button>
                    )}
                    {(() => {
                      const singleFallbackUrl =
                        certificatePdfUrl || (customerCertificates.length === 1 ? buildRecordPdfUrl(customerCertificates[0], false) : "");
                      if (!singleFallbackUrl) return null;
                      return (
                        <>
                          <a
                            href={`${singleFallbackUrl}&download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <FaDownload /> Download
                          </a>
                          <a
                            href={singleFallbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                            title="Open PDF in new browser tab"
                          >
                            <FaExternalLinkAlt /> New Tab
                          </a>
                        </>
                      );
                    })()}
                  </div>
                </>
              ) : cert?.isPendingCalibration ? (
                <div className="w-full py-3 px-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold text-center">
                  Calibration / Observation Not Completed Yet — Report Pending
                </div>
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

      {/* Customer All Calibration Certificates List Modal (Opens when customer has multiple reports) */}
      {showCustomerCertsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-4 sm:px-6 py-4 bg-[#021C57] text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-black text-sm sm:text-base truncate">
                  <FaListUl className="text-amber-400 shrink-0" />
                  <span className="truncate">
                    Calibration Certificates ({customerCertificates.length})
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Customer: <strong className="text-white">{cert?.clientCompany || "Valued Client"}</strong>
                  {cert?.dcNo && cert.dcNo !== "-" ? ` • DC: ${cert.dcNo}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerCertsModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <FaTimes /> Close
              </button>
            </div>

            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={certListSearch}
                  onChange={(e) => setCertListSearch(e.target.value)}
                  placeholder="Search instrument, S/N, certificate no, DC no..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#021C57]"
                />
              </div>
              {sameBatchCertCount > 0 && sameBatchCertCount < customerCertificates.length && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCertListFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                      certListFilter === "all"
                        ? "bg-[#021C57] text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    All Reports ({customerCertificates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertListFilter("batch")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                      certListFilter === "batch"
                        ? "bg-[#021C57] text-white"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    This Batch / DC ({sameBatchCertCount})
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-slate-50/50">
              {filteredCustomerCerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                  No calibration certificates matched your search.
                </div>
              ) : (
                filteredCustomerCerts.map((item, idx) => {
                  const rowPdfUrl = buildRecordPdfUrl(item, false);
                  return (
                    <div
                      key={item.recordId || idx}
                      onClick={() => openCertificateInModal(item, { fromList: true })}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:shadow-md ${
                        item.isCurrentScan
                          ? "border-[#021C57]/50 bg-blue-50/30"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-black">
                            #{idx + 1}
                          </span>
                          <span className="font-black text-slate-900 text-sm truncate">
                            {item.instrument}
                          </span>
                          {item.isCurrentScan && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase">
                              Scanned QR
                            </span>
                          )}
                          {!item.isCurrentScan && item.isSameBatch && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                              Same DC
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 font-mono">
                          <span>Cert: <strong className="text-[#021C57]">{item.certificateNo || "Issued"}</strong></span>
                          {item.ulrNo && <span>ULR: <strong className="text-teal-700">{item.ulrNo}</strong></span>}
                          <span>S/N: <strong className="text-slate-800">{item.serialNo}</strong></span>
                          {item.dcNo && item.dcNo !== "-" && <span>DC: {item.dcNo}</span>}
                          <span>Due: <strong className="text-emerald-700">{formatDisplayDate(item.calibrationDueDate)}</strong></span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openCertificateInModal(item, { fromList: true })}
                          className="px-3.5 py-2 rounded-xl bg-[#021C57] hover:bg-blue-900 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FaFilePdf /> View PDF →
                        </button>
                        {rowPdfUrl && (
                          <a
                            href={`${rowPdfUrl}&download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs transition"
                            title="Download PDF"
                          >
                            <FaDownload />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Document / Certificate Modal */}
      {activeDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-4 py-3 bg-[#021C57] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm truncate">
                {activeDocModal.fromCertList && customerCertificates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDocModal(null);
                      setShowCustomerCertsModal(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <FaArrowLeft /> All ({customerCertificates.length})
                  </button>
                )}
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
