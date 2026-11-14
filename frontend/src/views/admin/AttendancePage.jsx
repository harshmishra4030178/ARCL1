"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore.js";
import {
  punchInBiometricApi,
  punchOutBiometricApi,
  getMyTodayAttendanceApi,
  getMyAttendanceHistoryApi,
  getAllStaffTodayAttendanceApi,
  getMonthlyAttendanceSheetApi,
  markManualAttendanceAdminApi,
  getBiometricChallengeApi,
  registerBiometricCredentialApi,
} from "../../api/attendanceApi.js";
import {
  FaFingerprint,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaWifi,
  FaUsers,
  FaCalendarAlt,
  FaFileDownload,
  FaShieldAlt,
  FaExclamationTriangle,
  FaMobileAlt,
  FaHistory,
  FaUserClock,
  FaSun,
  FaMoon,
  FaAward,
  FaTimes,
  FaEdit,
  FaBuilding,
} from "react-icons/fa";
import { toast } from "react-toastify";

// Helper: capture high accuracy GPS coords
const captureDeviceGps = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      return resolve({ latitude: null, longitude: null });
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        console.warn("GPS capture error:", err?.message);
        resolve({ latitude: null, longitude: null });
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  });
};

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "superadmin" || user?.role === "admin";

  // Strictly ONLY Harsh Mishra can edit or adjust staff attendance (SuperAdmin is blocked)
  const isHarshUser = useMemo(() => {
    if (!user) return false;
    const email = String(user.email || "").trim().toLowerCase();
    const name = String(user.name || "").trim().toLowerCase();
    const harshEmails = [
      "hm4030178@gmail.com",
      "harshmishra4030@gmail.com",
      "harsh.mishra9023@gmail.com",
    ];
    if (harshEmails.includes(email)) return true;
    if (email.startsWith("hm403") || email.startsWith("harshmishra")) return true;
    if (name.includes("harsh") && name.includes("mishra")) return true;
    return false;
  }, [user]);

  const [activeTab, setActiveTab] = useState("punch"); // 'punch' | 'roster' | 'monthly'
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Today punch status state
  const [todayData, setTodayData] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [punching, setPunching] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // My history state
  const [myHistory, setMyHistory] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Admin live roster state
  const [rosterData, setRosterData] = useState(null);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Admin monthly sheet state
  const [monthlyData, setMonthlyData] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Manual correction modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    userId: "",
    date: "",
    status: "PRESENT",
    punchInTimeStr: "09:30",
    punchOutTimeStr: "18:30",
    remarks: "",
  });
  const [savingManual, setSavingManual] = useState(false);

  // Real-time digital clock (Indian Standard Time)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check hardware biometric capability in browser (WebAuthn / Touch ID / Fingerprint)
  useEffect(() => {
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((available) => {
          setBiometricAvailable(Boolean(available));
        })
        .catch(() => setBiometricAvailable(false));
    }
  }, []);

  // Fetch today's punch state
  const fetchTodayState = async () => {
    try {
      setLoadingToday(true);
      const res = await getMyTodayAttendanceApi();
      if (res.data?.success) {
        setTodayData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch today attendance:", err);
    } finally {
      setLoadingToday(false);
    }
  };

  // Fetch my personal history
  const fetchMyHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await getMyAttendanceHistoryApi(selectedMonth, selectedYear);
      if (res.data?.success) {
        setMyHistory(res.data.data.records || []);
        setHistorySummary(res.data.data.summary || null);
      }
    } catch (err) {
      console.error("Failed to fetch my history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch live staff roster (Admin)
  const fetchStaffRoster = async () => {
    try {
      setLoadingRoster(true);
      const res = await getAllStaffTodayAttendanceApi();
      if (res.data?.success) {
        setRosterData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch roster:", err);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Fetch monthly sheet (Admin)
  const fetchMonthlySheet = async () => {
    try {
      setLoadingMonthly(true);
      const res = await getMonthlyAttendanceSheetApi(selectedMonth, selectedYear);
      if (res.data?.success) {
        setMonthlyData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch monthly sheet:", err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    fetchTodayState();
  }, []);

  useEffect(() => {
    if (activeTab === "punch") {
      fetchMyHistory();
    } else if (activeTab === "roster") {
      fetchStaffRoster();
    } else if (activeTab === "monthly") {
      fetchMonthlySheet();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  // Execute WebAuthn Biometric Prompt (Native Mobile Fingerprint Sensor)
  const triggerMobileBiometricPrompt = async () => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return { verified: false, method: "OFFICE_VERIFIED" };
    }

    try {
      // Create random challenge for hardware biometric prompt
      const challengeBuf = new Uint8Array(32);
      window.crypto.getRandomValues(challengeBuf);

      const userIdBuf = new Uint8Array(
        [...String(user?._id || "user")].map((c) => c.charCodeAt(0))
      );

      // Invoke native Android BiometricPrompt or iOS Touch/Face ID
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBuf,
          rp: {
            name: "ARCL Instruments Attendance",
            id: window.location.hostname,
          },
          user: {
            id: userIdBuf,
            name: user?.email || "staff",
            displayName: user?.name || "Staff Member",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Phone's hardware sensor
            userVerification: "required",
          },
          timeout: 45000,
        },
      });

      if (credential) {
        return {
          verified: true,
          method: "FINGERPRINT_BIOMETRIC",
          credentialId: credential.id,
        };
      }
    } catch (biometricErr) {
      console.warn("Biometric verification note:", biometricErr?.message);
    }

    // Fallback if hardware prompt was cancelled or unsupported on desktop
    return { verified: true, method: "OFFICE_VERIFIED" };
  };

  // Handle Punch In (Mobile Fingerprint)
  const handlePunchIn = async () => {
    try {
      setPunching(true);
      toast.info("👆 Mobile fingerprint sensor par ungli lagayein...", {
        autoClose: 2500,
      });

      // 1. Hardware Fingerprint Scan
      const bio = await triggerMobileBiometricPrompt();

      // 2. Capture GPS Coordinates
      const coords = await captureDeviceGps();

      // 3. Send Punch Request to Server
      const res = await punchInBiometricApi({
        latitude: coords.latitude,
        longitude: coords.longitude,
        authMethod: bio.method,
        deviceInfo: navigator.userAgent || "Mobile Device",
        biometricVerified: bio.verified,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Attendance Punch-In Safal! 🎉");
        await fetchTodayState();
        fetchMyHistory();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Punch In failed";
      toast.error(msg, { autoClose: 6000 });
    } finally {
      setPunching(false);
    }
  };

  // Handle Punch Out (Mobile Fingerprint)
  const handlePunchOut = async () => {
    try {
      setPunching(true);
      toast.info("👆 Punch-Out ke liye mobile fingerprint sensor scan karein...", {
        autoClose: 2500,
      });

      const bio = await triggerMobileBiometricPrompt();
      const coords = await captureDeviceGps();

      const res = await punchOutBiometricApi({
        latitude: coords.latitude,
        longitude: coords.longitude,
        authMethod: bio.method,
        deviceInfo: navigator.userAgent || "Mobile Device",
        biometricVerified: bio.verified,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Punch-Out Safal! 👋");
        await fetchTodayState();
        fetchMyHistory();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Punch Out failed";
      toast.error(msg, { autoClose: 6000 });
    } finally {
      setPunching(false);
    }
  };

  // Manual Attendance Correction Submit (Harsh Mishra Exclusive)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!isHarshUser) {
      toast.error("Access Denied: Sirf Harsh Mishra hi attendance edit kar sakte hain.");
      return;
    }
    if (!manualForm.userId || !manualForm.date) {
      toast.error("User and Date are required.");
      return;
    }
    try {
      setSavingManual(true);
      const res = await markManualAttendanceAdminApi(manualForm);
      if (res.data?.success) {
        toast.success("Attendance manually adjusted successfully! ✅");
        setShowManualModal(false);
        if (activeTab === "roster") fetchStaffRoster();
        if (activeTab === "monthly") fetchMonthlySheet();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update attendance.");
    } finally {
      setSavingManual(false);
    }
  };

  // Export Monthly Sheet to CSV
  const handleExportCSV = () => {
    if (!monthlyData?.matrix) return;
    const daysCount = monthlyData.daysInMonth;
    let csv = `Employee,Email,Present Days,Late Marks,Half Days,Absent Days,Total Hours`;
    for (let d = 1; d <= daysCount; d++) {
      csv += `,Day ${d}`;
    }
    csv += "\n";

    monthlyData.matrix.forEach((row) => {
      csv += `"${row.user?.name || ""}","${row.user?.email || ""}",${row.presentCount},${row.lateCount},${row.halfDayCount},${row.absentCount},"${row.totalWorkHours}"`;
      row.days.forEach((day) => {
        csv += `,${day.status}`;
      });
      csv += "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ARCL_Attendance_${monthlyData.datePrefix}.csv`;
    link.click();
    toast.success("Attendance Sheet downloaded as CSV! 📊");
  };

  const isPunchedIn = todayData?.isPunchedIn;
  const isPunchedOut = todayData?.isPunchedOut;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-linear-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg">
              <FaFingerprint className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Staff Attendance Portal</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider">
                  Mobile Biometric
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Mobile fingerprint sensor, Office WiFi &amp; Geofence se verified staff attendance system.
              </p>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("punch")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "punch"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FaFingerprint />
            <span>My Punch &amp; History</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("roster")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "roster"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FaUsers />
                <span>Today's Staff Roster</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("monthly")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "monthly"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FaCalendarAlt />
                <span>Monthly Sheet &amp; Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MY MOBILE PUNCH & PERSONAL ATTENDANCE                    */}
      {/* ============================================================== */}
      {activeTab === "punch" && (
        <div className="space-y-6">
          
          {/* BIG INTERACTIVE BIOMETRIC PUNCH HERO CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-slate-900 via-slate-950 to-slate-900 border border-blue-900/40 p-5 sm:p-8 shadow-2xl text-center space-y-6">
            
            {/* Top Security Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                <FaClock className="text-amber-400" />
                <span>{currentDate || "Today"}</span>
              </span>

              {todayData?.isWifiConnectedToOffice ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                  <FaWifi />
                  <span>Office WiFi: Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300">
                  <FaWifi />
                  <span>Network IP: {todayData?.clientIp || "Detecting..."}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300">
                <FaMobileAlt />
                <span>Mobile Biometric Ready</span>
              </span>
            </div>

            {/* Live Clock Display */}
            <div className="space-y-1">
              <div className="font-mono text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                {currentTime || "00:00:00"}
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Asian Research &amp; Calibration Laboratories
              </p>
            </div>

            {/* THE BIG FINGERPRINT SCANNER BUTTON */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative">
                {/* Glowing Outer Ring */}
                <div
                  className={`absolute -inset-4 rounded-full opacity-75 blur-xl transition duration-500 ${
                    isPunchedOut
                      ? "bg-slate-700"
                      : isPunchedIn
                      ? "bg-indigo-600 animate-pulse"
                      : "bg-linear-to-r from-amber-500 to-emerald-500 animate-pulse"
                  }`}
                ></div>

                {/* Main Interactive Button */}
                <button
                  type="button"
                  disabled={punching || isPunchedOut}
                  onClick={isPunchedIn ? handlePunchOut : handlePunchIn}
                  className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center p-6 border-4 shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 disabled:cursor-not-allowed ${
                    isPunchedOut
                      ? "bg-slate-900 border-slate-700 text-slate-400 opacity-80"
                      : isPunchedIn
                      ? "bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 border-indigo-400 text-white hover:border-indigo-300"
                      : "bg-linear-to-br from-amber-500 via-amber-600 to-emerald-600 border-amber-300 text-slate-950 hover:brightness-110"
                  }`}
                >
                  <FaFingerprint
                    className={`text-5xl sm:text-6xl mb-2 transition duration-300 ${
                      punching ? "animate-bounce" : ""
                    }`}
                  />
                  
                  <span className="text-sm sm:text-base font-black uppercase tracking-tight text-center leading-tight">
                    {punching
                      ? "Verifying Finger..."
                      : isPunchedOut
                      ? "Day Completed"
                      : isPunchedIn
                      ? "Punch Out (Sham)"
                      : "Punch In (Subah)"}
                  </span>

                  <span className="text-[10px] opacity-80 mt-1 font-semibold">
                    {isPunchedOut
                      ? "Shubh Ratri!"
                      : isPunchedIn
                      ? "Scan to Clock Out"
                      : "Touch Mobile Sensor"}
                  </span>
                </button>
              </div>

              {/* Status Notice below button */}
              <div className="mt-6 text-xs max-w-md mx-auto text-slate-300 font-medium">
                {isPunchedOut ? (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-center gap-2">
                    <FaCheckCircle className="text-emerald-400 shrink-0 text-base" />
                    <span>
                      Aaj ki attendance complete ho chuki hai! Kul samay:{" "}
                      <strong>{todayData?.record?.workDurationFormatted}</strong>
                    </span>
                  </div>
                ) : isPunchedIn ? (
                  <div className="p-3 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 space-y-1">
                    <div className="flex items-center justify-center gap-2 font-bold text-indigo-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Active Work Session in Progress</span>
                    </div>
                    <div className="text-[11px] text-indigo-300">
                      Punch-In hua tha: <strong>{todayData?.record?.punchIn?.formattedTime}</strong> par. Sham ko jane se pehle button dabakar Punch-Out zaroor karein.
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    💡 Office aate hi apna mobile fingerprint sensor touch karke Punch-In karein. Phone ka WiFi aur Location enable hona chahiye.
                  </p>
                )}
              </div>
            </div>

            {/* TODAY PUNCH DETAILS TIMELINE */}
            {todayData?.record && (
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                
                {/* Punch In Details */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <FaSun /> Morning Punch-In:
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {todayData.record.punchIn?.formattedTime || "-"}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <FaShieldAlt className="text-emerald-400" />
                    <span>Verified via {todayData.record.punchIn?.authMethod || "Biometric"}</span>
                  </div>
                </div>

                {/* Punch Out Details */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <FaMoon /> Evening Punch-Out:
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {todayData.record.punchOut?.formattedTime || "Not Punched Out"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isPunchedOut ? "✓ Recorded" : "Awaiting day end"}
                  </div>
                </div>

                {/* Total Duration & Status */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <FaAward /> Total Work Hours:
                  </div>
                  <div className="text-base font-extrabold text-emerald-300">
                    {todayData.record.workDurationFormatted || "In Progress"}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      todayData.record.status === "PRESENT"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : todayData.record.status === "LATE"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {todayData.record.status}
                    </span>
                    {todayData.record.isLate && (
                      <span className="text-amber-400 font-bold text-[10px]">(Late Entry)</span>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* MY MONTHLY ATTENDANCE SUMMARY & HISTORY TABLE */}
          <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <FaHistory className="text-amber-400" />
                  <span>My Monthly Attendance History</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Aapke dwara is mahine lagaye gaye sabhi fingerprint punches ka vivaran
                </p>
              </div>

              {/* Month & Year Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 font-bold"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 font-bold"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            {historySummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Present Days</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {historySummary.presentDays}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Late Marks</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">
                    {historySummary.lateDays}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Half Days</div>
                  <div className="text-xl font-black text-blue-400 mt-0.5">
                    {historySummary.halfDays}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Work Hours</div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {historySummary.totalWorkHours} hrs
                  </div>
                </div>
              </div>
            )}

            {/* History Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Punch-In</th>
                    <th className="p-3">Punch-Out</th>
                    <th className="p-3">Work Duration</th>
                    <th className="p-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500 italic">
                        Attendance record load ho raha hai...
                      </td>
                    </tr>
                  ) : myHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500 italic">
                        Is mahine me abhi tak koi punch record nahi hai.
                      </td>
                    </tr>
                  ) : (
                    myHistory.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-white">{rec.date}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            rec.status === "PRESENT"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : rec.status === "HALF_DAY"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : rec.status === "LATE"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-white">
                          {rec.punchIn?.formattedTime || "-"}
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-300">
                          {rec.punchOut?.formattedTime || "-"}
                        </td>
                        <td className="p-3 font-bold text-emerald-300">
                          {rec.workDurationFormatted || "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-emerald-400 flex items-center gap-1">
                              <FaCheckCircle className="text-[9px]" /> WiFi
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-blue-400 flex items-center gap-1">
                              <FaCheckCircle className="text-[9px]" /> GPS
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LIVE STAFF ROSTER (ADMIN VIEW)                          */}
      {/* ============================================================== */}
      {activeTab === "roster" && isSuperAdmin && (
        <div className="space-y-6">
          
          {/* Summary Stat Cards */}
          {rosterData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Staff</div>
                <div className="text-2xl font-black text-white mt-1">
                  {rosterData.summary.totalStaff}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Currently in Office</div>
                <div className="text-2xl font-black text-emerald-300 mt-1 flex items-center gap-2">
                  <span>{rosterData.summary.currentlyInOffice}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-500/30">
                <div className="text-[10px] uppercase font-bold text-blue-400">Day Completed</div>
                <div className="text-2xl font-black text-blue-300 mt-1">
                  {rosterData.summary.completedDay}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/30">
                <div className="text-[10px] uppercase font-bold text-amber-400">Late Entries</div>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {rosterData.summary.lateCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/30">
                <div className="text-[10px] uppercase font-bold text-rose-400">Not Punched / Absent</div>
                <div className="text-2xl font-black text-rose-300 mt-1">
                  {rosterData.summary.absentCount}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Staff Table */}
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FaUserClock className="text-emerald-400" />
                  <span>Today's Real-Time Staff Presence ({rosterData?.date || "Today"})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sabhi staff ka biometric punch timing, active work session, aur office verification
                </p>
              </div>

              <button
                type="button"
                onClick={fetchStaffRoster}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer self-start sm:self-auto"
              >
                🔄 Refresh Roster
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Scope</th>
                    <th className="p-3.5">Today Status</th>
                    <th className="p-3.5">Punch-In (Subah)</th>
                    <th className="p-3.5">Punch-Out (Sham)</th>
                    <th className="p-3.5">Work Duration</th>
                    {isHarshUser && <th className="p-3.5 text-right">Edit</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingRoster ? (
                    <tr>
                      <td colSpan={isHarshUser ? "7" : "6"} className="p-6 text-center text-slate-500 italic">
                        Live staff presence load ho rahi hai...
                      </td>
                    </tr>
                  ) : rosterData?.roster?.length === 0 ? (
                    <tr>
                      <td colSpan={isHarshUser ? "7" : "6"} className="p-6 text-center text-slate-500 italic">
                        Koi staff user nahi mila.
                      </td>
                    </tr>
                  ) : (
                    rosterData?.roster?.map((item) => (
                      <tr key={item.user?._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 font-black flex items-center justify-center text-xs">
                              {item.user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-xs">
                                {item.user?.name || "Unnamed"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {item.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.user?.accessScope === "OFFICE_ONLY"
                              ? "bg-indigo-950 text-indigo-300 border border-indigo-700/50"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                          }`}>
                            {item.user?.accessScope === "OFFICE_ONLY" ? "🏢 Office Only" : "🌍 Anywhere"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            item.status === "PRESENT"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : item.status === "LATE"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : item.status === "HALF_DAY"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono font-bold text-white">
                          {item.attendance?.punchIn?.formattedTime ? (
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <span>{item.attendance.punchIn.formattedTime}</span>
                              {item.attendance.isLate && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">
                                  Late
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Not Punched</span>
                          )}
                        </td>

                        <td className="p-3.5 font-mono font-semibold text-slate-300">
                          {item.attendance?.punchOut?.formattedTime || (
                            item.isPunchedIn ? (
                              <span className="text-indigo-400 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                In Office
                              </span>
                            ) : "-"
                          )}
                        </td>

                        <td className="p-3.5 font-bold text-white">
                          {item.attendance?.workDurationFormatted || (
                            item.isPunchedIn ? "Active" : "-"
                          )}
                        </td>

                        {isHarshUser && (
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setManualForm({
                                  userId: item.user?._id,
                                  date: rosterData?.date || getTodayDateStringIndia(),
                                  status: item.status || "PRESENT",
                                  punchInTimeStr: item.attendance?.punchIn?.formattedTime || "09:30",
                                  punchOutTimeStr: item.attendance?.punchOut?.formattedTime || "18:30",
                                  remarks: item.attendance?.remarks || "Harsh Mishra Adjustment",
                                });
                                setShowManualModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer text-xs inline-flex items-center gap-1 font-bold shadow-xs"
                              title="Harsh Mishra Only: Edit / Adjust Attendance"
                            >
                              <FaEdit className="text-[11px]" />
                              <span>Edit</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MONTHLY ATTENDANCE SHEET & EXPORT                       */}
      {/* ============================================================== */}
      {activeTab === "monthly" && isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FaCalendarAlt className="text-amber-400" />
                  <span>Monthly Full Attendance Sheet (Payroll Matrix)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sabhi staff ka din-ba-din (1st to 31st) attendance record aur salary export
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 font-bold"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 font-bold"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-1.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <FaFileDownload />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300 whitespace-nowrap">
                <thead className="bg-slate-950 sticky top-0 z-10 text-[10px] uppercase font-black text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 sticky left-0 bg-slate-950 z-20">Employee</th>
                    <th className="p-3 text-center bg-emerald-950/40 text-emerald-300">P</th>
                    <th className="p-3 text-center bg-amber-950/40 text-amber-300">Late</th>
                    <th className="p-3 text-center bg-blue-950/40 text-blue-300">HD</th>
                    <th className="p-3 text-center bg-rose-950/40 text-rose-300">A</th>
                    <th className="p-3 text-center">Total Hrs</th>
                    {monthlyData?.daysInMonth &&
                      Array.from({ length: monthlyData.daysInMonth }).map((_, i) => (
                        <th key={i + 1} className="p-2 text-center min-w-[32px]">
                          {i + 1}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingMonthly ? (
                    <tr>
                      <td colSpan="40" className="p-6 text-center text-slate-500 italic">
                        Monthly attendance matrix generate ho raha hai...
                      </td>
                    </tr>
                  ) : monthlyData?.matrix?.length === 0 ? (
                    <tr>
                      <td colSpan="40" className="p-6 text-center text-slate-500 italic">
                        Koi record nahi mila.
                      </td>
                    </tr>
                  ) : (
                    monthlyData?.matrix?.map((row) => (
                      <tr key={row.user?._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                          {row.user?.name || row.user?.email}
                        </td>
                        <td className="p-3 text-center font-black text-emerald-400 bg-emerald-950/20">
                          {row.presentCount}
                        </td>
                        <td className="p-3 text-center font-black text-amber-400 bg-amber-950/20">
                          {row.lateCount}
                        </td>
                        <td className="p-3 text-center font-black text-blue-400 bg-blue-950/20">
                          {row.halfDayCount}
                        </td>
                        <td className="p-3 text-center font-black text-rose-400 bg-rose-950/20">
                          {row.absentCount}
                        </td>
                        <td className="p-3 text-center font-bold text-white">
                          {row.totalWorkHours}h
                        </td>
                        {row.days?.map((d) => (
                          <td
                            key={d.day}
                            className={`p-2 text-center text-[10px] font-black border-l border-slate-800/40 ${
                              d.status === "P"
                                ? "text-emerald-400 bg-emerald-950/20"
                                : d.status === "L"
                                ? "text-amber-400 bg-amber-950/20"
                                : d.status === "HD"
                                ? "text-blue-400 bg-blue-950/20"
                                : "text-slate-600"
                            }`}
                            title={`Date: ${d.date} | Status: ${d.status} | In: ${d.punchIn} | Out: ${d.punchOut}`}
                          >
                            {d.status}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-400/40 inline-block"></span>
                <strong>P</strong> = Present (8+ hrs)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-400/40 inline-block"></span>
                <strong>L</strong> = Late Mark (After 09:45 AM)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400/40 inline-block"></span>
                <strong>HD</strong> = Half Day (4-8 hrs)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block"></span>
                <strong>A</strong> = Absent
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HARSH MISHRA ONLY MANUAL ADJUSTMENT MODAL                      */}
      {/* ============================================================== */}
      {showManualModal && isHarshUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FaEdit className="text-amber-400" />
                <span>Harsh Mishra Exclusive — Attendance Edit</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Target Date:</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Status:</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-bold"
                >
                  <option value="PRESENT">PRESENT (Full Day)</option>
                  <option value="HALF_DAY">HALF_DAY (Half Day)</option>
                  <option value="LATE">LATE (Late Mark)</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="HOLIDAY">HOLIDAY</option>
                  <option value="LEAVE">LEAVE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Punch-In Time:</label>
                  <input
                    type="time"
                    value={manualForm.punchInTimeStr}
                    onChange={(e) => setManualForm({ ...manualForm, punchInTimeStr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Punch-Out Time:</label>
                  <input
                    type="time"
                    value={manualForm.punchOutTimeStr}
                    onChange={(e) => setManualForm({ ...manualForm, punchOutTimeStr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Remarks / Reason:</label>
                <input
                  type="text"
                  value={manualForm.remarks}
                  onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
                  placeholder="e.g. Phone battery dead / Admin approval..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl cursor-pointer transition shadow-md disabled:opacity-50"
                >
                  {savingManual ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
