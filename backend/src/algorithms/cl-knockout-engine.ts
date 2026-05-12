/**
 * cl-knockout-engine.ts
 * 
 * Implements the 2024-25 UEFA Champions League Knockout Format.
 * 24 Teams → 1-8 Auto Qualify, 9-24 Play-offs → Round of 16 → Final.
 */

import fs from 'fs';
import path from 'path';

const metricsPath = path.join(__dirname, '../data/team-metrics.json');
const teamMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));

export interface UCLTeam {
  name: string;
  rank: number;
  overallStrength: number;
}

export interface UCLMatch {
  id: string;
  round: 'Play-offs' | 'Round of 16' | 'Quarter-Finals' | 'Semi-Finals' | 'Final';
  matchNumber: number;
  home: UCLTeam | null;
  away: UCLTeam | null;
  winner: string | null;
  pathId: number; // For connecting bracket lines
}

export interface UCLRound {
  name: string;
  matches: UCLMatch[];
  isComplete: boolean;
}

export interface UCLBracket {
  rounds: UCLRound[];
  champion: string | null;
}

export class CLKnockoutEngine {
  private teams: UCLTeam[];

  constructor(teamNames: string[]) {
    // Seed the 24 teams based on their power rating
    this.teams = teamNames
      .map(name => ({
        name,
        overallStrength: teamMetrics[name]?.overallStrength || 70,
        rank: 0 // Will be set below
      }))
      .sort((a, b) => b.overallStrength - a.overallStrength)
      .map((t, idx) => ({ ...t, rank: idx + 1 }));
  }

  public generateInitialBracket(): UCLBracket {
    const bracket: UCLBracket = {
      rounds: [],
      champion: null
    };

    // 1. Play-offs (Ranks 9-24)
    const playoffRound: UCLRound = {
      name: 'Knockout Play-offs',
      matches: [],
      isComplete: false
    };

    // Special pairing as per UEFA rules: 9/10 vs 23/24, etc.
    const seeded = this.teams.slice(8, 16); // 9-16
    const unseeded = this.teams.slice(16, 24).reverse(); // 24-17

    for (let i = 0; i < seeded.length; i++) {
        playoffRound.matches.push({
            id: `ucl-po-${i}`,
            round: 'Play-offs',
            matchNumber: i + 1,
            home: unseeded[i], // Unseeded at home first
            away: seeded[i],
            winner: null,
            pathId: i
        });
    }
    bracket.rounds.push(playoffRound);

    // 2. Round of 16 (Wait for winners)
    const r16Round: UCLRound = {
        name: 'Round of 16',
        matches: [],
        isComplete: false
    };

    const top8 = this.teams.slice(0, 8);
    for (let i = 0; i < 8; i++) {
        r16Round.matches.push({
            id: `ucl-r16-${i}`,
            round: 'Round of 16',
            matchNumber: i + 1,
            home: null, // Winner of Play-off
            away: top8[i], // Top 8 seeded away first (second leg at home)
            winner: null,
            pathId: i
        });
    }
    bracket.rounds.push(r16Round);

    // 3. Quarter Finals
    bracket.rounds.push({
        name: 'Quarter-Finals',
        matches: Array.from({ length: 4 }, (_, i) => ({
            id: `ucl-qf-${i}`,
            round: 'Quarter-Finals',
            matchNumber: i + 1,
            home: null,
            away: null,
            winner: null,
            pathId: i
        })),
        isComplete: false
    });

    // 4. Semi Finals
    bracket.rounds.push({
        name: 'Semi-Finals',
        matches: Array.from({ length: 2 }, (_, i) => ({
            id: `ucl-sf-${i}`,
            round: 'Semi-Finals',
            matchNumber: i + 1,
            home: null,
            away: null,
            winner: null,
            pathId: i
        })),
        isComplete: false
    });

    // 5. Final
    bracket.rounds.push({
        name: 'Final',
        matches: [{
            id: `ucl-f-0`,
            round: 'Final',
            matchNumber: 1,
            home: null,
            away: null,
            winner: null,
            pathId: 0
        }],
        isComplete: false
    });

    return bracket;
  }
}
