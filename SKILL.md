---
name: code-rules
description: MANDATORY PRE-WORK GATE for any task that may create, modify, delete, move, generate, format, refactor, or fix source files. Load before the first action and enforce every applicable rule in the project's .code-rules/ folder — including one-line edits, subtasks, resumed work, and requests that never mention rules or style. Skip only when the request cannot change source files, such as explanation-only or read-only diagnosis.
license: MIT
compatibility: Any agent that can read repository files. Hooks are optional hardening for Claude Code and Codex.
allowed-tools: Read Glob Write Edit Bash
---

# Code Rules

The user has written down how they want code produced. Those rules override your defaults.

## Where the rules are

`<repo>/.code-rules/` holds the rules in force — the only place you read rules from. `global/` applies to every task; `<language>/` applies only when you touch that language. `INDEX.md` there is an inventory that routes you to files, not a replacement for them.

`library/`, beside this file, is the catalog they're seeded from. Never enforce it directly.

Missing `.code-rules/`? Create it: copy each `library/global/` file marked `seed: true`, plus each `library/<language>/` matching a language in the repo. Say so in one line.

## Gate

1. Before your first action, decide whether the request can change source files. If yes, load rules now — before planning, running commands, or editing.
2. Read **every** `.md` in `.code-rules/global/` and in the folder for each language you'll touch. Skip `_`-prefixed files. Map extensions yourself: `.luau`/`.lua` → `luau`, `.tsx` → `typescript`. Two languages, two folders.
3. Track what you loaded: each rule's pre-work, `ask_first_when` gates, and `check_before_finishing` test. Don't rely on memory, a summary, or `AGENTS.md`.
4. Re-run this gate when scope reaches a new language, and after any context loss — compaction, resume, handoff.
5. Before delegating source work, require the subagent to load the rules itself, and audit what it returns.
6. Don't edit until pre-work is done. Don't report completion until every `check_before_finishing` passes against the finished diff.

If a rule file can't be read, name the path and stop. If work started before this gate ran, stop, load the rules, fix everything already done, and say the gate was missed.

## Edge cases

- **Unrecognized folder** (`typscript`) — don't apply it, don't ignore it. Name it, guess the intent, ask. A typo that silently disables rules is the worst outcome.
- **No folder for your language** — apply `global/` alone, say so once, offer to scaffold from `library/_TEMPLATE.md`.
- **A language you don't know well** — say so before writing. `global/` still applies; matching patterns needs no fluency, idiom does. Ask for reference files, flag lines you can't vouch for.
- **Loose `.md` in `.code-rules/`** — loads nowhere. Point it out; it probably belongs in `global/`.

## Applying

Frontmatter gives `name`, `applies`, `rule`, optional `ask_first_when`, `check_before_finishing`. The body is a flat list of checkable instructions.

- Pre-work rules (style sampling, file surveys) run **before** you write.
- Post-work rules (comments, cleanup) run **after** the code works.
- Run every `check_before_finishing` before reporting done. Delegate this to the `rule-auditor` subagent on a large diff.
- When `ask_first_when` fires: ask once, batch all open questions into one message, propose a default so a one-word reply unblocks you, and keep working on the rest. Never take the gated action and apologize after.

Don't narrate compliance. Mention a rule only for approval, deviation, or when asked.

## Precedence

Task instructions > `.code-rules/` > your defaults. Where no rule speaks, follow the surrounding code. If two rules conflict, take the more conservative one — write less, ask more — and flag it once. These rules govern process and style, not architecture or language choice.

## Enforcement

A hook blocks edits until the applicable rules are read. If `.code-rules/` exists but no index arrived at session start, the hook is inactive — offer `node scripts/install-hooks.mjs --check`, then install for the current agent. `CODE_RULES_GATE=off` disables it.

## Managing rules

Invoked on its own — `/code-rules`, or a request to add, update, or browse rules — read `references/manage-rules.md` and follow that instead.
