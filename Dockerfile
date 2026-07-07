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

# หมายเหตุ: ไม่ใช้ VOLUME เพราะ Railway ไม่รองรับ (ถ้ารันบน Docker/Compose
# การ persist ข้อมูลจัดการที่ docker-compose ผ่าน named volume แทน)
CMD ["node", "src/server.js"]
