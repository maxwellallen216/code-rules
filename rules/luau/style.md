---
name: Style — Luau
applies: >-
  whenever you create or modify `.luau` or `.lua` files
rule: >-
  Sample these Luau-specific dimensions alongside the neutral ones, and treat
  the client/server split as fixed unless you say otherwise.
check_before_finishing: >-
  Requires, service acquisition, module shape, and cleanup match the files you
  sampled, and any logic that crossed the client/server boundary was called
  out.
---

- `--!strict` / `--!nonstrict` usage and how thoroughly annotations are applied
- service acquisition: position and ordering of the `game:GetService` block
- require style: `ReplicatedStorage.Shared.X`, relative `script.Parent`, Rojo or Wally aliases
- module shape: plain table return, `__index` class with `.new`, singleton, Knit service or controller
- exported types: `export type X = typeof(setmetatable({} :: Fields, X))` versus explicit interfaces
- private marker: `_` prefix on methods and fields
- error handling: `assert` for programmer error, `warn` versus `error`, `pcall` wrapping, Promise usage
- string building: backtick interpolation, `string.format`, or `..`
- events and cleanup: where connections are stored, Janitor / Trove / Maid, `task.spawn` versus `coroutine`
- **client/server boundary:** don't move logic across it without saying so, and go through the codebase's existing remote wrapper rather than calling remotes directly
