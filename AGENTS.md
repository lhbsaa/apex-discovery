# apex-discovery Agent Instructions

## Slash Commands

- `/apex:status` — Show project status (current mode, active skills/agents, phases, model, AI tool)
- `/apex:plan [phase]` — Show phase prompt for the specified phase (explore, discuss, plan, execute, build, verify, ship). Defaults to discuss phase.
- `/apex:review` — Show code review agent prompt with current mode's skills and agents
- `/apex:detect <text>` — Auto-detect and switch mode from natural language input
- `/apex:spec init|propose|list|archive` — Spec-driven development workflow

## Modes

- `research-scientist` (default) — Scientific research mode (8 skills, 6 agents)
- `daily-dev` — Bug fixes, small features (7 skills, 3 agents)
- `full-stack` — Full-stack web applications (9 skills, 5 agents)
- `deep-research` — Architecture analysis, security review (9 skills, 5 agents)
- `spec-mode` — Spec-first development (5 skills, 5 agents)
- `embedded-dev` — ESP32/Arduino firmware development (7 skills, 4 agents)

## Phases

`explore → discuss → plan → execute → build → verify → ship`

Each phase generates a different AI prompt. Mode-specific skills and agents are automatically injected.

## Skills

188 total skills (39 development + 149 scientific) all embedded in `skills/` directory.
All skills are auto-discovered, cached, phase-injected by triggers — no configuration needed.
