import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FixtureGenerator, TeamInfo } from '../algorithms/fixture-generator';
import { CLLeaguePhaseEngine, CLTeamInfo } from '../algorithms/cl-league-phase-engine';
import { FACupEngine, FACupTeam } from '../algorithms/fa-cup-engine';
import { MatchPredictor } from '../algorithms/match-predictor';
import { FPLKnapsackEngine } from '../algorithms/fpl-knapsack-engine';
import clTeamsJson from '../data/cl-teams.json';

const prisma = new PrismaClient();

// Sheet source mapping for each competition
const LEAGUE_SHEET_MAP: Record<string, string> = {
  pl: 'English_FA_Pool_64',
  laliga: 'Spanish_League_40',
  seriea: 'Italian_League_40',
  bundesliga: 'German_League_40',
  facup: 'English_FA_Pool_64',
  custom: 'All', // Fetch from all available pools for custom
};

// Standard league → required top-tier league name
const LEAGUE_FILTER_MAP: Record<string, string> = {
  pl: 'Premier League',
  laliga: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
};

// Required team counts
const REQUIRED_COUNTS: Record<string, number> = {
  pl: 20,
  laliga: 20,
  seriea: 20,
  bundesliga: 18,
  ucl: 36,
  facup: 64,
  custom: 20, // Default to 20 but user can pick
};

/**
 * GET /api/fixtures/teams/:league
 */
