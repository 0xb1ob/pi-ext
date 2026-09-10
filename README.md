# personal-extensions

One pi package that carries everything to a new machine: skills, extensions and
always-on working rules.

## Install (per machine)

```bash
pi install git:github.com/<you>/personal-extensions@v1
```

Then remove the individually installed copies from `~/.pi/agent/settings.json`
`packages` (they would load twice):

```json
"packages": ["git:github.com/<you>/personal-extensions@v1"]
```

Local development on this checkout instead:

```bash
npm install
pi install /Users/0xb1ob/Workspace/personal-extensions
```

## Update

```bash
git tag v2 && git push --tags          # on the machine you edit
pi install git:github.com/<you>/personal-extensions@v2   # on each machine
```

## Contents

| Path | What |
|---|---|
| `extensions/rules.ts` | Appends `rules/*.md` to the system prompt every turn |
| `rules/style.md` | Always injected |
| `rules/beads.md` | Injected only when `br`/`bd` is on PATH **and** cwd has `.beads/` |
| `rules/treehouse.md` | Injected only when `treehouse` is on PATH |
| `skills/` | Own skills (`find-skills`) |
| `package.json` `pi.extensions` | Re-exports the bundled third-party extensions |

Bundled via npm/git dependencies: ponytail, caveman, pi-web-access,
pi-multimodal-proxy, pi-subagents, rpiv-ask-user-question, superpowers.
Bump a version in `dependencies`, commit, tag — all machines get the same set.

## Test

```bash
node test.mjs
```
