import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

class ProgressiveRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null;
    this.metadata = null;
    this.geometries = new Map();
    this.materials = new Map();
    this.meshes = [];
    this.lodLevels = new Map();
    this.currentLOD = 3;
    this.vertexData = new Map();
    this.indexData = new Map();
    this.textureData = new Map();
    this.firstFrameRendered = false;
    this.onFirstFrame = options.onFirstFrame || null;
    this.onProgress = options.onProgress || null;
    this.stats = {
      vertexCount: 0,
      triangleCount: 0,
      drawCalls: 0
    };
    
    this.init();
  }

  init() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.set(0, 2, 8);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
    
    this.setupLighting();
    this.setupEnvironment();
    
    window.addEventListener('resize', () => this.onResize());
    
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0x8080ff, 0.3);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);
  }

  setupEnvironment() {
    this.scene.background = new THREE.Color(0x1a1a2e);
    
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333);
    this.scene.add(gridHelper);
  }

  setMetadata(metadata) {
    this.metadata = metadata;
    
    if (metadata.bounds) {
      const size = metadata.bounds.size;
      const center = metadata.bounds.center;
      
      this.controls.target.set(center[0], center[1], center[2]);
      this.camera.position.set(center[0], center[1] + size * 0.5, center[2] + size * 1.5);
      this.controls.update();
      
      this.camera.far = Math.max(1000, size * 10);
      this.camera.updateProjectionMatrix();
    }
    
    this.initializeGeometries();
  }

  initializeGeometries() {
    for (const geomInfo of this.metadata.geometries) {
      const baseId = geomInfo.id.substring(0, geomInfo.id.lastIndexOf('_l'));
      
      if (!this.geometries.has(baseId)) {
        this.geometries.set(baseId, {
          id: baseId,
          lodLevels: new Map(),
          currentLOD: 3,
          positions: new Float32Array(),
          normals: new Float32Array(),
          uvs: new Float32Array(),
          indices: new Uint32Array(),
          vertexCount: 0,
          indexCount: 0,
          needsUpdate: false
        });
      }
      
      const geom = this.geometries.get(baseId);
      geom.lodLevels.set(geomInfo.lodLevel, {
        ...geomInfo,
        vertexChunksReceived: new Set(),
        indexChunksReceived: new Set(),
        vertexData: new Float32Array(),
        normalData: new Float32Array(),
        uvData: new Float32Array(),
        indexData: new Uint32Array(),
        isComplete: false
      });
    }
    
    this.createMeshes();
  }

  createMeshes() {
    for (const [baseId, geomData] of this.geometries) {
      const geometry = new THREE.BufferGeometry();
      
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(0), 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(0), 2));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(0), 1));
      
      const material = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.1,
        roughness: 0.7,
        wireframe: false
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.baseId = baseId;
      mesh.userData.geomData = geomData;
      
      this.meshes.push(mesh);
      this.scene.add(mesh);
    }
  }

  handleVertexChunk(chunkId, data) {
    const parts = chunkId.match(/g(\d+)_p(\d+)_l(\d+)_v(\d+)/);
    if (!parts) return;
    
    const [, meshIdx, primIdx, lodLevel, startVertex] = parts;
    const baseId = `g${meshIdx}_p${primIdx}`;
    const lod = parseInt(lodLevel);
    
    const geomData = this.geometries.get(baseId);
    if (!geomData) return;
    
    const lodData = geomData.lodLevels.get(lod);
    if (!lodData) return;
    
    const vertexCount = data.length / 8;
    const positions = new Float32Array(data.buffer, data.byteOffset, vertexCount * 3);
    const normals = new Float32Array(data.buffer, data.byteOffset + vertexCount * 12, vertexCount * 3);
    const uvs = new Float32Array(data.buffer, data.byteOffset + vertexCount * 24, vertexCount * 2);
    
    const currentVertices = lodData.vertexData.length / 3;
    const newVertexCount = currentVertices + vertexCount;
    
    const newPositions = new Float32Array(newVertexCount * 3);
    const newNormals = new Float32Array(newVertexCount * 3);
    const newUVs = new Float32Array(newVertexCount * 2);
    
    if (currentVertices > 0) {
      newPositions.set(lodData.vertexData, 0);
      newNormals.set(lodData.normalData, 0);
      newUVs.set(lodData.uvData, 0);
    }
    
    newPositions.set(positions, currentVertices * 3);
    newNormals.set(normals, currentVertices * 3);
    newUVs.set(uvs, currentVertices * 2);
    
    lodData.vertexData = newPositions;
    lodData.normalData = newNormals;
    lodData.uvData = newUVs;
    lodData.vertexChunksReceived.add(chunkId);
    
    const geomInfo = this.metadata.geometries.find(g => g.id === `${baseId}_l${lod}`);
    if (geomInfo && lodData.vertexChunksReceived.size >= geomInfo.vertexChunks.length) {
      lodData.isComplete = true;
    }
    
    this.checkLODReady(baseId, lod);
  }

  handleIndexChunk(chunkId, data) {
    const parts = chunkId.match(/g(\d+)_p(\d+)_l(\d+)_i(\d+)/);
    if (!parts) return;
    
    const [, meshIdx, primIdx, lodLevel] = parts;
    const baseId = `g${meshIdx}_p${primIdx}`;
    const lod = parseInt(lodLevel);
    
    const geomData = this.geometries.get(baseId);
    if (!geomData) return;
    
    const lodData = geomData.lodLevels.get(lod);
    if (!lodData) return;
    
    const indices = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
    
    const currentIndices = lodData.indexData.length;
    const newIndexCount = currentIndices + indices.length;
    
    const newIndices = new Uint32Array(newIndexCount);
    if (currentIndices > 0) {
      newIndices.set(lodData.indexData, 0);
    }
    newIndices.set(indices, currentIndices);
    
    lodData.indexData = newIndices;
    lodData.indexChunksReceived.add(chunkId);
    
    const geomInfo = this.metadata.geometries.find(g => g.id === `${baseId}_l${lod}`);
    if (geomInfo && lodData.indexChunksReceived.size >= geomInfo.indexChunks.length) {
      lodData.isComplete = true;
    }
    
    this.checkLODReady(baseId, lod);
  }

  handleTextureChunk(chunkId, data) {
    const parts = chunkId.match(/t(\d+)_l(\d+)_m(\d+)_t(\d+)/);
    if (!parts) return;
    
    const [, texIdx, lodLevel, mipLevel, tileIdx] = parts;
    const textureId = `t${texIdx}_l${lodLevel}`;
    
    if (!this.textureData.has(textureId)) {
      this.textureData.set(textureId, {
        mipmaps: new Map(),
        isComplete: false
      });
    }
    
    const texData = this.textureData.get(textureId);
    const mip = parseInt(mipLevel);
    const tile = parseInt(tileIdx);
    
    if (!texData.mipmaps.has(mip)) {
      texData.mipmaps.set(mip, new Map());
    }
    
    texData.mipmaps.get(mip).set(tile, data);
    
    this.updateTexture(textureId);
  }

  checkLODReady(baseId, lod) {
    const geomData = this.geometries.get(baseId);
    const lodData = geomData.lodLevels.get(lod);
    
    if (!lodData.isComplete && lodData.vertexData.length > 0 && lodData.indexData.length > 0) {
      this.updateGeometry(baseId, lod);
      
      if (!this.firstFrameRendered && lod === this.metadata.lodLevels - 1) {
        this.firstFrameRendered = true;
        if (this.onFirstFrame) {
          this.onFirstFrame();
        }
      }
    }
    
    if (lodData.isComplete) {
      this.updateGeometry(baseId, lod);
      console.log(`LOD ${lod} complete for ${baseId}`);
    }
  }

  updateGeometry(baseId, lod) {
    const mesh = this.meshes.find(m => m.userData.baseId === baseId);
    if (!mesh) return;
    
    const geomData = this.geometries.get(baseId);
    const lodData = geomData.lodLevels.get(lod);
    
    if (!lodData || lodData.vertexData.length === 0 || lodData.indexData.length === 0) return;
    
    if (lod < geomData.currentLOD || lodData.isComplete) {
      const geometry = mesh.geometry;
      
      geometry.setAttribute('position', new THREE.BufferAttribute(lodData.vertexData, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(lodData.normalData, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(lodData.uvData, 2));
      geometry.setIndex(new THREE.BufferAttribute(lodData.indexData, 1));
      
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.attributes.uv.needsUpdate = true;
      geometry.index.needsUpdate = true;
      
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      
      geomData.currentLOD = lod;
      
      this.stats.vertexCount = lodData.vertexData.length / 3;
      this.stats.triangleCount = lodData.indexData.length / 3;
      
      if (this.onProgress) {
        this.onProgress(this.getProgress());
      }
    }
  }

  async updateTexture(textureId) {
    const texData = this.textureData.get(textureId);
    if (!texData || texData.mipmaps.size === 0) return;
    
    try {
      const highestMip = Math.max(...texData.mipmaps.keys());
      const mipData = texData.mipmaps.get(highestMip);
      
      if (mipData && mipData.size > 0) {
        const firstTile = mipData.values().next().value;
        const blob = new Blob([firstTile], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        const texture = await new Promise((resolve, reject) => {
          const loader = new THREE.TextureLoader();
          loader.load(url, resolve, undefined, reject);
        });
        
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        
        const parts = textureId.match(/t(\d+)_l(\d+)/);
        if (parts) {
          const lod = parseInt(parts[2]);
          for (const mesh of this.meshes) {
            if (mesh.material && lod <= 0) {
              mesh.material.map = texture;
              mesh.material.needsUpdate = true;
            }
          }
        }
        
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.debug('Texture update error:', e.message);
    }
  }

  updateLOD() {
    if (!this.metadata?.bounds) return;
    
    const center = this.metadata.bounds.center;
    const cameraPos = this.camera.position;
    const distance = Math.sqrt(
      Math.pow(cameraPos.x - center[0], 2) +
      Math.pow(cameraPos.y - center[1], 2) +
      Math.pow(cameraPos.z - center[2], 2)
    );
    
    const thresholds = [5, 15, 30, 60];
    let newLOD = 3;
    for (let i = 0; i < thresholds.length; i++) {
      if (distance < thresholds[i]) {
        newLOD = i;
        break;
      }
    }
    
    if (newLOD !== this.currentLOD) {
      this.currentLOD = newLOD;
      this.switchLOD(newLOD);
    }
  }

  switchLOD(lod) {
    console.log(`Switching to LOD ${lod}`);
    
    for (const [baseId, geomData] of this.geometries) {
      const lodData = geomData.lodLevels.get(lod);
      if (lodData && lodData.vertexData.length > 0 && lodData.indexData.length > 0) {
        this.updateGeometry(baseId, lod);
      }
    }
  }

  getProgress() {
    if (!this.metadata) return 0;
    
    let totalChunks = 0;
    let receivedChunks = 0;
    
    for (const geom of this.metadata.geometries) {
      totalChunks += geom.vertexChunks.length + geom.indexChunks.length;
      
      const baseId = geom.id.substring(0, geom.id.lastIndexOf('_l'));
      const lod = geom.lodLevel;
      const geomData = this.geometries.get(baseId);
      if (geomData) {
        const lodData = geomData.lodLevels.get(lod);
        if (lodData) {
          receivedChunks += lodData.vertexChunksReceived.size + lodData.indexChunksReceived.size;
        }
      }
    }
    
    return totalChunks > 0 ? receivedChunks / totalChunks : 0;
  }

  getStats() {
    return {
      ...this.stats,
      currentLOD: this.currentLOD,
      meshes: this.meshes.length,
      progress: this.getProgress()
    };
  }

  onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.updateLOD();
    
    this.stats.drawCalls = 0;
    this.renderer.render(this.scene, this.camera);
    this.stats.drawCalls = this.renderer.info.render.calls;
  }

  dispose() {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    
    this.renderer.dispose();
    this.controls.dispose();
  }
}

export default ProgressiveRenderer;