export const getTeams = async (req: Request, res: Response) => {
  try {
    const { league } = req.params;

    // UCL uses the JSON file directly
    if (league === 'ucl') {
      const teams = (clTeamsJson as any[]).map((t, i) => ({
        id: `ucl-${i}`,
        name: t.name,
        league: 'Champions League',
        city: t.name, // simplified
        stadium: t.stadium,
        biggest_rival: null,
        policing_conflict: null,
        other_rivals: null,
        country_code: t.country,
        uefa_pot: t.pot,
        home_advantage: t.homeAdvantage,
        geographic_zone: t.zone,
        winter_restricted: t.winterRestricted,
      }));

      return res.json({
        league: 'ucl',
        totalAvailable: teams.length,
        requiredCount: REQUIRED_COUNTS.ucl,
        topLeague: null,
        teams,
      });
    }

    const sheetSource = LEAGUE_SHEET_MAP[league];
    if (!sheetSource) {
      return res.status(400).json({ error: { message: `Unknown league: ${league}` } });
    }

    const where: any = {};
    if (sheetSource !== 'All') {
      where.sheet_source = sheetSource;
    }

    const teams = await prisma.team.findMany({
      where,
      orderBy: { league: 'asc' },
      select: {
        id: true, name: true, league: true, city: true, stadium: true,
        biggest_rival: true, policing_conflict: true, other_rivals: true,
        uefa_pot: true, home_advantage: true, geographic_zone: true,
        winter_restricted: true, country_code: true,
      },
    });

    const requiredCount = REQUIRED_COUNTS[league] || teams.length;
    const topLeague = LEAGUE_FILTER_MAP[league];

    return res.json({ league, totalAvailable: teams.length, requiredCount, topLeague, teams });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * POST /api/fixtures/generate
 */
export const generateFixtures = async (req: Request, res: Response) => {
  try {
    const { league, teamNames, mode = 'auto' } = req.body;

    if (!league || !teamNames || !Array.isArray(teamNames)) {
      return res.status(400).json({ error: { message: 'Missing league or teamNames' } });
    }

    const requiredCount = REQUIRED_COUNTS[league];
    if (requiredCount && teamNames.length !== requiredCount) {
      return res.status(400).json({
        error: { message: `${league} requires exactly ${requiredCount} teams, got ${teamNames.length}` },
      });
    }

    // ---- LEAGUE MODE (PL, La Liga, Serie A, Bundesliga, Custom) ----
    if (['pl', 'laliga', 'seriea', 'bundesliga', 'custom'].includes(league)) {
      const teams = await prisma.team.findMany({ where: { name: { in: teamNames } } });
      const teamInfos: TeamInfo[] = teams.map(t => ({
        name: t.name, city: t.city, stadium: t.stadium,
        biggest_rival: t.biggest_rival, policing_conflict: t.policing_conflict,
      }));

      // Fill missing with name-based placeholders
      for (const name of teamNames) {
        if (!teamInfos.find(t => t.name === name)) {
          teamInfos.push({ name, city: 'Unknown', stadium: 'Unknown', biggest_rival: null, policing_conflict: null });
        }
      }

      const engine = new FixtureGenerator(teamInfos.slice(0, requiredCount), league, 2025);
      const schedule = engine.generate();
      return res.json(schedule);
    }

    // ---- CHAMPIONS LEAGUE (from JSON) ----
    if (league === 'ucl') {
      const allCL = clTeamsJson as any[];
      const selected = allCL.filter(t => teamNames.includes(t.name));

      const clTeams: CLTeamInfo[] = selected.map(t => ({
        name: t.name, country: t.country, pot: t.pot,
        stadium: t.stadium, homeAdvantage: t.homeAdvantage,
        winterRestricted: t.winterRestricted,
      }));

      const engine = new CLLeaguePhaseEngine(clTeams);
      const clResult = engine.generate();
      
      // Map back to SeasonSchedule format for frontend
      const mappedFixtures: any[] = [];
      for (const md of clResult.matchdays) {
        for (const m of md.matches) {
          mappedFixtures.push({
            id: m.id,
            matchweek: md.matchday,
            home: m.home,
            away: m.away,
            date: md.date,
            time: m.time,
            stadium: m.stadium,
            is_derby: false // Could be enhanced later
          });
        }
      }

      return res.json({
        league: 'ucl',
        season: '2024-25',
        teams: clResult.teams,
        totalMatchweeks: 8,
        totalMatches: mappedFixtures.length,
        fixtures: mappedFixtures,
        telemetry: clResult.telemetry
      });
    }

    // ---- FA CUP ----
    if (league === 'facup') {
      const teams = await prisma.team.findMany({ where: { name: { in: teamNames } } });
      const faCupTeams: FACupTeam[] = teams.map(t => ({
        name: t.name, league: t.league, city: t.city, stadium: t.stadium,
      }));

      // Fill missing
      for (const name of teamNames) {
        if (!faCupTeams.find(t => t.name === name)) {
          faCupTeams.push({ name, league: 'Unknown', city: 'Unknown', stadium: 'Unknown' });
        }
      }

      const engine = new FACupEngine(faCupTeams.slice(0, 64));

      if (mode === 'auto') {
        return res.json(engine.generateFullBracket());
      } else {
        return res.json(engine.generateDraw());
      }
    }

    return res.status(400).json({ error: { message: `Unsupported league: ${league}` } });
  } catch (error: any) {
    console.error('Fixture generation error:', error);
    return res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
};

/**
 * POST /api/fixtures/predict
 * Match Intelligence — predict outcome between two teams.
 * Body: { homeTeam, awayTeam, homeLeague?, awayLeague?, isDerby?, homePot?, awayPot? }
 */
export const predictMatch = async (req: Request, res: Response) => {
  try {
    const { homeTeam, awayTeam, homeLeague, awayLeague, isDerby, homePot, awayPot } = req.body;

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({ error: { message: 'Missing homeTeam or awayTeam' } });
    }

    // Try to fetch team data from DB for strength info
    const [homeData, awayData] = await Promise.all([
      prisma.team.findFirst({ where: { name: homeTeam } }),
      prisma.team.findFirst({ where: { name: awayTeam } }),
    ]);

    const homeProfile = MatchPredictor.buildProfile(
      homeTeam, homeLeague || homeData?.league || 'Unknown', true,
      {
        homeAdvantage: homeData?.home_advantage || 1.1,
        rivalryFactor: isDerby ? 0.9 : (homeData?.biggest_rival === awayTeam ? 0.8 : 0),
        pot: homePot || homeData?.uefa_pot || undefined,
      }
    );

    const awayProfile = MatchPredictor.buildProfile(
      awayTeam, awayLeague || awayData?.league || 'Unknown', false,
      {
        homeAdvantage: awayData?.home_advantage || 1.0,
        rivalryFactor: isDerby ? 0.9 : (awayData?.biggest_rival === homeTeam ? 0.8 : 0),
        pot: awayPot || awayData?.uefa_pot || undefined,
      }
    );

    const prediction = MatchPredictor.predict(homeProfile, awayProfile);
    return res.json(prediction);
  } catch (error: any) {
    console.error('Prediction error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * POST /api/fixtures/modify
 */
export const modifyFixture = async (req: Request, res: Response) => {
  try {
    const { schedule, fixtureId } = req.body;
    if (!schedule || !fixtureId) {
      return res.status(400).json({ error: { message: 'Missing schedule or fixtureId' } });
    }
    return res.json(FixtureGenerator.suggestModification(schedule, fixtureId));
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * POST /api/fixtures/fa-cup/next-round
 */
export const advanceFACupRound = async (req: Request, res: Response) => {
  try {
    const { bracket, winners } = req.body;
    if (!bracket || !winners) {
      return res.status(400).json({ error: { message: 'Missing bracket or winners' } });
    }
    return res.json(FACupEngine.simulateNextRound(bracket, winners));
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * POST /api/fpl/optimize-matchweek
 * FPL Integration — optimize squad with fixture context for a specific matchweek.
 * Body: { budget, matchweek, fixtures: [{home, away}], k_index? }
 */
export const optimizeMatchweek = async (req: Request, res: Response) => {
  try {
    const { budget = 100, matchweek, fixtures, k_index = 1 } = req.body;

    if (!matchweek || !fixtures || !Array.isArray(fixtures)) {
      return res.status(400).json({ error: { message: 'Missing matchweek or fixtures' } });
    }

    // Build opponent difficulty map: team → opponent name
    const opponentMap = new Map<string, { opponent: string; isHome: boolean }>();
    for (const f of fixtures) {
      opponentMap.set(f.home, { opponent: f.away, isHome: true });
      opponentMap.set(f.away, { opponent: f.home, isHome: false });
    }

    const players = await prisma.player.findMany();

    // Adjust player values based on fixture context
    const adjustedPlayers = players.map(p => {
      const matchup = opponentMap.get(p.club);
      if (!matchup) return p; // Club not playing this MW

      // Boost home players, slight nerf for away
      const homeBoost = matchup.isHome ? 1.08 : 0.95;

      return {
        ...p,
        home_stadium_multiplier: p.home_stadium_multiplier * homeBoost,
      };
    });

    const engine = new FPLKnapsackEngine(adjustedPlayers, budget, k_index);
    const result = engine.optimize();

    return res.json({
      ...result,
      matchweek,
      fixtureContext: fixtures,
    });
  } catch (error: any) {
    console.error('FPL matchweek error:', error);
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// Legacy endpoint
export const generateSeason = async (req: Request, res: Response) => {
  try {
    const teamsData = await prisma.team.findMany({
      where: { sheet_source: 'English_FA_Pool_64', league: 'Premier League' },
      select: { name: true, city: true, stadium: true, biggest_rival: true, policing_conflict: true },
    });

    const teamInfos: TeamInfo[] = (teamsData.length >= 20 ? teamsData.slice(0, 20) : Array.from({ length: 20 }, (_, i) => ({
      name: `Team ${i + 1}`, city: `City ${i + 1}`, stadium: `Stadium ${i + 1}`, biggest_rival: null, policing_conflict: null,
    }))).map(t => ({ ...t }));

    const engine = new FixtureGenerator(teamInfos, 'pl', 2025);
    return res.json(engine.generate());
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
