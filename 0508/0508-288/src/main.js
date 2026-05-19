import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SPHFluid } from './SPHFluid.js';
import { SSFRRenderer } from './SSFRRenderer.js';
import { ObstacleManager } from './ObstacleManager.js';
import { ForceField } from './ForceField.js';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        this.sphFluid = null;
        this.ssfrRenderer = null;
        this.obstacleManager = null;
        this.forceField = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.stats = {
            fps: 0,
            computeTime: 0,
            frameCount: 0,
            lastTime: performance.now()
        };
        
        this.init();
        this.setupUI();
        this.animate();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 3, 8);
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        this.addLights();
        this.addGround();
        this.addBoundary();
        
        this.obstacleManager = new ObstacleManager(this.scene);
        this.forceField = new ForceField();
        
        this.sphFluid = new SPHFluid({
            maxParticles: 65536,
            obstacleManager: this.obstacleManager,
            forceField: this.forceField,
            enableTrails: false
        });
        
        this.ssfrRenderer = new SSFRRenderer(this.renderer, this.camera);
        
        this.sphFluid.addParticles(5000, new THREE.Vector3(0, 3, 0));
        
        window.addEventListener('resize', () => this.onResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    }
    
    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x00ffff, 0.5);
        pointLight.position.set(-5, 5, -5);
        this.scene.add(pointLight);
    }
    
    addGround() {
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.3,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    addBoundary() {
        const boundaryGeometry = new THREE.BoxGeometry(10, 8, 10);
        const edges = new THREE.EdgesGeometry(boundaryGeometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })
        );
        line.position.y = 2;
        this.scene.add(line);
    }
    
    setupUI() {
        document.getElementById('add-particles').addEventListener('click', () => {
            this.sphFluid.addParticles(1000, new THREE.Vector3(0, 4, 0));
            this.updateParticleCount();
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.sphFluid.reset();
            this.obstacleManager.clear();
            this.updateParticleCount();
        });
        
        document.getElementById('add-sphere').addEventListener('click', () => {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 6
            );
            this.obstacleManager.addSphere(pos, 0.8);
        });
        
        document.getElementById('add-box').addEventListener('click', () => {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 6
            );
            this.obstacleManager.addBox(pos, new THREE.Vector3(1.5, 0.5, 1.5));
        });
        
        document.getElementById('clear-obstacles').addEventListener('click', () => {
            this.obstacleManager.clear();
        });
        
        document.getElementById('apply-wind').addEventListener('click', () => {
            this.forceField.setWind(new THREE.Vector3(5, 0, 0));
        });
        
        document.getElementById('apply-vortex').addEventListener('click', () => {
            this.forceField.setVortex(new THREE.Vector3(0, 2, 0), 10, 2);
        });
        
        document.getElementById('stop-force').addEventListener('click', () => {
            this.forceField.clear();
        });
        
        document.getElementById('color-mode').addEventListener('change', (e) => {
            this.sphFluid.setColorMode(e.target.value);
        });
        
        document.getElementById('render-mode').addEventListener('change', (e) => {
            this.sphFluid.setRenderMode(e.target.value);
        });
        
        document.getElementById('viscosity').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('viscosity-val').textContent = val;
            this.sphFluid.setViscosity(val);
        });
        
        document.getElementById('surface-tension').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('surface-tension-val').textContent = val;
            this.sphFluid.setSurfaceTension(val);
        });
        
        document.getElementById('lifetime').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('lifetime-val').textContent = val;
            this.sphFluid.setParticleLifetime(val);
        });
        
        let trailsEnabled = false;
        document.getElementById('toggle-trails').addEventListener('click', () => {
            trailsEnabled = !trailsEnabled;
            this.sphFluid.setEnableTrails(trailsEnabled);
            document.getElementById('toggle-trails').textContent = trailsEnabled ? '关闭拖尾' : '开启拖尾';
        });
        
        document.getElementById('trail-length').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('trail-length-val').textContent = val;
            this.sphFluid.setTrailLength(val);
        });
        
        document.getElementById('trail-width').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('trail-width-val').textContent = val.toFixed(2);
            this.sphFluid.setTrailWidth(val);
        });
        
        this.updateParticleCount();
    }
    
    updateParticleCount() {
        document.getElementById('particle-count').textContent = this.sphFluid.particleCount;
    }
    
    onClick(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.sphFluid.addParticles(500, point);
            this.updateParticleCount();
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.ssfrRenderer.resize();
    }
    
    updateStats() {
        this.stats.frameCount++;
        const now = performance.now();
        
        if (now - this.stats.lastTime >= 1000) {
            this.stats.fps = Math.round((this.stats.frameCount * 1000) / (now - this.stats.lastTime));
            this.stats.frameCount = 0;
            this.stats.lastTime = now;
            
            document.getElementById('fps').textContent = this.stats.fps;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.016);
        
        const computeStart = performance.now();
        this.sphFluid.update(deltaTime);
        this.stats.computeTime = Math.round((performance.now() - computeStart) * 100) / 100;
        document.getElementById('compute-time').textContent = this.stats.computeTime;
        
        this.controls.update();
        
        if (this.sphFluid.renderMode === 'ssfr') {
            this.ssfrRenderer.render(this.scene, this.sphFluid);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        if (this.sphFluid.enableTrails) {
            this.renderer.autoClear = false;
            this.sphFluid.renderTrails(this.renderer, this.camera);
            this.renderer.autoClear = true;
        }
        
        this.updateStats();
    }
}

new App();
