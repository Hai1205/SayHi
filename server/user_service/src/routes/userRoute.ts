import express from "express";
import {
  getAllUsers,
  getProfile,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { hasOneOfPermission, isAdmin, isOwner } from "../utils/services/middlewares.js";

const userRoute = express.Router();
userRoute.get("/get-all", getAllUsers);
userRoute.get("/get-profile/:userId", getProfile);
userRoute.post("/create-user", createUser);
userRoute.put("/update-user/:userId", hasOneOfPermission(isAdmin, isOwner), updateUser);
userRoute.delete("/delete-user/:userId", hasOneOfPermission(isAdmin, isOwner), deleteUser);

export default userRoute;