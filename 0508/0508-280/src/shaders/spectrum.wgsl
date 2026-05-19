@group(0) @binding(0) var<storage, read> h0: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> ht: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> displacement: array<vec4<f32>>;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8, 1)
fn generateSpectrum(@builtin(global_invocation_id) id: vec3<u32>) {
    let size = 256u;
    let size_f = f32(size);
    let patchSize = params.w;
    
    if (id.x >= size || id.y >= size) {
        return;
    }
    
    let idx = id.y * size + id.x;
    
    let kx = (f32(id.x) - size_f / 2.0) * 2.0 * 3.14159265359 / patchSize;
    let ky = (f32(id.y) - size_f / 2.0) * 2.0 * 3.14159265359 / patchSize;
    let k = vec2<f32>(kx, ky);
    let k_len = length(k);
    
    if (k_len < 0.001) {
        ht[idx] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        displacement[idx] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    let g = 9.81;
    let w = sqrt(g * k_len);
    let time = params.x;
    let phase = w * time;
    
    let cos_phase = cos(phase);
    let sin_phase = sin(phase);
    
    let h0_val = h0[idx];
    let h0_conj = h0[(size - id.y) % size * size + (size - id.x) % size];
    
    var h_real = h0_val.x * cos_phase - h0_val.y * sin_phase;
    var h_imag = h0_val.x * sin_phase + h0_val.y * cos_phase;
    
    h_real += h0_conj.x * cos_phase + h0_conj.y * sin_phase;
    h_imag += -h0_conj.x * sin_phase + h0_conj.y * cos_phase;
    
    let waveScale = params.z;
    
    let lambda = 0.01;
    let damping = exp(-k_len * lambda);
    
    let max_k = 5.0;
    let high_freq_damping = smoothstep(max_k, max_k * 0.3, k_len);
    
    h_real *= waveScale * damping * high_freq_damping;
    h_imag *= waveScale * damping * high_freq_damping;
    
    ht[idx] = vec4<f32>(h_real, h_imag, 0.0, 0.0);
    
    let k_norm = k / k_len;
    displacement[idx] = vec4<f32>(
        -k_norm.x * h_real,
        -k_norm.y * h_real,
        h_real,
        h_imag
    );
}

@group(0) @binding(0) var<storage, read> heightData: array<vec4<f32>>;
@group(0) @binding(1) var<storage, write> heightTex: texture_storage_2d<rgba32float, write>;
@group(0) @binding(2) var<storage, write> normalTex: texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var<uniform> params2: vec4<f32>;

@compute @workgroup_size(8, 8, 1)
fn calculateNormals(@builtin(global_invocation_id) id: vec3<u32>) {
    let size = 256u;
    
    if (id.x >= size || id.y >= size) {
        return;
    }
    
    let idx = id.y * size + id.x;
    
    let max_height = 15.0;
    let height = clamp(heightData[idx].x, -max_height * 0.5, max_height);
    
    let left_idx = ((id.y + size) % size) * size + ((id.x - 1u + size) % size);
    let right_idx = ((id.y + size) % size) * size + ((id.x + 1u) % size);
    let up_idx = ((id.y - 1u + size) % size) * size + ((id.x + size) % size);
    let down_idx = ((id.y + 1u) % size) * size + ((id.x + size) % size);
    
    let left = clamp(heightData[left_idx].x, -max_height * 0.5, max_height);
    let right = clamp(heightData[right_idx].x, -max_height * 0.5, max_height);
    let up = clamp(heightData[up_idx].x, -max_height * 0.5, max_height);
    let down = clamp(heightData[down_idx].x, -max_height * 0.5, max_height);
    
    let dx = (right - left) * 0.5;
    let dy = (down - up) * 0.5;
    
    let max_slope = 2.0;
    let dx_clamped = clamp(dx, -max_slope, max_slope);
    let dy_clamped = clamp(dy, -max_slope, max_slope);
    
    let normal = normalize(vec3<f32>(-dx_clamped, 1.0, -dy_clamped));
    
    textureStore(heightTex, vec2<u32>(id.x, id.y), vec4<f32>(height, dx, dy, 1.0));
    textureStore(normalTex, vec2<u32>(id.x, id.y), vec4<f32>(normal, 1.0));
}
