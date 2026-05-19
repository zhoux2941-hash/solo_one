const GRID_SIZE = [128, 128, 64];
const WORKGROUP_SIZE = [4, 4, 4];

class FluidSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.presentationFormat = null;
        
        this.fBuffers = [];
        this.densityTexture = null;
        this.velocityTexture = null;
        this.collisionPipeline = null;
        this.streamPipeline = null;
        this.renderPipeline = null;
        this.uniformBuffer = null;
        this.interactionBuffer = null;
        
        this.camera = {
            rotation: [0.5, 0.3],
            distance: 3.5,
            target: [0, 0, 0]
        };
        
        this.mouse = {
            pressed: false,
            rightPressed: false,
            lastPos: [0, 0],
            interaction: { x: 0, y: 0, z: 0, radius: 0.05, strength: 0, type: 0 }
        };
        
        this.frameCount = 0;
        this.lastFpsTime = performance.now();
        
        this.vorticityEps = 0.008;
        
        this.init();
    }

    async init() {
        if (!navigator.gpu) {
            alert('WebGPU 不支持，请使用最新版 Chrome/Edge 浏览器');
            return;
        }

        this.adapter = await navigator.gpu.requestAdapter();
        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        
        this.context.configure({
            device: this.device,
            format: this.presentationFormat,
            alphaMode: 'premultiplied'
        });

        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.setupMouseControls();
        await this.createResources();
        await this.createPipelines();
        this.resetSimulation();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
    }

    setupMouseControls() {
        const canvas = this.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.pressed = true;
            if (e.button === 2) this.mouse.rightPressed = true;
            this.mouse.lastPos = [e.clientX, e.clientY];
            
            if (e.button === 0 && !e.shiftKey) {
                this.addDensitySource(e.clientX, e.clientY);
            }
            if (e.button === 0 && e.shiftKey) {
                this.addForce(e.clientX, e.clientY);
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.pressed = false;
            if (e.button === 2) this.mouse.rightPressed = false;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const dx = e.clientX - this.mouse.lastPos[0];
            const dy = e.clientY - this.mouse.lastPos[1];
            
            if (this.mouse.pressed) {
                this.camera.rotation[0] += dx * 0.005;
                this.camera.rotation[1] += dy * 0.005;
                this.camera.rotation[1] = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.camera.rotation[1]));
            }
            
            if (this.mouse.rightPressed) {
                this.camera.target[0] -= dx * 0.002;
                this.camera.target[1] += dy * 0.002;
            }
            
            this.mouse.lastPos = [e.clientX, e.clientY];
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.distance *= 1 + e.deltaY * 0.001;
            this.camera.distance = Math.max(1, Math.min(10, this.camera.distance));
        });
        
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    addDensitySource(screenX, screenY) {
        const ndcX = (screenX / window.innerWidth) * 2 - 1;
        const ndcY = -(screenY / window.innerHeight) * 2 + 1;
        
        this.mouse.interaction = {
            x: ndcX * 0.5,
            y: ndcY * 0.5,
            z: 0,
            radius: 0.08,
            strength: 2.0,
            type: 1
        };
    }

    addForce(screenX, screenY) {
        const ndcX = (screenX / window.innerWidth) * 2 - 1;
        const ndcY = -(screenY / window.innerHeight) * 2 + 1;
        
        this.mouse.interaction = {
            x: ndcX * 0.5,
            y: ndcY * 0.5,
            z: 0,
            radius: 0.1,
            strength: 0.5,
            type: 2
        };
    }

    async createResources() {
        const textureDesc = {
            size: GRID_SIZE,
            dimension: '3d',
            format: 'rgba16float',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        };

        for (let i = 0; i < 2; i++) {
            this.fBuffers[i] = this.device.createTexture({
                ...textureDesc,
                format: 'rgba32float'
            });
        }

        this.densityTexture = this.device.createTexture({
            ...textureDesc,
            format: 'r16float'
        });

        this.velocityTexture = this.device.createTexture(textureDesc);

        this.uniformBuffer = this.device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.interactionBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.sampler = this.device.createSampler({
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear'
        });
    }

    async createPipelines() {
        const collisionShader = this.device.createShaderModule({
            code: await this.loadShader('collision.wgsl')
        });

        const streamShader = this.device.createShaderModule({
            code: await this.loadShader('stream.wgsl')
        });

        const renderShader = this.device.createShaderModule({
            code: await this.loadShader('render.wgsl')
        });

        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'read-write', format: 'rgba32float', viewDimension: '3d' } },
                { binding: 3, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'r16float', viewDimension: '3d' } },
                { binding: 4, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float', viewDimension: '3d' } }
            ]
        });

        const streamBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'read-only', format: 'rgba32float', viewDimension: '3d' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba32float', viewDimension: '3d' } }
            ]
        });

        const renderBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float', viewDimension: '3d' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }
            ]
        });

        this.collisionPipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
            compute: { module: collisionShader, entryPoint: 'main' }
        });

        this.streamPipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [streamBindGroupLayout] }),
            compute: { module: streamShader, entryPoint: 'main' }
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
            vertex: { module: renderShader, entryPoint: 'vs_main' },
            fragment: {
                module: renderShader,
                entryPoint: 'fs_main',
                targets: [{ format: this.presentationFormat }]
            },
            primitive: { topology: 'triangle-strip' }
        });

        this.updateBindGroups();
    }

    updateBindGroups() {
        this.collisionBindGroup0 = this.device.createBindGroup({
            layout: this.collisionPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.interactionBuffer } },
                { binding: 2, resource: this.fBuffers[0].createView() },
                { binding: 3, resource: this.densityTexture.createView() },
                { binding: 4, resource: this.velocityTexture.createView() }
            ]
        });

        this.streamBindGroup = this.device.createBindGroup({
            layout: this.streamPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.fBuffers[0].createView() },
                { binding: 2, resource: this.fBuffers[1].createView() }
            ]
        });

        this.renderBindGroup = this.device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.densityTexture.createView() },
                { binding: 2, resource: this.sampler }
            ]
        });
    }

    async loadShader(filename) {
        const response = await fetch(filename);
        return await response.text();
    }

    resetSimulation() {
        const commandEncoder = this.device.createCommandEncoder();
        const pass = commandEncoder.beginComputePass();
        
        const clearData = new Float32Array(GRID_SIZE[0] * GRID_SIZE[1] * GRID_SIZE[2] * 4);
        const stagingBuffer = this.device.createBuffer({
            size: clearData.byteLength,
            usage: GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true
        });
        new Float32Array(stagingBuffer.getMappedRange()).set(clearData);
        stagingBuffer.unmap();

        for (let i = 0; i < 2; i++) {
            commandEncoder.copyBufferToTexture(
                { buffer: stagingBuffer, bytesPerRow: GRID_SIZE[0] * 16, rowsPerImage: GRID_SIZE[1] },
                { texture: this.fBuffers[i] },
                GRID_SIZE
            );
        }

        this.device.queue.submit([commandEncoder.finish()]);
    }

    updateUniforms() {
        const uniforms = new Float32Array([
            GRID_SIZE[0], GRID_SIZE[1], GRID_SIZE[2],
            this.canvas.width, this.canvas.height,
            this.camera.rotation[0], this.camera.rotation[1], this.camera.distance,
            this.camera.target[0], this.camera.target[1], this.camera.target[2],
            performance.now() * 0.001,
            0, 0, 0, this.vorticityEps
        ]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniforms);

        const interaction = new Float32Array([
            this.mouse.interaction.x, this.mouse.interaction.y, this.mouse.interaction.z,
            this.mouse.interaction.radius,
            this.mouse.interaction.strength, this.mouse.interaction.type,
            0.0, 0.0
        ]);
        this.device.queue.writeBuffer(this.interactionBuffer, 0, interaction);

        this.mouse.interaction.strength *= 0.9;
        if (this.mouse.interaction.strength < 0.01) {
            this.mouse.interaction.type = 0;
        }
    }

    setVorticity(value) {
        this.vorticityEps = parseFloat(value);
        document.getElementById('vorticity-value').textContent = parseFloat(value).toFixed(3);
    }

    animate() {
        this.updateUniforms();

        const commandEncoder = this.device.createCommandEncoder();

        const computePass = commandEncoder.beginComputePass();
        
        computePass.setPipeline(this.collisionPipeline);
        computePass.setBindGroup(0, this.collisionBindGroup0);
        computePass.dispatchWorkgroups(
            Math.ceil(GRID_SIZE[0] / WORKGROUP_SIZE[0]),
            Math.ceil(GRID_SIZE[1] / WORKGROUP_SIZE[1]),
            Math.ceil(GRID_SIZE[2] / WORKGROUP_SIZE[2])
        );
        
        computePass.setPipeline(this.streamPipeline);
        computePass.setBindGroup(0, this.streamBindGroup);
        computePass.dispatchWorkgroups(
            Math.ceil(GRID_SIZE[0] / WORKGROUP_SIZE[0]),
            Math.ceil(GRID_SIZE[1] / WORKGROUP_SIZE[1]),
            Math.ceil(GRID_SIZE[2] / WORKGROUP_SIZE[2])
        );
        
        computePass.end();

        const temp = this.fBuffers[0];
        this.fBuffers[0] = this.fBuffers[1];
        this.fBuffers[1] = temp;
        this.updateBindGroups();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0.02, g: 0.02, b: 0.05, a: 1 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setBindGroup(0, this.renderBindGroup);
        renderPass.draw(4);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsTime > 1000) {
            document.getElementById('fps').textContent = `FPS: ${this.frameCount}`;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        requestAnimationFrame(() => this.animate());
    }
}

const app = new FluidSimulation();