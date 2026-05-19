struct Uniforms {
    viewProj: mat4x4<f32>,
    cameraPos: vec3<f32>,
    time: f32,
    deltaTime: f32,
    fftSize: f32,
    patchSize: f32,
    foamIntensity: f32,
    windDir: f32,
    windSpeed: f32,
    padding: vec2<f32>
}

struct Particle {
    position: vec3<f32>,
    lifetime: f32,
    velocity: vec3<f32>,
    age: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
@group(0) @binding(2) var heightTex: texture_2d<f32>;
@group(0) @binding(3) var sampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) alpha: f32,
    @location(1) pointSize: f32
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    
    let particle = particles[vertexIndex];
    
    let lifeRatio = particle.age / max(particle.lifetime, 0.01);
    let fadeIn = smoothstep(0.0, 0.2, lifeRatio);
    let fadeOut = 1.0 - smoothstep(0.5, 1.0, lifeRatio);
    let lifeAlpha = fadeIn * fadeOut;
    
    let uv = (particle.position.xz / uniforms.patchSize + 0.5) % 1.0;
    let heightSample = textureSampleLevel(heightTex, sampler, uv, 0.0);
    let slope = length(vec2<f32>(heightSample.g, heightSample.b));
    let slopeAlpha = smoothstep(0.2, 0.6, slope) * uniforms.foamIntensity;
    
    let totalAlpha = lifeAlpha * slopeAlpha;
    
    if (totalAlpha < 0.05 || lifeRatio > 1.0) {
        output.position = vec4<f32>(0.0, 0.0, -1000.0, 1.0);
        output.alpha = 0.0;
        output.pointSize = 0.0;
        return output;
    }
    
    let viewDir = normalize(particle.position - uniforms.cameraPos);
    let dist = length(particle.position - uniforms.cameraPos);
    
    let baseSize = 3.0;
    let distScale = clamp(100.0 / dist, 0.2, 2.0);
    let size = baseSize * distScale * (1.0 - lifeRatio * 0.5);
    
    output.position = uniforms.viewProj * vec4<f32>(particle.position, 1.0);
    output.alpha = clamp(totalAlpha, 0.0, 1.0);
    output.pointSize = size;
    
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let color = vec3<f32>(1.0, 1.0, 1.0);
    let alpha = input.alpha * 0.6;
    return vec4<f32>(color * alpha, alpha);
}
