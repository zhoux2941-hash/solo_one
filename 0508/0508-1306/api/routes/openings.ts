import { Router } from 'express';
import { getDatabase } from '../db.js';
import { runMCTS } from '../mcts.js';

const BOARD_SIZE = 17;

const router = Router();

function positionKey(pos: any): string {
  return `${pos.x},${pos.y}`;
}

function movesMatch(currentMoves: any[], openingMoves: any[]): boolean {
  if (currentMoves.length > openingMoves.length) {
    return false;
  }
  for (let i = 0; i < currentMoves.length; i++) {
    if (positionKey(currentMoves[i]) !== positionKey(openingMoves[i])) {
      return false;
    }
  }
  return true;
}

function isPositionOccupied(pos: any, moves: any[]): boolean {
  const key = positionKey(pos);
  return moves.some((move) => positionKey(move) === key);
}

function buildBoard(moves: any[]): (string | null)[][] {
  const board: (string | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const color = i % 2 === 0 ? 'black' : 'white';
    board[move.y][move.x] = color;
  }
  return board;
}

router.post('/search', async (req, res) => {
  try {
    const db = await getDatabase();
    const { currentMoves, color } = req.body;
    const occupiedSet = new Set(currentMoves.map((m: any) => positionKey(m)));

    const suggestions: any[] = [];

    const results = db.exec('SELECT * FROM openings');
    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;

      for (const row of values) {
        const opening: any = {};
        columns.forEach((col: string, idx: number) => {
          opening[col] = row[idx];
        });

        let moveSequence: any[] = [];
        try {
          moveSequence = JSON.parse(opening.move_sequence);
        } catch (e) {
          continue;
        }

        if (movesMatch(currentMoves, moveSequence) && moveSequence.length > currentMoves.length) {
          const nextMove = moveSequence[currentMoves.length];

          if (isPositionOccupied(nextMove, currentMoves)) {
            continue;
          }

          const existing = suggestions.find(
            (s) => s.position.x === nextMove.x && s.position.y === nextMove.y
          );

          if (!existing) {
            suggestions.push({
              position: nextMove,
              name: opening.name,
              winRate: opening.win_rate,
              description: opening.description,
              source: 'opening',
            });
          } else if (opening.win_rate > existing.winRate) {
            existing.winRate = opening.win_rate;
            existing.name = opening.name;
          }
        }
      }
    }

    suggestions.sort((a, b) => b.winRate - a.winRate);

    if (suggestions.length > 0) {
      res.json({ suggestions: suggestions.slice(0, 5), source: 'opening' });
      return;
    }

    const board = buildBoard(currentMoves);
    const mctsResults = runMCTS(
      board as (string | null)[][],
      color || 'black',
      currentMoves.length,
      2000
    );

    const mctsSuggestions = mctsResults.map((r) => ({
      position: r.position,
      name: 'MCTS推荐',
      winRate: r.winRate,
      description: `搜索${r.visits}次 · 胜率${r.winRate}%`,
      source: 'mcts',
    }));

    res.json({ suggestions: mctsSuggestions, source: 'mcts' });
  } catch (error) {
    console.error('Error searching openings:', error);
    res.status(500).json({ error: 'Failed to search openings' });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const results = db.exec('SELECT * FROM openings LIMIT 50');

    const openings: any[] = [];

    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;

      for (const row of values) {
        const opening: any = {};
        columns.forEach((col: string, idx: number) => {
          opening[col] = row[idx];
        });

        try {
          opening.moveSequence = JSON.parse(opening.move_sequence);
          delete opening.move_sequence;
        } catch (e) {
          opening.moveSequence = [];
        }

        openings.push(opening);
      }
    }

    res.json(openings);
  } catch (error) {
    console.error('Error fetching openings:', error);
    res.status(500).json({ error: 'Failed to fetch openings' });
  }
});

export default router;
