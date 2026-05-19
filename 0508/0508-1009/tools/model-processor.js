import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  LOD_LEVELS: 4,
  CHUNK_SIZE: 64 * 1024,
  TEXTURE_TILE_SIZE: 256,
  VERTEX_CHUNK_SIZE: 1000,
  INDEX_CHUNK_SIZE: 3000
};

class ModelProcessor {
  constructor(inputPath, outputDir) {
    this.inputPath = inputPath;
    this.outputDir = outputDir;
    this.modelData = null;
    this.chunks = new Map();
    this.metadata = {
      modelId: path.basename(inputPath, path.extname(inputPath)),
      lodLevels: CONFIG.LOD_LEVELS,
      totalChunks: 0,
      totalSize: 0,
      chunks: {},
      bounds: null,
      textures: [],
      geometries: []
    };
  }

  async process() {
    console.log(`Processing model: ${this.inputPath}`);
    
    this.modelData = await this.loadModel();
    const bounds = this.calculateBounds();
    this.metadata.bounds = bounds;
    
    for (let lod = 0; lod < CONFIG.LOD_LEVELS; lod++) {
      console.log(`Generating LOD level ${lod}...`);
      await this.generateLOD(lod);
    }
    
    await this.saveChunks();
    await this.saveMetadata();
    
    console.log('Model processing complete!');
    console.log(`Total chunks: ${this.metadata.totalChunks}`);
    console.log(`Total size: ${(this.metadata.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
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
    const dataView = new DataView(buffer);
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
        jsonChunk = JSON.parse(new TextDecoder().decode(jsonData));
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
    
    return { min, max, center, size };
  }

  async generateLOD(lodLevel) {
    const meshes = this.modelData.json.meshes || [];
    const buffers = this.modelData.buffers || [];
    
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
    
    const { simplifiedPositions, simplifiedNormals, simplifiedUVs, simplifiedIndices } = 
      this.simplifyMesh(positions, normals, uvs, indices, reductionFactor);
    
    const geometryId = `g${meshIdx}_p${primIdx}_l${lodLevel}`;
    this.chunkGeometry(geometryId, simplifiedPositions, simplifiedNormals, simplifiedUVs, simplifiedIndices, lodLevel);
    
    if (primitive.material != null && lodLevel === 0) {
      const material = this.modelData.json.materials[primitive.material];
      if (material.pbrMetallicRoughness?.baseColorTexture) {
        await this.processTexture(material.pbrMetallicRoughness.baseColorTexture.index, lodLevel);
      }
    }
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
      return { simplifiedPositions: positions, simplifiedNormals: normals, simplifiedUVs: uvs, simplifiedIndices: indices };
    }
    
    const targetVertexCount = Math.max(100, Math.floor(positions.length / 3 * factor));
    const targetIndexCount = targetVertexCount * 3;
    
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
          const key = `${idx}`;
          
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
      
      const vertexData = this.serializeVertexChunk(posChunk, normChunk, uvChunk, vStart);
      const chunkId = `${geometryId}_v${vStart}`;
      
      this.addChunk(chunkId, vertexData, {
        type: 'vertices',
        geometryId,
        lodLevel,
        startVertex: vStart,
        vertexCount: vCount
      });
      
      vertexChunks.push(chunkId);
    }
    
    for (let iStart = 0; iStart < indices.length; iStart += CONFIG.INDEX_CHUNK_SIZE) {
      const iEnd = Math.min(iStart + CONFIG.INDEX_CHUNK_SIZE, indices.length);
      const idxChunk = indices.slice(iStart, iEnd);
      
      const indexData = this.serializeIndexChunk(idxChunk, iStart);
      const chunkId = `${geometryId}_i${iStart}`;
      
      this.addChunk(chunkId, indexData, {
        type: 'indices',
        geometryId,
        lodLevel,
        startIndex: iStart,
        indexCount: idxChunk.length
      });
      
      indexChunks.push(chunkId);
    }
    
    this.metadata.geometries.push({
      id: geometryId,
      lodLevel,
      vertexChunks,
      indexChunks,
      vertexCount: positions.length / 3,
      indexCount: indices.length
    });
  }

  serializeVertexChunk(positions, normals, uvs, baseIndex) {
    const buffers = [];
    
    const posBuffer = Buffer.from(positions.buffer);
    buffers.push(posBuffer);
    
    if (normals) {
      buffers.push(Buffer.from(normals.buffer));
    }
    
    if (uvs) {
      buffers.push(Buffer.from(uvs.buffer));
    }
    
    return Buffer.concat(buffers);
  }

  serializeIndexChunk(indices, baseIndex) {
    return Buffer.from(indices.buffer);
  }

  async processTexture(textureIndex, lodLevel) {
    const texture = this.modelData.json.textures[textureIndex];
    const image = this.modelData.json.images[texture.source];
    
    let imageData;
    if (image.uri) {
      const imagePath = path.resolve(path.dirname(this.inputPath), image.uri);
      imageData = fs.readFileSync(imagePath);
    } else if (image.bufferView != null) {
      const bufferView = this.modelData.json.bufferViews[image.bufferView];
      imageData = this.modelData.binary.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);
    }
    
    const textureId = `t${textureIndex}_l${lodLevel}`;
    const mipmaps = this.generateTextureMipmaps(imageData, lodLevel);
    
    for (let mip = 0; mip < mipmaps.length; mip++) {
      const mipData = mipmaps[mip];
      const tiles = this.tileTexture(mipData, mip);
      
      for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
        const chunkId = `${textureId}_m${mip}_t${tileIdx}`;
        this.addChunk(chunkId, tiles[tileIdx].data, {
          type: 'texture',
          textureId,
          lodLevel,
          mipLevel: mip,
          tileIndex: tileIdx,
          tileX: tiles[tileIdx].x,
          tileY: tiles[tileIdx].y,
          width: tiles[tileIdx].width,
          height: tiles[tileIdx].height
        });
      }
    }
    
    this.metadata.textures.push({
      id: textureId,
      lodLevel,
      mipmapCount: mipmaps.length,
      tilesPerMip: mipmaps.map((_, i) => Math.ceil(Math.max(1, 256 / Math.pow(2, i)) / CONFIG.TEXTURE_TILE_SIZE) ** 2)
    });
  }

  generateTextureMipmaps(imageData, baseLod) {
    const mipmaps = [imageData];
    
    try {
      const sharp = (await import('sharp')).default;
      let current = sharp(imageData);
      let metadata = await current.metadata();
      
      for (let i = 1; i < 4; i++) {
        const newWidth = Math.max(1, Math.floor(metadata.width / Math.pow(2, i)));
        const newHeight = Math.max(1, Math.floor(metadata.height / Math.pow(2, i)));
        
        if (newWidth < 16 || newHeight < 16) break;
        
        const resized = await current.clone().resize(newWidth, newHeight).toBuffer();
        mipmaps.push(resized);
      }
    } catch (e) {
      console.log('Sharp not available, using single mip level');
    }
    
    return mipmaps;
  }

  tileTexture(imageData, mipLevel) {
    const tiles = [];
    
    try {
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(imageData).metadata();
      
      const tileSize = Math.min(CONFIG.TEXTURE_TILE_SIZE, metadata.width, metadata.height);
      const cols = Math.ceil(metadata.width / tileSize);
      const rows = Math.ceil(metadata.height / tileSize);
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const tileData = await sharp(imageData)
            .extract({
              left: x * tileSize,
              top: y * tileSize,
              width: Math.min(tileSize, metadata.width - x * tileSize),
              height: Math.min(tileSize, metadata.height - y * tileSize)
            })
            .toBuffer();
          
          tiles.push({
            x: x * tileSize,
            y: y * tileSize,
            width: Math.min(tileSize, metadata.width - x * tileSize),
            height: Math.min(tileSize, metadata.height - y * tileSize),
            data: tileData
          });
        }
      }
    } catch (e) {
      tiles.push({ x: 0, y: 0, width: 256, height: 256, data: imageData });
    }
    
    return tiles;
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
      fs.writeFileSync(path.join(chunksDir, `${chunkId}.bin`), chunk.data);
    }
  }

  async saveMetadata() {
    fs.writeFileSync(
      path.join(this.outputDir, 'metadata.json'),
      JSON.stringify(this.metadata, null, 2)
    );
  }
}

async function main() {
  const inputPath = process.argv[2] || path.join(__dirname, '..', 'models', 'input.glb');
  const outputDir = process.argv[3] || path.join(__dirname, '..', 'models', 'processed');
  
  if (!fs.existsSync(inputPath)) {
    console.log('Creating test model...');
    await createTestModel(inputPath);
  }
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const processor = new ModelProcessor(inputPath, outputDir);
  await processor.process();
}

async function createTestModel(outputPath) {
  const fs = await import('fs');
  const path = await import('path');
  
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
  console.log(`Created test model at ${outputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ModelProcessor;
