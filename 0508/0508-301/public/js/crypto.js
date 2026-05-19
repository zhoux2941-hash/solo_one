class CryptoManager {
  constructor() {
    this.key = null;
    this.algorithm = { name: 'AES-GCM', length: 256 };
  }

  async generateKey() {
    this.key = await crypto.subtle.generateKey(
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
    return this.exportKey();
  }

  async importKey(keyData) {
    const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    this.key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      this.algorithm,
      true,
      ['encrypt', 'decrypt']
    );
  }

  async exportKey() {
    const exported = await crypto.subtle.exportKey('raw', this.key);
    const keyBytes = new Uint8Array(exported);
    return btoa(String.fromCharCode.apply(null, keyBytes));
  }

  async encrypt(data) {
    if (!this.key) throw new Error('No encryption key');
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode.apply(null, combined));
  }

  async decrypt(encryptedData) {
    if (!this.key) throw new Error('No encryption key');
    
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data
    );
    
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  }
}
