import { Player } from '@prisma/client';

export interface FPLOptimizationResult {
  squad: Player[];
  summary: {
    total_cost: number;
    total_dynamic_value: number;
  };
  telemetry: {
    branches_evaluated: number;
    branches_pruned: number;
    execution_time_ms: number;
    depth_reached: number;
  };
}

export interface PlayerWithDynamic extends Player {
  dynamicValue: number;
}

export class FPLKnapsackEngine {
  private players: PlayerWithDynamic[];
  private maxBudget: number;
  private targetK: number;
  private bestSolutions: { points: number; squad: PlayerWithDynamic[] }[] = [];
  private startTime: number = 0;
  private readonly TIME_LIMIT_MS = 2000;
  private timeExceeded: boolean = false;

  // Telemetry
  private branchesEvaluated = 0;
  private branchesPruned = 0;
  private maxDepth = 0;

  constructor(players: Player[], budget: number, kIndex: number = 1) {
    this.maxBudget = budget;
    this.targetK = kIndex;

    const TEAM_CODE_MAP: Record<string, string> = {
      'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE',
      'Brighton': 'BHA', 'Brighton & Hove Albion': 'BHA', 'Chelsea': 'CHE', 'Crystal Palace': 'CRY',
      'Everton': 'EVE', 'Fulham': 'FUL', 'Ipswich Town': 'IPS', 'Ipswich': 'IPS', 'Leicester City': 'LEI', 
      'Leicester': 'LEI', 'Liverpool': 'LIV', 'Manchester City': 'MCI', 'Man City': 'MCI',
      'Manchester United': 'MUN', 'Man Utd': 'MUN', 'Newcastle United': 'NEW', 'Newcastle': 'NEW', 'Newcastle Utd': 'NEW',
      'Nottingham Forest': 'NFO', 'Nott\'m Forest': 'NFO', 'Southampton': 'SOU', 'Tottenham Hotspur': 'TOT', 'Tottenham': 'TOT', 'Spurs': 'TOT',
      'West Ham United': 'WHU', 'West Ham': 'WHU', 'Wolverhampton Wanderers': 'WOL', 'Wolves': 'WOL'
    };

    this.players = players.map(p => {
      const club = TEAM_CODE_MAP[p.club] || p.club;
      const cost = Number(p.cost_millions || 0);
      
      // JITTER: More unique seed using name length + alphabetical index of first char
      const nameSeed = (p.name.length * 13) + (p.name.charCodeAt(0) * 7);
      const jitter = (Math.sin(nameSeed + kIndex) + 1) * 3; 

      // STAR POWER: Favor expensive stars intensely using exponential scaling for ability
      const starPower = Math.pow(p.overall_ability / 10.0, 1.5) * 5.0; 
      const budgetBonus = Math.max(0, (cost - 5.0)) * 3.0; // Extra weight for players costing over 5M
      const budgetWeight = cost * 8.0; // Broad spending incentive
      const statsPoints = (p.goals * 5) + (p.assists * 3) + (p.clean_sheets * 4);
      const form = (p.base_form * 0.4) + (p.last_3_vs_opponent_pts * 0.3) + (statsPoints * 0.1);
      
      const dynamicValue = (starPower + budgetBonus + budgetWeight + form + jitter) * p.home_stadium_multiplier * p.expectation_multiplier;
      
      return { ...p, club, dynamicValue };
    }).sort((a, b) => {
      // PRIMARY SORT: Always try highest value (Superstars) first
      return b.dynamicValue - a.dynamicValue;
    });
  }

  // Linear Upper Bound for Absolute-Value sorting
  private bound(index: number, currentPoints: number, selectedCount: number): number {
    let boundPoints = currentPoints;
    let slotsLeft = 15 - selectedCount;
    let j = index;

    while (j < this.players.length && slotsLeft > 0) {
      boundPoints += this.players[j].dynamicValue;
      j++;
      slotsLeft--;
    }
    return boundPoints;
  }

  private getLowestDynamicValueInTopK(): number {
    if (this.bestSolutions.length < this.targetK) return -1;
    return this.bestSolutions[this.bestSolutions.length - 1].points;
  }

