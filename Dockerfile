# Stage 1 — Build the Vite / React frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Empty string → relative URLs → same-origin API calls (no CORS)
ENV VITE_API_URL=""

RUN npm run build && ls -R dist
# Output → /app/frontend/dist


# Stage 2 — Build the TypeScript backend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS backend-builder

# Install openssl and ca-certificates for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package*.json ./
# Copy prisma schema early so postinstall (prisma generate) works
COPY backend/prisma ./prisma/

RUN npm ci

COPY backend/ ./

# Explicitly generate just in case, then compile TS -> dist/
RUN npx prisma generate && npm run build && ls -R dist


# Stage 3 — Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS production

# Install openssl and ca-certificates for Prisma and secure DB connection
RUN apt-get update && apt-get install -y openssl ca-certificates libssl-dev && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files (for reference and npx usage)
COPY --from=backend-builder /app/backend/package*.json ./

# Copy built backend + pre-installed node_modules + prisma schema
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy dataset for FPL seeding
COPY FPL_Real_Players_25_26.xlsx ./FPL_Real_Players_25_26.xlsx
COPY dataset ./dataset

# HF Spaces requires the 'node' user (UID 1000)
RUN chown -R node:node /app
USER node

# HF Spaces exposes port 7860
EXPOSE 7860

# Startup: Start server immediately in foreground, run DB tasks in background
# This ensures the port is opened instantly so HF Spaces sees the app as 'Running'.
CMD ["sh", "-c", "\
  (npx prisma db push --accept-data-loss && node dist/prisma/seed.js && node dist/prisma/seed_cricket.js) & \
  node dist/src/index.js \
"]
