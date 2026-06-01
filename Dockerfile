# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Tell pnpm we're in CI (prevents TTY prompts)
ENV CI=true

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies (ignore scripts initially to avoid approval prompt)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Manually run build for better-sqlite3
RUN cd node_modules/better-sqlite3 && pnpm rebuild

# Copy source code
COPY . .

# Build the application (server + client)
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Tell pnpm we're in CI (prevents TTY prompts)
ENV CI=true

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml .npmrc ./

# Install production dependencies only (ignore scripts)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Manually run build for better-sqlite3
RUN cd node_modules/better-sqlite3 && pnpm rebuild

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations (must be at /app/drizzle for migrate script)
COPY --from=builder /app/drizzle ./drizzle

# Copy startup script
COPY --from=builder /app/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

# Copy production scripts
COPY --from=builder /app/scripts/seed-user-prod.mjs ./scripts/seed-user-prod.mjs
COPY --from=builder /app/scripts/add-device.mjs ./scripts/add-device.mjs

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the server (runs migrations first)
CMD ["./start.sh"]
