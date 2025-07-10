import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT!;
export const USER_SERVICE_URL = process.env.USER_SERVICE_URL!;
export const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL!;
export const STATISTICS_SERVICE_URL = process.env.STATISTICS_SERVICE_URL!;
export const RABBITMQ_URL = process.env.RABBITMQ_URL!;
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY!;
export const NODE_ENV = process.env.NODE_ENV!;

export const TOTAL_MS_IN_DAY = 24 * 60 * 60 * 1000;

export const AUTH_QUEUE = 'AUTH_QUEUE';
export const USER_QUEUE = 'USER_QUEUE';
export const MAIL_QUEUE = 'MAIL_QUEUE';

export const PUBLIC_ROUTES = [
    // Auth routes
    '/api/auth/login',
    '/api/auth/register',

    // User routes
    '/api/user/get-all',
];