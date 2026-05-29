import type { IpResult, SubnetInfo, SubnettingResult, SubnetRequest } from '@/utils/IpCalculator';

export { IpResult, SubnetInfo, SubnettingResult, SubnetRequest };

export type TabType = 'ipv4' | 'ipv6' | 'subnet';

export type SubnetMode = 'count' | 'hosts' | 'custom';

export interface ReservedRange {
  range: string;
  cidr: string;
  name: string;
  description: string;
  type: 'private' | 'loopback' | 'link-local' | 'documentation' | 'multicast' | 'broadcast' | 'reserved';
}

export interface CommonMask {
  cidr: number;
  mask: string;
  hosts: number;
}