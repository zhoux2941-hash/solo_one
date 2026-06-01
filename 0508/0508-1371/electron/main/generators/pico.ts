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

export class PicoGenerator extends BaseGenerator {
  protected targetDevice: DeviceType = 'pico';
  protected fileExtension: string = 'c';
  protected fileName: string = 'payload';

  protected generateCode(ast: ASTNode[]): string {
    const bodyCode = this.generateNodes(ast, 2);

    let code = '';
    code += '#include <stdio.h>\n';
    code += '#include <stdlib.h>\n';
    code += '#include <string.h>\n';
    code += '#include "pico/stdlib.h"\n';
    code += '#include "pico/multicore.h"\n';
    code += '#include "hardware/gpio.h"\n';
    code += '#include "tusb.h"\n';
    code += '#include "class/hid/hid_device.h"\n';
    code += '\n';
    code += '#define USBD_VID     0x2E8A\n';
    code += '#define USBD_PID     0x000A\n';
    code += '#define USBD_MANUFACTURER "Raspberry Pi"\n';
    code += '#define USBD_PRODUCT "Pico HID"\n';
    code += '\n';
    code += 'uint8_t const tud_desc_configuration[] = {\n';
    code += '  TUD_CONFIG_DESCRIPTOR(1, 1, 0, TUD_CONFIG_DESC_LEN + (TUD_HID_DESC_LEN * 2), TUSB_DESC_CONFIG_ATT_REMOTE_WAKEUP, 100),\n';
    code += '  TUD_HID_DESCRIPTOR(0, 0, false, HID_ITF_PROTOCOL_KEYBOARD, 8, HID_KEYBOARD_DESC_LEN, TUD_HID_REPORT_DESC_KEYBOARD()),\n';
    code += '  TUD_HID_DESCRIPTOR(1, 0, false, HID_ITF_PROTOCOL_MOUSE, 16, HID_MOUSE_DESC_LEN, TUD_HID_REPORT_DESC_MOUSE()),\n';
    code += '};\n';
    code += '\n';
    code += 'char const *string_desc_arr[] = {\n';
    code += '  (const char[]) { 0x09, 0x04 },\n';
    code += '  USBD_MANUFACTURER,\n';
    code += '  USBD_PRODUCT,\n';
    code += '  "1234567890",\n';
    code += '};\n';
    code += '\n';
    code += 'void type_string(const char *text) {\n';
    code += '  for (uint i = 0; i < strlen(text); i++) {\n';
    code += '    uint8_t keycode = 0;\n';
    code += '    char c = text[i];\n';
    code += '    if (c >= \'a\' && c <= \'z\') keycode = HID_KEY_A + (c - \'a\');\n';
    code += '    else if (c >= \'A\' && c <= \'Z\') keycode = HID_KEY_A + (c - \'A\');\n';
    code += '    else if (c >= \'0\' && c <= \'9\') keycode = HID_KEY_0 + (c - \'0\');\n';
    code += '    else if (c == \' \') keycode = HID_KEY_SPACE;\n';
    code += '    else if (c == \'!\') keycode = HID_KEY_1;\n';
    code += '    else if (c == \'@\') keycode = HID_KEY_2;\n';
    code += '    else if (c == \'#\') keycode = HID_KEY_3;\n';
    code += '    else if (c == \'$\') keycode = HID_KEY_4;\n';
    code += '    else if (c == \'%\') keycode = HID_KEY_5;\n';
    code += '    else if (c == \'^\') keycode = HID_KEY_6;\n';
    code += '    else if (c == \'&\') keycode = HID_KEY_7;\n';
    code += '    else if (c == \'*\') keycode = HID_KEY_8;\n';
    code += '    else if (c == \'(\') keycode = HID_KEY_9;\n';
    code += '    else if (c == \')\') keycode = HID_KEY_0;\n';
    code += '    else if (c == \'-\') keycode = HID_KEY_MINUS;\n';
    code += '    else if (c == \'_\') keycode = HID_KEY_MINUS;\n';
    code += '    else if (c == \'=\') keycode = HID_KEY_EQUAL;\n';
    code += '    else if (c == \'+\') keycode = HID_KEY_EQUAL;\n';
    code += '    else if (c == \'[\') keycode = HID_KEY_BRACKET_LEFT;\n';
    code += '    else if (c == \'{\') keycode = HID_KEY_BRACKET_LEFT;\n';
    code += '    else if (c == \']\') keycode = HID_KEY_BRACKET_RIGHT;\n';
    code += '    else if (c == \'}\') keycode = HID_KEY_BRACKET_RIGHT;\n';
    code += '    else if (c == \'\\\\\') keycode = HID_KEY_BACKSLASH;\n';
    code += '    else if (c == \'|\') keycode = HID_KEY_BACKSLASH;\n';
    code += '    else if (c == \';\') keycode = HID_KEY_SEMICOLON;\n';
    code += '    else if (c == \':\') keycode = HID_KEY_SEMICOLON;\n';
    code += '    else if (c == 39) keycode = HID_KEY_APOSTROPHE;\n';
    code += '    else if (c == \'"\') keycode = HID_KEY_APOSTROPHE;\n';
    code += '    else if (c == \',\') keycode = HID_KEY_COMMA;\n';
    code += '    else if (c == \'<\') keycode = HID_KEY_COMMA;\n';
    code += '    else if (c == \'.\') keycode = HID_KEY_PERIOD;\n';
    code += '    else if (c == \'>\') keycode = HID_KEY_PERIOD;\n';
    code += '    else if (c == \'/\') keycode = HID_KEY_SLASH;\n';
    code += '    else if (c == \'?\') keycode = HID_KEY_SLASH;\n';
    code += '    else if (c == \'~\') keycode = HID_KEY_GRAVE;\n';
    code += '    else if (c == \'`\') keycode = HID_KEY_GRAVE;\n';
    code += '    else if (c == \'\\n\') keycode = HID_KEY_ENTER;\n';
    code += '    else if (c == \'\\t\') keycode = HID_KEY_TAB;\n';
    code += '    else if (c == \'\\b\') keycode = HID_KEY_BACKSPACE;\n';
    code += '\n';
    code += '    uint8_t modifier = 0;\n';
    code += '    if ((c >= \'A\' && c <= \'Z\') || c == \'!\' || c == \'@\' || c == \'#\' || c == \'$\' ||\n';
    code += '        c == \'%\' || c == \'^\' || c == \'&\' || c == \'*\' || c == \'(\' || c == \')\' ||\n';
    code += '        c == \'_\' || c == \'+\' || c == \'{\' || c == \'}\' || c == \'|\' || c == \':\' ||\n';
    code += '        c == \'"\' || c == \'<\' || c == \'>\' || c == \'?\' || c == \'~\') {\n';
    code += '      modifier = KEYBOARD_MODIFIER_LEFTSHIFT;\n';
    code += '    }\n';
    code += '\n';
    code += '    tud_hid_keyboard_report(0, modifier, &keycode);\n';
    code += '    sleep_ms(50);\n';
    code += '    tud_hid_keyboard_report(0, 0, NULL);\n';
    code += '    sleep_ms(5);\n';
    code += '  }\n';
    code += '}\n';
    code += '\n';
    code += 'void press_key(uint8_t keycode, uint8_t modifiers, int repeat) {\n';
    code += '  for (int i = 0; i < repeat; i++) {\n';
    code += '    tud_hid_keyboard_report(0, modifiers, &keycode);\n';
    code += '    sleep_ms(50);\n';
    code += '    tud_hid_keyboard_report(0, 0, NULL);\n';
    code += '    sleep_ms(50);\n';
    code += '  }\n';
    code += '}\n';
    code += '\n';
    code += 'void mouse_move(int8_t x, int8_t y) {\n';
    code += '  tud_hid_mouse_report(1, 0, x, y, 0, 0);\n';
    code += '  sleep_ms(10);\n';
    code += '}\n';
    code += '\n';
    code += 'void mouse_click(uint8_t button) {\n';
    code += '  tud_hid_mouse_report(1, button, 0, 0, 0, 0);\n';
    code += '  sleep_ms(50);\n';
    code += '  tud_hid_mouse_report(1, 0, 0, 0, 0, 0);\n';
    code += '  sleep_ms(50);\n';
    code += '}\n';
    code += '\n';
    code += 'void payload() {\n';
    code += '  sleep_ms(1000);\n';
    code += '\n';
    code += bodyCode + '\n';
    code += '}\n';
    code += '\n';
    code += 'int main(void) {\n';
    code += '  stdio_init_all();\n';
    code += '  tusb_init();\n';
    code += '\n';
    code += '  while (!tud_mounted()) {\n';
    code += '    tud_task();\n';
    code += '    sleep_ms(10);\n';
    code += '  }\n';
    code += '\n';
    code += '  sleep_ms(500);\n';
    code += '  payload();\n';
    code += '\n';
    code += '  while (1) {\n';
    code += '    tud_task();\n';
    code += '    sleep_ms(10);\n';
    code += '  }\n';
    code += '\n';
    code += '  return 0;\n';
    code += '}\n';
    code += '\n';
    code += 'uint16_t tud_hid_get_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t *buffer, uint16_t reqlen) {\n';
    code += '  return 0;\n';
    code += '}\n';
    code += '\n';
    code += 'void tud_hid_set_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t const *buffer, uint16_t bufsize) {\n';
    code += '}\n';
    code += '\n';
    code += 'uint8_t const *tud_descriptor_device_cb(void) {\n';
    code += '  static tusb_desc_device_t const desc_device = {\n';
    code += '    .bLength            = sizeof(tusb_desc_device_t),\n';
    code += '    .bDescriptorType    = TUSB_DESC_DEVICE,\n';
    code += '    .bcdUSB             = 0x0200,\n';
    code += '    .bDeviceClass       = 0x00,\n';
    code += '    .bDeviceSubClass    = 0x00,\n';
    code += '    .bDeviceProtocol    = 0x00,\n';
    code += '    .bMaxPacketSize0    = CFG_TUD_ENDPOINT0_SIZE,\n';
    code += '    .idVendor           = USBD_VID,\n';
    code += '    .idProduct          = USBD_PID,\n';
    code += '    .bcdDevice          = 0x0100,\n';
    code += '    .iManufacturer      = 0x01,\n';
    code += '    .iProduct           = 0x02,\n';
    code += '    .iSerialNumber      = 0x03,\n';
    code += '    .bNumConfigurations = 0x01\n';
    code += '  };\n';
    code += '  return (uint8_t const *)&desc_device;\n';
    code += '}\n';
    code += '\n';
    code += 'uint8_t const *tud_descriptor_configuration_cb(uint8_t index) {\n';
    code += '  return tud_desc_configuration;\n';
    code += '}\n';
    code += '\n';
    code += 'uint16_t const *tud_descriptor_string_cb(uint8_t index, uint16_t langid) {\n';
    code += '  static uint16_t _desc_str[32];\n';
    code += '  uint8_t chr_count;\n';
    code += '\n';
    code += '  if (index == 0) {\n';
    code += '    memcpy(&_desc_str[1], string_desc_arr[0], 2);\n';
    code += '    chr_count = 1;\n';
    code += '  } else {\n';
    code += '    if (!(index < sizeof(string_desc_arr) / sizeof(string_desc_arr[0]))) return NULL;\n';
    code += '    const char *str = string_desc_arr[index];\n';
    code += '    chr_count = strlen(str);\n';
    code += '    if (chr_count > 31) chr_count = 31;\n';
    code += '    for (uint8_t i = 0; i < chr_count; i++) {\n';
    code += '      _desc_str[1 + i] = str[i];\n';
    code += '    }\n';
    code += '  }\n';
    code += '\n';
    code += '  _desc_str[0] = (TUSB_DESC_STRING << 8) | (2 * chr_count + 2);\n';
    code += '  return _desc_str;\n';
    code += '}\n';

    return code;
  }

