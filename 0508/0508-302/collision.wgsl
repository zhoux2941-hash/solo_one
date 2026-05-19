struct Interaction {
    pos: vec3<f32>,
    radius: f32,
    strength: f32,
    type: f32,
    pad: vec2<f32>
}

@group(0) @binding(0) var<uniform> uniforms: vec4<f32>;
@group(0) @binding(1) var<uniform> interaction: Interaction;
@group(0) @binding(2) var f_in: texture_storage_3d<rgba32float, read_write>;
@group(0) @binding(3) var density_out: texture_storage_3d<r16float, write>;
@group(0) @binding(4) var velocity_out: texture_storage_3d<rgba16float, write>;

const grid_size = vec3<u32>(128u, 128u, 64u);
const tau: f32 = 0.8;
const omega: f32 = 1.0 / tau;
const cs_sq: f32 = 1.0 / 3.0;

fn get_vorticity_eps() -> f32 {
    return uniforms[3u].w;
}

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

const w: array<f32, 19> = array<f32, 19>(
    1.0 / 3.0,
    1.0 / 18.0, 1.0 / 18.0,
    1.0 / 18.0, 1.0 / 18.0,
    1.0 / 18.0, 1.0 / 18.0,
    1.0 / 36.0, 1.0 / 36.0,
    1.0 / 36.0, 1.0 / 36.0,
    1.0 / 36.0, 1.0 / 36.0,
    1.0 / 36.0, 1.0 / 36.0,
    1.0 / 36.0, 1.0 / 36.0,
    1.0 / 36.0, 1.0 / 36.0
);

const opposite: array<u32, 19> = array<u32, 19>(
    0u,
    2u, 1u,
    4u, 3u,
    6u, 5u,
    8u, 7u,
    10u, 9u,
    12u, 11u,
    14u, 13u,
    16u, 15u,
    18u, 17u
);

fn equilibrium(rho: f32, u: vec3<f32>, ei: vec3<f32>, wi: f32) -> f32 {
    let eu: f32 = dot(ei, u);
    let uu: f32 = dot(u, u);
    return wi * rho * (1.0 + eu / cs_sq + (eu * eu) / (2.0 * cs_sq * cs_sq) - uu / (2.0 * cs_sq));
}

fn get_velocity(pos: vec3<u32>) -> vec3<f32> {
    if (any(pos >= grid_size) || any(pos == vec3<u32>(0u))) {
        return vec3<f32>(0.0);
    }
    var sum_rho: f32 = 0.0;
    var sum_u: vec3<f32> = vec3<f32>(0.0);
    for (var i: u32 = 0u; i < 19u; i++) {
        let layer = i / 4u;
        let channel = i % 4u;
        let f_val = textureLoad(f_in, pos, layer);
        var f: f32 = select(f_val.x, f_val.y, channel == 1u);
        f = select(f, f_val.z, channel == 2u);
        f = select(f, f_val.w, channel == 3u);
        sum_rho += f;
        sum_u += vec3<f32>(e[i]) * f;
    }
    sum_rho = max(sum_rho, 0.001);
    return sum_u / sum_rho;
}

fn compute_vorticity(pos: vec3<i32>) -> vec3<f32> {
    let u_xp = get_velocity(vec3<u32>(pos + vec3<i32>(1, 0, 0)));
    let u_xn = get_velocity(vec3<u32>(pos - vec3<i32>(1, 0, 0)));
    let u_yp = get_velocity(vec3<u32>(pos + vec3<i32>(0, 1, 0)));
    let u_yn = get_velocity(vec3<u32>(pos - vec3<i32>(0, 1, 0)));
    let u_zp = get_velocity(vec3<u32>(pos + vec3<i32>(0, 0, 1)));
    let u_zn = get_velocity(vec3<u32>(pos - vec3<i32>(0, 0, 1)));
    
    let dx = 0.5;
    let dudx = (u_xp - u_xn) * dx;
    let dudy = (u_yp - u_yn) * dx;
    let dudz = (u_zp - u_zn) * dx;
    
    return vec3<f32>(
        dudy.z - dudz.y,
        dudz.x - dudx.z,
        dudx.y - dudy.x
    );
}

