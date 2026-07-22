# apex-discovery

> Scientific research extension for [apex-unified](https://github.com/lhbsaa/apex-unified) — 148+ scientific skills for biology, chemistry, medicine, materials, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Scientific Skills](https://img.shields.io/badge/Scientific_Skills-148%2B-brightgreen)](https://github.com/K-Dense-AI/scientific-agent-skills)

Powered by [apex-unified](https://github.com/lhbsaa/apex-unified) engine + [Scientific Agent Skills](https://github.com/K-Dense-AI/scientific-agent-skills) (31.4k⭐).

---

## Quick Start

```bash
git clone https://github.com/lhbsaa/apex-discovery.git
cd apex-discovery

# Install scientific-agent-skills (148+ skills)
node scripts/setup.js

# Check status
node cli/main.js status
```

## What's Included

| Component | Source | Count |
|-----------|--------|:-----:|
| **apex-unified engine** | Core orchestration | 10 engines |
| **Scientific Agent Skills** | K-Dense AI (31.4k⭐) | **148+ skills** |
| **Research-scientist mode** | Pre-configured | 1 mode |

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
# Research mode
node cli/main.js config --mode research-scientist
node cli/main.js plan execute

# Scientific skill auto-discovery
# Skills from scientific-agent-skills/ are automatically loaded
```

## Requirements

- Node.js >= 20
- Git (for cloning scientific-agent-skills)
- 500MB disk (for scientific skills)

## License

MIT
