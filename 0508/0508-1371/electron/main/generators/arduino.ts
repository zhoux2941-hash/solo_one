import { BaseGenerator } from './base';
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

export class ArduinoGenerator extends BaseGenerator {
  protected targetDevice: DeviceType = 'arduino';
  protected fileExtension: string = 'ino';
  protected fileName: string = 'payload';

  protected generateCode(ast: ASTNode[]): string {
    const bodyCode = this.generateNodes(ast, 1);

    return `#include <Keyboard.h>
#include <Mouse.h>

void setup() {
  Keyboard.begin();
  Mouse.begin();
  delay(1000);

${bodyCode}

  Keyboard.end();
  Mouse.end();
}

void loop() {
  // Empty loop
}

void typeString(String text) {
  for (unsigned int i = 0; i < text.length(); i++) {
    Keyboard.write(text.charAt(i));
    delay(5);
  }
}

void pressKey(uint8_t key, uint8_t modifiers) {
  if (modifiers > 0) {
    Keyboard.press(modifiers);
  }
  Keyboard.press(key);
  delay(50);
  Keyboard.release(key);
  if (modifiers > 0) {
    Keyboard.release(modifiers);
  }
  delay(50);
}
`;
  }

  protected generateDelay(node: DelayNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    return `${indentStr}delay(${node.milliseconds});`;
  }

  protected generateString(node: StringNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const value = this.resolveVariables(node.value);
    const escaped = this.escapeString(value);
    return `${indentStr}typeString("${escaped}");`;
  }

  protected generateKey(node: KeyNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const key = this.mapKeyName(node.key);
    const modifiers = this.getModifiersMask(node.modifiers);
    const keyCode = this.getKeyCode(key);
    const repeat = node.repeat || 1;

    if (repeat > 1) {
      const lines: string[] = [];
      lines.push(`${indentStr}for (int i = 0; i < ${repeat}; i++) {`);
      lines.push(`${indentStr}  pressKey(${keyCode}, ${modifiers});`);
      lines.push(`${indentStr}}`);
      return lines.join('\n');
    }

    return `${indentStr}pressKey(${keyCode}, ${modifiers});`;
  }

  protected generateMouseMove(node: MouseMoveNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    return `${indentStr}Mouse.move(${node.x}, ${node.y}, 0);`;
  }

  protected generateMouseClick(node: MouseClickNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const button = this.getMouseButton(node.button);
    return `${indentStr}Mouse.click(${button});`;
  }

  protected generateRepeat(node: RepeatNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const bodyCode = this.generateNodes(node.body, indent + 1);
    const lines: string[] = [];
    lines.push(`${indentStr}for (int i = 0; i < ${node.count}; i++) {`);
    lines.push(bodyCode);
    lines.push(`${indentStr}}`);
    return lines.join('\n');
  }

  protected generateIfOS(node: IfOSNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const bodyCode = this.generateNodes(node.body, indent + 1);
    const lines: string[] = [];
    lines.push(`${indentStr}// Target OS: ${node.os}`);
    lines.push(bodyCode);
    return lines.join('\n');
  }

  protected generateVar(node: VarNode, indent: number): string {
    this.variables.set(node.name, node.value);
    return '';
  }

  protected generateInclude(node: IncludeNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    return `${indentStr}// Include template: ${node.template}`;
  }

  private getModifiersMask(modifiers: string[]): string {
    const modifierMap: Record<string, string> = {
      'CTRL': 'KEY_LEFT_CTRL',
      'CONTROL': 'KEY_LEFT_CTRL',
      'SHIFT': 'KEY_LEFT_SHIFT',
      'ALT': 'KEY_LEFT_ALT',
      'GUI': 'KEY_LEFT_GUI',
      'WINDOWS': 'KEY_LEFT_GUI',
      'CMD': 'KEY_LEFT_GUI',
      'COMMAND': 'KEY_LEFT_GUI',
    };

    const mapped = modifiers.map((m) => modifierMap[m.toUpperCase()] || '0');
    if (mapped.length === 0) return '0';
    return mapped.join(' | ');
  }

  private getKeyCode(key: string): string {
    const keyMap: Record<string, string> = {
      'ENTER': 'KEY_RETURN',
      'ESC': 'KEY_ESC',
      'BACKSPACE': 'KEY_BACKSPACE',
      'TAB': 'KEY_TAB',
      'SPACE': '\' \'',
      'CAPSLOCK': 'KEY_CAPS_LOCK',
      'DELETE': 'KEY_DELETE',
      'INSERT': 'KEY_INSERT',
      'HOME': 'KEY_HOME',
      'END': 'KEY_END',
      'PAGEUP': 'KEY_PAGE_UP',
      'PAGEDOWN': 'KEY_PAGE_DOWN',
      'UP': 'KEY_UP_ARROW',
      'DOWN': 'KEY_DOWN_ARROW',
      'LEFT': 'KEY_LEFT_ARROW',
      'RIGHT': 'KEY_RIGHT_ARROW',
      'F1': 'KEY_F1',
      'F2': 'KEY_F2',
      'F3': 'KEY_F3',
      'F4': 'KEY_F4',
      'F5': 'KEY_F5',
      'F6': 'KEY_F6',
      'F7': 'KEY_F7',
      'F8': 'KEY_F8',
      'F9': 'KEY_F9',
      'F10': 'KEY_F10',
      'F11': 'KEY_F11',
      'F12': 'KEY_F12',
      'PRINTSCREEN': 'KEY_PRINT_SCREEN',
      'SCROLLLOCK': 'KEY_SCROLL_LOCK',
      'PAUSE': 'KEY_PAUSE',
      'MENU': 'KEY_MENU',
    };

    return keyMap[key] || `'${key.toLowerCase()}'`;
  }

  private getMouseButton(button: string): string {
    const buttonMap: Record<string, string> = {
      'left': 'MOUSE_LEFT',
      'right': 'MOUSE_RIGHT',
      'middle': 'MOUSE_MIDDLE',
    };
    return buttonMap[button] || 'MOUSE_LEFT';
  }
}
