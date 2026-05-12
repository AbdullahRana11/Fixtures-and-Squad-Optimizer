import { Team } from '@prisma/client';

export interface CSPEngineResult {
  match: {
    team_a: Team;
    team_b: Team;
  } | null;
  telemetry: {
    nodes_explored: number;
    paths_pruned: number;
    execution_time_ms: number;
  };
}

export class UCLCspEngine {
  private allTeams: Team[];
  private drawnIds: string[];
  private nodesExplored: number = 0;
  private pathsPruned: number = 0;

  constructor(allTeams: Team[], drawnIds: string[]) {
    this.allTeams = allTeams;
    this.drawnIds = drawnIds;
  }

  private isValidMatchup(teamA: Team, teamB: Team): boolean {
    if (teamA.is_seeded === teamB.is_seeded) return false;
    if (teamA.country_code === teamB.country_code) return false;
    if (teamA.group_id === teamB.group_id) return false;
    return true;
  }

  // Returns true if there exists a perfect bipartite matching for remaining seeded and unseeded teams
  private canCompleteDraw(seeded: Team[], unseeded: Team[]): boolean {
    if (seeded.length === 0 && unseeded.length === 0) return true;
    if (seeded.length !== unseeded.length) return false;

    // Build adjacency list for bipartite graph
    const adj: number[][] = [];
    for (let i = 0; i < seeded.length; i++) {
      adj[i] = [];
      for (let j = 0; j < unseeded.length; j++) {
        if (this.isValidMatchup(seeded[i], unseeded[j])) {
          adj[i].push(j);
        }
      }
    }

    // Maximum Bipartite Matching (Hopcroft-Karp or simple DFS)
    const match = new Array(unseeded.length).fill(-1);
    
    let result = 0;
    for (let i = 0; i < seeded.length; i++) {
        this.nodesExplored++;
        const visited = new Array(unseeded.length).fill(false);
        if (this.bpm(adj, i, visited, match)) {
            result++;
        } else {
            this.pathsPruned++;
        }
    }

    return result === seeded.length;
  }

  private bpm(adj: number[][], u: number, visited: boolean[], match: number[]): boolean {
    for (const v of adj[u]) {
      if (!visited[v]) {
        visited[v] = true;
        if (match[v] < 0 || this.bpm(adj, match[v], visited, match)) {
          match[v] = u;
          return true;
        }
      }
    }
    return false;
  }

  public getNextMatch(): CSPEngineResult {
    const startTime = Date.now();
    this.nodesExplored = 0;
    this.pathsPruned = 0;

    const availableTeams = this.allTeams.filter(t => !this.drawnIds.includes(t.id));
    const availableSeeded = availableTeams.filter(t => t.is_seeded);
    const availableUnseeded = availableTeams.filter(t => !t.is_seeded);

    if (availableSeeded.length === 0 || availableUnseeded.length === 0) {
      return { match: null, telemetry: { nodes_explored: 0, paths_pruned: 0, execution_time_ms: 0 } };
    }

    // Pick an unseeded team
    const teamB = availableUnseeded[0]; 

    let selectedTeamA: Team | null = null;

    // Try finding a valid seeded team (Team A)
    for (let i = 0; i < availableSeeded.length; i++) {
      const teamA = availableSeeded[i];
      if (this.isValidMatchup(teamA, teamB)) {
        this.nodesExplored++;
        
        // Check if choosing this match leaves a valid bipartite matching for the rest
        const remainingSeeded = availableSeeded.filter(t => t.id !== teamA.id);
        const remainingUnseeded = availableUnseeded.filter(t => t.id !== teamB.id);

        if (this.canCompleteDraw(remainingSeeded, remainingUnseeded)) {
          selectedTeamA = teamA;
          break; // Found a mathematically safe match!
        } else {
           this.pathsPruned++; // Pruned because it leads to a dead-end
        }
      } else {
        this.pathsPruned++;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    if (selectedTeamA) {
      return {
        match: {
          team_a: selectedTeamA,
          team_b: teamB
        },
        telemetry: {
          nodes_explored: this.nodesExplored,
          paths_pruned: this.pathsPruned,
          execution_time_ms: executionTimeMs
        }
      };
    }

    return {
      match: null,
      telemetry: {
        nodes_explored: this.nodesExplored,
        paths_pruned: this.pathsPruned,
        execution_time_ms: executionTimeMs
      }
    };
  }
}
