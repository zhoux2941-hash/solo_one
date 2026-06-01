const { NFC } = require('nfc-pcsc');
const EventEmitter = require('events');

class NFCReader extends EventEmitter {
  constructor() {
    super();
    this.nfc = null;
    this.readers = new Map();
    this.currentReader = null;
    this.currentCard = null;
    this.isMonitoring = false;
    this.isEmulating = false;
    this.emulatedCardData = null;
    this.lastCardUid = null;
    this.lastCardTime = 0;
    this.debounceMs = 500;
  }

  async init() {
    try {
      this.nfc = new NFC();
      
      this.nfc.on('reader', (reader) => {
        console.log(`[NFC] 读卡器已连接: ${reader.reader.name}`);
        this.readers.set(reader.reader.name, reader);
        this.currentReader = reader;
        this.emit('reader-connected', reader.reader.name);

        reader.on('card', (card) => {
          const now = Date.now();
          const sameCard = this.lastCardUid === card.uid;
          const withinDebounce = (now - this.lastCardTime) < this.debounceMs;

          this.currentCard = card;

          if (sameCard && withinDebounce) {
            console.log(`[NFC] 防抖忽略: UID=${card.uid}, 距上次 ${now - this.lastCardTime}ms`);
            return;
          }

          this.lastCardUid = card.uid;
          this.lastCardTime = now;
          console.log(`[NFC] 检测到卡: UID=${card.uid}, SAK=${card.sak}, ATQA=${card.atqa}`);
          this.emit('card-detected', card);
        });

        reader.on('card-off', () => {
          this.currentCard = null;
          console.log('[NFC] 卡已移除');
          this.emit('card-removed');
        });

        reader.on('error', (err) => {
          console.error(`[NFC] 读卡器错误: ${err.message}`);
          this.emit('reader-error', err.message);
        });

        reader.on('end', () => {
          console.log(`[NFC] 读卡器已断开: ${reader.reader.name}`);
          this.readers.delete(reader.reader.name);
          if (this.currentReader === reader) {
            this.currentReader = null;
          }
          this.emit('reader-disconnected', reader.reader.name);
        });
      });

      this.nfc.on('error', (err) => {
        console.error('[NFC] NFC错误:', err);
        this.emit('nfc-error', err.message);
      });

      return true;
    } catch (error) {
      console.error('[NFC] 初始化失败:', error);
      return false;
    }
  }

  async transmit(apdu) {
    if (!this.currentReader) {
      throw new Error('没有可用的读卡器');
    }
    return await this.currentReader.transmit(Buffer.from(apdu));
  }

  async control(code, data, responseMaxLength) {
    if (!this.currentReader) {
      throw new Error('没有可用的读卡器');
    }
    return await this.currentReader.control(code, Buffer.from(data), responseMaxLength);
  }

  async mifareAuthenticate(blockNumber, keyType, key, uid) {
    if (!this.currentReader || !this.currentCard) {
      throw new Error('没有检测到卡');
    }

    const keyBuffer = Buffer.from(key, 'hex');
    const uidBuffer = Buffer.from(uid, 'hex');

    return await this.currentReader.authenticate(blockNumber, keyType, keyBuffer, uidBuffer);
  }

  async mifareRead(blockNumber) {
    if (!this.currentReader) {
      throw new Error('没有可用的读卡器');
    }
    return await this.currentReader.read(blockNumber, 16);
  }

  async mifareWrite(blockNumber, data) {
    if (!this.currentReader) {
      throw new Error('没有可用的读卡器');
    }
    const dataBuffer = Buffer.from(data, 'hex');
    return await this.currentReader.write(blockNumber, dataBuffer);
  }

  async getCardInfo() {
    if (!this.currentCard) {
      throw new Error('没有检测到卡');
    }

    return {
      uid: this.currentCard.uid,
      sak: this.currentCard.sak.toString(16).padStart(2, '0'),
      atqa: this.currentCard.atqa.toString('hex'),
      type: this.currentCard.type || 'unknown'
    };
  }

