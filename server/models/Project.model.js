import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
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
      index: true // index for faster multi-tenant queries
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    color: {
      type: String,
      default: "#6366f1" // default indigo brand color
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
