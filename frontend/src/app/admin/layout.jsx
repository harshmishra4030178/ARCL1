"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../store/useAuthStore.js";
import Sidebar from "../../components/admin/layout/Sidebar";
import Navbar from "../../components/admin/layout/Navbar";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { isAuthenticated, checkingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoginPage && !checkingAuth && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isLoginPage, checkingAuth, isAuthenticated, router]);

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
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
