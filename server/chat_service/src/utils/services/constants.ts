import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT!;
export const DATABASE_URL = process.env.DATABASE_URL!;
export const RABBITMQ_URL = process.env.RABBITMQ_URL!;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY!;
export const REDIS_URL = process.env.REDIS_URL!;
export const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export const AUTH_QUEUE = 'AUTH_QUEUE';
export const USER_QUEUE = 'USER_QUEUE';
export const MAIL_QUEUE = 'MAIL_QUEUE';
export const CHAT_QUEUE = 'CHAT_QUEUE';

export const TOTAL_MS_IN_DAY = 24 * 60 * 60 * 1000;