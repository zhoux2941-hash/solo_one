export class SmilesParser {
  constructor() {
    this.atomTable = {
      'B': { atomicNumber: 5, valence: 3 },
      'C': { atomicNumber: 6, valence: 4 },
      'N': { atomicNumber: 7, valence: 3 },
      'O': { atomicNumber: 8, valence: 2 },
      'F': { atomicNumber: 9, valence: 1 },
      'P': { atomicNumber: 15, valence: 5 },
      'S': { atomicNumber: 16, valence: 2 },
      'Cl': { atomicNumber: 17, valence: 1 },
      'Br': { atomicNumber: 35, valence: 1 },
      'I': { atomicNumber: 53, valence: 1 }
    };
    this.aromaticElements = {
      'c': 'C', 'n': 'N', 'o': 'O', 's': 'S', 'p': 'P', 'b': 'B'
    };
  }

  parse(smiles) {
    const atoms = [];
    const bonds = [];
    let pos = 0;
    let currentAtomIndex = -1;
    const branches = [];
    let bondOrder = 1;

    while (pos < smiles.length) {
      const char = smiles[pos];

      if (char === '[') {
        const endBracket = smiles.indexOf(']', pos);
        if (endBracket === -1) break;
        
        const atomStr = smiles.substring(pos + 1, endBracket);
        const element = this.extractElement(atomStr);
        atoms.push({ element, x: 0, y: 0 });
        
        if (currentAtomIndex >= 0) {
          bonds.push({ from: currentAtomIndex, to: atoms.length - 1, order: bondOrder });
        }
        currentAtomIndex = atoms.length - 1;
        pos = endBracket + 1;
        bondOrder = 1;
      } else if (char === '(') {
        branches.push({ atomIndex: currentAtomIndex, bondOrder: bondOrder });
        pos++;
        bondOrder = 1;
      } else if (char === ')') {
        if (branches.length > 0) {
          const branch = branches.pop();
          currentAtomIndex = branch.atomIndex;
          bondOrder = branch.bondOrder;
        }
        pos++;
      } else if (char === '=') {
        bondOrder = 2;
        pos++;
      } else if (char === '#') {
        bondOrder = 3;
        pos++;
      } else if (char === '.') {
        currentAtomIndex = -1;
        bondOrder = 1;
        pos++;
      } else if (char === ':') {
        bondOrder = 1.5;
        pos++;
      } else if (char >= 'A' && char <= 'Z') {
        let element = char;
        if (pos + 1 < smiles.length && smiles[pos + 1] >= 'a' && smiles[pos + 1] <= 'z') {
          element += smiles[pos + 1];
          pos++;
        }
        
        if (!this.atomTable[element]) {
          element = 'C';
        }
        
        atoms.push({ element, x: 0, y: 0, aromatic: false });
        
        if (currentAtomIndex >= 0) {
          bonds.push({ from: currentAtomIndex, to: atoms.length - 1, order: bondOrder });
        }
        currentAtomIndex = atoms.length - 1;
        pos++;
        bondOrder = 1;
      } else if (char >= 'a' && char <= 'z') {
        let lowerChar = char;
        if (pos + 1 < smiles.length && smiles[pos + 1] >= 'a' && smiles[pos + 1] <= 'z') {
          lowerChar += smiles[pos + 1];
          pos++;
        }
        
        const element = this.aromaticElements[lowerChar] || this.aromaticElements[char] || 'C';
        
        atoms.push({ element, x: 0, y: 0, aromatic: true });
        
        if (currentAtomIndex >= 0) {
          bonds.push({ from: currentAtomIndex, to: atoms.length - 1, order: bondOrder });
        }
        currentAtomIndex = atoms.length - 1;
        pos++;
        bondOrder = 1;
      } else if (char === '@') {
        const nextChar = smiles[pos + 1];
        if (nextChar === '@') {
          if (atoms.length > 0) {
            atoms[atoms.length - 1].chirality = 'S';
          }
          pos += 2;
        } else {
          if (atoms.length > 0) {
            atoms[atoms.length - 1].chirality = 'R';
          }
          pos++;
        }
      } else if (char === '%') {
        const digit1 = smiles[pos + 1];
        const digit2 = smiles[pos + 2];
        if (digit1 && digit2 && !isNaN(digit1) && !isNaN(digit2)) {
          const ringNum = parseInt(digit1 + digit2);
          if (ringNum > 9) {
            this.addRingClosure(ringNum, currentAtomIndex, atoms, bonds);
          }
          pos += 3;
        } else {
          pos++;
        }
      } else if (char >= '1' && char <= '9') {
        const ringNum = parseInt(char);
        this.addRingClosure(ringNum, currentAtomIndex, atoms, bonds);
        pos++;
      } else {
        pos++;
      }
    }

    this.calculate2DCoordinates(atoms, bonds);
    this.detectAndAssignAromaticBonds(atoms, bonds);
    this.addHydrogens(atoms, bonds);

    return { atoms, bonds };
  }

  addRingClosure(ringNum, atomIndex, atoms, bonds) {
    if (!this.ringClosures) {
      this.ringClosures = {};
    }
    if (!this.ringClosures[ringNum]) {
      this.ringClosures[ringNum] = atomIndex;
    } else {
      const from = this.ringClosures[ringNum];
      const to = atomIndex;
      if (from !== to) {
        bonds.push({ from, to, order: 1 });
      }
      delete this.ringClosures[ringNum];
    }
  }

  detectAndAssignAromaticBonds(atoms, bonds) {
    const aromaticRings = this.findAromaticRings(atoms, bonds);
    
    aromaticRings.forEach(ring => {
      this.assignAlternatingDoubleBonds(atoms, bonds, ring);
    });
  }

  findAromaticRings(atoms, bonds) {
    const rings = [];
    const visited = new Set();
    
    const graph = {};
    atoms.forEach((_, i) => {
      graph[i] = [];
    });
    bonds.forEach(b => {
      graph[b.from].push(b.to);
      graph[b.to].push(b.from);
    });

    for (let start = 0; start < atoms.length; start++) {
      if (!atoms[start].aromatic) continue;
      
      const path = [];
      const visitedInPath = new Set();
      const stack = [{ node: start, parent: -1, path: [start] }];
      
      while (stack.length > 0) {
        const { node, parent, path } = stack.pop();
        
        if (visitedInPath.has(node)) {
          const cycleStart = path.indexOf(node);
          if (cycleStart !== -1 && cycleStart < path.length - 2) {
            const cycle = path.slice(cycleStart);
            const isAromaticCycle = cycle.every(n => atoms[n].aromatic);
            if (isAromaticCycle && cycle.length >= 3) {
              const normalized = this.normalizeRing(cycle);
              const exists = rings.some(r => this.ringsEqual(normalized, this.normalizeRing(r)));
              if (!exists) {
                rings.push(cycle);
              }
            }
          }
          continue;
        }
        
        visitedInPath.add(node);
        
        for (const neighbor of graph[node]) {
          if (neighbor !== parent) {
            stack.push({ node: neighbor, parent: node, path: [...path, neighbor] });
          }
        }
      }
      
      visited.add(start);
    }
    
    return rings;
  }

  normalizeRing(ring) {
    const minIdx = ring.indexOf(Math.min(...ring));
    const rotated = [...ring.slice(minIdx), ...ring.slice(0, minIdx)];
    
    const reversed = [...rotated].reverse();
    const reversedMinIdx = reversed.indexOf(Math.min(...reversed));
    const reversedRotated = [...reversed.slice(reversedMinIdx), ...reversed.slice(0, reversedMinIdx)];
    
    const str1 = rotated.join(',');
    const str2 = reversedRotated.join(',');
    
    return str1 < str2 ? rotated : reversedRotated;
  }

  ringsEqual(ring1, ring2) {
    if (ring1.length !== ring2.length) return false;
    return ring1.every((n, i) => n === ring2[i]);
  }

  assignAlternatingDoubleBonds(atoms, bonds, ring) {
    if (ring.length % 2 !== 0) return;
    
    const ringBonds = [];
    for (let i = 0; i < ring.length; i++) {
      const from = ring[i];
      const to = ring[(i + 1) % ring.length];
      
      const bondIdx = bonds.findIndex(b => 
        (b.from === from && b.to === to) || (b.from === to && b.to === from)
      );
      
      if (bondIdx !== -1) {
        ringBonds.push({ idx: bondIdx, from, to });
      }
    }
    
    for (let i = 0; i < ringBonds.length; i += 2) {
      if (ringBonds[i]) {
        bonds[ringBonds[i].idx].order = 2;
      }
    }
  }

  extractElement(str) {
    let element = '';
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if ((c >= 'A' && c <= 'Z') || (i > 0 && c >= 'a' && c <= 'z')) {
        element += c;
      } else {
        break;
      }
    }
    return element || 'C';
  }

  calculate2DCoordinates(atoms, bonds) {
    if (atoms.length === 0) return;

    atoms[0].x = 0;
    atoms[0].y = 0;

    const visited = new Set([0]);
    const queue = [0];
    const angleStep = Math.PI / 3;

    while (queue.length > 0) {
      const current = queue.shift();
      const currentAtom = atoms[current];
      
      let bondCount = 0;
      const neighbors = bonds
        .filter(b => b.from === current || b.to === current)
        .map(b => b.from === current ? b.to : b.from)
        .filter(n => !visited.has(n));

      neighbors.forEach((neighbor, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = 1.5;
        
        atoms[neighbor].x = currentAtom.x + Math.cos(angle) * distance;
        atoms[neighbor].y = currentAtom.y + Math.sin(angle) * distance;
        
        visited.add(neighbor);
        queue.push(neighbor);
        bondCount++;
      });
    }
  }

  addHydrogens(atoms, bonds) {
    atoms.forEach((atom, index) => {
      if (atom.element === 'H') return;
      
      let bondCount = bonds.filter(b => b.from === index || b.to === index).length;
      
      if (atom.aromatic) {
        const aromaticBondCount = bonds.filter(b => 
          (b.from === index || b.to === index) && b.order === 2
        ).length;
        const singleBondCount = bondCount - aromaticBondCount;
        bondCount = singleBondCount + aromaticBondCount * 1.5;
      }
      
      const valence = this.atomTable[atom.element]?.valence || 4;
      let hydrogenCount = Math.round(valence - bondCount);
      
      if (hydrogenCount < 0) hydrogenCount = 0;
      
      if (hydrogenCount > 0) {
        for (let i = 0; i < hydrogenCount; i++) {
          const angle = (i / hydrogenCount) * Math.PI * 2;
          const distance = 0.8;
          atoms.push({
            element: 'H',
            x: atom.x + Math.cos(angle) * distance,
            y: atom.y + Math.sin(angle) * distance,
            aromatic: false
          });
          bonds.push({ from: index, to: atoms.length - 1, order: 1 });
        }
      }
    });
  }

  toCanonicalSmiles(atoms, bonds) {
    const atomOrder = this.calculateCanonicalOrder(atoms, bonds);
    return this.generateSmiles(atoms, bonds, atomOrder, false);
  }

  toIsomericSmiles(atoms, bonds) {
    const atomOrder = this.calculateCanonicalOrder(atoms, bonds);
    return this.generateSmiles(atoms, bonds, atomOrder, true);
  }

  calculateCanonicalOrder(atoms, bonds) {
    const scores = atoms.map((_, i) => this.calculateAtomScore(i, atoms, bonds));
    const indexed = scores.map((score, i) => ({ score, index: i }));
    indexed.sort((a, b) => b.score - a.score);
    return indexed.map(item => item.index);
  }

  calculateAtomScore(index, atoms, bonds) {
    const atom = atoms[index];
    let score = this.getAtomicNumber(atom.element) * 1000;
    
    const neighbors = bonds
      .filter(b => b.from === index || b.to === index)
      .map(b => b.from === index ? b.to : b.from);
    
    score += neighbors.length * 100;
    
    neighbors.forEach(n => {
      score += this.getAtomicNumber(atoms[n].element);
    });
    
    return score;
  }

  getAtomicNumber(element) {
    const numbers = { H: 1, C: 6, N: 7, O: 8, F: 9, P: 15, S: 16, Cl: 17, Br: 35, I: 53 };
    return numbers[element] || 0;
  }

  generateSmiles(atoms, bonds, atomOrder, includeIsomeric) {
    const visited = new Set();
    const result = [];
    const ringMap = {};
    let ringCount = 1;
    
    const buildSmiles = (current, parent) => {
      visited.add(current);
      
      const atom = atoms[current];
      const atomStr = this.getAtomString(atom, includeIsomeric);
      result.push(atomStr);
      
      const neighbors = bonds
        .filter(b => b.from === current || b.to === current)
        .map(b => ({
          index: b.from === current ? b.to : b.from,
          order: b.order
        }))
        .filter(n => n.index !== parent)
        .sort((a, b) => this.getAtomicNumber(atoms[a.index].element) - this.getAtomicNumber(atoms[b.index].element));
      
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        
        if (visited.has(neighbor.index)) {
          if (!ringMap[`${current}-${neighbor.index}`] && !ringMap[`${neighbor.index}-${current}`]) {
            ringMap[`${current}-${neighbor.index}`] = ringCount;
            ringMap[`${neighbor.index}-${current}`] = ringCount;
            result.push(this.getBondSymbol(neighbor.order));
            result.push(ringCount.toString());
            ringCount++;
          }
          continue;
        }
        
        result.push(this.getBondSymbol(neighbor.order));
        
        if (i > 0 || (parent !== -1 && i === 0)) {
          result.push('(');
        }
        
        buildSmiles(neighbor.index, current);
        
        if (i > 0 || (parent !== -1 && i === 0)) {
          result.push(')');
        }
      }
    };
    
    atomOrder.forEach(start => {
      if (!visited.has(start)) {
        if (visited.size > 0) {
          result.push('.');
        }
        buildSmiles(start, -1);
      }
    });
    
    return result.join('');
  }

  getAtomString(atom, includeIsomeric) {
    const element = atom.element;
    
    if (element === 'C' && !includeIsomeric && !atom.chirality && !atom.aromatic) {
      return '';
    }
    
    if (atom.aromatic) {
      const aromaticMap = { 'C': 'c', 'N': 'n', 'O': 'o', 'S': 's', 'P': 'p', 'B': 'b' };
      return aromaticMap[element] || element.toLowerCase();
    }
    
    if (includeIsomeric && atom.chirality) {
      return `[${element}@${atom.chirality === 'R' ? '' : '@'}]`;
    }
    
    if (element !== 'C') {
      return element;
    }
    
    return '';
  }

  getBondSymbol(order) {
    if (order === 1) return '';
    if (order === 2) return '=';
    if (order === 3) return '#';
    return '';
  }

  parseMolFile(content) {
    const lines = content.split('\n');
    const atoms = [];
    const bonds = [];
    
    let lineIndex = 0;
    while (lineIndex < lines.length && !lines[lineIndex].includes('V2000')) {
      lineIndex++;
    }
    lineIndex++;

    const molLine = lines[lineIndex]?.trim();
    const atomCount = parseInt(molLine?.substring(0, 3)) || 0;
    const bondCount = parseInt(molLine?.substring(3, 6)) || 0;

    lineIndex++;

    for (let i = 0; i < atomCount; i++) {
      const line = lines[lineIndex + i];
      if (!line) break;
      
      const x = parseFloat(line.substring(0, 10));
      const y = parseFloat(line.substring(10, 20));
      const z = parseFloat(line.substring(20, 30));
      let element = line.substring(31, 34).trim();
      
      if (!element) element = 'C';
      
      atoms.push({ element, x, y, z });
    }

    lineIndex += atomCount;

    for (let i = 0; i < bondCount; i++) {
      const line = lines[lineIndex + i];
      if (!line) break;
      
      const from = parseInt(line.substring(0, 3)) - 1;
      const to = parseInt(line.substring(3, 6)) - 1;
      const order = parseInt(line.substring(6, 9)) || 1;
      
      bonds.push({ from, to, order });
    }

    return { atoms, bonds };
  }
}
