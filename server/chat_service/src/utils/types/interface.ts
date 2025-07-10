import { Request } from "express";
import { Document, Types } from "mongoose";

declare global {
    interface IMessage extends Document {
        chatId: Types.ObjectId;
        sender: string;
        text?: string;
        image?: {
          url: string;
          publicId: string;
        };
        messageType: "text" | "image";
        seen: boolean;
        seenAt?: Date;
        createdAt: Date;
        updatedAt: Date;
      }

      interface IChat extends Document {
        users: string[];
        latestMessage: {
          text: string;
          sender: string;
        };
      
        createdAt: Date;
        updatedAt: Date;
      }

    interface IAuthenticatedRequest extends Request {
        isAuth?: boolean;
        userId?: string;
        userRole?: string;
    }

    interface IRabbitMQResult {
        success: boolean;
        status: number;
        message: string;
        data: object;
        token?: string;
    }
}

export { };