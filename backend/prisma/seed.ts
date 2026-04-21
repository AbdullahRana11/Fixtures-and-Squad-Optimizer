import { PrismaClient, Position } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.team.deleteMany();
  await prisma.player.deleteMany();

  const teams = [
    { id: 'rm', name: 'Real Madrid', country_code: 'ESP', group_id: 'C', is_seeded: true },
    { id: 'mc', name: 'Manchester City', country_code: 'ENG', group_id: 'G', is_seeded: true },
    { id: 'bm', name: 'Bayern Munich', country_code: 'GER', group_id: 'A', is_seeded: true },
    { id: 'psg', name: 'Paris Saint-Germain', country_code: 'FRA', group_id: 'F', is_seeded: true },
    { id: 'im', name: 'Inter Milan', country_code: 'ITA', group_id: 'D', is_seeded: true },
    { id: 'rbl', name: 'RB Leipzig', country_code: 'GER', group_id: 'G', is_seeded: true },
    { id: 'fcp', name: 'FC Porto', country_code: 'POR', group_id: 'H', is_seeded: true },
    { id: 'slb', name: 'Benfica', country_code: 'POR', group_id: 'D', is_seeded: true },
    { id: 'atm', name: 'Atletico Madrid', country_code: 'ESP', group_id: 'E', is_seeded: false },
    { id: 'bvb', name: 'Borussia Dortmund', country_code: 'GER', group_id: 'F', is_seeded: false },
    { id: 'liv', name: 'Liverpool', country_code: 'ENG', group_id: 'B', is_seeded: false },
    { id: 'acm', name: 'AC Milan', country_code: 'ITA', group_id: 'E', is_seeded: false },
    { id: 'nap', name: 'Napoli', country_code: 'ITA', group_id: 'A', is_seeded: false },
    { id: 'psv', name: 'PSV Eindhoven', country_code: 'NED', group_id: 'B', is_seeded: false },
    { id: 'ars', name: 'Arsenal', country_code: 'ENG', group_id: 'B', is_seeded: false },
    { id: 'fcb', name: 'FC Barcelona', country_code: 'ESP', group_id: 'H', is_seeded: false },
  ];

  for (const t of teams) {
    await prisma.team.create({ data: t });
  }

  const playersData = [
    { name: 'Saka', club_name: 'Arsenal', position: Position.MID, cost_millions: 9.0, points: 220 },
    { name: 'Saliba', club_name: 'Arsenal', position: Position.DEF, cost_millions: 5.8, points: 150 },
    { name: 'Odegaard', club_name: 'Arsenal', position: Position.MID, cost_millions: 8.5, points: 200 },
    { name: 'Raya', club_name: 'Arsenal', position: Position.GK, cost_millions: 5.0, points: 140 },
    { name: 'Gabriel', club_name: 'Arsenal', position: Position.DEF, cost_millions: 5.4, points: 145 },
    { name: 'Haaland', club_name: 'Man City', position: Position.FWD, cost_millions: 14.3, points: 260 },
    { name: 'Foden', club_name: 'Man City', position: Position.MID, cost_millions: 8.2, points: 210 },
    { name: 'De Bruyne', club_name: 'Man City', position: Position.MID, cost_millions: 10.5, points: 180 },
    { name: 'Ederson', club_name: 'Man City', position: Position.GK, cost_millions: 5.5, points: 150 },
    { name: 'Walker', club_name: 'Man City', position: Position.DEF, cost_millions: 5.3, points: 130 },
    { name: 'Salah', club_name: 'Liverpool', position: Position.MID, cost_millions: 13.5, points: 240 },
    { name: 'Van Dijk', club_name: 'Liverpool', position: Position.DEF, cost_millions: 6.5, points: 160 },
    { name: 'Nunez', club_name: 'Liverpool', position: Position.FWD, cost_millions: 7.5, points: 155 },
    { name: 'Alisson', club_name: 'Liverpool', position: Position.GK, cost_millions: 5.5, points: 145 },
    { name: 'TAA', club_name: 'Liverpool', position: Position.DEF, cost_millions: 7.0, points: 170 },
    { name: 'Watkins', club_name: 'Aston Villa', position: Position.FWD, cost_millions: 8.9, points: 228 },
    { name: 'Martinez', club_name: 'Aston Villa', position: Position.GK, cost_millions: 5.3, points: 135 },
    { name: 'Luiz', club_name: 'Aston Villa', position: Position.MID, cost_millions: 7.0, points: 150 },
    { name: 'Torres', club_name: 'Aston Villa', position: Position.DEF, cost_millions: 4.6, points: 110 },
    { name: 'Son', club_name: 'Spurs', position: Position.MID, cost_millions: 9.8, points: 213 },
    { name: 'Porro', club_name: 'Spurs', position: Position.DEF, cost_millions: 5.7, points: 132 },
    { name: 'Udogie', club_name: 'Spurs', position: Position.DEF, cost_millions: 5.0, points: 120 },
    { name: 'Vicario', club_name: 'Spurs', position: Position.GK, cost_millions: 5.3, points: 142 },
    { name: 'Isak', club_name: 'Newcastle', position: Position.FWD, cost_millions: 8.1, points: 170 },
    { name: 'Gordon', club_name: 'Newcastle', position: Position.MID, cost_millions: 6.1, points: 180 },
    { name: 'Trippier', club_name: 'Newcastle', position: Position.DEF, cost_millions: 6.7, points: 145 },
    { name: 'Pope', club_name: 'Newcastle', position: Position.GK, cost_millions: 5.4, points: 120 },
    { name: 'Palmer', club_name: 'Chelsea', position: Position.MID, cost_millions: 6.2, points: 230 },
    { name: 'Jackson', club_name: 'Chelsea', position: Position.FWD, cost_millions: 6.8, points: 145 },
    { name: 'Gusto', club_name: 'Chelsea', position: Position.DEF, cost_millions: 4.3, points: 115 },
    { name: 'Petrovic', club_name: 'Chelsea', position: Position.GK, cost_millions: 4.6, points: 105 },
    { name: 'Fernandes', club_name: 'Man Utd', position: Position.MID, cost_millions: 8.2, points: 170 },
    { name: 'Rashford', club_name: 'Man Utd', position: Position.MID, cost_millions: 8.4, points: 135 },
    { name: 'Dalot', club_name: 'Man Utd', position: Position.DEF, cost_millions: 5.2, points: 125 },
    { name: 'Onana', club_name: 'Man Utd', position: Position.GK, cost_millions: 4.9, points: 120 },
    { name: 'Bowen', club_name: 'West Ham', position: Position.MID, cost_millions: 7.6, points: 185 },
    { name: 'Areola', club_name: 'West Ham', position: Position.GK, cost_millions: 4.2, points: 110 },
    { name: 'Coufal', club_name: 'West Ham', position: Position.DEF, cost_millions: 4.5, points: 95 },
    { name: 'Antonio', club_name: 'West Ham', position: Position.FWD, cost_millions: 5.7, points: 90 },
    { name: 'Solanke', club_name: 'Bournemouth', position: Position.FWD, cost_millions: 7.0, points: 180 },
    { name: 'Neto', club_name: 'Bournemouth', position: Position.GK, cost_millions: 4.6, points: 105 },
    { name: 'Zabarnyi', club_name: 'Bournemouth', position: Position.DEF, cost_millions: 4.5, points: 90 },
    { name: 'Eze', club_name: 'Palace', position: Position.MID, cost_millions: 6.0, points: 140 },
    { name: 'Mateta', club_name: 'Palace', position: Position.FWD, cost_millions: 5.0, points: 135 },
    { name: 'Mitchell', club_name: 'Palace', position: Position.DEF, cost_millions: 4.5, points: 100 },
    { name: 'Henderson', club_name: 'Palace', position: Position.GK, cost_millions: 4.4, points: 90 },
    { name: 'Pickford', club_name: 'Everton', position: Position.GK, cost_millions: 4.6, points: 130 },
    { name: 'Branthwaite', club_name: 'Everton', position: Position.DEF, cost_millions: 4.3, points: 115 },
    { name: 'Tarkowski', club_name: 'Everton', position: Position.DEF, cost_millions: 4.6, points: 120 },
    { name: 'McNeil', club_name: 'Everton', position: Position.MID, cost_millions: 5.4, points: 110 },
    { name: 'Leno', club_name: 'Fulham', position: Position.GK, cost_millions: 4.8, points: 125 },
    { name: 'Robinson', club_name: 'Fulham', position: Position.DEF, cost_millions: 4.6, points: 110 },
    { name: 'Muniz', club_name: 'Fulham', position: Position.FWD, cost_millions: 4.6, points: 115 },
    { name: 'Gross', club_name: 'Brighton', position: Position.MID, cost_millions: 6.5, points: 160 },
    { name: 'Dunk', club_name: 'Brighton', position: Position.DEF, cost_millions: 5.0, points: 105 },
    { name: 'Joao Pedro', club_name: 'Brighton', position: Position.FWD, cost_millions: 5.3, points: 120 },
  ];

  for (const p of playersData) {
    await prisma.player.create({ data: p });
  }

  console.log('Seeded 16 UCL teams and ' + playersData.length + ' FPL players');
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
