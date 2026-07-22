# apex-discovery

> Scientific research extension for [apex-unified](https://github.com/lhbsaa/apex-unified) — 148+ scientific skills for biology, chemistry, medicine, materials, and more.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Scientific Skills](https://img.shields.io/badge/Scientific_Skills-149-brightgreen)](https://github.com/K-Dense-AI/scientific-agent-skills)

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

### Complete Skill List (149)

<details>
<summary>🧬 Bioinformatics & Genomics (28)</summary>

```
anndata, arboreto, arbor, biopython, bulk-rnaseq, cellxgene-census,
deeptools, dhdna-profiler, etetoolkit, flowio, geniml, gget, gtars,
lamindb, matchms, nextflow, onekgpd, pathway-enrichment, phylogenetics,
polars-bio, pyopenms, pysam, pydeseq2, scanpy, scikit-bio, scvelo,
scvi-tools, tamarind, tiledbvcf
```
</details>

<details>
<summary>🧪 Cheminformatics & Drug Discovery (12)</summary>

```
datamol, deepchem, diffdock, medchem, molfeat, pytdc, rdkit,
torchdrug, bioservices, cobrapy, hypogenic, molecule-generation
```
</details>

<details>
<summary>🔬 Proteomics & Structural Biology (5)</summary>

```
adyaptyv, esm, molecular-dynamics, primekg, alphafold
```
</details>

<details>
<summary>🏥 Clinical & Medical (10)</summary>

```
bids, clinical-decision-support, clinical-reports, histolab,
imaging-data-commons, pacsomatic, pathml, pydicom, pyhealth,
treatment-plans
```
</details>

<details>
<summary>🤖 Machine Learning & AI (14)</summary>

```
dask, modal, optimize-for-gpu, polars, pymc, pytorch-lightning,
scikit-learn, shap, stable-baselines3, statistical-analysis,
statistical-power, statsmodels, transformers, umap-learn
```
</details>

<details>
<summary>🌌 Physics & Astronomy (6)</summary>

```
astropy, cirq, pennylane, qiskit, qutip, sympy
```
</details>

<details>
<summary>⚙️ Engineering & Simulation (4)</summary>

```
fluidsim, pufferlib, pymoo, simpy
```
</details>

<details>
<summary>🌍 Geospatial Science (3)</summary>

```
geomaster, geopandas, rioxarray
```
</details>

<details>
<summary>📚 Academic Communication (14)</summary>

```
citation-management, docx, infographics, latex-posters, literature-review,
markdown-mermaid-writing, paper-lookup, paperzilla, pdf, peer-review,
pptx, pptx-posters, scientific-schematics, scientific-slides,
scientific-visualization, scientific-writing, venue-templates, xlsx
```
</details>

<details>
<summary>🎓 Research Methodology (8)</summary>

```
experimental-design, hypothesis-generation, research-grants,
research-lookup, scholar-evaluation, scientific-brainstorming,
scientific-critical-thinking, what-if-oracle
```
</details>

<details>
<summary>🔗 Platform & Integration (13)</summary>

```
autoskill, benchling-integration, database-lookup, dnanexus-integration,
exa-search, ginkgo-cloud-lab, labarchive-integration, latchbio-integration,
omero-integration, open-notebook, opentrons-integration, parallel-web,
pi-agent, protocolsio-integration
```
</details>

<details>
<summary>📊 Data & Visualization (10)</summary>

```
exploratory-data-analysis, generate-image, matplotlib, networkx,
seaborn, markitdown, liteparse, vaex, zarr-python, polars
```
</details>

<details>
<summary>🧠 Neuro & Cognitive (4)</summary>

```
consciousness-council, neurokit2, neuropixels-analysis, rowan
```
</details>

<details>
<summary>🏭 Industry & Regulatory (3)</summary>

```
iso-13485-certification, market-research-reports, usfiscaldata
```
</details>

<details>
<summary>🛠️ Other Tools (15)</summary>

```
bgpt-paper-search, depmap, get-available-resources, glycoengineering,
hugging-science, matlab, neurokit2, pymatgen, timesfm-forecasting,
pylabrobot, pyzotero, scikit-survival, tiledbvcf, torch-geometric,
stable-baselines3
```
</details>

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
