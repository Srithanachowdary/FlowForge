import express from "express";
import { addComment, deleteComment } from "../controllers/task.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { checkRole } from "../middlewares/checkRole.js";

// mergeParams to pass through workspace, project, and task parameters
const router = express.Router({ mergeParams: true });

router.post("/", verifyToken, checkRole(["admin", "manager", "developer"]), addComment);
router.delete("/:cid", verifyToken, checkRole(["admin", "manager", "developer"]), deleteComment);

export default router;
