#!/usr/bin/env bash
#
# release-bump.sh — Bump the version in an extension's manifest.json
#
# Usage:
#   ./scripts/release-bump.sh gmail-darkly patch   # 1.0.1 → 1.0.2
#   ./scripts/release-bump.sh gmail-darkly minor   # 1.0.1 → 1.1.0
#   ./scripts/release-bump.sh gmail-darkly major   # 1.0.1 → 2.0.0

set -euo pipefail

VALID_EXTENSIONS=(gmail-darkly sheets-darkly docs-darkly darkly-suite)

usage() {
  echo "Usage: $0 <extension> <patch|minor|major>"
  echo ""
  echo "Extensions: ${VALID_EXTENSIONS[*]}"
  exit 1
}

if [[ $# -ne 2 ]]; then
  usage
fi

EXT="$1"
BUMP="$2"

# Validate extension
valid=false
for e in "${VALID_EXTENSIONS[@]}"; do
  if [[ "$e" == "$EXT" ]]; then
    valid=true
    break
  fi
done
if [[ "$valid" != "true" ]]; then
  echo "Unknown extension: $EXT"
  echo "Valid extensions: ${VALID_EXTENSIONS[*]}"
  exit 1
fi

# Validate bump type
if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Invalid bump type: $BUMP"
  echo "Must be: patch, minor, or major"
  exit 1
fi

MANIFEST="packages/${EXT}/static/manifest.json"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Manifest not found: $MANIFEST"
  exit 1
fi

# Read current version
CURRENT=$(grep '"version"' "$MANIFEST" | sed 's/.*: *"\(.*\)".*/\1/')

if [[ -z "$CURRENT" ]]; then
  echo "Could not read version from $MANIFEST"
  exit 1
fi

# Split into components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

# Bump
case "$BUMP" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW="${MAJOR}.${MINOR}.${PATCH}"

# Write back - replace the version line in manifest.json
sed -i '' "s/\"version\": \"${CURRENT}\"/\"version\": \"${NEW}\"/" "$MANIFEST"

echo "${EXT}: ${CURRENT} → ${NEW}"
echo "Updated: ${MANIFEST}"
