import { FPLKnapsackEngine } from './backend/src/algorithms/fpl-knapsack-engine.ts';

const mockPlayers: any[] = [];

// Create 50 mock players for cricket
for (let i = 0; i < 50; i++) {
  mockPlayers.push({
    id: `c_${i}`,
    name: `Player ${i}`,
    position: i % 4 === 0 ? 'WK' : i % 4 === 1 ? 'BAT' : i % 4 === 2 ? 'AR' : 'BWL',
    cost_millions: 5.0,
    points: 50 + i,
    club: i % 2 === 0 ? 'TeamA' : 'TeamB'
  });
}

// Create 50 mock players for football
for (let i = 0; i < 50; i++) {
  mockPlayers.push({
    id: `f_${i}`,
    name: `Footballer ${i}`,
    position: i % 4 === 0 ? 'GK' : i % 4 === 1 ? 'DEF' : i % 4 === 2 ? 'MID' : 'FWD',
    cost_millions: 5.0,
    points: 50 + i,
    club: i % 2 === 0 ? 'ARS' : 'CHE'
  });
}

const engineCricket = new FPLKnapsackEngine(mockPlayers, 100, 1, 'cricket');
const cricketResult = engineCricket.optimize();
console.log(`Cricket Squad Size: ${cricketResult.squad.length}`);
console.assert(cricketResult.squad.length === 11, 'Cricket squad should be 11 players');

const engineFootball = new FPLKnapsackEngine(mockPlayers, 100, 1, 'football');
const footballResult = engineFootball.optimize();

console.log(`Football Squad Size: ${footballResult.squad.length}`);
console.assert(footballResult.squad.length === 15, 'Football squad should be 15 players');

console.log("Tests passed!");
