const prng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export interface HistoryEntry {
  id: string;
  name: string;
  date: string;          // Formatted date string
  dateGenerated: number; // Timestamp for sorting
  fixtures: any[];
  source: string;
  teams: string[];
  format: string;
}

const neutralStadiums = [
  'Wembley Stadium',
  'Old Trafford',
  'Anfield',
  'Emirates Stadium',
  'Etihad Stadium',
  'Tottenham Hotspur Stadium',
  'Stamford Bridge',
  'Villa Park'
];

const simulateConditions = (rng: () => number) => {
  const weathers = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
  return {
    weather: weathers[Math.floor(rng() * weathers.length)],
    temperature: Math.floor(rng() * 25) + 5,
    pitchQuality: Math.floor(rng() * 40) + 60
  };
};

// --- Storage Utils ---
const STORAGE_KEY = 'fixture_optimizer_history';

export const saveToHistory = (name: string, source: string, format: string, teams: string[], fixtures: any[]) => {
  const history = getHistory();
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    name,
    source,
    format,
    teams,
    fixtures,
    date: new Date().toLocaleDateString(),
    dateGenerated: Date.now()
  };
  
  const updatedHistory = [entry, ...history].slice(0, 50); // Keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  return entry;
};

export const getHistory = (): HistoryEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteHistoryEntry = (id: string) => {
  const history = getHistory();
  const updated = history.filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearAllHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// --- Generation Utils ---
export const generateRoundRobin = (teams: string[], legs: number = 2) => {
  // 0. Randomly shuffle the team list to ensure unique pairings/sequences
  const shuffledInputTeams = [...teams].sort(() => Math.random() - 0.5);
  const n = shuffledInputTeams.length % 2 === 0 ? shuffledInputTeams.length : shuffledInputTeams.length + 1;
  const teamList = [...shuffledInputTeams];
  if (shuffledInputTeams.length % 2 !== 0) teamList.push('BYE');

  const fixtures: any[] = [];
  
  for (let leg = 0; leg < legs; leg++) {
    for (let round = 0; round < n - 1; round++) {
      const matchweek = leg * (n - 1) + round + 1;
      for (let i = 0; i < n / 2; i++) {
        const home = teamList[i];
        const away = teamList[n - 1 - i];

        if (home !== 'BYE' && away !== 'BYE') {
          fixtures.push({
            id: crypto.randomUUID(),
            matchweek,
            home: leg % 2 === 0 ? home : away,
            away: leg % 2 === 0 ? away : home,
          });
        }
      }
      teamList.splice(1, 0, teamList.pop()!);
    }
  }

  return fixtures;
};

export const assignAdvancedSchedule = (fixtures: any[], teams: string[], startDate: string, frequencyDays: number, neutral: boolean, seed: number) => {
  const rng = prng(seed);
  const start = new Date(startDate);
  const schedule: any[] = [];
  const times = ['16:00', '20:30'];
  
  const byMW: Record<number, any[]> = {};
  fixtures.forEach(f => {
    if (!byMW[f.matchweek]) byMW[f.matchweek] = [];
    byMW[f.matchweek].push(f);
  });

  let currentDay = new Date(start);
  Object.keys(byMW).sort((a, b) => Number(a) - Number(b)).forEach(mw => {
    const mwFixtures = byMW[Number(mw)];
    let slotIdx = 0;

    mwFixtures.forEach(f => {
      if (slotIdx >= 2) {
        currentDay.setDate(currentDay.getDate() + 1);
        slotIdx = 0;
      }

      const stadium = neutral 
        ? neutralStadiums[Math.floor(rng() * neutralStadiums.length)]
        : `${f.home} Stadium`;

      schedule.push({
        ...f,
        date: currentDay.toISOString().split('T')[0],
        time: times[slotIdx],
        stadium,
        conditions: simulateConditions(rng),
        isNightMatch: slotIdx === 1
      });

      slotIdx++;
    });
    currentDay.setDate(currentDay.getDate() + frequencyDays);
  });

  // --- CHRONOLOGICAL H/A SOLVER ---
  const teamHistory: Record<string, ('H' | 'A')[]> = {};
  const teamHomeCount: Record<string, number> = {};
  teams.forEach(t => {
    teamHistory[t] = [];
    teamHomeCount[t] = 0;
  });

  const sortedSchedule = [...schedule].sort((a, b) => a.date.localeCompare(b.date));
  const maxHomeLimit = Math.ceil(schedule.length / (teams.length / 2) / 2) + 1;

  function canAssign(team: string, venue: 'H' | 'A') {
    const hist = teamHistory[team];
    if (hist.length >= 2 && hist[hist.length - 1] === venue && hist[hist.length - 2] === venue) return false;
    if (venue === 'H' && teamHomeCount[team] >= maxHomeLimit) return false;
    return true;
  }

  function solve(idx: number): boolean {
    if (idx === sortedSchedule.length) return true;
    const f = sortedSchedule[idx];
    const A = f.home;
    const B = f.away;

    if (canAssign(A, 'H') && canAssign(B, 'A')) {
      teamHistory[A].push('H');
      teamHistory[B].push('A');
      teamHomeCount[A]++;
      if (solve(idx + 1)) return true;
      teamHistory[A].pop();
      teamHistory[B].pop();
      teamHomeCount[A]--;
    }

    if (canAssign(A, 'A') && canAssign(B, 'H')) {
      teamHistory[A].push('A');
      teamHistory[B].push('H');
      teamHomeCount[B]++;
      const temp = f.home;
      f.home = f.away;
      f.away = temp;
      if (solve(idx + 1)) return true;
      const t2 = f.home;
      f.home = f.away;
      f.away = t2;
      teamHistory[A].pop();
      teamHistory[B].pop();
      teamHomeCount[B]--;
    }
    return false;
  }

  solve(0);
  return schedule;
};
