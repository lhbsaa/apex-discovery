/**
 * apex-unified DeepCode CLI Adapter
 *
 * DeepCode CLI (deepcode) — 专为 DeepSeek V4 优化的终端 AI 编码助手
 * Install: npm install -g @vegamo/deepcode-cli
 * Use:     apex plan execute | deepcode
 *
 * DeepCode reads standard Agent Skills from .deepcode/skills/ and .agents/skills/
 * Compatible with apex-unified's 38 skills — no conversion needed.
 */

// No adapter code needed — deepcode accepts piped prompts via stdin.
// This file documents the compatibility.

export const metadata = {
  name: 'deepcode',
  package: '@vegamo/deepcode-cli',
  version: '0.1.34',
  homepage: 'https://deepcode.vegamo.cn',
  install: 'npm install -g @vegamo/deepcode-cli',
  commands: {
    'apex:status': 'Show project status',
    'apex:plan': 'Show phase prompt',
    'apex:review': 'Show code review prompt',
  },
};
