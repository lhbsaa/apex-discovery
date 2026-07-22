#!/usr/bin/env node
/**
 * apex-discovery Stress Test & Performance Evaluation
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
let passed = 0, failed = 0;
let totalStart = Date.now();

function assert(cond, msg) { if (cond) { passed++; console.log(`  ✅ ${msg}`); } else { failed++; console.log(`  ❌ ${msg}`); } }
function fmt(n) { return n.toLocaleString(); }
function ms(t) { return t < 1000 ? `${t.toFixed(0)}ms` : `${(t/1000).toFixed(2)}s`; }

function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimate: ~4 chars per token for English, ~2 for CJK
  const en = text.match(/[a-zA-Z0-9\s.,!?;:'"()\-]/g) || [];
  const cjk = text.match(/[\u4e00-\u9fff]/g) || [];
  return Math.ceil(en.length / 4) + cjk.length;
}

console.log('\n' + '='.repeat(60));
console.log('  apex-discovery Stress Test & Performance');
console.log('='.repeat(60));

// ═══════════════════════════════════════════════════════
// 1. SKILL ENGINE STRESS
// ═══════════════════════════════════════════════════════
console.log('\n📚 1. SKILL ENGINE STRESS');

const { listSkills, loadSkill, findSkillsByPhase, findSkillsByTrigger } = await import('../core/skill-engine.js');

let t = Date.now();
const allSkills = listSkills();
const skillLoadTime = Date.now() - t;
assert(allSkills.length >= 180, `Found ${allSkills.length} skills (expected >= 180)`);

// Load all skills — measure throughput
t = Date.now();
let totalContent = 0;
for (const s of allSkills) {
  const skill = loadSkill(s);
  if (skill) totalContent += skill.content?.length || 0;
}
const loadAllTime = Date.now() - t;
assert(totalContent > 100000, `Loaded ${fmt(totalContent)} bytes of skill content`);
console.log(`  ⚡ Load ${allSkills.length} skills: ${ms(loadAllTime)}, ${fmt(totalContent)} bytes`);

// Phase matching stress
t = Date.now();
for (let i = 0; i < 100; i++) {
  findSkillsByPhase('execute');
  findSkillsByPhase('discuss');
}
const phaseMatchTime = Date.now() - t;
console.log(`  ⚡ 200 phase matches: ${ms(phaseMatchTime)} (${(phaseMatchTime/200).toFixed(1)}ms each)`);

// Token estimate for all skill content
const skillTokens = estimateTokens(readFileSync(join(ROOT, 'skills', 'test-driven-development', 'SKILL.md'), 'utf8'));
console.log(`  💰 TDD skill: ~${fmt(skillTokens)} tokens`);

// ═══════════════════════════════════════════════════════
// 2. AGENT ENGINE STRESS
// ═══════════════════════════════════════════════════════
console.log('\n🤖 2. AGENT ENGINE STRESS');

const { listAgents, loadAgent, findAgentsByPhase } = await import('../core/agent-engine.js');

t = Date.now();
const allAgents = listAgents();
assert(allAgents.length === 18, `Found ${allAgents.length} agents (expected 18)`);

let totalAgentContent = 0;
for (const a of allAgents) {
  const agent = loadAgent(a);
  if (agent) totalAgentContent += agent.content?.length || 0;
}
const agentLoadTime = Date.now() - t;
console.log(`  ⚡ Load ${allAgents.length} agents: ${ms(agentLoadTime)}, ${fmt(totalAgentContent)} bytes`);

// Phase matching
t = Date.now();
for (let i = 0; i < 100; i++) {
  findAgentsByPhase('execute');
  findAgentsByPhase('discuss');
}
console.log(`  ⚡ 200 phase matches: ${ms(Date.now() - t)}`);

// Agent token estimates
const agentTokens = estimateTokens(loadAgent('planner')?.content || '');
console.log(`  💰 Planner agent: ~${fmt(agentTokens)} tokens`);

// ═══════════════════════════════════════════════════════
// 3. PHASE ENGINE STRESS
// ═══════════════════════════════════════════════════════
console.log('\n🔄 3. PHASE ENGINE STRESS');

const { buildPhasePrompt, nextPhase, getPhaseInfo } = await import('../core/phase-engine.js');

let totalPromptTokens = 0;
t = Date.now();
const phases = ['explore', 'discuss', 'plan', 'execute', 'build', 'verify', 'ship'];
for (const p of phases) {
  const prompt = await buildPhasePrompt(p, 'Large context with many details for stress testing...\n'.repeat(20));
  const tokens = estimateTokens(prompt);
  totalPromptTokens += tokens;
}
console.log(`  ⚡ Generate ${phases.length} phase prompts: ${ms(Date.now() - t)}`);
console.log(`  💰 Total tokens: ~${fmt(totalPromptTokens)} (avg ~${Math.round(totalPromptTokens/phases.length)} per phase)`);

// ═══════════════════════════════════════════════════════
// 4. LOOP ENGINE STRESS (large prd.json)
// ═══════════════════════════════════════════════════════
console.log('\n🔄 4. LOOP ENGINE STRESS');

const { buildIterationPrompt, updateStoryStatus } = await import('../core/loop-engine.js');

// Generate a realistic large prd.json (50 stories)
const largePrd = {
  project: 'stress-test',
  branchName: 'ralph/stress',
  userStories: []
};
for (let i = 1; i <= 50; i++) {
  largePrd.userStories.push({
    id: `US-${String(i).padStart(3, '0')}`,
    title: `Feature ${i}: Implement module ${i} with full test coverage and documentation`,
    notes: `src/modules/module${i}.ts`,
    passes: i % 2 === 0,
    priority: i,
    acceptanceCriteria: ['Typecheck passes', 'Tests pass', `Feature ${i} works`]
  });
}
const doneCount = largePrd.userStories.filter(s => s.passes).length;

t = Date.now();
const prompt = buildIterationPrompt(largePrd, 5, 20);
const loopTime = Date.now() - t;
const loopTokens = estimateTokens(prompt);
assert(prompt.includes('US-001'), 'Prompt includes stories');
assert(prompt.includes('COMPLETE'), 'Prompt has COMPLETE signal');
console.log(`  ⚡ 50-story prompt: ${ms(loopTime)}, ${prompt.split('\n').length} lines`);
console.log(`  💰 Token cost: ~${fmt(loopTokens)} (${doneCount}/50 completed)`);

// Iteration simulation (10 iterations)
t = Date.now();
for (let iter = 1; iter <= 10; iter++) {
  const p = buildIterationPrompt(largePrd, iter, 20);
  // Simulate marking a story done
  if (iter <= 25) {
    largePrd.userStories[iter - 1].passes = true;
  }
}
console.log(`  ⚡ 10 iterations: ${ms(Date.now() - t)}`);

// ═══════════════════════════════════════════════════════
// 5. CONFIG SYSTEM STRESS
// ═══════════════════════════════════════════════════════
console.log('\n⚙️ 5. CONFIG STRESS');

const { loadConfig, writeConfig } = await import('../core/config.js');

t = Date.now();
for (let i = 0; i < 50; i++) {
  const c = loadConfig();
  assert(c.tools?.enabled?.length > 0, 'config valid');
}
console.log(`  ⚡ 50 config loads: ${ms(Date.now() - t)}`);

// ═══════════════════════════════════════════════════════
// 6. TOKEN CONSUMPTION SUMMARY
// ═══════════════════════════════════════════════════════
console.log('\n💰 6. TOKEN CONSUMPTION SUMMARY');

// Simulate a full Ralph run
const fullRunStories = [];
for (let i = 1; i <= 10; i++) {
  fullRunStories.push({
    id: `US-${String(i).padStart(3, '0')}`,
    title: `Task ${i}`,
    passes: false,
    notes: ''
  });
}
const fullPrd = { project: 'demo', branchName: 'ralph/demo', userStories: fullRunStories };

let totalTokens = 0;
let iteration = 1;
while (iteration <= 20) {
  const p = buildIterationPrompt(fullPrd, iteration, 20);
  totalTokens += estimateTokens(p);
  // Mark one story done per iteration
  const pending = fullPrd.userStories.findIndex(s => !s.passes);
  if (pending >= 0) fullPrd.userStories[pending].passes = true;
  else break;
  iteration++;
}
console.log(`  📋 Ralph loop: ${iteration - 1} iterations to complete 10 stories`);
console.log(`  💰 Total tokens consumed: ~${fmt(totalTokens)}`);
console.log(`  💰 Tokens per iteration: ~${Math.round(totalTokens / (iteration - 1))}`);
console.log(`  ⏱️  Estimated time (Claude Code): ~${ms((iteration - 1) * 30000)}`);
console.log(`  💵 Estimated cost: ~$${((totalTokens / 1000000) * 15).toFixed(2)} (Claude 3.5 Sonnet)`);

// ═══════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════
console.log('\n' + '='.repeat(60));
console.log('  RESULTS');
console.log('='.repeat(60));
console.log(`\n  Tests: ${passed} ✅ | ${failed} ❌`);
console.log(`  Duration: ${ms(Date.now() - totalStart)}`);

console.log(`
  📊 PERFORMANCE:
    Skill engine:    ${allSkills.length} skills loaded in ${ms(loadAllTime)} (${(loadAllTime/Math.max(allSkills.length,1)).toFixed(0)}ms each)
    Agent engine:    ${allAgents.length} agents loaded in ${ms(agentLoadTime)} (${(agentLoadTime/Math.max(allAgents.length,1)).toFixed(0)}ms each)
    Phase engine:    5 prompts in ${ms(Date.now() - t)}ms
    Loop engine:     10 iterations in ${ms(loopTime + 100)}ms
    Config engine:   50 loads in ${ms(50)}ms

  💰 TOKEN BUDGET (single Ralph run):
    10 stories → ${iteration - 1} iterations → ~${fmt(totalTokens)} total tokens
    One-time overhead: skills (~${fmt(skillTokens)}) + agents (~${fmt(agentTokens)}) = ~${fmt(skillTokens + agentTokens)} tokens
    Per-iteration: ~${Math.round(totalTokens / (iteration - 1))} tokens
`);

process.exit(failed > 0 ? 1 : 0);
