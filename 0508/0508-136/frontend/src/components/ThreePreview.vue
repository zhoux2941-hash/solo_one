<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  params: {
    type: Object,
    required: true
  },
  result: {
    type: Object,
    default: null
  },
  stressResult: {
    type: Object,
    default: null
  },
  showStress: {
    type: Boolean,
    default: false
  }
})

const containerRef = ref(null)
let scene, camera, renderer, controls
let woodGroup, stressGroup, animationId
let originalMaterials = new Map()

onMounted(() => {
  initScene()
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (controls) {
    controls.dispose()
  }
  if (renderer) {
    renderer.dispose()
  }
})

watch(() => [props.params, props.result, props.stressResult, props.showStress], () => {
  updateScene()
}, { deep: true })

function initScene() {
  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f2f5)

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
  camera.position.set(400, 300, 400)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 50
  controls.maxDistance = 2000

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(200, 400, 200)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  const pointLight1 = new THREE.PointLight(0xffffff, 0.4)
  pointLight1.position.set(-200, 200, -200)
  scene.add(pointLight1)

  const pointLight2 = new THREE.PointLight(0xffffff, 0.4)
  pointLight2.position.set(200, 200, 200)
  scene.add(pointLight2)

  const gridHelper = new THREE.GridHelper(1000, 20, 0xcccccc, 0xe5e5e5)
  gridHelper.position.y = -50
  scene.add(gridHelper)

  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)

  woodGroup = new THREE.Group()
  scene.add(woodGroup)
  
  stressGroup = new THREE.Group()
  scene.add(stressGroup)

  updateScene()

  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  if (!containerRef.value || !camera || !renderer) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function updateScene() {
  if (!woodGroup || !stressGroup) return

  while (woodGroup.children.length > 0) {
    const child = woodGroup.children[0]
    woodGroup.remove(child)
    if (child.geometry) child.geometry.dispose()
    if (child.material) child.material.dispose()
  }
  
  while (stressGroup.children.length > 0) {
    const child = stressGroup.children[0]
    stressGroup.remove(child)
    if (child.geometry) child.geometry.dispose()
    if (child.material) child.material.dispose()
  }

  originalMaterials.clear()

  const { params, result, stressResult, showStress } = props
  if (!params) return

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.8,
    metalness: 0.1
  })

  const tenonMaterial = new THREE.MeshStandardMaterial({
    color: 0xDEB887,
    roughness: 0.8,
    metalness: 0.1
  })

  const w = params.woodLength || 200
  const h = params.woodWidth || 100
  const d = params.woodHeight || 30

  const mainGeometry = new THREE.BoxGeometry(w, d, h)
  const mainWood = new THREE.Mesh(mainGeometry, woodMaterial)
  mainWood.position.set(w / 2, d / 2, h / 2)
  mainWood.castShadow = true
  mainWood.receiveShadow = true
  woodGroup.add(mainWood)

  const joinType = params.joinType
  const tenonLen = params.tenonLength || 30
  const tenonW = params.tenonWidth || 20
  const tenonH = params.tenonHeight || 20
  const margin = params.margin || 5

  switch (joinType) {
    case 'DOVETAIL':
      createDovetailTenons(w, h, d, tenonLen, tenonW, tenonH, margin, result, tenonMaterial)
      break
    case 'STRAIGHT':
      createStraightTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, tenonMaterial)
      break
    case 'CLAMP':
      createClampTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, tenonMaterial)
      break
    case 'BOX':
      createBoxTenons(w, h, d, tenonLen, tenonW, tenonH, margin, result, tenonMaterial)
      break
    case 'LAP':
      createLapTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, tenonMaterial)
      break
  }
  
  if (showStress && stressResult) {
    applyStressColoring(params, result, stressResult)
  }
}

