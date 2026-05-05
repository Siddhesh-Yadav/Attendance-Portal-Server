import { Request, Response } from 'express';

interface SuccessResponseOptions<T = any> {
  message?: string;
  data?: T;
  statusCode?: number;
}

interface ErrorResponseOptions {
  message: string;
  errorCode: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export function sendSuccess<T = any>(res: Response, options: SuccessResponseOptions<T>): void {
  const { message = 'Success', data, statusCode = 200 } = options;
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, options: ErrorResponseOptions): void {
  const { message, errorCode, details, statusCode = 500 } = options;
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(details && { details }),
  });
}
