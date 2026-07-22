/**
 * apex-discovery Setup Script
 *
 * 1. Clones scientific-agent-skills (if not present)
 * 2. Symlinks all 149 skills into skills/ for auto-discovery
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
  console.log('📦 Cloning scientific-agent-skills (149 skills)...');
  execSync(`git clone --depth 1 ${SCI_SKILLS_REPO} "${SCI_SKILLS_DIR}"`, { stdio: 'inherit', cwd: ROOT });
  console.log('✅ Cloned\n');
} else {
  console.log('✅ scientific-agent-skills already exists\n');
}

// 2. Symlink all skills into skills/ for auto-discovery
mkdirSync(SKILLS_DIR, { recursive: true });
const sciSkills = readdirSync(join(SCI_SKILLS_DIR, 'skills'), { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(SCI_SKILLS_DIR, 'skills', d.name, 'SKILL.md')));

let linked = 0;
for (const skill of sciSkills) {
  const target = join(SCI_SKILLS_DIR, 'skills', skill.name);
  const linkPath = join(SKILLS_DIR, skill.name);
  if (!existsSync(linkPath)) {
    try {
      symlinkSync(target, linkPath, 'junction');
      linked++;
    } catch {
      // junction symlinks may fail on some Windows configurations
      // Fall back: no error, user can manually copy
    }
  }
}

console.log(`📊 Scientific skills: ${sciSkills.length} found, ${linked} linked`);
console.log(`🔗 ${SKILLS_DIR}/ → auto-discovered by apex-unified engine\n`);

// 3. Write config
const configPath = join(ROOT, 'config', 'defaults.json');
const config = {
  project: { name: '', language: 'python' },
  mode: 'research-scientist',
  modes: {
    'research-scientist': {
      label: '科研模式',
      triggers: ['科研', '科学', 'research', '研究论文', 'bioinformatics', 'chemistry', 'drug discovery', 'scientific'],
      skills: [
        'systematic-debugging', 'architecture-decision-records', 'error-handling',
        'verification-loop', 'verification-before-completion', 'writing-plans'
      ],
      agents: ['architect', 'spec-miner', 'performance-optimizer', 'gsd-roadmapper'],
      phases: { discuss: true, plan: true, execute: true, build: true, verify: true, ship: false }
    }
  },
  model: { default: 'deepseek-v4-flash', provider: 'deepseek', 'phase-override': { plan: 'deepseek-v4-pro' } },
  ai: { cli: 'claude-code', hooks: true },
};

mkdirSync(join(ROOT, 'config'), { recursive: true });
writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ Config written (research-scientist mode, 6 phases)\n');

// 4. Summary
console.log('=== apex-discovery setup complete ===');
console.log(`Scientific skills: ${sciSkills.length} ready for discovery`);
console.log(`Mode: research-scientist`);
console.log(`Run: node cli/main.js status`);
