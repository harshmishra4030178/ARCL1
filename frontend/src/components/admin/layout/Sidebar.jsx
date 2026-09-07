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
} from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";

const allMenuItems = [
  { name: "Dashboard", path: "/admin", icon: <FaHome /> },
  { name: "Equipment Types", path: "/admin/equipment-types", icon: <FaLayerGroup />, module: "equipmentTypes" },
  { name: "Categories", path: "/admin/categories", icon: <FaThList />, module: "categories" },
  { name: "Products", path: "/admin/products", icon: <FaBox />, module: "products" },
  { name: "Blog Articles", path: "/admin/blogs", icon: <FaBookOpen />, module: "blogs" },
  { name: "Users & Roles", path: "/admin/users", icon: <FaUsers />, module: "users", action: "manage" },
  { name: "Inquiries", path: "/admin/inquiry", icon: <FaEnvelope />, module: "inquiries" },
  { name: "Contact Messages", path: "/admin/contact-messages", icon: <FaEnvelope />, module: "contacts" },
  { name: "Subscribers", path: "/admin/subscribers", icon: <FaBell />, module: "subscribers" },
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
    <div className="w-64 h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white shadow-lg p-5">
      
      {/* Logo / Title */}
      <h2 className="text-2xl font-bold mb-8 tracking-wide flex items-center gap-2">
        <RiAdminFill /> Admin Panel
      </h2>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-blue-500 shadow-md"
                  : "hover:bg-gray-700 "
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
