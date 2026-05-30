export const GRAVITY = 9.81;

export const DISCHARGE_COEFFICIENT = 0.62;

export const SIMULATION_SPEED = 1;

export const TIME_STEP = 0.05;

export const MIN_WATER_HEIGHT = 0.1;

export const DEFAULT_PARAMS = {
  containerShape: 'cylinder' as const,
  apertureDiameter: 5,
  initialWaterHeight: 30,
  containerSize: 20,
  useMultiLevel: false,
  compensationPotCount: 2,
  overflowHeight: 25,
};

export const COMPENSATION_POT_CONFIG = {
  potHeight: 15,
  potSize: 18,
  verticalGap: 10,
  potApertureDiameter: 4,
  maxPotCount: 3,
};

export const COLORS = {
  primary: '#1a3a4a',
  secondary: '#c17817',
  background: '#f5f0e6',
  water: '#4a90a4',
  waterLight: '#6bb3c9',
  waterDark: '#2d5a6b',
  gold: '#d4af37',
  text: '#2c1810',
  textLight: '#6b5344',
  border: '#8b7355',
  error: '#c44536',
  success: '#3d7a3d',
  overflow: '#e74c3c',
  compensationPot1: '#5dade2',
  compensationPot2: '#85c1e9',
  compensationPot3: '#aed6f1',
};

export const FONTS = {
  title: "'Ma Shan Zheng', serif",
  body: "'Noto Serif SC', serif",
};
