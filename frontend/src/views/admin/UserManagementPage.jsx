"use client";

import { useEffect, useState, useMemo } from "react";
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
  FaPen,
} from "react-icons/fa";
import { toast } from "react-toastify";
import StatCard from "../../components/admin/common/StatCard.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import Toggle from "../../components/admin/common/Toggle.jsx";

const DEFAULT_FULL_PERMISSIONS = {
  products: { create: true, edit: true, delete: true },
  categories: { create: true, edit: true, delete: true },
  equipmentTypes: { create: true, edit: true, delete: true },
  blogs: { create: true, edit: true, delete: true },
  inquiries: { view: true, delete: true },
  contacts: { view: true, delete: true },
  subscribers: { view: true, delete: true },
  users: { manage: true },
};

const PRESETS = {
  superadmin: {
    name: "Super Administrator (All Access)",
    icon: <FaCrown className="text-amber-500" />,
    role: "admin",
    permissions: {
      products: { create: true, edit: true, delete: true },
      categories: { create: true, edit: true, delete: true },
      equipmentTypes: { create: true, edit: true, delete: true },
      blogs: { create: true, edit: true, delete: true },
      inquiries: { view: true, delete: true },
      contacts: { view: true, delete: true },
      subscribers: { view: true, delete: true },
      users: { manage: true },
    },
  },
  product_manager: {
    name: "Product & Catalog Manager (Add / Edit Products)",
    icon: <FaBox className="text-blue-500" />,
    role: "admin",
    permissions: {
      products: { create: true, edit: true, delete: false },
      categories: { create: true, edit: true, delete: false },
      equipmentTypes: { create: true, edit: true, delete: false },
      blogs: { create: false, edit: false, delete: false },
      inquiries: { view: true, delete: false },
      contacts: { view: false, delete: false },
      subscribers: { view: false, delete: false },
      users: { manage: false },
    },
  },
  content_editor: {
    name: "Blog Content Writer (Create & Edit Guides)",
    icon: <FaBookOpen className="text-emerald-500" />,
    role: "admin",
    permissions: {
      products: { create: false, edit: false, delete: false },
      categories: { create: false, edit: false, delete: false },
      equipmentTypes: { create: false, edit: false, delete: false },
      blogs: { create: true, edit: true, delete: false },
      inquiries: { view: false, delete: false },
      contacts: { view: false, delete: false },
      subscribers: { view: false, delete: false },
      users: { manage: false },
    },
  },
  support_lead: {
    name: "Customer Support (Inquiries & Contacts)",
    icon: <FaEnvelope className="text-purple-500" />,
    role: "admin",
    permissions: {
      products: { create: false, edit: false, delete: false },
      categories: { create: false, edit: false, delete: false },
      equipmentTypes: { create: false, edit: false, delete: false },
      blogs: { create: false, edit: false, delete: false },
      inquiries: { view: true, delete: true },
      contacts: { view: true, delete: true },
      subscribers: { view: true, delete: true },
      users: { manage: false },
    },
  },
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

  // Permission Modal State for Existing Users
  const [editingPermissionsUser, setEditingPermissionsUser] = useState(null);
  const [modalPermissions, setModalPermissions] = useState(DEFAULT_FULL_PERMISSIONS);
  const [modalRole, setModalRole] = useState("admin");
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminUsersApi();
      const data = res.data?.data || res.data;
      setUsers(data.users || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to fetch registered users list.");
    } finally {
      setLoading(false);
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
    if (presetKey === "custom") {
      setShowGrantCustom(true);
    } else {
      const p = PRESETS[presetKey];
      if (p) {
        setGrantRole(p.role);
        setGrantPermissions(p.permissions);
      }
    }
  };

  // Toggle Single Permission in Grant State
  const toggleGrantPerm = (module, action) => {
    setGrantPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  // Toggle Single Permission in Modal State
  const toggleModalPerm = (module, action) => {
    setModalPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  // Open Permissions Modal for Existing User
  const handleOpenPermissionsModal = (user) => {
    setEditingPermissionsUser(user);
    setModalRole(user.role || "admin");
    const userPerms = user.permissions || DEFAULT_FULL_PERMISSIONS;
    setModalPermissions({
      products: { create: true, edit: true, delete: true, ...userPerms.products },
      categories: { create: true, edit: true, delete: true, ...userPerms.categories },
      equipmentTypes: { create: true, edit: true, delete: true, ...userPerms.equipmentTypes },
      blogs: { create: true, edit: true, delete: true, ...userPerms.blogs },
      inquiries: { view: true, delete: true, ...userPerms.inquiries },
      contacts: { view: true, delete: true, ...userPerms.contacts },
      subscribers: { view: true, delete: true, ...userPerms.subscribers },
      users: { manage: true, ...userPerms.users },
    });
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

  // Count enabled permissions for badge
  const getEnabledCount = (permissions) => {
    if (!permissions) return 8;
    let count = 0;
    Object.values(permissions).forEach((mod) => {
      if (typeof mod === "object") {
        Object.values(mod).forEach((val) => {
          if (val) count++;
        });
      }
    });
    return count;
  };

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
          <label className="text-[11px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
            <FaSlidersH className="text-amber-400" />
            <span>Select Permission Preset:</span>
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => {
              const isSelected = grantPreset === key && !showGrantCustom;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setShowGrantCustom(false);
                    handlePresetSelect(key);
                  }}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/40"
                      : "bg-slate-800/80 text-blue-200 border-blue-700/50 hover:bg-slate-700 hover:text-white"
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
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                showGrantCustom
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/40"
                  : "bg-slate-800/80 text-amber-300 border-amber-500/40 hover:bg-slate-700"
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
              {/* Products */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaBox className="text-amber-400" /> Products Management
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

              {/* Categories & Equipment Types */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaLayerGroup className="text-amber-400" /> Categories &amp; Types
                </span>
                <div className="space-y-1.5 pl-2 text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.categories?.create ?? true}
                      onChange={() => toggleGrantPerm("categories", "create")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Create &amp; Edit Categories</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.equipmentTypes?.create ?? true}
                      onChange={() => toggleGrantPerm("equipmentTypes", "create")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>Manage Equipment Types</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantPermissions.categories?.delete ?? true}
                      onChange={() => toggleGrantPerm("categories", "delete")}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-rose-300">Delete Categories/Types</span>
                  </label>
                </div>
              </div>

              {/* Blogs */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaBookOpen className="text-amber-400" /> Blog Articles
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

              {/* Inquiries & Contacts */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaEnvelope className="text-amber-400" /> Inquiries &amp; Messages
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
                      checked={grantPermissions.contacts?.view ?? true}
                      onChange={() => toggleGrantPerm("contacts", "view")}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span>View Contact Messages</span>
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

              {/* Users & Admin Control */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <FaUserShield className="text-amber-400" /> Admin &amp; Role Access
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Accounts"
          value={metrics.total || users.length}
          icon={<FaUsers />}
          color="bg-[#021C57]"
        />

        <StatCard
          title="Active Administrators"
          value={metrics.admins || users.filter((u) => u.role === "admin" || u.role === "superadmin").length}
          icon={<FaUserShield />}
          color="bg-purple-600"
        />

        <StatCard
          title="Standard Users"
          value={metrics.users || users.filter((u) => u.role === "user").length}
          icon={<FaUser />}
          color="bg-emerald-600"
        />

        <StatCard
          title="Active Accounts"
          value={metrics.active || users.filter((u) => u.isActive).length}
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
            <option value="admin">Administrators Only</option>
            <option value="user">Standard Users Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm outline-none bg-white text-gray-700 cursor-pointer focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
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
            <table className="w-full text-left min-w-[850px]">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Auth Provider</th>
                  <th className="p-4">Role Access</th>
                  <th className="p-4">Granular Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((user) => {
                  const isAdmin =
                    user.role === "admin" || user.role === "superadmin";
                  const permCount = getEnabledCount(user.permissions);

                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50/80 transition duration-150"
                    >
                      {/* USER INFO */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
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

                      {/* AUTH PROVIDER */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-100">
                          <FaGoogle size={11} className="text-red-500" /> Google OAuth
                        </span>
                      </td>

                      {/* ROLE SELECTOR (INSTANT UPDATE) */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            disabled={updatingId === user._id}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className={`border rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer outline-none transition shadow-2xs ${
                              isAdmin
                                ? "bg-purple-50 text-purple-800 border-purple-300 focus:ring-2 focus:ring-purple-200"
                                : "bg-gray-50 text-gray-700 border-gray-300 focus:ring-2 focus:ring-gray-200"
                            }`}
                          >
                            <option value="admin">Admin (Privileged)</option>
                            <option value="user">User (No Admin Access)</option>
                          </select>

                          {isAdmin && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.5 rounded">
                              ★
                            </span>
                          )}
                        </div>
                      </td>

                      {/* GRANULAR PERMISSIONS MODAL TRIGGER */}
                      <td className="p-4">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition cursor-pointer"
                            title="Edit granular module permissions"
                          >
                            <FaSlidersH className="text-amber-600" />
                            <span>Permissions</span>
                            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                              {permCount}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None (Standard User)</span>
                        )}
                      </td>

                      {/* STATUS TOGGLE */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={user.isActive}
                            onChange={() => handleToggleStatus(user._id)}
                            disabled={updatingId === user._id}
                          />
                          <span
                            className={`text-xs font-medium ${
                              user.isActive ? "text-emerald-600 font-bold" : "text-rose-500"
                            }`}
                          >
                            {user.isActive ? "Active" : "Suspended"}
                          </span>
                        </div>
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="p-4 text-xs text-gray-500">
                        <div>
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {user.lastLogin && (
                          <div className="text-[10px] text-gray-400">
                            Last active: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-center">
                        <button
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
                      setModalPermissions(preset.permissions);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left transition flex flex-col justify-between gap-1 text-xs cursor-pointer group"
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
                {/* Products */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaBox className="text-amber-600" /> Products Management
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

                {/* Categories & Types */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaLayerGroup className="text-amber-600" /> Categories &amp; Equipment Types
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.categories?.create ?? true}
                        onChange={() => toggleModalPerm("categories", "create")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Create &amp; Edit Categories</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.equipmentTypes?.create ?? true}
                        onChange={() => toggleModalPerm("equipmentTypes", "create")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Manage Equipment Types</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.categories?.delete ?? true}
                        onChange={() => toggleModalPerm("categories", "delete")}
                        className="rounded text-rose-500 focus:ring-rose-400"
                      />
                      <span className="text-rose-600 font-semibold">Delete Categories/Types</span>
                    </label>
                  </div>
                </div>

                {/* Blogs */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaBookOpen className="text-amber-600" /> Blog &amp; Testing Guides
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

                {/* Inquiries & Users */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FaEnvelope className="text-amber-600" /> Leads &amp; Administration
                  </span>
                  <div className="space-y-1.5 pl-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.inquiries?.view ?? true}
                        onChange={() => toggleModalPerm("inquiries", "view")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>View RFQ Inquiries &amp; Messages</span>
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalPermissions.users?.manage ?? true}
                        onChange={() => toggleModalPerm("users", "manage")}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="font-bold text-slate-900">Manage Users &amp; Permissions</span>
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
