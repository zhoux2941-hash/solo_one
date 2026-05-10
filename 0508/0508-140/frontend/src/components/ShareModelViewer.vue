<template>
  <div class="share-viewer" ref="viewerWrapper">
    <canvas ref="threeCanvas"></canvas>
    <div class="viewer-tools">
      <el-button size="small" @click="resetCamera">重置视角</el-button>
      <el-button size="small" @click="toggleWireframe">
        {{ isWireframe ? '实体' : '线框' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  points: {
    type: Array,
    default: () => []
  }
})

const viewerWrapper = ref(null)
const threeCanvas = ref(null)

let scene, camera, renderer, controls
let potteryMesh = null
let isWireframe = ref(false)
let animationId = null

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

watch(() => props.points, () => {
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
  controls.target.set(0, 100, 0)
  controls.update()
  
  addLights()
  addGrid()
  
  updateModel()
  animate()
}

const addLights = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight1.position.set(100, 200, 100)
  directionalLight1.castShadow = true
  scene.add(directionalLight1)
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight2.position.set(-100, 100, -100)
  scene.add(directionalLight2)
}

const addGrid = () => {
  const gridHelper = new THREE.GridHelper(400, 40, 0xcccccc, 0xe0e0e0)
  scene.add(gridHelper)
}

const createPotteryMesh = (points) => {
  if (points.length < 2) return null
  
  const vectorPoints = points.map(p => new THREE.Vector2(p.x, p.y))
  
  const geometry = new THREE.LatheGeometry(vectorPoints, 64)
  geometry.rotateX(Math.PI / 2)
  
  const material = new THREE.MeshPhongMaterial({
    color: 0xd4a373,
    side: THREE.DoubleSide,
    shininess: 100,
    specular: 0x111111,
    wireframe: isWireframe.value
  })
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  
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
  
  if (props.points.length > 1) {
    potteryMesh = createPotteryMesh(props.points)
    if (potteryMesh) {
      scene.add(potteryMesh)
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
}
</script>

<style scoped>
.share-viewer {
  width: 100%;
  height: 100%;
  position: relative;
}

canvas {
  width: 100%;
  height: 100%;
}

.viewer-tools {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
}
</style>
