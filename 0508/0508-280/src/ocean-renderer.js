export class OceanRenderer {
    constructor(device, format) {
        this.device = device;
        this.format = format;
        this.fftSize = 256;
        this.gridSize = 256;
        this.patchSize = 500;
        
        this.heightData = null;
        this.pipeline = null;
        this.fftPipeline = null;
        this.ifftPipeline = null;
        this.spectrumPipeline = null;
        this.particlePipeline = null;
    }
    
    async init() {
        await this.loadShaders();
        this.createBuffers();
        this.createTextures();
        this.createPipelines();
        this.createBindGroups();
        this.generateInitialSpectrum();
    }
    
    async loadShaders() {
        const shaderFiles = [
            'fft.wgsl', 'spectrum.wgsl', 'ocean.wgsl', 'particles.wgsl', 'particle-update.wgsl'
        ];
        
        this.shaders = {};
        for (const file of shaderFiles) {
            const response = await fetch(`src/shaders/${file}`);
            this.shaders[file] = await response.text();
        }
    }
    
    createBuffers() {
        const fftComplexSize = this.fftSize * this.fftSize * 8;
        
        this.spectrumBuffer = this.device.createBuffer({
            size: fftComplexSize * 2,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        
        this.heightBuffer = this.device.createBuffer({
            size: fftComplexSize * 2,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        
        this.displacementBuffer = this.device.createBuffer({
            size: fftComplexSize * 2,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        
        this.fftUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.oceanUniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.createMeshBuffers();
        this.createParticleBuffers();
    }
    
    createMeshBuffers() {
        const vertices = [];
        const indices = [];
        const lodLevels = 4;
        const gridSize = this.gridSize;
        
        for (let lod = 0; lod < lodLevels; lod++) {
            const step = Math.pow(2, lod);
            const lodGridSize = Math.floor(gridSize / step);
            
            for (let z = 0; z <= lodGridSize; z++) {
                for (let x = 0; x <= lodGridSize; x++) {
                    const u = x / lodGridSize;
                    const v = z / lodGridSize;
                    vertices.push(
                        (u - 0.5) * this.patchSize, 0, (v - 0.5) * this.patchSize, u, v, lod
                    );
                }
            }
            
            const baseIndex = vertices.length / 6 - (lodGridSize + 1) * (lodGridSize + 1);
            for (let z = 0; z < lodGridSize; z++) {
                for (let x = 0; x < lodGridSize; x++) {
                    const i = baseIndex + z * (lodGridSize + 1) + x;
                    indices.push(i, i + lodGridSize + 1, i + 1);
                    indices.push(i + 1, i + lodGridSize + 1, i + lodGridSize + 2);
                }
            }
        }
        
        this.vertexBuffer = this.device.createBuffer({
            size: vertices.length * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
        this.vertexBuffer.unmap();
        
        this.indexBuffer = this.device.createBuffer({
            size: indices.length * 2,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
        this.indexBuffer.unmap();
        
        this.indexCount = indices.length;
    }
    
    createParticleBuffers() {
        const maxParticles = 20000;
        this.maxParticles = maxParticles;
        
        const particleData = new Float32Array(maxParticles * 8);
        
        for (let i = 0; i < maxParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 300 + 50;
            particleData[i * 8 + 0] = Math.cos(angle) * radius;
            particleData[i * 8 + 1] = 0;
            particleData[i * 8 + 2] = Math.sin(angle) * radius;
            particleData[i * 8 + 3] = 1.5 + Math.random() * 2.5;
            particleData[i * 8 + 4] = 0;
            particleData[i * 8 + 5] = 0;
            particleData[i * 8 + 6] = 0;
            particleData[i * 8 + 7] = Math.random() * particleData[i * 8 + 3];
        }
        
        this.particleBuffer = this.device.createBuffer({
            size: particleData.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
        new Float32Array(this.particleBuffer.getMappedRange()).set(particleData);
        this.particleBuffer.unmap();
    }
    
    createTextures() {
        this.heightTexture = this.device.createTexture({
            size: [this.fftSize, this.fftSize],
            format: 'rgba32float',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        
        this.normalTexture = this.device.createTexture({
            size: [this.fftSize, this.fftSize],
            format: 'rgba32float',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
    }
    
    createPipelines() {
        const fftShaderModule = this.device.createShaderModule({
            code: this.shaders['fft.wgsl']
        });
        
        this.fftPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: fftShaderModule,
                entryPoint: 'fftHorizontal'
            }
        });
        
        this.ifftPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: fftShaderModule,
                entryPoint: 'fftVertical'
            }
        });
        
        const spectrumShaderModule = this.device.createShaderModule({
            code: this.shaders['spectrum.wgsl']
        });
        
        this.spectrumPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: spectrumShaderModule,
                entryPoint: 'generateSpectrum'
            }
        });
        
        this.normalPipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: spectrumShaderModule,
                entryPoint: 'calculateNormals'
            }
        });
        
        const oceanShaderModule = this.device.createShaderModule({
            code: this.shaders['ocean.wgsl']
        });
        
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: oceanShaderModule,
                entryPoint: 'vertexMain',
                buffers: [{
                    arrayStride: 24,
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: 12, format: 'float32x2' },
                        { shaderLocation: 2, offset: 20, format: 'float32' }
                    ]
                }]
            },
            fragment: {
                module: oceanShaderModule,
                entryPoint: 'fragmentMain',
                targets: [{
                    format: this.format
                }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
        
        const particleShaderModule = this.device.createShaderModule({
            code: this.shaders['particles.wgsl']
        });
        
        this.particlePipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: particleShaderModule,
                entryPoint: 'vertexMain'
            },
            fragment: {
                module: particleShaderModule,
                entryPoint: 'fragmentMain',
                targets: [{
                    format: this.format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one',
                            operation: 'add'
                        },
                        alpha: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one',
                            operation: 'add'
                        }
                    }
                }]
            },
            primitive: {
                topology: 'point-list'
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
        
        const particleUpdateShaderModule = this.device.createShaderModule({
            code: this.shaders['particle-update.wgsl']
        });
        
        this.particleUpdatePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: particleUpdateShaderModule,
                entryPoint: 'updateParticles'
            }
        });
    }
    
    createBindGroups() {
        this.spectrumBindGroup = this.device.createBindGroup({
            layout: this.spectrumPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.spectrumBuffer } },
                { binding: 1, resource: { buffer: this.heightBuffer } },
                { binding: 2, resource: { buffer: this.displacementBuffer } },
                { binding: 3, resource: { buffer: this.oceanUniformBuffer } }
            ]
        });
        
        this.fftBindGroup = this.device.createBindGroup({
            layout: this.fftPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.heightBuffer } },
                { binding: 1, resource: { buffer: this.fftUniformBuffer } }
            ]
        });
        
        this.normalBindGroup = this.device.createBindGroup({
            layout: this.normalPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.heightBuffer } },
                { binding: 1, resource: this.heightTexture.createView() },
                { binding: 2, resource: this.normalTexture.createView() },
                { binding: 3, resource: { buffer: this.oceanUniformBuffer } }
            ]
        });
        
        this.oceanBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.oceanUniformBuffer } },
                { binding: 1, resource: this.heightTexture.createView() },
                { binding: 2, resource: this.normalTexture.createView() },
                { binding: 3, resource: this.device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                    addressModeU: 'repeat',
                    addressModeV: 'repeat'
                }) }
            ]
        });
        
        this.particleBindGroup = this.device.createBindGroup({
            layout: this.particlePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.oceanUniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } },
                { binding: 2, resource: this.heightTexture.createView() },
                { binding: 3, resource: this.device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear'
                }) }
            ]
        });
        
        this.particleUpdateBindGroup = this.device.createBindGroup({
            layout: this.particleUpdatePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.oceanUniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } },
                { binding: 2, resource: this.heightTexture.createView() },
                { binding: 3, resource: this.device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear'
                }) }
            ]
        });
    }
    
    generateInitialSpectrum() {
        const size = this.fftSize;
        const h0 = new Float32Array(size * size * 4);
        const windSpeed = 15;
        const windDir = 45 * Math.PI / 180;
        const windX = Math.cos(windDir);
        const windY = Math.sin(windDir);
        
        const amplitudeScale = 0.3;
        const maxK = 5.0;
        const lambda = 0.1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const kx = (x - size / 2) * 2 * Math.PI / this.patchSize;
                const ky = (y - size / 2) * 2 * Math.PI / this.patchSize;
                const k = Math.sqrt(kx * kx + ky * ky);
                
                if (k < 0.001) {
                    h0[idx] = 0;
                    h0[idx + 1] = 0;
                    h0[idx + 2] = 0;
                    h0[idx + 3] = 0;
                    continue;
                }
                
                const kDotW = (kx * windX + ky * windY) / k;
                const directionFactor = kDotW * kDotW;
                
                const phillips = Math.exp(-1 / (k * windSpeed * windSpeed)) / Math.pow(k, 4) * directionFactor;
                
                const swelterFactor = Math.exp(-k * k * lambda);
                const highFreqDamping = k > maxK ? Math.exp(-(k - maxK) * 2) : 1.0;
                const totalDamping = swelterFactor * highFreqDamping;
                
                const rand1 = Math.random();
                const rand2 = Math.random();
                const r = Math.sqrt(-2 * Math.log(rand1)) * amplitudeScale;
                const theta = 2 * Math.PI * rand2;
                
                const amplitude = r * Math.sqrt(Math.abs(phillips)) * totalDamping;
                
                h0[idx] = amplitude * Math.cos(theta);
                h0[idx + 1] = amplitude * Math.sin(theta);
                h0[idx + 2] = 0;
                h0[idx + 3] = 0;
            }
        }
        
        this.device.queue.writeBuffer(this.spectrumBuffer, 0, h0);
    }
    
    updateSpectrum(params) {
        const data = new Float32Array([
            params.windSpeed,
            params.windDirection * Math.PI / 180,
            params.waveScale,
            params.foamIntensity
        ]);
        this.device.queue.writeBuffer(this.oceanUniformBuffer, 0, data);
    }
    
    update(deltaTime, params) {
        const commandEncoder = this.device.createCommandEncoder();
        
        const time = performance.now() / 1000;
        const uniformData = new Float32Array([
            time,
            deltaTime,
            params.windSpeed,
            params.windDirection * Math.PI / 180,
            params.waveScale,
            params.foamIntensity,
            this.fftSize,
            this.patchSize
        ]);
        this.device.queue.writeBuffer(this.oceanUniformBuffer, 0, uniformData);
        
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.spectrumPipeline);
        pass.setBindGroup(0, this.spectrumBindGroup);
        pass.dispatchWorkgroups(this.fftSize / 8, this.fftSize / 8);
        pass.end();
        
        const fftUniform = new Float32Array([this.fftSize, 0, 0, 0]);
        this.device.queue.writeBuffer(this.fftUniformBuffer, 0, fftUniform);
        
        const fftPass = commandEncoder.beginComputePass();
        fftPass.setPipeline(this.fftPipeline);
        fftPass.setBindGroup(0, this.fftBindGroup);
        fftPass.dispatchWorkgroups(this.fftSize / 8, this.fftSize);
        fftPass.end();
        
        const ifftPass = commandEncoder.beginComputePass();
        ifftPass.setPipeline(this.ifftPipeline);
        ifftPass.setBindGroup(0, this.fftBindGroup);
        ifftPass.dispatchWorkgroups(this.fftSize, this.fftSize / 8);
        ifftPass.end();
        
        const normalPass = commandEncoder.beginComputePass();
        normalPass.setPipeline(this.normalPipeline);
        normalPass.setBindGroup(0, this.normalBindGroup);
        normalPass.dispatchWorkgroups(this.fftSize / 8, this.fftSize / 8);
        normalPass.end();
        
        const particleUpdatePass = commandEncoder.beginComputePass();
        particleUpdatePass.setPipeline(this.particleUpdatePipeline);
        particleUpdatePass.setBindGroup(0, this.particleUpdateBindGroup);
        particleUpdatePass.dispatchWorkgroups(Math.ceil(this.maxParticles / 64));
        particleUpdatePass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }
    
    render(context, camera, time) {
        const commandEncoder = this.device.createCommandEncoder();
        const depthTexture = this.device.createTexture({
            size: [context.canvas.width, context.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        
        const viewProj = camera.getViewProjMatrix();
        const cameraPos = camera.getPosition();
        
        const oceanUniforms = new Float32Array([
            ...viewProj,
            ...cameraPos,
            time,
            this.fftSize,
            this.patchSize,
            0
        ]);
        this.device.queue.writeBuffer(this.oceanUniformBuffer, 64, oceanUniforms);
        
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0.05, g: 0.1, b: 0.2, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        });
        
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.oceanBindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
        
        const patches = 5;
        for (let z = -patches; z <= patches; z++) {
            for (let x = -patches; x <= patches; x++) {
                const offset = new Float32Array([
                    x * this.patchSize, 0, z * this.patchSize
                ]);
                this.device.queue.writeBuffer(this.oceanUniformBuffer, 192, offset);
                renderPass.drawIndexed(this.indexCount);
            }
        }
        
        renderPass.setPipeline(this.particlePipeline);
        renderPass.setBindGroup(0, this.particleBindGroup);
        renderPass.draw(this.maxParticles);
        
        renderPass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
    }
}
