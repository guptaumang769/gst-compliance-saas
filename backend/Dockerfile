FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

FROM node:20-alpine

RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/uploads /app/pdfs && chown -R appuser:nodejs /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
