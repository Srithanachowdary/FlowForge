import express from "express";
import { 
  suggestSprint, 
  generateSubtasks, 
  predictDelay, 
  summarizeSprint 
} from "../controllers/ai.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/suggest-sprint", verifyToken, suggestSprint);
router.post("/generate-subtasks", verifyToken, generateSubtasks);
router.post("/predict-delay", verifyToken, predictDelay);
router.post("/summarize-sprint", verifyToken, summarizeSprint);

export default router;
