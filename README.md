# personal-extensions

One pi package that carries my whole setup to any machine: skills, extensions,
and always-on working rules.

- Install: `pi install git:github.com/<you>/personal-extensions@v1`
- Local dev on this checkout: `npm install && pi install /path/to/personal-extensions`
- Test: `node test.mjs`

---

## How it works

### 1. `settings.json` points at one package

`~/.pi/agent/settings.json` contains a single entry:

```json
"packages": ["/path/to/personal-extensions"]
```

On startup pi reads that package and loads every resource it declares. Nothing
else has to be installed per machine. Use `-l` on `pi install` to write to a
project's `.pi/settings.json` instead of the global one.

### 2. `package.json` declares what loads

```json
"pi": {
  "extensions": ["extensions", "node_modules/pi-caveman/extensions/caveman.ts", ...],
  "skills": ["skills", "node_modules/@dietrichgebert/ponytail/skills"]
}
```

Two things matter here:

- **The manifest wins.** Because a `pi` block exists, pi loads *only* the listed
  paths. Convention directories (`extensions/`, `skills/`, `prompts/`,
  `themes/`) are auto-discovered only when there is no manifest. So a new
  `prompts/` or `themes/` directory in this repo does nothing until it is added
  to the manifest.
- **Third-party packages are re-exported through `node_modules/`.** They are
  normal npm/git dependencies. `pi install` runs `npm install` after cloning, so
  a fresh machine gets them automatically. Every dependency's own `pi` manifest
  is ignored — the path listed here is what loads, which is why each entry
  points at that package's real extension file.

`.npmrc` sets `legacy-peer-deps=true`. Without it npm auto-installs the
`@earendil-works/pi-coding-agent` peer dep (~450 MB copy of pi itself) that pi
already provides at runtime.

### 3. `extensions/rules.ts` injects the rules

Pi loads `AGENTS.md` from the *project* you are working in; it has no notion of
a global one. So the rules ride along as an extension instead:

```ts
pi.on("before_agent_start", async (event) => ({
  systemPrompt: `${event.systemPrompt}\n\n${buildRules(event.systemPromptOptions.cwd)}`,
}));
```

`before_agent_start` fires after every prompt submission and before the agent
loop, so the rules are appended to the system prompt on every turn. Handlers
chain, so other extensions' system-prompt edits are preserved.

`buildRules(cwd)` decides which files to append:

| File | Condition |
|---|---|
| `rules/style.md` | always |
| `rules/beads.md` | `br` or `bd` on PATH **and** `<cwd>/.beads/` exists |
| `rules/treehouse.md` | `treehouse` on PATH |

PATH is probed once at load, so install `br`/`treehouse` then restart pi.

---

## Scenarios

### Add one of my own skills

```bash
mkdir -p skills/my-skill
$EDITOR skills/my-skill/SKILL.md   # frontmatter: name + description
```

No manifest change needed — `skills` is already listed and is scanned
recursively for `SKILL.md`. Restart pi.

The `description` is what the model sees in every prompt; make it say *when* to
use the skill. Only the description stays in context — the body loads on demand.

### Add or remove a third-party package

`scripts/pkg.sh` does the npm install and the manifest wiring in one step:

```bash
scripts/pkg.sh add pi-whatever                  # npm
scripts/pkg.sh add github:owner/repo#v1.2.3     # git-only, pinned tag
scripts/pkg.sh remove pi-whatever
scripts/pkg.sh check                            # manifest paths vs node_modules
```

`add` reads the dependency's own `pi` block (or falls back to its convention
directories), prefixes each path with `node_modules/<name>/`, and appends it to
the matching key in our manifest. It prints every path it wired. Then commit
`package.json` + `package-lock.json` and restart pi.

Two cases it handles on purpose:

- **A package whose extension self-registers skills** (via a `resources_discover`
  hook) gets its `skills` path skipped — listing it here too makes every skill
  collide with itself. Superpowers is *not* loaded that way: its extension is
  omitted (it bootstraps `using-superpowers` into every session) and only the
  kept skill folders are listed in the manifest. Excluded: `dispatching-parallel-agents`,
  `executing-plans`, `finishing-a-development-branch`, `subagent-driven-development`,
  `using-git-worktrees`, `using-superpowers`.
