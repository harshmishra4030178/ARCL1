"use client";

import API from "../api/axios.js";

let isInitialized = false;
let lastReportedTime = 0;
const reportedSignatures = new Set();

/**
 * Silently sends error report to backend client ingestion endpoint
 */
export const reportClientError = async ({
  message,
  stack = "",
  source = "frontend",
  statusCode = 500,
  method = "",
  severity = "error",
  metadata = {},
}) => {
  if (typeof window === "undefined" || !message) return;

  const errorString = String(message).trim();

  // Ignore benign third-party or browser extension errors
  if (
    errorString.includes("ResizeObserver loop") ||
    errorString.includes("Extension context invalidated") ||
    errorString.includes("chrome-extension://") ||
    errorString.includes("moz-extension://") ||
    errorString.includes("Non-Error promise rejection")
  ) {
    return;
  }

  // Deduplicate errors in memory within 8 seconds
  const signature = `${errorString}_${window.location.pathname}`;
  const now = Date.now();
  if (reportedSignatures.has(signature) && now - lastReportedTime < 8000) {
    return;
  }

  reportedSignatures.add(signature);
  lastReportedTime = now;

  if (reportedSignatures.size > 50) {
    reportedSignatures.clear();
  }

  const payload = {
    message: errorString,
    stack: stack ? String(stack) : "",
    source: source || "frontend",
    statusCode: typeof statusCode === "number" ? statusCode : 500,
    method: method || "",
    url: window.location.href,
    route: window.location.pathname,
    severity,
    metadata: {
      ...metadata,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      time: new Date().toISOString(),
    },
  };

  try {
    API.post("/client/error-logs", payload).catch(() => {
      // Fallback via direct fetch
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      let baseUrl = "http://localhost:5000/api/v1";
      if (envUrl && envUrl.startsWith("http")) {
        baseUrl = envUrl;
      } else if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
        baseUrl = "https://arcl1-1.onrender.com/api/v1";
      }

      fetch(`${baseUrl}/client/error-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    });
  } catch (e) {
    // Silent fail
  }
};

/**
 * Initializes global client-side error listeners
 */
export const initClientErrorLogger = () => {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // Window error event
  window.addEventListener("error", (event) => {
    const message = event.message || event.error?.message || "Unknown Browser Runtime Error";
    const stack = event.error?.stack || `${event.filename || ""}:${event.lineno || ""}:${event.colno || ""}`;
    reportClientError({
      message,
      stack,
      source: "frontend",
      severity: "error",
      metadata: { type: "window.onerror" },
    });
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      typeof reason === "string"
        ? reason
        : reason?.message || "Unhandled Promise Rejection";
    const stack = reason?.stack || "";
    reportClientError({
      message,
      stack,
      source: "frontend",
      severity: "warning",
      metadata: { type: "unhandledrejection" },
    });
  });
};
