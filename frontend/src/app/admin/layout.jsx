"use client";

import { useEffect, useMemo } from "react";
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoginPage && !checkingAuth && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isLoginPage, checkingAuth, isAuthenticated, router]);

  // Live Heartbeat telemetry: keep admin presence active in real time (20s)
  useEffect(() => {
    if (!isAuthenticated || isLoginPage) return;

    // Send immediate heartbeat
    sendHeartbeatApi().catch(() => {});

    // Ping every 20 seconds for tight real-time presence
    const heartbeatInterval = setInterval(() => {
      sendHeartbeatApi().catch(() => {});
    }, 20000);

    // Send heartbeat when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeatApi().catch(() => {});
      }
    };

    // Immediately notify server when tab is closed or navigated away
    const handlePageLeave = () => {
      try {
        setPresenceOfflineApi().catch(() => {});
      } catch (e) {}
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageLeave);
    window.addEventListener("beforeunload", handlePageLeave);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageLeave);
      window.removeEventListener("beforeunload", handlePageLeave);
    };
  }, [isAuthenticated, isLoginPage]);

  const hasAccess = useMemo(() => {
    if (!user) return false;
    return checkPathAccess(pathname, user);
  }, [pathname, user]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
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
