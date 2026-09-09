import API from "./axios";

/**
 * Google Login
 */
export const googleLoginApi = (data) => API.post("/auth/google", data);

/**
 * Direct Email / Password Login (Super Admin)
 */
export const loginWithPasswordApi = (data) => API.post("/auth/login", data);

/**
 * Get current authenticated user profile
 */
export const getMeApi = () => API.get("/auth/me");
