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
    this.texturePendingUpdates = new Map();
    this.firstFrameRendered = false;
    this.onFirstFrame = options.onFirstFrame || null;
    this.onProgress = options.onProgress || null;
    this.onBandwidthUpdate = options.onBandwidthUpdate || null;
    
    this.stats = {
      vertexCount: 0,
      triangleCount: 0,
      drawCalls: 0
    };
    
    this.streamStats = {
      chunksReceived: 0,
      bytesReceived: 0,
      lastChunkTime: Date.now(),
      chunkTimes: [],
      bandwidth: 0
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
    this.initializeTextures();
  }

  initializeGeometries() {
    for (const geomInfo of this.metadata.geometries) {
      const baseId = geomInfo.id.substring(0, geomInfo.id.lastIndexOf('_l'));
      
      if (!this.geometries.has(baseId)) {
        this.geometries.set(baseId, {
          id: baseId,
          lodLevels: new Map(),
          currentLOD: 3,
          bestAvailableLOD: 3,
          needsUpdate: false
        });
      }
      
      const geom = this.geometries.get(baseId);
      geom.lodLevels.set(geomInfo.lodLevel, {
        ...geomInfo,
        vertexChunksReceived: new Set(),
        indexChunksReceived: new Set(),
        vertexData: null,
        normalData: null,
        uvData: null,
        indexData: null,
        vertexStride: 8,
        isComplete: false,
        isReady: false
      });
    }
    
    this.createMeshes();
  }

  initializeTextures() {
    if (!this.metadata.textures) return;
    
    for (const texInfo of this.metadata.textures) {
      const textureId = texInfo.id;
      
      if (!this.textureData.has(textureId)) {
        this.textureData.set(textureId, {
          ...texInfo,
          mipmapTiles: new Map(),
          isComplete: false,
          texture: null
        });
      }
    }
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
    if (!parts) {
      console.debug('Unknown vertex chunk format:', chunkId);
      return;
    }
    
    const [, meshIdx, primIdx, lodLevel, startVertexStr] = parts;
    const baseId = `g${meshIdx}_p${primIdx}`;
    const lod = parseInt(lodLevel);
    const startVertex = parseInt(startVertexStr);
    
    const geomData = this.geometries.get(baseId);
    if (!geomData) return;
    
    const lodData = geomData.lodLevels.get(lod);
    if (!lodData) return;
    
    const floatData = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    const vertexCount = floatData.length / lodData.vertexStride;
    
    if (!lodData.vertexData) {
      lodData.vertexData = new Float32Array(lodData.vertexCount * 3);
      lodData.normalData = new Float32Array(lodData.vertexCount * 3);
      lodData.uvData = new Float32Array(lodData.vertexCount * 2);
    }
    
    for (let i = 0; i < vertexCount; i++) {
      const srcOffset = i * lodData.vertexStride;
      const dstOffset = (startVertex + i) * 3;
      const uvDstOffset = (startVertex + i) * 2;
      
      lodData.vertexData[dstOffset] = floatData[srcOffset];
      lodData.vertexData[dstOffset + 1] = floatData[srcOffset + 1];
      lodData.vertexData[dstOffset + 2] = floatData[srcOffset + 2];
      
      lodData.normalData[dstOffset] = floatData[srcOffset + 3];
      lodData.normalData[dstOffset + 1] = floatData[srcOffset + 4];
      lodData.normalData[dstOffset + 2] = floatData[srcOffset + 5];
      
      lodData.uvData[uvDstOffset] = floatData[srcOffset + 6];
      lodData.uvData[uvDstOffset + 1] = floatData[srcOffset + 7];
    }
    
    lodData.vertexChunksReceived.add(chunkId);
    this.checkLODReady(baseId, lod);
  }

  handleIndexChunk(chunkId, data) {
    const parts = chunkId.match(/g(\d+)_p(\d+)_l(\d+)_i(\d+)/);
    if (!parts) {
      console.debug('Unknown index chunk format:', chunkId);
      return;
    }
    
    const [, meshIdx, primIdx, lodLevel, startIndexStr] = parts;
    const baseId = `g${meshIdx}_p${primIdx}`;
    const lod = parseInt(lodLevel);
    const startIndex = parseInt(startIndexStr);
    
    const geomData = this.geometries.get(baseId);
    if (!geomData) return;
    
    const lodData = geomData.lodLevels.get(lod);
    if (!lodData) return;
    
    const indices = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
    
    if (!lodData.indexData) {
      lodData.indexData = new Uint32Array(lodData.indexCount);
    }
    
    lodData.indexData.set(indices, startIndex);
    lodData.indexChunksReceived.add(chunkId);
    
    this.checkLODReady(baseId, lod);
  }

  handleTextureChunk(chunkId, data) {
    const parts = chunkId.match(/t(\d+)_l(\d+)_m(\d+)_t(\d+)/);
    if (!parts) {
      console.debug('Unknown texture chunk format:', chunkId);
      return;
    }
    
    const [, texIdx, lodLevel, mipLevel, tileIdx] = parts;
    const textureId = `t${texIdx}_l${lodLevel}`;
    const mip = parseInt(mipLevel);
    const tile = parseInt(tileIdx);
    
    const texData = this.textureData.get(textureId);
    if (!texData) {
      console.debug('Unknown texture:', textureId);
      return;
    }
    
    if (!texData.mipmapTiles.has(mip)) {
      texData.mipmapTiles.set(mip, new Map());
    }
    
    texData.mipmapTiles.get(mip).set(tile, data);
    
    if (mip === 0) {
      this.scheduleTextureUpdate(textureId);
    }
  }

  scheduleTextureUpdate(textureId) {
    if (this.texturePendingUpdates.has(textureId)) return;
    
    this.texturePendingUpdates.set(textureId, true);
    
    requestAnimationFrame(() => {
      this.texturePendingUpdates.delete(textureId);
      this.updateTexture(textureId);
    });
  }

  checkLODReady(baseId, lod) {
    const geomData = this.geometries.get(baseId);
    const lodData = geomData.lodLevels.get(lod);
    
    if (!lodData) return;
    
    const vertexComplete = lodData.vertexChunksReceived.size >= (lodData.vertexChunks?.length || 0);
    const indexComplete = lodData.indexChunksReceived.size >= (lodData.indexChunks?.length || 0);
    
    if (vertexComplete && indexComplete) {
      lodData.isComplete = true;
    }
    
    const hasData = lodData.vertexData && lodData.vertexData.length > 0 && 
                    lodData.indexData && lodData.indexData.length > 0;
    
    if (hasData && !lodData.isReady) {
      lodData.isReady = true;
      
      if (lod < geomData.bestAvailableLOD) {
        geomData.bestAvailableLOD = lod;
      }
      
      this.updateGeometry(baseId, lod);
      
      if (!this.firstFrameRendered && lod === this.metadata.lodLevels - 1) {
        this.firstFrameRendered = true;
        if (this.onFirstFrame) {
          this.onFirstFrame();
        }
      }
    }
    
    if (lodData.isComplete && lod === 0) {
      console.log(`Highest LOD complete for ${baseId}`);
    }
  }

  updateGeometry(baseId, lod) {
    const mesh = this.meshes.find(m => m.userData.baseId === baseId);
    if (!mesh) return;
    
    const geomData = this.geometries.get(baseId);
    const lodData = geomData.lodLevels.get(lod);
    
    if (!lodData || !lodData.isReady) return;
    
    const shouldUpdate = lod < geomData.currentLOD || 
                         lodData.isComplete || 
                         (lod === geomData.currentLOD && geomData.needsUpdate);
    
    if (!shouldUpdate) return;
    
    const geometry = mesh.geometry;
    
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(lodData.vertexData), 3
    ));
    geometry.setAttribute('normal', new THREE.BufferAttribute(
      new Float32Array(lodData.normalData), 3
    ));
    geometry.setAttribute('uv', new THREE.BufferAttribute(
      new Float32Array(lodData.uvData), 2
    ));
    geometry.setIndex(new THREE.BufferAttribute(
      new Uint32Array(lodData.indexData), 1
    ));
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    geometry.index.needsUpdate = true;
    
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    
    geomData.currentLOD = lod;
    geomData.needsUpdate = false;
    
    this.stats.vertexCount = lodData.vertexCount;
    this.stats.triangleCount = lodData.indexCount / 3;
    
    if (this.onProgress) {
      this.onProgress(this.getProgress());
    }
  }

  async updateTexture(textureId) {
    const texData = this.textureData.get(textureId);
    if (!texData) return;
    
    try {
      const baseMip = 0;
      const mipTiles = texData.mipmapTiles.get(baseMip);
      
      if (!mipTiles || mipTiles.size === 0) return;
      
      const tilesPerSide = Math.ceil(Math.sqrt(texData.tilesPerMip || 1));
      const tileSize = 256;
      const fullSize = tilesPerSide * tileSize;
      
      const canvas = document.createElement('canvas');
      canvas.width = fullSize;
      canvas.height = fullSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, fullSize, fullSize);
      
      let loadedTiles = 0;
      const promises = [];
      
      for (const [tileIdx, tileData] of mipTiles) {
        const row = Math.floor(tileIdx / tilesPerSide);
        const col = tileIdx % tilesPerSide;
        
        const blob = new Blob([tileData], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        promises.push(new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
            URL.revokeObjectURL(url);
            loadedTiles++;
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        }));
      }
      
      await Promise.all(promises);
      
      if (loadedTiles > 0) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        
        if (texData.texture) {
          texData.texture.dispose();
        }
        
        texData.texture = texture;
        
        const parts = textureId.match(/t(\d+)_l(\d+)/);
        if (parts) {
          const lod = parseInt(parts[2]);
          for (const mesh of this.meshes) {
            if (mesh.material) {
              mesh.material.map = texture;
              mesh.material.needsUpdate = true;
            }
          }
        }
      }
    } catch (e) {
      console.debug('Texture update error:', e.message);
    }
  }

  updateBandwidthEstimate(bytes) {
    const now = Date.now();
    this.streamStats.bytesReceived += bytes;
    this.streamStats.chunksReceived++;
    
    const timeDiff = now - this.streamStats.lastChunkTime;
    if (timeDiff > 0) {
      const instantBandwidth = (bytes * 8 * 1000) / timeDiff;
      
      this.streamStats.chunkTimes.push(instantBandwidth);
      if (this.streamStats.chunkTimes.length > 20) {
        this.streamStats.chunkTimes.shift();
      }
      
      const avgBandwidth = this.streamStats.chunkTimes.reduce((a, b) => a + b, 0) / 
                           this.streamStats.chunkTimes.length;
      this.streamStats.bandwidth = avgBandwidth;
      
      if (this.onBandwidthUpdate) {
        this.onBandwidthUpdate(avgBandwidth / 8);
      }
    }
    
    this.streamStats.lastChunkTime = now;
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
      const targetLOD = Math.min(lod, geomData.bestAvailableLOD);
      
      if (targetLOD !== geomData.currentLOD) {
        this.updateGeometry(baseId, targetLOD);
      }
    }
  }

  getProgress() {
    if (!this.metadata) return 0;
    
    let totalChunks = 0;
    let receivedChunks = 0;
    
    for (const geom of this.metadata.geometries) {
      totalChunks += (geom.vertexChunks?.length || 0) + (geom.indexChunks?.length || 0);
      
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
      progress: this.getProgress(),
      bandwidth: this.streamStats.bandwidth
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
      if (mesh.material.map) {
        mesh.material.map.dispose();
      }
      mesh.material.dispose();
    }
    
    for (const [, texData] of this.textureData) {
      if (texData.texture) {
        texData.texture.dispose();
      }
    }
    
    this.renderer.dispose();
    this.controls.dispose();
  }
}

export default ProgressiveRenderer;
