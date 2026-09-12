# personal-extensions

Pi package that injects personal working rules. Third-party extensions and
skills are not bundled — `scripts/setup.sh` installs them.

## New machine

Need `pi` and `git` on PATH.

```bash
git clone https://github.com/0xb1ob/personal-extensions.git
cd personal-extensions
./scripts/setup.sh
```

Restart pi.

`setup.sh` is idempotent. It:

1. `pi install`s this checkout (rules extension)
2. `pi install`s pinned third-party packages
3. `npx skills add`s `find-skills` into `~/.pi/agent/skills/`
4. Filters superpowers in `~/.pi/agent/settings.json`: extension off, 8 skills kept

Dropped superpowers skills: `dispatching-parallel-agents`, `executing-plans`,
`finishing-a-development-branch`, `subagent-driven-development`,
`using-git-worktrees`, `using-superpowers`.

## Existing machine — update

```bash
cd /path/to/personal-extensions
git pull
./scripts/setup.sh
```

Restart pi.

That pulls rule/script changes, reinstalls the pins in `setup.sh`, refreshes
find-skills, and reapplies the superpowers filter (needed if
`pi update --extensions` rewrote that entry as a plain string).

To bump a third-party package: edit the version in `scripts/setup.sh`, commit,
then `git pull && ./scripts/setup.sh` on each machine.

`node test.mjs` checks rule injection and the superpowers filter.

## What this package injects

`extensions/rules.ts` appends `rules/*.md` on `before_agent_start`:

| File | Condition |
|---|---|
| `rules/style.md` | always |
| `rules/beads.md` | `br` or `bd` on PATH **and** `<cwd>/.beads/` exists |
| `rules/treehouse.md` | `treehouse` on PATH |

PATH probed once at load. Restart pi after installing `br`/`treehouse`.

## Troubleshooting

Rules missing: check gates (`br`/`treehouse` on PATH, `.beads/` in cwd).
