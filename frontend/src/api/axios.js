import axios from "axios";

const getBaseURL = () => {
  let envUrl =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL);

  // In browser, check if running on production domain (e.g. Vercel)
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isLocalhost && (!envUrl || envUrl.includes("localhost"))) {
      return "https://arcl.onrender.com/api/v1";
    }
  }

  // In Node/SSR environment
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    if (!envUrl || envUrl.includes("localhost")) {
      return "https://arcl.onrender.com/api/v1";
    }
  }

  let url = envUrl || "http://localhost:5000/api/v1";
  url = String(url).trim().replace(/\/+$/, "");
  if (!url.endsWith("/api/v1") && !url.includes("/api/")) {
    url += "/api/v1";
  }
  return url;
};

const API = axios.create({
  baseURL: getBaseURL(),
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