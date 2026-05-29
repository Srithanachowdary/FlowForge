import { create } from "zustand";
import axiosInstance from "../api/axios";
import { useAuthStore } from "./authStore";

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/workspaces");
      const list = res.data.data;
      set({ workspaces: list, loading: false });

      // If active workspace is set on user and exists in list, set it
      const activeWsId = useAuthStore.getState().user?.activeWorkspace;
      let selectedWorkspace = null;
      if (activeWsId) {
        selectedWorkspace = list.find((w) => w._id === activeWsId) || null;
      }
      if (!selectedWorkspace && list.length > 0) {
        selectedWorkspace = list[0];
      }
      if (selectedWorkspace) {
        set({ currentWorkspace: selectedWorkspace });
        if (activeWsId !== selectedWorkspace._id) {
          useAuthStore.getState().updateUser({ activeWorkspace: selectedWorkspace._id });
        }
      }
      return list;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load workspaces";
      set({ loading: false, error: errMsg });
      return [];
    }
  },

  createWorkspace: async (name, logo = "") => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post("/workspaces", { name, logo });
      const newWs = res.data.data;
      set((state) => ({
        workspaces: [...state.workspaces, newWs],
        currentWorkspace: newWs,
        loading: false
      }));
      // Update active workspace in Auth store
      useAuthStore.getState().updateUser({ activeWorkspace: newWs._id });
      return newWs;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to create workspace";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
    if (workspace) {
      useAuthStore.getState().updateUser({ activeWorkspace: workspace._id });
    }
  },

  fetchWorkspaceDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/workspaces/${id}`);
      const detail = res.data.data;
      set({ currentWorkspace: detail, loading: false });
      return detail;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load workspace details";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  updateWorkspace: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.patch(`/workspaces/${id}`, data);
      const updated = res.data.data;
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w._id === id ? updated : w)),
        currentWorkspace: state.currentWorkspace?._id === id ? { ...state.currentWorkspace, ...updated } : state.currentWorkspace,
        loading: false
      }));
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update workspace";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  deleteWorkspace: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/workspaces/${id}`);
      set((state) => {
        const nextList = state.workspaces.filter((w) => w._id !== id);
        const nextActive = nextList.length > 0 ? nextList[0] : null;
        return {
          workspaces: nextList,
          currentWorkspace: nextActive,
          loading: false
        };
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete workspace";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  inviteMember: async (workspaceId, email, role) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/invite`, { email, role });
      set({ loading: false });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invitation failed";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  joinWorkspace: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/workspaces/join/${token}`);
      set({ loading: false });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to join workspace";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  changeMemberRole: async (workspaceId, userId, role) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
      const updatedMembers = res.data.data;
      set((state) => ({
        currentWorkspace: state.currentWorkspace?._id === workspaceId 
          ? { ...state.currentWorkspace, members: updatedMembers } 
          : state.currentWorkspace,
        loading: false
      }));
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to change member role";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  removeMember: async (workspaceId, userId) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.delete(`/workspaces/${workspaceId}/members/${userId}`);
      const updatedMembers = res.data.data;
      set((state) => ({
        currentWorkspace: state.currentWorkspace?._id === workspaceId 
          ? { ...state.currentWorkspace, members: updatedMembers } 
          : state.currentWorkspace,
        loading: false
      }));
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to remove member";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  }
}));
