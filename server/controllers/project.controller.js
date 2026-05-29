import mongoose from "mongoose";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import Workspace from "../models/Workspace.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. List projects in workspace
export const getProjects = async (req, res, next) => {
  try {
    const { wid } = req.params;
    const projects = await Project.find({ workspaceId: wid, status: "active" });
    return res.status(200).json(new ApiResponse(200, projects, "Projects retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// 2. Create project
export const createProject = async (req, res, next) => {
  try {
    const { wid } = req.params;
    const { name, description, color } = req.body;

    if (!name) {
      throw new ApiError(400, "Project name is required");
    }

    // Verify workspace active plan limits (Free plan allows max 1 project)
    const workspace = await Workspace.findById(wid);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    const currentProjectCount = await Project.countDocuments({ workspaceId: wid, status: "active" });

    if (workspace.plan === "free" && currentProjectCount >= 1) {
      throw new ApiError(
        402, 
        "Workspace has reached the limit of 1 project for Free plans. Please upgrade to Pro or Team plan to create more."
      );
    }

    const newProject = await Project.create({
      name,
      description: description || "",
      color: color || "#6366f1",
      workspaceId: wid,
      createdBy: req.user._id,
      members: [req.user._id],
      status: "active"
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newProject, "Project created successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Get project detail
export const getProjectDetail = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const project = await Project.findById(pid).populate("members", "name email avatar");
    if (!project) {
      throw new ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse(200, project, "Project detail retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// 4. Update project details
export const updateProject = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const { name, description, color, members } = req.body;

    const project = await Project.findById(pid);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (members) project.members = members;

    await project.save();
    return res.status(200).json(new ApiResponse(200, project, "Project updated successfully"));
  } catch (error) {
    next(error);
  }
};

// 5. Delete/Archive project
export const deleteProject = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const project = await Project.findById(pid);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    project.status = "archived";
    await project.save();

    return res.status(200).json(new ApiResponse(200, null, "Project archived successfully"));
  } catch (error) {
    next(error);
  }
};

// 6. Get project metrics & stats (aggregated)
export const getProjectStats = async (req, res, next) => {
  try {
    const { pid } = req.params;

    const stats = await Task.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(pid) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          points: { $sum: "$storyPoints" }
        }
      }
    ]);

    // Format stats response payload
    const formattedStats = {
      todo: { count: 0, points: 0 },
      in_progress: { count: 0, points: 0 },
      review: { count: 0, points: 0 },
      done: { count: 0, points: 0 }
    };

    let totalTasks = 0;
    let totalPoints = 0;

    stats.forEach((s) => {
      if (formattedStats[s._id]) {
        formattedStats[s._id] = {
          count: s.count,
          points: s.points
        };
        totalTasks += s.count;
        totalPoints += s.points;
      }
    });

    const completionRate = totalTasks > 0 ? (formattedStats.done.count / totalTasks) * 100 : 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          columns: formattedStats,
          summary: {
            totalTasks,
            totalPoints,
            completedTasks: formattedStats.done.count,
            completedPoints: formattedStats.done.points,
            completionRate: Math.round(completionRate)
          }
        },
        "Project stats aggregated successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
