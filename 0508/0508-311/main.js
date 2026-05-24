const canvas = document.getElementById('canvas');
const fpsElement = document.getElementById('fps');
const samplesElement = document.getElementById('samples');
const aaToggle = document.getElementById('aaToggle');
const dofToggle = document.getElementById('dofToggle');
const focalLengthSlider = document.getElementById('focalLength');
const apertureSlider = document.getElementById('aperture');
const focalLengthValue = document.getElementById('focalLengthValue');
const apertureValue = document.getElementById('apertureValue');

const WIDTH = 1024;
const HEIGHT = 768;
const MAX_BOUNCES = 4;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let device, context, format;
let pathTracePipeline, fxaaPipeline, presentPipeline;
let pathTraceBindGroup, fxaaBindGroup, presentBindGroup, presentBindGroupFXAA;
let sceneUniformBuffer, cameraUniformBuffer, seedBuffer;
let accumulateTexture, intermediateTexture;
let sampler;

let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

const camera = {
    position: [0, 2, 5],
    rotation: [0, 0],
    forward: [0, 0, -1],
    right: [1, 0, 0],
    up: [0, 1, 0],
    focalLength: 5.0,
    aperture: 0.1,
    dofEnabled: true
};

const keys = {};
let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

async function initWebGPU() {
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('Failed to get GPU adapter');
    }

    device = await adapter.requestDevice();
    context = canvas.getContext('webgpu');
    format = navigator.gpu.getPreferredCanvasFormat();
    
    context.configure({
        device,
        format,
        alphaMode: 'premultiplied'
    });
}

function createBuffers() {
    sceneUniformBuffer = device.createBuffer({
        size: 512,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    cameraUniformBuffer = device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    seedBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
}

function createTextures() {
    accumulateTexture = device.createTexture({
        size: [WIDTH, HEIGHT],
        format: 'rgba32float',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });

    intermediateTexture = device.createTexture({
        size: [WIDTH, HEIGHT],
        format: 'rgba32float',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
    });

    sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
    });
}

