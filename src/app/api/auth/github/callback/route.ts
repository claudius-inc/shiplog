// ============================================================================
// GitHub OAuth — Callback handler
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, createGitHubClient } from '@/lib/github';
import { upsertUser } from '@/lib/db';
import { createSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('oauth_state')?.value;

  // Validate state for CSRF protection
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL('/?error=invalid_state', request.url)
    );
  }

  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(code);

    // Fetch user info
    const github = createGitHubClient(accessToken);
    const githubUser = await github.getAuthenticatedUser();

    // Create or update user in database
    const user = await upsertUser({
      github_id: githubUser.id,
      username: githubUser.login,
      display_name: githubUser.name || githubUser.login,
      avatar_url: githubUser.avatar_url,
      access_token: accessToken,
    });

    // Create session
    await createSession({
      userId: user.id,
      username: user.username,
      accessToken: user.access_token,
    });

    // Clear oauth state cookie and redirect to dashboard
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
    response.cookies.delete('oauth_state');
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    );
  }
}
