import type { GradientConfig } from '../types/gradient'

export type OutputFormat = 'standard' | 'prefixed' | 'css-variables'

export interface CssOutputOptions {
  format: OutputFormat
  selector?: string
  variableName?: string
}

export class CssOutputService {
  private config: GradientConfig

  constructor(config: GradientConfig) {
    this.config = config
  }

  private getSortedStops(): string {
    const sortedStops = [...this.config.colorStops].sort((a, b) => a.position - b.position)
    
    return sortedStops
      .map(stop => {
        const hex = stop.color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${stop.opacity}) ${stop.position}%`
      })
      .join(', ')
  }

  private getGradientFunction(): string {
    const stops = this.getSortedStops()

    if (this.config.type === 'linear') {
      const direction = this.config.linearDirection === 'angle'
        ? `${this.config.angle}deg`
        : this.config.linearDirection
      return `linear-gradient(${direction}, ${stops})`
    } else {
      const shape = this.config.radialShape
      const size = this.config.radialSize
      return `radial-gradient(${shape} ${size}, ${stops})`
    }
  }

  private getGradientFunctionWithPrefixes(): string[] {
    const gradient = this.getGradientFunction()
    const baseFunc = gradient.split('(')[0]
    const params = gradient.substring(baseFunc.length)

    return [
      `-webkit-${baseFunc}${params}`,
      `-moz-${baseFunc}${params}`,
      `-o-${baseFunc}${params}`,
      gradient
    ]
  }

  generate(options: CssOutputOptions = { format: 'standard' }): string {
    const { format, selector = '.gradient-bg', variableName = '--gradient' } = options

    switch (format) {
      case 'prefixed':
        return this.generatePrefixed(selector)
      case 'css-variables':
        return this.generateCssVariables(selector, variableName)
      case 'standard':
      default:
        return this.generateStandard(selector)
    }
  }

  generateStandard(selector: string): string {
    const gradient = this.getGradientFunction()
    return `${selector} {\n  background: ${gradient};\n}`
  }

  generatePrefixed(selector: string): string {
    const prefixes = this.getGradientFunctionWithPrefixes()
    const rules = prefixes.map(prefix => `  background: ${prefix};`).join('\n')
    return `${selector} {\n${rules}\n}`
  }

  generateCssVariables(selector: string, variableName: string): string {
    const gradient = this.getGradientFunction()
    return `:root {\n  ${variableName}: ${gradient};\n}\n\n${selector} {\n  background: var(${variableName});\n}`
  }

  getGradientValue(): string {
    return this.getGradientFunction()
  }

  getPrefixedGradientValues(): string[] {
    return this.getGradientFunctionWithPrefixes()
  }
}
