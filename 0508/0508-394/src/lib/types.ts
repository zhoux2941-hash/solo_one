export type Dynasty = '宋' | '清';

export interface MaterialGrade {
  id: number;
  dynasty: Dynasty;
  grade: number;
  dancai_height: number;
  dancai_width: number;
  zucai_height: number;
  qi_height: number;
  fen_mm: number;
}

export interface DougongComponent {
  name: string;
  type: '斗' | '拱' | '昂' | '枋';
  width: number;
  height: number;
  depth: number;
  count: number;
}

export interface ComponentResult {
  name: string;
  type: '斗' | '拱' | '昂' | '枋';
  widthFen: number;
  heightFen: number;
  depthFen: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  count: number;
  volumeMm3: number;
}

export interface Preset {
  id: number;
  name: string;
  dynasty: Dynasty;
  grade: number;
  jumps: number;
  description: string;
}

export interface DougongParams {
  dynasty: Dynasty;
  grade: number;
  jumps: number;
}

export interface ModuleData {
  dancaiHeight: number;
  dancaiWidth: number;
  zucaiHeight: number;
  qiHeight: number;
  fenMm: number;
}
