const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CONFIG = {
  LOD_LEVELS: 4,
  CHUNK_SIZE: 64 * 1024,
  TEXTURE_TILE_SIZE: 256,
  VERTEX_CHUNK_SIZE: 1000,
  INDEX_CHUNK_SIZE: 3000,
  PRIVACY_ENABLED: true,
  FACE_DETECTION_ENABLED: true,
  BLUR_INTENSITY: 5,
  EDGE_DETECTION_THRESHOLD: 30,
  SENSITIVE_AREAS: []
};

class PrivacyProtector {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.blurIntensity = options.blurIntensity || CONFIG.BLUR_INTENSITY;
    this.edgeThreshold = options.edgeThreshold || CONFIG.EDGE_DETECTION_THRESHOLD;
    this.sensitiveAreas = options.sensitiveAreas || [];
    this.detectedFaces = [];
  }

  detectFacesFromGeometry(positions, normals, uvs, indices) {
    const faces = [];
    const vertexCount = positions.length / 3;
    
    const center = this.calculateCenter(positions);
    const bounds = this.calculateBounds(positions);
    const size = Math.max(bounds.max[0] - bounds.min[0], bounds.max[1] - bounds.min[1], bounds.max[2] - bounds.min[2]);
    
    const faceRegions = this.detectFaceRegions(positions, normals, center, size);
    
    for (const region of faceRegions) {
      faces.push({
        vertices: region.vertices,
        bbox: region.bbox,
        center: region.center,
        size: region.size,
        uvBounds: this.calculateUVBounds(region.vertices, uvs, indices)
      });
    }
    
    this.detectedFaces = faces;
    return faces;
  }

  calculateCenter(positions) {
    let sumX = 0, sumY = 0, sumZ = 0;
    const count = positions.length / 3;
    
    for (let i = 0; i < positions.length; i += 3) {
      sumX += positions[i];
      sumY += positions[i + 1];
      sumZ += positions[i + 2];
    }
    
    return [sumX / count, sumY / count, sumZ / count];
  }

  calculateBounds(positions) {
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    
    for (let i = 0; i < positions.length; i += 3) {
      min[0] = Math.min(min[0], positions[i]);
      min[1] = Math.min(min[1], positions[i + 1]);
      min[2] = Math.min(min[2], positions[i + 2]);
      max[0] = Math.max(max[0], positions[i]);
      max[1] = Math.max(max[1], positions[i + 1]);
      max[2] = Math.max(max[2], positions[i + 2]);
    }
    
    return { min, max };
  }

  detectFaceRegions(positions, normals, center, size) {
    const regions = [];
    const vertexCount = positions.length / 3;
    
    const upperFrontVertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      const dx = x - center[0];
      const dy = y - center[1];
      const dz = z - center[2];
      
      const isFront = dz > 0;
      const isUpper = y > center[1];
      const isCenter = Math.sqrt(dx * dx + dz * dz) < size * 0.3;
      
      if (isFront && isUpper && isCenter) {
        upperFrontVertices.push(i);
      }
    }
    
    if (upperFrontVertices.length > 50) {
      const cluster = this.clusterVertices(upperFrontVertices, positions, size * 0.1);
      
      for (const verts of cluster) {
        if (verts.length > 30) {
          const regionBounds = this.calculateVertexBounds(verts, positions);
          const regionCenter = [
            (regionBounds.min[0] + regionBounds.max[0]) / 2,
            (regionBounds.min[1] + regionBounds.max[1]) / 2,
            (regionBounds.min[2] + regionBounds.max[2]) / 2
          ];
          const regionSize = Math.max(
            regionBounds.max[0] - regionBounds.min[0],
            regionBounds.max[1] - regionBounds.min[1],
            regionBounds.max[2] - regionBounds.min[2]
          );
          
          regions.push({
            vertices: verts,
            bbox: regionBounds,
            center: regionCenter,
            size: regionSize
          });
        }
      }
    }
    
    if (this.sensitiveAreas && this.sensitiveAreas.length > 0) {
      for (const area of this.sensitiveAreas) {
        const verts = [];
        for (let i = 0; i < vertexCount; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          if (x >= area.bbox.min[0] && x <= area.bbox.max[0] &&
              y >= area.bbox.min[1] && y <= area.bbox.max[1] &&
              z >= area.bbox.min[2] && z <= area.bbox.max[2]) {
            verts.push(i);
          }
        }
        
        if (verts.length > 10) {
          regions.push({
            vertices: verts,
            bbox: area.bbox,
            center: area.center || [(area.bbox.min[0] + area.bbox.max[0]) / 2, (area.bbox.min[1] + area.bbox.max[1]) / 2, (area.bbox.min[2] + area.bbox.max[2]) / 2],
            size: area.size || Math.max(area.bbox.max[0] - area.bbox.min[0], area.bbox.max[1] - area.bbox.min[1], area.bbox.max[2] - area.bbox.min[2])
          });
        }
      }
    }
    
    return regions;
  }

  clusterVertices(vertices, positions, maxDist) {
    const clusters = [];
    const visited = new Set();
    const maxDistSq = maxDist * maxDist;
    
    for (const v of vertices) {
      if (visited.has(v)) continue;
      
      const cluster = [];
      const queue = [v];
      visited.add(v);
      
      while (queue.length > 0) {
        const current = queue.shift();
        cluster.push(current);
        
        for (const other of vertices) {
          if (visited.has(other)) continue;
          
          const dx = positions[current * 3] - positions[other * 3];
          const dy = positions[current * 3 + 1] - positions[other * 3 + 1];
          const dz = positions[current * 3 + 2] - positions[other * 3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;
          
          if (distSq < maxDistSq) {
            visited.add(other);
            queue.push(other);
          }
        }
      }
      
      if (cluster.length > 10) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  calculateVertexBounds(vertices, positions) {
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    
    for (const v of vertices) {
      min[0] = Math.min(min[0], positions[v * 3]);
      min[1] = Math.min(min[1], positions[v * 3 + 1]);
      min[2] = Math.min(min[2], positions[v * 3 + 2]);
      max[0] = Math.max(max[0], positions[v * 3]);
      max[1] = Math.max(max[1], positions[v * 3 + 1]);
      max[2] = Math.max(max[2], positions[v * 3 + 2]);
    }
    
    return { min, max };
  }

  calculateUVBounds(vertices, uvs, indices) {
    let minU = Infinity, minV = Infinity;
    let maxU = -Infinity, maxV = -Infinity;
    
    for (const v of vertices) {
      const u = uvs[v * 2];
      const vCoord = uvs[v * 2 + 1];
      minU = Math.min(minU, u);
      minV = Math.min(minV, vCoord);
      maxU = Math.max(maxU, u);
      maxV = Math.max(maxV, vCoord);
    }
    
    if (!isFinite(minU) || !isFinite(minV) || !isFinite(maxU) || !isFinite(maxV)) {
      return null;
    }
    
    return {
      min: [minU, minV],
      max: [maxU, maxV]
    };
  }

  blurTexture(imageData, faces, textureWidth, textureHeight) {
    if (!this.enabled || faces.length === 0) return imageData;
    
    const data = new Uint8ClampedArray(imageData);
    
    for (const face of faces) {
      if (!face.uvBounds) continue;
      
      const uvMin = face.uvBounds.min;
      const uvMax = face.uvBounds.max;
      
      const startX = Math.floor(uvMin[0] * textureWidth);
      const startY = Math.floor(uvMin[1] * textureHeight);
      const endX = Math.ceil(uvMax[0] * textureWidth);
      const endY = Math.ceil(uvMax[1] * textureHeight);
      
      const edges = this.detectEdges(data, startX, startY, endX, endY, textureWidth, textureHeight);
      
      this.applyGaussianBlur(data, startX, startY, endX, endY, textureWidth, textureHeight, edges);
    }
    
    return data;
  }

  detectEdges(data, startX, startY, endX, endY, width, height) {
    const edges = [];
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = Math.max(1, startY); y < Math.min(height - 1, endY); y++) {
      for (let x = Math.max(1, startX); x < Math.min(width - 1, endX); x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        if (magnitude > this.edgeThreshold) {
          edges.push({ x, y, magnitude });
        }
      }
    }
    
    return edges;
  }

  applyGaussianBlur(data, startX, startY, endX, endY, width, height, edges) {
    const blurRadius = this.blurIntensity;
    const sigma = blurRadius / 3;
    const kernel = this.generateGaussianKernel(blurRadius, sigma);
    const kernelSize = blurRadius * 2 + 1;
    
    const tempData = new Uint8ClampedArray(data);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const edgeFactor = this.getEdgeFactor(x, y, edges);
        const blurAmount = 1 - edgeFactor * 0.5;
        
        let r = 0, g = 0, b = 0, a = 0, weightSum = 0;
        
        for (let ky = -blurRadius; ky <= blurRadius; ky++) {
          for (let kx = -blurRadius; kx <= blurRadius; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const idx = (py * width + px) * 4;
            const kernelIdx = (ky + blurRadius) * kernelSize + (kx + blurRadius);
            const weight = kernel[kernelIdx] * blurAmount;
            
            r += tempData[idx] * weight;
            g += tempData[idx + 1] * weight;
            b += tempData[idx + 2] * weight;
            a += tempData[idx + 3] * weight;
            weightSum += weight;
          }
        }
        
        const idx = (y * width + x) * 4;
        data[idx] = Math.round(r / weightSum);
        data[idx + 1] = Math.round(g / weightSum);
        data[idx + 2] = Math.round(b / weightSum);
        data[idx + 3] = Math.round(a / weightSum);
      }
    }
  }

  generateGaussianKernel(radius, sigma) {
    const size = radius * 2 + 1;
    const kernel = [];
    let sum = 0;
    
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
        kernel.push(value);
        sum += value;
      }
    }
    
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }

  getEdgeFactor(x, y, edges) {
    let maxDist = 10;
    let minDist = Infinity;
    
    for (const edge of edges) {
      const dist = Math.sqrt((x - edge.x) ** 2 + (y - edge.y) ** 2);
      minDist = Math.min(minDist, dist);
      if (minDist < 1) break;
    }
    
    if (minDist > maxDist) return 0;
    return 1 - minDist / maxDist;
  }

  blurVertices(positions, normals, faces) {
    if (!this.enabled || faces.length === 0) return { positions, normals };
    
    const blurredPositions = new Float32Array(positions);
    const blurredNormals = normals ? new Float32Array(normals) : null;
    
    for (const face of faces) {
      const center = face.center;
      const blurRadius = face.size * 0.1;
      
      for (const v of face.vertices) {
        const vIdx = v * 3;
        
        const x = positions[vIdx];
        const y = positions[vIdx + 1];
        const z = positions[vIdx + 2];
        
        const dx = x - center[0];
        const dy = y - center[1];
        const dz = z - center[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < blurRadius * 3) {
          const blurFactor = Math.max(0, 1 - dist / (blurRadius * 3));
          
          const noise = (Math.random() - 0.5) * blurRadius * 0.2 * blurFactor;
          blurredPositions[vIdx] = x + noise;
          blurredPositions[vIdx + 1] = y + noise;
          blurredPositions[vIdx + 2] = z + noise;
          
          if (blurredNormals && blurFactor > 0.5) {
            const normalNoise = (Math.random() - 0.5) * 0.3 * blurFactor;
            blurredNormals[vIdx] = Math.max(-1, Math.min(1, normals[vIdx] + normalNoise));
            blurredNormals[vIdx + 1] = Math.max(-1, Math.min(1, normals[vIdx + 1] + normalNoise));
            blurredNormals[vIdx + 2] = Math.max(-1, Math.min(1, normals[vIdx + 2] + normalNoise));
            
            const len = Math.sqrt(
              blurredNormals[vIdx] ** 2 + 
              blurredNormals[vIdx + 1] ** 2 + 
              blurredNormals[vIdx + 2] ** 2
            );
            blurredNormals[vIdx] /= len;
            blurredNormals[vIdx + 1] /= len;
            blurredNormals[vIdx + 2] /= len;
      }
        }
      }
    }
    
    return { positions: blurredPositions, normals: blurredNormals };
  }
}

