import type { IpResult } from './IpCalculator';
import { isValidIPv4, isValidSubnetMask, isValidCidr } from './validation';

export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function cidrToMask(cidr: number): string {
  if (!isValidCidr(cidr)) throw new Error('Invalid CIDR');
  if (cidr === 0) return '0.0.0.0';
  const mask = (0xffffffff << (32 - cidr)) >>> 0;
  return intToIp(mask);
}

export function maskToCidr(mask: string): number {
  if (!isValidSubnetMask(mask)) throw new Error('Invalid subnet mask');
  const binary = mask.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('');
  return binary.replace(/0/g, '').length;
}

export function getNetworkAddress(ip: string, mask: string): string {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(mask);
  return intToIp(ipInt & maskInt);
}

export function getBroadcastAddress(ip: string, mask: string): string {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(mask);
  const wildcard = ~maskInt >>> 0;
  return intToIp((ipInt & maskInt) | wildcard);
}

export function getFirstUsableHost(network: string, cidr: number): string {
  if (cidr >= 31) return network;
  return intToIp(ipToInt(network) + 1);
}

export function getLastUsableHost(broadcast: string, cidr: number): string {
  if (cidr >= 31) return broadcast;
  return intToIp(ipToInt(broadcast) - 1);
}

export function getUsableHosts(cidr: number): number {
  if (cidr >= 32) return 1;
  if (cidr === 31) return 2;
  return Math.pow(2, 32 - cidr) - 2;
}

export function getWildcardMask(mask: string): string {
  const maskInt = ipToInt(mask);
  return intToIp(~maskInt >>> 0);
}

export function getIpClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0], 10);
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)';
  return 'Unknown';
}

export function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

export function toBinary(ip: string): string {
  return ip.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('.');
}

export function calculateIPv4(ip: string, maskInput: string | number): IpResult {
  if (!isValidIPv4(ip)) throw new Error('Invalid IPv4 address');

  let subnetMask: string;
  let cidr: number;

  if (typeof maskInput === 'number') {
    if (!isValidCidr(maskInput)) throw new Error('Invalid CIDR');
    cidr = maskInput;
    subnetMask = cidrToMask(cidr);
  } else {
    if (!isValidSubnetMask(maskInput)) throw new Error('Invalid subnet mask');
    subnetMask = maskInput;
    cidr = maskToCidr(subnetMask);
  }

  const networkAddress = getNetworkAddress(ip, subnetMask);
  const broadcastAddress = getBroadcastAddress(ip, subnetMask);
  const firstUsableHost = getFirstUsableHost(networkAddress, cidr);
  const lastUsableHost = getLastUsableHost(broadcastAddress, cidr);
  const usableHosts = getUsableHosts(cidr);
  const wildcardMask = getWildcardMask(subnetMask);
  const ipClass = getIpClass(ip);
  const isPrivate = isPrivateIp(ip);

  return {
    ipAddress: ip,
    version: 4,
    subnetMask,
    prefixLength: cidr,
    networkAddress,
    broadcastAddress,
    firstUsableHost,
    lastUsableHost,
    usableHostRange: `${firstUsableHost} - ${lastUsableHost}`,
    usableHosts: BigInt(usableHosts),
    wildcardMask,
    ipClass,
    isPrivate,
    binaryRepresentation: {
      ip: toBinary(ip),
      mask: toBinary(subnetMask),
      network: toBinary(networkAddress)
    }
  };
}

export const COMMON_MASKS = [
  { cidr: 8, mask: '255.0.0.0' },
  { cidr: 16, mask: '255.255.0.0' },
  { cidr: 24, mask: '255.255.255.0' },
  { cidr: 25, mask: '255.255.255.128' },
  { cidr: 26, mask: '255.255.255.192' },
  { cidr: 27, mask: '255.255.255.224' },
  { cidr: 28, mask: '255.255.255.240' },
  { cidr: 29, mask: '255.255.255.248' },
  { cidr: 30, mask: '255.255.255.252' },
  { cidr: 31, mask: '255.255.255.254' },
  { cidr: 32, mask: '255.255.255.255' },
];

export interface ReservedRange {
  range: string;
  cidr: string;
  name: string;
  description: string;
  type: 'private' | 'loopback' | 'link-local' | 'documentation' | 'multicast' | 'broadcast' | 'reserved';
}

