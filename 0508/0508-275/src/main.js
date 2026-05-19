import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import MoleculeRenderer from './MoleculeRenderer'

class App {
  constructor() {
    this.container = document.getElementById('canvas-container')
    this.moleculeData = null
    this.moleculeRenderer = null
    this.ligandRenderer = null
    this.mode = 'ball-stick'
    this.atomScale = 1
    this.showBackbone = true
    this.enableLOD = true
    this.demandRendering = true
    
    this.loadedMolecules = []
    this.receptorIndex = -1
    this.ligandIndex = -1
    this.dockingResult = null
    this.isDocking = false
    
    this.isInteracting = false
    this.needsRender = true
    this.renderCount = 0
    this.lastFpsUpdate = 0
    this.fps = 0
    
    this.loadingBar = document.getElementById('loading-bar')
    this.loadingText = document.getElementById('loading-text')
    this.loadingTitle = document.getElementById('loading-title')
    
    this.init()
    this.setupEventListeners()
    this.setupDockingUI()
  }
  
  init() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    )
    this.camera.position.set(0, 0, 50)
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.shadowMap.enabled = false
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.1
    this.controls.minDistance = 5
    this.controls.maxDistance = 500
    this.controls.screenSpacePanning = true
    
    this.setupLighting()
    
    this.animate()
    
    window.addEventListener('resize', () => this.onWindowResize())
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(50, 100, 50)
    this.scene.add(directionalLight1)
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight2.position.set(-50, -50, -50)
    this.scene.add(directionalLight2)
  }
  
  setupEventListeners() {
    document.getElementById('pdb-file').addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        this.loadPDBFile(file)
      }
    })
    
    document.getElementById('upload-btn').addEventListener('click', () => {
      document.getElementById('pdb-file').click()
    })
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this.mode = btn.dataset.mode
        this.updateMolecule()
      })
    })
    
    document.getElementById('show-backbone').addEventListener('change', (e) => {
      this.showBackbone = e.target.checked
      this.updateMolecule()
    })
    
    document.getElementById('enable-lod').addEventListener('change', (e) => {
      this.enableLOD = e.target.checked
      if (this.moleculeRenderer) {
        this.moleculeRenderer.update({ enableLOD: this.enableLOD })
      }
    })
    
    document.getElementById('atom-scale').addEventListener('input', (e) => {
      this.atomScale = parseFloat(e.target.value)
      this.updateMolecule()
    })
    
    this.controls.addEventListener('start', () => {
      this.isInteracting = true
      this.needsRender = true
      this.renderer.setPixelRatio(1)
    })
    
    this.controls.addEventListener('end', () => {
      this.isInteracting = false
      setTimeout(() => {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        this.needsRender = true
      }, 100)
    })
    
    this.controls.addEventListener('change', () => {
      this.needsRender = true
    })
  }
  
  setupDockingUI() {
    const receptorSlot = document.getElementById('receptor-slot')
    const ligandSlot = document.getElementById('ligand-slot')
    
    receptorSlot.addEventListener('click', () => {
      if (this.loadedMolecules.length > 0) {
        this.showMoleculeSelection('receptor')
      }
    })
    
    ligandSlot.addEventListener('click', () => {
      if (this.loadedMolecules.length > 1) {
        this.showMoleculeSelection('ligand')
      } else if (this.loadedMolecules.length === 1) {
        alert('请先加载第二个分子作为配体')
      }
    })
    
    document.getElementById('start-docking-btn').addEventListener('click', () => {
      this.startDocking()
    })
    
    document.getElementById('reset-docking-btn').addEventListener('click', () => {
      this.resetDocking()
    })
    
    document.getElementById('play-anim-btn').addEventListener('click', () => {
      if (this.ligandRenderer) {
        this.ligandRenderer.playAnimation()
        document.getElementById('play-anim-btn').classList.add('active')
        document.getElementById('pause-anim-btn').classList.remove('active')
      }
    })
    
    document.getElementById('pause-anim-btn').addEventListener('click', () => {
      if (this.ligandRenderer) {
        this.ligandRenderer.pauseAnimation()
        document.getElementById('play-anim-btn').classList.remove('active')
        document.getElementById('pause-anim-btn').classList.add('active')
      }
    })
    
    document.getElementById('reset-anim-btn').addEventListener('click', () => {
      if (this.ligandRenderer) {
        this.ligandRenderer.resetAnimation()
        document.getElementById('play-anim-btn').classList.remove('active')
        document.getElementById('pause-anim-btn').classList.remove('active')
      }
    })
  }
  
  showMoleculeSelection(type) {
    const options = this.loadedMolecules.map((mol, idx) => 
      `${idx + 1}: ${mol.name} (${mol.num_atoms} atoms)`
    ).join('\n')
    
    const selection = prompt(`选择${type === 'receptor' ? '受体' : '配体'}分子:\n${options}`)
    
    if (selection) {
      const idx = parseInt(selection) - 1
      if (idx >= 0 && idx < this.loadedMolecules.length) {
        if (type === 'receptor') {
          this.receptorIndex = idx
          document.getElementById('receptor-name').textContent = this.loadedMolecules[idx].name
          document.getElementById('receptor-slot').classList.add('filled', 'receptor')
        } else {
          this.ligandIndex = idx
          document.getElementById('ligand-name').textContent = this.loadedMolecules[idx].name
          document.getElementById('ligand-slot').classList.add('filled', 'ligand')
        }
      }
    }
  }
  
  async startDocking() {
    if (this.receptorIndex < 0 || this.ligandIndex < 0) {
      alert('请先选择受体和配体分子')
      return
    }
    
    if (this.isDocking) {
      return
    }
    
    this.isDocking = true
    const loading = document.getElementById('loading')
    loading.classList.add('show')
    this.loadingTitle.textContent = '正在进行分子对接计算...'
    this.setProgress(0.1, '准备分子数据...')
    
    try {
      const receptor = this.loadedMolecules[this.receptorIndex]
      const ligand = this.loadedMolecules[this.ligandIndex]
      
      this.setProgress(0.2, '发送对接请求...')
      
      const response = await fetch('/api/docking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receptor: receptor.atoms,
          ligand: ligand.atoms
        })
      })
      
      this.setProgress(0.7, '接收对接结果...')
      
      const result = await response.json()
      
      if (result.success) {
        this.dockingResult = result.data
        
        this.setProgress(0.85, '渲染对接结果...')
        
        await this.displayDockingResult()
        
        document.getElementById('docking-result').classList.add('show')
        document.getElementById('docking-score').textContent = result.data.best_poses[0].total_score.toFixed(2)
        document.getElementById('correlation-score').textContent = (result.data.best_poses[0].correlation_score * 100).toFixed(1) + '%'
        document.getElementById('contact-count').textContent = result.data.best_poses[0].contacts
      } else {
        alert('对接失败: ' + result.error)
      }
    } catch (error) {
      console.error('Docking error:', error)
      alert('对接出错: ' + error.message)
    } finally {
      this.isDocking = false
      loading.classList.remove('show')
    }
  }
  
  async displayDockingResult() {
    const receptor = this.loadedMolecules[this.receptorIndex]
    const ligand = this.loadedMolecules[this.ligandIndex]
    
    if (this.moleculeRenderer) {
      this.moleculeRenderer.dispose()
    }
    if (this.ligandRenderer) {
      this.ligandRenderer.dispose()
    }
    
    this.moleculeRenderer = new MoleculeRenderer(
      this.scene,
      this.camera,
      receptor,
      {
        mode: this.mode,
        atomScale: this.atomScale,
        showBackbone: this.showBackbone,
        enableLOD: this.enableLOD,
        color: 0x4a90d9
      }
    )
    
    await this.moleculeRenderer.waitForLoad()
    
    this.ligandRenderer = new MoleculeRenderer(
      this.scene,
      this.camera,
      ligand,
      {
        mode: this.mode,
        atomScale: this.atomScale,
        showBackbone: this.showBackbone,
        enableLOD: this.enableLOD,
        color: 0xe74c3c
      }
    )
    
    await this.ligandRenderer.waitForLoad()
    
    if (this.dockingResult && this.dockingResult.trajectory) {
      this.ligandRenderer.setTrajectory(this.dockingResult.trajectory)
    }
    
    this.fitCameraToDocking()
  }
  
  fitCameraToDocking() {
    if (!this.loadedMolecules[this.receptorIndex]) return
    
    const receptor = this.loadedMolecules[this.receptorIndex]
    const coords = receptor.atoms
    const step = Math.max(1, Math.floor(coords.length / 500))
    
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    
    for (let i = 0; i < coords.length; i += step) {
      const c = coords[i].coord
      minX = Math.min(minX, c[0])
      minY = Math.min(minY, c[1])
      minZ = Math.min(minZ, c[2])
      maxX = Math.max(maxX, c[0])
      maxY = Math.max(maxY, c[1])
      maxZ = Math.max(maxZ, c[2])
    }
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2
    const maxDist = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    
    this.controls.target.set(centerX, centerY, centerZ)
    this.camera.position.set(centerX, centerY, centerZ + maxDist * 3)
    this.controls.maxDistance = maxDist * 15
    this.controls.update()
  }
  
  resetDocking() {
    this.receptorIndex = -1
    this.ligandIndex = -1
    this.dockingResult = null
    
    document.getElementById('receptor-name').textContent = '点击选择已加载分子'
    document.getElementById('ligand-name').textContent = '点击选择已加载分子'
    document.getElementById('receptor-slot').classList.remove('filled', 'receptor')
    document.getElementById('ligand-slot').classList.remove('filled', 'ligand')
    document.getElementById('docking-result').classList.remove('show')
    
    if (this.ligandRenderer) {
      this.ligandRenderer.dispose()
      this.ligandRenderer = null
    }
    
    if (this.loadedMolecules.length > 0) {
      this.renderMolecule(this.loadedMolecules[0])
    }
  }
  
  setProgress(progress, text) {
    if (this.loadingBar) {
      this.loadingBar.style.width = `${Math.min(100, progress * 100)}%`
    }
    if (this.loadingText) {
      this.loadingText.textContent = text || ''
    }
  }
  
  async loadPDBFile(file) {
    const loading = document.getElementById('loading')
    loading.classList.add('show')
    this.setProgress(0, '正在上传文件...')
    this.loadingTitle.textContent = '正在解析PDB文件...'
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('max_atoms', 200000)
      
      this.setProgress(0.05, '正在传输数据...')
      
      const response = await fetch('/api/parse-pdb', {
        method: 'POST',
        body: formData
      })
      
      this.setProgress(0.15, '数据解析完成，准备渲染...')
      
      const result = await response.json()
      
      if (result.success) {
        result.data.name = file.name.replace('.pdb', '')
        this.loadedMolecules.push(result.data)
        
        document.getElementById('docking-panel').classList.add('show')
        
        if (this.loadedMolecules.length === 1) {
          await this.renderMolecule(result.data)
        }
        
        this.updateInfoPanel()
      } else {
        alert('解析PDB文件失败: ' + result.error)
      }
    } catch (error) {
      console.error('Error loading PDB file:', error)
      alert('加载PDB文件失败: ' + error.message)
    } finally {
      setTimeout(() => {
        loading.classList.remove('show')
      }, 300)
    }
  }
  
  async renderMolecule(data) {
    if (this.moleculeRenderer) {
      this.moleculeRenderer.dispose()
    }
    if (this.ligandRenderer) {
      this.ligandRenderer.dispose()
      this.ligandRenderer = null
    }
    
    const numAtoms = data.num_atoms || 0
    
    this.renderer.shadowMap.enabled = numAtoms < 20000
    this.renderer.setPixelRatio(numAtoms > 100000 ? 1 : Math.min(window.devicePixelRatio, 1.5))
    
    this.moleculeRenderer = new MoleculeRenderer(
      this.scene,
      this.camera,
      data,
      {
        mode: this.mode,
        atomScale: this.atomScale,
        showBackbone: this.showBackbone,
        enableLOD: this.enableLOD,
        onProgress: (progress, text) => {
          this.setProgress(0.15 + progress * 0.85, text)
        }
      }
    )
    
    await this.moleculeRenderer.waitForLoad()
    
    this.needsRender = true
    this.fitCameraToMolecule(data)
  }
  
  updateMolecule() {
    if (this.moleculeRenderer) {
      this.moleculeRenderer.update({
        mode: this.mode,
        atomScale: this.atomScale,
        showBackbone: this.showBackbone
      })
      this.needsRender = true
    }
    if (this.ligandRenderer) {
      this.ligandRenderer.update({
        mode: this.mode,
        atomScale: this.atomScale,
        showBackbone: this.showBackbone
      })
      this.needsRender = true
    }
  }
  
  fitCameraToMolecule(data) {
    if (!data || !data.atoms.length) return
    
    const coords = data.atoms
    const step = Math.max(1, Math.floor(coords.length / 500))
    
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    
    for (let i = 0; i < coords.length; i += step) {
      const c = coords[i].coord
      minX = Math.min(minX, c[0])
      minY = Math.min(minY, c[1])
      minZ = Math.min(minZ, c[2])
      maxX = Math.max(maxX, c[0])
      maxY = Math.max(maxY, c[1])
      maxZ = Math.max(maxZ, c[2])
    }
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2
    const maxDist = Math.max(maxX - minX, maxY - minY, maxZ - minZ)
    
    this.controls.target.set(centerX, centerY, centerZ)
    this.camera.position.set(centerX, centerY, centerZ + maxDist * 2.5)
    this.controls.maxDistance = maxDist * 10
    this.controls.update()
  }
  
  updateInfoPanel() {
    const panel = document.getElementById('info-panel')
    panel.style.display = 'block'
    
    if (this.loadedMolecules.length > 0) {
      const lastMol = this.loadedMolecules[this.loadedMolecules.length - 1]
      document.getElementById('mol-name').textContent = lastMol.name
      document.getElementById('atom-count').textContent = lastMol.num_atoms
      document.getElementById('residue-count').textContent = lastMol.num_residues
    }
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.needsRender = true
  }
  
  animate() {
    requestAnimationFrame(() => this.animate())
    
    const now = performance.now()
    this.renderCount++
    
    if (now - this.lastFpsUpdate > 1000) {
      this.fps = this.renderCount
      this.renderCount = 0
      this.lastFpsUpdate = now
      document.getElementById('lod-level').textContent = `${this.fps} FPS | LOD:${this.moleculeRenderer?.currentLOD || 0}`
    }
    
    let shouldRender = this.needsRender
    
    if (this.isInteracting) {
      shouldRender = true
    }
    
    if (this.moleculeRenderer && this.enableLOD) {
      if (this.moleculeRenderer.updateLOD()) {
        shouldRender = true
      }
    }
    
    if (this.ligandRenderer) {
      if (this.ligandRenderer.updateAnimation()) {
        shouldRender = true
      }
    }
    
    if (this.controls.enabled) {
      this.controls.update()
    }
    
    if (shouldRender || !this.demandRendering) {
      this.renderer.render(this.scene, this.camera)
      this.needsRender = false
    }
  }
}

new App()