class ModelProcessor {
  constructor(inputPath, outputDir, privacyOptions = {}) {
    this.inputPath = inputPath;
    this.outputDir = outputDir;
    this.modelData = null;
    this.chunks = new Map();
    this.privacyProtector = new PrivacyProtector(privacyOptions);
    this.metadata = {
      modelId: path.basename(inputPath, path.extname(inputPath)),
      lodLevels: CONFIG.LOD_LEVELS,
      totalChunks: 0,
      totalSize: 0,
      chunks: {},
      bounds: null,
      textures: [],
      geometries: [],
      privacy: {
        enabled: this.privacyProtector.enabled,
        facesDetected: 0,
        blurIntensity: this.privacyProtector.blurIntensity
      }
    };
  }

  async process() {
    console.log('Processing model: ' + this.inputPath);
    console.log('Privacy protection: ' + (this.privacyProtector.enabled ? 'ENABLED' : 'DISABLED'));
    
    this.modelData = await this.loadModel();
    const bounds = this.calculateBounds();
    this.metadata.bounds = bounds;
    
    for (let lod = 0; lod < CONFIG.LOD_LEVELS; lod++) {
      console.log('Generating LOD level ' + lod + '...');
      await this.generateLOD(lod);
    }
    
    await this.saveChunks();
    await this.saveMetadata();
    
    console.log('Model processing complete!');
    console.log('Total chunks: ' + this.metadata.totalChunks);
    console.log('Total size: ' + (this.metadata.totalSize / 1024 / 1024).toFixed(2) + ' MB');
    console.log('Faces detected and blurred: ' + this.metadata.privacy.facesDetected);
    
    return this.metadata;
  }

