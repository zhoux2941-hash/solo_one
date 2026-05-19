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
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(2) var heightTex: texture_2d<f32>;
@group(0) @binding(3) var sampler: sampler;

fn hash(n: f32) -> f32 {
    return fract(sin(n) * 43758.5453);
}

fn hash2(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
}

@compute @workgroup_size(64, 1, 1)
fn updateParticles(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x;
    if (idx >= arrayLength(&particles)) {
        return;
    }
    
    var particle = particles[idx];
    let dt = clamp(uniforms.deltaTime, 0.0, 0.1);
    
    particle.age += dt;
    
    let uv = (particle.position.xz / uniforms.patchSize + 0.5) % 1.0;
    let heightSample = textureSampleLevel(heightTex, sampler, uv, 0.0);
    let waveHeight = clamp(heightSample.r, -3.0, 15.0);
    
    let slopeX = heightSample.g;
    let slopeY = heightSample.b;
    let slope = length(vec2<f32>(slopeX, slopeY));
    
    let buoyancy = 5.0;
    let drag = 0.98;
    
    let buoyantForce = vec3<f32>(
        -slopeX * buoyancy,
        buoyancy * 0.5,
        -slopeY * buoyancy
    );
    
    let windAngle = uniforms.windDir;
    let windVel = vec3<f32>(
        cos(windAngle) * uniforms.windSpeed * 0.1,
        0.0,
        sin(windAngle) * uniforms.windSpeed * 0.1
    );
    
    particle.velocity += buoyantForce * dt;
    particle.velocity += windVel * dt;
    particle.velocity *= drag;
    
    let noiseVal = hash2(particle.position.xz + uniforms.time);
    particle.velocity.x += (noiseVal - 0.5) * 0.5 * dt;
    particle.velocity.z += (noiseVal - 0.3) * 0.5 * dt;
    
    particle.position += particle.velocity * dt;
    
    let targetY = waveHeight + 0.3 + hash(f32(idx) + uniforms.time) * 0.2;
    particle.position.y = mix(particle.position.y, targetY, dt * 2.0);
    
    let boundary = uniforms.patchSize * 2.0;
    if (abs(particle.position.x) > boundary || abs(particle.position.z) > boundary) {
        let angle = hash(f32(idx) * 100.0) * 6.28318;
        let radius = hash(f32(idx) * 200.0) * uniforms.patchSize * 1.5;
        particle.position.x = cos(angle) * radius;
        particle.position.z = sin(angle) * radius;
        particle.age = 0.0;
    }
    
    let maxSlope = max(slope, 0.1);
    let isInWave = slope > 0.3;
    let spawnChance = smoothstep(0.3, 0.8, slope) * uniforms.foamIntensity;
    let randomVal = hash(f32(idx) + uniforms.time * 10.0);
    
    if (particle.age > particle.lifetime) {
        if (isInWave && randomVal < spawnChance * 0.1) {
            particle.age = 0.0;
            particle.lifetime = 1.0 + hash(f32(idx)) * 3.0;
            particle.velocity = vec3<f32>(0.0, 0.0, 0.0);
        } else if (randomVal < 0.001) {
            particle.age = 0.0;
            particle.lifetime = 0.5 + hash(f32(idx)) * 1.5;
            particle.velocity = vec3<f32>(0.0, 0.0, 0.0);
        }
    }
    
    particle.lifetime = mix(particle.lifetime, 2.0 + slope * 3.0, dt * 0.5);
    
    particles[idx] = particle;
}
