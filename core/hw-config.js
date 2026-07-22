/**
 * apex-discovery Hardware Configuration System
 *
 * Reads hardware.json and provides pin/peripheral/MCU constraints
 * to phase-engine prompts. Generates templates for embedded projects.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const HW_FILE = 'hardware.json';

/** Load hardware config from project root */
export function loadHwConfig(cwd) {
  const path = join(cwd || process.cwd(), HW_FILE);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { error: `Failed to parse ${HW_FILE}: ${e.message}` };
  }
}

/** Generate a hardware.json template for a given framework */
export function generateHwConfig(framework, projectName) {
  const templates = {
    espidf: {
      project: projectName || 'my-firmware',
      mcu: 'esp32-s3',
      framework: 'espidf',
      board: 'esp32-s3-devkitc-1',
      flash_size: '16MB',
      psram: '8MB',
      clock: 240000000,
      peripherals: {
        i2c: { sda: 1, scl: 2 },
        spi: { mosi: 11, miso: 13, clk: 12, cs: 10 },
        uart: { tx: 43, rx: 44, baud: 115200 },
        pins: { led_builtin: 48 }
      }
    },
    platformio: {
      project: projectName || 'my-firmware',
      mcu: 'esp32-s3',
      framework: 'arduino',
      board: 'esp32-s3-devkitc-1',
      flash_size: '16MB',
      psram: '8MB',
      clock: 240000000,
      peripherals: {
        i2c: { sda: 1, scl: 2 },
        spi: { mosi: 11, miso: 13, clk: 12, cs: 10 },
        uart: { tx: 43, rx: 44, baud: 115200 },
        pins: { led_builtin: 48 }
      }
    },
    arduino: {
      project: projectName || 'my-firmware',
      mcu: 'esp32',
      framework: 'arduino',
      board: 'esp32-dev',
      flash_size: '4MB',
      clock: 240000000,
      peripherals: {
        i2c: { sda: 21, scl: 22 },
        spi: { mosi: 23, miso: 19, clk: 18, cs: 5 },
        uart: { tx: 1, rx: 3, baud: 115200 },
        pins: { led_builtin: 2 }
      }
    }
  };
  return templates[framework] || null;
}

/** Format hardware constraints as a prompt fragment */
export function hwConstraintsPrompt(cwd) {
  const hw = loadHwConfig(cwd);
  if (!hw) return '';
  return `
## Hardware Constraints
- MCU: ${hw.mcu} @ ${hw.clock || 'unknown'}Hz
- Framework: ${hw.framework}
- Board: ${hw.board || 'generic'}
- Flash: ${hw.flash_size || 'unknown'} | PSRAM: ${hw.psram || 'none'}
- Peripherals:
${Object.entries(hw.peripherals || {})
  .filter(([k]) => k !== 'pins')
  .map(([k, v]) => `  - ${k.toUpperCase()}: ${JSON.stringify(v)}`).join('\n')}
- Allocated Pins: ${JSON.stringify(hw.peripherals?.pins || {})}
`.trim();
}

/** Detect project framework from directory contents */
export function detectFramework(cwd) {
  const dir = cwd || process.cwd();
  if (existsSync(join(dir, 'platformio.ini'))) return { framework: 'platformio', build: 'pio run', conf: 'platformio.ini' };
  if (existsSync(join(dir, 'CMakeLists.txt'))) {
    const cmake = readFileSync(join(dir, 'CMakeLists.txt'), 'utf8');
    if (cmake.includes('IDF_PATH') || cmake.includes('project.cmake')) return { framework: 'espidf', build: 'idf.py build', conf: 'CMakeLists.txt' };
    return { framework: 'cmake', build: 'cmake --build .', conf: 'CMakeLists.txt' };
  }
  const files = readdirSync(dir);
  if (files.some(f => f.endsWith('.ino'))) return { framework: 'arduino', build: 'arduino-cli compile', conf: '*.ino' };
  return null;
}
