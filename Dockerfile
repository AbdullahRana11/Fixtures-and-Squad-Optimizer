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


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Build the TypeScript backend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./

# Compile TS → dist/
RUN npm run build && ls -R dist


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# node:20-alpine already ships with a built-in 'node' user at UID 1000
# (HF Spaces requirement). No need to create a new user.

WORKDIR /app

# Install ALL deps (need ts-node + prisma for seeding at startup)
COPY backend/package*.json ./
RUN npm ci

# Compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Prisma schema + generated client
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma  ./node_modules/@prisma
COPY backend/prisma ./prisma

# Built React frontend (Express will serve this as static files)
COPY --from=frontend-builder /app/frontend/dist ./public

# Dataset file for FPL seed
COPY FPL_Real_Players_25_26.xlsx ./FPL_Real_Players_25_26.xlsx

RUN chown -R node:node /app
USER node

# HF Spaces exposes port 7860
EXPOSE 7860

# Startup: push schema → seed teams/players → start server
CMD ["sh", "-c", "\
  npx prisma db push --accept-data-loss && \
  npx ts-node --skip-project prisma/seed.ts && \
  npx ts-node --skip-project prisma/seed_cricket.ts && \
  node dist/index.js \
"]
