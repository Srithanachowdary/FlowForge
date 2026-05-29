import React, { useState, useEffect } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useProjectStore } from "../../store/projectStore";
import { useAuthStore } from "../../store/authStore";
import { 
  X, 
  Plus, 
  Trash2, 
  Paperclip, 
  Send, 
  Calendar, 
  UserPlus, 
  CheckSquare, 
  MessageSquare,
  Sparkles,
  Link2
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axios";

const TaskModal = ({ task, onClose }) => {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { currentProject, updateTask, fetchTasks } = useProjectStore();

  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status || "todo");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [type, setType] = useState(task.type || "story");
  const [storyPoints, setStoryPoints] = useState(task.storyPoints || 0);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : "");
  const [labels, setLabels] = useState(task.labels || []);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState("");

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [assignedUsers, setAssignedUsers] = useState(task.assignees?.map((a) => a._id || a) || []);

  // Fetch task comments and full details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axiosInstance.get(
          `/workspaces/${currentWorkspace._id}/projects/${currentProject._id}/tasks/${task._id}`
        );
        const { task: fullTask, comments: taskComments } = res.data.data;
        setComments(taskComments || []);
        setAttachments(fullTask.attachments || []);
        setSubtasks(fullTask.subtasks || []);
        setAssignedUsers(fullTask.assignees?.map((a) => a._id) || []);
      } catch (err) {
        console.error("Failed to load task details: ", err);
      }
    };
    fetchDetails();
  }, [task._id, currentWorkspace?._id, currentProject?._id]);

  const handleUpdateField = async (field, value) => {
    try {
      const updated = await updateTask(currentWorkspace._id, currentProject._id, task._id, {
        [field]: value
      });
      // Sync local component state
      if (field === "subtasks") setSubtasks(updated.subtasks);
      if (field === "assignees") setAssignedUsers(updated.assignees?.map((a) => a._id || a));
      if (field === "attachments") setAttachments(updated.attachments);
    } catch (err) {
      toast.error(err.message || "Failed to update task");
    }
  };

  // Subtasks
  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const nextSub = [...subtasks, { title: newSubtask.trim(), done: false }];
    setSubtasks(nextSub);
    handleUpdateField("subtasks", nextSub);
    setNewSubtask("");
  };

  const handleToggleSubtask = (idx) => {
    const nextSub = subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s);
    setSubtasks(nextSub);
    handleUpdateField("subtasks", nextSub);
  };

  const handleDeleteSubtask = (idx) => {
    const nextSub = subtasks.filter((_, i) => i !== idx);
    setSubtasks(nextSub);
    handleUpdateField("subtasks", nextSub);
  };

  const handleGenerateAISubtasks = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await axiosInstance.post("/ai/generate-subtasks", {
        taskId: task._id
      });
      const generatedItems = res.data.data;
      if (Array.isArray(generatedItems)) {
        const nextSub = [
          ...subtasks,
          ...generatedItems.map((title) => ({ title, done: false }))
        ];
        setSubtasks(nextSub);
        await handleUpdateField("subtasks", nextSub);
        toast.success("AI generated subtasks checklist successfully!");
      }
    } catch (err) {
      toast.error("Failed to generate subtasks with AI");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Comments
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axiosInstance.post(
        `/workspaces/${currentWorkspace._id}/projects/${currentProject._id}/tasks/${task._id}/comments`,
        { content: newComment.trim() }
      );
      setComments([res.data.data, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    }
  };

  const handleDeleteComment = async (cid) => {
    try {
      await axiosInstance.delete(
        `/workspaces/${currentWorkspace._id}/projects/${currentProject._id}/tasks/${task._id}/comments/${cid}`
      );
      setComments(comments.filter((c) => c._id !== cid));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    }
  };

  // File Upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await axiosInstance.post(
        `/workspaces/${currentWorkspace._id}/projects/${currentProject._id}/tasks/${task._id}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      setAttachments(res.data.data.attachments);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAssignee = (memberId) => {
    let nextAssignees = [...assignedUsers];
    if (nextAssignees.includes(memberId)) {
      nextAssignees = nextAssignees.filter((id) => id !== memberId);
    } else {
      nextAssignees.push(memberId);
    }
    setAssignedUsers(nextAssignees);
    handleUpdateField("assignees", nextAssignees);
  };

  // Parse @mentions in comment body to render them highlighted
  const renderCommentContent = (content) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    const matches = content.match(mentionRegex);

    if (!matches) return content;

    let matchIdx = 0;
    return parts.map((part, i) => {
      // every odd item matches the group capture
      if (i % 2 === 1) {
        const mention = matches[matchIdx++];
        return (
          <span key={i} className="text-brand-400 font-semibold bg-brand-500/10 px-1 rounded">
            {mention}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-dark-surface border border-dark-border shadow-2xl glass-panel relative flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Main Left Pane (Description, Checklist, Files, Comments) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 border-r border-dark-border max-h-[90vh] md:max-h-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              {typeIcons[type]} {type} / Task Details
            </span>
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title Edit */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleUpdateField("title", title)}
            className="w-full bg-transparent border-b border-transparent hover:border-dark-border focus:border-brand-500 font-display font-bold text-2xl text-white outline-none pb-1 transition-all"
          />

          {/* Description Edit */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleUpdateField("description", description)}
              placeholder="Provide a detailed description of the deliverables..."
              rows="4"
              className="w-full bg-dark-bg/40 border border-dark-border hover:border-dark-border/80 focus:border-brand-500 outline-none rounded-lg p-3 text-sm text-gray-300 placeholder-gray-500 transition-all resize-none"
            />
          </div>

          {/* Subtask Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-brand-500" />
                <span>Checklist Subtasks</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateAISubtasks}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isGeneratingAI ? "Generating..." : "Generate with AI"}</span>
                </button>
                <span className="text-xs text-gray-500">
                  {subtasks.length > 0 ? Math.round((subtasks.filter(s => s.done).length / subtasks.length) * 100) : 0}% done
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {subtasks.map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-dark-bg/30 border border-dark-border/40 hover:border-dark-border group">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={() => handleToggleSubtask(idx)}
                      className="rounded border-dark-border text-brand-500 focus:ring-brand-500 w-4 h-4 cursor-pointer bg-dark-bg"
                    />
                    <span className={`text-sm ${sub.done ? "line-through text-gray-500" : "text-gray-300"}`}>
                      {sub.title}
                    </span>
                  </label>
                  <button 
                    onClick={() => handleDeleteSubtask(idx)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask items..."
                className="flex-1 bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-1.5 px-3 text-xs text-white placeholder-gray-500 transition-all"
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-brand-500 hover:bg-brand-600 text-white p-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-brand-500" />
              <span>Attachments</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg/30 border border-dark-border hover:border-brand-500/30 transition-all">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <div className="overflow-hidden">
                      <a 
                        href={file.url.startsWith("/") ? `http://localhost:5000${file.url}` : file.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-medium text-white hover:text-brand-400 truncate block hover:underline"
                      >
                        {file.name}
                      </a>
                      <span className="text-[9px] text-gray-500">
                        {file.size ? (file.size / 1024).toFixed(1) : 0} KB
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 bg-dark-bg/60 hover:bg-dark-hover border border-dark-border hover:border-brand-500/50 text-xs font-medium text-gray-300 hover:text-white rounded-lg py-2 px-4 transition-all cursor-pointer select-none"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Attachment</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-dark-border">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <span>Discussion Thread</span>
            </label>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment, use @Name to mention..."
                className="flex-1 bg-dark-bg/60 border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-xs text-white placeholder-gray-500 transition-all"
              />
              <button
                type="submit"
                className="bg-brand-500 hover:bg-brand-600 text-white px-3.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment._id} className="p-3 rounded-lg bg-dark-bg/25 border border-dark-border/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold">
                        {comment.author?.name ? comment.author.name.substring(0,1).toUpperCase() : "U"}
                      </div>
                      <span className="text-xs font-semibold text-white">{comment.author?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.author?._id === user?._id && (
                        <button 
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-gray-500 hover:text-rose-400 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed pl-7">
                    {renderCommentContent(comment.content)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Right Pane (Priority, Type, Status, Story points, Assignees) */}
        <div className="w-full md:w-72 bg-dark-bg/30 p-6 space-y-5 max-h-[90vh] md:max-h-none overflow-y-auto">
          <div className="hidden md:flex items-center justify-between pb-3 border-b border-dark-border">
            <span className="text-sm font-semibold text-white">Details Scope</span>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-dark-hover transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                handleUpdateField("status", e.target.value);
              }}
              className="w-full bg-dark-surface border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-xs text-white cursor-pointer"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Completed</option>
            </select>
          </div>

          {/* Priority Select */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                handleUpdateField("priority", e.target.value);
              }}
              className="w-full bg-dark-surface border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-xs text-white cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Task Type Select */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Task Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                handleUpdateField("type", e.target.value);
              }}
              className="w-full bg-dark-surface border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-xs text-white cursor-pointer"
            >
              <option value="story">Story</option>
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="chore">Chore</option>
            </select>
          </div>

          {/* Story Points */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Story Points
            </label>
            <input
              type="number"
              min="0"
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value)}
              onBlur={() => handleUpdateField("storyPoints", parseInt(storyPoints || 0))}
              className="w-full bg-dark-surface border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-xs text-white"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Due Date</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                handleUpdateField("dueDate", e.target.value || null);
              }}
              className="w-full bg-dark-surface border border-dark-border focus:border-brand-500 outline-none rounded-lg py-2 px-3 text-xs text-white cursor-pointer"
            />
          </div>

          {/* Assignees selection panel */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assignees</span>
            </label>

            <div className="rounded-lg border border-dark-border bg-dark-surface/50 max-h-36 overflow-y-auto divide-y divide-dark-border/40 p-1 space-y-1">
              {currentWorkspace?.members?.map((member) => {
                const mu = member.userId;
                if (!mu) return null;
                const isAssigned = assignedUsers.includes(mu._id);

                return (
                  <button
                    key={mu._id}
                    type="button"
                    onClick={() => toggleAssignee(mu._id)}
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md text-left text-xs transition-colors hover:bg-dark-hover ${isAssigned ? "bg-brand-500/10 text-brand-400 font-semibold" : "text-gray-300"}`}
                  >
                    <span className="truncate">{mu.name}</span>
                    {isAssigned && <CheckSquare className="w-3.5 h-3.5 text-brand-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;