  private addSolution(points: number, squad: PlayerWithDynamic[]) {
    this.bestSolutions.push({ points, squad: [...squad] });
    this.bestSolutions.sort((a, b) => b.points - a.points);
    if (this.bestSolutions.length > this.targetK) {
      this.bestSolutions.pop();
    }
  }

  private backtrack(
    idx: number,
    selected: PlayerWithDynamic[],
    currentPoints: number,
    currentCost: number,
    posCounts: Record<string, number>,
    clubCounts: Record<string, number>
  ) {
    if (this.timeExceeded) return;
    if (Date.now() - this.startTime > this.TIME_LIMIT_MS) {
      this.timeExceeded = true;
      return;
    }

    this.maxDepth = Math.max(this.maxDepth, selected.length);

    // BASE CASE: Found a full 15-player squad
    if (selected.length === 15) {
      if (
        posCounts['GK'] === 2 &&
        posCounts['DEF'] === 5 &&
        posCounts['MID'] === 5 &&
        posCounts['FWD'] === 3
      ) {
        if (this.bestSolutions.length < this.targetK || currentPoints > this.getLowestDynamicValueInTopK()) {
          this.addSolution(currentPoints, selected);
        }
      }
      return;
    }

    // PRUNING: Not enough players left to reach 15
    if (15 - selected.length > this.players.length - idx) {
      this.branchesPruned++;
      return;
    }

    if (idx >= this.players.length) return;

    this.branchesEvaluated++;

    // DYNAMIC PRUNING: Bound check
    if (this.bestSolutions.length === this.targetK && this.bound(idx, currentPoints, selected.length) <= this.getLowestDynamicValueInTopK()) {
      this.branchesPruned++;
      return;
    }

    const p = this.players[idx];
    const playerCost = Number(p.cost_millions);

    // Branch 1: Include player (Try High Value Players First)
    if (currentCost + playerCost <= this.maxBudget && (clubCounts[p.club] || 0) < 3) {
      let canAdd = false;
      if (p.position === 'GK' && posCounts['GK'] < 2) canAdd = true;
      else if (p.position === 'DEF' && posCounts['DEF'] < 5) canAdd = true;
      else if (p.position === 'MID' && posCounts['MID'] < 5) canAdd = true;
      else if (p.position === 'FWD' && posCounts['FWD'] < 3) canAdd = true;

      if (canAdd) {
        selected.push(p);
        posCounts[p.position]++;
        const prevClubCount = clubCounts[p.club] || 0;
        clubCounts[p.club] = prevClubCount + 1;

        this.backtrack(idx + 1, selected, currentPoints + p.dynamicValue, currentCost + playerCost, posCounts, clubCounts);

        // Backtrack
        selected.pop();
        posCounts[p.position]--;
        clubCounts[p.club] = prevClubCount;
      }
    }

    // Branch 2: Exclude player
    this.backtrack(idx + 1, selected, currentPoints, currentCost, posCounts, clubCounts);
  }

  public optimize(): FPLOptimizationResult {
    this.startTime = Date.now();
    const posCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    const clubCounts = {};

    this.backtrack(0, [], 0, 0, posCounts, clubCounts);

    const execTime = Date.now() - this.startTime;
    
    // Fallback if we didn't find enough solutions to reach targetK
    const finalSolutionIndex = Math.min(this.targetK - 1, this.bestSolutions.length - 1);
    const finalSolution = finalSolutionIndex >= 0 
      ? this.bestSolutions[finalSolutionIndex] 
      : { squad: [], points: 0 };

    return {
      squad: finalSolution.squad,
      summary: {
        total_cost: finalSolution.squad.reduce((sum, p) => sum + Number(p.cost_millions), 0),
        total_dynamic_value: finalSolution.points,
      },
      telemetry: {
        branches_evaluated: this.branchesEvaluated,
        branches_pruned: this.branchesPruned,
        execution_time_ms: execTime,
        depth_reached: this.maxDepth,
      }
    };
  }
}
