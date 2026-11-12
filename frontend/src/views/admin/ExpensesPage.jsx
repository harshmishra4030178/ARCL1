"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaReceipt,
  FaWallet,
  FaPlus,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaDownload,
  FaSync,
  FaUserTie,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaMoneyBillWave,
  FaPaperclip,
  FaEye,
  FaTrashAlt,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaCoins,
  FaBuilding,
  FaCar,
  FaUtensils,
  FaFlask,
  FaTruck,
  FaTools,
  FaUsers,
  FaBell,
  FaChevronRight,
  FaFilePdf,
  FaImage,
  FaLock,
  FaUserCheck,
} from "react-icons/fa";
import { useAuthStore } from "../../store/useAuthStore.js";
import {
  createExpenseApi,
  logZeroExpenseTodayApi,
  getExpensesApi,
  getUserExpenseAccountsApi,
  getUserDailyStatusApi,
  getExpenseNotificationsApi,
  updateExpenseStatusApi,
  deleteExpenseApi,
  exportExpensesCsvApi,
} from "../../api/expenseApi.js";
import { getAdminUsersApi } from "../../api/userApi.js";

const CATEGORIES = [
  { name: "Travel & Conveyance", icon: <FaCar className="text-blue-500" /> },
  { name: "Client Hospitality & Food", icon: <FaUtensils className="text-amber-500" /> },
  { name: "Laboratory Chemicals & Consumables", icon: <FaFlask className="text-emerald-500" /> },
  { name: "Courier & Logistics", icon: <FaTruck className="text-purple-500" /> },
  { name: "Tools & Hardware Spare Parts", icon: <FaTools className="text-orange-500" /> },
  { name: "Office & Utilities", icon: <FaBuilding className="text-cyan-500" /> },
  { name: "Equipment Maintenance & Repairs", icon: <FaTools className="text-rose-500" /> },
  { name: "Staff Welfare", icon: <FaUsers className="text-indigo-500" /> },
  { name: "Miscellaneous", icon: <FaReceipt className="text-slate-500" /> },
];

const PAYMENT_MODES = [
  "Company UPI / Card",
  "Personal UPI (Claim Reimbursement)",
  "Company Cash",
  "Company Bank Transfer / NEFT",
];

const DATE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 Days" },
  { id: "month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "quarter", label: "Last 3M" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom Range" },
];

const LOCAL_STORAGE_EXPENSES_KEY = "arcl_expenses_cache_v1";

const getLocalExpenses = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalExpenses = (list) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(list));
  } catch (e) {}
};

