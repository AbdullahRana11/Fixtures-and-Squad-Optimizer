import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UCLCspEngine } from '../algorithms/ucl-csp-engine';

const prisma = new PrismaClient();

class UCLController {
  public drawMatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { drawn_team_ids } = req.body;

      if (!Array.isArray(drawn_team_ids)) {
        res.status(400).json({
           error: {
             code: "INVALID_PAYLOAD",
             message: "drawn_team_ids must be an array"
           }
        });
        return;
      }

      const allTeams = await prisma.team.findMany();

      if (drawn_team_ids.length >= 16) {
         res.status(422).json({
            error: {
               code: "DRAW_COMPLETE",
               message: "All 16 teams have been drawn."
            }
         });
         return;
      }

      const engine = new UCLCspEngine(allTeams, drawn_team_ids);
      const result = engine.getNextMatch();

      if (!result.match) {
        res.status(422).json({
          error: {
            code: "DEAD_END_REACHED",
            message: "Constraint engine could not find a mathematically valid outcome without hitting a dead end."
          }
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred."
        }
      });
    }
  };
}

export default new UCLController();
