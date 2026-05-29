import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Layers, 
  KanbanSquare, 
  Users, 
  ArrowRight,
  TrendingUp,
  FolderGit2,
  CheckCircle2,
  Clock,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const Dashboard = () => {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { projects, tasks, fetchProjects, fetchTasks } = useProjectStore();

  const [metrics, setMetrics] = useState({
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
    total: 0
  });

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchProjects(currentWorkspace._id);
      fetchTasks(currentWorkspace._id, "all"); // fetch all tasks
    }
  }, [currentWorkspace?._id, fetchProjects, fetchTasks]);

  useEffect(() => {
    if (tasks.length > 0) {
      const todo = tasks.filter(t => t.status === "todo").length;
      const in_progress = tasks.filter(t => t.status === "in_progress").length;
      const review = tasks.filter(t => t.status === "review").length;
      const done = tasks.filter(t => t.status === "done").length;
      setMetrics({
        todo,
        in_progress,
        review,
        done,
        total: tasks.length
      });
    } else {
      setMetrics({ todo: 0, in_progress: 0, review: 0, done: 0, total: 0 });
    }
  }, [tasks]);

  const quickLinks = [
    { name: "Kanban Board", desc: "Drag-and-drop tasks real-time", path: "/board", icon: KanbanSquare, color: "text-brand-500 bg-brand-500/10" },
    { name: "Sprints Backlog", desc: "Triage backlog and aggregate story points", path: "/sprints", icon: Layers, color: "text-indigo-400 bg-indigo-400/10" },
    { name: "Manage Members", desc: "Invite colleagues and configure RBAC roles", path: "/members", icon: Users, color: "text-emerald-400 bg-emerald-400/10" },
  ];

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      
      {/* Welcome banner */}
      <div className="relative rounded-2xl border border-dark-border bg-linear-to-r from-dark-surface to-indigo-950/20 p-8 overflow-hidden glass-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Workspace: {currentWorkspace?.name || "Ready"}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white">
            Hello, <span className="gradient-text">{user?.name}</span>!
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Welcome to your product control center. Manage sprints, customize Kanban statuses, and invite teammates to collaborate in real-time.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total tasks */}
        <div className="rounded-xl bg-dark-surface border border-dark-border p-5 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Tasks</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.total}</span>
          </div>
          <div className="p-3 bg-gray-500/10 rounded-lg text-gray-400 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-xl bg-dark-surface border border-dark-border p-5 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-extrabold text-blue-400 mt-1 block">{metrics.in_progress}</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-xl bg-dark-surface border border-dark-border p-5 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{metrics.done}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="rounded-xl bg-dark-surface border border-dark-border p-5 glass-panel flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Active Projects</span>
            <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">{projects.length}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main split sections (Quick Actions & Recent Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick actions panel */}
        <div className="rounded-xl bg-dark-surface border border-dark-border p-6 glass-panel space-y-4">
          <h3 className="text-base font-bold text-white mb-2">Quick Navigation</h3>
          
          <div className="space-y-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className="flex items-center justify-between p-3 rounded-lg border border-dark-border/60 bg-dark-bg/20 hover:border-brand-500/40 hover:bg-dark-hover transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg shrink-0 ${link.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white">{link.name}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Project Task Feed list */}
        <div className="lg:col-span-2 rounded-xl bg-dark-surface border border-dark-border p-6 glass-panel flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Board Feed Preview</h3>

            {tasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-6 text-center">
                No active tasks found in the selected project.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 4).map((t) => (
                  <div 
                    key={t._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/25 border border-dark-border/40 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden max-w-[80%]">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === "done" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-blue-500" : "bg-gray-500"}`} />
                      <span className="text-gray-200 truncate font-medium">{t.title}</span>
                    </div>

                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tasks.length > 0 && (
            <Link 
              to="/board" 
              className="text-xs text-brand-500 hover:text-brand-400 font-semibold flex items-center gap-1 mt-4 ml-auto"
            >
              <span>View full board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
