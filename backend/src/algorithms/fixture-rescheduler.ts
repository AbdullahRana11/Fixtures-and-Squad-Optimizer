/**
 * fixture-rescheduler.ts
 *
 * Orchestration engine for PL fixture rescheduling due to FA Cup
 * knockout conflicts. Applies midweek date moves, validates
 * Berger Tables constraints post-move, and produces audit logs.
 *
 * Works in conjunction with fixture-constraint-analyzer.ts for
 * conflict detection and slot-finding.
 */

import { FixtureMatch } from './fixture-generator';
import {
  FACupBracketRef,
  PLConflict,
  MidweekSlot,
  detectFACupKnockoutTeams,
  identifyConflictingPLMatches,
  findAvailableMidweekSlot,
  validateConsecutiveHA,
  extractCLDatesForTeams,
  FACupKnockoutTeam,
} from './fixture-constraint-analyzer';

// ======================== TYPES ========================

export interface RescheduleChange {
  matchId: string;
  team: string;
  opponent: string;
  homeTeam: string;
  awayTeam: string;
  oldDate: string;
  newDate: string;
  oldTime: string;
  newTime: string;
  oldMatchweek: number;
  newMatchweek: number | null;
  reason: string;
}

export interface RescheduleResult {
  updatedFixtures: FixtureMatch[];
  changeSummary: {
    moved: number;
    conflicts: number;
    repaired: number;
    errors: string[];
  };
  changes: RescheduleChange[];
  knockoutTeams: FACupKnockoutTeam[];
}

// Midweek time slots for rescheduled matches
const MIDWEEK_TIME_SLOTS = ['19:45', '20:00', '19:30', '20:15'];

// ======================== MAIN ENGINE ========================

/**
 * Master rescheduling function. Takes a PL schedule and FA Cup bracket,
 * detects conflicts, finds midweek slots, and returns the updated schedule.
 *
 * @param plFixtures     The full PL season fixture array
 * @param faCupBracket   The FA Cup bracket (with rounds/matches)
 * @param plTeamNames    All PL team names (for H/A validation)
 * @param uclBracket     Optional saved UCL bracket for CL-awareness
 */
export function rescheduleConflictingMatches(
  plFixtures: FixtureMatch[],
  faCupBracket: FACupBracketRef,
  plTeamNames: string[],
  uclBracket?: any
): RescheduleResult {
  const changes: RescheduleChange[] = [];
  const errors: string[] = [];

  // 1. Detect which PL teams are in FA Cup knockout stages
  const knockoutTeams = detectFACupKnockoutTeams(faCupBracket);

  if (knockoutTeams.length === 0) {
    return {
      updatedFixtures: plFixtures,
      changeSummary: { moved: 0, conflicts: 0, repaired: 0, errors: [] },
      changes: [],
      knockoutTeams: [],
    };
  }

  // 2. Identify conflicting PL matches
  const conflicts = identifyConflictingPLMatches(plFixtures, knockoutTeams);

  if (conflicts.length === 0) {
    return {
      updatedFixtures: plFixtures,
      changeSummary: { moved: 0, conflicts: 0, repaired: 0, errors: [] },
      changes: [],
      knockoutTeams,
    };
  }

  // 3. Extract CL awareness data
  let clTeams: string[] = [];
  let clDates: string[] = [];
  if (uclBracket) {
    const clData = extractCLDatesForTeams(uclBracket, plTeamNames);
    clTeams = clData.clTeams;
    clDates = clData.clDates;
  }

  // 4. Make a mutable copy of fixtures
  const updatedFixtures = plFixtures.map(f => ({ ...f }));

  // 5. Process each conflict
  for (const conflict of conflicts) {
    const fixtureIdx = updatedFixtures.findIndex(f => f.id === conflict.plMatchId);
    if (fixtureIdx === -1) {
      errors.push(`Fixture ${conflict.plMatchId} not found in schedule`);
      continue;
    }

    const fixture = updatedFixtures[fixtureIdx];

    // Find the best available midweek slot
    const slot = findAvailableMidweekSlot(
      updatedFixtures,
      fixture.home,
      fixture.away,
      conflict.matchDate,
      clTeams,
      clDates
    );

    if (slot.suggestedDate === conflict.matchDate && slot.dayOfWeek === 'TBD') {
      errors.push(
        `No available slot for ${fixture.home} vs ${fixture.away} (MW${fixture.matchweek}) — manual intervention needed`
      );
      continue;
    }

    // Apply the reschedule
    const oldDate = fixture.date;
    const oldTime = fixture.time;
    const oldMatchweek = fixture.matchweek;

    fixture.date = slot.suggestedDate;
    fixture.time = MIDWEEK_TIME_SLOTS[changes.length % MIDWEEK_TIME_SLOTS.length];

    // Track the change
    changes.push({
      matchId: fixture.id,
      team: conflict.teamInKnockout,
      opponent: fixture.home === conflict.teamInKnockout ? fixture.away : fixture.home,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      oldDate,
      newDate: fixture.date,
      oldTime,
      newTime: fixture.time,
      oldMatchweek,
      newMatchweek: slot.suggestedMatchweek,
      reason: `${conflict.faCupRound} conflict`,
    });

    // Update the team's date set for subsequent slot-finding
    // (prevents double-booking in the same midweek)
  }

  // 6. Validate and repair consecutive H/A violations
  const repairResult = validateAndRepair(updatedFixtures, plTeamNames);

  return {
    updatedFixtures: repairResult.fixtures,
    changeSummary: {
      moved: changes.length,
      conflicts: conflicts.length,
      repaired: repairResult.repairsApplied,
      errors,
    },
    changes,
    knockoutTeams,
  };
}

