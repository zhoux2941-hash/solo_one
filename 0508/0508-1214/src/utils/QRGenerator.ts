import QRCode from 'qrcode'

export type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

export interface QRGeneratorOptions {
  text: string
  size: number
  errorLevel: ErrorLevel
  foregroundColor: string
  backgroundColor: string
  roundedCorners: boolean
  logo?: string
}

const HIGH_CONTRAST_COLOR_PAIRS: Array<{ foreground: string; background: string }> = [
  { foreground: '#000000', background: '#ffffff' },
  { foreground: '#ffffff', background: '#000000' },
  { foreground: '#1a1a1a', background: '#f5f5f5' },
  { foreground: '#f5f5f5', background: '#1a1a1a' },
  { foreground: '#1e3a5f', background: '#ffffff' },
  { foreground: '#ffffff', background: '#1e3a5f' },
  { foreground: '#8b0000', background: '#ffffff' },
  { foreground: '#ffffff', background: '#8b0000' },
  { foreground: '#2d5016', background: '#ffffff' },
  { foreground: '#ffffff', background: '#2d5016' },
  { foreground: '#000080', background: '#ffffff' },
  { foreground: '#ffffff', background: '#000080' },
  { foreground: '#800080', background: '#ffffff' },
  { foreground: '#ffffff', background: '#800080' },
]

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return 1

  const luminance1 = 0.2126 * rgb1.r + 0.7152 * rgb1.g + 0.0722 * rgb1.b
  const luminance2 = 0.2126 * rgb2.r + 0.7152 * rgb2.g + 0.0722 * rgb2.b

  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)

  return (lighter + 0.05) / (darker + 0.05)
}

export function isHighContrast(foreground: string, background: string): boolean {
  const ratio = calculateContrastRatio(foreground, background)
  return ratio >= 4.5
}

export function isWhitelistedColorPair(foreground: string, background: string): boolean {
  const normalizedFg = foreground.toLowerCase()
  const normalizedBg = background.toLowerCase()

  return HIGH_CONTRAST_COLOR_PAIRS.some(
    (pair) =>
      (pair.foreground === normalizedFg && pair.background === normalizedBg) ||
      (pair.foreground === normalizedBg && pair.background === normalizedFg)
  )
}

export function getContrastWarning(foreground: string, background: string): string | null {
  if (!isHighContrast(foreground, background)) {
    return '警告：前景色与背景色对比度不足，可能影响二维码扫描识别'
  }
  if (!isWhitelistedColorPair(foreground, background)) {
    return '提示：该颜色组合未在推荐白名单中，建议使用高对比度颜色'
  }
  return null
}

export async function generateQRCode(options: QRGeneratorOptions): Promise<string> {
  const canvas = document.createElement('canvas')

  await QRCode.toCanvas(canvas, options.text, {
    width: options.size,
    margin: 2,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor,
    },
    errorCorrectionLevel: options.errorLevel,
  })

  if (options.roundedCorners) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      roundCorners(ctx, options.size, options.size, options.size / 46, options.foregroundColor)
    }
  }

  if (options.logo) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      await addLogo(ctx, canvas, options.logo, options.size)
    }
  }

  return canvas.toDataURL('image/png')
}

function roundCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
  foregroundColor: string
): void {
  const cornerRadius = cellSize * 0.35
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      if (x + cellSize <= width && y + cellSize <= height) {
        let isDark = false
        for (let dy = 0; dy < cellSize && !isDark; dy++) {
          for (let dx = 0; dx < cellSize && !isDark; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4
            if (data[idx] < 128) {
              isDark = true
            }
          }
        }

        if (isDark) {
          ctx.clearRect(x, y, cellSize, cellSize)
          ctx.fillStyle = foregroundColor
          ctx.beginPath()
          ctx.roundRect(x, y, cellSize, cellSize, cornerRadius)
          ctx.fill()
        }
      }
    }
  }
}

async function addLogo(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  logoSrc: string,
  size: number
): Promise<void> {
  const img = new Image()
  img.src = logoSrc

  await new Promise((resolve) => {
    img.onload = resolve
    img.onerror = resolve
  })

  const logoSize = size * 0.2
  const logoX = (size - logoSize) / 2
  const logoY = (size - logoSize) / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
  ctx.restore()
}

export function generateQRCodeToCanvas(
  canvas: HTMLCanvasElement,
  options: QRGeneratorOptions
): Promise<void> {
  return new Promise(async (resolve) => {
    await QRCode.toCanvas(canvas, options.text, {
      width: options.size,
      margin: 2,
      color: {
        dark: options.foregroundColor,
        light: options.backgroundColor,
      },
      errorCorrectionLevel: options.errorLevel,
    })

    if (options.roundedCorners) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        roundCorners(ctx, options.size, options.size, options.size / 46, options.foregroundColor)
      }
    }

    if (options.logo) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        await addLogo(ctx, canvas, options.logo, options.size)
      }
    }

    resolve()
  })
}
