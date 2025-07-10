/**
 * Error handling utilities for API endpoints
 */

import { NextApiResponse } from 'next';

interface ApiError extends Error {
  code?: string;
  statusCode?: number;
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: string;
  };
}

/**
 * Handles errors consistently across API endpoints
 */
export function handleError(
  error: ApiError | Error, 
  res: NextApiResponse<ApiErrorResponse>, 
  customMessage?: string,
  statusCode: number = 500
): void {
  console.error('API Error:', error);
  
  const message = customMessage || error.message || 'Internal server error';
  const code = (error as ApiError).code || 'UNKNOWN_ERROR';
  
  // Return structured error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
}

/**
 * Sends successful response with data
 */
export function sendSuccess<T = unknown>(
  res: NextApiResponse<ApiSuccessResponse<T>>, 
  data: T, 
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  statusCode: number = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  res.status(statusCode).json(response);
}