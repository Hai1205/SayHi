import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  createAdminUser,
  verifyOTP,
  resendOTP,
} from "../controllers/authController";
import { hasOneOfPermission, isAdmin, isAuth } from "../utils/services/middlewares";

const authRoute = express.Router();
authRoute.post("/register", registerUser);
authRoute.post("/login", loginUser);
authRoute.post("/logout", isAuth, logoutUser);
authRoute.post("/register-admin", hasOneOfPermission(isAdmin), createAdminUser);
authRoute.post("/verify-otp", verifyOTP);
authRoute.post("/resend-otp", resendOTP);

export default authRoute;