export async function computeSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeMD5(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeSegmentHash(
  fileBuffer: ArrayBuffer,
  offset: bigint,
  size: bigint
): Promise<{ sha256: string; sha1: string } | null> {
  const startOffset = Number(offset);
  const segmentSize = Number(size);

  if (segmentSize === 0) {
    return null;
  }

  if (startOffset + segmentSize > fileBuffer.byteLength) {
    return null;
  }

  const segmentBuffer = fileBuffer.slice(startOffset, startOffset + segmentSize);

  const sha256 = await computeSHA256(segmentBuffer);
  const sha1 = await computeMD5(segmentBuffer);

  return { sha256, sha1 };
}

export function formatHashShort(hash: string, length: number = 12): string {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`;
}
