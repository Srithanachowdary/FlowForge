import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import TaskModal from "../../components/task/TaskModal"; // Details modal
import { 
  Search, 
  Filter, 
  Plus, 
  FolderKanban, 
  Layers, 
  CheckCircle2, 
  ListTodo,
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const ProjectBoard = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    currentProject, 
    tasks, 
    fetchTasks, 
    createTask, 
    updateTaskStateLocally,
    loading 
  } = useProjectStore();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createPriority, setCreatePriority] = useState("medium");
  const [createType, setCreateType] = useState("story");
  const [createPoints, setCreatePoints] = useState(0);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (currentWorkspace?._id && currentProject?._id) {
      fetchTasks(currentWorkspace._id, currentProject._id);
    }
  }, [currentWorkspace?._id, currentProject?._id, fetchTasks]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const targetStatus = over.id; // e.g. "in_progress"

    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // If moved to a different column status
    if (task.status !== targetStatus) {
      // 1. Optimistic Update
      updateTaskStateLocally(taskId, { status: targetStatus });

      try {
        await axiosInstance.patch(
          `/workspaces/${currentWorkspace._id}/projects/${currentProject._id}/tasks/${taskId}/status`, 
          { status: targetStatus }
        );
      } catch (err) {
        // Revert local state
        updateTaskStateLocally(taskId, { status: task.status });
        toast.error(err.response?.data?.message || "Failed to update task status");
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      return toast.error("Task title is required");
    }

    try {
      await createTask(currentWorkspace._id, currentProject._id, {
        title: createTitle.trim(),
        priority: createPriority,
        type: createType,
        storyPoints: parseInt(createPoints || 0),
        assignees: selectedAssignees
      });
      toast.success("Task created successfully!");
      setCreateTitle("");
      setCreatePoints(0);
      setSelectedAssignees([]);
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to create task");
    }
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  // Filter tasks locally
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;

    const matchesAssignee = 
      assigneeFilter === "all" || 
      t.assignees?.some((a) => a._id === assigneeFilter || a === assigneeFilter);

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
        <FolderKanban className="w-16 h-16 text-gray-500 mb-4 animate-float" />
        <h2 className="text-xl font-bold text-white">Select a Project</h2>
        <p className="text-sm text-gray-400 max-w-sm mt-2">
          Please select a project from the top dropdown or the projects dashboard to view its Kanban board.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Board Header Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-white flex items-center gap-2">
            <span 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: currentProject.color }}
            />
            <span>{currentProject.name}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Drag cards across columns to coordinate task lifecycle status.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors cursor-pointer shadow-md shadow-brand-500/10 self-start"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-dark-surface/40 border border-dark-border rounded-xl p-4 glass-panel">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center w-4 h-4 text-gray-500 my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-1.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 transition-all"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-1.5 px-3 text-xs text-white transition-all cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-2">
          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">Assignee:</span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-1.5 px-3 text-xs text-white transition-all cursor-pointer"
          >
            <option value="all">All Members</option>
            {currentWorkspace?.members?.map((m) => {
              const mu = m.userId;
              if (!mu) return null;
              return (
                <option key={mu._id} value={mu._id}>
                  {mu.name}
                </option>
              );
            })}
          </select>
        </div>

      </div>

      {/* Kanban Board Container */}
      {loading && filteredTasks.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onDragEnd={handleDragEnd}
          onTaskClick={handleSelectTask}
        />
      )}

      {/* Task Details Dialog Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Create Task Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-dark-surface border border-dark-border shadow-2xl p-6 relative glass-panel">
            <h3 className="text-xl font-bold text-white mb-4">Create Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth Flow"
                  className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value)}
                    className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Type
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all cursor-pointer"
                  >
                    <option value="story">Story</option>
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                    <option value="chore">Chore</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createPoints}
                    onChange={(e) => setCreatePoints(e.target.value)}
                    className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Assignee
                  </label>
                  <select
                    multiple
                    value={selectedAssignees}
                    onChange={(e) => setSelectedAssignees(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                    className="w-full bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-sm text-white transition-all max-h-24 overflow-y-auto"
                  >
                    {currentWorkspace?.members?.map((m) => {
                      const mu = m.userId;
                      if (!mu) return null;
                      return (
                        <option key={mu._id} value={mu._id}>
                          {mu.name}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[10px] text-gray-500 mt-1 block">Hold Ctrl to select multiple</span>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-dark-border pt-4 mt-6 gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-dark-bg border border-dark-border text-xs text-gray-300 hover:text-white hover:bg-dark-hover transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectBoard;
