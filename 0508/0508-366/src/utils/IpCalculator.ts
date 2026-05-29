export interface IpResult {
  ipAddress: string;
  version: 4 | 6;
  prefixLength: number;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  usableHostRange: string;
  usableHosts: bigint;
  subnetMask: string;
  wildcardMask: string;
  ipClass?: string;
  isPrivate: boolean;
  binaryRepresentation: {
    ip: string;
    mask: string;
    network: string;
  };
  ipv6Info?: {
    compressed: string;
    expanded: string;
    networkSize: bigint;
    isLinkLocal: boolean;
    isUniqueLocal: boolean;
    isGlobalUnicast: boolean;
  };
}

export interface SubnetInfo {
  index: number;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  usableHostRange: string;
  usableHosts: bigint;
  subnetMask: string;
  prefixLength: number;
  size: bigint;
}

export interface SubnettingResult {
  originalNetwork: string;
  originalMask: string;
  originalPrefix: number;
  subnets: SubnetInfo[];
  remainingRanges: { networkAddress: string; prefixLength: number; size: bigint }[];
}

export interface SubnetRequest {
  prefixLength: number;
  count?: number;
  label?: string;
}

export class IpCalculator {
  private static readonly IPV4_MAX = BigInt('4294967295');
  private static readonly IPV6_MAX = (BigInt(1) << BigInt(128)) - BigInt(1);

  static isValidIp(ip: string): boolean {
    return this.isValidIPv4(ip) || this.isValidIPv6(ip);
  }

  static isValidIPv4(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
  }

  static isValidIPv6(ip: string): boolean {
    if (ip.includes('::')) {
      const parts = ip.split('::');
      if (parts.length > 2) return false;
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const total = left.length + right.length;
      if (total > 8) return false;
      return [...left, ...right].every(part => /^[0-9a-fA-F]{1,4}$/.test(part));
    } else {
      const parts = ip.split(':');
      if (parts.length !== 8) return false;
      return parts.every(part => /^[0-9a-fA-F]{1,4}$/.test(part));
    }
  }

  static isValidPrefix(prefix: number, version: 4 | 6 = 4): boolean {
    if (isNaN(prefix) || prefix < 0) return false;
    return version === 4 ? prefix <= 32 : prefix <= 128;
  }

  static isValidSubnetMask(mask: string): boolean {
    if (!this.isValidIPv4(mask)) return false;
    const binary = mask.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('');
    let foundZero = false;
    for (const bit of binary) {
      if (bit === '0') {
        foundZero = true;
      } else if (foundZero) {
        return false;
      }
    }
    return true;
  }

  static getIpVersion(ip: string): 4 | 6 {
    return this.isValidIPv4(ip) ? 4 : 6;
  }

  static ipv4ToBigInt(ip: string): bigint {
    return ip.split('.').reduce((acc, octet) => 
      (acc << BigInt(8)) | BigInt(parseInt(octet, 10)), BigInt(0));
  }

  static bigIntToIPv4(num: bigint): string {
    return [
      Number((num >> BigInt(24)) & BigInt(255)),
      Number((num >> BigInt(16)) & BigInt(255)),
      Number((num >> BigInt(8)) & BigInt(255)),
      Number(num & BigInt(255))
    ].join('.');
  }

