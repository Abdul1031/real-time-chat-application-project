import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});


const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }


  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }

  });
});

export function getReceiverSocketId(receiverId) {
  return userSocketMap[receiverId];
}

export { io, app, server };
