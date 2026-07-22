---
name: sdk-scan
description: "Scan vendor SDK examples and GitHub for reference code matching a hardware/peripheral query. Triggers on: find example, 找示例, SDK example, reference code, 参考代码, show me how to, demo."
apex-version: "1.0"
apex-id: "embedded:sdk-scan"
apex-category: technique
apex-compatibility: [gsd, superpowers]
apex-lifecycle:
  phase: [explore, discuss, plan]
  triggers:
    - "user says: find example for"
    - "user says: 找示例"
    - "user says: reference code"
    - "user says: how to use I2C/SPI/UART"
    - "user says: SDK example"
---
# sdk-scan — SDK Example Scanner

Scan vendor SDK examples and GitHub for reference code patterns.

## Workflow

1. Detect project framework (ESP-IDF / PlatformIO / Arduino)
2. Scan local SDK examples directories:
   - ESP-IDF: `$IDF_PATH/examples/peripherals/`
   - Arduino: Arduino library examples
   - PlatformIO: registry examples
3. Search GitHub for matching projects
4. Extract relevant code patterns
5. Adapt to project hardware config (hardware.json)

## Commands

| Trigger | Action |
|---------|--------|
| "find example for I2C SSD1306" | Scan SDK + GitHub, return top 3 references |
| "show me how to use MQTT" | Find ESP-MQTT examples + adapt to project |
| "reference code for BLE" | Find NimBLE/Bluedroid examples |

## Output Format

```
Found 3 references for "i2c ssd1306":
1. ESP-IDF examples/peripherals/i2c/i2c_simple
   → I2C master init + write pattern
2. GitHub espressif/esp-idf-ssd1306
   → SSD1306 driver with framebuffer
3. Component: ssd1306 (in lib/)
   → Already in project, ready to use

Recommended: Adapt example #1 → use project pins from hardware.json
- SDA: 1, SCL: 2 (vs example's defaults)
- Clock: 400kHz (standard I2C)
- No pull-up needed (built-in on board)
```
