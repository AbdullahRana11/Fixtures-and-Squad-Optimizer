import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// --------------- HELPERS ---------------
function toStr(val: any): string { return val != null ? String(val).trim() : ''; }
function toFloat(val: any): number { return parseFloat(String(val || 0)) || 0; }

// Country code mapping for league sheets
const LEAGUE_COUNTRY: Record<string, string> = {
  'English_FA_Pool_64': 'ENG',
  'Spanish_League_40': 'ESP',
  'Italian_League_40': 'ITA',
  'German_League_40': 'GER',
  'UCL_Draw_Pool_60': '',   // per-row
};

// Competition ID mapping for frontend
const SHEET_TO_COMPETITION: Record<string, string> = {
  'English_FA_Pool_64': 'pl',   // also used for FA Cup
  'Spanish_League_40': 'laliga',
  'Italian_League_40': 'seriea',
  'German_League_40': 'bundesliga',
  'UCL_Draw_Pool_60': 'ucl',
};

// Country code from UCL League_Country field
const UCL_COUNTRY_CODE: Record<string, string> = {
  'Spain': 'ESP', 'England': 'ENG', 'Germany': 'GER', 'Italy': 'ITA',
  'France': 'FRA', 'Portugal': 'POR', 'Netherlands': 'NED', 'Belgium': 'BEL',
  'Scotland': 'SCO', 'Turkey': 'TUR', 'Ukraine': 'UKR', 'Austria': 'AUT',
  'Croatia': 'CRO', 'Serbia': 'SRB', 'Czech Republic': 'CZE', 'Switzerland': 'SUI',
  'Norway': 'NOR', 'Sweden': 'SWE', 'Denmark': 'DEN', 'Israel': 'ISR',
  'Azerbaijan': 'AZE', 'Bulgaria': 'BUL', 'Slovakia': 'SVK', 'Greece': 'GRE',
};

// --------------- TEAM INGESTION ---------------
async function seedTeams() {
  console.log('--- Ingesting Teams from Teams.xlsx ---');
  const filePath = path.join(__dirname, '../../dataset/Teams.xlsx');
  const workbook = xlsx.readFile(filePath);

  const allTeams: any[] = [];

  for (const sheetName of workbook.SheetNames) {
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const countryCode = LEAGUE_COUNTRY[sheetName] || '';

    console.log(`  Sheet "${sheetName}": ${data.length} teams`);

    for (const row of data) {
      if (sheetName === 'UCL_Draw_Pool_60') {
        // UCL-specific columns
        allTeams.push({
          id: uuidv4(),
          name: toStr(row.Team),
          league: 'Champions League',
          country_code: UCL_COUNTRY_CODE[toStr(row.League_Country)] || toStr(row.League_Country).substring(0, 3).toUpperCase(),
          city: 'Unknown',
          stadium: toStr(row.Stadium),
          biggest_rival: null,
          other_rivals: null,
          policing_conflict: null,
          sheet_source: sheetName,
          uefa_pot: toStr(row.UEFA_Coefficient_Tier),
          home_advantage: toFloat(row.Home_Advantage_Multiplier),
          geographic_zone: toStr(row.Geographic_Zone),
          winter_restricted: toStr(row.Winter_Venue_Restriction).toLowerCase() === 'yes',
          group_id: 'X',
          is_seeded: toStr(row.UEFA_Coefficient_Tier) === 'Pot 1',
        });
      } else {
        // League-specific columns
        allTeams.push({
          id: uuidv4(),
          name: toStr(row.Team),
          league: toStr(row.League),
          country_code: countryCode,
          city: toStr(row.City),
          stadium: toStr(row.Stadium),
          biggest_rival: toStr(row.Biggest_Rival) || null,
          other_rivals: toStr(row.Other_Rivals) || null,
          policing_conflict: toStr(row.Policing_Conflict) === 'None' ? null : toStr(row.Policing_Conflict),
          sheet_source: sheetName,
          uefa_pot: null,
          home_advantage: null,
          geographic_zone: null,
          winter_restricted: false,
          group_id: 'X',
          is_seeded: false,
        });
      }
    }
  }

  // Clear and re-insert
  await prisma.team.deleteMany({});
  let teamCount = 0;
  for (const team of allTeams) {
    try {
      await prisma.team.create({ data: team });
      teamCount++;
    } catch (e) {
      // Skip duplicates or other errors
    }
  }
  console.log(`  Inserted ${teamCount} teams total.`);
}

// --------------- PLAYER INGESTION ---------------
async function seedPlayers() {
  console.log('--- Ingesting Players from FPL Excel ---');
  const filePath = path.join(__dirname, '../../FPL_Real_Players_25_26.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawData: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`  Found ${rawData.length} rows.`);

  const playersToCreate = [];
  for (const row of rawData) {
    const player = {
      id: String(row.Player_ID || ''),
      name: String(row.Name || ''),
      club: String(row.Club || ''),
      position: String(row.Position || ''),
      cost_millions: parseFloat(String(row.Cost_Millions || 0)),
      overall_ability: parseInt(String(row.Overall_Ability_Rating || 0)),
      expectation_status: String(row.Expectation_Status || ''),
      expectation_multiplier: parseFloat(String(row.Expectation_Multiplier || 0)),
      base_form: parseFloat(String(row.Base_Form || 0)),
      home_stadium_multiplier: parseFloat(String(row.Home_Stadium_Multiplier || 0)),
      last_3_vs_opponent_pts: parseFloat(String(row.Last_3_vs_Next_Opponent_Avg_Pts || 0)),
    };

    if (!player.id || !player.name) continue;
    playersToCreate.push(player);
  }

  await prisma.player.deleteMany({});
  let playerCount = 0;
  for (const p of playersToCreate) {
    try {
      await prisma.player.create({ data: p });
      playerCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`  Inserted ${playerCount} players.`);
}

// --------------- MAIN ---------------
async function main() {
  await seedTeams();
  await seedPlayers();
  console.log('--- All Seeding Complete ---');
}

main()
  .catch((e) => { console.error('Seeding error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
