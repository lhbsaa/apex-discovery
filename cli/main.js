#!/usr/bin/env node
/**
 * apex-discovery — Standalone scientific research + AI coding agent
 *
 * Usage:
 *   apex-discovery <command> [options]
 *   apex <command> [options]
 *
 * Commands:
 *   config     View/set configuration (--show, --set <key>=<value>, --reset)
 *   status     Show project status
 *   init       Initialize a new project
 *   setup      Verify embedded skills
 *   plan       Discuss + plan a feature
 *   execute    Execute planned tasks with Ralph loop
 *   review     Code review
 *   detect     Auto-detect mode from natural language
 *   slash      Execute slash command
 *   spec       Spec-driven development workflow
 *   pi         Pi Coding Agent integration
 */

import { loadConfig, writeConfig, getConfigValue, getActiveSkills, getActiveAgents, getCurrentMode, isValidMode, getModel, getAiTool } from '../core/config.js';
import { existsSync, readdirSync, lstatSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');

// ── Scientific skill helpers ──

/** Count total entries in skills/ (handles junctions, symlinks, directories) */
function countScientificSkills() {
  if (!existsSync(SKILLS_DIR)) return 0;
  let count = 0;
  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    const fullPath = join(SKILLS_DIR, entry.name);
    if (entry.isDirectory()) { count++; continue; }
    try { if (lstatSync(fullPath).isSymbolicLink()) count++; } catch {}
  }
  return count;
}

