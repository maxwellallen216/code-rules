#!/usr/bin/env node
/**
 * Registers scripts/gate.mjs as a lifecycle hook.
 *
 * Claude Code discovers hooks/hooks.json automatically when code-rules is
 * installed as a plugin — this script is only needed there when the skill was
 * copied into ~/.claude/skills/ instead. Codex has no way for a plugin to
 * declare hooks, so Codex always needs this.
 *
 *   node scripts/install-hooks.mjs --check
 *   node scripts/install-hooks.mjs --codex            # ~/.codex/hooks.json
 *   node scripts/install-hooks.mjs --codex --project  # <repo>/.codex/hooks.json
 *   node scripts/install-hooks.mjs --claude           # ~/.claude/settings.json
 *   node scripts/install-hooks.mjs --uninstall --codex
 *
 * Idempotent: re-running replaces this skill's own entries and leaves every
 * other hook in the file untouched.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(SKILL_ROOT, "scripts", "gate.mjs");
const COMMAND = `node "${GATE}"`;
const MARKER = "gate.mjs";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const CHECK = has("--check");
const UNINSTALL = has("--uninstall");
const PROJECT = has("--project");

/* ------------------------------------------------------------------ shapes */

const EVENTS = {
  codex: {
    SessionStart: null,
    PostCompact: null,
    PreToolUse: "^(apply_patch|Edit|Write|MultiEdit)$",
    PostToolUse: "^(Read|View|Bash|shell|apply_patch|Edit|Write)$",
  },
  claude: {
    SessionStart: null,
    PreToolUse: "Edit|Write|MultiEdit|NotebookEdit",
    PostToolUse: "Read|Edit|Write",
  },
};

function entries(tool) {
  const out = {};
  for (const [event, matcher] of Object.entries(EVENTS[tool])) {
    const hook = { type: "command", command: COMMAND, timeout: 30 };
    out[event] = [matcher ? { matcher, hooks: [hook] } : { hooks: [hook] }];
  }
  return out;
}

/* ------------------------------------------------------------------- files */

const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");

function targetFile(tool) {
  if (tool === "codex") {
    return PROJECT ? path.join(process.cwd(), ".codex", "hooks.json") : path.join(CODEX_HOME, "hooks.json");
  }
  return PROJECT
    ? path.join(process.cwd(), ".claude", "settings.json")
    : path.join(os.homedir(), ".claude", "settings.json");
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

/** Drop every matcher group whose hooks all point at our gate. */
function stripOurs(hooks) {
  const out = {};
  for (const [event, groups] of Object.entries(hooks || {})) {
    if (!Array.isArray(groups)) continue;
    const kept = groups
      .map((g) => ({
        ...g,
        hooks: (g.hooks || []).filter((h) => !String(h.command || "").includes(MARKER)),
      }))
      .filter((g) => g.hooks.length);
    if (kept.length) out[event] = kept;
  }
  return out;
}

function isInstalled(file) {
  const cfg = readJson(file);
  return JSON.stringify(cfg.hooks || {}).includes(MARKER);
}

function apply(tool) {
  const file = targetFile(tool);
  const cfg = readJson(file);
  const base = stripOurs(cfg.hooks);

  if (!UNINSTALL) {
    for (const [event, groups] of Object.entries(entries(tool))) {
      base[event] = [...(base[event] || []), ...groups];
    }
  }

  cfg.hooks = base;
  if (!Object.keys(cfg.hooks).length) delete cfg.hooks;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
  return file;
}

/* -------------------------------------------------------------------- main */

function detect() {
  const wanted = [];
  if (has("--codex")) wanted.push("codex");
  if (has("--claude")) wanted.push("claude");
  if (wanted.length) return wanted;
  if (fs.existsSync(CODEX_HOME)) wanted.push("codex");
  if (fs.existsSync(path.join(os.homedir(), ".claude"))) wanted.push("claude");
  return wanted;
}

const tools = detect();

if (!fs.existsSync(GATE)) {
  console.error(`code-rules: gate.mjs not found at ${GATE}`);
  process.exit(1);
}

if (!tools.length) {
  console.log("code-rules: found neither ~/.codex nor ~/.claude. Pass --codex or --claude explicitly.");
  process.exit(0);
}

if (CHECK) {
  console.log(`code-rules gate: ${GATE}`);
  for (const tool of tools) {
    const file = targetFile(tool);
    const state = isInstalled(file) ? "installed" : "not installed";
    console.log(`  ${tool.padEnd(7)} ${state.padEnd(14)} ${file}`);
  }
  if (tools.includes("claude")) {
    console.log("  note: if code-rules is installed as a Claude Code plugin, hooks/hooks.json already");
    console.log("        registers the gate and --claude is unnecessary.");
  }
  process.exit(0);
}

for (const tool of tools) {
  const file = apply(tool);
  console.log(`code-rules: ${UNINSTALL ? "removed from" : "registered in"} ${file}`);
  if (tool === "codex" && PROJECT && !UNINSTALL) {
    console.log("  Codex loads project hooks only from a trusted project. If they don't fire, add to");
    console.log("  ~/.codex/config.toml:");
    console.log(`    [projects.'${process.cwd().toLowerCase()}']`);
    console.log('    trust_level = "trusted"');
  }
}
if (!UNINSTALL) console.log("Restart the agent for the change to take effect.");
