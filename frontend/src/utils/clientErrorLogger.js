"use client";

let isInitialized = false;
let lastReportedTime = 0;
const reportedSignatures = new Set();

/**
 * Silently sends error report to backend client ingestion endpoint
 */
export const reportClientError = async ({
  message,
  stack = "",
  severity = "error",
  metadata = {},
}) => {
  if (typeof window === "undefined" || !message) return;

  const errorString = String(message).trim();

  // Ignore common benign third-party or browser extension errors
  if (
    errorString.includes("ResizeObserver loop") ||
    errorString.includes("Extension context invalidated") ||
    errorString.includes("chrome-extension://") ||
    errorString.includes("moz-extension://") ||
    errorString.includes("Non-Error promise rejection")
  ) {
    return;
  }

  // Deduplicate errors in memory
  const signature = `${errorString}_${window.location.pathname}`;
  const now = Date.now();
  if (reportedSignatures.has(signature) && now - lastReportedTime < 15000) {
    return;
  }

  reportedSignatures.add(signature);
  lastReportedTime = now;

  // Cleanup signature set if too large
  if (reportedSignatures.size > 50) {
    reportedSignatures.clear();
  }

  try {
    const payload = {
      message: errorString,
      stack: stack ? String(stack) : "",
      url: window.location.href,
      route: window.location.pathname,
      severity,
      metadata: {
        ...metadata,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        time: new Date().toISOString(),
      },
    };

    // Determine backend base URL
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    let baseUrl = "http://localhost:5000/api/v1";
    if (envUrl && envUrl.startsWith("http")) {
      baseUrl = envUrl;
    } else if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
      baseUrl = "https://arcl1-1.onrender.com/api/v1";
    }

    // Send error report via fetch
    fetch(`${baseUrl}/client/error-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      // Fallback to sendBeacon if fetch fails
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon(`${baseUrl}/client/error-logs`, blob);
      }
    });
  } catch (e) {
    // Silent fail
  }
};

/**
 * Initializes global client-side listeners on window.onerror and unhandledrejection
 */
export const initClientErrorLogger = () => {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  window.addEventListener("error", (event) => {
    const message = event.message || event.error?.message || "Unknown Runtime Error";
    const stack = event.error?.stack || `${event.filename || ""}:${event.lineno || ""}:${event.colno || ""}`;
    reportClientError({
      message,
      stack,
      severity: "error",
      metadata: { type: "window.onerror" },
    });
  });

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
      severity: "warning",
      metadata: { type: "unhandledrejection" },
    });
  });
};
