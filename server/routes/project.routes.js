import express from "express";
import { 
  getProjects, 
  createProject, 
  getProjectDetail, 
  updateProject, 
  deleteProject, 
  getProjectStats 
} from "../controllers/project.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { checkPlanLimit } from "../middlewares/checkPlanLimit.js";

// Use mergeParams so :wid is accessible inside this router
const router = express.Router({ mergeParams: true });

router.get("/", verifyToken, checkRole(), getProjects);
router.post("/", verifyToken, checkRole(["admin", "manager"]), checkPlanLimit("projects"), createProject);

router.get("/:pid", verifyToken, checkRole(), getProjectDetail);
router.patch("/:pid", verifyToken, checkRole(["admin", "manager"]), updateProject);
router.delete("/:pid", verifyToken, checkRole(["admin", "manager"]), deleteProject);

router.get("/:pid/stats", verifyToken, checkRole(), getProjectStats);

export default router;
