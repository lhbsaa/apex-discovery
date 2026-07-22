---
name: pi-integration
description: "Pi Coding Agent integration. Generate multi-agent team/chain configs and damage-control safety rules. Triggers on: pi, Pi agent, multi-agent, chain config, damage control."
apex-version: "1.0"
apex-id: "apex:pi-integration"
apex-category: technique
apex-compatibility: [superpowers, gsd]
apex-lifecycle:
  phase: [plan, execute, verify]
  triggers:
    - "user says: pi"
    - "user says: generate pi config"
    - "user says: multi-agent setup"
    - "user says: damage control"
    - "user says: agent chain"
---
# Pi Coding Agent Integration

Generate Pi Coding Agent configuration files from apex-unified's agent definitions and safety rules.

## Commands

| Command | Description |
|---------|-------------|
| `apex pi setup` | Generate all Pi config files |
| `apex pi team` | Generate Pi agent-team config |
| `apex pi chain` | Generate Pi agent-chain config |
| `apex pi damage` | Generate Pi damage-control safety rules |

## Usage

```bash
# 1. Set Pi as the AI tool
apex config --set ai.cli=pi

# 2. Pipe phase prompts to Pi
apex plan execute | pi

# 3. Generate Pi multi-agent configs
apex pi setup

# 4. Run Pi with extensions
pi -e extensions/agent-team.ts

# 5. Or use chain pipeline
pi -e extensions/agent-chain.ts
```

## Multi-Agent Patterns

### Agent Team (dispatcher)
Pi dispatches work to specialist agents defined in `teams.yaml`.

### Agent Chain (pipeline)
Each agent's output becomes the next agent's input via `$INPUT`.

### Damage Control (safety)
Blocks dangerous commands, protects sensitive files, enforces read-only paths.
