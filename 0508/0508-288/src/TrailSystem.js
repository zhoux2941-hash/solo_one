import * as THREE from 'three';

export class TrailSystem {
    constructor(options = {}) {
        this.maxParticles = options.maxParticles || 65536;
        this.trailLength = options.trailLength || 30;
        this.trailFade = options.trailFade || 0.95;
        this.trailWidth = options.trailWidth || 0.05;
        
        this.positions = null;
        this.history = null;
        this.particleCount = 0;
        
        this.trailMesh = null;
        this.trailScene = new THREE.Scene();
        
        this.accumulationTarget = null;
        this.accumulationMaterial = null;
        
        this.initBuffers();
        this.initTrailRendering();
    }
    
    initBuffers() {
        this.positions = new Float32Array(this.maxParticles * 3);
        this.history = new Float32Array(this.maxParticles * this.trailLength * 3);
    }
    
    initTrailRendering() {
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(this.maxParticles * this.trailLength * 2 * 3);
        const trailColors = new Float32Array(this.maxParticles * this.trailLength * 2 * 3);
        const trailAlphas = new Float32Array(this.maxParticles * this.trailLength * 2);
        
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
        trailGeometry.setAttribute('alpha', new THREE.BufferAttribute(trailAlphas, 1));
        
        const trailMaterial = new THREE.ShaderMaterial({
            uniforms: {
                trailWidth: { value: this.trailWidth }
            },
            vertexShader: `
                attribute float alpha;
                varying float vAlpha;
                varying vec3 vColor;
                
                void main() {
                    vAlpha = alpha;
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                varying vec3 vColor;
                
                void main() {
                    gl_FragColor = vec4(vColor, vAlpha * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        this.trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
        this.trailScene.add(this.trailMesh);
    }
    
    initAccumulation(renderer) {
        const width = renderer.domElement.width;
        const height = renderer.domElement.height;
        
        this.accumulationTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        this.accumulationMaterial = new THREE.ShaderMaterial({
            uniforms: {
                trailTexture: { value: null },
                fadeFactor: { value: this.trailFade }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D trailTexture;
                uniform float fadeFactor;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(trailTexture, vUv);
                    color.rgb *= fadeFactor;
                    color.a *= fadeFactor;
                    gl_FragColor = color;
                }
            `,
            transparent: true,
            blending: THREE.NoBlending
        });
        
        this.quadScene = new THREE.Scene();
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const quadGeometry = new THREE.PlaneGeometry(2, 2);
        this.quad = new THREE.Mesh(quadGeometry, this.accumulationMaterial);
        this.quadScene.add(this.quad);
    }
    
    updateHistory(newPositions, newVelocities, particleCount) {
        this.particleCount = particleCount;
        
        for (let i = 0; i < particleCount; i++) {
            for (let t = this.trailLength - 1; t > 0; t--) {
                const srcIdx = (i * this.trailLength + t - 1) * 3;
                const dstIdx = (i * this.trailLength + t) * 3;
                this.history[dstIdx] = this.history[srcIdx];
                this.history[dstIdx + 1] = this.history[srcIdx + 1];
                this.history[dstIdx + 2] = this.history[srcIdx + 2];
            }
            
            const firstIdx = i * this.trailLength * 3;
            this.history[firstIdx] = newPositions[i * 3];
            this.history[firstIdx + 1] = newPositions[i * 3 + 1];
            this.history[firstIdx + 2] = newPositions[i * 3 + 2];
        }
        
        this.updateTrailGeometry(newVelocities);
    }
    
    updateTrailGeometry(velocities) {
        if (!this.trailMesh) return;
        
        const positions = this.trailMesh.geometry.attributes.position.array;
        const colors = this.trailMesh.geometry.attributes.color.array;
        const alphas = this.trailMesh.geometry.attributes.alpha.array;
        
        let vertexIdx = 0;
        
        for (let i = 0; i < this.particleCount; i++) {
            for (let t = 0; t < this.trailLength - 1; t++) {
                const currPosIdx = (i * this.trailLength + t) * 3;
                const nextPosIdx = (i * this.trailLength + t + 1) * 3;
                
                const currPos = new THREE.Vector3(
                    this.history[currPosIdx],
                    this.history[currPosIdx + 1],
                    this.history[currPosIdx + 2]
                );
                
                const nextPos = new THREE.Vector3(
                    this.history[nextPosIdx],
                    this.history[nextPosIdx + 1],
                    this.history[nextPosIdx + 2]
                );
                
                const dir = nextPos.clone().sub(currPos).normalize();
                const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(this.trailWidth * (1 - t / this.trailLength));
                
                const p1 = currPos.clone().add(perp);
                const p2 = currPos.clone().sub(perp);
                
                positions[vertexIdx * 3] = p1.x;
                positions[vertexIdx * 3 + 1] = p1.y;
                positions[vertexIdx * 3 + 2] = p1.z;
                
                positions[(vertexIdx + 1) * 3] = p2.x;
                positions[(vertexIdx + 1) * 3 + 1] = p2.y;
                positions[(vertexIdx + 1) * 3 + 2] = p2.z;
                
                const alpha = Math.pow(1 - t / this.trailLength, 2);
                alphas[vertexIdx] = alpha;
                alphas[vertexIdx + 1] = alpha;
                
                const speed = Math.sqrt(
                    velocities[i * 3] ** 2 +
                    velocities[i * 3 + 1] ** 2 +
                    velocities[i * 3 + 2] ** 2
                );
                const colorT = Math.min(speed / 5, 1);
                const hue = 0.6 - colorT * 0.6;
                const color = new THREE.Color().setHSL(hue, 1, 0.5 + colorT * 0.2);
                
                colors[vertexIdx * 3] = color.r;
                colors[vertexIdx * 3 + 1] = color.g;
                colors[vertexIdx * 3 + 2] = color.b;
                colors[(vertexIdx + 1) * 3] = color.r;
                colors[(vertexIdx + 1) * 3 + 1] = color.g;
                colors[(vertexIdx + 1) * 3 + 2] = color.b;
                
                vertexIdx += 2;
            }
        }
        
        this.trailMesh.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trailMesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.trailMesh.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        this.trailMesh.geometry.attributes.position.needsUpdate = true;
        this.trailMesh.geometry.attributes.color.needsUpdate = true;
        this.trailMesh.geometry.attributes.alpha.needsUpdate = true;
        this.trailMesh.geometry.setDrawRange(0, vertexIdx);
    }
    
    renderTrails(renderer, camera) {
        renderer.render(this.trailScene, camera);
    }
    
    setTrailLength(length) {
        this.trailLength = Math.max(5, Math.min(100, length));
        this.initBuffers();
    }
    
    setTrailFade(fade) {
        this.trailFade = fade;
        if (this.accumulationMaterial) {
            this.accumulationMaterial.uniforms.fadeFactor.value = fade;
        }
    }
    
    setTrailWidth(width) {
        this.trailWidth = width;
        if (this.trailMesh) {
            this.trailMesh.material.uniforms.trailWidth.value = width;
        }
    }
}
