import * as THREE from 'three';
import { TrailSystem } from './TrailSystem.js';

const COMPUTE_SHADER_PARTICLE_UPDATE = `
struct Particle {
    position: vec3<f32>,
    velocity: vec3<f32>,
    density: f32,
    pressure: f32,
    age: f32,
    lifetime: f32,
    active: u32,
    pad: u32
};

struct Obstacle {
    type: u32,
    position: vec3<f32>,
    size: vec3<f32>,
    radius: f32
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> obstacles: array<Obstacle>;
@group(0) @binding(2) var<uniform> params: vec4<f32>;
@group(0) @binding(3) var<uniform> forceField: vec4<f32>;
@group(0) @binding(4) var<uniform> forceFieldPos: vec4<f32>;

const MAX_PARTICLES: u32 = 65536u;
const SMOOTHING_RADIUS: f32 = 0.2;
const REST_DENSITY: f32 = 1000.0;
const GAS_CONSTANT: f32 = 200.0;
const BOUNDARY_MIN: vec3<f32> = vec3<f32>(-4.5, 0.0, -4.5);
const BOUNDARY_MAX: vec3<f32> = vec3<f32>(4.5, 7.5, 4.5);
const PARTICLE_MASS: f32 = 0.02;

fn poly6Kernel(r: f32, h: f32) -> f32 {
    if (r > h) { return 0.0; }
    let factor: f32 = 315.0 / (64.0 * 3.14159 * pow(h, 9.0));
    let diff: f32 = h * h - r * r;
    return factor * diff * diff * diff;
}

fn spikyKernelGradient(r: vec3<f32>, h: f32) -> vec3<f32> {
    let rLen: f32 = length(r);
    if (rLen > h || rLen < 0.0001) { return vec3<f32>(0.0); }
    let factor: f32 = -45.0 / (3.14159 * pow(h, 6.0));
    let diff: f32 = h - rLen;
    return normalize(r) * factor * diff * diff;
}

fn viscosityLaplacian(r: vec3<f32>, h: f32) -> f32 {
    let rLen: f32 = length(r);
    if (rLen > h) { return 0.0; }
    let factor: f32 = 45.0 / (3.14159 * pow(h, 6.0));
    return factor * (h - rLen);
}

fn collideWithSphere(pos: vec3<f32>, vel: vec3<f32>, spherePos: vec3<f32>, radius: f32) -> vec3<f32> {
    let toCenter: vec3<f32> = pos - spherePos;
    let dist: f32 = length(toCenter);
    if (dist < radius + 0.05) {
        let normal: vec3<f32> = normalize(toCenter);
        return spherePos + normal * (radius + 0.05);
    }
    return pos;
}

fn collideWithBox(pos: vec3<f32>, boxPos: vec3<f32>, boxSize: vec3<f32>) -> vec3<f32> {
    let halfSize: vec3<f32> = boxSize * 0.5;
    let minBounds: vec3<f32> = boxPos - halfSize - vec3<f32>(0.05);
    let maxBounds: vec3<f32> = boxPos + halfSize + vec3<f32>(0.05);
    
    if (all(pos > minBounds) && all(pos < maxBounds)) {
        let toCenter: vec3<f32> = pos - boxPos;
        let absToCenter: vec3<f32> = abs(toCenter);
        let penetration: vec3<f32> = halfSize + vec3<f32>(0.05) - absToCenter;
        
        if (penetration.x < penetration.y && penetration.x < penetration.z) {
            return vec3<f32>(boxPos.x + sign(toCenter.x) * (halfSize.x + 0.05), pos.y, pos.z);
        } else if (penetration.y < penetration.z) {
            return vec3<f32>(pos.x, boxPos.y + sign(toCenter.y) * (halfSize.y + 0.05), pos.z);
        } else {
            return vec3<f32>(pos.x, pos.y, boxPos.z + sign(toCenter.z) * (halfSize.z + 0.05));
        }
    }
    return pos;
}

@compute @workgroup_size(256)
fn computeDensityPressure(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx: u32 = id.x;
    if (idx >= arrayLength(&particles) || particles[idx].active == 0u) { return; }
    
    var density: f32 = 0.0;
    let pos: vec3<f32> = particles[idx].position;
    
    for (var j: u32 = 0u; j < arrayLength(&particles); j++) {
        if (particles[j].active == 0u) { continue; }
        let otherPos: vec3<f32> = particles[j].position;
        let r: f32 = distance(pos, otherPos);
        density += PARTICLE_MASS * poly6Kernel(r, SMOOTHING_RADIUS);
    }
    
    particles[idx].density = max(density, REST_DENSITY * 0.5);
    particles[idx].pressure = GAS_CONSTANT * (density - REST_DENSITY);
}

@compute @workgroup_size(256)
fn computeForces(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx: u32 = id.x;
    if (idx >= arrayLength(&particles) || particles[idx].active == 0u) { return; }
    
    particles[idx].age += params.z;
    
    if (particles[idx].age > particles[idx].lifetime && particles[idx].lifetime > 0.0) {
        particles[idx].position = vec3<f32>(
            (f32(idx % 64) - 32.0) / 16.0,
            6.0 + f32((idx / 64) % 8) / 4.0,
            (f32((idx / 512) % 64) - 32.0) / 16.0
        );
        particles[idx].velocity = vec3<f32>(0.0, 0.0, 0.0);
        particles[idx].age = 0.0;
    }
    
    let viscosity: f32 = params.x;
    let surfaceTension: f32 = params.y;
    let dt: f32 = params.z;
    
    var pressureForce: vec3<f32> = vec3<f32>(0.0);
    var viscosityForce: vec3<f32> = vec3<f32>(0.0);
    
    let pos: vec3<f32> = particles[idx].position;
    let vel: vec3<f32> = particles[idx].velocity;
    let density: f32 = particles[idx].density;
    let pressure: f32 = particles[idx].pressure;
    
    for (var j: u32 = 0u; j < arrayLength(&particles); j++) {
        if (j == idx || particles[j].active == 0u) { continue; }
        
        let otherPos: vec3<f32> = particles[j].position;
        let otherVel: vec3<f32> = particles[j].velocity;
        let otherDensity: f32 = particles[j].density;
        let otherPressure: f32 = particles[j].pressure;
        
        let rVec: vec3<f32> = pos - otherPos;
        let r: f32 = length(rVec);
        
        if (r < SMOOTHING_RADIUS && r > 0.001) {
            let pressureTerm: f32 = (pressure / (density * density)) + (otherPressure / (otherDensity * otherDensity));
            pressureForce += -PARTICLE_MASS * pressureTerm * spikyKernelGradient(rVec, SMOOTHING_RADIUS);
            
            viscosityForce += viscosity * PARTICLE_MASS * (otherVel - vel) / otherDensity * viscosityLaplacian(rVec, SMOOTHING_RADIUS);
        }
    }
    
    var gravity: vec3<f32> = vec3<f32>(0.0, -9.8, 0.0);
    var externalForce: vec3<f32> = vec3<f32>(0.0);
    
    let forceType: u32 = u32(forceField.w);
    if (forceType == 1u) {
        externalForce = forceField.xyz;
    } else if (forceType == 2u) {
        let toCenter: vec3<f32> = pos - forceFieldPos.xyz;
        let dist: f32 = length(toCenter);
        if (dist < forceFieldPos.w) {
            let tangent: vec3<f32> = normalize(vec3<f32>(-toCenter.z, 0.0, toCenter.x));
            let inward: vec3<f32> = -normalize(toCenter);
            externalForce = forceField.x * tangent + forceField.y * inward;
        }
    }
    
    let totalForce: vec3<f32> = pressureForce + viscosityForce + gravity + externalForce;
    let acceleration: vec3<f32> = totalForce / density;
    
    var newVel: vec3<f32> = vel + acceleration * dt;
    newVel *= 0.99;
    
    var newPos: vec3<f32> = pos + newVel * dt;
    
    newPos = max(newPos, BOUNDARY_MIN);
    newPos = min(newPos, BOUNDARY_MAX);
    
    for (var o: u32 = 0u; o < arrayLength(&obstacles); o++) {
        let obs: Obstacle = obstacles[o];
        if (obs.type == 1u) {
            newPos = collideWithSphere(newPos, newVel, obs.position, obs.radius);
        } else if (obs.type == 2u) {
            newPos = collideWithBox(newPos, obs.position, obs.size);
        }
    }
    
    if (newPos.y <= BOUNDARY_MIN.y + 0.05) {
        newVel.y *= -0.3;
        newVel.x *= 0.9;
        newVel.z *= 0.9;
    }
    
    particles[idx].velocity = newVel;
    particles[idx].position = newPos;
}
`;

