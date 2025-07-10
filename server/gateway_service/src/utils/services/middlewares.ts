import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY, PUBLIC_ROUTES } from "./constants";
import { upload } from "../configs/upload"; 

export const isAuth = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(403).json({
        message: "Vui lòng đăng nhập",
      });
      return;
    }

    const decodedValue = jwt.verify(
      token,
      JWT_SECRET_KEY
    ) as IDecodedToken;

    if (!decodedValue || !decodedValue.id) {
      res.status(403).json({
        message: "Token không hợp lệ",
      });

      return;
    }

    req.userId = decodedValue.id;
    req.userRole = decodedValue.role || 'USER';
    req.isAuth = true;
    next();
  } catch (error) {
    res.status(403).json({
      message: "Vui lòng đăng nhập",
    });
  }
};

export const isAdmin = (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  return req.userRole === 'ADMIN';
};

export const requestLogger = (req: any, res: Response, next: NextFunction) => {
  next();
};

export const acceptFormData = (req: any, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    upload.any()(req, res, function (err) {
      if (err) {
        console.error('Lỗi xử lý formdata:', err);
        return res.status(500).json({ success: false, message: 'Lỗi xử lý formdata' });
      }
      next();
    });
  } else {
    next();
  }
}

export const checkPublicRoute = (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }

  isAuth(req, res, next);
}

export const hasPermission = (
  ...checks: ((
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => boolean)[]
) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (checks.every((check) => check(req, res, next))) {
      return next();
    }
    return res.status(403).json({
      message: "Bạn không có quyền thực hiện hành động này",
    });
  };
};

export const hasOneOfPermission = (...checks: ((req: IAuthenticatedRequest, res: Response, next: NextFunction) => boolean)[]) => {
  return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    if (checks.some(check => check(req, res, next))) {
      return next();
    }
    return res.status(403).json({
      message: "Bạn không có quyền thực hiện hành động này"
    });
  };
};