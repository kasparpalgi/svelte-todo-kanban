# Use Node.js base image
FROM node:20-slim

ENV LANG=en_US.UTF-8
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

# Copy config files needed for npm install
COPY package*.json ./
COPY svelte.config.js ./
COPY vite.config.ts ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy the rest
COPY . .

# Build - SvelteKit will use empty strings for missing env vars during build
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# Runtime env
ENV NODE_ENV=production
ENV PORT=80
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 80
CMD ["node", "build/index.js"]