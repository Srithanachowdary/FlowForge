import express from "express";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.patch("/:id/read", verifyToken, markAsRead);
router.patch("/read-all", verifyToken, markAllAsRead);

export default router;
