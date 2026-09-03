import { create } from "zustand";
import { googleLoginApi, getMeApi } from "../api/authApi";

const getSavedToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("arcl_admin_token") || null;
  } catch {
    return null;
  }
};

const getSavedUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("arcl_admin_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  token: getSavedToken(),
  user: getSavedUser(),
  isAuthenticated: !!getSavedToken(),
  loading: false,
  checkingAuth: true,
  error: null,

  // =========================
  // LOGIN WITH GOOGLE
  // =========================
  loginWithGoogle: async (payload) => {
    try {
      set({ loading: true, error: null });

      const res = await googleLoginApi(payload);
      const data = res.data;

      if (data.success && data.token) {
        localStorage.setItem("arcl_admin_token", data.token);
        localStorage.setItem("arcl_admin_user", JSON.stringify(data.user));

        set({
          token: data.token,
          user: data.user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });

        return data.user;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login with Google error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Authentication failed";

      set({
        error: errorMessage,
        loading: false,
        isAuthenticated: false,
      });

      throw new Error(errorMessage);
    }
  },

  // =========================
  // CHECK AUTH / VERIFY SESSION
  // =========================
  checkAuth: async () => {
    const token = getSavedToken();

    if (!token) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        checkingAuth: false,
      });
      return false;
    }

    try {
      set({ checkingAuth: true });
      const res = await getMeApi();

      if (res.data?.success && res.data?.user) {
        localStorage.setItem("arcl_admin_user", JSON.stringify(res.data.user));
        set({
          user: res.data.user,
          isAuthenticated: true,
          checkingAuth: false,
        });
        return true;
      }
      throw new Error("Invalid session");
    } catch (err) {
      console.warn("Session check failed, logging out:", err.message);
      get().logout();
      set({ checkingAuth: false });
      return false;
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: () => {
    try {
      localStorage.removeItem("arcl_admin_token");
      localStorage.removeItem("arcl_admin_user");
    } catch (e) {}

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // =========================
  // CLEAR ERROR
  // =========================
  clearError: () => set({ error: null }),
}));
