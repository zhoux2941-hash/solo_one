export function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

export function isValidSubnetMask(mask: string): boolean {
  if (!isValidIPv4(mask)) return false;
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

export function isValidCidr(cidr: number): boolean {
  return !isNaN(cidr) && cidr >= 0 && cidr <= 32;
}

export function isValidIPv6Cidr(cidr: number): boolean {
  return !isNaN(cidr) && cidr >= 0 && cidr <= 128;
}

export function isValidIPv6(ip: string): boolean {
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

export function parseCidrInput(input: string): { ip: string; cidr: number | null } {
  const slashIndex = input.indexOf('/');
  if (slashIndex === -1) {
    return { ip: input.trim(), cidr: null };
  }
  const ip = input.substring(0, slashIndex).trim();
  const cidrStr = input.substring(slashIndex + 1).trim();
  const cidr = parseInt(cidrStr, 10);
  return { ip, cidr: isNaN(cidr) ? null : cidr };
}
