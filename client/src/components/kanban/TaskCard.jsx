import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  Tag, 
  ChevronUp, 
  HelpCircle,
  GripVertical
} from "lucide-react";

const TaskCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto"
  };

  const priorityColors = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
  };

  const typeIcons = {
    feature: "✨",
    bug: "🐛",
    chore: "⚙️",
    story: "📖"
  };

  // Calculate checklist counts
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.done).length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-xl bg-dark-surface border border-dark-border p-4 hover:border-brand-500/50 hover:bg-dark-hover transition-all flex flex-col justify-between min-h-[120px] select-none"
    >
      <div>
        {/* Top line: Type Icon + Priority badge + Drag Handle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm" title={`Type: ${task.type || "story"}`}>
              {typeIcons[task.type] || "📖"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityColors[task.priority] || priorityColors.medium}`}>
              {task.priority || "medium"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div 
              {...attributes} 
              {...listeners} 
              className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-dark-bg cursor-grab active:cursor-grabbing"
              title="Drag Task"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Task Title (clickable to open details) */}
        <h4 
          onClick={onClick}
          className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors cursor-pointer line-clamp-2 leading-relaxed"
        >
          {task.title}
        </h4>
      </div>

      {/* Card Footer: Metadata (Story points, checklist, due date, assignees) */}
      <div className="flex items-center justify-between border-t border-dark-border pt-3 mt-4 text-[11px] text-gray-400">
        
        {/* Story Points & Subtasks progress */}
        <div className="flex items-center gap-3">
          {task.storyPoints > 0 && (
            <span 
              className="flex items-center justify-center w-5 h-5 rounded bg-dark-bg text-indigo-300 font-bold border border-dark-border"
              title="Story Points"
            >
              {task.storyPoints}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span 
              className="flex items-center gap-1 text-gray-400"
              title={`Checklist: ${completedSubtasks}/${totalSubtasks}`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
          )}

          {task.dueDate && (
            <span 
              className="flex items-center gap-1 text-gray-400"
              title={`Due Date: ${new Date(task.dueDate).toLocaleDateString()}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className={new Date(task.dueDate) < new Date() && task.status !== "done" ? "text-rose-400 font-semibold" : ""}>
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </span>
          )}
        </div>

        {/* Assignees avatars list */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {task.assignees?.slice(0, 3).map((assignee, idx) => (
            assignee.avatar ? (
              <img 
                key={assignee._id || idx}
                src={assignee.avatar} 
                alt={assignee.name}
                className="w-5.5 h-5.5 rounded-full border border-dark-surface shrink-0"
                title={assignee.name}
              />
            ) : (
              <div 
                key={assignee._id || idx}
                className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-indigo-900 border border-dark-surface font-semibold text-indigo-200 text-[9px] shrink-0"
                title={assignee.name}
              >
                {assignee.name.substring(0, 1).toUpperCase()}
              </div>
            )
          ))}
          {task.assignees?.length > 3 && (
            <div className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-dark-bg border border-dark-surface font-bold text-gray-300 text-[8px] shrink-0">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TaskCard;
