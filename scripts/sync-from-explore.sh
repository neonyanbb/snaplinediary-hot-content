#!/usr/bin/env bash
# 将探索区实施阶段各方向 03-final 终稿同步到本仓库 content/<方向>/
# 用法：在仓库根目录执行 ./scripts/sync-from-explore.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE="$(cd "$HOT_ROOT/.." && pwd)"

# 若实施阶段目录更名，修改此处
STAGE_DIR="$WORKSPACE/02-实施阶段-v1.0-20260508"

if [[ ! -d "$STAGE_DIR" ]]; then
  echo "错误：未找到实施阶段目录: $STAGE_DIR"
  exit 1
fi

sync_glob() {
  local src_dir="$1"
  local dest_dir="$2"
  mkdir -p "$dest_dir"
  shopt -s nullglob
  local files=( "$src_dir"/*.md )
  shopt -u nullglob
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "跳过（无 md）: $src_dir"
    return 0
  fi
  cp -v "${files[@]}" "$dest_dir/"
}

echo "==> 源: $STAGE_DIR"
echo "==> 目标: $HOT_ROOT/content"

sync_glob "$STAGE_DIR/03-hermes/03-final"           "$HOT_ROOT/content/hermes"
sync_glob "$STAGE_DIR/04-claude-code/03-final"    "$HOT_ROOT/content/claude-code"
sync_glob "$STAGE_DIR/05-ai-tools/03-final"       "$HOT_ROOT/content/ai-tools"
sync_glob "$STAGE_DIR/06-github-projects/03-final" "$HOT_ROOT/content/github-projects"

echo "==> 完成。请在仓库根执行: npm install && npm run build"