  static expandIPv6(ip: string): string {
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

  static compressIPv6(ip: string): string {
    const expanded = this.expandIPv6(ip);
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

  static ipv6ToBigInt(ip: string): bigint {
    const expanded = this.expandIPv6(ip);
    const parts = expanded.split(':');
    let result = BigInt(0);
    for (let i = 0; i < 8; i++) {
      result = (result << BigInt(16)) | BigInt(parseInt(parts[i], 16));
    }
    return result;
  }

  static bigIntToIPv6(num: bigint): string {
    const parts: string[] = [];
    for (let i = 0; i < 8; i++) {
      const part = (num >> BigInt(16 * (7 - i))) & BigInt(0xffff);
      parts.push(part.toString(16).padStart(4, '0'));
    }
    return this.compressIPv6(parts.join(':'));
  }

  static ipToBigInt(ip: string): bigint {
    return this.getIpVersion(ip) === 4 ? this.ipv4ToBigInt(ip) : this.ipv6ToBigInt(ip);
  }

  static bigIntToIp(num: bigint, version: 4 | 6): string {
    return version === 4 ? this.bigIntToIPv4(num) : this.bigIntToIPv6(num);
  }

  static getMaxAddress(version: 4 | 6): bigint {
    return version === 4 ? this.IPV4_MAX : this.IPV6_MAX;
  }

  static getAddressCount(prefixLength: number, version: 4 | 6): bigint {
    const totalBits = version === 4 ? 32 : 128;
    return BigInt(1) << BigInt(totalBits - prefixLength);
  }

  static getNetworkAddress(ip: string, prefixLength: number): string {
    const version = this.getIpVersion(ip);
    const ipNum = this.ipToBigInt(ip);
    const totalBits = version === 4 ? 32 : 128;
    const mask = prefixLength === 0 ? BigInt(0) : 
      (this.getMaxAddress(version) << BigInt(totalBits - prefixLength)) & this.getMaxAddress(version);
    return this.bigIntToIp(ipNum & mask, version);
  }

  static getBroadcastAddress(ip: string, prefixLength: number): string {
    const version = this.getIpVersion(ip);
    const network = this.ipToBigInt(this.getNetworkAddress(ip, prefixLength));
    const size = this.getAddressCount(prefixLength, version);
    return this.bigIntToIp(network + size - BigInt(1), version);
  }

  static getFirstUsableHost(network: string, prefixLength: number, version: 4 | 6): string {
    if (prefixLength >= (version === 4 ? 31 : 127)) return network;
    return this.bigIntToIp(this.ipToBigInt(network) + BigInt(1), version);
  }

  static getLastUsableHost(broadcast: string, prefixLength: number, version: 4 | 6): string {
    if (prefixLength >= (version === 4 ? 31 : 127)) return broadcast;
    return this.bigIntToIp(this.ipToBigInt(broadcast) - BigInt(1), version);
  }

  static getUsableHosts(prefixLength: number, version: 4 | 6): bigint {
    const total = this.getAddressCount(prefixLength, version);
    if (prefixLength >= (version === 4 ? 32 : 128)) return BigInt(1);
    if (prefixLength === (version === 4 ? 31 : 127)) return BigInt(2);
    return total - BigInt(2);
  }

  static getSubnetMask(prefixLength: number, version: 4 | 6): string {
    const totalBits = version === 4 ? 32 : 128;
    const mask = prefixLength === 0 ? BigInt(0) : 
      (this.getMaxAddress(version) << BigInt(totalBits - prefixLength)) & this.getMaxAddress(version);
    return this.bigIntToIp(mask, version);
  }

  static getWildcardMask(prefixLength: number, version: 4 | 6): string {
    const mask = this.ipToBigInt(this.getSubnetMask(prefixLength, version));
    return this.bigIntToIp(~mask & this.getMaxAddress(version), version);
  }

  static toBinary(ip: string): string {
    const version = this.getIpVersion(ip);
    if (version === 4) {
      return ip.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('.');
    }
    const expanded = this.expandIPv6(ip);
    return expanded.split(':').map(g => 
      parseInt(g, 16).toString(2).padStart(16, '0')
    ).join(':');
  }

  static getIpClass(ip: string): string {
    if (this.getIpVersion(ip) !== 4) return 'N/A';
    const firstOctet = parseInt(ip.split('.')[0], 10);
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
    if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)';
    return 'Unknown';
  }

  static isPrivateIp(ip: string): boolean {
    const version = this.getIpVersion(ip);
    if (version === 4) {
      const parts = ip.split('.').map(Number);
      const [a, b] = parts;
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 127) return true;
      if (a === 169 && b === 254) return true;
      return false;
    } else {
      return this.isLinkLocalIPv6(ip) || this.isUniqueLocalIPv6(ip);
    }
  }

