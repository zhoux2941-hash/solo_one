const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const IntelHex = require('intel-hex');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/firmware');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function calculateMD5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function detectEncryption(data) {
  let zeroCount = 0;
  let ffCount = 0;
  let totalBytes = Math.min(data.length, 1000);
  
  for (let i = 0; i < totalBytes; i++) {
    if (data[i] === 0x00) zeroCount++;
    if (data[i] === 0xFF) ffCount++;
  }
  
  const zeroRatio = zeroCount / totalBytes;
  const ffRatio = ffCount / totalBytes;
  
  if (zeroRatio > 0.8 || ffRatio > 0.8) {
    return { isEncrypted: false, type: 'normal' };
  }
  
  let entropy = 0;
  const freq = new Array(256).fill(0);
  for (let i = 0; i < totalBytes; i++) {
    freq[data[i]]++;
  }
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / totalBytes;
      entropy -= p * Math.log2(p);
    }
  }
  
  if (entropy > 7.0) {
    return { isEncrypted: true, type: 'encrypted', entropy };
  }
  
  return { isEncrypted: false, type: 'normal', entropy };
}

function parseBinFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      const encryptionInfo = detectEncryption(data);
      
      resolve({
        type: 'bin',
        size: data.length,
        data: data,
        startAddress: 0,
        isEncrypted: encryptionInfo.isEncrypted,
        encryptionType: encryptionInfo.type
      });
    });
  });
}

function parseHexRecord(line) {
  line = line.trim();
  if (!line.startsWith(':')) {
    return null;
  }
  
  try {
    const hexStr = line.slice(1);
    const bytes = [];
    
    for (let i = 0; i < hexStr.length; i += 2) {
      bytes.push(parseInt(hexStr.substr(i, 2), 16));
    }
    
    if (bytes.length < 5) {
      return null;
    }
    
    const byteCount = bytes[0];
    const address = (bytes[1] << 8) | bytes[2];
    const recordType = bytes[3];
    const dataBytes = bytes.slice(4, 4 + byteCount);
    
    let checksum = 0;
    for (let i = 0; i < bytes.length - 1; i++) {
      checksum += bytes[i];
    }
    checksum = ((~checksum + 1) & 0xFF);
    
    return {
      byteCount,
      address,
      recordType,
      data: dataBytes,
      checksum,
      checksumValid: checksum === bytes[bytes.length - 1]
    };
  } catch (e) {
    return null;
  }
}

function robustHexParse(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  let baseAddress = 0;
  let extendedAddress = 0;
  const dataChunks = [];
  let warnings = [];
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    const record = parseHexRecord(line);
    
    if (!record) {
      warnings.push(`行 ${lineNum + 1}: 格式不正确，跳过`);
      continue;
    }
    
    if (!record.checksumValid) {
      warnings.push(`行 ${lineNum + 1}: 校验和无效，继续处理`);
    }
    
    switch (record.recordType) {
      case 0:
        const address = extendedAddress + record.address;
        dataChunks.push({
          address,
          data: Buffer.from(record.data)
        });
        break;
      case 1:
        break;
      case 2:
        if (record.data.length >= 2) {
          extendedAddress = ((record.data[0] << 8) | record.data[1]) << 4;
        }
        break;
      case 3:
        break;
      case 4:
        if (record.data.length >= 2) {
          extendedAddress = ((record.data[0] << 8) | record.data[1]) << 16;
        }
        break;
      case 5:
        if (record.data.length >= 4) {
          baseAddress = (record.data[0] << 24) | (record.data[1] << 16) | 
                       (record.data[2] << 8) | record.data[3];
        }
        break;
      default:
        warnings.push(`行 ${lineNum + 1}: 未知记录类型 ${record.recordType}`);
    }
  }
  
  if (dataChunks.length === 0) {
    throw new Error('未找到有效的数据记录');
  }
  
  let minAddr = Infinity;
  let maxAddr = 0;
  for (const chunk of dataChunks) {
    minAddr = Math.min(minAddr, chunk.address);
    maxAddr = Math.max(maxAddr, chunk.address + chunk.data.length);
  }
  
  const totalSize = maxAddr - minAddr;
  const fullData = Buffer.alloc(totalSize, 0xFF);
  
  for (const chunk of dataChunks) {
    const offset = chunk.address - minAddr;
    chunk.data.copy(fullData, offset);
  }
  
  return {
    data: fullData,
    startAddress: minAddr,
    warnings,
    recordCount: dataChunks.length
  };
}

function parseHexFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      
      let parsed = null;
      let parseMethod = 'standard';
      
      try {
        const hex = IntelHex.parse(data);
        parsed = {
          type: 'hex',
          size: hex.data.length,
          data: hex.data,
          startAddress: hex.startSegmentAddress || 0,
          parseMethod
        };
      } catch (standardErr) {
        parseMethod = 'robust';
        try {
          const robust = robustHexParse(data);
          parsed = {
            type: 'hex',
            size: robust.data.length,
            data: robust.data,
            startAddress: robust.startAddress,
            parseMethod,
            warnings: robust.warnings,
            recordCount: robust.recordCount
          };
        } catch (robustErr) {
          reject(new Error(`HEX文件解析失败\n标准解析: ${standardErr.message}\n增强解析: ${robustErr.message}`));
          return;
        }
      }
      
      if (parsed) {
        const encryptionInfo = detectEncryption(parsed.data);
        parsed.isEncrypted = encryptionInfo.isEncrypted;
        parsed.encryptionType = encryptionInfo.type;
        resolve(parsed);
      }
    });
  });
}

function extractFirmwareInfo(fileName, fileData) {
  let version = '1.0.0';
  let hardwareModel = 'unknown';
  
  const versionMatch = fileName.match(/v?(\d+\.\d+\.\d+)/i);
  if (versionMatch) {
    version = versionMatch[1];
  } else {
    const altVersionMatch = fileName.match(/v?(\d+\.\d+)/i);
    if (altVersionMatch) {
      version = altVersionMatch[1];
    }
  }
  
  const modelPatterns = [
    /(STM32[FHLG][0-9][0-9][A-Z0-9]*)/i,
    /(ESP32[-_A-Z0-9]*)/i,
    /(ESP8266[-_A-Z0-9]*)/i,
    /(ATmega[0-9]+)/i,
    /(PIC[0-9]+[A-Z]*)/i,
    /(ARM[A-Z0-9]*)/i,
    /(AVR[A-Z0-9]*)/i,
    /(GD32[A-Z0-9]*)/i,
    /(CH32[A-Z0-9]*)/i,
    /(nRF5[12][A-Z0-9]*)/i
  ];
  
  for (const pattern of modelPatterns) {
    const match = fileName.match(pattern);
    if (match) {
      hardwareModel = match[1].toUpperCase();
      break;
    }
  }
  
  return { version, hardwareModel };
}

async function parseFirmwareFile(filePath, originalName) {
  ensureUploadDir();
  
  const ext = path.extname(originalName).toLowerCase();
  let parsedData;
  
  if (ext === '.bin') {
    parsedData = await parseBinFile(filePath);
  } else if (ext === '.hex') {
    parsedData = await parseHexFile(filePath);
  } else {
    throw new Error('不支持的文件格式，仅支持 BIN 和 HEX 文件');
  }
  
  const md5Hash = await calculateMD5(filePath);
  const fileInfo = extractFirmwareInfo(originalName, parsedData.data);
  
  const savedFileName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
  const savedFilePath = path.join(UPLOAD_DIR, savedFileName);
  
  await fs.promises.copyFile(filePath, savedFilePath);
  
  return {
    fileName: originalName,
    savedFileName,
    filePath: savedFilePath,
    fileSize: parsedData.size,
    version: fileInfo.version,
    hardwareModel: fileInfo.hardwareModel,
    md5Hash,
    fileType: parsedData.type,
    startAddress: parsedData.startAddress,
    rawData: parsedData.data,
    isEncrypted: parsedData.isEncrypted,
    encryptionType: parsedData.encryptionType,
    parseMethod: parsedData.parseMethod,
    warnings: parsedData.warnings || []
  };
}

async function getFirmwareData(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.bin') {
    return await parseBinFile(filePath);
  } else if (ext === '.hex') {
    return await parseHexFile(filePath);
  }
  
  throw new Error('不支持的文件格式');
}

function deleteFirmwareFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  parseFirmwareFile,
  getFirmwareData,
  deleteFirmwareFile,
  calculateMD5,
  detectEncryption,
  robustHexParse
};
