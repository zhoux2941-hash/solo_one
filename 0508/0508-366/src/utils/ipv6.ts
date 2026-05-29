import type { IpResult } from './IpCalculator';
import { isValidIPv6, isValidIPv6Cidr } from './validation';

export function expandIPv6(ip: string): string {
  if (ip.includes('::')) {
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const full = [...left, ...Array(missing).fill('0000'), ...right];
    return full.map(p => p.padStart(4, '0')).join(':');
  }
  return ip.split(':').map(p => p.padStart(4, '0')).join(':');
}

export function compressIPv6(ip: string): string {
  const expanded = expandIPv6(ip);
  const parts = expanded.split(':').map(p => p.replace(/^0+/, '') || '0');
  
  let maxZeroStart = -1;
  let maxZeroLen = 0;
  let currentStart = -1;
  let currentLen = 0;
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
        currentLen = 1;
      } else {
        currentLen++;
      }
      if (currentLen > maxZeroLen) {
        maxZeroLen = currentLen;
        maxZeroStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  }
  
  if (maxZeroLen > 1) {
    const before = parts.slice(0, maxZeroStart);
    const after = parts.slice(maxZeroStart + maxZeroLen);
    if (before.length === 0 && after.length === 0) return '::';
    if (before.length === 0) return `::${after.join(':')}`;
    if (after.length === 0) return `${before.join(':')}::`;
    return `${before.join(':')}::${after.join(':')}`;
  }
  
  return parts.join(':');
}

export function ipv6ToBigInt(ip: string): bigint {
  const expanded = expandIPv6(ip);
  const parts = expanded.split(':');
  let result = BigInt(0);
  for (let i = 0; i < 8; i++) {
    result = (result << BigInt(16)) | BigInt(parseInt(parts[i], 16));
  }
  return result;
}

export function bigIntToIPv6(num: bigint): string {
  const parts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const part = (num >> BigInt(16 * (7 - i))) & BigInt(0xffff);
    parts.push(part.toString(16).padStart(4, '0'));
  }
  return compressIPv6(parts.join(':'));
}

export function getIPv6NetworkAddress(ip: string, prefix: number): string {
  const ipNum = ipv6ToBigInt(ip);
  const mask = prefix === 0 ? BigInt(0) : (BigInt(-1) << BigInt(128 - prefix));
  return bigIntToIPv6(ipNum & mask);
}

export function getIPv6NetworkSize(prefix: number): bigint {
  return BigInt(2) ** BigInt(128 - prefix);
}

export function isLinkLocalIPv6(ip: string): boolean {
  const expanded = expandIPv6(ip);
  return expanded.startsWith('fe80:');
}

export function isUniqueLocalIPv6(ip: string): boolean {
  const expanded = expandIPv6(ip);
  const firstPart = parseInt(expanded.substring(0, 2), 16);
  return (firstPart & 0xfe) === 0xfc;
}

export function isGlobalUnicastIPv6(ip: string): boolean {
  const expanded = expandIPv6(ip);
  const firstPart = parseInt(expanded.substring(0, 2), 16);
  return (firstPart & 0xe0) === 0x20;
}

export function calculateIPv6(ip: string, prefix: number): IpResult {
  if (!isValidIPv6(ip)) throw new Error('Invalid IPv6 address');
  if (!isValidIPv6Cidr(prefix)) throw new Error('Invalid prefix length');

  const expanded = expandIPv6(ip);
  const compressed = compressIPv6(ip);
  const networkAddress = getIPv6NetworkAddress(ip, prefix);
  const networkSize = getIPv6NetworkSize(prefix);

  return {
    ipAddress: ip,
    compressed,
    expanded,
    prefixLength: prefix,
    networkAddress,
    networkSize,
    isLinkLocal: isLinkLocalIPv6(ip),
    isUniqueLocal: isUniqueLocalIPv6(ip),
    isGlobalUnicast: isGlobalUnicastIPv6(ip),
  } as unknown as IpResult;
}

export function formatNetworkSize(size: bigint): string {
  if (size < BigInt(1000)) return size.toString();
  if (size < BigInt(1000000)) return `${(Number(size) / 1000).toFixed(2)}K`;
  if (size < BigInt(1000000000)) return `${(Number(size) / 1000000).toFixed(2)}M`;
  if (size < BigInt('1000000000000')) return `${(Number(size) / 1000000000).toFixed(2)}B`;
  return `2^${128 - Math.log2(Number(size))}`;
}
