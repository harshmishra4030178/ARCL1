"use client";

import { useMemo } from "react";
import { NavLink } from "../../../utils/navigation.jsx";
import { useAuthStore } from "../../../store/useAuthStore.js";
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
  { name: "Equipment Types", path: "/admin/equipment-types", icon: <FaLayerGroup /> },
  { name: "Categories", path: "/admin/categories", icon: <FaThList /> },
  { name: "Products", path: "/admin/products", icon: <FaBox /> },
  { name: "Blog Articles", path: "/admin/blogs", icon: <FaBookOpen /> },
  { name: "Users & Roles", path: "/admin/users", icon: <FaUsers />, reqUserManage: true },
  { name: "Inquiries", path: "/admin/inquiry", icon: <FaEnvelope /> },
  { name: "Contact Messages", path: "/admin/contact-messages", icon: <FaEnvelope /> },
  { name: "Subscribers", path: "/admin/subscribers", icon: <FaBell /> },
];

const Sidebar = () => {
  const { user } = useAuthStore();

  const canManageUsers = useMemo(() => {
    if (!user) return false;
    if (user.role === "superadmin") return true;
    if (user.email?.toLowerCase() === "admin@arcl.com") return true;
    if (user.permissions?.users?.manage === true) return true;
    return false;
  }, [user]);

  const visibleMenuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      if (item.reqUserManage && !canManageUsers) return false;
      return true;
    });
  }, [canManageUsers]);

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
