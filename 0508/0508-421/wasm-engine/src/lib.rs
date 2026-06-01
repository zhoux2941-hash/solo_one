mod compiler;
mod types;
mod vm;

use wasm_bindgen::prelude::*;
use crate::vm::Vm;

#[wasm_bindgen]
pub struct PlcEngine {
    vm: Vm,
}

#[wasm_bindgen]
impl PlcEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            vm: Vm::new(vec![types::END]),
        }
    }

    pub fn compile_and_run(&mut self, json: &str) -> Result<(), JsValue> {
        let bytecode = compiler::compile(json).map_err(JsValue::from)?;
        self.vm = Vm::new(bytecode);
        self.vm.run_cycle();
        Ok(())
    }

    pub fn step(&mut self) -> Result<bool, JsValue> {
        match self.vm.step_once() {
            vm::StepResult::End => Ok(false),
            vm::StepResult::Error => Err(JsValue::from_str("VM execution error")),
            vm::StepResult::Continue => Ok(true),
        }
    }

    pub fn get_io_state(&self) -> JsValue {
        let state = &self.vm.state;
        let obj = js_sys::Object::new();

        let inputs = js_sys::Array::new();
        for &v in &state.inputs {
            inputs.push(&JsValue::from_bool(v));
        }
        js_sys::Reflect::set(&obj, &JsValue::from_str("inputs"), &inputs).ok();

        let outputs = js_sys::Array::new();
        for &v in &state.outputs {
            outputs.push(&JsValue::from_bool(v));
        }
        js_sys::Reflect::set(&obj, &JsValue::from_str("outputs"), &outputs).ok();

        let relays = js_sys::Array::new();
        for &v in &state.relays {
            relays.push(&JsValue::from_bool(v));
        }
        js_sys::Reflect::set(&obj, &JsValue::from_str("relays"), &relays).ok();

        let timers = js_sys::Array::new();
        for t in &state.timers {
            let t_obj = js_sys::Object::new();
            js_sys::Reflect::set(&t_obj, &JsValue::from_str("active"), &JsValue::from_bool(t.active)).ok();
            js_sys::Reflect::set(&t_obj, &JsValue::from_str("done"), &JsValue::from_bool(t.done)).ok();
            js_sys::Reflect::set(&t_obj, &JsValue::from_str("elapsed"), &JsValue::from_f64(t.elapsed as f64)).ok();
            js_sys::Reflect::set(&t_obj, &JsValue::from_str("preset"), &JsValue::from_f64(t.preset as f64)).ok();
            timers.push(&t_obj);
        }
        js_sys::Reflect::set(&obj, &JsValue::from_str("timers"), &timers).ok();

        let counters = js_sys::Array::new();
        for c in &state.counters {
            let c_obj = js_sys::Object::new();
            js_sys::Reflect::set(&c_obj, &JsValue::from_str("done"), &JsValue::from_bool(c.done)).ok();
            js_sys::Reflect::set(&c_obj, &JsValue::from_str("current"), &JsValue::from_f64(c.current as f64)).ok();
            js_sys::Reflect::set(&c_obj, &JsValue::from_str("preset"), &JsValue::from_f64(c.preset as f64)).ok();
            counters.push(&c_obj);
        }
        js_sys::Reflect::set(&obj, &JsValue::from_str("counters"), &counters).ok();

        JsValue::from(obj)
    }

    pub fn set_input(&mut self, index: usize, value: bool) {
        if index < types::NUM_INPUTS {
            self.vm.state.inputs[index] = value;
        }
    }
}

impl Default for PlcEngine {
    fn default() -> Self {
        Self::new()
    }
}
