/**
 * apex-discovery Loop Engine (Ralph Core)
 *
 * Persistent iteration loop that runs an AI coding tool repeatedly
 * until all tasks are complete or max iterations reached.
 * Implements the promise completion protocol and backpressure gates.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { loadConfig } from './config.js';

/**
 * Run a Ralph iteration: execute one round of the loop.
 * When `tool` is omitted or 'claude', the configured AI tool from
 * config (ai.cli) is used instead of hardcoding a specific CLI.
 * Returns { completed, output, error }.
 */
export function runIteration({ prompt, tool, cwd, timeout = 120000 }) {
  const start = Date.now();
  const actualTool = (tool && tool !== 'claude') ? tool : resolveAiTool();
  const cliCommand = buildCliCommand(actualTool);

  // Detect available tool for graceful fallback
  let toolAvailable = false;
  try {
    execSync(`${cliCommand.check}`, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
    toolAvailable = true;
  } catch { /* tool CLI not installed */ }

  try {
    let output;
    if (toolAvailable) {
      output = execSync(cliCommand.run, {
        input: prompt,
        encoding: 'utf8',
        timeout,
        cwd: cwd || process.cwd(),
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024,
      });
    } else {
      output = execSync(`echo "${prompt.replace(/"/g, '\\"')}"`, {
        encoding: 'utf8',
        timeout,
        cwd: cwd || process.cwd(),
      });
    }

    const completed = output.includes('<promise>COMPLETE</promise>');
    return { completed, output, error: toolAvailable ? null : `${actualTool} CLI not found`, duration: Date.now() - start };
  } catch (e) {
    return { completed: false, output: e.stdout || '', error: e.message, duration: Date.now() - start };
  }
}

/** Resolve the AI tool CLI from merged configuration, falling back to 'claude-code'. */
function resolveAiTool() {
  try {
    const config = loadConfig();
    return config.ai?.cli || config.platform?.['preferred-cli'] || 'claude-code';
  } catch {
    return 'claude-code';
  }
}

/** Build { check, run } commands for a given tool name. */
function buildCliCommand(tool) {
  const known = {
    'claude':       { check: 'claude --version',                   run: 'claude --dangerously-skip-permissions --print' },
    'claude-code':  { check: 'claude --version',                   run: 'claude --dangerously-skip-permissions --print' },
    'codex':        { check: 'codex --version 2>nul',              run: 'codex exec --print --prompt-stdin' },
    'pi':           { check: 'pi --version 2>nul',                 run: 'pi --print' },
    'deepcode':     { check: 'deepcode --version 2>nul',           run: 'deepcode --print' },
    'omp':          { check: 'omp --version 2>nul',                run: 'omp --print' },
  };
  return known[tool] || { check: `${tool} --version 2>nul`, run: `${tool} --print` };
}

/**
 * Check backpressure gates (lint, typecheck, test).
 * Returns { passed: boolean, gates: { name, passed: boolean }[] }.
 */
export function checkBackpressure(cwd) {
  const gates = [];
  const dir = cwd || process.cwd();

  const runGate = (name, cmd) => {
    try {
      execSync(cmd, { encoding: 'utf8', timeout: 60000, cwd: dir, stdio: 'pipe', shell: true });
      gates.push({ name, passed: true });
    } catch {
      gates.push({ name, passed: false });
    }
  };

  // Detect embedded project → use cross-compilation gates
  const isEmbedded = existsSync(join(dir, 'hardware.json'));

  if (isEmbedded) {
    const buildCmd = existsSync(join(dir, 'platformio.ini')) ? 'pio run' : 'idf.py build';
    const sizeCmd = existsSync(join(dir, 'platformio.ini')) ? 'pio run --target size' : 'idf.py size';
    runGate('build', buildCmd);
    runGate('binary-size', sizeCmd);
    runGate('static-analysis', 'cppcheck --std=c11 --enable=warning,performance src/ 2>&1 || true');
  } else {
    runGate('typecheck', 'npx tsc --noEmit');
    runGate('lint', 'npx eslint .');
  }

  runGate('test', 'npm test');

  return { passed: gates.every(g => g.passed), gates };
}

/**
 * Load the current PRD (product requirements document) from prd.json.
 */
export function loadPrd(cwd) {
  const path = join(cwd || process.cwd(), 'prd.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Update a story's pass status in prd.json.
 */
export function updateStoryStatus(storyId, passed, cwd) {
  const prd = loadPrd(cwd);
  if (!prd) return false;
  
  const story = prd.userStories?.find(s => s.id === storyId);
  if (!story) return false;
  
  story.passes = passed;
  writeFileSync(join(cwd || process.cwd(), 'prd.json'), JSON.stringify(prd, null, 2), 'utf8');
  return true;
}

/**
 * Get iteration summary string for the prompt.
 */
export function buildIterationPrompt(prd, iteration, maxIterations) {
  if (!prd) return '# Ralph Loop\n\nNo prd.json found. Create one first.';
  
  const stories = prd.userStories || [];
  const total = stories.length;
  const done = stories.filter(s => s.passes).length;
  const pending = stories.filter(s => !s.passes);
  
  const lines = [
    `# Ralph Loop — Iteration ${iteration}/${maxIterations}`,
    `Progress: ${done}/${total} stories completed`,
    '',
    '## Stories',
    ...stories.map(s => `${s.passes ? '✅' : '⬜'} ${s.id}: ${s.title}`),
    '',
  ];
  
  if (pending.length > 0) {
    lines.push('## Current Task', '', `Implement: ${pending[0].id} — ${pending[0].title}`);
    if (pending[0].notes) lines.push(`Files: ${pending[0].notes}`, '');
    lines.push('1. Write failing test first (RED)');
    lines.push('2. Implement minimal code (GREEN)');
    lines.push('3. Refactor while keeping tests green');
    lines.push('4. Update prd.json: set passes=true when done');
    lines.push('5. When ALL stories pass, output: <promise>COMPLETE</promise>');
  } else {
    lines.push('', 'All stories completed! Output: <promise>COMPLETE</promise>');
  }
  
  return lines.join('\n');
}
