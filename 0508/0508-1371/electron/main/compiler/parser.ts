import { Lexer, Token, TokenType, LexerError } from './lexer';
import {
  ASTNode,
  ProgramNode,
  DelayNode,
  StringNode,
  KeyNode,
  MouseMoveNode,
  MouseClickNode,
  RepeatNode,
  IfOSNode,
  VarNode,
  IncludeNode,
  AssignmentNode,
  ModifierKey,
  OSType,
  DSLAnalysisResult,
  DSLWarning,
  DSLError,
} from './ast';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;
  private errors: DSLError[] = [];
  private warnings: DSLWarning[] = [];
  private variables: Map<string, string | number> = new Map();
  private includes: string[] = [];

  public parseScript(source: string): DSLAnalysisResult {
    this.reset();

    const lexer = new Lexer(source);
    const { tokens, errors: lexerErrors } = lexer.tokenize();
    this.tokens = tokens;

    for (const err of lexerErrors) {
      this.errors.push({
        line: err.line,
        column: err.column,
        message: err.message,
      });
    }

    let ast: ProgramNode | null = null;

    try {
      ast = this.parseProgram();
    } catch (e) {
      const err = e as Error;
      this.errors.push({
        line: 1,
        column: 1,
        message: `Parse error: ${err.message}`,
      });
    }

    return {
      ast,
      errors: [...this.errors],
      warnings: [...this.warnings],
      variables: new Map(this.variables),
      includes: [...this.includes],
    };
  }

  private reset(): void {
    this.tokens = [];
    this.pos = 0;
    this.errors = [];
    this.warnings = [];
    this.variables = new Map();
    this.includes = [];
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private peek(offset: number = 1): Token {
    return this.tokens[this.pos + offset] ?? this.tokens[this.tokens.length - 1];
  }

  private consume(type: TokenType, expected?: string): Token {
    const token = this.current();
    if (token.type !== type) {
      const msg = expected
        ? `Expected ${expected}, got '${token.value}'`
        : `Expected token type ${type}, got ${token.type} ('${token.value}')`;
      this.errors.push({
        line: token.line,
        column: token.column,
        message: msg,
      });
    }
    this.pos++;
    return token;
  }

  private match(type: TokenType, value?: string): boolean {
    const token = this.current();
    if (token.type !== type) return false;
    if (value !== undefined && token.value.toLowerCase() !== value.toLowerCase()) return false;
    return true;
  }

  private matchKeyword(keyword: string): boolean {
    return this.match('Keyword', keyword);
  }

  private consumeKeyword(keyword: string): Token {
    const token = this.current();
    if (!this.matchKeyword(keyword)) {
      this.errors.push({
        line: token.line,
        column: token.column,
        message: `Expected keyword '${keyword}', got '${token.value}'`,
      });
    }
    this.pos++;
    return token;
  }

  private parseProgram(): ProgramNode {
    const startToken = this.current();
    const body: ASTNode[] = [];

    while (!this.match('EOF')) {
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }

    return {
      type: 'Program',
      body,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseStatement(): ASTNode | null {
    const token = this.current();

    if (this.match('Semicolon') || this.match('EOF')) {
      this.pos++;
      return null;
    }

    if (this.match('At')) {
      return this.parseInclude();
    }

    if (this.matchKeyword('var') || this.matchKeyword('let') || this.matchKeyword('set')) {
      return this.parseAssignment();
    }

    if (this.match('Dollar')) {
      return this.parseVarOrAssignment();
    }

    if (this.matchKeyword('delay') || this.matchKeyword('sleep') || this.matchKeyword('wait')) {
      return this.parseDelay();
    }

    if (
      this.matchKeyword('type') ||
      this.matchKeyword('string') ||
      this.matchKeyword('text')
    ) {
      return this.parseString();
    }

    if (this.matchKeyword('key') || this.matchKeyword('press')) {
      return this.parseKey();
    }

    if (this.matchKeyword('move') || this.matchKeyword('mouse')) {
      return this.parseMouseMove();
    }

    if (
      this.matchKeyword('click') ||
      this.matchKeyword('leftclick') ||
      this.matchKeyword('rightclick') ||
      this.matchKeyword('middleclick') ||
      this.matchKeyword('doubleclick')
    ) {
      return this.parseMouseClick();
    }

    if (this.matchKeyword('repeat') || this.matchKeyword('loop')) {
      return this.parseRepeat();
    }

    if (this.matchKeyword('ifos') || this.matchKeyword('if')) {
      return this.parseIfOS();
    }

    if (this.matchKeyword('end') || this.matchKeyword('endif') || this.matchKeyword('else') || this.matchKeyword('elif')) {
      this.warnings.push({
        line: token.line,
        column: token.column,
        message: `Unexpected '${token.value}' outside of block`,
      });
      this.pos++;
      return null;
    }

    if (this.match('String')) {
      return this.parseStringLiteral();
    }

    this.errors.push({
      line: token.line,
      column: token.column,
      message: `Unexpected token '${token.value}'`,
    });
    this.pos++;
    return null;
  }

  private parseInclude(): IncludeNode {
    const atToken = this.current();
    this.consume('At');

    const token = this.current();
    let path: string;

    if (this.match('String')) {
      path = this.consume('String').value;
    } else {
      path = this.consume('Identifier', 'include path').value;
    }

    this.includes.push(path);

    return {
      type: 'IncludeNode',
      path,
      line: atToken.line,
      column: atToken.column,
    };
  }

  private parseAssignment(): AssignmentNode {
    const startToken = this.current();
    this.pos++;

    let name: string;
    if (this.match('Dollar')) {
      name = this.consume('Dollar').value;
    } else {
      name = this.consume('Identifier', 'variable name').value;
    }

    if (this.match('Equals')) {
      this.consume('Equals');
    } else if (this.match('Colon')) {
      this.consume('Colon');
    }

    let value: string | number;
    if (this.match('Number')) {
      value = parseFloat(this.consume('Number').value);
    } else if (this.match('String')) {
      value = this.consume('String').value;
    } else if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      value = this.variables.get(varToken.value) ?? `\${${varToken.value}}`;
    } else {
      value = this.consume('Identifier', 'value').value;
    }

    this.variables.set(name, value);

    return {
      type: 'AssignmentNode',
      name,
      value,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseVarOrAssignment(): ASTNode {
    const startToken = this.current();
    const varName = this.consume('Dollar').value;

    if (this.match('Equals') || this.match('Colon')) {
      this.pos++;

      let value: string | number;
      if (this.match('Number')) {
        value = parseFloat(this.consume('Number').value);
      } else if (this.match('String')) {
        value = this.consume('String').value;
      } else if (this.match('Dollar')) {
        const refToken = this.consume('Dollar');
        value = this.variables.get(refToken.value) ?? `\${${refToken.value}}`;
      } else {
        value = this.consume('Identifier', 'value').value;
      }

      this.variables.set(varName, value);

      return {
        type: 'AssignmentNode',
        name: varName,
        value,
        line: startToken.line,
        column: startToken.column,
      };
    }

    return {
      type: 'VarNode',
      name: varName,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseDelay(): DelayNode {
    const startToken = this.current();
    this.pos++;

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    let value: number;
    if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      const varValue = this.variables.get(varToken.value);
      if (varValue !== undefined && typeof varValue === 'number') {
        value = varValue;
      } else if (varValue !== undefined && typeof varValue === 'string') {
        value = parseFloat(varValue);
      } else {
        value = 0;
        this.warnings.push({
          line: varToken.line,
          column: varToken.column,
          message: `Variable '${varToken.value}' not found, using default 0`,
        });
      }
    } else {
      value = parseFloat(this.consume('Number', 'delay value').value);
    }

    let unit: 'ms' | 's' = 'ms';
    if (this.match('Unit')) {
      const unitToken = this.consume('Unit');
      const unitValue = unitToken.value.toLowerCase();
      if (unitValue === 's' || unitValue === 'sec') {
        unit = 's';
      } else if (unitValue === 'min') {
        unit = 's';
        value *= 60;
      } else if (unitValue === 'h') {
        unit = 's';
        value *= 3600;
      }
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    return {
      type: 'DelayNode',
      value,
      unit,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseString(): StringNode {
    const startToken = this.current();
    this.pos++;

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    let value: string;
    if (this.match('String')) {
      value = this.consume('String').value;
    } else if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      const varValue = this.variables.get(varToken.value);
      value = varValue !== undefined ? String(varValue) : `\${${varToken.value}}`;
    } else {
      value = this.consume('Identifier', 'string value').value;
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    return {
      type: 'StringNode',
      value,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseStringLiteral(): StringNode {
    const token = this.consume('String');
    return {
      type: 'StringNode',
      value: token.value,
      line: token.line,
      column: token.column,
    };
  }

  private parseKey(): KeyNode {
    const startToken = this.current();
    this.pos++;

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    const modifiers: ModifierKey[] = [];

    while (this.match('Modifier')) {
      const modToken = this.consume('Modifier');
      const mod = this.normalizeModifier(modToken.value.toLowerCase());
      if (!modifiers.includes(mod)) {
        modifiers.push(mod);
      }

      if (this.match('Plus')) {
        this.consume('Plus');
      } else if (this.match('Comma')) {
        this.consume('Comma');
      } else if (this.match('Minus')) {
        this.consume('Minus');
      }
    }

    let key: string;
    if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      const varValue = this.variables.get(varToken.value);
      key = varValue !== undefined ? String(varValue) : `\${${varToken.value}}`;
    } else if (this.match('String')) {
      key = this.consume('String').value;
    } else {
      key = this.consume('Identifier', 'key name').value;
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    return {
      type: 'KeyNode',
      key,
      modifiers,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private normalizeModifier(mod: string): ModifierKey {
    switch (mod) {
      case 'control':
        return 'ctrl';
      case 'option':
        return 'alt';
      case 'command':
      case 'win':
      case 'windows':
      case 'super':
        return 'cmd';
      case 'meta':
        return 'meta';
      default:
        return mod as ModifierKey;
    }
  }

  private parseMouseMove(): MouseMoveNode {
    const startToken = this.current();
    this.pos++;

    if (this.matchKeyword('move') && this.peek().type === 'Keyword' && this.peek().value.toLowerCase() === 'mouse') {
      this.pos++;
    }

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    let x: number | 'current' = 'current';
    let y: number | 'current' = 'current';
    let relative = false;

    if (this.matchKeyword('relative')) {
      relative = true;
      this.pos++;
    } else if (this.matchKeyword('absolute')) {
      relative = false;
      this.pos++;
    }

    if (this.match('Number')) {
      x = parseFloat(this.consume('Number').value);
    } else if (this.matchKeyword('current')) {
      this.pos++;
    } else if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      const varValue = this.variables.get(varToken.value);
      x = varValue !== undefined ? Number(varValue) : 0;
    }

    if (this.match('Comma')) {
      this.consume('Comma');
    }

    if (this.match('Number')) {
      y = parseFloat(this.consume('Number').value);
    } else if (this.matchKeyword('current')) {
      this.pos++;
    } else if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      const varValue = this.variables.get(varToken.value);
      y = varValue !== undefined ? Number(varValue) : 0;
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    return {
      type: 'MouseMoveNode',
      x,
      y,
      relative,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseMouseClick(): MouseClickNode {
    const startToken = this.current();
    const keyword = this.current().value.toLowerCase();
    this.pos++;

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    let button: 'left' | 'right' | 'middle' = 'left';
    let double = false;

    if (keyword === 'rightclick') {
      button = 'right';
    } else if (keyword === 'middleclick') {
      button = 'middle';
    } else if (keyword === 'doubleclick') {
      double = true;
    }

    if (this.matchKeyword('left')) {
      button = 'left';
      this.pos++;
    } else if (this.matchKeyword('right')) {
      button = 'right';
      this.pos++;
    } else if (this.matchKeyword('middle')) {
      button = 'middle';
      this.pos++;
    }

    if (this.matchKeyword('double')) {
      double = true;
      this.pos++;
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    return {
      type: 'MouseClickNode',
      button,
      double,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseRepeat(): RepeatNode {
    const startToken = this.current();
    this.pos++;

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    let count: number | 'infinite' = 'infinite';

    if (this.matchKeyword('infinite')) {
      this.pos++;
    } else if (this.match('Number')) {
      count = parseInt(this.consume('Number').value, 10);
    } else if (this.match('Dollar')) {
      const varToken = this.consume('Dollar');
      const varValue = this.variables.get(varToken.value);
      if (varValue !== undefined) {
        count = Number(varValue);
      }
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    const body: ASTNode[] = this.parseBlock('repeat', 'end');

    return {
      type: 'RepeatNode',
      count,
      body,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private parseIfOS(): IfOSNode {
    const startToken = this.current();
    this.pos++;

    if (this.match('LParen')) {
      this.consume('LParen');
    }

    if (this.matchKeyword('os')) {
      this.pos++;
    }

    const osList: OSType[] = [];

    do {
      if (this.match('OS') || this.match('Identifier')) {
        const osToken = this.current();
        const os = this.normalizeOS(osToken.value.toLowerCase());
        if (os && !osList.includes(os)) {
          osList.push(os);
        }
        this.pos++;
      } else if (this.match('String')) {
        const osToken = this.consume('String');
        const os = this.normalizeOS(osToken.value.toLowerCase());
        if (os && !osList.includes(os)) {
          osList.push(os);
        }
      }
    } while (this.match('Comma') || this.match('Or') || this.match('Plus') && (this.pos++, true));

    if (this.match('Comma')) {
      this.consume('Comma');
    }

    if (this.match('RParen')) {
      this.consume('RParen');
    }

    const consequent: ASTNode[] = [];
    let alternate: ASTNode[] | null = null;

    while (!this.match('EOF')) {
      if (this.matchKeyword('else')) {
        this.pos++;
        alternate = this.parseBlock('else', 'end');
        break;
      }

      if (this.matchKeyword('elif')) {
        this.pos++;
        const elifNode = this.parseIfOS();
        alternate = [elifNode];
        break;
      }

      if (this.matchKeyword('endif') || this.matchKeyword('end')) {
        this.pos++;
        break;
      }

      const stmt = this.parseStatement();
      if (stmt) {
        consequent.push(stmt);
      }
    }

    return {
      type: 'IfOSNode',
      os: osList,
      consequent,
      alternate,
      line: startToken.line,
      column: startToken.column,
    };
  }

  private normalizeOS(os: string): OSType | null {
    switch (os) {
      case 'windows':
      case 'win':
        return 'windows';
      case 'mac':
      case 'macos':
      case 'darwin':
        return 'mac';
      case 'linux':
      case 'unix':
        return 'linux';
      default:
        return null;
    }
  }

  private parseBlock(openKeyword: string, closeKeyword: string): ASTNode[] {
    const body: ASTNode[] = [];
    let depth = 1;

    if (this.match('LBrace')) {
      this.consume('LBrace');

      while (!this.match('EOF') && depth > 0) {
        if (this.match('LBrace')) {
          this.consume('LBrace');
          depth++;
        }

        if (this.match('RBrace')) {
          this.consume('RBrace');
          depth--;
          if (depth === 0) break;
        }

        if (depth > 0) {
          const stmt = this.parseStatement();
          if (stmt) {
            body.push(stmt);
          }
        }
      }
    } else {
      while (!this.match('EOF')) {
        if (this.matchKeyword(closeKeyword)) {
          this.pos++;
          break;
        }

        if (this.matchKeyword(openKeyword)) {
          depth++;
        }

        if (depth === 1 && (this.matchKeyword('else') || this.matchKeyword('elif'))) {
          break;
        }

        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
      }
    }

    return body;
  }
}

export function parseScript(source: string): DSLAnalysisResult {
  const parser = new Parser();
  return parser.parseScript(source);
}
