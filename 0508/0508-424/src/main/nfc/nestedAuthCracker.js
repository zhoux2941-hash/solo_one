const { KeyDB, LogDB } = require('../database');
const crypto = require('crypto');

class NestedAuthCracker {
  constructor(reader) {
    this.reader = reader;
    this.isRunning = false;
  }

  async crackSector(uid, sectorIndex, knownKey, knownKeyType, targetKeyType, onProgress) {
    if (this.isRunning) {
      throw new Error('破解程序正在运行中');
    }

    this.isRunning = true;
    const blockNumber = sectorIndex * 4 + 3;
    let foundKey = null;

    try {
      LogDB.addLog('crack_start', uid, { sectorIndex, targetKeyType });

      const nonceResponse = await this.sendAuthCommand(blockNumber, knownKeyType, knownKey, uid);
      
      if (!nonceResponse || nonceResponse.length < 8) {
        throw new Error('无法获取认证随机数');
      }

      const ntag = nonceResponse.slice(0, 4);
      const enc_nr = nonceResponse.slice(4, 8);

      const keyCandidates = this.generateKeyCandidates();
      const totalCandidates = keyCandidates.length;
      let checked = 0;

      for (const candidateKey of keyCandidates) {
        checked++;
        
        if (onProgress) {
          onProgress(checked / totalCandidates, checked, totalCandidates);
        }

        try {
          const nr = this.xorBytes(this.crypto1Encrypt(candidateKey, ntag), enc_nr);
          const ar = this.generateAR(nr);
          const enc_ar = this.crypto1Encrypt(candidateKey, ar);
          
          const response = await this.sendNestedAuth(blockNumber, targetKeyType, enc_ar, uid);
          
          if (response && response.length >= 2 && response[response.length - 2] === 0x90) {
            foundKey = candidateKey;
            
            KeyDB.saveKey({
              uid,
              sector_index: sectorIndex,
              key_type: targetKeyType,
              key_value: foundKey,
              source: 'nested_crack'
            });

            LogDB.addLog('crack_success', uid, { 
              sectorIndex, 
              targetKeyType, 
              key: foundKey,
              attempts: checked 
            });

            break;
          }
        } catch (e) {
        }

        if (!this.isRunning) {
          break;
        }
      }

      if (!foundKey) {
        LogDB.addLog('crack_failed', uid, { sectorIndex, targetKeyType, attempts: checked });
      }

      this.isRunning = false;
      return foundKey;

    } catch (error) {
      this.isRunning = false;
      LogDB.addLog('crack_error', uid, { sectorIndex, targetKeyType, error: error.message });
      throw error;
    }
  }

  async sendAuthCommand(blockNumber, keyType, key, uid) {
    const keyBuffer = Buffer.from(key, 'hex');
    const uidBuffer = Buffer.from(uid, 'hex');

    try {
      await this.reader.mifareAuthenticate(blockNumber, keyType, keyBuffer, uidBuffer);
      
      const getChallengeCmd = Buffer.from([0xFF, 0x00, 0x00, 0x00, 0x04, 0xD4, 0x40, 0x01, 0x1A]);
      const response = await this.reader.transmit(getChallengeCmd);
      
      return response;
    } catch (e) {
      return null;
    }
  }

  async sendNestedAuth(blockNumber, keyType, data, uid) {
    const authCmd = Buffer.concat([
      Buffer.from([0xFF, 0x86, 0x00, 0x00, 0x05, 0x01, 0x00]),
      Buffer.from([blockNumber]),
      Buffer.from([keyType === 'A' ? 0x60 : 0x61]),
      Buffer.from([0x00]),
      data
    ]);

    try {
      return await this.reader.transmit(authCmd);
    } catch (e) {
      return null;
    }
  }

