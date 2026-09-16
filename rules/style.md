# Personal working rules

- Mark a deliberate corner with its ceiling and upgrade path:
  `# ponytail: in-memory only, durable journal is the upgrade`.
- Read before editing: trace the real flow end to end, grep every caller of a
  function before changing it. Fix root cause, not the symptom the report names.
- On the main checkout, do not commit unless asked. Worktree work still ends
  in a PR without waiting. Scratch reports and briefs go in git-ignored
  scratch dirs (e.g. `.superpowers/sdd/`), never in repo docs.
- Never log or paste secrets, API keys, URLs with tokens, or `.env` contents.
- Non-trivial logic leaves one runnable check behind (an `assert` self-check or
  one small test), no frameworks or fixtures unless asked.
- Model choice for delegated work: cheap/mechanical model for docs, test
  scaffolding and mechanical refactors; strongest model for anything on a
  safety, money or security path.
