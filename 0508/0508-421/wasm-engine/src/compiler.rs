use crate::types::*;

pub fn compile(json: &str) -> Result<Vec<u8>, String> {
    let program: LadderProgram =
        serde_json::from_str(json).map_err(|e| format!("JSON parse error: {}", e))?;
    let mut bytecode = Vec::new();

    for rung in &program.rungs {
        compile_rung(rung, &mut bytecode)?;
    }

    bytecode.push(END);
    Ok(bytecode)
}

fn compile_rung(rung: &LadderRung, out: &mut Vec<u8>) -> Result<(), String> {
    for elem in &rung.elements {
        compile_element(elem, out)?;
    }
    Ok(())
}

fn compile_element(elem: &LadderElement, out: &mut Vec<u8>) -> Result<(), String> {
    let var = elem.variable.as_deref();
    let val = elem.value.unwrap_or(0);

    match elem.elem_type.to_uppercase().as_str() {
        "NOP" => {
            out.push(NOP);
        }
        "LD" => {
            let v = parse_var(var, "LD")?;
            out.push(LD);
            out.push(v.encode());
        }
        "LDI" => {
            let v = parse_var(var, "LDI")?;
            out.push(LDI);
            out.push(v.encode());
        }
        "AND" => {
            let v = parse_var(var, "AND")?;
            out.push(AND);
            out.push(v.encode());
        }
        "ANI" => {
            let v = parse_var(var, "ANI")?;
            out.push(ANI);
            out.push(v.encode());
        }
        "OR" => {
            let v = parse_var(var, "OR")?;
            out.push(OR);
            out.push(v.encode());
        }
        "ORI" => {
            let v = parse_var(var, "ORI")?;
            out.push(ORI);
            out.push(v.encode());
        }
        "OUT" => {
            let v = parse_var(var, "OUT")?;
            out.push(OUT);
            out.push(v.encode());
        }
        "SET" => {
            let v = parse_var(var, "SET")?;
            out.push(SET);
            out.push(v.encode());
        }
        "RST" => {
            let v = parse_var(var, "RST")?;
            out.push(RST);
            out.push(v.encode());
        }
        "TON" => {
            let v = parse_var(var, "TON")?;
            out.push(TON);
            out.push(v.encode());
            out.extend_from_slice(&val.to_le_bytes());
        }
        "CTN" => {
            let v = parse_var(var, "CTN")?;
            out.push(CTN);
            out.push(v.encode());
            out.extend_from_slice(&val.to_le_bytes());
        }
        other => return Err(format!("Unknown element type: {}", other)),
    }
    Ok(())
}

fn parse_var(var: Option<&str>, instr: &str) -> Result<VarRef, String> {
    var.and_then(|s| VarRef::parse(s))
        .ok_or_else(|| format!("{} requires a valid variable (e.g. X0, Y1, T0)", instr))
}
