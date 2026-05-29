import React, { useState } from "react";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragOverlay
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";

const KanbanBoard = ({ tasks, onDragEnd, onTaskClick }) => {
  const [activeTask, setActiveTask] = useState(null);

  // Configure Pointer and Keyboard sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Requires user to drag 8 pixels before initiating drag, preserving normal clicks
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const columns = [
    { status: "todo", title: "To Do" },
    { status: "in_progress", title: "In Progress" },
    { status: "review", title: "In Review" },
    { status: "done", title: "Completed" }
  ];

  // Helper to filter tasks by status column
  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEndEvent = (event) => {
    setActiveTask(null);
    onDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndEvent}
    >
      <div className="flex flex-row gap-5 overflow-x-auto pb-4 items-start select-none">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={getTasksByStatus(col.status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {/* Tactile drag overlay rendering cloned card floating above grid */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="rotate-3 scale-105 shadow-2xl">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
