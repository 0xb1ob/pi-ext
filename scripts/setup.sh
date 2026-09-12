#!/usr/bin/env bash
# Install 3rd-party pi packages + find-skills. Then filter superpowers.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(pwd)

command -v pi >/dev/null || { echo "pi not on PATH"; exit 1; }

install() { echo "pi install $1"; pi install "$1"; }

install npm:@dietrichgebert/ponytail@4.9.0
install npm:@juicesharp/rpiv-ask-user-question@2.9.0
install npm:pi-caveman@1.0.8
install npm:pi-codex-image-gen@0.1.12
install npm:pi-mcp-adapter@2.33.0
install npm:pi-multimodal-proxy@1.18.1
install npm:pi-web-access@0.27.0
install git:github.com/obra/superpowers@v6.3.0
install "$ROOT"

echo "npx skills add vercel-labs/skills@find-skills"
npx --yes skills add vercel-labs/skills --skill find-skills -g -a pi -y

node scripts/patch-settings.mjs
echo "Restart pi."
