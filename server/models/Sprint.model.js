import mongoose from "mongoose";

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sprint name is required"],
      trim: true
    },
    goal: {
      type: String,
      default: ""
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning"
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
      }
    ],
    velocity: {
      type: Number,
      default: 0 // sum of completed story points in this sprint
    }
  },
  {
    timestamps: true
  }
);

const Sprint = mongoose.model("Sprint", sprintSchema);
export default Sprint;
