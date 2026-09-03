"use client";

import { NavLink } from "../../../utils/navigation.jsx";
import {
  FaHome,
  FaLayerGroup,
  FaThList,
  FaBox,
  FaEnvelope,
  FaUsers,
  FaBell,
} from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";

const menuItems = [
  { name: "Dashboard", path: "/admin", icon: <FaHome /> },
  { name: "Equipment Types", path: "/admin/equipment-types", icon: <FaLayerGroup /> },
  { name: "Categories", path: "/admin/categories", icon: <FaThList /> },
  { name: "Products", path: "/admin/products", icon: <FaBox /> },
  { name: "Users & Roles", path: "/admin/users", icon: <FaUsers /> },
  { name: "Inquiries", path: "/admin/inquiry", icon: <FaEnvelope /> },
  { name: "Contact Messages", path: "/admin/contact-messages", icon: <FaEnvelope /> },
  { name: "Subscribers", path: "/admin/subscribers", icon: <FaBell /> },
];

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white shadow-lg p-5">
      
      {/* Logo / Title */}
      <h2 className="text-2xl font-bold mb-8 tracking-wide flex items-center gap-2">
        <RiAdminFill /> Admin Panel
      </h2>

      {/* Menu */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
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
