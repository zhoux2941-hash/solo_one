export type ShellType = 'plastron' | 'carapace';
export type PitShape = 'circle' | 'jujube';

export interface CrackBranch {
  angle: number;
  length: number;
  width: number;
  curvature: number;
  subBranches: CrackBranch[];
}

export interface CrackPoint {
  x: number;
  y: number;
  branches: CrackBranch[];
}

export interface Inscription {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  rotation: number;
}

export interface DivinationTemplate {
  id: number;
  category: string;
  content: string;
  interpretation: string;
  period: string;
}

export interface OracleExample {
  id: number;
  name: string;
  period: string;
  description: string;
  shellType: ShellType;
  pitShape: PitShape;
  temperature: number;
  anisotropyRatio: number;
  crackData: CrackPoint[];
  inscriptions: Inscription[];
}

export interface DivinationState {
  shellType: ShellType;
  pitShape: PitShape;
  temperature: number;
  anisotropyRatio: number;
  crackPoints: CrackPoint[];
  inscriptions: Inscription[];
  isCracking: boolean;
  hasCracked: boolean;
  selectedInscription: string | null;
  templates: DivinationTemplate[];
  examples: OracleExample[];
  mediumKv: number;
  mediumKh: number;
  mediumKd: number;
}

export interface CAMediumProperties {
  Kv: number;
  Kh: number;
  Kd: number;
  Tv: number;
  Th: number;
  Td: number;
}

export interface CACell {
  state: 0 | 1 | 2;
  stress: number;
  brokenStep: number;
}

export interface CAResult {
  crackPaths: { x: number; y: number; width: number }[][];
  crackPoints: CrackPoint[];
  cellSize: number;
}
