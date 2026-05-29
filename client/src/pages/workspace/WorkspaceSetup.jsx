import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useAuthStore } from "../../store/authStore";
import { Plus, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const WorkspaceSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createWorkspace, joinWorkspace, loading } = useWorkspaceStore();
  const { fetchMe } = useAuthStore();
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Check if user has invite token in query param
  useEffect(() => {
    const inviteToken = searchParams.get("invite");
    
    const handleJoin = async () => {
      if (inviteToken) {
        setIsJoining(true);
        try {
          await joinWorkspace(inviteToken);
          toast.success("Joined workspace successfully!");
          await fetchMe(); // Refresh active workspace
          navigate("/");
        } catch (err) {
          toast.error(err.message || "Failed to join workspace. Link may be invalid.");
        } finally {
          setIsJoining(false);
        }
      }
    };
    handleJoin();
  }, [searchParams, joinWorkspace, fetchMe, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Workspace name is required");
    }

    try {
      await createWorkspace(name.trim());
      toast.success("Workspace created successfully!");
      await fetchMe(); // Refresh user profile activeWorkspace
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to create workspace");
    }
  };

  if (isJoining) {
    return (
      <div className="min-h-screen w-screen bg-dark-bg flex items-center justify-center p-4 text-center font-sans">
        <div className="max-w-md w-full rounded-2xl glass-panel p-8 shadow-2xl border border-dark-border">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-white">Accepting Invitation</h2>
          <p className="text-sm text-gray-400 mt-2">Connecting you to your new workspace team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md rounded-2xl glass-panel relative z-10 overflow-hidden shadow-2xl gradient-border p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 font-display font-extrabold text-white text-2xl mb-4 shadow-lg animate-float">
            Z
          </div>
          <h2 className="font-display font-bold text-3xl text-white mb-2">
            Let's build a <span className="gradient-text">Workspace</span>
          </h2>
          <p className="text-sm text-gray-400">
            Workspaces isolate your projects, tasks, sprints, and billing logs per organization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, Design Team"
              className="w-full bg-dark-surface/50 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 px-4 text-sm text-white placeholder-gray-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 cursor-pointer disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 text-sm transition-all shadow-md shadow-brand-500/20"
          >
            <span>{loading ? "Creating..." : "Create Workspace"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-4 mt-6">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
            Free Plan Inclusions
          </p>
          <ul className="text-xs text-gray-400 space-y-1.5 mt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Up to 1 active project</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Up to 3 members</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
              <span>Up to 15 active board tasks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
