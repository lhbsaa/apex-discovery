/**
 * apex-discovery Unit Tests
 *
 * Verifies:
 * 1. Scientific skills directory exists and has entries
 * 2. Config loads correctly
 * 3. CLI can find apex-unified engine
 */

import { existsSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');
const APEX_DEV = join(ROOT, '..', 'apex-unified');

console.log('\n🧪 apex-discovery Tests\n');

// Helper: count skill entries (handles Windows symlinks)
function countSkills(dir) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) { count++; continue; }
    try {
      if (lstatSync(fullPath).isSymbolicLink()) { count++; }
    } catch { /* not accessible */ }
  }
  return count;
}

// 1. Skills directory
console.log('📚 Scientific Skills');
assert(existsSync(SKILLS_DIR), 'skills/ directory exists');
console.log('  ✅ skills/ exists');

const skillCount = countSkills(SKILLS_DIR);
assert(skillCount >= 100, `Expected ≥100 skills, got ${skillCount}`);
console.log(`  ✅ ${skillCount} scientific skills entries found`);

// 2. Config
console.log('\n⚙️  Config');
const configPath = join(ROOT, 'config', 'defaults.json');
assert(existsSync(configPath), 'config/defaults.json exists');
console.log('  ✅ config/defaults.json exists');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
assert(config.mode === 'research-scientist', 'Mode is research-scientist');
assert(config.modes['research-scientist'], 'research-scientist mode defined');
console.log('  ✅ research-scientist mode configured');

// 3. Apex engine
console.log('\n🔧 Apex Engine');
const engineExists = existsSync(join(APEX_DEV, 'cli', 'main.js'));
assert(engineExists, 'apex-unified engine found');
console.log('  ✅ apex-unified engine accessible');

console.log(`\n📊 ${skillCount} skills | all tests passed ✅\n`);
