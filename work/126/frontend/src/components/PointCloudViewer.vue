<template>
  <div class="viewer-container" ref="viewerRef">
    <div class="viewer-toolbar">
      <el-button-group>
        <el-button @click="resetCamera" :icon="Refresh">重置视角</el-button>
        <el-button @click="toggleWireframe" :icon="Grid">
          {{ showWireframe ? '隐藏网格' : '显示网格' }}
        </el-button>
        <el-button @click="toggleAxes" :icon="Aim">
          {{ showAxes ? '隐藏坐标轴' : '显示坐标轴' }}
        </el-button>
      </el-button-group>
      <div class="toolbar-right">
        <span class="point-count-info" v-if="pointCount > 0">
          {{ formatPointCount(pointCount) }} 点
          <span v-if="isDownsampled" class="downsampled-badge">(抽稀)</span>
        </span>
        <el-select v-model="pointSize" @change="updatePointSize" style="width: 120px">
          <el-option label="小点" :value="1" />
          <el-option label="中点" :value="2" />
          <el-option label="大点" :value="4" />
          <el-option label="超大点" :value="6" />
        </el-select>
      </div>
    </div>
    <div class="viewer-canvas" ref="canvasRef"></div>
    <div class="viewer-info" v-if="hoveredPoint">
      <div class="info-title">点信息</div>
      <div class="info-row">
        <span class="label">坐标:</span>
        <span class="value">{{ formatPoint(hoveredPoint.position) }}</span>
      </div>
      <div class="info-row" v-if="hoveredPoint.normal">
        <span class="label">法线:</span>
        <span class="value">{{ formatPoint(hoveredPoint.normal) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { LASLoader } from 'three/examples/jsm/loaders/LASLoader.js'

const props = defineProps({
  pointCloudUrl: {
    type: String,
    default: null
  },
  pointSize: {
    type: Number,
    default: 2
  },
  bulletHoles: {
    type: Array,
    default: () => []
  },
  trajectoryPoints: {
    type: Array,
    default: () => []
  },
  probabilityCone: {
    type: Object,
    default: null
  },
  shooterPosition: {
    type: Object,
    default: null
  },
  maxPoints: {
    type: Number,
    default: 500000
  },
  adaptivePointSize: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['point-click', 'point-hover'])

const viewerRef = ref(null)
const canvasRef = ref(null)
const hoveredPoint = ref(null)
const pointCount = ref(0)
const isDownsampled = ref(false)
const originalPointCount = ref(0)

let scene = null
let camera = null
let renderer = null
let controls = null
let pointCloud = null
let gridHelper = null
let axesHelper = null
let trajectoryLine = null
let coneMesh = null
let bulletHoleMarkers = []
let shooterMarker = null
let raycaster = null
let mouse = null
let lastCameraDistance = null

const showWireframe = ref(false)
const showAxes = ref(true)

const DOWNSAMPLE_THRESHOLD = props.maxPoints

onMounted(() => {
  initViewer()
  animate()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  if (renderer) {
    renderer.dispose()
  }
})

function initViewer() {
  const container = canvasRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000)
  camera.position.set(10, 10, 10)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222)
  scene.add(gridHelper)

  axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 0.1
  mouse = new THREE.Vector2()

  renderer.domElement.addEventListener('click', onMouseClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  
  if (props.adaptivePointSize && pointCloud) {
    updateAdaptivePointSize()
  }
  
  renderer.render(scene, camera)
}

function updateAdaptivePointSize() {
  if (!pointCloud || !controls) return
  
  const distance = camera.position.distanceTo(controls.target)
  
  if (lastCameraDistance === null) {
    lastCameraDistance = distance
    return
  }
  
  const distanceChange = Math.abs(distance - lastCameraDistance)
  if (distanceChange > distance * 0.1) {
    const baseSize = props.pointSize
    const minSize = Math.max(0.5, baseSize * 0.5)
    const maxSize = Math.min(8, baseSize * 2)
    
    let adaptiveSize
    if (distance < 10) {
      adaptiveSize = maxSize
    } else if (distance > 100) {
      adaptiveSize = minSize
    } else {
      const t = (distance - 10) / 90
      adaptiveSize = maxSize - (maxSize - minSize) * t
    }
    
    if (Math.abs(pointCloud.material.size - adaptiveSize) > 0.1) {
      pointCloud.material.size = adaptiveSize
    }
    
    lastCameraDistance = distance
  }
}

function onWindowResize() {
  if (!canvasRef.value) return
  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

watch(() => props.pointCloudUrl, async (newUrl) => {
  if (newUrl) {
    await loadPointCloud(newUrl)
  }
})

watch(() => props.bulletHoles, (newHoles) => {
  updateBulletHoleMarkers(newHoles)
}, { deep: true })

watch(() => props.trajectoryPoints, (newPoints) => {
  updateTrajectoryLine(newPoints)
}, { deep: true })

watch(() => props.probabilityCone, (newCone) => {
  updateProbabilityCone(newCone)
}, { deep: true })

watch(() => props.shooterPosition, (newPos) => {
  updateShooterMarker(newPos)
}, { deep: true })

watch(() => props.pointSize, (newSize) => {
  updatePointSize(newSize)
})

function downsampleGeometry(geometry, maxPoints) {
  const positions = geometry.attributes.position.array
  const colors = geometry.attributes.color?.array
  const normals = geometry.attributes.normal?.array
  
  const totalPoints = positions.length / 3
  originalPointCount.value = totalPoints
  
  if (totalPoints <= maxPoints) {
    pointCount.value = totalPoints
    isDownsampled.value = false
    return geometry
  }
  
  const ratio = maxPoints / totalPoints
  const step = Math.floor(1 / ratio)
  
  const newPositions = []
  const newColors = []
  const newNormals = []
  
  for (let i = 0; i < totalPoints; i += step) {
    const posIdx = i * 3
    newPositions.push(
      positions[posIdx],
      positions[posIdx + 1],
      positions[posIdx + 2]
    )
    
    if (colors) {
      newColors.push(
        colors[posIdx],
        colors[posIdx + 1],
        colors[posIdx + 2]
      )
    }
    
    if (normals) {
      newNormals.push(
        normals[posIdx],
        normals[posIdx + 1],
        normals[posIdx + 2]
      )
    }
  }
  
  const newGeometry = new THREE.BufferGeometry()
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3))
  
  if (newColors.length > 0) {
    newGeometry.setAttribute('color', new THREE.Float32BufferAttribute(newColors, 3))
  }
  
  if (newNormals.length > 0) {
    newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3))
  }
  
  pointCount.value = newPositions.length / 3
  isDownsampled.value = true
  
  console.log(`Downsampled point cloud: ${totalPoints.toLocaleString()} -> ${pointCount.value.toLocaleString()} points`)
  
  geometry.dispose()
  
  return newGeometry
}

