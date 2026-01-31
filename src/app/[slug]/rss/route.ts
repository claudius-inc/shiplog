// ============================================================================
// RSS Feed — /<slug>/rss
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import RSS from 'rss';
import { getProjectBySlug, getEntriesByProject } from '@/lib/db';
import { getCategoryLabel } from '@/lib/changelog';

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const entries = getEntriesByProject(project.id, { limit: 50 });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const feed = new RSS({
    title: `${project.name} Changelog`,
    description: project.description || `Latest changes for ${project.name}`,
    feed_url: `${baseUrl}/${slug}/rss`,
    site_url: `${baseUrl}/${slug}/changelog`,
    language: 'en',
    ttl: 60,
    custom_namespaces: {
      atom: 'http://www.w3.org/2005/Atom',
    },
    custom_elements: [
      {
        'atom:link': {
          _attr: {
            href: `${baseUrl}/${slug}/rss`,
            rel: 'self',
            type: 'application/rss+xml',
          },
        },
      },
    ],
  });

  for (const entry of entries) {
    feed.item({
      title: `${entry.emoji} ${entry.summary}`,
      description: `
        <p><strong>${getCategoryLabel(entry.category)}</strong></p>
        <p>${entry.summary}</p>
        <p>PR <a href="${entry.pr_url}">#${entry.pr_number}</a> by @${entry.pr_author}</p>
      `.trim(),
      url: `${baseUrl}/${slug}/changelog#entry-${entry.id}`,
      categories: [entry.category],
      date: new Date(entry.pr_merged_at),
      author: entry.pr_author,
    });
  }

  return new NextResponse(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
