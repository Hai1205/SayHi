import express from "express";
import { upload } from "../utils/services/helper";
import { createNewChat, getMessagesByChat, getUserChats, sendMessage } from "../controllers/chatController";


const router = express.Router();
router.post("/chats/create-chat", createNewChat);
router.get("/chats/get-user-chats/:userId", getUserChats);
router.post("/messages/send-message/:senderId", upload.single("image"), sendMessage);
router.get("/messages/get-message-by-chat/:chatId/:userId", getMessagesByChat);

export default router;
