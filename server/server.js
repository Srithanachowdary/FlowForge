import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { initSockets } from "./sockets/index.js";

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Create Socket.io Server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Initialize Sockets
initSockets(io);

// Expose Socket.io instance on app to use in controllers if needed
app.set("io", io);

// Database connection & start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Zive Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MDB Connection failed inside server.js boot sequence: ", err);
  });

// Handle Unhandled Rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down server gracefully...");
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
