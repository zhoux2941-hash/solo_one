export interface BambooSlipData {
  id: string;
  order: number;
  ancientText: string;
  modernText: string;
  annotation: string;
}

export interface TextCorrection {
  id: string;
  field: 'modernText' | 'annotation';
  originalText: string;
  correctedText: string;
  timestamp: number;
}

export interface EdgeTexture {
  leftEdge: number[];
  rightEdge: number[];
  patternHash: string;
}

export interface BambooSlip extends BambooSlipData {
  currentIndex: number;
  holes: {
    top: number;
    middle: number;
    bottom: number;
  };
  texture: EdgeTexture;
  isFlipped: boolean;
  correctedModernText: string | null;
  correctedAnnotation: string | null;
  corrections: TextCorrection[];
}

export interface TextureMatchResult {
  similarity: number;
  matchedPoints: number;
  totalPoints: number;
  isPatternMatch: boolean;
}

export interface AlignmentResult {
  isAligned: boolean;
  holesAligned: boolean;
  textureMatched: boolean;
  holeDeviation: number;
  holeThreshold: number;
  textureSimilarity: number;
  textureThreshold: number;
  overallScore: number;
}
