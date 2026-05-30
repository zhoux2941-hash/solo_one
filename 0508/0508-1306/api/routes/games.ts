import { Router } from 'express';
import { getDatabase, saveDatabase } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const games: any[] = [];
    
    const gameResults = db.exec('SELECT * FROM games ORDER BY created_at DESC');
    
    if (gameResults.length > 0) {
      const gameColumns = gameResults[0].columns;
      const gameValues = gameResults[0].values;
      
      for (const gameRow of gameValues) {
        const game: any = {};
        gameColumns.forEach((col: string, idx: number) => {
          game[col] = gameRow[idx];
        });
        
        const moveResults = db.exec(
          `SELECT * FROM moves WHERE game_id = '${game.id}' ORDER BY move_number`
        );
        
        game.moves = [];
        if (moveResults.length > 0) {
          const moveColumns = moveResults[0].columns;
          const moveValues = moveResults[0].values;
          
          for (const moveRow of moveValues) {
            const move: any = {};
            moveColumns.forEach((col: string, idx: number) => {
              move[col] = moveRow[idx];
            });
            game.moves.push({
              position: { x: move.position_x, y: move.position_y },
              color: move.color,
              timestamp: move.timestamp,
              moveNumber: move.move_number,
            });
          }
        }
        
        games.push({
          id: game.id,
          title: game.title,
          blackPlayer: game.black_player,
          whitePlayer: game.white_player,
          date: game.date,
          result: game.result,
          moves: game.moves,
          createdAt: game.created_at,
        });
      }
    }
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    
    const gameResults = db.exec(`SELECT * FROM games WHERE id = '${id}'`);
    
    if (gameResults.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const gameColumns = gameResults[0].columns;
    const gameRow = gameResults[0].values[0];
    const game: any = {};
    gameColumns.forEach((col: string, idx: number) => {
      game[col] = gameRow[idx];
    });
    
    const moveResults = db.exec(
      `SELECT * FROM moves WHERE game_id = '${id}' ORDER BY move_number`
    );
    
    const moves: any[] = [];
    if (moveResults.length > 0) {
      const moveColumns = moveResults[0].columns;
      const moveValues = moveResults[0].values;
      
      for (const moveRow of moveValues) {
        const move: any = {};
        moveColumns.forEach((col: string, idx: number) => {
          move[col] = moveRow[idx];
        });
        moves.push({
          position: { x: move.position_x, y: move.position_y },
          color: move.color,
          timestamp: move.timestamp,
          moveNumber: move.move_number,
        });
      }
    }
    
    res.json({
      id: game.id,
      title: game.title,
      blackPlayer: game.black_player,
      whitePlayer: game.white_player,
      date: game.date,
      result: game.result,
      moves,
      createdAt: game.created_at,
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const game = req.body;
    
    db.run(`
      INSERT OR REPLACE INTO games (id, title, black_player, white_player, date, result, created_at)
      VALUES ('${game.id}', '${game.title || ''}', '${game.blackPlayer || ''}', '${game.whitePlayer || ''}', '${game.date || ''}', '${game.result || ''}', ${game.createdAt || Date.now()})
    `);
    
    db.run(`DELETE FROM moves WHERE game_id = '${game.id}'`);
    
    if (game.moves && game.moves.length > 0) {
      const stmt = db.prepare(
        'INSERT INTO moves (game_id, move_number, position_x, position_y, color, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
      );
      
      game.moves.forEach((move: any) => {
        stmt.run([
          game.id,
          move.moveNumber,
          move.position.x,
          move.position.y,
          move.color,
          move.timestamp,
        ]);
      });
    }
    
    saveDatabase(db);
    
    res.json({ success: true, game });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    
    db.run(`DELETE FROM moves WHERE game_id = '${id}'`);
    db.run(`DELETE FROM games WHERE id = '${id}'`);
    
    saveDatabase(db);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

router.get('/:id/sgf', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    
    const gameResults = db.exec(`SELECT * FROM games WHERE id = '${id}'`);
    
    if (gameResults.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const gameColumns = gameResults[0].columns;
    const gameRow = gameResults[0].values[0];
    const game: any = {};
    gameColumns.forEach((col: string, idx: number) => {
      game[col] = gameRow[idx];
    });
    
    const moveResults = db.exec(
      `SELECT * FROM moves WHERE game_id = '${id}' ORDER BY move_number`
    );
    
    let sgf = '(;';
    sgf += 'GM[1]';
    sgf += 'SZ[17]';
    sgf += `PB[${game.black_player || '黑方'}]`;
    sgf += `PW[${game.white_player || '白方'}]`;
    sgf += `DT[${game.date || ''}]`;
    sgf += `RE[${game.result || ''}]`;
    sgf += `GN[${game.title || '藏棋对局'}]`;
    
    if (moveResults.length > 0) {
      const moveColumns = moveResults[0].columns;
      const moveValues = moveResults[0].values;
      
      for (const moveRow of moveValues) {
        const move: any = {};
        moveColumns.forEach((col: string, idx: number) => {
          move[col] = moveRow[idx];
        });
        const color = move.color === 'black' ? 'B' : 'W';
        const x = String.fromCharCode(97 + move.position_x);
        const y = String.fromCharCode(97 + move.position_y);
        sgf += `;${color}[${x}${y}]`;
      }
    }
    
    sgf += ')';
    
    res.setHeader('Content-Type', 'application/x-go-sgf');
    res.setHeader('Content-Disposition', `attachment; filename="${game.title || 'game'}.sgf"`);
    res.send(sgf);
  } catch (error) {
    console.error('Error exporting SGF:', error);
    res.status(500).json({ error: 'Failed to export SGF' });
  }
});

export default router;
