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

# Copy package files AND svelte.config.js (needed for prepare script)
COPY package*.json ./
COPY svelte.config.js ./

# Install dependencies
RUN npm ci

# Now copy the rest of the application
COPY . .

RUN echo "AUTH_SECRET=dummy" > .env && \
    echo "AUTH_TRUST_HOST=true" >> .env && \
    echo "SECRET_ENCRYPTION_KEY=dummy" >> .env && \
    echo "AUTH_GOOGLE_ID=dummy" >> .env && \
    echo "AUTH_GOOGLE_SECRET=dummy" >> .env && \
    echo "EMAIL_SERVER_HOST=smtp.gmail.com" >> .env && \
    echo "EMAIL_SERVER_PORT=587" >> .env && \
    echo "EMAIL_SERVER_USER=dummy@gmail.com" >> .env && \
    echo "EMAIL_SERVER_PASSWORD=dummy" >> .env && \
    echo "EMAIL_FROM=dummy@gmail.com" >> .env && \
    echo "API_ENDPOINT=http://localhost:3001/v1/graphql" >> .env && \
    echo "API_ENDPOINT_DEV=http://localhost:3001/v1/graphql" >> .env && \
    echo "HASURA_ADMIN_SECRET=dummy" >> .env && \
    echo "B2_KEY_ID=dummy" >> .env && \
    echo "B2_APPLICATION_KEY=dummy" >> .env && \
    echo "B2_BUCKET_NAME=dummy" >> .env && \
    echo "OPENAI_API_KEY=dummy" >> .env && \
    echo "MAX_FILE_SIZE=5242880" >> .env && \
    echo "ALLOWED_FILE_TYPES=image/jpeg" >> .env && \
    echo "GITHUB_CLIENT_ID=dummy" >> .env && \
    echo "GITHUB_CLIENT_SECRET=dummy" >> .env && \
    echo "PUBLIC_APP_URL=https://www.todzz.eu" >> .env && \
    echo "PUBLIC_APP_ENV=production" >> .env && \
    echo "PUBLIC_API_ENV=production" >> .env && \
    echo "PUBLIC_API_ENDPOINT=https://todzz.admin.servicehost.io/v1/graphql" >> .env && \
    echo "PUBLIC_API_ENDPOINT_DEV=http://localhost:3001/v1/graphql" >> .env && \
    echo "PUBLIC_FULL_CARD_DRAGGABLE=false" >> .env

# Build the application
RUN npm run build

# Remove dev dependencies and .env file
RUN npm prune --omit=dev && rm -f .env

# Set runtime env vars
ENV NODE_ENV=production
ENV PORT=80
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 80
CMD ["node", "build/index.js"]