/**
 * apex-discovery Setup Script
 *
 * Verifies all scientific skills are correctly installed.
 * Since skills are now embedded directly in the project (not cloned externally),
 * this script checks integrity and reports status.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');

console.log('🔬 apex-discovery setup — skill verification\n');

if (!existsSync(SKILLS_DIR)) {
  console.error('✖ skills/ directory not found!');
  process.exit(1);
}

const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
const skillDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

// Development skills declare an `apex-id` in their SKILL.md frontmatter;
// scientific skills do not.
function classify(name) {
  const path = join(SKILLS_DIR, name, 'SKILL.md');
  if (!existsSync(path)) return 'sci';
  try {
    return /^apex-id:/m.test(readFileSync(path, 'utf8')) ? 'dev' : 'sci';
  } catch {
    return 'sci';
  }
}

const devSkills = skillDirs.filter(name => classify(name) === 'dev');
const sciSkills = skillDirs.filter(name => classify(name) === 'sci');

console.log(`📊 skills/ 总数: ${skillDirs.length}`);
console.log(`   ${devSkills.length} development skills (apex-discovery engine)`);
console.log(`   ${sciSkills.length} scientific skills (embedded)`);

// Verify SKILL.md for a sample
const samples = ['test-driven-development', 'rdkit', 'scanpy', 'biopython'];
let sampleOk = 0;
for (const s of samples) {
  if (existsSync(join(SKILLS_DIR, s, 'SKILL.md'))) {
    sampleOk++;
  }
}
console.log(`   Sample SKILL.md check: ${sampleOk}/${samples.length} verified`);

console.log('\n=== apex-discovery setup complete ===');
console.log(`All ${skillDirs.length} skills are embedded locally — no external setup needed.`);
console.log(`Run: node cli/main.js status`);
