import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, '..', 'agents');

// ── Cache & Public API ──
let agentCache = null;

function loadAgentFromDisk(name) {
  try {
    const path = join(AGENTS_DIR, `${name}.md`);
    if (!existsSync(path)) return null;
    const content = readFileSync(path, 'utf8');
    const fm = parseFrontmatter(content);
    const body = content.replace(/^---[\s\S]*?---\n*/, '');
    return {
      name: fm.name || name,
      description: fm.description || '',
      tools: fm.tools || [],
      model: fm.model || 'sonnet',
      phase: fm['apex-lifecycle']?.phase || ['execute'],
      category: fm['apex-category'] || 'domain',
      color: fm.color || null,
      content: body,
    };
  } catch { return null; }
}

function warmCache() {
  if (agentCache) return;
  if (!existsSync(AGENTS_DIR)) { agentCache = {}; return; }
  try {
    agentCache = {};
    for (const f of readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'))) {
      const name = f.replace(/\.md$/, '');
      agentCache[name] = loadAgentFromDisk(name);
    }
  } catch { agentCache = {}; }
}

/**
 * Clear the agent cache.
 */
export function clearCache() { agentCache = null; }

/**
 * List all available agent names.
 * @returns {string[]}
 */
export function listAgents() { warmCache(); return Object.keys(agentCache); }

/**
 * Load an agent definition by name.
 * @param {string} name
 * @returns {import('./frontmatter.js').AgentInfo|null}
 */
export function loadAgent(name) { warmCache(); return agentCache?.[name] || null; }

/**
 * Find agents whose lifecycle includes the given phase.
 * @param {string} phase
 * @returns {import('./frontmatter.js').AgentInfo[]}
 */
export function findAgentsByPhase(phase) {
  warmCache();
  return Object.values(agentCache).filter(a => a && a.phase.includes(phase));
}

/**
 * Find agents by keyword (matches name and description).
 * @param {string} keyword
 * @returns {import('./frontmatter.js').AgentInfo[]}
 */
export function findAgentsByKeyword(keyword) {
  if (!keyword) return [];
  warmCache();
  const lower = keyword.toLowerCase();
  return Object.values(agentCache).filter(a => a && (
    a.name.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
  ));
}

// ── Frontmatter parser (imported from shared module) ──