function spatialDownsample(geometry, voxelSize) {
  const positions = geometry.attributes.position.array
  const colors = geometry.attributes.color?.array
  const normals = geometry.attributes.normal?.array
  
  const totalPoints = positions.length / 3
  originalPointCount.value = totalPoints
  
  const grid = new Map()
  
  for (let i = 0; i < totalPoints; i++) {
    const posIdx = i * 3
    const x = positions[posIdx]
    const y = positions[posIdx + 1]
    const z = positions[posIdx + 2]
    
    const gridX = Math.floor(x / voxelSize)
    const gridY = Math.floor(y / voxelSize)
    const gridZ = Math.floor(z / voxelSize)
    const gridKey = `${gridX},${gridY},${gridZ}`
    
    if (!grid.has(gridKey)) {
      grid.set(gridKey, {
        position: [x, y, z],
        color: colors ? [colors[posIdx], colors[posIdx + 1], colors[posIdx + 2]] : null,
        normal: normals ? [normals[posIdx], normals[posIdx + 1], normals[posIdx + 2]] : null,
        count: 1
      })
    } else {
      const existing = grid.get(gridKey)
      existing.position[0] += x
      existing.position[1] += y
      existing.position[2] += z
      if (existing.color) {
        existing.color[0] += colors[posIdx]
        existing.color[1] += colors[posIdx + 1]
        existing.color[2] += colors[posIdx + 2]
      }
      if (existing.normal) {
        existing.normal[0] += normals[posIdx]
        existing.normal[1] += normals[posIdx + 1]
        existing.normal[2] += normals[posIdx + 2]
      }
      existing.count++
    }
  }
  
  const newPositions = []
  const newColors = []
  const newNormals = []
  
  grid.forEach((voxel) => {
    newPositions.push(
      voxel.position[0] / voxel.count,
      voxel.position[1] / voxel.count,
      voxel.position[2] / voxel.count
    )
    
    if (voxel.color) {
      newColors.push(
        voxel.color[0] / voxel.count,
        voxel.color[1] / voxel.count,
        voxel.color[2] / voxel.count
      )
    }
    
    if (voxel.normal) {
      const len = Math.sqrt(
        voxel.normal[0] ** 2 + 
        voxel.normal[1] ** 2 + 
        voxel.normal[2] ** 2
      )
      if (len > 0) {
        newNormals.push(
          voxel.normal[0] / len,
          voxel.normal[1] / len,
          voxel.normal[2] / len
        )
      }
    }
  })
  
  const newGeometry = new THREE.BufferGeometry()
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3))
  
  if (newColors.length > 0) {
    newGeometry.setAttribute('color', new THREE.Float32BufferAttribute(newColors, 3))
  }
  
  if (newNormals.length > 0) {
    newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3))
  }
  
  pointCount.value = newPositions.length / 3
  isDownsampled.value = pointCount.value < totalPoints
  
  console.log(`Spatial downsampling: ${totalPoints.toLocaleString()} -> ${pointCount.value.toLocaleString()} points (voxel: ${voxelSize})`)
  
  geometry.dispose()
  
  return newGeometry
}

