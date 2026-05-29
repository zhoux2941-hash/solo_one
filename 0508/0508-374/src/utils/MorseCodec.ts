const DEFAULT_MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
  'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
  'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....',
  '7': '--...', '8': '---..', '9': '----.', '.': '.-.-.-',
  ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
  '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
  '@': '.--.-.', ' ': '/'
};

function generateChineseMorseCode(): Record<string, string> {
  const chineseCodes: Record<string, string> = {};
  const firstLevelChars = generateGB2312FirstLevel();
  
  for (let i = 0; i < firstLevelChars.length; i++) {
    const char = firstLevelChars[i];
    const code = numberToMorse(i + 1);
    chineseCodes[char] = code;
  }
  
  return chineseCodes;
}

function generateGB2312FirstLevel(): string[] {
  const chars: string[] = [];
  const ranges = [
    [0xB0A1, 0xB0F9],
    [0xB1A1, 0xB1F9],
    [0xB2A1, 0xB2F9],
    [0xB3A1, 0xB3F9],
    [0xB4A1, 0xB4F9],
    [0xB5A1, 0xB5F9],
    [0xB6A1, 0xB6F9],
    [0xB7A1, 0xB7F9],
    [0xB8A1, 0xB8F9],
    [0xB9A1, 0xB9F9],
    [0xBAA1, 0xBAF9],
    [0xBBA1, 0xBBF9],
    [0xBCA1, 0xBCF9],
    [0xBDA1, 0xBDF9],
    [0xBEA1, 0xBEF9],
    [0xBFA1, 0xBFF9],
    [0xC0A1, 0xC0F9],
    [0xC1A1, 0xC1F9],
    [0xC2A1, 0xC2F9],
    [0xC3A1, 0xC3F9],
    [0xC4A1, 0xC4F9],
    [0xC5A1, 0xC5F9],
    [0xC6A1, 0xC6F9],
    [0xC7A1, 0xC7F9],
    [0xC8A1, 0xC8F9],
    [0xC9A1, 0xC9F9],
    [0xCAA1, 0xCAF9],
    [0xCBA1, 0xCBF9],
    [0xCCA1, 0xCCF9],
    [0xCDA1, 0xCDF9],
    [0xCEA1, 0xCEF9],
    [0xCFA1, 0xCFF9],
    [0xD0A1, 0xD0F9],
    [0xD1A1, 0xD1F9],
    [0xD2A1, 0xD2F9],
    [0xD3A1, 0xD3F9],
    [0xD4A1, 0xD4F9],
    [0xD5A1, 0xD5F9],
    [0xD6A1, 0xD6F9],
    [0xD7A1, 0xD7F9],
  ];
  
  for (const [start, end] of ranges) {
    for (let code = start; code <= end; code++) {
      try {
        const char = String.fromCharCode(code);
        chars.push(char);
      } catch {
        continue;
      }
    }
  }
  
  return chars;
}

function numberToMorse(num: number): string {
  const encoded = num.toString(3);
  const result: string[] = [];
  
  for (const digit of encoded) {
    switch (digit) {
      case '0':
        result.push('.');
        break;
      case '1':
        result.push('-');
        break;
      case '2':
        result.push('..');
        break;
      default:
        result.push('.');
    }
  }
  
  return result.join('·');
}

const CHINESE_MORSE_CODE = generateChineseMorseCode();

export class MorseCodec {
  private customMappings: Record<string, string> = {};

  getDefaultMappings(): Record<string, string> {
    return { ...DEFAULT_MORSE_CODE, ...CHINESE_MORSE_CODE };
  }

  getCustomMappings(): Record<string, string> {
    return { ...this.customMappings };
  }

  setCustomMappings(mappings: Record<string, string>): void {
    this.customMappings = { ...mappings };
  }

  addCustomMapping(char: string, code: string): void {
    const normalizedChar = char.length === 1 ? char.toUpperCase() : char;
    if (this.isValidMorseCode(code)) {
      this.customMappings[normalizedChar] = code;
    }
  }

  removeCustomMapping(char: string): void {
    const normalizedChar = char.length === 1 ? char.toUpperCase() : char;
    delete this.customMappings[normalizedChar];
  }

  clearCustomMappings(): void {
    this.customMappings = {};
  }

  private isValidMorseCode(code: string): boolean {
    return /^[.\-·—]+$/.test(code);
  }

  private getFullMappings(): Record<string, string> {
    return { ...DEFAULT_MORSE_CODE, ...CHINESE_MORSE_CODE, ...this.customMappings };
  }

  private getReverseMappings(): Record<string, string> {
    const fullMappings = this.getFullMappings();
    const reverse: Record<string, string> = {};
    
    Object.entries(fullMappings).forEach(([char, code]) => {
      if (!reverse[code]) {
        reverse[code] = char;
      }
    });
    
    return reverse;
  }

  encode(text: string): string {
    const mappings = this.getFullMappings();
    const result: string[] = [];
    
    for (const char of text) {
      const normalizedChar = char.length === 1 ? char.toUpperCase() : char;
      if (mappings[normalizedChar]) {
        result.push(mappings[normalizedChar]);
      } else if (char === ' ') {
        result.push('/');
      }
    }
    
    return result.join(' ');
  }

  decode(morse: string): string {
    const reverseMappings = this.getReverseMappings();
    const result: string[] = [];
    const words = morse.split(' / ');
    
    for (const word of words) {
      const codes = word.split(' ');
      for (const code of codes) {
        const trimmedCode = code.trim();
        if (reverseMappings[trimmedCode]) {
          result.push(reverseMappings[trimmedCode]);
        } else if (trimmedCode) {
          result.push('?');
        }
      }
      result.push(' ');
    }
    
    return result.join('').trim();
  }

  getRandomChar(): { char: string; code: string } {
    const mappings = this.getFullMappings();
    const chars = Object.keys(mappings).filter(c => {
      if (c.length === 1) {
        return /^[A-Z0-9]$/.test(c);
      }
      return false;
    });
    
    if (chars.length === 0) {
      return { char: 'A', code: '.-' };
    }
    
    const char = chars[Math.floor(Math.random() * chars.length)];
    return { char, code: mappings[char] };
  }

  getSupportedChars(): string[] {
    return Object.keys(this.getFullMappings());
  }

  hasMapping(char: string): boolean {
    const normalizedChar = char.length === 1 ? char.toUpperCase() : char;
    return !!this.getFullMappings()[normalizedChar];
  }

  getMapping(char: string): string | undefined {
    const normalizedChar = char.length === 1 ? char.toUpperCase() : char;
    return this.getFullMappings()[normalizedChar];
  }
}

export const defaultCodec = new MorseCodec();