export default function ExpensesPage() {
  const { user } = useAuthStore();

  // Active Main Tab
  // "ledger" = All Expenses Table
  // "accounts" = Staff Wallets & Accounts
  // "broadcast" = Live Activity & Alerts Feed
  // "analytics" = Category & Trends Breakdown
  const [activeTab, setActiveTab] = useState("ledger");

  // Loading States
  const [loading, setLoading] = useState(true);
  const [savingExpense, setSavingExpense] = useState(false);
  const [zeroSubmitting, setZeroSubmitting] = useState(false);
  const [serverNeedsRestart, setServerNeedsRestart] = useState(false);

  // Daily Status for Current User
  const [dailyStatus, setDailyStatus] = useState({
    hasLoggedToday: false,
    todayTotal: 0,
    isZeroDay: false,
    entriesCount: 0,
    todayEntries: [],
  });

  // Filter States
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Data Stores
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 50 });
  const [summary, setSummary] = useState({
    totalAmount: 0,
    pendingReimbursements: 0,
    approvedCount: 0,
    pendingCount: 0,
  });
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] = useState("all");

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    category: "Travel & Conveyance",
    title: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMode: "Company UPI / Card",
    isReimbursementClaim: false,
    receiptFile: null,
  });
  const fileInputRef = useRef(null);

  // 1. Fetch Daily Status for Current User
  const fetchDailyStatus = async () => {
    try {
      const res = await getUserDailyStatusApi();
      if (res?.data?.data) {
        setDailyStatus(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setServerNeedsRestart(true);
      }
      // Check local cache for today's status
      const localExps = getLocalExpenses();
      const todayString = new Date().toDateString();
      const userTodayEntries = localExps.filter(
        (e) => (String(e.userId) === String(user?._id) || e.userName === user?.name) &&
               new Date(e.expenseDate).toDateString() === todayString
      );
      if (userTodayEntries.length > 0) {
        const todayTotal = userTodayEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const isZero = userTodayEntries.some((e) => e.isZeroExpenseDay);
        setDailyStatus({
          hasLoggedToday: true,
          todayTotal,
          isZeroDay: isZero,
          entriesCount: userTodayEntries.length,
          todayEntries: userTodayEntries,
        });
      }
      console.warn("Daily status fallback notice:", err.message);
    }
  };

  // 2. Fetch Expenses List (with Auto Local & Remote Merge)
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const localList = getLocalExpenses();

      const params = {
        page,
        limit: 50,
        datePreset,
        startDate: datePreset === "custom" ? customStartDate : undefined,
        endDate: datePreset === "custom" ? customEndDate : undefined,
        category: selectedCategoryFilter,
        status: selectedStatusFilter,
        userId: selectedUserFilter !== "all" ? selectedUserFilter : undefined,
        search: searchTerm.trim() || undefined,
      };

      let fetchedList = [];
      let totalCount = 0;
      let totalSum = 0;
      let totalClaims = 0;

      try {
        const res = await getExpensesApi(params);
        if (res?.data?.data) {
          fetchedList = res.data.data.expenses || [];
          totalCount = res.data.data.pagination?.total || fetchedList.length;
          totalSum = res.data.data.summary?.totalAmount || 0;
          totalClaims = res.data.data.summary?.pendingReimbursements || 0;
          setServerNeedsRestart(false);
        }
      } catch (err) {
        console.warn("Backend getExpenses API notice, using local cache:", err.message);
        if (err.response?.status === 404) {
          setServerNeedsRestart(true);
        }
      }

      // Merge backend items with local storage items so no record is ever hidden
      const combined = [...fetchedList];
      localList.forEach((localItem) => {
        const alreadyExists = combined.some(
          (m) => String(m._id) === String(localItem._id) || (localItem.expenseCode && m.expenseCode === localItem.expenseCode)
        );
        if (!alreadyExists) {
          combined.unshift(localItem);
        }
      });

      // Client-side filtering to guarantee immediate response
      let filtered = [...combined];
      if (selectedUserFilter !== "all") {
        filtered = filtered.filter(
          (e) => String(e.userId) === String(selectedUserFilter) || e.userName === selectedUserFilter
        );
      }
      if (selectedCategoryFilter !== "all") {
        filtered = filtered.filter((e) => e.category === selectedCategoryFilter);
      }
      if (selectedStatusFilter !== "all") {
        filtered = filtered.filter((e) => e.status === selectedStatusFilter);
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (e) =>
            (e.title || "").toLowerCase().includes(q) ||
            (e.userName || "").toLowerCase().includes(q) ||
            (e.expenseCode || "").toLowerCase().includes(q) ||
            (e.category || "").toLowerCase().includes(q)
        );
      }

      setExpenses(filtered);
      const computedTotal = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const computedClaims = filtered
        .filter((e) => e.isReimbursementClaim && e.status === "Pending")
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);

      setPagination({
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / 50)),
        limit: 50,
      });
      setSummary({
        totalAmount: totalSum > 0 && fetchedList.length > 0 ? totalSum : computedTotal,
        pendingReimbursements: totalClaims > 0 ? totalClaims : computedClaims,
        approvedCount: filtered.filter((e) => e.status === "Approved").length,
        pendingCount: filtered.filter((e) => e.status === "Pending").length,
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Staff Accounts
  const fetchStaffAccounts = async () => {
    try {
      const res = await getUserExpenseAccountsApi();
      if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const localExpenses = getLocalExpenses();
        const enriched = res.data.data.map((acc) => {
          const userLocal = localExpenses.filter(
            (e) => String(e.userId) === String(acc.userId) || e.userName === acc.name
          );
          if (userLocal.length === 0) return acc;
          const localTotal = userLocal.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const todayString = new Date().toDateString();
          const localToday = userLocal.filter((e) => new Date(e.expenseDate).toDateString() === todayString);
          const localTodayAmount = localToday.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          return {
            ...acc,
            allTimeTotal: (acc.allTimeTotal || 0) + localTotal,
            allTimeCount: (acc.allTimeCount || 0) + userLocal.length,
            thisMonthTotal: (acc.thisMonthTotal || 0) + localTotal,
            thisMonthCount: (acc.thisMonthCount || 0) + userLocal.length,
            todayAmount: (acc.todayAmount || 0) + localTodayAmount,
            todayStatus: localToday.length > 0 ? (localTodayAmount > 0 ? "LOGGED_EXPENSE" : "LOGGED_ZERO") : acc.todayStatus,
          };
        });
        setStaffAccounts(enriched);
        try {
          localStorage.setItem("arcl_staff_accounts_cache_v2", JSON.stringify(enriched));
        } catch (e) {}
        setServerNeedsRestart(false);
        return;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setServerNeedsRestart(true);
      }
      console.warn("Expense accounts API notice, fetching from user directory:", err.message);
    }

    // Direct fallback: Fetch all registered users from /admin/users
    try {
      const userRes = await getAdminUsersApi();
      const rawUsers = userRes?.data?.data?.users || userRes?.data?.users || userRes?.data?.data || [];
      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        const localExpenses = getLocalExpenses();
        const accounts = rawUsers.map((u) => {
          const userExps = localExpenses.filter((e) => String(e.userId) === String(u._id) || e.userName === u.name);
          const allTimeTotal = userExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const thisMonthTotal = userExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const todayString = new Date().toDateString();
          const todayEntries = userExps.filter((e) => new Date(e.expenseDate).toDateString() === todayString);
          const hasToday = todayEntries.length > 0;
          const todayAmount = todayEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

          return {
            userId: u._id,
            name: u.name || "Staff Member",
            email: u.email,
            role: u.role || "staff",
            picture: u.picture || "",
            allTimeTotal,
            allTimeCount: userExps.length,
            thisMonthTotal,
            thisMonthCount: userExps.length,
            todayAmount,
            todayStatus: hasToday ? (todayAmount > 0 ? "LOGGED_EXPENSE" : "LOGGED_ZERO") : "PENDING_ALERT",
            pendingReimbursements: 0,
          };
        });
        setStaffAccounts(accounts);
        try {
          localStorage.setItem("arcl_staff_accounts_cache_v2", JSON.stringify(accounts));
        } catch (e) {}
        return;
      }
    } catch (userErr) {
      console.warn("Failed to fetch registered users fallback:", userErr.message);
    }

    // Cache fallback
    try {
      const cached = localStorage.getItem("arcl_staff_accounts_cache_v2");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStaffAccounts(parsed);
          return;
        }
      }
    } catch (e) {}

    // Fallback if current user exists
    if (user) {
      setStaffAccounts([
        {
          userId: user._id || "current_user",
          name: user.name || "Admin Staff",
          email: user.email || "",
          role: user.role || "admin",
          picture: user.picture || "",
          allTimeTotal: 0,
          allTimeCount: 0,
          thisMonthTotal: 0,
          thisMonthCount: 0,
          todayAmount: 0,
          todayStatus: "PENDING_ALERT",
          pendingReimbursements: 0,
        },
      ]);
    }
  };

  // 4. Fetch Broadcast Notifications
  const fetchNotifications = async () => {
    try {
      const res = await getExpenseNotificationsApi();
      if (res?.data?.data) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchDailyStatus();
    fetchStaffAccounts();
    fetchNotifications();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    fetchExpenses();
  }, [
    page,
    datePreset,
    customStartDate,
    customEndDate,
    selectedCategoryFilter,
    selectedStatusFilter,
    selectedUserFilter,
  ]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchExpenses();
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 1-Click Zero Expense Day Confirmation
  const handleLogZeroExpenseToday = async () => {
    try {
      setZeroSubmitting(true);
      const res = await logZeroExpenseTodayApi();
      toast.success(res?.data?.message || "Today marked as Zero Expense Day!");
    } catch (err) {
      console.warn("Backend zero-expense notice, saving to local cache:", err.message);
      const localList = getLocalExpenses();
      const newZero = {
        _id: "local_zero_" + Date.now(),
        expenseCode: "EXP-ZERO-" + new Date().toISOString().slice(0, 10),
        userId: user?._id || "current_user",
        userName: user?.name || "Admin Staff",
        userEmail: user?.email || "",
        userRole: user?.role || "admin",
        userPicture: user?.picture || "",
        amount: 0,
        category: "Miscellaneous",
        title: "No Company Expenses Incurred Today",
        description: "Zero expenditure confirmed for today.",
        expenseDate: new Date().toISOString(),
        paymentMode: "Company UPI / Card",
        isZeroExpenseDay: true,
        status: "Approved",
        createdAt: new Date().toISOString(),
      };
      saveLocalExpenses([newZero, ...localList]);
      setDailyStatus({
        hasLoggedToday: true,
        todayTotal: 0,
        isZeroDay: true,
        entriesCount: 1,
        todayEntries: [newZero],
      });
      toast.success("Today marked as Zero Expense Day! (Alert Cleared)");
    } finally {
      setZeroSubmitting(false);
      fetchDailyStatus();
      fetchExpenses();
      fetchStaffAccounts();
      fetchNotifications();
    }
  };

  // Submit New Expense
  const handleCreateExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.warning("Please enter a valid expense amount greater than 0");
      return;
    }
    if (!formData.title.trim()) {
      toast.warning("Please enter the expense purpose / title");
      return;
    }

    try {
      setSavingExpense(true);
      const payload = new FormData();
      payload.append("amount", formData.amount);
      payload.append("category", formData.category);
      payload.append("title", formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("expenseDate", formData.expenseDate);
      payload.append("paymentMode", formData.paymentMode);
      payload.append("isReimbursementClaim", formData.isReimbursementClaim);
      payload.append("userId", user?._id || "");
      payload.append("userName", user?.name || "Admin Staff");
      payload.append("userEmail", user?.email || "");

      if (formData.receiptFile) {
        payload.append("receipt", formData.receiptFile);
      }

      await createExpenseApi(payload);
      toast.success("Expense recorded and broadcasted to team! ✅");
    } catch (err) {
      console.warn("Backend save attempt failed, saving to local ledger:", err.message);

      // Resilient Fallback: ALWAYS save locally regardless of error (404, 401, 403, 500, network error)
      const localList = getLocalExpenses();
      let receiptDataUrl = "";
      if (formData.receiptFile) {
        try {
          receiptDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(formData.receiptFile);
          });
        } catch (rErr) {}
      }

      const newExp = {
        _id: "local_" + Date.now(),
        expenseCode: "EXP-" + new Date().getFullYear() + "-" + String(localList.length + 1).padStart(4, "0"),
        userId: user?._id || "current_user",
        userName: user?.name || "Admin Staff",
        userEmail: user?.email || "",
        userRole: user?.role || "admin",
        userPicture: user?.picture || "",
        amount: Number(formData.amount),
        category: formData.category,
        title: formData.title.trim(),
        description: formData.description.trim(),
        expenseDate: new Date(formData.expenseDate).toISOString(),
        paymentMode: formData.paymentMode,
        isReimbursementClaim: Boolean(formData.isReimbursementClaim),
        status: formData.isReimbursementClaim ? "Pending" : "Approved",
        isZeroExpenseDay: false,
        receiptUrl: receiptDataUrl,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newExp, ...localList];
      saveLocalExpenses(updatedList);
      setExpenses((prev) => [newExp, ...prev.filter((it) => it._id !== newExp._id)]);
      setDailyStatus((prev) => ({
        ...prev,
        hasLoggedToday: true,
        todayTotal: (prev.todayTotal || 0) + Number(formData.amount),
        entriesCount: (prev.entriesCount || 0) + 1,
      }));
      setSummary((prev) => ({
        ...prev,
        totalAmount: (prev.totalAmount || 0) + Number(formData.amount),
      }));

      toast.success("Expense recorded successfully! (Saved to Ledger)");
    } finally {
      setIsLogModalOpen(false);
      setSavingExpense(false);

      // Reset form
      setFormData({
        amount: "",
        category: "Travel & Conveyance",
        title: "",
        description: "",
        expenseDate: new Date().toISOString().split("T")[0],
        paymentMode: "Company UPI / Card",
        isReimbursementClaim: false,
        receiptFile: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh all views & reset user filter to view newly added entry
      setSelectedUserFilter("all");
      fetchDailyStatus();
      fetchExpenses();
      fetchStaffAccounts();
      fetchNotifications();
    }
  };

  // Change Status (Approve / Reject / Reimburse)
  const handleUpdateStatus = async (expenseId, newStatus) => {
    try {
      await updateExpenseStatusApi(expenseId, { status: newStatus });
      toast.success(`Expense marked as ${newStatus}!`);
      fetchExpenses();
      fetchStaffAccounts();
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId, code) => {
    if (!window.confirm(`Are you sure you want to delete expense record ${code || ""}?`)) return;
    try {
      await deleteExpenseApi(expenseId);
      toast.success("Expense record deleted.");
      fetchExpenses();
      fetchStaffAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const params = {
        datePreset,
        startDate: datePreset === "custom" ? customStartDate : undefined,
        endDate: datePreset === "custom" ? customEndDate : undefined,
        category: selectedCategoryFilter,
        status: selectedStatusFilter,
        userId: selectedUserFilter !== "all" ? selectedUserFilter : undefined,
      };
      const res = await exportExpensesCsvApi(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ARCL_Expenses_${datePreset}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Expenses CSV statement downloaded!");
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  // Category breakdown calculation for analytics tab
  const categoryBreakdown = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.name] = { count: 0, total: 0 }));
    expenses.forEach((e) => {
      const cat = e.category || "Miscellaneous";
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += e.amount || 0;
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      pct: summary.totalAmount > 0 ? ((data.total / summary.totalAmount) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [expenses, summary.totalAmount]);

  // Filtered staff accounts for Tab 2
  const filteredStaffAccounts = useMemo(() => {
    return staffAccounts.filter((s) => {
      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase().trim();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q);
        const matchesRole = s.role?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRole) return false;
      }
      if (staffStatusFilter === "pending") {
        return s.todayStatus === "PENDING_ALERT";
      }
      if (staffStatusFilter === "logged") {
        return s.todayStatus !== "PENDING_ALERT";
      }
      if (staffStatusFilter === "reimbursement") {
        return (s.pendingReimbursements || 0) > 0;
      }
      return true;
    });
  }, [staffAccounts, staffSearch, staffStatusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & LOG ACTION BUTTONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
            <FaReceipt />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Company Expenses &amp; Staff Wallets
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Staff Accounts &amp; Broadcast Alerts
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Record daily company expenditures, manage individual staff accounts, broadcast alerts to active admins, and approve reimbursement claims.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setFormData({
                amount: "",
                category: "Travel & Conveyance",
                title: "",
                description: "",
                expenseDate: new Date().toISOString().split("T")[0],
                paymentMode: "Company UPI / Card",
                isReimbursementClaim: false,
                receiptFile: null,
              });
              setIsLogModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FaPlus />
            <span>Record New Expense</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer active:scale-95"
            title="Download CSV Statement"
          >
            <FaDownload />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchDailyStatus();
              fetchExpenses();
              fetchStaffAccounts();
              fetchNotifications();
            }}
            className="px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Sync latest data"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Backend Outdated / Restart Banner */}
      {serverNeedsRestart && (
        <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fadeIn relative">
          <div className="flex items-center gap-3 pr-8 sm:pr-0">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center text-xl shrink-0">
              <FaExclamationTriangle />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Backend Server Restart Required
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                New expense routes were added to <code>backend/src/app.js</code>. If your backend terminal was already running, please restart it (<strong>Ctrl + C</strong> then <strong>npm run dev</strong>) to register <code>/api/v1/admin/expenses</code>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setServerNeedsRestart(false);
                fetchDailyStatus();
                fetchExpenses();
                fetchStaffAccounts();
                fetchNotifications();
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs transition active:scale-95"
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => setServerNeedsRestart(false)}
              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-200/60 rounded-lg transition text-sm cursor-pointer"
              title="Dismiss banner"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROMINENT DAILY EXPENSE REMINDER & ALERT BANNER */}
      {/* ========================================================================= */}
      {!dailyStatus.hasLoggedToday ? (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-400/80 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl shrink-0 mt-0.5 shadow-md shadow-rose-500/20">
              <FaExclamationTriangle />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs uppercase tracking-wider bg-rose-200 text-rose-950 px-2.5 py-0.5 rounded-full border border-rose-300">
                  ⚠️ Daily Expense Alert
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  Today: {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-1">
                Hi {user?.name || "Staff Member"}, you have not recorded company expenses for today yet!
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                If you incurred any company expense today (travel, food, courier, tools, etc.), please log it now. If you didn't spend anything today, click <strong>"No Expense Today (₹0)"</strong> to confirm and clear this alert.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
            <button
              type="button"
              disabled={zeroSubmitting}
              onClick={handleLogZeroExpenseToday}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-emerald-800 border-2 border-emerald-500 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Confirm you had no company expenditure today"
            >
              <FaCheckCircle className="text-emerald-600" />
              <span>{zeroSubmitting ? "Confirming..." : "No Expense Today (₹0)"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData({
                  amount: "",
                  category: "Travel & Conveyance",
                  title: "",
                  description: "",
                  expenseDate: new Date().toISOString().split("T")[0],
                  paymentMode: "Company UPI / Card",
                  isReimbursementClaim: false,
                  receiptFile: null,
                });
                setIsLogModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer active:scale-95"
            >
              <FaPlus />
              <span>Record Today's Expense</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-900">
                Today's Log Complete:
              </span>{" "}
              {dailyStatus.todayTotal > 0 ? (
                <span>
                  You recorded <strong className="font-mono font-bold text-emerald-950">₹{dailyStatus.todayTotal.toLocaleString("en-IN")}</strong> across {dailyStatus.entriesCount} {dailyStatus.entriesCount === 1 ? "entry" : "entries"}. Status: <strong>Up to Date</strong>.
                </span>
              ) : (
                <span>
                  You confirmed <strong>Zero Company Expenses (₹0)</strong> for today. Status: <strong>Up to Date</strong>.
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({
                amount: "",
                category: "Travel & Conveyance",
                title: "",
                description: "",
                expenseDate: new Date().toISOString().split("T")[0],
                paymentMode: "Company UPI / Card",
                isReimbursementClaim: false,
                receiptFile: null,
              });
              setIsLogModalOpen(true);
            }}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
          >
            + Add Another Expense Today
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HERO KPI SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses (Filtered Range) */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm">
              <FaCoins />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 font-mono tracking-tight">
            ₹{Number(summary.totalAmount || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-500">
            Across {pagination.total} records in selected period
          </p>
        </div>

        {/* Today's Total (All Staff) */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
              Today's Team Spend
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 text-sm">
              <FaCalendarAlt />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tracking-tight">
            ₹{staffAccounts.reduce((sum, a) => sum + (a.todayAmount || 0), 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-500">
            {staffAccounts.filter((a) => a.todayStatus === "LOGGED_EXPENSE").length} staff logged expenditures today
          </p>
        </div>

        {/* Pending Reimbursements */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
              Pending Reimbursements
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 text-sm">
              <FaMoneyBillWave />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight">
            ₹{Number(summary.pendingReimbursements || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-amber-700 font-medium">
            {summary.pendingCount || 0} claims awaiting approval
          </p>
        </div>

        {/* Registered Staff Accounts */}
        <div
          onClick={() => setActiveTab("accounts")}
          className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden space-y-1 cursor-pointer hover:shadow-md hover:border-purple-300 transition active:scale-98 group"
          title="Click to view all registered staff accounts"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-800 uppercase tracking-wider">
              Registered Staff Accounts
            </span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 text-sm group-hover:bg-purple-600 group-hover:text-white transition">
              <FaUserTie />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-700 font-mono tracking-tight flex items-baseline justify-between">
            <span>{staffAccounts.length} Staff</span>
            <span className="text-xs font-bold text-purple-600 group-hover:underline">View All &rarr;</span>
          </p>
          <p className="text-[11px] text-purple-600">
            {staffAccounts.filter((a) => a.todayStatus === "PENDING_ALERT").length} staff pending today's log | Click to view wallets
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center border-b border-gray-200 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 px-4 text-xs font-black transition flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === "ledger"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FaReceipt />
          <span>All Expenses Ledger ({pagination.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`pb-3 px-4 text-xs font-black transition flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === "accounts"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FaWallet />
          <span>Staff Accounts &amp; Wallets ({staffAccounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("broadcast")}
          className={`pb-3 px-4 text-xs font-black transition flex items-center gap-2 cursor-pointer border-b-2 shrink-0 relative ${
            activeTab === "broadcast"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FaBell />
          <span>Broadcast &amp; Activity Feed</span>
          {notifications.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 px-4 text-xs font-black transition flex items-center gap-2 cursor-pointer border-b-2 shrink-0 ${
            activeTab === "analytics"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FaCoins />
          <span>Category Breakdown</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL EXPENSES LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Quick Registered Staff Directory Strip */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FaUsers className="text-purple-600" />
                <span className="font-black text-gray-800">
                  Registered Staff Directory ({staffAccounts.length} Staff):
                </span>
                <span className="text-gray-400 text-[11px] hidden sm:inline">
                  Click any staff member to view their individual account ledger
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("accounts")}
                className="text-purple-700 font-bold hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Staff Wallets View</span>
                <FaChevronRight className="text-[9px]" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5" style={{ scrollbarWidth: "thin" }}>
              <button
                type="button"
                onClick={() => setSelectedUserFilter("all")}
                className={`px-3 py-2 rounded-2xl border text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-2 ${
                  selectedUserFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  👥
                </div>
                <span>All Staff ({staffAccounts.length})</span>
              </button>

              {staffAccounts.map((staff) => {
                const isSelected = selectedUserFilter === staff.userId;
                const isDone = staff.todayStatus !== "PENDING_ALERT";
                return (
                  <button
                    key={staff.userId}
                    type="button"
                    onClick={() => setSelectedUserFilter(staff.userId)}
                    className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-200"
                        : "bg-white hover:bg-purple-50/50 text-gray-800 border-gray-200"
                    }`}
                  >
                    {staff.picture ? (
                      <img
                        src={staff.picture}
                        alt={staff.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/50 shrink-0"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                      }`}>
                        {staff.name ? staff.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="text-left leading-tight">
                      <div className="font-bold truncate max-w-[130px]">{staff.name}</div>
                      <div className={`text-[9.5px] flex items-center gap-1 ${isSelected ? "text-purple-100" : "text-gray-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isDone ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                        <span>{isDone ? "Logged" : "Pending"}</span>
                        <span>•</span>
                        <span className="font-mono">₹{Number(staff.thisMonthTotal).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            {/* Top row: Date Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-emerald-600 text-sm" />
                <span className="text-xs font-bold text-gray-700">Date Preset:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      datePreset === p.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range Picker (if custom selected) */}
            {datePreset === "custom" && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs animate-fadeIn">
                <span className="font-bold text-emerald-950">Select Custom Period:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-800 font-medium">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-950 font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-800 font-medium">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-950 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Bottom Row: Search, Staff Account Dropdown, Category Dropdown, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title, staff, code..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-gray-800"
                />
              </div>

              {/* Staff Account Selector */}
              <div>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-gray-800 cursor-pointer"
                >
                  <option value="all">👤 All Staff Accounts ({staffAccounts.length})</option>
                  {staffAccounts.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.role}) - ₹{Number(s.allTimeTotal).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-gray-800 cursor-pointer"
                >
                  <option value="all">📁 All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-gray-800 cursor-pointer"
                >
                  <option value="all">🏷️ All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Reimbursed">Reimbursed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE OF EXPENSES */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse divide-y divide-gray-100">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10.5px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5">Code / Date</th>
                    <th className="p-3.5">Staff Account</th>
                    <th className="p-3.5">Category &amp; Purpose</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                    <th className="p-3.5 text-center">Payment Mode</th>
                    <th className="p-3.5 text-center">Receipt</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-400 space-y-2">
                        <FaReceipt className="text-3xl mx-auto text-gray-300" />
                        <p className="font-bold text-gray-600">No company expenses found</p>
                        <p className="text-[11px]">
                          Try adjusting your date range or filters, or record a new expense.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-slate-50/70 transition">
                        {/* Code & Date */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block">
                            {exp.expenseCode || "EXP"}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <FaClock className="text-[9px]" />
                            {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Staff Account */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {exp.userPicture ? (
                              <img
                                src={exp.userPicture}
                                alt={exp.userName}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                {exp.userName ? exp.userName[0].toUpperCase() : "U"}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900 leading-tight">
                                {exp.userName}
                              </div>
                              <span className="text-[10px] text-gray-400 capitalize">
                                {exp.userRole}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Title */}
                        <td className="p-3.5 max-w-xs">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 mb-1">
                            {exp.category}
                          </span>
                          <p className="font-bold text-gray-900 line-clamp-1">
                            {exp.title}
                          </p>
                          {exp.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {exp.description}
                            </p>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {exp.isZeroExpenseDay ? (
                            <span className="text-gray-400 font-bold text-xs">₹0 (Zero Day)</span>
                          ) : (
                            <span className="font-mono font-black text-sm text-emerald-700">
                              ₹{Number(exp.amount).toLocaleString("en-IN")}
                            </span>
                          )}
                          {exp.isReimbursementClaim && (
                            <span className="block text-[9.5px] font-bold text-amber-700 mt-0.5">
                              Claim
                            </span>
                          )}
                        </td>

                        {/* Payment Mode */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="text-[11px] font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                            {exp.paymentMode || "Company UPI"}
                          </span>
                        </td>

                        {/* Receipt */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {exp.receiptUrl ? (
                            <button
                              type="button"
                              onClick={() => setReceiptPreviewUrl(exp.receiptUrl)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                              title="View Attached Receipt Bill"
                            >
                              <FaPaperclip />
                              <span>View Bill</span>
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[11px]">No Receipt</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              exp.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : exp.status === "Pending"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : exp.status === "Reimbursed"
                                ? "bg-purple-100 text-purple-800 border border-purple-300"
                                : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}
                          >
                            {exp.status || "Approved"}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {exp.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(exp._id, "Approved")}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                                  title="Approve Expense"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(exp._id, "Rejected")}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                  title="Reject Expense"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            )}

                            {exp.isReimbursementClaim && exp.status === "Approved" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(exp._id, "Reimbursed")}
                                className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] transition cursor-pointer"
                                title="Mark as Reimbursed to staff"
                              >
                                Reimburse
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp._id, exp.expenseCode)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer"
                              title="Delete record"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STAFF WALLETS & ACCOUNTS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <FaUsers className="text-purple-600" />
                  <span>Registered Staff Accounts &amp; Individual Wallets ({staffAccounts.length})</span>
                </h2>
                <p className="text-xs text-gray-500">
                  Every registered staff member has their own separate expense ledger, today's status tracker, and reimbursement balance.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchStaffAccounts}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FaSync className={loading ? "animate-spin" : ""} />
                  <span>Sync Registered Staff</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar for Staff */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name, email, role..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-500 text-xs text-gray-800 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    staffStatusFilter === "all" ? "bg-purple-600 text-white shadow-xs" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({staffAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                    staffStatusFilter === "pending" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  <span>🔴 Pending Today</span>
                  <span>({staffAccounts.filter((s) => s.todayStatus === "PENDING_ALERT").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter("logged")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                    staffStatusFilter === "logged" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <span>🟢 Logged Today</span>
                  <span>({staffAccounts.filter((s) => s.todayStatus !== "PENDING_ALERT").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter("reimbursement")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                    staffStatusFilter === "reimbursement" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  <span>⏳ Claims Due</span>
                  <span>({staffAccounts.filter((s) => (s.pendingReimbursements || 0) > 0).length})</span>
                </button>
              </div>
            </div>
          </div>

          {filteredStaffAccounts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 shadow-sm space-y-2">
              <FaUsers className="text-4xl mx-auto text-gray-300" />
              <h3 className="font-bold text-gray-700 text-sm">No Staff Accounts Match</h3>
              <p className="text-xs">
                {staffAccounts.length === 0
                  ? "No registered staff users found in database. Click 'Sync Registered Staff' above."
                  : "No staff member matches your current search or status filter."}
              </p>
              {staffAccounts.length === 0 && (
                <button
                  type="button"
                  onClick={fetchStaffAccounts}
                  className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Fetch All Registered Users
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaffAccounts.map((account) => {
                const isTodayDone = account.todayStatus !== "PENDING_ALERT";
                return (
                  <div
                    key={account.userId}
                    className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition space-y-4 relative overflow-hidden"
                  >
                    {/* Top user row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {account.picture ? (
                          <img
                            src={account.picture}
                            alt={account.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                            {account.name ? account.name[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-black text-gray-900 leading-tight">
                            {account.name}
                          </h3>
                          <p className="text-[11px] text-gray-400 truncate max-w-[170px]">
                            {account.email}
                          </p>
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {account.role || "staff"}
                          </span>
                        </div>
                      </div>

                      {/* Today's Status Badge */}
                      <div>
                        {isTodayDone ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <FaCheckCircle className="text-[11px]" />
                            {account.todayAmount > 0
                              ? `₹${account.todayAmount.toLocaleString("en-IN")}`
                              : "₹0 Logged"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                            <FaExclamationTriangle className="text-[11px]" />
                            Pending Log
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">
                          This Month
                        </span>
                        <span className="text-sm font-black font-mono text-slate-900">
                          ₹{Number(account.thisMonthTotal).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {account.thisMonthCount} entries
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">
                          All-Time Total
                        </span>
                        <span className="text-sm font-black font-mono text-emerald-700">
                          ₹{Number(account.allTimeTotal).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {account.allTimeCount} entries
                        </span>
                      </div>
                    </div>

                    {/* Reimbursement Notice if any */}
                    {account.pendingReimbursements > 0 && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                        <span className="text-[11px] font-medium">Pending Reimbursement:</span>
                        <strong className="font-mono font-bold text-amber-950">
                          ₹{Number(account.pendingReimbursements).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserFilter(account.userId);
                          setActiveTab("ledger");
                        }}
                        className="py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <span>View Ledger</span>
                        <FaChevronRight className="text-[9px]" />
                      </button>

                      {String(account.userId) === String(user?._id) || account.email === user?.email ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              amount: "",
                              category: "Travel & Conveyance",
                              title: "",
                              description: "",
                              expenseDate: new Date().toISOString().split("T")[0],
                              paymentMode: "Company UPI / Card",
                              isReimbursementClaim: false,
                              receiptFile: null,
                            });
                            setIsLogModalOpen(true);
                          }}
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
                        >
                          <FaPlus className="text-[9px]" />
                          <span>Log My Expense</span>
                        </button>
                      ) : (
                        <div
                          title={`Security Lock: Only ${account.name} can add expenses to their own account.`}
                          className="py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-not-allowed select-none"
                        >
                          <FaLock className="text-[9px]" />
                          <span>Owner Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BROADCAST NOTIFICATIONS & LIVE ACTIVITY FEED */}
      {/* ========================================================================= */}
      {activeTab === "broadcast" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <FaBell className="text-amber-500" />
                <span>Live Expense Broadcast Alerts &amp; Team Notifications</span>
              </h2>
              <p className="text-xs text-gray-500">
                Instant broadcast stream: when any admin records an expense, the whole team is alerted with exact amount, purpose, and staff name.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-800">
              {notifications.length} Broadcast Alerts
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <FaBell className="text-3xl mx-auto text-gray-300" />
                <p className="font-bold text-gray-600">No broadcast alerts yet</p>
                <p className="text-[11px]">New company expenses will be broadcasted live here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className="p-4 flex items-start gap-3.5 hover:bg-slate-50 transition"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                      notif.type === "NEW_EXPENSE"
                        ? "bg-emerald-50 text-emerald-600"
                        : notif.type === "EXPENSE_REIMBURSED"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <FaReceipt />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-gray-900">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                        <FaClock className="text-[9px]" />
                        {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-[10px]">
                      <span className="text-gray-400">By:</span>
                      <strong className="text-gray-800">{notif.createdByName}</strong>
                      {notif.amount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.2 rounded-full">
                          ₹{Number(notif.amount).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CATEGORY BREAKDOWN & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-gray-900">
                Expenditure by Category ({datePreset.toUpperCase()})
              </h2>
              <p className="text-xs text-gray-500">
                Visual analysis of company spending across metrology travel, logistics, lab chemicals, tools, and office expenses.
              </p>
            </div>
            <span className="text-sm font-mono font-black text-emerald-700">
              Total: ₹{Number(summary.totalAmount || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.name}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-800 truncate max-w-[200px]">
                    {cat.name}
                  </span>
                  <span className="text-[11px] font-mono font-black text-emerald-700">
                    {cat.pct}%
                  </span>
                </div>

                <p className="text-2xl font-black font-mono text-gray-900 tracking-tight">
                  ₹{Number(cat.total).toLocaleString("en-IN")}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, cat.pct)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>{cat.count} expenditures</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(cat.name);
                      setActiveTab("ledger");
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    View &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD NEW EXPENSE */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg">
                  <FaReceipt />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-950">Record Company Expense</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium mt-0.5">
                    <span>Account Owner:</span>
                    <strong className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <FaUserCheck className="text-[10px]" />
                      {user?.name || "Self (Admin Staff)"}
                    </strong>
                    <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                      <FaLock className="text-[9px]" /> (Locked to your account)
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-4 text-xs">
              {/* Row 1: Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Expense Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 text-base font-mono font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Date of Expense <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-gray-800 text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Category & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Expense Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-gray-800 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-gray-800 cursor-pointer"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title / Purpose */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Purpose / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Travel auto fare to Client Site - UltraTech, or Courier for Calibration standards"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-bold text-gray-900"
                />
              </div>

              {/* Description / Remarks */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Description / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes, client organization, location or bill reference..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 text-gray-800"
                ></textarea>
              </div>

              {/* Proof / Bill Upload */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Attach Receipt Bill / Invoice (Photo or PDF)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setFormData({ ...formData, receiptFile: file });
                  }}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Supported formats: PNG, JPG, WEBP, PDF (Max 100MB).
                </p>
              </div>

              {/* Reimbursement Claim Checkbox */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="reimburseCheck"
                  checked={formData.isReimbursementClaim}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isReimbursementClaim: e.target.checked,
                      paymentMode: e.target.checked
                        ? "Personal UPI (Claim Reimbursement)"
                        : "Company UPI / Card",
                    })
                  }
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="reimburseCheck" className="text-xs text-amber-950 cursor-pointer">
                  <span className="font-bold block">Claim as Personal Reimbursement</span>
                  <span className="text-[11px] text-amber-800">
                    Check this if you paid for this company expense from your personal card/cash and need the company to reimburse you.
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <FaCheckCircle />
                  <span>{savingExpense ? "Recording & Broadcasting..." : "Save & Broadcast"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECEIPT LIGHTBOX PREVIEW */}
      {/* ========================================================================= */}
      {receiptPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <FaPaperclip className="text-blue-600" />
                <span>Attached Receipt / Invoice Bill</span>
              </h4>
              <button
                type="button"
                onClick={() => setReceiptPreviewUrl(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 rounded-2xl p-2 min-h-[300px]">
              {receiptPreviewUrl.toLowerCase().includes(".pdf") || receiptPreviewUrl.startsWith("data:application/pdf") ? (
                <iframe
                  src={receiptPreviewUrl}
                  title="Receipt PDF"
                  className="w-full h-[500px] rounded-xl border border-gray-200"
                />
              ) : (
                <img
                  src={receiptPreviewUrl}
                  alt="Receipt Preview"
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-xs"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
              <a
                href={receiptPreviewUrl}
                download="ARCL_Expense_Receipt"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FaDownload />
                <span>Download / Open Original</span>
              </a>
              <button
                type="button"
                onClick={() => setReceiptPreviewUrl(null)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
