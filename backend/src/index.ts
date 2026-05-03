import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uclController from './controllers/ucl.controller';
import * as fplController from './controllers/fpl.controller';
import * as fixturesController from './controllers/fixtures.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
}));
app.use(express.json({ limit: '10mb' }));

// --- UCL Draw Routes ---
app.post('/api/ucl/draw-match', uclController.drawMatch);

// --- FPL Optimizer Routes ---
app.post('/api/fpl/optimize', fplController.optimizeSquad);
app.post('/api/fpl/swap-node', fplController.constrainedSwap);
app.get('/api/fpl/players', fplController.getAllPlayers);
app.post('/api/fpl/optimize-matchweek', fixturesController.optimizeMatchweek);

// --- Fixture Generation Routes ---
app.get('/api/fixtures/teams/:league', fixturesController.getTeams);
app.post('/api/fixtures/generate', fixturesController.generateFixtures);
app.post('/api/fixtures/predict', fixturesController.predictMatch);
app.post('/api/fixtures/modify', fixturesController.modifyFixture);
app.post('/api/fixtures/fa-cup/next-round', fixturesController.advanceFACupRound);
app.post('/api/fixtures/ucl/next-round', fixturesController.getNextUCLRound);
app.get('/api/fixtures/pl/season', fixturesController.getSeasonFixtures);
app.post('/api/fixtures/sync-tournaments', fixturesController.syncTournaments);
app.get('/api/fixtures/rescheduling-log', fixturesController.getReschedulingLog);

// --- Tournament Persistence Routes ---
app.post('/api/tournaments/save', fixturesController.saveTournament);
app.get('/api/tournaments/type/:type', fixturesController.getTournamentsByType); // must be before /:id
app.get('/api/tournaments/:id', fixturesController.getTournament);

// --- Stats Routes ---
app.get('/api/stats/players', fixturesController.getPlayerStats);

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
