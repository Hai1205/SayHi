import TryCatch from "../utils/services/customTryCatch";
import { TOTAL_MS_IN_DAY, AUTH_QUEUE, NODE_ENV } from "../utils/services/constants";
import { sendMessageAndWaitResponse } from "../utils/configs/rabbitmq";
import { parseRequestData } from "../utils/configs/upload";

export const registerUser = TryCatch(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Vui lòng cung cấp đầy đủ thông tin",
    });
  }

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'register',
    data: { name, email, password }
  }) as IRabbitMQResult;

  if (!result.success) {
    res.status(result.status || 400).json({
      message: result.message
    });

    return;
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message,
    user: result.data
  });
});

export const loginUser = TryCatch(async (req, res) => {
  const data = parseRequestData(req);
  const { email, password } = data;

  if (!email || !password) {
    return res.status(400).json({
      message: "Vui lòng cung cấp email và mật khẩu",
    });
  }

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'login',
    data: { email, password }
  }) as IRabbitMQResult;

  if (!result.success) {
    return res.status(result.status || 400).json({
      success: false,
      message: result.message || "Đăng nhập thất bại"
    });
  }

  res.cookie("token", result.token as string, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * TOTAL_MS_IN_DAY
  });

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message,
    user: result.data
  });
});

export const logoutUser = TryCatch(async (req, res) => {
  const { email } = req.params;

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'logout',
    data: { email }
  }) as IRabbitMQResult;

  if (!result.success) {
    return res.status(result.status || 400).json({
      success: false,
      message: result.message
    });
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

export const createAdminUser = TryCatch(async (req, res)=>{
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Vui lòng cung cấp đầy đủ thông tin",
    });
  }

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'register_admin',
    data: { name, email, password }
  }) as IRabbitMQResult;

  if (!result.success) {
    res.status(result.status || 400).json({
      message: result.message
    });

    return;
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message,
    user: result.data
  });
});

export const verifyOTP = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'verify_otp',
    data: { email, otp }
  }) as IRabbitMQResult;

  if (!result.success) {
    return res.status(result.status || 400).json({
      success: false,
      message: result.message
    });
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message
  });
});

export const resendOTP = TryCatch(async (req, res) => {
  const { email } = req.body;

  const result = await sendMessageAndWaitResponse(AUTH_QUEUE, {
    action: 'resend_otp',
    data: { email }
  }) as IRabbitMQResult;

  if (!result.success) {
    return res.status(result.status || 400).json({
      success: false,
      message: result.message
    });
  }

  res.status(result.status).json({
    success: result.success,
    status: result.status,
    message: result.message
  });
}); 