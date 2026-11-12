import { Suspense } from "react";
import CertificateVerifyPortal from "../../views/CertificateVerifyPortal.jsx";

export const metadata = {
  title: "NABL Certificate & Scope Verification Portal | ARCL Instruments",
  description:
    "Verify official ARCL NABL Calibration Certificates, view live ISO/IEC 17025 NABL Accredited Scope, and visit the official ARCL Instruments website.",
};

export default function CertificateVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm font-bold">
          Loading ARCL QR Verification Dashboard...
        </div>
      }
    >
      <CertificateVerifyPortal />
    </Suspense>
  );
}
