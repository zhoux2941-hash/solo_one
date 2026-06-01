import type {
  ASTNode,
  DelayNode,
  StringNode,
  KeyNode,
  MouseMoveNode,
  MouseClickNode,
  RepeatNode,
  IfOSNode,
  VarNode,
  IncludeNode,
  DeviceType,
} from '@shared/types';

export interface GeneratorResult {
  code: string;
  fileName: string;
  fileExtension: string;
  targetDevice: DeviceType;
}

export interface CodeGenerator {
  generate(ast: ASTNode[]): GeneratorResult;
}

export abstract class BaseGenerator implements CodeGenerator {
  protected abstract targetDevice: DeviceType;
  protected abstract fileExtension: string;
  protected abstract fileName: string;
  protected variables: Map<string, string> = new Map();

  generate(ast: ASTNode[]): GeneratorResult {
    this.variables.clear();
    const code = this.generateCode(ast);
    return {
      code,
      fileName: this.fileName,
      fileExtension: this.fileExtension,
      targetDevice: this.targetDevice,
    };
  }

  protected abstract generateCode(ast: ASTNode[]): string;

  protected generateNode(node: ASTNode, indent: number = 0): string {
    switch (node.type) {
      case 'delay':
        return this.generateDelay(node as DelayNode, indent);
      case 'string':
        return this.generateString(node as StringNode, indent);
      case 'key':
        return this.generateKey(node as KeyNode, indent);
      case 'mouse_move':
        return this.generateMouseMove(node as MouseMoveNode, indent);
      case 'mouse_click':
        return this.generateMouseClick(node as MouseClickNode, indent);
      case 'repeat':
        return this.generateRepeat(node as RepeatNode, indent);
      case 'if_os':
        return this.generateIfOS(node as IfOSNode, indent);
      case 'var':
        return this.generateVar(node as VarNode, indent);
      case 'include':
        return this.generateInclude(node as IncludeNode, indent);
      default:
        return this.handleUnknownNode(node, indent);
    }
  }

  protected abstract generateDelay(node: DelayNode, indent: number): string;
  protected abstract generateString(node: StringNode, indent: number): string;
  protected abstract generateKey(node: KeyNode, indent: number): string;
  protected abstract generateMouseMove(node: MouseMoveNode, indent: number): string;
  protected abstract generateMouseClick(node: MouseClickNode, indent: number): string;
  protected abstract generateRepeat(node: RepeatNode, indent: number): string;
  protected abstract generateIfOS(node: IfOSNode, indent: number): string;
  protected abstract generateVar(node: VarNode, indent: number): string;
  protected abstract generateInclude(node: IncludeNode, indent: number): string;

  protected handleUnknownNode(node: ASTNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    return `${indentStr}// Unknown node type: ${node.type}`;
  }

  protected getIndent(level: number): string {
    return '  '.repeat(level);
  }

  protected escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  protected resolveVariables(value: string): string {
    let result = value;
    for (const [name, val] of this.variables) {
      result = result.replace(new RegExp(`\\$\\{${name}\\}`, 'g'), val);
    }
    return result;
  }

  protected generateNodes(nodes: ASTNode[], indent: number = 0): string {
    return nodes
      .map((node) => this.generateNode(node, indent))
      .filter((line) => line.trim().length > 0)
      .join('\n');
  }

  protected mapKeyName(key: string): string {
    const keyMap: Record<string, string> = {
      'CTRL': 'CTRL',
      'CONTROL': 'CTRL',
      'SHIFT': 'SHIFT',
      'ALT': 'ALT',
      'GUI': 'GUI',
      'WINDOWS': 'GUI',
      'CMD': 'GUI',
      'COMMAND': 'GUI',
      'ENTER': 'ENTER',
      'RETURN': 'ENTER',
      'ESC': 'ESC',
      'ESCAPE': 'ESC',
      'BACKSPACE': 'BACKSPACE',
      'BS': 'BACKSPACE',
      'TAB': 'TAB',
      'SPACE': 'SPACE',
      'CAPSLOCK': 'CAPSLOCK',
      'DELETE': 'DELETE',
      'DEL': 'DELETE',
      'INSERT': 'INSERT',
      'INS': 'INSERT',
      'HOME': 'HOME',
      'END': 'END',
      'PAGEUP': 'PAGEUP',
      'PGUP': 'PAGEUP',
      'PAGEDOWN': 'PAGEDOWN',
      'PGDN': 'PAGEDOWN',
      'UP': 'UP',
      'UPARROW': 'UP',
      'DOWN': 'DOWN',
      'DOWNARROW': 'DOWN',
      'LEFT': 'LEFT',
      'LEFTARROW': 'LEFT',
      'RIGHT': 'RIGHT',
      'RIGHTARROW': 'RIGHT',
      'F1': 'F1',
      'F2': 'F2',
      'F3': 'F3',
      'F4': 'F4',
      'F5': 'F5',
      'F6': 'F6',
      'F7': 'F7',
      'F8': 'F8',
      'F9': 'F9',
      'F10': 'F10',
      'F11': 'F11',
      'F12': 'F12',
      'PRINTSCREEN': 'PRINTSCREEN',
      'SCROLLLOCK': 'SCROLLLOCK',
      'PAUSE': 'PAUSE',
      'BREAK': 'PAUSE',
      'MENU': 'MENU',
      'APP': 'MENU',
    };
    return keyMap[key.toUpperCase()] || key.toUpperCase();
  }
}
