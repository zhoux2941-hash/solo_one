export function formatProbability(value: number): string {
  return (value * 100).toFixed(2) + '%';
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('zh-CN');
}

export function formatDecimal(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}