async function loadPointCloud(url) {
  if (pointCloud) {
    scene.remove(pointCloud)
    pointCloud.geometry.dispose()
    pointCloud.material.dispose()
    pointCloud = null
  }

  pointCount.value = 0
  isDownsampled.value = false
  lastCameraDistance = null

  try {
    const extension = url.split('?')[0].split('.').pop().toLowerCase()
    let loader

    if (extension === 'ply') {
      loader = new PLYLoader()
    } else if (extension === 'las' || extension === 'laz') {
      loader = new LASLoader()
    } else {
      console.error('Unsupported file format')
      return
    }

    console.log('Loading point cloud:', url)
    const geometry = await loader.loadAsync(url)

    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals()
    }

    if (!geometry.attributes.color) {
      const colors = []
      const positions = geometry.attributes.position.array
      for (let i = 0; i < positions.length; i += 3) {
        colors.push(0.7, 0.7, 0.7)
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    }

    const totalPoints = geometry.attributes.position.count
    originalPointCount.value = totalPoints
    
    let finalGeometry = geometry
    
    if (totalPoints > DOWNSAMPLE_THRESHOLD) {
      console.log(`Point cloud has ${totalPoints.toLocaleString()} points, exceeding threshold of ${DOWNSAMPLE_THRESHOLD.toLocaleString()}`)
      console.log('Downsampling for better performance...')
      
      const ratio = DOWNSAMPLE_THRESHOLD / totalPoints
      if (ratio < 0.5) {
        geometry.computeBoundingBox()
        const size = geometry.boundingBox.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const voxelSize = maxDim / Math.sqrt(DOWNSAMPLE_THRESHOLD) * 0.5
        finalGeometry = spatialDownsample(geometry, voxelSize)
      } else {
        finalGeometry = downsampleGeometry(geometry, DOWNSAMPLE_THRESHOLD)
      }
    } else {
      pointCount.value = totalPoints
      isDownsampled.value = false
    }

    const material = new THREE.PointsMaterial({
      size: props.pointSize,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: false,
      opacity: 1.0
    })

    pointCloud = new THREE.Points(finalGeometry, material)
    scene.add(pointCloud)

    fitCameraToPointCloud(finalGeometry)

  } catch (error) {
    console.error('Error loading point cloud:', error)
  }
}

function fitCameraToPointCloud(geometry) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = camera.fov * (Math.PI / 180)
  const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)))

  camera.position.set(
    center.x + cameraZ * 0.5,
    center.y + cameraZ * 0.5,
    center.z + cameraZ * 0.5
  )
  camera.lookAt(center)

  controls.target.copy(center)
  controls.update()
  
  lastCameraDistance = camera.position.distanceTo(controls.target)
}

function resetCamera() {
  if (pointCloud) {
    fitCameraToPointCloud(pointCloud.geometry)
  }
}

function toggleWireframe() {
  showWireframe.value = !showWireframe.value
  if (gridHelper) {
    gridHelper.visible = showWireframe.value
  }
}

function toggleAxes() {
  showAxes.value = !showAxes.value
  if (axesHelper) {
    axesHelper.visible = showAxes.value
  }
}

