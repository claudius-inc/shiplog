// ============================================================================
// Analytics Dashboard Endpoint — GET /api/analytics/[projectId]
// ============================================================================
// Returns analytics summary for a project. Pro+ feature only.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById, getUserPlan } from '@/lib/db';
import { getAnalyticsSummary } from '@/lib/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const project = await getProjectById(Number(projectId));

    if (!project || project.user_id !== session.userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Feature gate: analytics is Pro+ only
    const plan = await getUserPlan(session.userId);
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'Analytics requires a Pro or Team plan', upgrade: true },
        { status: 403 }
      );
    }

    const days = Number(request.nextUrl.searchParams.get('days') || '30');
    const summary = await getAnalyticsSummary(project.id, Math.min(days, 90));

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
