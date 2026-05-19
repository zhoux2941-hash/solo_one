import * as THREE from 'three'

class AtomGeometryCache {
  constructor() {
    this.cache = new Map()
    this.createGeometries()
  }
  
  createGeometries() {
    const sphereConfigs = [
      { name: 'ultra-low', segments: 4, rings: 4 },
      { name: 'low', segments: 6, rings: 6 },
      { name: 'medium', segments: 12, rings: 12 },
      { name: 'high', segments: 20, rings: 20 }
    ]
    
    sphereConfigs.forEach(({ name, segments, rings }) => {
      const geometry = new THREE.SphereGeometry(1, segments, rings)
      this.cache.set(`sphere-${name}`, geometry)
    })
    
    const cylinderConfigs = [
      { name: 'low', segments: 4 },
      { name: 'medium', segments: 8 },
      { name: 'high', segments: 12 }
    ]
    
    cylinderConfigs.forEach(({ name, segments }) => {
      const geometry = new THREE.CylinderGeometry(1, 1, 1, segments)
      this.cache.set(`cylinder-${name}`, geometry)
    })
  }
  
  getSphere(quality) {
    return this.cache.get(`sphere-${quality}`) || this.cache.get('sphere-medium')
  }
  
  getCylinder(quality) {
    return this.cache.get(`cylinder-${quality}`) || this.cache.get('cylinder-medium')
  }
  
  dispose() {
    this.cache.forEach(geom => geom.dispose())
    this.cache.clear()
  }
}

const geometryCache = new AtomGeometryCache()

class MoleculeRenderer {
  constructor(scene, camera, data, options = {}) {
    this.scene = scene
    this.camera = camera
    this.data = data
    this.options = {
      mode: 'ball-stick',
      atomScale: 1,
      showBackbone: true,
      enableLOD: true,
      bondRadius: 0.15,
      onProgress: null,
      color: null,
      ...options
    }
    
    this.group = new THREE.Group()
    this.atomGroup = new THREE.Group()
    this.bondGroup = new THREE.Group()
    this.backboneGroup = new THREE.Group()
    
    this.group.add(this.atomGroup)
    this.group.add(this.bondGroup)
    this.group.add(this.backboneGroup)
    this.scene.add(this.group)
    
    this.currentLOD = 0
    this.atomMesh = null
    this.bondMesh = null
    this.backboneMesh = null
    this.isLoading = false
    this.isAnimating = false
    this.animationFrame = 0
    this.trajectory = null
    this.originalAtoms = null
    
    this.boundingBox = this.calculateBoundingBox()
    this.center = new THREE.Vector3()
    this.boundingBox.getCenter(this.center)
    
    this.renderPromise = this.renderAsync()
  }
  
  waitForLoad() {
    return this.renderPromise
  }
  
  calculateBoundingBox() {
    const box = new THREE.Box3()
    const atoms = this.data.atoms
    
    if (atoms.length > 0) {
      const coord = atoms[0].coord
      box.min.set(coord[0], coord[1], coord[2])
      box.max.set(coord[0], coord[1], coord[2])
      
      const step = Math.max(1, Math.floor(atoms.length / 1000))
      for (let i = 1; i < atoms.length; i += step) {
        const coord = atoms[i].coord
        box.min.x = Math.min(box.min.x, coord[0])
        box.min.y = Math.min(box.min.y, coord[1])
        box.min.z = Math.min(box.min.z, coord[2])
        box.max.x = Math.max(box.max.x, coord[0])
        box.max.y = Math.max(box.max.y, coord[1])
        box.max.z = Math.max(box.max.z, coord[2])
      }
    }
    
    return box
  }
  
