"use client";

import { useMemo } from "react";
import { NavLink } from "../../../utils/navigation.jsx";
import { useAuthStore } from "../../../store/useAuthStore.js";
import { hasModuleAccess } from "../../../utils/rbac.js";
import {
  FaHome,
  FaLayerGroup,
  FaThList,
  FaBox,
  FaEnvelope,
  FaUsers,
  FaBell,
  FaBookOpen,
  FaShieldAlt,
  FaCertificate,
  FaMoneyBillWave,
  FaBoxes,
  FaFileInvoiceDollar,
  FaReceipt,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";

const allMenuItems = [
  { name: "Dashboard", path: "/admin", icon: <FaHome /> },
  { name: "Equipment Types", path: "/admin/equipment-types", icon: <FaLayerGroup />, module: "equipmentTypes" },
  { name: "Categories", path: "/admin/categories", icon: <FaThList />, module: "categories" },
  { name: "Products", path: "/admin/products", icon: <FaBox />, module: "products" },
  { name: "Inventory Management", path: "/admin/inventory", icon: <FaBoxes />, module: "inventory" },
  { name: "Sales Portal", path: "/admin/sales", icon: <FaFileInvoiceDollar />, module: "sales" },
  { name: "Calibration Portal", path: "/admin/calibration", icon: <FaCertificate />, module: "calibration" },
  { name: "Payment Verifications", path: "/admin/calibration/payments", icon: <FaMoneyBillWave />, module: "calibration", action: "payments" },
  { name: "Company Expenses", path: "/admin/expenses", icon: <FaReceipt />, module: "expenses" },
  { name: "Salary & Payroll", path: "/admin/salary", icon: <FaMoneyCheckAlt />, module: "salary" },
  { name: "Blog Articles", path: "/admin/blogs", icon: <FaBookOpen />, module: "blogs" },
  { name: "Users & Roles", path: "/admin/users", icon: <FaUsers />, module: "users", action: "manage" },
  { name: "Inquiries", path: "/admin/inquiry", icon: <FaEnvelope />, module: "inquiries" },
  { name: "Contact Messages", path: "/admin/contact-messages", icon: <FaEnvelope />, module: "contacts" },
  { name: "Subscribers", path: "/admin/subscribers", icon: <FaBell />, module: "subscribers" },
  { name: "Error Monitoring", path: "/admin/error-logs", icon: <FaShieldAlt /> },
];

const Sidebar = () => {
  const { user } = useAuthStore();

  const visibleMenuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      if (!item.module) return true; // Dashboard is open to all authenticated admins
      return hasModuleAccess(user, item.module, item.action);
    });
  }, [user]);

  return (
    <div className="w-64 h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white shadow-lg flex flex-col">
      
      {/* Logo / Title — Fixed at top, no scroll */}
      <div className="px-5 pt-5 pb-4 shrink-0 border-b border-white/10">
        <h2 className="text-2xl font-bold tracking-wide flex items-center gap-2">
          <RiAdminFill /> Admin Panel
        </h2>
      </div>

      {/* Menu — Scrollable area with custom scrollbar */}
      <nav
        className="flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#4b5563 transparent",
        }}
      >
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin" || item.path === "/admin/calibration" || item.path === "/admin/inventory" || item.path === "/admin/sales" || item.path === "/admin/expenses" || item.path === "/admin/salary"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-blue-600 shadow-md font-semibold text-white"
                  : "text-gray-300 hover:bg-gray-700/70 hover:text-white"
              }`
            }
          >
            <span className="text-lg shrink-0">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
