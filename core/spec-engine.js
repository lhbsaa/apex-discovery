/**
 * apex-unified Spec Engine — Spec-driven development workflow
 *
 * Implements the propose → apply → archive cycle from OpenSpec.
 * Artifacts are stored in openspec/changes/<name>/
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadSkill } from './skill-engine.js';
import { loadAgent } from './agent-engine.js';
import { buildPhasePrompt } from './phase-engine.js';

const PROJ = process.cwd();
const SPEC_DIR = join(PROJ, 'openspec');

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

/** Initialize spec directories */
export function specInit() {
  ensureDir(join(SPEC_DIR, 'changes', 'archive'));
  ensureDir(join(SPEC_DIR, 'explorations'));
  ensureDir(join(SPEC_DIR, 'specs'));
  if (!existsSync(join(SPEC_DIR, 'config.yaml'))) {
    writeFileSync(join(SPEC_DIR, 'config.yaml'),
      '# OpenSpec-compatible config\nproject: ' + PROJ.split(/[/\\]/).pop() + '\n', 'utf8');
  }
  return { dir: SPEC_DIR, exists: existsSync(SPEC_DIR) };
}

/** Propose a new feature: create spec artifacts */
export function specPropose(feature) {
  let name = feature.toLowerCase()
    .replace(/[^a-z0-9\u00a0-\uffff]+/g, '-')  // keep almost everything
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  if (!name) name = `change-${Date.now().toString(36)}`;

  const changeDir = join(SPEC_DIR, 'changes', name);
  if (existsSync(changeDir)) return { error: `Feature "${name}" already exists`, dir: changeDir };

  ensureDir(changeDir);
  ensureDir(join(changeDir, 'specs'));

  writeFileSync(join(changeDir, 'proposal.md'),
    `# ${feature}\n\n## Why\n[Why are we doing this?]\n\n## What\n[What is changing?]\n\n## Impact\n[What is the impact?]\n`, 'utf8');
  writeFileSync(join(changeDir, 'design.md'),
    `# Design: ${feature}\n\n## Approach\n[Technical approach]\n\n## Trade-offs\n[Trade-offs considered]\n`, 'utf8');
  writeFileSync(join(changeDir, 'tasks.md'),
    `# Tasks: ${feature}\n\n## Implementation\n1. [ ] Task 1\n2. [ ] Task 2\n\n## Verification\n- [ ] Tests pass\n- [ ] Typecheck passes\n`, 'utf8');

  // Load relevant skills for context
  const skills = ['brainstorming', 'writing-plans'].map(loadSkill).filter(Boolean);

  return { dir: changeDir, name, skills: skills.length, agents: loadAgent('planner')?.name || '' };
}

/** List all active changes */
export function specList() {
  const changesDir = join(SPEC_DIR, 'changes');
  if (!existsSync(changesDir)) return [];
  return readdirSync(changesDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'archive')
    .map(d => {
      const tasksPath = join(changesDir, d.name, 'tasks.md');
      let taskCount = 0, doneCount = 0;
      if (existsSync(tasksPath)) {
        const tasks = readFileSync(tasksPath, 'utf8');
        taskCount = (tasks.match(/\[ \]/g) || []).length;
        doneCount = (tasks.match(/\[x\]/g) || []).length;
      }
      return { name: d.name, tasks: taskCount, done: doneCount };
    });
}

/** Archive a completed change */
export function specArchive(name) {
  const src = join(SPEC_DIR, 'changes', name);
  if (!existsSync(src)) return { error: `Change "${name}" not found` };
  const archive = join(SPEC_DIR, 'changes', 'archive', `${new Date().toISOString().slice(0, 10)}-${name}`);
  ensureDir(archive);
  for (const f of readdirSync(src)) {
    writeFileSync(join(archive, f), readFileSync(join(src, f)));
  }
  rmSync(src, { recursive: true });
  return { archived: true, path: archive };
}
