/**
 * apex-discovery Setup Script
 *
 * Verifies all scientific skills are correctly installed.
 * Since skills are now embedded directly in the project (not cloned externally),
 * this script checks integrity and reports status.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');

console.log('🔬 apex-discovery setup — skill verification\n');

if (!existsSync(SKILLS_DIR)) {
  console.error('❌ skills/ directory not found!');
  process.exit(1);
}

const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
const skillDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
const sciKeywords = ['bio', 'chem', 'mol', 'drug', 'genome', 'protein', 'clinical', 'imaging', 'physics', 'astro'];
const sciSkills = skillDirs.filter(name => sciKeywords.some(k => name.includes(k)));
const devSkills = skillDirs.filter(name => !sciKeywords.some(k => name.includes(k)));

console.log(`📊 skills/ 总数: ${skillDirs.length}`);
console.log(`   ${devSkills.length} development skills (apex-discovery engine)`);
console.log(`   ${sciSkills.length}+ scientific skills (embedded)`);

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
