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
  private readonly TIME_LIMIT_MS = 4000;
  private timeExceeded: boolean = false;

  // Telemetry
  private branchesEvaluated = 0;
  private branchesPruned = 0;
  private maxDepth = 0;

  private sport: 'football' | 'cricket';
  // Suffix counts of each position from index i onward (precomputed for O(1) feasibility pruning)
  private suffixPosCounts: Record<string, number[]> = {};

  constructor(players: Player[], budget: number, kIndex: number = 1, sport: 'football' | 'cricket' = 'football') {
    this.maxBudget = budget;
    this.targetK = kIndex;
    this.sport = sport;

    const TEAM_CODE_MAP: Record<string, string> = {
      // PSL full names → short codes
      'Karachi Kings': 'KRK', 'Lahore Qalandars': 'LHQ', 'Islamabad United': 'ISU',
      'Peshawar Zalmi': 'PZL', 'Quetta Gladiators': 'QTG', 'Multan Sultans': 'MLS',
      // Short code passthrough (identity)
      'KRK': 'KRK', 'LHQ': 'LHQ', 'ISU': 'ISU',
      'PZL': 'PZL', 'QTG': 'QTG', 'MLS': 'MLS',
      // Football full names → short codes
      'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE',
      'Brighton': 'BHA', 'Brighton & Hove Albion': 'BHA', 'Chelsea': 'CHE', 'Crystal Palace': 'CRY',
      'Everton': 'EVE', 'Fulham': 'FUL', 'Ipswich Town': 'IPS', 'Ipswich': 'IPS', 'Leicester City': 'LEI', 
      'Leicester': 'LEI', 'Liverpool': 'LIV', 'Manchester City': 'MCI', 'Man City': 'MCI',
      'Manchester United': 'MUN', 'Man Utd': 'MUN', 'Newcastle United': 'NEW', 'Newcastle': 'NEW',
      'Nottingham Forest': 'NFO', 'Southampton': 'SOU', 'Tottenham Hotspur': 'TOT', 'Tottenham': 'TOT', 'Spurs': 'TOT',
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
      const budgetBonus = Math.max(0, (cost - 5.0)) * 3.0;
      const budgetWeight = cost * 8.0;
      // Cricket stats: runs (goals), wickets (assists), catches (clean_sheets)
      const statsPoints = (p.goals * 4) + (p.assists * 5) + (p.clean_sheets * 3);
      const form = (p.base_form * 0.4) + (p.last_3_vs_opponent_pts * 0.3) + (statsPoints * 0.1);
      
      const dynamicValue = (starPower + budgetBonus + budgetWeight + form + jitter) * p.home_stadium_multiplier * p.expectation_multiplier;
      
      return { ...p, club, dynamicValue };
    }).sort((a, b) => {
      return b.dynamicValue - a.dynamicValue;
    });
  }

  private buildSuffixCounts() {
    const n = this.players.length;
    const positions = this.sport === 'cricket'
      ? ['WK', 'BAT', 'AR', 'BWL']
      : ['GK', 'DEF', 'MID', 'FWD'];
    for (const pos of positions) {
      const arr = new Array(n + 1).fill(0);
      for (let i = n - 1; i >= 0; i--) {
        arr[i] = arr[i + 1] + (this.players[i].position === pos ? 1 : 0);
      }
      this.suffixPosCounts[pos] = arr;
    }
  }

  // Linear Upper Bound
  private bound(index: number, currentPoints: number, selectedCount: number): number {
    let boundPoints = currentPoints;
    let maxSlots = this.sport === 'cricket' ? 11 : 15;
    let slotsLeft = maxSlots - selectedCount;
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

    const targetLength = this.sport === 'cricket' ? 11 : 15;

    // BASE CASE: Found a full squad
    if (selected.length === targetLength) {
      let isValid = false;
      if (this.sport === 'cricket') {
        isValid = posCounts['WK'] === 1 && posCounts['BAT'] === 5 && posCounts['AR'] === 2 && posCounts['BWL'] === 3;
      } else {
        isValid = posCounts['GK'] === 2 && posCounts['DEF'] === 5 && posCounts['MID'] === 5 && posCounts['FWD'] === 3;
      }

      if (isValid) {
        if (this.bestSolutions.length < this.targetK || currentPoints > this.getLowestDynamicValueInTopK()) {
          this.addSolution(currentPoints, selected);
        }
      }
      return;
    }

    // PRUNING: Not enough players left to reach target length
    if (targetLength - selected.length > this.players.length - idx) {
      this.branchesPruned++;
      return;
    }

    if (idx >= this.players.length) return;

    // POSITIONAL FEASIBILITY PRUNING (O(1) via precomputed suffix counts)
    if (this.sport === 'cricket') {
      if (
        this.suffixPosCounts['WK'][idx]  < Math.max(0, 1 - (posCounts['WK'] || 0)) ||
        this.suffixPosCounts['BAT'][idx] < Math.max(0, 5 - (posCounts['BAT'] || 0)) ||
        this.suffixPosCounts['AR'][idx]  < Math.max(0, 2 - (posCounts['AR']  || 0)) ||
        this.suffixPosCounts['BWL'][idx] < Math.max(0, 3 - (posCounts['BWL'] || 0))
      ) {
        this.branchesPruned++;
        return;
      }
    } else {
      if (
        this.suffixPosCounts['GK'][idx]  < Math.max(0, 2 - (posCounts['GK']  || 0)) ||
        this.suffixPosCounts['DEF'][idx] < Math.max(0, 5 - (posCounts['DEF'] || 0)) ||
        this.suffixPosCounts['MID'][idx] < Math.max(0, 5 - (posCounts['MID'] || 0)) ||
        this.suffixPosCounts['FWD'][idx] < Math.max(0, 3 - (posCounts['FWD'] || 0))
      ) {
        this.branchesPruned++;
        return;
      }
    }

    this.branchesEvaluated++;

    // DYNAMIC PRUNING: Bound check
    if (this.bestSolutions.length === this.targetK && this.bound(idx, currentPoints, selected.length) <= this.getLowestDynamicValueInTopK()) {
      this.branchesPruned++;
      return;
    }

    const p = this.players[idx];
    const playerCost = Number(p.cost_millions);

    // Branch 1: Include player (max 3 per franchise)
    if (currentCost + playerCost <= this.maxBudget && (clubCounts[p.club] || 0) < 3) {
      let canAdd = false;
      if (this.sport === 'cricket') {
        if (p.position === 'WK' && posCounts['WK'] < 1) canAdd = true;
        else if (p.position === 'BAT' && posCounts['BAT'] < 5) canAdd = true;
        else if (p.position === 'AR' && posCounts['AR'] < 2) canAdd = true;
        else if (p.position === 'BWL' && posCounts['BWL'] < 3) canAdd = true;
      } else {
        if (p.position === 'GK' && posCounts['GK'] < 2) canAdd = true;
        else if (p.position === 'DEF' && posCounts['DEF'] < 5) canAdd = true;
        else if (p.position === 'MID' && posCounts['MID'] < 5) canAdd = true;
        else if (p.position === 'FWD' && posCounts['FWD'] < 3) canAdd = true;
      }

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
    this.buildSuffixCounts();
    this.startTime = Date.now();
    const posCounts: Record<string, number> = this.sport === 'cricket' 
      ? { WK: 0, BAT: 0, AR: 0, BWL: 0 } 
      : { GK: 0, DEF: 0, MID: 0, FWD: 0 };
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
