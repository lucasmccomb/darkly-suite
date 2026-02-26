#!/usr/bin/env bash
#
# release-check.sh — Show unreleased changes for Darkly extensions
#
# Usage:
#   ./scripts/release-check.sh              # Check all extensions
#   ./scripts/release-check.sh gmail-darkly # Check one extension
#
# Compares HEAD against the latest git tag matching {extension}-v* and lists
# commits that touch the extension's code or its shared dependencies.

set -euo pipefail

# Dependency map: each extension depends on its own package + core + site-specific
declare -A DEPS
DEPS[gmail-darkly]="packages/gmail-darkly packages/core packages/site-gmail"
DEPS[sheets-darkly]="packages/sheets-darkly packages/core packages/site-sheets"
DEPS[docs-darkly]="packages/docs-darkly packages/core packages/site-docs"
DEPS[darkly-suite]="packages/darkly-suite packages/core packages/site-gmail packages/site-sheets packages/site-docs"

ALL_EXTENSIONS=(gmail-darkly sheets-darkly docs-darkly darkly-suite)

check_extension() {
  local ext="$1"
  local paths="${DEPS[$ext]}"

  # Find the latest tag for this extension
  local tag
  tag=$(git tag --list "${ext}-v*" --sort=-version:refname | head -n1)

  if [[ -z "$tag" ]]; then
    echo "  No release tag found. Run: git tag ${ext}-v<version>"
    echo ""
    return
  fi

  # Get the version from the manifest for display
  local manifest="packages/${ext}/static/manifest.json"
  local manifest_version=""
  if [[ -f "$manifest" ]]; then
    manifest_version=$(grep '"version"' "$manifest" | sed 's/.*: *"\(.*\)".*/\1/')
  fi

  # Count commits since the tag that touch relevant paths
  local commits
  # shellcheck disable=SC2086
  commits=$(git log "${tag}..HEAD" --oneline -- $paths 2>/dev/null || true)

  local count=0
  if [[ -n "$commits" ]]; then
    count=$(echo "$commits" | wc -l | tr -d ' ')
  fi

  if [[ $count -eq 0 ]]; then
    echo "  Latest tag: ${tag} (manifest: ${manifest_version})"
    echo "  Status: up to date"
  else
    echo "  Latest tag: ${tag} (manifest: ${manifest_version})"
    echo "  Unreleased commits: ${count}"
    echo ""
    echo "$commits" | sed 's/^/    /'
  fi
  echo ""
}

# Main
if [[ $# -gt 0 ]]; then
  ext="$1"
  if [[ -z "${DEPS[$ext]+x}" ]]; then
    echo "Unknown extension: $ext"
    echo "Valid extensions: ${ALL_EXTENSIONS[*]}"
    exit 1
  fi
  echo "=== $ext ==="
  check_extension "$ext"
else
  for ext in "${ALL_EXTENSIONS[@]}"; do
    echo "=== $ext ==="
    check_extension "$ext"
  done
fi
