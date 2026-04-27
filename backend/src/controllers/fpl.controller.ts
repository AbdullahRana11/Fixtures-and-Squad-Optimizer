import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FPLKnapsackEngine } from '../algorithms/fpl-knapsack-engine';

const prisma = new PrismaClient();

export const optimizeSquad = async (req: Request, res: Response) => {
  try {
    const { budget, gameweek, k_index = 1 } = req.body;

    if (!budget || budget < 38.0) {
      return res.status(400).json({ 
        error: { message: "Minimum budget constraint is £38.0m" } 
      });
    }

    const players = await prisma.player.findMany();

    const engine = new FPLKnapsackEngine(players, budget, k_index);
    const result = engine.optimize();

    if (result.squad.length !== 15) {
       return res.status(400).json({ 
         error: { 
           message: "Impossible constraint or algorithm timed out before finding a valid 15-player squad within budget.",
           telemetry: result.telemetry
         } 
       });
    }

    return res.json(result);
  } catch (error: any) {
    console.error("FPL optimization error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
};

export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany();
    return res.json(players);
  } catch (error: any) {
    console.error("Get all players error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
};

export const constrainedSwap = async (req: Request, res: Response) => {
  try {
    const { remaining_budget, required_position, exclude_clubs } = req.body;

    if (remaining_budget == null || !required_position || !Array.isArray(exclude_clubs)) {
       return res.status(400).json({ error: { message: "Invalid payload parameters." } });
    }

    const candidates = await prisma.player.findMany({
      where: {
        position: required_position,
        cost_millions: { lte: remaining_budget },
        club: { notIn: exclude_clubs }
      }
    });

    const evaluated = candidates.map(p => {
       const dynamicValue = ((p.base_form * 0.4) + (p.last_3_vs_opponent_pts * 0.3) + ((p.overall_ability / 10.0) * 0.3)) * p.home_stadium_multiplier * p.expectation_multiplier;
       return { ...p, dynamicValue };
    });

    // Sort by dynamic value descending
    evaluated.sort((a, b) => b.dynamicValue - a.dynamicValue);

    // Return Top 5
    return res.json({ candidates: evaluated.slice(0, 5) });
  } catch (error: any) {
    console.error("Constrained swap error:", error);
    return res.status(500).json({ error: { message: "Internal server error" } });
  }
};
