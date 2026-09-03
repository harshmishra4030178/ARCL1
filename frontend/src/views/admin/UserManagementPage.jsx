"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getAdminUsersApi,
  updateUserRoleApi,
  toggleUserStatusApi,
  deleteUserApi,
} from "../../api/userApi.js";
import {
  FaUsers,
  FaUserShield,
  FaUser,
  FaSearch,
  FaTrash,
  FaCheckCircle,
  FaBan,
  FaGoogle,
  FaShieldAlt,
  FaKey,
} from "react-icons/fa";
import { toast } from "react-toastify";
import StatCard from "../../components/admin/common/StatCard.jsx";
import SkeletonLoader from "../../components/admin/common/SkeletonLoader.jsx";
import Toggle from "../../components/admin/common/Toggle.jsx";

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

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      const res = await updateUserRoleApi(userId, newRole);
      toast.success(res.data?.message || "User role updated successfully! 🎉");

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );

      // Re-fetch metrics
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

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2.5">
            <FaUserShield className="text-[#021C57]" /> Users & Role Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage Google authenticated accounts and promote users to Administrator access.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#021C57] px-4 py-2 rounded-2xl text-xs font-bold border border-blue-200 shadow-2xs self-start sm:self-auto">
          <FaShieldAlt className="text-blue-600" /> RBAC Security Enabled
        </div>
      </div>

      {/* 1. METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Accounts"
          value={metrics.total || users.length}
          icon={<FaUsers />}
          color="bg-[#021C57]"
        />

        <StatCard
          title="Active Administrators"
          value={metrics.admins || users.filter((u) => u.role === "admin").length}
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

      {/* 2. SEARCH & FILTER TOOLBAR */}
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

      {/* 3. USERS TABLE */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[750px]">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Auth Provider</th>
                  <th className="p-4">Role Access</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((user) => {
                  const isAdmin =
                    user.role === "admin" || user.role === "superadmin";

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
                            <option value="admin">Admin (Full Access)</option>
                            <option value="user">User (No Admin Access)</option>
                          </select>

                          {isAdmin && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.5 rounded">
                              ★
                            </span>
                          )}
                        </div>
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
    </div>
  );
};

export default UserManagementPage;
