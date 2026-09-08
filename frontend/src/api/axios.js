import axios from "axios";

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

// Response interceptor to handle token expiry / unauthorized access
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes("/auth/");
      const isAdminRoute = window.location.pathname.startsWith("/admin");

      if (!isAuthRoute && isAdminRoute && window.location.pathname !== "/admin/login") {
        localStorage.removeItem("arcl_admin_token");
        localStorage.removeItem("arcl_admin_user");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;