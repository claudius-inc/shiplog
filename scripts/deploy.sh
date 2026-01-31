#!/usr/bin/env bash
# ============================================================================
# ShipLog — One-Command Production Deployment
# ============================================================================
# Usage: ./scripts/deploy.sh
#
# Prerequisites:
#   - Turso CLI installed (curl -sSfL https://get.tur.so/install.sh | bash)
#   - Vercel CLI installed (npm i -g vercel)
#   - Both authenticated (turso auth login, vercel login)
#   - GitHub OAuth App created at https://github.com/settings/developers
#
# This script:
#   1. Creates a Turso database (if not exists)
#   2. Deploys to Vercel with all env vars
#   3. Outputs the live URL
# ============================================================================

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BOLD}→${NC} $1"; }
ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ============================================================================
# 1. Check prerequisites
# ============================================================================

info "Checking prerequisites..."

command -v turso >/dev/null 2>&1 || fail "Turso CLI not found. Install: curl -sSfL https://get.tur.so/install.sh | bash"
command -v vercel >/dev/null 2>&1 || fail "Vercel CLI not found. Install: npm i -g vercel"

turso auth status >/dev/null 2>&1 || fail "Not logged into Turso. Run: turso auth login"

ok "Prerequisites OK"

# ============================================================================
# 2. Create Turso database
# ============================================================================

DB_NAME="shiplog-prod"
TURSO_ORG=$(turso org list 2>/dev/null | head -1 | awk '{print $1}' || echo "personal")

info "Setting up Turso database '${DB_NAME}'..."

if turso db show "$DB_NAME" >/dev/null 2>&1; then
  ok "Database '${DB_NAME}' already exists"
else
  turso db create "$DB_NAME" --location sin  # Singapore — closest to user
  ok "Created database '${DB_NAME}' in Singapore"
fi

TURSO_URL=$(turso db show "$DB_NAME" --url)
TURSO_TOKEN=$(turso db tokens create "$DB_NAME")

ok "Database URL: ${TURSO_URL}"

# ============================================================================
# 3. Generate session secret
# ============================================================================

SESSION_SECRET=$(openssl rand -hex 32)

# ============================================================================
# 4. Check for required env vars
# ============================================================================

info "Checking environment configuration..."

if [[ -z "${GITHUB_CLIENT_ID:-}" ]] || [[ -z "${GITHUB_CLIENT_SECRET:-}" ]]; then
  warn "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET not set."
  echo ""
  echo "  Create a GitHub OAuth App at: https://github.com/settings/developers"
  echo "  - Homepage URL: (your Vercel deployment URL)"
  echo "  - Callback URL: (your Vercel URL)/api/auth/github/callback"
  echo ""
  read -p "  Enter GITHUB_CLIENT_ID: " GITHUB_CLIENT_ID
  read -p "  Enter GITHUB_CLIENT_SECRET: " GITHUB_CLIENT_SECRET
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  warn "OPENAI_API_KEY not set (needed for AI categorization)."
  read -p "  Enter OPENAI_API_KEY (or press Enter to skip): " OPENAI_API_KEY
fi

ok "Environment configured"

# ============================================================================
# 5. Deploy to Vercel
# ============================================================================

info "Deploying to Vercel..."

# Link project if not already linked
if [[ ! -d ".vercel" ]]; then
  vercel link --yes
fi

# Set environment variables
vercel env add TURSO_DATABASE_URL production <<< "$TURSO_URL" 2>/dev/null || true
vercel env add TURSO_AUTH_TOKEN production <<< "$TURSO_TOKEN" 2>/dev/null || true
vercel env add SESSION_SECRET production <<< "$SESSION_SECRET" 2>/dev/null || true
vercel env add GITHUB_CLIENT_ID production <<< "$GITHUB_CLIENT_ID" 2>/dev/null || true
vercel env add GITHUB_CLIENT_SECRET production <<< "$GITHUB_CLIENT_SECRET" 2>/dev/null || true
[[ -n "${OPENAI_API_KEY:-}" ]] && vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY" 2>/dev/null || true

# Deploy to production
DEPLOY_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^\s]+\.vercel\.app' | tail -1)

ok "Deployed to: ${DEPLOY_URL}"

# ============================================================================
# 6. Set NEXT_PUBLIC_APP_URL and redeploy
# ============================================================================

info "Setting NEXT_PUBLIC_APP_URL and redeploying..."
vercel env add NEXT_PUBLIC_APP_URL production <<< "$DEPLOY_URL" 2>/dev/null || true
FINAL_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^\s]+\.vercel\.app' | tail -1)

# ============================================================================
# 7. Summary
# ============================================================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ShipLog deployed successfully! 🚀${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}Live URL:${NC}    ${FINAL_URL:-$DEPLOY_URL}"
echo -e "  ${BOLD}Database:${NC}    ${TURSO_URL}"
echo -e "  ${BOLD}Dashboard:${NC}   ${FINAL_URL:-$DEPLOY_URL}/dashboard"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo "  1. Update GitHub OAuth App callback to: ${FINAL_URL:-$DEPLOY_URL}/api/auth/github/callback"
echo "  2. (Optional) Add custom domain in Vercel dashboard"
echo "  3. Test the OAuth flow at ${FINAL_URL:-$DEPLOY_URL}"
echo ""
