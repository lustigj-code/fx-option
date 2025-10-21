# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/admin apps/admin

# Install pnpm
RUN npm install -g pnpm@10.17.0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build UI kit first (dependency)
RUN pnpm --filter ui-kit build

# Build admin
RUN pnpm --filter admin build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install pnpm
RUN npm install -g pnpm@10.17.0

# Copy necessary files from builder
COPY --from=builder /app/apps/admin/next.config.js ./
COPY --from=builder /app/apps/admin/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next ./.next
COPY --from=builder /app/apps/admin/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["pnpm", "start"]
