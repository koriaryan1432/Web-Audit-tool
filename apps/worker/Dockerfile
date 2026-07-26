# ─── Stage 1: deps ────────────────────────────────────────────────────────────
# Use Debian-based image — Playwright/Chromium need glibc (not musl/alpine)
FROM node:20-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/shared/package.json* ./packages/shared/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: playwright browser install ──────────────────────────────────────
FROM node:20-bookworm-slim AS playwright-install
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# System deps for Chromium / Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install Playwright browsers (Chromium only — saves ~500MB vs all browsers)
RUN npx playwright install chromium --with-deps 2>/dev/null || true

# ─── Stage 3: builder ─────────────────────────────────────────────────────────
FROM playwright-install AS builder

# Generate Prisma client
RUN pnpm --filter @sitegade/worker exec prisma generate 2>/dev/null || \
    pnpm --filter @sitegarde/worker exec prisma generate 2>/dev/null || true

# Build worker (tsc → dist/)
RUN pnpm --filter @sitegade/worker build 2>/dev/null || \
    pnpm --filter @sitegarde/worker build 2>/dev/null || true

# ─── Stage 4: runner ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Re-install system deps for Chromium at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 worker

# Copy Playwright browsers
COPY --from=builder --chown=worker:nodejs /ms-playwright /ms-playwright

# Copy built app + deps
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder --chown=worker:nodejs /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/apps/worker/node_modules ./apps/worker/node_modules 2>/dev/null || true
COPY --from=builder --chown=worker:nodejs /app/package.json ./package.json

USER worker

# Worker is a queue consumer — no exposed port, no healthcheck via HTTP
CMD ["node", "apps/worker/dist/index.js"]
