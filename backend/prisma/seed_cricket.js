"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
const PSL_TEAMS = [
    { name: 'Karachi Kings', shortName: 'KRK', city: 'Karachi', stadium: 'National Stadium' },
    { name: 'Lahore Qalandars', shortName: 'LHQ', city: 'Lahore', stadium: 'Gaddafi Stadium' },
    { name: 'Islamabad United', shortName: 'ISU', city: 'Islamabad', stadium: 'Rawalpindi Cricket Stadium' },
    { name: 'Peshawar Zalmi', shortName: 'PZL', city: 'Peshawar', stadium: 'Arbab Niaz Stadium' },
    { name: 'Quetta Gladiators', shortName: 'QTG', city: 'Quetta', stadium: 'Bugti Stadium' },
    { name: 'Multan Sultans', shortName: 'MLS', city: 'Multan', stadium: 'Multan Cricket Stadium' },
];
const POSITIONS = [
    { pos: 'WK', count: 3, costRange: [4.5, 9.0], abilityRange: [65, 85] },
    { pos: 'BAT', count: 10, costRange: [5.0, 12.5], abilityRange: [70, 95] },
    { pos: 'AR', count: 8, costRange: [4.5, 11.0], abilityRange: [65, 90] },
    { pos: 'BWL', count: 9, costRange: [4.0, 11.5], abilityRange: [65, 92] },
];
const EXPECTATION_STATUSES = ['Expected', 'Hot_Streak', 'Overperforming', 'Underperforming'];
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function seedCricket() {
    console.log('--- Ingesting Cricket Teams & Players ---');
    // Clean up existing cricket data before inserting
    const teamNames = PSL_TEAMS.map(t => t.name);
    await prisma.player.deleteMany({ where: { club: { in: teamNames } } });
    await prisma.team.deleteMany({ where: { name: { in: teamNames } } });
    const allTeams = [];
    const allPlayers = [];
    for (const t of PSL_TEAMS) {
        const teamRecord = {
            id: (0, uuid_1.v4)(),
            name: t.name,
            sport: 'cricket',
            league: 'PSL',
            country_code: 'PAK',
            city: t.city,
            stadium: t.stadium,
            sheet_source: 'PSL_Generated',
            group_id: 'X',
            is_seeded: false,
        };
        allTeams.push(teamRecord);
        let playerIndex = 1;
        for (const roleDef of POSITIONS) {
            for (let i = 0; i < roleDef.count; i++) {
                const cost = parseFloat((randomFloat(roleDef.costRange[0], roleDef.costRange[1]) * 2).toFixed(0)) / 2; // Step by 0.5
                const ability = randomInt(roleDef.abilityRange[0], roleDef.abilityRange[1]);
                const expStatus = EXPECTATION_STATUSES[randomInt(0, EXPECTATION_STATUSES.length - 1)];
                const baseForm = parseFloat(randomFloat(2.0, 8.5).toFixed(1));
                // Goals (Runs), Assists (Wickets), Clean Sheets (Catches) mapping
                const goals = randomInt(0, 500);
                const assists = roleDef.pos === 'BWL' || roleDef.pos === 'AR' ? randomInt(0, 30) : 0;
                const clean_sheets = roleDef.pos === 'WK' ? randomInt(5, 20) : randomInt(0, 10);
                allPlayers.push({
                    id: `psl-${t.shortName.toLowerCase()}-${playerIndex++}`,
                    name: `${t.shortName} ${roleDef.pos} ${i + 1}`,
                    sport: 'cricket',
                    club: t.name,
                    position: roleDef.pos,
                    cost_millions: cost,
                    overall_ability: ability,
                    expectation_status: expStatus,
                    expectation_multiplier: expStatus === 'Hot_Streak' ? 1.3 : expStatus === 'Overperforming' ? 1.15 : expStatus === 'Underperforming' ? 0.85 : 1.0,
                    base_form: baseForm,
                    home_stadium_multiplier: parseFloat(randomFloat(1.0, 1.1).toFixed(2)),
                    last_3_vs_opponent_pts: parseFloat(randomFloat(1.0, 10.0).toFixed(1)),
                    goals: goals,
                    assists: assists,
                    clean_sheets: clean_sheets,
                    matches_played: randomInt(0, 14),
                });
            }
        }
    }
    // Insert Teams
    for (const team of allTeams) {
        await prisma.team.create({ data: team });
    }
    console.log(`  Inserted ${allTeams.length} PSL teams.`);
    // Insert Players
    for (const player of allPlayers) {
        await prisma.player.create({ data: player });
    }
    console.log(`  Inserted ${allPlayers.length} PSL players.`);
}
async function main() {
    await seedCricket();
    console.log('--- Cricket Seeding Complete ---');
}
main()
    .catch((e) => { console.error('Seeding error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
