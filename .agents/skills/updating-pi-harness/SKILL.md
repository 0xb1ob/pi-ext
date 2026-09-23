---
name: updating-pi-harness
description: Use when the pi harness (@earendil-works/pi-coding-agent) was upgraded or is about to be, when asked to check pi breaking changes against this extension, or to bump the extension version / pi peerDependency in this repo.
---

# Updating for a new pi harness version

Old version = `peerDependencies["@earendil-works/pi-coding-agent"]` floor in `package.json`. New version = installed pi.

## 1. Locate installed pi and read the changelog range

```bash
P="$(npm root -g)/@earendil-works/pi-coding-agent"   # fnm: global root follows active node
NEW=$(node -p "require('$P/package.json').version")
OLD=$(node -p "require('./package.json').peerDependencies['@earendil-works/pi-coding-agent'].replace(/[^0-9.]/g,'')")
awk -v n="## [$NEW]" -v o="## [$OLD]" 'index($0,n)==1{p=1} index($0,o)==1{exit} p' "$P/CHANGELOG.md"
```

Empty output = wrong path or version; check `ls "$P"` and `pi --version`.

## 2. Map changes to what this repo actually uses

```bash
grep -rn "pi\.on(\|pi\.\w\+(\|from \"@earendil-works" extensions scripts
```

Read every **Breaking Changes** entry, plus **Changed** and extension-related **Fixed** entries (`context`, `before_agent_start`, sections, skills, packages, settings.json shape). For each, answer: does this repo touch that API? Today it uses `before_agent_start` → `event.systemPrompt`, `event.systemPromptOptions.{cwd,sections}`, and `scripts/patch-settings.mjs` edits `~/.pi/agent/settings.json` `packages`.

Verify against shipped types, not memory:

```bash
grep -n "interface BeforeAgentStartEvent" -A 12 "$P/dist/core/extensions/types.d.ts"
grep -n "NormalizedBuildSystemPromptOptions" -A 14 "$P/dist/core/system-prompt.d.ts"
```

Docs: `$P/docs/extensions.md`, `$P/docs/packages.md`, `$P/docs/settings.md`.

## 3. Fix, then test

Adapt code for any hit. Keep `test.mjs` in sync with the API shape. Run `node test.mjs` — must print `ok`.

## 4. Bump package.json

| Situation | `version` | peer floor |
|---|---|---|
| New pi version verified, no code change | minor | `>=NEW` |
| Code changed for new pi API | minor | `>=NEW` |
| Extension behavior breaks for users | major (also new tag `vN`) | `>=NEW` |

Keep 2-space JSON indent. Update README only where it names a pi version that is no longer accurate.

## 5. Ship

Branch `pi-NEW`, commit, push, open PR. After merge, move the floating tag that `scripts/setup.sh` installs (`pi-ext@v1`):

```bash
git switch main && git pull && git tag -f v1 && git push -f origin v1
```

Ask the user before any push or tag move.

## Common mistakes

- Reading only 0.x.1 notes: breaking changes usually live in the intermediate 0.x.0 entry. Read the whole range.
- Claiming "no impact" without grepping the `.d.ts` for the fields the extension reads.
- Forgetting the `v1` tag: users installing via setup.sh keep the old commit.
