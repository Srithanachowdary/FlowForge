import { create } from "zustand";
import axiosInstance from "../api/axios";

export const useAuthStore = create((set, get) => {
  // Listen for JWT expiration event from Axios interceptor
  if (typeof window !== "undefined") {
    window.addEventListener("auth-expired", () => {
      set({ user: null, isAuthenticated: false, token: null });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    token: localStorage.getItem("accessToken") || null,
    loading: false,
    error: null,

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    register: async (name, email, password) => {
      set({ loading: true, error: null });
      try {
        const res = await axiosInstance.post("/auth/register", { name, email, password });
        set({ loading: false });
        return res.data;
      } catch (err) {
        const errMsg = err.response?.data?.message || "Registration failed";
        set({ loading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const res = await axiosInstance.post("/auth/login", { email, password });
        const { user, accessToken } = res.data.data;
        
        localStorage.setItem("accessToken", accessToken);
        set({ user, token: accessToken, isAuthenticated: true, loading: false });
        return res.data;
      } catch (err) {
        const errMsg = err.response?.data?.message || "Login failed";
        set({ loading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    logout: async () => {
      set({ loading: true });
      try {
        await axiosInstance.post("/auth/logout");
      } catch (err) {
        console.error("Logout request failed: ", err);
      } finally {
        localStorage.removeItem("accessToken");
        set({ user: null, token: null, isAuthenticated: false, loading: false });
      }
    },

    verifyEmail: async (token) => {
      set({ loading: true, error: null });
      try {
        const res = await axiosInstance.get(`/auth/verify-email/${token}`);
        set({ loading: false });
        return res.data;
      } catch (err) {
        const errMsg = err.response?.data?.message || "Email verification failed";
        set({ loading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    fetchMe: async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        set({ isAuthenticated: false, user: null });
        return null;
      }
      set({ loading: true });
      try {
        const res = await axiosInstance.get("/auth/me");
        set({ user: res.data.data, isAuthenticated: true, loading: false });
        return res.data.data;
      } catch (err) {
        localStorage.removeItem("accessToken");
        set({ user: null, token: null, isAuthenticated: false, loading: false });
        return null;
      }
    },

    forgotPassword: async (email) => {
      set({ loading: true, error: null });
      try {
        const res = await axiosInstance.post("/auth/forgot-password", { email });
        set({ loading: false });
        return res.data;
      } catch (err) {
        const errMsg = err.response?.data?.message || "Password reset request failed";
        set({ loading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    resetPassword: async (token, password) => {
      set({ loading: true, error: null });
      try {
        const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
        set({ loading: false });
        return res.data;
      } catch (err) {
        const errMsg = err.response?.data?.message || "Password reset failed";
        set({ loading: false, error: errMsg });
        throw new Error(errMsg);
      }
    },

    updateUser: (userData) => {
      set((state) => ({ user: { ...state.user, ...userData } }));
    }
  };
});