export class SPHFluid {
    constructor(options = {}) {
        this.maxParticles = options.maxParticles || 65536;
        this.obstacleManager = options.obstacleManager;
        this.forceField = options.forceField;
        this.particleCount = 0;
        this.colorMode = 'velocity';
        this.renderMode = 'ssfr';
        this.viscosity = 0.1;
        this.surfaceTension = 0.01;
        this.particleLifetime = options.particleLifetime || 0;
        this.enableTrails = options.enableTrails !== false;
        
        this.device = null;
        this.particleBuffer = null;
        this.obstacleBuffer = null;
        this.paramsBuffer = null;
        this.forceFieldBuffer = null;
        this.forceFieldPosBuffer = null;
        this.densityPipeline = null;
        this.forcesPipeline = null;
        this.bindGroup = null;
        
        this.positions = null;
        this.velocities = null;
        this.ages = null;
        this.lifetimes = null;
        this.colors = null;
        
        this.trailSystem = null;
        
        this.initParticles();
        this.initWebGPU();
        this.initThreeJS();
        
        if (this.enableTrails) {
            this.trailSystem = new TrailSystem({
                maxParticles: this.maxParticles,
                trailLength: 30,
                trailFade: 0.95,
                trailWidth: 0.05
            });
        }
    }
    
