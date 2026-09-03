import API from "./axios";

/**
 * Google Login
 */
export const googleLoginApi = (data) => API.post("/auth/google", data);

/**
 * Get current authenticated user profile
 */
export const getMeApi = () => API.get("/auth/me");