function createShaders() {
    const pathTraceCode = `
struct Camera {
    position: vec3f,
    pad0: f32,
    forward: vec3f,
    pad1: f32,
    right: vec3f,
    pad2: f32,
    up: vec3f,
    pad3: f32,
    frame: f32,
    focalLength: f32,
    aperture: f32,
    dofEnabled: u32
};

struct Sphere {
    center: vec3f,
    radius: f32,
    color: vec3f,
    material: u32,
    metalFuzz: f32,
    refractionIndex: f32
};

struct PointLight {
    position: vec3f,
    pad0: f32,
    color: vec3f,
    intensity: f32
};

struct Scene {
    spheres: array<Sphere, 6>,
    pointLight: PointLight,
    sphereCount: u32
};

struct Ray {
    origin: vec3f,
    direction: vec3f
};

struct Hit {
    distance: f32,
    point: vec3f,
    normal: vec3f,
    color: vec3f,
    material: u32,
    metalFuzz: f32,
    refractionIndex: f32,
    hit: bool
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> scene: Scene;
@group(0) @binding(2) var<uniform> seed: vec2f;
@group(0) @binding(3) var<storage, read_write> accumulate: array<vec4f>;

var<private> randState: u32 = 0u;

fn wangHash(seed: u32) -> u32 {
    var v = seed;
    v = (v ^ 61u) ^ (v >> 16u);
    v = v + (v << 3u);
    v = v ^ (v >> 4u);
    v = v * 0x27d4eb2du;
    v = v ^ (v >> 15u);
    return v;
}

fn initRand(px: u32, py: u32, frame: u32) {
    randState = wangHash(px + py * 1024u + frame * 719393u);
}

fn rand() -> f32 {
    randState = wangHash(randState);
    return f32(randState) / 4294967295.0;
}

fn rand2() -> vec2f {
    return vec2f(rand(), rand());
}

fn rand3() -> vec3f {
    return vec3f(rand(), rand(), rand());
}

fn randomInUnitSphere() -> vec3f {
    loop {
        let p = 2.0 * rand3() - vec3f(1.0);
        if dot(p, p) < 1.0 {
            return p;
        }
    }
}

fn randomUnitVector() -> vec3f {
    return normalize(randomInUnitSphere());
}

fn randomInUnitDisk() -> vec2f {
    loop {
        let p = 2.0 * rand2() - vec2f(1.0);
        if dot(p, p) < 1.0 {
            return p;
        }
    }
}

fn refract(uv: vec3f, n: vec3f, etaiOverEtat: f32) -> vec3f {
    let cosTheta = min(dot(-uv, n), 1.0);
    let rOutPerp = etaiOverEtat * (uv + cosTheta * n);
    let rOutParallel = -sqrt(abs(1.0 - dot(rOutPerp, rOutPerp))) * n;
    return rOutPerp + rOutParallel;
}

fn reflect(v: vec3f, n: vec3f) -> vec3f {
    return v - 2.0 * dot(v, n) * n;
}

fn schlick(cosine: f32, refractionIndex: f32) -> f32 {
    var r0 = (1.0 - refractionIndex) / (1.0 + refractionIndex);
    r0 = r0 * r0;
    return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
}

fn intersectSphere(ray: Ray, sphere: Sphere) -> Hit {
    var hit: Hit;
    hit.hit = false;
    
    let oc = ray.origin - sphere.center;
    let a = dot(ray.direction, ray.direction);
    let halfB = dot(oc, ray.direction);
    let c = dot(oc, oc) - sphere.radius * sphere.radius;
    let discriminant = halfB * halfB - a * c;
    
    if discriminant < 0.0 {
        return hit;
    }
    
    let sqrtD = sqrt(discriminant);
    var t = (-halfB - sqrtD) / a;
    if t < 0.001 {
        t = (-halfB + sqrtD) / a;
        if t < 0.001 {
            return hit;
        }
    }
    
    hit.distance = t;
    hit.point = ray.origin + t * ray.direction;
    hit.normal = normalize(hit.point - sphere.center);
    hit.color = sphere.color;
    hit.material = sphere.material;
    hit.metalFuzz = sphere.metalFuzz;
    hit.refractionIndex = sphere.refractionIndex;
    hit.hit = true;
    
    return hit;
}

fn intersectScene(ray: Ray) -> Hit {
    var closestHit: Hit;
    closestHit.distance = 1000000.0;
    closestHit.hit = false;
    
    for (var i: u32 = 0u; i < scene.sphereCount; i++) {
        let hit = intersectSphere(ray, scene.spheres[i]);
        if hit.hit && hit.distance < closestHit.distance {
            closestHit = hit;
        }
    }
    
    return closestHit;
}

fn traceRay(ray: Ray) -> vec3f {
    var color = vec3f(0.0);
    var throughput = vec3f(1.0);
    var currentRay = ray;
    
    for (var bounce: u32 = 0u; bounce < 4u; bounce++) {
        let hit = intersectScene(currentRay);
        
        if (!hit.hit) {
            let t = 0.5 * (normalize(currentRay.direction).y + 1.0);
            let skyColor = mix(vec3f(1.0, 1.0, 1.0), vec3f(0.5, 0.7, 1.0), t);
            color += throughput * skyColor;
            break;
        }
        
        let lightDir = scene.pointLight.position - hit.point;
        let lightDistance = length(lightDir);
        let lightDirNorm = normalize(lightDir);
        
        let shadowRayOrigin = hit.point + hit.normal * 0.001;
        let shadowRay: Ray = Ray(shadowRayOrigin, lightDirNorm);
        let shadowHit = intersectScene(shadowRay);
        
        if (!shadowHit.hit || shadowHit.distance > lightDistance) {
            let diffuse = max(dot(hit.normal, lightDirNorm), 0.0);
            let attenuation = 1.0 / (1.0 + 0.01 * lightDistance * lightDistance);
            color += throughput * hit.color * diffuse * scene.pointLight.color * scene.pointLight.intensity * attenuation;
        }
        
        if hit.material == 0u {
            let scatterDir = normalize(hit.normal + randomUnitVector());
            currentRay = Ray(hit.point + hit.normal * 0.001, scatterDir);
            throughput *= hit.color;
        } else if hit.material == 1u {
            let reflected = reflect(normalize(currentRay.direction), hit.normal);
            let fuzzed = reflected + hit.metalFuzz * randomUnitVector();
            currentRay = Ray(hit.point + hit.normal * 0.001, normalize(fuzzed));
            throughput *= hit.color;
        } else if hit.material == 2u {
            let outwardNormal: vec3f;
            let niOverNt: f32;
            let cosine: f32;
            let dirNorm = normalize(currentRay.direction);
            
            let dotProduct = dot(dirNorm, hit.normal);
            if dotProduct > 0.0 {
                outwardNormal = -hit.normal;
                niOverNt = hit.refractionIndex;
                cosine = hit.refractionIndex * dotProduct;
            } else {
                outwardNormal = hit.normal;
                niOverNt = 1.0 / hit.refractionIndex;
                cosine = -dotProduct;
            }
            
            let reflectProb = schlick(cosine, hit.refractionIndex);
            
            if rand() < reflectProb {
                let reflected = reflect(dirNorm, hit.normal);
                currentRay = Ray(hit.point + outwardNormal * 0.001, reflected);
            } else {
                let refracted = refract(dirNorm, outwardNormal, niOverNt);
                currentRay = Ray(hit.point - outwardNormal * 0.001, refracted);
            }
            throughput *= hit.color;
        }
        
        throughput *= 0.9;
    }
    
    return color;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3u) {
    if id.x >= u32(${WIDTH}) || id.y >= u32(${HEIGHT}) {
        return;
    }
    
    initRand(id.x, id.y, u32(camera.frame));
    
    let aspect = f32(${WIDTH}) / f32(${HEIGHT});
    let fov = 0.8;
    
    let jitter = (rand2() - vec2f(0.5)) * 0.5;
    let u = (f32(id.x) + 0.5 + jitter.x) / f32(${WIDTH}) * 2.0 - 1.0;
    let v = ((f32(id.y) + 0.5 + jitter.y) / f32(${HEIGHT}) * 2.0 - 1.0) * (1.0 / aspect);
    
    var rayOrigin = camera.position;
    var rayDir = normalize(camera.forward * fov + camera.right * u + camera.up * v);
    
    if (camera.dofEnabled == 1u && camera.aperture > 0.0) {
        let focalPoint = camera.position + rayDir * camera.focalLength;
        
        let lensUV = randomInUnitDisk() * camera.aperture;
        rayOrigin = camera.position + camera.right * lensUV.x + camera.up * lensUV.y;
        rayDir = normalize(focalPoint - rayOrigin);
    }
    
    let ray: Ray = Ray(rayOrigin, rayDir);
    let color = traceRay(ray);
    let pixelIndex = id.y * u32(${WIDTH}) + id.x;
    
    let alpha = 1.0 / (camera.frame + 1.0);
    let oldColor = accumulate[pixelIndex].rgb;
    accumulate[pixelIndex] = vec4f(mix(oldColor, color, alpha), 1.0);
}
`;

    const fxaaCode = `
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> output: array<vec4f>;
@group(0) @binding(2) var texSampler: sampler;

const WIDTH: u32 = ${WIDTH}u;
const HEIGHT: u32 = ${HEIGHT}u;

fn luminance(color: vec3f) -> f32 {
    return dot(color, vec3f(0.299, 0.587, 0.114));
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3u) {
    if id.x >= WIDTH || id.y >= HEIGHT {
        return;
    }
    
    let uv = vec2f(f32(id.x) + 0.5, f32(id.y) + 0.5) / vec2f(f32(WIDTH), f32(HEIGHT));
    let texelSize = vec2f(1.0 / f32(WIDTH), 1.0 / f32(HEIGHT));
    
    let M = textureSample(inputTex, texSampler, uv).rgb;
    let N = textureSample(inputTex, texSampler, uv + vec2f(0.0, -texelSize.y)).rgb;
    let S = textureSample(inputTex, texSampler, uv + vec2f(0.0, texelSize.y)).rgb;
    let W = textureSample(inputTex, texSampler, uv + vec2f(-texelSize.x, 0.0)).rgb;
    let E = textureSample(inputTex, texSampler, uv + vec2f(texelSize.x, 0.0)).rgb;
    
    let lM = luminance(M);
    let lN = luminance(N);
    let lS = luminance(S);
    let lW = luminance(W);
    let lE = luminance(E);
    
    let lMin = min(lM, min(min(lN, lS), min(lW, lE)));
    let lMax = max(lM, max(max(lN, lS), max(lW, lE)));
    
    let contrast = lMax - lMin;
    let contrastThreshold = 0.0312;
    let relativeThreshold = 0.125;
    
    if contrast < max(contrastThreshold, lMax * relativeThreshold) {
        output[id.y * WIDTH + id.x] = vec4f(M, 1.0);
        return;
    }
    
    let lNW = luminance(textureSample(inputTex, texSampler, uv + vec2f(-texelSize.x, -texelSize.y)).rgb);
    let lNE = luminance(textureSample(inputTex, texSampler, uv + vec2f(texelSize.x, -texelSize.y)).rgb);
    let lSW = luminance(textureSample(inputTex, texSampler, uv + vec2f(-texelSize.x, texelSize.y)).rgb);
    let lSE = luminance(textureSample(inputTex, texSampler, uv + vec2f(texelSize.x, texelSize.y)).rgb);
    
    let horizontal = 2.0 * abs(lN + lS - 2.0 * lM) + abs(lNE + lSE - 2.0 * lE) + abs(lNW + lSW - 2.0 * lW);
    let vertical = 2.0 * abs(lW + lE - 2.0 * lM) + abs(lNW + lNE - 2.0 * lN) + abs(lSW + lSE - 2.0 * lS);
    
    var stepSize = texelSize;
    if horizontal > vertical {
        stepSize = vec2f(0.0, texelSize.y);
    } else {
        stepSize = vec2f(texelSize.x, 0.0);
    }
    
    let gradient = max(horizontal, vertical);
    let blend = min(1.0, gradient / (lMax - lMin) * 0.5);
    
    let colorA = textureSample(inputTex, texSampler, uv - stepSize * blend).rgb;
    let colorB = textureSample(inputTex, texSampler, uv + stepSize * blend).rgb;
    
    output[id.y * WIDTH + id.x] = vec4f((colorA + colorB) * 0.5, 1.0);
}
`;

    const presentCode = `
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var ourSampler: sampler;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f
};

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
    var positions = array<vec2f, 6>(
        vec2f(-1.0, -1.0),
        vec2f(1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(-1.0, 1.0)
    );
    
    var uvs = array<vec2f, 6>(
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 0.0)
    );
    
    var output: VertexOutput;
    output.position = vec4f(positions[index], 0.0, 1.0);
    output.uv = uvs[index];
    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    let color = textureSample(inputTex, ourSampler, input.uv).rgb;
    let tonemapped = color / (color + vec3f(1.0));
    let gammaCorrected = pow(tonemapped, vec3f(1.0 / 2.2));
    return vec4f(gammaCorrected, 1.0);
}
`;

    return { pathTraceCode, fxaaCode, presentCode };
}