  static isLinkLocalIPv6(ip: string): boolean {
    const expanded = this.expandIPv6(ip);
    return expanded.startsWith('fe80:');
  }

  static isUniqueLocalIPv6(ip: string): boolean {
    const expanded = this.expandIPv6(ip);
    const firstPart = parseInt(expanded.substring(0, 2), 16);
    return (firstPart & 0xfe) === 0xfc;
  }

  static isGlobalUnicastIPv6(ip: string): boolean {
    const expanded = this.expandIPv6(ip);
    const firstPart = parseInt(expanded.substring(0, 2), 16);
    return (firstPart & 0xe0) === 0x20;
  }

  static parseCidrInput(input: string): { ip: string; prefix: number | null } {
    const slashIndex = input.indexOf('/');
    if (slashIndex === -1) {
      return { ip: input.trim(), prefix: null };
    }
    const ip = input.substring(0, slashIndex).trim();
    const prefixStr = input.substring(slashIndex + 1).trim();
    const prefix = parseInt(prefixStr, 10);
    return { ip, prefix: isNaN(prefix) ? null : prefix };
  }

  static calculate(ip: string, prefixLength: number): IpResult {
    const version = this.getIpVersion(ip);
    if (!this.isValidPrefix(prefixLength, version)) {
      throw new Error(`Invalid prefix length for IPv${version}`);
    }

    const networkAddress = this.getNetworkAddress(ip, prefixLength);
    const broadcastAddress = this.getBroadcastAddress(ip, prefixLength);
    const firstUsableHost = this.getFirstUsableHost(networkAddress, prefixLength, version);
    const lastUsableHost = this.getLastUsableHost(broadcastAddress, prefixLength, version);
    const usableHosts = this.getUsableHosts(prefixLength, version);
    const subnetMask = this.getSubnetMask(prefixLength, version);
    const wildcardMask = this.getWildcardMask(prefixLength, version);
    const isPrivate = this.isPrivateIp(ip);

    const result: IpResult = {
      ipAddress: ip,
      version,
      prefixLength,
      networkAddress,
      broadcastAddress,
      firstUsableHost,
      lastUsableHost,
      usableHostRange: `${firstUsableHost} - ${lastUsableHost}`,
      usableHosts,
      subnetMask,
      wildcardMask,
      isPrivate,
      binaryRepresentation: {
        ip: this.toBinary(ip),
        mask: this.toBinary(subnetMask),
        network: this.toBinary(networkAddress)
      }
    };

    if (version === 4) {
      result.ipClass = this.getIpClass(ip);
    } else {
      result.ipv6Info = {
        compressed: this.compressIPv6(ip),
        expanded: this.expandIPv6(ip),
        networkSize: this.getAddressCount(prefixLength, version),
        isLinkLocal: this.isLinkLocalIPv6(ip),
        isUniqueLocal: this.isUniqueLocalIPv6(ip),
        isGlobalUnicast: this.isGlobalUnicastIPv6(ip),
      };
    }

    return result;
  }

