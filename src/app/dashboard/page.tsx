// ============================================================================
// Dashboard — List projects & connect repos
// ============================================================================

import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSession } from '@/lib/session';
import { getProjectsByUser } from '@/lib/db';
import { ConnectRepoButton } from './ConnectRepoButton';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/api/auth/github');
  }

  const projects = await getProjectsByUser(session.userId);

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="text-zinc-400 mt-1">
              Connect GitHub repos to generate changelogs
            </p>
          </div>
          <ConnectRepoButton />
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-zinc-400 mb-6">
              Connect a GitHub repo to get started
            </p>
            <ConnectRepoButton variant="primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${project.id}`}
                className="glass-card p-6 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-lg">
                    📦
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        project.webhook_id
                          ? 'bg-emerald-400'
                          : 'bg-zinc-600'
                      }`}
                    />
                    <span className="text-xs text-zinc-500">
                      {project.webhook_id ? 'Auto-sync' : 'Manual'}
                    </span>
                  </div>
                </div>

                <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-zinc-500 font-mono mt-1">
                  {project.full_name}
                </p>
                {project.description && (
                  <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    {project.last_synced_at
                      ? `Last synced: ${new Date(project.last_synced_at).toLocaleDateString()}`
                      : 'Never synced'}
                  </span>
                  <span className="text-xs text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
