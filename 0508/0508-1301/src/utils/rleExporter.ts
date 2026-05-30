import type { Grid } from "./gameEngine";

export function exportToRLE(grid: Grid, rows: number, cols: number): string {
  const header = `x = ${cols}, y = ${rows}, rule = B3/S23`;

  const rowParts: string[] = [];

  for (let r = 0; r < rows; r++) {
    const runs: string[] = [];
    let runChar = "";
    let runCount = 0;

    for (let c = 0; c < cols; c++) {
      const ch = grid[r * cols + c] ? "o" : "b";
      if (ch === runChar) {
        runCount++;
      } else {
        if (runCount > 0) {
          runs.push(runCount > 1 ? `${runCount}${runChar}` : runChar);
        }
        runChar = ch;
        runCount = 1;
      }
    }

    if (runCount > 0 && runChar === "o") {
      runs.push(runCount > 1 ? `${runCount}${runChar}` : runChar);
    }

    rowParts.push(runs.length > 0 ? runs.join("") : "");
  }

  let lastAliveRow = rows - 1;
  while (lastAliveRow >= 0 && rowParts[lastAliveRow] === "") {
    lastAliveRow--;
  }

  let body = "";
  for (let r = 0; r <= lastAliveRow; r++) {
    body += rowParts[r];
    if (r < lastAliveRow) {
      body += "$";
    }
  }
  body += "!";

  const MAX_LINE = 70;
  const bodyLines: string[] = [];
  for (let i = 0; i < body.length; i += MAX_LINE) {
    bodyLines.push(body.slice(i, i + MAX_LINE));
  }

  return [header, ...bodyLines].join("\n");
}
