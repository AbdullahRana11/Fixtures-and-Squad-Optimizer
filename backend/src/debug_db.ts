import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    where: { sheet_source: 'English_FA_Pool_64' },
    select: { name: true }
  });
  const clubsInPlayers = await prisma.player.groupBy({
    by: ['club'],
    _count: { club: true }
  });

  console.log('--- Teams in DB ---');
  console.log(teams.map(t => t.name).join(', '));
  console.log('\n--- Clubs in Players ---');
  console.log(clubsInPlayers.map(c => `${c.club} (${c._count.club})`).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
