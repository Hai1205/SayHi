import TryCatch from "../utils/services/customTryCatch.js";
import { prisma } from "../utils/configs/database.js";
import bcrypt from "bcrypt";
import { parseRequestData } from "../utils/services/helper.js";

export const getAllUsers = TryCatch(async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export const getUserById = async (data: { userId: string }) => {
  const { userId } = data;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    success: true,
    message: "User fetched successfully",
    data: user
  };
};

export const getProfile = TryCatch(async (req, res) => {
  const userId = req.params.userId;
  const result = await getUserById({ userId: userId as string });
  res.json(result.data);
});

export const createUser = TryCatch(async (req, res) => {
  const { name, email, password } = parseRequestData(req);

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
  const { name, email, password } = parseRequestData(req);

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

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (password) updateData.password = await bcrypt.hash(password, 10);

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