  protected generateDelay(node: DelayNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    return `${indentStr}sleep_ms(${node.milliseconds});`;
  }

  protected generateString(node: StringNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const value = this.resolveVariables(node.value);
    const escaped = this.escapeString(value);
    return `${indentStr}type_string("${escaped}");`;
  }

  protected generateKey(node: KeyNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const key = this.mapKeyName(node.key);
    const modifiers = this.getModifiersMask(node.modifiers);
    const keyCode = this.getKeyCode(key);
    const repeat = node.repeat || 1;

    return `${indentStr}press_key(${keyCode}, ${modifiers}, ${repeat});`;
  }

  protected generateMouseMove(node: MouseMoveNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    return `${indentStr}mouse_move(${node.x}, ${node.y});`;
  }

  protected generateMouseClick(node: MouseClickNode, indent: number): string {
    const indentStr = this.getIndent(indent);
    const button = this.getMouseButton(node.button);
    return `${indentStr}mouse_click(${button});`;
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
      'CTRL': 'KEYBOARD_MODIFIER_LEFTCTRL',
      'CONTROL': 'KEYBOARD_MODIFIER_LEFTCTRL',
      'SHIFT': 'KEYBOARD_MODIFIER_LEFTSHIFT',
      'ALT': 'KEYBOARD_MODIFIER_LEFTALT',
      'GUI': 'KEYBOARD_MODIFIER_LEFTGUI',
      'WINDOWS': 'KEYBOARD_MODIFIER_LEFTGUI',
      'CMD': 'KEYBOARD_MODIFIER_LEFTGUI',
      'COMMAND': 'KEYBOARD_MODIFIER_LEFTGUI',
    };

