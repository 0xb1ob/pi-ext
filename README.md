# pi-ext

Personal pi rules injector. Third-party packages are **not** bundled.

## New machine / update

```bash
curl -fsSL https://raw.githubusercontent.com/0xb1ob/pi-ext/main/scripts/setup.sh | bash
```

Restart pi.

That one-liner `pi install`s `pi-ext@v1` plus latest third-party packages globally, filters superpowers (extension off, 8 skills kept), and symlinks package skills into `~/.pi/agent/skills` so guessed skill paths hit.

## What this package injects

`extensions/rules.ts` writes `rules/*.md` into the `personal_rules` system-prompt section on `before_agent_start` (pi 0.86+ patch, not a full prompt rewrite):

| File | Condition |
|---|---|
| `rules/style.md` | always |
| `rules/beads.md` | `br` or `bd` on PATH **and** `<cwd>/.beads/` exists |
| `rules/treehouse.md` | `treehouse` on PATH |

PATH probed once at load. Restart pi after installing `br`/`treehouse`.

If required global packages/skills are missing, a short notice with the setup one-liner is included in that section too.

Dropped superpowers skills: `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `subagent-driven-development`, `using-git-worktrees`, `using-superpowers`.

`node test.mjs` checks rule injection, companion gaps, and the superpowers filter.

Pi upgrades: `.agents/skills/updating-pi-harness/` (project skill; `/skill:updating-pi-harness`) walks changelog → impact check → package.json bump → `v1` tag.
