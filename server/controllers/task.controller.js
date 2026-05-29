import mongoose from "mongoose";
import Task from "../models/Task.model.js";
import Comment from "../models/Comment.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import Workspace from "../models/Workspace.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. Get all tasks in project (optionally filter by status, priority, assignees)
export const getTasks = async (req, res, next) => {
  try {
    const { pid } = req.params;
    const tasks = await Task.find({ projectId: pid })
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar")
      .sort({ order: 1 });

    return res.status(200).json(new ApiResponse(200, tasks, "Tasks retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

// 2. Create task
export const createTask = async (req, res, next) => {
  try {
    const { wid, pid } = req.params;
    const { title, description, priority, type, assignees, storyPoints, dueDate, labels, sprintId } = req.body;

    if (!title) {
      throw new ApiError(400, "Task title is required");
    }

    // Verify Stripe active plan limits (Free plans allow max 15 tasks per workspace)
    const workspace = await Workspace.findById(wid);
    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    const currentTaskCount = await Task.countDocuments({ workspaceId: wid });
    if (workspace.plan === "free" && currentTaskCount >= 15) {
      throw new ApiError(
        402, 
        "Workspace has reached the limit of 15 tasks for Free plans. Please upgrade your plan in billing settings to add more tasks."
      );
    }

    // Calculate next order position in the 'todo' status column
    const columnCount = await Task.countDocuments({ projectId: pid, status: "todo" });

    const task = await Task.create({
      title,
      description: description || "",
      workspaceId: wid,
      projectId: pid,
      sprintId: sprintId || null,
      status: "todo",
      priority: priority || "medium",
      type: type || "story",
      assignees: assignees || [],
      reporter: req.user._id,
      storyPoints: storyPoints || 0,
      order: columnCount,
      dueDate: dueDate || null,
      labels: labels || []
    });

    const populated = await Task.findById(task._id)
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    // Emit Socket event so other users see it added in real time
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("task-updated", populated);
    }

    return res.status(201).json(new ApiResponse(201, populated, "Task created successfully"));
  } catch (error) {
    next(error);
  }
};

// 3. Get task detail (including comments list)
export const getTaskDetail = async (req, res, next) => {
  try {
    const { tid } = req.params;
    const task = await Task.findById(tid)
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    // Retrieve comments for this task
    const comments = await Comment.find({ taskId: tid })
      .populate("author", "name email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200, 
        { task, comments }, 
        "Task details retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// 4. Update task details
export const updateTask = async (req, res, next) => {
  try {
    const { pid, tid } = req.params;
    const { 
      title, 
      description, 
      priority, 
      type, 
      assignees, 
      storyPoints, 
      dueDate, 
      labels, 
      subtasks,
      sprintId,
      status 
    } = req.body;

    const task = await Task.findById(tid);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (type) task.type = type;
    if (assignees) task.assignees = assignees;
    if (storyPoints !== undefined) task.storyPoints = storyPoints;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels) task.labels = labels;
    if (subtasks) task.subtasks = subtasks;
    if (sprintId !== undefined) task.sprintId = sprintId;
    if (status) task.status = status;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    // Emit live Socket update
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("task-updated", populated);
    }

    return res.status(200).json(new ApiResponse(200, populated, "Task updated successfully"));
  } catch (error) {
    next(error);
  }
};

// 5. Change status (Kanban column drag-and-drop)
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { pid, tid } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const task = await Task.findById(tid);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    task.status = status;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    // Emit live Socket update
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("task-updated", populated);
    }

    return res.status(200).json(new ApiResponse(200, populated, "Task status updated successfully"));
  } catch (error) {
    next(error);
  }
};

// 6. Delete task
export const deleteTask = async (req, res, next) => {
  try {
    const { pid, tid } = req.params;
    const task = await Task.findById(tid);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    await Task.findByIdAndDelete(tid);
    
    // Invalidate comments
    await Comment.deleteMany({ taskId: tid });

    // Emit live Socket deletion event
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("task-deleted", tid);
    }

    return res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// 7. Add comment + parse mentions
export const addComment = async (req, res, next) => {
  try {
    const { wid, pid, tid } = req.params;
    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "Comment content cannot be empty");
    }

    // Parse mentions: Match text like @JohnDoe or @[John Doe]
    const mentions = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    const mentionNames = [];
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionNames.push(match[1]);
    }

    // Look up mentioned users in DB
    if (mentionNames.length > 0) {
      const users = await User.find({ name: { $in: mentionNames } });
      users.forEach((u) => {
        mentions.push(u._id);
      });
    }

    const comment = await Comment.create({
      taskId: tid,
      workspaceId: wid,
      author: req.user._id,
      content,
      mentions,
      isEdited: false
    });

    const populated = await Comment.findById(comment._id).populate("author", "name email avatar");

    // Send notifications to mentioned users
    if (mentions.length > 0) {
      const io = req.app.get("io");
      
      const notifications = mentions
        .filter((id) => id.toString() !== req.user._id.toString()) // don't notify yourself
        .map((recipientId) => ({
          recipient: recipientId,
          sender: req.user._id,
          workspaceId: wid,
          type: "mention",
          message: `${req.user.name} mentioned you in a comment`,
          link: `/board?task=${tid}`
        }));

      if (notifications.length > 0) {
        const createdNotifications = await Notification.insertMany(notifications);
        
        // Emit Socket live notification for each recipient
        if (io) {
          createdNotifications.forEach((notification) => {
            io.to(notification.recipient.toString()).emit("notification", notification);
          });
        }
      }
    }

    return res.status(201).json(new ApiResponse(201, populated, "Comment added successfully"));
  } catch (error) {
    next(error);
  }
};

// 8. Delete comment
export const deleteComment = async (req, res, next) => {
  try {
    const { cid } = req.params;
    const comment = await Comment.findById(cid);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    // Verify creator
    if (comment.author.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only delete your own comments");
    }

    await Comment.findByIdAndDelete(cid);
    return res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// 9. Upload attachment
export const uploadTaskAttachment = async (req, res, next) => {
  try {
    const { pid, tid } = req.params;
    if (!req.file) {
      throw new ApiError(400, "Attachment file is missing");
    }

    const { handleUpload } = await import("../middlewares/upload.js");
    const uploadedFile = await handleUpload(req.file);

    const task = await Task.findById(tid);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    task.attachments.push({
      url: uploadedFile.url,
      name: uploadedFile.name,
      size: uploadedFile.size,
      uploadedBy: req.user._id
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignees", "name email avatar")
      .populate("reporter", "name email avatar");

    // Emit live Socket update
    const io = req.app.get("io");
    if (io) {
      io.to(pid).emit("task-updated", populated);
    }

    return res.status(200).json(new ApiResponse(200, populated, "File uploaded successfully"));
  } catch (error) {
    next(error);
  }
};

