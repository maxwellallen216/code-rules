# Style consistency
 
**Applies:** whenever you create or modify files in an existing codebase.
 
**Rule:** match the surrounding code. The user's conventions beat general best practice, including yours. New code should be indistinguishable from the code already there.
 
**Before writing**, read 2–4 of the closest relevant files you haven't already read this session:
 
- files in the same directory
- files of the same kind (module, service, controller, test)
- files the target imports, or that import the target
Skip files you authored earlier in this session — they show your habits, not the user's. Human-written files are the reference.
 
**Sample what's observable**, then copy it:
 
- naming: casing and prefixes for files, functions, locals, constants, private members
- indentation, quote style, line length, blank-line rhythm
- how dependencies are imported and where those lines sit
- module or class shape: factory, constructor, singleton, plain namespace
- typing conventions and how thoroughly they're applied
- error handling: raise, return, wrap, log, ignore
- resource cleanup and lifecycle patterns
- section order within a file
- import path style: relative, absolute, aliased
Reuse existing helpers and utilities instead of writing new equivalents.
 
**Don't** refactor, rename, reformat, or modernize code you weren't asked to change. A style improvement is its own task with its own approval.
 
**When the codebase disagrees with itself:** if the files you sampled show no consistent pattern for a decision you have to make, ask once. Name the competing patterns and the files you saw them in, propose which to standardize on, and ask whether to apply it beyond the current task. Then follow the answer. Don't guess, and don't quietly normalize files outside the task.
 
**Check before finishing:** a reader of the diff shouldn't be able to tell which lines an AI wrote.