  generateKeyCandidates() {
    const candidates = new Set();

    candidates.add('FFFFFFFFFFFF');
    candidates.add('000000000000');
    candidates.add('A0A1A2A3A4A5');
    candidates.add('B0B1B2B3B4B5');
    candidates.add('4D3A99C351DD');
    candidates.add('D3F7D3F7D3F7');
    candidates.add('AA55C396C490');
    candidates.add('1A982C7E459A');
    candidates.add('001122334455');
    candidates.add('112233445566');
    candidates.add('223344556677');
    candidates.add('334455667788');
    candidates.add('445566778899');
    candidates.add('5566778899AA');
    candidates.add('66778899AABB');
    candidates.add('778899AABBCC');
    candidates.add('8899AABBCCDD');
    candidates.add('99AABBCCDDEE');
    candidates.add('AABBCCDDEEFF');
    candidates.add('BBCCDDEEFF00');
    candidates.add('CCDDEEFF0011');
    candidates.add('DDEEFF001122');
    candidates.add('EEFF00112233');
    candidates.add('FF0011223344');

    for (let i = 0; i < 1000; i++) {
      const key = Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).toUpperCase().padStart(12, '0');
      candidates.add(key);
    }

    return Array.from(candidates);
  }

  crypto1Encrypt(key, data) {
    const keyBuffer = Buffer.from(key, 'hex');
    const dataBuffer = Buffer.from(data);
    const result = Buffer.alloc(dataBuffer.length);

    let lfsr = 0;
    for (let i = 0; i < 6; i++) {
      lfsr = (lfsr << 8) | keyBuffer[i];
    }

    for (let i = 0; i < dataBuffer.length; i++) {
      let byte = 0;
      for (let b = 0; b < 8; b++) {
        const feedback = ((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5)) & 1;
        const outBit = (lfsr >> 47) & 1;
        lfsr = (lfsr << 1) | feedback;
        byte = (byte << 1) | (outBit ^ ((dataBuffer[i] >> (7 - b)) & 1));
      }
      result[i] = byte;
    }

    return result;
  }

  xorBytes(a, b) {
    const result = Buffer.alloc(Math.min(a.length, b.length));
    for (let i = 0; i < result.length; i++) {
      result[i] = a[i] ^ b[i];
    }
    return result;
  }

  generateAR(nr) {
    const result = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) {
      result[i] = nr[i] ^ 0xFF;
    }
    return result;
  }

  async bruteForceSector(uid, sectorIndex, targetKeyType, onProgress) {
    if (this.isRunning) {
      throw new Error('破解程序正在运行中');
    }

    this.isRunning = true;
    const blockNumber = sectorIndex * 4 + 3;
    let foundKey = null;

    try {
      LogDB.addLog('bruteforce_start', uid, { sectorIndex, targetKeyType });

      const candidates = this.generateKeyCandidates();
      const total = candidates.length;
      let checked = 0;

      for (const key of candidates) {
        checked++;

        if (onProgress) {
          onProgress(checked / total, checked, total, key);
        }

        try {
          const keyBuffer = Buffer.from(key, 'hex');
          const uidBuffer = Buffer.from(uid, 'hex');
          
          await this.reader.mifareAuthenticate(blockNumber, targetKeyType, keyBuffer, uidBuffer);
          
          foundKey = key;
          
          KeyDB.saveKey({
            uid,
            sector_index: sectorIndex,
            key_type: targetKeyType,
            key_value: foundKey,
            source: 'bruteforce'
          });

          LogDB.addLog('bruteforce_success', uid, { 
            sectorIndex, 
            targetKeyType, 
            key: foundKey,
            attempts: checked 
          });

          break;
        } catch (e) {
        }

        if (!this.isRunning) {
          break;
        }
      }

      if (!foundKey) {
        LogDB.addLog('bruteforce_failed', uid, { sectorIndex, targetKeyType, attempts: checked });
      }

      this.isRunning = false;
      return foundKey;

    } catch (error) {
      this.isRunning = false;
      LogDB.addLog('bruteforce_error', uid, { sectorIndex, targetKeyType, error: error.message });
      throw error;
    }
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = NestedAuthCracker;
