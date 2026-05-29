import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import BurndownChart from "../../components/sprint/BurndownChart";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import { 
  Plus, 
  Layers, 
  Play, 
  CheckCircle, 
  HelpCircle, 
  FolderGit2, 
  ArrowRight,
  TrendingUp,
  Inbox
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const SprintPage = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    currentProject, 
    tasks, 
    sprints, 
    fetchTasks, 
    fetchSprints, 
    createSprint, 
    addTasksToSprint, 
    startSprint, 
    completeSprint,
    loading 
  } = useProjectStore();

  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [showAddSprint, setShowAddSprint] = useState(false);

  // Velocity aggregates
  const [velocityData, setVelocityData] = useState([]);
  
  // Backlog selections
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  useEffect(() => {
    if (currentWorkspace?._id && currentProject?._id) {
      fetchTasks(currentWorkspace._id, currentProject._id);
      fetchSprints(currentWorkspace._id, currentProject._id);
      fetchVelocity();
    }
  }, [currentWorkspace?._id, currentProject?._id, fetchTasks, fetchSprints]);

  const fetchVelocity = async () => {
    try {
      const res = await axiosInstance.get(
        `/workspaces/${currentWorkspace._id}/projects/${currentProject._id}/sprints/velocity`
      );
      setVelocityData(res.data.data || []);
    } catch (err) {
      console.error("Failed to load velocity chart data: ", err);
    }
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!newSprintName.trim()) return toast.error("Sprint name is required");

    try {
      await createSprint(currentWorkspace._id, currentProject._id, {
        name: newSprintName.trim(),
        goal: newSprintGoal.trim()
      });
      toast.success("Sprint created in planning stage");
      setNewSprintName("");
      setNewSprintGoal("");
      setShowAddSprint(false);
    } catch (err) {
      toast.error(err.message || "Failed to create sprint");
    }
  };

  const handleAssignToSprint = async (sprintId) => {
    if (selectedTaskIds.length === 0) {
      return toast.error("Please select tasks from the backlog first");
    }

    try {
      await addTasksToSprint(currentWorkspace._id, currentProject._id, sprintId, selectedTaskIds);
      toast.success("Tasks assigned to sprint successfully");
      setSelectedTaskIds([]);
    } catch (err) {
      toast.error(err.message || "Failed to assign tasks");
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      await startSprint(currentWorkspace._id, currentProject._id, sprintId, {
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
      });
      toast.success("Sprint activated! Kanban board is now live.");
      fetchSprints(currentWorkspace._id, currentProject._id);
    } catch (err) {
      toast.error(err.message || "Failed to start sprint");
    }
  };

  const handleCompleteSprint = async (sprintId) => {
    if (window.confirm("Complete active sprint? Incomplete tasks will be returned to the backlog.")) {
      try {
        await completeSprint(currentWorkspace._id, currentProject._id, sprintId);
        toast.success("Sprint completed. Velocities updated.");
        fetchSprints(currentWorkspace._id, currentProject._id);
        fetchVelocity();
      } catch (err) {
        toast.error(err.message || "Failed to complete sprint");
      }
    }
  };

  const handleSelectTask = (taskId) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const selectAllBacklog = (backlogTasks) => {
    if (selectedTaskIds.length === backlogTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(backlogTasks.map(t => t._id));
    }
  };

  // Split tasks: backlog (sprintId === null) vs sprint-bound tasks
  const backlogTasks = tasks.filter(t => !t.sprintId);
  const activeSprint = sprints.find(s => s.status === "active");

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
        <Layers className="w-16 h-16 text-gray-500 mb-4 animate-float" />
        <h2 className="text-xl font-bold text-white">Select a Project</h2>
        <p className="text-sm text-gray-400 max-w-sm mt-2">
          Please select a project to manage its Agile sprint backlogs and velocity tracking metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white">
            Sprints & <span className="gradient-text">Backlogs</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Allocate backlog story items to target sprints and track release velocity.
          </p>
        </div>

        <button
          onClick={() => setShowAddSprint(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/10 self-start"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Create Sprint</span>
        </button>
      </div>

      {/* Analytics Widgets (Burndown and Velocity) */}
      {activeSprint && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Burndown Chart */}
          <BurndownChart 
            sprint={activeSprint} 
            tasks={tasks.filter(t => t.sprintId === activeSprint._id)} 
          />

          {/* Velocity tracking chart */}
          <div className="w-full h-72 bg-dark-surface border border-dark-border rounded-xl p-4 glass-panel flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Historical Velocity</span>
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Aggregated sum of completed story points across past completed sprints.
              </p>
            </div>
            
            <div className="w-full h-44 mt-4">
              {velocityData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-500">
                  No completed sprints yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2235" />
                    <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 9 }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: 9 }} />
                    <Bar dataKey="velocity" fill="#6366f1" radius={[4, 4, 0, 0]} name="Velocity" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backlog and Sprint columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Backlog Tasks List (col-span 3) */}
        <div className="lg:col-span-3 rounded-xl bg-dark-surface border border-dark-border overflow-hidden glass-panel flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-dark-border bg-dark-bg/25 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-brand-500" />
                <h3 className="text-lg font-semibold text-white">Project Backlog</h3>
                <span className="text-xs text-gray-500 font-semibold">({backlogTasks.length} tasks)</span>
              </div>

              {/* Action Dropdown to Move Selected Tasks to Sprint */}
              {selectedTaskIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-400 font-semibold">{selectedTaskIds.length} selected</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAssignToSprint(e.target.value);
                      e.target.value = "";
                    }}
                    className="bg-brand-500 hover:bg-brand-600 border border-transparent outline-none rounded-lg py-1 px-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    <option value="">Move to Sprint...</option>
                    {sprints.filter(s => s.status !== "completed").map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Backlog List */}
            {backlogTasks.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No tasks in backlog. Create tasks to fill the backlog!
              </div>
            ) : (
              <div className="divide-y divide-dark-border max-h-[50vh] overflow-y-auto">
                <div className="px-6 py-2.5 bg-dark-bg/10 flex items-center gap-4 text-xs font-semibold text-gray-500 select-none">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === backlogTasks.length && backlogTasks.length > 0}
                    onChange={() => selectAllBacklog(backlogTasks)}
                    className="rounded border-dark-border text-brand-500 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Select All Backlog Items</span>
                </div>

                {backlogTasks.map((t) => {
                  const isChecked = selectedTaskIds.includes(t._id);
                  return (
                    <div 
                      key={t._id} 
                      className={`px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-dark-hover/40 transition-colors ${isChecked ? "bg-brand-500/5" : ""}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectTask(t._id)}
                          className="rounded border-dark-border text-brand-500 focus:ring-brand-500 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-white truncate hover:underline cursor-pointer">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                            <span className="capitalize">{t.type}</span>
                            <span className="capitalize">{t.priority}</span>
                          </div>
                        </div>
                      </div>

                      <span className="flex items-center justify-center w-6 h-6 rounded bg-dark-bg text-indigo-300 font-bold border border-dark-border text-[10px] shrink-0">
                        {t.storyPoints || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sprints Pane (col-span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white px-1">Agile Sprints</h3>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {sprints.map((sprint) => {
              const sprintTasks = tasks.filter(t => t.sprintId === sprint._id);
              const sprintPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

              return (
                <div key={sprint._id} className="rounded-xl bg-dark-surface border border-dark-border p-5 space-y-4 glass-panel">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        <span>{sprint.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${sprint.status === "active" ? "bg-emerald-500/10 text-emerald-400" : sprint.status === "completed" ? "bg-gray-500/20 text-gray-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                          {sprint.status}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{sprint.goal || "No goal specified."}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">Total Points</span>
                        <span className="text-xs font-bold text-indigo-300">{sprintPoints} pts</span>
                      </div>

                      {/* Action buttons */}
                      {sprint.status === "planning" && (
                        <button
                          onClick={() => handleStartSprint(sprint._id)}
                          className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start</span>
                        </button>
                      )}

                      {sprint.status === "active" && (
                        <button
                          onClick={() => handleCompleteSprint(sprint._id)}
                          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task list preview in sprint */}
                  <div className="space-y-1.5 border-t border-dark-border pt-3">
                    {sprintTasks.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2">
                        No tasks in this sprint. Drag tasks from backlog to planning.
                      </p>
                    ) : (
                      sprintTasks.map(t => (
                        <div key={t._id} className="flex items-center justify-between text-xs py-1 text-gray-300">
                          <span className="truncate max-w-[80%] hover:underline cursor-pointer">{t.title}</span>
                          <span className="text-[10px] font-bold text-gray-500 shrink-0">{t.storyPoints} pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Add Sprint Modal dialog */}
      {showAddSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-dark-surface border border-dark-border shadow-2xl p-6 relative glass-panel">
            <h3 className="text-xl font-bold text-white mb-4">Create Sprint</h3>

            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sprint Name
                </label>
                <input
                  type="text"
                  required
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g. Sprint 1, Sprint Alpha"
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2 px-3.5 text-sm text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sprint Goal
                </label>
                <textarea
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="Describe what we aim to accomplish in this sprint..."
                  rows="3"
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2 px-3.5 text-sm text-white placeholder-gray-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end border-t border-dark-border pt-4 mt-6 gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSprint(false)}
                  className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-xs text-gray-300 hover:text-white hover:bg-dark-hover transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SprintPage;