- **A path the dependency declares but does not ship** is skipped instead of
  wired, so `check` stays green.

Do it by hand only when a package needs a partial path (one file out of its
`extensions/` dir, say) — edit the manifest and keep the npm dependency.

Pinning matters for git specs: `#v1.2.3` is what keeps three machines identical.

Temporary disable without editing anything: `pi config` (Tab switches global /
project scope) toggles individual extensions, skills, prompts, and themes off.

### Edit my rules

`rules/style.md` — pure text, injected verbatim. Keep it short: it is in the
system prompt on every single turn of every session, on every machine. Anything
long, situational, or task-specific belongs in a skill instead (loaded on
demand) or in a project's own `AGENTS.md`.

### Add a new conditional rule file

1. Write `rules/foo.md`.
2. Add one line to `buildRules` in `extensions/rules.ts`:

```ts
if (existsSync(join(cwd, "foo.config"))) parts.push(rule("foo.md"));
// or: if (onPath("foo")) ...   — see hasTreehouse / hasBr
```

3. `node test.mjs`.

The gate is worth it: a rule for a tool that is not installed, or a repo that
does not use it, is pure prompt noise.

### Add prompt templates or themes

```bash
mkdir prompts   # .md files -> /slash commands
mkdir themes    # .json files
```

Then add them to the manifest (the manifest wins — see above):

```json
"prompts": ["prompts"],
"themes":  ["themes"]
```

### Project-only resources

Anything that belongs to one repo, not to me, stays out of this package: put it
in that repo's `.pi/extensions/`, `.pi/skills/`, or `AGENTS.md`. This package is
for what should follow me to every machine.

---

## Per-machine workflow

Edit on any machine, then:

```bash
node test.mjs
git add -A && git commit -m "..." && git tag v2 && git push --follow-tags
```

On the other machines:

```bash
pi install git:github.com/<you>/personal-extensions@v2   # move the pinned ref
```

Git refs are pinned deliberately — `pi update --extensions` reconciles the
clone to the *configured* ref, it does not jump to a newer tag. Re-running
`pi install` with a new ref is the update.

The machine where this repo is a working checkout can keep the local-path entry
in `settings.json` instead; `git pull` there is the whole update.

---

## Troubleshooting

**`[Skill conflicts] "x" collision`** — the same skill name is reachable from
two places. Pi also scans `~/.pi/agent/skills/` and `~/.agents/skills/`. Keep
exactly one copy; this repo should be the one that wins, so delete the loose
copy in the home directories.

**A change did nothing** — either pi was not restarted, or the resource is not
in the manifest, or it is disabled in `pi config`.

**`npm install` pulled hundreds of MB** — `.npmrc` with `legacy-peer-deps=true`
is missing.

**Rules missing from a session** — check the gate: `br`/`treehouse` on PATH,
`.beads/` in cwd. Verify what actually gets injected:

```bash
pi -ne -ns -e . --no-session -p "Quote the headings of the personal rules in your system prompt."
```

---

## Contents

| Path | What |
|---|---|
| `package.json` | Manifest: what pi loads; dependency pins for bundled packages |
| `.npmrc` | `legacy-peer-deps=true` |
| `extensions/rules.ts` | Appends `rules/*.md` to the system prompt every turn |
| `rules/style.md` | Always injected |
| `rules/beads.md` | `br`/`bd` issue-tracker workflow, gated |
| `rules/treehouse.md` | Pooled worktree rules, gated |
| `skills/` | My own skills (`find-skills`) |
| `scripts/pkg.sh` | `add` / `remove` / `check` a bundled package |
| `test.mjs` | Asserts the conditional injection |

Bundled: ponytail, caveman, pi-web-access, pi-multimodal-proxy,
rpiv-ask-user-question, superpowers, pi-mcp-adapter, pi-codex-image-gen.
