import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

const KanbanColumn = ({ status, title, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({ id: status });

  const statusColors = {
    todo: "border-t-2 border-t-gray-500",
    in_progress: "border-t-2 border-t-blue-500",
    review: "border-t-2 border-t-amber-500",
    done: "border-t-2 border-t-emerald-500"
  };

  const statusBgColors = {
    todo: "bg-gray-500/10 text-gray-400",
    in_progress: "bg-blue-500/10 text-blue-400",
    review: "bg-amber-500/10 text-amber-400",
    done: "bg-emerald-500/10 text-emerald-400"
  };

  return (
    <div className={`flex flex-col flex-1 min-w-[250px] max-w-[320px] bg-dark-surface/40 border border-dark-border rounded-xl p-4 overflow-hidden ${statusColors[status] || ""}`}>
      {/* Column Title and task counter */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBgColors[status] || ""}`}>
            {title}
          </span>
          <span className="text-xs text-gray-500 font-semibold">{tasks.length}</span>
        </div>
      </div>

      {/* Sortable Tasks List Container */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]"
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-24 border border-dashed border-dark-border/40 rounded-xl text-xs text-gray-500">
              Empty column
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
