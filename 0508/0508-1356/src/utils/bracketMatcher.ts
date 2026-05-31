export interface BracketResult {
  valid: boolean;
  maxDepth: number;
  error?: string;
}

const PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const OPEN_BRACKETS = new Set(Object.keys(PAIRS));
const CLOSE_TO_OPEN = Object.fromEntries(
  Object.entries(PAIRS).map(([open, close]) => [close, open])
);

interface StackFrame {
  bracket: string;
  originalPos: number;
}

export function matchBrackets(input: string): BracketResult {
  const filtered = filterBrackets(input);

  if (filtered.length === 0) {
    return { valid: true, maxDepth: 0 };
  }

  const stack: StackFrame[] = [];
  let maxDepth = 0;

  for (const { char, pos } of filtered) {
    if (OPEN_BRACKETS.has(char)) {
      stack.push({ bracket: char, originalPos: pos });
      maxDepth = Math.max(maxDepth, stack.length);
    } else {
      const frame = stack.pop();

      if (!frame) {
        return {
          valid: false,
          maxDepth: 0,
          error: `位置 ${pos}：多余的右括号 "${char}"，无对应左括号`,
        };
      }

      if (frame.bracket !== CLOSE_TO_OPEN[char]) {
        return {
          valid: false,
          maxDepth: 0,
          error: `位置 ${pos}：括号顺序错误，"${frame.bracket}" 需要 "${PAIRS[frame.bracket]}" 闭合，却遇到 "${char}"`,
        };
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack
      .map((f) => `"${f.bracket}"(位置${f.originalPos})`)
      .join('、');
    return {
      valid: false,
      maxDepth: 0,
      error: `未闭合的左括号：${unclosed}`,
    };
  }

  return { valid: true, maxDepth };
}

function filterBrackets(input: string): Array<{ char: string; pos: number }> {
  const result: Array<{ char: string; pos: number }> = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (/\s/.test(ch)) continue;
    if (!OPEN_BRACKETS.has(ch) && !(ch in CLOSE_TO_OPEN)) {
      continue;
    }
    result.push({ char: ch, pos: i + 1 });
  }
  return result;
}
