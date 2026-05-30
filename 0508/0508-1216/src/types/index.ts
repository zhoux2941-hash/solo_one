export type DiffType = 'insert' | 'delete' | 'equal' | 'modify';

export interface Diff {
  type: DiffType;
  text: string;
}

export interface LineDiff {
  lineNumber: number;
  leftLine: string;
  rightLine: string;
  charDiffs: Diff[];
  isModified: boolean;
}

export type CompareMode = 'char' | 'line';

export interface CompareOptions {
  mode: CompareMode;
  ignoreWhitespace: boolean;
}

export interface TextState {
  leftText: string;
  rightText: string;
  options: CompareOptions;
}
