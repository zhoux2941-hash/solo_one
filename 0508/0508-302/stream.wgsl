@group(0) @binding(0) var<uniform> uniforms: vec4<f32>;
@group(0) @binding(1) var f_in: texture_storage_3d<rgba32float, read_only>;
@group(0) @binding(2) var f_out: texture_storage_3d<rgba32float, write_only>;

const grid_size = vec3<u32>(128u, 128u, 64u);

const e: array<vec3<i32>, 19> = array<vec3<i32>, 19>(
    vec3<i32>(0, 0, 0),
    vec3<i32>(1, 0, 0), vec3<i32>(-1, 0, 0),
    vec3<i32>(0, 1, 0), vec3<i32>(0, -1, 0),
    vec3<i32>(0, 0, 1), vec3<i32>(0, 0, -1),
    vec3<i32>(1, 1, 0), vec3<i32>(-1, -1, 0),
    vec3<i32>(1, -1, 0), vec3<i32>(-1, 1, 0),
    vec3<i32>(1, 0, 1), vec3<i32>(-1, 0, -1),
    vec3<i32>(1, 0, -1), vec3<i32>(-1, 0, 1),
    vec3<i32>(0, 1, 1), vec3<i32>(0, -1, -1),
    vec3<i32>(0, 1, -1), vec3<i32>(0, -1, 1)
);

fn in_bounds(pos: vec3<i32>) -> bool {
    let gs = vec3<i32>(grid_size);
    return all(pos >= vec3<i32>(0)) && all(pos < gs);
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (any(id >= grid_size)) {
        return;
    }

    let pos_i32 = vec3<i32>(id);
    
    var f: array<f32, 19>;
    
    for (var i: u32 = 0u; i < 19u; i++) {
        let src_pos = pos_i32 - e[i];
        if (in_bounds(src_pos)) {
            let layer = i / 4u;
            let channel = i % 4u;
            let f_val = textureLoad(f_in, vec3<u32>(src_pos), layer);
            f[i] = select(f_val.x, f_val.y, channel == 1u);
            f[i] = select(f[i], f_val.z, channel == 2u);
            f[i] = select(f[i], f_val.w, channel == 3u);
        } else {
            f[i] = 0.0;
        }
    }

    for (var i: u32 = 0u; i < 5u; i++) {
        let idx = i * 4u;
        textureStore(f_out, id, i, vec4<f32>(f[idx], f[idx + 1u], f[idx + 2u], f[idx + 3u]));
    }
}