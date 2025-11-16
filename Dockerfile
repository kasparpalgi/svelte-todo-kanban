FROM node:20-slim

ENV LANG=en_US.UTF-8
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

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

# Use npm install instead of npm ci (less strict)
RUN npm install --production=false

COPY . .
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=80
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 80
CMD ["node", "build/index.js"]