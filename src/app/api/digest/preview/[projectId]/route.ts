// ============================================================================
// GET /api/digest/preview/[projectId] — Preview digest email HTML
//
// Returns rendered HTML for the digest email (for dashboard preview).
// Requires authenticated session.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateDigest } from '@/lib/digest';
import { getSession } from '@/lib/session';
import { getProjectById } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.projectId, 10);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const project = await getProjectById(projectId);
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;
  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '7', 10);

  const result = await generateDigest(projectId, baseUrl, { days });

  if (!result) {
    return new NextResponse(
      '<html><body style="background:#0f172a;color:#94a3b8;font-family:sans-serif;padding:40px;text-align:center;"><h2>No entries</h2><p>No changelog entries found in the last ' + days + ' days to preview.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Return raw HTML for iframe preview
  return new NextResponse(result.html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
