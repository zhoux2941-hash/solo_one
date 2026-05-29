import { molecules } from './data/molecules.js';
import { Renderer2D } from './renderers/Renderer2D.js';
import { Renderer3D } from './renderers/Renderer3D.js';
import { SmilesParser } from './parsers/SmilesParser.js';

class App {
  constructor() {
    this.currentMolecule = null;
    this.currentInfo = null;
    this.renderer2D = null;
    this.renderer3D = null;
    this.smilesParser = new SmilesParser();
    this.init();
  }

  init() {
    this.setupMoleculeSelect();
    this.setupCanvas();
    this.setupEventListeners();
    this.renderer3D = new Renderer3D(document.getElementById('three-container'));
    this.renderer3D.init();
    this.renderer3D.animate();
    this.loadDefaultMolecule();
  }

  setupMoleculeSelect() {
    const select = document.getElementById('molecule-select');
    molecules.forEach(mol => {
      const option = document.createElement('option');
      option.value = mol.smiles;
      option.textContent = mol.name;
      select.appendChild(option);
    });
  }

  setupCanvas() {
    const canvas = document.getElementById('structure-canvas');
    canvas.width = 600;
    canvas.height = 400;
    this.renderer2D = new Renderer2D(canvas);
  }

  setupEventListeners() {
    document.getElementById('convert-btn').addEventListener('click', () => {
      this.convertSmiles();
    });

    document.getElementById('smiles-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.convertSmiles();
      }
    });

    document.getElementById('molecule-select').addEventListener('change', (e) => {
      const smiles = e.target.value;
      if (smiles) {
        const mol = molecules.find(m => m.smiles === smiles);
        if (mol) {
          this.loadMolecule(mol);
        }
      }
    });

    document.getElementById('mol-file').addEventListener('change', (e) => {
      this.loadMolFile(e.target.files[0]);
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    document.getElementById('export-svg').addEventListener('click', () => {
      this.exportSVG();
    });

    document.getElementById('export-pdb').addEventListener('click', () => {
      this.exportPDB();
    });
  }

  loadDefaultMolecule() {
    const defaultMolecule = molecules.find(m => m.name === '乙醇');
    if (defaultMolecule) {
      this.loadMolecule(defaultMolecule);
      document.getElementById('smiles-input').value = defaultMolecule.smiles;
    }
  }

  convertSmiles() {
    const smiles = document.getElementById('smiles-input').value.trim();
    if (!smiles) return;

    try {
      const parsed = this.smilesParser.parse(smiles);
      this.currentMolecule = parsed;
      this.currentInfo = {
        formula: this.calculateFormula(parsed),
        molecularWeight: this.calculateMolecularWeight(parsed),
        meltingPoint: '-',
        boilingPoint: '-'
      };
      this.updateDisplay();
    } catch (error) {
      console.error('SMILES parsing error:', error);
      alert('无法解析SMILES字符串，请检查输入格式');
    }
  }

  loadMolecule(mol) {
    try {
      const parsed = this.smilesParser.parse(mol.smiles);
      this.currentMolecule = parsed;
      this.currentInfo = {
        formula: mol.formula,
        molecularWeight: mol.molecularWeight,
        meltingPoint: mol.meltingPoint,
        boilingPoint: mol.boilingPoint
      };
      this.updateDisplay();
    } catch (error) {
      console.error('Loading molecule error:', error);
    }
  }

  loadMolFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = this.smilesParser.parseMolFile(content);
        this.currentMolecule = parsed;
        this.currentInfo = {
          formula: this.calculateFormula(parsed),
          molecularWeight: this.calculateMolecularWeight(parsed),
          meltingPoint: '-',
          boilingPoint: '-'
        };
        this.updateDisplay();
      } catch (error) {
        console.error('MOL file parsing error:', error);
        alert('无法解析MOL文件，请检查文件格式');
      }
    };
    reader.readAsText(file);
  }

  calculateFormula(parsed) {
    const counts = {};
    parsed.atoms.forEach(atom => {
      counts[atom.element] = (counts[atom.element] || 0) + 1;
    });

    const elements = Object.keys(counts).sort((a, b) => {
      const order = ['C', 'H', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    return elements.map(el => `${el}${counts[el] > 1 ? counts[el] : ''}`).join('');
  }

  calculateMolecularWeight(parsed) {
    const atomicWeights = {
      H: 1.008, C: 12.011, N: 14.007, O: 15.999,
      F: 18.998, Cl: 35.453, Br: 79.904, I: 126.904,
      S: 32.065, P: 30.974, B: 10.811
    };

    let weight = 0;
    parsed.atoms.forEach(atom => {
      weight += atomicWeights[atom.element] || 12.011;
    });

    return weight.toFixed(3);
  }

  updateDisplay() {
    this.renderer2D.drawMolecule(this.currentMolecule);
    this.renderer3D.drawMolecule(this.currentMolecule);

    if (this.currentInfo) {
      document.getElementById('formula').textContent = this.currentInfo.formula;
      document.getElementById('molecular-weight').textContent = this.currentInfo.molecularWeight;
      document.getElementById('melting-point').textContent = this.currentInfo.meltingPoint;
      document.getElementById('boiling-point').textContent = this.currentInfo.boilingPoint;
    }

    if (this.currentMolecule) {
      const canonicalSmiles = this.smilesParser.toCanonicalSmiles(
        this.currentMolecule.atoms,
        this.currentMolecule.bonds
      );
      const isomericSmiles = this.smilesParser.toIsomericSmiles(
        this.currentMolecule.atoms,
        this.currentMolecule.bonds
      );
      document.getElementById('canonical-smiles').value = canonicalSmiles;
      document.getElementById('isomeric-smiles').value = isomericSmiles;
    }
  }

  switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
  }

  exportSVG() {
    if (!this.currentMolecule) {
      alert('请先加载一个分子结构');
      return;
    }

    const svg = this.renderer2D.getSVG(this.currentMolecule);
    this.downloadFile(svg, 'molecule.svg', 'image/svg+xml');
  }

  exportPDB() {
    if (!this.currentMolecule) {
      alert('请先加载一个分子结构');
      return;
    }

    const pdb = this.renderer3D.getPDB(this.currentMolecule);
    this.downloadFile(pdb, 'molecule.pdb', 'text/plain');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
