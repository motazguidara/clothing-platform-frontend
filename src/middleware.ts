import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

// CSP for different page types
const getCSP = (pathname: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  const baseCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    // Allow local dev APIs and HMR in development
    isProd
      ? "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com"
      : "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 http://localhost:3003 ws://localhost:3003 ws://127.0.0.1:3003 https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com",
    "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  // Stricter CSP for admin pages
  if (pathname.startsWith('/admin')) {
    return baseCSP.map(directive => 
      directive.startsWith('script-src') 
        ? "script-src 'self' 'unsafe-inline'" 
        : directive
    ).join('; ');
  }

  return baseCSP.join('; ');
};

// Rate limiting function
function rateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;
  
  const current = rateLimitStore.get(key) ?? { count: 0, resetTime: now + windowMs };
  
  if (now > current.resetTime) {
    rateLimitStore.delete(key);
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  return true;
}

// Bot detection
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /rogerbot/i,
    /linkedinbot/i,
    /embedly/i,
    /quora link preview/i,
    /showyoubot/i,
    /outbrain/i,
    /pinterest/i,
    /developers.google.com/i,
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') ?? '';
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor ?? realIp ?? 'unknown';
  
  // Create response
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add CSP
  response.headers.set('Content-Security-Policy', getCSP(pathname));
  
  // Rate limiting (skip for bots and static assets)
  if (!isBot(userAgent) && !pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
    if (!rateLimit(ip, 100, 60000)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          ...securityHeaders
        }
      });
    }
  }
  
  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // In production, add proper authentication check here
    const authToken = request.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Redirect old URLs for SEO
  if (pathname === '/products') {
    return NextResponse.redirect(new URL('/catalog', request.url), 301);
  }
  
  // Add cache headers for static assets
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add cache headers for images
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|ico|svg)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000');
  }
  
  // Add performance headers
  response.headers.set('X-Response-Time', Date.now().toString());
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
