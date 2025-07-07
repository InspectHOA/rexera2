/**
 * Health check endpoint for Vercel serverless function.
 * Provides basic API status and uptime monitoring.
 */

import { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  success: boolean;
  message: string;
  timestamp: string;
  environment: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | ErrorResponse>
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}