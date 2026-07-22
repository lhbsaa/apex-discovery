/**
 * apex-discovery OpenCode Plugin Adapter
 *
 * Provides apex-discovery CLI commands as OpenCode slash commands.
 * Install: copy to .opencode/plugins/apex-discovery.js
 */

export default {
  name: 'apex-discovery',
  description: 'apex-discovery: Scientific research + AI coding agent commands',

  config() {
    return {
      commands: [
        { name: 'apex:status', description: 'Show project status (mode, skills, agents, phases)' },
        { name: 'apex:plan', description: 'Show phase prompt for current mode' },
        { name: 'apex:review', description: 'Show code review prompt' },
        { name: 'apex:detect', description: 'Auto-detect mode from natural language' },
        { name: 'apex:spec', description: 'Spec-driven development workflow' },
      ],
      hooks: {
        'chat:message': async (ctx, next) => {
          const msg = ctx.message?.content || '';
          const match = msg.match(/^\/apex:(\w+)(?:\s+(.+))?$/);
          if (!match) return next();

          const cmd = match[1];
          const args = match[2]?.trim() || '';
          const result = await executeApexCommand(cmd, args);
          await ctx.reply(result);
          return;
        },
      },
    };
  },
};

async function executeApexCommand(cmd, args) {
  const { execFileSync } = await import('node:child_process');
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');

  // Find apex-discovery CLI
  const projectCli = join(process.cwd(), 'cli', 'main.js');

  let cliArgs = [cmd];
  if (args) cliArgs.push(args);

  try {
    const output = execFileSync(
      'node',
      [projectCli, ...cliArgs],
      { encoding: 'utf8', timeout: 30000 }
    );
    return output;
  } catch (e) {
    return `Error: ${e.message}`;
  }
}
