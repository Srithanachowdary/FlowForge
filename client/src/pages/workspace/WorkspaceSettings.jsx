import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { Settings, Save, AlertTriangle, Trash2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

const WorkspaceSettings = () => {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();
  const { currentWorkspace, updateWorkspace, deleteWorkspace, loading } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [defaultRole, setDefaultRole] = useState("developer");
  const [allowInvite, setAllowInvite] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || "");
      setDefaultRole(currentWorkspace.settings?.defaultRole || "developer");
      setAllowInvite(currentWorkspace.settings?.allowInvite !== false);
    }
  }, [currentWorkspace]);

  const currentUserRole = currentWorkspace?.members?.find(
    (m) => m.userId?._id === user?._id || m.userId === user?._id
  )?.role || "viewer";

  const isUserAdmin = currentUserRole === "admin";
  const isUserOwner = currentWorkspace?.owner === user?._id || currentWorkspace?.owner?._id === user?._id;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Workspace name cannot be empty");
    }

    try {
      await updateWorkspace(currentWorkspace._id, {
        name: name.trim(),
        settings: { defaultRole, allowInvite }
      });
      toast.success("Workspace settings updated");
    } catch (err) {
      toast.error(err.message || "Failed to update workspace settings");
    }
  };

  const handleDelete = async () => {
    if (!isUserOwner) {
      return toast.error("Only the workspace Owner can delete this workspace");
    }

    const conf = window.prompt(
      `WARNING: This action is permanent! All projects, tasks, comments, and sprints in this workspace will be deleted forever. To confirm, type the workspace name: "${currentWorkspace.name}"`
    );

    if (conf === currentWorkspace.name) {
      try {
        await deleteWorkspace(currentWorkspace._id);
        toast.success("Workspace successfully deleted");
        await fetchMe(); // Reset active workspace
        navigate("/workspace-setup");
      } catch (err) {
        toast.error(err.message || "Failed to delete workspace");
      }
    } else {
      toast.error("Confirmation name did not match");
    }
  };

  if (currentUserRole !== "admin" && currentUserRole !== "manager") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
        <ShieldAlert className="w-12 h-12 text-gray-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-gray-400 max-w-md mt-2">
          You need Administrator or Manager permission levels to view and modify settings for this workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold text-white">
          Workspace <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Adjust names, invite rules, default workspace scopes, and subscription settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Settings Form */}
        <div className="rounded-xl bg-dark-surface border border-dark-border p-6 glass-panel">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-500" />
            <span>Workspace Preferences</span>
          </h3>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2 px-4 text-sm text-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Default Member Role
                </label>
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all"
                >
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Allow Member Invites
                </label>
                <select
                  value={allowInvite ? "yes" : "no"}
                  onChange={(e) => setAllowInvite(e.target.value === "yes")}
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all"
                >
                  <option value="yes">Allow all members to invite</option>
                  <option value="no">Only Admins/Managers can invite</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 cursor-pointer disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 px-6 text-sm transition-colors mt-6 ml-auto"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Danger Zone (Visible to owner only) */}
        {isUserAdmin && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Danger Zone</h3>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed">
              Once you delete this workspace, it is gone forever. Please be certain.
            </p>

            <div className="flex justify-end mt-2">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-transparent text-rose-500 hover:text-white font-medium rounded-lg py-2 px-4 text-xs transition-all cursor-pointer shadow-sm hover:shadow-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Workspace</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkspaceSettings;
