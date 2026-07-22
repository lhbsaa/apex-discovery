/**
 * apex-discovery Plugin Engine
 *
 * Manages plugin discovery, loading, and lifecycle.
 * Plugins extend skills/ and agents/ directories with additional content.
 * Plugins are npm packages named @apex/skills-<name> or local directories.
 */

import { existsSync, readFileSync, readdirSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function copyRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  if (!existsSync(src)) return;
  const entries = readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = join(src, e.name);
    const d = join(dest, e.name);
    if (e.isDirectory()) copyRecursive(s, d);
    else if (e.isFile()) writeFileSync(d, readFileSync(s));
  }
}

/**
 * List installed plugins by scanning the plugins/ directory.
 */
export function listPlugins() {
  const pluginsDir = join(ROOT, 'plugins');
  if (!existsSync(pluginsDir)) return [];
  return readdirSync(pluginsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(pluginsDir, d.name, 'manifest.json')))
    .map(d => loadPluginManifest(d.name));
}

function loadPluginManifest(name) {
  const path = join(ROOT, 'plugins', name, 'manifest.json');
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { name, version: '0.0.0', description: '(invalid manifest)' };
  }
}

/**
 * Install a plugin from an npm package or local path.
 */
export function installPlugin(source) {
  const pluginsDir = join(ROOT, 'plugins');
  mkdirSync(pluginsDir, { recursive: true });

  // npm package: @apex/skills-<name>
  if (source.startsWith('@apex/') || source.startsWith('apex-')) {
    const pkgName = source.startsWith('@apex/') ? source : `@apex/${source}`;
    try {
      execSync(`npm install ${pkgName} --no-save`, { cwd: ROOT, stdio: 'pipe', timeout: 60000 });
      const nodeModulesPath = join(ROOT, 'node_modules', pkgName);
      if (existsSync(nodeModulesPath)) {
        const pluginName = pkgName.replace('@apex/', '');
        const targetDir = join(pluginsDir, pluginName);
        mkdirSync(targetDir, { recursive: true });
        copyRecursive(nodeModulesPath, targetDir);
        return { success: true, name: pluginName, source: pkgName };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Local path
  if (existsSync(source)) {
    const name = source.split(/[/\\]/).pop();
    const targetDir = join(pluginsDir, name);
    mkdirSync(targetDir, { recursive: true });
    copyRecursive(source, targetDir);
    return { success: true, name, source };
  }

  return { success: false, error: `Plugin not found: ${source}` };
}

/**
 * Uninstall a plugin.
 */
export function uninstallPlugin(name) {
  const pluginDir = join(ROOT, 'plugins', name);
  if (!existsSync(pluginDir)) return { success: false, error: `Plugin not installed: ${name}` };
  rmSync(pluginDir, { recursive: true });
  return { success: true };
}

/**
 * Get total count of installed plugins.
 */
export function pluginCount() {
  return listPlugins().length;
}
