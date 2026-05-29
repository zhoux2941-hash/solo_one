export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bondLength = 50;
    this.atomRadius = 12;
    this.fontSize = 14;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMolecule(molecule) {
    this.clear();
    if (!molecule || !molecule.atoms || !molecule.bonds) return;

    const atoms = molecule.atoms;
    const bonds = molecule.bonds;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const minX = Math.min(...atoms.map(a => a.x));
    const maxX = Math.max(...atoms.map(a => a.x));
    const minY = Math.min(...atoms.map(a => a.y));
    const maxY = Math.max(...atoms.map(a => a.y));

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scale = Math.min((this.canvas.width - 100) / width, (this.canvas.height - 100) / height);
    const offsetX = centerX - (minX + width / 2) * scale;
    const offsetY = centerY - (minY + height / 2) * scale;

    bonds.forEach(bond => {
      const atom1 = atoms[bond.from];
      const atom2 = atoms[bond.to];
      const x1 = atom1.x * scale + offsetX;
      const y1 = atom1.y * scale + offsetY;
      const x2 = atom2.x * scale + offsetX;
      const y2 = atom2.y * scale + offsetY;

      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';

      if (bond.order === 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      } else if (bond.order === 2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const perpX = -dy * 0.05;
        const perpY = dx * 0.05;

        this.ctx.beginPath();
        this.ctx.moveTo(x1 + perpX, y1 + perpY);
        this.ctx.lineTo(x2 + perpX, y2 + perpY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x1 - perpX, y1 - perpY);
        this.ctx.lineTo(x2 - perpX, y2 - perpY);
        this.ctx.stroke();
      } else if (bond.order === 3) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const perpX = -dy * 0.07;
        const perpY = dx * 0.07;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x1 + perpX, y1 + perpY);
        this.ctx.lineTo(x2 + perpX, y2 + perpY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x1 - perpX, y1 - perpY);
        this.ctx.lineTo(x2 - perpX, y2 - perpY);
        this.ctx.stroke();
      }
    });

    atoms.forEach(atom => {
      const x = atom.x * scale + offsetX;
      const y = atom.y * scale + offsetY;

      this.ctx.beginPath();
      this.ctx.arc(x, y, this.atomRadius, 0, Math.PI * 2);
      
      const color = this.getAtomColor(atom.element);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = `${this.fontSize}px Arial`;
      this.ctx.fillStyle = atom.element === 'C' ? '#333' : '#333';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(atom.element, x, y);
    });
  }

  getAtomColor(element) {
    const colors = {
      H: '#FFFFFF',
      C: '#C0C0C0',
      N: '#0000FF',
      O: '#FF0000',
      F: '#00FF00',
      Cl: '#00FF00',
      Br: '#A00000',
      I: '#800080',
      S: '#FFFF00',
      P: '#FFA500'
    };
    return colors[element] || '#C0C0C0';
  }

  getSVG(molecule) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', this.canvas.width);
    svg.setAttribute('height', this.canvas.height);
    svg.setAttribute('xmlns', svgNS);

    const atoms = molecule.atoms;
    const bonds = molecule.bonds;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const minX = Math.min(...atoms.map(a => a.x));
    const maxX = Math.max(...atoms.map(a => a.x));
    const minY = Math.min(...atoms.map(a => a.y));
    const maxY = Math.max(...atoms.map(a => a.y));

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scale = Math.min((this.canvas.width - 100) / width, (this.canvas.height - 100) / height);
    const offsetX = centerX - (minX + width / 2) * scale;
    const offsetY = centerY - (minY + height / 2) * scale;

    bonds.forEach(bond => {
      const atom1 = atoms[bond.from];
      const atom2 = atoms[bond.to];
      const x1 = atom1.x * scale + offsetX;
      const y1 = atom1.y * scale + offsetY;
      const x2 = atom2.x * scale + offsetX;
      const y2 = atom2.y * scale + offsetY;

      if (bond.order === 1) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#333');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      } else if (bond.order === 2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const perpX = -dy * 0.05;
        const perpY = dx * 0.05;

        const line1 = document.createElementNS(svgNS, 'line');
        line1.setAttribute('x1', x1 + perpX);
        line1.setAttribute('y1', y1 + perpY);
        line1.setAttribute('x2', x2 + perpX);
        line1.setAttribute('y2', y2 + perpY);
        line1.setAttribute('stroke', '#333');
        line1.setAttribute('stroke-width', '2');
        svg.appendChild(line1);

        const line2 = document.createElementNS(svgNS, 'line');
        line2.setAttribute('x1', x1 - perpX);
        line2.setAttribute('y1', y1 - perpY);
        line2.setAttribute('x2', x2 - perpX);
        line2.setAttribute('y2', y2 - perpY);
        line2.setAttribute('stroke', '#333');
        line2.setAttribute('stroke-width', '2');
        svg.appendChild(line2);
      }
    });

    atoms.forEach(atom => {
      const x = atom.x * scale + offsetX;
      const y = atom.y * scale + offsetY;
      const color = this.getAtomColor(atom.element);

      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', this.atomRadius);
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#333');
      circle.setAttribute('stroke-width', '2');
      svg.appendChild(circle);

      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', this.fontSize);
      text.setAttribute('fill', '#333');
      text.textContent = atom.element;
      svg.appendChild(text);
    });

    return svg.outerHTML;
  }
}
