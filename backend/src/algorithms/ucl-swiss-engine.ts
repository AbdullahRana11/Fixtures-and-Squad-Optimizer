import { FixtureMatch, UCLTeam } from '../types';

export class UCLSwissEngine {
  private teams: UCLTeam[];
  private constraintProfile: any;
  private lockedFixtures: { home: string; away: string; matchweek: number }[];

  constructor(teams: UCLTeam[], constraintProfile: any = {}) {
    if (teams.length !== 36) {
      throw new Error('UCL Swiss model requires exactly 36 teams.');
    }
    this.teams = teams;
    this.constraintProfile = constraintProfile;
    this.lockedFixtures = constraintProfile.lockedFixtures || [];
  }

  generate(): { fixtures: FixtureMatch[]; generation_time_ms: number } {
    const startTime = Date.now();
    const fixtures: FixtureMatch[] = [];
    const pots: Record<number, UCLTeam[]> = {
      1: this.teams.filter(t => t.pot === 1),
      2: this.teams.filter(t => t.pot === 2),
      3: this.teams.filter(t => t.pot === 3),
      4: this.teams.filter(t => t.pot === 4),
    };

    // Tracking opponents and venues per team
    const tracker: Record<string, { 
      opponents: Set<string>, 
      homeCount: number, 
      awayCount: number,
      potOpponents: Record<number, { home: string[], away: string[] }>
    }> = {};

    this.teams.forEach(team => {
      tracker[team.name] = {
        opponents: new Set(),
        homeCount: 0,
        awayCount: 0,
        potOpponents: {
          1: { home: [], away: [] },
          2: { home: [], away: [] },
          3: { home: [], away: [] },
          4: { home: [], away: [] },
        }
      };
    });

    // 1. Pre-fill locked fixtures
    for (const lock of this.lockedFixtures) {
      const homeTeam = this.teams.find(t => t.name === lock.home);
      const awayTeam = this.teams.find(t => t.name === lock.away);
      
      if (homeTeam && awayTeam) {
        const hTracker = tracker[homeTeam.name];
        const aTracker = tracker[awayTeam.name];

        hTracker.opponents.add(awayTeam.name);
        aTracker.opponents.add(homeTeam.name);
        
        hTracker.potOpponents[awayTeam.pot].home.push(awayTeam.name);
        aTracker.potOpponents[homeTeam.pot].away.push(homeTeam.name);

        const match = this.createMatch(homeTeam, awayTeam);
        match.matchweek = lock.matchweek;
        match.isLocked = true;
        fixtures.push(match);
      }
    }

    const teamList = [...this.teams];
    teamList.sort((a, b) => b.coefficient - a.coefficient);

    for (let p = 1; p <= 4; p++) {
      const potTeams = pots[p];
      for (const team of potTeams) {
        for (let targetPot = 1; targetPot <= 4; targetPot++) {
          // Need 1 home and 1 away from targetPot
          this.assignOpponent(team, targetPot, true, pots, tracker, fixtures);
          this.assignOpponent(team, targetPot, false, pots, tracker, fixtures);
        }
      }
    }

    this.assignMatchweeks(fixtures);

    const generation_time_ms = Date.now() - startTime;
    return { fixtures, generation_time_ms };
  }

  private assignOpponent(
    team: UCLTeam, 
    targetPot: number, 
    isHome: boolean, 
    pots: Record<number, UCLTeam[]>,
    tracker: any,
    fixtures: FixtureMatch[]
  ) {
    const tTracker = tracker[team.name];
    const potOpponents = tTracker.potOpponents[targetPot];

    if (isHome && potOpponents.home.length > 0) return;
    if (!isHome && potOpponents.away.length > 0) return;

    const possibleOpponents = pots[targetPot].filter(opp => {
      if (opp.name === team.name) return false;
      if (opp.country === team.country) return false; 
      if (tTracker.opponents.has(opp.name)) return false;
      
      const oTracker = tracker[opp.name];
      const venueInOppPot = isHome ? 'away' : 'home';
      if (oTracker.potOpponents[team.pot][venueInOppPot].length > 0) return false;
      
      return true;
    });

    possibleOpponents.sort((a, b) => tracker[a.name].opponents.size - tracker[b.name].opponents.size);

    if (possibleOpponents.length > 0) {
      const opponent = possibleOpponents[0];
      const oTracker = tracker[opponent.name];

      tTracker.opponents.add(opponent.name);
      oTracker.opponents.add(team.name);

      if (isHome) {
        tTracker.potOpponents[targetPot].home.push(opponent.name);
        oTracker.potOpponents[team.pot].away.push(team.name);
        fixtures.push(this.createMatch(team, opponent));
      } else {
        tTracker.potOpponents[targetPot].away.push(opponent.name);
        oTracker.potOpponents[team.pot].home.push(team.name);
        fixtures.push(this.createMatch(opponent, team));
      }
    }
  }

  private createMatch(home: UCLTeam, away: UCLTeam): FixtureMatch {
    const intensity = (home.rating + away.rating) / 2;
    let matchIntensity: 'Low' | 'Medium' | 'High' | 'Extreme' = 'Medium';
    if (intensity > 90) matchIntensity = 'Extreme';
    else if (intensity > 80) matchIntensity = 'High';
    else if (intensity < 60) matchIntensity = 'Low';

    const broadcasters = ['TNT Sports', 'Amazon Prime', 'BBC Sport'];
    const broadcaster = broadcasters[Math.floor(Math.random() * broadcasters.length)];

    return {
      id: Math.random().toString(36).substr(2, 9),
      home: home.name,
      away: away.name,
      matchweek: 0,
      date: "", // Will be assigned in assignMatchweeks
      time: "20:00",
      stadium: home.stadium,
      is_derby: false,
      matchIntensity,
      broadcaster,
      isLocked: false,
      prediction: {
        homeWinProb: 0.4,
        drawProb: 0.25,
        awayWinProb: 0.35,
        predictedScore: { home: 0, away: 0 },
        keyInsight: `Tactical battle at ${home.stadium}.`
      }
    };
  }

  private assignMatchweeks(fixtures: FixtureMatch[]) {
    const teamMatchweeks: Record<string, Set<number>> = {};
    this.teams.forEach(t => teamMatchweeks[t.name] = new Set());

    // UCL Swiss Matchweeks are typically Tue/Wed/Thu
    const mwStartDate = new Date('2024-09-17');

    // Respect already assigned matchweeks from locks
    fixtures.forEach(match => {
      if (match.matchweek > 0) {
        teamMatchweeks[match.home].add(match.matchweek);
        teamMatchweeks[match.away].add(match.matchweek);
        
        const d = new Date(mwStartDate);
        d.setDate(d.getDate() + (match.matchweek - 1) * 14 + Math.floor(Math.random() * 3));
        match.date = d.toISOString().split('T')[0];
      }
    });

    fixtures.forEach(match => {
      if (match.matchweek > 0) return; 

      for (let mw = 1; mw <= 8; mw++) {
        if (!teamMatchweeks[match.home].has(mw) && !teamMatchweeks[match.away].has(mw)) {
          match.matchweek = mw;
          teamMatchweeks[match.home].add(mw);
          teamMatchweeks[match.away].add(mw);
          
          const d = new Date(mwStartDate);
          // UCL is every 2 or 3 weeks usually, let's say every 2 weeks for simplicity
          d.setDate(d.getDate() + (mw - 1) * 14 + Math.floor(Math.random() * 3));
          match.date = d.toISOString().split('T')[0];
          break;
        }
      }
    });
  }
}
