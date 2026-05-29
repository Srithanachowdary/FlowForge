import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import sprintRoutes from "./routes/sprint.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// Security and parser middleware
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(morgan("dev"));


// Stripe Webhook needs raw body, we'll exclude it from JSON parser in routes
app.use((req, res, next) => {
  if (req.originalUrl === "/api/billing/webhook") {
    next();
  } else {
    express.json({ limit: "16kb" })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", apiLimiter);

// Serve static uploads
app.use("/uploads", express.static("uploads"));

// Routes Mapping
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);

// Nested routes: workspace projects, tasks, sprints, comments
app.use("/api/workspaces/:wid/projects", projectRoutes);
app.use("/api/workspaces/:wid/projects/:pid/tasks", taskRoutes);
app.use("/api/workspaces/:wid/projects/:pid/sprints", sprintRoutes);
app.use("/api/workspaces/:wid/projects/:pid/tasks/:tid/comments", commentRoutes);

// Other standalone routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/billing", billingRoutes);

// Health check API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Fallback Route
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handling middleware
app.use(errorHandler);

export { app };
