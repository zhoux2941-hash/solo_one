import * as THREE from 'three';

export class Renderer3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.meshGroup = null;
    this.animationId = null;
    this.isRotating = true;
    this.moleculeData = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    this.scene.add(directionalLight2);

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mousewheel', this.onWheel.bind(this));
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));

    window.addEventListener('resize', this.onResize.bind(this));

    this.mouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  onMouseDown(event) {
    this.mouseDown = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    this.isRotating = false;
  }

  onMouseMove(event) {
    if (!this.mouseDown) return;
    
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    
    this.meshGroup.rotation.y += deltaX * 0.005;
    this.meshGroup.rotation.x += deltaY * 0.005;
    
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  onMouseUp() {
    this.mouseDown = false;
    this.isRotating = true;
  }

  onWheel(event) {
    event.preventDefault();
    this.camera.position.z += event.deltaY * 0.01;
    this.camera.position.z = Math.max(2, Math.min(10, this.camera.position.z));
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.mouseDown = true;
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.isRotating = false;
    }
  }

  onTouchMove(event) {
    if (!this.mouseDown || event.touches.length !== 1) return;
    
    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = event.touches[0].clientY - this.touchStartY;
    
    this.meshGroup.rotation.y += deltaX * 0.005;
    this.meshGroup.rotation.x += deltaY * 0.005;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getAtomColor(element) {
    const colors = {
      H: 0xFFFFFF,
      C: 0x000000,
      N: 0x0000FF,
      O: 0xFF0000,
      F: 0x00FF00,
      Cl: 0x00FF00,
      Br: 0xA00000,
      I: 0x800080,
      S: 0xFFFF00,
      P: 0xFFA500
    };
    return colors[element] || 0x808080;
  }

  getAtomRadius(element) {
    const radii = {
      H: 0.15,
      C: 0.25,
      N: 0.22,
      O: 0.20,
      F: 0.18,
      Cl: 0.28,
      Br: 0.32,
      I: 0.38,
      S: 0.26,
      P: 0.25
    };
    return radii[element] || 0.22;
  }

  drawMolecule(molecule) {
    this.moleculeData = molecule;
    
    while (this.meshGroup.children.length > 0) {
      this.meshGroup.remove(this.meshGroup.children[0]);
    }

    if (!molecule || !molecule.atoms || !molecule.bonds) return;

    const atoms = molecule.atoms;
    const bonds = molecule.bonds;

    const atomPositions = [];
    atoms.forEach(atom => {
      const geometry = new THREE.SphereGeometry(this.getAtomRadius(atom.element), 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: this.getAtomColor(atom.element),
        shininess: 100
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(atom.x, atom.y, atom.z || 0);
      this.meshGroup.add(sphere);
      atomPositions.push({ x: atom.x, y: atom.y, z: atom.z || 0 });
    });

    bonds.forEach(bond => {
      const start = atomPositions[bond.from];
      const end = atomPositions[bond.to];
      
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const midZ = (start.z + end.z) / 2;
      
      const direction = new THREE.Vector3(
        end.x - start.x,
        end.y - start.y,
        end.z - start.z
      );
      
      const length = direction.length();
      const geometry = new THREE.CylinderGeometry(0.04, 0.04, length, 16);
      const material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 50
      });
      
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.set(midX, midY, midZ);
      
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );
      cylinder.setRotationFromQuaternion(quaternion);
      
      this.meshGroup.add(cylinder);
    });

    this.centerAndScale();
  }

  centerAndScale() {
    const box = new THREE.Box3().setFromObject(this.meshGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3 / maxDim;

    this.meshGroup.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    this.meshGroup.scale.set(scale, scale, scale);
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    if (this.isRotating && !this.mouseDown) {
      this.meshGroup.rotation.y += 0.005;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.removeEventListener('mousewheel', this.onWheel.bind(this));
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  getPDB(molecule) {
    if (!molecule || !molecule.atoms) return '';
    
    let pdb = 'HEADER    Generated by Chem Structure Converter\n';
    pdb += 'COMPND    UNNAMED\n';
    pdb += 'AUTHOR    USER\n';
    
    molecule.atoms.forEach((atom, index) => {
      const x = (atom.x * 10).toFixed(3);
      const y = (atom.y * 10).toFixed(3);
      const z = ((atom.z || 0) * 10).toFixed(3);
      const serial = String(index + 1).padStart(5, ' ');
      const element = atom.element.padEnd(2, ' ');
      
      pdb += `ATOM  ${serial}  ${element} MOL     1    ${x.padStart(8)}${y.padStart(8)}${z.padStart(8)}  1.00  0.00           ${element.trim()}\n`;
    });
    
    if (molecule.bonds) {
      molecule.bonds.forEach((bond, index) => {
        const serial = String(index + 1).padStart(5, ' ');
        const from = String(bond.from + 1).padStart(5, ' ');
        const to = String(bond.to + 1).padStart(5, ' ');
        
        pdb += `CONECT${from}${to}\n`;
      });
    }
    
    pdb += 'END\n';
    return pdb;
  }
}
