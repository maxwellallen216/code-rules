# Managing rules directly

Read this when the skill was invoked on its own — `/code-rules`, or a request to add, update, or browse rules — not because a coding task needs `rules/` applied. If the request already names the goal precisely enough to act on ("add a rule that constants are UPPER_SNAKE_CASE"), skip the menu and go straight to the matching flow below.

## Menu

Show this if the request doesn't already say which of these the user wants:

1. Add or update a rule
2. Use a preset
3. Browse the current rules
4. Something else — describe it

Wait for a choice.

## 1 — Add or update a rule

- **Updating**: find the existing file (list `rules/` if the user didn't name it), read it.
- **Adding**: confirm the target — `rules/global/` or `rules/<language>/` — from what the user says; ask if it's genuinely unclear whether the rule is global or language-specific.

Ask for a brief description of what the rule should do, if they haven't already given one. Then decide: is this specific enough to write a complete, checkable rule — a `rule` sentence with its reason, and a `check_before_finishing` test you could actually run against output? If yes, draft it. If not, see "When to ask" below.

Draft the file in full (frontmatter per `rules/_TEMPLATE.md`, body as a flat list of checkable instructions, under ~40 lines), show it, and get a yes before writing. A new rule is a durable policy change; don't write it on a guess.

## 2 — Use a preset

List `presets/global/` and `presets/<language>/` if the user didn't name one. Once they have:

- Ask: modify it before adding, yes or no?
- **No** — copy the file as-is into the matching `rules/` folder.
- **Yes** — same flow as "Add or update a rule" above, using the preset's current content as the starting draft. The result is saved into `rules/` as a new file.

Either way, copy — never move. The preset stays in `presets/` so it's still there for the next project.

## 3 — Browse

List every file under `rules/global/` and `rules/<language>/` with its `name` and one-line summary of `rule`. Don't read full bodies unless asked about a specific one.

## When to ask

Ask follow-up questions only when the description genuinely can't be turned into a checkable rule yet — no clear scope (global vs. which language), no way to verify compliance, or it conflicts with an existing rule without saying which should win. Don't ask when the request is already concrete.

When you do ask, batch every open question into one message, and attach a concrete suggested answer to each so a one-word reply unblocks you — same principle as approvals in `SKILL.md`. Don't interrogate one question at a time.
