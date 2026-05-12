export interface League {
  id: string;
  name: string;
  shortName: string;
  country: string;
  color: string;
  accentColor: string;
  icon: string;
  teamCount?: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  league: string;
  tier: 'A' | 'B' | 'C' | 'D';
  logo: string;
  color: string;
  wins: number;
  losses: number;
  draws: number;
  founded?: number;
  stadium?: string;
}

export interface Fixture {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  round: number;
  predicted_winner: string;
  confidence: number;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

export const LEAGUES: League[] = [
  {
    id: 'pl',
    name: 'Premier League',
    shortName: 'EPL',
    country: 'England',
    color: '#00F260',
    accentColor: '#05D5FF',
    icon: '🦁',
  },
  {
    id: 'laliga',
    name: 'La Liga',
    shortName: 'LAL',
    country: 'Spain',
    color: '#FFB800',
    accentColor: '#FF6B35',
    icon: '🔱',
  },
  {
    id: 'seriea',
    name: 'Serie A',
    shortName: 'SA',
    country: 'Italy',
    color: '#B026FF',
    accentColor: '#FF2A55',
    icon: '⚜️',
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'BUN',
    country: 'Germany',
    color: '#FF2A55',
    accentColor: '#00F260',
    icon: '🦅',
  },
  {
    id: 'ligue1',
    name: 'Ligue 1',
    shortName: 'L1',
    country: 'France',
    color: '#05D5FF',
    accentColor: '#B026FF',
    icon: '⚔️',
  },
  {
    id: 'ucl',
    name: 'Champions League',
    shortName: 'UCL',
    country: 'Europe',
    color: '#00F260',
    accentColor: '#FFB800',
    icon: '🏆',
  },
];

export const TEAMS: Team[] = [
  // ── PREMIER LEAGUE (10 teams) ──────────────────────────────
  { id: 'pl1',  name: 'Manchester City',    shortName: 'MCI', league: 'pl', tier: 'A', logo: '🔵', color: '#87CEEB', wins: 28, losses: 2,  draws: 4, founded: 1880, stadium: 'Etihad Stadium' },
  { id: 'pl2',  name: 'Arsenal',            shortName: 'ARS', league: 'pl', tier: 'A', logo: '🔴', color: '#DC143C', wins: 24, losses: 6,  draws: 4, founded: 1886, stadium: 'Emirates Stadium' },
  { id: 'pl3',  name: 'Liverpool',          shortName: 'LIV', league: 'pl', tier: 'A', logo: '🔴', color: '#FF0000', wins: 23, losses: 8,  draws: 3, founded: 1892, stadium: 'Anfield' },
  { id: 'pl4',  name: 'Aston Villa',        shortName: 'AVL', league: 'pl', tier: 'B', logo: '🟣', color: '#7B2C8A', wins: 20, losses: 10, draws: 4, founded: 1874, stadium: 'Villa Park' },
  { id: 'pl5',  name: 'Tottenham Hotspur',  shortName: 'TOT', league: 'pl', tier: 'B', logo: '⚪', color: '#FFFFFF', wins: 18, losses: 12, draws: 4, founded: 1882, stadium: 'Tottenham Hotspur Stadium' },
  { id: 'pl6',  name: 'Chelsea',            shortName: 'CHE', league: 'pl', tier: 'B', logo: '🔵', color: '#0055BE', wins: 16, losses: 14, draws: 4, founded: 1905, stadium: 'Stamford Bridge' },
  { id: 'pl7',  name: 'Manchester United',  shortName: 'MUN', league: 'pl', tier: 'C', logo: '🔴', color: '#DA291C', wins: 14, losses: 16, draws: 4, founded: 1878, stadium: 'Old Trafford' },
  { id: 'pl8',  name: 'Newcastle United',   shortName: 'NEW', league: 'pl', tier: 'C', logo: '⚫', color: '#241F20', wins: 15, losses: 14, draws: 5, founded: 1892, stadium: 'St. James Park' },
  { id: 'pl9',  name: 'Brighton',           shortName: 'BHA', league: 'pl', tier: 'C', logo: '🔵', color: '#0066FF', wins: 13, losses: 17, draws: 4, founded: 1901, stadium: 'Amex Stadium' },
  { id: 'pl10', name: 'West Ham United',    shortName: 'WHU', league: 'pl', tier: 'C', logo: '🟣', color: '#7A263A', wins: 12, losses: 18, draws: 4, founded: 1895, stadium: 'London Stadium' },

  // ── LA LIGA (9 teams) ──────────────────────────────────────
  { id: 'll1', name: 'Real Madrid',      shortName: 'RMA', league: 'laliga', tier: 'A', logo: '⚪', color: '#FEBE10', wins: 26, losses: 4,  draws: 4, founded: 1902, stadium: 'Santiago Bernabéu' },
  { id: 'll2', name: 'Barcelona',        shortName: 'FCB', league: 'laliga', tier: 'A', logo: '🔴', color: '#004B8D', wins: 24, losses: 6,  draws: 4, founded: 1899, stadium: 'Camp Nou' },
  { id: 'll3', name: 'Atletico Madrid',  shortName: 'ATM', league: 'laliga', tier: 'A', logo: '🔴', color: '#CB3524', wins: 22, losses: 8,  draws: 4, founded: 1903, stadium: 'Civitas Metropolitano' },
  { id: 'll4', name: 'Real Sociedad',    shortName: 'RSO', league: 'laliga', tier: 'B', logo: '🔵', color: '#0067B1', wins: 18, losses: 12, draws: 4, founded: 1909, stadium: 'Reale Arena' },
  { id: 'll5', name: 'Athletic Bilbao',  shortName: 'ATH', league: 'laliga', tier: 'B', logo: '🔴', color: '#EE2523', wins: 17, losses: 13, draws: 4, founded: 1898, stadium: 'San Mamés' },
  { id: 'll6', name: 'Real Betis',       shortName: 'BET', league: 'laliga', tier: 'B', logo: '🟢', color: '#00954C', wins: 16, losses: 14, draws: 4, founded: 1907, stadium: 'Benito Villamarín' },
  { id: 'll7', name: 'Valencia',         shortName: 'VAL', league: 'laliga', tier: 'C', logo: '⚪', color: '#F5A623', wins: 15, losses: 15, draws: 4, founded: 1919, stadium: 'Mestalla' },
  { id: 'll8', name: 'Villarreal',       shortName: 'VIL', league: 'laliga', tier: 'C', logo: '🟡', color: '#FFD700', wins: 14, losses: 16, draws: 4, founded: 1923, stadium: 'Estadio de la Cerámica' },
  { id: 'll9', name: 'Sevilla',          shortName: 'SEV', league: 'laliga', tier: 'C', logo: '⚪', color: '#D2042D', wins: 12, losses: 18, draws: 4, founded: 1890, stadium: 'Ramón Sánchez-Pizjuán' },

  // ── SERIE A (9 teams) ──────────────────────────────────────
  { id: 'sa1', name: 'Inter Milan',      shortName: 'INT', league: 'seriea', tier: 'A', logo: '🔵', color: '#0066FF', wins: 26, losses: 4,  draws: 4, founded: 1908, stadium: 'San Siro' },
  { id: 'sa2', name: 'Juventus',         shortName: 'JUV', league: 'seriea', tier: 'A', logo: '⚫', color: '#000000', wins: 25, losses: 5,  draws: 4, founded: 1897, stadium: 'Allianz Stadium' },
  { id: 'sa3', name: 'AC Milan',         shortName: 'MIL', league: 'seriea', tier: 'A', logo: '🔴', color: '#FF0000', wins: 21, losses: 9,  draws: 4, founded: 1899, stadium: 'San Siro' },
  { id: 'sa4', name: 'Napoli',           shortName: 'NAP', league: 'seriea', tier: 'B', logo: '🔵', color: '#12A0C3', wins: 19, losses: 11, draws: 4, founded: 1926, stadium: 'Stadio Diego Maradona' },
  { id: 'sa5', name: 'AS Roma',          shortName: 'ROM', league: 'seriea', tier: 'B', logo: '🟡', color: '#8E1F2F', wins: 17, losses: 13, draws: 4, founded: 1927, stadium: 'Stadio Olimpico' },
  { id: 'sa6', name: 'Lazio',            shortName: 'LAZ', league: 'seriea', tier: 'B', logo: '🔵', color: '#87CEEB', wins: 16, losses: 14, draws: 4, founded: 1900, stadium: 'Stadio Olimpico' },
  { id: 'sa7', name: 'Fiorentina',       shortName: 'FIO', league: 'seriea', tier: 'C', logo: '🟣', color: '#6A0DAD', wins: 14, losses: 16, draws: 4, founded: 1926, stadium: 'Stadio Artemio Franchi' },
  { id: 'sa8', name: 'Atalanta',         shortName: 'ATA', league: 'seriea', tier: 'B', logo: '🔵', color: '#1C4FA0', wins: 20, losses: 10, draws: 4, founded: 1907, stadium: 'Gewiss Stadium' },
  { id: 'sa9', name: 'Torino',           shortName: 'TOR', league: 'seriea', tier: 'C', logo: '🟤', color: '#8B0000', wins: 12, losses: 18, draws: 4, founded: 1906, stadium: 'Stadio Olimpico Grande Torino' },

  // ── BUNDESLIGA (8 teams) ───────────────────────────────────
  { id: 'bl1', name: 'Bayern Munich',       shortName: 'BAY', league: 'bundesliga', tier: 'A', logo: '🔴', color: '#DC143C', wins: 27, losses: 3,  draws: 4, founded: 1900, stadium: 'Allianz Arena' },
  { id: 'bl2', name: 'Borussia Dortmund',   shortName: 'BVB', league: 'bundesliga', tier: 'A', logo: '🟡', color: '#FFD700', wins: 22, losses: 8,  draws: 4, founded: 1909, stadium: 'Signal Iduna Park' },
  { id: 'bl3', name: 'Bayer Leverkusen',    shortName: 'B04', league: 'bundesliga', tier: 'B', logo: '🔴', color: '#E32221', wins: 21, losses: 9,  draws: 4, founded: 1904, stadium: 'BayArena' },
  { id: 'bl4', name: 'RB Leipzig',          shortName: 'RBL', league: 'bundesliga', tier: 'B', logo: '🔴', color: '#CC0000', wins: 19, losses: 11, draws: 4, founded: 2009, stadium: 'Red Bull Arena' },
  { id: 'bl5', name: 'Eintracht Frankfurt', shortName: 'SGE', league: 'bundesliga', tier: 'B', logo: '⚫', color: '#E1000F', wins: 16, losses: 14, draws: 4, founded: 1899, stadium: 'Deutsche Bank Park' },
  { id: 'bl6', name: 'Wolfsburg',           shortName: 'WOB', league: 'bundesliga', tier: 'C', logo: '🟢', color: '#65B32E', wins: 13, losses: 17, draws: 4, founded: 1945, stadium: 'Volkswagen Arena' },
  { id: 'bl7', name: 'Freiburg',            shortName: 'SCF', league: 'bundesliga', tier: 'C', logo: '🔴', color: '#CC0000', wins: 14, losses: 16, draws: 4, founded: 1904, stadium: 'Europa-Park Stadion' },
  { id: 'bl8', name: 'Union Berlin',        shortName: 'FCU', league: 'bundesliga', tier: 'C', logo: '🔴', color: '#EB1923', wins: 11, losses: 19, draws: 4, founded: 1906, stadium: 'An der Alten Försterei' },

  // ── LIGUE 1 (7 teams) ──────────────────────────────────────
  { id: 'lg1', name: 'Paris Saint-Germain',  shortName: 'PSG', league: 'ligue1', tier: 'A', logo: '🔵', color: '#004AAD', wins: 26, losses: 4,  draws: 4, founded: 1970, stadium: 'Parc des Princes' },
  { id: 'lg2', name: 'Olympique Marseille',  shortName: 'OM',  league: 'ligue1', tier: 'A', logo: '🔵', color: '#2FAEE0', wins: 20, losses: 10, draws: 4, founded: 1899, stadium: 'Stade Vélodrome' },
  { id: 'lg3', name: 'Monaco',               shortName: 'MON', league: 'ligue1', tier: 'B', logo: '🔴', color: '#D4012D', wins: 18, losses: 12, draws: 4, founded: 1924, stadium: 'Stade Louis II' },
  { id: 'lg4', name: 'Olympique Lyonnais',   shortName: 'OL',  league: 'ligue1', tier: 'B', logo: '🔴', color: '#DA291C', wins: 16, losses: 14, draws: 4, founded: 1950, stadium: 'Groupama Stadium' },
  { id: 'lg5', name: 'Stade Rennais',        shortName: 'REN', league: 'ligue1', tier: 'C', logo: '🔴', color: '#E30613', wins: 14, losses: 16, draws: 4, founded: 1901, stadium: 'Roazhon Park' },
  { id: 'lg6', name: 'Lille OSC',            shortName: 'LIL', league: 'ligue1', tier: 'B', logo: '🔴', color: '#E22019', wins: 17, losses: 13, draws: 4, founded: 1944, stadium: 'Stade Pierre-Mauroy' },
  { id: 'lg7', name: 'Nice',                 shortName: 'NIC', league: 'ligue1', tier: 'C', logo: '🔴', color: '#CC0000', wins: 13, losses: 17, draws: 4, founded: 1904, stadium: 'Allianz Riviera' },
];

export const generateFixtures = (teams: Team[], league: League): Fixture[] => {
  const fixtures: Fixture[] = [];
  let fixtureId = 1;

  for (let round = 1; round <= 5; round++) {
    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const homeTeam = teams[i];
        const awayTeam = teams[j];

        const tierValues: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
        const homeStr = tierValues[homeTeam.tier] + homeTeam.wins * 0.1;
        const awayStr = tierValues[awayTeam.tier] + awayTeam.wins * 0.1;
        const homeAdvantage = 0.12;

        const homeOdds = parseFloat((1.5 + homeAdvantage + Math.random() * 0.6 - 0.3 + (awayStr - homeStr) * 0.1).toFixed(2));
        const drawOdds = parseFloat((3.2 + Math.random() * 0.6 - 0.3).toFixed(2));
        const awayOdds = parseFloat((2.2 + Math.random() * 0.6 - 0.3 + (homeStr - awayStr) * 0.1).toFixed(2));

        const rand = Math.random();
        const predicted =
          rand < 0.55 ? homeTeam.name : rand < 0.75 ? awayTeam.name : 'Draw';

        const confidence = Math.floor(Math.random() * 30 + 55);

        fixtures.push({
          id: `fixture-${fixtureId++}`,
          homeTeam,
          awayTeam,
          league,
          round,
          predicted_winner: predicted,
          confidence,
          odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
        });
      }
    }
  }

  return fixtures;
};
