export function gcd(a: number, b: number): number {
  const x = Math.abs(Math.floor(a))
  const y = Math.abs(Math.floor(b))

  if (y === 0) {
    return x
  }

  return gcd(y, x % y)
}

export function simplifyRatio(a: number, b: number): { x: number; y: number; string: string } {
  if (a === 0 && b === 0) {
    return { x: 0, y: 0, string: '0:0' }
  }

  if (a === 0) {
    return { x: 0, y: 1, string: '0:1' }
  }

  if (b === 0) {
    return { x: 1, y: 0, string: '1:0' }
  }

  const divisor = gcd(a, b)
  const x = a / divisor
  const y = b / divisor

  return {
    x,
    y,
    string: `${x}:${y}`
  }
}
