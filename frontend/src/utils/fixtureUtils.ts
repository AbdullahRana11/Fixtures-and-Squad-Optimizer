export const prng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const shuffle = <T>(array: T[], rng?: () => number): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng ? Math.floor(rng() * (i + 1)) : Math.floor(Math.random() * (i + 1));
    [arr[i], arr[arr[j] ? j : 0]] = [arr[j], arr[i]];
  }
  return arr;
};

export const fictionalNames = [
  "Aero United", "Blaze City", "Crystal Palace", "Delta Force",
  "Echo Warriors", "Frost Giants", "Gale Force", "Horizon XI",
  "Iron Legion", "Jade Dragons", "Kestrel Athletic", "Lunar Star",
  "Meteor Strikers", "Nova Rangers", "Oceanic FC", "Pulse Athletic",
  "Quartz County", "Rift Valley", "Solaris United", "Titan FC",
  "Ultra Velocity", "Vortex City", "Wildfire FC", "Zenith Rovers"
];

const neutralStadiums = [
  'Wembley Stadium', 'Old Trafford', 'Anfield', 'Emirates Stadium',
  'Etihad Stadium', 'Tottenham Hotspur Stadium', 'Stamford Bridge', 'Villa Park'
];

export interface HistoryEntry {
  id: string;
  name: string;
  date: string;
  dateGenerated: number;
  fixtures: any[];
  source: string;
  teams: string[];
  format: string;
  seed?: number;
}

const STORAGE_KEY = 'fixture_optimizer_history';

export const getHistory = (): HistoryEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveToHistory = (data: { 
  name: string, 
  source: string, 
  format: string, 
  teams: string[], 
  fixtures: any[],
  seed?: number 
}) => {
  const history = getHistory();
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    ...data,
    date: new Date().toLocaleDateString(),
    dateGenerated: Date.now()
  };
  
  const updatedHistory = [entry, ...history].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  return entry;
};

export const deleteHistoryEntry = (id: string) => {
  const history = getHistory();
  const updated = history.filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearAllHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// --- Core Generation Engines ---

export const generateRoundRobin = (teams: string[], legs: number = 1, seed: number = 123) => {
  const rng = prng(seed);
  const pool = shuffle(teams, rng);
  const n = pool.length % 2 === 0 ? pool.length : pool.length + 1;
  const teamList = [...pool];
  if (pool.length % 2 !== 0) teamList.push('BYE');

  const fixtures: any[] = [];
  for (let leg = 0; leg < legs; leg++) {
    for (let round = 0; round < n - 1; round++) {
      const matchweek = leg * (n - 1) + round + 1;
      for (let i = 0; i < n / 2; i++) {
        const home = teamList[i];
        const away = teamList[n - 1 - i];
        if (home !== 'BYE' && away !== 'BYE') {
          fixtures.push({
            id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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

export const generateKnockout = (teams: string[], seed: number = 123) => {
  const rng = prng(seed);
  const pool = shuffle(teams, rng);
  const matches: any[] = [];
  
  // Create first round (Round of X)
  for (let i = 0; i < pool.length; i += 2) {
    if (pool[i + 1]) {
      matches.push({
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        matchweek: 1,
        home: pool[i],
        away: pool[i + 1],
      });
    }
  }
  return { matches };
};

export const assignAdvancedSchedule = (
  fixtures: any[], 
  startDate: string, 
  frequencyDays: number, 
  neutral: boolean, 
  seed: number
) => {
  const rng = prng(seed);
  const start = new Date(startDate);
  const times = ['16:00', '20:30'];
  const weatherTypes = ['Clear', 'Overcast', 'Light Rain', 'Stormy'];
  
  return fixtures.map((f, i) => {
    const mwOffset = (f.matchweek - 1) * frequencyDays;
    const matchDate = new Date(start);
    matchDate.setDate(matchDate.getDate() + mwOffset + Math.floor(i / 2));

    const slotIdx = i % 2;
    const stadium = neutral 
      ? neutralStadiums[Math.floor(rng() * neutralStadiums.length)]
      : `${f.home} Stadium`;

    return {
      ...f,
      date: matchDate.toISOString().split('T')[0],
      time: times[slotIdx],
      stadium,
      isNightMatch: slotIdx === 1,
      conditions: {
        type: weatherTypes[Math.floor(rng() * weatherTypes.length)],
        temp: Math.floor(rng() * 25) + 5
      }
    };
  });
};

// --- Export Utils ---

export const exportToCSV = (fixtures: any[], name: string) => {
  const headers = "Matchweek,Date,Time,Home,Away,Stadium\n";
  const rows = fixtures.map(f => `${f.matchweek},${f.date},${f.time},"${f.home}","${f.away}","${f.stadium}"`).join("\n");
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${name.replace(/\s+/g, '_')}_fixtures.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const exportToJSON = (data: any, name: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${name.replace(/\s+/g, '_')}_fixtures.json`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
