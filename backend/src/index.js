import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { seedDefaultUsers } from "./seeds/user.seed.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
const __dirname = path.resolve();

// deployed behind Render/Vercel's reverse proxy — needed so secure cookies
// (sameSite: "none", secure: true) are set correctly over HTTPS in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cookieParser());

const allowedOrigin =
  process.env.NODE_ENV === "development"
    ? /^http:\/\/localhost:\d+$/
    : [process.env.FRONTEND_URL, /^https:\/\/.*\.vercel\.app$/].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// this backend is deployed standalone (e.g. on Render) with the frontend on
// Vercel, so frontend/dist normally won't exist here — only serve it if a
// build was actually placed alongside the backend (monolithic deploy)
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

server.listen(PORT, async () => {
  await connectDB();
  await seedDefaultUsers();
});
