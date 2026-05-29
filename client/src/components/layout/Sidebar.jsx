import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useAuthStore } from "../../store/authStore";
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Layers, 
  Users, 
  CreditCard, 
  Settings, 
  Plus, 
  ChevronDown, 
  FolderGit, 
  Menu,
  LogOut
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [showWSList, setShowWSList] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: FolderGit },
    { name: "Kanban Board", path: "/board", icon: KanbanSquare },
    { name: "Sprints & Backlog", path: "/sprints", icon: Layers },
    { name: "Members", path: "/members", icon: Users },
    { name: "Billing & Plans", path: "/billing", icon: CreditCard },
  ];

  const handleWorkspaceChange = (ws) => {
    setCurrentWorkspace(ws);
    setShowWSList(false);
    navigate("/");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-dark-surface border-r border-dark-border transition-transform duration-300 transform md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-tr from-brand-600 to-indigo-500 font-display font-extrabold text-white text-lg">
              Z
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">Zive</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="relative px-4 py-4 border-b border-dark-border">
          <button 
            onClick={() => setShowWSList(!showWSList)}
            className="flex items-center justify-between w-full p-2 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 hover:bg-dark-hover transition-all text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-900/60 font-semibold text-indigo-300 text-xs shrink-0">
                {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : "WS"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {currentWorkspace?.name || "Select Workspace"}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {currentWorkspace?.plan || "free"} Plan
                </p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showWSList ? "rotate-180" : ""}`} />
          </button>

          {showWSList && (
            <div className="absolute top-full left-4 right-4 z-50 mt-1 py-1 rounded-lg bg-dark-surface border border-dark-border shadow-2xl glass-panel max-h-60 overflow-y-auto">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Workspaces
              </p>
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => handleWorkspaceChange(ws)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-dark-hover transition-colors ${currentWorkspace?._id === ws._id ? "text-brand-500 font-semibold" : "text-gray-300"}`}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-950 font-semibold text-indigo-400 text-xs shrink-0">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
              <div className="border-t border-dark-border mt-1">
                <Link
                  to="/workspace-setup"
                  onClick={() => setShowWSList(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-brand-500 hover:bg-dark-hover transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Routes */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-brand-500/10 text-brand-500 border-l-2 border-brand-500 font-semibold" : "text-gray-400 hover:text-white hover:bg-dark-hover"}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Workspace Info Footer */}
        <div className="p-4 border-t border-dark-border bg-dark-bg/25">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 font-bold shrink-0">
                {user?.name ? user.name.substring(0, 1).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
