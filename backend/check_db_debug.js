const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const cricket = await p.player.count({ where: { sport: 'cricket' } });
  const football = await p.player.count({ where: { sport: 'football' } });
  console.log('Cricket count:', cricket);
  console.log('Football count:', football);
  
  if (cricket > 0) {
    const firstCricket = await p.player.findFirst({ where: { sport: 'cricket' } });
    console.log('Sample Cricket Player:', JSON.stringify(firstCricket, null, 2));
  }
}
main().finally(() => p.$disconnect());