fn compute_vorticity_force(id: vec3<u32>, u: vec3<f32>) -> vec3<f32> {
    let pos = vec3<i32>(id);
    
    let vorticity = compute_vorticity(pos);
    
    let vort_xp = compute_vorticity(pos + vec3<i32>(1, 0, 0));
    let vort_xn = compute_vorticity(pos - vec3<i32>(1, 0, 0));
    let vort_yp = compute_vorticity(pos + vec3<i32>(0, 1, 0));
    let vort_yn = compute_vorticity(pos - vec3<i32>(0, 1, 0));
    let vort_zp = compute_vorticity(pos + vec3<i32>(0, 0, 1));
    let vort_zn = compute_vorticity(pos - vec3<i32>(0, 0, 1));
    
    let dx = 0.5;
    let grad_vort_mag_x = (length(vort_xp) - length(vort_xn)) * dx;
    let grad_vort_mag_y = (length(vort_yp) - length(vort_yn)) * dx;
    let grad_vort_mag_z = (length(vort_zp) - length(vort_zn)) * dx;
    
    let grad_vort_mag = vec3<f32>(grad_vort_mag_x, grad_vort_mag_y, grad_vort_mag_z);
    let eta = normalize(grad_vort_mag + 1e-6);
    
    let force = cross(eta, vorticity) * get_vorticity_eps();
    
    return force;
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    if (any(id >= grid_size)) {
        return;
    }

    var f: array<f32, 19>;
    for (var i: u32 = 0u; i < 5u; i++) {
        let f_val = textureLoad(f_in, id, i);
        f[i * 4u] = f_val.x;
        f[i * 4u + 1u] = f_val.y;
        f[i * 4u + 2u] = f_val.z;
        f[i * 4u + 3u] = f_val.w;
    }

    var rho: f32 = 0.0;
    var u: vec3<f32> = vec3<f32>(0.0);
    
    for (var i: u32 = 0u; i < 19u; i++) {
        rho += f[i];
        u += vec3<f32>(e[i]) * f[i];
    }
    
    rho = max(rho, 0.001);
    u /= rho;

    let pos = vec3<f32>(f32(id.x), f32(id.y), f32(id.z)) / vec3<f32>(grid_size);
    let pos_norm = (pos - 0.5) * 2.0;
    
    let dist = length(pos_norm - interaction.pos);
    
    var delta_rho: f32 = 0.0;
    var delta_u: vec3<f32> = vec3<f32>(0.0);
    
    if (interaction.type > 0.5 && interaction.type < 1.5 && dist < interaction.radius) {
        delta_rho = (1.0 - dist / interaction.radius) * interaction.strength * 0.3;
    }
    
    if (interaction.type > 1.5 && interaction.type < 2.5 && dist < interaction.radius) {
        let force_dir = normalize(pos_norm - interaction.pos + vec3<f32>(0.001));
        delta_u = force_dir * (1.0 - dist / interaction.radius) * interaction.strength * 0.01;
    }

    let is_boundary = id.x == 0u || id.x == grid_size.x - 1u || 
                      id.y == 0u || id.y == grid_size.y - 1u || 
                      id.z == 0u || id.z == grid_size.z - 1u;
    
    if (!is_boundary) {
        rho += delta_rho;
        u += delta_u;
        
        let vort_force = compute_vorticity_force(id, u);
        u += vort_force;
        
        rho = clamp(rho, 0.001, 2.0);
        u = clamp(u, vec3<f32>(-0.3), vec3<f32>(0.3));
        
        for (var i: u32 = 0u; i < 19u; i++) {
            let ei = vec3<f32>(e[i]);
            let feq = equilibrium(rho, u, ei, w[i]);
            f[i] = f[i] * (1.0 - omega) + feq * omega;
            f[i] = max(f[i], 0.0);
        }
    } else {
        var f_bounce: array<f32, 19>;
        for (var i: u32 = 0u; i < 19u; i++) {
            f_bounce[i] = f[opposite[i]];
        }
        f = f_bounce;
        u = vec3<f32>(0.0);
    }

    rho = 0.0;
    for (var i: u32 = 0u; i < 19u; i++) {
        rho += f[i];
    }

    for (var i: u32 = 0u; i < 5u; i++) {
        let idx = i * 4u;
        textureStore(f_in, id, i, vec4<f32>(f[idx], f[idx + 1u], f[idx + 2u], f[idx + 3u]));
    }

    textureStore(density_out, id, vec4<f32>(rho, 0.0, 0.0, 0.0));
    textureStore(velocity_out, id, vec4<f32>(u, rho));
}