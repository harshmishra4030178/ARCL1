"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useVisitorTracker } from "../hooks/useVisitorTracker";
import { initClientErrorLogger } from "../utils/clientErrorLogger.js";
import { ErrorBoundary } from "../components/common/ErrorBoundary.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  useEffect(() => {
    initClientErrorLogger();
  }, []);

  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPdfPage = pathname?.includes("/catalog") && pathname?.startsWith("/products/");

  if (isAdmin || isPdfPage) {
    return (
      <ErrorBoundary>
        <Suspense fallback={null}>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 999999 }}
          />
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 999999 }}
        />
        <Navbar />
        {children}
        <Footer />
        <QuoteCartDrawer />
        <FloatingQuoteCartButton />
        <CompareFloatingBar />
        <ArclAiAssistant />
        <FloatingContactButtons />
      </Suspense>
    </ErrorBoundary>
  );
}