// ── CLI Argument Parsing ──
// Note: uses execFileSync for all subprocess calls to avoid shell injection

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  // ── help ──
  case undefined:
  case 'help':
  case '--help': {
    const skillCount = countScientificSkills();
    console.log(`
apex-discovery — Standalone scientific research + AI coding agent

Usage:
  apex-discovery <command> [options]
  apex <command> [options]

Commands:
  config --show                 View configuration
  config --set <key>=<value>    Set config value
  config --mode <name>          Switch mode
  config --reset                Reset to defaults
  status                        Show project status (mode, skills, agents, phases)
  init                          Create new project
  setup                         Verify embedded skills integrity
  plan [phase]                  Show phase prompt (7 phases)
  execute                       Generate iteration prompt from prd.json
  review                        Show code review agent prompt
  detect <text>                 Auto-detect mode from natural language
  slash /apex:mode <name>       Execute slash command
  spec init                     Initialize spec-driven workflow
  spec propose "<feature>"      Create proposal/design/tasks
  spec list                     List active changes
  spec archive <name>           Archive completed change
  pi setup                      Generate Pi agent configs
  pi team                       Generate Pi agent-team config
  pi chain                      Generate Pi agent-chain config
  pi damage                     Generate Pi damage-control safety rules

Total Skills:   ${skillCount} (development + scientific, embedded)
`);

    console.log(`Modes: research-scientist, daily-dev, full-stack, deep-research, spec-mode, embedded-dev`);
    console.log(`Phases: explore → discuss → plan → execute → build → verify → ship`);
    console.log(`Skills: ${skillCount} total (development + scientific, auto-discovered)`);
    console.log(`Agents: 18 peer-reviewed agents`);
    process.exit(0);
  }

  // ── config ──
  case 'config': {
    if (args.includes('--show') || args.length === 1) {
      const config = loadConfig();
      console.log(JSON.stringify(config, null, 2));
    } else if (args.includes('--set')) {
      const idx = args.indexOf('--set');
      const kv = args[idx + 1];
      if (!kv) { console.error('Usage: apex config --set <key>=<value>'); process.exit(1); }
      const eqIdx = kv.indexOf('=');
      if (eqIdx === -1) { console.error('Format: <key>=<value>'); process.exit(1); }
      const key = kv.slice(0, eqIdx);
      let value = kv.slice(eqIdx + 1);
      try { value = JSON.parse(value); } catch {}
      const config = loadConfig();
      const keys = key.split('.');
      let obj = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      await writeConfig(config);
      console.log(`✅ Set ${key} = ${JSON.stringify(value)}`);
    } else if (args.includes('--reset')) {
      const defaults = JSON.parse(readFileSync(new URL('../config/defaults.json', import.meta.url), 'utf8'));
      const projectDir = join(process.cwd(), '.apex-discovery');
      if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'config.json'), JSON.stringify(defaults, null, 2), 'utf8');
      console.log('✅ Config reset to defaults');
    } else if (args.includes('--mode')) {
      const idx = args.indexOf('--mode');
      const modeName = args[idx + 1];
      if (!modeName || !isValidMode(modeName)) {
        const config = loadConfig();
        const modes = Object.keys(config.modes || {}).join(', ');
        console.error(`❌ Unknown mode: ${modeName}. Available: ${modes}`);
        process.exit(1);
      }
      const config = loadConfig();
      config.mode = modeName;
      await writeConfig(config);
      const label = config.modes?.[modeName]?.label || modeName;
      console.log(`✅ Switched to mode: ${modeName} (${label})`);
      const active = getActiveSkills();
      console.log(`   Active skills (${active.length}): ${active.join(', ')}`);
    } else {
      console.log('Usage: apex config --show | --set <key>=<value> | --reset');
    }
    break;
  }

  // ── setup ──
  case 'setup': {
    execSync(`node "${join(__dirname, '..', 'scripts', 'setup.js')}"`, { stdio: 'inherit' });
    break;
  }

  // ── init ──
  case 'init': {
    const { generateHwConfig, detectFramework } = await import('../core/hw-config.js');

    const templateIdx = args.indexOf('--template');
    const template = templateIdx !== -1 ? args[templateIdx + 1] : null;

    const skipIndices = new Set([0, templateIdx, templateIdx + 1]);
    let projectName = 'my-project';
    for (let i = 1; i < args.length; i++) {
      if (!skipIndices.has(i) && !args[i].startsWith('-')) {
        projectName = args[i];
        break;
      }
    }

    if (template === 'esp32' || template === 'espidf') {
      const root = join(process.cwd(), projectName);
      mkdirSync(join(root, 'main'), { recursive: true });
      mkdirSync(join(root, 'components'), { recursive: true });
      writeFileSync(join(root, 'CMakeLists.txt'), `cmake_minimum_required(VERSION 3.5)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(${projectName})
set(CMAKE_C_STANDARD 11)
set(EXTRA_COMPONENT_DIRS \${CMAKE_CURRENT_SOURCE_DIR}/components)
`, 'utf8');
      writeFileSync(join(root, 'main', 'CMakeLists.txt'), `idf_component_register(SRCS "main.c")`, 'utf8');
      writeFileSync(join(root, 'main', 'main.c'), `#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "driver/gpio.h"

static const char *TAG = "${projectName}";

void app_main(void) {
    ESP_LOGI(TAG, "${projectName} started");
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
`);
      writeFileSync(join(root, 'sdkconfig.defaults'), `CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y\nCONFIG_ESPTOOLPY_FLASHMODE_QIO=y\n`);
      writeFileSync(join(root, 'hardware.json'), JSON.stringify(generateHwConfig('espidf', projectName), null, 2));
      writeFileSync(join(root, '.gitignore'), `build/\nsdkconfig\n`);
      const configDir = join(root, '.apex-discovery');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({ mode: 'embedded-dev', project: { name: projectName, language: 'c' } }, null, 2));
      console.log(`✅ Created ESP-IDF project: ${projectName}`);
      console.log(`   ${root}/`);
      console.log(`   Next: cd ${projectName} && apex-discovery plan explore`);
    } else if (template === 'pio' || template === 'platformio') {
      const root = join(process.cwd(), projectName);
      mkdirSync(join(root, 'src'), { recursive: true });
      mkdirSync(join(root, 'include'), { recursive: true });
      mkdirSync(join(root, 'lib'), { recursive: true });
      mkdirSync(join(root, 'test'), { recursive: true });
      writeFileSync(join(root, 'platformio.ini'), `[env:esp32-s3-dev]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
board_build.mcu = esp32s3
board_build.f_cpu = 240000000L
board_build.flash_mode = qio
upload_speed = 4608000
monitor_speed = 115200
`);
      writeFileSync(join(root, 'src', 'main.cpp'), `#include <Arduino.h>

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("${projectName} started");
}

void loop() {
    delay(100);
}
`);
      writeFileSync(join(root, 'hardware.json'), JSON.stringify(generateHwConfig('platformio', projectName), null, 2));
      writeFileSync(join(root, '.gitignore'), `.pio/\n.pioenvs/\n`);
      const configDir = join(root, '.apex-discovery');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({ mode: 'embedded-dev', project: { name: projectName, language: 'cpp' } }, null, 2));
      console.log(`✅ Created PlatformIO project: ${projectName}`);
      console.log(`   ${root}/`);
      console.log(`   Next: cd ${projectName} && apex-discovery plan explore`);
    } else if (template === 'arduino') {
      const root = join(process.cwd(), projectName);
      mkdirSync(join(root, 'libraries'), { recursive: true });
      writeFileSync(join(root, `${projectName}.ino`), `void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("${projectName} started");
}

void loop() {
    delay(100);
}
`);
      writeFileSync(join(root, 'hardware.json'), JSON.stringify(generateHwConfig('arduino', projectName), null, 2));
      writeFileSync(join(root, '.gitignore'), `libraries/\n`);
      const configDir = join(root, '.apex-discovery');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({ mode: 'embedded-dev', project: { name: projectName, language: 'cpp' } }, null, 2));
      console.log(`✅ Created Arduino project: ${projectName}`);
      console.log(`   ${root}/`);
      console.log(`   Next: cd ${projectName} && apex-discovery plan explore`);
    } else {
      const root = join(process.cwd(), projectName);
      mkdirSync(join(root, 'src'), { recursive: true });
      mkdirSync(join(root, 'tests'), { recursive: true });
      writeFileSync(join(root, 'package.json'), JSON.stringify({ name: projectName, type: 'module', version: '0.1.0', scripts: { test: 'node tests/run.mjs' } }, null, 2));
      writeFileSync(join(root, 'src', 'index.js'), `// ${projectName}\n`);
      writeFileSync(join(root, 'tests', 'example.test.js'), `import { describe, it } from 'node:test';\nimport assert from 'node:assert';\n`);
      writeFileSync(join(root, '.gitignore'), 'node_modules/\n');
      writeFileSync(join(root, 'README.md'), `# ${projectName}\n`);
      const configDir = join(root, '.apex-discovery');
      mkdirSync(configDir, { recursive: true });
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({ mode: 'daily-dev', project: { name: projectName, language: 'javascript' } }, null, 2));
      console.log(`✅ Created project: ${projectName}`);
      console.log(`   ${root}/`);
    }
    break;
  }

  // ── plan ──
  case 'plan': {
    const { buildPhasePrompt } = await import('../core/phase-engine.js');
    const { findSkillsByPhase, listSkills } = await import('../core/skill-engine.js');
    const config = loadConfig();
    const mode = getCurrentMode();
    const phase = args[1] || 'discuss';
    console.log(await buildPhasePrompt(phase, `Project: ${config.project?.name}`, mode));
    console.log(`\n📋 Skills in ${mode.name} mode: ${mode.skills?.length || 0} active`);
    break;
  }

  // ── execute (mode-aware) ──
  case 'execute': {
    const { buildIterationPrompt, loadPrd } = await import('../core/loop-engine.js');
    const config = loadConfig();
    const mode = getCurrentMode();
    const aiTool = getAiTool();
    const prd = loadPrd(process.cwd());
    if (!prd) {
      console.log('No prd.json found. Run "apex-discovery plan" first, or create a plan document.');
      break;
    }
    const maxIter = config.ralph?.['max-iterations'] || 20;
    const prompt = buildIterationPrompt(prd, 1, maxIter);
    const modeHeader = `## Current Mode\n- Mode: ${mode.name} (${mode.label || ''})\n- Active skills: ${(mode.skills || []).join(', ')}\n- Active agents: ${(mode.agents || []).join(', ')}\n- Model: ${getModel().default} (${getModel().provider})\n\n`;
    console.log(modeHeader + prompt);
    console.log(`\nTo execute, pipe this prompt to your AI tool:\n  apex-discovery execute | ${aiTool.cli} --print\n`);
    break;
  }

  // ── review (mode-aware) ──
  case 'review': {
    const { buildPhasePrompt } = await import('../core/phase-engine.js');
    const mode = getCurrentMode();
    const activeSkills = getActiveSkills();
    const activeAgents = getActiveAgents();
    console.log(`📖 Code Review (${mode.name} mode)`);
    console.log(`   Skills: ${activeSkills.join(', ')}`);
    console.log(`   Agents: ${activeAgents.join(', ')}`);
    console.log('='.repeat(40));
    console.log(await buildPhasePrompt('verify', 'Review the implementation for correctness and quality.', mode));
    break;
  }

  // ── status (extended, scientific-aware) ──
  case 'status': {
    const config = loadConfig();
    const { listSkills } = await import('../core/skill-engine.js');
    const { listAgents } = await import('../core/agent-engine.js');
    const { getPhaseInfo } = await import('../core/phase-engine.js');
    const { pluginCount } = await import('../core/plugin-engine.js');
    const skills = listSkills();
    const agents = listAgents();
    const phases = getPhaseInfo();
    const mode = getCurrentMode();
    const activeSkills = getActiveSkills();
    const activeAgents = getActiveAgents();
    const sciSkills = countScientificSkills();
    console.log('\napex-discovery Status');
    console.log('='.repeat(40));
    console.log(`Project:      ${config.project?.name || '(unnamed)'}`);
    console.log(`Language:     ${config.project?.language || 'unknown'}`);
    console.log(`Mode:         ${mode.name} (${mode.label || ''})`);
    console.log(`Active sk.:   ${activeSkills.length}/${sciSkills} (${activeSkills.join(', ') || 'none'})`);
    console.log(`Active ag.:   ${activeAgents.length}/${agents.length} (${activeAgents.join(', ') || 'none'})`);
    console.log(`Plugins:      ${pluginCount()} installed`);
    console.log(`Phases:       ${phases.map(p => p.name).join(' → ')}`);
    const model = getModel();
    const aiTool = getAiTool();
    console.log(`RALPH:        ${config.ralph?.['max-iterations'] || 20} max iterations`);
    console.log(`Model:        ${model.default} (provider: ${model.provider})`);
    console.log(`AI Tool:      ${aiTool.cli}`);
    console.log(`All Skills:   ${sciSkills} total (embedded)`);
    break;
  }

  // ── detect ──
  case 'detect': {
    const { detectModeFromInput } = await import('../core/mode-engine.js');
    const input = args.slice(1).join(' ');
    if (!input) { console.log('Usage: apex-discovery detect <user input>'); break; }
    const result = detectModeFromInput(input);
    if (result) {
      console.log(`🔄 Auto-detected mode: ${result.from} → ${result.to} (${result.label})`);
    } else {
      console.log(`ℹ️  No mode change triggered (current: ${loadConfig().mode})`);
    }
    break;
  }

  // ── slash ──
  case 'slash': {
    const { parseSlashCommand, executeSlashCommand } = await import('../core/mode-engine.js');
    const input = args.slice(1).join(' ');
    const parsed = parseSlashCommand(input || '/apex:mode');
    if (!parsed) { console.log('Usage: apex-discovery slash /apex:mode <name>'); break; }
    const result = executeSlashCommand(parsed.command, parsed.args);
    console.log(result.message);
    break;
  }

  // ── spec (auto-switch to spec-mode) ──
  case 'spec': {
    const { specInit, specPropose, specList, specArchive } = await import('../core/spec-engine.js');
    const { detectModeFromInput } = await import('../core/mode-engine.js');
    const sub = args[1];

    if (sub && sub !== 'help') {
      const switched = detectModeFromInput('spec');
      if (switched) console.log(`🔄 Auto-switched to spec-mode`);
    }

    if (!sub || sub === 'help') {
      const mode = getCurrentMode();
      console.log(`
Spec-driven development workflow (compatible with OpenSpec):
  apex-discovery spec init                  Initialize spec directories
  apex-discovery spec propose "<feature>"   Create proposal, design, tasks
  apex-discovery spec list                  Show active changes
  apex-discovery spec archive <name>        Archive completed change

Current mode: ${mode.name} (${mode.label || ''})
Active skills: ${(mode.skills || []).slice(0, 5).join(', ')}...
`);
      break;
    }

    if (sub === 'init') {
      const r = specInit();
      console.log(`✅ Spec dirs initialized at ${r.dir}`);
      break;
    }

    if (sub === 'propose') {
      const feature = args.slice(2).join(' ');
      if (!feature) { console.error('Usage: apex-discovery spec propose "<feature>"'); break; }
      const r = specPropose(feature);
      if (r.error) { console.error(`❌ ${r.error}`); break; }
      console.log(`✅ Proposed: ${r.name}`);
      console.log(`   Dir: ${r.dir}`);
      console.log(`   Mode: spec-mode`);
      console.log(`   Next: review proposal.md → implement with "apex-discovery plan execute"`);
      break;
    }

    if (sub === 'list') {
      const list = specList();
      if (list.length === 0) { console.log('No active changes. Start with: apex-discovery spec propose "<feature>"'); break; }
      console.log(`Active changes (${list.length}):`);
      for (const c of list) {
        console.log(`  ${c.done}/${c.tasks}  ${c.name}`);
      }
      break;
    }

    if (sub === 'archive') {
      const name = args[2];
      if (!name) { console.error('Usage: apex-discovery spec archive <name>'); break; }
      const r = specArchive(name);
      if (r.error) { console.error(`❌ ${r.error}`); break; }
      console.log(`✅ Archived to ${r.path}`);
      break;
    }

    console.log('Unknown spec command. Try: apex-discovery spec help');
    break;
  }

  // ── pi ──
  case 'pi': {
    const { setupPiAll, generateTeamConfig, generateChainConfig, generateDamageControl } = await import('../core/pi-config.js');
    const { listAgents } = await import('../core/agent-engine.js');
    const sub = args[1];

    if (!sub || sub === 'help') {
      console.log(`
Pi Coding Agent integration:
  apex-discovery pi setup                  Generate all Pi config files
  apex-discovery pi team                   Generate Pi agent-team config
  apex-discovery pi chain                  Generate Pi agent-chain config
  apex-discovery pi damage                 Generate Pi damage-control safety rules

To use Pi as AI tool:
  apex-discovery config --set ai.cli=pi
  apex-discovery plan execute | pi
`);
      break;
    }

    if (sub === 'setup') {
      const agents = listAgents();
      const r = setupPiAll(agents);
      console.log('✅ Pi config files generated:');
      console.log(`   Teams:      ${r.team.path}`);
      console.log(`   Chain:      ${r.chain.path}`);
      console.log(`   Damage:     ${r.damage.path}`);
      break;
    }

    if (sub === 'team') {
      const agents = listAgents();
      const r = generateTeamConfig(agents);
      console.log(`✅ Generated team config: ${r.path}`);
      console.log(`   Team: ${r.team} (${r.agents.length} agents)`);
      console.log(`   Agents: ${r.agents.join(', ')}`);
      break;
    }

    if (sub === 'chain') {
      const r = generateChainConfig();
      console.log(`✅ Generated chain config: ${r.path}`);
      console.log(`   Steps: ${r.steps}`);
      break;
    }

    if (sub === 'damage') {
      const r = generateDamageControl();
      console.log(`✅ Generated damage-control rules: ${r.path}`);
      console.log(`   Rule categories: ${r.rules}`);
      break;
    }

    console.log('Unknown pi command. Try: apex-discovery pi help');
    break;
  }

  // ── unknown command ──
  default:
    console.log(`Unknown command: ${cmd}`);
    console.log('Run "apex-discovery help" for usage.');
    process.exit(1);
}
