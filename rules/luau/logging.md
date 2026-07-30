---
name: Logging — Luau
applies: >-
  whenever you create or modify first-party `.luau` or `.lua` files
rule: >-
  Use two deliberate logging classes: Studio-only debug diagnostics and sparse,
  actionable production logs at Information, Warning, or Error level. Add a log
  only when it materially improves testing or diagnosis; silence is preferable
  to routine noise.
ask_first_when: >-
  Creating a centralized logging module, changing the project's logging API or
  production log format, or adding an external telemetry sink when the current
  task did not already authorize that architecture work.
check_before_finishing: >-
  Every debug log is unreachable unless `RunService:IsStudio()` is true; every
  production log is actionable, safe for live output, emitted once by the
  owning boundary, and absent from hot or routine success paths.
---

- Treat Debug/Trace output as temporary diagnostic detail. Gate it inside the centralized logger or at the call site with `RunService:IsStudio()` before constructing expensive or sensitive arguments; a runtime flag alone is insufficient.
- Treat Information, Warning, and Error output as production-grade. It may run in live servers or clients, so give it a stable event or operation name, a concise outcome or reason, and only the identifiers needed to investigate.
- Require a production Warning or Error for an unexpected recoverable failure that would otherwise be silent. Preserve the original return, retry, cancellation, or throw behavior; logging is observability, not error handling.
- Use Information sparingly for significant lifecycle or state transitions. Do not log routine successes, ticks, per-frame work, movement steps, combat hits, polling, or other high-frequency events; aggregate, sample, or summarize when such visibility is genuinely needed.
- Log an event once at its authoritative owner. Prefer the server for authoritative gameplay, economy, persistence, remote validation, and battle outcomes; use client production logs only for client-owned presentation or input failures.
- Never log secrets, purchase or session tokens, full profiles, full remote payloads, chat text, or other unnecessary player data. Prefer stable IDs and bounded scalar context over names, Instances, or serialized tables.
- Reuse the project's centralized logger when one exists instead of scattering `print`/`warn` calls or local wrappers. If multiple modules need levels, formatting, or sinks and no logger exists, propose one minimal first-party module whose Debug entry point enforces the Studio gate.
- Do not keep a debug log merely because it helped during implementation. Retain it only when it will materially shorten future Studio diagnosis; otherwise remove it before finishing.
