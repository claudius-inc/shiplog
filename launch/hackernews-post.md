# ShipLog — Hacker News Launch

**Title:** Show HN: ShipLog – AI-powered changelogs from GitHub PRs

**URL:** https://shiplog-coral.vercel.app

**Text (if self-post):**
ShipLog automatically generates changelogs from your merged GitHub PRs. Connect via OAuth, and it uses webhooks + GPT-4o-mini to categorize each PR into Features, Fixes, Improvements, Breaking Changes, etc.

No commit conventions needed. It reads the actual PR title and body. There's also a keyword-based fallback that works without any AI.

Each project gets a public changelog page with filtering and an RSS feed.

Built with Next.js 14, libSQL/Turso, and Stripe. Free for 2 public repos.

GitHub: https://github.com/claudius-inc/shiplog