  async loadModel() {
    const ext = path.extname(this.inputPath).toLowerCase();
    
    if (ext === '.glb') {
      return this.parseGLB(fs.readFileSync(this.inputPath));
    } else if (ext === '.gltf') {
      return JSON.parse(fs.readFileSync(this.inputPath, 'utf-8'));
    } else {
      throw new Error('Unsupported model format');
    }
  }

  parseGLB(buffer) {
    const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const magic = dataView.getUint32(0, true);
    if (magic !== 0x46546C67) throw new Error('Invalid GLB magic');
    
    const version = dataView.getUint32(4, true);
    const length = dataView.getUint32(8, true);
    
    let offset = 12;
    let jsonChunk = null;
    let binaryChunk = null;
    
    while (offset < length) {
      const chunkLength = dataView.getUint32(offset, true);
      const chunkType = dataView.getUint32(offset + 4, true);
      
      if (chunkType === 0x4E4F534A) {
        const jsonData = buffer.slice(offset + 8, offset + 8 + chunkLength);
        jsonChunk = JSON.parse(jsonData.toString('utf-8'));
      } else if (chunkType === 0x004E4942) {
        binaryChunk = buffer.slice(offset + 8, offset + 8 + chunkLength);
      }
      
      offset += 8 + chunkLength;
    }
    
    return { json: jsonChunk, binary: binaryChunk };
  }

