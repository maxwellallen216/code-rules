#!/usr/bin/env node
/**
 * code-rules gate — one hook for Claude Code and Codex.
 *
 * Both agents deliver a JSON event on stdin and accept the same
 * `hookSpecificOutput` response, so a single script serves both. Registration
 * differs: Claude discovers hooks/hooks.json from the plugin, Codex needs
 * scripts/install-hooks.mjs to write ~/.codex/hooks.json or <repo>/.codex/hooks.json.
 *
 * Events handled:
 *   SessionStart / PostCompact  clear read state, inject the routing index
 *   PreToolUse  (edit tools)    seed .code-rules/, deny until rules are read
 *   PostToolUse (read tools)    record which rule files were read
 *   PostToolUse (edit tools)    regenerate .code-rules/INDEX.md
 *
 * Fails open: any unexpected condition allows the tool call rather than
 * wedging the session. Set CODE_RULES_GATE=off to disable entirely.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIBRARY = path.join(SKILL_ROOT, "library");
const RULES_DIR = ".code-rules";
const STATE_DIR = path.join(os.tmpdir(), "code-rules-gate");

const EDIT_TOOLS = /^(Edit|Write|MultiEdit|NotebookEdit|apply_patch|edit_file|write_file|str_replace_editor)$/i;
const READ_TOOLS = /^(Read|View|read_file|view_file)$/i;
const SHELL_TOOLS = /^(Bash|shell|PowerShell|exec|local_shell)$/i;
const SHELL_READ = /\b(cat|type|head|tail|less|more|bat|Get-Content)\b/;

let LANGUAGES = { map: {}, ignore: [], ignorePathParts: [] };
try {
  LANGUAGES = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "scripts", "languages.json"), "utf8"));
} catch {}

/* ---------------------------------------------------------------- helpers */

const key = (p) => (process.platform === "win32" ? path.resolve(p).toLowerCase() : path.resolve(p));

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function emit(event, fields) {
  // writeSync, not process.stdout.write — process.exit can truncate a piped async write.
  try {
    fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: event, ...fields } }));
  } catch {}
}

function deny(event, reason) {
  emit(event, { permissionDecision: "deny", permissionDecisionReason: reason });
  process.exit(0);
}

function allow() {
  process.exit(0);
}

/** Minimal frontmatter reader — handles `key: value` and `key: >-` block scalars. */
function frontmatter(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return {};
  }
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const [, name, rest] = kv;
    if (rest === ">-" || rest === ">" || rest === "|" || rest === "|-") {
      const buf = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) buf.push(lines[++i].trim());
      out[name] = buf.join(" ");
    } else {
      out[name] = rest.trim();
    }
  }
  return out;
}

/** Rule files in a folder: every .md except _-prefixed. */
function ruleFiles(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
      .sort()
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

function walkUp(from, test) {
  let dir = path.resolve(from);
  for (;;) {
    if (test(dir)) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** Project root: nearest ancestor with .code-rules/, else nearest with .git/, else the session cwd. */
function projectRoot(from, fallback) {
  return (
    walkUp(from, (d) => fs.existsSync(path.join(d, RULES_DIR)))
    || walkUp(from, (d) => fs.existsSync(path.join(d, ".git")))
    || path.resolve(fallback || from)
  );
}

function languageFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (!ext || (LANGUAGES.ignore || []).includes(ext)) return null;
  return (LANGUAGES.map || {})[ext] || ext.slice(1);
}

function isIgnoredPath(file) {
  const parts = path.resolve(file).split(/[\\/]/);
  return (LANGUAGES.ignorePathParts || []).some((p) => parts.includes(p));
}

/* ------------------------------------------------------------ read state */

function statePath(ev) {
  const id = [ev.session_id || "nosession", ev.agent_id || ev.subagent_id || ""].filter(Boolean).join("-");
  return path.join(STATE_DIR, id.replace(/[^A-Za-z0-9_-]/g, "_") + ".json");
}

function loadState(ev) {
  try {
    return JSON.parse(fs.readFileSync(statePath(ev), "utf8"));
  } catch {
    return {};
  }
}

function saveState(ev, state) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(statePath(ev), JSON.stringify(state));
  } catch {}
}