function createPipelines(shaders) {
    const pathTraceModule = device.createShaderModule({
        code: shaders.pathTraceCode
    });

    pathTracePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module: pathTraceModule,
            entryPoint: 'main'
        }
    });

    const fxaaModule = device.createShaderModule({
        code: shaders.fxaaCode
    });

    fxaaPipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module: fxaaModule,
            entryPoint: 'main'
        }
    });

    const presentModule = device.createShaderModule({
        code: shaders.presentCode
    });

    presentPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: presentModule,
            entryPoint: 'vs_main'
        },
        fragment: {
            module: presentModule,
            entryPoint: 'fs_main',
            targets: [{ format }]
        },
        primitive: {
            topology: 'triangle-list'
        }
    });
}

function updateSceneBuffer() {
    const data = new Float32Array(128);
    let offset = 0;

    const spheres = [
        { center: [0, 0, 0], radius: 1, color: [0.8, 0.3, 0.3], material: 0, metalFuzz: 0, refractionIndex: 1 },
        { center: [-2.5, 0, 0], radius: 1, color: [0.95, 0.95, 0.95], material: 1, metalFuzz: 0.05, refractionIndex: 1 },
        { center: [2.5, 0, 0], radius: 1, color: [1.0, 1.0, 1.0], material: 2, metalFuzz: 0, refractionIndex: 1.5 },
        { center: [0, -1001, 0], radius: 1000, color: [0.5, 0.5, 0.5], material: 0, metalFuzz: 0, refractionIndex: 1 },
        { center: [-4, 0, -2], radius: 1, color: [0.3, 0.8, 0.3], material: 0, metalFuzz: 0, refractionIndex: 1 },
        { center: [4, 0, -2], radius: 1, color: [0.3, 0.3, 0.8], material: 0, metalFuzz: 0, refractionIndex: 1 },
    ];

    spheres.forEach((sphere) => {
        data.set(sphere.center, offset); offset += 3;
        data[offset++] = sphere.radius;
        data.set(sphere.color, offset); offset += 3;
        data[offset++] = sphere.material;
        data[offset++] = sphere.metalFuzz;
        data[offset++] = sphere.refractionIndex;
        offset += 4;
    });

    offset = 96;
    data.set([5, 5, 5], offset); offset += 3;
    data[offset++] = 0;
    data.set([1, 1, 1], offset); offset += 3;
    data[offset++] = 40;

    data[124] = spheres.length;

    device.queue.writeBuffer(sceneUniformBuffer, 0, data);
}