    const mapped = modifiers.map((m) => modifierMap[m.toUpperCase()] || '0');
    if (mapped.length === 0) return '0';
    return mapped.join(' | ');
  }

  private getKeyCode(key: string): string {
    const keyMap: Record<string, string> = {
      'ENTER': 'HID_KEY_ENTER',
      'ESC': 'HID_KEY_ESCAPE',
      'BACKSPACE': 'HID_KEY_BACKSPACE',
      'TAB': 'HID_KEY_TAB',
      'SPACE': 'HID_KEY_SPACE',
      'CAPSLOCK': 'HID_KEY_CAPS_LOCK',
      'DELETE': 'HID_KEY_DELETE',
      'INSERT': 'HID_KEY_INSERT',
      'HOME': 'HID_KEY_HOME',
      'END': 'HID_KEY_END',
      'PAGEUP': 'HID_KEY_PAGE_UP',
      'PAGEDOWN': 'HID_KEY_PAGE_DOWN',
      'UP': 'HID_KEY_ARROW_UP',
      'DOWN': 'HID_KEY_ARROW_DOWN',
      'LEFT': 'HID_KEY_ARROW_LEFT',
      'RIGHT': 'HID_KEY_ARROW_RIGHT',
      'F1': 'HID_KEY_F1',
      'F2': 'HID_KEY_F2',
      'F3': 'HID_KEY_F3',
      'F4': 'HID_KEY_F4',
      'F5': 'HID_KEY_F5',
      'F6': 'HID_KEY_F6',
      'F7': 'HID_KEY_F7',
      'F8': 'HID_KEY_F8',
      'F9': 'HID_KEY_F9',
      'F10': 'HID_KEY_F10',
      'F11': 'HID_KEY_F11',
      'F12': 'HID_KEY_F12',
      'PRINTSCREEN': 'HID_KEY_PRINT_SCREEN',
      'SCROLLLOCK': 'HID_KEY_SCROLL_LOCK',
      'PAUSE': 'HID_KEY_PAUSE',
      'MENU': 'HID_KEY_APPLICATION',
    };

    return keyMap[key] || `HID_KEY_${key.toUpperCase()}`;
  }

  private getMouseButton(button: string): string {
    const buttonMap: Record<string, string> = {
      'left': 'MOUSE_BUTTON_LEFT',
      'right': 'MOUSE_BUTTON_RIGHT',
      'middle': 'MOUSE_BUTTON_MIDDLE',
    };
    return buttonMap[button] || 'MOUSE_BUTTON_LEFT';
  }
}
