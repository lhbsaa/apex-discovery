/**
 * apex-discovery Hook Engine
 *
 * Executes hook chains in priority order.
 * Supports stop-on-block semantics and multi-platform output formatting.
 */

/**
 * Execute a chain of hooks in priority order.
 * Each hook source resolves via adapters/<source>/hooks/<hook>.<ext>
 *
 * @param {string} eventType - SessionStart, PreToolUse, PostToolUse, Stop
 * @param {Array} chain - Array of { source, hook, priority, matcher }
 * @param {object} options - { stopOnBlock, hooksDir, apexRoot }
 * @returns {Array} results
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

export function executeChain(eventType, chain = [], options = {}) {
  const { stopOnBlock = false, hooksDir, apexRoot = process.cwd() } = options;
  const results = [];
  let blocked = false;

  // Sort by priority descending
  const sorted = [...chain].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const entry of sorted) {
    if (blocked && stopOnBlock) break;

    const scriptPath = resolveHook(entry.source, entry.hook, apexRoot);
    if (!scriptPath) {
      results.push({ ...entry, result: { decision: 'approve', reason: 'Hook not found' } });
      continue;
    }

    const result = executeScript(scriptPath, eventType);
    results.push({ ...entry, result });

    if (result.decision === 'block') {
      blocked = true;
    }
  }

  return results;
}

function resolveHook(source, hook, apexRoot) {
  // Hook directories by source — sibling directories from the monorepo layout.
  // Each entry is resolved at call time so non-existent dirs are handled
  // by the existence check below rather than producing noisy errors.
  const candidateDirs = [
    join(apexRoot, 'hooks'),                                        // apex native
    join(apexRoot, '..', 'superpowers', 'hooks'),
    join(apexRoot, '..', 'ECC', 'hooks'),
    join(apexRoot, '..', 'get-shit-done', 'hooks'),
    join(apexRoot, '..', 'ralph', 'hooks'),
  ];

  // Try source-matched directory first (if it exists and has the hook)
  const sourceIndex = { apex: 0, superpowers: 1, ecc: 2, gsd: 3, ralph: 4 };
  const preferred = candidateDirs[sourceIndex[source]] ?? candidateDirs[0];
  if (existsSync(preferred)) {
    for (const ext of ['.js', '.sh', '.cmd']) {
      const path = join(preferred, hook + ext);
      if (existsSync(path)) return path;
    }
  }

  // Fallback: try all remaining candidate dirs
  for (const dir of candidateDirs) {
    if (dir === preferred) continue;
    if (!existsSync(dir)) continue;
    for (const ext of ['.js', '.sh', '.cmd']) {
      const path = join(dir, hook + ext);
      if (existsSync(path)) return path;
    }
  }

  // Last resort: try generic handler in the apex hooks dir
  const genericPath = join(candidateDirs[0], 'generic-hook-handler.sh');
  if (existsSync(genericPath)) return genericPath;

  return null;
}

function executeScript(path, eventType) {
  try {
    const isWin = process.platform === 'win32';
    let cmd;
    if (path.endsWith('.sh')) cmd = `bash "${path}"`;
    else if (path.endsWith('.cmd')) cmd = isWin ? `cmd.exe /c "${path}"` : `bash "${path}"`;
    else cmd = `node "${path}"`;

    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, APEX_EVENT: eventType },
    });

    try { return JSON.parse(output); }
    catch { return { decision: 'approve', reason: '' }; }
  } catch (e) {
    if (e.status === 2) return { decision: 'block', reason: e.stdout || e.message };
    return { decision: 'approve', reason: `Hook exited with code ${e.status}` };
  }
}
