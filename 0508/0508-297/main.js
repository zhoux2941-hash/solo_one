class ClothSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.format = null;
        
        this.clothWidth = 2.0;
        this.clothHeight = 2.0;
        this.resolution = 50;
        
        this.vertices = [];
        this.indices = [];
        this.constraints = [];
        
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.uniformBuffer = null;
        this.computeUniformBuffer = null;
        
        this.renderPipeline = null;
        this.computePipeline = null;
        self.renderBindGroup = null;
        this.computeBindGroup = null;
        
        this.cameraMode = 'orbit';
        this.cameraPosition = [0, 2, 5];
        this.cameraRotation = [0, 0];
        this.orbitDistance = 5;
        this.orbitAngleX = 0;
        this.orbitAngleY = 0.3;
        
        this.params = {
            structuralStiffness: 0.95,
            shearStiffness: 0.8,
            bendStiffness: 0.5,
            damping: 0.98,
            gravity: -9.8,
            windStrength: 5.0,
            turbulence: 2.0,
            windSpeed: 1.0,
            enableWind: true,
            enableSelfCollision: true,
            enableShapeCollision: true,
            collisionDistance: 0.02,
            collisionStiffness: 0.95,
            ccdIterations: 3,
            collisionShape: 'sphere',
            sphereCenter: [0, 0, 0],
            sphereRadius: 0.8,
            boxMin: [-0.6, -0.6, -0.6],
            boxMax: [0.6, 0.6, 0.6],
            metallic: 0.1,
            roughness: 0.7,
            enableShadows: true,
            enableNormalMap: true,
            enableTearing: true,
            tearThreshold: 1.5,
            tearDamping: 0.3
        };
        
        this.time = 0;
        this.frameCount = 0;
        this.lastFpsTime = performance.now();
        
        this.keys = {};
        this.mouseDown = false;
        this.mouseButton = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.init();
    }
    
    async init() {
        await this.initWebGPU();
        this.initCloth();
        this.initBuffers();
        this.initShaders();
        this.initPipelines();
        this.initEventListeners();
        this.initUI();
        this.animate();
    }
    
    async initWebGPU() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (!navigator.gpu) {
            alert('WebGPU is not supported in your browser. Please use Chrome 113+ or Edge 113+.');
            return;
        }
        
        this.adapter = await navigator.gpu.requestAdapter();
        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.format = navigator.gpu.getPreferredCanvasFormat();
        
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied'
        });
        
        this.depthTexture = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depthView = this.depthTexture.createView();
    }
    
    initCloth() {
        const cols = this.resolution;
        const rows = this.resolution;
        const dx = this.clothWidth / (cols - 1);
        const dy = this.clothHeight / (rows - 1);
        
        this.vertices = [];
        this.indices = [];
        this.constraints = [];
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = (x - cols / 2) * dx;
                const py = 2.0;
                const pz = (y - rows / 2) * dy;
                
                const u = x / (cols - 1);
                const v = y / (rows - 1);
                
                const pinned = (y === 0 && (x === 0 || x === cols - 1));
                
                this.vertices.push({
                    position: [px, py, pz],
                    prevPosition: [px, py, pz],
                    normal: [0, 1, 0],
                    texCoord: [u, v],
                    velocity: [0, 0, 0],
                    pinned: pinned ? 1.0 : 0.0,
                    tearMask: [0, 0, 0, 0, 0, 0, 0, 0]
                });
            }
        }
        
        for (let y = 0; y < rows - 1; y++) {
            for (let x = 0; x < cols - 1; x++) {
                const i = y * cols + x;
                this.indices.push(i, i + cols, i + 1);
                this.indices.push(i + 1, i + cols, i + cols + 1);
            }
        }
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                
                if (x < cols - 1) {
                    this.constraints.push({
                        type: 'structural',
                        a: i,
                        b: i + 1,
                        restLength: dx
                    });
                }
                
                if (y < rows - 1) {
                    this.constraints.push({
                        type: 'structural',
                        a: i,
                        b: i + cols,
                        restLength: dy
                    });
                }
                
                if (x < cols - 1 && y < rows - 1) {
                    this.constraints.push({
                        type: 'shear',
                        a: i,
                        b: i + cols + 1,
                        restLength: Math.sqrt(dx * dx + dy * dy)
                    });
                    this.constraints.push({
                        type: 'shear',
                        a: i + 1,
                        b: i + cols,
                        restLength: Math.sqrt(dx * dx + dy * dy)
                    });
                }
                
                if (x < cols - 2) {
                    this.constraints.push({
                        type: 'bend',
                        a: i,
                        b: i + 2,
                        restLength: dx * 2
                    });
                }
                if (y < rows - 2) {
                    this.constraints.push({
                        type: 'bend',
                        a: i,
                        b: i + cols * 2,
                        restLength: dy * 2
                    });
                }
            }
        }
        
        document.getElementById('vertex-count').textContent = this.vertices.length;
        document.getElementById('constraint-count').textContent = this.constraints.length;
    }
    
    resetTearing() {
        const cols = this.resolution;
        const rows = this.resolution;
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                this.vertices[i].tearMask = [0, 0, 0, 0, 0, 0, 0, 0];
            }
        }
    }
    
    initBuffers() {
        const vertexData = new Float32Array(this.vertices.length * 16);
        const uintView = new Uint32Array(vertexData.buffer);
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];
            vertexData.set(v.position, i * 16);
            vertexData.set(v.prevPosition, i * 16 + 3);
            vertexData.set(v.normal, i * 16 + 6);
            vertexData.set(v.texCoord, i * 16 + 9);
            vertexData.set(v.velocity, i * 16 + 11);
            vertexData[i * 16 + 14] = v.pinned;
            
            let mask = 0;
            for (let j = 0; j < 8; j++) {
                if (v.tearMask[j]) {
                    mask |= 1 << j;
                }
            }
            uintView[i * 16 + 15] = mask;
        }
        
        this.vertexBuffer = this.device.createBuffer({
            size: vertexData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
        this.vertexBuffer.unmap();
        
        const indexData = new Uint32Array(this.indices);
        this.indexBuffer = this.device.createBuffer({
            size: indexData.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });
        new Uint32Array(this.indexBuffer.getMappedRange()).set(indexData);
        this.indexBuffer.unmap();
        
        this.uniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.computeUniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }
    
    initShaders() {
        this.renderShaderCode = `
            struct Uniforms {
                viewProj: mat4x4f,
                cameraPos: vec3f,
                metallic: f32,
                roughness: f32,
                enableNormalMap: f32,
                enableShadows: f32,
                collisionShape: f32,
                padding0: f32,
                sphereCenter: vec3f,
                sphereRadius: f32,
                boxMin: vec3f,
                padding1: f32,
                boxMax: vec3f,
                padding2: f32,
                lightDir: vec3f,
                padding3: f32,
                lightColor: vec3f,
                time: f32
            };
            
            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            
            struct VertexInput {
                @location(0) position: vec3f,
                @location(1) prevPosition: vec3f,
                @location(2) normal: vec3f,
                @location(3) texCoord: vec2f,
                @location(4) velocity: vec3f,
                @location(5) pinned: f32,
                @location(6) tearMask: u32
            };
            
            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) worldPos: vec3f,
                @location(1) normal: vec3f,
                @location(2) texCoord: vec2f,
                @location(3) tangent: vec3f,
                @location(4) bitangent: vec3f,
                @location(5) tearMask: u32
            };
            
            @vertex
            fn vs_main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                output.worldPos = input.position;
                output.position = uniforms.viewProj * vec4f(input.position, 1.0);
                output.normal = normalize(input.normal);
                output.texCoord = input.texCoord;
                output.tearMask = input.tearMask;
                
                var dp = input.position - input.prevPosition;
                output.tangent = normalize(vec3f(1.0, dp.y * 0.5, 0.0));
                output.bitangent = normalize(cross(output.normal, output.tangent));
                output.tangent = cross(output.bitangent, output.normal);
                
                return output;
            }
            
            fn computeTBN(normal: vec3f, tangent: vec3f, bitangent: vec3f) -> mat3x3f {
                return mat3x3f(
                    normalize(tangent),
                    normalize(bitangent),
                    normalize(normal)
                );
            }
            
            fn sampleNormal(uv: vec2f, time: f32) -> vec3f {
                var n = vec3f(0.0);
                n.x = sin(uv.x * 50.0 + time * 2.0) * 0.3;
                n.y = sin(uv.y * 50.0 + time * 1.5) * 0.3;
                n.z = 1.0;
                return normalize(n);
            }
            
            fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
                var a = roughness * roughness;
                var a2 = a * a;
                var NdotH = max(dot(N, H), 0.0);
                var NdotH2 = NdotH * NdotH;
                var num = a2;
                var denom = (NdotH2 * (a2 - 1.0) + 1.0);
                denom = 3.14159265 * denom * denom;
                return num / denom;
            }
            
            fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
                var r = roughness + 1.0;
                var k = (r * r) / 8.0;
                var num = NdotV;
                var denom = NdotV * (1.0 - k) + k;
                return num / denom;
            }
            
            fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
                var NdotV = max(dot(N, V), 0.0);
                var NdotL = max(dot(N, L), 0.0);
                var ggx2 = geometrySchlickGGX(NdotV, roughness);
                var ggx1 = geometrySchlickGGX(NdotL, roughness);
                return ggx1 * ggx2;
            }
            
            fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
                return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
            }
            
            fn sdSphere(p: vec3f, center: vec3f, radius: f32) -> f32 {
                return length(p - center) - radius;
            }
            
            fn sdBox(p: vec3f, b: vec3f) -> f32 {
                let q = abs(p) - b;
                return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
            }
            
            fn getClosestPointOnRay(rayOrigin: vec3f, rayDir: vec3f, point: vec3f) -> f32 {
                return dot(point - rayOrigin, rayDir);
            }
            
            @fragment
            fn fs_main(input: VertexOutput) -> @location(0) vec4f {
                var N = normalize(input.normal);
                
                if (uniforms.enableNormalMap > 0.5) {
                    let TBN = computeTBN(input.normal, input.tangent, input.bitangent);
                    let normalMap = sampleNormal(input.texCoord, uniforms.time);
                    N = normalize(TBN * normalMap);
                }
                
                let V = normalize(uniforms.cameraPos - input.worldPos);
                let L = normalize(uniforms.lightDir);
                let H = normalize(V + L);
                
                let albedo = vec3f(0.8, 0.3, 0.4);
                let F0 = mix(vec3f(0.04), albedo, uniforms.metallic);
                
                let NDF = distributionGGX(N, H, uniforms.roughness);
                let G = geometrySmith(N, V, L, uniforms.roughness);
                let F = fresnelSchlick(max(dot(H, V), 0.0), F0);
                
                let kS = F;
                var kD = vec3f(1.0) - kS;
                kD = kD * (1.0 - uniforms.metallic);
                
                let numerator = NDF * G * F;
                let denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
                let specular = numerator / denominator;
                
                let NdotL = max(dot(N, L), 0.0);
                
                let ambient = 0.03 * albedo;
                let diffuse = kD * albedo / 3.14159265;
                
                var shadow = 1.0;
                if (uniforms.enableShadows > 0.5) {
                    shadow = 0.7 + 0.3 * NdotL;
                }
                
                let radiance = uniforms.lightColor;
                let Lo = (diffuse + specular) * radiance * NdotL * shadow;
                
                var color = ambient + Lo;
                color = color / (color + vec3f(1.0));
                color = pow(color, vec3f(1.0 / 2.2));
                
                var wireframeColor = vec3f(0.2, 0.8, 1.0);
                var wireframeAlpha = 0.0;
                
                if (uniforms.collisionShape == 0u) {
                    let d = sdSphere(input.worldPos, uniforms.sphereCenter, uniforms.sphereRadius);
                    let edgeWidth = 0.02;
                    wireframeAlpha = smoothstep(edgeWidth, 0.0, abs(d)) * 0.4;
                    
                    if (d < 0.0) {
                        color = mix(color, vec3f(0.1, 0.2, 0.3), 0.3);
                    }
                } else {
                    let boxCenter = (uniforms.boxMin + uniforms.boxMax) * 0.5;
                    let boxExtent = (uniforms.boxMax - uniforms.boxMin) * 0.5;
                    let d = sdBox(input.worldPos - boxCenter, boxExtent);
                    let edgeWidth = 0.02;
                    wireframeAlpha = smoothstep(edgeWidth, 0.0, abs(d)) * 0.4;
                    
                    if (d < 0.0) {
                        color = mix(color, vec3f(0.1, 0.2, 0.3), 0.3);
                    }
                }
                
                color = mix(color, wireframeColor, wireframeAlpha);
                
                if (input.tearMask != 0u) {
                    let tearEdge = vec3f(0.9, 0.2, 0.1);
                    var tearCount = 0.0;
                    for (var i: u32 = 0u; i < 8u; i++) {
                        if ((input.tearMask & (1u << i)) != 0u) {
                            tearCount = tearCount + 1.0;
                        }
                    }
                    let tearIntensity = min(tearCount / 2.0, 1.0) * 0.6;
                    color = mix(color, tearEdge, tearIntensity);
                }
                
                return vec4f(color, 1.0);
            }
        `;
        
        this.computeShaderCode = `
            struct Uniforms {
                deltaTime: f32,
                gravity: f32,
                damping: f32,
                structuralStiffness: f32,
                shearStiffness: f32,
                bendStiffness: f32,
                windStrength: f32,
                turbulence: f32,
                windSpeed: f32,
                enableWind: f32,
                enableSelfCollision: f32,
                enableShapeCollision: f32,
                collisionDistance: f32,
                collisionStiffness: f32,
                ccdIterations: u32,
                collisionShape: u32,
                sphereCenter: vec3f,
                sphereRadius: f32,
                boxMin: vec3f,
                boxMax: vec3f,
                enableTearing: f32,
                tearThreshold: f32,
                tearDamping: f32,
                time: f32,
                vertexCount: u32,
                constraintCount: u32
            };
            
            struct Vertex {
                position: vec3f,
                prevPosition: vec3f,
                normal: vec3f,
                texCoord: vec2f,
                velocity: vec3f,
                pinned: f32,
                tearMask: u32
            };
            
            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read_write> vertices: array<Vertex>;
            
            fn windForce(pos: vec3f, normal: vec3f, time: f32) -> vec3f {
                var windDir = vec3f(1.0, 0.2, 0.5);
                
                let noiseX = sin(pos.x * 2.0 + time * uniforms.windSpeed) * cos(pos.z * 1.5 + time * 0.7);
                let noiseY = sin(pos.y * 1.5 + time * 0.5) * cos(pos.x * 2.0 + time * 0.8);
                let noiseZ = sin(pos.z * 2.5 + time * 0.9) * cos(pos.y * 1.5 + time * 0.6);
                
                windDir = normalize(windDir + vec3f(noiseX, noiseY, noiseZ) * uniforms.turbulence);
                
                let NdotW = max(dot(normal, windDir), 0.0);
                return windDir * uniforms.windStrength * NdotW;
            }
            
            fn closestPointOnSphere(point: vec3f, center: vec3f, radius: f32) -> vec3f {
                let dir = normalize(point - center);
                return center + dir * radius;
            }
            
            fn closestPointOnBox(point: vec3f, boxMin: vec3f, boxMax: vec3f) -> vec3f {
                return clamp(point, boxMin, boxMax);
            }
            
            fn sphereCollisionTOI(start: vec3f, end: vec3f, center: vec3f, radius: f32) -> f32 {
                let dir = end - start;
                let toCenter = start - center;
                let a = dot(dir, dir);
                
                if (a < 0.000001) {
                    return -1.0;
                }
                
                let b = 2.0 * dot(toCenter, dir);
                let c = dot(toCenter, toCenter) - radius * radius;
                
                let discriminant = b * b - 4.0 * a * c;
                
                if (discriminant < 0.0) {
                    return -1.0;
                }
                
                let t = (-b - sqrt(discriminant)) / (2.0 * a);
                
                if (t >= 0.0 && t <= 1.0) {
                    return t;
                }
                
                return -1.0;
            }
            
            fn boxCollisionTOI(start: vec3f, end: vec3f, boxMin: vec3f, boxMax: vec3f) -> f32 {
                let padding = 0.01;
                let minPadded = boxMin - vec3f(padding);
                let maxPadded = boxMax + vec3f(padding);
                
                if (all(start >= minPadded) && all(start <= maxPadded)) {
                    return 0.0;
                }
                
                let dir = end - start;
                var tMin = 0.0;
                var tMax = 1.0;
                
                for (var i = 0u; i < 3u; i++) {
                    if (abs(dir[i]) < 0.000001) {
                        if (start[i] < minPadded[i] || start[i] > maxPadded[i]) {
                            return -1.0;
                        }
                    } else {
                        var t1 = (minPadded[i] - start[i]) / dir[i];
                        var t2 = (maxPadded[i] - start[i]) / dir[i];
                        
                        if (t1 > t2) {
                            var temp = t1;
                            t1 = t2;
                            t2 = temp;
                        }
                        
                        tMin = max(tMin, t1);
                        tMax = min(tMax, t2);
                        
                        if (tMin > tMax) {
                            return -1.0;
                        }
                    }
                }
                
                if (tMin >= 0.0 && tMin <= 1.0) {
                    return tMin;
                }
                
                return -1.0;
            }
            
            fn resolveSphereCollision(v: ptr<storage, Vertex>, center: vec3f, radius: f32) {
                let toVertex = v.position - center;
                let dist = length(toVertex);
                let collisionDist = radius + uniforms.collisionDistance;
                
                if (dist < collisionDist && dist > 0.0001) {
                    let normal = toVertex / dist;
                    let penetration = collisionDist - dist;
                    let correction = normal * penetration * uniforms.collisionStiffness;
                    
                    if (v.pinned < 0.5) {
                        v.position = v.position + correction;
                    }
                }
            }
            
            fn resolveBoxCollision(v: ptr<storage, Vertex>, boxMin: vec3f, boxMax: vec3f) {
                let closest = closestPointOnBox(v.position, boxMin, boxMax);
                let toVertex = v.position - closest;
                let dist = length(toVertex);
                
                if (dist < uniforms.collisionDistance && dist > 0.0001) {
                    let normal = toVertex / dist;
                    let penetration = uniforms.collisionDistance - dist;
                    let correction = normal * penetration * uniforms.collisionStiffness;
                    
                    if (v.pinned < 0.5) {
                        v.position = v.position + correction;
                    }
                } else if (dist < 0.0001) {
                    let center = (boxMin + boxMax) * 0.5;
                    let normal = normalize(v.position - center);
                    let correction = normal * uniforms.collisionDistance * uniforms.collisionStiffness;
                    
                    if (v.pinned < 0.5) {
                        v.position = v.position + correction;
                    }
                }
            }
            
            fn isTorn(tearMask: u32, direction: u32) -> bool {
                return (tearMask & (1u << direction)) != 0u;
            }
            
            fn checkTear(aIdx: u32, bIdx: u32, restLength: f32, dirA: u32, dirB: u32) -> bool {
                if (uniforms.enableTearing < 0.5) {
                    return false;
                }
                
                var a = &vertices[aIdx];
                var b = &vertices[bIdx];
                
                let delta = b.position - a.position;
                let dist = length(delta);
                
                if (dist > restLength * uniforms.tearThreshold) {
                    a.tearMask = a.tearMask | (1u << dirA);
                    b.tearMask = b.tearMask | (1u << dirB);
                    
                    let velA = a.position - a.prevPosition;
                    let velB = b.position - b.prevPosition;
                    let normal = delta / dist;
                    let relVel = dot(velB - velA, normal);
                    
                    if (relVel > 0.0) {
                        let impulse = normal * relVel * uniforms.tearDamping * 0.5;
                        if (a.pinned < 0.5) {
                            a.position = a.position + impulse;
                        }
                        if (b.pinned < 0.5) {
                            b.position = b.position - impulse;
                        }
                    }
                    
                    return true;
                }
                
                return false;
            }
            
            @compute @workgroup_size(64)
            fn integrate(@builtin(global_invocation_id) id: vec3u) {
                if (id.x >= uniforms.vertexCount) {
                    return;
                }
                
                var v = &vertices[id.x];
                
                if (v.pinned > 0.5) {
                    return;
                }
                
                let dt = uniforms.deltaTime;
                
                var acceleration = vec3f(0.0, uniforms.gravity, 0.0);
                
                if (uniforms.enableWind > 0.5) {
                    let wind = windForce(v.position, v.normal, uniforms.time);
                    acceleration = acceleration + wind;
                }
                
                let temp = v.position;
                var vel = (v.position - v.prevPosition) * uniforms.damping;
                vel = vel + acceleration * dt * dt;
                v.position = v.position + vel;
                v.prevPosition = temp;
                v.velocity = vel;
            }
            
            @compute @workgroup_size(64)
            fn continuousCollisionDetection(@builtin(global_invocation_id) id: vec3u) {
                if (id.x >= uniforms.vertexCount || uniforms.enableShapeCollision < 0.5) {
                    return;
                }
                
                var v = &vertices[id.x];
                
                if (v.pinned > 0.5) {
                    return;
                }
                
                let start = v.prevPosition;
                let end = v.position;
                
                for (var iter: u32 = 0; iter < uniforms.ccdIterations; iter++) {
                    var toi = -1.0;
                    var normal = vec3f(0.0);
                    
                    if (uniforms.collisionShape == 0u) {
                        toi = sphereCollisionTOI(start, end, uniforms.sphereCenter, uniforms.sphereRadius);
                        if (toi >= 0.0) {
                            let hitPoint = start + (end - start) * toi;
                            normal = normalize(hitPoint - uniforms.sphereCenter);
                        }
                    } else {
                        toi = boxCollisionTOI(start, end, uniforms.boxMin, uniforms.boxMax);
                        if (toi >= 0.0) {
                            let hitPoint = start + (end - start) * toi;
                            let closest = closestPointOnBox(hitPoint, uniforms.boxMin, uniforms.boxMax);
                            let diff = hitPoint - closest;
                            if (length(diff) > 0.0001) {
                                normal = normalize(diff);
                            } else {
                                let center = (uniforms.boxMin + uniforms.boxMax) * 0.5;
                                normal = normalize(hitPoint - center);
                            }
                        }
                    }
                    
                    if (toi >= 0.0 && toi <= 1.0) {
                        let hitPoint = start + (end - start) * toi;
                        let vel = end - start;
                        let velMag = length(vel);
                        
                        if (velMag > 0.0001) {
                            let velNormalized = vel / velMag;
                            let velDotN = dot(velNormalized, normal);
                            
                            if (velDotN < 0.0) {
                                let remaining = 1.0 - toi;
                                let newVel = vel - normal * velDotN * velMag * 1.05;
                                v.position = hitPoint + newVel * remaining;
                                break;
                            }
                        }
                    } else {
                        break;
                    }
                }
                
                if (uniforms.collisionShape == 0u) {
                    resolveSphereCollision(v, uniforms.sphereCenter, uniforms.sphereRadius);
                } else {
                    resolveBoxCollision(v, uniforms.boxMin, uniforms.boxMax);
                }
            }
            
            @compute @workgroup_size(128)
            fn solveConstraints(@builtin(global_invocation_id) id: vec3u) {
                if (id.x >= uniforms.vertexCount) {
                    return;
                }
                
                let cols = u32(sqrt(f32(uniforms.vertexCount)));
                let x = id.x % cols;
                let y = id.x / cols;
                
                var v = &vertices[id.x];
                
                if (x > 0 && !isTorn(v.tearMask, 0u)) {
                    solveConstraint(id.x, id.x - 1, uniforms.structuralStiffness);
                }
                if (x < cols - 1 && !isTorn(v.tearMask, 1u)) {
                    solveConstraint(id.x, id.x + 1, uniforms.structuralStiffness);
                }
                if (y > 0 && !isTorn(v.tearMask, 2u)) {
                    solveConstraint(id.x, id.x - cols, uniforms.structuralStiffness);
                }
                if (y < cols - 1 && !isTorn(v.tearMask, 3u)) {
                    solveConstraint(id.x, id.x + cols, uniforms.structuralStiffness);
                }
                
                if (x > 0 && y > 0 && !isTorn(v.tearMask, 4u)) {
                    solveConstraint(id.x, id.x - cols - 1, uniforms.shearStiffness);
                }
                if (x < cols - 1 && y > 0 && !isTorn(v.tearMask, 5u)) {
                    solveConstraint(id.x, id.x - cols + 1, uniforms.shearStiffness);
                }
                if (x > 0 && y < cols - 1 && !isTorn(v.tearMask, 6u)) {
                    solveConstraint(id.x, id.x + cols - 1, uniforms.shearStiffness);
                }
                if (x < cols - 1 && y < cols - 1 && !isTorn(v.tearMask, 7u)) {
                    solveConstraint(id.x, id.x + cols + 1, uniforms.shearStiffness);
                }
                
                if (x > 1 && !isTorn(v.tearMask, 0u) && !isTorn(vertices[id.x - 1].tearMask, 0u)) {
                    solveConstraint(id.x, id.x - 2, uniforms.bendStiffness);
                }
                if (x < cols - 2 && !isTorn(v.tearMask, 1u) && !isTorn(vertices[id.x + 1].tearMask, 1u)) {
                    solveConstraint(id.x, id.x + 2, uniforms.bendStiffness);
                }
                if (y > 1 && !isTorn(v.tearMask, 2u) && !isTorn(vertices[id.x - cols].tearMask, 2u)) {
                    solveConstraint(id.x, id.x - cols * 2, uniforms.bendStiffness);
                }
                if (y < cols - 2 && !isTorn(v.tearMask, 3u) && !isTorn(vertices[id.x + cols].tearMask, 3u)) {
                    solveConstraint(id.x, id.x + cols * 2, uniforms.bendStiffness);
                }
            }
            
            fn solveConstraint(aIdx: u32, bIdx: u32, stiffness: f32) {
                var a = &vertices[aIdx];
                var b = &vertices[bIdx];
                
                let restLength = distance(a.prevPosition, b.prevPosition);
                var delta = b.position - a.position;
                let dist = length(delta);
                
                if (dist < 0.0001) {
                    return;
                }
                
                let diff = (restLength - dist) / dist;
                let offset = delta * diff * 0.5 * stiffness;
                
                if (a.pinned < 0.5) {
                    a.position = a.position - offset;
                }
                if (b.pinned < 0.5) {
                    b.position = b.position + offset;
                }
            }
            
            @compute @workgroup_size(64)
            fn selfCollision(@builtin(global_invocation_id) id: vec3u) {
                if (id.x >= uniforms.vertexCount || uniforms.enableSelfCollision < 0.5) {
                    return;
                }
                
                var v = &vertices[id.x];
                if (v.pinned > 0.5) {
                    return;
                }
                
                let cols = u32(sqrt(f32(uniforms.vertexCount)));
                let x = id.x % cols;
                let y = id.x / cols;
                
                let searchRadius = 4u;
                
                for (var dy: u32 = 0; dy <= searchRadius * 2; dy++) {
                    for (var dx: u32 = 0; dx <= searchRadius * 2; dx++) {
                        let nx = x + dx - searchRadius;
                        let ny = y + dy - searchRadius;
                        
                        if (nx == x && ny == y) {
                            continue;
                        }
                        if (nx < 0 || nx >= cols || ny < 0 || ny >= cols) {
                            continue;
                        }
                        
                        let otherIdx = ny * cols + nx;
                        if (otherIdx == id.x) {
                            continue;
                        }
                        
                        var other = &vertices[otherIdx];
                        
                        let distVec = other.position - v.position;
                        let dist = length(distVec);
                        
                        if (dist < uniforms.collisionDistance && dist > 0.0001) {
                            let correction = (uniforms.collisionDistance - dist) * 0.5 * uniforms.collisionStiffness;
                            let dir = distVec / dist;
                            
                            if (other.pinned < 0.5) {
                                other.position = other.position + dir * correction;
                            }
                            if (v.pinned < 0.5) {
                                v.position = v.position - dir * correction;
                            }
                        }
                    }
                }
            }
            
            @compute @workgroup_size(128)
            fn tearDetection(@builtin(global_invocation_id) id: vec3u) {
                if (id.x >= uniforms.vertexCount || uniforms.enableTearing < 0.5) {
                    return;
                }
                
                let cols = u32(sqrt(f32(uniforms.vertexCount)));
                let x = id.x % cols;
                let y = id.x / cols;
                
                let restLen = 1.0 / f32(cols - 1) * 2.0;
                let restLenDiag = sqrt(2.0) * restLen;
                
                if (x > 0 && !isTorn(vertices[id.x].tearMask, 0u)) {
                    checkTear(id.x, id.x - 1, restLen, 0u, 1u);
                }
                if (x < cols - 1 && !isTorn(vertices[id.x].tearMask, 1u)) {
                    checkTear(id.x, id.x + 1, restLen, 1u, 0u);
                }
                if (y > 0 && !isTorn(vertices[id.x].tearMask, 2u)) {
                    checkTear(id.x, id.x - cols, restLen, 2u, 3u);
                }
                if (y < cols - 1 && !isTorn(vertices[id.x].tearMask, 3u)) {
                    checkTear(id.x, id.x + cols, restLen, 3u, 2u);
                }
                
                if (x > 0 && y > 0 && !isTorn(vertices[id.x].tearMask, 4u)) {
                    checkTear(id.x, id.x - cols - 1, restLenDiag, 4u, 7u);
                }
                if (x < cols - 1 && y > 0 && !isTorn(vertices[id.x].tearMask, 5u)) {
                    checkTear(id.x, id.x - cols + 1, restLenDiag, 5u, 6u);
                }
                if (x > 0 && y < cols - 1 && !isTorn(vertices[id.x].tearMask, 6u)) {
                    checkTear(id.x, id.x + cols - 1, restLenDiag, 6u, 5u);
                }
                if (x < cols - 1 && y < cols - 1 && !isTorn(vertices[id.x].tearMask, 7u)) {
                    checkTear(id.x, id.x + cols + 1, restLenDiag, 7u, 4u);
                }
            }
            
            @compute @workgroup_size(64)
            fn updateNormals(@builtin(global_invocation_id) id: vec3u) {
                if (id.x >= uniforms.vertexCount) {
                    return;
                }
                
                let cols = u32(sqrt(f32(uniforms.vertexCount)));
                let x = id.x % cols;
                let y = id.x / cols;
                
                var v = &vertices[id.x];
                var normal = vec3f(0.0);
                
                var count = 0.0;
                
                if (x < cols - 1 && y < cols - 1) {
                    let p1 = vertices[id.x].position;
                    let p2 = vertices[id.x + 1].position;
                    let p3 = vertices[id.x + cols].position;
                    normal = normal + normalize(cross(p2 - p1, p3 - p1));
                    count = count + 1.0;
                }
                
                if (x > 0 && y < cols - 1) {
                    let p1 = vertices[id.x].position;
                    let p2 = vertices[id.x + cols].position;
                    let p3 = vertices[id.x + cols - 1].position;
                    normal = normal + normalize(cross(p2 - p1, p3 - p1));
                    count = count + 1.0;
                }
                
                if (x < cols - 1 && y > 0) {
                    let p1 = vertices[id.x].position;
                    let p2 = vertices[id.x - cols + 1].position;
                    let p3 = vertices[id.x - cols].position;
                    normal = normal + normalize(cross(p2 - p1, p3 - p1));
                    count = count + 1.0;
                }
                
                if (x > 0 && y > 0) {
                    let p1 = vertices[id.x].position;
                    let p2 = vertices[id.x - cols].position;
                    let p3 = vertices[id.x - 1].position;
                    normal = normal + normalize(cross(p2 - p1, p3 - p1));
                    count = count + 1.0;
                }
                
                if (count > 0.0) {
                    v.normal = normalize(normal / count);
                }
            }
        `;
    }
    
    initPipelines() {
        const renderShader = this.device.createShaderModule({
            code: this.renderShaderCode
        });
        
        const computeShader = this.device.createShaderModule({
            code: this.computeShaderCode
        });
        
        this.renderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: renderShader,
                entryPoint: 'vs_main',
                buffers: [{
                    arrayStride: 64,
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: 12, format: 'float32x3' },
                        { shaderLocation: 2, offset: 24, format: 'float32x3' },
                        { shaderLocation: 3, offset: 36, format: 'float32x2' },
                        { shaderLocation: 4, offset: 44, format: 'float32x3' },
                        { shaderLocation: 5, offset: 56, format: 'float32' },
                        { shaderLocation: 6, offset: 60, format: 'uint' }
                    ]
                }]
            },
            fragment: {
                module: renderShader,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
        
        this.integratePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShader,
                entryPoint: 'integrate'
            }
        });
        
        this.constraintsPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShader,
                entryPoint: 'solveConstraints'
            }
        });
        
        this.collisionPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShader,
                entryPoint: 'selfCollision'
            }
        });
        
        this.normalsPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShader,
                entryPoint: 'updateNormals'
            }
        });
        
        this.ccdPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShader,
                entryPoint: 'continuousCollisionDetection'
            }
        });
        
        this.tearPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: computeShader,
                entryPoint: 'tearDetection'
            }
        });
        
        this.renderBindGroup = this.device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } }
            ]
        });
        
        const createComputeBindGroup = (pipeline) => {
            return this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.computeUniformBuffer } },
                    { binding: 1, resource: { buffer: this.vertexBuffer } }
                ]
            });
        };
        
        this.integrateBindGroup = createComputeBindGroup(this.integratePipeline);
        this.constraintsBindGroup = createComputeBindGroup(this.constraintsPipeline);
        this.collisionBindGroup = createComputeBindGroup(this.collisionPipeline);
        this.normalsBindGroup = createComputeBindGroup(this.normalsPipeline);
        this.ccdBindGroup = createComputeBindGroup(this.ccdPipeline);
        this.tearBindGroup = createComputeBindGroup(this.tearPipeline);
    }
    
    initEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseButton = e.button;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        window.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                
                if (this.cameraMode === 'orbit') {
                    if (this.mouseButton === 0) {
                        this.orbitAngleX -= dx * 0.01;
                        this.orbitAngleY -= dy * 0.01;
                        this.orbitAngleY = Math.max(-1.5, Math.min(1.5, this.orbitAngleY));
                    } else if (this.mouseButton === 2) {
                        this.cameraPosition[0] -= dx * 0.01;
                        this.cameraPosition[1] += dy * 0.01;
                    }
                } else if (this.cameraMode === 'firstperson') {
                    this.cameraRotation[0] -= dy * 0.002;
                    this.cameraRotation[1] -= dx * 0.002;
                }
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            if (this.cameraMode === 'orbit') {
                this.orbitDistance += e.deltaY * 0.005;
                this.orbitDistance = Math.max(1, Math.min(20, this.orbitDistance));
            }
            e.preventDefault();
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    initUI() {
        const updateSlider = (id, param, valueId) => {
            const slider = document.getElementById(id);
            const valueSpan = document.getElementById(valueId);
            slider.addEventListener('input', () => {
                this.params[param] = parseFloat(slider.value);
                valueSpan.textContent = slider.value;
            });
        };
        
        updateSlider('resolution', 'resolution', 'resolution-value');
        document.getElementById('resolution').addEventListener('input', () => {
            document.getElementById('resolution-value2').textContent = document.getElementById('resolution').value;
        });
        
        updateSlider('structural-stiffness', 'structuralStiffness', 'structural-value');
        updateSlider('shear-stiffness', 'shearStiffness', 'shear-value');
        updateSlider('bend-stiffness', 'bendStiffness', 'bend-value');
        updateSlider('damping', 'damping', 'damping-value');
        updateSlider('gravity', 'gravity', 'gravity-value');
        updateSlider('wind-strength', 'windStrength', 'wind-strength-value');
        updateSlider('turbulence', 'turbulence', 'turbulence-value');
        updateSlider('wind-speed', 'windSpeed', 'wind-speed-value');
        updateSlider('collision-distance', 'collisionDistance', 'collision-distance-value');
        updateSlider('collision-stiffness', 'collisionStiffness', 'collision-stiffness-value');
        updateSlider('ccd-iterations', 'ccdIterations', 'ccd-iterations-value');
        updateSlider('metallic', 'metallic', 'metallic-value');
        updateSlider('roughness', 'roughness', 'roughness-value');
        
        document.getElementById('enable-wind').addEventListener('change', (e) => {
            this.params.enableWind = e.target.checked;
        });
        
        document.getElementById('enable-self-collision').addEventListener('change', (e) => {
            this.params.enableSelfCollision = e.target.checked;
        });
        
        document.getElementById('enable-shape-collision').addEventListener('change', (e) => {
            this.params.enableShapeCollision = e.target.checked;
        });
        
        document.getElementById('collision-shape').addEventListener('change', (e) => {
            this.params.collisionShape = e.target.value;
        });
        
        document.getElementById('enable-shadows').addEventListener('change', (e) => {
            this.params.enableShadows = e.target.checked;
        });
        
        document.getElementById('enable-normal-map').addEventListener('change', (e) => {
            this.params.enableNormalMap = e.target.checked;
        });
        
        document.getElementById('enable-tearing').addEventListener('change', (e) => {
            this.params.enableTearing = e.target.checked;
        });
        
        updateSlider('tear-threshold', 'tearThreshold', 'tear-threshold-value');
        updateSlider('tear-damping', 'tearDamping', 'tear-damping-value');
        
        document.getElementById('reset-cloth').addEventListener('click', () => {
            this.resolution = parseInt(document.getElementById('resolution').value);
            this.initCloth();
            this.initBuffers();
            this.initPipelines();
        });
        
        document.getElementById('reset-tearing').addEventListener('click', () => {
            this.resetTearing();
            this.initBuffers();
            this.initPipelines();
        });
        
        document.getElementById('camera-mode').addEventListener('change', (e) => {
            this.cameraMode = e.target.value;
        });
    }
    
    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.depthTexture = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depthView = this.depthTexture.createView();
    }
    
    mat4Perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) / (near - far), -1,
            0, 0, (2 * far * near) / (near - far), 0
        ]);
    }
    
    mat4LookAt(eye, target, up) {
        const zAxis = this.normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
        const xAxis = this.normalize(this.cross(up, zAxis));
        const yAxis = this.cross(zAxis, xAxis);
        
        return new Float32Array([
            xAxis[0], yAxis[0], zAxis[0], 0,
            xAxis[1], yAxis[1], zAxis[1], 0,
            xAxis[2], yAxis[2], zAxis[2], 0,
            -this.dot(xAxis, eye), -this.dot(yAxis, eye), -this.dot(zAxis, eye), 1
        ]);
    }
    
    mat4Multiply(a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 
                    a[j] * b[i * 4] +
                    a[4 + j] * b[i * 4 + 1] +
                    a[8 + j] * b[i * 4 + 2] +
                    a[12 + j] * b[i * 4 + 3];
            }
        }
        return result;
    }
    
    normalize(v) {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / len, v[1] / len, v[2] / len];
    }
    
    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    
    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    
    updateCamera(deltaTime) {
        if (this.cameraMode === 'firstperson') {
            const speed = this.keys['ShiftLeft'] ? 10 : 5;
            const forward = [
                Math.sin(this.cameraRotation[1]) * Math.cos(this.cameraRotation[0]),
                Math.sin(this.cameraRotation[0]),
                Math.cos(this.cameraRotation[1]) * Math.cos(this.cameraRotation[0])
            ];
            const right = [
                Math.cos(this.cameraRotation[1]),
                0,
                -Math.sin(this.cameraRotation[1])
            ];
            
            if (this.keys['KeyW']) {
                this.cameraPosition[0] += forward[0] * speed * deltaTime;
                this.cameraPosition[1] += forward[1] * speed * deltaTime;
                this.cameraPosition[2] += forward[2] * speed * deltaTime;
            }
            if (this.keys['KeyS']) {
                this.cameraPosition[0] -= forward[0] * speed * deltaTime;
                this.cameraPosition[1] -= forward[1] * speed * deltaTime;
                this.cameraPosition[2] -= forward[2] * speed * deltaTime;
            }
            if (this.keys['KeyA']) {
                this.cameraPosition[0] -= right[0] * speed * deltaTime;
                this.cameraPosition[2] -= right[2] * speed * deltaTime;
            }
            if (this.keys['KeyD']) {
                this.cameraPosition[0] += right[0] * speed * deltaTime;
                this.cameraPosition[2] += right[2] * speed * deltaTime;
            }
        } else {
            const camX = Math.sin(this.orbitAngleX) * Math.cos(this.orbitAngleY) * this.orbitDistance;
            const camY = Math.sin(this.orbitAngleY) * this.orbitDistance + 2;
            const camZ = Math.cos(this.orbitAngleX) * Math.cos(this.orbitAngleY) * this.orbitDistance;
            this.cameraPosition = [camX, camY, camZ];
        }
    }
    
    update() {
        const deltaTime = 1 / 60;
        this.time += deltaTime;
        this.updateCamera(deltaTime);
        
        const collisionShapeCode = this.params.collisionShape === 'sphere' ? 0 : 1;
        
        const computeUniforms = new Float32Array([
            deltaTime,
            this.params.gravity,
            this.params.damping,
            this.params.structuralStiffness,
            this.params.shearStiffness,
            this.params.bendStiffness,
            this.params.windStrength,
            this.params.turbulence,
            this.params.windSpeed,
            this.params.enableWind ? 1.0 : 0.0,
            this.params.enableSelfCollision ? 1.0 : 0.0,
            this.params.enableShapeCollision ? 1.0 : 0.0,
            this.params.collisionDistance,
            this.params.collisionStiffness,
            this.params.ccdIterations,
            collisionShapeCode,
            ...this.params.sphereCenter,
            this.params.sphereRadius,
            ...this.params.boxMin,
            ...this.params.boxMax,
            this.params.enableTearing ? 1.0 : 0.0,
            this.params.tearThreshold,
            this.params.tearDamping,
            this.time,
            this.vertices.length,
            this.constraints.length
        ]);
        this.device.queue.writeBuffer(this.computeUniformBuffer, 0, computeUniforms);
        
        const commandEncoder = this.device.createCommandEncoder();
        
        for (let i = 0; i < 5; i++) {
            const computePass = commandEncoder.beginComputePass();
            
            computePass.setPipeline(this.integratePipeline);
            computePass.setBindGroup(0, this.integrateBindGroup);
            computePass.dispatch(Math.ceil(this.vertices.length / 64));
            
            computePass.setPipeline(this.ccdPipeline);
            computePass.setBindGroup(0, this.ccdBindGroup);
            computePass.dispatch(Math.ceil(this.vertices.length / 64));
            
            computePass.setPipeline(this.tearPipeline);
            computePass.setBindGroup(0, this.tearBindGroup);
            computePass.dispatch(Math.ceil(this.vertices.length / 128));
            
            computePass.setPipeline(this.constraintsPipeline);
            computePass.setBindGroup(0, this.constraintsBindGroup);
            computePass.dispatch(Math.ceil(this.vertices.length / 128));
            
            computePass.setPipeline(this.collisionPipeline);
            computePass.setBindGroup(0, this.collisionBindGroup);
            computePass.dispatch(Math.ceil(this.vertices.length / 64));
            
            computePass.setPipeline(this.normalsPipeline);
            computePass.setBindGroup(0, this.normalsBindGroup);
            computePass.dispatch(Math.ceil(this.vertices.length / 64));
            
            computePass.end();
        }
        
        const aspect = this.canvas.width / this.canvas.height;
        const projection = this.mat4Perspective(Math.PI / 3, aspect, 0.1, 100);
        
        let view;
        if (this.cameraMode === 'firstperson') {
            const lookDir = [
                Math.sin(this.cameraRotation[1]) * Math.cos(this.cameraRotation[0]),
                Math.sin(this.cameraRotation[0]),
                Math.cos(this.cameraRotation[1]) * Math.cos(this.cameraRotation[0])
            ];
            const target = [
                this.cameraPosition[0] + lookDir[0],
                this.cameraPosition[1] + lookDir[1],
                this.cameraPosition[2] + lookDir[2]
            ];
            view = this.mat4LookAt(this.cameraPosition, target, [0, 1, 0]);
        } else {
            view = this.mat4LookAt(this.cameraPosition, [0, 1, 0], [0, 1, 0]);
        }
        
        const viewProj = this.mat4Multiply(projection, view);
        
        const lightDir = this.normalize([1, 2, 1]);
        const lightColor = [1.0, 0.95, 0.9];
        
        const renderUniforms = new Float32Array([
            ...viewProj,
            ...this.cameraPosition,
            this.params.metallic,
            this.params.roughness,
            this.params.enableNormalMap ? 1.0 : 0.0,
            this.params.enableShadows ? 1.0 : 0.0,
            collisionShapeCode,
            0,
            ...this.params.sphereCenter,
            this.params.sphereRadius,
            ...this.params.boxMin,
            0,
            ...this.params.boxMax,
            0,
            ...lightDir,
            0,
            ...lightColor,
            this.time
        ]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, renderUniforms);
        
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: this.depthView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });
        
        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.setIndexBuffer(this.indexBuffer, 'uint32');
        renderPass.drawIndexed(this.indices.length);
        
        renderPass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
        
        this.frameCount++;
        if (performance.now() - this.lastFpsTime > 1000) {
            document.getElementById('fps').textContent = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = performance.now();
        }
    }
    
    animate() {
        this.update();
        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ClothSimulation();
});
