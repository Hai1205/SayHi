import { TOTAL_MS_IN_DAY, AUTH_QUEUE, NODE_ENV } from "../utils/services/constants";
import { sendMessageAndWaitResponse } from "../utils/configs/rabbitmq";
import { parseRequestData } from "../utils/configs/upload";
import { CustomError, CustomRequestHandler } from "../utils/services/custom";

export const registerUser = CustomRequestHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new CustomError(400, "Please input full information"));
  }

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'register',
    data: { name, email, password }
  }) as IRabbitMQResult;

  if (!result.success) {
    return next(new CustomError(result.status, result.message));
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message,
    user: result.data.user
  });
});

export const loginUser = CustomRequestHandler(async (req, res, next) => {
  const data = parseRequestData(req);
  const { email, password } = data;

  if (!email || !password) {
    return next(new CustomError(400, "Please input full information"));
  }

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'login',
    data: { email, password }
  }) as IRabbitMQResult;

  if (!result.success) {
    return next(new CustomError(result.status, result.message));
  }

  res.cookie("token", result.data.token as string, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * TOTAL_MS_IN_DAY
  });

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message,
    user: result.data.user
  });
});

export const logoutUser = CustomRequestHandler(async (req, res, next) => {
  const { email } = req.params;

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'logout',
    data: { email }
  }) as IRabbitMQResult;

  if (!result.success) {
    return next(new CustomError(result.status, result.message));
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message
  });
});

export const createAdminUser = CustomRequestHandler(async (req, res, next)=>{
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new CustomError(400, "Please input full information"));
  }

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'register_admin',
    data: { name, email, password }
  }) as IRabbitMQResult;

  if (!result.success) {
    return next(new CustomError(result.status, result.message));
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message,
    user: result.data.user
  });
});

export const verifyOTP = CustomRequestHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'verify_otp',
    data: { email, otp }
  }) as IRabbitMQResult;

  if (!result.success) {
    return next(new CustomError(result.status, result.message));
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message
  });
});

export const resendOTP = CustomRequestHandler(async (req, res, next) => {
  const { email } = req.body;

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'resend_otp',
    data: { email }
  }) as IRabbitMQResult;

  if (!result.success) {
    return next(new CustomError(result.status, result.message));
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message
  });
}); 