import axios from "axios";
import { reportClientError } from "../utils/clientErrorLogger.js";

const getBaseURL = () => {
  const envUrl =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL);

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "";
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".local");

    if (isLocal) {
      if (envUrl && envUrl.includes("localhost")) {
        return envUrl;
      }
      return `http://${hostname === "0.0.0.0" ? "localhost" : hostname}:5000/api/v1`;
    }

    if (envUrl) {
      let url = String(envUrl).trim().replace(/\/+$/, "");
      if (!url.endsWith("/api/v1") && !url.includes("/api/")) {
        url += "/api/v1";
      }
      return url;
    }

    return "https://arcl1-1.onrender.com/api/v1";
  }

  // Server-side (SSR / Node.js)
  if (envUrl) {
    let url = String(envUrl).trim().replace(/\/+$/, "");
    if (!url.endsWith("/api/v1") && !url.includes("/api/")) {
      url += "/api/v1";
    }
    return url;
  }

  return "http://127.0.0.1:5000/api/v1";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

// Request interceptor to attach Bearer token
API.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("arcl_admin_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Failed to retrieve token from storage:", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry & AUTOMATICALLY LOG API FAILURES
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isErrorLogEndpoint = url.includes("/client/error-logs") || url.includes("/admin/error-logs");

    if (typeof window !== "undefined" && error.response?.status === 401) {
      const isAuthRoute = url.includes("/auth/");
      const isAdminRoute = window.location.pathname.startsWith("/admin");

      if (!isAuthRoute && isAdminRoute && window.location.pathname !== "/admin/login") {
        localStorage.removeItem("arcl_admin_token");
        localStorage.removeItem("arcl_admin_user");
        window.location.href = "/admin/login";
      }
    }

    // Capture and automatically report any API failure across the website
    if (!isErrorLogEndpoint) {
      try {
        const status = error.response?.status;
        const method = (error.config?.method || "GET").toUpperCase();
        const resMessage = error.response?.data?.message || error.message || "API Request Failed";
        const severity = !status || status >= 500 ? "critical" : status >= 400 ? "warning" : "error";

        reportClientError({
          message: `API ${method} ${url} [${status || "NETWORK_ERROR"}]: ${resMessage}`,
          stack: error.stack || "",
          source: "api",
          statusCode: status || 0,
          method,
          severity,
          metadata: {
            endpoint: url,
            status,
            method,
            responseData: error.response?.data,
          },
        });
      } catch (e) {
        // Ignored
      }
    }

    return Promise.reject(error);
  }
);

export default API;
