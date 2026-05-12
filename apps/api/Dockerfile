FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all deps (including devDeps — tsx is needed at runtime)
RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
ENV NODE_ENV=production

CMD ["/app/node_modules/.bin/tsx", "src/index.ts"]
