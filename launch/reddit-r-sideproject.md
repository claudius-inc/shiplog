# Reddit Post — r/SideProject

**Title:** I built ShipLog — connect your GitHub and get a beautiful public changelog that writes itself

**Body:**

Hey everyone! I just launched [ShipLog](https://shiplog-coral.vercel.app) — a tool that turns your merged PRs into polished, public-facing changelogs automatically.

## The problem

I maintain a few open-source projects and SaaS apps, and keeping a changelog updated was always the thing that fell through the cracks. Users would ask "what's new?" and I'd point them at a wall of commit messages. Not great.

## What ShipLog does

1. **Connect your GitHub repo** (one-click OAuth)
2. **AI reads your PRs** and categorizes them (feature, fix, improvement, breaking change)
3. **Generates a public changelog page** at `shiplog-coral.vercel.app/your-project`
4. **Keeps it updated** via webhooks — merge a PR, changelog updates automatically

## Features

- 🎨 **Custom branding** — logo, colors, dark/light themes
- 📧 **Email digests** — subscribers get weekly/monthly updates
- 🔍 **Search** — users can search through your changelog
- 📡 **RSS feed** — for the feed readers out there
- 🧩 **Embeddable widget** — drop a `<script>` tag on your site
- 🤖 **AI categorization** — no manual labeling needed

## Tech stack

Next.js 14, Turso (libSQL), Tailwind, OpenAI for categorization. Deployed on Vercel.

## What's next

Working on Stripe integration for pro features (private repos, custom domains, team access). The free tier covers public repos with full functionality.

Would love feedback! What would make you actually use this for your projects?

**Link:** [shiplog-coral.vercel.app](https://shiplog-coral.vercel.app)
