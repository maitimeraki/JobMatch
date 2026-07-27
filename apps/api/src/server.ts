import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string | undefined;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on("disconnect", () => {
    // Cleanup handled automatically by Socket.io
  });
});

export function emitToUser(userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}

server.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, corsOrigin: env.CORS_ORIGIN },
    `JobMatch API server running on port ${env.PORT}`
  );
});
