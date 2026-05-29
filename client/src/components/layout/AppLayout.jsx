import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIAssistantPanel from "../ai/AIAssistantPanel";
import { useAuthStore } from "../../store/authStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useSocket } from "../../hooks/useSocket";
import toast from "react-hot-toast";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { user } = useAuthStore();
  const { currentWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const { currentProject, updateTaskStateLocally } = useProjectStore();
  const { addLiveNotification } = useNotificationStore();
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleAi = () => setAiOpen(!aiOpen);

  // Initialize Socket.io listeners
  const { socket } = useSocket(currentWorkspace?._id, currentProject?._id);

  useEffect(() => {
    const init = async () => {
      const list = await fetchWorkspaces();
      if (list.length === 0) {
        navigate("/workspace-setup");
      } else {
        setInitialized(true);
      }
    };
    init();
  }, [fetchWorkspaces, navigate]);

  // Hook into live events
  useEffect(() => {
    if (!socket) return;

    // Listen for task updates from drag-and-drop or other mutations
    socket.on("task-updated", (updatedTask) => {
      // Safely update state inside projectStore
      updateTaskStateLocally(updatedTask._id, updatedTask);
    });

    // Listen for notifications
    socket.on("notification", (notification) => {
      addLiveNotification(notification);
      toast(notification.message, {
        icon: "🔔",
        style: {
          background: "#11131e",
          color: "#f3f4f6",
          border: "1px solid #1e2235"
        }
      });
    });

    return () => {
      socket.off("task-updated");
      socket.off("notification");
    };
  }, [socket, updateTaskStateLocally, addLiveNotification]);

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-bg">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex relative overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Topbar toggleSidebar={toggleSidebar} toggleAi={toggleAi} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Panel Drawer */}
      <AIAssistantPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default AppLayout;

