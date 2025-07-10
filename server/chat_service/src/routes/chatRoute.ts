import express from "express";
import {
  getAllUsers,
  getProfile,
  rootRoute,
  createUser,
  updateUser,
  deleteUser,
  createAdminUser
} from "../controllers/chatController.js";
import { hasOneOfPermission, isAdmin, isOwner } from "../utils/services/middlewares.js";

const userRoute = express.Router();
userRoute.get("", rootRoute);
userRoute.get("/get-all", getAllUsers);
userRoute.get("/get-profile/:userId", getProfile);
userRoute.post("/create-user", createUser);
userRoute.put("/update-user/:userId", hasOneOfPermission(isAdmin, isOwner), updateUser);
userRoute.delete("/delete-user/:userId", hasOneOfPermission(isAdmin, isOwner), deleteUser);
userRoute.post("/create-admin-user", hasOneOfPermission(isAdmin), createAdminUser);

export default userRoute;