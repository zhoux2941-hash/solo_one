import { OPCODES } from './bytecode';
import type { PlcIoState } from '../types/plc';

interface DecodedVarRef {
  kind: number;
  index: number;
}

function decodeVarRef(ref: number): DecodedVarRef {
  const kind = (ref >> 5) & 0x07;
  const index = ref & 0x1f;
  return { kind, index };
}

function createInitialState(): PlcIoState {
  return {
    inputs: new Array(8).fill(false),
    outputs: new Array(8).fill(false),
    relays: new Array(16).fill(false),
    timers: new Array(8).fill(null).map(() => ({
      active: false,
      done: false,
      elapsed: 0,
      preset: 0,
    })),
    counters: new Array(8).fill(null).map(() => ({
      done: false,
      current: 0,
      preset: 0,
    })),
  };
}

export class PlcVm {
  private bytecode: Uint8Array;
  private pc: number;
  private stack: boolean[];
  private state: PlcIoState;
  private previousInputs: boolean[];

  constructor(bytecode: Uint8Array) {
    this.bytecode = bytecode;
    this.pc = 0;
    this.stack = [];
    this.state = createInitialState();
    this.previousInputs = new Array(8).fill(false);
  }

  reset(): void {
    this.pc = 0;
    this.stack = [];
    this.state = createInitialState();
    this.previousInputs = new Array(8).fill(false);
  }

  setInput(index: number, value: boolean): void {
    if (index >= 0 && index < 8) {
      this.previousInputs[index] = this.state.inputs[index];
      this.state.inputs[index] = value;
    }
  }

  private readVar(ref: DecodedVarRef): boolean {
    const { kind, index } = ref;
    switch (kind) {
      case 0:
        return this.state.inputs[index] ?? false;
      case 1:
        return this.state.outputs[index] ?? false;
      case 2:
        return this.state.relays[index] ?? false;
      case 3:
        return this.state.timers[index]?.done ?? false;
      case 4:
        return this.state.counters[index]?.done ?? false;
      default:
        return false;
    }
  }

  private writeVar(ref: DecodedVarRef, value: boolean): void {
    const { kind, index } = ref;
    switch (kind) {
      case 1:
        if (index >= 0 && index < 8) {
          this.state.outputs[index] = value;
        }
        break;
      case 2:
        if (index >= 0 && index < 16) {
          this.state.relays[index] = value;
        }
        break;
      case 3:
        if (index >= 0 && index < 8) {
          this.state.timers[index].done = value;
        }
        break;
      case 4:
        if (index >= 0 && index < 8) {
          this.state.counters[index].done = value;
        }
        break;
    }
  }

  private readUint32LE(offset: number): number {
    return (
      this.bytecode[offset] |
      (this.bytecode[offset + 1] << 8) |
      (this.bytecode[offset + 2] << 16) |
      (this.bytecode[offset + 3] << 24)
    );
  }

  step(): boolean {
    if (this.pc >= this.bytecode.length) {
      return false;
    }

    const opcode = this.bytecode[this.pc];
    this.pc++;

    switch (opcode) {
      case OPCODES.NOP:
        break;

      case OPCODES.LD: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        this.stack.push(this.readVar(ref));
        break;
      }

      case OPCODES.LDI: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        this.stack.push(!this.readVar(ref));
        break;
      }

      case OPCODES.AND: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const a = this.stack.pop() ?? false;
        const b = this.readVar(ref);
        this.stack.push(a && b);
        break;
      }

      case OPCODES.ANI: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const a = this.stack.pop() ?? false;
        const b = !this.readVar(ref);
        this.stack.push(a && b);
        break;
      }

      case OPCODES.OR: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const a = this.stack.pop() ?? false;
        const b = this.readVar(ref);
        this.stack.push(a || b);
        break;
      }

      case OPCODES.ORI: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const a = this.stack.pop() ?? false;
        const b = !this.readVar(ref);
        this.stack.push(a || b);
        break;
      }

      case OPCODES.OUT: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const value = this.stack.pop() ?? false;
        this.writeVar(ref, value);
        break;
      }

      case OPCODES.SET: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const value = this.stack.pop() ?? false;
        if (value) {
          this.writeVar(ref, true);
        }
        break;
      }

      case OPCODES.RST: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const value = this.stack.pop() ?? false;
        if (value) {
          this.writeVar(ref, false);
          const { kind, index } = ref;
          if (kind === 3 && index >= 0 && index < 8) {
            this.state.timers[index].elapsed = 0;
            this.state.timers[index].active = false;
          }
          if (kind === 4 && index >= 0 && index < 8) {
            this.state.counters[index].current = 0;
          }
        }
        break;
      }

      case OPCODES.TON: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const preset = this.readUint32LE(this.pc);
        this.pc += 4;
        const value = this.stack.pop() ?? false;
        const { index } = ref;

        if (index >= 0 && index < 8) {
          const timer = this.state.timers[index];
          timer.preset = preset;

          if (value) {
            timer.active = true;
            if (!timer.done) {
              timer.elapsed++;
              if (timer.elapsed >= timer.preset) {
                timer.done = true;
              }
            }
          } else {
            timer.active = false;
            timer.elapsed = 0;
            timer.done = false;
          }
        }
        break;
      }

      case OPCODES.CTN: {
        const ref = decodeVarRef(this.bytecode[this.pc++]);
        const preset = this.readUint32LE(this.pc);
        this.pc += 4;
        const value = this.stack.pop() ?? false;
        const { index } = ref;

        if (index >= 0 && index < 8) {
          const counter = this.state.counters[index];
          counter.preset = preset;

          const inputRef = decodeVarRef(this.bytecode[this.pc - 6]);
          let risingEdge = false;
          if (inputRef.kind === 0 && inputRef.index >= 0 && inputRef.index < 8) {
            risingEdge =
              this.state.inputs[inputRef.index] &&
              !this.previousInputs[inputRef.index];
          } else {
            risingEdge = value;
          }

          if (risingEdge && !counter.done) {
            counter.current++;
            if (counter.current >= counter.preset) {
              counter.done = true;
            }
          }
        }
        break;
      }

      case OPCODES.END:
        return false;

      default:
        break;
    }

    return true;
  }

  runCycle(): void {
    while (this.step()) {
      // Continue executing until END
    }
    for (let i = 0; i < 8; i++) {
      this.previousInputs[i] = this.state.inputs[i];
    }
    this.pc = 0;
  }

  getState(): PlcIoState {
    return {
      inputs: [...this.state.inputs],
      outputs: [...this.state.outputs],
      relays: [...this.state.relays],
      timers: this.state.timers.map((t) => ({ ...t })),
      counters: this.state.counters.map((c) => ({ ...c })),
    };
  }
}
