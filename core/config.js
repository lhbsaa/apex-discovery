/**
 * apex-discovery: Three-layer configuration system + mode helpers
 *
 * Priority (highest wins):
 *   1. Project config:  .apex-discovery/config.json
 *   2. User config:     ~/.apex-discovery/config.json
 *   3. System defaults: config/defaults.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();

function readJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return {}; }
}

/** Deep-merge objects — arrays are concatenated (with dedup), objects recursed, primitives replaced. */
export function deepMerge(...sources) {
  const result = {};
  for (const src of sources) {
    for (const key of Object.keys(src)) {
      const val = src[key];
      const existing = result[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = deepMerge(existing || {}, val);
      } else if (Array.isArray(val) && Array.isArray(existing)) {
        // Extend arrays: higher-priority items are appended (with dedup)
        const existingSet = new Set(existing);
        result[key] = [...existing, ...val.filter(v => !existingSet.has(v))];
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Load config from all three layers, merged.
 * @returns {Record<string,any>}
 */
export function loadConfig() {
  const defaultsPath = join(__dirname, '..', 'config', 'defaults.json');
  const userConfigPath = join(homedir(), '.apex-discovery', 'config.json');
  const projectConfigPath = join(PROJECT_ROOT, '.apex-discovery', 'config.json');
  return deepMerge(readJSON(defaultsPath), readJSON(userConfigPath), readJSON(projectConfigPath));
}

/**
 * Write project-level config.
 * @param {Record<string,any>} config
 * @returns {boolean}
 */
export function writeConfig(config) {
  const dir = join(PROJECT_ROOT, '.apex-discovery');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'config.json'), JSON.stringify(config, null, 2), 'utf8');
  return true;
}

/**
 * Get a specific config value by dot path.
 * @param {string} path
 * @returns {any|undefined}
 */
export function getConfigValue(path) {
  const config = loadConfig();
  const keys = path.split('.');
  let val = config;
  for (const key of keys) {
    if (val === undefined || val === null) return undefined;
    val = val[key];
  }
  return val;
}

// ── Mode Helpers ──

/**
 * Get the current mode definition (merged with defaults).
 * @returns {{name:string, skills:string[], agents:string[], phases:Record<string,any>}}
 */
export function getCurrentMode() {
  const config = loadConfig();
  const modeName = config.mode || 'daily-dev';
  const modeDef = config.modes?.[modeName];
  return {
    name: modeName,
    ...(modeDef || { skills: [], agents: [], phases: {} })
  };
}

/**
 * Return the list of skill names to load for the current mode.
 * @returns {string[]}
 */
export function getActiveSkills() {
  const config = loadConfig();
  const modeName = config.mode || 'daily-dev';
  const modeDef = config.modes?.[modeName];
  return modeDef?.skills || [];
}

/**
 * Return the list of agent names to load for the current mode.
 * @returns {string[]}
 */
export function getActiveAgents() {
  const config = loadConfig();
  const modeName = config.mode || 'daily-dev';
  const modeDef = config.modes?.[modeName];
  return modeDef?.agents || [];
}

/**
 * Validate a mode name exists.
 * @param {string} name
 * @returns {boolean}
 */
export function isValidMode(name) {
  const config = loadConfig();
  return !!config.modes?.[name];
}

/**
 * Get model configuration.
 * @returns {{default:string, provider:string, phaseOverride:Record<string,string>}}
 */
export function getModel() {
  const config = loadConfig();
  return {
    default: config.model?.default || 'sonnet',
    provider: config.model?.provider || 'anthropic',
    phaseOverride: config.model?.['phase-override'] || {},
  };
}

/**
 * Get AI tool configuration.
 * @returns {{cli:string, hooks:boolean}}
 */
export function getAiTool() {
  const config = loadConfig();
  return {
    cli: config.ai?.cli || config.platform?.['preferred-cli'] || 'claude-code',
    hooks: config.ai?.hooks ?? config.platform?.['hooks-enabled'] ?? true,
  };
}