  getLODInfo() {
    const distance = this.camera.position.distanceTo(this.center)
    const numAtoms = this.data.num_atoms || 0
    
    let quality, atomStep, bondStep
    let backboneQuality = true
    
    if (numAtoms > 150000) {
      if (distance > 300) {
        quality = 'ultra-low'; atomStep = 32; bondStep = 64; backboneQuality = false
      } else if (distance > 200) {
        quality = 'low'; atomStep = 16; bondStep = 32; backboneQuality = false
      } else if (distance > 120) {
        quality = 'low'; atomStep = 8; bondStep = 16
      } else if (distance > 60) {
        quality = 'medium'; atomStep = 4; bondStep = 8
      } else {
        quality = 'medium'; atomStep = 2; bondStep = 4
      }
    } else if (numAtoms > 50000) {
      if (distance > 250) {
        quality = 'low'; atomStep = 16; bondStep = 32
      } else if (distance > 150) {
        quality = 'low'; atomStep = 8; bondStep = 16
      } else if (distance > 80) {
        quality = 'medium'; atomStep = 4; bondStep = 8
      } else if (distance > 40) {
        quality = 'medium'; atomStep = 2; bondStep = 4
      } else {
        quality = 'high'; atomStep = 1; bondStep = 2
      }
    } else if (numAtoms > 10000) {
      if (distance > 200) {
        quality = 'low'; atomStep = 8; bondStep = 16
      } else if (distance > 100) {
        quality = 'medium'; atomStep = 4; bondStep = 8
      } else if (distance > 50) {
        quality = 'medium'; atomStep = 2; bondStep = 4
      } else {
        quality = 'high'; atomStep = 1; bondStep = 2
      }
    } else if (numAtoms > 1000) {
      if (distance > 150) {
        quality = 'medium'; atomStep = 4; bondStep = 8
      } else if (distance > 70) {
        quality = 'medium'; atomStep = 2; bondStep = 4
      } else {
        quality = 'high'; atomStep = 1; bondStep = 1
      }
    } else {
      quality = 'high'; atomStep = 1; bondStep = 1
    }
    
    if (!this.options.enableLOD) {
      quality = numAtoms > 10000 ? 'medium' : 'high'
      atomStep = 1
      bondStep = 1
    }
    
    return { quality, atomStep, bondStep, backboneQuality }
  }
  
  async renderAsync() {
    this.clear()
    this.isLoading = true
    
    const lodInfo = this.getLODInfo()
    
    if (this.options.onProgress) {
      this.options.onProgress(0.1, '准备原子数据...')
    }
    
    await this.renderAtomsAsync(lodInfo)
    
    if (this.options.onProgress) {
      this.options.onProgress(0.6, '准备化学键数据...')
    }
    
    await this.renderBondsAsync(lodInfo)
    
    if (this.options.onProgress) {
      this.options.onProgress(0.85, '准备主链带状图...')
    }
    
    await this.renderBackboneAsync(lodInfo)
    
    if (this.options.onProgress) {
      this.options.onProgress(1.0, '加载完成！')
    }
    
    this.isLoading = false
  }
  
  async renderAtomsAsync(lodInfo) {
    const atoms = this.data.atoms
    const { quality, atomStep } = lodInfo
    
    const effectiveCount = Math.ceil(atoms.length / atomStep)
    if (effectiveCount === 0) return
    
    const geometry = geometryCache.getSphere(quality)
    
    const matrices = new Float32Array(effectiveCount * 16)
    const colors = new Float32Array(effectiveCount * 3)
    
    const matrix = new THREE.Matrix4()
    const colorVec = new THREE.Color()
    
    const chunkSize = 5000
    const totalChunks = Math.ceil(effectiveCount / chunkSize)
    
    let idx = 0
    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const startIdx = chunk * chunkSize
      const endIdx = Math.min(startIdx + chunkSize, effectiveCount)
      
      for (let i = startIdx; i < endIdx; i++) {
        const atomIdx = i * atomStep
        const atom = atoms[atomIdx]
        const radius = atom.radius * this.options.atomScale * (this.options.mode === 'space-filling' ? 2.5 : 1)
        
        matrix.makeScale(radius, radius, radius)
        matrix.setPosition(atom.coord[0], atom.coord[1], atom.coord[2])
        matrix.toArray(matrices, i * 16)
        
        if (this.options.color) {
          colorVec.set(this.options.color)
        } else {
          colorVec.setHex(atom.color)
        }
        colors[i * 3] = colorVec.r
        colors[i * 3 + 1] = colorVec.g
        colors[i * 3 + 2] = colorVec.b
      }
      
      if (chunk < totalChunks - 1) {
        if (this.options.onProgress) {
          const progress = 0.1 + (chunk / totalChunks) * 0.5
          this.options.onProgress(progress, `处理原子 ${(chunk + 1) * chunkSize}/${effectiveCount}...`)
        }
        await this.sleep(1)
      }
    }
    