  static subnetRecursive(
    ip: string,
    originalPrefix: number,
    requests: SubnetRequest[],
    maxSubnets: number = 1000
  ): SubnettingResult {
    const version = this.getIpVersion(ip);
    const networkNum = this.ipToBigInt(this.getNetworkAddress(ip, originalPrefix));
    const originalSize = this.getAddressCount(originalPrefix, version);

    const sortedRequests = [...requests].sort((a, b) => 
      Number(this.getAddressCount(b.prefixLength, version) - this.getAddressCount(a.prefixLength, version))
    );

    const subnets: SubnetInfo[] = [];
    let usedSpace = BigInt(0);
    let index = 0;

    for (const request of sortedRequests) {
      const count = request.count || 1;
      const subnetSize = this.getAddressCount(request.prefixLength, version);

      for (let i = 0; i < count && index < maxSubnets; i++) {
        const requiredStart = this.findAlignedStart(
          networkNum + usedSpace, 
          networkNum + originalSize, 
          subnetSize
        );

        if (requiredStart === null) break;

        const networkAddress = this.bigIntToIp(requiredStart, version);
        const broadcastAddress = this.bigIntToIp(requiredStart + subnetSize - BigInt(1), version);
        const firstUsableHost = this.getFirstUsableHost(networkAddress, request.prefixLength, version);
        const lastUsableHost = this.getLastUsableHost(broadcastAddress, request.prefixLength, version);
        const usableHosts = this.getUsableHosts(request.prefixLength, version);

        subnets.push({
          index: ++index,
          networkAddress,
          broadcastAddress,
          firstUsableHost,
          lastUsableHost,
          usableHostRange: `${firstUsableHost} - ${lastUsableHost}`,
          usableHosts,
          subnetMask: this.getSubnetMask(request.prefixLength, version),
          prefixLength: request.prefixLength,
          size: subnetSize
        });

        usedSpace = (requiredStart + subnetSize) - networkNum;
      }
    }

    const remainingRanges: { networkAddress: string; prefixLength: number; size: bigint }[] = [];
    let remainingStart = networkNum + usedSpace;
    const endAddr = networkNum + originalSize;

    while (remainingStart < endAddr) {
      const remainingSize = endAddr - remainingStart;
      const maxPrefix = version === 4 ? 32 : 128;
      let bestPrefix = maxPrefix;
      
      for (let p = originalPrefix; p <= maxPrefix; p++) {
        const size = this.getAddressCount(p, version);
        if (size <= remainingSize && remainingStart % size === BigInt(0)) {
          bestPrefix = p;
        }
      }

      const blockSize = this.getAddressCount(bestPrefix, version);
      remainingRanges.push({
        networkAddress: this.bigIntToIp(remainingStart, version),
        prefixLength: bestPrefix,
        size: blockSize
      });
      remainingStart += blockSize;
    }

    return {
      originalNetwork: this.bigIntToIp(networkNum, version),
      originalMask: this.getSubnetMask(originalPrefix, version),
      originalPrefix,
      subnets,
      remainingRanges
    };
  }

  private static findAlignedStart(
    start: bigint,
    end: bigint,
    alignment: bigint
  ): bigint | null {
    if (start >= end) return null;
    
    const aligned = start % alignment === BigInt(0) 
      ? start 
      : start + (alignment - (start % alignment));
    
    return aligned + alignment <= end ? aligned : null;
  }

  static subnetByCount(
    ip: string,
    originalPrefix: number,
    subnetCount: number,
    maxSubnets: number = 256
  ): SubnettingResult {
    const version = this.getIpVersion(ip);
    const totalBits = version === 4 ? 32 : 128;
    const bitsNeeded = Math.ceil(Math.log2(subnetCount));
    const newPrefix = originalPrefix + bitsNeeded;

    if (newPrefix > (version === 4 ? 30 : 126)) {
      throw new Error('Cannot create requested number of subnets');
    }

    return this.subnetRecursive(ip, originalPrefix, [
      { prefixLength: newPrefix, count: Math.pow(2, bitsNeeded) }
    ], maxSubnets);
  }

  static subnetByHosts(
    ip: string,
    originalPrefix: number,
    hostsPerSubnet: number,
    maxSubnets: number = 256
  ): SubnettingResult {
    const version = this.getIpVersion(ip);
    const totalBits = version === 4 ? 32 : 128;
    const hostBits = Math.ceil(Math.log2(hostsPerSubnet + 2));
    const newPrefix = totalBits - hostBits;

    if (newPrefix < originalPrefix) {
      throw new Error('Requested hosts per subnet exceeds original network capacity');
    }

    const bitsForSubnets = newPrefix - originalPrefix;
    const subnetCount = Math.pow(2, bitsForSubnets);

    return this.subnetRecursive(ip, originalPrefix, [
      { prefixLength: newPrefix, count: subnetCount }
    ], maxSubnets);
  }
}