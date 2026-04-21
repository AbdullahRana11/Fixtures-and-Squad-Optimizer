import { PrismaClient } from '@prisma/client'
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
  console.log('Seeded 16 UCL teams');
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
