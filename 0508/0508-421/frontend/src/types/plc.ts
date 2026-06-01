export type ElementType =
  | 'normally-open'
  | 'normally-closed'
  | 'coil'
  | 'timer'
  | 'counter'
  | 'left-bus'
  | 'right-bus'
  | 'horizontal-line'
  | 'vertical-line';

export interface PlcElement {
  id: string;
  type: ElementType;
  variable: string;
  value?: number;
  x: number;
  y: number;
  state: boolean;
}

export interface LadderRung {
  id: string;
  elements: PlcElement[];
}

export interface LadderProgram {
  rungs: LadderRung[];
}

export interface PlcIoState {
  inputs: boolean[];
  outputs: boolean[];
  relays: boolean[];
  timers: Array<{
    active: boolean;
    done: boolean;
    elapsed: number;
    preset: number;
  }>;
  counters: Array<{
    done: boolean;
    current: number;
    preset: number;
  }>;
}

export type SimMode = 'stopped' | 'running' | 'paused';

export interface ElementPaletteItem {
  type: ElementType;
  label: string;
  icon: string;
}
