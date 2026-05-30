import { Move, Position, Game, BOARD_SIZE } from '../../shared/types';

export function movesToSGF(game: Game): string {
  let sgf = '(;';
  
  sgf += `GM[1]`;
  sgf += `SZ[${BOARD_SIZE}]`;
  sgf += `PB[${game.blackPlayer || '黑方'}]`;
  sgf += `PW[${game.whitePlayer || '白方'}]`;
  sgf += `DT[${game.date || new Date().toISOString().split('T')[0]}]`;
  sgf += `RE[${game.result || ''}]`;
  sgf += `GN[${game.title || '藏棋对局'}]`;
  
  game.moves.forEach((move) => {
    const color = move.color === 'black' ? 'B' : 'W';
    const x = String.fromCharCode(97 + move.position.x);
    const y = String.fromCharCode(97 + move.position.y);
    sgf += `;${color}[${x}${y}]`;
  });
  
  sgf += ')';
  return sgf;
}

export function sgfToMoves(sgf: string): { moves: Move[]; gameInfo: Partial<Game> } {
  const moves: Move[] = [];
  const gameInfo: Partial<Game> = {};
  
  const gameInfoMatch = sgf.match(/GN\[([^\]]+)\]/);
  if (gameInfoMatch) gameInfo.title = gameInfoMatch[1];
  
  const pbMatch = sgf.match(/PB\[([^\]]+)\]/);
  if (pbMatch) gameInfo.blackPlayer = pbMatch[1];
  
  const pwMatch = sgf.match(/PW\[([^\]]+)\]/);
  if (pwMatch) gameInfo.whitePlayer = pwMatch[1];
  
  const dtMatch = sgf.match(/DT\[([^\]]+)\]/);
  if (dtMatch) gameInfo.date = dtMatch[1];
  
  const reMatch = sgf.match(/RE\[([^\]]+)\]/);
  if (reMatch) gameInfo.result = reMatch[1];
  
  const movePattern = /;(B|W)\[([a-z]{2})\]/g;
  let match;
  let moveNumber = 1;
  
  while ((match = movePattern.exec(sgf)) !== null) {
    const color = match[1] === 'B' ? 'black' : 'white';
    const x = match[2].charCodeAt(0) - 97;
    const y = match[2].charCodeAt(1) - 97;
    
    moves.push({
      position: { x, y },
      color,
      timestamp: Date.now(),
      moveNumber,
    });
    moveNumber++;
  }
  
  return { moves, gameInfo };
}

export function downloadSGF(game: Game): void {
  const sgf = movesToSGF(game);
  const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${game.title || 'game'}.sgf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
