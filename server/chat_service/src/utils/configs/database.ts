import { DATABASE_URL, REDIS_URL } from "../services/constants.js";
import { createClient } from "redis"
import mongoose from 'mongoose';

export const connectMongoWithRetry = async (maxRetries = 5, delay = 5000) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await mongoose.connect(DATABASE_URL, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000
            });
            console.log('Connected to MongoDB successfully');
            return;
        } catch (err) {
            console.error(`Failed to connect to MongoDB (Attempt ${retries + 1}/${maxRetries}):`, err);
            retries++;
            if (retries >= maxRetries) {
                console.error('Max MongoDB retries reached. Exiting.');
                process.exit(1);
            }
            console.log(`Retrying MongoDB in ${delay}ms...`);
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
    await connectMongoWithRetry();
    await connectRedisWithRetry();
}