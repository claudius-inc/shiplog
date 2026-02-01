# ShipLog Reddit Launch Posts

## r/SideProject

**Title:** I built ShipLog — changelogs that write themselves from your GitHub PRs

**Body:**
Hey everyone! I built [ShipLog](https://shiplog-coral.vercel.app) — a tool that automatically generates changelogs from your GitHub merged PRs using AI categorization.

**How it works:**
1. Sign in with GitHub
2. Select your repos
3. Merged PRs get automatically categorized (Features, Fixes, Improvements, Breaking Changes) by AI
4. You get a beautiful public changelog page + RSS feed

**Why I built it:** I was tired of manually writing changelogs. Most tools require you to follow commit conventions or write CHANGELOG.md by hand. ShipLog just reads your actual PR descriptions and figures out what changed.

**Stack:** Next.js 14, Turso (libSQL), GPT-4o-mini for categorization, Tailwind CSS, Stripe for billing.

**Pricing:** Free for up to 2 public repos. Pro at $9/mo, Team at $29/mo.

Would love feedback! [shiplog-coral.vercel.app](https://shiplog-coral.vercel.app)

---

## r/webdev

**Title:** Show r/webdev: ShipLog — AI-powered changelogs from GitHub PRs (Next.js + Turso + OpenAI)

**Body:**
Just shipped ShipLog — an AI changelog generator that hooks into your GitHub webhooks and automatically categorizes merged PRs into a hosted changelog page.

**Tech highlights:**
- Next.js 14 App Router with edge runtime where possible
- libSQL/Turso for serverless-compatible SQLite
- GitHub OAuth + webhooks for real-time sync
- GPT-4o-mini categorization with keyword fallback (works without OpenAI key too)
- RSS feeds per project
- Stripe billing integration

The AI reads each PR title + body and categorizes it. If you don't want AI, there's a keyword-based fallback that still does a decent job.

Free tier: 2 public repos. Happy to answer any architecture questions!

[shiplog-coral.vercel.app](https://shiplog-coral.vercel.app)

---

## r/programming

**Title:** Show r/programming: ShipLog — Open-source AI changelog generator that reads your GitHub PRs

**Body:**
Built an open-source tool that generates changelogs from merged PRs:

- Connect GitHub repo via OAuth
- Webhook fires on PR merge → AI categorizes → public changelog page updated
- Categories: Features, Fixes, Improvements, Breaking Changes, Docs, Internal
- RSS feed per project
- Works with or without OpenAI (has keyword fallback)

No more manually maintaining CHANGELOG.md or enforcing commit conventions.

Try it: [shiplog-coral.vercel.app](https://shiplog-coral.vercel.app)
GitHub: [github.com/claudius-inc/shiplog](https://github.com/claudius-inc/shiplog)
