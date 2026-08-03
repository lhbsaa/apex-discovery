/**
 * apex-discovery Mode Engine
 *
 * Handles:
 *  - 方式二: Natural language trigger matching (auto-switch mode by user input)
 *  - 方式三: Slash command parsing (/apex:mode <name>)
 */

import { loadConfig, writeConfig, getProjectConfig, isValidMode, getActiveSkills, getActiveAgents } from './config.js';

/** Persist a mode change as a minimal project-config delta (not the full merged config). */
function setMode(name) {
  const project = getProjectConfig();
  project.mode = name;
  writeConfig(project);
}

/**
 * Match a single trigger against input.
 * - CJK (non-ASCII) triggers: substring match (phrases like 嵌入式开发).
 * - Latin triggers: whole-phrase word-boundary match so "bug" does not match
 *   "debug" and "spec" does not match "specific".
 */
function triggerMatches(trigger, input) {
  const tl = trigger.toLowerCase();
  if (!tl) return false;
  if (/[\u3400-\u9fff]/.test(tl)) {
    return input.includes(tl);
  }
  const escaped = tl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(input);
}

/**
 * Parse user input and auto-switch mode if a trigger matches.
 * Returns { switched, from, to } or null if no match.
 */
export function detectModeFromInput(input) {
  if (!input || typeof input !== 'string') return null;
  const config = loadConfig();
  const currentMode = config.mode || 'daily-dev';
  const lower = input.toLowerCase();

  for (const [name, def] of Object.entries(config.modes || {})) {
    if (name === currentMode) continue;
    const triggers = def.triggers || [];
    const match = triggers.some(t => triggerMatches(t, lower));
    if (match) {
      setMode(name);
      return { switched: true, from: currentMode, to: name, label: def.label || name };
    }
  }
  return null;
}

/**
 * Parse a slash command like /apex:mode full-stack
 * Returns { command, args } or null.
 */
export function parseSlashCommand(input) {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/^\/apex:(\w+)(?:\s+(.+))?$/);
  if (!match) return null;
  return { command: match[1], args: match[2]?.trim() || '' };
}

/**
 * Execute a slash command.
 * Returns { handled, message }.
 */
export function executeSlashCommand(cmd, args) {
  if (cmd === 'mode') {
    const target = args || 'status';
    if (target === 'status') {
      const config = loadConfig();
      const current = config.mode || 'daily-dev';
      const def = config.modes?.[current];
      return {
        handled: true,
        message: `Current mode: ${current} (${def?.label || ''})\nActive skills: ${getActiveSkills().length}/${Object.keys(config.modes).length}\nAvailable: ${Object.keys(config.modes || {}).join(', ')}`
      };
    }
    if (!isValidMode(target)) {
      const config = loadConfig();
      const modes = Object.keys(config.modes || {}).join(', ');
      return { handled: true, message: `Unknown mode: ${target}. Available: ${modes}` };
    }
    const config = loadConfig();
    setMode(target);
    const label = config.modes?.[target]?.label || target;
    return {
      handled: true,
      message: `Switched to mode: ${target} (${label})\nActive skills: ${getActiveSkills().join(', ')}`
    };
  }
  return { handled: false, message: `Unknown command: /apex:${cmd}` };
}
