# code-rules

A portable [Agent Skill](https://agentskills.io) that makes AI coding agents write code the way _you_ write code. MIT licensed.

The skill is thin. All the opinions live in markdown rule files — one file per rule. Add a file to add a rule, delete it to remove one, add a folder to support a language. `SKILL.md` never needs editing.

## How it works

Rules live in **two** places, and the difference is the whole design:

| | What it is | Read by the agent? |
| --- | --- | --- |
| `<repo>/.code-rules/` | The rules in force for **this project** | Yes — this is the only source |
| `library/` (in the skill) | The **catalog** those are seeded from | Never enforced directly |

The first time an agent edits a source file in a repo, `.code-rules/` is created and seeded: `global/` plus a folder for each language the repo actually contains. A Roblox project gets `global/` and `luau/`. A Python project gets `global/` and `python/` — and never pays for the Luau rules, because they aren't there.

`.code-rules/` is meant to be committed. The rules travel with the repo, so teammates and other agents inherit them.

```
code-rules/
├── SKILL.md                  # loader + workflow — the only file an agent needs to find
├── library/                  # catalog, seeded into projects
│   ├── _TEMPLATE.md          # copy this to add a rule (leading _ = ignored)
│   ├── global/               # seeded into every project
│   └── luau/                 # seeded only into projects containing .luau or .lua
├── scripts/
│   ├── gate.mjs              # the enforcement hook (Claude Code + Codex)
│   ├── install-hooks.mjs     # registers the hook
│   └── languages.json        # extension → folder map
├── agents/rule-auditor.md    # subagent: audits a diff against the rules
├── hooks/                    # hook registration for both agents
└── references/manage-rules.md
```

## Enforcement

`SKILL.md` is a mandatory pre-work gate: the agent must load the applicable rules before its first action, reload after context loss, and run every rule's final check before claiming completion.

Prose alone doesn't stop a model that skips the gate, so a hook backs it:

- **Before the first edit** to a `.luau` file, the edit is **denied** until `.code-rules/global/` and `.code-rules/luau/` have been read. The denial names the exact paths.
- **At session start**, the rule index is injected directly into context — no tool call, no file read.
- **After compaction or resume**, read-state is cleared, so the rules must be read again.
- **Subagents** get their own read-state and cannot inherit the parent's compliance.
- **Editing a rule file** regenerates `INDEX.md`, so the routing table can't drift.

Costs nothing when the agent complies — the hook is silent on the happy path. Set `CODE_RULES_GATE=off` to disable it.

### Installing the hook

**Claude Code** — install as a plugin and `hooks/hooks.json` registers automatically. If you copied the skill into `~/.claude/skills/` instead, run `node scripts/install-hooks.mjs --claude`.

**Codex** — Codex plugins can't declare hooks, so this step is required:

```
node scripts/install-hooks.mjs --check     # what's registered where
node scripts/install-hooks.mjs --codex     # → ~/.codex/hooks.json
```

Add `--project` to write `<repo>/.codex/hooks.json` instead. Codex loads project hooks only from a trusted project, so that form also needs `trust_level = "trusted"` for the repo in `~/.codex/config.toml` — the installer prints the exact lines. Restart the agent afterwards.

The installer is idempotent, merges rather than overwrites, and `--uninstall` removes only its own entries.

## Install

```
npx skills add MaxwellAllen216/code-rules
```

Or copy the folder into the right location for your tool:

| Tool | Location |
| --- | --- |
| Claude Code (plugin — includes hooks + subagent) | `/plugin marketplace add MaxwellAllen216/code-rules` |
| Claude Code (skill only) | `.claude/skills/code-rules/` or `~/.claude/skills/code-rules/` |
| Codex | `$CODEX_HOME/skills/code-rules/` (default `~/.codex/skills/`) — restart Codex |
| Tool-agnostic project skills | `.agents/skills/code-rules/` or `.agent/skills/code-rules/` |
| Claude.ai / Claude Desktop | upload the packaged `.skill` file |
| Anything without skill support | point the agent's instructions file at `SKILL.md` |

For tools that read a single instructions file — `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` — add:

```markdown
For every request that may change source files, treat `.agents/skills/code-rules/SKILL.md` as a mandatory pre-work gate. Read it before the first task action, enforce every applicable rule in `.code-rules/`, reload after context loss or when scope expands, and do not edit or report completion unless all rule checks pass.
```

`SKILL.md` uses no tool-specific syntax, so any agent that can read files can run it. The hooks and the subagent are optional hardening.

## Managing rules

Invoke the skill directly — `/code-rules`, or just ask it to add, update, or browse rules — and it offers a menu instead of writing code: set up a project, add or update a rule, add from the catalog, pull catalog updates, or browse what's active. See `references/manage-rules.md`.

## Adding a rule

Copy `library/_TEMPLATE.md` into `library/global/` to offer it everywhere, or `library/<language>/` for one language. Keep it under ~40 lines — every applicable rule file is loaded on every task, so length is a running cost.

`seed: true` copies the file into a project automatically. `seed: false` keeps it catalog-only, added by hand or through the menu — useful for rules that assume a specific project layout.

Rules work best when they're checkable. "Use descriptive names" is hard to verify; "constants are SCREAMING_SNAKE_CASE at the top of the file" is not.

## Adding a language

1. `mkdir library/typescript` — the folder name is the canonical lowercase language name.
2. `cp library/_TEMPLATE.md library/typescript/style.md` and fill it in.
3. Write only what differs from `global/`. Language rules are deltas on top of the global ones, which always apply — that's why the Luau folder is short.

`scripts/languages.json` maps extensions to folder names. Extensions it doesn't list fall back to the extension itself, so add unusual ones there. A misspelled folder won't be applied silently — the agent names it, guesses what you meant, and asks.

## Unfamiliar languages

If you add a folder for a language the agent doesn't know well — a niche DSL, something in-house, something newer than its training — it will say so before writing rather than bluffing. The global rules still work: matching observable patterns in your files doesn't require fluency. Idiom and correctness do, so it will ask for reference files and flag the specific lines it isn't sure about.

## Requirements

Node.js for the hook and installer. The skill itself needs nothing beyond an agent that can read files.
