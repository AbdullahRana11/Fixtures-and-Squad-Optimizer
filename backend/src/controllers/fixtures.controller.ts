import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FixtureGenerator, TeamInfo } from '../algorithms/fixture-generator';
import { CLLeaguePhaseEngine, CLTeamInfo } from '../algorithms/cl-league-phase-engine';
import { FACupEngine, FACupTeam } from '../algorithms/fa-cup-engine';
import { MatchPredictor } from '../algorithms/match-predictor';
import { CLKnockoutEngine } from '../algorithms/cl-knockout-engine';
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
  ucl: 36, // Standard league phase
  'ucl-knockout': 24, // New knockout format
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

    // Use mode-specific count if available (e.g. ucl-knockout)
    const effectiveLeague = (mode && REQUIRED_COUNTS[mode]) ? mode : league;
    const requiredCount = REQUIRED_COUNTS[effectiveLeague];

    if (requiredCount && teamNames.length !== requiredCount) {
      return res.status(400).json({
        error: { message: `${effectiveLeague} requires exactly ${requiredCount} teams, got ${teamNames.length}` },
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

    // ---- UCL KNOCKOUT ----
    if (league === 'ucl' && mode === 'ucl-knockout') {
        const engine = new CLKnockoutEngine(teamNames);
        return res.json(engine.generateInitialBracket());
    }

    // ---- CHAMPIONS LEAGUE LEAGUE PHASE (from JSON) ----
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
            is_derby: false
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
 * POST /api/fixtures/ucl/next-round
 */
export const getNextUCLRound = async (req: Request, res: Response) => {
  try {
    const { bracket, winners, roundIndex } = req.body;
    
    // Logical progression for UCL
    const nextRoundIdx = roundIndex + 1;
    if (nextRoundIdx >= bracket.rounds.length) return res.json(bracket);

    const nextRound = bracket.rounds[nextRoundIdx];
    
    // Fill matches in the next round using winners
    if (nextRound.name === 'Round of 16') {
      // Winners of playoffs (8 teams) join top 8 (who are already in bracket.away for R16)
      for (let i = 0; i < winners.length; i++) {
        nextRound.matches[i].home = winners[i];
      }
    } else {
      // QF, SF, Final
      for (let i = 0; i < winners.length; i += 2) {
        const matchIdx = Math.floor(i / 2);
        if (nextRound.matches[matchIdx]) {
          nextRound.matches[matchIdx].home = winners[i];
          nextRound.matches[matchIdx].away = winners[i + 1];
        }
      }
    }

    return res.json(bracket);
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Failed to advance UCL round' } });
  }
};

// Mapping Full Team Name -> FPL Short Code
const TEAM_CODE_MAP: Record<string, string> = {
  'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE',
  'Brighton': 'BHA', 'Brighton & Hove Albion': 'BHA', 'Chelsea': 'CHE', 'Crystal Palace': 'CRY',
  'Everton': 'EVE', 'Fulham': 'FUL', 'Ipswich Town': 'IPS', 'Ipswich': 'IPS', 'Leicester City': 'LEI', 
  'Leicester': 'LEI', 'Liverpool': 'LIV', 'Manchester City': 'MCI', 'Man City': 'MCI',
  'Manchester United': 'MUN', 'Man Utd': 'MUN', 'Newcastle United': 'NEW', 'Newcastle': 'NEW',
  'Nottingham Forest': 'NFO', 'Southampton': 'SOU', 'Tottenham Hotspur': 'TOT', 'Tottenham': 'TOT', 'Spurs': 'TOT',
  'West Ham United': 'WHU', 'West Ham': 'WHU', 'Wolverhampton Wanderers': 'WOL', 'Wolves': 'WOL'
};

/**
 * POST /api/fpl/optimize-matchweek
 */
export const optimizeMatchweek = async (req: Request, res: Response) => {
  try {
    const { budget = 100, matchweek, fixtures, k_index = 1, customPlayers = [] } = req.body;

    if (!matchweek || !fixtures || !Array.isArray(fixtures)) {
      return res.status(400).json({ error: { message: 'Missing matchweek or fixtures' } });
    }

    // Build opponent difficulty map using Short Codes
    const opponentMap = new Map<string, { opponent: string; isHome: boolean }>();
    
    for (const f of fixtures) {
      const homeCode = TEAM_CODE_MAP[f.home] || f.home;
      const awayCode = TEAM_CODE_MAP[f.away] || f.away;
      
      opponentMap.set(homeCode, { opponent: awayCode, isHome: true });
      opponentMap.set(awayCode, { opponent: homeCode, isHome: false });
    }

    const players = await prisma.player.findMany();

    // Build custom hypothetical player records (never saved to DB)
    const EXPECTATION_MAP: Record<string, number> = {
      'Hot_Streak': 1.3, 'Overperforming': 1.15, 'Expected': 1.0, 'Underperforming': 0.85
    };
    const customRecords = (customPlayers as any[]).map((cp: any) => ({
      id: cp.id,
      name: cp.name,
      club: cp.club,
      position: cp.position,
      cost_millions: Number(cp.cost_millions),
      overall_ability: Number(cp.overall_ability || 75),
      base_form: Number(cp.base_form || 5.0),
      last_3_vs_opponent_pts: Number(cp.base_form || 5.0),
      home_stadium_multiplier: 1.0,
      expectation_multiplier: EXPECTATION_MAP[cp.expectation_status] || 1.0,
      expectation_status: cp.expectation_status || 'Expected',
      goals: 0, assists: 0, clean_sheets: 0, points: 0,
      matches_played: 0, created_at: new Date(), updated_at: new Date(),
    }));

    const fullPool = [...players, ...customRecords];

    // Adjust player values based on fixture context
    const adjustedPlayers = fullPool.map(p => {
      const matchup = opponentMap.get(p.club);
      if (!matchup) return p; 

      // AGGRESSIVE multipliers to ensure VISIBLE rotation between gameweeks
      // MILDER multipliers: Don't bench superstars just because they are away
      const fixtureMultiplier = matchup.isHome ? 1.25 : 0.85;

      return {
        ...p,
        // Compounding logic: keep original stats but pivot strongly on the current fixture
        home_stadium_multiplier: p.home_stadium_multiplier * fixtureMultiplier,
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

// Get a fixed 38-week PL season for FPL context
export const getSeasonFixtures = async (req: Request, res: Response) => {
  try {
    const teamsData = await prisma.team.findMany({
      where: { sheet_source: 'English_FA_Pool_64', league: 'Premier League' },
      select: { name: true, city: true, stadium: true, biggest_rival: true, policing_conflict: true },
    });

    const teamInfos: TeamInfo[] = (teamsData.length >= 20 ? teamsData.slice(0, 20) : Array.from({ length: 20 }, (_, i) => ({
      name: `Team ${i + 1}`, city: `City ${i + 1}`, stadium: `Stadium ${i + 1}`, biggest_rival: null, policing_conflict: null,
    }))).map(t => ({ ...t }));

    // Use a fixed season for FPL tactical planning
    const engine = new FixtureGenerator(teamInfos, 'pl', 2025);
    const season = engine.generate();
    return res.json(season);
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

/**
 * POST /api/tournaments/save
 */
export const saveTournament = async (req: Request, res: Response) => {
  try {
    const { id, type, name, status, bracket, settings } = req.body;
    
    const tournament = await prisma.tournament.upsert({
      where: { id: id || 'new-tournament' },
      update: {
        status: status || 'active',
        bracket: JSON.stringify(bracket),
        settings: settings ? JSON.stringify(settings) : null,
      },
      create: {
        id: id || `tourn_${Date.now()}`,
        type,
        name: name || `${type.toUpperCase()} Tournament`,
        status: status || 'active',
        bracket: JSON.stringify(bracket),
        settings: settings ? JSON.stringify(settings) : null,
      },
    });

    return res.json(tournament);
  } catch (error: any) {
    console.error('Save tournament error:', error);
    return res.status(500).json({ error: { message: 'Failed to save tournament' } });
  }
};

/**
 * GET /api/tournaments/:id
 */
export const getTournament = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    
    return res.json({
      ...tournament,
      bracket: JSON.parse(tournament.bracket),
      settings: tournament.settings ? JSON.parse(tournament.settings) : null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Failed to load tournament' } });
  }
};

/**
 * GET /api/tournaments/type/:type
 */
export const getTournamentsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const tournaments = await prisma.tournament.findMany({
      where: { type },
      orderBy: { updated_at: 'desc' },
    });
    
    return res.json(tournaments.map(t => ({
      ...t,
      bracket: JSON.parse(t.bracket),
      settings: t.settings ? JSON.parse(t.settings) : null,
    })));
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Failed to list tournaments' } });
  }
};

/**
 * GET /api/stats/players
 */
export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      orderBy: [
        { goals: 'desc' },
        { assists: 'desc' },
        { overall_ability: 'desc' }
      ],
      take: 50
    });
    return res.json(players);
  } catch (error: any) {
    return res.status(500).json({ error: { message: 'Failed to fetch player stats' } });
  }
};
