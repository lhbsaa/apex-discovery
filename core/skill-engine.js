import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');

// ── Cache ──
let nameCache = null;
let skillCache = null;

function loadSkillFromDisk(name) {
  try {
    const path = join(SKILLS_DIR, name, 'SKILL.md');
    if (!existsSync(path)) return null;
    const content = readFileSync(path, 'utf8');
    const fm = parseFrontmatter(content);
    return {
      name: fm['apex-id'] || name,
      id: fm['apex-id'] || name,
      category: fm['apex-category'] || 'domain',
      description: fm['description'] || '',
      phase: fm['apex-lifecycle']?.phase || ['execute'],
      triggers: fm['apex-lifecycle']?.triggers || [],
      compatibility: fm['apex-compatibility'] || [],
      content,
    };
  } catch { return null; }
}

function warmCache() {
  if (skillCache) return;
  if (!existsSync(SKILLS_DIR)) { nameCache = []; skillCache = {}; return; }
  try {
    nameCache = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(join(SKILLS_DIR, d.name, 'SKILL.md')))
      .map(d => d.name);
    skillCache = {};
    for (const n of nameCache) skillCache[n] = loadSkillFromDisk(n);
  } catch { nameCache = []; skillCache = {}; }
}

/**
 * Clear the skill cache so the next call re-reads from disk.
 */
export function clearCache() { nameCache = null; skillCache = null; }

/**
 * List all available skill names.
 * @returns {string[]}
 */
export function listSkills() { warmCache(); return [...nameCache]; }

/**
 * Load a skill by name.
 * @param {string} name
 * @returns {import('./frontmatter.js').Skill|null}
 */
export function loadSkill(name) { warmCache(); return skillCache?.[name] || null; }

/**
 * Find skills whose lifecycle includes the given phase.
 * @param {string} phase
 * @returns {import('./frontmatter.js').Skill[]}
 */
export function findSkillsByPhase(phase) {
  warmCache();
  return Object.values(skillCache).filter(s => s && s.phase.includes(phase));
}

/**
 * Find skills matching a natural-language trigger.
 * @param {string} input
 * @returns {import('./frontmatter.js').Skill[]}
 */
export function findSkillsByTrigger(input) {
  if (!input) return [];
  warmCache();
  const lower = input.toLowerCase();
  return Object.values(skillCache).filter(s => {
    if (!s) return false;
    if (s.description.toLowerCase().includes(lower)) return true;
    if (s.triggers?.some(t => lower.includes(t.toLowerCase()))) return true;
    if (s.name && lower.includes(s.name.toLowerCase())) return true;
    return false;
  });
}

// ── Frontmatter parser (imported from shared module) ──
