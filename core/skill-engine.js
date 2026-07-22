import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');

// ── Cache ──
let nameCache = null;
let skillCache = null;

function loadSkillFromDisk(name) {
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
}

function warmCache() {
  if (skillCache) return;
  if (!existsSync(SKILLS_DIR)) { nameCache = []; skillCache = {}; return; }
  nameCache = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(SKILLS_DIR, d.name, 'SKILL.md')))
    .map(d => d.name);
  skillCache = {};
  for (const n of nameCache) skillCache[n] = loadSkillFromDisk(n);
}

export function clearCache() { nameCache = null; skillCache = null; }
export function listSkills() { warmCache(); return [...nameCache]; }
export function loadSkill(name) { warmCache(); return skillCache?.[name] || null; }
export function findSkillsByPhase(phase) {
  warmCache();
  return Object.values(skillCache).filter(s => s && s.phase.includes(phase));
}
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

// ── Frontmatter parser ──

function yamlArrayToJSON(str) {
  const quoted = str.replace(/([a-zA-Z0-9_-]+)/g, '"$1"').replace(/""/g, '"');
  try { return JSON.parse(quoted); } catch { return []; }
}

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const end = lines.indexOf('---', 1);
  if (end === -1) return {};
  const fm = {};
  for (let i = 1; i < end; i++) {
    const trimmed = lines[i].trim();
    const kvMatch = trimmed.match(/^([a-z-]+):\s*(.*)/);
    if (!kvMatch) continue;
    const key = kvMatch[1];
    let val = kvMatch[2].trim();
    // Nested YAML object
    if (val === '' && i + 1 < end) {
      const subKeys = {};
      for (let j = i + 1; j < end; j++) {
        const subLine = lines[j];
        const subTrimmed = subLine.trim();
        if (!subTrimmed || subLine === subTrimmed || subLine.startsWith('---')) break;
        const subMatch = subTrimmed.match(/^([a-z-]+):\s*(.*)/);
        if (subMatch) {
          let subVal = subMatch[2].trim();
          if (subVal.startsWith('[')) {
            let arrStr = subVal;
            for (let k = j + 1; k < end && !arrStr.includes(']'); k++) arrStr += lines[k].trim();
            subKeys[subMatch[1]] = yamlArrayToJSON(arrStr);
          } else {
            subKeys[subMatch[1]] = subVal.replace(/^["']|["']$/g, '');
          }
        }
      }
      if (Object.keys(subKeys).length > 0) fm[key] = subKeys;
      continue;
    }
    if (val.startsWith('[')) {
      let arrStr = val;
      for (let j = i + 1; j < end && !arrStr.includes(']'); j++) arrStr += lines[j].trim();
      fm[key] = yamlArrayToJSON(arrStr);
    } else {
      fm[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return fm;
}
