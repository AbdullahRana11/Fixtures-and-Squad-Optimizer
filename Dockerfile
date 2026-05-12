# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build the Vite / React frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

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
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
# Copy prisma schema early so postinstall (prisma generate) works
COPY backend/prisma ./prisma/

RUN npm ci

COPY backend/ ./

# Explicitly generate just in case, then compile TS -> dist/
RUN npx prisma generate && npm run build && ls -R dist


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files (for reference and npx usage)
COPY --from=backend-builder /app/backend/package*.json ./

# Copy built backend + pre-installed node_modules + prisma schema
# (This avoids re-running npm ci in the final stage)
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

# Startup: push schema -> seed data -> start Express
# We use node for seeds because they are now pre-compiled into dist/
CMD ["sh", "-c", "\
  npx prisma db push --accept-data-loss && \
  node dist/prisma/seed.js && \
  node dist/prisma/seed_cricket.js && \
  node dist/src/index.js \
"]