function updateCameraBuffer() {
    const pitch = camera.rotation[0];
    const yaw = camera.rotation[1];
    
    camera.forward = [
        -Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        -Math.cos(yaw) * Math.cos(pitch)
    ];
    
    camera.right = [
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    ];
    
    camera.up = [0, 1, 0];
    
    const data = new Float32Array(32);
    data.set(camera.position, 0);
    data.set(camera.forward, 4);
    data.set(camera.right, 8);
    data.set(camera.up, 12);
    data[16] = frameCount;
    data[17] = camera.focalLength;
    data[18] = camera.aperture;
    data[19] = camera.dofEnabled ? 1 : 0;
    
    device.queue.writeBuffer(cameraUniformBuffer, 0, data);
}

function updateSeedBuffer() {
    const data = new Float32Array([Math.random(), Math.random()]);
    device.queue.writeBuffer(seedBuffer, 0, data);
}

function createBindGroups() {
    const accumulateView = accumulateTexture.createView();
    const intermediateView = intermediateTexture.createView();

    pathTraceBindGroup = device.createBindGroup({
        layout: pathTracePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: cameraUniformBuffer } },
            { binding: 1, resource: { buffer: sceneUniformBuffer } },
            { binding: 2, resource: { buffer: seedBuffer } },
            { binding: 3, resource: accumulateView }
        ]
    });

    fxaaBindGroup = device.createBindGroup({
        layout: fxaaPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: accumulateView },
            { binding: 1, resource: intermediateView },
            { binding: 2, resource: sampler }
        ]
    });

    presentBindGroup = device.createBindGroup({
        layout: presentPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: accumulateView },
            { binding: 1, resource: sampler }
        ]
    });

    presentBindGroupFXAA = device.createBindGroup({
        layout: presentPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: intermediateView },
            { binding: 1, resource: sampler }
        ]
    });
}

