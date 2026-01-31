// ============================================================================
// /docs/api — Public API Reference
// Clean, hand-crafted API docs (no heavy Swagger UI dependency)
// ============================================================================

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference',
  description:
    'ShipLog REST API documentation. Manage changelog entries and projects programmatically.',
};

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-mono font-bold rounded border ${colors[color] || colors.blue}`}
    >
      {children}
    </span>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden my-4">
      {title && (
        <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
          {title}
        </div>
      )}
      <pre className="p-4 bg-zinc-900/50 text-sm overflow-x-auto">
        <code className="text-zinc-300">{children}</code>
      </pre>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  title,
  description,
  scope,
  children,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  scope: string;
  children: React.ReactNode;
}) {
  const methodColors: Record<string, string> = {
    GET: 'green',
    POST: 'blue',
    PUT: 'yellow',
    DELETE: 'red',
  };
  return (
    <section className="border border-zinc-800 rounded-xl overflow-hidden mb-8" id={`${method.toLowerCase()}-${path.replace(/\//g, '-').replace(/^-/, '')}`}>
      <div className="px-6 py-4 bg-zinc-900/70 border-b border-zinc-800 flex items-center gap-3 flex-wrap">
        <Badge color={methodColors[method]}>{method}</Badge>
        <code className="text-sm text-zinc-200 font-mono">/api/v1{path}</code>
        <Badge color="purple">{scope}</Badge>
      </div>
      <div className="px-6 py-5">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">{title}</h3>
        <p className="text-zinc-400 text-sm mb-5">{description}</p>
        {children}
      </div>
    </section>
  );
}

