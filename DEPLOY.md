# ShipLog — Deployment Guide

## Quick Deploy (automated)

```bash
./scripts/deploy.sh
```

This handles everything: Turso DB creation, Vercel deployment, env vars.

## Manual Setup

### 1. Turso Database

```bash
# Install CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database (Singapore region)
turso db create shiplog-prod --location sin

# Get credentials
turso db show shiplog-prod --url
turso db tokens create shiplog-prod
```

### 2. GitHub OAuth App

1. Go to https://github.com/settings/developers
2. "New OAuth App"
3. **Homepage URL:** `https://your-domain.vercel.app`
4. **Callback URL:** `https://your-domain.vercel.app/api/auth/github/callback`
5. Save the Client ID and generate a Client Secret

### 3. Vercel Deployment

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Link project
cd /path/to/shiplog
vercel link

# Set env vars
vercel env add TURSO_DATABASE_URL production    # libsql://shiplog-prod-xxx.turso.io
vercel env add TURSO_AUTH_TOKEN production       # from turso db tokens create
vercel env add GITHUB_CLIENT_ID production      # from GitHub OAuth App
vercel env add GITHUB_CLIENT_SECRET production  # from GitHub OAuth App
vercel env add SESSION_SECRET production        # openssl rand -hex 32
vercel env add OPENAI_API_KEY production        # your OpenAI key
vercel env add NEXT_PUBLIC_APP_URL production   # your final URL

# Deploy
vercel --prod
```

### 4. Custom Domain (optional)

1. In Vercel dashboard → Project → Settings → Domains
2. Add `shiplog.dev` (or your domain)
3. Configure DNS as instructed
4. Update `NEXT_PUBLIC_APP_URL` env var
5. Update GitHub OAuth App callback URL

### 5. Post-Deploy Verification

- [ ] Visit homepage — landing page loads
- [ ] Click "Connect GitHub" — OAuth redirects correctly
- [ ] After auth — dashboard shows with "Connect Repo" button
- [ ] Connect a repo — PR sync begins
- [ ] Check changelog page at `/your-slug/changelog`
- [ ] Verify webhook fires on PR merge

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | `libsql://...turso.io` |
| `TURSO_AUTH_TOKEN` | Yes | Turso DB auth token |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `SESSION_SECRET` | Yes | 64-char hex string for session encryption |
| `OPENAI_API_KEY` | Yes* | For AI PR categorization (*can skip for manual mode) |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of the deployed app |
