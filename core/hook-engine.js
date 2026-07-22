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
  // Hook directories by source
  const dirs = {
    apex: join(apexRoot, 'hooks'),
    superpowers: join(apexRoot, '..', 'superpowers', 'hooks'),
    ecc: join(apexRoot, '..', 'ECC', 'hooks'),
    gsd: join(apexRoot, '..', 'get-shit-done', 'hooks'),
    ralph: join(apexRoot, '..', 'ralph', 'hooks'),
    _fallback: join(apexRoot, 'hooks'),
  };

  // Try the specific source hooks directory
  const baseDir = dirs[source] || dirs._fallback;
  for (const ext of ['.js', '.sh', '.cmd']) {
    const path = join(baseDir, hook + ext);
    if (existsSync(path)) return path;
  }

  // Fallback: try generic handler
  const genericPath = join(dirs._fallback, 'generic-hook-handler.sh');
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
