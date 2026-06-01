export type TokenType =
  | 'Keyword'
  | 'Identifier'
  | 'String'
  | 'Number'
  | 'Modifier'
  | 'OS'
  | 'Unit'
  | 'LParen'
  | 'RParen'
  | 'LBrace'
  | 'RBrace'
  | 'LBracket'
  | 'RBracket'
  | 'Comma'
  | 'Colon'
  | 'Semicolon'
  | 'Plus'
  | 'Minus'
  | 'Star'
  | 'Slash'
  | 'Equals'
  | 'Arrow'
  | 'Dollar'
  | 'At'
  | 'Hash'
  | 'Or'
  | 'EOF'
  | 'Unknown';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
  line: number;
  column: number;
}

export interface LexerError {
  line: number;
  column: number;
  message: string;
}

const KEYWORDS = new Set([
  'delay',
  'sleep',
  'wait',
  'key',
  'press',
  'type',
  'string',
  'text',
  'mouse',
  'move',
  'click',
  'leftclick',
  'rightclick',
  'middleclick',
  'doubleclick',
  'repeat',
  'loop',
  'if',
  'elif',
  'else',
  'endif',
  'ifos',
  'os',
  'var',
  'let',
  'set',
  'include',
  'import',
  'require',
  'end',
  'true',
  'false',
  'infinite',
  'current',
  'relative',
  'absolute',
]);

const MODIFIERS = new Set([
  'ctrl',
  'control',
  'alt',
  'option',
  'shift',
  'cmd',
  'command',
  'win',
  'windows',
  'meta',
  'super',
]);

const OS_TYPES = new Set(['windows', 'win', 'mac', 'macos', 'darwin', 'linux', 'unix']);

const UNITS = new Set(['ms', 's', 'sec', 'min', 'h']);

export class Lexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): { tokens: Token[]; errors: LexerError[] } {
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const startPos = this.pos;
      const startLine = this.line;
      const startCol = this.column;

      const char = this.input[this.pos];

      if (char === '"' || char === "'") {
        this.readString(char);
        continue;
      }

      if (char === '#') {
        this.readComment();
        continue;
      }

      if (char === '/' && this.input[this.pos + 1] === '/') {
        this.readComment();
        continue;
      }

      if (this.isDigit(char)) {
        this.readNumber();
        continue;
      }

      if (this.isLetter(char) || char === '_') {
        this.readIdentifier();
        continue;
      }

      if (char === '$') {
        this.readVariable();
        continue;
      }

      if (char === '@') {
        this.tokens.push(this.createToken('At', '@', startLine, startCol));
        this.advance();
        continue;
      }

      const token = this.readSymbol(char, startLine, startCol);
      if (token) {
        this.tokens.push(token);
        this.advance();
        continue;
      }

