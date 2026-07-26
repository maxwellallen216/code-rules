# Style — Luau
 
Extends `global/style-consistency.md`. Sample these alongside the neutral dimensions:
 
- `--!strict` / `--!nonstrict` usage and how thoroughly annotations are applied
- service acquisition: position and ordering of the `game:GetService` block
- require style: `ReplicatedStorage.Shared.X`, relative `script.Parent`, Rojo or Wally aliases
- module shape: plain table return, `__index` class with `.new`, singleton, Knit service or controller
- exported types: `export type X = typeof(setmetatable({} :: Fields, X))` versus explicit interfaces
- private marker: `_` prefix on methods and fields
- error handling: `assert` for programmer error, `warn` versus `error`, `pcall` wrapping, Promise usage
- string building: backtick interpolation, `string.format`, or `..`
- events and cleanup: where connections are stored, Janitor / Trove / Maid, `task.spawn` versus `coroutine`
**Client/server boundary:** don't move logic across it without saying so, and go through the codebase's existing remote wrapper rather than calling remotes directly.