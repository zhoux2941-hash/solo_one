import type { Danmaku, TimeDistribution } from '../types';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateTimeDistribution(
  danmakuList: Danmaku[],
  bucketSize: number = 30
): TimeDistribution[] {
  if (danmakuList.length === 0) return [];

  const maxTime = Math.max(...danmakuList.map((d) => d.time));
  const bucketCount = Math.ceil(maxTime / bucketSize) + 1;

  const distribution: TimeDistribution[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = i * bucketSize;
    const bucketEnd = (i + 1) * bucketSize;

    const count = danmakuList.filter(
      (d) => d.time >= bucketStart && d.time < bucketEnd
    ).length;

    distribution.push({
      bucket: bucketStart,
      label: formatTime(bucketStart),
      count,
    });
  }

  return distribution;
}
