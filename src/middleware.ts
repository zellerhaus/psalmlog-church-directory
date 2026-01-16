import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

function isBlockedBot(userAgent: string): boolean {
  return BLOCKED_BOTS.some(bot => userAgent.includes(bot));
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
