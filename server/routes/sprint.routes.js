import express from "express";
import { 
  getSprints, 
  createSprint, 
  updateSprint, 
  addTasksToSprint, 
  startSprint, 
  completeSprint, 
  getSprintVelocity 
} from "../controllers/sprint.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";

// mergeParams to allow access to workspaceId (wid) and projectId (pid)
const router = express.Router({ mergeParams: true });

router.get("/", verifyToken, checkRole(), getSprints);
router.post("/", verifyToken, checkRole(["admin", "manager"]), createSprint);
router.patch("/:sid", verifyToken, checkRole(["admin", "manager"]), updateSprint);

router.post("/:sid/tasks", verifyToken, checkRole(["admin", "manager", "developer"]), addTasksToSprint);
router.patch("/:sid/start", verifyToken, checkRole(["admin", "manager"]), startSprint);
router.patch("/:sid/complete", verifyToken, checkRole(["admin", "manager"]), completeSprint);

// Sub-route for project-wide velocity aggregation (prefixed before :sid so it matches first!)
router.get("/velocity", verifyToken, checkRole(), getSprintVelocity);

export default router;