      this.errors.push({
        line: startLine,
        column: startCol,
        message: `Unexpected character '${char}'`,
      });
      this.advance();
    }

    this.tokens.push(this.createToken('EOF', '', this.line, this.column));
    return { tokens: this.tokens, errors: this.errors };
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.line++;
        this.column = 1;
        this.pos++;
      } else {
        break;
      }
    }
  }

  private readComment(): void {
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      this.advance();
    }
  }

  private readString(quote: string): void {
    const startLine = this.line;
    const startCol = this.column;
    this.advance();

    let value = '';
    const startPos = this.pos;

    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      if (char === '\\' && this.pos + 1 < this.input.length) {
        const next = this.input[this.pos + 1];
        switch (next) {
          case 'n':
            value += '\n';
            break;
          case 't':
            value += '\t';
            break;
          case 'r':
            value += '\r';
            break;
          case '\\':
            value += '\\';
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += next;
        }
        this.advance();
        this.advance();
        continue;
      }

      if (char === quote) {
        break;
      }

      if (char === '\n') {
        this.errors.push({
          line: startLine,
          column: startCol,
          message: 'Unterminated string literal',
        });
        return;
      }

      value += char;
      this.advance();
    }

    if (this.pos >= this.input.length) {
      this.errors.push({
        line: startLine,
        column: startCol,
        message: 'Unterminated string literal',
      });
      return;
    }

    const raw = this.input.substring(startPos - 1, this.pos + 1);
    this.tokens.push(this.createToken('String', value, startLine, startCol, raw));
    this.advance();
  }

  private readNumber(): void {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;

    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      this.advance();
    }

    if (this.pos < this.input.length && this.input[this.pos] === '.') {
      this.advance();
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        this.advance();
      }
    }

    const value = this.input.substring(startPos, this.pos);
    this.tokens.push(this.createToken('Number', value, startLine, startCol));
  }

  private readIdentifier(): void {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;

    while (
      this.pos < this.input.length &&
      (this.isLetterOrDigit(this.input[this.pos]) || this.input[this.pos] === '_')
    ) {
      this.advance();
    }

    const value = this.input.substring(startPos, this.pos);
    const lowerValue = value.toLowerCase();

    let type: TokenType = 'Identifier';

    if (KEYWORDS.has(lowerValue)) {
      type = 'Keyword';
    } else if (MODIFIERS.has(lowerValue)) {
      type = 'Modifier';
    } else if (OS_TYPES.has(lowerValue)) {
      type = 'OS';
    } else if (UNITS.has(lowerValue)) {
      type = 'Unit';
    } else if (lowerValue === 'or') {
      type = 'Or';
    }

    this.tokens.push(this.createToken(type, value, startLine, startCol));
  }

  private readVariable(): void {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;
    this.advance();

    if (this.pos < this.input.length && this.input[this.pos] === '{') {
      this.advance();
      const nameStart = this.pos;
      while (
        this.pos < this.input.length &&
        this.input[this.pos] !== '}' &&
        this.input[this.pos] !== '\n'
      ) {
        this.advance();
      }
      if (this.pos >= this.input.length || this.input[this.pos] !== '}') {
        this.errors.push({
          line: startLine,
          column: startCol,
          message: 'Unterminated variable reference',
        });
        return;
      }
      const value = this.input.substring(nameStart, this.pos);
      const raw = this.input.substring(startPos, this.pos + 1);
      this.tokens.push(this.createToken('Dollar', value, startLine, startCol, raw));
      this.advance();
    } else {
      const nameStart = this.pos;
      while (
        this.pos < this.input.length &&
        (this.isLetterOrDigit(this.input[this.pos]) || this.input[this.pos] === '_')
      ) {
        this.advance();
      }
      const value = this.input.substring(nameStart, this.pos);
      const raw = this.input.substring(startPos, this.pos);
      this.tokens.push(this.createToken('Dollar', value, startLine, startCol, raw));
    }
  }

  private readSymbol(char: string, line: number, column: number): Token | null {
    switch (char) {
      case '(':
        return this.createToken('LParen', '(', line, column);
      case ')':
        return this.createToken('RParen', ')', line, column);
      case '{':
        return this.createToken('LBrace', '{', line, column);
      case '}':
        return this.createToken('RBrace', '}', line, column);
      case '[':
        return this.createToken('LBracket', '[', line, column);
      case ']':
        return this.createToken('RBracket', ']', line, column);
      case ',':
        return this.createToken('Comma', ',', line, column);
      case ':':
        return this.createToken('Colon', ':', line, column);
      case ';':
        return this.createToken('Semicolon', ';', line, column);
      case '+':
        return this.createToken('Plus', '+', line, column);
      case '-':
        return this.createToken('Minus', '-', line, column);
      case '*':
        return this.createToken('Star', '*', line, column);
      case '/':
        return this.createToken('Slash', '/', line, column);
      case '=':
        return this.createToken('Equals', '=', line, column);
      case '#':
        return this.createToken('Hash', '#', line, column);
      default:
        return null;
    }
  }

  private advance(): void {
    this.pos++;
    this.column++;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isLetter(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isLetterOrDigit(char: string): boolean {
    return this.isLetter(char) || this.isDigit(char);
  }

  private createToken(
    type: TokenType,
    value: string,
    line: number,
    column: number,
    raw?: string,
  ): Token {
    return {
      type,
      value,
      raw: raw ?? value,
      line,
      column,
    };
  }
}
