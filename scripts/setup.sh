#!/usr/bin/env bash
# Global 3rd-party pi packages + superpowers filter.
# Safe as: curl -fsSL https://raw.githubusercontent.com/0xb1ob/pi-ext/main/scripts/setup.sh | bash
set -euo pipefail

RAW=https://raw.githubusercontent.com/0xb1ob/pi-ext/main

command -v pi >/dev/null || { echo "pi not on PATH"; exit 1; }
command -v node >/dev/null || { echo "node not on PATH"; exit 1; }

install() { echo "pi install $1"; pi install "$1"; }

install git:github.com/0xb1ob/pi-ext@v1
install npm:@dietrichgebert/ponytail
install npm:@juicesharp/rpiv-ask-user-question
install npm:pi-caveman
install npm:pi-codex-image-gen
install npm:pi-hashline-edit-pro
install npm:pi-lens
install npm:pi-mcp-adapter
install npm:pi-multimodal-proxy
install npm:pi-web-access
install npm:@tintinweb/pi-subagents
install git:github.com/obra/superpowers

src=${BASH_SOURCE[0]:-}
dir=$(cd "$(dirname "$src")" 2>/dev/null && pwd || true)
if [[ -n "$dir" && -f "$dir/patch-settings.mjs" ]]; then
	node "$dir/patch-settings.mjs"
else
	tmp=$(mktemp)
	mv "$tmp" "$tmp.mjs"
	curl -fsSL "$RAW/scripts/patch-settings.mjs" -o "$tmp.mjs"
	node "$tmp.mjs"
	rm -f "$tmp.mjs"
fi

echo "Restart pi."
