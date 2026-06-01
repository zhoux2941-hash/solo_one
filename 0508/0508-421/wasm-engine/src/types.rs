pub const NOP: u8 = 0x00;
pub const LD: u8 = 0x01;
pub const LDI: u8 = 0x02;
pub const AND: u8 = 0x03;
pub const ANI: u8 = 0x04;
pub const OR: u8 = 0x05;
pub const ORI: u8 = 0x06;
pub const OUT: u8 = 0x07;
pub const SET: u8 = 0x08;
pub const RST: u8 = 0x09;
pub const TON: u8 = 0x0A;
pub const CTN: u8 = 0x0B;
pub const END: u8 = 0xFF;

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct LadderElement {
    #[serde(rename = "type")]
    pub elem_type: String,
    pub variable: Option<String>,
    pub value: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LadderRung {
    pub elements: Vec<LadderElement>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LadderProgram {
    pub rungs: Vec<LadderRung>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum VarKind {
    X,
    Y,
    M,
    T,
    C,
}

#[derive(Debug, Clone)]
pub struct VarRef {
    pub kind: VarKind,
    pub index: usize,
}

impl VarRef {
    pub fn parse(s: &str) -> Option<Self> {
        let s = s.trim();
        if s.is_empty() {
            return None;
        }
        let (kind, num_str) = match s.as_bytes()[0] {
            b'X' | b'x' => (VarKind::X, &s[1..]),
            b'Y' | b'y' => (VarKind::Y, &s[1..]),
            b'M' | b'm' => (VarKind::M, &s[1..]),
            b'T' | b't' => (VarKind::T, &s[1..]),
            b'C' | b'c' => (VarKind::C, &s[1..]),
            _ => return None,
        };
        let index = num_str.trim().parse::<usize>().ok()?;
        Some(VarRef { kind, index })
    }

    pub fn encode(&self) -> u8 {
        let high: u8 = match self.kind {
            VarKind::X => 0,
            VarKind::Y => 1,
            VarKind::M => 2,
            VarKind::T => 3,
            VarKind::C => 4,
        };
        (high << 5) | (self.index as u8 & 0x1F)
    }

    pub fn decode(byte: u8) -> Self {
        let kind = match byte >> 5 {
            0 => VarKind::X,
            1 => VarKind::Y,
            2 => VarKind::M,
            3 => VarKind::T,
            4 => VarKind::C,
            _ => VarKind::X,
        };
        let index = (byte & 0x1F) as usize;
        VarRef { kind, index }
    }
}

pub const NUM_INPUTS: usize = 8;
pub const NUM_OUTPUTS: usize = 8;
pub const NUM_TIMERS: usize = 8;
pub const NUM_COUNTERS: usize = 8;
pub const NUM_RELAYS: usize = 16;

#[derive(Debug, Clone)]
pub struct PlcState {
    pub inputs: [bool; NUM_INPUTS],
    pub outputs: [bool; NUM_OUTPUTS],
    pub timers: [TimerState; NUM_TIMERS],
    pub counters: [CounterState; NUM_COUNTERS],
    pub relays: [bool; NUM_RELAYS],
}

#[derive(Debug, Clone)]
pub struct TimerState {
    pub active: bool,
    pub done: bool,
    pub elapsed: u32,
    pub preset: u32,
}

#[derive(Debug, Clone)]
pub struct CounterState {
    pub done: bool,
    pub current: u32,
    pub preset: u32,
}

impl Default for PlcState {
    fn default() -> Self {
        Self {
            inputs: [false; NUM_INPUTS],
            outputs: [false; NUM_OUTPUTS],
            timers: core::array::from_fn(|_| TimerState::default()),
            counters: core::array::from_fn(|_| CounterState::default()),
            relays: [false; NUM_RELAYS],
        }
    }
}

impl Default for TimerState {
    fn default() -> Self {
        Self {
            active: false,
            done: false,
            elapsed: 0,
            preset: 0,
        }
    }
}

impl Default for CounterState {
    fn default() -> Self {
        Self {
            done: false,
            current: 0,
            preset: 0,
        }
    }
}

impl PlcState {
    pub fn read_var(&self, var: &VarRef) -> bool {
        match var.kind {
            VarKind::X => self.inputs.get(var.index).copied().unwrap_or(false),
            VarKind::Y => self.outputs.get(var.index).copied().unwrap_or(false),
            VarKind::M => self.relays.get(var.index).copied().unwrap_or(false),
            VarKind::T => self.timers.get(var.index).map(|t| t.done).unwrap_or(false),
            VarKind::C => self.counters.get(var.index).map(|c| c.done).unwrap_or(false),
        }
    }

    pub fn write_var(&mut self, var: &VarRef, value: bool) {
        match var.kind {
            VarKind::X => {
                if var.index < NUM_INPUTS {
                    self.inputs[var.index] = value;
                }
            }
            VarKind::Y => {
                if var.index < NUM_OUTPUTS {
                    self.outputs[var.index] = value;
                }
            }
            VarKind::M => {
                if var.index < NUM_RELAYS {
                    self.relays[var.index] = value;
                }
            }
            VarKind::T | VarKind::C => {}
        }
    }
}
