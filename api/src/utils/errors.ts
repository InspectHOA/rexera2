import { Response } from 'express';

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(error: any, res: Response, defaultMessage: string = 'Internal server error') {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      message: error.message
    });
  }

  // Database errors
  if (error.code) {
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'A database error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: defaultMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

export function sendSuccess<T>(res: Response, data: T, pagination?: any) {
  const response: ApiSuccess<T> = {
    success: true,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.json(response);
}

export function sendError(res: Response, statusCode: number, error: string, message: string, details?: any) {
  const response: ApiError = {
    success: false,
    error,
    message
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  res.status(statusCode).json(response);
}