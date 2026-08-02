# Managing rules directly

Read this when the skill was invoked on its own — `/code-rules`, or a request to add, update, or browse rules — not because a coding task needs the rules applied. If the request already names the goal precisely ("add a rule that constants are UPPER_SNAKE_CASE"), skip the menu and go to that flow.

Two locations matter. `<repo>/.code-rules/` holds the rules in force for this project — everything below writes here. `library/`, beside `SKILL.md`, is the catalog they're seeded from; it is never enforced directly.

## Menu

Show this if the request doesn't already say which:

1. Set up rules for this project
2. Add or update a rule
3. Add from the catalog
4. Pull catalog updates
5. Browse the current rules
6. Something else — describe it

Wait for a choice.

## 1 — Set up this project

Create `.code-rules/` at the repo root. Copy every `library/global/` file whose frontmatter has `seed: true`, then, for each language present in the repo with a matching `library/<language>/` folder, copy its `seed: true` files too. Regenerate `INDEX.md` — one line per rule with its path, `name`, and `applies`.

Report the folders created and the file count. Don't copy `seed: false` files; those are menu item 3.

If the hook isn't installed, offer it here: `node scripts/install-hooks.mjs --check`, then `--codex` or `--claude`.

## 2 — Add or update a rule

- **Updating**: find the file in `.code-rules/` (list it if the user didn't name one), read it.
- **Adding**: confirm the target — `.code-rules/global/` or `.code-rules/<language>/`. Ask only if it's genuinely unclear whether the rule is global or language-specific.

Ask for a brief description if they haven't given one. Then judge: is this specific enough to write a complete, checkable rule — a `rule` sentence with its reason, and a `check_before_finishing` you could actually run against output? If yes, draft it. If not, see "When to ask".

Draft the file in full (frontmatter per `library/_TEMPLATE.md`, body a flat list of checkable instructions, under ~40 lines), show it, and get a yes before writing. A new rule is a durable policy change; don't write it on a guess.

Ask whether to also save it to `library/` so other projects can seed it.

## 3 — Add from the catalog

List `library/global/` and `library/<language>/`, marking which files are already in `.code-rules/` and which are `seed: false` (catalog-only). Once the user picks:

- Ask: modify it before adding, yes or no?
- **No** — copy the file into the matching `.code-rules/` folder as-is.
- **Yes** — the flow in item 2, using the catalog file as the starting draft.

Copy, never move. The catalog file stays for the next project.

## 4 — Pull catalog updates

Compare each `.code-rules/` file against its `library/` counterpart. Report three groups: identical, locally modified, and changed in the catalog. Show a diff for anything in the last two and ask per file before overwriting — a local edit is a deliberate project decision, so never clobber it silently.

## 5 — Browse

List every file under `.code-rules/global/` and `.code-rules/<language>/` with its `name` and a one-line summary of `rule`. Don't read full bodies unless asked about a specific one.

## When to ask

Ask follow-ups only when the description genuinely can't be turned into a checkable rule yet — no clear scope (global vs. which language), no way to verify compliance, or it conflicts with an existing rule without saying which wins. Don't ask when the request is already concrete.

When you do ask, batch every open question into one message and attach a suggested answer to each so a one-word reply unblocks you. Don't interrogate one question at a time.

## After writing

Regenerate `.code-rules/INDEX.md` so the routing table matches the files. The hook does this automatically when it's installed; do it by hand when it isn't.