function mtime(file) {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

/* --------------------------------------------------------------- seeding */

/** Which languages does this repo actually contain? Bounded walk. */
function detectLanguages(root) {
  const found = new Set();
  let budget = 4000;
  const skip = new Set(LANGUAGES.ignorePathParts || []);
  const walk = (dir, depth) => {
    if (depth > 6 || budget <= 0) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (budget-- <= 0) return;
      if (e.name.startsWith(".") || skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else {
        const lang = languageFor(e.name);
        if (lang) found.add(lang);
      }
    }
  };
  walk(root, 0);
  return found;
}

/** Copy every seed:true rule from library/<folder> into .code-rules/<folder>. */
function seedFolder(root, folder) {
  const src = path.join(LIBRARY, folder);
  const dest = path.join(root, RULES_DIR, folder);
  if (!fs.existsSync(src)) return false;
  const files = ruleFiles(src).filter((f) => frontmatter(f).seed !== "false");
  if (!files.length) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const f of files) {
    const target = path.join(dest, path.basename(f));
    if (!fs.existsSync(target)) fs.copyFileSync(f, target);
  }
  return true;
}

/** Create .code-rules/ with global/ plus every language the repo contains. */
function seedProject(root) {
  seedFolder(root, "global");
  for (const lang of detectLanguages(root)) seedFolder(root, lang);
  writeIndex(root);
}

/* ----------------------------------------------------------------- index */

