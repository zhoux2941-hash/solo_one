struct Uniforms {
    viewProj: mat4x4<f32>,
    cameraPos: vec3<f32>,
    time: f32,
    fftSize: f32,
    patchSize: f32,
    padding: f32,
    offset: vec3<f32>,
    padding2: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var heightTex: texture_2d<f32>;
@group(0) @binding(2) var normalTex: texture_2d<f32>;
@group(0) @binding(3) var sampler: sampler;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) lod: f32
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPos: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) normal: vec3<f32>,
    @location(3) viewDir: vec3<f32>
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    let worldXZ = input.position.xz + uniforms.offset.xz;
    let uv = (worldXZ / uniforms.patchSize + 0.5) % 1.0;
    
    let heightSample = textureSampleLevel(heightTex, sampler, uv, 0.0);
    let max_height = 15.0;
    let min_height = -3.0;
    let height = clamp(heightSample.r, min_height, max_height);
    
    let normalSample = textureSampleLevel(normalTex, sampler, uv, 0.0);
    
    var worldPos = vec3<f32>(
        input.position.x + uniforms.offset.x,
        height,
        input.position.z + uniforms.offset.z
    );
    
    output.worldPos = worldPos;
    output.uv = uv;
    output.normal = normalSample.rgb;
    output.viewDir = normalize(uniforms.cameraPos - worldPos);
    output.position = uniforms.viewProj * vec4<f32>(worldPos, 1.0);
    
    return output;
}

fn fresnel(normal: vec3<f32>, viewDir: vec3<f32>, ior: f32) -> f32 {
    let cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    let r0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
    return r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5.0);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let normal = normalize(input.normal);
    let viewDir = normalize(input.viewDir);
    
    let lightDir = normalize(vec3<f32>(0.5, 0.8, 0.3));
    let halfDir = normalize(lightDir + viewDir);
    
    let diffuse = max(dot(normal, lightDir), 0.0);
    let specular = pow(max(dot(normal, halfDir), 0.0), 128.0);
    
    let fresnelFactor = fresnel(normal, viewDir, 1.33);
    
    let deepColor = vec3<f32>(0.0, 0.1, 0.3);
    let shallowColor = vec3<f32>(0.0, 0.4, 0.5);
    let skyColor = vec3<f32>(0.4, 0.6, 0.8);
    
    let depthFactor = exp(-abs(input.worldPos.y) * 0.05);
    var waterColor = mix(deepColor, shallowColor, depthFactor);
    
    waterColor = mix(waterColor, skyColor, fresnelFactor);
    waterColor += specular * 1.5;
    waterColor += diffuse * 0.3 * vec3<f32>(0.8, 0.9, 1.0);
    
    let foam = smoothstep(0.5, 1.0, normal.y) * 0.2;
    waterColor += foam * vec3<f32>(1.0);
    
    let fogDist = length(input.worldPos - uniforms.cameraPos);
    let fogFactor = 1.0 - exp(-fogDist * 0.001);
    waterColor = mix(waterColor, vec3<f32>(0.5, 0.6, 0.7), fogFactor * 0.5);
    
    return vec4<f32>(waterColor, 1.0);
}