function applyStressColoring(params, result, stressResult) {
  const stressZones = stressResult.stressZones || []
  const maxStress = stressResult.maxStress || 1
  
  const w = params.woodLength || 200
  const h = params.woodWidth || 100
  const d = params.woodHeight || 30
  const tenonLen = params.tenonLength || 30
  const tenonW = params.tenonWidth || 20
  const tenonH = params.tenonHeight || 20
  const margin = params.margin || 5
  
  woodGroup.visible = false
  
  const mainGeometry = new THREE.BoxGeometry(w, d, h)
  const mainColor = stressLevelToColor(0.2)
  const mainMaterial = new THREE.MeshStandardMaterial({
    color: mainColor,
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85
  })
  const mainWood = new THREE.Mesh(mainGeometry, mainMaterial)
  mainWood.position.set(w / 2, d / 2, h / 2)
  mainWood.castShadow = true
  mainWood.receiveShadow = true
  stressGroup.add(mainWood)
  
  const joinType = params.joinType
  
  switch (joinType) {
    case 'DOVETAIL':
      createStressDovetail(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult)
      break
    case 'STRAIGHT':
      createStressStraight(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult)
      break
    case 'CLAMP':
      createStressClamp(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult)
      break
    case 'BOX':
      createStressBox(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult)
      break
    case 'LAP':
      createStressLap(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult)
      break
  }
}

function createStressDovetail(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult) {
  const tails = result?.tails || []
  const stressZones = stressResult?.stressZones || []
  
  let shearLevel = 0.5, compressionLevel = 0.3, tensionLevel = 0.4
  stressZones.forEach(zone => {
    if (zone.name.includes('剪切')) shearLevel = zone.stressLevel || 0.5
    if (zone.name.includes('承压')) compressionLevel = zone.stressLevel || 0.3
    if (zone.name.includes('受拉')) tensionLevel = zone.stressLevel || 0.4
  })
  
  tails.forEach(tail => {
    const tailTopWidth = tail.width || tenonW
    const tailHeight = tail.height || tenonH
    const tailLength = tail.length || tenonLen
    const tailOffset = tail.offset || 0
    
    const maxSafeOffset = tailTopWidth / 2 - 0.5
    const safeOffset = Math.min(tailOffset, maxSafeOffset)
    const tailBottomWidth = tailTopWidth + 2 * safeOffset
    
    const shearMaterial = createStressMaterial(shearLevel)
    const compressionMaterial = createStressMaterial(compressionLevel)
    const tensionMaterial = createStressMaterial(tensionLevel)
    
    const baseGroup = new THREE.Group()
    
    const coreShape = new THREE.Shape()
    coreShape.moveTo(-tailBottomWidth / 2, 0)
    coreShape.lineTo(tailBottomWidth / 2, 0)
    coreShape.lineTo(tailTopWidth / 2, tailHeight)
    coreShape.lineTo(-tailTopWidth / 2, tailHeight)
    coreShape.lineTo(-tailBottomWidth / 2, 0)
    
    const coreGeometry = new THREE.ExtrudeGeometry(coreShape, {
      depth: tailLength,
      bevelEnabled: false
    })
    const coreMesh = new THREE.Mesh(coreGeometry, shearMaterial)
    baseGroup.add(coreMesh)
    
    const rootWidth = tailBottomWidth * 0.6
    const rootGeometry = new THREE.BoxGeometry(tailLength * 0.3, tailHeight * 0.4, rootWidth)
    const rootMesh = new THREE.Mesh(rootGeometry, compressionMaterial)
    rootMesh.position.set(tailLength * 0.15, tailHeight * 0.2, 0)
    baseGroup.add(rootMesh)
    
    const tipGeometry = new THREE.BoxGeometry(tailLength * 0.2, tailHeight * 0.3, tailTopWidth * 0.8)
    const tipMesh = new THREE.Mesh(tipGeometry, tensionMaterial)
    tipMesh.position.set(tailLength * 0.9, tailHeight * 0.85, 0)
    baseGroup.add(tipMesh)
    
    baseGroup.position.set(w, margin, tail.x + tailTopWidth / 2)
    baseGroup.rotation.x = Math.PI / 2
    stressGroup.add(baseGroup)
    
    createStressDovetailMortise(w, h, d, tailTopWidth, safeOffset, tailHeight, tailLength, margin, tail.x, stressResult)
  })
}

