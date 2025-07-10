import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET_KEY, PUBLIC_ROUTES } from "./constants";
import multer from "multer";

interface DecodedToken extends JwtPayload {
  id: string;
  role?: string;
}

export const isAuth = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    ) as DecodedToken;

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
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({
      message: "Bạn không có quyền thực hiện hành động này"
    });
  }
  next();
};

export const isOwnerOrAdmin = (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const requestedUserId = req.params.userId;

  if (req.userRole === 'ADMIN' || req.userId === requestedUserId) {
    next();
  } else {
    return res.status(403).json({
      message: "Bạn không có quyền thực hiện hành động này"
    });
  }
};

export const requestLogger = (req: any, res: Response, next: NextFunction) => {
  next();
};

export const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const handleFormData = multer({
  storage: uploadStorage,
}).any();

export const formDataMiddleware = (req: any, res: Response, next: NextFunction) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    handleFormData(req, res, function (err) {
      if (err) {
        console.error("Lỗi xử lý formdata:", err);
        return res.status(500).json({ success: false, message: "Lỗi xử lý formdata" });
      }
      next();
    });
  } else {
    next();
  }
};

export const acceptFormData = (req: any, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: uploadStorage,
  });
  
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