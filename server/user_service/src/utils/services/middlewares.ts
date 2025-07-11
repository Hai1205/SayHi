import { NextFunction, Request, Response } from "express";
import { upload } from "./helper.js";
import { GATEWAY_URL } from "./constants.js";
import cors from 'cors';
import { CustomError } from "./custom.js";

export const isAdmin = (req: IAuthenticatedRequest) => req.userRole === 'ADMIN';

export const isOwner = (req: IAuthenticatedRequest) => req.headers['x-user-id'] === req.params.userId;

export const hasPermission = (...checks: ((req: IAuthenticatedRequest) => boolean)[]) => {
    return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
        if (checks.every(check => check(req))) {
            return next();
        }
        return res.status(403).json({
            message: "Bạn không có quyền thực hiện hành động này"
        });
    };
};

export const hasOneOfPermission = (...checks: ((req: any) => boolean)[]) => {
    return (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
        if (checks.some(check => check(req))) {
            return next();
        }
        return res.status(403).json({
            message: "Bạn không có quyền thực hiện hành động này"
        });
    };
};

export const acceptFormdata = (req: Request, res: Response, next: NextFunction) => {
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

const ALLOWED_ORIGIN: string[] = [
    GATEWAY_URL,
]

export const checkCORS = cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGIN.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("This address is not allowed by CORS"));
        }
    },
    credentials: true,
});

export const errorResponse = (err: CustomError, req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    console.log(">>> Error Response: ", err);

    return res.status(status).json({
        success: false,
        status,
        message,
    });
}