function createStressDovetailMortise(w, h, d, tailTopWidth, offset, tailHeight, tailLength, margin, tailX, stressResult) {
  const bottomWidth = tailTopWidth + 2 * offset
  
  const mortiseMaterial = createStressMaterial(0.6)
  
  const shape = new THREE.Shape()
  shape.moveTo(-bottomWidth / 2, 0)
  shape.lineTo(bottomWidth / 2, 0)
  shape.lineTo(tailTopWidth / 2, tailHeight)
  shape.lineTo(-tailTopWidth / 2, tailHeight)
  shape.lineTo(-bottomWidth / 2, 0)
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: tailLength,
    bevelEnabled: false
  })
  
  const mesh = new THREE.Mesh(geometry, mortiseMaterial)
  mesh.position.set(-tailLength, margin, tailX + tailTopWidth / 2)
  mesh.rotation.x = Math.PI / 2
  mesh.rotation.z = Math.PI
  stressGroup.add(mesh)
}

function createStressStraight(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult) {
  const stressZones = stressResult?.stressZones || []
  
  let shearLevel = 0.4, compressionLevel = 0.3, bendingLevel = 0.5
  stressZones.forEach(zone => {
    if (zone.name.includes('剪切')) shearLevel = zone.stressLevel || 0.4
    if (zone.name.includes('承压')) compressionLevel = zone.stressLevel || 0.3
    if (zone.name.includes('弯曲') || zone.name.includes('榫根')) bendingLevel = zone.stressLevel || 0.5
  })
  
  const shearMaterial = createStressMaterial(shearLevel)
  const compressionMaterial = createStressMaterial(compressionLevel)
  const bendingMaterial = createStressMaterial(bendingLevel)
  
  const tenonGeometry = new THREE.BoxGeometry(tenonLen, tenonH, tenonW)
  const tenon = new THREE.Mesh(tenonGeometry, shearMaterial)
  tenon.position.set(w + tenonLen / 2, margin + tenonH / 2, h / 2)
  stressGroup.add(tenon)
  
  const rootGeometry = new THREE.BoxGeometry(tenonLen * 0.3, tenonH * 0.5, tenonW * 1.1)
  const root = new THREE.Mesh(rootGeometry, bendingMaterial)
  root.position.set(w + tenonLen * 0.15, margin + tenonH / 2, h / 2)
  stressGroup.add(root)
  
  const endGeometry = new THREE.BoxGeometry(tenonLen * 0.2, tenonH * 0.6, tenonW * 0.9)
  const end = new THREE.Mesh(endGeometry, compressionMaterial)
  end.position.set(w + tenonLen * 0.9, margin + tenonH / 2, h / 2)
  stressGroup.add(end)
  
  const mortiseMaterial = createStressMaterial(0.55)
  const mortiseGeometry = new THREE.BoxGeometry(tenonLen, tenonH, tenonW)
  const mortise = new THREE.Mesh(mortiseGeometry, mortiseMaterial)
  mortise.position.set(-tenonLen / 2, margin + tenonH / 2, h / 2)
  stressGroup.add(mortise)
}

function createStressClamp(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult) {
  createStressStraight(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult)
  
  const clampMaterial = createStressMaterial(0.7)
  const shoulderW = result?.shoulder?.width || tenonW * 1.2
  const shoulderH = result?.shoulder?.height || tenonH * 0.3
  
  const shoulderGeometry = new THREE.BoxGeometry(tenonLen * 0.5, shoulderH, shoulderW)
  const shoulder = new THREE.Mesh(shoulderGeometry, clampMaterial)
  shoulder.position.set(w + tenonLen * 0.65, margin + shoulderH / 2, h / 2)
  stressGroup.add(shoulder)
}

