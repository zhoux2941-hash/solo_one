@group(0) @binding(0) var<storage, read_write> data: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> u_size: vec4<f32>;

fn bitReverse(n: u32, bits: u32) -> u32 {
    var result: u32 = 0u;
    var n_copy = n;
    for (var i: u32 = 0u; i < bits; i++) {
        result = (result << 1u) | (n_copy & 1u);
        n_copy = n_copy >> 1u;
    }
    return result;
}

@compute @workgroup_size(8, 1, 1)
fn fftHorizontal(@builtin(global_invocation_id) id: vec3<u32>) {
    let size = u32(u_size.x);
    let bits = u32(log2(f32(size)));
    let y = id.y;
    let base = y * size;
    
    for (var i: u32 = 0u; i < size; i++) {
        let j = bitReverse(i, bits);
        if (i < j) {
            let temp = data[base + i];
            data[base + i] = data[base + j];
            data[base + j] = temp;
        }
    }
    
    for (var m: u32 = 2u; m <= size; m <<= 1u) {
        let mh = m >> 1u;
        let w = -2.0 * 3.14159265359 / f32(m);
        var wr = cos(w);
        var wi = sin(w);
        
        for (var i: u32 = 0u; i < size; i += m) {
            var xr = 1.0;
            var xi = 0.0;
            for (var j: u32 = 0u; j < mh; j++) {
                let even = data[base + i + j];
                let odd = data[base + i + j + mh];
                
                let tr = xr * odd.x - xi * odd.y;
                let ti = xr * odd.y + xi * odd.x;
                
                data[base + i + j].x = even.x + tr;
                data[base + i + j].y = even.y + ti;
                data[base + i + j + mh].x = even.x - tr;
                data[base + i + j + mh].y = even.y - ti;
                
                let nxr = xr * wr - xi * wi;
                let nxi = xr * wi + xi * wr;
                xr = nxr;
                xi = nxi;
            }
        }
    }
    
    let norm = 1.0 / sqrt(f32(size));
    for (var i: u32 = 0u; i < size; i++) {
        data[base + i] *= norm;
    }
}

@compute @workgroup_size(1, 8, 1)
fn fftVertical(@builtin(global_invocation_id) id: vec3<u32>) {
    let size = u32(u_size.x);
    let bits = u32(log2(f32(size)));
    let x = id.x;
    
    for (var i: u32 = 0u; i < size; i++) {
        let j = bitReverse(i, bits);
        if (i < j) {
            let temp = data[i * size + x];
            data[i * size + x] = data[j * size + x];
            data[j * size + x] = temp;
        }
    }
    
    for (var m: u32 = 2u; m <= size; m <<= 1u) {
        let mh = m >> 1u;
        let w = -2.0 * 3.14159265359 / f32(m);
        var wr = cos(w);
        var wi = sin(w);
        
        for (var i: u32 = 0u; i < size; i += m) {
            var xr = 1.0;
            var xi = 0.0;
            for (var j: u32 = 0u; j < mh; j++) {
                let even = data[(i + j) * size + x];
                let odd = data[(i + j + mh) * size + x];
                
                let tr = xr * odd.x - xi * odd.y;
                let ti = xr * odd.y + xi * odd.x;
                
                data[(i + j) * size + x].x = even.x + tr;
                data[(i + j) * size + x].y = even.y + ti;
                data[(i + j + mh) * size + x].x = even.x - tr;
                data[(i + j + mh) * size + x].y = even.y - ti;
                
                let nxr = xr * wr - xi * wi;
                let nxi = xr * wi + xi * wr;
                xr = nxr;
                xi = nxi;
            }
        }
    }
    
    let norm = 1.0 / f32(size);
    for (var i: u32 = 0u; i < size; i++) {
        data[i * size + x] *= norm;
    }
}
