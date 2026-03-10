#!/usr/bin/env bash
# =============================================================================
# Supabase DB Backup Script
# =============================================================================
# Uses the Supabase CLI in linked mode — no credentials needed in the command.
#
# Prerequisites:
#   1. supabase login          (run once, stores token locally)
#   2. supabase link           (already done via supabase/config.toml)
#
# Usage:
#   ./scripts/backup-db.sh
#
# Output:
#   backups/YYYY-MM-DD_HH-MM/
#     schema.sql   — all DDL: tables, views, RLS policies, functions, triggers
#     data.sql     — all row data in the public schema
#     auth.sql     — auth.users + metadata (for migration purposes)
#     roles.sql    — database roles
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BACKUP_ROOT="$(cd "$(dirname "$0")/.." && pwd)/backups"
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="$BACKUP_ROOT/$DATE"

# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------
if ! command -v supabase &>/dev/null; then
  echo "❌ supabase CLI not found. Install it: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "🔗 Checking Supabase link status..."
if ! supabase status --workdir "$(cd "$(dirname "$0")/.." && pwd)" &>/dev/null 2>&1; then
  echo "⚠️  Local Supabase stack not running — that's fine for remote backups."
fi

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
mkdir -p "$BACKUP_DIR"
echo ""
echo "📦 Starting backup → $BACKUP_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ---------------------------------------------------------------------------
# 1. Schema dump (DDL: tables, RLS, functions, triggers, views)
# ---------------------------------------------------------------------------
echo "📐 [1/4] Dumping schema..."
supabase db dump --linked \
  -f "$BACKUP_DIR/schema.sql"
echo "    ✅ schema.sql"

# ---------------------------------------------------------------------------
# 2. Data dump (all rows in the public schema)
# ---------------------------------------------------------------------------
echo "📋 [2/4] Dumping public data..."
supabase db dump --linked \
  --data-only \
  -f "$BACKUP_DIR/data.sql"
echo "    ✅ data.sql"

# ---------------------------------------------------------------------------
# 3. Auth dump (auth.users + sessions — needed for platform migration)
# ---------------------------------------------------------------------------
echo "🔐 [3/4] Dumping auth schema..."
supabase db dump --linked \
  --data-only \
  --schema auth \
  -f "$BACKUP_DIR/auth.sql"
echo "    ✅ auth.sql"

# ---------------------------------------------------------------------------
# 4. Roles dump (cluster-level DB roles)
# ---------------------------------------------------------------------------
echo "👤 [4/4] Dumping roles..."
supabase db dump --linked \
  --role-only \
  -f "$BACKUP_DIR/roles.sql"
echo "    ✅ roles.sql"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Backup complete!"
echo ""
echo "Files saved to: $BACKUP_DIR"
echo ""
ls -lh "$BACKUP_DIR"
echo ""
echo "💡 To restore to a new Supabase project:"
echo "   psql \"\$DB_URL\" < $BACKUP_DIR/schema.sql"
echo "   psql \"\$DB_URL\" < $BACKUP_DIR/roles.sql"
echo "   psql \"\$DB_URL\" < $BACKUP_DIR/data.sql"
echo "   psql \"\$DB_URL\" < $BACKUP_DIR/auth.sql"
echo ""
echo "⚠️  Keep backup files safe — auth.sql contains user data."
