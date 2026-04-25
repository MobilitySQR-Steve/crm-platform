# Multi-stage build for the api workspace.
# Build context is the REPO ROOT (so workspaces resolve correctly).
# Build:   docker build -t crm-api -f api/Dockerfile .
# Run web: docker run --env-file api/.env -p 4000:4000 crm-api
# Run cron: docker run --env-file api/.env crm-api node api/dist/api/scripts/morning-cron.js

# ── Build stage ──────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

# OpenSSL is required for Prisma to build its query engine.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install with the workspace lockfile. Copy package metadata first so
# `npm ci` is cached when only source files change.
COPY package.json package-lock.json ./
COPY api/package.json ./api/
RUN npm ci --include=dev

# Copy source needed for compile + prisma generate
COPY api/tsconfig.json ./api/
COPY api/prisma ./api/prisma
COPY api/src ./api/src
COPY api/scripts ./api/scripts

RUN npm run -w api db:generate
RUN npm run -w api build

# ── Runtime stage ────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# OpenSSL needed at runtime by the Prisma query engine.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Production-only dependency tree (smaller image).
COPY package.json package-lock.json ./
COPY api/package.json ./api/
RUN npm ci --omit=dev

# Copy compiled output + Prisma schema (the engine needs schema.prisma at runtime
# to know connection details for migrations) + the generated client.
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/api/prisma ./api/prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Default command — overridden by the Render cron service.
CMD ["node", "api/dist/src/index.js"]
