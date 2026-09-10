# Beads workflow (`br` / `bd`)

This repo tracks issues with [beads_rust](https://github.com/Dicklesworthstone/beads_rust).
Issues live in `.beads/` and are tracked in git.

## Essential commands

```bash
# View ready issues (open, unblocked, not deferred)
br ready              # or: bd ready

# List and search
br list --status=open # All open issues
br show <id>          # Full issue details with dependencies
br search "keyword"   # Full-text search

# Create and update
br create --title="..." --description="..." --type=task --priority=2
br update <id> --status=in_progress
br close <id> --reason="Completed"
br close <id1> <id2>  # Close multiple issues at once

# Sync with git
br sync --flush-only  # Export DB to JSONL
br sync --status      # Check sync status
```

## Workflow pattern

1. **Start**: `br ready` to find actionable work
2. **Claim**: `br update <id> --status=in_progress`
3. **Work**: implement the task
4. **Complete**: `br close <id>`
5. **Sync**: always `br sync --flush-only` at session end

## Key concepts

- **Dependencies**: issues can block other issues. `br ready` shows only open,
  unblocked work. Add with `br dep add <issue> <depends-on>`.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (numbers
  0-4, not words)
- **Types**: task, bug, feature, epic, chore, docs, question

## Session protocol

Before ending any session:

```bash
git status              # Check what changed
git add <files>         # Stage code changes
br sync --flush-only    # Export beads changes to JSONL
git commit -m "..."     # Commit everything
git push                # Push to remote
```

## Best practices

- Check `br ready` at session start
- Update status as you work (in_progress -> closed)
- Create new issues with `br create` when you discover tasks
- Descriptive titles, appropriate priority/type
- Always sync before ending the session
