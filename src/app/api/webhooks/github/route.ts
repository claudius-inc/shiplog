// ============================================================================
// GitHub Webhook Handler — Auto-sync on PR merge
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { syncProjectFromWebhook } from '@/lib/sync';
import { getProjectByWebhookRepoId } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const event = request.headers.get('x-github-event');
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    // Only process pull_request events
    if (event !== 'pull_request') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const payload = JSON.parse(body);

    // Only process merged PRs
    if (payload.action !== 'closed' || !payload.pull_request?.merged) {
      return NextResponse.json({ message: 'Not a merge event' }, { status: 200 });
    }

    const repoId = payload.repository?.id;
    if (!repoId) {
      return NextResponse.json({ error: 'Missing repo id' }, { status: 400 });
    }

    // Verify webhook signature
    const project = getProjectByWebhookRepoId(repoId);
    if (!project) {
      return NextResponse.json({ error: 'Unknown repo' }, { status: 404 });
    }

    if (project.webhook_secret && signature) {
      const expectedSignature =
        'sha256=' +
        crypto
          .createHmac('sha256', project.webhook_secret)
          .update(body)
          .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // Process the merged PR
    const pr = payload.pull_request;
    const entry = await syncProjectFromWebhook(repoId, {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      html_url: pr.html_url,
      user: {
        login: pr.user.login,
        avatar_url: pr.user.avatar_url,
      },
      merged_at: pr.merged_at,
    });

    return NextResponse.json({
      success: true,
      entry: entry ? { id: entry.id, category: entry.category } : null,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
