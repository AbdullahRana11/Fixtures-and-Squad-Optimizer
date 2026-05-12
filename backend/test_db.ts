import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany();
  console.log(`Total players: ${players.length}`);
  
  const positions = ['GK', 'DEF', 'MID', 'FWD'];
  for (const pos of positions) {
    const count = players.filter(p => p.position === pos).length;
    console.log(`${pos} count: ${count}`);
  }

  const clubs = [...new Set(players.map(p => p.club))];
  console.log(`Clubs: ${clubs.length}`);
  
  await prisma.$disconnect();
}

main();
