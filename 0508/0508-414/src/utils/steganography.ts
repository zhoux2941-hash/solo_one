const END_MARKER = [0x00, 0x00, 0x03];
const END_MARKER_LENGTH = END_MARKER.length;

export interface CapacityInfo {
  maxChars: number;
  totalBits: number;
  usedBits: number;
}

export function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

export function bytesToString(bytes: number[]): string {
  return String.fromCharCode(...bytes);
}

export function xorEncrypt(bytes: number[], key: string): number[] {
  const keyBytes = stringToBytes(key);
  if (keyBytes.length === 0) return bytes;
  
  return bytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
}

export function xorDecrypt(bytes: number[], key: string): number[] {
  return xorEncrypt(bytes, key);
}

export function calculateCapacity(imageData: ImageData): CapacityInfo {
  const totalPixels = imageData.width * imageData.height;
  const totalBits = totalPixels * 3;
  const maxBytes = Math.floor(totalBits / 8);
  const maxChars = maxBytes - END_MARKER_LENGTH;
  
  return {
    maxChars,
    totalBits,
    usedBits: 0,
  };
}

export function encodeMessage(
  imageData: ImageData,
  message: string,
  key?: string
): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);
  
  let messageBytes = stringToBytes(message);
  
  messageBytes.push(...END_MARKER);
  
  if (key && key.length > 0) {
    messageBytes = xorEncrypt(messageBytes, key);
  }
  
  const capacity = calculateCapacity(imageData);
  if (messageBytes.length > capacity.maxChars + END_MARKER_LENGTH) {
    throw new Error(`消息太长！最大容量: ${capacity.maxChars} 字符`);
  }
  
  let bitIndex = 0;
  
  for (let i = 0; i < messageBytes.length; i++) {
    const byte = messageBytes[i];
    
    for (let bit = 7; bit >= 0; bit--) {
      const pixelIndex = Math.floor(bitIndex / 3);
      const channelIndex = bitIndex % 3;
      const dataIndex = pixelIndex * 4 + channelIndex;
      
      if (dataIndex >= newData.length) {
        throw new Error('图片容量不足');
      }
      
      const messageBit = (byte >> bit) & 1;
      
      if (messageBit === 1) {
        newData[dataIndex] = newData[dataIndex] | 1;
      } else {
        newData[dataIndex] = newData[dataIndex] & 0xfe;
      }
      
      bitIndex++;
    }
  }
  
  return new ImageData(newData, width, height);
}

export function decodeMessage(
  imageData: ImageData,
  key?: string
): string {
  const { data } = imageData;
  const bytes: number[] = [];
  
  let currentByte = 0;
  let bitCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i % 4 === 3) continue;
    
    const bit = data[i] & 1;
    currentByte = (currentByte << 1) | bit;
    bitCount++;
    
    if (bitCount === 8) {
      bytes.push(currentByte);
      currentByte = 0;
      bitCount = 0;
    }
  }
  
  let processedBytes = bytes;
  if (key && key.length > 0) {
    processedBytes = xorDecrypt(bytes, key);
  }
  
  for (let i = 0; i <= processedBytes.length - END_MARKER_LENGTH; i++) {
    let isMatch = true;
    for (let j = 0; j < END_MARKER_LENGTH; j++) {
      if (processedBytes[i + j] !== END_MARKER[j]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      processedBytes = processedBytes.slice(0, i);
      break;
    }
  }
  
  return bytesToString(processedBytes);
}

export function getUsedBits(message: string, key?: string): number {
  let messageBytes = stringToBytes(message);
  if (key && key.length > 0) {
    messageBytes = xorEncrypt(messageBytes, key);
  }
  return (messageBytes.length + END_MARKER_LENGTH) * 8;
}
