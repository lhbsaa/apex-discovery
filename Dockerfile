FROM node:22-alpine
WORKDIR /app

# Copy only what's needed for runtime
COPY package.json ./
COPY cli/ ./cli/
COPY core/ ./core/
COPY config/ ./config/
COPY skills/ ./skills/
COPY agents/ ./agents/
COPY scripts/ ./scripts/
COPY adapters/ ./adapters/
COPY LICENSE README.md README_ZH.md AGENTS.md CHANGELOG.md SECURITY.md ./

# No npm install needed — zero runtime dependencies

ENTRYPOINT ["node", "cli/main.js"]
CMD ["--help"]
