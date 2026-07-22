# apex-discovery

> Standalone scientific research + AI coding agent platform — 188 skills (39 development + 149 scientific) across biology, chemistry, medicine, materials, and software engineering.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Skills](https://img.shields.io/badge/Total_Skills-188-brightgreen)](skills/)

Built-in: 10 orchestration engines, 7 development phases, 6 modes, 18 agents, 39 dev skills + 149 scientific skills. Zero external runtime dependencies.

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

## What's Included

| Component | Count |
|-----------|:-----:|
| **Core engines** | 10 (config, skill, agent, phase, loop, hook, plugin, mode, spec, hw-config) |
| **Development phases** | 7 (explore → discuss → plan → execute → build → verify → ship) |
| **Work modes** | 6 (research-scientist, daily-dev, full-stack, deep-research, spec-mode, embedded-dev) |
| **Development skills** | 39 (TDD, API design, coding standards, etc.) |
| **Scientific skills** | 149 (bioinformatics, chemistry, clinical, imaging, physics, etc.) |
| **AI agents** | 18 (planner, architect, reviewer, security, etc.) |

### Scientific Domains Covered

| Domain | Skills |
|--------|--------|
| 🧬 **Bioinformatics & Genomics** | Sequence analysis, single-cell RNA-seq, gene networks, variant annotation |
| 🧪 **Cheminformatics & Drug Discovery** | Molecular property prediction, virtual screening, ADMET, docking |
| 🔬 **Proteomics & Mass Spec** | LC-MS/MS, peptide identification, spectral matching |
| 🏥 **Clinical Research** | Clinical trials, pharmacogenomics, variant interpretation |
| 🖼️ **Medical Imaging** | DICOM processing, pathology, radiology |
| 🤖 **ML/AI** | Deep learning, reinforcement learning, time series, Bayesian methods |
| 🌌 **Physics & Astronomy** | Data analysis, coordinate transforms, cosmology |
| ⚙️ **Engineering & Simulation** | Discrete-event simulation, optimization, systems modeling |
| 🌍 **Geospatial Science** | Satellite imagery, GIS, spatial statistics |
| 📚 **Scientific Communication** | Literature review, writing, peer review, posters |

## Usage

```bash
# View project status
node cli/main.js status

# Switch to research mode
node cli/main.js config --mode research-scientist

# Generate a phase prompt
node cli/main.js plan discuss

# View configuration
node cli/main.js config --show

# Initialize a project
node cli/main.js init my-project

# Spec-driven workflow
node cli/main.js spec propose "New feature"
```

## Requirements

- Node.js >= 20
- ~50MB disk (all skills embedded)

## License

MIT
