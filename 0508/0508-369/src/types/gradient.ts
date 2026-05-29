export interface ColorStop {
  id: string
  color: string
  position: number
  opacity: number
}

export type GradientType = 'linear' | 'radial'

export type LinearDirection = 
  | 'to top'
  | 'to top right'
  | 'to right'
  | 'to bottom right'
  | 'to bottom'
  | 'to bottom left'
  | 'to left'
  | 'to top left'
  | 'angle'

export type RadialShape = 'circle' | 'ellipse'

export type RadialSize = 
  | 'closest-side'
  | 'closest-corner'
  | 'farthest-side'
  | 'farthest-corner'
  | 'contain'
  | 'cover'

export interface GradientConfig {
  type: GradientType
  linearDirection: LinearDirection
  angle: number
  radialShape: RadialShape
  radialSize: RadialSize
  colorStops: ColorStop[]
}

export interface PresetGradient {
  name: string
  config: GradientConfig
}
