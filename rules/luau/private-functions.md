---
name: Private functions — Luau
applies: >-
  whenever you create or modify a first-party `.luau` or `.lua` ModuleScript
rule: >-
  Implement every function used only within its owning module as a local
  function, never as an underscore-prefixed module or object method. Group all
  private local functions before every module or object method so the public
  method section is uninterrupted.
check_before_finishing: >-
  In every modified first-party ModuleScript, no private function is attached
  to a module/object table, and all private local functions form one contiguous
  block before the first public, inherited, or lifecycle method.
---

- Replace `Module:_DoWork()` and `Module._DoWork(self)` with a lower-camel-case local function such as `doWork`.
- Place private local functions after the module's initial table/state setup and before its first module/object method. Never put one after or between methods.
- Pass the module/object as an explicit parameter when a private function needs its state.
- Exclude private local functions from exported public object types and public method maps.
- Leave vendored dependencies and generated files in their upstream/generated form; do not hand-edit them to satisfy this rule.
