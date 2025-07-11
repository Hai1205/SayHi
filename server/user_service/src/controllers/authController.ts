import { prisma, redisClient } from "../utils/configs/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY, MAIL_QUEUE } from "../utils/services/constants.js";
import { createOTP } from "../utils/services/helper.js";
import { sendMessageAndWaitResponse } from "../utils/configs/rabbitmq.js";
import { STATUS } from "@prisma/client";
import { CustomError, CustomHandler } from "../utils/services/custom.js";

export const registerUser = CustomHandler(async (data: { name: string; email: string; password: string }) => {
    const { name, email, password } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new CustomError(400, "User already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { name, email, password: hashPassword },
    });

    const otpResult = await createAndStoreOTP(email);
    if ('error' in otpResult) {
        throw new CustomError(otpResult.status as number, otpResult.error as string);
    }

    const message = {
        to: email,
        subject: "Welcome to Say Hi",
        body: `Welcome to Say Hi ${name}. Your OTP is ${otpResult.otp}.`,
    };
    const mailResult = await sendMail(message);
    if (!mailResult.success) {
        return mailResult;
    }

    return {
        success: true,
        status: 201,
        message: "User registered successfully",
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        }
    };
});

const createAndStoreOTP = CustomHandler(async (email: string) => {
    const rateLimitKey = `otp:ratelimit:${email}`;
    const existing = await redisClient.get(rateLimitKey);

    if (existing) {
        return { error: 'Too many requests', status: 429 };
    }

    const otp = createOTP();
    const otpKey = `otp:${email}`;

    await redisClient.set(otpKey, otp, { EX: 60 * 5 });
    await redisClient.set(rateLimitKey, '1', { EX: 60 });

    return { otp };
});

const sendMail = CustomHandler(async (message: object) => {
    const result = await sendMessageAndWaitResponse(MAIL_QUEUE, {
        action: 'send_mail',
        data: message,
    }) as IRabbitMQResult;

    if (!result.success) {
        throw new CustomError(result.status as number, result.message as string);
    }

    return {
        success: true,
        status: 200,
        message: 'Mail sent',
        data: result.data
    };
});

export const verifyOTP = CustomHandler(async (data: { email: string; otp: string }) => {
    const { email, otp } = data;

    const otpKey = `otp:${email}`;
    const storedOTP = await redisClient.get(otpKey);

    if (storedOTP !== otp) {
        throw new CustomError(400, "Invalid OTP");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    await prisma.user.update({
        where: { email },
        data: { status: STATUS.ACTIVE },
    });

    await redisClient.del(otpKey);

    return {
        success: true,
        status: 200,
        message: "OTP verified",
    };
});

export const resendOTP = CustomHandler(async (data: { email: string }) => {
    const otpResult = await createAndStoreOTP(data.email);
    if ("error" in otpResult) {
        throw otpResult;
    }

    const message = {
        to: data.email,
        subject: "Welcome to Say Hi",
        body: `Welcome to Say Hi. Your OTP is ${otpResult.otp}.`,
    };
    const mailResult = await sendMail(message);
    if (!mailResult.success) {
        return mailResult;
    }

    return {
        success: true,
        status: 200,
        message: "OTP resent",
    };
});

export const loginUser = CustomHandler(async (data: { email: string; password: string }) => {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new CustomError(400, "Invalid password");
    }

    const loginKey = `login:${email}`;
    const storedLogin = await redisClient.get(loginKey);
    if (storedLogin) {
        throw new CustomError(400, "User already logged in");
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user?.role,
        },
        JWT_SECRET_KEY,
        {
            expiresIn: "7d",
        }
    );

    return {
        success: true,
        status: 200,
        message: "Logged in successfully",
        data: {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        }
    };
});

export const logoutUser = CustomHandler(async (data: { email: string }) => {
    const { email } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { success: false, status: 404, message: "User not found" };
    }

    const loginKey = `login:${email}`;
    const storedLogin = await redisClient.get(loginKey);
    if (!storedLogin) {
        throw new CustomError(400, "User not logged in");
    }

    await redisClient.del(loginKey);

    return {
        success: true,
        status: 200,
        message: "Logged out successfully",
    }
});

export const createAdminUser = CustomHandler(async (data: { name: string, email: string, password: string, avatarFile: File }) => {
    const { name, email, password, avatarFile } = data;

    if (!name || !email || !password) {
        throw new CustomError(400, "Please input full information");
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new CustomError(400, "User already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const userData: any = {
        name,
        email,
        password: hashPassword,
        role: 'ADMIN'
    };

    if (avatarFile) {
        userData.avatar = avatarFile;
    }

    const user = await prisma.user.create({
        data: userData
    });

    return {
        success: true,
        message: "Admin user created successfully",
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        }
    }
});