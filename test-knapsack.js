const { FPLKnapsackEngine } = require('./backend/dist/algorithms/fpl-knapsack-engine');

const mockPlayers = [];

// Create 50 mock players for cricket
for (let i = 0; i < 50; i++) {
  mockPlayers.push({
    id: `c_${i}`,
    name: `Player ${i}`,
    position: i % 4 === 0 ? 'WK' : i % 4 === 1 ? 'BAT' : i % 4 === 2 ? 'AR' : 'BWL',
    cost_millions: 5.0,
    points: 50 + i,
    club: `Team${i % 10}`,
    overall_ability: 80,
    base_form: 5,
    goals: 0, assists: 0, clean_sheets: 0, last_3_vs_opponent_pts: 0,
    home_stadium_multiplier: 1,
    expectation_multiplier: 1
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
    club: `FC${i % 10}`,
    overall_ability: 80,
    base_form: 5,
    goals: 0, assists: 0, clean_sheets: 0, last_3_vs_opponent_pts: 0,
    home_stadium_multiplier: 1,
    expectation_multiplier: 1
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
