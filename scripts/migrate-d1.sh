#!/usr/bin/env bash
# migrate-d1.sh — Export licenses from per-product D1 databases and import
# into the unified darklysuite D1 with composite key (token, product).
#
# Prerequisites:
#   - wrangler CLI authenticated (`npx wrangler login`)
#   - Source D1 databases exist: gmaildarkly, sheetsdarkly, docsdarkly
#   - Target D1 database exists: darkly-suite-payments (with schema applied)
#
# Usage:
#   ./scripts/migrate-d1.sh                  # Full migration (all products)
#   ./scripts/migrate-d1.sh --dry-run        # Preview SQL without executing
#   ./scripts/migrate-d1.sh --product gmail  # Migrate a single product

set -euo pipefail

# --- Configuration -----------------------------------------------------------

# Source D1 database names (one per legacy product)
declare -A SOURCE_DBS=(
  [gmail]="gmaildarkly"
  [sheets]="sheetsdarkly"
  [docs]="docsdarkly"
)

# Target unified D1 database name
TARGET_DB="darkly-suite-payments"

# Products to migrate (overridden by --product flag)
PRODUCTS=("gmail" "sheets" "docs")

# Flags
DRY_RUN=false
SINGLE_PRODUCT=""

# --- Parse arguments ----------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --product)
      SINGLE_PRODUCT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--product gmail|sheets|docs]"
      exit 1
      ;;
  esac
done

if [[ -n "$SINGLE_PRODUCT" ]]; then
  if [[ ! "${SOURCE_DBS[$SINGLE_PRODUCT]+_}" ]]; then
    echo "Error: Unknown product '$SINGLE_PRODUCT'. Must be gmail, sheets, or docs."
    exit 1
  fi
  PRODUCTS=("$SINGLE_PRODUCT")
fi

# --- Helpers ------------------------------------------------------------------

log() { echo "[migrate-d1] $*"; }
err() { echo "[migrate-d1] ERROR: $*" >&2; }

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# --- Export & Import ----------------------------------------------------------

total_exported=0
total_imported=0

for product in "${PRODUCTS[@]}"; do
  source_db="${SOURCE_DBS[$product]}"
  export_file="$TMPDIR/${product}_licenses.json"

  log "--- Migrating '$product' from D1 database '$source_db' ---"

  # 1. Export licenses from the source database
  log "Exporting licenses from $source_db..."
  npx wrangler d1 execute "$source_db" \
    --command "SELECT token, email, plan, status, stripe_customer_id, stripe_subscription_id, discount_code_id, created_at, expires_at FROM licenses;" \
    --json > "$export_file" 2>/dev/null

  # Parse the result — wrangler d1 execute --json returns an array of result objects
  # The actual rows are in .[0].results
  row_count=$(node -e "
    const data = require('$export_file');
    const results = data[0]?.results ?? [];
    console.log(results.length);
  ")

  if [[ "$row_count" == "0" ]]; then
    log "No licenses found in $source_db — skipping."
    continue
  fi

  log "Found $row_count license(s) in $source_db."
  total_exported=$((total_exported + row_count))

  # 2. Generate INSERT statements for the unified database
  insert_sql_file="$TMPDIR/${product}_insert.sql"

  node -e "
    const data = require('$export_file');
    const results = data[0]?.results ?? [];
    const product = '$product';

    const statements = results.map(row => {
      const token = row.token.replace(/'/g, \"''\");
      const email = row.email ? \"'\" + row.email.replace(/'/g, \"''\") + \"'\" : 'NULL';
      const plan = row.plan.replace(/'/g, \"''\");
      const status = row.status.replace(/'/g, \"''\");
      const stripe_customer_id = row.stripe_customer_id
        ? \"'\" + row.stripe_customer_id.replace(/'/g, \"''\") + \"'\"
        : 'NULL';
      const stripe_subscription_id = row.stripe_subscription_id
        ? \"'\" + row.stripe_subscription_id.replace(/'/g, \"''\") + \"'\"
        : 'NULL';
      const discount_code_id = row.discount_code_id ?? 'NULL';
      const created_at = row.created_at.replace(/'/g, \"''\");
      const expires_at = row.expires_at
        ? \"'\" + row.expires_at.replace(/'/g, \"''\") + \"'\"
        : 'NULL';

      return \`INSERT INTO licenses (token, product, email, plan, status, stripe_customer_id, stripe_subscription_id, discount_code_id, created_at, expires_at) VALUES ('\${token}', '\${product}', \${email}, '\${plan}', '\${status}', \${stripe_customer_id}, \${stripe_subscription_id}, \${discount_code_id}, '\${created_at}', \${expires_at}) ON CONFLICT (token, product) DO NOTHING;\`;
    });

    require('fs').writeFileSync('$insert_sql_file', statements.join('\n') + '\n');
  "

  # 3. Execute or preview
  if [[ "$DRY_RUN" == "true" ]]; then
    log "[DRY RUN] SQL that would be executed for '$product':"
    echo "---"
    cat "$insert_sql_file"
    echo "---"
  else
    log "Importing $row_count license(s) into $TARGET_DB with product='$product'..."
    npx wrangler d1 execute "$TARGET_DB" \
      --file "$insert_sql_file" \
      2>/dev/null
    total_imported=$((total_imported + row_count))
    log "Import complete for '$product'."
  fi
done

# --- Summary ------------------------------------------------------------------

echo ""
log "=== Migration Summary ==="
log "Products migrated: ${PRODUCTS[*]}"
log "Total licenses exported: $total_exported"

if [[ "$DRY_RUN" == "true" ]]; then
  log "Mode: DRY RUN (no data was written)"
else
  log "Total licenses imported: $total_imported"
  log "Duplicates were skipped (ON CONFLICT DO NOTHING)"
fi

log "Done."
