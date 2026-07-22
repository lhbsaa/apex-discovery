#!/usr/bin/env node
/**
 * apex-discovery — Scientific research extension for apex-unified
 *
 * Uses apex-unified's engine directly, adds 148+ scientific skills.
 * Install: node scripts/setup.js
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APEX_DIR = join(__dirname, '..', 'node_modules', '@apex-unified', 'core');
const APEX_DEV = join(__dirname, '..', '..', 'apex-unified');
const SCI_SKILLS = join(__dirname, '..', 'scientific-agent-skills', 'skills');

// Find apex-unified engine (local dev or npm)
const apexRoot = existsSync(join(APEX_DEV, 'cli', 'main.js')) ? APEX_DEV :
                 existsSync(join(APEX_DIR, 'cli', 'main.js')) ? APEX_DIR : null;

if (!apexRoot) {
  console.error('❌ apex-unified not found. Run: node scripts/setup.js');
  process.exit(1);
}

// Read config
const configPath = join(__dirname, '..', 'config', 'defaults.json');
let mode = 'research-scientist';
if (existsSync(configPath)) {
  try { mode = JSON.parse(readFileSync(configPath, 'utf8')).mode || mode; } catch {}
}

const args = process.argv.slice(2);
const cmd = args[0];

// Count scientific skills
let sciCount = 0;
if (existsSync(SCI_SKILLS)) {
  sciCount = readdirSync(SCI_SKILLS, { withFileTypes: true })
    .filter(d => d.isDirectory()).length;
}

if (cmd === 'status') {
  console.log('\napex-discovery — Scientific Research Extension');
  console.log('='.repeat(45));
  console.log(`Mode:         ${mode} (research-scientist)`);
  console.log(`Sci. skills:  ${sciCount}+ (from scientific-agent-skills)`);
  console.log(`Apex engine:  ${apexRoot}`);
  console.log('');
  // Forward to apex-unified status
  execSync(`node "${join(apexRoot, 'cli', 'main.js')}" ${args.join(' ')}`, { stdio: 'inherit' });
} else if (cmd === 'setup') {
  execSync(`node "${join(__dirname, '..', 'scripts', 'setup.js')}"`, { stdio: 'inherit' });
} else {
  // Forward all other commands to apex-unified engine
  // Inject SCI_SKILLS_DIR for skill auto-discovery
  const env = { ...process.env, SCI_SKILLS_DIR: SCI_SKILLS };
  execSync(`node "${join(apexRoot, 'cli', 'main.js')}" ${args.join(' ')}`, { stdio: 'inherit', env });
}
