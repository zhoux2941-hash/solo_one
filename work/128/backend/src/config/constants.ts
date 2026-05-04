export const MAHJONG_CONFIG = {
  TOTAL_TILES: 108,
  TILES_PER_SUIT: 9,
  TILES_PER_RANK: 4,
  PLAYER_COUNT: 4,
  INITIAL_TILES: 13,
  WINNING_TILES: 14,
  ACTION_TIMEOUT: 15000,
  DISCARD_TIMEOUT: 10000,
} as const;

export const TILE_TYPES = {
  TIAO: 'tiao',
  WAN: 'wan',
  TONG: 'tong',
} as const;

export const ACTION_TYPES = {
  DRAW: 'draw',
  DISCARD: 'discard',
  PENG: 'peng',
  GANG: 'gang',
  AN_GANG: 'an_gang',
  BU_GANG: 'bu_gang',
  HU: 'hu',
  PASS: 'pass',
} as const;

export const GAME_STATES = {
  WAITING: 'waiting',
  STARTING: 'starting',
  PLAYING: 'playing',
  WAITING_ACTION: 'waiting_action',
  FINISHED: 'finished',
} as const;
