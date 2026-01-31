// ============================================================================
// Middleware — Security headers + rate limiting + CSRF protection
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-IP, sliding window)
// For production at scale, swap for Redis-based (upstash/ratelimit).
// ---------------------------------------------------------------------------

interface RateWindow {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateWindow>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // requests per window (general)
const RATE_LIMIT_AUTH_MAX = 10; // auth endpoints (stricter)
const RATE_LIMIT_WEBHOOK_MAX = 120; // webhooks get more headroom

// Cleanup stale entries every 5 minutes to prevent memory leak
let lastCleanup = Date.now();
function cleanupRateLimits() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  rateLimitMap.forEach((window, key) => {
    if (window.resetAt < now) rateLimitMap.delete(key);
  });
}

function getRateLimit(key: string, max: number): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupRateLimits();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: max - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  entry.count++;
  const allowed = entry.count <= max;
  return { allowed, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Strict-Transport-Security (HSTS) — enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection (allow embedding for widget, restrict for dashboard)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // XSS filter (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer — send origin only on cross-origin
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — disable unnecessary browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

// ---------------------------------------------------------------------------
// CSRF protection for state-changing requests
// ---------------------------------------------------------------------------

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/', // GitHub webhooks use signature verification
  '/api/embed/', // Public read-only API
  '/api/auth/github/callback', // OAuth callback
];

function csrfCheck(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return true;

  const pathname = request.nextUrl.pathname;
  if (CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p))) return true;

  // For API routes, verify the origin/referer matches
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    // Allow requests without origin (e.g., server-side, curl for dev)
    // In production, you may want to tighten this
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIP(request);

  // --- Rate limiting ---
  let maxRequests = RATE_LIMIT_MAX;
  if (pathname.startsWith('/api/auth/')) {
    maxRequests = RATE_LIMIT_AUTH_MAX;
  } else if (pathname.startsWith('/api/webhooks/')) {
    maxRequests = RATE_LIMIT_WEBHOOK_MAX;
  }

  const rateLimitKey = `${ip}:${pathname.startsWith('/api/auth/') ? 'auth' : pathname.startsWith('/api/webhooks/') ? 'webhook' : 'general'}`;
  const { allowed, remaining, resetAt } = getRateLimit(rateLimitKey, maxRequests);

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    const response = NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429 }
    );
    response.headers.set('Retry-After', String(retryAfter));
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    return addSecurityHeaders(response);
  }

  // --- CSRF protection ---
  if (!csrfCheck(request)) {
    return addSecurityHeaders(
      NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
    );
  }

  // --- Continue with security headers + rate limit info ---
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match API routes and pages, skip static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
