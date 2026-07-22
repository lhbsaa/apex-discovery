/**
 * apex-unified Mode Engine
 *
 * Handles:
 *  - 方式二: Natural language trigger matching (auto-switch mode by user input)
 *  - 方式三: Slash command parsing (/apex:mode <name>)
 */

import { loadConfig, writeConfig, isValidMode, getActiveSkills, getActiveAgents } from './config.js';

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
    // Check both: trigger contained in input, AND keywords from trigger found in input
    const match = triggers.some(t => {
      const tl = t.toLowerCase();
      // Direct substring match
      if (lower.includes(tl)) return true;
      // Keyword match: split trigger into words, check if any word is in input
      const words = tl.split(/[\s,，、]+/).filter(Boolean);
      return words.some(w => w.length >= 2 && lower.includes(w));
    });
    if (match) {
      config.mode = name;
      writeConfig(config);
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
    config.mode = target;
    writeConfig(config);
    const label = config.modes?.[target]?.label || target;
    return {
      handled: true,
      message: `Switched to mode: ${target} (${label})\nActive skills: ${getActiveSkills().join(', ')}`
    };
  }
  return { handled: false, message: `Unknown command: /apex:${cmd}` };
}
