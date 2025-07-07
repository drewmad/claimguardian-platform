import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (for demonstration purposes)
const ratelimit = new Map();
const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 10;

export async function middleware(request: NextRequest) {
  const ip = request.ip || '127.0.0.1';

  if (!ratelimit.has(ip)) {
    ratelimit.set(ip, { count: 0, lastReset: Date.now() });
  }

  const ipData = ratelimit.get(ip);
  const currentTime = Date.now();

  if (currentTime - ipData.lastReset > WINDOW_SIZE_IN_SECONDS * 1000) {
    ipData.count = 0;
    ipData.lastReset = currentTime;
  }

  ipData.count++;

  if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
