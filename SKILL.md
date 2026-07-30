---
name: code-rules
description: Applies the user's coding rules — comments, style consistency, and any custom rules under this skill's rules/ folder (rules/global/ plus one folder per language) — to any task that creates or modifies source files, even a one-line edit, even when the user never mentions rules or style. Skip it for tasks that change no files, like explaining a snippet or reading a stack trace.
license: MIT
compatibility: Works with any agent that can read files from a repository. No tool-specific features used.
allowed-tools: Read Glob Write Edit
---

# Code Rules

The user has written down how they want code produced. Those rules live in `rules/`, beside this file, and override your defaults.

## 0. Managing rules directly

If the skill was invoked on its own — `/code-rules`, or a request to add, update, or browse rules or presets — rather than firing because a coding task needs `rules/` applied, this isn't the write-code flow below. Read `references/manage-rules.md` and follow it instead.

## 1. Load the rules that apply

`rules/global/` applies to every task. `rules/<language>/` applies only when you touch that language.

Map the files you're editing to folder names yourself — `.tsx` to `typescript`, `.luau` and `.lua` to `luau`. A task spanning two languages loads both folders. Read every `.md` in each applicable folder except those whose name starts with `_`. Never read from `presets/` — it's inert storage, not a rules folder; nothing there is in force until copied into `rules/`.

Global rules are never replaced. A language file is a delta on top of `global/`: it adds to what's already in force, and where the two overlap the language rule wins — it's more specific.

Read them fresh each task. The user adds, edits, and deletes rule files freely, so a rule you remember from an earlier session may be gone or changed.

## 2. Name the edge cases instead of guessing

- **A folder name you don't recognize as a language** (`luao`, `typscript`) — don't apply it and don't ignore it. Say the folder exists, name your best guess at the intent, ask. A typo that silently disables the user's rules is the worst outcome available.
- **No folder for the language you're editing** — apply `global/` alone, say so once, offer to scaffold `rules/<language>/` from `rules/_TEMPLATE.md`.
- **A real language you don't know well** — niche DSL, in-house, released after your training. Say so before you write. `global/` still applies: copying observable patterns needs no fluency; idiom and correctness do. Ask for reference files or a style guide, and flag the lines you're unsure of rather than presenting a guess as finished work — "I matched your formatting but can't vouch that this is idiomatic" beats a confident wrong answer.
- **Loose `.md` files sitting directly in `rules/`** — they load nowhere. Point them out; they probably belong in `global/`.

## 3. Apply them

Each rule file opens with a frontmatter block — `name`, `applies` (when the rule is in force), `rule` (the requirement and why), `ask_first_when` (present only when the rule gates an action), `check_before_finishing` (one test against your own output). Everything below the frontmatter is that rule's details: a flat list of specific instructions, each one checkable against your own output.

- Rules with pre-work (style sampling, file surveys) run **before** you write code.
- Rules with post-work (commenting, cleanup) run **after** the code is written and working.
- Before you report the task done, run the `check_before_finishing` test of every rule file you loaded.

Don't narrate compliance. Mention a rule only when you need approval, when you deviated, or when the user asks.

## 4. Approvals

Rules gate certain actions behind user approval; a rule's `ask_first_when` names them. When you hit one:

- Ask once, batching every open question into a single message.
- Propose a concrete default so a one-word answer unblocks you.
- Keep working on the parts that don't depend on the answer.

Never take the gated action and apologize afterward. These rules exist so the user, not the agent, owns style decisions in their codebase.

## Precedence and scope

Instructions in the current task > `rules/` > your own defaults. Where no rule speaks, follow the surrounding codebase. If two rules genuinely conflict, take the more conservative action — the one that writes less and asks more — and flag it once.

These rules govern process and style, not language choice or architecture.

To add a rule, copy `rules/_TEMPLATE.md` into `rules/global/` or a language folder. To support a new language, create `rules/<language>/`.
