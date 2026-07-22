/**
 * apex-discovery Phase Engine (GSD Core)
 *
 * Six-phase development cycle: discuss → plan → execute → verify → ship
 * Integrates with mode system to inject only relevant skills into prompts.
 */

const PHASES = ['explore', 'discuss', 'plan', 'execute', 'build', 'verify', 'ship'];

// Lazy import for skill engine to avoid circular deps
let _skillEngine = null;
async function getSkillEngine() {
  if (!_skillEngine) _skillEngine = await import('./skill-engine.js');
  return _skillEngine;
}

export function nextPhase(current) {
  const idx = PHASES.indexOf(current);
  if (idx === -1 || idx >= PHASES.length - 1) return null;
  return PHASES[idx + 1];
}

export function getPhaseInfo() {
  return PHASES.map(p => ({
    name: p, description: getPhaseDescription(p),
    order: PHASES.indexOf(p) + 1, total: PHASES.length,
  }));
}

function getPhaseDescription(phase) {
  const d = {
    explore: 'Explore ideas and reference code. Pure conversation — no artifacts, no commitment. For embedded: scan SDK examples.',
    discuss: 'Gather requirements, explore codebase, ask clarifying questions',
    plan: 'Break work into tasks, specify file paths and verification steps',
    execute: 'Implement tasks with TDD, one at a time, fresh context per task',
    build: 'Cross-compile for target hardware. Check binary size and memory usage.',
    verify: 'Run tests, typecheck, lint, compare against plan',
    ship: 'Commit, create PR, update changelog, deploy firmware',
  };
  return d[phase] || '';
}

/**
 * Build a phase prompt with mode-aware skill injection.
 * Only injects skills/agents from the current mode, saving tokens.
 */
export async function buildPhasePrompt(phase, context, modeConfig = {}) {
  const basePrompt = buildBasePrompt(phase, context);

  // Inject mode-specific skills for this phase
  const modeSkills = (modeConfig.skills || []).filter(Boolean);
  const modeAgents = (modeConfig.agents || []).filter(Boolean);
  const modeName = modeConfig.name || 'daily-dev';
  const modeLabel = modeConfig.label || '';

  // Auto-detect: find skills matching this phase (any mode, any config)
  const modeSkillSet = new Set(modeSkills);
  let autoSkills = [];
  try {
    const se = await getSkillEngine();
    const phaseSkills = se.findSkillsByPhase(phase);
    autoSkills = phaseSkills
      .filter(s => s && !modeSkillSet.has(s.name))
      .map(s => s.name);
  } catch { /* skill engine not available */ }

  // Merge: mode skills first (explicit), auto-detected skills second
  const allSkills = [...modeSkills, ...autoSkills].slice(0, 8);

  let skillsSection = '';
  if (allSkills.length > 0) {
    skillsSection = `\n## Active Skills (${modeName} mode${modeLabel ? ' · ' + modeLabel : ''})\n${allSkills.map(s => `- ${s}`).join('\n')}`;
  }

  let agentsSection = '';
  if (modeAgents.length > 0) {
    agentsSection = `\n## Available Agents\n${modeAgents.map(a => `- ${a}`).join('\n')}`;
  }

  // Inject hardware constraints for embedded mode
  let hwSection = '';
  if (modeName === 'embedded-dev') {
    try {
      const { hwConstraintsPrompt } = await import('./hw-config.js');
      const hw = hwConstraintsPrompt(process.cwd());
      if (hw) hwSection = `\n${hw}`;
    } catch { /* no hw-config available */ }
  }

  return basePrompt + skillsSection + agentsSection + hwSection;
}

function buildBasePrompt(phase, context) {
  const prompts = {
    explore: `# Explore Phase\n\n${getPhaseDescription('explore')}\n\n## Context\n${context || '(no prior context)'}\n\n## Instructions\n1. Read the project codebase and hardware config\n2. Explore one idea at a time — pure conversation, no file writes\n3. If embedded: scan SDK examples matching the topic\n4. When direction is clear, summarize findings`,
    discuss: `# Discuss Phase\n\n${getPhaseDescription('discuss')}\n\n## Context\n${context || '(no prior context)'}\n\n## Instructions\n1. Read the project codebase\n2. Ask clarifying questions ONE AT A TIME\n3. When enough info is gathered, summarize decisions in CONTEXT.md`,
    plan: `# Plan Phase\n\n${getPhaseDescription('plan')}\n\n## Context\n${context || '(no prior context)'}\n\n## Instructions\n1. Break work into bite-sized tasks (2-5 min each)\n2. Each task: file path, description, verification steps\n3. Output as PLAN.md`,
    execute: `# Execute Phase\n\n${getPhaseDescription('execute')}\n\n## Instructions\n1. Load PLAN.md\n2. TDD: failing test → minimal code → refactor\n3. Each task in fresh context\n4. Update progress after each task`,
    build: `# Build Phase\n\n${getPhaseDescription('build')}\n\n## Instructions\n1. Run cross-compilation for target hardware\n2. Fix any compilation errors\n3. Check binary size fits flash\n4. Verify memory usage (stack, heap, BSS)\n5. Output build report`,
    verify: `# Verify Phase\n\n${getPhaseDescription('verify')}\n\n## Instructions\n1. Run all test suites\n2. Run typecheck\n3. Run linter\n4. Verify implementation matches PLAN.md\n5. Report findings`,
    ship: `# Ship Phase\n\n${getPhaseDescription('ship')}\n\n## Instructions\n1. Ensure all tests pass\n2. Create git commit with conventional commit message\n3. Create summary of changes`,
  };
  return prompts[phase] || `# ${phase}\n\nExecute the ${phase} phase.`;
}

export function isValidPhase(phase) {
  return PHASES.includes(phase);
}
