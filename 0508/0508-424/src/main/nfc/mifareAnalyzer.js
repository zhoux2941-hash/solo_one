const NFCReader = require('./reader');
const { SectorDB, KeyDB, LogDB } = require('../database');
const fs = require('fs');
const path = require('path');

const DEFAULT_KEY_A = 'FFFFFFFFFFFF';
const DEFAULT_KEY_B = '000000000000';
const COMMON_KEYS = [
  'FFFFFFFFFFFF',
  '000000000000',
  'A0A1A2A3A4A5',
  'B0B1B2B3B4B5',
  '4D3A99C351DD',
  '1A982C7E459A',
  'D3F7D3F7D3F7',
  'AA55C396C490'
];

class MifareAnalyzer {
  constructor(reader) {
    this.reader = reader;
    this.sectorCount = 16;
    this.blocksPerSector = 4;
  }

  async analyzeCard(cardInfo, onProgress) {
    const { uid } = cardInfo;
    const results = {
      uid,
      sak: cardInfo.sak,
      atqa: cardInfo.atqa,
      sectors: [],
      encryptedSectors: [],
      crackedKeys: {},
      readSuccess: false
    };

    LogDB.addLog('analyze_start', uid, { cardInfo });

    for (let sector = 0; sector < this.sectorCount; sector++) {
      const sectorResult = await this.analyzeSector(uid, sector);
      results.sectors.push(sectorResult);

      if (sectorResult.isEncrypted) {
        results.encryptedSectors.push(sector);
      }

      if (sectorResult.keyA) {
        results.crackedKeys[`${sector}-A`] = sectorResult.keyA;
      }
      if (sectorResult.keyB) {
        results.crackedKeys[`${sector}-B`] = sectorResult.keyB;
      }

      if (onProgress) {
        onProgress((sector + 1) / this.sectorCount, sector, sectorResult);
      }

      this.saveSectorToDB(uid, sectorResult);
    }

    results.readSuccess = results.sectors.some(s => s.blocks && s.blocks.length > 0);

    LogDB.addLog('analyze_complete', uid, {
      encryptedCount: results.encryptedSectors.length,
      crackedCount: Object.keys(results.crackedKeys).length
    });

    return results;
  }

  async analyzeSector(uid, sectorIndex) {
    const blockStart = sectorIndex * this.blocksPerSector;
    const sectorTrailer = blockStart + 3;

    const result = {
      sectorIndex,
      isEncrypted: true,
      keyA: null,
      keyB: null,
      accessConditions: null,
      blocks: [],
      readError: null
    };

    let authenticated = false;
    let usedKeyType = null;
    let usedKey = null;

    for (const key of COMMON_KEYS) {
      try {
        await this.reader.mifareAuthenticate(sectorTrailer, 'A', key, uid);
        authenticated = true;
        usedKeyType = 'A';
        usedKey = key;
        result.keyA = key;
        break;
      } catch (e) {}

      try {
        await this.reader.mifareAuthenticate(sectorTrailer, 'B', key, uid);
        authenticated = true;
        usedKeyType = 'B';
        usedKey = key;
        result.keyB = key;
        break;
      } catch (e) {}
    }

    if (!authenticated) {
      result.isEncrypted = true;
      result.readError = 'Authentication failed with default keys';
      return result;
    }

    result.isEncrypted = usedKey !== DEFAULT_KEY_A && usedKey !== DEFAULT_KEY_B;

    try {
      const trailerData = await this.reader.mifareRead(sectorTrailer);
      const trailerHex = trailerData.toString('hex');
      
      result.keyA = trailerHex.substring(0, 12);
      result.accessConditions = trailerHex.substring(12, 20);
      result.keyB = trailerHex.substring(20, 32);

      if (usedKeyType === 'A' && !result.keyB) {
        result.keyB = usedKey;
      } else if (usedKeyType === 'B' && !result.keyA) {
        result.keyA = usedKey;
      }

      for (let block = blockStart; block < blockStart + 3; block++) {
        try {
          const blockData = await this.reader.mifareRead(block);
          result.blocks.push({
            blockIndex: block,
            data: blockData.toString('hex')
          });
        } catch (e) {
          result.blocks.push({
            blockIndex: block,
            data: null,
            error: e.message
          });
        }
      }

      if (result.keyA) {
        KeyDB.saveKey({
          uid,
          sector_index: sectorIndex,
          key_type: 'A',
          key_value: result.keyA,
          source: result.isEncrypted ? 'cracked' : 'default'
        });
      }
      if (result.keyB) {
        KeyDB.saveKey({
          uid,
          sector_index: sectorIndex,
          key_type: 'B',
          key_value: result.keyB,
          source: result.isEncrypted ? 'cracked' : 'default'
        });
      }
    } catch (e) {
      result.readError = e.message;
    }

    return result;
  }

