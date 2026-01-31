// ============================================================================
// Footer Component
// ============================================================================

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Built by{' '}
            <a
              href="https://github.com/Claudius-Inc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-brand-400 transition-colors"
            >
              Claudius Inc.
            </a>
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Claudius-Inc/shiplog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
