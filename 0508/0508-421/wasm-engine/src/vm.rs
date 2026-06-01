use crate::types::*;

pub struct Vm {
    pub state: PlcState,
    bytecode: Vec<u8>,
    pc: usize,
    stack: Vec<bool>,
    prev_input_rising: [bool; NUM_INPUTS],
}

impl Vm {
    pub fn new(bytecode: Vec<u8>) -> Self {
        Self {
            state: PlcState::default(),
            bytecode,
            pc: 0,
            stack: Vec::with_capacity(64),
            prev_input_rising: [false; NUM_INPUTS],
        }
    }

    pub fn run_cycle(&mut self) {
        self.pc = 0;
        self.stack.clear();
        loop {
            match self.step_once() {
                StepResult::End => break,
                StepResult::Error => break,
                StepResult::Continue => {}
            }
        }
        self.update_timers();
    }

    pub fn step_once(&mut self) -> StepResult {
        if self.pc >= self.bytecode.len() {
            return StepResult::End;
        }

        let op = self.bytecode[self.pc];
        self.pc += 1;

        match op {
            NOP => {}
            LD => {
                let v = self.read_var_byte();
                self.stack.push(self.state.read_var(&v));
            }
            LDI => {
                let v = self.read_var_byte();
                self.stack.push(!self.state.read_var(&v));
            }
            AND => {
                let v = self.read_var_byte();
                let top = self.stack.pop().unwrap_or(false);
                self.stack.push(top & self.state.read_var(&v));
            }
            ANI => {
                let v = self.read_var_byte();
                let top = self.stack.pop().unwrap_or(false);
                self.stack.push(top & !self.state.read_var(&v));
            }
            OR => {
                let v = self.read_var_byte();
                let top = self.stack.pop().unwrap_or(false);
                self.stack.push(top | self.state.read_var(&v));
            }
            ORI => {
                let v = self.read_var_byte();
                let top = self.stack.pop().unwrap_or(false);
                self.stack.push(top | !self.state.read_var(&v));
            }
            OUT => {
                let v = self.read_var_byte();
                let val = self.stack.last().copied().unwrap_or(false);
                self.state.write_var(&v, val);
            }
            SET => {
                let v = self.read_var_byte();
                let val = self.stack.last().copied().unwrap_or(false);
                if val {
                    self.state.write_var(&v, true);
                }
            }
            RST => {
                let v = self.read_var_byte();
                let val = self.stack.last().copied().unwrap_or(false);
                if val {
                    self.state.write_var(&v, false);
                }
            }
            TON => {
                let v = self.read_var_byte();
                let preset = self.read_u32_le();
                let cond = self.stack.last().copied().unwrap_or(false);
                if v.kind == VarKind::T && v.index < NUM_TIMERS {
                    self.state.timers[v.index].active = cond;
                    if cond && self.state.timers[v.index].preset == 0 {
                        self.state.timers[v.index].preset = preset;
                    }
                }
            }
            CTN => {
                let v = self.read_var_byte();
                let preset = self.read_u32_le();
                let cond = self.stack.last().copied().unwrap_or(false);
                if v.kind == VarKind::C && v.index < NUM_COUNTERS {
                    self.state.counters[v.index].preset = preset;
                    let rising = cond && !self.prev_input_rising[v.index];
                    if rising {
                        self.state.counters[v.index].current =
                            self.state.counters[v.index].current.saturating_add(1);
                        if self.state.counters[v.index].current >= self.state.counters[v.index].preset {
                            self.state.counters[v.index].done = true;
                        }
                    }
                    self.prev_input_rising[v.index] = cond;
                }
            }
            END => return StepResult::End,
            _ => return StepResult::Error,
        }

        StepResult::Continue
    }

    fn update_timers(&mut self) {
        for timer in &mut self.state.timers {
            if timer.active && !timer.done {
                timer.elapsed = timer.elapsed.saturating_add(1);
                if timer.elapsed >= timer.preset {
                    timer.done = true;
                }
            }
            if !timer.active {
                timer.elapsed = 0;
                timer.done = false;
            }
        }
    }

    fn read_var_byte(&mut self) -> VarRef {
        if self.pc >= self.bytecode.len() {
            return VarRef {
                kind: VarKind::X,
                index: 0,
            };
        }
        let b = self.bytecode[self.pc];
        self.pc += 1;
        VarRef::decode(b)
    }

    fn read_u32_le(&mut self) -> u32 {
        if self.pc + 4 > self.bytecode.len() {
            return 0;
        }
        let bytes = &self.bytecode[self.pc..self.pc + 4];
        self.pc += 4;
        u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
    }
}

pub enum StepResult {
    Continue,
    End,
    Error,
}
