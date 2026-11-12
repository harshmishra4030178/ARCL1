"use client";

import { useEffect, useState, useMemo } from "react";
import { Link } from "../../utils/navigation.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";
import {
  getAdminUsersApi,
  updateUserRoleApi,
  toggleUserStatusApi,
  deleteUserApi,
  grantUserAccessApi,
  updateUserPermissionsApi,
} from "../../api/userApi.js";
import {
  FaUsers,
  FaUserShield,
  FaUser,
  FaSearch,
  FaTrash,
  FaCheckCircle,
  FaGoogle,
  FaShieldAlt,
  FaUserPlus,
  FaEnvelope,
  FaPaperPlane,
  FaSlidersH,
  FaCheck,
  FaTimes,
  FaBox,
  FaLayerGroup,
  FaBookOpen,
  FaLock,
  FaCrown,
  FaCertificate,
  FaPen,
  FaReceipt,
  FaCode,
  FaTerminal,
  FaBug,
} from "react-icons/fa";
import { toast } from "react-toastify";
import StatCard from "../../components/admin/common/StatCard.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import Toggle from "../../components/admin/common/Toggle.jsx";

const formatWhatsAppLastSeen = (dateStr) => {
  if (!dateStr) return "Never logged in";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Offline";

  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If active in last 60 seconds (or slight clock tolerance)
  if (diffInSec >= -30 && diffInSec < 60) return "Just now";

  // Check if today in local timezone
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin >= 1 && diffInMin < 15) {
      return `${diffInMin}m ago (${timeString})`;
    }
    return `Today at ${timeString}`;
  }

  if (isYesterday) {
    return `Yesterday at ${timeString}`;
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  const dateString = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(isThisYear ? {} : { year: "numeric" }),
  });

  return `${dateString} at ${timeString}`;
};

const TOTAL_PERMS_COUNT = 47;

const DEFAULT_FULL_PERMISSIONS = {
  products: { create: true, edit: true, delete: true }, // 3
  calibration: {
    dashboard: true,
    quotations: true,
    srf_history: true,
    reminders: true,
    observations: true,
    authorization: true,
    templates: true,
    lab_profile: true,
    payments: true,
    financials: true,
    edit: true,
    delete: true,
    // backward-compatibility aliases
    create: true,
    documents: true,
    dispatch: true,
  }, // 12
  categories: { create: true, edit: true, delete: true }, // 3
  equipmentTypes: { create: true, delete: true }, // 2
  blogs: { create: true, edit: true, delete: true }, // 3
  inquiries: { view: true, edit: true, delete: true }, // 3
  contacts: { view: true, delete: true }, // 2
  subscribers: { view: true, edit: true, delete: true }, // 3
  users: { manage: true, delete: true }, // 2
  expenses: { view: true, create: true, edit: true, delete: true, approve: true }, // 5
  salary: { view: true, create: true, edit: true, delete: true, process: true }, // 5
  developer: { error_logs: true, api_health: true, system_config: true, audit_logs: true }, // 4
};

const PRESETS = {
  superadmin: {
    name: "Super Administrator (All Access 47/47)",
    icon: <FaCrown className="text-amber-500" />,
    role: "superadmin",
    permissions: DEFAULT_FULL_PERMISSIONS,
  },
  developer_lead: {
    name: "Lead Developer & System Architect (System Diagnostics, Error Logs & APIs 47/47)",
    icon: <FaCode className="text-cyan-500" />,
    role: "developer",
    permissions: DEFAULT_FULL_PERMISSIONS,
  },
  finance_lead: {
    name: "Finance & Expenses Lead (Company Expenses, Claims & Lab Payments)",
    icon: <FaReceipt className="text-emerald-500" />,
    role: "admin",
    permissions: {
      products: { create: false, edit: false, delete: false },
      calibration: {
        dashboard: true,
        quotations: true,
        srf_history: false,
        reminders: false,
        observations: false,
        authorization: false,
        templates: false,
        lab_profile: false,
        payments: true,
        financials: true,
        edit: false,
        delete: false,
        create: false,
        documents: true,
        dispatch: false,
      },
      categories: { create: false, edit: false, delete: false },
      equipmentTypes: { create: false, delete: false },
      blogs: { create: false, edit: false, delete: false },
      inquiries: { view: false, edit: false, delete: false },
      contacts: { view: false, delete: false },
      subscribers: { view: false, edit: false, delete: false },
      users: { manage: false, delete: false },
      expenses: { view: true, create: true, edit: true, delete: true, approve: true },
      salary: { view: true, create: true, edit: true, delete: true, process: true },
    },
  },
  calibration_lead: {
    name: "Calibration & Metrology Lead (All 10 Sections & Full NABL Lab Access)",
    icon: <FaCertificate className="text-indigo-500" />,
    role: "admin",
    permissions: {
      products: { create: false, edit: false, delete: false },
      calibration: {
        dashboard: true,
        quotations: true,
        srf_history: true,
        reminders: true,
        observations: true,
        authorization: true,
        templates: true,
        lab_profile: true,
        payments: true,
        financials: true,
        edit: true,
        delete: true,
        create: true,
        documents: true,
        dispatch: true,
      },
      categories: { create: false, edit: false, delete: false },
      equipmentTypes: { create: false, delete: false },
      blogs: { create: false, edit: false, delete: false },
      inquiries: { view: true, edit: false, delete: false },
      contacts: { view: false, delete: false },
      subscribers: { view: false, edit: false, delete: false },
      users: { manage: false, delete: false },
      expenses: { view: true, create: true, edit: false, delete: false, approve: false },
    },
  },
  product_manager: {
    name: "Product & Catalog Manager (Products, Categories & Types)",
    icon: <FaBox className="text-blue-500" />,
    role: "admin",
    permissions: {
      products: { create: true, edit: true, delete: false },
      calibration: {
        dashboard: false,
        quotations: false,
        srf_history: false,
        reminders: false,
        observations: false,
        authorization: false,
        templates: false,
        lab_profile: false,
        payments: false,
        financials: false,
        edit: false,
        delete: false,
        create: false,
        documents: false,
        dispatch: false,
      },
      categories: { create: true, edit: true, delete: false },
      equipmentTypes: { create: true, delete: false },
      blogs: { create: false, edit: false, delete: false },
      inquiries: { view: true, edit: false, delete: false },
      contacts: { view: false, delete: false },
      subscribers: { view: false, edit: false, delete: false },
      users: { manage: false, delete: false },
      expenses: { view: true, create: true, edit: false, delete: false, approve: false },
    },
  },
  content_editor: {
    name: "Blog Content Writer (Create & Edit Guides)",
    icon: <FaBookOpen className="text-emerald-500" />,
    role: "admin",
    permissions: {
      products: { create: false, edit: false, delete: false },
      calibration: {
        dashboard: false,
        quotations: false,
        srf_history: false,
        reminders: false,
        observations: false,
        authorization: false,
        templates: false,
        lab_profile: false,
        payments: false,
        financials: false,
        edit: false,
        delete: false,
        create: false,
        documents: false,
        dispatch: false,
      },
      categories: { create: false, edit: false, delete: false },
      equipmentTypes: { create: false, delete: false },
      blogs: { create: true, edit: true, delete: false },
      inquiries: { view: false, edit: false, delete: false },
      contacts: { view: false, delete: false },
      subscribers: { view: false, edit: false, delete: false },
      users: { manage: false, delete: false },
      expenses: { view: true, create: true, edit: false, delete: false, approve: false },
    },
  },
  support_lead: {
    name: "Customer Support (Inquiries, Contacts & Subscribers)",
    icon: <FaEnvelope className="text-purple-500" />,
    role: "admin",
    permissions: {
      products: { create: false, edit: false, delete: false },
      calibration: {
        dashboard: false,
        quotations: false,
        srf_history: false,
        reminders: false,
        observations: false,
        authorization: false,
        templates: false,
        lab_profile: false,
        payments: false,
        financials: false,
        edit: false,
        delete: false,
        create: false,
        documents: false,
        dispatch: false,
      },
      categories: { create: false, edit: false, delete: false },
      equipmentTypes: { create: false, delete: false },
      blogs: { create: false, edit: false, delete: false },
      inquiries: { view: true, edit: true, delete: true },
      contacts: { view: true, delete: true },
      subscribers: { view: true, edit: true, delete: true },
      users: { manage: false, delete: false },
      expenses: { view: true, create: true, edit: false, delete: false, approve: false },
    },
  },
};

