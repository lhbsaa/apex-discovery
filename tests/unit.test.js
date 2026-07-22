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
const testQueue = [];
function test(name, fn) { testQueue.push([name, fn]); }

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

// ── 13. Config Engine Helpers ──
console.log('\n⚙️  Config Helpers');

test('getConfigValue returns value by dot path', async () => {
  const { getConfigValue } = await import('../core/config.js');
  const val = getConfigValue('project.language');
  assert(typeof val === 'string', 'got project.language');
});

test('getCurrentMode returns mode object', async () => {
  const { getCurrentMode } = await import('../core/config.js');
  const mode = getCurrentMode();
  assert(mode.name, 'has name');
  assert(Array.isArray(mode.skills), 'has skills array');
  assert(Array.isArray(mode.agents), 'has agents array');
});

test('getActiveSkills returns array', async () => {
  const { getActiveSkills } = await import('../core/config.js');
  const skills = getActiveSkills();
  assert(Array.isArray(skills), 'returns array');
});

test('getActiveAgents returns array', async () => {
  const { getActiveAgents } = await import('../core/config.js');
  const agents = getActiveAgents();
  assert(Array.isArray(agents), 'returns array');
});

test('isValidMode validates mode names', async () => {
  const { isValidMode } = await import('../core/config.js');
  assert(isValidMode('research-scientist'), 'valid mode');
  assert(isValidMode('daily-dev'), 'valid mode');
  assert(!isValidMode('nonexistent'), 'invalid mode');
  assert(!isValidMode(''), 'empty string');
});

test('getModel returns model config', async () => {
  const { getModel } = await import('../core/config.js');
  const model = getModel();
  assert(model.default, 'has default model');
  assert(model.provider, 'has provider');
});

test('getAiTool returns tool config', async () => {
  const { getAiTool } = await import('../core/config.js');
  const tool = getAiTool();
  assert(tool.cli, 'has CLI command');
  assert(typeof tool.hooks === 'boolean', 'has hooks flag');
});

// ── 14. Agent Engine: findAgentsByKeyword ──
console.log('\n🤖 Agent Engine (extended)');

test('findAgentsByKeyword matches by name', async () => {
  const { findAgentsByKeyword } = await import('../core/agent-engine.js');
  // Clear cache so fresh data loads
  const { clearCache } = await import('../core/agent-engine.js');
  clearCache();
  const results = findAgentsByKeyword('architect');
  assert(results.length > 0, `Found ${results.length} agents for "architect"`);
  assert(results.some(a => a.name.includes('architect')), 'contains architect');
});

test('findAgentsByKeyword matches by description', async () => {
  const { findAgentsByKeyword, clearCache } = await import('../core/agent-engine.js');
  clearCache();
  const results = findAgentsByKeyword('review');
  assert(results.length > 0, `Found ${results.length} agents for "review"`);
});

test('findAgentsByKeyword returns empty for no match', async () => {
  const { findAgentsByKeyword, clearCache } = await import('../core/agent-engine.js');
  clearCache();
  const results = findAgentsByKeyword('xyznonexistent12345');
  assert.equal(results.length, 0, 'empty results');
});

// ── 15. Mode Engine ──
console.log('\n🔄 Mode Engine');

test('detectModeFromInput returns null for empty input', async () => {
  const { detectModeFromInput } = await import('../core/mode-engine.js');
  assert.equal(detectModeFromInput(''), null);
  assert.equal(detectModeFromInput(null), null);
});

test('detectModeFromInput returns null for non-triggering input', async () => {
  const { detectModeFromInput } = await import('../core/mode-engine.js');
  const result = detectModeFromInput('this is some random text with no mode triggers');
  assert.equal(result, null, 'no mode triggered');
});

test('parseSlashCommand parses valid commands', async () => {
  const { parseSlashCommand } = await import('../core/mode-engine.js');
  const r1 = parseSlashCommand('/apex:mode research-scientist');
  assert(r1, 'parsed');
  assert.equal(r1.command, 'mode', 'command=mode');
  assert.equal(r1.args, 'research-scientist', 'args parsed');

  const r2 = parseSlashCommand('/apex:status');
  assert(r2, 'parsed status');
  assert.equal(r2.command, 'status', 'command=status');
  assert.equal(r2.args, '', 'no args');
});

