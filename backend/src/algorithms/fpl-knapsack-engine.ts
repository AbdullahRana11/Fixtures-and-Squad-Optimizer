import { Player } from '@prisma/client';

export interface FPLOptimizationResult {
  squad: Player[];
  summary: {
    total_cost: number;
    total_points: number;
  };
  telemetry: {
    branches_evaluated: number;
    branches_pruned: number;
    execution_time_ms: number;
    depth_reached: number;
  };
}

export class FPLKnapsackEngine {
  private players: Player[];
  private maxBudget: number;
  
  private bestPoints: number = -1;
  private bestSquad: Player[] = [];
  
  private branchesEvaluated: number = 0;
  private branchesPruned: number = 0;
  private maxDepth: number = 0;
  
  private startTime: number = 0;
  private readonly TIME_LIMIT_MS = 4500; // 4.5 seconds cutoff for safety
  private timeExceeded = false;

  constructor(players: Player[], budget: number) {
    // Sort players by value density (points / cost)
    this.players = players.sort((a, b) => {
      const ratioA = a.points / Number(a.cost_millions);
      const ratioB = b.points / Number(b.cost_millions);
      return ratioB - ratioA; // Descending
    });
    this.maxBudget = budget;
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
      boundPoints += this.players[j].points;
      j++;
      selected++;
    }

    if (j < this.players.length && selected < 15) {
      const remainingBudget = this.maxBudget - weight;
      boundPoints += this.players[j].points * (remainingBudget / Number(this.players[j].cost_millions));
    }

    return boundPoints;
  }

  private backtrack(
    idx: number,
    selected: Player[],
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
        if (currentPoints > this.bestPoints) {
          this.bestPoints = currentPoints;
          this.bestSquad = [...selected];
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

    // Prune if theoretical max is worse than best found
    if (this.bound(idx, currentCost, currentPoints, selected.length) <= this.bestPoints) {
      this.branchesPruned++;
      return;
    }

    const p = this.players[idx];
    const playerCost = Number(p.cost_millions);

    // Branch 1: Include player
    if (currentCost + playerCost <= this.maxBudget && (clubCounts[p.club_name] || 0) < 3) {
      let canAdd = false;
      if (p.position === 'GK' && posCounts['GK'] < 2) canAdd = true;
      if (p.position === 'DEF' && posCounts['DEF'] < 5) canAdd = true;
      if (p.position === 'MID' && posCounts['MID'] < 5) canAdd = true;
      if (p.position === 'FWD' && posCounts['FWD'] < 3) canAdd = true;

      if (canAdd) {
        selected.push(p);
        posCounts[p.position]++;
        clubCounts[p.club_name] = (clubCounts[p.club_name] || 0) + 1;

        this.backtrack(idx + 1, selected, currentPoints + p.points, currentCost + playerCost, posCounts, clubCounts);

        selected.pop();
        posCounts[p.position]--;
        clubCounts[p.club_name]--;
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

    return {
      squad: this.bestSquad,
      summary: {
        total_cost: this.bestSquad.reduce((sum, p) => sum + Number(p.cost_millions), 0),
        total_points: this.bestPoints,
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
