#!/usr/bin/env bash
# Global 3rd-party pi packages + find-skills + superpowers filter.
# Safe as: curl -fsSL https://raw.githubusercontent.com/0xb1ob/pi-ext/v1/scripts/setup.sh | bash
set -euo pipefail

REF=v1
RAW=https://raw.githubusercontent.com/0xb1ob/pi-ext/$REF
SETTINGS="${HOME}/.pi/agent/settings.json"

command -v pi >/dev/null || { echo "pi not on PATH"; exit 1; }

install() { echo "pi install $1"; pi install "$1"; }

has_pkg() {
	[ -f "$SETTINGS" ] || return 1
	node -e '
const fs = require("node:fs");
const n = process.argv[1];
const pkgs = JSON.parse(fs.readFileSync(process.argv[2], "utf8")).packages || [];
process.exit(pkgs.some((p) => String(typeof p === "string" ? p : p.source).includes(n)) ? 0 : 1);
' "$1" "$SETTINGS"
}

if ! has_pkg pi-ext && ! has_pkg personal-extensions; then
	install git:github.com/0xb1ob/pi-ext@$REF
fi

install npm:@dietrichgebert/ponytail@4.9.0
install npm:@juicesharp/rpiv-ask-user-question@2.9.0
install npm:pi-caveman@1.0.8
install npm:pi-codex-image-gen@0.1.12
install npm:pi-mcp-adapter@2.33.0
install npm:pi-multimodal-proxy@1.18.1
install npm:pi-web-access@0.27.0
install git:github.com/obra/superpowers@v6.3.0

echo "npx skills add vercel-labs/skills@find-skills"
npx --yes skills add vercel-labs/skills --skill find-skills -g -a pi -y

src=${BASH_SOURCE[0]:-}
dir=$(cd "$(dirname "$src")" 2>/dev/null && pwd || true)
if [[ -n "$dir" && -f "$dir/patch-settings.mjs" ]]; then
	node "$dir/patch-settings.mjs"
else
	tmp=$(mktemp)
	curl -fsSL "$RAW/scripts/patch-settings.mjs" -o "$tmp"
	node "$tmp"
	rm -f "$tmp"
fi

echo "Restart pi."