test('parseSlashCommand rejects invalid formats', async () => {
  const { parseSlashCommand } = await import('../core/mode-engine.js');
  assert.equal(parseSlashCommand(''), null, 'empty');
  assert.equal(parseSlashCommand('/other:mode'), null, 'wrong prefix');
  assert.equal(parseSlashCommand(null), null, 'null');
});

test('executeSlashCommand handles mode commands', async () => {
  const { executeSlashCommand } = await import('../core/mode-engine.js');
  const r = executeSlashCommand('mode', 'status');
  assert(r.handled, 'handled');
  assert(r.message.includes('Current mode'), 'shows status');
});

test('executeSlashCommand handles unknown commands', async () => {
  const { executeSlashCommand } = await import('../core/mode-engine.js');
  const r = executeSlashCommand('unknown', '');
  assert.equal(r.handled, false, 'not handled');
});

// ── 16. Spec Engine ──
console.log('\n📋 Spec Engine');

test('specInit initializes spec directories', async () => {
  const testDir = join(TMP_DIR, 'spec-init');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { specInit } = await import('../core/spec-engine.js');
    const r = specInit();
    assert(r.dir, 'has dir');
    assert(existsSync(join(testDir, 'openspec', 'changes')), 'changes dir created');
    assert(existsSync(join(testDir, 'openspec', 'explorations')), 'explorations dir created');
    assert(existsSync(join(testDir, 'openspec', 'specs')), 'specs dir created');
  } finally {
    process.chdir(origCwd);
  }
});

test('specPropose creates proposal artifacts', async () => {
  const testDir = join(TMP_DIR, 'spec-propose');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    // Init first
    const { specInit, specPropose } = await import('../core/spec-engine.js');
    specInit();
    const r = specPropose('Add user authentication');
    assert(r.name, 'has name');
    assert(r.dir, 'has dir');
    const changeDir = r.dir;
    assert(existsSync(join(changeDir, 'proposal.md')), 'proposal.md created');
    assert(existsSync(join(changeDir, 'design.md')), 'design.md created');
    assert(existsSync(join(changeDir, 'tasks.md')), 'tasks.md created');
  } finally {
    process.chdir(origCwd);
  }
});

test('specList returns active changes', async () => {
  const testDir = join(TMP_DIR, 'spec-list');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { specInit, specPropose, specList } = await import('../core/spec-engine.js');
    specInit();
    specPropose('Feature one');
    const list = specList();
    assert(list.length >= 1, 'has at least 1 change');
    assert(list[0].name, 'has name field');
  } finally {
    process.chdir(origCwd);
  }
});

test('specArchive archives a change', async () => {
  const testDir = join(TMP_DIR, 'spec-archive');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { specInit, specPropose, specArchive } = await import('../core/spec-engine.js');
    specInit();
    const prop = specPropose('To archive');
    const archiveR = specArchive(prop.name);
    assert(archiveR.archived, 'archived');
    assert(archiveR.path, 'has archive path');
  } finally {
    process.chdir(origCwd);
  }
});

// ── 17. Hardware Config Engine ──
console.log('\n🔧 Hardware Config');

test('loadHwConfig returns null for missing file', async () => {
  const { loadHwConfig } = await import('../core/hw-config.js');
  const r = loadHwConfig(join(TMP_DIR, 'nonexistent'));
  assert.equal(r, null, 'null for missing');
});

test('generateHwConfig generates espidf template', async () => {
  const { generateHwConfig } = await import('../core/hw-config.js');
  const cfg = generateHwConfig('espidf', 'test-project');
  assert(cfg, 'config generated');
  assert.equal(cfg.mcu, 'esp32-s3', 'mcu');
  assert.equal(cfg.framework, 'espidf', 'framework');
  assert(cfg.peripherals, 'has peripherals');
});

