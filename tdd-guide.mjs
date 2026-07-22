#!/usr/bin/env node
/**
 * TDD Guide — Interactive TDD workflow powered by apex-discovery
 *
 * Usage: node tdd-guide.mjs
 *
 * Runs in your project directory. Guides you through:
 *   1. Skill discovery — shows TDD rules
 *   2. Phase guide — plan → execute → verify → ship
 *   3. RED — write failing test
 *   4. GREEN — write minimal implementation
 *   5. VERIFY — run tests
 */

import { loadSkill, findSkillsByTrigger, listSkills } from './core/skill-engine.js';
import { nextPhase, buildPhasePrompt, getPhaseInfo } from './core/phase-engine.js';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = process.cwd();

console.log('\n' + '='.repeat(60));
console.log('  apex-discovery TDD Guide');
console.log('='.repeat(60));
console.log(`  Project: ${projectDir}`);
console.log('');

// ── 1. Skill Discovery ──
console.log('📖 Skill Discovery');
const tdd = loadSkill('test-driven-development');
if (tdd) {
  console.log(`  Found: ${tdd.id} (${tdd.category})`);
  console.log(`  Rule: "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"`);
} else {
  console.log('  TDD skill not found — check skills/ directory');
}

const input = process.argv[2] || '';
if (input) {
  const matched = findSkillsByTrigger(input);
  if (matched.length > 0) {
    console.log(`  Triggered ${matched.length} skill(s) for "${input}"`);
  }
}

// ── 2. Phase Guide ──
console.log('\n📋 Phase Guide');
console.log(`  Workflow: discuss → plan → execute → verify → ship`);
console.log(`  Current action: plan → next: ${nextPhase('plan')}`);

// ── 3. Check for test file ──
console.log('\n🔴 RED: Write a FAILING test first');
console.log('  Create a test file (e.g. tests/feature.test.js)');
console.log('  Run it — it MUST fail before writing implementation');

const testDirs = ['tests', 'test', '__tests__', 'spec'];
const existingTests = testDirs.filter(d => existsSync(join(projectDir, d)));
if (existingTests.length > 0) {
  console.log(`  Found test directories: ${existingTests.join(', ')}`);
} else {
  console.log('  No test directory found — create one: mkdir tests');
}

// ── 4. Run tests ──
console.log('\n🟢 GREEN: Write MINIMAL code, then verify');
const testCmd = getTestCommand(projectDir);
if (testCmd) {
  console.log(`  Test command detected: ${testCmd}`);
  console.log(`  Run: ${testCmd}`);
}

console.log('\n✅ VERIFY: All tests must pass before shipping');
console.log('  Iterate: RED → GREEN → REFACTOR → repeat');
console.log('  Ship only when all tests pass\n');

function getTestCommand(dir) {
  if (existsSync(join(dir, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      if (pkg.scripts?.test) return `npm test`;
    } catch {}
  }
  if (existsSync(join(dir, 'vitest.config.ts')) || existsSync(join(dir, 'vitest.config.js'))) return 'npx vitest run';
  if (existsSync(join(dir, 'jest.config.js')) || existsSync(join(dir, 'jest.config.ts'))) return 'npx jest';
  return null;
}
