import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { useNavigate } from "react-router-dom";
import { 
  FolderGit2, 
  Plus, 
  ArrowRight, 
  Calendar, 
  ShieldAlert, 
  Briefcase 
} from "lucide-react";
import toast from "react-hot-toast";

const ProjectList = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const { projects, createProject, fetchProjects, setCurrentProject, loading } = useProjectStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [showAddModal, setShowAddModal] = useState(false);

  const colors = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchProjects(currentWorkspace._id);
    }
  }, [currentWorkspace?._id, fetchProjects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Project name is required");
    }

    try {
      await createProject(currentWorkspace._id, {
        name: name.trim(),
        description: description.trim(),
        color
      });
      toast.success("Project created successfully!");
      setName("");
      setDescription("");
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to create project");
    }
  };

  const handleSelectProject = (proj) => {
    setCurrentProject(proj);
    toast.success(`Selected project: ${proj.name}`);
    navigate("/board");
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Workspace <span className="gradient-text">Projects</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Build boards and manage timelines for different project streams in this workspace.
          </p>
        </div>

        {currentWorkspace && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors cursor-pointer shadow-md shadow-brand-500/10"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Grid List */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dark-border bg-dark-surface/40 p-12 text-center max-w-lg mx-auto glass-panel">
          <FolderGit2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">No projects found</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Get started by initializing a new project board in this workspace.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors cursor-pointer"
          >
            Create first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div 
              key={proj._id}
              onClick={() => handleSelectProject(proj)}
              className="rounded-xl bg-dark-surface border border-dark-border p-6 flex flex-col justify-between hover:border-brand-500/50 hover:bg-dark-hover/30 transition-all cursor-pointer group glass-card"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span 
                    className="w-3.5 h-3.5 rounded-full" 
                    style={{ backgroundColor: proj.color }}
                  />
                  <Briefcase className="w-4 h-4 text-gray-500 group-hover:text-brand-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">
                  {proj.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed mb-6">
                  {proj.description || "No project description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-dark-border pt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {new Date(proj.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1 text-brand-500 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Enter</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-dark-surface border border-dark-border shadow-2xl p-6 relative glass-panel">
            <h3 className="text-xl font-bold text-white mb-4">Create Project</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Revamp"
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2 px-3.5 text-sm text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the project objectives..."
                  rows="3"
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2 px-3.5 text-sm text-white placeholder-gray-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Theme Tag Color
                </label>
                <div className="flex items-center gap-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 cursor-pointer ${color === c ? "border-white scale-110 shadow-lg" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-dark-border pt-4 mt-6">
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Subject to plan limits</span>
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-xs text-gray-300 hover:text-white hover:bg-dark-hover transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectList;
