# Use Node.js base image that works on both AMD64 and ARM64
FROM node:20-slim

ENV LANG=en_US.UTF-8

# Skip Puppeteer's chromium download -> install it manually
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install Chrome/Chromium & dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-khmeros \
    fonts-kacst \
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Remove dev dependencies (reduce image size)
RUN npm prune --omit=dev

# Set env vars
ENV NODE_ENV=production
ENV PORT=80
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 80
CMD ["node", "build/index.js"]