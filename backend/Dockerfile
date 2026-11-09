# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies including devDependencies for build
RUN npm install

# Copy source code and configs
COPY tsconfig.json ./
COPY src/ ./src/
COPY db/ ./db/

# Compile TypeScript
RUN npm run build

# Prune devDependencies
RUN npm prune --production

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user
USER node

# Copy built application and production dependencies from builder
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/db ./db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]