  async startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    console.log('[NFC] 开始监控卡');
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log('[NFC] 停止监控卡');
  }

  async setTargetMode(emulateData) {
    if (!this.currentReader) {
      throw new Error('没有可用的读卡器');
    }

    console.log('[NFC] 切换到卡片模拟模式 (Target Mode)');
    
    const { uid, sak, atqa, sectors } = emulateData;
    const uidBuffer = Buffer.from(uid, 'hex');
    
    try {
      console.log('[NFC] 步骤1: 发送FF 00 00 00 04 D4 40 01命令进入模拟模式');
      
      const modeSwitchCommand = Buffer.from([
        0xFF, 0x00, 0x00, 0x00, 0x04,
        0xD4, 0x40, 0x01, 0x00
      ]);
      
      console.log('[NFC] 模式切换命令:', modeSwitchCommand.toString('hex'));
      
      const response1 = await this.currentReader.transmit(modeSwitchCommand);
      console.log('[NFC] 模式切换响应:', response1.toString('hex'));
      
      await this.delay(200);
      
      console.log('[NFC] 步骤2: 配置模拟卡参数 (UID, SAK, ATQA)');
      
      const atqaBuffer = Buffer.from(atqa, 'hex');
      const sakValue = parseInt(sak, 16);
      
      const mifareParams = Buffer.alloc(6);
      mifareParams[0] = atqaBuffer.length >= 1 ? atqaBuffer[0] : 0x04;
      mifareParams[1] = atqaBuffer.length >= 2 ? atqaBuffer[1] : 0x00;
      mifareParams[2] = sakValue;
      
      const felicaParams = Buffer.alloc(18, 0x00);
      const nfcId3t = Buffer.alloc(10, 0x00);
      
      const tgInitCommand = Buffer.concat([
        Buffer.from([0xD4, 0x40, 0x01]),
        mifareParams,
        felicaParams,
        nfcId3t,
        Buffer.from([0x00, 0x00])
      ]);
      
      const fullTgInit = Buffer.concat([
        Buffer.from([0xFF, 0x00, 0x00, 0x00, tgInitCommand.length]),
        tgInitCommand
      ]);
      
      console.log('[NFC] TgInit命令:', fullTgInit.toString('hex'));
      
      const response2 = await this.currentReader.transmit(fullTgInit);
      console.log('[NFC] TgInit响应:', response2.toString('hex'));
      
      await this.delay(100);
      
      console.log('[NFC] 步骤3: 加载模拟卡UID和扇区数据');
      await this.loadEmulatedCardData(uid, sak, atqa, sectors);
      
      this.isEmulating = true;
      this.emulatedCardData = emulateData;
      
      console.log('[NFC] ✅ 卡片模拟模式已启动');
      console.log('[NFC]    UID:', uid);
      console.log('[NFC]    SAK:', sak);
      console.log('[NFC]    ATQA:', atqa);
      
      return true;
    } catch (error) {
      console.error('[NFC] ❌ 设置Target模式失败:', error.message);
      throw error;
    }
  }

  async loadEmulatedCardData(uid, sak, atqa, sectors) {
    console.log('[NFC] 准备模拟卡数据...');
    
    try {
      this.emulatedSectorData = new Map();
      
      if (sectors && Array.isArray(sectors)) {
        console.log(`[NFC] 缓存 ${sectors.length} 个扇区数据`);
        
        for (const sector of sectors) {
          if (sector.blocks && Array.isArray(sector.blocks)) {
            for (const block of sector.blocks) {
              const blockNumber = sector.sectorIndex * 4 + block.blockIndex;
              if (block.data && block.data.length > 0) {
                this.emulatedSectorData.set(blockNumber, block.data);
                console.log(`[NFC]   块 ${blockNumber}: ${block.data}`);
              }
            }
          }
        }
      }
      
      console.log('[NFC] 模拟卡数据已缓存，等待读卡器请求');
      this.startEmulationDataHandler();
      
      return true;
    } catch (error) {
      console.error('[NFC] 加载模拟卡数据失败:', error);
      return false;
    }
  }

  async startEmulationDataHandler() {
    if (!this.isEmulating) return;
    
    console.log('[NFC] 启动模拟卡数据响应处理器');
    
    const handleCommands = async () => {
      while (this.isEmulating && this.currentReader) {
        try {
          const command = Buffer.from([0xFF, 0x00, 0x00, 0x00, 0x02, 0xD4, 0x42]);
          const response = await this.currentReader.transmit(command);
          
          if (response.length > 2 && response[0] === 0xD5 && response[1] === 0x43) {
            const receivedData = response.slice(2, -2);
            await this.handleEmulationCommand(receivedData);
          }
          
          await this.delay(50);
        } catch (error) {
          await this.delay(100);
        }
      }
    };
    
    handleCommands().catch(err => {
      console.error('[NFC] 模拟卡处理器错误:', err);
    });
  }

  async handleEmulationCommand(commandData) {
    if (commandData.length < 1) return;
    
    const ins = commandData[0];
    
    switch (ins) {
      case 0x30:
        if (commandData.length >= 2) {
          const blockNumber = commandData[1];
          const blockData = this.emulatedSectorData.get(blockNumber);
          
          if (blockData) {
            console.log(`[NFC] 响应读卡请求 - 块 ${blockNumber}`);
            const dataBuffer = Buffer.from(blockData, 'hex');
            const responseCmd = Buffer.concat([
              Buffer.from([0xD4, 0x44, 0x00]),
              dataBuffer
            ]);
            const fullCmd = Buffer.concat([
              Buffer.from([0xFF, 0x00, 0x00, 0x00, responseCmd.length]),
              responseCmd
            ]);
            try {
              await this.currentReader.transmit(fullCmd);
            } catch (e) {}
          }
        }
        break;
        
      case 0x60:
      case 0x61:
        console.log('[NFC] 收到认证请求，响应ACK');
        try {
          const ackCmd = Buffer.from([0xFF, 0x00, 0x00, 0x00, 0x04, 0xD4, 0x44, 0x00, 0x00]);
          await this.currentReader.transmit(ackCmd);
        } catch (e) {}
        break;
        
      default:
        console.log(`[NFC] 收到未知命令: 0x${ins.toString(16)}`);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stopEmulation() {
    if (!this.isEmulating) return;

    try {
      console.log('[NFC] 停止卡片模拟...');
      
      const releaseCommand = Buffer.from([
        0xFF, 0x00, 0x00, 0x00, 0x02, 0xD4, 0x45
      ]);
      
      try {
        await this.currentReader.transmit(releaseCommand);
      } catch (e) {}
      
      await this.delay(100);
      
      const resetCommand = Buffer.from([
        0xFF, 0x00, 0x00, 0x00, 0x03, 0xD4, 0x02, 0x01
      ]);
      
      try {
        await this.currentReader.transmit(resetCommand);
      } catch (e) {}
      
      this.isEmulating = false;
      this.emulatedCardData = null;
      this.emulatedSectorData = null;
      
      console.log('[NFC] ✅ 卡片模拟已停止');
      return true;
    } catch (error) {
      console.error('[NFC] 停止模拟失败:', error.message);
      this.isEmulating = false;
      this.emulatedCardData = null;
      throw error;
    }
  }

  getReaders() {
    return Array.from(this.readers.keys());
  }

  selectReader(readerName) {
    if (this.readers.has(readerName)) {
      this.currentReader = this.readers.get(readerName);
      return true;
    }
    return false;
  }

  async close() {
    if (this.nfc) {
      await this.nfc.close();
      this.nfc = null;
    }
    this.readers.clear();
    this.currentReader = null;
    this.currentCard = null;
    this.isMonitoring = false;
    this.isEmulating = false;
  }
}

module.exports = NFCReader;
