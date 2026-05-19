import * as THREE from 'three';

const DEPTH_SHADER = {
    vertexShader: `
        attribute float radius;
        varying float vDepth;
        varying vec3 vViewPos;
        
        void main() {
            vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
            vViewPos = viewPos.xyz;
            vDepth = -viewPos.z;
            
            vec4 projected = projectionMatrix * viewPos;
            gl_Position = projected;
            gl_PointSize = radius * (300.0 / -viewPos.z);
        }
    `,
    fragmentShader: `
        varying float vDepth;
        varying vec3 vViewPos;
        
        void main() {
            vec2 coord = gl_PointCoord - 0.5;
            float dist = length(coord);
            
            if (dist > 0.5) {
                discard;
            }
            
            float thickness = 1.0 - dist * 2.0;
            float depth = vDepth - thickness * 0.1;
            
            gl_FragColor = vec4(depth, thickness, 0.0, 1.0);
        }
    `
};

const NORMAL_SHADER = {
    vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D depthTexture;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        void main() {
            float depth = texture2D(depthTexture, vUv).r;
            
            if (depth < 0.01) {
                discard;
            }
            
            vec2 texelSize = 1.0 / resolution;
            
            float depthL = texture2D(depthTexture, vUv - vec2(texelSize.x, 0.0)).r;
            float depthR = texture2D(depthTexture, vUv + vec2(texelSize.x, 0.0)).r;
            float depthU = texture2D(depthTexture, vUv - vec2(0.0, texelSize.y)).r;
            float depthD = texture2D(depthTexture, vUv + vec2(0.0, texelSize.y)).r;
            
            vec3 normal = normalize(vec3(
                depthL - depthR,
                depthU - depthD,
                0.1
            ));
            
            gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
        }
    `
};

const FLUID_SHADER = {
    vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D sceneTexture;
        uniform sampler2D depthTexture;
        uniform sampler2D normalTexture;
        uniform vec2 resolution;
        uniform vec3 lightDir;
        varying vec2 vUv;
        
        void main() {
            vec4 depthData = texture2D(depthTexture, vUv);
            float depth = depthData.r;
            float thickness = depthData.g;
            
            if (depth < 0.01) {
                gl_FragColor = texture2D(sceneTexture, vUv);
                return;
            }
            
            vec3 normal = texture2D(normalTexture, vUv).xyz * 2.0 - 1.0;
            
            float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
            
            vec3 lightDirNorm = normalize(lightDir);
            float diffuse = max(dot(normal, lightDirNorm), 0.0);
            vec3 halfVec = normalize(lightDirNorm + vec3(0.0, 0.0, 1.0));
            float specular = pow(max(dot(normal, halfVec), 0.0), 64.0);
            
            vec3 baseColor = vec3(0.0, 0.4, 0.8);
            vec3 highlightColor = vec3(0.4, 0.8, 1.0);
            
            vec3 fluidColor = mix(baseColor, highlightColor, fresnel * 0.5);
            fluidColor *= 0.6 + diffuse * 0.4;
            fluidColor += specular * 0.5;
            
            float absorption = exp(-thickness * 2.0);
            vec3 sceneColor = texture2D(sceneTexture, vUv).rgb;
            vec3 refractedColor = sceneColor * absorption;
            
            float alpha = 0.7 + fresnel * 0.3;
            vec3 finalColor = mix(refractedColor, fluidColor, alpha);
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

export class SSFRRenderer {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        
        this.depthTarget = null;
        this.normalTarget = null;
        this.sceneTarget = null;
        
        this.depthMaterial = null;
        this.normalMaterial = null;
        this.fluidMaterial = null;
        
        this.quadScene = null;
        this.quadCamera = null;
        
        this.init();
    }
    
    init() {
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        this.depthTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        this.normalTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
        
        this.sceneTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });
        
        this.depthMaterial = new THREE.ShaderMaterial({
            vertexShader: DEPTH_SHADER.vertexShader,
            fragmentShader: DEPTH_SHADER.fragmentShader,
            transparent: false
        });
        
        this.normalMaterial = new THREE.ShaderMaterial({
            vertexShader: NORMAL_SHADER.vertexShader,
            fragmentShader: NORMAL_SHADER.fragmentShader,
            uniforms: {
                depthTexture: { value: null },
                resolution: { value: new THREE.Vector2(width, height) }
            },
            transparent: false
        });
        
        this.fluidMaterial = new THREE.ShaderMaterial({
            vertexShader: FLUID_SHADER.vertexShader,
            fragmentShader: FLUID_SHADER.fragmentShader,
            uniforms: {
                sceneTexture: { value: null },
                depthTexture: { value: null },
                normalTexture: { value: null },
                resolution: { value: new THREE.Vector2(width, height) },
                lightDir: { value: new THREE.Vector3(1, 1, 1).normalize() }
            },
            transparent: false
        });
        
        const quadGeometry = new THREE.PlaneGeometry(2, 2);
        const quadMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.quad = new THREE.Mesh(quadGeometry, quadMaterial);
        this.quadScene = new THREE.Scene();
        this.quadScene.add(this.quad);
        this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    }
    
    resize() {
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        this.depthTarget.setSize(width, height);
        this.normalTarget.setSize(width, height);
        this.sceneTarget.setSize(width, height);
        
        this.normalMaterial.uniforms.resolution.value.set(width, height);
        this.fluidMaterial.uniforms.resolution.value.set(width, height);
    }
    
    createPointCloud(sphFluid) {
        const geometry = new THREE.BufferGeometry();
        const positions = sphFluid.getPositions();
        
        const positionAttribute = new THREE.Float32BufferAttribute(positions.slice(0, sphFluid.particleCount * 3), 3);
        geometry.setAttribute('position', positionAttribute);
        
        const radii = new Float32Array(sphFluid.particleCount).fill(15.0);
        geometry.setAttribute('radius', new THREE.Float32BufferAttribute(radii, 1));
        
        const material = this.depthMaterial.clone();
        
        return new THREE.Points(geometry, material);
    }
    
    render(scene, sphFluid) {
        const oldTarget = this.renderer.getRenderTarget();
        
        this.renderer.setRenderTarget(this.sceneTarget);
        this.renderer.render(scene, this.camera);
        
        const pointCloud = this.createPointCloud(sphFluid);
        const tempScene = new THREE.Scene();
        tempScene.add(pointCloud);
        
        this.renderer.setRenderTarget(this.depthTarget);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.clear();
        this.renderer.render(tempScene, this.camera);
        
        this.normalMaterial.uniforms.depthTexture.value = this.depthTarget.texture;
        this.quad.material = this.normalMaterial;
        this.renderer.setRenderTarget(this.normalTarget);
        this.renderer.clear();
        this.renderer.render(this.quadScene, this.quadCamera);
        
        this.fluidMaterial.uniforms.sceneTexture.value = this.sceneTarget.texture;
        this.fluidMaterial.uniforms.depthTexture.value = this.depthTarget.texture;
        this.fluidMaterial.uniforms.normalTexture.value = this.normalTarget.texture;
        
        this.quad.material = this.fluidMaterial;
        this.renderer.setRenderTarget(oldTarget);
        this.renderer.clear();
        this.renderer.render(this.quadScene, this.quadCamera);
    }
}
