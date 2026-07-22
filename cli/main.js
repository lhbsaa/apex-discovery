#!/usr/bin/env node
/**
 * apex-discovery — Scientific research extension for apex-unified
 *
 * Uses apex-unified's engine directly, skills in skills/ are auto-discovered.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, lstatSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APEX_DIR = join(__dirname, '..', 'node_modules', '@apex-unified', 'core');
const APEX_DEV = join(__dirname, '..', '..', 'apex-unified');
const SKILLS_DIR = join(__dirname, '..', 'skills');

// Find apex-unified engine (local dev or npm)
const apexRoot = existsSync(join(APEX_DEV, 'cli', 'main.js')) ? APEX_DEV :
                 existsSync(join(APEX_DIR, 'cli', 'main.js')) ? APEX_DIR : null;

if (!apexRoot) {
  console.error('❌ apex-unified not found. Run: node scripts/setup.js');
  process.exit(1);
}

// Count skills (handles Windows symlinks)
function countSkills(dir) {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) { count++; continue; }
    try { if (lstatSync(fullPath).isSymbolicLink()) count++; } catch {}
  }
  return count;
}

let skillCount = countSkills(SKILLS_DIR);

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === 'help' || cmd === '--help') {
  console.log(`
apex-discovery — Scientific Research Extension

Usage:
  node cli/main.js status              Show project status + skill count
  node cli/main.js setup               Run setup to link scientific skills
  node cli/main.js config --show       View configuration
  node cli/main.js config --mode <name> Switch mode
  node cli/main.js plan [phase]        Generate phase prompt
  node cli/main.js <any apex cmd>      Forwarded to apex-unified engine

Skills: ${skillCount} scientific skills available (auto-discovered)
`);
  process.exit(0);
}

if (cmd === 'status') {
  console.log(`\napex-discovery — Scientific Research Extension`);
  console.log(`Skills:       ${skillCount} scientific (auto-discovered)`);
  console.log(`Apex engine:  ${apexRoot}`);
  console.log(`Run setup:    node scripts/setup.js`);
  console.log('');
  execSync(`node "${join(apexRoot, 'cli', 'main.js')}" ${args.join(' ')}`, { stdio: 'inherit' });
} else if (cmd === 'setup') {
  execSync(`node "${join(__dirname, '..', 'scripts', 'setup.js')}"`, { stdio: 'inherit' });
} else {
  execSync(`node "${join(apexRoot, 'cli', 'main.js')}" ${args.join(' ')}`, { stdio: 'inherit' });
}
