import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "development"
        ? /^http:\/\/localhost:\d+$/
        : [process.env.FRONTEND_URL, /^https:\/\/.*\.vercel\.app$/].filter(Boolean),
    credentials: true,
  },
});

// userId -> Set<socketId>, so multiple tabs/devices per user work correctly
const userSocketMap = new Map();

function broadcastOnlineUsers() {
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
}

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId || socket.handshake.query.userId;

  console.log("Socket connected", socket.id, "userId=", userId);

  if (userId) {
    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId).add(socket.id);
    broadcastOnlineUsers();
  }

  socket.on("typing", ({ receiverId }) => {
    if (!userId || !receiverId) return;
    getReceiverSocketId(receiverId).forEach((socketId) => {
      io.to(socketId).emit("typing", { senderId: userId });
    });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    if (!userId || !receiverId) return;
    getReceiverSocketId(receiverId).forEach((socketId) => {
      io.to(socketId).emit("stopTyping", { senderId: userId });
    });
  });

  socket.on("disconnect", () => {
    if (!userId) return;
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) userSocketMap.delete(userId);
    }
    broadcastOnlineUsers();
  });
});

export function getReceiverSocketId(receiverId) {
  const sockets = userSocketMap.get(String(receiverId));
  return sockets ? Array.from(sockets) : [];
}

export { io, app, server };
