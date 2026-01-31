// ============================================================================
// Public Changelog Page — Hosted at /<slug>/changelog
// ============================================================================

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/Logo';
import { ChangelogFeed } from '@/components/ChangelogFeed';
import SubscribeForm from '@/components/SubscribeForm';
import ChangelogSearch from '@/components/ChangelogSearch';
import { getProjectBySlug, getEntriesByProject, getEntryCount, getProjectBranding } from '@/lib/db';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return { title: 'Changelog Not Found' };
  }

  return {
    title: `${project.name} Changelog — ShipLog`,
    description: project.description
      ? `${project.description} — Changelog powered by ShipLog`
      : `Changelog for ${project.name}, powered by ShipLog`,
    openGraph: {
      title: `${project.name} Changelog`,
      description: project.description || `Latest changes for ${project.name}`,
      siteName: 'ShipLog',
    },
    alternates: {
      types: {
        'application/rss+xml': `/${slug}/rss`,
      },
    },
  };
}

export default async function PublicChangelogPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const entries = await getEntriesByProject(project.id, { limit: 200 });
  const totalEntries = await getEntryCount(project.id);
  const branding = await getProjectBranding(project.id);

  const brandingStyles = {
    '--brand-primary': branding.primary_color,
    '--brand-accent': branding.accent_color,
    '--brand-header-bg': branding.header_bg,
    '--brand-page-bg': branding.page_bg,
    '--brand-text': branding.text_color,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex flex-col" style={{ ...brandingStyles, background: branding.page_bg, color: branding.text_color }}>
      <AnalyticsTracker slug={slug} event="page_view" />
      {/* Minimal public header */}
      <header
        className="sticky top-0 z-50 border-b border-zinc-800/50 backdrop-blur-xl"
        style={{ background: `${branding.header_bg}cc` }}
      >
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding.logo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={branding.logo_url}
                alt={`${project.name} logo`}
                className="w-7 h-7 rounded object-cover"
              />
            )}
            <h1 className="text-lg font-bold" style={{ color: branding.text_color }}>{project.name}</h1>
            <span className="text-xs text-zinc-600 font-mono">{project.full_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/${slug}/rss`}
              className="text-xs text-zinc-500 hover:text-orange-400 transition-colors flex items-center gap-1"
              title="RSS Feed"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.18 15.64a2.18 2.18 0 010 4.36 2.18 2.18 0 010-4.36zM4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44zM4 10.1a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z" />
              </svg>
              RSS
            </Link>
            <a
              href={`https://github.com/${project.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {/* Page title */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Changelog</h2>
          {project.description && (
            <p className="text-zinc-400 text-lg">{project.description}</p>
          )}
          <p className="text-sm text-zinc-500 mt-3">
            {totalEntries} {totalEntries === 1 ? 'change' : 'changes'} recorded
          </p>
        </div>

        {/* Search */}
        <ChangelogSearch slug={slug} />

        {/* Subscribe to updates */}
        <div className="mb-10 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">📬 Get changelog updates in your inbox</h3>
          <SubscribeForm slug={slug} />
        </div>

        {/* Changelog feed with filters */}
        <ChangelogFeed entries={entries} projectName={project.name} />
      </main>

      {/* Powered-by footer */}
      {!branding.hide_powered_by && (
        <footer className="border-t border-zinc-800/50 py-6">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              Changelog powered by{' '}
              <a
                href="https://shiplog.dev"
                className="text-zinc-400 hover:text-brand-400 transition-colors"
              >
                ShipLog
              </a>
            </p>
            <Logo size="sm" />
          </div>
        </footer>
      )}
    </div>
  );
}
