import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
} from "../controllers/authController";
import { isAuth } from "../utils/services/middlewares";

const authRoute = express.Router();

authRoute.post("/register", registerUser);
authRoute.post("/login", loginUser);
authRoute.post("/logout", isAuth, logoutUser);

export default authRoute;