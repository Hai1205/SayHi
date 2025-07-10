import { PrismaClient } from "@prisma/client";
import { DATABASE_URL, REDIS_URL } from "../services/constants.js";
import { createClient } from "redis"

export const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
        db: {
            url: DATABASE_URL
        },
    },
});

export const connectMysqlWithRetry = async (maxRetries = 5, delay = 5000) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await prisma.$connect();
            console.log('Prisma connected to MySQL successfully');
            return;
        } catch (err) {
            console.error(`Failed to connect to MySQL (Attempt ${retries + 1}/${maxRetries}):`, err);
            retries++;
            if (retries >= maxRetries) {
                console.error('Max retries reached. Exiting.');
                process.exit(1);
            }
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export const redisClient = createClient({
    url: REDIS_URL
});

export const connectRedisWithRetry = async (maxRetries = 5, delay = 5000) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await redisClient.connect();
            console.log('Redis connected successfully');
            return;
        } catch (err) {
            console.error(`Failed to connect to Redis (Attempt ${retries + 1}/${maxRetries}):`, err);
            retries++;
            if (retries >= maxRetries) {
                console.error('Max retries reached. Exiting.');
                process.exit(1);
            }
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export default async function connectDatabase() {
    await connectMysqlWithRetry();
    await connectRedisWithRetry();
}