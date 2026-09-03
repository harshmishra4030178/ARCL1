"use client";

const logo = "/assets/LOGO.png";
import { Link, useNavigate } from "../../../utils/navigation.jsx";
import { useAuthStore } from "../../../store/useAuthStore.js";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate("/admin/login");
  };

  return (
    <div className="bg-white shadow-xs px-6 py-3 flex justify-between items-center border-b border-gray-100">
      {/* Logo */}
      <div className="logo-section">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-16 mix-blend-darken object-contain" />
          <div className="flex flex-col text-[#021C57]">
            <p className="font-semibold text-sm">ARCL INSTRUMENTS</p>
            <p className="text-[9px] text-gray-500 font-medium">
              Admin Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Admin Profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-blue-500"
            />
          ) : (
            <FaUserCircle className="text-gray-400 text-xl" />
          )}
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              {user?.name || "Admin"}
            </p>
            <span className="text-[10px] text-blue-600 font-medium uppercase">
              {user?.role || "Administrator"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <FaSignOutAlt />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;