    initParticles() {
        this.positions = new Float32Array(this.maxParticles * 3);
        this.velocities = new Float32Array(this.maxParticles * 3);
        this.densities = new Float32Array(this.maxParticles);
        this.pressures = new Float32Array(this.maxParticles);
        this.ages = new Float32Array(this.maxParticles);
        this.lifetimes = new Float32Array(this.maxParticles);
        this.active = new Uint32Array(this.maxParticles);
        this.colors = new Float32Array(this.maxParticles * 3);
    }
    
    async initWebGPU() {
        try {
            const canvas = document.createElement('canvas');
            const adapter = await navigator.gpu?.requestAdapter();
            this.device = await adapter?.requestDevice();
            
            if (this.device) {
                this.createBuffers();
                this.createPipelines();
                this.createBindGroup();
            }
        } catch (e) {
            console.log('WebGPU not available, using WebGL fallback');
        }
    }
    
    createBuffers() {
        const particleStride = 3 + 3 + 1 + 1 + 1 + 1 + 1 + 1;
        const particleBufferSize = this.maxParticles * particleStride * 4;
        
        this.particleData = new Float32Array(this.maxParticles * 16);
        
        this.particleBuffer = this.device.createBuffer({
            size: particleBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        
        this.obstacleBuffer = this.device.createBuffer({
            size: 32 * 12 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        
        this.paramsBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.forceFieldBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.forceFieldPosBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }
    
    createPipelines() {
        const shaderModule = this.device.createShaderModule({
            code: COMPUTE_SHADER_PARTICLE_UPDATE
        });
        
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }
            ]
        });
        
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });
        
        this.densityPipeline = this.device.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                module: shaderModule,
                entryPoint: 'computeDensityPressure'
            }
        });
        
        this.forcesPipeline = this.device.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                module: shaderModule,
                entryPoint: 'computeForces'
            }
        });
    }
    
    createBindGroup() {
        this.bindGroup = this.device.createBindGroup({
            layout: this.densityPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.particleBuffer } },
                { binding: 1, resource: { buffer: this.obstacleBuffer } },
                { binding: 2, resource: { buffer: this.paramsBuffer } },
                { binding: 3, resource: { buffer: this.forceFieldBuffer } },
                { binding: 4, resource: { buffer: this.forceFieldPosBuffer } }
            ]
        });
    }
    
    initThreeJS() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        this.points = new THREE.Points(geometry, material);
    }
    
    addParticles(count, position) {
        const startIdx = this.particleCount;
        const endIdx = Math.min(startIdx + count, this.maxParticles);
        
        for (let i = startIdx; i < endIdx; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.random() * 0.5;
            
            this.positions[i * 3] = position.x + r * Math.sin(phi) * Math.cos(theta);
            this.positions[i * 3 + 1] = position.y + r * Math.sin(phi) * Math.sin(theta);
            this.positions[i * 3 + 2] = position.z + r * Math.cos(phi);
            
            this.velocities[i * 3] = 0;
            this.velocities[i * 3 + 1] = 0;
            this.velocities[i * 3 + 2] = 0;
            
            this.densities[i] = 1000;
            this.pressures[i] = 0;
            this.ages[i] = 0;
            this.lifetimes[i] = this.particleLifetime;
            this.active[i] = 1;
            
            this.colors[i * 3] = 0;
            this.colors[i * 3 + 1] = 0.5;
            this.colors[i * 3 + 2] = 1;
        }
        
        this.particleCount = endIdx;
        this.updateGPUBuffer();
        this.updateThreeJSAttributes();
    }
    
    reset() {
        this.particleCount = 0;
        this.initParticles();
        this.addParticles(5000, new THREE.Vector3(0, 3, 0));
    }
    
    updateGPUBuffer() {
        if (!this.device) return;
        
        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 16;
            this.particleData[base] = this.positions[i * 3];
            this.particleData[base + 1] = this.positions[i * 3 + 1];
            this.particleData[base + 2] = this.positions[i * 3 + 2];
            this.particleData[base + 3] = this.velocities[i * 3];
            this.particleData[base + 4] = this.velocities[i * 3 + 1];
            this.particleData[base + 5] = this.velocities[i * 3 + 2];
            this.particleData[base + 6] = this.densities[i];
            this.particleData[base + 7] = this.pressures[i];
            this.particleData[base + 8] = this.ages[i];
            this.particleData[base + 9] = this.lifetimes[i];
            this.particleData[base + 10] = this.active[i];
        }
        
        this.device.queue.writeBuffer(this.particleBuffer, 0, this.particleData);
    }
    
    updateThreeJSAttributes() {
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.color.needsUpdate = true;
        this.points.geometry.setDrawRange(0, this.particleCount);
    }
    
    updateColors() {
        for (let i = 0; i < this.particleCount; i++) {
            let color;
            
            if (this.colorMode === 'velocity') {
                const speed = Math.sqrt(
                    this.velocities[i * 3] ** 2 +
                    this.velocities[i * 3 + 1] ** 2 +
                    this.velocities[i * 3 + 2] ** 2
                );
                const t = Math.min(speed / 5, 1);
                color = new THREE.Color().setHSL(0.6 - t * 0.6, 1, 0.5);
            } else if (this.colorMode === 'pressure') {
                const p = this.pressures[i];
                const t = Math.min(Math.max(p / 1000, 0), 1);
                color = new THREE.Color().setHSL(0.1 + t * 0.2, 1, 0.5);
            } else if (this.colorMode === 'density') {
                const d = this.densities[i];
                const t = Math.min(Math.max((d - 500) / 1000, 0), 1);
                color = new THREE.Color().setHSL(0.5 - t * 0.2, 1, 0.5);
            } else {
                color = new THREE.Color(0x0088ff);
            }
            
            this.colors[i * 3] = color.r;
            this.colors[i * 3 + 1] = color.g;
            this.colors[i * 3 + 2] = color.b;
        }
    }
    
    updateCPUSPH(dt) {
        const h = 0.2;
        const restDensity = 1000;
        const gasConstant = 200;
        const particleMass = 0.02;
        
        const poly6Factor = 315 / (64 * Math.PI * Math.pow(h, 9));
        const spikyFactor = -45 / (Math.PI * Math.pow(h, 6));
        const viscosityFactor = 45 / (Math.PI * Math.pow(h, 6));
        
        const poly6Kernel = (r) => {
            if (r > h) return 0;
            const diff = h * h - r * r;
            return poly6Factor * diff * diff * diff;
        };
        
        const spikyGradient = (rVec, r) => {
            if (r > h || r < 0.001) return new THREE.Vector3(0, 0, 0);
            const diff = h - r;
            return rVec.clone().normalize().multiplyScalar(spikyFactor * diff * diff);
        };
        
        const viscosityLaplacian = (r) => {
            if (r > h) return 0;
            return viscosityFactor * (h - r);
        };
        
        for (let i = 0; i < this.particleCount; i++) {
            let density = 0;
            const pos = new THREE.Vector3(
                this.positions[i * 3],
                this.positions[i * 3 + 1],
                this.positions[i * 3 + 2]
            );
            
            for (let j = 0; j < this.particleCount; j++) {
                const otherPos = new THREE.Vector3(
                    this.positions[j * 3],
                    this.positions[j * 3 + 1],
                    this.positions[j * 3 + 2]
                );
                const r = pos.distanceTo(otherPos);
                density += particleMass * poly6Kernel(r);
            }
            
            this.densities[i] = Math.max(density, restDensity * 0.5);
            this.pressures[i] = gasConstant * (density - restDensity);
        }
        
        const gravity = new THREE.Vector3(0, -9.8, 0);
        const boundaryMin = new THREE.Vector3(-4.5, 0, -4.5);
        const boundaryMax = new THREE.Vector3(4.5, 7.5, 4.5);
        
        for (let i = 0; i < this.particleCount; i++) {
            let pressureForce = new THREE.Vector3(0, 0, 0);
            let viscosityForce = new THREE.Vector3(0, 0, 0);
            
            const pos = new THREE.Vector3(
                this.positions[i * 3],
                this.positions[i * 3 + 1],
                this.positions[i * 3 + 2]
            );
            const vel = new THREE.Vector3(
                this.velocities[i * 3],
                this.velocities[i * 3 + 1],
                this.velocities[i * 3 + 2]
            );
            const density = this.densities[i];
            const pressure = this.pressures[i];
            
            for (let j = 0; j < this.particleCount; j++) {
                if (i === j) continue;
                
                const otherPos = new THREE.Vector3(
                    this.positions[j * 3],
                    this.positions[j * 3 + 1],
                    this.positions[j * 3 + 2]
                );
                const otherVel = new THREE.Vector3(
                    this.velocities[j * 3],
                    this.velocities[j * 3 + 1],
                    this.velocities[j * 3 + 2]
                );
                const otherDensity = this.densities[j];
                const otherPressure = this.pressures[j];
                
                const rVec = pos.clone().sub(otherPos);
                const r = rVec.length();
                
                if (r < h && r > 0.001) {
                    const pressureTerm = (pressure / (density * density)) + (otherPressure / (otherDensity * otherDensity));
                    pressureForce.add(spikyGradient(rVec, r).multiplyScalar(-particleMass * pressureTerm));
                    
                    const visc = otherVel.clone().sub(vel).multiplyScalar(
                        this.viscosity * particleMass / otherDensity * viscosityLaplacian(r)
                    );
                    viscosityForce.add(visc);
                }
            }
            
            let externalForce = new THREE.Vector3(0, 0, 0);
            if (this.forceField) {
                const force = this.forceField.getForce(pos);
                externalForce.add(force);
            }
            
            const totalForce = pressureForce.add(viscosityForce).add(gravity).add(externalForce);
            const acceleration = totalForce.divideScalar(density);
            
            vel.add(acceleration.multiplyScalar(dt));
            vel.multiplyScalar(0.99);
            
            pos.add(vel.clone().multiplyScalar(dt));
            
            pos.clamp(boundaryMin, boundaryMax);
            
            if (this.obstacleManager) {
                this.obstacleManager.collideParticle(pos, vel);
            }
            
            if (pos.y <= boundaryMin.y + 0.05) {
                vel.y *= -0.3;
                vel.x *= 0.9;
                vel.z *= 0.9;
            }
            
            this.positions[i * 3] = pos.x;
            this.positions[i * 3 + 1] = pos.y;
            this.positions[i * 3 + 2] = pos.z;
            this.velocities[i * 3] = vel.x;
            this.velocities[i * 3 + 1] = vel.y;
            this.velocities[i * 3 + 2] = vel.z;
        }
    }
    
    update(dt) {
        if (this.device && this.particleCount > 0) {
            this.updateWithWebGPU(dt);
        } else if (this.particleCount > 0) {
            this.updateParticleAges(dt);
            this.updateCPUSPH(dt);
        }
        
        if (this.trailSystem && this.particleCount > 0) {
            this.trailSystem.updateHistory(this.positions, this.velocities, this.particleCount);
        }
        
        this.updateColors();
        this.updateThreeJSAttributes();
    }
    
    updateParticleAges(dt) {
        for (let i = 0; i < this.particleCount; i++) {
            if (this.lifetimes[i] > 0) {
                this.ages[i] += dt;
                
                if (this.ages[i] > this.lifetimes[i]) {
                    this.positions[i * 3] = ((i % 64) - 32) / 16;
                    this.positions[i * 3 + 1] = 6 + ((i / 64) % 8) / 4;
                    this.positions[i * 3 + 2] = ((i / 512) % 64 - 32) / 16;
                    this.velocities[i * 3] = 0;
                    this.velocities[i * 3 + 1] = 0;
                    this.velocities[i * 3 + 2] = 0;
                    this.ages[i] = 0;
                }
            }
        }
    }
    
    updateWithWebGPU(dt) {
        if (!this.device || !this.bindGroup) return;
        
        const obstacles = this.obstacleManager ? this.obstacleManager.getObstacleData() : [];
        const obstacleData = new Float32Array(32 * 12);
        obstacles.forEach((obs, i) => {
            const base = i * 12;
            obstacleData[base] = obs.type;
            obstacleData[base + 1] = obs.position.x;
            obstacleData[base + 2] = obs.position.y;
            obstacleData[base + 3] = obs.position.z;
            obstacleData[base + 4] = obs.size.x;
            obstacleData[base + 5] = obs.size.y;
            obstacleData[base + 6] = obs.size.z;
            obstacleData[base + 7] = obs.radius;
        });
        this.device.queue.writeBuffer(this.obstacleBuffer, 0, obstacleData);
        
        const params = new Float32Array([this.viscosity, this.surfaceTension, dt, 0]);
        this.device.queue.writeBuffer(this.paramsBuffer, 0, params);
        
        const forceData = this.forceField ? this.forceField.getShaderData() : new Float32Array([0, 0, 0, 0]);
        this.device.queue.writeBuffer(this.forceFieldBuffer, 0, forceData);
        
        const forcePosData = this.forceField ? this.forceField.getPositionData() : new Float32Array([0, 0, 0, 0]);
        this.device.queue.writeBuffer(this.forceFieldPosBuffer, 0, forcePosData);
        
        const commandEncoder = this.device.createCommandEncoder();
        
        let pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.densityPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(Math.ceil(this.particleCount / 256));
        pass.end();
        
        pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.forcesPipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(Math.ceil(this.particleCount / 256));
        pass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
        
        this.readbackParticles();
    }
    
    async readbackParticles() {
        const readBuffer = this.device.createBuffer({
            size: this.particleBuffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        
        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(this.particleBuffer, 0, readBuffer, 0, this.particleBuffer.size);
        this.device.queue.submit([commandEncoder.finish()]);
        
        await readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Float32Array(readBuffer.getMappedRange());
        
        for (let i = 0; i < this.particleCount; i++) {
            const base = i * 16;
            this.positions[i * 3] = data[base];
            this.positions[i * 3 + 1] = data[base + 1];
            this.positions[i * 3 + 2] = data[base + 2];
            this.velocities[i * 3] = data[base + 3];
            this.velocities[i * 3 + 1] = data[base + 4];
            this.velocities[i * 3 + 2] = data[base + 5];
            this.densities[i] = data[base + 6];
            this.pressures[i] = data[base + 7];
            this.ages[i] = data[base + 8];
            this.lifetimes[i] = data[base + 9];
        }
        
        readBuffer.unmap();
    }
    
    renderPoints(renderer, camera) {
        if (this.points) {
            renderer.render(new THREE.Scene().add(this.points), camera);
        }
    }
    
    renderTrails(renderer, camera) {
        if (this.trailSystem) {
            this.trailSystem.renderTrails(renderer, camera);
        }
    }
    
    setColorMode(mode) {
        this.colorMode = mode;
    }
    
    setRenderMode(mode) {
        this.renderMode = mode;
    }
    
    setViscosity(val) {
        this.viscosity = val;
    }
    
    setSurfaceTension(val) {
        this.surfaceTension = val;
    }
    
    setParticleLifetime(lifetime) {
        this.particleLifetime = lifetime;
        for (let i = 0; i < this.particleCount; i++) {
            this.lifetimes[i] = lifetime;
        }
        this.updateGPUBuffer();
    }
    
    setTrailLength(length) {
        if (this.trailSystem) {
            this.trailSystem.setTrailLength(length);
        }
    }
    
    setTrailWidth(width) {
        if (this.trailSystem) {
            this.trailSystem.setTrailWidth(width);
        }
    }
    
    setTrailFade(fade) {
        if (this.trailSystem) {
            this.trailSystem.setTrailFade(fade);
        }
    }
    
    setEnableTrails(enable) {
        this.enableTrails = enable;
        if (enable && !this.trailSystem) {
            this.trailSystem = new TrailSystem({
                maxParticles: this.maxParticles,
                trailLength: 30,
                trailFade: 0.95,
                trailWidth: 0.05
            });
        }
    }
    
    getPositions() {
        return this.positions;
    }
    
    getVelocities() {
        return this.velocities;
    }
}
