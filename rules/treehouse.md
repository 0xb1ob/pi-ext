# Worktrees: use Treehouse

Any task that creates a commit or branch runs in a leased Treehouse worktree.
The main checkout stays on `main`, clean, and unclaimed so other sessions can
lease it. "Isolation" means the checkout is a shared resource, not just
conflict avoidance — a single-agent task with no file conflicts still leases.

Work directly in the main checkout only for read-only inspection, or when the
user says so explicitly.

Do not create worktrees with `git worktree add` or agent tooling that bypasses
Treehouse.

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
- Before returning, finish or stop your worktree processes, sync Beads, leave
  a PR with green CI (and review comments handled), and verify the working
  tree is clean. Return only your lease, using its recorded identity:

```bash
treehouse return "<leased-path>" --if-lease-id "<lease-id>"
```

Do not use `return --force`, `destroy`, or `prune` to bypass unresolved changes
or interfere with another agent's work. If Treehouse is unavailable, report the
blocker instead of silently falling back to unmanaged worktrees.

Worktree work finishes as a PR. Commit, push, and open one without waiting to
be asked.

Once the PR is open, check first whether this repo has an automated code-review
CI job (workflow files or the PR's announced checks). Do that before sitting
on `gh pr checks --watch` so review can start while tests run.

- Review job exists → wait for CI (including that job) to finish green. Read
  the review, apply the comments that apply (verify first; skip or push back
  on the rest).
- No review job → dispatch `requesting-code-review` in a subagent now, in
  parallel with waiting for the rest of CI. Act on that feedback the same way.

CI red → fix root cause, push, wait again. After review fixes, push and wait
CI green again. Do not return the lease until that loop is done. Do not merge
unless asked.
