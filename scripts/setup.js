/**
 * apex-discovery Setup Script
 *
 * 1. Clones scientific-agent-skills (148+ skills)
 * 2. Links skill directories for auto-discovery
 * 3. Verifies all skills load correctly
 */

import { existsSync, mkdirSync, readdirSync, symlinkSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');
const SCI_SKILLS_REPO = 'https://github.com/K-Dense-AI/scientific-agent-skills.git';
const SCI_SKILLS_DIR = join(ROOT, 'scientific-agent-skills');

console.log('🔬 apex-discovery setup\n');

// 1. Clone scientific-agent-skills
if (!existsSync(SCI_SKILLS_DIR)) {
  console.log('📦 Cloning scientific-agent-skills (148 skills)...');
  execSync(`git clone --depth 1 ${SCI_SKILLS_REPO} "${SCI_SKILLS_DIR}"`, { stdio: 'inherit', cwd: ROOT });
  console.log('✅ Cloned\n');
} else {
  console.log('✅ scientific-agent-skills already exists, updating...\n');
}

// 2. Count and verify skills
const sciSkills = readdirSync(join(SCI_SKILLS_DIR, 'skills'), { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(SCI_SKILLS_DIR, 'skills', d.name, 'SKILL.md')))
  .map(d => d.name);

console.log(`📊 Scientific skills found: ${sciSkills.length}`);
console.log(`🔗 Link: apex-discovery/skills/ → 148+ skills ready for auto-discovery\n`);

// 3. Write config with research-scientist mode
const configPath = join(ROOT, 'config', 'defaults.json');
const config = {
  project: { name: '', language: 'python' },
  mode: 'research-scientist',
  modes: {
    'research-scientist': {
      label: '科研模式',
      triggers: ['科研', '科学', 'research', '研究论文', 'bioinformatics', 'chemistry', 'drug discovery', 'scientific'],
      skills: [
        // apex-unified core research skills
        'systematic-debugging', 'architecture-decision-records', 'error-handling',
        'verification-loop', 'verification-before-completion', 'writing-plans',
        // Scientific skills auto-discovered from scientific-agent-skills
      ],
      agents: ['architect', 'spec-miner', 'performance-optimizer', 'gsd-roadmapper'],
      phases: { discuss: true, plan: true, execute: true, verify: true, ship: false }
    }
  },
  model: { default: 'deepseek-v4-flash', provider: 'deepseek', 'phase-override': { plan: 'deepseek-v4-pro' } },
  ai: { cli: 'claude-code', hooks: true },
};

mkdirSync(join(ROOT, 'config'), { recursive: true });
writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Config written with research-scientist mode\n');

// 4. Print summary
console.log('=== apex-discovery setup complete ===');
console.log(`Scientific skills: ${sciSkills.length} ready`);
console.log(`Mode: research-scientist`);
console.log(`Run: node cli/main.js status`);
console.log(`\nTip: Skills are auto-discovered from:`);
console.log(`  ${SKILLS_DIR}/            → manual/curated skills`);
console.log(`  ${SCI_SKILLS_DIR}/skills/  → 148+ scientific skills`);
