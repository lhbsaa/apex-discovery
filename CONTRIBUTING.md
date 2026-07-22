# Contributing to apex-discovery

## Development Setup

```bash
git clone https://github.com/lhbsaa/apex-discovery.git
cd apex-discovery
npm test
```

## Requirements

- Node.js >= 20.0.0 (Node 22+ recommended for best performance)

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Run `npm test` before submitting
4. Ensure all tests pass (47+ tests)

## Code Style

- ESM modules (`"type": "module"`)
- No external runtime dependencies
- Prefer `const` over `let`
- Use functional array methods (`.map`, `.filter`) over `for` loops
