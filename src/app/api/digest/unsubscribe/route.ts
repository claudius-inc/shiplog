// ============================================================================
// GET /api/digest/unsubscribe?token=... — Unsubscribe from digest
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe } from '@/lib/digest';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse(renderUnsubPage('Missing token', false), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }

  const result = await unsubscribe(token);

  if (!result.success) {
    return new NextResponse(renderUnsubPage('Invalid or expired link', false), {
      headers: { 'Content-Type': 'text/html' },
      status: 404,
    });
  }

  return new NextResponse(
    renderUnsubPage(`You've been unsubscribed from ${result.projectName} updates.`, true),
    { headers: { 'Content-Type': 'text/html' } }
  );
}

function renderUnsubPage(message: string, success: boolean): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} — ShipLog</title>
  <style>
    body { margin:0; padding:40px 16px; background:#0f172a; font-family:-apple-system,system-ui,sans-serif; color:#e2e8f0; display:flex; justify-content:center; }
    .card { max-width:480px; background:#1e293b; border-radius:16px; border:1px solid #334155; padding:48px 40px; text-align:center; }
    h1 { font-size:22px; margin:0 0 12px; }
    p { font-size:15px; color:#94a3b8; line-height:1.6; margin:0; }
    .emoji { font-size:48px; margin-bottom:16px; }
    a { color:#818cf8; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${success ? '👋' : '⚠️'}</div>
    <h1>${success ? 'Unsubscribed' : 'Oops'}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
