import { create } from "zustand";
import axiosInstance from "../api/axios";

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [], // Store active tasks for current board view
  sprints: [],
  loading: false,
  error: null,

  fetchProjects: async (workspaceId) => {
    if (!workspaceId) return;
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/workspaces/${workspaceId}/projects`);
      set({ projects: res.data.data, loading: false });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load projects";
      set({ loading: false, error: errMsg });
      return [];
    }
  },

  createProject: async (workspaceId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/projects`, data);
      const newProj = res.data.data;
      set((state) => ({
        projects: [...state.projects, newProj],
        loading: false
      }));
      return newProj;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to create project";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project, tasks: [], sprints: [] });
  },

  fetchProjectDetail: async (workspaceId, projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/workspaces/${workspaceId}/projects/${projectId}`);
      set({ currentProject: res.data.data, loading: false });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load project details";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  updateProject: async (workspaceId, projectId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.patch(`/workspaces/${workspaceId}/projects/${projectId}`, data);
      const updated = res.data.data;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        currentProject: state.currentProject?._id === projectId ? updated : state.currentProject,
        loading: false
      }));
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update project";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  deleteProject: async (workspaceId, projectId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== projectId),
        currentProject: state.currentProject?._id === projectId ? null : state.currentProject,
        loading: false
      }));
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete project";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  // --- Task Mappings ---
  fetchTasks: async (workspaceId, projectId) => {
    if (!workspaceId || !projectId) return;
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
      set({ tasks: res.data.data, loading: false });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load tasks";
      set({ loading: false, error: errMsg });
      return [];
    }
  },

  createTask: async (workspaceId, projectId, taskData) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, taskData);
      const newTask = res.data.data;
      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false
      }));
      return newTask;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to create task";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  updateTask: async (workspaceId, projectId, taskId, taskData) => {
    try {
      const res = await axiosInstance.patch(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, taskData);
      const updatedTask = res.data.data;
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? updatedTask : t))
      }));
      return updatedTask;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update task";
      throw new Error(errMsg);
    }
  },

  // Optimistic updates for Socket.io syncing
  updateTaskStateLocally: (taskId, updateFields) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === taskId ? { ...t, ...updateFields } : t))
    }));
  },

  deleteTask: async (workspaceId, projectId, taskId) => {
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId)
      }));
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete task";
      throw new Error(errMsg);
    }
  },

  // --- Comments ---
  addComment: async (workspaceId, projectId, taskId, content) => {
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`, { content });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to add comment";
      throw new Error(errMsg);
    }
  },

  deleteComment: async (workspaceId, projectId, taskId, commentId) => {
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete comment";
      throw new Error(errMsg);
    }
  },

  // --- Sprints ---
  fetchSprints: async (workspaceId, projectId) => {
    if (!workspaceId || !projectId) return;
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/workspaces/${workspaceId}/projects/${projectId}/sprints`);
      set({ sprints: res.data.data, loading: false });
      return res.data.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to load sprints";
      set({ loading: false, error: errMsg });
      return [];
    }
  },

  createSprint: async (workspaceId, projectId, sprintData) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/projects/${projectId}/sprints`, sprintData);
      const newSprint = res.data.data;
      set((state) => ({
        sprints: [...state.sprints, newSprint],
        loading: false
      }));
      return newSprint;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to create sprint";
      set({ loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  startSprint: async (workspaceId, projectId, sprintId, data) => {
    try {
      const res = await axiosInstance.patch(`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprintId}/start`, data);
      const updatedSprint = res.data.data.sprint;
      const updatedTasks = res.data.data.tasks || [];
      set((state) => ({
        sprints: state.sprints.map((s) => (s._id === sprintId ? updatedSprint : s)),
        tasks: state.tasks.map((t) => {
          const matchingUpdated = updatedTasks.find((ut) => ut._id === t._id);
          return matchingUpdated ? matchingUpdated : t;
        })
      }));
      return updatedSprint;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to start sprint";
      throw new Error(errMsg);
    }
  },

  completeSprint: async (workspaceId, projectId, sprintId) => {
    try {
      const res = await axiosInstance.patch(`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprintId}/complete`);
      const updatedSprint = res.data.data.sprint;
      const updatedTasks = res.data.data.tasks || [];
      set((state) => ({
        sprints: state.sprints.map((s) => (s._id === sprintId ? updatedSprint : s)),
        tasks: state.tasks.map((t) => {
          const matchingUpdated = updatedTasks.find((ut) => ut._id === t._id);
          return matchingUpdated ? matchingUpdated : t;
        })
      }));
      return updatedSprint;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to complete sprint";
      throw new Error(errMsg);
    }
  },

  addTasksToSprint: async (workspaceId, projectId, sprintId, taskIds) => {
    try {
      const res = await axiosInstance.post(`/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprintId}/tasks`, { taskIds });
      const updatedSprint = res.data.data.sprint;
      const updatedTasks = res.data.data.tasks || [];
      set((state) => ({
        sprints: state.sprints.map((s) => (s._id === sprintId ? updatedSprint : s)),
        tasks: state.tasks.map((t) => {
          const matchingUpdated = updatedTasks.find((ut) => ut._id === t._id);
          return matchingUpdated ? matchingUpdated : t;
        })
      }));
      return updatedSprint;
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to assign tasks to sprint";
      throw new Error(errMsg);
    }
  }
}));
