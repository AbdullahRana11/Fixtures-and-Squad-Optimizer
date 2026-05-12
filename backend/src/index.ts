import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import uclController from './controllers/ucl.controller';
import * as fplController from './controllers/fpl.controller';
import * as fixturesController from './controllers/fixtures.controller';


import { apiLimiter, optimizeLimiter, strictLimiter } from './middleware/rateLimiter';
import { 
  validate, errorHandler, generateFixturesSchema, predictMatchSchema, 
  modifyFixtureSchema, optimizeSquadSchema, constrainedSwapSchema, 
  optimizeMatchweekSchema, saveTournamentSchema, syncTournamentsSchema 
} from './middleware/validation';
import { prisma } from './db/prismaClient';

dotenv.config();

const app = express();
// HF Spaces requires port 7860; fallback to 3001 for local dev
const port = process.env.PORT || 3001;

app.use(cors({
  origin: '*'
}));
app.use(express.json({ limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', port, env: process.env.NODE_ENV }));

// --- UCL Draw Routes ---
app.post('/api/ucl/draw-match', optimizeLimiter, uclController.drawMatch);

// --- FPL Optimizer Routes ---
app.post('/api/fpl/optimize', optimizeLimiter, validate(optimizeSquadSchema), fplController.optimizeSquad);
app.post('/api/fpl/swap-node', optimizeLimiter, validate(constrainedSwapSchema), fplController.constrainedSwap);
app.get('/api/fpl/players', fplController.getAllPlayers);
app.post('/api/fpl/optimize-matchweek', optimizeLimiter, validate(optimizeMatchweekSchema), fixturesController.optimizeMatchweek);

// --- Fixture Generation Routes ---
app.get('/api/fixtures/teams/:league', fixturesController.getTeams);
app.post('/api/fixtures/generate', strictLimiter, validate(generateFixturesSchema), fixturesController.generateFixtures);
app.post('/api/fixtures/predict', optimizeLimiter, validate(predictMatchSchema), fixturesController.predictMatch);
app.post('/api/fixtures/modify', validate(modifyFixtureSchema), fixturesController.modifyFixture);
app.post('/api/fixtures/fa-cup/next-round', strictLimiter, fixturesController.advanceFACupRound);
app.post('/api/fixtures/ucl/next-round', strictLimiter, fixturesController.getNextUCLRound);
app.post('/api/fixtures/ucl-swiss/generate', strictLimiter, fixturesController.generateUCLSwiss);
app.post('/api/fixtures/simulate', optimizeLimiter, fixturesController.simulateFixtures);
app.get('/api/fixtures/pl/season', fixturesController.getSeasonFixtures);
app.post('/api/fixtures/sync-tournaments', validate(syncTournamentsSchema), fixturesController.syncTournaments);
app.get('/api/fixtures/rescheduling-log', fixturesController.getReschedulingLog);

// --- Tournament Persistence Routes ---
app.post('/api/tournaments/save', validate(saveTournamentSchema), fixturesController.saveTournament);
app.get('/api/tournaments/type/:type', fixturesController.getTournamentsByType); // must be before /:id
app.get('/api/tournaments/:id', fixturesController.getTournament);

// --- Stats Routes ---
app.get('/api/stats/players', fixturesController.getPlayerStats);

app.use(errorHandler);

// ── Production: serve Vite build + SPA fallback ──────────────────────────
// In Docker/HF Spaces the frontend build is copied to ./public next to dist/
// CommonJS: __dirname is available natively (dist/index.js → dist/../public)
const publicDir = path.resolve(__dirname, '..', 'public');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  console.log(`✅ Serving frontend from: ${publicDir}`);
} else {
  console.log(`ℹ️  No /public dir found — frontend served separately (dev mode)`);
}

const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async () => {
  console.log('Shutting down server...');
  server.close(() => console.log('HTTP server closed.'));
  await prisma.$disconnect();
  console.log('Prisma disconnected.');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
