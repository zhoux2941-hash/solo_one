const DISK_COLORS = [
  '#FF6B6B',
  '#FF8E53',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#6F69AC',
  '#9B59B6',
  '#E91E63'
];

export function getDiskColor(size: number, totalDisks: number): string {
  const index = (size - 1) % DISK_COLORS.length;
  return DISK_COLORS[index];
}

export function generateDiskColors(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(DISK_COLORS[i % DISK_COLORS.length]);
  }
  return colors;
}

export function getSpeedDuration(speed: 'slow' | 'medium' | 'fast'): number {
  switch (speed) {
    case 'slow':
      return 1000;
    case 'medium':
      return 500;
    case 'fast':
      return 200;
    default:
      return 500;
  }
}
