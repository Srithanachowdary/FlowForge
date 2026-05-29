export const initSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // Join Workspace-wide room
    socket.on("join-workspace", (workspaceId) => {
      socket.join(workspaceId);
      console.log(`👤 Socket ${socket.id} joined Workspace Room: ${workspaceId}`);
    });

    // Join Project-specific room (for board updates)
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      console.log(`📂 Socket ${socket.id} joined Project Room: ${projectId}`);
    });

    // Join User-specific room (for direct notifications)
    socket.on("join-user", (userId) => {
      socket.join(userId);
      console.log(`🔔 Socket ${socket.id} joined User Notification Room: ${userId}`);
    });

    // Handle manual disconnects
    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
