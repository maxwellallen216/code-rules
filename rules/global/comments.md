---
name: Comments
applies: >-
  whenever you write or edit code
rule: >-
  Two kinds of comment are allowed without asking; everything else needs
  approval first. Unrequested commentary is noise the user has to read,
  review, and keep true.
ask_first_when: >-
  Adding an inline comment, section divider, TODO/NOTE/HACK banner, a comment
  on a private function, or anything longer than the limits above. Propose it
  in one line and wait — don't write it and offer to remove it.
check_before_finishing: >-
  Every comment you added is either the file summary, a public API comment
  within its limit, or explicitly approved. Delete the rest. No type, field,
  or member declaration you added carries a comment a reader could have got
  from its name.
---

- **File summary** — one block at the top, 1–8 lines, covering what the file is and why it exists.
- **Public API comment** — up to 2 lines above a public function, method, or class. Public means exported, or called from another file; private helpers get nothing. These are permitted, not required: skip them where the surrounding files skip theirs (constructors usually go uncommented).
- **Types get nothing** — type aliases, interfaces, enums, and the individual fields inside them go uncommented, even when exported. A named type next to its shape is already the documentation; restating it is the most common form of comment noise and the fastest to rot. Write the clarifying detail into the name (`ExpiresAtUnix`, not `ExpiresAt` plus a comment) before reaching for a comment. The only exception is genuine ambiguity the declaration cannot carry on its own — a non-obvious unit or encoding, a legal value range, a cross-field invariant, or a declaration whose unusual form would otherwise be "corrected" into a bug. When one of those applies, one line, stating only the ambiguity.
- **Timing** — write comments only after the code is implemented and working, as a separate final pass over the finished file. A summary written before or during implementation describes what you intended, not what shipped.
- **Not comments** — compiler and tooling directives (pragmas, mode markers, lint suppressions, type-checker hints), and whatever documentation-comment format the codebase already uses (docstrings, JSDoc, doc comments). If the codebase documents its public API with such a format, use that format instead of a plain comment line and let the format set the length; the language folder names the specific ones.
- **Existing comments** — leave human-written comments alone; don't delete, reword, or reformat them to fit this rule. One exception: if your edit makes an existing comment wrong, correct it and say so. Still true but no longer complete is not wrong — leave it.
