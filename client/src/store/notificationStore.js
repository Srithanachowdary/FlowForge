import { create } from "zustand";
import axiosInstance from "../api/axios";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/notifications");
      const list = res.data.data;
      const unread = list.filter((n) => !n.isRead).length;
      set({ notifications: list, unreadCount: unread, loading: false });
      return list;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load notifications";
      set({ loading: false, error: errMsg });
      return [];
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length
        };
      });
    } catch (err) {
      console.error("Failed to mark notification as read: ", err);
    }
  },

  markAllAsRead: async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error("Failed to mark all as read: ", err);
    }
  },

  // Live Socket push handler
  addLiveNotification: (notification) => {
    set((state) => {
      const alreadyExists = state.notifications.some((n) => n._id === notification._id);
      if (alreadyExists) return {};
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length
      };
    });
  }
}));