function resetAccumulation() {
    const data = new Float32Array(WIDTH * HEIGHT * 4);
    device.queue.writeTexture(
        { texture: accumulateTexture },
        data,
        { bytesPerRow: WIDTH * 16, rowsPerImage: HEIGHT },
        { width: WIDTH, height: HEIGHT }
    );
    frameCount = 0;
}

function render() {
    updateCameraBuffer();
    updateSeedBuffer();

    const commandEncoder = device.createCommandEncoder();

    const pathTracePass = commandEncoder.beginComputePass();
    pathTracePass.setPipeline(pathTracePipeline);
    pathTracePass.setBindGroup(0, pathTraceBindGroup);
    pathTracePass.dispatchWorkgroups(Math.ceil(WIDTH / 16), Math.ceil(HEIGHT / 16));
    pathTracePass.end();

    if (aaToggle.checked) {
        const fxaaPass = commandEncoder.beginComputePass();
        fxaaPass.setPipeline(fxaaPipeline);
        fxaaPass.setBindGroup(0, fxaaBindGroup);
        fxaaPass.dispatchWorkgroups(Math.ceil(WIDTH / 16), Math.ceil(HEIGHT / 16));
        fxaaPass.end();
    }

    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            storeOp: 'store',
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
        }]
    });
    renderPass.setPipeline(presentPipeline);
    renderPass.setBindGroup(0, aaToggle.checked ? presentBindGroupFXAA : presentBindGroup);
    renderPass.draw(6);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    frameCount++;
    samplesElement.textContent = frameCount;

    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        fpsElement.textContent = fps;
        lastTime = currentTime;
        frameCount = 0;
    }

    requestAnimationFrame(render);
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('mousedown', (e) => {
        mouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (mouseDown) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            
            camera.rotation[1] += dx * 0.005;
            camera.rotation[0] += dy * 0.005;
            camera.rotation[0] = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation[0]));
            
            resetAccumulation();
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    aaToggle.addEventListener('change', () => {
        resetAccumulation();
    });

    dofToggle.addEventListener('change', () => {
        camera.dofEnabled = dofToggle.checked;
        resetAccumulation();
    });

    focalLengthSlider.addEventListener('input', () => {
        camera.focalLength = parseFloat(focalLengthSlider.value);
        focalLengthValue.textContent = camera.focalLength.toFixed(1);
        resetAccumulation();
    });

    apertureSlider.addEventListener('input', () => {
        camera.aperture = parseFloat(apertureSlider.value);
        apertureValue.textContent = camera.aperture.toFixed(2);
        resetAccumulation();
    });
}