  saveSectorToDB(uid, sectorResult) {
    try {
      SectorDB.saveSector({
        uid,
        sector_index: sectorResult.sectorIndex,
        block_data: sectorResult.blocks,
        key_a: sectorResult.keyA,
        key_b: sectorResult.keyB,
        access_conditions: sectorResult.accessConditions,
        is_encrypted: sectorResult.isEncrypted,
        is_cracked: !!(sectorResult.keyA || sectorResult.keyB)
      });
    } catch (e) {
      console.error('保存扇区数据失败:', e);
    }
  }

  async readAllSectors(uid, onProgress) {
    const results = [];
    const keys = KeyDB.getKeysByUid(uid);
    const keyMap = {};
    keys.forEach(k => {
      keyMap[`${k.sector_index}-${k.key_type}`] = k.key_value;
    });

    for (let sector = 0; sector < this.sectorCount; sector++) {
      const blockStart = sector * this.blocksPerSector;
      const sectorTrailer = blockStart + 3;

      const sectorData = {
        sectorIndex: sector,
        blocks: [],
        keyA: keyMap[`${sector}-A`],
        keyB: keyMap[`${sector}-B`],
        success: false
      };

      let authenticated = false;

      if (sectorData.keyA) {
        try {
          await this.reader.mifareAuthenticate(sectorTrailer, 'A', sectorData.keyA, uid);
          authenticated = true;
        } catch (e) {}
      }

      if (!authenticated && sectorData.keyB) {
        try {
          await this.reader.mifareAuthenticate(sectorTrailer, 'B', sectorData.keyB, uid);
          authenticated = true;
        } catch (e) {}
      }

      if (authenticated) {
        for (let block = blockStart; block < blockStart + 4; block++) {
          try {
            const data = await this.reader.mifareRead(block);
            sectorData.blocks.push({
              blockIndex: block,
              data: data.toString('hex')
            });
          } catch (e) {
            sectorData.blocks.push({
              blockIndex: block,
              data: null,
              error: e.message
            });
          }
        }
        sectorData.success = true;
      }

      results.push(sectorData);

      if (onProgress) {
        onProgress((sector + 1) / this.sectorCount, sector, sectorData);
      }
    }

    return results;
  }

  async dumpToJson(uid, outputPath) {
    const { CardDB } = require('../database');
    const card = CardDB.getCardByUid(uid);
    
    if (!card) {
      throw new Error('卡片不存在');
    }

    const sectors = SectorDB.getSectorsByUid(uid);
    const keys = KeyDB.getKeysByUid(uid);

    const dumpData = {
      uid: card.uid,
      sak: card.sak,
      atqa: card.atqa,
      cardType: card.card_type,
      name: card.name,
      dumpTime: new Date().toISOString(),
      sectors: sectors.map(s => ({
        sectorIndex: s.sector_index,
        blockData: JSON.parse(s.block_data || '[]'),
        keyA: s.key_a,
        keyB: s.key_b,
        accessConditions: s.access_conditions,
        isEncrypted: !!s.is_encrypted,
        isCracked: !!s.is_cracked
      })),
      keys: keys.map(k => ({
        sectorIndex: k.sector_index,
        keyType: k.key_type,
        keyValue: k.key_value,
        source: k.source
      }))
    };

    const filePath = outputPath || path.join(process.cwd(), `dump_${uid}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dumpData, null, 2));

    LogDB.addLog('dump_json', uid, { filePath });

    return filePath;
  }
}

module.exports = MifareAnalyzer;
