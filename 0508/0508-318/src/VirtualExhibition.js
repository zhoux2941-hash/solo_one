import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export class VirtualExhibition {
  constructor(container) {
    this.container = container;
    this.currentScene = null;
    this.scenes = {};
    this.hotspots = [];
    this.isVRMode = false;
    this.isMagicMode = false;
    this.isTransitioning = false;
    this.textureLoader = new THREE.TextureLoader();
    
    this.gyroOffset = { alpha: 0, beta: 0, gamma: 0 };
    this.gyroCalibrated = false;
    
    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.createRaycaster();
    this.createTransitionOverlay();
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 0.1);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.xr.enabled = true;
    this.renderer.xr.setReferenceSpaceType('local');
    this.container.appendChild(this.renderer.domElement);
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = -0.5;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 0.1;
  }

  createRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  createTransitionOverlay() {
    this.transitionOverlay = document.createElement('div');
    this.transitionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      transition: opacity 0.5s ease-in-out;
    `;
    document.body.appendChild(this.transitionOverlay);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e));
    
    this.setupVR();
  }

  setupVR() {
    const controllerModelFactory = new XRControllerModelFactory();
    
    this.controller1 = this.renderer.xr.getController(0);
    this.controller1.addEventListener('select', () => this.onVRSelect(0));
    this.scene.add(this.controller1);
    
    this.controller2 = this.renderer.xr.getController(1);
    this.controller2.addEventListener('select', () => this.onVRSelect(1));
    this.scene.add(this.controller2);
    
    this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    this.controllerGrip1.add(controllerModelFactory.createControllerModel(this.controllerGrip1));
    this.scene.add(this.controllerGrip1);
    
    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    this.controllerGrip2.add(controllerModelFactory.createControllerModel(this.controllerGrip2));
    this.scene.add(this.controllerGrip2);
  }

  onVRSelect(controllerIndex) {
    const controller = controllerIndex === 0 ? this.controller1 : this.controller2;
    this.raycaster.set(controller.position, controller.getWorldDirection(new THREE.Vector3()).negate());
    this.checkHotspotIntersection();
  }

  async preloadTexture(imageUrl) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        imageUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        (progress) => {
          if (this.onLoadProgress) {
            this.onLoadProgress(progress.loaded / progress.total);
          }
        },
        (error) => reject(error)
      );
    });
  }

  async addPanoramaScene(id, imageUrl, config = {}) {
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    
    try {
      const texture = await this.preloadTexture(imageUrl);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0
      });
      const sphere = new THREE.Mesh(geometry, material);
      
      this.scenes[id] = {
        mesh: sphere,
        config: config,
        hotspots: [],
        texture: texture,
        loaded: true
      };
      
      if (!this.currentScene) {
        await this.setCurrentScene(id, false);
      }
      
      return this.scenes[id];
    } catch (error) {
      console.error('Failed to load panorama:', error);
      const material = new THREE.MeshBasicMaterial({ color: 0x333333 });
      const sphere = new THREE.Mesh(geometry, material);
      
      this.scenes[id] = {
        mesh: sphere,
        config: config,
        hotspots: [],
        loaded: false
      };
      
      return this.scenes[id];
    }
  }

  async setCurrentScene(sceneId, withTransition = true) {
    if (this.isTransitioning || this.currentScene === sceneId) return;
    if (!this.scenes[sceneId]) return;

    this.isTransitioning = true;

    if (withTransition && this.currentScene) {
      this.transitionOverlay.style.opacity = '1';
      await this.sleep(500);
    }

    if (this.currentScene && this.scenes[this.currentScene]) {
      this.scene.remove(this.scenes[this.currentScene].mesh);
      this.scenes[this.currentScene].hotspots.forEach(hotspot => {
        this.scene.remove(hotspot.mesh);
      });
    }

    this.currentScene = sceneId;
    this.scene.add(this.scenes[sceneId].mesh);

    this.scenes[sceneId].hotspots.forEach(hotspot => {
      this.scene.add(hotspot.mesh);
      hotspot.mesh.material.opacity = 0;
    });

    this.hotspots = this.scenes[sceneId].hotspots;

    this.fadeInScene(sceneId);

    if (withTransition) {
      await this.sleep(300);
      this.transitionOverlay.style.opacity = '0';
    }

    if (this.onSceneChange) {
      this.onSceneChange(sceneId);
    }

    await this.sleep(500);
    this.isTransitioning = false;
  }

  fadeInScene(sceneId) {
    const scene = this.scenes[sceneId];
    if (!scene) return;

    let startTime = null;
    const duration = 800;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = this.easeInOutCubic(progress);

      if (scene.mesh.material) {
        scene.mesh.material.opacity = eased;
      }

      scene.hotspots.forEach((hotspot, index) => {
        if (hotspot.mesh.material) {
          hotspot.mesh.material.opacity = eased * 0.8;
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  addHotspot(sceneId, config) {
    const { position, type, target, title, description, image, modelUrl } = config;
    
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    let color;
    switch(type) {
      case 'navigate':
        color = 0x4CAF50;
        break;
      case 'info':
        color = 0x2196F3;
        break;
      case 'model':
        color = 0x9C27B0;
        break;
      default:
        color = 0xFF9800;
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.lookAt(0, 0, 0);
    
    const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh);

    const iconGeometry = new THREE.SphereGeometry(3, 16, 16);
    const iconMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
    iconMesh.position.set(0, 0, 0);
    mesh.add(iconMesh);

    let pulseStartTime = Date.now();
    const pulseAnimation = () => {
      const elapsed = (Date.now() - pulseStartTime) / 1000;
      const scale = 1 + Math.sin(elapsed * 3) * 0.15;
      glowMesh.scale.set(scale, scale, scale);
      glowMesh.material.opacity = 0.2 + Math.sin(elapsed * 3) * 0.15;
      requestAnimationFrame(pulseAnimation);
    };
    pulseAnimation();

    const hotspot = {
      mesh: mesh,
      glowMesh: glowMesh,
      iconMesh: iconMesh,
      config: config,
      originalScale: 1
    };
    
    this.scenes[sceneId].hotspots.push(hotspot);
    
    if (this.currentScene === sceneId) {
      this.scene.add(mesh);
      this.hotspots.push(hotspot);
      
      let opacity = 0;
      const fadeIn = () => {
        opacity += 0.05;
        if (opacity <= 0.8) {
          mesh.material.opacity = opacity;
          requestAnimationFrame(fadeIn);
        }
      };
      fadeIn();
    }
    
    return hotspot;
  }

  onClick(event) {
    if (this.isVRMode || this.isTransitioning) return;
    
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.checkHotspotIntersection();
  }

  onTouchStart(event) {
    if (this.isTransitioning) return;
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.checkHotspotIntersection();
    }
  }

  checkHotspotIntersection() {
    const hotspotMeshes = this.hotspots.map(h => h.mesh);
    const intersects = this.raycaster.intersectObjects(hotspotMeshes);
    
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const hotspot = this.hotspots.find(h => h.mesh === clickedMesh);
      
      if (hotspot) {
        this.onHotspotClick(hotspot);
      }
    }
  }

  onHotspotClick(hotspot) {
    const { config } = hotspot;
    
    if (config.type === 'navigate') {
      this.setCurrentScene(config.target);
    } else if (config.type === 'info') {
      if (this.onHotspotInfo) {
        this.onHotspotInfo(config);
      }
    }
  }

  enableVR() {
    if (!this.renderer.xr.isPresenting) {
      this.renderer.xr.setSession(this.xrSession);
      this.isVRMode = true;
      this.controls.enabled = false;
    }
  }

  disableVR() {
    this.isVRMode = false;
    this.controls.enabled = true;
  }

  async enableMagicMode() {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          this.startMagicMode();
        }
      } catch (e) {
        console.error('Magic mode permission denied:', e);
      }
    } else {
      this.startMagicMode();
    }
  }

  startMagicMode() {
    this.isMagicMode = true;
    this.controls.enabled = false;
    
    this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.gyroCalibrated = false;
    this.gyroOffset = { alpha: 0, beta: 0, gamma: 0 };
    
    window.addEventListener('deviceorientation', (e) => {
      this.deviceOrientation.alpha = e.alpha || 0;
      this.deviceOrientation.beta = e.beta || 0;
      this.deviceOrientation.gamma = e.gamma || 0;
    });

    if (this.onMagicModeEnabled) {
      this.onMagicModeEnabled();
    }
  }

  calibrateGyroscope() {
    if (!this.isMagicMode) return;
    
    this.gyroOffset.alpha = this.deviceOrientation.alpha;
    this.gyroOffset.beta = this.deviceOrientation.beta - 90;
    this.gyroOffset.gamma = this.deviceOrientation.gamma;
    this.gyroCalibrated = true;
    
    if (this.onCalibrationComplete) {
      this.onCalibrationComplete();
    }
  }

  resetCalibration() {
    this.gyroOffset = { alpha: 0, beta: 0, gamma: 0 };
    this.gyroCalibrated = false;
  }

  disableMagicMode() {
    this.isMagicMode = false;
    this.controls.enabled = true;
    this.gyroCalibrated = false;
  }

  updateMagicMode() {
    if (!this.isMagicMode) return;
    
    const { alpha, beta, gamma } = this.deviceOrientation;
    
    let adjustedBeta = beta - 90;
    let adjustedAlpha = -alpha;
    
    if (this.gyroCalibrated) {
      adjustedBeta = beta - 90 - this.gyroOffset.beta;
      adjustedAlpha = -(alpha - this.gyroOffset.alpha);
    }
    
    const x = adjustedBeta * Math.PI / 180;
    const y = adjustedAlpha * Math.PI / 180;
    const z = -gamma * Math.PI / 180;
    
    this.camera.rotation.set(x, y, z, 'YXZ');
  }

  updateHotspots() {
    this.hotspots.forEach(hotspot => {
      hotspot.mesh.lookAt(this.camera.position);
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.renderer.setAnimationLoop(() => {
      this.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  update() {
    if (!this.isVRMode && !this.isMagicMode) {
      this.controls.update();
    }
    
    if (this.isMagicMode) {
      this.updateMagicMode();
    }
    
    this.updateHotspots();
  }

  getCurrentSceneId() {
    return this.currentScene;
  }

  getScenes() {
    return Object.keys(this.scenes).map(id => ({
      id,
      config: this.scenes[id].config,
      loaded: this.scenes[id].loaded
    }));
  }

  preloadAllScenes() {
    return Promise.all(
      Object.keys(this.scenes).map(id => {
        if (!this.scenes[id].loaded && this.scenes[id].config.image) {
          return this.preloadTexture(this.scenes[id].config.image)
            .then(texture => {
              this.scenes[id].mesh.material.map = texture;
              this.scenes[id].loaded = true;
            })
            .catch(() => {});
        }
        return Promise.resolve();
      })
    );
  }
}