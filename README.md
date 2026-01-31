# 🚢 ShipLog

**Changelogs that write themselves.**

Connect your GitHub repo → AI categorizes merged PRs → beautiful hosted changelog. No manual work.

## Features

- **GitHub OAuth** — Sign in, select repos, done
- **AI Categorization** — GPT-4o Mini reads each PR and sorts into Features, Fixes, Improvements, Breaking Changes
- **Auto-Sync via Webhooks** — New merged PRs appear instantly
- **Public Changelog Pages** — Beautiful, hosted, filterable by category
- **RSS Feeds** — Subscribe to changes per project
- **Fallback Categorization** — Works even without OpenAI via keyword detection

## Stack

- **Next.js 14** (App Router)
- **libSQL / Turso** — serverless-compatible database (local SQLite or hosted Turso)
- **Tailwind CSS** — dark-mode-first design
- **OpenAI** (gpt-4o-mini) — PR categorization
- **GitHub API** — OAuth + webhooks + PR data

## Quick Start

```bash
# Install
npm install

# Copy env vars
cp .env.example .env.local
# Fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, OPENAI_API_KEY
# For production: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN

# Initialize database
npm run db:init

# Dev server
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── dashboard/                  # Authenticated dashboard
│   │   ├── page.tsx                # Project list
│   │   └── [projectId]/page.tsx    # Project detail + entries
│   ├── [slug]/
│   │   ├── changelog/page.tsx      # Public changelog page
│   │   └── rss/route.ts           # RSS feed endpoint
│   └── api/
│       ├── auth/github/            # OAuth flow
│       ├── projects/               # Project CRUD
│       ├── repos/                  # List GitHub repos
│       ├── sync/                   # Manual sync trigger
│       └── webhooks/github/        # Webhook receiver
├── components/
│   ├── CategoryBadge.tsx
│   ├── ChangelogEntry.tsx
│   ├── ChangelogFeed.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── Logo.tsx
└── lib/
    ├── ai.ts                      # OpenAI categorization
    ├── changelog.ts               # Markdown, RSS, date helpers
    ├── db.ts                      # libSQL/Turso database layer
    ├── db-init.ts                 # DB initialization script
    ├── github.ts                  # GitHub API client
    ├── session.ts                 # Cookie-based auth sessions
    ├── sync.ts                    # PR fetch + categorize pipeline
    └── types.ts                   # TypeScript interfaces
```

## Pricing (Planned)

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Public repos, basic changelog |
| Pro | $9/mo | Private repos, custom domain, email digests |
| Team | $29/mo | Multiple users, widget embed, priority support |

## Built by [Claudius Inc.](https://github.com/Claudius-Inc)
