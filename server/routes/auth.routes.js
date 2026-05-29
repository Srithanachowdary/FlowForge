import express from "express";
import { 
  register, 
  login, 
  verifyEmail, 
  refresh, 
  logout, 
  forgotPassword, 
  resetPassword, 
  getMe,
  googleOneTapLogin
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google-one-tap", googleOneTapLogin);

// Protected routes
router.get("/me", verifyToken, getMe);

export default router;
