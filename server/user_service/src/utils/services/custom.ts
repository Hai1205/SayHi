import { NextFunction, Request, RequestHandler, Response } from "express";

export const CustomRequestHandler = (handler: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      handler(req, res, next);
    } catch (error) {
      console.error(">>> ", error);
      next(error);
    }
  };
};

export const CustomHandler = <T extends (...args: any[]) => any>(handler: T) => {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return handler(...args);
    } catch (error) {
      console.error(">>> ", error);
      throw error;
    }
  };
};

export class CustomError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
