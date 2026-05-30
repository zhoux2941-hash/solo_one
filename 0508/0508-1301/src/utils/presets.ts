export interface Preset {
  name: string;
  nameCN: string;
  cells: [number, number][];
}

export const GLIDER: Preset = {
  name: "Glider",
  nameCN: "滑翔机",
  cells: [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
};

export const LWSS: Preset = {
  name: "LWSS",
  nameCN: "轻量级飞船",
  cells: [
    [0, 1],
    [0, 4],
    [1, 0],
    [2, 0],
    [2, 4],
    [3, 0],
    [3, 1],
    [3, 2],
    [3, 3],
  ],
};

export const PULSAR: Preset = {
  name: "Pulsar",
  nameCN: "脉冲星",
  cells: [
    [0, 2], [0, 3], [0, 4], [0, 8], [0, 9], [0, 10],
    [2, 0], [2, 5], [2, 7], [2, 12],
    [3, 0], [3, 5], [3, 7], [3, 12],
    [4, 0], [4, 5], [4, 7], [4, 12],
    [5, 2], [5, 3], [5, 4], [5, 8], [5, 9], [5, 10],
    [7, 2], [7, 3], [7, 4], [7, 8], [7, 9], [7, 10],
    [8, 0], [8, 5], [8, 7], [8, 12],
    [9, 0], [9, 5], [9, 7], [9, 12],
    [10, 0], [10, 5], [10, 7], [10, 12],
    [12, 2], [12, 3], [12, 4], [12, 8], [12, 9], [12, 10],
  ],
};

export const BLINKER: Preset = {
  name: "Blinker",
  nameCN: "闪光灯",
  cells: [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
};

export const TOAD: Preset = {
  name: "Toad",
  nameCN: "蟾蜍",
  cells: [
    [0, 1], [0, 2], [0, 3],
    [1, 0], [1, 1], [1, 2],
  ],
};

export const BEACON: Preset = {
  name: "Beacon",
  nameCN: "信标",
  cells: [
    [0, 0], [0, 1],
    [1, 0], [1, 1],
    [2, 2], [2, 3],
    [3, 2], [3, 3],
  ],
};

export const PENTOMINO: Preset = {
  name: "R-pentomino",
  nameCN: "R五联骨牌",
  cells: [
    [0, 1], [0, 2],
    [1, 0], [1, 1],
    [2, 1],
  ],
};

export const DIEHARD: Preset = {
  name: "Diehard",
  nameCN: "顽固",
  cells: [
    [0, 6],
    [1, 0], [1, 1],
    [2, 1], [2, 5], [2, 6], [2, 7],
  ],
};

export const ACORN: Preset = {
  name: "Acorn",
  nameCN: "橡子",
  cells: [
    [0, 1],
    [1, 3],
    [2, 0], [2, 1], [2, 4], [2, 5], [2, 6],
  ],
};

export const PRESETS: Preset[] = [
  GLIDER,
  LWSS,
  PULSAR,
  BLINKER,
  TOAD,
  BEACON,
  PENTOMINO,
  DIEHARD,
  ACORN,
];
