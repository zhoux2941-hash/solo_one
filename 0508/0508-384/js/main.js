import { Cube } from './cube.js';
import { CubeSolver } from './solver.js';
import { RotationEngine } from './rotationEngine.js';

class CubeSimulator {
    constructor() {
        this.cube = new Cube();
        this.solver = new CubeSolver();
        this.history = [];
        this.redoStack = [];
        this.scrambleSteps = 0;
        this.rotationEngine = null;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubeGroup = null;
        this.faceColors = {
            'W': 0xFFFFFF,
            'Y': 0xFFFF00,
            'O': 0xFF8C00,
            'R': 0xFF0000,
            'G': 0x00FF00,
            'B': 0x0000FF
        };
        
        this.mouseDown = false;
        this.mouseStart = { x: 0, y: 0 };
        this.rotation = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.createCube();
        this.rotationEngine = new RotationEngine(this.cubeGroup);
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }
    
    setupScene() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 6;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, -5, -5);
        this.scene.add(directionalLight2);
    }
    
    createCube() {
        this.cubeGroup = new THREE.Group();
        const size = 0.92;
        const gap = 0.04;
        
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const geometry = new THREE.BoxGeometry(size, size, size);
                    const materials = this.createMaterials(x, y, z);
                    const cube = new THREE.Mesh(geometry, materials);
                    cube.position.set(
                        x * (size + gap),
                        y * (size + gap),
                        z * (size + gap)
                    );
                    cube.userData = { x, y, z };
                    this.cubeGroup.add(cube);
                }
            }
        }
        
        this.scene.add(this.cubeGroup);
    }
    
    createMaterials(x, y, z) {
        const faceColors = [];
        
        if (x === 1) faceColors.push(this.cube.faces.R[1 - y][1 + z]);
        else if (x === -1) faceColors.push(this.cube.faces.L[1 - y][1 - z]);
        else faceColors.push('W');
        
        if (x === -1) faceColors.push(this.cube.faces.R[1 - y][1 + z]);
        else if (x === 1) faceColors.push(this.cube.faces.L[1 - y][1 - z]);
        else faceColors.push('W');
        
        if (y === 1) faceColors.push(this.cube.faces.U[1 - z][1 - x]);
        else if (y === -1) faceColors.push(this.cube.faces.D[z + 1][1 - x]);
        else faceColors.push('W');
        
        if (y === -1) faceColors.push(this.cube.faces.U[1 - z][1 - x]);
        else if (y === 1) faceColors.push(this.cube.faces.D[z + 1][1 - x]);
        else faceColors.push('W');
        
        if (z === 1) faceColors.push(this.cube.faces.F[1 - y][1 - x]);
        else if (z === -1) faceColors.push(this.cube.faces.B[1 - y][x + 1]);
        else faceColors.push('W');
        
        if (z === -1) faceColors.push(this.cube.faces.F[1 - y][1 - x]);
        else if (z === 1) faceColors.push(this.cube.faces.B[1 - y][x + 1]);
        else faceColors.push('W');
        
        return faceColors.map(color => {
            const mat = new THREE.MeshStandardMaterial({
                color: this.faceColors[color],
                roughness: 0.3,
                metalness: 0.1
            });
            return mat;
        });
    }
    
    updateCubeDisplay() {
        this.cubeGroup.children.forEach(cube => {
            const { x, y, z } = cube.userData;
            const materials = this.createMaterials(x, y, z);
            cube.material = materials;
        });
    }
    
    executeMove(move) {
        if (this.rotationEngine.isBusy()) return;
        
        this.cube.executeMove(move);
        
        this.rotationEngine.rotate(move, () => {
            this.updateCubeDisplay();
        });
        
        this.history.push(move);
        this.redoStack = [];
        this.solver.clearQueue();
        this.updateHistoryUI();
        this.updateUndoRedoButtons();
        this.updateStepStats();
    }
    
    undo() {
        if (this.history.length === 0 || this.rotationEngine.isBusy()) return;
        
        const lastMove = this.history.pop();
        const oppositeMove = this.getOppositeMove(lastMove);
        
        this.redoStack.push(lastMove);
        
        this.cube.executeMove(oppositeMove);
        this.rotationEngine.rotate(oppositeMove, () => {
            this.updateCubeDisplay();
            this.updateHistoryUI();
            this.updateUndoRedoButtons();
            this.updateStepStats();
        });
    }
    
    redo() {
        if (this.redoStack.length === 0 || this.rotationEngine.isBusy()) return;
        
        const move = this.redoStack.pop();
        
        this.cube.executeMove(move);
        this.rotationEngine.rotate(move, () => {
            this.updateCubeDisplay();
            this.history.push(move);
            this.updateHistoryUI();
            this.updateUndoRedoButtons();
            this.updateStepStats();
        });
    }
    
    getOppositeMove(move) {
        const opposites = {
            'U': 'U\'', 'U\'': 'U',
            'D': 'D\'', 'D\'': 'D',
            'L': 'L\'', 'L\'': 'L',
            'R': 'R\'', 'R\'': 'R',
            'F': 'F\'', 'F\'': 'F',
            'B': 'B\'', 'B\'': 'B'
        };
        return opposites[move] || move;
    }
    
    reset() {
        if (this.rotationEngine.isBusy()) return;
        
        this.cube = new Cube();
        this.history = [];
        this.redoStack = [];
        this.scrambleSteps = 0;
        this.solver.clearQueue();
        
        this.cubeGroup.rotation.set(0, 0, 0);
        this.rotation = { x: 0, y: 0 };
        
        const size = 0.92;
        const gap = 0.04;
        this.cubeGroup.children.forEach((cube, i) => {
            const x = ((i % 3) - 1);
            const y = (Math.floor(i / 9) - 1);
            const z = (Math.floor((i % 9) / 3) - 1);
            cube.position.set(
                x * (size + gap),
                y * (size + gap),
                z * (size + gap)
            );
            cube.rotation.set(0, 0, 0);
            cube.userData = { x, y, z };
        });
        
        this.updateCubeDisplay();
        this.updateHistoryUI();
        this.updateUndoRedoButtons();
        this.updateStepStats();
        document.getElementById('hint-box').style.display = 'none';
    }
    
    scramble() {
        if (this.rotationEngine.isBusy()) return;
        
        const scrambleBtn = document.getElementById('scramble-btn');
        scrambleBtn.disabled = true;
        
        this.reset();
        
        const moves = this.solver.scramble(this.cube, 50);
        this.scrambleSteps = moves.length;
        
        let index = 0;
        const animateScramble = () => {
            if (index >= moves.length) {
                this.updateCubeDisplay();
                this.updateHistoryUI();
                this.updateUndoRedoButtons();
                this.updateStepStats();
                scrambleBtn.disabled = false;
                return;
            }
            
            const move = moves[index];
            this.cube.executeMove(move);
            
            this.rotationEngine.rotate(move, () => {
                this.updateCubeDisplay();
                index++;
                setTimeout(animateScramble, 50);
            });
        };
        
        setTimeout(animateScramble, 200);
    }
    
    getHint() {
        if (this.cube.isSolved()) {
            document.getElementById('hint-text').textContent = '魔方已复原！';
            document.getElementById('hint-box').style.display = 'block';
            return;
        }
        
        if (this.solver.getQueueLength() === 0) {
            this.solver.precomputeSolution(this.cube);
        }
        
        const nextMove = this.solver.peekNextFromQueue();
        const queueLength = this.solver.getQueueLength();
        
        const hintBox = document.getElementById('hint-box');
        const hintText = document.getElementById('hint-text');
        
        if (nextMove) {
            hintText.textContent = `下一步: ${nextMove} (还剩 ${queueLength} 步)`;
            hintBox.style.display = 'block';
        } else {
            hintText.textContent = '无法计算解法';
            hintBox.style.display = 'block';
        }
    }
    
    applyHint() {
        if (this.solver.getQueueLength() === 0) {
            this.solver.precomputeSolution(this.cube);
        }
        
        const nextMove = this.solver.getNextFromQueue();
        if (nextMove) {
            this.executeMove(nextMove);
            this.getHint();
        }
    }
    
    updateHistoryUI() {
        const historyList = document.getElementById('history-list');
        const historyCount = document.getElementById('history-count');
        
        historyList.innerHTML = '';
        
        this.history.forEach((move, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `<span class="history-step">${move}</span><span>${index + 1}</span>`;
            historyList.appendChild(item);
        });
        
        historyCount.textContent = `共 ${this.history.length} 步`;
        historyList.scrollTop = historyList.scrollHeight;
    }
    
    updateUndoRedoButtons() {
        const isBusy = this.rotationEngine.isBusy();
        document.getElementById('undo-btn').disabled = this.history.length === 0 || isBusy;
        document.getElementById('redo-btn').disabled = this.redoStack.length === 0 || isBusy;
    }
    
    updateStepStats() {
        const currentSteps = this.history.length;
        document.getElementById('current-steps').textContent = currentSteps;
        
        const state = this.solver.analyzeState(this.cube);
        const stageNames = ['底十字', '底层角', '中层', '顶十字', '顶角', '调棱', '完成'];
        const stageSteps = [8, 12, 18, 22, 28, 36, 0];
        
        if (state.solved) {
            document.getElementById('optimal-steps').textContent = '完成';
            document.getElementById('stage-info').textContent = '完成';
        } else {
            const currentStage = state.stage;
            const estimatedOptimal = stageSteps[currentStage];
            document.getElementById('optimal-steps').textContent = estimatedOptimal;
            document.getElementById('stage-info').textContent = stageNames[currentStage];
        }
    }
    
    setupControls() {
        const layerButtons = document.querySelectorAll('.layer-btn');
        layerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const move = btn.dataset.layer;
                this.executeMove(move);
            });
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('scramble-btn').addEventListener('click', () => this.scramble());
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.getHint();
            setTimeout(() => this.applyHint(), 500);
        });
    }
    
    setupEventListeners() {
        const container = document.getElementById('canvas-container');
        
        container.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseStart = { x: e.clientX, y: e.clientY };
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!this.mouseDown) return;
            
            const deltaX = e.clientX - this.mouseStart.x;
            const deltaY = e.clientY - this.mouseStart.y;
            
            this.rotation.y += deltaX * 0.01;
            this.rotation.x += deltaY * 0.01;
            
            this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            
            this.cubeGroup.rotation.x = this.rotation.x;
            this.cubeGroup.rotation.y = this.rotation.y;
            
            this.mouseStart = { x: e.clientX, y: e.clientY };
        });
        
        container.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        container.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });
        
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.001;
            this.camera.position.z += e.deltaY * zoomSpeed * this.camera.position.z;
            this.camera.position.z = Math.max(3, Math.min(10, this.camera.position.z));
        });
        
        window.addEventListener('resize', () => {
            const container = document.getElementById('canvas-container');
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CubeSimulator();
});