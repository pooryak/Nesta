FROM node:20-slim

# Playwright requires these system libs for Chromium
RUN apt-get update && apt-get install -y \
    wget ca-certificates fonts-liberation \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libgtk-3-0 libgbm1 libasound2 libxss1 libxrandr2 libxcomposite1 \
    libxcursor1 libxi6 libxtst6 libxkbcommon0 libpango-1.0-0 libcairo2 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Download Chromium binary (uses the version pinned by the playwright package)
RUN npx playwright install chromium

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/server.js"]
