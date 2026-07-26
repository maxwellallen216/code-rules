# code-rules

A portable Agent Skill that makes AI coding agents write code the way _you_ write code.

The skill itself is thin. All the opinions live in `rules/` — one markdown file per rule. Add a file to add a rule, delete it to remove one, add a folder to support a language. `SKILL.md` never needs editing.

```
code-rules/
├── SKILL.md                     # loader + workflow (the only file the agent needs to find)
├── README.md                    # this file — not read at runtime
└── rules/
    ├── _TEMPLATE.md             # copy this to add a rule (leading _ = ignored)
    ├── global/                  # loaded on every task
    │   ├── comments.md
    │   └── style-consistency.md
    └── luau/                    # loaded only when .luau or .lua is in play
        ├── comments.md
        └── style.md
```

Only the folders a task needs get loaded, so a Python task never pays for the Luau rules. Anything left loose in `rules/` loads nowhere — the agent will point that out rather than let a misplaced file silently do nothing.

## Install

Copy the whole `code-rules/` folder into the right location for your tool:

| Tool                           | Location                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Claude Code (project)          | `.claude/skills/code-rules/`                                                                |
| Claude Code (personal)         | `~/.claude/skills/code-rules/`                                                              |
| Codex                          | `$CODEX_HOME/skills/code-rules/` (default `~/.codex/skills/`) — restart Codex after changes |
| Tool-agnostic project skills   | `.agents/skills/code-rules/` or `.agent/skills/code-rules/`                                 |
| Claude.ai / Claude Desktop     | upload the packaged `.skill` file                                                           |
| Anything without skill support | point the agent's instructions file at `SKILL.md` (see below)                               |

For tools that only read a single instructions file — `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` — add one line to it:

```markdown
Before writing or editing code, read and follow .agents/skills/code-rules/SKILL.md.
```

`SKILL.md` uses no tool-specific syntax, so any agent that can read files and follow instructions can run it.

## Adding a rule

Copy `rules/_TEMPLATE.md` into `rules/global/` to apply it everywhere, or into `rules/<language>/` to apply it to one language. Keep it under ~40 lines — every applicable rule file is loaded on every task, so length is a running cost.

Rules work best when they're checkable. "Use descriptive names" is hard to verify; "constants are SCREAMING_SNAKE_CASE at the top of the file" is not.

## Adding a language

1. `mkdir rules/typescript` — the folder name is the canonical lowercase language name. The agent maps extensions itself; there's no manifest to maintain.
2. `cp rules/_TEMPLATE.md rules/typescript/style.md` and fill it in.
3. Write only what differs from `global/`. Language rules are deltas on top of the global ones, which always apply — that's why the Luau folder is short.

A misspelled folder (`typscript`) won't be applied silently. The agent names it, guesses what you meant, and asks.

## Unfamiliar languages

If you add a folder for a language the agent doesn't know well — a niche DSL, something in-house, something newer than its training — it will say so before writing rather than bluffing. The global rules still work: matching observable patterns in your files doesn't require fluency. Idiom and correctness do, so it will ask for reference files and flag the specific lines it isn't sure about.