function ruleFolders(root) {
  const base = path.join(root, RULES_DIR);
  let dirs;
  try {
    dirs = fs
      .readdirSync(base, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
      .map((e) => e.name);
  } catch {
    return [];
  }
  return dirs.sort((a, b) => (a === "global" ? -1 : b === "global" ? 1 : a.localeCompare(b)));
}

function writeIndex(root) {
  const base = path.join(root, RULES_DIR);
  if (!fs.existsSync(base)) return;
  const lines = [
    "# code-rules index",
    "",
    "Generated. Rules in force for this project. `global/` applies to every task;",
    "a language folder applies only when you touch that language. Read the full file",
    "of every rule in an applicable folder before editing — this index is a router,",
    "not a substitute.",
    ""
  ];
  for (const folder of ruleFolders(root)) {
    const files = ruleFiles(path.join(base, folder));
    if (!files.length) continue;
    lines.push(`## ${folder}${folder === "global" ? " — always" : ""}`);
    for (const f of files) {
      const fm = frontmatter(f);
      const applies = (fm.applies || "").replace(/\s+/g, " ").trim();
      lines.push(
        `- \`${RULES_DIR}/${folder}/${path.basename(f)}\` — ${fm.name || path.basename(f)}${applies ? `: ${applies}` : ""}`
      );
    }
    lines.push("");
  }
  try {
    fs.writeFileSync(path.join(base, "INDEX.md"), lines.join("\n"));
  } catch {}
}

/* ------------------------------------------------------- target extraction */

/** Pull edited file paths out of either agent's tool_input shape. */
function targets(ev) {
  const ti = ev.tool_input;
  if (!ti) return [];
  const out = new Set();
  const add = (p) => {
    if (typeof p === "string" && p.trim()) out.add(p.trim());
  };

  if (typeof ti === "string") {
    for (const m of ti.matchAll(/\*\*\* (?:Add|Update|Delete) File:\s*(.+)/g)) add(m[1]);
  } else if (typeof ti === "object") {
    add(ti.file_path);
    add(ti.path);
    add(ti.filePath);
    add(ti.notebook_path);
    if (ti.changes && typeof ti.changes === "object") for (const k of Object.keys(ti.changes)) add(k);
    if (Array.isArray(ti.edits)) for (const e of ti.edits) add(e && (e.file_path || e.path));
    for (const field of [ti.input, ti.patch, ti.content, ti.command]) {
      if (typeof field === "string")
        for (const m of field.matchAll(/\*\*\* (?:Add|Update|Delete) File:\s*(.+)/g)) add(m[1]);
    }
  }
  return [...out];
}

/** Rule-file paths mentioned by a read-type tool call. */
function readsFrom(ev, root) {
  const ti = ev.tool_input || {};
  const tool = ev.tool_name || "";
  const candidates = [];

  if (READ_TOOLS.test(tool)) {
    for (const v of [ti.file_path, ti.path, ti.filePath]) if (typeof v === "string") candidates.push(v);
  } else if (SHELL_TOOLS.test(tool)) {
    const cmd = typeof ti === "string" ? ti : ti.command || "";
    if (typeof cmd === "string" && SHELL_READ.test(cmd)) candidates.push(cmd);
  } else {
    return [];
  }

  const blob = candidates.join("\n");
  if (!blob) return [];
  const hits = [];
  for (const folder of ruleFolders(root)) {
    for (const f of ruleFiles(path.join(root, RULES_DIR, folder))) {
      const rel = `${RULES_DIR}/${folder}/${path.basename(f)}`;
      if (blob.includes(rel) || blob.includes(rel.replace(/\//g, "\\")) || blob.includes(f)) hits.push(f);
    }
  }
  return hits;
}

/* ---------------------------------------------------------------- handlers */

function onSessionStart(ev) {
  try {
    fs.rmSync(statePath(ev), { force: true });
  } catch {}
  const root = projectRoot(ev.cwd || process.cwd());
  const index = path.join(root, RULES_DIR, "INDEX.md");
  if (!fs.existsSync(index)) allow();
  let text;
  try {
    text = fs.readFileSync(index, "utf8");
  } catch {
    allow();
  }
  emit(ev.hook_event_name, {
    additionalContext:
      `code-rules is active for this project. Rules in force live in ${RULES_DIR}/ and are `
      + `enforced by a hook: edits are blocked until the applicable files are read.\n\n${text}`
  });
}

function onPreToolUse(ev) {
  const files = targets(ev);
  if (!files.length) allow();

  const cwd = ev.cwd || process.cwd();
  const resolved = files.map((f) => (path.isAbsolute(f) ? f : path.resolve(cwd, f)));

  // Never gate the skill's own files, ignored paths, or non-source targets.
  const gated = resolved.filter((f) => !key(f).startsWith(key(SKILL_ROOT)) && !isIgnoredPath(f) && languageFor(f));
  if (!gated.length) allow();

  const root = projectRoot(path.dirname(gated[0]), cwd);
  const base = path.join(root, RULES_DIR);
  const fresh = !fs.existsSync(base);
  if (fresh) {
    try {
      seedProject(root);
    } catch {
      allow();
    }
  }

  const needFolders = new Set(["global"]);
  for (const f of gated) {
    const lang = languageFor(f);
    if (!lang) continue;
    const dest = path.join(base, lang);
    if (!fs.existsSync(dest) && fs.existsSync(path.join(LIBRARY, lang))) {
      try {
        seedFolder(root, lang);
        writeIndex(root);
      } catch {}
    }
    if (fs.existsSync(dest)) needFolders.add(lang);
  }

  const required = [];
  for (const folder of needFolders) required.push(...ruleFiles(path.join(base, folder)));
  if (!required.length) allow();

  const state = loadState(ev);
  const unread = required.filter((f) => state[key(f)] !== mtime(f));
  if (!unread.length) allow();

  const list = unread.map((f) => `  ${path.relative(root, f).replace(/\\/g, "/")}`).join("\n");
  const preamble = fresh
    ? `code-rules created ${RULES_DIR}/ for this project.`
    : `code-rules gate: the rules for this file have not been read in this context.`;
  deny(
    "PreToolUse",
    `${preamble}\n\nRead these files, then retry the edit:\n${list}\n\n`
      + `They are the rules in force for ${path.basename(gated[0])}. Follow every `
      + `pre-work requirement before writing, and run each check_before_finishing `
      + `against the finished diff. Re-reading is required after a context reset.`
  );
}

function onPostToolUse(ev) {
  const cwd = ev.cwd || process.cwd();
  const tool = ev.tool_name || "";

  if (EDIT_TOOLS.test(tool)) {
    for (const f of targets(ev)) {
      const abs = path.isAbsolute(f) ? f : path.resolve(cwd, f);
      if (abs.split(/[\\/]/).includes(RULES_DIR)) {
        try {
          writeIndex(projectRoot(path.dirname(abs), cwd));
        } catch {}
        break;
      }
    }
    allow();
  }

  const root = projectRoot(cwd);
  const hits = readsFrom(ev, root);
  if (!hits.length) allow();
  const state = loadState(ev);
  for (const f of hits) state[key(f)] = mtime(f);
  saveState(ev, state);
  allow();
}

/* ------------------------------------------------------------------- main */

function main() {
  if ((process.env.CODE_RULES_GATE || "").toLowerCase() === "off") allow();

  const raw = readStdin();
  if (!raw.trim()) allow();

  let ev;
  try {
    ev = JSON.parse(raw);
  } catch {
    allow();
  }

  switch (ev.hook_event_name) {
    case "SessionStart":
    case "PostCompact":
      return onSessionStart(ev);
    case "PreToolUse":
      return onPreToolUse(ev);
    case "PostToolUse":
      return onPostToolUse(ev);
    default:
      return allow();
  }
}

try {
  main();
} catch {
  allow();
}
