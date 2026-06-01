const { CardDB, SectorDB, KeyDB, LogDB, AuditDB } = require('./database');
const NFCReader = require('./nfc/reader');

class CardManager {
  constructor(reader) {
    this.reader = reader;
    this.emulatedCard = null;
    this.isEmulating = false;
  }

  async addCard(cardInfo, sectors, keys) {
    const { uid, sak, atqa, card_type, name } = cardInfo;
    
    const card = CardDB.addCard({ uid, sak, atqa, card_type, name });
    
    if (sectors) {
      for (const sector of sectors) {
        SectorDB.saveSector({
          uid,
          sector_index: sector.sectorIndex,
          block_data: sector.blocks,
          key_a: sector.keyA,
          key_b: sector.keyB,
          access_conditions: sector.accessConditions,
          is_encrypted: sector.isEncrypted,
          is_cracked: sector.isCracked
        });
      }
    }

    if (keys) {
      for (const key of keys) {
        KeyDB.saveKey({
          uid,
          sector_index: key.sectorIndex,
          key_type: key.keyType,
          key_value: key.keyValue,
          source: key.source
        });
      }
    }

    LogDB.addLog('card_added', uid, { name });
    return card;
  }

  async getAllCards() {
    const cards = CardDB.getAllCards();
    return cards.map(card => ({
      ...card,
      sectors: SectorDB.getSectorsByUid(card.uid),
      keys: KeyDB.getKeysByUid(card.uid)
    }));
  }

  async getCardByUid(uid) {
    const card = CardDB.getCardByUid(uid);
    if (!card) return null;

    return {
      ...card,
      sectors: SectorDB.getSectorsByUid(uid),
      keys: KeyDB.getKeysByUid(uid)
    };
  }

  async updateCardName(uid, name) {
    LogDB.addLog('card_renamed', uid, { oldName: CardDB.getCardByUid(uid)?.name, newName: name });
    return CardDB.updateCardName(uid, name);
  }

  async deleteCard(uid) {
    const card = CardDB.getCardByUid(uid);
    if (card) {
      LogDB.addLog('card_deleted', uid, { name: card.name });
    }
    return CardDB.deleteCard(uid);
  }

  async setActiveCard(uid) {
    const card = CardDB.getCardByUid(uid);
    if (!card) {
      throw new Error('卡片不存在');
    }

    CardDB.setActiveCard(uid);
    LogDB.addLog('card_activated', uid, { name: card.name });

    return card;
  }

  async getActiveCard() {
    return CardDB.getActiveCard();
  }

  async startEmulation(uid, location) {
    if (this.isEmulating) {
      await this.stopEmulation();
    }

    const card = await this.getCardByUid(uid);
    if (!card) {
      throw new Error('卡片不存在');
    }

    if (!card.sectors || card.sectors.length === 0) {
      throw new Error('卡片没有扇区数据，无法模拟');
    }

    const sectorsData = card.sectors.map(s => ({
      sectorIndex: s.sector_index,
      blocks: JSON.parse(s.block_data || '[]'),
      keyA: s.key_a,
      keyB: s.key_b,
      accessConditions: s.access_conditions
    }));

    try {
      await this.reader.setTargetMode({
        uid: card.uid,
        sak: card.sak,
        atqa: card.atqa,
        sectors: sectorsData
      });

      this.isEmulating = true;
      this.emulatedCard = card;

      CardDB.setActiveCard(uid);

      AuditDB.addRecord({
        uid,
        action: 'emulate_start',
        reader_id: this.reader.currentReader?.reader?.name,
        location
      });

      LogDB.addLog('emulation_start', uid, { name: card.name, location });

      return true;
    } catch (error) {
      console.error('启动模拟失败:', error);
      throw error;
    }
  }

  async stopEmulation() {
    if (!this.isEmulating) return;

    try {
      await this.reader.stopEmulation();

      AuditDB.addRecord({
        uid: this.emulatedCard.uid,
        action: 'emulate_stop',
        reader_id: this.reader.currentReader?.reader?.name
      });

      LogDB.addLog('emulation_stop', this.emulatedCard.uid, { name: this.emulatedCard.name });

      this.isEmulating = false;
      this.emulatedCard = null;

      return true;
    } catch (error) {
      console.error('停止模拟失败:', error);
      throw error;
    }
  }

  async switchEmulationCard(uid, location) {
    await this.stopEmulation();
    return await this.startEmulation(uid, location);
  }

  recordReaderAccess(uid, readerId, location) {
    AuditDB.addRecord({
      uid,
      action: 'emulate',
      reader_id: readerId,
      location
    });

    LogDB.addLog('reader_access', uid, { readerId, location });
  }

  async getEmulationStatus() {
    return {
      isEmulating: this.isEmulating,
      card: this.emulatedCard,
      reader: this.reader.currentReader?.reader?.name
    };
  }

  async importCardFromDump(dumpData) {
    const { uid, sak, atqa, cardType, name, sectors, keys } = dumpData;

    const card = CardDB.addCard({ uid, sak, atqa, card_type: cardType, name });

    if (sectors) {
      for (const sector of sectors) {
        SectorDB.saveSector({
          uid,
          sector_index: sector.sectorIndex,
          block_data: sector.blockData,
          key_a: sector.keyA,
          key_b: sector.keyB,
          access_conditions: sector.accessConditions,
          is_encrypted: sector.isEncrypted,
          is_cracked: sector.isCracked
        });
      }
    }

    if (keys) {
      for (const key of keys) {
        KeyDB.saveKey({
          uid,
          sector_index: key.sectorIndex,
          key_type: key.keyType,
          key_value: key.keyValue,
          source: key.source
        });
      }
    }

    LogDB.addLog('card_imported', uid, { name, source: 'dump_file' });
    return card;
  }

  async exportCardDump(uid) {
    const card = await this.getCardByUid(uid);
    if (!card) {
      throw new Error('卡片不存在');
    }

    return {
      uid: card.uid,
      sak: card.sak,
      atqa: card.atqa,
      cardType: card.card_type,
      name: card.name,
      exportTime: new Date().toISOString(),
      sectors: card.sectors.map(s => ({
        sectorIndex: s.sector_index,
        blockData: JSON.parse(s.block_data || '[]'),
        keyA: s.key_a,
        keyB: s.key_b,
        accessConditions: s.access_conditions,
        isEncrypted: !!s.is_encrypted,
        isCracked: !!s.is_cracked
      })),
      keys: card.keys.map(k => ({
        sectorIndex: k.sector_index,
        keyType: k.key_type,
        keyValue: k.key_value,
        source: k.source
      }))
    };
  }
}

module.exports = CardManager;
