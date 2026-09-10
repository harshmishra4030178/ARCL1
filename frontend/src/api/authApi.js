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

/**
 * Send heartbeat ping to maintain online status
 */
export const sendHeartbeatApi = () => API.post("/auth/heartbeat");

/**
 * Notify server user is offline immediately on leave
 */
export const setPresenceOfflineApi = () => API.post("/auth/offline");

/**
 * Get real-time active / online admins presence list
 */
export const getActiveAdminsApi = () => API.get("/auth/active-admins");
