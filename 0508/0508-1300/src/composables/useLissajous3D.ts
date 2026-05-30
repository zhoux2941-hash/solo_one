import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { LissajousParams, Point3D, View3DOptions } from '@/types'
import { degToRad } from '@/utils/lissajousMath'
import { gcd } from '@/utils/gcd'

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs(a * b) / gcd(a, b)
}

export function generatePoints3D(
  params: LissajousParams,
  depthScale: number = 0.5,
  numPoints: number = 2000
): Point3D[] {
  const { fx, fy, phase, amplitude } = params
  const phaseRad = degToRad(phase)
  const period = lcm(Math.round(fx), Math.round(fy)) / Math.min(fx, fy)
  const points: Point3D[] = []

  for (let i = 0; i < numPoints; i++) {
    const t = (i / (numPoints - 1)) * period
    const x = amplitude * Math.sin(2 * Math.PI * fx * t + phaseRad)
    const y = amplitude * Math.sin(2 * Math.PI * fy * t)
    const z = t * depthScale
    points.push({ x, y, z, t })
  }

  return points
}

export function createLissajous3DScene(
  container: HTMLElement,
  options: View3DOptions,
  params: LissajousParams
) {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.01,
    1000
  )
  camera.position.set(2, 2, 3)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
  })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x0a0e17, 1)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = options.autoRotate
  controls.autoRotateSpeed = 1.5
  controls.minDistance = 0.5
  controls.maxDistance = 20

  const curveGroup = new THREE.Group()
  scene.add(curveGroup)

  const axesGroup = new THREE.Group()
  scene.add(axesGroup)

  const gridGroup = new THREE.Group()
  scene.add(gridGroup)

  const tracerGroup = new THREE.Group()
  scene.add(tracerGroup)

  const ambientLight = new THREE.AmbientLight(0x404060, 2)
  scene.add(ambientLight)

  const pointLight1 = new THREE.PointLight(0x00f5d4, 3, 20)
  pointLight1.position.set(3, 3, 3)
  scene.add(pointLight1)

  const pointLight2 = new THREE.PointLight(0xff006e, 2, 20)
  pointLight2.position.set(-3, -1, 2)
  scene.add(pointLight2)

  function updateCurve(newParams: LissajousParams) {
    while (curveGroup.children.length > 0) {
      const child = curveGroup.children[0]
      curveGroup.remove(child)
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    }

    const points3D = generatePoints3D(newParams, options.depthScale)

    if (points3D.length < 2) return

    const curvePoints = points3D.map(
      (p) => new THREE.Vector3(p.x, p.y, p.z)
    )
    const curve = new THREE.CatmullRomCurve3(curvePoints, false)

    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      Math.min(points3D.length, 600),
      options.tubeRadius,
      12,
      false
    )

    const colors = new Float32Array(tubeGeometry.attributes.position.count * 3)
    const posAttr = tubeGeometry.attributes.position
    for (let i = 0; i < posAttr.count; i++) {
      const t = i / posAttr.count
      const hue = 0.47 + t * 0.15
      const color = new THREE.Color().setHSL(hue, 0.9, 0.6)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    tubeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const tubeMaterial = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 80,
      specular: new THREE.Color(0x444444),
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })

    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
    curveGroup.add(tubeMesh)

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    curveGroup.add(line)
  }

  function updateAxes(show: boolean) {
    while (axesGroup.children.length > 0) {
      const child = axesGroup.children[0]
      axesGroup.remove(child)
      if (child instanceof THREE.Line) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    }
    if (!show) return

    const axisLength = 1.5
    const axesData = [
      { dir: new THREE.Vector3(axisLength, 0, 0), color: 0xff4444 },
      { dir: new THREE.Vector3(0, axisLength, 0), color: 0x44ff44 },
      { dir: new THREE.Vector3(0, 0, axisLength), color: 0x4488ff },
    ]

    for (const axis of axesData) {
      const points = [new THREE.Vector3(0, 0, 0), axis.dir]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color: axis.color,
        transparent: true,
        opacity: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
      const line = new THREE.Line(geometry, material)
      axesGroup.add(line)
    }
  }

  function updateGrid(show: boolean) {
    while (gridGroup.children.length > 0) {
      const child = gridGroup.children[0]
      gridGroup.remove(child)
      if (child instanceof THREE.GridHelper) {
        child.dispose()
      }
    }
    if (!show) return

    const grid = new THREE.GridHelper(4, 20, 0x1a2744, 0x0f1a2e)
    grid.position.y = -1.2
    ;(grid.material as THREE.Material).polygonOffset = true
    ;(grid.material as THREE.Material).polygonOffsetFactor = 2
    ;(grid.material as THREE.Material).polygonOffsetUnits = 2
    gridGroup.add(grid)
  }

  function updateTracer(point3d: Point3D | null, trail: Point3D[]) {
    while (tracerGroup.children.length > 0) {
      const child = tracerGroup.children[0]
      tracerGroup.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
      if (child instanceof THREE.Line) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    }

    if (!point3d) return

    if (trail.length > 2) {
      const trailPoints = trail.map((p) => new THREE.Vector3(p.x, p.y, p.z))
      const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints)
      const trailMaterial = new THREE.LineBasicMaterial({
        color: 0xff006e,
        transparent: true,
        opacity: 0.6,
      })
      const trailLine = new THREE.Line(trailGeometry, trailMaterial)
      tracerGroup.add(trailLine)
    }

    const sphereGeom = new THREE.SphereGeometry(options.tubeRadius * 3, 16, 16)
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0xff006e,
      emissive: 0xff006e,
      emissiveIntensity: 0.6,
    })
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    sphere.position.set(point3d.x, point3d.y, point3d.z)
    tracerGroup.add(sphere)
  }

  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  function render() {
    controls.update()
    renderer.render(scene, camera)
  }

  function dispose() {
    controls.dispose()
    renderer.dispose()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose()
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose()
        }
      }
    })
    if (renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement)
    }
  }

  updateCurve(params)
  updateAxes(options.showAxes3D)
  updateGrid(options.showGrid3D)

  return {
    scene,
    camera,
    renderer,
    controls,
    updateCurve,
    updateAxes,
    updateGrid,
    updateTracer,
    resize,
    render,
    dispose,
  }
}
