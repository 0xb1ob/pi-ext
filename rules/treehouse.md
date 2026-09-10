# Worktrees: use Treehouse

When worktree isolation is needed, use **Treehouse** to acquire and release a
pooled worktree. Do not create worktrees with `git worktree add` or agent tooling
that bypasses Treehouse. Worktrees are optional for tasks that do not need isolation.

```bash
# Inspect the pool from this repository
treehouse status --json

# Acquire a durable lease without opening an interactive subshell
treehouse get --lease --json --lease-holder "<task-or-session-id>"
```

- Record the returned absolute path and lease ID, then work inside that path.
  Check `git status` and the current branch/base before editing; create a task
  branch as needed. Give subagents this leased path instead of requesting their
  own worktree isolation.
- A lease remains reserved until returned, even when no process is running.
  `treehouse enter` does not acquire a lease; do not use it to take another
  agent's worktree.
- Before returning, finish or stop your worktree processes, sync Beads, commit
  and push work that must be preserved, and verify the working tree is clean.
  Return only your lease, using its recorded identity:

```bash
treehouse return "<leased-path>" --if-lease-id "<lease-id>"
```

Do not use `return --force`, `destroy`, or `prune` to bypass unresolved changes
or interfere with another agent's work. If Treehouse is unavailable, report the
blocker instead of silently falling back to unmanaged worktrees.
