"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import QuoteCartDrawer from "../components/quoteCart/QuoteCartDrawer";
import FloatingQuoteCartButton from "../components/quoteCart/FloatingQuoteCartButton";
import FloatingContactButtons from "../components/common/FloatingContactButtons";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isPdfPage = pathname?.includes("/catalog") && pathname?.startsWith("/products/");

  if (isAdmin || isPdfPage) {
    return (
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
    );
  }

  return (
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
      <FloatingContactButtons />
    </Suspense>
  );
}

