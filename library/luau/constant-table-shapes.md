---
name: Constant table shapes — Luau
seed: true
applies: >-
  whenever you create or modify a Luau constant whose value is a table
rule: >-
  Constant tables are arrays by default. Use a key-value table only when the
  keys or associated values are required by the behavior.
check_before_finishing: >-
  Every constant table is an array unless its keys or values are consumed.
  No boolean membership map remains where an array and `table.find` suffice.
---

- **Arrays first** — represent ordered values or a finite set as `{ "A", "B" }`.
- **Membership sets stay arrays** — use `table.find(VALUES, value) ~= nil`; do
  not encode membership as `{ A = true, B = true }` when the booleans are unused.
- **Key-value exception** — use named keys when callers consume distinct fields,
  map one identifier to meaningful data, or require keyed lookup for behavior.
- **Do not flatten records** — configuration records and objects whose field
  names carry meaning genuinely require key-value tables.
