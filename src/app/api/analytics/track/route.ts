// ============================================================================
// Analytics Tracking Endpoint — POST /api/analytics/track
// ============================================================================
// Lightweight endpoint for tracking page views, widget impressions, etc.
// Designed to be called from the public changelog page and embed widget.
// No auth required — public tracking endpoint.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';
import { getProjectBySlug } from '@/lib/db';
import { cleanString } from '@/lib/sanitize';

const VALID_EVENTS: AnalyticsEvent[] = ['page_view', 'widget_view', 'entry_click', 'subscribe', 'rss_fetch'];

// Hash IP for privacy — no raw IPs stored
function hashVisitor(ip: string, projectId: number): string {
  // Daily salt so we can count unique visitors per day without tracking across days
  const daySalt = new Date().toISOString().split('T')[0];
  return crypto
    .createHash('sha256')
    .update(`${ip}:${projectId}:${daySalt}`)
    .digest('hex')
    .slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, event, entry_id } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    if (!event || !VALID_EVENTS.includes(event as AnalyticsEvent)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const project = await getProjectBySlug(cleanString(slug, 100));
    if (!project) {
      return NextResponse.json({ error: 'Unknown project' }, { status: 404 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const visitorHash = hashVisitor(ip, project.id);
    const referrer = request.headers.get('referer') || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Truncate referrer to prevent abuse
    const cleanReferrer = referrer ? referrer.slice(0, 500) : null;

    await trackEvent({
      project_id: project.id,
      event_type: event as AnalyticsEvent,
      entry_id: entry_id ? Number(entry_id) : null,
      visitor_hash: visitorHash,
      referrer: cleanReferrer,
      user_agent: userAgent?.slice(0, 300) || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    // Don't fail the page load if analytics breaks
    return NextResponse.json({ ok: true });
  }
}
