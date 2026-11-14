"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../store/useAuthStore.js";
import Sidebar from "../../components/admin/layout/Sidebar";
import Navbar from "../../components/admin/layout/Navbar";
import { checkPathAccess } from "../../utils/rbac.js";
import { FaLock } from "react-icons/fa";

import { sendHeartbeatApi, setPresenceOfflineApi } from "../../api/authApi.js";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { user, isAuthenticated, checkingAuth, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  useEffect(() => {
    if (mounted && !isLoginPage && !checkingAuth && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [mounted, isLoginPage, checkingAuth, isAuthenticated, router]);

  // Live Heartbeat telemetry & continuous Office WiFi protection
  useEffect(() => {
    if (!isAuthenticated || isLoginPage) return;

    const rawScope = String(user?.accessScope || "").trim().toUpperCase();
    const isOfficeOnly = rawScope === "OFFICE_ONLY";

    const pingCheck = () => {
      sendHeartbeatApi().catch((err) => {
        if (err.response?.data?.isWifiRevoked) {
          try {
            localStorage.removeItem("arcl_admin_token");
            localStorage.removeItem("arcl_admin_user");
            sessionStorage.setItem(
              "arcl_wifi_logout_notice",
              err.response?.data?.message ||
                "Company Office WiFi disconnect ho gaya hai! Suraksha niyam ke anusaar session band kar diya gaya hai."
            );
          } catch (e) {}
          window.location.href = "/admin/login?reason=wifi_disconnected";
        }
      });
    };

    // Immediate heartbeat
    pingCheck();

    // Ping every 10 seconds for Office-Only users (tight security), 20s for general presence
    const intervalMs = isOfficeOnly ? 10000 : 20000;
    const heartbeatInterval = setInterval(pingCheck, intervalMs);

    // Send heartbeat when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pingCheck();
      }
    };

    // If device network disconnects (turns off WiFi / ethernet):
    const handleOffline = () => {
      if (isOfficeOnly) {
        try {
          localStorage.removeItem("arcl_admin_token");
          localStorage.removeItem("arcl_admin_user");
          sessionStorage.setItem(
            "arcl_wifi_logout_notice",
            "Aapka device network se disconnect ho gaya hai! Company Office WiFi chhootne par suraksha niyam ke anusaar session turant band kar diya gaya hai."
          );
        } catch (e) {}
        window.location.href = "/admin/login?reason=wifi_disconnected";
      }
    };

    // If device connects to a new network (e.g. mobile hotspot / different WiFi):
    // Ping immediately to verify if the new IP is authorized!
    const handleOnline = () => {
      pingCheck();
    };

    // Immediately notify server when tab is closed or navigated away
    const handlePageLeave = () => {
      try {
        setPresenceOfflineApi().catch(() => {});
      } catch (e) {}
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageLeave);
    window.addEventListener("beforeunload", handlePageLeave);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageLeave);
      window.removeEventListener("beforeunload", handlePageLeave);
    };
  }, [isAuthenticated, isLoginPage, user]);

  const hasAccess = useMemo(() => {
    if (!user) return false;
    return checkPathAccess(pathname, user);
  }, [pathname, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#021C57] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Verifying admin session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#021C57] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {hasAccess ? (
            children
          ) : (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
              <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full space-y-5">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner border border-amber-200">
                  <FaLock />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
                    Access Restricted
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    You do not have permission to access this section of the Admin panel. Please contact your Super Administrator to grant you the required module permissions.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#021C57] hover:bg-blue-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                  >
                    <span>Return to Admin Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
