// ============================================================================
// GitHub OAuth — Initiate flow
// ============================================================================

import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/github';
import { generateState } from '@/lib/session';

export async function GET() {
  const state = generateState();

  const response = NextResponse.redirect(getOAuthUrl(state));

  // Store state in cookie for CSRF protection
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
