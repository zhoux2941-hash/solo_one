export interface SolarTerm {
  name: string;
  date: string;
  month: number;
  day: number;
  phenology: string;
  season: string;
  lunarDate: string;
}

export interface Theme {
  id: string;
  name: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
}

export interface CanvasConfig {
  year: number;
  layout: 'portrait' | 'landscape';
  theme: Theme;
  fontFamily: string;
  backgroundColor: string;
  exportSize: 'A3' | 'A4';
}

export type LayoutType = 'portrait' | 'landscape';
export type ExportSizeType = 'A3' | 'A4';
