import { Request } from "express";

declare global {
    interface IUser {
        id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        playlist: string[];
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
        data: IUser;
        token?: string;
    }
}

export { };