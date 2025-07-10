import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
    interface IDecodedToken extends JwtPayload {
        id: string;
        role?: string;
    }

    interface IAuthenticatedRequest extends Request {
        isAuth?: boolean;
        userId?: string;
        userRole?: string;
        cookies: { [key: string]: string };
    }

    interface IRabbitMQResult {
        success: boolean;
        status: number;
        message: string;
        data: object;
        token?: string;
    }
}

export { };