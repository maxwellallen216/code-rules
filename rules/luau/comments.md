---
name: Comments — Luau
applies: >-
  whenever you write or edit `.luau` or `.lua` files
rule: >-
  Luau's mode directives are not comments, and Moonwave is the documentation
  format wherever the codebase already uses it.
check_before_finishing: >-
  No `--!` directive was removed or counted as a comment, and public methods
  carry Moonwave blocks if the surrounding files do.
---

- **Not comments** — `--!strict`, `--!nonstrict`, `--!native`, `--!nolint` and similar directives. They don't count against any comment limit and are never removed as stray commentary.
- **Doc-comment format** — if the codebase documents public API with Moonwave (`--[=[ @within ]=]`), match it for public methods instead of a plain `--` line. Its length is set by the format, not by the 2-line limit.
