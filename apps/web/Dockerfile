FROM node:20-alpine AS build
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# VITE_* vars are baked into the bundle at build time.
# Set these as Build Variables in Railway before deploying.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/apps/web
RUN npm run build

# Serve the static build with a lightweight node server
FROM node:20-alpine
RUN npm install -g serve
COPY --from=build /app/apps/web/dist /dist
CMD ["sh", "-c", "serve -s /dist -l ${PORT:-3000}"]
