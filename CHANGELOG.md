# Changelog

## [0.2.0] — 2026-07-22

### Added
- **Port of apex-unified v0.2.0 engine**: All 10 core engines, 38 development skills, 18 agents, 6 modes, 7 phases fully integrated
- **149 scientific skills**: All skills from scientific-agent-skills embedded directly in `skills/` directory
- **Standalone architecture**: No external dependencies, no git clone of scientific-agent-skills needed
- **Research-scientist mode**: New default mode combining development + scientific skills
- **Cross-platform junction handling**: `countScientificSkills()` handles both `isDirectory()` and `isSymbolicLink()` for Windows compatibility

### Changed
- **Architecture**: From extension-of-apex-unified → fully standalone project
- **`cli/main.js`**: Rewritten from thin wrapper (72 lines) to full CLI (515 lines) with all 12 commands
- **`config/defaults.json`**: Merged apex-unified's 5 modes + research-scientist mode (6 modes total)
- **`scripts/setup.js`**: Rewritten from clone+symlink to verification-only (skills now embedded)
- **`tests/unit.test.js`**: Merged from both projects, 47 tests covering all engines + scientific skills
- **`package.json`**: Both `apex` and `apex-discovery` CLI aliases, added test/demo/stress scripts
- **`.gitignore`**: Removed scientific-agent-skills exclusion

### Fixed
- CI would fail because test asserted `../apex-unified/cli/main.js` exists
- Command injection vulnerability via `execSync` with user args
- `countSkills()` only checked `isDirectory()` on Windows (junctions appear as symlinks)
- Setup script silently swallowed symlink errors on Windows
- README had 7+ skill listing inaccuracies (typos, duplicates, missing entries)
- Config referenced 6 non-existent skills
- Double-counting of skills in status output (39 dev + 149 sci = 188 unique)

## [0.1.0] — 2026-07-17

### Added
- Initial project scaffold with scientific-agent-skills integration
- Scripts/setup.js: git clone + junction linking for 149 scientific skills
- 3 core tests (skills dir, config, apex-unified engine detection)
