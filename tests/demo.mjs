#!/usr/bin/env node
/**
 * apex-unified End-to-End Demo
 */

import { loadConfig } from '../core/config.js';
import { listSkills, loadSkill, findSkillsByPhase, findSkillsByTrigger } from '../core/skill-engine.js';
import { listAgents, loadAgent, findAgentsByPhase } from '../core/agent-engine.js';
import { nextPhase, isValidPhase, buildPhasePrompt, getPhaseInfo } from '../core/phase-engine.js';
import { buildIterationPrompt, updateStoryStatus } from '../core/loop-engine.js';
import { pluginCount } from '../core/plugin-engine.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

console.log('\n' + '='.repeat(60));
console.log('  apex-unified End-to-End Demo');
console.log('='.repeat(60));

// 1. Config
console.log('\n📋 CONFIG SYSTEM');
const config = loadConfig();
console.log(`  Tools enabled:    ${config.tools.enabled.join(', ')}`);
console.log(`  RALPH iterations: ${config.ralph['max-iterations']}`);
console.log(`  Phases:           ${Object.keys(config.phases).join(', ')}`);

// 2. Skills
console.log('\n📚 SKILL ENGINE');
const allSkills = listSkills();
console.log(`  Total skills:     ${allSkills.length}`);

const tdd = loadSkill('test-driven-development');
console.log(`  TDD category:     ${tdd.category}`);
console.log(`  TDD phases:       ${tdd.phase.join(', ')}`);

const executeSkls = findSkillsByPhase('execute');
console.log(`  Execute skills:   ${executeSkls.length}`);

const matched = findSkillsByTrigger('implement');
console.log(`  Trigger matches:  ${matched.length}`);

// 3. Agents
console.log('\n🤖 AGENT ENGINE');
const allAgents = listAgents();
console.log(`  Total agents:     ${allAgents.length}`);

const planner = loadAgent('planner');
console.log(`  Planner tools:    ${planner.tools.join(', ')}`);
console.log(`  Planner model:    ${planner.model}`);

const discAgents = findAgentsByPhase('discuss');
console.log(`  Discuss agents:   ${discAgents.length}`);

// 4. Phase Engine
console.log('\n🔄 PHASE ENGINE');
const phases = getPhaseInfo();
console.log(`  Workflow:         ${phases.map(p => p.name).join(' → ')}`);
console.log(`  After plan:       ${nextPhase('plan')}`);
console.log(`  After ship:       ${nextPhase('ship')}`);
console.log(`  All valid:        ${['discuss','plan','execute','verify','ship'].every(isValidPhase)}`);

// 5. Loop Engine
console.log('\n🔄 LOOP ENGINE');
const demoPrd = {
  branchName: 'ralph/demo',
  userStories: [
    { id: 'US-001', title: 'Setup project', passes: true },
    { id: 'US-002', title: 'Implement auth', passes: false },
  ]
};
const prompt = buildIterationPrompt(demoPrd, 1, 10);
const promptLines = prompt.split('\n').length;
console.log(`  Prompt lines:     ${promptLines}`);
console.log(`  Contains TASK:    ${prompt.includes('US-002')}`);
console.log(`  Has COMPLETE?:    ${prompt.includes('COMPLETE')}`);

// 6. Plugins
console.log('\n🔌 PLUGIN ENGINE');
console.log(`  Plugins:          ${pluginCount()}`);

console.log('\n' + '='.repeat(60));
console.log('  ✅ FULL DEMO PASSED');
console.log('='.repeat(60));