export const RESERVED_IP_RANGES: ReservedRange[] = [
  {
    range: '0.0.0.0/8',
    cidr: '0.0.0.0/8',
    name: '当前网络',
    description: '用于表示当前网络，仅限源地址使用',
    type: 'reserved'
  },
  {
    range: '10.0.0.0/8',
    cidr: '10.0.0.0/8',
    name: '私有地址 (A类)',
    description: 'RFC 1918 定义的私有网络地址段，可用于内部局域网',
    type: 'private'
  },
  {
    range: '100.64.0.0/10',
    cidr: '100.64.0.0/10',
    name: '共享地址空间',
    description: 'RFC 6598 定义的运营商级NAT地址段',
    type: 'reserved'
  },
  {
    range: '127.0.0.0/8',
    cidr: '127.0.0.0/8',
    name: '回环地址',
    description: '用于本地主机回环测试，数据不会离开本机',
    type: 'loopback'
  },
  {
    range: '169.254.0.0/16',
    cidr: '169.254.0.0/16',
    name: '链路本地地址',
    description: 'DHCP失败时自动分配的本地链路地址',
    type: 'link-local'
  },
  {
    range: '172.16.0.0/12',
    cidr: '172.16.0.0/12',
    name: '私有地址 (B类)',
    description: 'RFC 1918 定义的私有网络地址段，可用于内部局域网',
    type: 'private'
  },
  {
    range: '192.0.0.0/24',
    cidr: '192.0.0.0/24',
    name: 'IETF协议保留',
    description: 'IETF协议分配保留地址段',
    type: 'reserved'
  },
  {
    range: '192.0.2.0/24',
    cidr: '192.0.2.0/24',
    name: '文档和示例 (TEST-NET-1)',
    description: 'RFC 5737 定义的用于文档和示例的地址段',
    type: 'documentation'
  },
  {
    range: '192.88.99.0/24',
    cidr: '192.88.99.0/24',
    name: '6to4中继',
    description: '用于6to4隧道中继的任播地址',
    type: 'reserved'
  },
  {
    range: '192.168.0.0/16',
    cidr: '192.168.0.0/16',
    name: '私有地址 (C类)',
    description: 'RFC 1918 定义的私有网络地址段，最常用的家庭网络地址段',
    type: 'private'
  },
  {
    range: '198.18.0.0/15',
    cidr: '198.18.0.0/15',
    name: '基准测试',
    description: 'RFC 2544 定义的网络设备基准测试地址段',
    type: 'reserved'
  },
  {
    range: '198.51.100.0/24',
    cidr: '198.51.100.0/24',
    name: '文档和示例 (TEST-NET-2)',
    description: 'RFC 5737 定义的用于文档和示例的地址段',
    type: 'documentation'
  },
  {
    range: '203.0.113.0/24',
    cidr: '203.0.113.0/24',
    name: '文档和示例 (TEST-NET-3)',
    description: 'RFC 5737 定义的用于文档和示例的地址段',
    type: 'documentation'
  },
  {
    range: '224.0.0.0/4',
    cidr: '224.0.0.0/4',
    name: '组播地址',
    description: 'RFC 3171 定义的IPv4组播地址段',
    type: 'multicast'
  },
  {
    range: '240.0.0.0/4',
    cidr: '240.0.0.0/4',
    name: '保留地址',
    description: 'RFC 1112 定义的保留地址段，用于未来使用',
    type: 'reserved'
  },
  {
    range: '255.255.255.255/32',
    cidr: '255.255.255.255/32',
    name: '受限广播',
    description: '用于本地网段的受限广播地址',
    type: 'broadcast'
  }
];

export function isIpInRange(ip: string, range: string): boolean {
  const [rangeIp, cidrStr] = range.split('/');
  const cidr = parseInt(cidrStr, 10);
  const ipInt = ipToInt(ip);
  const rangeIpInt = ipToInt(rangeIp);
  const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  return (ipInt & mask) === (rangeIpInt & mask);
}

export function getReservedRangesForIp(ip: string): ReservedRange[] {
  return RESERVED_IP_RANGES.filter(range => isIpInRange(ip, range.range));
}

export function getReservedRangeTypeInfo(type: ReservedRange['type']) {
  const typeInfo = {
    'private': { label: '私有网络', color: 'emerald', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    'loopback': { label: '回环地址', color: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800' },
    'link-local': { label: '链路本地', color: 'orange', bgColor: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-700 dark:text-orange-300', borderColor: 'border-orange-200 dark:border-orange-800' },
    'documentation': { label: '文档示例', color: 'purple', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' },
    'multicast': { label: '组播地址', color: 'pink', bgColor: 'bg-pink-50 dark:bg-pink-900/20', textColor: 'text-pink-700 dark:text-pink-300', borderColor: 'border-pink-200 dark:border-pink-800' },
    'broadcast': { label: '广播地址', color: 'red', bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-700 dark:text-red-300', borderColor: 'border-red-200 dark:border-red-800' },
    'reserved': { label: '保留地址', color: 'slate', bgColor: 'bg-slate-50 dark:bg-slate-800/50', textColor: 'text-slate-700 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' }
  };
  return typeInfo[type];
}
