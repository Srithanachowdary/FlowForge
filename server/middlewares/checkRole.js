import Workspace from "../models/Workspace.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to check workspace membership and enforce Role-Based Access Control (RBAC).
 * Expects workspace ID in req.params.wid (matching app.js routing scheme).
 * 
 * @param {Array<string>} allowedRoles Roles permitted to access the route.
 */
export const checkRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.wid || req.body.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        throw new ApiError(400, "Workspace context (wid) is missing");
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new ApiError(404, "Workspace not found");
      }

      // Check if user is a member of the workspace
      const member = workspace.members.find(
        (m) => m.userId.toString() === req.user._id.toString()
      );

      if (!member) {
        throw new ApiError(403, "Access denied: You are not a member of this workspace");
      }

      // Inject details into request object for route handlers
      req.memberRole = member.role;
      req.workspace = workspace;

      // If allowedRoles is empty, we only check membership
      if (allowedRoles.length > 0) {
        const isPermitted = allowedRoles.includes(member.role);
        
        if (!isPermitted) {
          throw new ApiError(
            403, 
            `Forbidden: Access requires any of the following roles: [${allowedRoles.join(", ")}]. Current role: [${member.role}]`
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
