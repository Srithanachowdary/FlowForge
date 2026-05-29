import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { useNotificationStore } from "../../store/notificationStore";
import { 
  Bell, 
  Menu, 
  FolderGit, 
  ChevronDown, 
  Check, 
  CheckCheck, 
  Plus,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const Topbar = ({ toggleSidebar, toggleAi }) => {
  const { currentWorkspace } = useWorkspaceStore();
  const { projects, currentProject, setCurrentProject, fetchProjects } = useProjectStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [showProjDropdown, setShowProjDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchProjects(currentWorkspace._id);
    }
  }, [currentWorkspace?._id, fetchProjects]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const selectProject = (proj) => {
    setCurrentProject(proj);
    setShowProjDropdown(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-dark-surface/80 border-b border-dark-border backdrop-blur-md">
      {/* Left side: Hamburger + Workspace/Project indicators */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded-lg md:hidden text-gray-400 hover:text-white hover:bg-dark-hover"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Project:
          </span>

          <div className="relative">
            <button
              onClick={() => setShowProjDropdown(!showProjDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 hover:bg-dark-hover text-sm font-medium text-white transition-all"
            >
              <FolderGit className="w-4 h-4 text-brand-500" />
              <span>{currentProject?.name || "All Projects"}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showProjDropdown && (
              <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-lg bg-dark-surface border border-dark-border shadow-2xl glass-panel py-1">
                <button
                  onClick={() => selectProject(null)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-dark-hover transition-colors ${!currentProject ? "text-brand-500 font-semibold" : "text-gray-300"}`}
                >
                  <span>All Projects</span>
                  {!currentProject && <Check className="w-4 h-4" />}
                </button>

                <div className="border-t border-dark-border my-1"></div>

                <div className="max-h-48 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => selectProject(p)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-dark-hover transition-colors ${currentProject?._id === p._id ? "text-brand-500 font-semibold" : "text-gray-300"}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: p.color || "#3b82f6" }}
                        />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {currentProject?._id === p._id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-dark-border mt-1">
                  <Link
                    to="/projects"
                    onClick={() => setShowProjDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-brand-500 hover:bg-dark-hover transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage Projects</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Notifications Bell + AI toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAi}
          className="p-2 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-dark-hover transition-all cursor-pointer"
          title="AI Agile Assistant"
        >
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-all cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>


          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg bg-dark-surface border border-dark-border shadow-2xl glass-panel overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border bg-dark-bg/40">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-dark-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      onClick={() => markAsRead(n._id)}
                      className={`p-3 text-left hover:bg-dark-hover transition-colors cursor-pointer ${!n.isRead ? "bg-brand-500/5" : ""}`}
                    >
                      <p className="text-xs text-gray-200 font-medium leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-gray-500 block mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
