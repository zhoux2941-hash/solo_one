export interface RepresentativeWork {
  id: string;
  title: string;
  imageUrl: string;
  theme: string;
}

export interface NianhuaLocation {
  id: string;
  name: string;
  englishName: string;
  position: {
    x: number;
    y: number;
  };
  styleFeatures: string[];
  commonThemes: string[];
  representativeWorks: RepresentativeWork[];
  description: string;
}

export type ThemeType = 'all' | '门神' | '吉祥喜庆' | '戏文故事';
