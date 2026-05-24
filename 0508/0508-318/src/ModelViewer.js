import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelViewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      backgroundColor: 0xf5f5f5,
      modelColor: 0x2196F3,
      enableShadow: true,
      autoRotate: true,
      autoRotateSpeed: 0.5,
      ...options
    };
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.animationId = null;
    
    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.createLights();
    this.createEnvironment();
    
    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);
  }

  createCamera() {
    const { clientWidth, clientHeight } = this.container;
    this.camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000);
    this.camera.position.set(3, 2, 5);
  }

  createRenderer() {
    const { clientWidth, clientHeight } = this.container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = this.options.enableShadow;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.container.appendChild(this.renderer.domElement);
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = this.options.autoRotate;
    this.controls.autoRotateSpeed = this.options.autoRotateSpeed;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
  }

  createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 7.5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 5, -10);
    this.scene.add(rimLight);
  }

  createEnvironment() {
    const groundGeometry = new THREE.CircleGeometry(10, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(20, 40, 0xcccccc, 0xeeeeee);
    gridHelper.position.y = -0.49;
    this.scene.add(gridHelper);
  }

  async loadModel(url, onProgress) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(
        url,
        (gltf) => {
          this.setModel(gltf.scene);
          resolve(gltf);
        },
        (progress) => {
          if (onProgress && progress.total > 0) {
            onProgress(progress.loaded / progress.total);
          }
        },
        (error) => {
          console.error('Error loading model:', error);
          this.createDemoModel();
          reject(error);
        }
      );
    });
  }

  createDemoModel() {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2196F3,
      metalness: 0.3,
      roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const topGeometry = new THREE.BoxGeometry(1.7, 0.3, 1.2);
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0x1976D2,
      metalness: 0.5,
      roughness: 0.3
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.65;
    top.castShadow = true;
    group.add(top);

    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 16);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x424242,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const legPositions = [
      [-0.55, -0.5, 0.35],
      [0.55, -0.5, 0.35],
      [-0.55, -0.5, -0.35],
      [0.55, -0.5, -0.35]
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      group.add(leg);
    });

    const knobGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const knobMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFC107,
      metalness: 0.9,
      roughness: 0.1
    });
    const knob = new THREE.Mesh(knobGeometry, knobMaterial);
    knob.position.set(0.7, 0.5, 0.51);
    knob.castShadow = true;
    group.add(knob);

    this.setModel(group);
  }

  setModel(model) {
    if (this.model) {
      this.scene.remove(this.model);
      this.disposeModel(this.model);
    }

    this.model = model;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;

    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y += size.y * scale / 2 - 0.25;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(model);
    this.centerCamera();
  }

  centerCamera() {
    if (this.model) {
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      this.controls.target.copy(center);
      this.camera.position.set(
        center.x + size.x * 1.5,
        center.y + size.y * 0.8,
        center.z + size.z * 1.5
      );
      this.controls.update();
    }
  }

  disposeModel(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  setAutoRotate(enabled) {
    this.controls.autoRotate = enabled;
  }

  resetView() {
    this.centerCamera();
  }

  setBackgroundColor(color) {
    this.scene.background = new THREE.Color(color);
  }

  onResize() {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.model) {
      this.disposeModel(this.model);
    }
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', () => this.onResize());
    this.container.removeChild(this.renderer.domElement);
  }
}