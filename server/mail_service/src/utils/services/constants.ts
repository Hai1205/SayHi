import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT!;
export const DATABASE_URL = process.env.DATABASE_URL!;
export const RABBITMQ_URL = process.env.RABBITMQ_URL!;
export const REDIS_URL = process.env.REDIS_URL!;
export const EMAIL_USER = process.env.EMAIL_USER!;
export const EMAIL_PASS = process.env.EMAIL_PASS!;
export const NODE_ENV = process.env.NODE_ENV!;

export const AUTH_QUEUE = 'AUTH_QUEUE';
export const USER_QUEUE = 'USER_QUEUE';
export const MAIL_QUEUE = 'MAIL_QUEUE';
export const CHAT_QUEUE = "CHAT_QUEUE";

export const TOTAL_MS_IN_DAY = 24 * 60 * 60 * 1000;