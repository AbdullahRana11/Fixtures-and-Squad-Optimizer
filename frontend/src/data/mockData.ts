export interface League {
  id: string;
  name: string;
  country: string;
  color: string;
  accentColor: string;
  icon: string;
  sport: 'cricket' | 'football' | 'other';
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
}

export interface Fixture {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  round: number;
  predicted_winner: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

export const LEAGUES: League[] = [
  // Cricket Leagues
  {
    id: 'psl',
    name: 'Pakistan Super League',
    country: 'Pakistan',
    color: '#00F260',
    accentColor: '#05D5FF',
    icon: '🏏',
    sport: 'cricket',
  },
  {
    id: 'ipl',
    name: 'Indian Premier League',
    country: 'India',
    color: '#FFB800',
    accentColor: '#FF6B35',
    icon: '🏏',
    sport: 'cricket',
  },
  {
    id: 'bbl',
    name: 'Big Bash League',
    country: 'Australia',
    color: '#B026FF',
    accentColor: '#FF2A55',
    icon: '🏏',
    sport: 'cricket',
  },
  {
    id: 'cpl',
    name: 'Caribbean Premier League',
    country: 'West Indies',
    color: '#FF2A55',
    accentColor: '#00F260',
    icon: '🏏',
    sport: 'cricket',
  },
  {
    id: 'sa20',
    name: 'SA20',
    country: 'South Africa',
    color: '#05D5FF',
    accentColor: '#B026FF',
    icon: '🏏',
    sport: 'cricket',
  },
  {
    id: 'icc-t20wc',
    name: 'ICC T20 World Cup',
    country: 'International',
    color: '#00F260',
    accentColor: '#FFB800',
    icon: '🏆',
    sport: 'cricket',
  },
  
  // Football Leagues
  {
    id: 'pl',
    name: 'Premier League',
    country: 'England',
    color: '#3D195B',
    accentColor: '#E90052',
    icon: '⚽',
    sport: 'football',
  },
  {
    id: 'laliga',
    name: 'La Liga',
    country: 'Spain',
    color: '#EE1D23',
    accentColor: '#000000',
    icon: '⚽',
    sport: 'football',
  },
  {
    id: 'seriea',
    name: 'Serie A',
    country: 'Italy',
    color: '#0055A7',
    accentColor: '#FFFFFF',
    icon: '⚽',
    sport: 'football',
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    country: 'Germany',
    color: '#D3010C',
    accentColor: '#FFFFFF',
    icon: '⚽',
    sport: 'football',
  },
  {
    id: 'ucl',
    name: 'Champions League',
    country: 'Europe',
    color: '#003366',
    accentColor: '#FFFFFF',
    icon: '⭐',
    sport: 'football',
  },
  {
    id: 'ucl-swiss',
    name: 'UCL Swiss Model',
    country: 'Europe',
    color: '#001F3F',
    accentColor: '#FFD700',
    icon: '🧬',
    sport: 'football',
  },
  {
    id: 'facup',
    name: 'FA Cup',
    country: 'England',
    color: '#C8102E',
    accentColor: '#FFFFFF',
    icon: '🏆',
    sport: 'football',
  },
  {
    id: 'custom',
    name: 'Custom League',
    country: 'Global',
    color: '#00F260',
    accentColor: '#05D5FF',
    icon: '⚙️',
    sport: 'football',
  },
];

export const TEAMS: Team[] = [
  // PSL Teams
  { id: 'psl-1', name: 'Karachi Kings', shortName: 'KRK', league: 'psl', tier: 'A', logo: '👑', color: '#00BFFF', wins: 10, losses: 4, draws: 0 },
  { id: 'psl-2', name: 'Lahore Qalandars', shortName: 'LHQ', league: 'psl', tier: 'A', logo: '🔴', color: '#DC143C', wins: 9, losses: 5, draws: 0 },
  { id: 'psl-3', name: 'Islamabad United', shortName: 'ISU', league: 'psl', tier: 'A', logo: '🔵', color: '#0055BE', wins: 11, losses: 3, draws: 0 },
  { id: 'psl-4', name: 'Peshawar Zalmi', shortName: 'PZL', league: 'psl', tier: 'B', logo: '🟡', color: '#FFD700', wins: 7, losses: 7, draws: 0 },
  { id: 'psl-5', name: 'Quetta Gladiators', shortName: 'QTG', league: 'psl', tier: 'B', logo: '🟣', color: '#800080', wins: 6, losses: 8, draws: 0 },
  { id: 'psl-6', name: 'Multan Sultans', shortName: 'MLS', league: 'psl', tier: 'A', logo: '🟠', color: '#FF8C00', wins: 10, losses: 4, draws: 0 },

  // IPL Teams
  { id: 'ipl-1', name: 'Mumbai Indians', shortName: 'MI', league: 'ipl', tier: 'A', logo: '🔵', color: '#004BA0', wins: 12, losses: 2, draws: 0 },
  { id: 'ipl-2', name: 'Chennai Super Kings', shortName: 'CSK', league: 'ipl', tier: 'A', logo: '🟡', color: '#FFD700', wins: 11, losses: 3, draws: 0 },
  { id: 'ipl-3', name: 'Royal Challengers Bangalore', shortName: 'RCB', league: 'ipl', tier: 'B', logo: '🔴', color: '#DC143C', wins: 8, losses: 6, draws: 0 },
  { id: 'ipl-4', name: 'Kolkata Knight Riders', shortName: 'KKR', league: 'ipl', tier: 'B', logo: '🟣', color: '#3A225D', wins: 7, losses: 7, draws: 0 },
  { id: 'ipl-5', name: 'Gujarat Titans', shortName: 'GT', league: 'ipl', tier: 'A', logo: '⚪', color: '#1B2133', wins: 9, losses: 5, draws: 0 },
  { id: 'ipl-6', name: 'Lucknow Super Giants', shortName: 'LSG', league: 'ipl', tier: 'B', logo: '🔵', color: '#A7D8DE', wins: 8, losses: 6, draws: 0 },
  { id: 'ipl-7', name: 'Rajasthan Royals', shortName: 'RR', league: 'ipl', tier: 'A', logo: '🩷', color: '#FF69B4', wins: 9, losses: 5, draws: 0 },
  { id: 'ipl-8', name: 'Delhi Capitals', shortName: 'DC', league: 'ipl', tier: 'B', logo: '🔴', color: '#EF1B23', wins: 7, losses: 7, draws: 0 },
  { id: 'ipl-9', name: 'Punjab Kings', shortName: 'PBKS', league: 'ipl', tier: 'B', logo: '🔴', color: '#DD1F2D', wins: 6, losses: 8, draws: 0 },
  { id: 'ipl-10', name: 'Sunrisers Hyderabad', shortName: 'SRH', league: 'ipl', tier: 'B', logo: '🟠', color: '#F7A721', wins: 8, losses: 6, draws: 0 },

  // BBL Teams
  { id: 't11', name: 'Sydney Sixers', shortName: 'SYS', league: 'bbl', tier: 'A', logo: '🩷', color: '#FF69B4', wins: 10, losses: 4, draws: 0 },
  { id: 't12', name: 'Melbourne Stars', shortName: 'MES', league: 'bbl', tier: 'B', logo: '🟢', color: '#228B22', wins: 7, losses: 7, draws: 0 },

  // CPL Teams
  { id: 't13', name: 'Trinbago Knight Riders', shortName: 'TKR', league: 'cpl', tier: 'A', logo: '🟡', color: '#FFD700', wins: 11, losses: 3, draws: 0 },
  { id: 't14', name: 'Barbados Royals', shortName: 'BR', league: 'cpl', tier: 'B', logo: '🔵', color: '#0000FF', wins: 8, losses: 6, draws: 0 },

  // SA20 Teams
  { id: 't15', name: 'Sunrisers Eastern Cape', shortName: 'SEC', league: 'sa20', tier: 'A', logo: '🟠', color: '#FF4500', wins: 9, losses: 5, draws: 0 },
  { id: 't16', name: 'MI Cape Town', shortName: 'MICT', league: 'sa20', tier: 'B', logo: '🔵', color: '#004BA0', wins: 7, losses: 7, draws: 0 },
];

export const generateFixtures = (teams: Team[], league: League): Fixture[] => {
  const fixtures: Fixture[] = [];
  let fixtureId = 1;

  for (let round = 1; round <= 5; round++) {
    for (let i = 0; i < teams.length - 1; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const homeTeam = teams[i];
        const awayTeam = teams[j];

        const homeAdvantage = 0.15;
        const homeWinOdds = 1.5 + homeAdvantage + (Math.random() * 0.5 - 0.25);
        const drawOdds = 3.5 + (Math.random() * 0.5 - 0.25);
        const awayWinOdds = 2.5 + (Math.random() * 0.5 - 0.25);

        const predicted = Math.random() < 0.6 ? homeTeam.name : Math.random() < 0.5 ? awayTeam.name : 'No Result';

        fixtures.push({
          id: `fixture-${fixtureId++}`,
          homeTeam,
          awayTeam,
          league,
          round,
          predicted_winner: predicted,
          odds: {
            home: parseFloat(homeWinOdds.toFixed(2)),
            draw: parseFloat(drawOdds.toFixed(2)),
            away: parseFloat(awayWinOdds.toFixed(2)),
          },
        });
      }
    }
  }

  return fixtures;
};
