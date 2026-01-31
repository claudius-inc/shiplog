// ============================================================================
// POST /api/digest/subscribe — Subscribe to project changelog digest
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { subscribe, getSubscriberCount } from '@/lib/digest';
import { getProjectBySlug } from '@/lib/db';
import { renderWelcomeEmail } from '@/lib/email-template';
import { getEmailProvider } from '@/lib/digest';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, slug, frequency } = body;

    if (!email || !slug) {
      return NextResponse.json({ error: 'Email and project slug are required' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const subscriber = await subscribe(project.id, email, frequency ?? 'weekly');

    // Send welcome email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;
    const { html, text, subject } = renderWelcomeEmail({
      projectName: project.name,
      changelogUrl: `${baseUrl}/${project.slug}/changelog`,
      unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?token=${subscriber.token}`,
      baseUrl,
    });

    const provider = getEmailProvider();
    await provider.send(email, subject, html, text);

    const count = await getSubscriberCount(project.id);

    return NextResponse.json({
      success: true,
      message: 'Subscribed successfully',
      subscriberCount: count,
    });
  } catch (error: unknown) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
