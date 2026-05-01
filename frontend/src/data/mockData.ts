export const navItems = [
  { key: "fantasy", label: "Fantasy League" },
  { key: "team", label: "My Team" },
  { key: "marketplace", label: "Marketplace" },
  { key: "stats", label: "Stats" },
];

const rawPlayers = [
  { name: "Vinicius Jr", role: "Forward", team: "Real Madrid", momentText: "UCL FINAL HAT-TRICK", momentQuote: '"Sensational finishing on the big stage"' },
  { name: "Kevin De Bruyne", role: "Midfielder", team: "Man City", momentText: "MIDFIELD MAESTRO", momentQuote: '"4 assists in a single half"' },
  { name: "Virgil van Dijk", role: "Defender", team: "Liverpool", momentText: "DEFENSIVE COLOSSUS", momentQuote: '"Unbeatable in the air"' },
  { name: "Jude Bellingham", role: "Midfielder", team: "Real Madrid", momentText: "LAST MINUTE WINNER", momentQuote: '"El Clasico hero again"' },
  { name: "Kylian Mbappe", role: "Forward", team: "Real Madrid", momentText: "SOLO BRILLIANCE", momentQuote: '"Paced past 4 defenders"' },
  { name: "Erling Haaland", role: "Forward", team: "Man City", momentText: "GOLDEN BOOT FORM", momentQuote: '"Five goals in 60 minutes"' },
  { name: "Bukayo Saka", role: "Forward", team: "Arsenal", momentText: "CURLING EFFORT", momentQuote: '"Top corner from outside the box"' },
  { name: "Ederson", role: "Goalkeeper", team: "Man City", momentText: "PENALTY SAVIOR", momentQuote: '"Crucial save in the 90th minute"' },
  { name: "Martin Odegaard", role: "Midfielder", team: "Arsenal", momentText: "PLAYMAKING CLINIC", momentQuote: '"Vision and precision combined"' },
  { name: "William Saliba", role: "Defender", team: "Arsenal", momentText: "FLAWLESS TACKLE", momentQuote: '"Perfectly timed last-man challenge"' },
  { name: "Rodri", role: "Midfielder", team: "Man City", momentText: "THUNDERBOLT STRIKE", momentQuote: '"Unstoppable shot from 30 yards"' },
  { name: "Trent Alexander-Arnold", role: "Defender", team: "Liverpool", momentText: "FREE KICK MASTER", momentQuote: '"Whipped perfectly into the top right"' },
  { name: "Phil Foden", role: "Midfielder", team: "Man City", momentText: "DERBY DAZZLER", momentQuote: '"Unplayable down the wing"' },
  { name: "Mo Salah", role: "Forward", team: "Liverpool", momentText: "RECORD BREAKER", momentQuote: '"Fastest hat-trick in league history"' },
  { name: "Ruben Dias", role: "Defender", team: "Man City", momentText: "BRICK WALL", momentQuote: '"10 clearances and a clean sheet"' },
  { name: "Alisson Becker", role: "Goalkeeper", team: "Liverpool", momentText: "QUICK REFLEXES", momentQuote: '"Point blank double save"' },
];

export const players = rawPlayers.map((p, index) => {
  const rarities = ["legendary", "epic", "rare", "common"];
  const rarity = rarities[index % 4];
  return {
    id: `p-${index + 1}`,
    name: p.name,
    role: p.role,
    team: p.team,
    momentText: p.momentText,
    momentQuote: p.momentQuote,
    rating: 90 + (index % 10),
    strikeRate: 115 + index,
    economy: (6 + (index % 5) * 0.45).toFixed(2),
    points: 70 + index * 3,
    rarity,
    currentBid: `${(25000 + index * 3500).toLocaleString()}`,
    buyNow: `${(45000 + index * 5000).toLocaleString()}`,
    timeLeft: `${2 + (index % 7)}h ${(index * 7) % 60}m`,
  };
});

export const topBatsmen = players.slice(0, 6).map((player, idx) => ({
  name: player.name,
  runs: 15 + idx * 4,
  avg: (35 + idx * 2.1).toFixed(1),
  points: player.points + 20,
}));

export const topBowlers = players.slice(6, 12).map((player, idx) => ({
  name: player.name,
  wickets: 8 + idx * 2,
  economy: (5.7 + idx * 0.3).toFixed(2),
  points: player.points + 16,
}));
