# BLOCK SCREEN — QR Code stock management
FROM node:22-slim

WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source
COPY src ./src
COPY public ./public

# Data directory for the SQLite (sql.js) database — mounted as a volume
RUN mkdir -p /app/data
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/blockscreen.db

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "src/server.js"]
