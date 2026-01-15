import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (resets on deployment)
// For production, consider using Vercel KV or Upstash Redis
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute for normal users
const MAX_REQUESTS_SCRAPER = 10; // Much lower limit for suspected scrapers

// Known bot user agents to block (aggressive scrapers)
const BLOCKED_BOTS = [
  'AhrefsBot',
  'SemrushBot',
  'DotBot',
  'MJ12bot',
  'BLEXBot',
  'DataForSeoBot',
  'serpstatbot',
  'Bytespider',
  'PetalBot',
];

// Allowed bots (search engines we want to index us)
const ALLOWED_BOTS = [
  'Googlebot',
  'Bingbot',
  'Slurp', // Yahoo
  'DuckDuckBot',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Applebot',
];

function getClientIdentifier(request: NextRequest): string {
  // Use IP + User-Agent for identification
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${ua.slice(0, 50)}`;
}

function isBlockedBot(userAgent: string): boolean {
  return BLOCKED_BOTS.some(bot => userAgent.includes(bot));
}

function isAllowedBot(userAgent: string): boolean {
  return ALLOWED_BOTS.some(bot => userAgent.includes(bot));
}

function isSuspiciousBehavior(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';

  // No user agent is suspicious
  if (!userAgent || userAgent.length < 10) return true;

  // Check for common scraping patterns
  const suspiciousPatterns = [
    /python-requests/i,
    /axios/i,
    /node-fetch/i,
    /curl/i,
    /wget/i,
    /scrapy/i,
    /Go-http-client/i,
    /Java\//i,
    /libwww-perl/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

function checkRateLimit(identifier: string, maxRequests: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up old entries periodically (simple garbage collection)
  if (rateLimitMap.size > 10000) {
    const cutoff = now - RATE_LIMIT_WINDOW;
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.timestamp < cutoff) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    // New window
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Block known bad bots immediately
  if (isBlockedBot(userAgent)) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // Allow known good bots without rate limiting
  if (isAllowedBot(userAgent)) {
    return NextResponse.next();
  }

  // Determine rate limit based on behavior
  const identifier = getClientIdentifier(request);
  const isSuspicious = isSuspiciousBehavior(request);
  const maxRequests = isSuspicious ? MAX_REQUESTS_SCRAPER : MAX_REQUESTS_PER_WINDOW;

  const { allowed, remaining } = checkRateLimit(identifier, maxRequests);

  if (!allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // Add security headers to response
  const response = NextResponse.next();

  // Rate limit headers
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
