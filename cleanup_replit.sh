#!/usr/bin/env bash
# cleanup_replit.sh — safe workspace cleanup for Replit
# Default: DRY RUN + move to .trash. Use --delete to permanently remove.

set -euo pipefail

# ---------- Settings ----------
SIZE_THRESH="+5M"                 # archives/logs larger than this are considered junk
TRASH_DIR=".trash/$(date +%Y%m%d-%H%M%S)"
DRY_RUN=true                      # default behavior
PERMA_DELETE=false                # set by --delete
# IMPORTANT: safe paths we won't touch
PROTECT_PATTERNS=(
  "./node_modules/*"
  "./.git/*"
  "./server/*"
  "./client/*"
  "./src/*"
  "./public/*"
  "./dist/*"
)

show_help() {
  cat <<'HLP'
Usage: ./cleanup_replit.sh [--dry-run] [--delete] [--help]

  --dry-run   : show what would be moved/deleted (default)
  --delete    : permanently delete instead of moving to .trash
  --help      : show this help

What it targets (safely, with prompts):
  • Debug/Test code: *dug*, *trace*, *analysis*, *tmp*, *test*  (.js, .ts, .mjs, .md)
  • SQLite DBs:      *.db3, *_meta.db3
  • Large archives:  *.zip, *.tar, *.gz larger than SIZE_THRESH
  • Data artifacts:  *.csv, *.sql (outside protected dirs)
  • Logs & temps:    *.log, *.log.*, *.tmp, *~ , .DS_Store
HLP
}

# ---------- CLI ----------
for arg in "$@"; do
  case "$arg" in
    --dry-run)   DRY_RUN=true  ;;
    --delete)    DRY_RUN=false; PERMA_DELETE=true ;;
    --help|-h)   show_help; exit 0 ;;
    *) echo "Unknown option: $arg"; show_help; exit 1 ;;
  esac
done

echo "🔍 Workspace cleanup starting..."
echo "Mode: $([ "$DRY_RUN" = true ] && echo 'DRY RUN (no changes)')$([ "$PERMA_DELETE" = true ] && echo 'PERMANENT DELETE')$([ "$DRY_RUN" = false ] && [ "$PERMA_DELETE" = false ] && echo "Move to $TRASH_DIR")"
echo

# Build common find excludes
EXCLUDES=()
for p in "${PROTECT_PATTERNS[@]}"; do
  EXCLUDES+=( -path "$p" -prune -o )
done

# Helper to gather candidates
gather() {
  # shellcheck disable=SC2046
  find . \( "${EXCLUDES[@]}" -false -o \
     -type f \( \
        -iname "*dug*.js" -o -iname "*dug*.ts" -o -iname "*dug*.mjs" -o -iname "*dug*.md" -o \
        -iname "*trace*.js" -o -iname "*trace*.ts" -o -iname "*trace*.mjs" -o -iname "*trace*.md" -o \
        -iname "*analysis*.js" -o -iname "*analysis*.ts" -o -iname "*analysis*.mjs" -o -iname "*analysis*.md" -o \
        -iname "*test*.js" -o -iname "*test*.ts" -o -iname "*test*.mjs" -o -iname "*test*.md" -o \
        -iname "*tmp*.js" -o -iname "*tmp*.ts" -o -iname "*tmp*.mjs" -o \
        -iname "*.db3" -o -iname "*_meta.db3" -o \
        -iname "*.log" -o -iname "*.log.*" -o -iname "*.tmp" -o -iname "*.swp" -o -iname ".DS_Store" -o \
        -iname "*.csv" -o -iname "*.sql" -o \
        -size "$SIZE_THRESH" -a \( -iname "*.zip" -o -iname "*.tar" -o -iname "*.gz" \) \
     \) \
  \)
}

# List candidates
CANDIDATES=$(gather || true)
if [ -z "$CANDIDATES" ]; then
  echo "✅ Nothing to clean."
  exit 0
fi

echo "⚠️  Found the following files to review:"
echo "$CANDIDATES" | sed 's/^/  - /'
echo

read -rp "Proceed? [y/N] " ANS
[[ "$ANS" =~ ^[Yy]$ ]] || { echo "❌ Cancelled."; exit 0; }

if [ "$DRY_RUN" = true ]; then
  echo "👀 DRY RUN — no changes made."
  exit 0
fi

if [ "$PERMA_DELETE" = true ]; then
  echo "🗑️  Permanently deleting..."
  echo "$CANDIDATES" | xargs -r rm -f
  echo "✅ Done."
  exit 0
fi

echo "📦 Moving files to $TRASH_DIR ..."
mkdir -p "$TRASH_DIR"
# Preserve folder structure under .trash
while IFS= read -r f; do
  dest="$TRASH_DIR/${f#./}"
  mkdir -p "$(dirname "$dest")"
  mv -v "$f" "$dest"
done <<< "$CANDIDATES"

echo "✅ Moved to $TRASH_DIR"
echo "ℹ️  To restore any file: mv .trash/<timestamp>/path/to/file ./path/to/"
