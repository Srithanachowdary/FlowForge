import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocket = (workspaceId, projectId) => {
  const socketRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.io server
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socketRef.current.on("connect", () => {
      console.log(`🔌 Socket connected: ${socketRef.current.id}`);

      // Join Workspace room if selected
      if (workspaceId) {
        socketRef.current.emit("join-workspace", workspaceId);
      }

      // Join Project room if selected
      if (projectId) {
        socketRef.current.emit("join-project", projectId);
      }
    });

    // Cleanup connection
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, workspaceId, projectId]);

  // Helper function to register dynamic listeners
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  // Helper function to remove dynamic listeners
  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  // Helper function to emit events
  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return { socket: socketRef.current, on, off, emit };
};
