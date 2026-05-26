import { Response } from 'express';
import { ApiResponse } from '../../shared/types';

export function sendSuccess<T>(res: Response, data?: T, message?: string): void {
  res.json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

export function sendError(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({
    success: false,
    message,
  } as ApiResponse<null>);
}
