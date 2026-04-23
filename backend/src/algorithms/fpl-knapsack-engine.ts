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
  
  // To store top K solutions
  private bestSolutions: { points: number, squad: PlayerWithDynamic[] }[] = [];
  
  private branchesEvaluated: number = 0;
  private branchesPruned: number = 0;
  private maxDepth: number = 0;
  
  private startTime: number = 0;
  private readonly TIME_LIMIT_MS = 4500; // 4.5 seconds cutoff for safety
  private timeExceeded = false;

  constructor(players: Player[], budget: number, kIndex: number = 1) {
    this.maxBudget = budget;
    this.targetK = kIndex;

    const TEAM_CODE_MAP: Record<string, string> = {
      'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE',
      'Brighton': 'BHA', 'Brighton & Hove Albion': 'BHA', 'Chelsea': 'CHE', 'Crystal Palace': 'CRY',
      'Everton': 'EVE', 'Fulham': 'FUL', 'Ipswich Town': 'IPS', 'Ipswich': 'IPS', 'Leicester City': 'LEI', 
      'Leicester': 'LEI', 'Liverpool': 'LIV', 'Manchester City': 'MCI', 'Man City': 'MCI',
      'Manchester United': 'MUN', 'Man Utd': 'MUN', 'Newcastle United': 'NEW', 'Newcastle': 'NEW',
      'Nottingham Forest': 'NFO', 'Southampton': 'SOU', 'Tottenham Hotspur': 'TOT', 'Tottenham': 'TOT', 'Spurs': 'TOT',
      'West Ham United': 'WHU', 'West Ham': 'WHU', 'Wolverhampton Wanderers': 'WOL', 'Wolves': 'WOL'
    };

    this.players = players.map(p => {
      // Normalize club name for constraint enforcement
      const club = TEAM_CODE_MAP[p.club] || p.club;
      
      // $Value = ((Base_Form * 0.4) + (last_3 * 0.3) + (overall_ability / 10 * 0.3)) * stadium * expectation
      const dynamicValue = ((p.base_form * 0.4) + (p.last_3_vs_opponent_pts * 0.3) + ((p.overall_ability / 10.0) * 0.3)) * p.home_stadium_multiplier * p.expectation_multiplier;
      
      return { ...p, club, dynamicValue };
    }).sort((a, b) => {
      // Sort by value density
      const ratioA = a.dynamicValue / Number(a.cost_millions);
      const ratioB = b.dynamicValue / Number(b.cost_millions);
      return ratioB - ratioA; 
    });
  }

  // Fractional knapsack upper bound ignoring club and exact position constraints
  private bound(index: number, currentCost: number, currentPoints: number, selectedCount: number): number {
    if (currentCost > this.maxBudget) return 0;

    let boundPoints = currentPoints;
    let weight = currentCost;
    let j = index;
    let selected = selectedCount;

    while (j < this.players.length && weight + Number(this.players[j].cost_millions) <= this.maxBudget && selected < 15) {
      weight += Number(this.players[j].cost_millions);
      boundPoints += this.players[j].dynamicValue;
      j++;
      selected++;
    }

    if (j < this.players.length && selected < 15) {
      const remainingBudget = this.maxBudget - weight;
      boundPoints += this.players[j].dynamicValue * (remainingBudget / Number(this.players[j].cost_millions));
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

    // Remaining items cannot fulfill squad size
    if (15 - selected.length > this.players.length - idx) {
      this.branchesPruned++;
      return;
    }

    if (idx >= this.players.length) return;

    this.branchesEvaluated++;

    // Prune if theoretical max is worse than lowest in our K-best container
    if (this.bestSolutions.length === this.targetK && this.bound(idx, currentCost, currentPoints, selected.length) <= this.getLowestDynamicValueInTopK()) {
      this.branchesPruned++;
      return;
    }

    const p = this.players[idx];
    const playerCost = Number(p.cost_millions);

    // Branch 1: Include player
    if (currentCost + playerCost <= this.maxBudget && (clubCounts[p.club] || 0) < 3) {
      let canAdd = false;
      if (p.position === 'GK' && posCounts['GK'] < 2) canAdd = true;
      if (p.position === 'DEF' && posCounts['DEF'] < 5) canAdd = true;
      if (p.position === 'MID' && posCounts['MID'] < 5) canAdd = true;
      if (p.position === 'FWD' && posCounts['FWD'] < 3) canAdd = true;

      if (canAdd) {
        selected.push(p);
        posCounts[p.position]++;
        clubCounts[p.club] = (clubCounts[p.club] || 0) + 1;

        this.backtrack(idx + 1, selected, currentPoints + p.dynamicValue, currentCost + playerCost, posCounts, clubCounts);

        selected.pop();
        posCounts[p.position]--;
        clubCounts[p.club]--;
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
