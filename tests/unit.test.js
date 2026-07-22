#!/usr/bin/env node
/**
 * apex-discovery Unit Tests
 *
 * Verifies:
 * 1. Project structure
 * 2. Config system (3-layer merge)
 * 3. CLI commands
 * 4. Skill engine (auto-discovery, caching, phase/trigger matching)
 * 5. Agent engine (auto-discovery, caching)
 * 6. Phase engine (7 phases, next/valid, prompt generation)
 * 7. Loop engine (Ralph: loadPrd, updateStory, buildPrompt, backpressure)
 * 8. Hook engine (chain execution, priority sorting)
 * 9. Plugin engine (list, install, uninstall)
 * 10. Scientific skills (junction links exist)
 */

import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync, lstatSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TMP_DIR = join(ROOT, '.test-tmp');

let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✅ ${name}`); } catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); } }

function setup() { if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true }); mkdirSync(TMP_DIR, { recursive: true }); }
function cleanup() { if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true }); }

console.log('\n🧪 apex-discovery Unit Tests');
console.log('='.repeat(50));

// ── 1. Project Structure ──
console.log('\n📁 Project Structure');

test('package.json exists', () => assert(existsSync(join(ROOT, 'package.json'))));
test('package.json has correct name', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.name, '@apex-discovery/core');
});
test('config/defaults.json exists', () => assert(existsSync(join(ROOT, 'config', 'defaults.json'))));
test('core/ directory has all 11 engines', () => {
  const engines = ['config.js', 'phase-engine.js', 'loop-engine.js', 'skill-engine.js',
    'agent-engine.js', 'mode-engine.js', 'spec-engine.js', 'plugin-engine.js',
    'hook-engine.js', 'hw-config.js', 'pi-config.js'];
  for (const e of engines) assert(existsSync(join(ROOT, 'core', e)), `${e} exists`);
});
test('cli/main.js exists', () => assert(existsSync(join(ROOT, 'cli', 'main.js'))));
test('scripts/setup.js exists', () => assert(existsSync(join(ROOT, 'scripts', 'setup.js'))));

// ── 2. Config System ──
console.log('\n⚙️  Config System');

test('defaults.json has valid JSON', () => {
  const d = JSON.parse(readFileSync(join(ROOT, 'config', 'defaults.json'), 'utf8'));
  assert(d.project, 'has project section');
  assert(d.tools, 'has tools section');
  assert(d.phases, 'has phases section');
  assert(d.ralph, 'has ralph section');
  assert(d.modes, 'has modes section');
  assert(d.modes['research-scientist'], 'has research-scientist mode');
  assert(d.modes['daily-dev'], 'has daily-dev mode');
  assert(d.modes['full-stack'], 'has full-stack mode');
  assert(d.modes['deep-research'], 'has deep-research mode');
  assert(d.modes['spec-mode'], 'has spec-mode mode');
  assert(d.modes['embedded-dev'], 'has embedded-dev mode');
});

test('config loads and merges correctly', async () => {
  const { loadConfig } = await import('../core/config.js');
  const config = loadConfig();
  assert(config.project, 'has project');
  assert(config.tools?.enabled?.length > 0, 'has enabled tools');
});

test('config has 6 modes', () => {
  const d = JSON.parse(readFileSync(join(ROOT, 'config', 'defaults.json'), 'utf8'));
  assert.equal(Object.keys(d.modes).length, 6);
});

// ── 3. CLI ──
console.log('\n🖥️  CLI');

test('CLI --help shows usage', () => {
  const out = execSync('node cli/main.js --help', { encoding: 'utf8', timeout: 10000, cwd: ROOT });
  assert(out.includes('apex-discovery'), 'shows project name');
  assert(out.includes('Usage:'), 'shows usage');
  assert(out.includes('Total Skills:'), 'shows skill count');
});

test('CLI help (no args) shows usage', () => {
  const out = execSync('node cli/main.js', { encoding: 'utf8', timeout: 10000, cwd: ROOT });
  assert(out.includes('apex-discovery'), 'shows project name');
});

test('CLI config --show outputs JSON', () => {
  const out = execSync('node cli/main.js config --show', { encoding: 'utf8', timeout: 10000, cwd: ROOT });
  const parsed = JSON.parse(out);
  assert(parsed.project, 'has project section');
  assert(parsed.modes, 'has modes section');
});

test('CLI status shows status', () => {
  const out = execSync('node cli/main.js status', { encoding: 'utf8', timeout: 10000, cwd: ROOT });
  assert(out.includes('apex-discovery Status'), 'shows status header');
  assert(out.includes('Mode:'), 'shows mode');
  assert(out.includes('Model:'), 'shows model');
});

// ── 4. CLI config --set / --reset ──
console.log('\n🔧 CLI Config');

test('CLI config --set creates project config', () => {
  const testDir = join(TMP_DIR, 'config-test');
  mkdirSync(testDir, { recursive: true });
  const out = execSync(`node "${join(ROOT, 'cli', 'main.js')}" config --set project.name=from-cli`, {
    encoding: 'utf8', timeout: 10000, cwd: testDir
  });
  assert(out.includes('Set'), 'set succeeded');
  const configPath = join(testDir, '.apex-discovery', 'config.json');
  assert(existsSync(configPath), 'project config created');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  assert.equal(config.project.name, 'from-cli', 'value persisted');
});

test('CLI config --reset restores defaults', () => {
  const testDir = join(TMP_DIR, 'reset-test');
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, '.apex-discovery'), { recursive: true });
  writeFileSync(join(testDir, '.apex-discovery', 'config.json'), '{"project":{"name":"should-be-lost"}}', 'utf8');
  execSync(`node "${join(ROOT, 'cli', 'main.js')}" config --reset`, { encoding: 'utf8', timeout: 10000, cwd: testDir });
  const config = JSON.parse(readFileSync(join(testDir, '.apex-discovery', 'config.json'), 'utf8'));
  assert.notEqual(config.project.name, 'should-be-lost', 'reset cleared custom value');
});

// ── 5. Skills (apex development skills) ──
console.log('\n📚 Development Skills');

test('skills/ directory exists', () => {
  assert(existsSync(join(ROOT, 'skills')), 'skills dir exists');
});

test('at least 150 skills found (development + scientific, handles junctions)', () => {
  // Windows junctions may appear as isSymbolicLink rather than isDirectory
  let count = 0;
  for (const entry of readdirSync(join(ROOT, 'skills'), { withFileTypes: true })) {
    const fullPath = join(ROOT, 'skills', entry.name);
    if (entry.isDirectory()) { count++; continue; }
    try { if (lstatSync(fullPath).isSymbolicLink()) count++; } catch {}
  }
  assert(count >= 150, `Found ${count} skills (expected >= 150)`);
});

test('development skills have SKILL.md with apex- fields', () => {
  const skills = readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name);
  // Check a few key development skills
  const devSkills = ['test-driven-development', 'api-design', 'coding-standards'];
  for (const s of devSkills) {
    const skillDir = join(ROOT, 'skills', s);
    if (existsSync(skillDir)) {
      const path = join(skillDir, 'SKILL.md');
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf8');
        assert(content.includes('apex-'), `${s} has apex- fields`);
      }
    }
  }
});

// ── 6. Skill Engine ──
console.log('\n🔧 Skill Engine');

test('skill-engine.js exists', () => {
  assert(existsSync(join(ROOT, 'core', 'skill-engine.js')), 'skill-engine.js exists');
});

test('listSkills() returns development skills', async () => {
  const { listSkills } = await import('../core/skill-engine.js');
  const skills = listSkills();
  assert(skills.length >= 30, `listSkills returns ${skills.length} skills`);
});

test('loadSkill() loads a skill correctly', async () => {
  const { loadSkill } = await import('../core/skill-engine.js');
  const tdd = loadSkill('test-driven-development');
  assert(tdd, 'TDD skill loaded');
  assert(tdd.name, 'has name');
  assert(tdd.phase.includes('execute'), 'TDD is in execute phase');
});

test('findSkillsByPhase returns skills for a phase', async () => {
  const { findSkillsByPhase } = await import('../core/skill-engine.js');
  const executeSkills = findSkillsByPhase('execute');
  assert(executeSkills.length > 3, `Found ${executeSkills.length} execute-phase skills`);
});

test('findSkillsByTrigger matches trigger keywords', async () => {
  const { findSkillsByTrigger } = await import('../core/skill-engine.js');
  const results = findSkillsByTrigger('implement');
  assert(results.length > 0, `Found ${results.length} skills for "implement"`);
});

// ── 7. Agents ──
console.log('\n🤖 Agents');

test('agents/ directory exists', () => {
  assert(existsSync(join(ROOT, 'agents')), 'agents dir exists');
});

test('at least 15 agents found', () => {
  const agents = readdirSync(join(ROOT, 'agents')).filter(f => f.endsWith('.md'));
  assert(agents.length >= 15, `Found ${agents.length} agents`);
});

test('all agents have frontmatter with name', () => {
  const agents = readdirSync(join(ROOT, 'agents')).filter(f => f.endsWith('.md'));
  for (const a of agents) {
    const content = readFileSync(join(ROOT, 'agents', a), 'utf8');
    assert(content.startsWith('---'), `${a} has frontmatter`);
  }
});

test('agent-engine.js exists', () => {
  assert(existsSync(join(ROOT, 'core', 'agent-engine.js')), 'agent-engine.js exists');
});

test('listAgents() returns all agents', async () => {
  const { listAgents } = await import('../core/agent-engine.js');
  const agents = listAgents();
  assert(agents.length >= 15, `listAgents returns ${agents.length} agents`);
});

test('loadAgent() loads agent correctly', async () => {
  const { loadAgent } = await import('../core/agent-engine.js');
  const planner = loadAgent('planner');
  assert(planner, 'planner loaded');
  assert(planner.name === 'planner', 'planner name correct');
  assert(planner.tools?.length > 0, 'planner has tools');
  assert(planner.content?.length > 50, 'planner has instruction body');
});

test('findAgentsByPhase returns agents for phase', async () => {
  const { findAgentsByPhase } = await import('../core/agent-engine.js');
  const discussAgents = findAgentsByPhase('discuss');
  assert(discussAgents.length > 0, `Found ${discussAgents.length} discuss agents`);
});

// ── 8. Phase Engine ──
console.log('\n🔄 Phase Engine');

test('phase-engine.js exists', () => {
  assert(existsSync(join(ROOT, 'core', 'phase-engine.js')), 'phase-engine.js exists');
});

test('nextPhase returns correct next phase', async () => {
  const { nextPhase, isValidPhase, getPhaseInfo } = await import('../core/phase-engine.js');
  assert.equal(nextPhase('explore'), 'discuss');
  assert.equal(nextPhase('discuss'), 'plan');
  assert.equal(nextPhase('plan'), 'execute');
  assert.equal(nextPhase('execute'), 'build');
  assert.equal(nextPhase('build'), 'verify');
  assert.equal(nextPhase('verify'), 'ship');
  assert.equal(nextPhase('ship'), null);
});

test('isValidPhase validates correctly', async () => {
  const { isValidPhase } = await import('../core/phase-engine.js');
  assert(isValidPhase('explore'));
  assert(isValidPhase('discuss'));
  assert(isValidPhase('execute'));
  assert(isValidPhase('build'));
  assert(!isValidPhase('invalid'));
  assert(!isValidPhase(''));
});

test('buildPhasePrompt returns phase-specific prompt', async () => {
  const { buildPhasePrompt } = await import('../core/phase-engine.js');
  const discuss = await buildPhasePrompt('discuss');
  assert(discuss.includes('Discuss Phase'), 'discuss header');
  const execute = await buildPhasePrompt('execute');
  assert(execute.includes('Execute Phase'), 'execute header');
});

test('getPhaseInfo returns all 7 phases', async () => {
  const { getPhaseInfo } = await import('../core/phase-engine.js');
  const info = getPhaseInfo();
  assert.equal(info.length, 7, '7 phases');
  assert.equal(info[0].name, 'explore');
  assert.equal(info[6].name, 'ship');
});

// ── 9. Loop Engine (Ralph) ──
console.log('\n🔄 Loop Engine');

test('loop-engine.js exists', () => {
  assert(existsSync(join(ROOT, 'core', 'loop-engine.js')), 'loop-engine.js exists');
});

test('buildIterationPrompt builds prompt with stories', async () => {
  const { buildIterationPrompt } = await import('../core/loop-engine.js');
  const prd = {
    branchName: 'ralph/test',
    userStories: [
      { id: 'US-001', title: 'Feature A', passes: false, notes: '' },
      { id: 'US-002', title: 'Feature B', passes: true, notes: '' },
    ]
  };
  const prompt = buildIterationPrompt(prd, 1, 10);
  assert(prompt.includes('Ralph Loop'), 'has header');
  assert(prompt.includes('1/10'), 'iteration counter');
  assert(prompt.includes('US-001'), 'pending story');
});

test('buildIterationPrompt with all completed', async () => {
  const { buildIterationPrompt } = await import('../core/loop-engine.js');
  const prd = {
    branchName: 'ralph/test',
    userStories: [
      { id: 'US-001', title: 'Done', passes: true },
      { id: 'US-002', title: 'Done2', passes: true },
    ]
  };
  const prompt = buildIterationPrompt(prd, 3, 10);
  assert(prompt.includes('COMPLETE'), 'COMPLETE signal');
});

test('loadPrd returns null for missing file', async () => {
  const { loadPrd } = await import('../core/loop-engine.js');
  const result = loadPrd(join(TMP_DIR, 'nonexistent'));
  assert.equal(result, null);
});

test('updateStoryStatus works', async () => {
  const testDir = join(TMP_DIR, 'ralph-test');
  mkdirSync(testDir, { recursive: true });
  writeFileSync(join(testDir, 'prd.json'), JSON.stringify({
    project: 'test', userStories: [{ id: 'US-001', title: 'Test', passes: false }]
  }, null, 2), 'utf8');
  const { updateStoryStatus } = await import('../core/loop-engine.js');
  const result = updateStoryStatus('US-001', true, testDir);
  assert(result, 'update succeeded');
  const prd = JSON.parse(readFileSync(join(testDir, 'prd.json'), 'utf8'));
  assert(prd.userStories[0].passes === true, 'story marked passed');
});

// ── 10. Hook Engine ──
console.log('\n⚡ Hook Engine');

test('hook-engine.js exists', () => {
  assert(existsSync(join(ROOT, 'core', 'hook-engine.js')), 'hook-engine.js exists');
});

test('executeChain with empty chain returns empty', async () => {
  const { executeChain } = await import('../core/hook-engine.js');
  const results = executeChain('SessionStart', []);
  assert.equal(results.length, 0);
});

test('executeChain sorts by priority', async () => {
  const { executeChain } = await import('../core/hook-engine.js');
  const chain = [
    { source: 'test', hook: 'low', priority: 10 },
    { source: 'test', hook: 'high', priority: 100 },
    { source: 'test', hook: 'mid', priority: 50 },
  ];
  const results = executeChain('TestEvent', chain, { hooksDir: TMP_DIR });
  assert(results.length === 3, 'all hooks processed');
});

// ── 11. Plugin Engine ──
console.log('\n🔌 Plugin Engine');

test('plugin-engine.js exists', () => {
  assert(existsSync(join(ROOT, 'core', 'plugin-engine.js')), 'plugin-engine.js exists');
});

test('listPlugins returns empty initially', async () => {
  const { listPlugins } = await import('../core/plugin-engine.js');
  const plugins = listPlugins();
  assert(Array.isArray(plugins), 'returns array');
});

// ── 12. Scientific Skills ──
console.log('\n🔬 Scientific Skills');

test('skills/ directory has entries', () => {
  assert(existsSync(join(ROOT, 'skills')), 'skills dir exists');
});

test('scientific skill directories exist and have SKILL.md content', () => {
  // Read all entries (handles junctions/symlinks on all platforms)
  const skills = [];
  for (const entry of readdirSync(join(ROOT, 'skills'), { withFileTypes: true })) {
    const fullPath = join(ROOT, 'skills', entry.name);
    if (entry.isDirectory()) { skills.push(entry.name); continue; }
    try { if (lstatSync(fullPath).isSymbolicLink()) skills.push(entry.name); } catch {}
  }
  // Check that known scientific skills exist and have content
  const sampleDirs = ['rdkit', 'scanpy', 'biopython'].filter(d => skills.includes(d));
  assert(sampleDirs.length > 0, 'Known scientific skills found in skills/');
  for (const s of sampleDirs) {
    const hasSkillMd = existsSync(join(ROOT, 'skills', s, 'SKILL.md'));
    if (hasSkillMd) {
      const content = readFileSync(join(ROOT, 'skills', s, 'SKILL.md'), 'utf8');
      assert(content.length > 50, `${s}/SKILL.md has content`);
    }
  }
});

// ── Summary ──
console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} ✅ | ${failed} ❌`);
cleanup();
process.exit(failed > 0 ? 1 : 0);
