# pi-ext

Personal pi rules injector. Third-party packages are **not** bundled. Install
this package, then run `setup.sh` once so they land as normal global
`pi install`s.

## New machine

```bash
pi install git:github.com/0xb1ob/pi-ext@v1
```

Restart pi. If companions are missing, the extension tells you to run:

```bash
curl -fsSL https://raw.githubusercontent.com/0xb1ob/pi-ext/main/scripts/setup.sh | bash
```

That one-liner `pi install`s the latest third-party packages globally,
filters superpowers (extension off, 8 skills kept), and symlinks package
skills into `~/.pi/agent/skills` so guessed skill paths hit. Then restart
pi again.

`setup.sh` also installs `pi-ext` if it is not already in settings, so the
curl line alone is enough on a blank machine.

## Existing machine — update

```bash
pi install git:github.com/0xb1ob/pi-ext@v1
curl -fsSL https://raw.githubusercontent.com/0xb1ob/pi-ext/main/scripts/setup.sh | bash
```

Restart pi.

## What this package injects

`extensions/rules.ts` appends `rules/*.md` on `before_agent_start`:

| File | Condition |
|---|---|
| `rules/style.md` | always |
| `rules/beads.md` | `br` or `bd` on PATH **and** `<cwd>/.beads/` exists |
| `rules/treehouse.md` | `treehouse` on PATH |

PATH probed once at load. Restart pi after installing `br`/`treehouse`.

If required global packages/skills are missing, a short notice with the
setup one-liner is appended too.

Dropped superpowers skills: `dispatching-parallel-agents`, `executing-plans`,
`finishing-a-development-branch`, `subagent-driven-development`,
`using-git-worktrees`, `using-superpowers`.

`node test.mjs` checks rule injection, companion gaps, and the superpowers filter.