    const instancedGeometry = new THREE.InstancedBufferGeometry()
    instancedGeometry.index = geometry.index
    instancedGeometry.attributes.position = geometry.attributes.position
    instancedGeometry.setAttribute('instanceMatrix', new THREE.InstancedBufferAttribute(matrices, 16, false))
    instancedGeometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3, false))
    
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.1,
      roughness: 0.5,
      vertexColors: true,
      transparent: this.options.color !== null,
      opacity: this.options.color ? 0.9 : 1
    })
    
    this.atomMesh = new THREE.Mesh(instancedGeometry, material)
    this.atomMesh.frustumCulled = false
    this.atomMesh.castShadow = effectiveCount < 50000
    this.atomMesh.receiveShadow = effectiveCount < 50000
    
    this.atomGroup.add(this.atomMesh)
  }
  
  async renderBondsAsync(lodInfo) {
    if (this.options.mode !== 'ball-stick') return
    
    const bonds = this.data.bonds
    const atoms = this.data.atoms
    const { quality, bondStep } = lodInfo
    
    const effectiveCount = Math.ceil(bonds.length / bondStep)
    if (effectiveCount === 0) return
    
    const geometry = geometryCache.getCylinder(quality)
    
    const matrices = new Float32Array(effectiveCount * 16)
    
    const matrix = new THREE.Matrix4()
    const direction = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion()
    
    const chunkSize = 3000
    const totalChunks = Math.ceil(effectiveCount / chunkSize)
    
    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const startIdx = chunk * chunkSize
      const endIdx = Math.min(startIdx + chunkSize, effectiveCount)
      
      for (let i = startIdx; i < endIdx; i++) {
        const bondIdx = i * bondStep
        const bond = bonds[bondIdx]
        
        if (bond.from >= atoms.length || bond.to >= atoms.length) continue
        
        const fromAtom = atoms[bond.from]
        const toAtom = atoms[bond.to]
        
        const fromX = fromAtom.coord[0], fromY = fromAtom.coord[1], fromZ = fromAtom.coord[2]
        const toX = toAtom.coord[0], toY = toAtom.coord[1], toZ = toAtom.coord[2]
        
        direction.set(toX - fromX, toY - fromY, toZ - fromZ)
        const length = direction.length()
        const centerX = (fromX + toX) / 2
        const centerY = (fromY + toY) / 2
        const centerZ = (fromZ + toZ) / 2
        
        quaternion.setFromUnitVectors(up, direction.clone().normalize())
        
        matrix.makeRotationFromQuaternion(quaternion)
        const scale = this.options.bondRadius * this.options.atomScale
        matrix.scale(new THREE.Vector3(scale, length / 2, scale))
        matrix.setPosition(centerX, centerY, centerZ)
        matrix.toArray(matrices, i * 16)
      }
      
      if (chunk < totalChunks - 1) {
        if (this.options.onProgress) {
          const progress = 0.6 + (chunk / totalChunks) * 0.25
          this.options.onProgress(progress, `处理化学键 ${(chunk + 1) * chunkSize}/${effectiveCount}...`)
        }
        await this.sleep(1)
      }
    }
    
    const instancedGeometry = new THREE.InstancedBufferGeometry()
    instancedGeometry.index = geometry.index
    instancedGeometry.attributes.position = geometry.attributes.position
    instancedGeometry.setAttribute('instanceMatrix', new THREE.InstancedBufferAttribute(matrices, 16, false))
    
    const material = new THREE.MeshStandardMaterial({
      color: this.options.color || 0x888888,
      metalness: 0.3,
      roughness: 0.4
    })
    
    this.bondMesh = new THREE.Mesh(instancedGeometry, material)
    this.bondMesh.frustumCulled = false
    this.bondMesh.castShadow = effectiveCount < 20000
    this.bondMesh.receiveShadow = effectiveCount < 20000
    
    this.bondGroup.add(this.bondMesh)
  }
  
  async renderBackboneAsync(lodInfo) {
    if (!this.options.showBackbone || !this.data.backbone || this.data.backbone.length < 3) return
    
    const backbone = this.data.backbone
    const { backboneQuality } = lodInfo
    
    const step = backboneQuality ? 1 : Math.max(1, Math.floor(backbone.length / 500))
    const tubeRadius = 0.4 * this.options.atomScale
    const tubularSegments = backboneQuality ? 8 : 4
    const radialSegments = backboneQuality ? 8 : 4
    
    const points = []
    const colors = []
    
    for (let i = 0; i < backbone.length; i += step) {
      const b = backbone[i]
      points.push(new THREE.Vector3(b.coord[0], b.coord[1], b.coord[2]))
      colors.push(this.options.color || b.color)
    }
    
    if (points.length < 2) return
    
    const curve = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.TubeGeometry(curve, Math.max(points.length * tubularSegments / 8, points.length), tubeRadius, radialSegments, false)
    
    const colorAttribute = new Float32Array(geometry.attributes.position.count * 3)
    const colorVec = new THREE.Color()
    
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const pointIdx = Math.floor(i / radialSegments / tubularSegments * (points.length - 1))
      colorVec.setHex(colors[Math.min(pointIdx, colors.length - 1)])
      colorAttribute[i * 3] = colorVec.r
      colorAttribute[i * 3 + 1] = colorVec.g
      colorAttribute[i * 3 + 2] = colorVec.b
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colorAttribute, 3))
    
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide,
      vertexColors: true
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    mesh.castShadow = backboneQuality
    mesh.receiveShadow = backboneQuality
    
    this.backboneGroup.add(mesh)
    this.backboneMesh = mesh
    
    await this.sleep(1)
  }
  
  setTrajectory(trajectory) {
    this.trajectory = trajectory
    this.originalAtoms = JSON.parse(JSON.stringify(this.data.atoms))
    this.animationFrame = 0
  }
  
  playAnimation() {
    if (!this.trajectory || this.trajectory.length === 0) return
    this.isAnimating = true
  }
  
  pauseAnimation() {
    this.isAnimating = false
  }
  
  resetAnimation() {
    this.isAnimating = false
    this.animationFrame = 0
    if (this.originalAtoms) {
      this.data.atoms = JSON.parse(JSON.stringify(this.originalAtoms))
      this.renderAsync()
    }
  }
  
  updateAnimation() {
    if (!this.isAnimating || !this.trajectory) return false
    
    this.animationFrame = (this.animationFrame + 1) % this.trajectory.length
    
    const frameAtoms = this.trajectory[this.animationFrame]
    
    if (this.atomMesh) {
      const matrixAttr = this.atomMesh.geometry.getAttribute('instanceMatrix')
      const matrix = new THREE.Matrix4()
      
      for (let i = 0; i < Math.min(frameAtoms.length, matrixAttr.count); i++) {
        const atom = frameAtoms[i]
        const radius = atom.radius * this.options.atomScale * (this.options.mode === 'space-filling' ? 2.5 : 1)
        
        matrix.makeScale(radius, radius, radius)
        matrix.setPosition(atom.coord[0], atom.coord[1], atom.coord[2])
        
        const array = matrixAttr.array
        const offset = i * 16
        matrix.toArray(array, offset)
      }
      
      matrixAttr.needsUpdate = true
    }
    
    return true
  }
  
  clear() {
    while (this.atomGroup.children.length > 0) {
      const child = this.atomGroup.children[0]
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
      this.atomGroup.remove(child)
    }
    
    while (this.bondGroup.children.length > 0) {
      const child = this.bondGroup.children[0]
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
      this.bondGroup.remove(child)
    }
    
    while (this.backboneGroup.children.length > 0) {
      const child = this.backboneGroup.children[0]
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
      this.backboneGroup.remove(child)
    }
    
    this.atomMesh = null
    this.bondMesh = null
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  updateLOD() {
    if (!this.options.enableLOD || this.isLoading) return false
    
    const lodInfo = this.getLODInfo()
    const newLOD = lodInfo.atomStep
    
    if (newLOD !== this.currentLOD) {
      const dist = this.camera.position.distanceTo(this.lastCameraPosition || new THREE.Vector3())
      if (dist < 5) return false
      
      this.currentLOD = newLOD
      this.lastCameraPosition = this.camera.position.clone()
      this.renderAsync()
      return true
    }
    
    return false
  }
  
  update(newOptions = {}) {
    this.options = { ...this.options, ...newOptions }
    this.renderAsync()
  }
  
  dispose() {
    this.isAnimating = false
    this.clear()
    this.scene.remove(this.group)
  }
}

export default MoleculeRenderer
