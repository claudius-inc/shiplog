// ============================================================================
// Branding API — GET/PUT project branding settings
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProjectById, getProjectBranding, upsertProjectBranding } from '@/lib/db';
import type { BrandingConfig } from '@/lib/types';

// Validate hex color
function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

// Validate URL (basic)
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const project = await getProjectById(Number(projectId));
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const branding = await getProjectBranding(project.id);
  return NextResponse.json({ branding });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, branding } = body as { projectId: number; branding: Partial<BrandingConfig> };

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const project = await getProjectById(projectId);
  if (!project || project.user_id !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Validate colors
  const colorFields = ['primary_color', 'accent_color', 'header_bg', 'page_bg', 'text_color'] as const;
  for (const field of colorFields) {
    if (branding[field] && !isValidHex(branding[field] as string)) {
      return NextResponse.json({ error: `Invalid color for ${field}` }, { status: 400 });
    }
  }

  // Validate logo URL if provided
  if (branding.logo_url && !isValidUrl(branding.logo_url)) {
    return NextResponse.json({ error: 'Invalid logo URL' }, { status: 400 });
  }

  const updated = await upsertProjectBranding(project.id, branding);
  return NextResponse.json({ branding: updated });
}
