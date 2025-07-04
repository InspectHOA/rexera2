import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Frontend health check successful',
    architecture: 'Clean API separation implemented'
  });
}