import express from "express";
import { 
  getTasks, 
  createTask, 
  getTaskDetail, 
  updateTask, 
  updateTaskStatus, 
  deleteTask,
  uploadTaskAttachment
} from "../controllers/task.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";
import { upload } from "../middlewares/upload.js";
import { checkPlanLimit } from "../middlewares/checkPlanLimit.js";

// Use mergeParams so :wid and :pid are accessible
const router = express.Router({ mergeParams: true });

router.get("/", verifyToken, checkRole(), getTasks);
router.post("/", verifyToken, checkRole(["admin", "manager", "developer"]), checkPlanLimit("tasks"), createTask);

router.get("/:tid", verifyToken, checkRole(), getTaskDetail);
router.patch("/:tid", verifyToken, checkRole(["admin", "manager", "developer"]), updateTask);
router.patch("/:tid/status", verifyToken, checkRole(["admin", "manager", "developer"]), updateTaskStatus);
router.delete("/:tid", verifyToken, checkRole(["admin", "manager", "developer"]), deleteTask);

// File upload endpoint
router.post("/:tid/attachments", verifyToken, checkRole(["admin", "manager", "developer"]), upload.single("file"), uploadTaskAttachment);

export default router;
