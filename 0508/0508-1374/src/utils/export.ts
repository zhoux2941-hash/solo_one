import { QueenPositions } from '@/types';

export function exportBoardToText(
  board: QueenPositions,
  n: number,
  solutionNumber?: number
): string {
  const lines: string[] = [];

  if (solutionNumber !== undefined) {
    lines.push(`=== N皇后问题 - 第 ${solutionNumber} 个解 (N=${n}) ===`);
  } else {
    lines.push(`=== N皇后问题棋盘状态 (N=${n}) ===`);
  }
  lines.push('');

  const header = '  ' + Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i)).join(' ');
  lines.push(header);

  for (let row = 0; row < n; row++) {
    let line = String(row + 1).padStart(2, ' ') + ' ';
    for (let col = 0; col < n; col++) {
      if (board[row] === col) {
        line += 'Q ';
      } else {
        line += '. ';
      }
    }
    lines.push(line);
  }

  lines.push('');
  lines.push('皇后位置（行: 列）:');
  const positions = board
    .map((col, row) => (col !== -1 ? `${row + 1}: ${String.fromCharCode(65 + col)}` : null))
    .filter(Boolean)
    .join(', ');
  lines.push(positions);

  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export function downloadTextFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
