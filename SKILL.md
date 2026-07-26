---
name: code-rules
description: Applies the user's own coding rules — comment discipline, matching existing codebase style, and any custom rules in this skill's rules/ folder — to code they are writing, editing, refactoring, or reviewing. Rules are organized as rules/global/ plus one folder per language (rules/luau/, rules/typescript/, and so on). Use this skill for any task that creates or modifies source files in a repository, even a one-line edit or a single new function, and even when the user never mentions rules, standards, style, or comments. Skip it for questions about code that change no files, such as explaining a snippet or reading a stack trace.
---

# Code Rules

The user has written down how they want code produced. Those rules live in `rules/` and override your defaults.

## 1. Resolve which rules apply

`rules/global/` applies to every task. `rules/<language>/` applies only when you touch that language.

Map the files you are editing to folder names yourself — `.tsx` to `typescript`, `.luau` and `.lua` to `luau`. A task spanning two languages loads both folders. Read every `.md` in each applicable folder except files starting with `_`.

Read them fresh each task. The user adds, edits, and deletes rule files freely, so a rule you remember from an earlier session may be gone or changed. Rule files are deliberately short, so this stays cheap — and a Python task never pays for the Luau rules.

## 2. Name the edge cases instead of guessing

| Situation | What to do |
| --- | --- |
| A folder name you don't recognize as a language (`luao`, `typscript`) | Don't apply it and don't ignore it. Say the folder exists, name your best guess at the intent, ask. A typo that silently disables the user's rules is the worst outcome available. |
| No folder for the language you're editing | Apply `global/` alone, say so once, offer to scaffold `rules/<language>/` from `rules/_TEMPLATE.md`. |
| A real language you don't know well — niche DSL, in-house language, released after your training | Say so before you write. `global/` still applies: copying observable patterns doesn't require fluency, but idiom and correctness do. Ask for reference files or a style guide, and flag the specific lines you're unsure of rather than presenting a guess as finished work. "I matched your formatting but can't vouch that this is idiomatic" is worth more than a confident wrong answer. |
| Loose `.md` files sitting directly in `rules/` | They load nowhere. Point them out — they probably belong in `global/`. |

## 3. Apply them

Each rule file states when it applies, what it requires, and one check to run against your own output.

- Rules with pre-work (style sampling, file surveys) run **before** you write code.
- Rules with post-work (commenting, cleanup) run **after** the code is written and working.
- Before you report the task done, run each rule's check.

Don't narrate compliance. Mention a rule only when you need approval, when you deviated, or when the user asks.

## 4. Approvals

Rules gate certain actions behind user approval. When you hit one:

- Ask once, batching every open question into a single message.
- Propose a concrete default so a one-word answer unblocks you.
- Keep working on the parts that don't depend on the answer.

Never take the gated action and apologize afterward. These rules exist so the user, not the agent, owns style decisions in their codebase.

## Precedence

Instructions in the current task > `rules/` > your own defaults. Language rules extend global rules; where they overlap, the language rule is more specific and wins. If two rules genuinely conflict, take the more conservative action — the one that writes less and asks more — and flag it once.

## Scope

These rules govern process and style, not language choice or architecture. Where no rule speaks, follow the surrounding codebase.

To add a rule, copy `rules/_TEMPLATE.md` into `rules/global/` or a language folder. To support a new language, create `rules/<language>/`.