  calculateBounds() {
    const accessors = this.modelData.json.accessors;
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    
    for (const accessor of accessors) {
      if (accessor.min && accessor.max) {
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i], accessor.min[i]);
          max[i] = Math.max(max[i], accessor.max[i]);
        }
      }
    }
    
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
    
    return { min: min, max: max, center: center, size: size };
  }

  async generateLOD(lodLevel) {
    const meshes = this.modelData.json.meshes || [];
    
    for (let meshIdx = 0; meshIdx < meshes.length; meshIdx++) {
      const mesh = meshes[meshIdx];
      for (let primIdx = 0; primIdx < mesh.primitives.length; primIdx++) {
        const primitive = mesh.primitives[primIdx];
        await this.processPrimitive(primitive, meshIdx, primIdx, lodLevel);
      }
    }
  }

  async processPrimitive(primitive, meshIdx, primIdx, lodLevel) {
    const reductionFactor = Math.pow(0.5, lodLevel);
    const attributes = primitive.attributes;
    
    const positionAccessor = this.modelData.json.accessors[attributes.POSITION];
    const indexAccessor = primitive.indices != null ? this.modelData.json.accessors[primitive.indices] : null;
    
    const positions = this.extractBufferData(positionAccessor);
    const normals = attributes.NORMAL != null ? this.extractBufferData(this.modelData.json.accessors[attributes.NORMAL]) : null;
    const uvs = attributes.TEXCOORD_0 != null ? this.extractBufferData(this.modelData.json.accessors[attributes.TEXCOORD_0]) : null;
    const indices = indexAccessor ? this.extractBufferData(indexAccessor) : null;
    
    let faces = [];
    if (this.privacyProtector.enabled && lodLevel === 0) {
      faces = this.privacyProtector.detectFacesFromGeometry(positions, normals, uvs, indices);
      this.metadata.privacy.facesDetected += faces.length;
      
      if (faces.length > 0) {
        console.log('  Detected ' + faces.length + ' face(s) in primitive ' + meshIdx + '_' + primIdx);
        const blurred = this.privacyProtector.blurVertices(positions, normals, faces);
        if (blurred.positions) {
          positions.set(blurred.positions);
        }
        if (blurred.normals && normals) {
          normals.set(blurred.normals);
        }
      }
    }
    
    const simplified = this.simplifyMesh(positions, normals, uvs, indices, reductionFactor);
    
    const geometryId = 'g' + meshIdx + '_p' + primIdx + '_l' + lodLevel;
    this.chunkGeometry(geometryId, simplified.simplifiedPositions, simplified.simplifiedNormals, simplified.simplifiedUVs, simplified.simplifiedIndices, lodLevel);
  }

  extractBufferData(accessor) {
    const bufferView = this.modelData.json.bufferViews[accessor.bufferView];
    const buffer = this.modelData.binary || this.modelData.buffers[bufferView.buffer];
    
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = bufferView.byteLength;
    
    const data = buffer.slice(byteOffset, byteOffset + byteLength);
    
    switch (accessor.componentType) {
      case 5123:
        return new Uint16Array(data.buffer, data.byteOffset, data.byteLength / 2);
      case 5125:
        return new Uint32Array(data.buffer, data.byteOffset, data.byteLength / 4);
      case 5126:
        return new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4);
      default:
        return new Uint8Array(data);
    }
  }

  simplifyMesh(positions, normals, uvs, indices, factor) {
    if (factor >= 1) {
      return {
        simplifiedPositions: positions,
        simplifiedNormals: normals,
        simplifiedUVs: uvs,
        simplifiedIndices: indices
      };
    }
    
    const targetVertexCount = Math.max(100, Math.floor(positions.length / 3 * factor));
    
    const vertexMap = new Map();
    const simplifiedPositions = [];
    const simplifiedNormals = [];
    const simplifiedUVs = [];
    const simplifiedIndices = [];
    
    const step = Math.max(1, Math.floor((indices ? indices.length / 3 : positions.length / 3) / targetVertexCount));
    
    if (indices) {
      for (let i = 0; i < indices.length; i += 3 * step) {
        for (let j = 0; j < 3 && i + j < indices.length; j++) {
          const idx = indices[i + j];
          const key = String(idx);
          
          if (!vertexMap.has(key)) {
            vertexMap.set(key, simplifiedPositions.length / 3);
            simplifiedPositions.push(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
            if (normals) simplifiedNormals.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
            if (uvs) simplifiedUVs.push(uvs[idx * 2], uvs[idx * 2 + 1]);
          }
          
          simplifiedIndices.push(vertexMap.get(key));
        }
      }
    } else {
      for (let i = 0; i < positions.length; i += 3 * step) {
        simplifiedPositions.push(positions[i], positions[i + 1], positions[i + 2]);
        if (normals) simplifiedNormals.push(normals[i], normals[i + 1], normals[i + 2]);
        if (uvs) simplifiedUVs.push(uvs[i / 3 * 2], uvs[i / 3 * 2 + 1]);
        simplifiedIndices.push(i / 3);
      }
    }
    
    return {
      simplifiedPositions: new Float32Array(simplifiedPositions),
      simplifiedNormals: normals ? new Float32Array(simplifiedNormals) : null,
      simplifiedUVs: uvs ? new Float32Array(simplifiedUVs) : null,
      simplifiedIndices: new Uint32Array(simplifiedIndices)
    };
  }

  chunkGeometry(geometryId, positions, normals, uvs, indices, lodLevel) {
    const vertexChunks = [];
    const indexChunks = [];
    
    for (let vStart = 0; vStart < positions.length / 3; vStart += CONFIG.VERTEX_CHUNK_SIZE) {
      const vEnd = Math.min(vStart + CONFIG.VERTEX_CHUNK_SIZE, positions.length / 3);
      const vCount = vEnd - vStart;
      
      const posChunk = positions.slice(vStart * 3, vEnd * 3);
      const normChunk = normals ? normals.slice(vStart * 3, vEnd * 3) : null;
      const uvChunk = uvs ? uvs.slice(vStart * 2, vEnd * 2) : null;
      
      const vertexData = this.serializeVertexChunk(posChunk, normChunk, uvChunk);
      const chunkId = geometryId + '_v' + vStart;
      
      this.addChunk(chunkId, vertexData, {
        type: 'vertices',
        geometryId: geometryId,
        lodLevel: lodLevel,
        startVertex: vStart,
        vertexCount: vCount
      });
      
      vertexChunks.push(chunkId);
    }
    
    for (let iStart = 0; iStart < indices.length; iStart += CONFIG.INDEX_CHUNK_SIZE) {
      const iEnd = Math.min(iStart + CONFIG.INDEX_CHUNK_SIZE, indices.length);
      const idxChunk = indices.slice(iStart, iEnd);
      
      const indexData = Buffer.from(idxChunk.buffer);
      const chunkId = geometryId + '_i' + iStart;
      
      this.addChunk(chunkId, indexData, {
        type: 'indices',
        geometryId: geometryId,
        lodLevel: lodLevel,
        startIndex: iStart,
        indexCount: idxChunk.length
      });
      
      indexChunks.push(chunkId);
    }
    
    this.metadata.geometries.push({
      id: geometryId,
      lodLevel: lodLevel,
      vertexChunks: vertexChunks,
      indexChunks: indexChunks,
      vertexCount: positions.length / 3,
      indexCount: indices.length
    });
  }

  serializeVertexChunk(positions, normals, uvs) {
    const buffers = [];
    
    buffers.push(Buffer.from(positions.buffer));
    
    if (normals) {
      buffers.push(Buffer.from(normals.buffer));
    }
    
    if (uvs) {
      buffers.push(Buffer.from(uvs.buffer));
    }
    
    return Buffer.concat(buffers);
  }

  addChunk(chunkId, data, metadata) {
    const compressed = zlib.gzipSync(data);
    
    this.chunks.set(chunkId, {
      id: chunkId,
      data: compressed,
      originalSize: data.length,
      compressedSize: compressed.length,
      ...metadata
    });
    
    this.metadata.chunks[chunkId] = {
      id: chunkId,
      size: compressed.length,
      originalSize: data.length,
      ...metadata
    };
    
    this.metadata.totalChunks++;
    this.metadata.totalSize += compressed.length;
  }

  async saveChunks() {
    const chunksDir = path.join(this.outputDir, 'chunks');
    if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });
    
    for (const [chunkId, chunk] of this.chunks) {
      fs.writeFileSync(path.join(chunksDir, chunkId + '.bin'), chunk.data);
    }
  }

  async saveMetadata() {
    fs.writeFileSync(
      path.join(this.outputDir, 'metadata.json'),
      JSON.stringify(this.metadata, null, 2)
    );
  }
}