function createStressBox(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult) {
  const fingers = result?.fingers || []
  const stressZones = stressResult?.stressZones || []
  
  let shearLevel = 0.4, rootLevel = 0.6, glueLevel = 0.3
  stressZones.forEach(zone => {
    if (zone.name.includes('剪切')) shearLevel = zone.stressLevel || 0.4
    if (zone.name.includes('指根')) rootLevel = zone.stressLevel || 0.6
    if (zone.name.includes('胶合')) glueLevel = zone.stressLevel || 0.3
  })
  
  fingers.forEach((finger, index) => {
    const isEven = index % 2 === 0
    const fingerWidth = result?.fingerWidth || tenonW
    
    if (isEven) {
      const fingerMaterial = createStressMaterial(shearLevel + Math.random() * 0.1)
      const geometry = new THREE.BoxGeometry(tenonLen, tenonH, fingerWidth)
      const fingerMesh = new THREE.Mesh(geometry, fingerMaterial)
      fingerMesh.position.set(
        w + tenonLen / 2,
        margin + tenonH / 2,
        finger.x + fingerWidth / 2
      )
      stressGroup.add(fingerMesh)
      
      const rootMaterial = createStressMaterial(rootLevel)
      const rootGeometry = new THREE.BoxGeometry(tenonLen * 0.25, tenonH * 0.4, fingerWidth * 0.9)
      const root = new THREE.Mesh(rootGeometry, rootMaterial)
      root.position.set(
        w + tenonLen * 0.125,
        margin + tenonH * 0.3,
        finger.x + fingerWidth / 2
      )
      stressGroup.add(root)
    } else {
      const gapMaterial = createStressMaterial(glueLevel + 0.1)
      const gapGeometry = new THREE.BoxGeometry(tenonLen, tenonH, fingerWidth)
      const gap = new THREE.Mesh(gapGeometry, gapMaterial)
      gap.position.set(
        -tenonLen / 2,
        margin + tenonH / 2,
        finger.x + fingerWidth / 2
      )
      stressGroup.add(gap)
    }
  })
}

function createStressLap(w, h, d, tenonLen, tenonW, tenonH, margin, result, stressResult) {
  const stressZones = stressResult?.stressZones || []
  const lapW = h - 2 * margin
  const lapH = d / 2
  
  let shearLevel = 0.5, bearingLevel = 0.3, bendingLevel = 0.4
  stressZones.forEach(zone => {
    if (zone.name.includes('剪切')) shearLevel = zone.stressLevel || 0.5
    if (zone.name.includes('承压')) bearingLevel = zone.stressLevel || 0.3
    if (zone.name.includes('弯曲')) bendingLevel = zone.stressLevel || 0.4
  })
  
  const lapMaterial = createStressMaterial(shearLevel)
  const lapGeometry = new THREE.BoxGeometry(tenonLen, lapH, lapW)
  const lap = new THREE.Mesh(lapGeometry, lapMaterial)
  lap.position.set(w + tenonLen / 2, d / 2 + lapH / 2, h / 2)
  stressGroup.add(lap)
  
  const bearingMaterial = createStressMaterial(bearingLevel)
  const bearingGeometry = new THREE.BoxGeometry(tenonLen * 0.3, lapH * 0.3, lapW * 0.9)
  const bearing = new THREE.Mesh(bearingGeometry, bearingMaterial)
  bearing.position.set(w + tenonLen * 0.85, d / 2 + lapH * 0.15, h / 2)
  stressGroup.add(bearing)
  
  const notchMaterial = createStressMaterial(bendingLevel)
  const notchGeometry = new THREE.BoxGeometry(tenonLen, lapH, lapW)
  const notch = new THREE.Mesh(notchGeometry, notchMaterial)
  notch.position.set(-tenonLen / 2, lapH / 2, h / 2)
  stressGroup.add(notch)
}

function createStressMaterial(stressLevel) {
  const color = stressLevelToColor(stressLevel)
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.6,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9
  })
}

function stressLevelToColor(level) {
  level = Math.max(0, Math.min(1, level))
  
  let r, g, b
  
  if (level < 0.2) {
    const t = level / 0.2
    r = 0
    g = Math.round(100 + 55 * t)
    b = 255
  } else if (level < 0.4) {
    const t = (level - 0.2) / 0.2
    r = Math.round(128 * t)
    g = 255
    b = Math.round(255 - 127 * t)
  } else if (level < 0.6) {
    const t = (level - 0.4) / 0.2
    r = Math.round(128 + 64 * t)
    g = 255
    b = Math.round(128 - 128 * t)
  } else if (level < 0.8) {
    const t = (level - 0.6) / 0.2
    r = Math.round(192 + 63 * t)
    g = Math.round(255 - 127 * t)
    b = 0
  } else {
    const t = (level - 0.8) / 0.2
    r = 255
    g = Math.round(128 - 128 * t)
    b = 0
  }
  
  return new THREE.Color(r / 255, g / 255, b / 255)
}

