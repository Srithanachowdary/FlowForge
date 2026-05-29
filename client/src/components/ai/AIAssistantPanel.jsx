import React, { useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  Zap, 
  X, 
  TrendingUp, 
  FileText 
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const AIAssistantPanel = ({ isOpen, onClose }) => {
  const { currentWorkspace } = useWorkspaceStore();
  const { currentProject, sprints, tasks, addTasksToSprint } = useProjectStore();
  
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [delayRisk, setDelayRisk] = useState(null);

  const activeSprint = sprints.find(s => s.status === "active");

  const handleSuggestSprint = async () => {
    if (!currentProject) return toast.error("Select a project first");
    setLoading(true);
    setResponse("");
    setDelayRisk(null);

    try {
      const res = await axiosInstance.post("/ai/suggest-sprint", {
        projectId: currentProject._id
      });
      const { sprintGoal, suggestedTasks } = res.data.data;
      
      setResponse(`🤖 [AI Scrum Master Recommendation]\n\n**Suggested Goal**:\n${sprintGoal}\n\n**Suggested Backlog Items Count**: ${suggestedTasks.length} tasks.\n\n*Click "Apply Suggestion" below to create a planning sprint containing these items.*`);
      
      // Keep track of suggested task ids to apply
      setResponse((prev) => prev + `\n\n[APPLY_DATA:${suggestedTasks.join(",")}]`);
    } catch (err) {
      toast.error("Failed to fetch suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handlePredictDelay = async () => {
    if (!activeSprint) return toast.error("There is no active sprint in this project");
    setLoading(true);
    setResponse("");
    setDelayRisk(null);

    try {
      const res = await axiosInstance.post("/ai/predict-delay", {
        sprintId: activeSprint._id
      });
      const { risk, reasoning } = res.data.data;
      setDelayRisk({ risk, reasoning });
    } catch (err) {
      toast.error("Failed to calculate risks");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeSprint = async () => {
    // Find the latest completed sprint
    const completedSprint = sprints.find(s => s.status === "completed");
    if (!completedSprint) return toast.error("No completed sprints found in this project");

    setLoading(true);
    setResponse("");
    setDelayRisk(null);

    try {
      const res = await axiosInstance.post("/ai/summarize-sprint", {
        sprintId: completedSprint._id
      });
      setResponse(`🤖 [AI Completed Sprint Summary]\n\n${res.data.data.summary}`);
    } catch (err) {
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = async () => {
    // Parse task ids from response
    const match = response.match(/\[APPLY_DATA:([^\]]+)\]/);
    if (!match) return;

    const taskIds = match[1].split(",");
    
    // Find a planning sprint to assign to, or suggest creating one
    const planningSprint = sprints.find(s => s.status === "planning");
    if (!planningSprint) {
      return toast.error("Please create a planning sprint first on Sprints page");
    }

    try {
      await addTasksToSprint(currentWorkspace._id, currentProject._id, planningSprint._id, taskIds);
      toast.success(`Assigned ${taskIds.length} tasks to ${planningSprint.name}`);
      onClose();
    } catch (err) {
      toast.error("Failed to assign suggestion");
    }
  };

  if (!isOpen) return null;

  const hasApplyData = response.includes("[APPLY_DATA:");
  const cleanResponse = response.replace(/\[APPLY_DATA:[^\]]+\]/, "");

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-dark-surface border-l border-dark-border p-6 shadow-2xl flex flex-col justify-between glass-panel transition-all">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-dark-border mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="font-display font-bold text-lg text-white">AI Agile Assistant</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-dark-hover cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buttons List */}
        <div className="space-y-3">
          <button
            onClick={handleSuggestSprint}
            disabled={loading}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 hover:bg-dark-hover transition-all text-xs font-semibold text-gray-300 hover:text-white text-left cursor-pointer"
          >
            <Zap className="w-4 h-4 text-brand-500" />
            <div>
              <p className="font-bold text-white">Suggest Sprint Plan</p>
              <p className="text-[10px] text-gray-500 font-normal">Formulate sprint goal from backlog</p>
            </div>
          </button>

          <button
            onClick={handlePredictDelay}
            disabled={loading}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 hover:bg-dark-hover transition-all text-xs font-semibold text-gray-300 hover:text-white text-left cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="font-bold text-white">Forecast Delay Risk</p>
              <p className="text-[10px] text-gray-500 font-normal">Audit completion lag probability</p>
            </div>
          </button>

          <button
            onClick={handleSummarizeSprint}
            disabled={loading}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-brand-500/50 hover:bg-dark-hover transition-all text-xs font-semibold text-gray-300 hover:text-white text-left cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <div>
              <p className="font-bold text-white">Sprint Completion Summary</p>
              <p className="text-[10px] text-gray-500 font-normal">Generate summaries for stakeholders</p>
            </div>
          </button>
        </div>

        {/* AI Response Display Box */}
        {(loading || cleanResponse || delayRisk) && (
          <div className="mt-6 rounded-lg bg-dark-bg/60 border border-dark-border p-4 max-h-80 overflow-y-auto font-mono text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-400 border-t-transparent" />
                <span className="text-[10px] text-gray-500">AI is thinking...</span>
              </div>
            ) : delayRisk ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${delayRisk.risk === "high" ? "text-rose-500" : "text-amber-500"}`} />
                  <span className="font-bold uppercase tracking-wider text-[10px] text-white">
                    Risk Level: {delayRisk.risk}
                  </span>
                </div>
                <p className="text-gray-300">{delayRisk.reasoning}</p>
              </div>
            ) : (
              <p>{cleanResponse}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer Apply action */}
      {hasApplyData && !loading && (
        <button
          onClick={handleApplySuggestion}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg py-2.5 text-xs transition-colors cursor-pointer shadow-md shadow-brand-500/10 mt-6"
        >
          Apply Plan Suggestion
        </button>
      )}

    </div>
  );
};

export default AIAssistantPanel;
