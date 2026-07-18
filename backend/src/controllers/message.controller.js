import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { isValidImageDataUri, MAX_MESSAGE_TEXT_LENGTH } from "../lib/validators.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const DEFAULT_MESSAGE_PAGE_SIZE = 30;
const MAX_MESSAGE_PAGE_SIZE = 100;

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const { before } = req.query;

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_MESSAGE_PAGE_SIZE, 1),
      MAX_MESSAGE_PAGE_SIZE
    );

    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const page = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("replyTo", "text image senderId receiverId createdAt");

    const hasMore = page.length > limit;
    const messages = page.slice(0, limit).reverse();

    res.status(200).json({ messages, hasMore });
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text?.trim() && !image) {
      return res.status(400).json({ error: "Message text or image is required" });
    }

    if (text && text.length > MAX_MESSAGE_TEXT_LENGTH) {
      return res.status(400).json({ error: "Message text is too long" });
    }

    if (String(receiverId) === String(senderId)) {
      return res.status(400).json({ error: "Cannot send a message to yourself" });
    }

    let replyToId;
    if (replyTo) {
      const originalMessage = await Message.findOne({
        _id: replyTo,
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });
      if (originalMessage) replyToId = originalMessage._id;
    }

    let imageUrl;
    if (image) {
      if (!isValidImageDataUri(image)) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const receiverSocketIds = getReceiverSocketId(receiverId);
    const isReceiverOnline = receiverSocketIds.length > 0;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: replyToId,
      status: isReceiverOnline ? "delivered" : "sent",
    });

    await newMessage.save();
    await newMessage.populate("replyTo", "text image senderId receiverId createdAt");

    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newMessage", newMessage);
    });

    getReceiverSocketId(senderId).forEach((socketId) => {
      io.to(socketId).emit("newMessage", newMessage);
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: peerId } = req.params;
    const myId = req.user._id;

    const result = await Message.updateMany(
      { senderId: peerId, receiverId: myId, status: { $ne: "seen" } },
      { $set: { status: "seen" } }
    );

    if (result.modifiedCount > 0) {
      getReceiverSocketId(peerId).forEach((socketId) => {
        io.to(socketId).emit("messagesSeen", { by: myId, peerId });
      });
    }

    res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error in markMessagesAsSeen:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji || typeof emoji !== "string") {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => String(r.userId) === String(userId) && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const otherPartyId =
      String(message.senderId) === String(userId) ? message.receiverId : message.senderId;

    [...getReceiverSocketId(otherPartyId), ...getReceiverSocketId(userId)].forEach(
      (socketId) => {
        io.to(socketId).emit("reactionUpdated", {
          messageId: message._id,
          reactions: message.reactions,
        });
      }
    );

    res.status(200).json({ messageId: message._id, reactions: message.reactions });
  } catch (error) {
    console.error("Error in toggleReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