function createDovetailTenons(w, h, d, tenonLen, tenonW, tenonH, margin, result, material) {
  const tails = result?.tails || []
  const tailAngleDeg = result?.tailAngle || 80
  const globalOffset = result?.tailOffset
  
  const minTailAngleDeg = 70
  const maxTailAngleDeg = 85
  const safeAngleDeg = Math.max(Math.min(tailAngleDeg, maxTailAngleDeg), minTailAngleDeg)
  
  tails.forEach(tail => {
    const tailTopWidth = tail.width || tenonW
    const tailHeight = tail.height || tenonH
    const tailLength = tail.length || tenonLen
    const tailOffset = tail.offset || globalOffset || 0
    
    const maxSafeOffset = tailTopWidth / 2 - 0.5
    const safeOffset = Math.min(tailOffset, maxSafeOffset)
    if (safeOffset <= 0) {
      const geometry = new THREE.BoxGeometry(tailLength, tailHeight, tailTopWidth)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        w + tailLength / 2,
        margin + tailHeight / 2,
        tail.x + tailTopWidth / 2
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      woodGroup.add(mesh)
      return
    }
    
    const tailBottomWidth = tailTopWidth + 2 * safeOffset
    
    const shape = new THREE.Shape()
    
    shape.moveTo(-tailBottomWidth / 2, 0)
    shape.lineTo(tailBottomWidth / 2, 0)
    shape.lineTo(tailTopWidth / 2, tailHeight)
    shape.lineTo(-tailTopWidth / 2, tailHeight)
    shape.lineTo(-tailBottomWidth / 2, 0)
    
    const shapePoints = shape.getPoints()
    const isValidShape = checkValidTrapezoid(shapePoints)
    
    if (!isValidShape) {
      console.warn('燕尾榫形状无效，降级为长方体')
      const geometry = new THREE.BoxGeometry(tailLength, tailHeight, tailTopWidth)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(
        w + tailLength / 2,
        margin + tailHeight / 2,
        tail.x + tailTopWidth / 2
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      woodGroup.add(mesh)
      return
    }

    const extrudeSettings = {
      depth: tailLength,
      bevelEnabled: false,
      curveSegments: 1
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    
    geometry.computeVertexNormals()
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(w, margin, tail.x + tailTopWidth / 2)
    mesh.rotation.x = Math.PI / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    woodGroup.add(mesh)
    
    createDovetailMortise(w, h, d, tailTopWidth, safeOffset, tailHeight, tailLength, margin, tail.x)
  })
}

function checkValidTrapezoid(points) {
  if (points.length < 4) return false
  
  const p0 = points[0]
  const p1 = points[1]
  const p2 = points[2]
  const p3 = points[3]
  
  const bottomWidth = p1.x - p0.x
  const topWidth = p2.x - p3.x
  
  if (bottomWidth <= 0 || topWidth <= 0) return false
  if (bottomWidth < topWidth) return false
  
  const area = (bottomWidth + topWidth) * (p2.y - p0.y) / 2
  if (area <= 1) return false
  
  const cross1 = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x)
  const cross2 = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x)
  
  return Math.abs(cross1) > 0.001 && Math.abs(cross2) > 0.001
}

function createDovetailMortise(w, h, d, tailTopWidth, offset, tailHeight, tailLength, margin, tailX) {
  const mortiseMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2c1a,
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide
  })
  
  const bottomWidth = tailTopWidth + 2 * offset
  
  const shape = new THREE.Shape()
  shape.moveTo(-bottomWidth / 2, 0)
  shape.lineTo(bottomWidth / 2, 0)
  shape.lineTo(tailTopWidth / 2, tailHeight)
  shape.lineTo(-tailTopWidth / 2, tailHeight)
  shape.lineTo(-bottomWidth / 2, 0)
  
  const extrudeSettings = {
    depth: tailLength,
    bevelEnabled: false
  }
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geometry.computeVertexNormals()
  
  const mesh = new THREE.Mesh(geometry, mortiseMaterial)
  mesh.position.set(-tailLength, margin, tailX + tailTopWidth / 2)
  mesh.rotation.x = Math.PI / 2
  mesh.rotation.z = Math.PI
  mesh.castShadow = true
  mesh.receiveShadow = true
  woodGroup.add(mesh)
}

function createStraightTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, material) {
  const geometry = new THREE.BoxGeometry(tenonLen, tenonH, tenonW)
  const tenon = new THREE.Mesh(geometry, material)
  tenon.position.set(w + tenonLen / 2, tenonH / 2 + margin, h / 2)
  tenon.castShadow = true
  tenon.receiveShadow = true
  woodGroup.add(tenon)

  const mortiseGeometry = new THREE.BoxGeometry(tenonLen, tenonH, tenonW)
  const mortiseMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2c1a,
    roughness: 0.9,
    metalness: 0
  })
  const mortise = new THREE.Mesh(mortiseGeometry, mortiseMaterial)
  mortise.position.set(-tenonLen / 2, tenonH / 2 + margin, h / 2)
  mortise.castShadow = true
  mortise.receiveShadow = true
  woodGroup.add(mortise)
}

function createClampTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, material) {
  createStraightTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, material)

  const shoulderW = result?.shoulder?.width || tenonW * 1.2
  const shoulderH = result?.shoulder?.height || tenonH * 0.3

  const shoulderGeometry = new THREE.BoxGeometry(tenonLen * 0.5, shoulderH, shoulderW)
  const shoulder = new THREE.Mesh(shoulderGeometry, material)
  shoulder.position.set(w + tenonLen * 0.65, margin + shoulderH / 2, h / 2)
  shoulder.castShadow = true
  shoulder.receiveShadow = true
  woodGroup.add(shoulder)
}

function createBoxTenons(w, h, d, tenonLen, tenonW, tenonH, margin, result, material) {
  const fingers = result?.fingers || []

  fingers.forEach((finger, index) => {
    const isEven = index % 2 === 0
    const fingerWidth = result?.fingerWidth || tenonW

    if (isEven) {
      const geometry = new THREE.BoxGeometry(tenonLen, tenonH, fingerWidth)
      const fingerMesh = new THREE.Mesh(geometry, material)
      fingerMesh.position.set(
        w + tenonLen / 2,
        tenonH / 2 + margin,
        finger.x + fingerWidth / 2
      )
      fingerMesh.castShadow = true
      fingerMesh.receiveShadow = true
      woodGroup.add(fingerMesh)
    } else {
      const gapGeometry = new THREE.BoxGeometry(tenonLen, tenonH, fingerWidth)
      const gapMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a2c1a,
        roughness: 0.9
      })
      const gap = new THREE.Mesh(gapGeometry, gapMaterial)
      gap.position.set(
        -tenonLen / 2,
        margin + tenonH / 2,
        finger.x + fingerWidth / 2
      )
      gap.castShadow = true
      gap.receiveShadow = true
      woodGroup.add(gap)
    }
  })
}

function createLapTenon(w, h, d, tenonLen, tenonW, tenonH, margin, result, material) {
  const lapW = h - 2 * margin
  const lapH = d / 2

  const lapGeometry = new THREE.BoxGeometry(tenonLen, lapH, lapW)
  const lap = new THREE.Mesh(lapGeometry, material)
  lap.position.set(w + tenonLen / 2, d / 2 + lapH / 2, h / 2)
  lap.castShadow = true
  lap.receiveShadow = true
  woodGroup.add(lap)

  const notchGeometry = new THREE.BoxGeometry(tenonLen, lapH, lapW)
  const notchMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2c1a,
    roughness: 0.9
  })
  const notch = new THREE.Mesh(notchGeometry, notchMaterial)
  notch.position.set(-tenonLen / 2, lapH / 2, h / 2)
  notch.castShadow = true
  notch.receiveShadow = true
  woodGroup.add(notch)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (controls) controls.update()
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
}
</style>