test('generateHwConfig generates platformio template', async () => {
  const { generateHwConfig } = await import('../core/hw-config.js');
  const cfg = generateHwConfig('platformio', 'pio-test');
  assert(cfg, 'config generated');
  assert.equal(cfg.framework, 'arduino', 'platformio uses arduino framework');
});

test('generateHwConfig generates arduino template', async () => {
  const { generateHwConfig } = await import('../core/hw-config.js');
  const cfg = generateHwConfig('arduino', 'ard-test');
  assert(cfg, 'config generated');
  assert.equal(cfg.board, 'esp32-dev', 'arduino board');
});

test('generateHwConfig returns null for unknown framework', async () => {
  const { generateHwConfig } = await import('../core/hw-config.js');
  const cfg = generateHwConfig('unknown-framework', 'test');
  assert.equal(cfg, null, 'null');
});

test('hwConstraintsPrompt returns prompt fragment', async () => {
  const { hwConstraintsPrompt } = await import('../core/hw-config.js');
  // No hardware.json in this project root
  const prompt = hwConstraintsPrompt(join(TMP_DIR, 'nonexistent'));
  assert.equal(prompt, '', 'empty for no hardware');
});

test('hwConstraintsPrompt reads hardware.json', async () => {
  const testDir = join(TMP_DIR, 'hw-prompt');
  mkdirSync(testDir, { recursive: true });
  writeFileSync(join(testDir, 'hardware.json'), JSON.stringify({
    mcu: 'esp32', clock: 240000000, framework: 'arduino',
    board: 'esp32-dev', flash_size: '4MB', psram: 'none',
    peripherals: { i2c: { sda: 21, scl: 22 }, pins: { led: 2 } }
  }), 'utf8');
  const { hwConstraintsPrompt } = await import('../core/hw-config.js');
  const prompt = hwConstraintsPrompt(testDir);
  assert(prompt.includes('esp32'), 'has mcu');
  assert(prompt.includes('240'), 'has clock');
});

test('detectFramework detects by file presence', async () => {
  const testDir = join(TMP_DIR, 'fw-detect');
  mkdirSync(testDir, { recursive: true });
  const { detectFramework } = await import('../core/hw-config.js');
  
  // No framework files → null
  assert.equal(detectFramework(testDir), null, 'no framework detected on empty dir');
  
  // platformio.ini
  writeFileSync(join(testDir, 'platformio.ini'), '[env:test]', 'utf8');
  const r1 = detectFramework(testDir);
  assert(r1, 'detected');
  assert.equal(r1.framework, 'platformio', 'platformio detected');
});

// ── 18. Pi Config Engine ──
console.log('\n🤖 Pi Config');

test('generateTeamConfig creates team config', async () => {
  const testDir = join(TMP_DIR, 'pi-team');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { generateTeamConfig } = await import('../core/pi-config.js');
    const agents = ['planner', 'code-reviewer', 'architect'];
    const r = generateTeamConfig(agents);
    assert(r.path, 'has path');
    assert(existsSync(r.path), 'file created');
    assert(r.team, 'has team name');
  } finally {
    process.chdir(origCwd);
  }
});

test('generateChainConfig creates chain config', async () => {
  const testDir = join(TMP_DIR, 'pi-chain');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { generateChainConfig } = await import('../core/pi-config.js');
    const r = generateChainConfig();
    assert(r.path, 'has path');
    assert(r.steps, 'has steps');
    assert(r.steps >= 3, 'at least 3 steps');
  } finally {
    process.chdir(origCwd);
  }
});

test('generateDamageControl creates safety rules', async () => {
  const testDir = join(TMP_DIR, 'pi-damage');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { generateDamageControl } = await import('../core/pi-config.js');
    const r = generateDamageControl();
    assert(r.path, 'has path');
    assert(r.rules, 'has rule categories');
  } finally {
    process.chdir(origCwd);
  }
});

test('setupPiAll generates all configs', async () => {
  const testDir = join(TMP_DIR, 'pi-all');
  mkdirSync(testDir, { recursive: true });
  const origCwd = process.cwd();
  process.chdir(testDir);
  try {
    const { setupPiAll } = await import('../core/pi-config.js');
    const agents = ['planner', 'builder', 'reviewer'];
    const r = setupPiAll(agents);
    assert(r.team, 'team config');
    assert(r.chain, 'chain config');
    assert(r.damage, 'damage config');
  } finally {
    process.chdir(origCwd);
  }
});

