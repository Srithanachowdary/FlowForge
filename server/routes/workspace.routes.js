import express from "express";
import { 
  getUserWorkspaces, 
  createWorkspace, 
  getWorkspaceDetail, 
  updateWorkspace, 
  deleteWorkspace, 
  inviteMember, 
  joinWorkspace, 
  changeMemberRole, 
  removeMember 
} from "../controllers/workspace.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { checkPlanLimit } from "../middlewares/checkPlanLimit.js";

const router = express.Router();

// Fetch and create workspaces (globally authenticated)
router.get("/", verifyToken, getUserWorkspaces);
router.post("/", verifyToken, createWorkspace);

// Accept token invite to join workspace
router.post("/join/:token", verifyToken, joinWorkspace);

// Workspace specific endpoints (scoped by :wid)
router.get("/:wid", verifyToken, checkRole(), getWorkspaceDetail);
router.patch("/:wid", verifyToken, checkRole(["admin", "manager"]), updateWorkspace);
router.delete("/:wid", verifyToken, checkRole(["admin"]), deleteWorkspace);

// Invites & Member adjustments
router.post("/:wid/invite", verifyToken, checkRole(["admin", "manager"]), checkPlanLimit("members"), inviteMember);
router.patch("/:wid/members/:userId", verifyToken, checkRole(["admin"]), changeMemberRole);
router.delete("/:wid/members/:userId", verifyToken, checkRole(["admin", "manager"]), removeMember);

export default router;
