import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, '..', 'agents');

// ── Cache & Public API ──
let agentCache = null;

function loadAgentFromDisk(name) {
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
}

function warmCache() {
  if (agentCache) return;
  if (!existsSync(AGENTS_DIR)) { agentCache = {}; return; }
  agentCache = {};
  for (const f of readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'))) {
    const name = f.replace(/\.md$/, '');
    agentCache[name] = loadAgentFromDisk(name);
  }
}

export function clearCache() { agentCache = null; }
export function listAgents() { warmCache(); return Object.keys(agentCache); }
export function loadAgent(name) { warmCache(); return agentCache?.[name] || null; }
export function findAgentsByPhase(phase) {
  warmCache();
  return Object.values(agentCache).filter(a => a && a.phase.includes(phase));
}
export function findAgentsByKeyword(keyword) {
  if (!keyword) return [];
  warmCache();
  const lower = keyword.toLowerCase();
  return Object.values(agentCache).filter(a => a && (
    a.name.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower)
  ));
}

// ── Frontmatter parser (shared with skill-engine) ──
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
