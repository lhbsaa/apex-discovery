# apex-discovery

> Standalone scientific research + AI coding agent platform — 188 skills (39 development + 149 scientific) across biology, chemistry, medicine, materials, and software engineering.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Skills](https://img.shields.io/badge/Total_Skills-188-brightgreen)](skills/)

Built-in: 10 orchestration engines, 7 development phases, 6 work modes, 18 AI agents, 39 dev skills + 149 scientific skills. **Zero external runtime dependencies.**

---

## Quick Start

```bash
git clone https://github.com/lhbsaa/apex-discovery.git
cd apex-discovery

# All skills are embedded — no separate install needed
node cli/main.js status

# Explore available commands
node cli/main.js --help
```

## Installation

### Prerequisites
- **Node.js >= 20.0.0** (Node 22+ recommended)
- **~50MB disk space** (all 188 skills embedded locally)

### Option 1: Direct usage (recommended)
```bash
git clone https://github.com/lhbsaa/apex-discovery.git
cd apex-discovery

# Verify installation
node cli/main.js status
```

### Option 2: Global CLI alias
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, or PowerShell $PROFILE)
alias apex-discovery="node /path/to/apex-discovery/cli/main.js"

# Or create a symlink
npm link   # from the project directory
```

### Option 3: IDE Integration
Copy the plugin files to your IDE's config directory:

| IDE | Plugin file | Location |
|-----|------------|----------|
| **Claude Code** | `.claude-plugin/plugin.json` | `<project>/.claude/plugins/` |
| **Cursor** | `.cursor-plugin/plugin.json` | `<project>/.cursor/plugins/` |
| **Codex CLI** | `.codex-plugin/plugin.json` | `<project>/.codex/plugins/` |
| **Gemini Code Assist** | `.gemini-extension.json` | `<project>/` |
| **OpenCode** | `adapters/opencode/apex-opencode-plugin.js` | `<project>/.opencode/plugins/` |

---

## Configuration

### Three-layer config system

apex-discovery uses a layered configuration system (higher priority overrides lower):

```
Priority 1 (highest):  Project config   → .apex-discovery/config.json
Priority 2:            User config      → ~/.apex-discovery/config.json
Priority 3 (default):  System defaults  → config/defaults.json
```

### CLI config commands

```bash
# View merged configuration
node cli/main.js config --show

# Set a value (saved to project config)
node cli/main.js config --set project.name=my-project

# Switch work mode
node cli/main.js config --mode research-scientist

# Reset project config to defaults
node cli/main.js config --reset
```

---

## Work Modes

apex-discovery has 6 built-in modes, each optimized for a different workflow:

| Mode | Label | Skills | Agents | Best For |
|------|-------|:------:|:------:|----------|
| **research-scientist** (default) | 科研模式 | 8 | 6 | Scientific research, bioinformatics, drug discovery |
| **daily-dev** | 日常开发 | 7 | 3 | Bug fixes, small features, daily coding |
| **full-stack** | 全栈开发 | 9 | 5 | Web applications, frontend + backend |
| **deep-research** | 深度研究 | 9 | 5 | Architecture analysis, security audit, optimization |
| **spec-mode** | Spec驱动开发 | 5 | 5 | Spec-first development, requirements-driven |
| **embedded-dev** | 嵌入式开发 | 7 | 4 | ESP32/Arduino firmware, IoT |

Switch modes with:
```bash
node cli/main.js config --mode <mode-name>
```

Or use natural language detection:
```bash
node cli/main.js detect "我需要分析这个蛋白质结构"
# → Auto-detected mode: research-scientist
```

---

## Development Phases

The 7-phase workflow guides you through the full development cycle:

```
explore → discuss → plan → execute → build → verify → ship
```

```bash
# Generate a phase-specific prompt
node cli/main.js plan discuss    # Requirements gathering
node cli/main.js plan execute    # Implementation
node cli/main.js plan verify     # Testing & review
```

Each phase injects only the relevant skills and agents from the current mode, saving tokens and keeping focus.

---

## CLI Command Reference

| Command | Description |
|---------|-------------|
| `status` | Show project status (mode, skills, agents, phases, model) |
| `--help` | Show all available commands |
| `config --show` | View merged configuration as JSON |
| `config --set <key>=<value>` | Set a config value |
| `config --mode <name>` | Switch work mode |
| `config --reset` | Reset to defaults |
| `init` | Create a new project |
| `init --template esp32 <name>` | Create ESP-IDF embedded project |
| `init --template pio <name>` | Create PlatformIO project |
| `init --template arduino <name>` | Create Arduino project |
| `plan [phase]` | Generate phase prompt |
| `execute` | Generate iteration prompt from prd.json |
| `review` | Show code review prompt |
| `detect <text>` | Auto-detect and switch mode from natural language |
| `slash /apex:mode <name>` | Execute a slash command |
| `spec init` | Initialize spec-driven workflow |
| `spec propose "<feature>"` | Create a new feature proposal |
| `spec list` | List active changes |
| `spec archive <name>` | Archive completed change |
| `pi setup` | Generate Pi Coding Agent configs |

---

## Spec-Driven Development

apex-discovery supports OpenSpec-compatible spec-driven development:

```bash
# Initialize spec directories
node cli/main.js spec init

# Propose a new feature
node cli/main.js spec propose "Molecular property predictor"

# Review generated artifacts in openspec/changes/
# openspec/changes/molecular-property-predictor/
#   ├── proposal.md
#   ├── design.md
#   └── tasks.md

# List active changes
node cli/main.js spec list

# Archive when complete
node cli/main.js spec archive molecular-property-predictor
```

---

## Using Scientific Skills

The 149 scientific skills cover a wide range of domains. Each skill provides domain-specific guidance, code examples, and bundled scripts.

```bash
# List all available skills
node cli/main.js status
# → Skills: 188 total

# Use the plan command with research mode
node cli/main.js config --mode research-scientist
node cli/main.js plan execute
```

Skills are auto-discovered from `skills/<name>/SKILL.md` and phase-injected by trigger matching — no configuration needed.

**Key scientific skill categories:**

| Category | Example skills |
|----------|---------------|
| 🧬 Bioinformatics | scanpy, biopython, anndata, pysam, pydeseq2 |
| 🧪 Cheminformatics | rdkit, deepchem, datamol, molfeat, diffdock |
| 🔬 Proteomics | esm, primekg, molecular-dynamics |
| 🏥 Clinical | pydicom, pyhealth, pathml, bids |
| 🤖 ML/AI | pytorch-lightning, transformers, scikit-learn |
| 🌌 Physics | astropy, qiskit, cirq, sympy |
| 📚 Communication | pdf, docx, xlsx, pptx, scientific-writing |

---

## Requirements

- **Node.js >= 20.0.0** (Node 22+ recommended)
- **~50MB disk space** (all 188 skills embedded)
- No npm packages required (zero runtime dependencies)

---

## License

MIT
