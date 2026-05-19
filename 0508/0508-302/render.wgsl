@group(0) @binding(0) var<uniform> uniforms: vec4<f32>;
@group(0) @binding(1) var density_tex: texture_3d<f32>;
@group(0) @binding(2) var texture_sampler: sampler;

var<private> cam_pos: vec3<f32>;
var<private> cam_ray_dir: vec3<f32>;

fn get_uniform(index: u32) -> f32 {
    return uniforms[index / 4u][index % 4u];
}

fn ray_box_intersection(ray_origin: vec3<f32>, ray_dir: vec3<f32>, box_min: vec3<f32>, box_max: vec3<f32>) -> vec2<f32> {
    let inv_dir = 1.0 / ray_dir;
    var t_min = (box_min - ray_origin) * inv_dir;
    var t_max = (box_max - ray_origin) * inv_dir;
    
    let t1 = min(t_min, t_max);
    let t2 = max(t_min, t_max);
    
    let t_near = max(max(t1.x, t1.y), t1.z);
    let t_far = min(min(t2.x, t2.y), t2.z);
    
    return vec2<f32>(t_near, t_far);
}

fn sample_density(pos: vec3<f32>) -> f32 {
    let uv = pos * 0.5 + 0.5;
    return textureSampleLevel(density_tex, texture_sampler, uv, 0.0).x;
}

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4<f32> {
    var pos = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0,  1.0),
        vec2<f32>( 1.0,  1.0)
    );
    return vec4<f32>(pos[vertex_index], 0.0, 1.0);
}

@fragment
fn fs_main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    let width = get_uniform(3u);
    let height = get_uniform(4u);
    let cam_yaw = get_uniform(5u);
    let cam_pitch = get_uniform(6u);
    let cam_dist = get_uniform(7u);
    let cam_target_x = get_uniform(8u);
    let cam_target_y = get_uniform(9u);
    let cam_target_z = get_uniform(10u);
    
    let aspect = width / height;
    let fov = 1.0;
    
    let uv = vec2<f32>(
        (frag_coord.x / width - 0.5) * 2.0 * aspect,
        (frag_coord.y / height - 0.5) * -2.0
    );
    
    let cy = cos(cam_yaw);
    let sy = sin(cam_yaw);
    let cp = cos(cam_pitch);
    let sp = sin(cam_pitch);
    
    let rot_yaw = mat3x3<f32>(
        cy, 0.0, sy,
        0.0, 1.0, 0.0,
        -sy, 0.0, cy
    );
    
    let rot_pitch = mat3x3<f32>(
        1.0, 0.0, 0.0,
        0.0, cp, -sp,
        0.0, sp, cp
    );
    
    let cam_rot = rot_yaw * rot_pitch;
    
    let cam_pos = vec3<f32>(0.0, 0.0, cam_dist) * cam_rot + vec3<f32>(cam_target_x, cam_target_y, cam_target_z);
    let forward = normalize(-vec3<f32>(0.0, 0.0, cam_dist) * cam_rot);
    let right = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), forward));
    let up = cross(forward, right);
    
    let ray_dir = normalize(forward + uv.x * right * fov + uv.y * up * fov);
    
    let box_min = vec3<f32>(-0.5);
    let box_max = vec3<f32>(0.5);
    let t = ray_box_intersection(cam_pos, ray_dir, box_min, box_max);
    
    if (t.x >= t.y || t.y < 0.0) {
        return vec4<f32>(0.02, 0.02, 0.05, 1.0);
    }
    
    let t_start = max(t.x, 0.0);
    let t_end = t.y;
    
    var accum_color = vec3<f32>(0.02, 0.02, 0.05);
    var transmittance = 1.0;
    
    let step_size = 0.003;
    let max_steps = u32((t_end - t_start) / step_size);
    
    for (var i: u32 = 0u; i < max_steps && transmittance > 0.01; i++) {
        let t = t_start + f32(i) * step_size;
        let pos = cam_pos + ray_dir * t;
        
        let density = sample_density(pos);
        
        if (density > 0.001) {
            let absorption = density * 2.0;
            let alpha = 1.0 - exp(-absorption * step_size);
            
            let color = mix(
                vec3<f32>(0.1, 0.3, 0.8),
                vec3<f32>(0.9, 0.5, 0.2),
                smoothstep(0.0, 0.3, density)
            );
            
            let light_pos = vec3<f32>(0.5, 0.5, 0.5);
            let light_dir = normalize(light_pos - pos);
            var light_accum = 0.0;
            for (var j: u32 = 0u; j < 16u; j++) {
                let l_pos = pos + light_dir * f32(j) * 0.02;
                if (all(l_pos >= box_min) && all(l_pos <= box_max)) {
                    light_accum += sample_density(l_pos);
                }
            }
            let lighting = exp(-light_accum * 0.5);
            
            accum_color = accum_color * (1.0 - alpha * transmittance) + color * lighting * alpha * transmittance;
            transmittance *= (1.0 - alpha);
        }
    }
    
    let last_pos = cam_pos + ray_dir * t_end;
    let edge_dist = min(
        min(abs(0.5 - abs(last_pos.x)), abs(0.5 - abs(last_pos.y))),
        abs(0.5 - abs(last_pos.z))
    );
    let edge = smoothstep(0.02, 0.0, edge_dist);
    accum_color = mix(accum_color, vec3<f32>(0.3, 0.5, 0.7), edge * 0.3);
    
    return vec4<f32>(accum_color, 1.0);
}