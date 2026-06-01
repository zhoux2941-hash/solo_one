import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  detection: {
    enabled: true,
    minTypingSpeedThreshold: 400,
    shortcutDensityThreshold: 5,
    shortcutTimeWindowMs: 3000,
    minInputIntervalVariance: 0.1,
    mouseEdgeDetection: true,
    alertCooldownMs: 5000,
  },
  virustotal: {
    apiKey: '',
    autoScan: false,
  },
  signatures: {
    autoUpdate: true,
    updateUrl: '',
    checkIntervalHours: 24,
  },
  service: {
    logLevel: 'info',
    logPath: '',
  },
};

export const KEYBOARD_KEYS: Record<string, number> = {
  'a': 0x04, 'b': 0x05, 'c': 0x06, 'd': 0x07, 'e': 0x08,
  'f': 0x09, 'g': 0x0a, 'h': 0x0b, 'i': 0x0c, 'j': 0x0d,
  'k': 0x0e, 'l': 0x0f, 'm': 0x10, 'n': 0x11, 'o': 0x12,
  'p': 0x13, 'q': 0x14, 'r': 0x15, 's': 0x16, 't': 0x17,
  'u': 0x18, 'v': 0x19, 'w': 0x1a, 'x': 0x1b, 'y': 0x1c,
  'z': 0x1d, '1': 0x1e, '2': 0x1f, '3': 0x20, '4': 0x21,
  '5': 0x22, '6': 0x23, '7': 0x24, '8': 0x25, '9': 0x26,
  '0': 0x27,
  'enter': 0x28,
  'escape': 0x29,
  'esc': 0x29,
  'backspace': 0x2a,
  'tab': 0x2b,
  'space': 0x2c,
  '-': 0x2d, '=': 0x2e, '[': 0x2f, ']': 0x30, '\\': 0x31,
  ';': 0x33, "'": 0x34, '`': 0x35, ',': 0x36, '.': 0x37, '/': 0x38,
  'capslock': 0x39,
  'f1': 0x3a, 'f2': 0x3b, 'f3': 0x3c, 'f4': 0x3d, 'f5': 0x3e,
  'f6': 0x3f, 'f7': 0x40, 'f8': 0x41, 'f9': 0x42, 'f10': 0x43,
  'f11': 0x44, 'f12': 0x45,
  'printscreen': 0x46,
  'scrollock': 0x47,
  'pause': 0x48,
  'insert': 0x49,
  'home': 0x4a,
  'pageup': 0x4b,
  'delete': 0x4c,
  'end': 0x4d,
  'pagedown': 0x4e,
  'right': 0x4f,
  'left': 0x50,
  'down': 0x51,
  'up': 0x52,
  'numlock': 0x53,
  'gui': 0x53,
  'windows': 0x53,
  'command': 0x53,
  'ctrl': 0xe0,
  'control': 0xe0,
  'shift': 0xe1,
  'alt': 0xe2,
};

export const MODIFIER_KEYS: Record<string, number> = {
  'ctrl': 0x01,
  'control': 0x01,
  'shift': 0x02,
  'alt': 0x04,
  'gui': 0x08,
  'windows': 0x08,
  'command': 0x08,
};

export const SUSPICIOUS_SHORTCUTS = [
  ['gui', 'r'],
  ['ctrl', 'shift', 'esc'],
  ['alt', 'f4'],
  ['ctrl', 'alt', 'del'],
  ['gui', 'x'],
  ['gui', 'x', 'a'],
  ['gui', 'x', 'i'],
  ['gui', 'x', 'u', 'u'],
  ['gui', 'x', 'u', 'r'],
  ['gui', 'i'],
  ['gui', 'e'],
  ['ctrl', 'shift', 'enter'],
  ['shift', 'f10'],
  ['gui', 'l'],
  ['alt', 'tab'],
  ['ctrl', 'shift', 'esc'],
  ['gui', 'd'],
];

export const SUSPICIOUS_STRINGS = [
  'powershell',
  'cmd.exe',
  'reg add',
  'reg delete',
  'net user',
  'net localgroup',
  'sc config',
  'sc create',
  'bitsadmin',
  'certutil',
  'mshta',
  'rundll32',
  'regsvr32',
  'wmic',
  'cscript',
  'wscript',
  'powershell -nop',
  'powershell -enc',
  'System.Net.Sockets.TCPClient',
  'System.Net.WebClient',
  'Invoke-Expression',
  'iex ',
  'DownloadString',
  'DownloadFile',
];

export const DEVICE_INFO = {
  arduino: {
    name: 'Arduino Leonardo',
    description: 'ATmega32U4 based board with native USB support',
    outputType: 'ino' as const,
    flashMethod: 'Arduino IDE / CLI',
  },
  pico: {
    name: 'Raspberry Pi Pico',
    description: 'RP2040 microcontroller with USB HID support',
    outputType: 'uf2' as const,
    flashMethod: 'Drag and drop to USB mass storage',
  },
  badusb: {
    name: 'BadUSB / Rubber Ducky',
    description: 'Standard USB Rubber Ducky / Flipper Zero BadUSB format',
    outputType: 'txt' as const,
    flashMethod: 'Copy to SD card / Flipper Zero',
  },
  flipper: {
    name: 'Flipper Zero',
    description: 'Flipper Zero BadUSB payload format',
    outputType: 'txt' as const,
    flashMethod: 'Copy to Flipper Zero SD card',
  },
};

export const IPC_CHANNELS = {
  DSL_PARSE: 'dsl:parse',
  DSL_COMPILE: 'dsl:compile',
  DSL_TEMPLATES: 'dsl:templates',
  DSL_TEMPLATE_APPLY: 'dsl:template:apply',
  
  DETECTION_START: 'detection:start',
  DETECTION_STOP: 'detection:stop',
  DETECTION_STATUS: 'detection:status',
  DETECTION_DEVICES: 'detection:devices',
  DETECTION_EVENTS: 'detection:events',
  DETECTION_ALERT: 'detection:alert',
  
  EVENTS_QUERY: 'events:query',
  EVENTS_GET: 'events:get',
  EVENTS_DELETE: 'events:delete',
  EVENTS_EXPORT: 'events:export',
  
  SERVICE_INSTALL: 'service:install',
  SERVICE_UNINSTALL: 'service:uninstall',
  SERVICE_START: 'service:start',
  SERVICE_STOP: 'service:stop',
  SERVICE_STATUS: 'service:status',
  SERVICE_CONFIG_SET: 'service:config:set',
  
  PLAYBACK_START: 'playback:start',
  PLAYBACK_STOP: 'playback:stop',
  PLAYBACK_STATUS: 'playback:status',
  
  VIRUSTOTAL_SCAN: 'virustotal:scan',
  VIRUSTOTAL_SCAN_GET: 'virustotal:scan:get',
  
  SIGNATURES_LIST: 'signatures:list',
  SIGNATURES_UPDATE: 'signatures:update',
  SIGNATURES_ADD: 'signatures:add',
  SIGNATURES_DELETE: 'signatures:delete',
  
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
} as const;

export const DATABASE_PATH = 'hid-attack-framework.db';

export const SIGNATURES_FILENAME = 'default-signatures.yaml';
