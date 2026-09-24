"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useVisitorTracker } from "../hooks/useVisitorTracker";
import { initClientErrorLogger } from "../utils/clientErrorLogger.js";
import { ErrorBoundary } from "../components/common/ErrorBoundary.jsx";

const ToastWrapper = dynamic(
  () => import("../components/common/ToastWrapper"),
  { ssr: false }
);
const QuoteCartDrawer = dynamic(
  () => import("../components/quoteCart/QuoteCartDrawer"),
  { ssr: false }
);
const CompareFloatingBar = dynamic(
  () => import("../components/common/CompareFloatingBar"),
  { ssr: false }
);
const ArclAiAssistant = dynamic(
  () => import("../components/ai/ArclAiAssistant"),
  { ssr: false }
);
const FloatingQuoteCartButton = dynamic(
  () => import("../components/quoteCart/FloatingQuoteCartButton"),
  { ssr: false }
);
const FloatingContactButtons = dynamic(
  () => import("../components/common/FloatingContactButtons"),
  { ssr: false }
);

export default function ClientLayout({ children }) {
  useVisitorTracker();
  const [mountIdleWidgets, setMountIdleWidgets] = useState(false);

  useEffect(() => {
    initClientErrorLogger();

    // Mount background floating widgets during browser idle to avoid blocking the main thread during initial page load
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(() => setMountIdleWidgets(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(() => setMountIdleWidgets(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPdfPage = pathname?.includes("/catalog") && pathname?.startsWith("/products/");

  if (isAdmin || isPdfPage) {
    return (
      <ErrorBoundary>
        <Suspense fallback={null}>
          {mountIdleWidgets && <ToastWrapper />}
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Navbar />
        {children}
        <Footer />
        {mountIdleWidgets && (
          <>
            <ToastWrapper />
            <QuoteCartDrawer />
            <FloatingQuoteCartButton />
            <CompareFloatingBar />
            <ArclAiAssistant />
            <FloatingContactButtons />
          </>
        )}
      </Suspense>
    </ErrorBoundary>
  );
}
