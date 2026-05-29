import Workspace from "../models/Workspace.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import { PLAN_LIMITS } from "../utils/planLimits.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to check workspace plan limit boundaries.
 * 
 * @param {string} resource Type of resource to check ("projects" | "tasks" | "members")
 */
export const checkPlanLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.wid || req.body.workspaceId || req.query.workspaceId;
      if (!workspaceId) {
        throw new ApiError(400, "Workspace ID (wid) context is missing");
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new ApiError(404, "Workspace not found");
      }

      const plan = workspace.plan || "free";
      const limits = PLAN_LIMITS[plan];

      if (!limits) {
        throw new ApiError(500, "Invalid plan configuration");
      }

      if (resource === "projects") {
        const count = await Project.countDocuments({ workspaceId, status: "active" });
        if (count >= limits.maxProjects) {
          throw new ApiError(
            403, 
            `Plan Limit Reached: Your current plan [${limits.label}] allows up to ${limits.maxProjects} project(s). Please upgrade to Pro or Team plan to create more projects.`
          );
        }
      }

      if (resource === "tasks") {
        const count = await Task.countDocuments({ workspaceId });
        if (count >= limits.maxTasks) {
          throw new ApiError(
            403, 
            `Plan Limit Reached: Your current plan [${limits.label}] allows up to ${limits.maxTasks} tasks. Please upgrade to Pro or Team plan in settings to add more tasks.`
          );
        }
      }

      if (resource === "members") {
        const count = workspace.members.length;
        if (count >= limits.maxMembers) {
          throw new ApiError(
            403, 
            `Plan Limit Reached: Your current plan [${limits.label}] allows up to ${limits.maxMembers} workspace members. Please upgrade to a higher tier to invite more users.`
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
