import { Chat } from "../models/chatModel";
import { Messages } from "../models/messageModel";
import { uploadFiles } from "../utils/configs/cloudinary";
import { sendMessageAndWaitResponse } from "../utils/configs/rabbitmq";
import { getReceiverSocketId, io } from "../utils/configs/socket";
import { CHAT_QUEUE, USER_QUEUE } from "../utils/services/constants";
import { CustomRequestHandler } from "../utils/services/custom";

export const createNewChat = CustomRequestHandler(
  async (req: IAuthenticatedRequest, res) => {
    const userId = req.params.userId;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        message: "Other userId is required",
      });
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

    if (existingChat) {
      return res.json({
        message: "Chat already exist",
        chatId: existingChat._id,
      });
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "New Chat created",
      chatId: newChat._id,
    });
  }
);

export const getUserChats = CustomRequestHandler(async (req: IAuthenticatedRequest, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({
      message: " UserId missing",
    });
  }

  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);

      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId },
        seen: false,
      });

      try {
        const result = await sendMessageAndWaitResponse(CHAT_QUEUE, {
          action: 'get_user_by_id',
          data: { userId }
        }) as IRabbitMQResult;

        if (!result.success) {
          return res.status(result.status || 400).json({
            message: result.message
          });
        }

        return {
          data: {
            user: result.data,
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          }
        };
      } catch (error) {
        console.log(error);
        return {
          data: {
            user: { _id: otherUserId, name: "Unknown User" },
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unseenCount,
            },
          }
        };
      }
    })
  );

  res.json({
    chats: chatWithUserData,
  });
});

export const sendMessage = CustomRequestHandler(async (req: IAuthenticatedRequest, res) => {
  const senderId = req.params.senderId;
  const { chatId, text } = req.body;
  const file = req.file;

  if (!senderId) {
    return res.status(401).json({
      message: "unauthorized",
    });
  }
  if (!chatId) {
    return res.status(400).json({
      message: "ChatId Required",
    });
  }

  if (!text && !file) {
    return res.status(400).json({
      message: "Either text or image is required",
    });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({
      message: "Chat not found",
    });
  }

  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === senderId.toString()
  );

  if (!isUserInChat) {
    return res.status(403).json({
      message: "You are not a participant of this chat",
    });
  }

  const otherUserId = chat.users.find(
    (userId) => userId.toString() !== senderId.toString()
  );

  if (!otherUserId) {
    return res.status(401).json({
      message: "No other user",
    });
  }

  //socket setup
  const receiverSocketId = getReceiverSocketId(otherUserId.toString());
  let isReceiverInChatRoom = false;

  if (receiverSocketId) {
    const receiverSocket = io.sockets.sockets.get(receiverSocketId);
    if (receiverSocket && receiverSocket.rooms.has(chatId)) {
      isReceiverInChatRoom = true;
    }
  }

  let messageData: any = {
    chatId: chatId,
    sender: senderId,
    seen: isReceiverInChatRoom,
    seenAt: isReceiverInChatRoom ? new Date() : undefined,
  };

  if (file) {
    const media = await uploadFiles(file, "message");
    messageData.media = media;
    messageData.messageType = "media";
    messageData.text = text || "";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  const message = new Messages(messageData);

  const savedMessage = await message.save();

  const latestMessageText = file ? "Media" : text;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );

  //emit to sockets
  io.to(chatId).emit("newMessage", savedMessage);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", savedMessage);
  }

  const senderSocketId = getReceiverSocketId(senderId.toString());
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", savedMessage);
  }

  if (isReceiverInChatRoom && senderSocketId) {
    io.to(senderSocketId).emit("messagesSeen", {
      chatId: chatId,
      seenBy: otherUserId,
      messageIds: [savedMessage._id],
    });
  }

  res.status(201).json({
    message: savedMessage,
    sender: senderId,
  });
});

export const getMessagesByChat = CustomRequestHandler(
  async (req: IAuthenticatedRequest, res) => {
    const { userId, chatId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!chatId) {
      return res.status(400).json({
        message: "ChatId Required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found",
      });
    }

    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === userId.toString()
    );

    if (!isUserInChat) {
      return res.status(403).json({
        message: "You are not a participant of this chat",
      });
    }

    const messagesToMarkSeen = await Messages.find({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });

    await Messages.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find((id) => id !== userId);

    try {
      const result = await sendMessageAndWaitResponse(USER_QUEUE, {
        action: 'get_user_by_id',
        data: { userId }
      }) as IRabbitMQResult;

      if (!result.success) {
        res.status(result.status || 400).json({
          message: result.message
        });

        return;
      }

      if (!otherUserId) {
        return res.status(400).json({
          message: "No other user",
        });
      }

      //socket work
      if (messagesToMarkSeen.length > 0) {
        const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messagesSeen", {
            chatId: chatId,
            seenBy: userId,
            messageIds: messagesToMarkSeen.map((msg) => msg._id),
          });
        }
      }

      res.json({
        messages,
        user: result.data,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown User" },
      });
    }
  }
);