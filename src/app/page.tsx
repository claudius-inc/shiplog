// ============================================================================
// Landing Page — ShipLog
// ============================================================================

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getSession } from '@/lib/session';

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-[120px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                Now in beta
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                Changelogs that
                <br />
                <span className="gradient-text">write themselves</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Connect your GitHub repo. ShipLog uses AI to categorize your merged PRs
                and generates beautiful, hosted changelog pages — automatically.
              </p>

              {/* CTA */}
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/api/auth/github"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connect GitHub
                </Link>
                <Link
                  href="#features"
                  className="px-6 py-3 rounded-lg text-zinc-300 font-medium border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mockup / Preview */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="glass-card glow p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-zinc-500 font-mono">
                acme-corp / changelog
              </span>
            </div>

            <div className="space-y-4">
              {/* Mock entry 1 */}
              <div className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                <span className="text-lg">✨</span>
                <div>
                  <p className="text-zinc-200 font-medium text-sm">
                    Added dark mode support with automatic system detection
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
                      Feature
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#142</span>
                  </div>
                </div>
              </div>

              {/* Mock entry 2 */}
              <div className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                <span className="text-lg">🐛</span>
                <div>
                  <p className="text-zinc-200 font-medium text-sm">
                    Fixed authentication timeout on slow connections
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20">
                      Fix
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#139</span>
                  </div>
                </div>
              </div>

              {/* Mock entry 3 */}
              <div className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                <span className="text-lg">💅</span>
                <div>
                  <p className="text-zinc-200 font-medium text-sm">
                    Improved dashboard loading speed by 3x with lazy loading
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20">
                      Improvement
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#137</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Three steps to beautiful changelogs. No manual work required.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass-card p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl mb-4">
                🔗
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sign in with GitHub and select your repositories. We set up
                webhooks to listen for merged PRs automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl mb-4">
                🤖
              </div>
              <h3 className="text-lg font-semibold mb-2">Categorize</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                AI reads each PR and categorizes it as a feature, fix,
                improvement, or breaking change. Clean summaries included.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl mb-4">
                📋
              </div>
              <h3 className="text-lg font-semibold mb-2">Publish</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                A beautiful public changelog page is generated automatically.
                Filter by category, subscribe via RSS, share with your users.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="glass-card p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to ship your changelog?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Stop writing changelogs manually. Let AI do the heavy lifting
              while you focus on building.
            </p>
            <Link
              href="/api/auth/github"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-brand-500 text-white font-semibold text-lg hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
            >
              Get started — it&apos;s free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
