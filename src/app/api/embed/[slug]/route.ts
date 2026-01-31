// ============================================================================
// Embed API — JSON endpoint for embeddable changelog widget
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getProjectBySlug, getEntriesByProject, getProjectBranding } from '@/lib/db';
import type { Category } from '@/lib/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const project = await getProjectBySlug(params.slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Changelog not found' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category') as Category | null;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

    const entries = await getEntriesByProject(project.id, {
      category: category || undefined,
      limit,
    });

    const branding = await getProjectBranding(project.id);

    const response = {
      project: {
        name: project.name,
        slug: project.slug,
        description: project.description,
      },
      branding: {
        primary_color: branding.primary_color,
        accent_color: branding.accent_color,
        header_bg: branding.header_bg,
        page_bg: branding.page_bg,
        text_color: branding.text_color,
        logo_url: branding.logo_url,
        hide_powered_by: branding.hide_powered_by,
      },
      entries: entries.map((e) => ({
        id: e.id,
        category: e.category,
        summary: e.summary,
        emoji: e.emoji,
        pr_number: e.pr_number,
        pr_url: e.pr_url,
        pr_author: e.pr_author,
        merged_at: e.pr_merged_at,
      })),
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(response, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Embed API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
