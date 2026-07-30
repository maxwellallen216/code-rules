# Presets

A shelf, not a folder of rules. Nothing in `presets/` is ever read by the agent — `SKILL.md` only loads from `rules/`, and that instruction isn't scoped to search here. A preset does nothing until you copy it into `rules/global/` or `rules/<language>/`.

Use this to park rules you've written for one project so you can reuse them in the next one, instead of rewriting them from scratch each time a new repo needs the same rule.

## Layout

Mirrors `rules/`: `presets/global/` for rules meant to apply everywhere once activated, `presets/<language>/` for one language. Same file format as everything under `rules/` — copy `rules/_TEMPLATE.md` to start a new preset, same frontmatter contract (`name`, `applies`, `rule`, optional `ask_first_when`, `check_before_finishing`).

## Activating a preset

Copy — never move — the file from `presets/<x>/` into `rules/<x>/`. That's the entire mechanism; there's no registry or index to update. Copying keeps the preset on the shelf for the next project; moving would empty it after the first use.

## Keeping a preset in sync

If a rule started as a preset and you later tune it inside `rules/` for one project's needs, that copy has diverged — it's now a project-specific rule, not the shared preset. Decide deliberately whether to fold improvements back into `presets/`, or let the two drift.
