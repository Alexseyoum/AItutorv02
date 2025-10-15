import { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(req: NextRequest, limit = 10, windowMs = 60000) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowKey = `${ip}-${Math.floor(now / windowMs)}`;
  
  const record = rateLimitMap.get(windowKey) || { count: 0, resetTime: now + windowMs };
  
  if (record.resetTime <= now) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }
  
  if (record.count >= limit) {
    return { exceeded: true, resetTime: record.resetTime };
  }
  
  record.count++;
  rateLimitMap.set(windowKey, record);
  
  return { exceeded: false };
}