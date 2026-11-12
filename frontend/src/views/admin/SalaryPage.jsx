"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FaMoneyCheckAlt,
  FaFileInvoiceDollar,
  FaUserTie,
  FaHandHoldingUsd,
  FaChartPie,
  FaPlus,
  FaSearch,
  FaFilter,
  FaPrint,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUniversity,
  FaIdCard,
  FaShieldAlt,
  FaCalculator,
  FaCalendarAlt,
  FaUserCheck,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaBuilding,
  FaFilePdf,
  FaDownload,
  FaEdit,
  FaTrashAlt,
} from "react-icons/fa";
import { useAuthStore } from "../../store/useAuthStore";
import {
  getSalaryStructuresApi,
  upsertSalaryStructureApi,
  getMonthlyPayrollApi,
  generateMonthlyPayrollApi,
  updateSalarySlipApi,
  markSalaryPaidApi,
  deleteSalarySlipApi,
  getSalaryAdvancesApi,
  createSalaryAdvanceApi,
  updateSalaryAdvanceStatusApi,
  getPayrollAnalyticsApi,
} from "../../api/salaryApi";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function SalaryPage() {
  const { user } = useAuthStore();
  const printRef = useRef(null);

  // Active Tab: "payroll" | "structures" | "advances" | "analytics"
  const [activeTab, setActiveTab] = useState("payroll");

  // Date filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Data states
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState({ slips: [], summary: {} });
  const [structuresData, setStructuresData] = useState({ structures: [], unconfiguredUsers: [] });
  const [advances, setAdvances] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [payingSlip, setPayingSlip] = useState(null);
  const [employeeMode, setEmployeeMode] = useState("create");

  // Edit / Add Structure form
  const [structureForm, setStructureForm] = useState({
    userId: "",
    employeeCode: "",
    employeeName: "",
    email: "",
    phone: "",
    designation: "Calibration Engineer",
    department: "Calibration Lab",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "active",
    monthlyCtc: 30000,
    earnings: {
      basic: 15000,
      hra: 6000,
      conveyance: 1600,
      medicalAllowance: 1250,
      specialAllowance: 6150,
      performanceBonus: 0,
    },
    deductions: {
      epfApplicable: true,
      epfAmount: 1800,
      esiApplicable: false,
      esiAmount: 0,
      professionalTax: 200,
      tds: 0,
    },
    bankDetails: {
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
      panNumber: "",
      uanNumber: "",
      esiNumber: "",
    },
    notes: "",
  });

  // Advance Form
  const [advanceForm, setAdvanceForm] = useState({
    userId: "",
    amount: 10000,
    tenureMonths: 2,
    monthlyEmi: 5000,
    reason: "Personal / Medical Emergency",
    notes: "",
  });

  // Mark as Paid form
  const [payForm, setPayForm] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "bank_transfer",
    transactionReference: "",
    paymentRemarks: "Direct Salary Disbursal via Net Banking",
  });

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 6000);
    } else {
      setAlertMsg(msg);
      setTimeout(() => setAlertMsg(null), 4000);
    }
  };

  // Fetch Payroll Data
  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await getMonthlyPayrollApi({
        month: selectedMonth,
        year: selectedYear,
        status: statusFilter,
        search: searchQuery,
      });
      if (res.data?.data) {
        setPayrollData(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch remote payroll, using fallback", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Salary Structures
  const fetchStructures = async () => {
    try {
      const res = await getSalaryStructuresApi();
      if (res.data?.data) {
        setStructuresData(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch structures", err);
    }
  };

  // Fetch Advances
  const fetchAdvances = async () => {
    try {
      const res = await getSalaryAdvancesApi();
      if (res.data?.data) {
        setAdvances(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch advances", err);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await getPayrollAnalyticsApi();
      if (res.data?.data) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch analytics", err);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchStructures();
    fetchAdvances();
    fetchAnalytics();
  }, [selectedMonth, selectedYear, statusFilter]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayroll();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-calculate earnings breakdown when CTC changes in Structure Form
  const handleCtcChange = (newCtc) => {
    const ctc = Number(newCtc) || 0;
    const basic = Math.round(ctc * 0.5);
    const hra = Math.round(basic * 0.4);
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, ctc - (basic + hra + conveyance + medical));
    const epf = structureForm.deductions.epfApplicable ? Math.round(basic * 0.12) : 0;
    const esi = (ctc <= 21000) ? Math.round(ctc * 0.0075) : 0;

    setStructureForm((prev) => ({
      ...prev,
      monthlyCtc: ctc,
      earnings: {
        ...prev.earnings,
        basic,
        hra,
        conveyance,
        medicalAllowance: medical,
        specialAllowance: special,
      },
      deductions: {
        ...prev.deductions,
        epfAmount: epf,
        esiApplicable: ctc <= 21000,
        esiAmount: esi,
      },
    }));
  };

  // Handle Generate Monthly Payroll
  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      const res = await generateMonthlyPayrollApi({
        month: selectedMonth,
        year: selectedYear,
      });
      showToast(res.data?.message || "Payroll generated successfully!");
      setShowGenerateModal(false);
      fetchPayroll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to generate payroll", true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Structure
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    if (employeeMode === "select" && !structureForm.userId) {
      showToast("Please select an employee", true);
      return;
    }
    if (employeeMode === "create" && (!structureForm.employeeName || !structureForm.employeeName.trim())) {
      showToast("Please enter Employee Full Name", true);
      return;
    }
    try {
      setLoading(true);
      const res = await upsertSalaryStructureApi(structureForm);
      showToast(res.data?.message || "Salary structure saved successfully!");
      setShowStructureModal(false);
      fetchStructures();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save salary structure", true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Open Structure Edit for Existing Staff
  const handleEditStructure = (struct) => {
    setEmployeeMode("select");
    setStructureForm({
      userId: struct.user?._id || struct.user,
      employeeCode: struct.employeeCode || "",
      employeeName: struct.employeeName || struct.user?.name || "",
      designation: struct.designation || "Calibration Engineer",
      department: struct.department || "Calibration Lab",
      joiningDate: struct.joiningDate ? new Date(struct.joiningDate).toISOString().split("T")[0] : "",
      status: struct.status || "active",
      monthlyCtc: struct.monthlyCtc || 25000,
      earnings: {
        basic: struct.earnings?.basic || 12500,
        hra: struct.earnings?.hra || 5000,
        conveyance: struct.earnings?.conveyance || 1600,
        medicalAllowance: struct.earnings?.medicalAllowance || 1250,
        specialAllowance: struct.earnings?.specialAllowance || 4650,
        performanceBonus: struct.earnings?.performanceBonus || 0,
      },
      deductions: {
        epfApplicable: struct.deductions?.epfApplicable ?? true,
        epfAmount: struct.deductions?.epfAmount || 1500,
        esiApplicable: struct.deductions?.esiApplicable ?? false,
        esiAmount: struct.deductions?.esiAmount || 0,
        professionalTax: struct.deductions?.professionalTax || 200,
        tds: struct.deductions?.tds || 0,
      },
      bankDetails: {
        bankName: struct.bankDetails?.bankName || "",
        accountHolderName: struct.bankDetails?.accountHolderName || "",
        accountNumber: struct.bankDetails?.accountNumber || "",
        ifscCode: struct.bankDetails?.ifscCode || "",
        upiId: struct.bankDetails?.upiId || "",
        panNumber: struct.bankDetails?.panNumber || "",
        uanNumber: struct.bankDetails?.uanNumber || "",
        esiNumber: struct.bankDetails?.esiNumber || "",
      },
      notes: struct.notes || "",
    });
    setShowStructureModal(true);
  };

  // Handle Mark as Paid
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payingSlip) return;
    try {
      setLoading(true);
      const res = await markSalaryPaidApi(payingSlip._id, payForm);
      showToast(res.data?.message || `Salary slip ${payingSlip.slipNumber} marked as Paid!`);
      setShowPayModal(false);
      setPayingSlip(null);
      fetchPayroll();
      fetchAdvances();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to mark salary as paid", true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Advance
  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (!advanceForm.userId) {
      showToast("Please select an employee", true);
      return;
    }
    try {
      setLoading(true);
      const res = await createSalaryAdvanceApi(advanceForm);
      showToast(res.data?.message || "Salary advance sanctioned successfully!");
      setShowAdvanceModal(false);
      fetchAdvances();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to issue advance", true);
    } finally {
      setLoading(false);
    }
  };

  // Print Salary Slip
  const handlePrintPayslip = () => {
    window.print();
  };

  const currentMonthName = MONTHS.find((m) => m.value === Number(selectedMonth))?.label || "Current Month";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Alerts */}
      {alertMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-emerald-400">
          <FaCheckCircle className="text-xl" />
          <span className="font-semibold text-sm">{alertMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-5 right-5 z-50 bg-red-600 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-red-400">
          <FaTimesCircle className="text-xl" />
          <span className="font-semibold text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Top Header & Month/Year Navigator */}
      <div className="bg-linear-to-r from-gray-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
            <FaShieldAlt /> Enterprise HR &amp; Payroll Module
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <FaMoneyCheckAlt className="text-emerald-400" /> Salary &amp; Payroll Management
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
            Automated monthly salary rolls, PF &amp; ESI statutory deductions, staff advances, instant printable payslips, and bank payment tracking.
          </p>
        </div>

        {/* Month & Year Selectors and Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 text-sm">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-white font-semibold px-3 py-1.5 outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-gray-800 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-white font-semibold px-2 py-1.5 outline-none cursor-pointer border-l border-white/20"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-gray-800 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
          >
            <FaCalculator /> Generate Payroll
          </button>

          <button
            onClick={() => {
              setStructureForm({
                userId: "",
                employeeCode: `ARCL-EMP-${Math.floor(100 + Math.random() * 900)}`,
                employeeName: "",
                designation: "Calibration Engineer",
                department: "Calibration Lab",
                joiningDate: new Date().toISOString().split("T")[0],
                status: "active",
                monthlyCtc: 30000,
                earnings: {
                  basic: 15000,
                  hra: 6000,
                  conveyance: 1600,
                  medicalAllowance: 1250,
                  specialAllowance: 6150,
                  performanceBonus: 0,
                },
                deductions: {
                  epfApplicable: true,
                  epfAmount: 1800,
                  esiApplicable: false,
                  esiAmount: 0,
                  professionalTax: 200,
                  tds: 0,
                },
                bankDetails: {
                  bankName: "",
                  accountHolderName: "",
                  accountNumber: "",
                  ifscCode: "",
                  upiId: "",
                  panNumber: "",
                  uanNumber: "",
                  esiNumber: "",
                },
                notes: "",
              });
              setShowStructureModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
          >
            <FaUserTie /> + Setup Staff Package
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 text-sm font-bold">
        <button
          onClick={() => setActiveTab("payroll")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "payroll"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FaFileInvoiceDollar /> Monthly Payroll Rolls ({currentMonthName} {selectedYear})
        </button>

        <button
          onClick={() => setActiveTab("structures")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "structures"
              ? "border-blue-600 text-blue-700 bg-blue-50/50"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FaUserTie /> Staff Salary Packages &amp; Bank Accounts ({structuresData.structures?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("advances")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "advances"
              ? "border-amber-600 text-amber-700 bg-amber-50/50"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FaHandHoldingUsd /> Salary Advances &amp; Loans ({advances.length})
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "analytics"
              ? "border-purple-600 text-purple-700 bg-purple-50/50"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FaChartPie /> Statutory Compliance &amp; Annual Analytics
        </button>
      </div>

      {/* TAB 1: MONTHLY PAYROLL ROLLS */}
      {activeTab === "payroll" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Payroll Cost</span>
              <div className="text-xl sm:text-2xl font-black text-gray-800">
                ₹{(payrollData.summary?.totalGrossPayroll || 0).toLocaleString()}
              </div>
              <span className="text-xs text-gray-500 font-medium">{payrollData.summary?.totalSlips || 0} Staff Active Slips</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Disbursed (Paid)</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">
                ₹{(payrollData.summary?.totalNetDisbursed || 0).toLocaleString()}
              </div>
              <span className="text-xs text-emerald-700 font-semibold">{payrollData.summary?.paidCount || 0} Paid Accounts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Disbursals</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600">
                ₹{(payrollData.summary?.totalPendingDisbursal || 0).toLocaleString()}
              </div>
              <span className="text-xs text-amber-700 font-semibold">{payrollData.summary?.pendingCount || 0} Slips Due</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Statutory &amp; Deductions</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600">
                ₹{(payrollData.summary?.totalDeductions || 0).toLocaleString()}
              </div>
              <span className="text-xs text-gray-500">PF + ESI + TDS + Loans</span>
            </div>
          </div>

          {/* Search & Status Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, code, slip #..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 shrink-0">
                <FaFilter /> Status:
              </span>
              {["all", "pending", "paid", "draft"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    statusFilter === st
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Payroll Slips Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 text-xs uppercase font-extrabold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Attendance</th>
                    <th className="px-6 py-4">Gross Earnings</th>
                    <th className="px-6 py-4">Deductions</th>
                    <th className="px-6 py-4">Net Take-Home</th>
                    <th className="px-6 py-4">Status &amp; UTR</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payrollData.slips && payrollData.slips.length > 0 ? (
                    payrollData.slips.map((slip) => (
                      <tr key={slip._id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Employee */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                              {slip.employeeName?.charAt(0) || "E"}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{slip.employeeName}</div>
                              <div className="text-xs text-gray-400 font-mono">{slip.employeeCode} • {slip.designation}</div>
                              <div className="text-[11px] text-gray-500">{slip.department}</div>
                            </div>
                          </div>
                        </td>

                        {/* Attendance */}
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <div className="font-semibold text-gray-800">
                              Present: <span className="text-emerald-600 font-bold">{slip.attendance?.presentDays || 0}</span> / {slip.attendance?.workingDays || 26}
                            </div>
                            {slip.attendance?.unpaidLeaves > 0 && (
                              <div className="text-red-500 font-medium">LOP: {slip.attendance.unpaidLeaves} days</div>
                            )}
                            {slip.attendance?.overtimeHours > 0 && (
                              <div className="text-blue-600 font-medium">OT: {slip.attendance.overtimeHours} hrs</div>
                            )}
                          </div>
                        </td>

                        {/* Gross Earnings */}
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-gray-900 text-sm">
                              ₹{(slip.earnings?.totalGrossEarnings || 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Basic: ₹{(slip.earnings?.basic || 0).toLocaleString()} • HRA: ₹{(slip.earnings?.hra || 0).toLocaleString()}
                            </div>
                          </div>
                        </td>

                        {/* Deductions */}
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-red-600">
                              -₹{(slip.deductions?.totalDeductions || 0).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              PF: ₹{(slip.deductions?.epf || 0).toLocaleString()} • ESI: ₹{(slip.deductions?.esi || 0).toLocaleString()}
                              {slip.deductions?.advanceDeduction > 0 && ` • EMI: ₹${slip.deductions.advanceDeduction.toLocaleString()}`}
                            </div>
                          </div>
                        </td>

                        {/* Net Take-Home */}
                        <td className="px-6 py-4">
                          <div className="text-base font-black text-emerald-700">
                            ₹{slip.netSalary?.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">{slip.slipNumber}</div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {slip.status === "paid" ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                                <FaCheckCircle className="text-emerald-600" /> Disbursed
                              </span>
                              {slip.paymentDetails?.transactionReference && (
                                <div className="text-[10px] font-mono text-gray-500">
                                  Ref: {slip.paymentDetails.transactionReference}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                              <FaClock className="text-amber-600" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Payslip */}
                            <button
                              onClick={() => {
                                setSelectedSlip(slip);
                                setShowSlipModal(true);
                              }}
                              title="View & Print Payslip"
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <FaFilePdf className="text-base" />
                            </button>

                            {/* Mark as Paid */}
                            {slip.status !== "paid" && (
                              <button
                                onClick={() => {
                                  setPayingSlip(slip);
                                  setShowPayModal(true);
                                }}
                                title="Disburse & Mark as Paid"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                              >
                                <FaMoneyCheckAlt /> Pay
                              </button>
                            )}

                            {/* Delete slip */}
                            {slip.status !== "paid" && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete draft salary slip ${slip.slipNumber}?`)) {
                                    try {
                                      await deleteSalarySlipApi(slip._id);
                                      showToast("Slip deleted");
                                      fetchPayroll();
                                    } catch (err) {
                                      showToast("Failed to delete", true);
                                    }
                                  }
                                }}
                                title="Delete Slip"
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrashAlt className="text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400">
                        <FaFileInvoiceDollar className="text-4xl mx-auto mb-3 opacity-30" />
                        <div className="text-base font-bold text-gray-600">No Salary Slips Generated Yet</div>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          Click &quot;Generate Payroll&quot; above to auto-create salary slips for all staff members with configured salary packages for {currentMonthName} {selectedYear}.
                        </p>
                        <button
                          onClick={() => setShowGenerateModal(true)}
                          className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 shadow-md"
                        >
                          + Generate Payroll Now
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF SALARY STRUCTURES & PACKAGES */}
      {activeTab === "structures" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Staff Compensation &amp; Bank Profiles</h2>
              <p className="text-xs text-gray-500">
                Setup base CTC, HRA, statutory EPF/ESI eligibility, and direct bank details for each team member.
              </p>
            </div>
            <button
              onClick={() => {
                setStructureForm({
                  userId: "",
                  employeeCode: `ARCL-EMP-${Math.floor(100 + Math.random() * 900)}`,
                  employeeName: "",
                  designation: "Calibration Engineer",
                  department: "Calibration Lab",
                  joiningDate: new Date().toISOString().split("T")[0],
                  status: "active",
                  monthlyCtc: 30000,
                  earnings: {
                    basic: 15000,
                    hra: 6000,
                    conveyance: 1600,
                    medicalAllowance: 1250,
                    specialAllowance: 6150,
                    performanceBonus: 0,
                  },
                  deductions: {
                    epfApplicable: true,
                    epfAmount: 1800,
                    esiApplicable: false,
                    esiAmount: 0,
                    professionalTax: 200,
                    tds: 0,
                  },
                  bankDetails: {
                    bankName: "",
                    accountHolderName: "",
                    accountNumber: "",
                    ifscCode: "",
                    upiId: "",
                    panNumber: "",
                    uanNumber: "",
                    esiNumber: "",
                  },
                  notes: "",
                });
                setShowStructureModal(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm"
            >
              <FaPlus /> Setup New Staff Package
            </button>
          </div>

          {/* Unconfigured Staff Warning Banner */}
          {structuresData.unconfiguredUsers && structuresData.unconfiguredUsers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-amber-500 text-xl shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">{structuresData.unconfiguredUsers.length} staff members</span> have not been configured with a salary structure yet.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {structuresData.unconfiguredUsers.slice(0, 3).map((u) => (
                  <button
                    key={u._id}
                    onClick={() => {
                      setStructureForm((prev) => ({
                        ...prev,
                        userId: u._id,
                        employeeName: u.name,
                      }));
                      setShowStructureModal(true);
                    }}
                    className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg"
                  >
                    + Setup {u.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Structures Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {structuresData.structures && structuresData.structures.length > 0 ? (
              structuresData.structures.map((s) => (
                <div key={s._id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">{s.employeeName}</h3>
                      <div className="text-xs font-mono text-gray-400">{s.employeeCode} • {s.designation}</div>
                      <div className="text-xs text-indigo-600 font-semibold">{s.department}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                      {s.status}
                    </span>
                  </div>

                  {/* CTC & Take-home highlight */}
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Monthly CTC</span>
                      <div className="text-xl font-black text-gray-800">₹{s.monthlyCtc?.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Est. Take Home</span>
                      <div className="text-lg font-black text-emerald-600">
                        ₹{Math.max(0, (s.monthlyCtc || 0) - ((s.deductions?.epfAmount || 0) + (s.deductions?.esiAmount || 0) + (s.deductions?.professionalTax || 200))).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Earnings & Deductions breakdown preview */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div>Basic: <strong className="text-gray-800">₹{s.earnings?.basic?.toLocaleString()}</strong></div>
                    <div>HRA: <strong className="text-gray-800">₹{s.earnings?.hra?.toLocaleString()}</strong></div>
                    <div>EPF: <strong className="text-red-500">{s.deductions?.epfApplicable ? `₹${s.deductions?.epfAmount}` : "Exempt"}</strong></div>
                    <div>ESI: <strong className="text-red-500">{s.deductions?.esiApplicable ? `₹${s.deductions?.esiAmount}` : "Exempt"}</strong></div>
                  </div>

                  {/* Bank Details snapshot */}
                  <div className="text-xs text-gray-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <FaUniversity /> {s.bankDetails?.bankName || "Bank Not Linked"}
                    </div>
                    <div className="text-[11px] font-mono text-gray-600">
                      Acc: {s.bankDetails?.accountNumber ? `••••${s.bankDetails.accountNumber.slice(-4)}` : "None"} • IFSC: {s.bankDetails?.ifscCode || "None"}
                    </div>
                    {s.bankDetails?.panNumber && (
                      <div className="text-[11px] font-mono text-gray-600">PAN: {s.bankDetails.panNumber}</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleEditStructure(s)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaEdit /> Edit Compensation &amp; Bank
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                <FaUserTie className="text-4xl mx-auto mb-2 opacity-30" />
                <p>No staff salary packages configured yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SALARY ADVANCES & LOANS */}
      {activeTab === "advances" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Salary Advances &amp; Staff Loans</h2>
              <p className="text-xs text-gray-500">
                Issue salary advances with automatic monthly EMI deductions during payroll generation.
              </p>
            </div>
            <button
              onClick={() => {
                setAdvanceForm({
                  userId: "",
                  amount: 10000,
                  tenureMonths: 2,
                  monthlyEmi: 5000,
                  reason: "Personal / Medical Emergency",
                  notes: "",
                });
                setShowAdvanceModal(true);
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm"
            >
              <FaPlus /> + Issue Salary Advance
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 text-xs uppercase font-extrabold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Advance Sanctioned</th>
                    <th className="px-6 py-4">Monthly EMI</th>
                    <th className="px-6 py-4">Recovered / Balance</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {advances.length > 0 ? (
                    advances.map((adv) => (
                      <tr key={adv._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {adv.employeeName}
                          <div className="text-xs text-gray-400 font-mono">{adv.advanceCode}</div>
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900">
                          ₹{adv.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">
                          ₹{adv.monthlyEmi?.toLocaleString()} / mo ({adv.tenureMonths} mos)
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-emerald-600">₹{(adv.recoveredAmount || 0).toLocaleString()}</span>
                              <span className="text-red-500">₹{(adv.balanceAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((adv.recoveredAmount || 0) / (adv.amount || 1)) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                          {adv.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              adv.status === "cleared"
                                ? "bg-emerald-100 text-emerald-800"
                                : adv.status === "active"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {adv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {adv.status === "active" && (
                            <button
                              onClick={async () => {
                                if (confirm(`Mark advance ${adv.advanceCode} as Cleared?`)) {
                                  try {
                                    await updateSalaryAdvanceStatusApi(adv._id, {
                                      status: "cleared",
                                      balanceAmount: 0,
                                      recoveredAmount: adv.amount,
                                    });
                                    showToast("Advance marked as cleared!");
                                    fetchAdvances();
                                  } catch (err) {
                                    showToast("Failed to clear advance", true);
                                  }
                                }
                              }}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors"
                            >
                              Mark Cleared
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-gray-400">
                        No active staff salary advances found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STATUTORY COMPLIANCE & ANNUAL ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaShieldAlt className="text-indigo-600" /> Statutory Compliance Summaries (FY {selectedYear})
            </h2>
            <p className="text-xs text-gray-500">
              Breakdown of EPF, ESI, and Tax Deductions ready for monthly EPFO and ESIC Challan filings.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* EPF Card */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">EPF / PF Deposit Due</span>
                <div className="text-2xl font-black text-indigo-900">
                  ₹{(payrollData.summary?.breakdown?.totalEpf || 0).toLocaleString()}
                </div>
                <div className="text-xs text-indigo-700 space-y-0.5">
                  <div>Employee Share (12%): ₹{Math.round((payrollData.summary?.breakdown?.totalEpf || 0)).toLocaleString()}</div>
                  <div>Employer Matching (12%): ₹{Math.round((payrollData.summary?.breakdown?.totalEpf || 0)).toLocaleString()}</div>
                  <div className="font-bold pt-1">Total Challan Amount: ₹{(Math.round((payrollData.summary?.breakdown?.totalEpf || 0) * 2)).toLocaleString()}</div>
                </div>
              </div>

              {/* ESI Card */}
              <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">ESIC Medical Contribution</span>
                <div className="text-2xl font-black text-teal-900">
                  ₹{(payrollData.summary?.breakdown?.totalEsi || 0).toLocaleString()}
                </div>
                <div className="text-xs text-teal-700 space-y-0.5">
                  <div>Employee (0.75%): ₹{(payrollData.summary?.breakdown?.totalEsi || 0).toLocaleString()}</div>
                  <div>Employer (3.25%): ₹{Math.round((payrollData.summary?.breakdown?.totalEsi || 0) * 4.33).toLocaleString()}</div>
                </div>
              </div>

              {/* TDS & PT Card */}
              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-5 space-y-2">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">TDS &amp; Professional Tax</span>
                <div className="text-2xl font-black text-rose-900">
                  ₹{((payrollData.summary?.breakdown?.totalTds || 0) + (payrollData.summary?.breakdown?.totalPt || 0)).toLocaleString()}
                </div>
                <div className="text-xs text-rose-700 space-y-0.5">
                  <div>TDS (Income Tax): ₹{(payrollData.summary?.breakdown?.totalTds || 0).toLocaleString()}</div>
                  <div>Professional Tax: ₹{(payrollData.summary?.breakdown?.totalPt || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Annual Monthly Expenditure Trends Table */}
          {analytics?.monthlyTrends && (
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Annual Payroll Spend Trend ({analytics.year})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Gross Salary</th>
                      <th className="px-4 py-3">Net Disbursed</th>
                      <th className="px-4 py-3">EPF Deductions</th>
                      <th className="px-4 py-3">ESI Deductions</th>
                      <th className="px-4 py-3">Paid Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.monthlyTrends.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{m.monthName}</td>
                        <td className="px-4 py-3">₹{m.totalGross?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">₹{m.totalNet?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">₹{m.totalEpf?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs">₹{m.totalEsi?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-xs">{m.paidCount} Staff</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: GENERATE MONTHLY PAYROLL                         */}
      {/* ========================================================= */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FaCalculator className="text-emerald-600" /> Generate Monthly Payroll
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              This will automatically calculate salaries for all active staff members with configured packages for{" "}
              <strong>{currentMonthName} {selectedYear}</strong>, including attendance days, statutory PF/ESI, and outstanding loan EMI deductions.
            </p>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-xs text-emerald-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <FaUserCheck /> {structuresData.structures?.length || 0} Staff Configured &amp; Ready
              </div>
              <div>Existing paid slips will remain protected and untouched.</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePayroll}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? "Processing..." : "Generate Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SETUP / EDIT SALARY STRUCTURE                    */}
      {/* ========================================================= */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <FaUserTie className="text-blue-600" /> Staff Compensation &amp; Bank Setup
              </h3>
              <button onClick={() => setShowStructureModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStructure} className="space-y-5">
              {/* Mode Toggle: Create New Employee vs Select Existing User */}
              <div className="bg-gray-100 p-1 rounded-2xl flex items-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setEmployeeMode("create");
                    setStructureForm((prev) => ({ ...prev, userId: "" }));
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    employeeMode === "create" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <FaPlus /> + Add New Employee / Staff
                </button>
                <button
                  type="button"
                  onClick={() => setEmployeeMode("select")}
                  className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    employeeMode === "select" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <FaUserTie /> Choose Existing System User
                </button>
              </div>

              {employeeMode === "create" ? (
                <div className="space-y-4 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Employee Full Name *</label>
                      <input
                        type="text"
                        value={structureForm.employeeName}
                        onChange={(e) => setStructureForm({ ...structureForm, employeeName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar Sharma"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Employee Code *</label>
                      <input
                        type="text"
                        value={structureForm.employeeCode}
                        onChange={(e) => setStructureForm({ ...structureForm, employeeCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. ARCL-EMP-105"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Official Email (Optional)</label>
                      <input
                        type="email"
                        value={structureForm.email || ""}
                        onChange={(e) => setStructureForm({ ...structureForm, email: e.target.value })}
                        placeholder="ramesh@arclinstruments.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Mobile / Phone Number</label>
                      <input
                        type="tel"
                        value={structureForm.phone || ""}
                        onChange={(e) => setStructureForm({ ...structureForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Select Staff Member *</label>
                    <select
                      value={structureForm.userId}
                      onChange={(e) => {
                        const u = structuresData.unconfiguredUsers?.find((x) => x._id === e.target.value) ||
                                  structuresData.structures?.find((x) => x.user?._id === e.target.value)?.user;
                        setStructureForm((prev) => ({
                          ...prev,
                          userId: e.target.value,
                          employeeName: u ? u.name : prev.employeeName,
                        }));
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose User Account --</option>
                      {structuresData.unconfiguredUsers?.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email}) - [New]
                        </option>
                      ))}
                      {structuresData.structures?.map((s) => (
                        <option key={s.user?._id || s._id} value={s.user?._id || s._id}>
                          {s.employeeName} ({s.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Employee Code *</label>
                    <input
                      type="text"
                      value={structureForm.employeeCode}
                      onChange={(e) => setStructureForm({ ...structureForm, employeeCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. ARCL-EMP-001"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={structureForm.designation}
                    onChange={(e) => setStructureForm({ ...structureForm, designation: e.target.value })}
                    placeholder="e.g. Senior Calibration Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <select
                    value={structureForm.department}
                    onChange={(e) => setStructureForm({ ...structureForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Calibration Lab">Calibration Lab (NABL)</option>
                    <option value="Thermal & Mechanical">Thermal &amp; Mechanical Lab</option>
                    <option value="Electro-Technical">Electro-Technical Lab</option>
                    <option value="Sales & Business">Sales &amp; Business Development</option>
                    <option value="Accounts & Finance">Accounts &amp; Finance</option>
                    <option value="IT & Engineering">IT &amp; Software Engineering</option>
                    <option value="Administration">Operations &amp; Administration</option>
                  </select>
                </div>
              </div>

              {/* Monthly CTC with Auto-calculator */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
                    Total Monthly CTC / Gross (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCtcChange(structureForm.monthlyCtc)}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <FaCalculator /> Auto-Calculate Salary Breakdown
                  </button>
                </div>
                <input
                  type="number"
                  value={structureForm.monthlyCtc}
                  onChange={(e) => handleCtcChange(e.target.value)}
                  placeholder="30000"
                  className="w-full px-4 py-2.5 rounded-xl border border-blue-200 text-lg font-black text-blue-900 bg-white focus:ring-2 focus:ring-blue-500"
                />

                {/* Earnings Breakdown Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Basic (50%)</span>
                    <input
                      type="number"
                      value={structureForm.earnings.basic}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        earnings: { ...structureForm.earnings, basic: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">HRA (40% of Basic)</span>
                    <input
                      type="number"
                      value={structureForm.earnings.hra}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        earnings: { ...structureForm.earnings, hra: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Conveyance Allowance</span>
                    <input
                      type="number"
                      value={structureForm.earnings.conveyance}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        earnings: { ...structureForm.earnings, conveyance: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Medical Allowance</span>
                    <input
                      type="number"
                      value={structureForm.earnings.medicalAllowance}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        earnings: { ...structureForm.earnings, medicalAllowance: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Special Allowance</span>
                    <input
                      type="number"
                      value={structureForm.earnings.specialAllowance}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        earnings: { ...structureForm.earnings, specialAllowance: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Bonus / Incentive</span>
                    <input
                      type="number"
                      value={structureForm.earnings.performanceBonus}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        earnings: { ...structureForm.earnings, performanceBonus: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Config */}
              <div className="bg-red-50/60 p-4 rounded-2xl border border-red-100 space-y-3">
                <span className="text-xs font-extrabold text-red-950 uppercase tracking-wider block">
                  Statutory Deductions (EPF, ESI &amp; Tax)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-gray-700 mb-1">
                      <input
                        type="checkbox"
                        checked={structureForm.deductions.epfApplicable}
                        onChange={(e) => setStructureForm({
                          ...structureForm,
                          deductions: { ...structureForm.deductions, epfApplicable: e.target.checked },
                        })}
                      />
                      EPF (12%)
                    </label>
                    <input
                      type="number"
                      value={structureForm.deductions.epfAmount}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        deductions: { ...structureForm.deductions, epfAmount: Number(e.target.value) },
                      })}
                      disabled={!structureForm.deductions.epfApplicable}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 font-bold text-gray-700 mb-1">
                      <input
                        type="checkbox"
                        checked={structureForm.deductions.esiApplicable}
                        onChange={(e) => setStructureForm({
                          ...structureForm,
                          deductions: { ...structureForm.deductions, esiApplicable: e.target.checked },
                        })}
                      />
                      ESI (0.75%)
                    </label>
                    <input
                      type="number"
                      value={structureForm.deductions.esiAmount}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        deductions: { ...structureForm.deductions, esiAmount: Number(e.target.value) },
                      })}
                      disabled={!structureForm.deductions.esiApplicable}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1 font-semibold">Prof. Tax (PT)</span>
                    <input
                      type="number"
                      value={structureForm.deductions.professionalTax}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        deductions: { ...structureForm.deductions, professionalTax: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1 font-semibold">TDS / Income Tax</span>
                    <input
                      type="number"
                      value={structureForm.deductions.tds}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        deductions: { ...structureForm.deductions, tds: Number(e.target.value) },
                      })}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block flex items-center gap-1.5">
                  <FaUniversity className="text-blue-600" /> Bank &amp; Government Registration Numbers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1">Bank Name</span>
                    <input
                      type="text"
                      value={structureForm.bankDetails.bankName}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        bankDetails: { ...structureForm.bankDetails, bankName: e.target.value },
                      })}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">Bank Account Number</span>
                    <input
                      type="text"
                      value={structureForm.bankDetails.accountNumber}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        bankDetails: { ...structureForm.bankDetails, accountNumber: e.target.value },
                      })}
                      placeholder="Account number"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">IFSC Code</span>
                    <input
                      type="text"
                      value={structureForm.bankDetails.ifscCode}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        bankDetails: { ...structureForm.bankDetails, ifscCode: e.target.value.toUpperCase() },
                      })}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">PAN Card Number</span>
                    <input
                      type="text"
                      value={structureForm.bankDetails.panNumber}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        bankDetails: { ...structureForm.bankDetails, panNumber: e.target.value.toUpperCase() },
                      })}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">EPF UAN Number</span>
                    <input
                      type="text"
                      value={structureForm.bankDetails.uanNumber}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        bankDetails: { ...structureForm.bankDetails, uanNumber: e.target.value },
                      })}
                      placeholder="12-digit UAN"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1">UPI ID (Optional)</span>
                    <input
                      type="text"
                      value={structureForm.bankDetails.upiId}
                      onChange={(e) => setStructureForm({
                        ...structureForm,
                        bankDetails: { ...structureForm.bankDetails, upiId: e.target.value },
                      })}
                      placeholder="employee@upi"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg"
                >
                  {loading ? "Saving..." : "Save Salary Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: MARK SALARY AS PAID (DISBURSAL)                  */}
      {/* ========================================================= */}
      {showPayModal && payingSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FaMoneyCheckAlt className="text-emerald-600" /> Disburse &amp; Record Payment
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <div className="text-xs text-gray-500 font-medium">Paying To:</div>
              <div className="text-base font-extrabold text-gray-900">{payingSlip.employeeName}</div>
              <div className="text-xs font-mono text-gray-500 mb-2">{payingSlip.employeeCode} • {payingSlip.periodString}</div>
              <div className="text-xs text-gray-500">Net Payable Amount:</div>
              <div className="text-2xl font-black text-emerald-700">₹{payingSlip.netSalary?.toLocaleString()}</div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={payForm.paymentMode}
                  onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="upi">UPI / Instant Pay</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Transaction UTR / Reference No.</label>
                <input
                  type="text"
                  value={payForm.transactionReference}
                  onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                  placeholder="e.g. UTR49281094829 or Cheque #019283"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Disbursal Date *</label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={payForm.paymentRemarks}
                  onChange={(e) => setPayForm({ ...payForm, paymentRemarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  {loading ? "Recording..." : "Confirm & Disburse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ISSUE SALARY ADVANCE                             */}
      {/* ========================================================= */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <FaHandHoldingUsd className="text-amber-600" /> Sanction Salary Advance
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Staff Member *</label>
                <select
                  value={advanceForm.userId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, userId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {structuresData.structures?.map((s) => (
                    <option key={s.user?._id || s._id} value={s.user?._id || s._id}>
                      {s.employeeName} ({s.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Advance Amount (₹) *</label>
                  <input
                    type="number"
                    value={advanceForm.amount}
                    onChange={(e) => {
                      const amt = Number(e.target.value);
                      const tenure = advanceForm.tenureMonths || 1;
                      setAdvanceForm({
                        ...advanceForm,
                        amount: amt,
                        monthlyEmi: Math.ceil(amt / tenure),
                      });
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tenure (Months) *</label>
                  <select
                    value={advanceForm.tenureMonths}
                    onChange={(e) => {
                      const tenure = Number(e.target.value);
                      const amt = advanceForm.amount || 0;
                      setAdvanceForm({
                        ...advanceForm,
                        tenureMonths: tenure,
                        monthlyEmi: Math.ceil(amt / tenure),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold"
                  >
                    {[1, 2, 3, 4, 6, 12].map((t) => (
                      <option key={t} value={t}>
                        {t} Month{t > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between">
                <span>Monthly Payroll Deduction EMI:</span>
                <span className="font-extrabold text-sm text-amber-800">₹{advanceForm.monthlyEmi?.toLocaleString()} / mo</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Advance</label>
                <input
                  type="text"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="e.g. Medical emergency, urgent home expense"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  {loading ? "Sanctioning..." : "Sanction Advance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: COMPLETE BRANDED PRINTABLE PAYSLIP               */}
      {/* ========================================================= */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-gray-100 space-y-6 my-6 max-h-[92vh] overflow-y-auto">
            {/* Top Action Bar (Print / Close) */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 print:hidden">
              <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                <FaFilePdf className="text-red-500 text-lg" /> Official Salary Payslip
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintPayslip}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <FaPrint /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div ref={printRef} className="space-y-6 text-gray-800">
              {/* Company Header */}
              <div className="border-b-2 border-gray-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    ASIAN RESEARCH &amp; CALIBRATION LABORATORIES
                  </h2>
                  <div className="text-xs text-gray-500 mt-0.5">
                    NABL Accredited Laboratory as per ISO/IEC 17025 • Govt. of India Recognized
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    C-12, Sector 63, Noida, Uttar Pradesh - 201301 | info@arclinstruments.com
                  </div>
                </div>
                <div className="text-right sm:text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                    PAYSLIP
                  </div>
                  <div className="text-xs font-extrabold text-gray-700 mt-1">
                    {selectedSlip.periodString}
                  </div>
                  <div className="text-[11px] font-mono text-gray-400">
                    Slip No: {selectedSlip.slipNumber}
                  </div>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block font-semibold">Employee Name</span>
                  <strong className="text-gray-900 text-sm">{selectedSlip.employeeName}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">Employee Code</span>
                  <strong className="text-gray-900 font-mono">{selectedSlip.employeeCode}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">Designation</span>
                  <strong className="text-gray-900">{selectedSlip.designation}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">Department</span>
                  <strong className="text-gray-900">{selectedSlip.department}</strong>
                </div>

                <div>
                  <span className="text-gray-400 block font-semibold">Working Days</span>
                  <strong className="text-gray-900">{selectedSlip.attendance?.workingDays || 26} Days</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">Present Days</span>
                  <strong className="text-emerald-700">{selectedSlip.attendance?.presentDays || 26} Days</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">Loss of Pay (LOP)</span>
                  <strong className="text-red-600">{selectedSlip.attendance?.unpaidLeaves || 0} Days</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">PAN / UAN</span>
                  <strong className="text-gray-900 font-mono">{selectedSlip.bankSnapshot?.panNumber || "N/A"}</strong>
                </div>
              </div>

              {/* Two Column Earnings & Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-emerald-900 border-b border-gray-200 flex justify-between">
                    <span>Earnings</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="divide-y divide-gray-100 text-xs">
                    <div className="flex justify-between px-4 py-2">
                      <span>Basic Salary</span>
                      <strong className="font-mono">₹{(selectedSlip.earnings?.basic || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>House Rent Allowance (HRA)</span>
                      <strong className="font-mono">₹{(selectedSlip.earnings?.hra || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>Conveyance Allowance</span>
                      <strong className="font-mono">₹{(selectedSlip.earnings?.conveyance || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>Medical Allowance</span>
                      <strong className="font-mono">₹{(selectedSlip.earnings?.medicalAllowance || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>Special Allowance</span>
                      <strong className="font-mono">₹{(selectedSlip.earnings?.specialAllowance || 0).toLocaleString()}</strong>
                    </div>
                    {selectedSlip.earnings?.performanceBonus > 0 && (
                      <div className="flex justify-between px-4 py-2">
                        <span>Performance Bonus</span>
                        <strong className="font-mono">₹{selectedSlip.earnings.performanceBonus.toLocaleString()}</strong>
                      </div>
                    )}
                    {selectedSlip.earnings?.overtimePay > 0 && (
                      <div className="flex justify-between px-4 py-2">
                        <span>Overtime Pay</span>
                        <strong className="font-mono">₹{selectedSlip.earnings.overtimePay.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-2.5 font-bold text-xs text-gray-900 border-t border-gray-200 flex justify-between">
                    <span>Total Gross Earnings (A)</span>
                    <span className="font-mono text-emerald-700">₹{(selectedSlip.earnings?.totalGrossEarnings || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-rose-50 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-rose-900 border-b border-gray-200 flex justify-between">
                    <span>Deductions</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="divide-y divide-gray-100 text-xs">
                    <div className="flex justify-between px-4 py-2">
                      <span>Provident Fund (EPF)</span>
                      <strong className="font-mono">₹{(selectedSlip.deductions?.epf || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>Employee State Insurance (ESI)</span>
                      <strong className="font-mono">₹{(selectedSlip.deductions?.esi || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>Professional Tax (PT)</span>
                      <strong className="font-mono">₹{(selectedSlip.deductions?.professionalTax || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span>Tax Deducted at Source (TDS)</span>
                      <strong className="font-mono">₹{(selectedSlip.deductions?.tds || 0).toLocaleString()}</strong>
                    </div>
                    {selectedSlip.deductions?.advanceDeduction > 0 && (
                      <div className="flex justify-between px-4 py-2 text-rose-600 font-medium">
                        <span>Salary Advance / Loan Recovery</span>
                        <strong className="font-mono">₹{selectedSlip.deductions.advanceDeduction.toLocaleString()}</strong>
                      </div>
                    )}
                    {selectedSlip.deductions?.lopDeduction > 0 && (
                      <div className="flex justify-between px-4 py-2 text-rose-600 font-medium">
                        <span>Loss of Pay (LOP) Deduction</span>
                        <strong className="font-mono">₹{selectedSlip.deductions.lopDeduction.toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-50 px-4 py-2.5 font-bold text-xs text-gray-900 border-t border-gray-200 flex justify-between">
                    <span>Total Deductions (B)</span>
                    <span className="font-mono text-red-600">₹{(selectedSlip.deductions?.totalDeductions || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay Highlight Bar */}
              <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-100">
                    Net Take-Home Salary Payable (A - B)
                  </span>
                  <div className="text-xs text-emerald-100/90 italic mt-0.5">
                    Amount in words: {selectedSlip.netSalaryInWords || "Rupees Only"}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono">
                  ₹{selectedSlip.netSalary?.toLocaleString()}
                </div>
              </div>

              {/* Payment Details Snapshot (If Paid) */}
              {selectedSlip.status === "paid" && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-600 text-base" />
                    <span>Disbursed via <strong>{selectedSlip.paymentDetails?.paymentMode?.toUpperCase()}</strong> on {new Date(selectedSlip.paymentDetails?.paymentDate || Date.now()).toLocaleDateString("en-IN")}</span>
                  </div>
                  {selectedSlip.paymentDetails?.transactionReference && (
                    <div className="font-mono">UTR: {selectedSlip.paymentDetails.transactionReference}</div>
                  )}
                </div>
              )}

              {/* Signatures & Seal Footer */}
              <div className="pt-10 flex items-end justify-between text-xs text-gray-500">
                <div className="space-y-1">
                  <div className="w-36 border-b border-gray-300 pb-1 font-mono text-[11px] text-gray-400">
                    Employee Signature
                  </div>
                  <div>Received &amp; Verified</div>
                </div>

                <div className="text-right space-y-1">
                  <div className="w-44 border-b border-gray-800 pb-1 font-bold text-gray-900">
                    Authorized Signatory
                  </div>
                  <div>For Asian Research &amp; Calibration Laboratories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
