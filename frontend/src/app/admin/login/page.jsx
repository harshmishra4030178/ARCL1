import { Suspense } from "react";
import AdminLoginClient from "../../../views/admin/AdminLogin.jsx";

export const metadata = {
  title: "Admin Portal Sign In | ARCL Instruments",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <AdminLoginClient />
    </Suspense>
  );
}