function updatePointSize(size) {
  if (pointCloud) {
    pointCloud.material.size = size
  }
}

function updateBulletHoleMarkers(holes) {
  bulletHoleMarkers.forEach(marker => {
    scene.remove(marker)
    marker.geometry.dispose()
    marker.material.dispose()
  })
  bulletHoleMarkers = []

  holes.forEach((hole, index) => {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16)
    const color = hole.is_manual ? 0xff4444 : 0x44ff44
    const material = new THREE.MeshBasicMaterial({ color })
    const sphere = new THREE.Mesh(geometry, material)
    
    sphere.position.set(hole.position.x, hole.position.y, hole.position.z)
    sphere.userData = { hole, index, type: 'bullet-hole' }
    
    scene.add(sphere)
    bulletHoleMarkers.push(sphere)
  })
}

function updateTrajectoryLine(points) {
  if (trajectoryLine) {
    scene.remove(trajectoryLine)
    trajectoryLine.geometry.dispose()
    trajectoryLine.material.dispose()
    trajectoryLine = null
  }

  if (!points || points.length < 2) return

  const positions = []
  points.forEach(p => {
    positions.push(p.position.x, p.position.y, p.position.z)
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0x4488ff,
    linewidth: 2
  })

  trajectoryLine = new THREE.Line(geometry, material)
  scene.add(trajectoryLine)
}

function updateProbabilityCone(cone) {
  if (coneMesh) {
    scene.remove(coneMesh)
    coneMesh.geometry.dispose()
    coneMesh.material.dispose()
    coneMesh = null
  }

  if (!cone) return

  const radius = cone.height * Math.tan(cone.angle)
  const geometry = new THREE.ConeGeometry(radius, cone.height, 32)
  
  const material = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })

  coneMesh = new THREE.Mesh(geometry, material)
  
  coneMesh.position.set(cone.apex.x, cone.apex.y, cone.apex.z)
  
  const direction = new THREE.Vector3(cone.direction.x, cone.direction.y, cone.direction.z).normalize()
  const up = new THREE.Vector3(0, 1, 0)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction)
  coneMesh.quaternion.copy(quaternion)
  
  coneMesh.position.add(direction.multiplyScalar(cone.height / 2))

  scene.add(coneMesh)
}

function updateShooterMarker(position) {
  if (shooterMarker) {
    scene.remove(shooterMarker)
    shooterMarker.geometry.dispose()
    shooterMarker.material.dispose()
    shooterMarker = null
  }

  if (!position) return

  const geometry = new THREE.SphereGeometry(0.3, 16, 16)
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  shooterMarker = new THREE.Mesh(geometry, material)
  shooterMarker.position.set(position.x, position.y, position.z)
  scene.add(shooterMarker)
}

function onMouseClick(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const objects = [pointCloud, ...bulletHoleMarkers].filter(Boolean)
  const intersects = raycaster.intersectObjects(objects, false)

  if (intersects.length > 0) {
    const intersect = intersects[0]
    const point = {
      position: {
        x: intersect.point.x,
        y: intersect.point.y,
        z: intersect.point.z
      }
    }
    emit('point-click', point)
  }
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const objects = [pointCloud, ...bulletHoleMarkers].filter(Boolean)
  const intersects = raycaster.intersectObjects(objects, false)

  if (intersects.length > 0) {
    const intersect = intersects[0]
    hoveredPoint.value = {
      position: intersect.point,
      normal: intersect.face?.normal
    }
    emit('point-hover', hoveredPoint.value)
    renderer.domElement.style.cursor = 'crosshair'
  } else {
    hoveredPoint.value = null
    renderer.domElement.style.cursor = 'grab'
  }
}

function formatPointCount(count) {
  if (!count) return '0'
  return count.toLocaleString()
}

function formatPoint(point) {
  if (!point) return 'N/A'
  return `(${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)})`
}
</script>

<style scoped>
.viewer-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.point-count-info {
  font-size: 12px;
  color: #909399;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
  font-family: monospace;
}

.downsampled-badge {
  color: #e6a23c;
  margin-left: 4px;
}

.viewer-canvas {
  flex: 1;
  position: relative;
}

.viewer-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.viewer-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-size: 12px;
  backdrop-filter: blur(10px);
  min-width: 200px;
}

.info-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #409eff;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.info-row .label {
  color: #aaa;
}

.info-row .value {
  font-family: monospace;
}
</style>
