# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY libs ./libs
COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json prisma.config.ts ./

RUN npx prisma generate

RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/libs/infrastructure/persistence/prisma ./libs/infrastructure/persistence/prisma

USER node
EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
