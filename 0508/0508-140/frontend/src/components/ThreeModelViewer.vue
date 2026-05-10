<template>
  <div class="model-viewer-container">
    <div class="viewer-header">
      <h3>3D 预览</h3>
      <div class="viewer-tools">
        <el-button size="small" @click="resetCamera">重置视角</el-button>
        <el-button size="small" @click="toggleWireframe">
          {{ isWireframe ? '实体' : '线框' }}
        </el-button>
      </div>
    </div>
    <div class="viewer-wrapper" ref="viewerWrapper">
      <canvas ref="threeCanvas"></canvas>
      <div class="viewer-info">
        <span>旋转面数: {{ rotationSegments }}</span>
        <span>平滑度: {{ (smoothness * 100).toFixed(0) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { usePotteryStore } from '@/store/pottery'
import { storeToRefs } from 'pinia'
import { processProfile } from '@/utils/profileUtils'

const viewerWrapper = ref(null)
const threeCanvas = ref(null)

const potteryStore = usePotteryStore()
const { profilePoints, compareProfilePoints, compareMode, rotationSegments, smoothness, glazeType } = storeToRefs(potteryStore)

let scene, camera, renderer, controls
let potteryMesh = null
let compareMesh = null
let isWireframe = ref(false)
let animationId = null

const processedProfile = computed(() => processProfile(profilePoints.value))
const processedCompareProfile = computed(() => processProfile(compareProfilePoints.value))

const glazeConfigs = {
  celadon: {
    name: '青釉',
    baseColor: 0x8FBC8F,
    emissive: 0x0A1A0A,
    specular: 0x334433,
    shininess: 80,
    reflectivity: 0.4,
    clearcoat: 0.3,
    roughness: 0.3,
    metalness: 0.1
  },
  black: {
    name: '黑釉',
    baseColor: 0x1A1A1A,
    emissive: 0x050505,
    specular: 0x333333,
    shininess: 120,
    reflectivity: 0.6,
    clearcoat: 0.5,
    roughness: 0.15,
    metalness: 0.1
  },
  white: {
    name: '白釉',
    baseColor: 0xF0F0F0,
    emissive: 0x101010,
    specular: 0xAAAAAA,
    shininess: 90,
    reflectivity: 0.5,
    clearcoat: 0.4,
    roughness: 0.25,
    metalness: 0.05
  },
  red: {
    name: '红釉',
    baseColor: 0xB22222,
    emissive: 0x1A0505,
    specular: 0x442222,
    shininess: 100,
    reflectivity: 0.55,
    clearcoat: 0.45,
    roughness: 0.2,
    metalness: 0.15
  },
  blue: {
    name: '蓝釉',
    baseColor: 0x2E86AB,
    emissive: 0x050A1A,
    specular: 0x224466,
    shininess: 85,
    reflectivity: 0.45,
    clearcoat: 0.35,
    roughness: 0.28,
    metalness: 0.1
  },
  yellow: {
    name: '黄釉',
    baseColor: 0xDAA520,
    emissive: 0x1A1505,
    specular: 0x444422,
    shininess: 95,
    reflectivity: 0.5,
    clearcoat: 0.4,
    roughness: 0.22,
    metalness: 0.12
  }
}

const getGlazeConfig = (type) => {
  return glazeConfigs[type] || glazeConfigs.celadon
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', onWindowResize)
  
  if (renderer) {
    renderer.dispose()
  }
  
  if (controls) {
    controls.dispose()
  }
})

watch([profilePoints, compareProfilePoints, rotationSegments, smoothness, glazeType], () => {
  updateModel()
}, { deep: true })

const initThree = () => {
  if (!viewerWrapper.value || !threeCanvas.value) return
  
  const width = viewerWrapper.value.clientWidth
  const height = viewerWrapper.value.clientHeight
  
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f5f5)
  
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(150, 100, 200)
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: threeCanvas.value,
    antialias: true 
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  
  addLights()
  addGrid()
  addCenterAxis()
  
  updateModel()
  animate()
}

const addLights = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)
  
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6)
  scene.add(hemiLight)
  
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.0)
  mainLight.position.set(100, 200, 100)
  mainLight.castShadow = true
  mainLight.shadow.mapSize.width = 2048
  mainLight.shadow.mapSize.height = 2048
  scene.add(mainLight)
  
  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
  fillLight.position.set(-100, 100, 100)
  scene.add(fillLight)
  
  const rimLight = new THREE.DirectionalLight(0xffaa88, 0.4)
  rimLight.position.set(100, 50, -150)
  scene.add(rimLight)
}

