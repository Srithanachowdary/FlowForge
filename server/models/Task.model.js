import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    type: {
      type: String,
      enum: ["feature", "bug", "chore", "story"],
      default: "story"
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    storyPoints: {
      type: Number,
      default: 0
    },
    order: {
      type: Number,
      default: 0
    },
    dueDate: {
      type: Date,
      default: null
    },
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    attachments: [attachmentSchema],
    subtasks: [subtaskSchema]
  },
  {
    timestamps: true
  }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
