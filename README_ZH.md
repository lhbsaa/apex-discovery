# apex-discovery

> 独立科研 + AI 编程代理平台 — 188 个技能（39 开发 + 149 科学），覆盖生物、化学、医学、材料、软件工程等领域。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Skills](https://img.shields.io/badge/Total_Skills-188-brightgreen)](skills/)
[![English](https://img.shields.io/badge/Lang-English-blue)](README.md)

内置：10 个编排引擎、7 个开发阶段、6 种工作模式、18 个 AI 代理、39 个开发技能 + 149 个科学技能。**零外部运行时依赖。**

---

## 快速开始

```bash
git clone https://github.com/lhbsaa/apex-discovery.git
cd apex-discovery

# 所有技能已内嵌，无需单独安装
node cli/main.js status

# 查看可用命令
node cli/main.js --help
```

## 安装说明

### 环境要求
- **Node.js >= 20.0.0**（推荐 Node 22+）
- **~50MB 磁盘空间**（188 个技能全部内嵌）

### 方式一：直接使用（推荐）
```bash
git clone https://github.com/lhbsaa/apex-discovery.git
cd apex-discovery
node cli/main.js status
```

### 方式二：全局别名
```bash
# 在 shell 配置文件中添加（~/.bashrc, ~/.zshrc, 或 PowerShell $PROFILE）
alias apex-discovery="node /path/to/apex-discovery/cli/main.js"
```

### 方式三：IDE 集成

| IDE | 插件文件 | 安装位置 |
|-----|---------|---------|
| **Claude Code** | `.claude-plugin/plugin.json` | `<project>/.claude/plugins/` |
| **Cursor** | `.cursor-plugin/plugin.json` | `<project>/.cursor/plugins/` |
| **Codex CLI** | `.codex-plugin/plugin.json` | `<project>/.codex/plugins/` |
| **Gemini Code Assist** | `.gemini-extension.json` | `<project>/` |
| **OpenCode** | `adapters/opencode/apex-opencode-plugin.js` | `<project>/.opencode/plugins/` |

---

## 配置系统

### 三层配置（高优先级覆盖低优先级）

```
优先级 1 (最高):  项目配置    → .apex-discovery/config.json
优先级 2:         用户全局    → ~/.apex-discovery/config.json
优先级 3 (默认):  系统默认    → config/defaults.json
```

### 配置命令

```bash
# 查看合并后的完整配置
node cli/main.js config --show

# 设置配置项
node cli/main.js config --set project.name=my-project

# 切换工作模式
node cli/main.js config --mode research-scientist

# 重置项目配置
node cli/main.js config --reset
```

---

## 工作模式

apex-discovery 内置 6 种模式，针对不同场景优化：

| 模式 | 技能数 | 代理数 | 适用场景 |
|------|:------:|:------:|----------|
| **research-scientist**（默认） | 8 | 6 | 科研分析、生物信息、药物发现 |
| **daily-dev** | 7 | 3 | 日常开发、修 Bug、小功能 |
| **full-stack** | 9 | 5 | 全栈 Web 应用开发 |
| **deep-research** | 9 | 5 | 架构审查、安全审计、性能优化 |
| **spec-mode** | 5 | 5 | 需求驱动的 Spec 先行开发 |
| **embedded-dev** | 7 | 4 | ESP32/Arduino 固件开发、IoT |

```bash
# 切换模式
node cli/main.js config --mode <模式名称>

# 或使用自然语言自动检测
node cli/main.js detect "分析这个蛋白质结构"
```

---

## 开发阶段

7 阶段工作流覆盖完整开发周期：

```
explore → discuss → plan → execute → build → verify → ship
```

```bash
# 生成各阶段提示词
node cli/main.js plan discuss    # 需求讨论
node cli/main.js plan execute    # 编码实现
node cli/main.js plan verify     # 测试审查
```

每个阶段自动注入当前模式匹配的技能和代理，节省 token、聚焦目标。

---

## CLI 命令参考

| 命令 | 说明 |
|------|------|
| `status` | 显示项目状态（模式、技能、代理、阶段） |
| `--help` | 显示所有可用命令 |
| `config --show` | 查看配置 |
| `config --set <key>=<value>` | 设置配置项 |
| `config --mode <name>` | 切换工作模式 |
| `config --reset` | 重置配置 |
| `init` | 创建新项目 |
| `init --template esp32 <name>` | 创建 ESP-IDF 项目 |
| `init --template pio <name>` | 创建 PlatformIO 项目 |
| `init --template arduino <name>` | 创建 Arduino 项目 |
| `plan [phase]` | 生成阶段提示词 |
| `execute` | 从 prd.json 生成迭代提示 |
| `review` | 显示代码审查提示词 |
| `detect <text>` | 自然语言自动检测模式 |
| `slash /apex:mode <name>` | 斜杠命令 |
| `spec init` | 初始化 Spec 工作流 |
| `spec propose "<feature>"` | 创建新功能提案 |
| `spec list` | 列出进行中的变更 |
| `spec archive <name>` | 归档已完成变更 |
| `pi setup` | 生成 Pi Coding Agent 配置 |

---

## Spec 驱动开发

支持 OpenSpec 兼容的规范驱动开发工作流：

```bash
# 初始化
node cli/main.js spec init

# 提出新功能
node cli/main.js spec propose "分子性质预测器"

# 产物在 openspec/changes/ 目录下
# openspec/changes/molecular-property-predictor/
#   ├── proposal.md
#   ├── design.md
#   └── tasks.md

# 列出活跃变更
node cli/main.js spec list

# 归档完成
node cli/main.js spec archive molecular-property-predictor
```

---

## 科学技能使用

149 个科学技能覆盖多个科研领域，每个技能提供领域知识、代码示例和脚本工具。

**主要科学技能分类：**

| 分类 | 代表技能 |
|------|---------|
| 🧬 生物信息学 | scanpy, biopython, anndata, pysam, pydeseq2 |
| 🧪 化学信息学 | rdkit, deepchem, datamol, molfeat, diffdock |
| 🔬 蛋白质组学 | esm, primekg, molecular-dynamics |
| 🏥 临床医学 | pydicom, pyhealth, pathml, bids |
| 🤖 机器学习 | pytorch-lightning, transformers, scikit-learn |
| 🌌 物理天文 | astropy, qiskit, cirq, sympy |
| 📚 学术写作 | pdf, docx, xlsx, pptx, scientific-writing |

技能自动从 `skills/<名称>/SKILL.md` 发现，通过触发器匹配自动注入到对应阶段，无需手动配置。

---

## 环境要求

- **Node.js >= 20.0.0**（推荐 Node 22+）
- **~50MB 磁盘空间**（188 个技能全部内嵌）
- 无需 npm 包（零运行时依赖）

---

## 许可

MIT
