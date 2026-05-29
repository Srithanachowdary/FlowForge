import mongoose from "mongoose";
import Sprint from "../models/Sprint.model.js";
import Task from "../models/Task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. Get all sprints for project
export const getSprints = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const sprints = await Sprint.find({ projectId: pid }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, sprints, "Sprints retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// 2. Create a sprint (starts in planning status)
export const createSprint = async (req, res, next) => {
  try {
    const { wid, pid } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    if (!name) {
      throw new ApiError(400, "Sprint name is required");
    }

    const sprint = await Sprint.create({
      name,
      goal: goal || "",
      startDate: startDate || null,
      endDate: endDate || null,
      projectId: pid,
      workspaceId: wid,
      status: "planning",
      tasks: [],
      velocity: 0
    });

    return res.status(201).json(new ApiResponse(201, sprint, "Sprint created successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Update sprint details
export const updateSprint = async (req, res, next) => {
  try {
    const { sid } = req.params;
    const { name, goal, startDate, endDate } = req.body;

    const sprint = await Sprint.findById(sid);
    if (!sprint) {
      throw new ApiError(404, "Sprint not found");
    }

    if (name) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;

    await sprint.save();
    return res.status(200).json(new ApiResponse(200, sprint, "Sprint updated successfully"));
  } catch (error) {
    next(error);
  }
};

// 4. Assign a batch of tasks to sprint
export const addTasksToSprint = async (req, res, next) => {
  try {
    const { pid, sid } = req.params;
    const { taskIds } = req.body; // Array of Task ObjectIds

    if (!Array.isArray(taskIds)) {
      throw new ApiError(400, "taskIds must be an array");
    }

    const sprint = await Sprint.findById(sid);
    if (!sprint) {
      throw new ApiError(404, "Sprint not found");
    }

    // 1. Assign tasks to this sprint
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: { sprintId: sid } }
    );

    // 2. Add tasks to sprint array, ensuring no duplicates
    sprint.tasks = [...new Set([...sprint.tasks.map(id => id.toString()), ...taskIds])].map(id => new mongoose.Types.ObjectId(id));
    await sprint.save();

    const updatedTasks = await Task.find({ _id: { $in: taskIds } })
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    // Emit live Socket update
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("sprint-tasks-updated", { sprint, tasks: updatedTasks });
    }

    return res.status(200).json(
      new ApiResponse(200, { sprint, tasks: updatedTasks }, "Tasks assigned to sprint successfully")
    );
  } catch (error) {
    next(error);
  }
};

// 5. Start / Activate sprint
export const startSprint = async (req, res, next) => {
  try {
    const { pid, sid } = req.params;
    const { startDate, endDate } = req.body;

    const sprint = await Sprint.findById(sid);
    if (!sprint) {
      throw new ApiError(404, "Sprint not found");
    }

    // Check if there is already an active sprint in this project
    const activeSprint = await Sprint.findOne({ projectId: pid, status: "active" });
    if (activeSprint) {
      throw new ApiError(400, `Cannot start sprint. Sprint "${activeSprint.name}" is already active.`);
    }

    sprint.status = "active";
    sprint.startDate = startDate || new Date();
    sprint.endDate = endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // default 2 weeks
    await sprint.save();

    const tasks = await Task.find({ sprintId: sid })
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    // Emit Socket notification
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("sprint-started", { sprint, tasks });
    }

    return res.status(200).json(
      new ApiResponse(200, { sprint, tasks }, "Sprint activated successfully")
    );
  } catch (error) {
    next(error);
  }
};

// 6. Complete sprint (aggregate velocity, triage incomplete back to backlog)
export const completeSprint = async (req, res, next) => {
  try {
    const { pid, sid } = req.params;

    const sprint = await Sprint.findById(sid);
    if (!sprint) {
      throw new ApiError(404, "Sprint not found");
    }

    if (sprint.status !== "active") {
      throw new ApiError(400, "Only active sprints can be completed");
    }

    // Calculate velocity (sum story points of completed tasks in this sprint)
    const completedTasks = await Task.find({ sprintId: sid, status: "done" });
    const completedPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

    sprint.status = "completed";
    sprint.velocity = completedPoints;
    await sprint.save();

    // Triage incomplete tasks (status !== 'done') back to backlog (sprintId = null)
    await Task.updateMany(
      { sprintId: sid, status: { $ne: "done" } },
      { $set: { sprintId: null } }
    );

    // Get all tasks for this project to return correct synced board state
    const allTasks = await Task.find({ projectId: pid })
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("sprint-completed", { sprint, tasks: allTasks });
    }

    return res.status(200).json(
      new ApiResponse(200, { sprint, tasks: allTasks }, "Sprint completed. Incomplete tasks triaged to backlog.")
    );
  } catch (error) {
    next(error);
  }
};

// 7. Get historical velocity aggregates
export const getSprintVelocity = async (req, res, next) => {
  try {
    const { pid } = req.params;

    const data = await Sprint.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(pid), status: "completed" } },
      {
        $project: {
          name: 1,
          velocity: 1,
          endDate: 1
        }
      },
      { $sort: { endDate: 1 } }
    ]);

    return res.status(200).json(new ApiResponse(200, data, "Velocity aggregated successfully"));
  } catch (error) {
    next(error);
  }
};
