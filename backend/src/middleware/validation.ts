// backend/src/middleware/validation.ts
// ============================================================
// Input Validation Middleware with Zod
// Install: npm install zod
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  details: z.ZodIssue[];
}

/**
 * Middleware factory for request body validation
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: err.issues.map((e: z.ZodIssue) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(err);
    }
  };

/**
 * Validation schemas for fixtures
 */
export const generateFixturesSchema = z.object({
  league: z.string().min(1, 'League is required'),
  teamNames: z
    .array(z.string().min(1))
    .min(2, 'At least 2 teams required')
    .max(64, 'Maximum 64 teams allowed'),
  mode: z.enum(['auto', 'ucl-knockout']).optional(),
});

export const predictMatchSchema = z.object({
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  homeLeague: z.string().optional(),
  awayLeague: z.string().optional(),
  isDerby: z.boolean().optional(),
  homePot: z.number().int().min(1).max(4).optional(),
  awayPot: z.number().int().min(1).max(4).optional(),
});

export const modifyFixtureSchema = z.object({
  schedule: z.object({}).passthrough(),
  fixtureId: z.string().min(1),
});

/**
 * Validation schemas for FPL
 */
export const optimizeSquadSchema = z.object({
  budget: z
    .number()
    .min(38, 'Budget must be at least £38m')
    .max(300, 'Budget cannot exceed £300m'),
  gameweek: z.number().int().min(1).max(38).optional(),
  k_index: z.number().int().min(1).max(5).optional().default(1),
  sport: z.enum(['football', 'cricket']).optional().default('football'),
  customPlayers: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        club: z.string(),
        position: z.string(), // Allow dynamic positions for cricket
        cost_millions: z.number().positive(),
        overall_ability: z.number().min(1).max(100).optional(),
        base_form: z.number().optional(),
        expectation_status: z.enum(['Hot_Streak', 'Overperforming', 'Expected', 'Underperforming']).optional(),
      })
    )
    .optional(),
});

export const constrainedSwapSchema = z.object({
  remaining_budget: z
    .number()
    .nonnegative('Budget cannot be negative'),
  required_position: z.string(),
  exclude_clubs: z
    .array(z.string())
    .default([]),
  sport: z.enum(['football', 'cricket']).optional().default('football'),
});

export const optimizeMatchweekSchema = z.object({
  budget: z.number().min(38).max(300).optional(),
  matchweek: z.number().int().min(1).max(38),
  fixtures: z.array(
    z.object({
      home: z.string(),
      away: z.string(),
    })
  ),
  k_index: z.number().int().min(1).max(5).optional(),
  customPlayers: z.array(z.object({}).passthrough()).optional(),
  sport: z.enum(['football', 'cricket']).optional().default('football'),
});

/**
 * Validation schemas for tournaments
 */
export const saveTournamentSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['league', 'facup', 'ucl', 'custom']),
  name: z.string().optional(),
  status: z.string().optional(),
  bracket: z.object({}).passthrough(),
  settings: z.object({}).passthrough().optional(),
});

export const syncTournamentsSchema = z.object({
  plTournamentId: z.string().optional(),
  faCupTournamentId: z.string().optional(),
});

/**
 * Generic error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ERROR]', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.issues,
    });
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};
