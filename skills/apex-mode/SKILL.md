---
name: apex-mode
description: "Switch between development modes. Use /apex:mode to change mode or check current mode. Triggers on: switch mode, change mode, /apex:mode, what mode am I in."
apex-version: "1.0"
apex-id: "apex:mode"
apex-category: meta
apex-compatibility: [superpowers, ecc, gsd, ralph]
apex-lifecycle:
  phase: [discuss, plan, execute, verify, ship]
  triggers:
    - "user says: switch mode"
    - "user says: change mode"
    - "user says: /apex:mode"
    - "user says: what mode"
---

# apex-mode — Switch Development Mode

Switch between predefined development modes to optimize skill loading and token usage.

## Available Modes

| Command | Mode | Skills | Agents |
|---------|------|--------|--------|
| `/apex:mode daily-dev` | 日常开发 | TDD, code review, brainstorming, writing plans | planner, code-reviewer, tdd-guide |
| `/apex:mode full-stack` | 全栈开发 | + API design, frontend/backend patterns, DB, security | + architect, security-reviewer, executor |
| `/apex:mode deep-research` | 深度研究 | Debugging, architecture, error handling, security | architect, spec-miner, security-reviewer, optimizer |

## Usage

```
/apex:mode                    — Show current mode
/apex:mode full-stack         — Switch to full-stack mode
apex config --mode daily-dev  — CLI equivalent
```

## Auto-Detection

The system also auto-detects mode from natural language:
- "我要做一个全栈功能" → auto-switch to full-stack mode
- "研究一下这个架构" → auto-switch to deep-research mode
- "修一个bug" → auto-switch to daily-dev mode