function updateCameraPosition() {
    const speed = 0.1;
    let moved = false;

    if (keys['w']) {
        camera.position[0] += camera.forward[0] * speed;
        camera.position[1] += camera.forward[1] * speed;
        camera.position[2] += camera.forward[2] * speed;
        moved = true;
    }
    if (keys['s']) {
        camera.position[0] -= camera.forward[0] * speed;
        camera.position[1] -= camera.forward[1] * speed;
        camera.position[2] -= camera.forward[2] * speed;
        moved = true;
    }
    if (keys['a']) {
        camera.position[0] -= camera.right[0] * speed;
        camera.position[2] -= camera.right[2] * speed;
        moved = true;
    }
    if (keys['d']) {
        camera.position[0] += camera.right[0] * speed;
        camera.position[2] += camera.right[2] * speed;
        moved = true;
    }
    if (keys['q']) {
        camera.position[1] -= speed;
        moved = true;
    }
    if (keys['e']) {
        camera.position[1] += speed;
        moved = true;
    }

    if (moved) {
        resetAccumulation();
    }

    requestAnimationFrame(updateCameraPosition);
}

async function main() {
    try {
        await initWebGPU();
        createBuffers();
        createTextures();
        const shaders = createShaders();
        createPipelines(shaders);
        updateSceneBuffer();
        createBindGroups();
        setupControls();
        updateCameraPosition();
        resetAccumulation();
        render();
        console.log('WebGPU Path Tracing initialized successfully');
    } catch (e) {
        console.error('Error initializing WebGPU:', e);
        alert('WebGPU not supported. Please use a compatible browser (Chrome 113+, Edge 113+, etc.)');
    }
}

main();
