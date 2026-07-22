---
name: apex-spec
description: "Spec-driven development workflow. Propose features with specs, design docs, and tasks before writing code. Triggers on: /apex:spec, propose, write spec, design feature."
apex-version: "1.0"
apex-id: "apex:spec"
apex-category: process
apex-compatibility: [superpowers, gsd, ralph]
apex-lifecycle:
  phase: [discuss, plan, execute]
  triggers:
    - "user says: propose a feature"
    - "user says: write spec"
    - "user says: /apex:spec"
    - "user says: start a change"
---
# apex-spec — Spec-Driven Development

Propose, design, and execute features with a lightweight spec workflow.

## Commands

| Command | Description |
|---------|-------------|
| `apex spec init` | Initialize openspec/ directories |
| `apex spec propose "<feature>"` | Create proposal, design, tasks |
| `apex spec list` | Show active changes |
| `apex spec archive <name>` | Archive completed change |

## Workflow

1. **Propose** — `apex spec propose "add login"`
2. **Review** — Read proposal.md, design.md, tasks.md
3. **Implement** — Follow tasks.md with TDD
4. **Archive** — `apex spec archive add-login`

## Artifact Structure

```
openspec/
├── config.yaml
├── changes/
│   ├── add-login/
│   │   ├── proposal.md    — Why + What + Impact
│   │   ├── design.md      — Approach + Trade-offs
│   │   └── tasks.md       — Task checklist
│   └── archive/            — Completed changes
├── explorations/            — Research notes
└── specs/                   — Shared specs
```