const SUPER_ADMIN_EMAILS_LIST = [
  "abhinav@arclinstruments.com",
  "abhinavtripathi32@gmail.com",
];

const isSuperAdmin = (u) => {
  if (!u) return false;
  if (u.role === "superadmin") return true;
  if (SUPER_ADMIN_EMAILS_LIST.includes(u.email?.toLowerCase())) return true;
  return false;
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    admins: 0,
    users: 0,
    active: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Direct Access Grant by Email State
  const [grantEmail, setGrantEmail] = useState("");
  const [grantName, setGrantName] = useState("");
  const [grantRole, setGrantRole] = useState("admin");
  const [grantPreset, setGrantPreset] = useState("superadmin");
  const [grantPermissions, setGrantPermissions] = useState(DEFAULT_FULL_PERMISSIONS);
  const [showGrantCustom, setShowGrantCustom] = useState(false);
  const [granting, setGranting] = useState(false);

  // Current Admin User & Access Check
  const { user: currentAdminUser } = useAuthStore();

  const canManageUsers = useMemo(() => {
    if (!currentAdminUser) return false;
    if (
      currentAdminUser.role === "superadmin" ||
      currentAdminUser.role === "admin" ||
      isSuperAdmin(currentAdminUser) ||
      currentAdminUser.permissions?.users?.manage === true
    ) {
      return true;
    }
    return false;
  }, [currentAdminUser]);

  // Permission Modal State for Existing Users
  const [editingPermissionsUser, setEditingPermissionsUser] = useState(null);
  const [modalPermissions, setModalPermissions] = useState(DEFAULT_FULL_PERMISSIONS);
  const [modalRole, setModalRole] = useState("admin");
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers(false);

      // Real-time live polling: updates presence like WhatsApp every 10 seconds
      const pollInterval = setInterval(() => {
        fetchUsers(true);
      }, 10000);

      return () => clearInterval(pollInterval);
    }
  }, [canManageUsers]);

  const fetchUsers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError("");
      const res = await getAdminUsersApi();
      const data = res.data?.data || res.data;
      setUsers(data.users || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      if (!isBackground) setError("Failed to fetch registered users list.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term);

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "developer" && u.role === "developer") ||
        (roleFilter === "admin" &&
          (u.role === "admin" || u.role === "superadmin")) ||
        (roleFilter === "user" && u.role === "user");

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive) ||
        (statusFilter === "inactive" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Handle Preset Change in Grant Box
  const handlePresetSelect = (presetKey) => {
    setGrantPreset(presetKey);
    setShowGrantCustom(false);
    const p = PRESETS[presetKey];
    if (p) {
      setGrantRole(p.role);
      setGrantPermissions(JSON.parse(JSON.stringify(p.permissions)));
    }
  };

  // Toggle Single Permission in Grant State
  const toggleGrantPerm = (module, action) => {
    setGrantPermissions((prev) => {
      const currentModule = prev[module] || {};
      const nextVal = !currentModule[action];
      const updatedModule = {
        ...currentModule,
        [action]: nextVal,
      };
      if (module === "calibration") {
        if (action === "srf_history") updatedModule.create = nextVal;
        if (action === "quotations") updatedModule.documents = nextVal;
        if (action === "reminders") updatedModule.dispatch = nextVal;
      }
      return {
        ...prev,
        [module]: updatedModule,
      };
    });
  };

  // Toggle Single Permission in Modal State
  const toggleModalPerm = (module, action) => {
    setModalPermissions((prev) => {
      const currentModule = prev[module] || {};
      const nextVal = !currentModule[action];
      const updatedModule = {
        ...currentModule,
        [action]: nextVal,
      };
      if (module === "calibration") {
        if (action === "srf_history") updatedModule.create = nextVal;
        if (action === "quotations") updatedModule.documents = nextVal;
        if (action === "reminders") updatedModule.dispatch = nextVal;
      }
      return {
        ...prev,
        [module]: updatedModule,
      };
    });
  };

  // Open Permissions Modal for Existing User
  const handleOpenPermissionsModal = (user) => {
    try {
      setEditingPermissionsUser(user);
      setModalRole(user.role === "user" ? "admin" : (user.role || "admin"));
      let userPerms = user.permissions;
      if (typeof userPerms === "string") {
        try {
          userPerms = JSON.parse(userPerms);
        } catch (e) {
          userPerms = null;
        }
      }
      if (!userPerms || typeof userPerms !== "object") {
        userPerms = DEFAULT_FULL_PERMISSIONS;
      }
      const cal = userPerms.calibration || {};
      setModalPermissions({
        products: { create: true, edit: true, delete: true, ...(userPerms.products || {}) },
        calibration: {
          dashboard: cal.dashboard ?? true,
          quotations: cal.quotations ?? (cal.documents ?? true),
          srf_history: cal.srf_history ?? (cal.create ?? true),
          reminders: cal.reminders ?? (cal.dispatch ?? true),
          observations: cal.observations ?? true,
          authorization: cal.authorization ?? true,
          templates: cal.templates ?? true,
          lab_profile: cal.lab_profile ?? true,
          payments: cal.payments ?? true,
          financials: cal.financials ?? true,
          edit: cal.edit ?? true,
          delete: cal.delete ?? true,
          create: cal.create ?? cal.srf_history ?? true,
          documents: cal.documents ?? cal.quotations ?? true,
          dispatch: cal.dispatch ?? cal.reminders ?? true,
        },
        categories: { create: true, edit: true, delete: true, ...(userPerms.categories || {}) },
        equipmentTypes: { create: true, delete: true, ...(userPerms.equipmentTypes || {}) },
        blogs: { create: true, edit: true, delete: true, ...(userPerms.blogs || {}) },
        inquiries: { view: true, edit: true, delete: true, ...(userPerms.inquiries || {}) },
        contacts: { view: true, delete: true, ...(userPerms.contacts || {}) },
        subscribers: { view: true, edit: true, delete: true, ...(userPerms.subscribers || {}) },
        users: { manage: true, delete: true, ...(userPerms.users || {}) },
        expenses: {
          view: true,
          create: true,
          edit: true,
          delete: true,
          approve: true,
          ...(userPerms.expenses || {}),
        },
        developer: {
          error_logs: true,
          api_health: true,
          system_config: true,
          audit_logs: true,
          ...(userPerms.developer || {}),
        },
      });
    } catch (err) {
      console.error("Error opening permissions modal:", err);
      setModalPermissions(DEFAULT_FULL_PERMISSIONS);
    }
  };

  // Save Permissions Modal
  const handleSaveModalPermissions = async () => {
    if (!editingPermissionsUser) return;
    try {
      setSavingPermissions(true);
      const res = await updateUserPermissionsApi(editingPermissionsUser._id, {
        permissions: modalPermissions,
        role: modalRole,
      });

      toast.success(res.data?.message || "User permissions saved successfully! 🎉");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editingPermissionsUser._id
            ? { ...u, role: modalRole, permissions: modalPermissions }
            : u
        )
      );
      setEditingPermissionsUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update permissions:", err);
      toast.error(err.response?.data?.message || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Handle Role Change from Table Dropdown
  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      const res = await updateUserRoleApi(userId, newRole);
      toast.success(res.data?.message || "User role updated successfully! 🎉");

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error(err.response?.data?.message || "Failed to update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (userId) => {
    try {
      setUpdatingId(userId);
      const res = await toggleUserStatusApi(userId);
      toast.success(res.data?.message || "Status updated successfully.");

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      toast.error(err.response?.data?.message || "Failed to toggle status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Delete
  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to permanently delete this user?"))
      return;

    try {
      setDeletingId(userId);
      await deleteUserApi(userId);
      toast.success("User deleted successfully.");
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Grant Access by Email
  const handleGrantAccess = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!grantEmail || !grantEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setGranting(true);
      const res = await grantUserAccessApi({
        email: grantEmail.trim(),
        name: grantName.trim() || undefined,
        role: grantRole,
        permissions: grantPermissions,
      });

      toast.success(
        res.data?.message || `Access granted to ${grantEmail.trim()}! 🎉`
      );

      // Reset form
      setGrantEmail("");
      setGrantName("");
      setGrantRole("admin");
      setGrantPreset("superadmin");
      setGrantPermissions(DEFAULT_FULL_PERMISSIONS);
      setShowGrantCustom(false);

      // Refresh list & metrics
      await fetchUsers();
    } catch (err) {
      console.error("Grant access error:", err);
      toast.error(
        err.response?.data?.message || "Failed to grant access. Please try again."
      );
    } finally {
      setGranting(false);
    }
  };

  // Count enabled permissions for badge (Total: 32)
  const getEnabledCount = (permissions) => {
    if (!permissions) return TOTAL_PERMS_COUNT;
    let count = 0;
    const modules = [
      ["products", ["create", "edit", "delete"]], // 3
      [
        "calibration",
        [
          "dashboard",
          "quotations",
          "srf_history",
          "reminders",
          "observations",
          "authorization",
          "templates",
          "lab_profile",
          "payments",
          "financials",
          "edit",
          "delete",
        ],
      ], // 12
      ["categories", ["create", "edit", "delete"]], // 3
      ["equipmentTypes", ["create", "delete"]], // 2
      ["blogs", ["create", "edit", "delete"]], // 3
      ["inquiries", ["view", "edit", "delete"]], // 3
      ["contacts", ["view", "delete"]], // 2
      ["subscribers", ["view", "edit", "delete"]], // 3
      ["users", ["manage", "delete"]], // 2
      ["expenses", ["view", "create", "edit", "delete", "approve"]], // 5
      ["salary", ["view", "create", "edit", "delete", "process"]], // 5
      ["developer", ["error_logs", "api_health", "system_config", "audit_logs"]], // 4
    ];

    modules.forEach(([mod, actions]) => {
      actions.forEach((act) => {
        if (permissions[mod]) {
          if (permissions[mod][act] === true) {
            count++;
          } else if (mod === "calibration") {
            // backward compatibility checks for legacy saved user perms
            if (act === "srf_history" && permissions[mod].create === true) count++;
            else if (act === "quotations" && permissions[mod].documents === true) count++;
            else if (act === "reminders" && permissions[mod].dispatch === true) count++;
          }
        }
      });
    });

    return Math.min(count, TOTAL_PERMS_COUNT);
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner border border-amber-200">
            <FaLock />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
              Access Restricted: Users &amp; Roles
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              You do not have permission to access the User &amp; Role Management section. Only Super Administrators or accounts granted full User Management privileges can access and modify team permissions.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
            >
              <span>Return to Admin Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2.5">
            <FaUserShield className="text-[#021C57]" /> Users & Role Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage Google accounts, pre-authorize team members, and define granular module permissions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-2 rounded-2xl text-xs font-bold border border-blue-200 shadow-2xs self-start sm:self-auto">
          <FaShieldAlt className="text-blue-600" /> Granular RBAC Permissions Active
        </div>
      </div>

      {/* 1. DIRECT EMAIL ACCESS GRANT BOX WITH PERMISSION CONTROLS */}
      <div className="bg-gradient-to-br from-slate-900 via-[#021C57] to-slate-950 p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl text-white shadow-lg border border-blue-900/50 space-y-4 sm:space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-blue-800/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-amber-400/30">
              <FaUserPlus className="text-amber-400" /> Direct Email Access &amp; Permission Grant
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2">
              <span>Pre-Authorize or Promote User by Email</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200 mt-0.5 sm:mt-1">
              Grant specific permissions (e.g. Product addition, blog editing, delete access, inquiry viewing) directly to any email.
            </p>
          </div>

          <span className="text-[10px] sm:text-[11px] text-blue-300 bg-blue-950/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-blue-800/60 font-medium self-start md:self-auto">
            ⚡ Pre-authorized emails receive designated permissions on first Google login
          </span>
        </div>

        {/* Access Presets Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-[11px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <FaSlidersH className="text-amber-400" />
              <span>Select Permission Preset:</span>
            </label>
            <span className="text-[10px] sm:text-[11px] text-amber-300 font-bold bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              Active: {showGrantCustom ? "Customized Configuration" : PRESETS[grantPreset]?.name || "Custom"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => {
              const isSelected = grantPreset === key && !showGrantCustom;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handlePresetSelect(key)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/50 scale-[1.02]"
                      : "bg-slate-800/90 text-blue-200 border-blue-700/60 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {preset.icon}
                  <span>{preset.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowGrantCustom(!showGrantCustom)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none active:scale-95 ${
                showGrantCustom
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/50 scale-[1.02]"
                  : "bg-slate-800/90 text-amber-300 border-amber-500/50 hover:bg-slate-700"
              }`}
            >
              <FaSlidersH />
              <span>Custom Permissions {showGrantCustom ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>

        {/* Expandable Custom Permissions Checkbox Grid */}
        {showGrantCustom && (
          <div className="p-3 sm:p-4 bg-slate-950/70 rounded-xl sm:rounded-2xl border border-blue-800/60 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 pb-2 border-b border-blue-900/60">
              <span>Granular Action-Level Permissions:</span>
              <span className="text-[10px] sm:text-[11px] text-blue-300 font-normal">Check specific permissions to enable for this user</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* 1. Products */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaBox className="text-amber-400" /> Products Management (3)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.products?.create ?? true}
                      onChange={() => toggleGrantPerm("products", "create")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Add / Create Products</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.products?.edit ?? true}
                      onChange={() => toggleGrantPerm("products", "edit")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Edit Existing Products</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.products?.delete ?? true}
                      onChange={() => toggleGrantPerm("products", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Products</span>
                  </label>
                </div>
              </div>

              {/* 2. Calibration Portal (All 10 Sections + Operations) */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3 p-4 rounded-xl bg-slate-900/95 border border-amber-500/30 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <span className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                    <FaCertificate className="text-amber-400 text-base" /> Calibration Portal (10 Sections + 2 Operations)
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const keys = [
                          "dashboard", "quotations", "srf_history", "reminders",
                          "observations", "authorization", "templates", "lab_profile",
                          "payments", "financials", "edit", "delete", "create", "documents", "dispatch"
                        ];
                        setGrantPermissions((prev) => {
                          const cal = { ...(prev.calibration || {}) };
                          keys.forEach((k) => (cal[k] = true));
                          return { ...prev, calibration: cal };
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer"
                    >
                      Enable All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const keys = [
                          "dashboard", "quotations", "srf_history", "reminders",
                          "observations", "authorization", "templates", "lab_profile",
                          "payments", "financials", "edit", "delete", "create", "documents", "dispatch"
                        ];
                        setGrantPermissions((prev) => {
                          const cal = { ...(prev.calibration || {}) };
                          keys.forEach((k) => (cal[k] = false));
                          return { ...prev, calibration: cal };
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                  {/* Section 1 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.dashboard ?? true}
                      onChange={() => toggleGrantPerm("calibration", "dashboard")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">1. Lab Dashboard</span>
                      <span className="text-[10px] text-slate-400">Client overview &amp; live stats</span>
                    </div>
                  </label>

                  {/* Section 2 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.quotations ?? true}
                      onChange={() => toggleGrantPerm("calibration", "quotations")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">2. Calibration Quotations</span>
                      <span className="text-[10px] text-slate-400">Commercial billing (PI/Tax/PO)</span>
                    </div>
                  </label>

                  {/* Section 3 (includes 4. Inward Register) */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.srf_history ?? true}
                      onChange={() => toggleGrantPerm("calibration", "srf_history")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">3. SRF &amp; History (4. Inward)</span>
                      <span className="text-[10px] text-slate-400">Inward register &amp; SRF history</span>
                    </div>
                  </label>

                  {/* Section 5 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.reminders ?? true}
                      onChange={() => toggleGrantPerm("calibration", "reminders")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">5. Due Reminders</span>
                      <span className="text-[10px] text-slate-400">Automated WhatsApp &amp; Email queue</span>
                    </div>
                  </label>

                  {/* Section 6 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.observations ?? true}
                      onChange={() => toggleGrantPerm("calibration", "observations")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">6. Observation Worksheet</span>
                      <span className="text-[10px] text-slate-400">Metrological readings &amp; MU entry</span>
                    </div>
                  </label>

                  {/* Section 7 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.authorization ?? true}
                      onChange={() => toggleGrantPerm("calibration", "authorization")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">7. Quality Authorization</span>
                      <span className="text-[10px] text-slate-400">Technical Signatory approval queue</span>
                    </div>
                  </label>

                  {/* Section 8 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.templates ?? true}
                      onChange={() => toggleGrantPerm("calibration", "templates")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">8. Formats Studio</span>
                      <span className="text-[10px] text-slate-400">PDF &amp; Excel sheets studio</span>
                    </div>
                  </label>

                  {/* Section 9 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.lab_profile ?? true}
                      onChange={() => toggleGrantPerm("calibration", "lab_profile")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">9. NABL Scope &amp; Profile</span>
                      <span className="text-[10px] text-slate-400">Accreditation &amp; master standards</span>
                    </div>
                  </label>

                  {/* Section 10 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.payments ?? true}
                      onChange={() => toggleGrantPerm("calibration", "payments")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-slate-100 block">10. UPI Payments</span>
                      <span className="text-[10px] text-slate-400">UPI payment verification portal</span>
                    </div>
                  </label>

                  {/* Section 11 */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/80 hover:border-emerald-400 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.financials ?? true}
                      onChange={() => toggleGrantPerm("calibration", "financials")}
                      className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400"
                    />
                    <div>
                      <span className="font-semibold text-emerald-200 block">11. Revenue &amp; Financials</span>
                      <span className="text-[10px] text-emerald-300/80">Income received, pending dues &amp; date range filter</span>
                    </div>
                  </label>

                  {/* Action 1: Edit */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-amber-950/30 border border-amber-900/60 hover:border-amber-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.edit ?? true}
                      onChange={() => toggleGrantPerm("calibration", "edit")}
                      className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="font-semibold text-amber-200 block">✏️ Edit Records</span>
                      <span className="text-[10px] text-amber-400/80">Modify due dates, status &amp; data</span>
                    </div>
                  </label>

                  {/* Action 2: Delete */}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-rose-950/30 border border-rose-900/60 hover:border-rose-500/40 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={grantPermissions.calibration?.delete ?? true}
                      onChange={() => toggleGrantPerm("calibration", "delete")}
                      className="mt-0.5 rounded text-rose-500 focus:ring-rose-400"
                    />
                    <div>
                      <span className="font-semibold text-rose-300 block">🗑️ Delete Records</span>
                      <span className="text-[10px] text-rose-400/80">Permanently delete instruments/batches</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Categories */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaLayerGroup className="text-amber-400" /> Categories (3)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.categories?.create ?? true}
                      onChange={() => toggleGrantPerm("categories", "create")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Create Categories</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.categories?.edit ?? true}
                      onChange={() => toggleGrantPerm("categories", "edit")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Edit Categories</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.categories?.delete ?? true}
                      onChange={() => toggleGrantPerm("categories", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Categories</span>
                  </label>
                </div>
              </div>

              {/* 4. Equipment Types */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaLayerGroup className="text-amber-400" /> Equipment Types (2)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.equipmentTypes?.create ?? true}
                      onChange={() => toggleGrantPerm("equipmentTypes", "create")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Create &amp; Manage Equipment Types</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.equipmentTypes?.delete ?? true}
                      onChange={() => toggleGrantPerm("equipmentTypes", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Equipment Types</span>
                  </label>
                </div>
              </div>

              {/* 5. Blogs */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaBookOpen className="text-amber-400" /> Blog Articles (3)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.blogs?.create ?? true}
                      onChange={() => toggleGrantPerm("blogs", "create")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Write &amp; Create Blogs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.blogs?.edit ?? true}
                      onChange={() => toggleGrantPerm("blogs", "edit")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Edit Articles</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.blogs?.delete ?? true}
                      onChange={() => toggleGrantPerm("blogs", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Blog Articles</span>
                  </label>
                </div>
              </div>

              {/* 6. Inquiries */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaEnvelope className="text-amber-400" /> RFQ Inquiries (3)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.inquiries?.view ?? true}
                      onChange={() => toggleGrantPerm("inquiries", "view")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>View RFQ &amp; Inquiries</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.inquiries?.edit ?? true}
                      onChange={() => toggleGrantPerm("inquiries", "edit")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Update Status / Followup</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.inquiries?.delete ?? true}
                      onChange={() => toggleGrantPerm("inquiries", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Inquiries</span>
                  </label>
                </div>
              </div>

              {/* 7. Contact Messages */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaEnvelope className="text-amber-400" /> Contact Messages (2)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.contacts?.view ?? true}
                      onChange={() => toggleGrantPerm("contacts", "view")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>View Contact Messages</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.contacts?.delete ?? true}
                      onChange={() => toggleGrantPerm("contacts", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Contact Messages</span>
                  </label>
                </div>
              </div>

              {/* 8. Newsletter Subscribers */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaEnvelope className="text-amber-400" /> Newsletter Subscribers (3)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.subscribers?.view ?? true}
                      onChange={() => toggleGrantPerm("subscribers", "view")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>View Subscribers List</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.subscribers?.edit ?? true}
                      onChange={() => toggleGrantPerm("subscribers", "edit")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Export / Manage Subscribers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.subscribers?.delete ?? true}
                      onChange={() => toggleGrantPerm("subscribers", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Subscribers</span>
                  </label>
                </div>
              </div>

              {/* 9. Users & Admin Control */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaUserShield className="text-amber-400" /> Admin &amp; Role Access (2)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.users?.manage ?? true}
                      onChange={() => toggleGrantPerm("users", "manage")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Manage User Roles &amp; Permissions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.users?.delete ?? true}
                      onChange={() => toggleGrantPerm("users", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete / Suspend Users</span>
                  </label>
                </div>
              </div>

              {/* 10. Company Expenses & Staff Wallets */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <FaReceipt className="text-emerald-400" /> Company Expenses &amp; Staff Wallets (5)
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.expenses?.view ?? true}
                      onChange={() => toggleGrantPerm("expenses", "view")}
                      className="rounded text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>View Company Expenses Ledger &amp; Wallets</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.expenses?.create ?? true}
                      onChange={() => toggleGrantPerm("expenses", "create")}
                      className="rounded text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>Record Daily Expense &amp; Zero Expense Confirms</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.expenses?.edit ?? true}
                      onChange={() => toggleGrantPerm("expenses", "edit")}
                      className="rounded text-blue-500 focus:ring-blue-400"
                    />
                    <span>Edit Existing Expense Entries</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.expenses?.approve ?? true}
                      onChange={() => toggleGrantPerm("expenses", "approve")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-amber-300">Approve / Reject Reimbursement Claims</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.expenses?.delete ?? true}
                      onChange={() => toggleGrantPerm("expenses", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Company Expense Records</span>
                  </label>
                </div>
              </div>

              {/* 11. Salary & Monthly Payroll (5) */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <FaMoneyCheckAlt className="text-emerald-400" /> Salary &amp; Monthly Payroll (5)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectAllModule(
                        "salary",
                        ["view", "create", "edit", "delete", "process"],
                        !grantPermissions?.salary?.view
                      )
                    }
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Toggle All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions?.salary?.view ?? true}
                      onChange={() => handleGrantCheckboxChange("salary", "view")}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>View Payroll Ledger &amp; Salary Slips</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions?.salary?.create ?? true}
                      onChange={() => handleGrantCheckboxChange("salary", "create")}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Generate Payroll &amp; Add Slips</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions?.salary?.edit ?? true}
                      onChange={() => handleGrantCheckboxChange("salary", "edit")}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Edit Slips, Attendance &amp; Deductions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions?.salary?.delete ?? true}
                      onChange={() => handleGrantCheckboxChange("salary", "delete")}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Delete Draft Salary Slips</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions?.salary?.process ?? true}
                      onChange={() => handleGrantCheckboxChange("salary", "process")}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Disburse &amp; Mark Paid (UTR/Bank)</span>
                  </label>
                </div>
              </div>

              {/* 12. Developer & System Diagnostics */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-800/60 space-y-2 sm:col-span-2">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <FaCode className="text-cyan-400" /> Developer &amp; System Diagnostics (4)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.developer?.error_logs ?? true}
                      onChange={() => toggleGrantPerm("developer", "error_logs")}
                      className="rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>View System Error Logs &amp; Client Telemetry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.developer?.api_health ?? true}
                      onChange={() => toggleGrantPerm("developer", "api_health")}
                      className="rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>API Documentation &amp; Server Health Probes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.developer?.system_config ?? true}
                      onChange={() => toggleGrantPerm("developer", "system_config")}
                      className="rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>System Configuration &amp; Diagnostics</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.developer?.audit_logs ?? true}
                      onChange={() => toggleGrantPerm("developer", "audit_logs")}
                      className="rounded text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>Developer Audit Trail &amp; Activity Logs</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleGrantAccess} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Email Input */}
            <div className="sm:col-span-5 relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
              <input
                type="email"
                required
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="Enter email address (e.g. colleague@gmail.com) *"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-blue-700/60 rounded-xl text-white placeholder-blue-300/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
            </div>

            {/* Optional Name Input */}
            <div className="sm:col-span-3 relative">
              <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 text-xs" />
              <input
                type="text"
                value={grantName}
                onChange={(e) => setGrantName(e.target.value)}
                placeholder="Name (Optional)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-blue-700/60 rounded-xl text-white placeholder-blue-300/60 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
            </div>

            {/* Role Dropdown */}
            <div className="sm:col-span-2">
              <select
                value={grantRole}
                onChange={(e) => setGrantRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-blue-700/60 rounded-xl text-amber-300 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition cursor-pointer"
              >
                <option value="developer">Developer (System & API Access)</option>
                <option value="admin">Admin Access</option>
                <option value="user">Standard User</option>
              </select>
            </div>

            {/* Grant Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={granting}
                className="w-full h-full min-h-[40px] px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="text-xs" />
                <span>{granting ? "Granting..." : "Grant Access"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Registered"
          value={metrics.total !== undefined ? metrics.total : users.length}
          icon={<FaUsers />}
          color="bg-[#021C57]"
        />

        <StatCard
          title="Total Administrators"
          value={metrics.admins !== undefined ? metrics.admins : users.filter((u) => u.role === "admin" || u.role === "superadmin").length}
          icon={<FaUserShield />}
          color="bg-purple-600"
        />

        <StatCard
          title="🟢 Logged In Now"
          value={metrics.online !== undefined ? metrics.online : users.filter((u) => u.isOnline || u.activeStatus === "online").length}
          icon={<FaCheckCircle />}
          color="bg-emerald-600"
        />

        <StatCard
          title="⚪ Logged Out / Offline"
          value={(metrics.total || users.length) - (metrics.online || users.filter((u) => u.isOnline || u.activeStatus === "online").length)}
          icon={<FaUser />}
          color="bg-slate-600"
        />

        <StatCard
          title="Accounts Enabled"
          value={metrics.active !== undefined ? metrics.active : users.filter((u) => u.isActive).length}
          icon={<FaCheckCircle />}
          color="bg-amber-500"
        />
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="developer">Developers Only</option>
            <option value="admin">Administrators Only</option>
            <option value="user">Standard Users Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Enabled Only</option>
            <option value="inactive">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && <SkeletonLoader />}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* 4. USERS TABLE */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Live Login Status</th>
                  <th className="p-4">Role Access</th>
                  <th className="p-4">Granular Permissions</th>
                  <th className="p-4">Account Access</th>
                  <th className="p-4">Activity &amp; Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((user) => {
                  const isAdmin =
                    user.role === "admin" || user.role === "superadmin" || user.role === "developer";
                  const permCount = getEnabledCount(user.permissions);
                  const isUserOnline = user.isOnline || user.activeStatus === "online";
                  const isUserAway = user.activeStatus === "away";

                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50/80 transition duration-150"
                    >
                      {/* USER INFO */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {user.picture ? (
                              <img
                                src={user.picture}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#021C57] to-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                              </div>
                            )}
                            {/* Live Status Dot */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isUserOnline
                                  ? "bg-emerald-500 ring-2 ring-emerald-300/60"
                                  : isUserAway
                                  ? "bg-amber-400"
                                  : "bg-gray-300"
                              }`}
                            ></span>
                          </div>

                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1">
                              {user.name || "Unnamed User"}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* LIVE LOGIN STATUS */}
                      <td className="p-4">
                        {isUserOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Logged In (Active Now)</span>
                          </span>
                        ) : isUserAway ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>Away ({formatWhatsAppLastSeen(user.lastActiveAt)})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>Logged Out (Offline)</span>
                          </span>
                        )}
                      </td>

                      {/* ROLE SELECTOR (INSTANT UPDATE) */}
                      <td className="p-4">
                        {isSuperAdmin(user) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-800 border border-amber-400/50 text-xs font-black tracking-wide shadow-2xs">
                            <FaCrown className="text-amber-600 text-xs" /> SUPER ADMIN
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role}
                              disabled={updatingId === user._id}
                              onChange={(e) =>
                                handleRoleChange(user._id, e.target.value)
                              }
                              className={`border rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer outline-none transition shadow-2xs ${
                                user.role === "superadmin"
                                  ? "bg-amber-50 text-amber-900 border-amber-300"
                                  : isAdmin
                                  ? "bg-purple-50 text-purple-800 border-purple-300 focus:ring-2 focus:ring-purple-200"
                                  : "bg-gray-50 text-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-200"
                              }`}
                            >
                              <option value="superadmin">Super Admin (All Access)</option>
                              <option value="developer">Developer (System & API Access)</option>
                              <option value="admin">Admin (Privileged)</option>
                              <option value="user">User (Standard)</option>
                            </select>

                            {isAdmin && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.5 rounded">
                                ★
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* GRANULAR PERMISSIONS MODAL TRIGGER */}
                      <td className="p-4">
                        {isSuperAdmin(user) ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black shadow-xs border border-slate-800 cursor-pointer transition active:scale-95"
                            title="Super Administrator (Full Unrestricted Access)"
                          >
                            <FaShieldAlt className="text-amber-400" /> Full Access ({TOTAL_PERMS_COUNT}/{TOTAL_PERMS_COUNT})
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                              permCount >= TOTAL_PERMS_COUNT
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                : "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100"
                            }`}
                            title="Click to view & edit granular module permissions"
                          >
                            <FaSlidersH className={permCount >= TOTAL_PERMS_COUNT ? "text-emerald-600" : "text-blue-600"} />
                            <span>Permissions ({permCount}/{TOTAL_PERMS_COUNT})</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                              permCount >= TOTAL_PERMS_COUNT ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                            }`}>
                              {permCount >= TOTAL_PERMS_COUNT ? "Full" : "Custom"}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 transition cursor-pointer active:scale-95"
                            title="Click to grant permissions & assign admin roles"
                          >
                            <FaSlidersH className="text-purple-600" />
                            <span>Assign Access ({permCount}/{TOTAL_PERMS_COUNT})</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
                              User
                            </span>
                          </button>
                        )}
                      </td>

                      {/* ACCOUNT ACCESS (ENABLED / SUSPENDED) */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={user.isActive !== false}
                            onChange={() => handleToggleStatus(user._id)}
                            disabled={updatingId === user._id || isSuperAdmin(user)}
                          />
                          <span
                            className={`text-xs font-medium ${
                              user.isActive !== false ? "text-emerald-600 font-bold" : "text-rose-500"
                            }`}
                          >
                            {user.isActive !== false ? "Enabled" : "Suspended"}
                          </span>
                        </div>
                      </td>

                      {/* REGISTERED DATE & ACTIVITY */}
                      <td className="p-4 text-xs text-gray-500">
                        <div>
                          {new Date(user.createdAt || Date.now()).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {isUserOnline ? (
                            <span className="text-emerald-600 font-bold">Active in portal</span>
                          ) : user.lastActiveAt || user.lastLogin ? (
                            <span>Last seen: {formatWhatsAppLastSeen(user.lastActiveAt || user.lastLogin)}</span>
                          ) : (
                            <span>Never logged in</span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="Edit Permissions & Role"
                          >
                            <FaSlidersH size={13} />
                          </button>

                          {isSuperAdmin(user) ? (
                            <span className="text-[10px] text-slate-400 font-semibold italic px-1">Protected</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deletingId === user._id}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"
                              title="Delete User"
                            >
                              {deletingId === user._id ? (
                                <span className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                              ) : (
                                <FaTrash size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filteredUsers.length === 0 && (
        <div className="bg-white p-12 rounded-3xl shadow-xs border border-gray-100 text-center space-y-3">
          <FaUsers className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-700">No Users Found</h3>
          <p className="text-gray-400 text-xs">
            No registered users match your search criteria.
          </p>
        </div>
      )}

      {/* 5. GRANULAR PERMISSION MODAL FOR EDITING EXISTING USER */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <FaShieldAlt /> Granular Permission Matrix
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Manage Access: {editingPermissionsUser.name || editingPermissionsUser.email}
                </h3>
                <p className="text-xs text-slate-500">{editingPermissionsUser.email}</p>
              </div>

              <button
                type="button"
                onClick={() => setEditingPermissionsUser(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Role Preset Quick Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Permission Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => {
                      setModalRole(preset.role);
                      setModalPermissions(JSON.parse(JSON.stringify(preset.permissions)));
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition flex flex-col justify-between gap-1 text-xs cursor-pointer group active:scale-95"
                  >
                    <span className="font-bold text-slate-900 group-hover:text-amber-700 flex items-center gap-1">
                      {preset.icon} {key.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Permission Checkboxes */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Module-Level Permissions:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Products (3) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaBox className="text-amber-600" /> Products Management (3)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.products?.create ?? true}
                        onChange={() => toggleModalPerm("products", "create")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Add / Create Products</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.products?.edit ?? true}
                        onChange={() => toggleModalPerm("products", "edit")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Edit Existing Products</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.products?.delete ?? true}
                        onChange={() => toggleModalPerm("products", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Products</span>
                    </label>
                  </div>
                </div>

                {/* 2. Calibration Portal (All 10 Sections + Operations) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200/80">
                    <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <FaCertificate className="text-amber-600 text-base" /> Calibration Portal (10 Sections + 2 Operations)
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const keys = [
                            "dashboard", "quotations", "srf_history", "reminders",
                            "observations", "authorization", "templates", "lab_profile",
                            "payments", "financials", "edit", "delete", "create", "documents", "dispatch"
                          ];
                          setModalPermissions((prev) => {
                            const cal = { ...(prev.calibration || {}) };
                            keys.forEach((k) => (cal[k] = true));
                            return { ...prev, calibration: cal };
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 text-[11px] shadow-xs cursor-pointer"
                      >
                        Enable All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const keys = [
                            "dashboard", "quotations", "srf_history", "reminders",
                            "observations", "authorization", "templates", "lab_profile",
                            "payments", "financials", "edit", "delete", "create", "documents", "dispatch"
                          ];
                          setModalPermissions((prev) => {
                            const cal = { ...(prev.calibration || {}) };
                            keys.forEach((k) => (cal[k] = false));
                            return { ...prev, calibration: cal };
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 text-[11px] cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-slate-800">
                    {/* Section 1 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.dashboard ?? true}
                        onChange={() => toggleModalPerm("calibration", "dashboard")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">1. Lab Dashboard</span>
                        <span className="text-[10px] text-slate-500">Overview, metrics &amp; client cards</span>
                      </div>
                    </label>

                    {/* Section 2 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.quotations ?? true}
                        onChange={() => toggleModalPerm("calibration", "quotations")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">2. Calibration Quotations</span>
                        <span className="text-[10px] text-slate-500">Commercial billing (PI/Tax/PO)</span>
                      </div>
                    </label>

                    {/* Section 3 (includes 4. Inward Register) */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.srf_history ?? true}
                        onChange={() => toggleModalPerm("calibration", "srf_history")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">3. SRF &amp; History (4. Inward)</span>
                        <span className="text-[10px] text-slate-500">Inward registration &amp; history</span>
                      </div>
                    </label>

                    {/* Section 5 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.reminders ?? true}
                        onChange={() => toggleModalPerm("calibration", "reminders")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">5. Due Reminders</span>
                        <span className="text-[10px] text-slate-500">Automated WhatsApp &amp; Email queue</span>
                      </div>
                    </label>

                    {/* Section 6 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.observations ?? true}
                        onChange={() => toggleModalPerm("calibration", "observations")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">6. Observation Worksheet</span>
                        <span className="text-[10px] text-slate-500">Metrological raw readings &amp; MU</span>
                      </div>
                    </label>

                    {/* Section 7 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.authorization ?? true}
                        onChange={() => toggleModalPerm("calibration", "authorization")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">7. Quality Authorization</span>
                        <span className="text-[10px] text-slate-500">Technical Signatory review queue</span>
                      </div>
                    </label>

                    {/* Section 8 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.templates ?? true}
                        onChange={() => toggleModalPerm("calibration", "templates")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">8. Formats Studio</span>
                        <span className="text-[10px] text-slate-500">Excel / PDF template designer</span>
                      </div>
                    </label>

                    {/* Section 9 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.lab_profile ?? true}
                        onChange={() => toggleModalPerm("calibration", "lab_profile")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">9. NABL Scope &amp; Profile</span>
                        <span className="text-[10px] text-slate-500">Accreditation &amp; master standards</span>
                      </div>
                    </label>

                    {/* Section 10 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.payments ?? true}
                        onChange={() => toggleModalPerm("calibration", "payments")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">10. UPI Payments</span>
                        <span className="text-[10px] text-slate-500">UPI payment verification portal</span>
                      </div>
                    </label>

                    {/* Section 11 */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 hover:border-emerald-400 hover:shadow-xs cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.financials ?? true}
                        onChange={() => toggleModalPerm("calibration", "financials")}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400"
                      />
                      <div>
                        <span className="font-bold text-emerald-900 block">11. Revenue &amp; Financials</span>
                        <span className="text-[10px] text-emerald-700">Income received, pending dues &amp; date range filter</span>
                      </div>
                    </label>

                    {/* Action 1: Edit */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-amber-50/80 border border-amber-200 hover:border-amber-400 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.edit ?? true}
                        onChange={() => toggleModalPerm("calibration", "edit")}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <span className="font-bold text-amber-900 block">✏️ Edit Records</span>
                        <span className="text-[10px] text-amber-700">Modify due dates, status &amp; data</span>
                      </div>
                    </label>

                    {/* Action 2: Delete */}
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-rose-50/80 border border-rose-200 hover:border-rose-400 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={modalPermissions.calibration?.delete ?? true}
                        onChange={() => toggleModalPerm("calibration", "delete")}
                        className="mt-0.5 rounded text-rose-500 focus:ring-rose-400"
                      />
                      <div>
                        <span className="font-bold text-rose-900 block">🗑️ Delete Records</span>
                        <span className="text-[10px] text-rose-700">Permanently delete instruments/batches</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3. Categories (3) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaLayerGroup className="text-amber-600" /> Product Categories (3)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.categories?.create ?? true}
                        onChange={() => toggleModalPerm("categories", "create")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Create Categories</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.categories?.edit ?? true}
                        onChange={() => toggleModalPerm("categories", "edit")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Edit Categories</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.categories?.delete ?? true}
                        onChange={() => toggleModalPerm("categories", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Categories</span>
                    </label>
                  </div>
                </div>

                {/* 4. Equipment Types (2) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaLayerGroup className="text-amber-600" /> Equipment Types (2)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.equipmentTypes?.create ?? true}
                        onChange={() => toggleModalPerm("equipmentTypes", "create")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Create &amp; Manage Equipment Types</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.equipmentTypes?.delete ?? true}
                        onChange={() => toggleModalPerm("equipmentTypes", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Equipment Types</span>
                    </label>
                  </div>
                </div>

                {/* 5. Blogs (3) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaBookOpen className="text-amber-600" /> Blog Articles (3)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.blogs?.create ?? true}
                        onChange={() => toggleModalPerm("blogs", "create")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Write &amp; Create Blogs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.blogs?.edit ?? true}
                        onChange={() => toggleModalPerm("blogs", "edit")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Edit Articles</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.blogs?.delete ?? true}
                        onChange={() => toggleModalPerm("blogs", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Blog Articles</span>
                    </label>
                  </div>
                </div>

                {/* 6. Inquiries (3) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaEnvelope className="text-amber-600" /> RFQ Inquiries (3)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.inquiries?.view ?? true}
                        onChange={() => toggleModalPerm("inquiries", "view")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>View RFQ &amp; Inquiries</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.inquiries?.edit ?? true}
                        onChange={() => toggleModalPerm("inquiries", "edit")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Update Status / Followup</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.inquiries?.delete ?? true}
                        onChange={() => toggleModalPerm("inquiries", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Inquiries</span>
                    </label>
                  </div>
                </div>

                {/* 7. Contact Messages (2) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaEnvelope className="text-amber-600" /> Contact Messages (2)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.contacts?.view ?? true}
                        onChange={() => toggleModalPerm("contacts", "view")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>View Contact Messages</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.contacts?.delete ?? true}
                        onChange={() => toggleModalPerm("contacts", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Contact Messages</span>
                    </label>
                  </div>
                </div>

                {/* 8. Newsletter Subscribers (3) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaEnvelope className="text-amber-600" /> Newsletter Subscribers (3)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.subscribers?.view ?? true}
                        onChange={() => toggleModalPerm("subscribers", "view")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>View Subscribers List</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.subscribers?.edit ?? true}
                        onChange={() => toggleModalPerm("subscribers", "edit")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Export / Manage Subscribers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.subscribers?.delete ?? true}
                        onChange={() => toggleModalPerm("subscribers", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Subscribers</span>
                    </label>
                  </div>
                </div>

                {/* 9. Admin & Role Access (2) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaUserShield className="text-amber-600" /> Admin &amp; Role Access (2)
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.users?.manage ?? true}
                        onChange={() => toggleModalPerm("users", "manage")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="font-bold text-slate-900">Manage User Roles &amp; Permissions</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.users?.delete ?? true}
                        onChange={() => toggleModalPerm("users", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete / Suspend Users</span>
                    </label>
                  </div>
                </div>

                {/* 10. Company Expenses & Staff Wallets (5) */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2 sm:col-span-2">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <FaReceipt className="text-emerald-600" /> Company Expenses &amp; Staff Wallets (5)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.expenses?.view ?? true}
                        onChange={() => toggleModalPerm("expenses", "view")}
                        className="rounded text-emerald-600 focus:ring-emerald-400"
                      />
                      <span className="font-medium text-slate-800">View Expenses Ledger &amp; Wallets</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.expenses?.create ?? true}
                        onChange={() => toggleModalPerm("expenses", "create")}
                        className="rounded text-emerald-600 focus:ring-emerald-400"
                      />
                      <span className="font-medium text-slate-800">Record Daily Expense &amp; ₹0 Confirms</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.expenses?.edit ?? true}
                        onChange={() => toggleModalPerm("expenses", "edit")}
                        className="rounded text-blue-600 focus:ring-blue-400"
                      />
                      <span className="font-medium text-slate-800">Edit Existing Expense Entries</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.expenses?.approve ?? true}
                        onChange={() => toggleModalPerm("expenses", "approve")}
                        className="rounded text-amber-600 focus:ring-amber-400"
                      />
                      <span className="font-semibold text-amber-700">Approve / Reject Claims</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={modalPermissions.expenses?.delete ?? true}
                        onChange={() => toggleModalPerm("expenses", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Expense Records</span>
                    </label>
                  </div>
                </div>

                {/* 11. Salary & Monthly Payroll (5) */}
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                    <span className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                      <FaMoneyCheckAlt className="text-emerald-600" /> Salary &amp; Monthly Payroll (5)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleEditModule(
                          "salary",
                          ["view", "create", "edit", "delete", "process"],
                          !editFormPermissions?.salary?.view
                        )
                      }
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                    >
                      Toggle All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-gray-700">
                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormPermissions?.salary?.view ?? true}
                        onChange={() => handleEditCheckboxChange("salary", "view")}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>View Payroll Ledger &amp; Salary Slips</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormPermissions?.salary?.create ?? true}
                        onChange={() => handleEditCheckboxChange("salary", "create")}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Generate Payroll &amp; Add Slips</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormPermissions?.salary?.edit ?? true}
                        onChange={() => handleEditCheckboxChange("salary", "edit")}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Edit Slips, Attendance &amp; Deductions</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormPermissions?.salary?.delete ?? true}
                        onChange={() => handleEditCheckboxChange("salary", "delete")}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Delete Draft Salary Slips</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormPermissions?.salary?.process ?? true}
                        onChange={() => handleEditCheckboxChange("salary", "process")}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Disburse &amp; Mark Paid (UTR/Bank)</span>
                    </label>
                  </div>
                </div>

                {/* 12. Developer & System Diagnostics (4) */}
                <div className="p-3.5 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-2 sm:col-span-2">
                  <span className="font-bold text-cyan-950 flex items-center gap-1.5 text-xs">
                    <FaCode className="text-cyan-600 text-sm" /> Developer &amp; System Diagnostics (4)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.developer?.error_logs ?? true}
                        onChange={() => toggleModalPerm("developer", "error_logs")}
                        className="rounded text-cyan-600 focus:ring-cyan-400"
                      />
                      <span className="font-medium text-slate-800">System Error Logs &amp; Telemetry</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.developer?.api_health ?? true}
                        onChange={() => toggleModalPerm("developer", "api_health")}
                        className="rounded text-cyan-600 focus:ring-cyan-400"
                      />
                      <span className="font-medium text-slate-800">API Documentation &amp; Health Probes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.developer?.system_config ?? true}
                        onChange={() => toggleModalPerm("developer", "system_config")}
                        className="rounded text-cyan-600 focus:ring-cyan-400"
                      />
                      <span className="font-medium text-slate-800">System Configuration &amp; Diagnostics</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.developer?.audit_logs ?? true}
                        onChange={() => toggleModalPerm("developer", "audit_logs")}
                        className="rounded text-cyan-600 focus:ring-cyan-400"
                      />
                      <span className="font-medium text-slate-800">Developer Audit Trail &amp; Logs</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPermissionsUser(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={savingPermissions}
                onClick={handleSaveModalPermissions}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md transition cursor-pointer disabled:opacity-60"
              >
                {savingPermissions ? "Saving Permissions..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
