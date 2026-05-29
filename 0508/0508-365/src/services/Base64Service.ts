export interface Base64EncodeOptions {
  urlSafe?: boolean;
  padding?: boolean;
}

export interface Base64DecodeOptions {
  urlSafe?: boolean;
}

export class Base64Service {
  private static textEncoder = new TextEncoder();
  private static textDecoder = new TextDecoder('utf-8');

  private static stringToBytes(str: string): Uint8Array {
    return this.textEncoder.encode(str);
  }

  private static bytesToString(bytes: Uint8Array): string {
    return this.textDecoder.decode(bytes);
  }

  private static bytesToBinaryString(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  }

  private static binaryStringToBytes(binary: string): Uint8Array {
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private static toUrlSafe(base64: string): string {
    return base64.replace(/\+/g, '-').replace(/\//g, '_');
  }

  private static fromUrlSafe(base64: string): string {
    return base64.replace(/-/g, '+').replace(/_/g, '/');
  }

  private static addPadding(base64: string): string {
    const pad = base64.length % 4;
    if (pad) {
      return base64 + '='.repeat(4 - pad);
    }
    return base64;
  }

  private static removePadding(base64: string): string {
    return base64.replace(/=+$/, '');
  }

  public static encode(text: string, options: Base64EncodeOptions = {}): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let base64 = btoa(binary);

    if (options.urlSafe) {
      base64 = this.toUrlSafe(base64);
    }

    if (options.padding === false) {
      base64 = this.removePadding(base64);
    }

    return base64;
  }

  public static decode(base64: string, options: Base64DecodeOptions = {}): string {
    let cleanBase64 = base64.trim().replace(/\s/g, '');

    if (options.urlSafe) {
      cleanBase64 = this.fromUrlSafe(cleanBase64);
    }

    cleanBase64 = this.addPadding(cleanBase64);

    try {
      const binary = atob(cleanBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    } catch (e) {
      throw new Error('无效的Base64字符串');
    }
  }

  public static encodeUrlSafe(text: string): string {
    return this.encode(text, { urlSafe: true, padding: false });
  }

  public static decodeUrlSafe(base64: string): string {
    return this.decode(base64, { urlSafe: true });
  }

  public static toHex(base64: string): string {
    let cleanBase64 = base64.trim().replace(/\s/g, '');
    cleanBase64 = this.addPadding(cleanBase64);
    const binary = atob(cleanBase64);
    const bytes = this.binaryStringToBytes(binary);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
  }

  public static fromHex(hex: string): string {
    const cleanHex = hex.replace(/\s+/g, '').replace(/0x/gi, '');
    if (cleanHex.length % 2 !== 0) {
      throw new Error('无效的Hex字符串：长度必须为偶数');
    }
    if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
      throw new Error('无效的Hex字符串：只允许0-9和A-F');
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    const binary = this.bytesToBinaryString(bytes);
    return btoa(binary);
  }

  public static isValidBase64(str: string): boolean {
    try {
      const cleanStr = str.trim().replace(/\s/g, '');
      if (!cleanStr) return false;
      const padded = this.addPadding(cleanStr);
      atob(padded);
      return true;
    } catch {
      return false;
    }
  }

  public static isValidHex(str: string): boolean {
    const cleanHex = str.trim().replace(/\s+/g, '').replace(/0x/gi, '');
    return /^[0-9A-Fa-f]*$/.test(cleanHex) && cleanHex.length % 2 === 0;
  }

  public static isImageBase64(str: string): boolean {
    const cleanStr = str.trim();
    if (cleanStr.startsWith('data:image/')) {
      return true;
    }
    try {
      const cleanBase64 = cleanStr.replace(/\s/g, '');
      const padded = this.addPadding(cleanBase64);
      atob(padded);
      return true;
    } catch {
      return false;
    }
  }

  public static async fromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  public static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  public static formatHex(hex: string): string {
    const cleaned = hex.replace(/\s+/g, '');
    const pairs: string[] = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      pairs.push(cleaned.substr(i, 2).toUpperCase());
    }
    return pairs.join(' ');
  }
}
