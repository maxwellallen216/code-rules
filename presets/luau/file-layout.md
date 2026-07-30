---
name: File layout — Luau
applies: >-
  whenever you create or modify `.luau` or `.lua` files in a Rojo project with
  a shared `src/Shared/Types/Types.luau` module. Assumes that path; adjust it
  before activating this preset if the project's shared-types module lives
  somewhere else.
rule: >-
  Top-level declarations sit under named banner comments in a fixed order,
  use `const` whenever their bindings must not change, and close with a divider
  before the file's logic. This overrides the global ban on section dividers:
  in Luau these banners are structure, not commentary, and they make the
  dependency surface and mutation intent visible without scrolling.
check_before_finishing: >-
  Every banner emitted has at least one declaration under it, and exactly one
  divider sits between the last declaration and the first line of logic. Any
  type you added to `src/Shared/Types/Types.luau` has a second consumer; if it
  does not, it belongs under the owning script's own `-- Types --` banner.
  Every object-style ModuleScript created or modified exports its complete
  public object type; every other `export type` sits in
  `src/Shared/Types/Types.luau`. Every top-level value binding uses `const`
  unless that binding is intentionally reassigned after initialization.
---

- **Order** — `-- Services --`, `-- Modules --`, `-- Constants --`, `-- Types --`. Never reorder them; a fixed order is what makes the region scannable.
- **Contents** — Services: `game:GetService` calls. Modules: `require` calls. Constants: top-level `const UPPER_SNAKE` values. Types: `type` and `export type` declarations.
- **Top-level bindings are immutable by default** — use `const` instead of `local` for every top-level value binding that is not intentionally reassigned, including services, imports, configuration values, lookup tables, module/object tables, registries, and stable instances. Keep `local` only when the binding itself must point to a different value during the script's lifetime. `const` protects the binding, not a referenced table or Instance's contents; use `table.freeze` separately when a table itself must be immutable.
- **Types is for local types too** — this group is the normal home for a script's own types, not just aliases of shared ones. A type used in exactly one script belongs under that script's `-- Types --` banner as a plain `type`, even when it is a big table shape. `src/Shared/Types/Types.luau` is for cross-file vocabulary; parking a single-consumer type there buys nothing and costs a require, an indirection, and a second place to edit when the shape changes. Moving one back out is a normal cleanup, not a refactor.
- **`export` is for shared vocabulary and object-module definitions** — types used by multiple scripts live in `src/Shared/Types/Types.luau`. The only exception is an object-style ModuleScript: every class, service, controller, or stateful singleton you create or modify exports one public object type, normally named after the module, that includes every public field and method. This keeps the implementation and its C#-interface-like contract together. Keep private fields and helpers in a separate local implementation type. Plain data, configuration, and function-library modules do not need an object type. Any other type declared outside `src/Shared/Types/Types.luau` stays local; when it gains a second consumer, move it into the shared type module and alias it back (`type X = Types.X`).
- **Empty groups** — omit the banner entirely. Never emit one as a placeholder over nothing; a banner's presence is the signal that the group is non-empty.
- **Divider** — `--////////////////////--`, exactly 20 slashes, between the last declaration and the first line of logic. Omit it only when the file has no logic below its declarations, as in a types-only module.
- **Below the divider** — everything else: the module table (`const M = {}`), module-level state, and every function. These are logic even when written as `const` or `local`, so they never go in Constants.
- **Spacing** — exactly one blank line after each banner and before the next banner, and the same around the divider.
- **Placement** — banners start after the file summary block. The summary itself stays a plain `--[[ ]]` block and gets no banner.
- **Generated files are exempt** — Blink's `Network.luau` and `NetworkTypes.luau` are regenerated from `network.blink`, so their banners, layout, and `export type` lines are the generator's business. Never hand-edit them to satisfy this rule; the edit is lost on the next build. Skip this bullet entirely if the project doesn't use Blink.
- **Reordering** — moving an existing declaration into its group is part of applying this rule, but say so when it changes the order in which values initialize.
