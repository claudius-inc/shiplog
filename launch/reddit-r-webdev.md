# Reddit Post — r/webdev

**Title:** Built an open changelog tool that auto-generates release notes from your GitHub PRs

**Body:**

Sharing something I built for my own projects that might be useful for others: **ShipLog** — an automated changelog generator that reads your merged PRs and creates a public changelog page.

## How it works

- OAuth with GitHub → pick a repo → ShipLog fetches your merged PRs
- AI analyzes each PR (title + body + diff context) and writes a one-line user-facing summary
- Categorizes into: ✨ Feature, 🐛 Fix, ⚡ Improvement, 💥 Breaking Change
- Outputs a clean, searchable changelog page with your branding
- Webhook keeps it in sync — merge a PR, changelog updates in seconds

## Tech decisions (for the curious)

- **Next.js 14** (App Router) — server components for the public pages, client components for the dashboard
- **Turso (libSQL)** — SQLite-compatible, works on Vercel's edge, free tier is generous
- **@libsql/client** — had to migrate from better-sqlite3 because Vercel doesn't support native modules
- **OpenAI** — GPT-4o-mini for categorization (cheap, fast, accurate enough for PR summaries)
- **Tailwind** — dark theme by default, custom CSS properties for per-project branding

## Interesting challenges

1. **GitHub webhook verification** — HMAC-SHA256 with raw body. Had to be careful with Next.js body parsing
2. **Email digests** — built a full template engine with MSO-compatible HTML (Outlook is still terrible in 2026)
3. **Embeddable widget** — cross-origin script that injects a shadow DOM changelog into any page

The embed widget was the most fun to build — it's a single `<script>` tag that creates an isolated shadow DOM with its own styles, fetches from the JSON API, and renders the changelog inline. Works on any site without CSS conflicts.

## Free tier

Public repos get everything: changelog page, RSS, search, email digests, embed widget. Pro tier (coming soon) adds private repos, custom domains, and team access.

Happy to answer questions about the architecture or share code snippets.

**Link:** [shiplog.dev](https://shiplog.dev)
