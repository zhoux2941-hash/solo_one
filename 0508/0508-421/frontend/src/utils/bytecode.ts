import type { LadderProgram, PlcElement } from '../types/plc';

export const OPCODES = {
  NOP: 0x00,
  LD: 0x01,
  LDI: 0x02,
  AND: 0x03,
  ANI: 0x04,
  OR: 0x05,
  ORI: 0x06,
  OUT: 0x07,
  SET: 0x08,
  RST: 0x09,
  TON: 0x0a,
  CTN: 0x0b,
  END: 0xff,
} as const;

export type Opcode = (typeof OPCODES)[keyof typeof OPCODES];

export function encodeVarRef(variable: string): number {
  const match = variable.match(/^([XYMTC])(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid variable reference: ${variable}`);
  }

  const kindChar = match[1].toUpperCase();
  const index = parseInt(match[2], 10);

  let kind: number;
  switch (kindChar) {
    case 'X':
      kind = 0;
      break;
    case 'Y':
      kind = 1;
      break;
    case 'M':
      kind = 2;
      break;
    case 'T':
      kind = 3;
      break;
    case 'C':
      kind = 4;
      break;
    default:
      throw new Error(`Unknown variable type: ${kindChar}`);
  }

  if (index < 0 || index > 31) {
    throw new Error(`Variable index out of range: ${index}`);
  }

  return (kind << 5) | index;
}

function getInputOpcode(element: PlcElement): Opcode {
  switch (element.type) {
    case 'normally-open':
      return OPCODES.LD;
    case 'normally-closed':
      return OPCODES.LDI;
    default:
      throw new Error(`Invalid input element type: ${element.type}`);
  }
}

function getSeriesOpcode(element: PlcElement): Opcode {
  switch (element.type) {
    case 'normally-open':
      return OPCODES.AND;
    case 'normally-closed':
      return OPCODES.ANI;
    default:
      throw new Error(`Invalid series element type: ${element.type}`);
  }
}

function getParallelOpcode(element: PlcElement): Opcode {
  switch (element.type) {
    case 'normally-open':
      return OPCODES.OR;
    case 'normally-closed':
      return OPCODES.ORI;
    default:
      throw new Error(`Invalid parallel element type: ${element.type}`);
  }
}

function isInputElement(element: PlcElement): boolean {
  return element.type === 'normally-open' || element.type === 'normally-closed';
}

function isOutputElement(element: PlcElement): boolean {
  return (
    element.type === 'coil' ||
    element.type === 'timer' ||
    element.type === 'counter'
  );
}

function compileRung(elements: PlcElement[], bytecode: number[]): void {
  const sortedElements = [...elements]
    .filter((el) => !['left-bus', 'right-bus', 'horizontal-line', 'vertical-line'].includes(el.type))
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

  if (sortedElements.length === 0) return;

  const inputElements = sortedElements.filter(isInputElement);
  const outputElements = sortedElements.filter(isOutputElement);

  if (inputElements.length === 0 || outputElements.length === 0) return;

  const byRow = new Map<number, PlcElement[]>();
  for (const el of inputElements) {
    if (!byRow.has(el.y)) {
      byRow.set(el.y, []);
    }
    byRow.get(el.y)!.push(el);
  }

  const rows = Array.from(byRow.entries()).sort((a, b) => a[0] - b[0]);

  if (rows.length === 1) {
    const rowElements = rows[0][1].sort((a, b) => a.x - b.x);
    for (let i = 0; i < rowElements.length; i++) {
      const el = rowElements[i];
      const opcode = i === 0 ? getInputOpcode(el) : getSeriesOpcode(el);
      bytecode.push(opcode);
      bytecode.push(encodeVarRef(el.variable));
    }
  } else {
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rowElements = rows[rowIdx][1].sort((a, b) => a.x - b.x);

      if (rowIdx > 0) {
        const firstEl = rowElements[0];
        bytecode.push(getParallelOpcode(firstEl));
        bytecode.push(encodeVarRef(firstEl.variable));

        for (let i = 1; i < rowElements.length; i++) {
          const el = rowElements[i];
          bytecode.push(getSeriesOpcode(el));
          bytecode.push(encodeVarRef(el.variable));
        }
      } else {
        for (let i = 0; i < rowElements.length; i++) {
          const el = rowElements[i];
          const opcode = i === 0 ? getInputOpcode(el) : getSeriesOpcode(el);
          bytecode.push(opcode);
          bytecode.push(encodeVarRef(el.variable));
        }
      }
    }
  }

  for (const output of outputElements) {
    let opcode: Opcode;
    switch (output.type) {
      case 'coil':
        opcode = OPCODES.OUT;
        break;
      case 'timer':
        opcode = OPCODES.TON;
        break;
      case 'counter':
        opcode = OPCODES.CTN;
        break;
      default:
        continue;
    }

    bytecode.push(opcode);
    bytecode.push(encodeVarRef(output.variable));

    if (output.type === 'timer' || output.type === 'counter') {
      const preset = output.value ?? 0;
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, preset, true);
      for (let i = 0; i < 4; i++) {
        bytecode.push(view.getUint8(i));
      }
    }
  }
}

export function compileProgram(program: LadderProgram): Uint8Array {
  const bytecode: number[] = [];

  for (const rung of program.rungs) {
    compileRung(rung.elements, bytecode);
  }

  bytecode.push(OPCODES.END);

  return new Uint8Array(bytecode);
}