const addGrid = () => {
  const gridHelper = new THREE.GridHelper(400, 40, 0xcccccc, 0xe0e0e0)
  scene.add(gridHelper)
}

const addCenterAxis = () => {
  const axisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 300, 0)
  ])
  const axisMaterial = new THREE.LineBasicMaterial({ 
    color: 0xff6b6b, 
    dashed: true,
    dashSize: 5,
    gapSize: 5
  })
  const axisLine = new THREE.Line(axisGeometry, axisMaterial)
  axisLine.computeLineDistances()
  scene.add(axisLine)
}

const smoothPoints = (points) => {
  if (points.length < 3) return points
  
  const factor = smoothness.value
  const result = []
  
  for (let i = 0; i < points.length; i++) {
    if (i === 0 || i === points.length - 1) {
      result.push(new THREE.Vector2(points[i].x, points[i].y))
      continue
    }
    
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    
    const newX = prev.x * factor + curr.x * (1 - factor * 2) + next.x * factor
    const newY = prev.y * factor + curr.y * (1 - factor * 2) + next.y * factor
    
    result.push(new THREE.Vector2(newX, newY))
  }
  
  return result
}

const createGlazeMaterial = (glazeType, opacity = 1) => {
  const config = getGlazeConfig(glazeType)
  
  return new THREE.MeshPhysicalMaterial({
    color: config.baseColor,
    metalness: config.metalness,
    roughness: config.roughness,
    clearcoat: config.clearcoat,
    clearcoatRoughness: 0.1,
    reflectivity: config.reflectivity,
    emissive: config.emissive,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    opacity: opacity,
    wireframe: isWireframe.value,
    sheen: 0.3,
    sheenColor: new THREE.Color(config.specular),
    sheenRoughness: 0.4
  })
}

const createPotteryMesh = (processed, glazeType, opacity = 1, isCompare = false) => {
  if (!processed || processed.sanitized.length < 2) return null
  
  const smoothedPoints = smoothPoints(processed.sanitized)
  
  const shape = new THREE.Shape(smoothedPoints)
  
  const extrudeSettings = {
    steps: 1,
    depth: 0.1,
    bevelEnabled: false
  }
  
  const geometry = new THREE.LatheGeometry(smoothedPoints, rotationSegments.value)
  
  geometry.rotateX(Math.PI / 2)
  
  const material = createGlazeMaterial(glazeType, opacity)
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  
  if (isCompare) {
    mesh.position.x = 50
  }
  
  return mesh
}

const updateModel = () => {
  if (!scene) return
  
  if (potteryMesh) {
    scene.remove(potteryMesh)
    potteryMesh.geometry.dispose()
    potteryMesh.material.dispose()
    potteryMesh = null
  }
  
  if (compareMesh) {
    scene.remove(compareMesh)
    compareMesh.geometry.dispose()
    compareMesh.material.dispose()
    compareMesh = null
  }
  
  if (processedProfile.value.sanitized.length > 1) {
    potteryMesh = createPotteryMesh(processedProfile.value, glazeType.value, 1, false)
    if (potteryMesh) {
      scene.add(potteryMesh)
    }
  }
  
  if (compareMode.value && processedCompareProfile.value.sanitized.length > 1) {
    compareMesh = createPotteryMesh(processedCompareProfile.value, glazeType.value, 0.6, true)
    if (compareMesh) {
      scene.add(compareMesh)
    }
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  if (controls) {
    controls.update()
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const onWindowResize = () => {
  if (!viewerWrapper.value || !camera || !renderer) return
  
  const width = viewerWrapper.value.clientWidth
  const height = viewerWrapper.value.clientHeight
  
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const resetCamera = () => {
  if (!camera || !controls) return
  
  camera.position.set(150, 100, 200)
  controls.target.set(0, 100, 0)
  controls.update()
}

const toggleWireframe = () => {
  isWireframe.value = !isWireframe.value
  
  if (potteryMesh) {
    potteryMesh.material.wireframe = isWireframe.value
  }
  
  if (compareMesh) {
    compareMesh.material.wireframe = isWireframe.value
  }
}
</script>

<style scoped>
.model-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.viewer-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.viewer-tools {
  display: flex;
  gap: 10px;
}

.viewer-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
}

.viewer-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
