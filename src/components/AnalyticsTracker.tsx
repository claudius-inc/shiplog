'use client';

// ============================================================================
// Analytics Tracker — Fires page view events on public pages
// ============================================================================

import { useEffect } from 'react';

export function AnalyticsTracker({
  slug,
  event = 'page_view',
}: {
  slug: string;
  event?: 'page_view' | 'widget_view';
}) {
  useEffect(() => {
    // Fire-and-forget analytics ping
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, event }),
    }).catch(() => {
      // Analytics failure should never affect UX
    });
  }, [slug, event]);

  return null;
}