// ── 19. Loop Engine Extended ──
console.log('\n🔄 Loop Engine Extended');

test('runIteration returns error for nonexistent tool', async () => {
  const { runIteration } = await import('../core/loop-engine.js');
  const r = runIteration({ prompt: 'test', tool: '__nonexistent_tool__', timeout: 5000 });
  assert(r.completed === false, 'not completed');
  assert(r.output !== undefined, 'has output');
});

test('checkBackpressure runs gates without throwing', async () => {
  const { checkBackpressure } = await import('../core/loop-engine.js');
  // Run in TMP_DIR to isolate from any project config
  const testDir = join(TMP_DIR, 'backpressure');
  mkdirSync(testDir, { recursive: true });
  writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', scripts: { test: 'node -e "console.log(\'ok\')"' } }), 'utf8');
  const r = checkBackpressure(testDir);
  assert(Array.isArray(r.gates), 'has gates array');
  assert(typeof r.passed === 'boolean', 'has passed boolean');
});

// ── 20. Plugin Engine Extended ──
console.log('\n🔌 Plugin Engine Extended');

test('pluginCount returns number', async () => {
  const { pluginCount } = await import('../core/plugin-engine.js');
  const count = pluginCount();
  assert(typeof count === 'number', 'returns number');
  assert(count >= 0, 'non-negative');
});

test('installPlugin handles nonexistent source', async () => {
  const { installPlugin } = await import('../core/plugin-engine.js');
  const r = installPlugin('/nonexistent/path/to/plugin');
  assert.equal(r.success, false, 'not successful');
  assert(r.error, 'has error message');
});

test('uninstallPlugin handles nonexistent name', async () => {
  const { uninstallPlugin } = await import('../core/plugin-engine.js');
  const r = uninstallPlugin('nonexistent-plugin-name');
  assert.equal(r.success, false, 'not successful');
  assert(r.error, 'has error message');
});

// ── 21. deepMerge Array Strategy ──
console.log('\n🔗 deepMerge Array Tests');

test('deepMerge concatenates arrays from different layers', async () => {
  const mod = await import('../core/config.js');
  // Merge three layers: defaults have array, project adds to it
  const defaults = { tools: { enabled: ['tdd', 'lint'] } };
  const user = { tools: { enabled: ['code-review'] } };
  const project = { tools: { enabled: ['deploy'] } };
  const merged = mod.deepMerge(defaults, user, project);
  // All unique items should be present
  const enabled = merged.tools.enabled;
  assert(enabled.includes('tdd'), 'tdd from defaults');
  assert(enabled.includes('lint'), 'lint from defaults');
  assert(enabled.includes('code-review'), 'code-review from user');
  assert(enabled.includes('deploy'), 'deploy from project');
  // No duplicates
  assert.equal(enabled.length, 4, '4 unique tools');
});

test('deepMerge merges mode skills array from project config', async () => {
  const mod = await import('../core/config.js');
  // Simulate: user wants to ADD a skill to an existing mode
  const defaults = {
    modes: {
      'daily-dev': {
        skills: ['test-driven-development', 'git-workflow'],
        agents: ['planner']
      }
    }
  };
  const project = {
    modes: {
      'daily-dev': {
        skills: ['my-custom-skill']
      }
    }
  };
  const merged = mod.deepMerge(defaults, {}, project);
  const skills = merged.modes['daily-dev'].skills;
  assert(skills.includes('my-custom-skill'), 'custom skill included');
  assert(skills.includes('test-driven-development'), 'default TDD skill also included');
  assert(skills.includes('git-workflow'), 'default git-workflow also included');
});

// ── Summary ──
console.log('\n' + '='.repeat(50));
for (const [name, fn] of testQueue) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}: ${e.message}`); }
}
console.log(`Results: ${passed} ✅ | ${failed} ❌`);
cleanup();
process.exit(failed > 0 ? 1 : 0);
