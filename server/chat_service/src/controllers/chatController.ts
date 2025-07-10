import TryCatch from "../utils/services/customTryCatch.js";
import { prisma, redisClient } from "../utils/configs/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY, MAIL_QUEUE } from "../utils/services/constants.js";
import { createOTP, parseRequestData } from "../utils/services/helper.js";
import { sendMessageAndWaitResponse } from "../utils/configs/rabbitmq.js";
import { STATUS } from "@prisma/client";

export const getAllUsers = TryCatch(async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const getProfile = TryCatch(async (req, res) => {
  const userId = req.params.userId;
  const user = await getUserById(userId as string);
  res.json(user);
});

export const createUser = TryCatch(async (req, res) => {
  const data = parseRequestData(req);
  const { name, email, password } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const userData: any = {
    name,
    email,
    password: hashPassword
  };

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const avatarFile = req.files.find(file => file.fieldname === 'avatar');
    if (avatarFile) {
      userData.avatar = avatarFile.path;
    }
  }

  const user = await prisma.user.create({
    data: userData
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  });
});

export const updateUser = TryCatch(async (req, res) => {
  const userId = req.params.userId;
  const data = parseRequestData(req);

  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const avatarFile = req.files.find(file => file.fieldname === 'avatar');
    if (avatarFile) {
      updateData.avatar = avatarFile.path;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  res.json({
    success: true,
    message: "User updated successfully",
    user: {
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar
    }
  });
});

export const deleteUser = TryCatch(async (req, res) => {
  const userId = req.params.userId;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  res.json({
    success: true,
    message: "User deleted successfully"
  });
});

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  try {
    const { name, email, password } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false,
        status: 400,
        message: "User already exists",
      };
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashPassword },
    });

    const otpResult = await createAndStoreOTP(email);
    if ('error' in otpResult) {
      return {
        success: false,
        status: otpResult.status,
        message: otpResult.error,
      };
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Error in registerUser:", error);
    return {
      success: false,
      status: 500,
      message: "Internal server error",
    };
  }
};

const createAndStoreOTP = async (email: string) => {
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
};

const sendMail = async (message: object) => {
  const result = await sendMessageAndWaitResponse(MAIL_QUEUE, {
    action: 'send_mail',
    data: message,
  }) as IRabbitMQResult;

  if (!result.success) {
    return { success: false, status: result.status, message: result.message };
  }

  return {
    success: true,
    status: 200,
    message: 'Mail sent',
    data: result.data
  };
};

export const verifyOTP = async (data: { email: string, otp: string }) => {
  const { email, otp } = data;

  const otpKey = `otp:${email}`;
  const storedOTP = await redisClient.get(otpKey);

  if (storedOTP !== otp) {
    return { success: false, status: 400, message: 'Invalid OTP' };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      success: false,
      status: 404,
      message: 'User not found'
    };
  }

  await prisma.user.update({
    where: { email },
    data: { status: STATUS.ACTIVE }
  });

  await redisClient.del(otpKey);

  return {
    success: true,
    status: 200,
    message: 'OTP verified',
  };
};

export const resendOTP = async (data: { email: string }) => {
  const otpResult = await createAndStoreOTP(data.email);
  if ('error' in otpResult) {
    return otpResult;
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
    message: 'OTP resent'
  };
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return {
        success: false,
        status: 404,
        message: "User not found"
      };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return {
        success: false,
        status: 400,
        message: "Invalid password"
      };
    }

    const loginKey = `login:${email}`;
    const storedLogin = await redisClient.get(loginKey);
    if (storedLogin) {
      return {
        success: false,
        status: 400,
        message: "User already logged in"
      };
    }

    const token = jwt.sign({
      id: user.id,
      role: user?.role
    }, JWT_SECRET_KEY, {
      expiresIn: "7d"
    });

    return {
      success: true,
      status: 200,
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error in loginUser:', error);
    return {
      success: false,
      status: 500,
      message: "Internal server error"
    };
  }
};

export const logoutUser = async (data: { email: string }) => {
  const { email } = data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, status: 404, message: 'User not found' };
  }

  const loginKey = `login:${email}`;
  const storedLogin = await redisClient.get(loginKey);
  if (!storedLogin) {
    return {
      success: false,
      status: 400,
      message: "User not logged in"
    };
  }

  await redisClient.del(loginKey);

  return {
    success: true,
    status: 200,
    message: "Logged out successfully"
  };
}

export const createAdminUser = TryCatch(async (req: IAuthenticatedRequest, res) => {
  const data = parseRequestData(req);
  const { name, email, password } = data;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp đầy đủ thông tin"
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const userData: any = {
    name,
    email,
    password: hashPassword,
    role: 'ADMIN'
  };

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const avatarFile = req.files.find(file => file.fieldname === 'avatar');
    if (avatarFile) {
      userData.avatar = avatarFile.path;
    }
  }

  const user = await prisma.user.create({
    data: userData
  });

  res.status(201).json({
    success: true,
    message: "Admin user created successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});