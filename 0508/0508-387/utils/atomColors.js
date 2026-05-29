export const atomColors = {
  H: 0xFFFFFF,
  C: 0x000000,
  N: 0x0000FF,
  O: 0xFF0000,
  F: 0x00FF00,
  Cl: 0x00FF00,
  Br: 0xA00000,
  I: 0x800080,
  S: 0xFFFF00,
  P: 0xFFA500,
  Na: 0x800000,
  K: 0x4B0082,
  Ca: 0xFFD700,
  Fe: 0x8B4513,
  Cu: 0xB87333,
  Zn: 0x71797E,
  Mg: 0x808080,
  Al: 0xA0A0A0,
  Si: 0xC0C0C0,
  B: 0xFF8C00,
  Li: 0xCC8800,
  He: 0xDDAADD,
  Ne: 0xDDAADD,
  Ar: 0xDDAADD,
  Kr: 0xDDAADD,
  Xe: 0xDDAADD,
  default: 0x808080
};

export function getAtomColor(element) {
  return atomColors[element] || atomColors.default;
}

export const atomRadii = {
  H: 0.37,
  C: 0.77,
  N: 0.75,
  O: 0.73,
  F: 0.71,
  Cl: 0.99,
  Br: 1.14,
  I: 1.33,
  S: 1.02,
  P: 1.10,
  Na: 1.86,
  K: 2.27,
  Ca: 1.97,
  Fe: 1.26,
  Cu: 1.35,
  Zn: 1.31,
  Mg: 1.60,
  Al: 1.43,
  Si: 1.17,
  B: 0.88,
  Li: 1.52,
  default: 0.8
};

export function getAtomRadius(element) {
  return atomRadii[element] || atomRadii.default;
}