function ParamTable({
  params,
}: {
  params: { name: string; type: string; required: boolean; description: string }[];
}) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Parameter</th>
            <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Type</th>
            <th className="text-left py-2 pr-4 text-zinc-400 font-medium">Required</th>
            <th className="text-left py-2 text-zinc-400 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-zinc-800/50">
              <td className="py-2 pr-4">
                <code className="text-indigo-400 text-xs">{p.name}</code>
              </td>
              <td className="py-2 pr-4 text-zinc-500 text-xs font-mono">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-amber-400 text-xs">required</span>
                ) : (
                  <span className="text-zinc-600 text-xs">optional</span>
                )}
              </td>
              <td className="py-2 text-zinc-300 text-xs">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
              ShipLog
            </a>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">API Reference</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/openapi.yaml"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
            >
              OpenAPI Spec ↗
            </a>
            <a
              href="/dashboard"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">API Reference</h1>
          <p className="text-zinc-400 text-lg mb-6">
            Manage your changelogs programmatically. Perfect for CI/CD pipelines, custom integrations, and automation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
              <div className="text-indigo-400 text-sm font-semibold mb-1">Base URL</div>
              <code className="text-zinc-300 text-sm">https://shiplog.dev/api/v1</code>
            </div>
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
              <div className="text-indigo-400 text-sm font-semibold mb-1">Auth</div>
              <code className="text-zinc-300 text-sm">Bearer &lt;api_key&gt;</code>
            </div>
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
              <div className="text-indigo-400 text-sm font-semibold mb-1">Format</div>
              <code className="text-zinc-300 text-sm">JSON</code>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-3">Authentication</h2>
          <p className="text-zinc-400 text-sm mb-3">
            Generate an API key from <strong>Dashboard → API Keys</strong>. Include it in every request:
          </p>
          <CodeBlock title="Request header">{`Authorization: Bearer sl_live_xxxxxxxxxxxxxxxxxxxxxxxx`}</CodeBlock>
          <p className="text-zinc-500 text-xs">
            Keys have <code className="text-indigo-400">read</code> and/or{' '}
            <code className="text-indigo-400">write</code> scopes. The full key is shown once — store it securely.
            Requires <Badge color="purple">Pro+</Badge>
          </p>
        </div>

        {/* Endpoints */}
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span className="text-indigo-400">●</span> Projects
        </h2>

        <EndpointCard
          method="GET"
          path="/projects"
          title="List projects"
          description="Returns all projects connected by the authenticated user."
          scope="read"
        >
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Example</h4>
          <CodeBlock title="curl">{`curl -H "Authorization: Bearer sl_live_xxx" \\
  https://shiplog.dev/api/v1/projects`}</CodeBlock>
          <CodeBlock title="Response 200">{`{
  "data": [
    {
      "id": 42,
      "name": "shiplog",
      "slug": "shiplog",
      "full_name": "Claudius-Inc/shiplog",
      "description": "Git-native changelog for modern teams",
      "is_public": true,
      "last_synced_at": "2026-01-31T12:00:00Z",
      "created_at": "2026-01-15T08:30:00Z"
    }
  ]
}`}</CodeBlock>
        </EndpointCard>

        <h2 className="text-xl font-semibold text-white mb-6 mt-12 flex items-center gap-2">
          <span className="text-emerald-400">●</span> Entries
        </h2>

        <EndpointCard
          method="GET"
          path="/entries"
          title="List changelog entries"
          description="Returns paginated changelog entries for a project, with optional category filtering."
          scope="read"
        >
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Query parameters</h4>
          <ParamTable
            params={[
              { name: 'project_id', type: 'integer', required: true, description: 'Project ID' },
              {
                name: 'category',
                type: 'string',
                required: false,
                description: 'Filter: feature | fix | improvement | breaking',
              },
              {
                name: 'limit',
                type: 'integer',
                required: false,
                description: 'Items per page (default 50, max 100)',
              },
              {
                name: 'offset',
                type: 'integer',
                required: false,
                description: 'Number of items to skip (default 0)',
              },
            ]}
          />
          <CodeBlock title="curl">{`curl -H "Authorization: Bearer sl_live_xxx" \\
  "https://shiplog.dev/api/v1/entries?project_id=42&category=feature&limit=10"`}</CodeBlock>
          <CodeBlock title="Response 200">{`{
  "data": [
    {
      "id": 157,
      "pr_number": 42,
      "pr_title": "Add dark mode support",
      "pr_url": "https://github.com/Claudius-Inc/shiplog/pull/42",
      "pr_author": "octocat",
      "pr_merged_at": "2026-01-30T14:22:00Z",
      "category": "feature",
      "summary": "Added dark mode with system preference detection",
      "emoji": "✨",
      "created_at": "2026-01-30T14:25:00Z"
    }
  ],
  "pagination": {
    "total": 87,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}`}</CodeBlock>
        </EndpointCard>

        <EndpointCard
          method="POST"
          path="/entries"
          title="Create a changelog entry"
          description="Manually create a changelog entry. Great for CI/CD pipelines — push changelog entries directly from your deploy scripts."
          scope="write"
        >
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Request body</h4>
          <ParamTable
            params={[
              { name: 'project_id', type: 'integer', required: true, description: 'Target project ID' },
              {
                name: 'category',
                type: 'string',
                required: true,
                description: 'feature | fix | improvement | breaking',
              },
              { name: 'summary', type: 'string', required: true, description: 'Entry summary (max 500 chars)' },
              { name: 'pr_number', type: 'integer', required: false, description: 'Associated PR number' },
              { name: 'pr_title', type: 'string', required: false, description: 'PR title (defaults to summary)' },
              { name: 'pr_url', type: 'string', required: false, description: 'PR URL' },
              { name: 'pr_author', type: 'string', required: false, description: "Author (defaults to 'api')" },
              { name: 'merged_at', type: 'datetime', required: false, description: 'Timestamp (defaults to now)' },
            ]}
          />
          <CodeBlock title="curl">{`curl -X POST \\
  -H "Authorization: Bearer sl_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": 42,
    "category": "feature",
    "summary": "Added dark mode with system preference detection",
    "pr_number": 42,
    "pr_author": "octocat"
  }' \\
  https://shiplog.dev/api/v1/entries`}</CodeBlock>
          <CodeBlock title="Response 201">{`{
  "data": {
    "id": 158,
    "pr_number": 42,
    "pr_title": "Added dark mode with system preference detection",
    "pr_url": "",
    "pr_author": "octocat",
    "pr_merged_at": "2026-01-31T12:45:00Z",
    "category": "feature",
    "summary": "Added dark mode with system preference detection",
    "emoji": "✨",
    "created_at": "2026-01-31T12:45:00Z"
  }
}`}</CodeBlock>
          <div className="mt-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">💡 CI/CD Example — GitHub Actions</h4>
            <CodeBlock title=".github/workflows/changelog.yml">{`- name: Push to ShipLog
  run: |
    curl -X POST \\
      -H "Authorization: Bearer \${{ secrets.SHIPLOG_API_KEY }}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "project_id": $PROJECT_ID,
        "category": "feature",
        "summary": "'\${{ github.event.pull_request.title }}'"
      }' \\
      https://shiplog.dev/api/v1/entries`}</CodeBlock>
          </div>
        </EndpointCard>

        {/* Error Codes */}
        <h2 className="text-xl font-semibold text-white mb-6 mt-12 flex items-center gap-2">
          <span className="text-red-400">●</span> Error Codes
        </h2>
        <div className="border border-zinc-800 rounded-xl overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/70 border-b border-zinc-800">
                <th className="text-left px-6 py-3 text-zinc-400 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-zinc-400 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              <tr>
                <td className="px-6 py-3"><code className="text-emerald-400">200</code></td>
                <td className="px-6 py-3 text-zinc-300">Success</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-blue-400">201</code></td>
                <td className="px-6 py-3 text-zinc-300">Created</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-amber-400">400</code></td>
                <td className="px-6 py-3 text-zinc-300">Bad request — missing or invalid parameters</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-red-400">401</code></td>
                <td className="px-6 py-3 text-zinc-300">Unauthorized — invalid or missing API key</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-red-400">403</code></td>
                <td className="px-6 py-3 text-zinc-300">Forbidden — insufficient scope or tier</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-orange-400">404</code></td>
                <td className="px-6 py-3 text-zinc-300">Not found — project doesn&apos;t exist or not owned by you</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-orange-400">429</code></td>
                <td className="px-6 py-3 text-zinc-300">Rate limited — wait and retry (check Retry-After header)</td>
              </tr>
              <tr>
                <td className="px-6 py-3"><code className="text-red-400">500</code></td>
                <td className="px-6 py-3 text-zinc-300">Server error</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center border border-zinc-800 rounded-xl p-8 bg-zinc-900/20">
          <h2 className="text-xl font-semibold text-white mb-2">Ready to automate your changelog?</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Connect your GitHub repo and get started in 30 seconds.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Get Started Free →
          </a>
        </div>
      </main>
    </div>
  );
}
