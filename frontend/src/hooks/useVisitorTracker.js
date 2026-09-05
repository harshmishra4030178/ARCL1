"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackVisitorApi } from "../api/analyticsApi.js";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;

  try {
    let sid = sessionStorage.getItem("arcl_visitor_session");
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      sessionStorage.setItem("arcl_visitor_session", sid);
    }
    return sid;
  } catch (e) {
    return "sess_" + Math.random().toString(36).substring(2, 11);
  }
}

function detectClientDevice() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

export function useVisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    if (!pathname) return;

    // Do not track internal admin portal paths
    if (pathname.startsWith("/admin")) return;

    // Avoid double firing for the exact same path without change
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const screenResolution =
      typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "";

    const referrer =
      typeof document !== "undefined" ? document.referrer || "" : "";

    const clientDevice = detectClientDevice();

    // Fire non-blocking tracking request
    trackVisitorApi({
      sessionId,
      path: pathname,
      referrer,
      screenResolution,
      clientDevice,
    });
  }, [pathname]);
}