async function createTestModel(outputPath) {
  const gltf = {
    asset: { version: '2.0', generator: 'test-generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
        indices: 3,
        material: 0
      }]
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.8, 0.8, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.7
      }
    }],
    accessors: [
      { bufferView: 0, componentType: 5126, type: 'VEC3', count: 0, min: [-5, -5, -5], max: [5, 5, 5] },
      { bufferView: 1, componentType: 5126, type: 'VEC3', count: 0 },
      { bufferView: 2, componentType: 5126, type: 'VEC2', count: 0 },
      { bufferView: 3, componentType: 5125, type: 'SCALAR', count: 0 }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 0, target: 34962 },
      { buffer: 0, byteOffset: 0, byteLength: 0, target: 34962 },
      { buffer: 0, byteOffset: 0, byteLength: 0, target: 34962 },
      { buffer: 0, byteOffset: 0, byteLength: 0, target: 34963 }
    ],
    buffers: [{ byteLength: 0, uri: 'data:application/octet-stream;base64,' }]
  };
  
  const segments = 100;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    
    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      
      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      
      positions.push(x * 2, y * 2, z * 2);
      normals.push(x, y, z);
      uvs.push(lon / segments, lat / segments);
    }
  }
  
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;
      
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }
  
  const posBuffer = Buffer.from(new Float32Array(positions).buffer);
  const normBuffer = Buffer.from(new Float32Array(normals).buffer);
  const uvBuffer = Buffer.from(new Float32Array(uvs).buffer);
  const idxBuffer = Buffer.from(new Uint32Array(indices).buffer);
  
  const binaryData = Buffer.concat([posBuffer, normBuffer, uvBuffer, idxBuffer]);
  
  gltf.accessors[0].count = positions.length / 3;
  gltf.accessors[1].count = normals.length / 3;
  gltf.accessors[2].count = uvs.length / 2;
  gltf.accessors[3].count = indices.length;
  
  gltf.bufferViews[0].byteLength = posBuffer.length;
  gltf.bufferViews[1].byteOffset = posBuffer.length;
  gltf.bufferViews[1].byteLength = normBuffer.length;
  gltf.bufferViews[2].byteOffset = posBuffer.length + normBuffer.length;
  gltf.bufferViews[2].byteLength = uvBuffer.length;
  gltf.bufferViews[3].byteOffset = posBuffer.length + normBuffer.length + uvBuffer.length;
  gltf.bufferViews[3].byteLength = idxBuffer.length;
  
  gltf.buffers[0].byteLength = binaryData.length;
  gltf.buffers[0].uri = 'data:application/octet-stream;base64,' + binaryData.toString('base64');
  
  const jsonStr = JSON.stringify(gltf);
  const jsonBuffer = Buffer.from(jsonStr, 'utf-8');
  
  const glbBuffer = Buffer.alloc(12 + 8 + jsonBuffer.length + 8 + binaryData.length);
  
  glbBuffer.writeUInt32LE(0x46546C67, 0);
  glbBuffer.writeUInt32LE(2, 4);
  glbBuffer.writeUInt32LE(glbBuffer.length, 8);
  
  let offset = 12;
  glbBuffer.writeUInt32LE(jsonBuffer.length, offset);
  glbBuffer.writeUInt32LE(0x4E4F534A, offset + 4);
  jsonBuffer.copy(glbBuffer, offset + 8);
  offset += 8 + jsonBuffer.length;
  
  glbBuffer.writeUInt32LE(binaryData.length, offset);
  glbBuffer.writeUInt32LE(0x004E4942, offset + 4);
  binaryData.copy(glbBuffer, offset + 8);
  
  fs.writeFileSync(outputPath, glbBuffer);
  console.log('Created test model at ' + outputPath);
}

async function main() {
  const inputPath = process.argv[2] || path.join(__dirname, '..', 'models', 'input.glb');
  const outputDir = process.argv[3] || path.join(__dirname, '..', 'models', 'processed-privacy');
  
  const privacyEnabled = process.argv.indexOf('--no-privacy') === -1;
  let blurIntensity = CONFIG.BLUR_INTENSITY;
  const blurArg = process.argv.find(function(arg) { return arg.indexOf('--blur=') === 0; });
  if (blurArg) {
    blurIntensity = parseInt(blurArg.split('=')[1]) || CONFIG.BLUR_INTENSITY;
  }
  
  if (!fs.existsSync(inputPath)) {
    console.log('Creating test model...');
    await createTestModel(inputPath);
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const processor = new ModelProcessor(inputPath, outputDir, {
    enabled: privacyEnabled,
    blurIntensity: blurIntensity
  });
  
  await processor.process();
  
  console.log('');
  console.log('Privacy-protected model saved to: ' + outputDir);
  console.log('To test, update server config to use this directory.');
}

main().catch(console.error);

module.exports = { ModelProcessor, PrivacyProtector };
