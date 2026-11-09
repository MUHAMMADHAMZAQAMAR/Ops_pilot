# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs ./
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY types/ ./types/
COPY middleware.ts ./middleware.ts

# Production build
RUN npm run build

# Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

USER node

COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

