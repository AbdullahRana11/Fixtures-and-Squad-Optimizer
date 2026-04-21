import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FPLKnapsackEngine } from '../algorithms/fpl-knapsack-engine';

const prisma = new PrismaClient();

export const optimizeSquad = async (req: Request, res: Response) => {
  try {
    const { budget } = req.body;

    if (!budget || budget < 38.0) {
      return res.status(400).json({ 
        error: { message: "Minimum budget constraint is £38.0m" } 
      });
    }

    const players = await prisma.player.findMany();

    const engine = new FPLKnapsackEngine(players, budget);
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
