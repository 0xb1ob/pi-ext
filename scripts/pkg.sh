#!/usr/bin/env bash
# Add or remove a bundled pi package: npm install/uninstall + manifest wiring.
#
#   scripts/pkg.sh add pi-whatever
#   scripts/pkg.sh add github:owner/repo#v1.2.3
#   scripts/pkg.sh remove pi-whatever
#   scripts/pkg.sh check                     # manifest vs node_modules
set -euo pipefail
cd "$(dirname "$0")/.."

usage() { sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
[ $# -ge 1 ] || usage

case "$1" in
add)
	[ $# -eq 2 ] || usage
	before=$(node -p 'JSON.stringify(Object.keys(require("./package.json").dependencies||{}))')
	npm install --silent "$2"
	node -e '
const fs = require("node:fs");
const before = new Set(JSON.parse(process.argv[1]));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const added = Object.keys(pkg.dependencies || {}).filter((d) => !before.has(d));
const name = added[0];
if (!name) {
  console.log("Already a dependency; manifest unchanged. Edit package.json by hand if paths moved.");
  process.exit(0);
}
const dep = JSON.parse(fs.readFileSync(`node_modules/${name}/package.json`, "utf8"));
const declared = dep.pi || {};
const conv = { extensions: "extensions", skills: "skills", prompts: "prompts", themes: "themes" };
const notes = [];
for (const kind of Object.keys(conv)) {
  let paths = (declared[kind] || []).map((p) => p.replace(/^\.\//, ""));
  // No pi manifest in the dependency: fall back to pi convention directories.
  if (!declared[kind] && !dep.pi && fs.existsSync(`node_modules/${name}/${conv[kind]}`)) paths = [conv[kind]];
  for (const p of paths) {
    const full = `node_modules/${name}/${p}`;
    if (!fs.existsSync(full)) { notes.push(`skipped missing ${full}`); continue; }
    // A dependency that registers its own skill dirs must not have them listed
    // here too, or every skill collides with itself.
    if (kind === "skills" && selfRegisters(name, declared.extensions || [])) {
      notes.push(`skipped ${full} (extension self-registers skills via resources_discover)`);
      continue;
    }
    pkg.pi[kind] = pkg.pi[kind] || (fs.existsSync(conv[kind]) ? [conv[kind]] : []);
    if (!pkg.pi[kind].includes(full)) { pkg.pi[kind].push(full); notes.push(`+ pi.${kind}: ${full}`); }
  }
}
function selfRegisters(name, extPaths) {
  return extPaths.some((p) => {
    const f = `node_modules/${name}/${p.replace(/^\.\//, "")}`;
    try { return fs.readFileSync(f, "utf8").includes("resources_discover"); } catch { return false; }
  });
}
fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`${name}@${dep.version}`);
console.log(notes.length ? notes.join("\n") : "no pi resources found - nothing wired");
' "$before"
	;;

remove)
	[ $# -eq 2 ] || usage
	npm uninstall --silent "$2" || true
	node -e '
const fs = require("node:fs");
const name = process.argv[1];
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const prefix = `node_modules/${name}/`;
let n = 0;
for (const kind of Object.keys(pkg.pi)) {
  if (!Array.isArray(pkg.pi[kind])) continue;
  const kept = pkg.pi[kind].filter((p) => !p.startsWith(prefix));
  n += pkg.pi[kind].length - kept.length;
  if (kept.length) pkg.pi[kind] = kept;
  else delete pkg.pi[kind]; // [] means "load none of this type" - drop the key instead
}
fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`removed ${name}: ${n} manifest path(s)`);
' "$2"
	;;

check)
	node -e '
const fs = require("node:fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
let bad = 0;
for (const [kind, paths] of Object.entries(pkg.pi)) {
  if (!Array.isArray(paths)) continue;
  for (const p of paths) if (!fs.existsSync(p)) { console.log(`MISSING pi.${kind}: ${p}`); bad++; }
}
for (const d of Object.keys(pkg.dependencies || {})) {
  const wired = Object.values(pkg.pi).some((v) => Array.isArray(v) && v.some((p) => p.startsWith(`node_modules/${d}/`)));
  if (!wired) console.log(`UNWIRED dependency: ${d}`);
}
console.log(bad ? `${bad} missing path(s)` : "all manifest paths exist");
'
	;;

*) usage ;;
esac

echo "Restart pi to load changes. Then: git add -A && git commit"
