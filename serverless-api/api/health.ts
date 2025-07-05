/**
 * Health check endpoint for Vercel serverless function.
 * Provides basic API status and uptime monitoring.
 */

import { NextApiRequest, NextApiResponse } from '../types/next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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