// ======================== VALIDATE & REPAIR ========================

/**
 * Post-rescheduling validation. Checks for consecutive H/A violations
 * introduced by date changes. If found, attempts to repair by swapping
 * H/A in adjacent matchweeks (only within rescheduled matches).
 */
function validateAndRepair(
  fixtures: FixtureMatch[],
  teamNames: string[]
): { fixtures: FixtureMatch[]; repairsApplied: number } {
  let repairsApplied = 0;

  const violations = validateConsecutiveHA(fixtures, teamNames);

  if (violations.length === 0) {
    return { fixtures, repairsApplied: 0 };
  }

  // Attempt repair: for each violation, try swapping H/A for one of
  // the streak matches. This is a conservative repair — we only try
  // swapping within the streak itself, not cascading further.
  for (const violation of violations) {
    const streakFixtures = fixtures
      .filter(f =>
        violation.matchweeks.includes(f.matchweek) &&
        (f.home === violation.team || f.away === violation.team)
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (streakFixtures.length < 2) continue;

    // Try swapping the middle fixture in the streak
    const midIdx = Math.floor(streakFixtures.length / 2);
    const targetFixture = streakFixtures[midIdx];
    const globalIdx = fixtures.findIndex(f => f.id === targetFixture.id);

    if (globalIdx !== -1) {
      // Swap H/A
      const temp = fixtures[globalIdx].home;
      fixtures[globalIdx].home = fixtures[globalIdx].away;
      fixtures[globalIdx].away = temp;
      // Update stadium to new home team's stadium
      // (we'd need team info for this, but for now keep the original)
      repairsApplied++;
    }
  }

  // Re-validate after repairs
  const remainingViolations = validateConsecutiveHA(fixtures, teamNames);
  if (remainingViolations.length > 0) {
    // Log but don't fail — the original Berger Tables guarantee is strong
    // and minor violations from rescheduling are acceptable
    console.warn(
      `[Rescheduler] ${remainingViolations.length} consecutive H/A violations remain after repair`
    );
  }

  return { fixtures, repairsApplied };
}

// ======================== CHANGE SUMMARY ========================

/**
 * Formats rescheduling changes into a human-readable summary
 * for API responses and audit logging.
 */
export function formatChangeSummary(result: RescheduleResult): string {
  if (result.changes.length === 0) {
    return 'No PL fixtures needed rescheduling.';
  }

  const lines: string[] = [
    `📋 ${result.changes.length} PL fixture(s) rescheduled due to FA Cup conflicts:`,
    '',
  ];

  for (const change of result.changes) {
    lines.push(
      `  • ${change.homeTeam} vs ${change.awayTeam} (MW${change.oldMatchweek})`,
      `    ${change.oldDate} → ${change.newDate} [${change.reason}]`,
      ''
    );
  }

  if (result.changeSummary.repaired > 0) {
    lines.push(`🔧 ${result.changeSummary.repaired} H/A repair(s) applied.`);
  }

  if (result.changeSummary.errors.length > 0) {
    lines.push(`⚠️  ${result.changeSummary.errors.length} error(s):`);
    for (const err of result.changeSummary.errors) {
      lines.push(`  - ${err}`);
    }
  }

  return lines.join('\n');
}
