---
name: <rule name>
applies: >-
  <when this rule is in force — e.g. "whenever you edit code", "only for new
  files", "only in code review">
rule: >-
  <the requirement in 1–3 sentences, with the reason it matters>
ask_first_when: >-
  <cases needing user approval — delete this key entirely if the rule gates
  nothing>
check_before_finishing: >-
  <one concrete test to run against your own output>
---

<!--
Copy this file into rules/global/ (applies everywhere) or rules/<language>/
(applies only to that language) under a descriptive name. Delete a file to
deactivate its rule. Files starting with _ are ignored, as is anything left
loose directly in rules/.

Language files are deltas. Everything in global/ already applies, so write
only what differs for that language.

Everything below the frontmatter is the rule's details: a flat list of
specific, checkable instructions. No heading — `name` is the title, and
SKILL.md tells the agent the body holds the details.

Every frontmatter value uses a `>-` block scalar. Keep it that way: it makes
colons, em-dashes, backticks and leading `-` or `@` literal, so rule text
never has to be escaped or quoted. Only `ask_first_when` is optional — delete
the key rather than leaving it blank.

Keep the whole file under ~40 lines: every applicable rule file is loaded on
every task. Write imperatives, not prose. Give one short reason per
requirement — stating why raises compliance far more than adding emphasis
does. Make each detail something you can verify against your own output.
-->

- <specific, checkable instruction>
- <specific, checkable instruction>
