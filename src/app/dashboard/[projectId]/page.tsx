// ============================================================================
// Project Detail Page — View entries, trigger sync
// ============================================================================

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChangelogEntry } from '@/components/ChangelogEntry';
import { getSession } from '@/lib/session';
import { getProjectById, getEntriesByProject, getEntryCount } from '@/lib/db';
import { SyncButton } from './SyncButton';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params;
  const session = await getSession();
  if (!session) {
    redirect('/api/auth/github');
  }

  const project = getProjectById(Number(projectId));
  if (!project || project.user_id !== session.userId) {
    notFound();
  }

  const entries = getEntriesByProject(project.id, { limit: 50 });
  const totalEntries = getEntryCount(project.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="text-zinc-300">{project.name}</span>
        </div>

        {/* Project header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-zinc-500 font-mono text-sm mt-1">
              {project.full_name}
            </p>
            {project.description && (
              <p className="text-zinc-400 mt-2">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${project.slug}/changelog`}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-all"
            >
              View Public Page ↗
            </Link>
            <SyncButton projectId={project.id} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: totalEntries, icon: '📝' },
            { label: 'Features', value: getEntryCount(project.id, 'feature'), icon: '✨' },
            { label: 'Fixes', value: getEntryCount(project.id, 'fix'), icon: '🐛' },
            { label: 'Improvements', value: getEntryCount(project.id, 'improvement'), icon: '💅' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>{stat.icon}</span>
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Entries */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Entries</h2>
            <span className="text-sm text-zinc-500">
              {project.last_synced_at
                ? `Last synced ${new Date(project.last_synced_at).toLocaleString()}`
                : 'Never synced'}
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔄</div>
              <p className="text-zinc-400">No entries yet</p>
              <p className="text-zinc-500 text-sm mt-1">
                Click &quot;Sync Now&quot; to fetch merged PRs
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {entries.map((entry) => (
                <ChangelogEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
