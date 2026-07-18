import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessagesAsSeen,
  sendMessage,
  toggleReaction,
} from "../controllers/message.controller.js";
const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/seen/:id", protectRoute, markMessagesAsSeen);
router.put("/reaction/:id", protectRoute, toggleReaction);
export default router;
