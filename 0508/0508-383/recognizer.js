const FeatureExtractor = {
  extractFeatures: (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const features = {
      pixelCount: 0,
      strokeCount: 0,
      closedLoops: 0,
      verticalStrokes: 0,
      horizontalStrokes: 0,
      diagonalStrokes: 0,
      curves: 0,
      dots: 0,
      hasTop: false,
      hasBottom: false,
      hasLeft: false,
      hasRight: false,
      symmetry: 0,
      aspectRatio: canvas.width / canvas.height,
      centerOfMass: { x: 0, y: 0 },
      holes: 0,
      endpoints: [],
      intersections: 0,
      strokeLength: 0,
      maxStrokeWidth: 0,
      minStrokeWidth: Infinity,
    };

    let pixelSumX = 0, pixelSumY = 0;
    const visited = new Array(canvas.height).fill(null).map(() => new Array(canvas.width).fill(false));

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx + 3] > 128) {
          features.pixelCount++;
          pixelSumX += x;
          pixelSumY += y;
        }
      }
    }

    if (features.pixelCount > 0) {
      features.centerOfMass = {
        x: pixelSumX / features.pixelCount,
        y: pixelSumY / features.pixelCount
      };
    }

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx + 3] > 128 && !visited[y][x]) {
          const stroke = this.traceStroke(x, y, data, canvas.width, canvas.height, visited);
          features.strokeCount++;
          features.strokeLength += stroke.length;
          
          if (stroke.length > 0) {
            const widths = this.calculateStrokeWidths(stroke, data, canvas.width);
            features.maxStrokeWidth = Math.max(features.maxStrokeWidth, ...widths);
            features.minStrokeWidth = Math.min(features.minStrokeWidth, ...widths);
          }

          if (this.isClosedLoop(stroke)) {
            features.closedLoops++;
          }

          const strokeFeatures = this.analyzeStrokeDirection(stroke);
          features.verticalStrokes += strokeFeatures.vertical;
          features.horizontalStrokes += strokeFeatures.horizontal;
          features.diagonalStrokes += strokeFeatures.diagonal;
          features.curves += strokeFeatures.curves;
        }
      }
    }

    features.hasTop = this.hasStrokeAtBorder(data, canvas.width, canvas.height, 'top');
    features.hasBottom = this.hasStrokeAtBorder(data, canvas.width, canvas.height, 'bottom');
    features.hasLeft = this.hasStrokeAtBorder(data, canvas.width, canvas.height, 'left');
    features.hasRight = this.hasStrokeAtBorder(data, canvas.width, canvas.height, 'right');

    features.symmetry = this.calculateSymmetry(data, canvas.width, canvas.height);
    features.holes = this.countHoles(data, canvas.width, canvas.height);
    features.dots = this.countDots(data, canvas.width, canvas.height);
    features.intersections = this.countIntersections(data, canvas.width, canvas.height);

    return features;
  },

  traceStroke: (startX, startY, data, width, height, visited) => {
    const stroke = [];
    const stack = [{ x: startX, y: startY }];
    const directions = [
      { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
      { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
    ];

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y][x]) continue;

      const idx = (y * width + x) * 4;
      if (data[idx + 3] <= 128) continue;

      visited[y][x] = true;
      stroke.push({ x, y });

      for (const { dx, dy } of directions) {
        stack.push({ x: x + dx, y: y + dy });
      }
    }

    return stroke;
  },

  isClosedLoop: (stroke) => {
    if (stroke.length < 10) return false;
    
    const first = stroke[0];
    const last = stroke[stroke.length - 1];
    const distance = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));
    
    return distance < 5;
  },

  analyzeStrokeDirection: (stroke) => {
    let vertical = 0, horizontal = 0, diagonal = 0, curves = 0;

    if (stroke.length < 2) return { vertical, horizontal, diagonal, curves };

    let directionChanges = 0;
    let prevAngle = null;

    for (let i = 1; i < stroke.length; i++) {
      const dx = stroke[i].x - stroke[i - 1].x;
      const dy = stroke[i].y - stroke[i - 1].y;
      
      if (dx === 0 && dy === 0) continue;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      if (prevAngle !== null) {
        const diff = Math.abs(angle - prevAngle);
        if (diff > 30 && diff < 150) {
          directionChanges++;
        }
      }
      prevAngle = angle;

      const absAngle = Math.abs(angle);
      if (absAngle < 30 || absAngle > 150) {
        vertical++;
      } else if (absAngle > 60 && absAngle < 120) {
        horizontal++;
      } else {
        diagonal++;
      }
    }

    if (directionChanges > stroke.length * 0.1) {
      curves++;
    }

    return { vertical, horizontal, diagonal, curves };
  },

  hasStrokeAtBorder: (data, width, height, border) => {
    const checkPixel = (x, y) => {
      const idx = (y * width + x) * 4;
      return data[idx + 3] > 128;
    };

    switch (border) {
      case 'top':
        for (let x = 0; x < width; x++) {
          if (checkPixel(x, 0)) return true;
        }
        break;
      case 'bottom':
        for (let x = 0; x < width; x++) {
          if (checkPixel(x, height - 1)) return true;
        }
        break;
      case 'left':
        for (let y = 0; y < height; y++) {
          if (checkPixel(0, y)) return true;
        }
        break;
      case 'right':
        for (let y = 0; y < height; y++) {
          if (checkPixel(width - 1, y)) return true;
        }
        break;
    }
    return false;
  },

  calculateSymmetry: (data, width, height) => {
    let verticalMatches = 0, horizontalMatches = 0;
    let verticalTotal = 0, horizontalTotal = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < Math.floor(width / 2); x++) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        const leftOn = data[leftIdx + 3] > 128;
        const rightOn = data[rightIdx + 3] > 128;
        
        if (leftOn || rightOn) {
          verticalTotal++;
          if (leftOn === rightOn) verticalMatches++;
        }
      }
    }

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < Math.floor(height / 2); y++) {
        const topIdx = (y * width + x) * 4;
        const bottomIdx = ((height - 1 - y) * width + x) * 4;
        const topOn = data[topIdx + 3] > 128;
        const bottomOn = data[bottomIdx + 3] > 128;
        
        if (topOn || bottomOn) {
          horizontalTotal++;
          if (topOn === bottomOn) horizontalMatches++;
        }
      }
    }

    const verticalSymmetry = verticalTotal > 0 ? verticalMatches / verticalTotal : 0;
    const horizontalSymmetry = horizontalTotal > 0 ? horizontalMatches / horizontalTotal : 0;
    
    return (verticalSymmetry + horizontalSymmetry) / 2;
  },

  countHoles: (data, width, height) => {
    const visited = new Array(height).fill(null).map(() => new Array(width).fill(false));
    let holes = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] <= 128 && !visited[y][x]) {
          const region = this.floodFill(x, y, data, width, height, visited);
          if (this.isEnclosedRegion(region, width, height, data)) {
            holes++;
          }
        }
      }
    }

    return holes;
  },

  floodFill: (startX, startY, data, width, height, visited) => {
    const region = [];
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y][x]) continue;

      const idx = (y * width + x) * 4;
      if (data[idx + 3] > 128) continue;

      visited[y][x] = true;
      region.push({ x, y });

      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    return region;
  },

  isEnclosedRegion: (region, width, height, data) => {
    for (const { x, y } of region) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        return false;
      }
    }
    return region.length > 10;
  },

  countDots: (data, width, height) => {
    const visited = new Array(height).fill(null).map(() => new Array(width).fill(false));
    let dots = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 128 && !visited[y][x]) {
          const region = this.floodFill(x, y, data, width, height, visited);
          if (region.length > 0 && region.length < 20) {
            dots++;
          }
        }
      }
    }

    return dots;
  },

  countIntersections: (data, width, height) => {
    let intersections = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] <= 128) continue;

        const neighbors = [
          data[((y - 1) * width + x) * 4 + 3] > 128,
          data[((y + 1) * width + x) * 4 + 3] > 128,
          data[(y * width + x - 1) * 4 + 3] > 128,
          data[(y * width + x + 1) * 4 + 3] > 128
        ];

        const onCount = neighbors.filter(n => n).length;
        if (onCount >= 3) {
          intersections++;
        }
      }
    }

    return intersections;
  },

  calculateStrokeWidths: (stroke, data, width) => {
    const widths = [];
    
    for (const { x, y } of stroke) {
      let widthCount = 0;
      let currentX = x;
      
      while (currentX < width) {
        const idx = (y * width + currentX) * 4;
        if (data[idx + 3] > 128) {
          widthCount++;
          currentX++;
        } else {
          break;
        }
      }
      
      if (widthCount > 0) {
        widths.push(widthCount);
      }
    }
    
    return widths;
  }
};

const TemplateMatcher = {
  match: (inputFeatures, templates) => {
    const results = [];

    for (const template of templates) {
      let score = 0;
      let maxScore = 0;

      if (inputFeatures.pixelCount === 0) {
        continue;
      }

      if (template.features.includes('closed_loop')) {
        maxScore += 1;
        score += inputFeatures.closedLoops > 0 ? 1 : 0;
      }

      if (template.features.includes('vertical_stroke')) {
        maxScore += 1;
        score += inputFeatures.verticalStrokes > 0 ? 1 : 0;
      }

      if (template.features.includes('horizontal_stroke')) {
        maxScore += 1;
        score += inputFeatures.horizontalStrokes > 0 ? 1 : 0;
      }

      if (template.features.includes('single_horizontal')) {
        maxScore += 1.5;
        score += inputFeatures.horizontalStrokes === 1 && inputFeatures.verticalStrokes === 0 ? 1.5 : 0;
      }

      if (template.features.includes('two_horizontals')) {
        maxScore += 1.5;
        score += inputFeatures.horizontalStrokes >= 2 ? 1.5 : 0;
      }

      if (template.features.includes('diagonal_stroke')) {
        maxScore += 1;
        score += inputFeatures.diagonalStrokes > 0 ? 1 : 0;
      }

      if (template.features.includes('curved_shape') || template.features.includes('curved')) {
        maxScore += 1;
        score += inputFeatures.curves > 0 ? 1 : 0;
      }

      if (template.features.includes('symmetric')) {
        maxScore += 1;
        score += inputFeatures.symmetry > 0.7 ? 1 : 0;
      }

      if (template.features.includes('dot') || template.features.includes('dot_top')) {
        maxScore += 1;
        score += inputFeatures.dots > 0 ? 1 : 0;
      }

      if (template.features.includes('cross_center')) {
        maxScore += 1.5;
        score += inputFeatures.intersections > 0 && inputFeatures.verticalStrokes > 0 && inputFeatures.horizontalStrokes > 0 ? 1.5 : 0;
      }

      if (template.features.includes('open_right')) {
        maxScore += 1;
        score += inputFeatures.hasLeft && !inputFeatures.hasRight ? 1 : 0;
      }

      if (template.features.includes('open_left')) {
        maxScore += 1;
        score += inputFeatures.hasRight && !inputFeatures.hasLeft ? 1 : 0;
      }

      if (template.features.includes('top_horizontal')) {
        maxScore += 1;
        score += inputFeatures.hasTop && inputFeatures.horizontalStrokes > 0 ? 1 : 0;
      }

      if (template.features.includes('bottom_horizontal')) {
        maxScore += 1;
        score += inputFeatures.hasBottom && inputFeatures.horizontalStrokes > 0 ? 1 : 0;
      }

      if (template.features.includes('pointed') || template.features.includes('pointed_top')) {
        maxScore += 1;
        score += inputFeatures.centerOfMass.y < canvas.height * 0.4 ? 1 : 0;
      }

      if (template.features.includes('two_closed_loops')) {
        maxScore += 2;
        score += inputFeatures.closedLoops >= 2 ? 2 : 0;
      }

      if (template.features.includes('three_horizontals')) {
        maxScore += 1.5;
        score += inputFeatures.horizontalStrokes >= 3 ? 1.5 : 0;
      }

      if (template.features.includes('two_verticals')) {
        maxScore += 1;
        score += inputFeatures.verticalStrokes >= 2 ? 1 : 0;
      }

      if (template.features.includes('small')) {
        maxScore += 0.5;
        score += inputFeatures.pixelCount < 50 ? 0.5 : 0;
      }

      if (template.features.includes('large')) {
        maxScore += 0.5;
        score += inputFeatures.pixelCount > 200 ? 0.5 : 0;
      }

      const normalizedScore = maxScore > 0 ? score / maxScore : 0;

      const sizeBonus = this.calculateSizeBonus(inputFeatures, template);
      normalizedScore += sizeBonus * 0.1;

      if (normalizedScore > 0.3) {
        results.push({
          symbol: template,
          score: Math.min(normalizedScore, 1),
          rawScore: score,
          maxScore
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, 5);
  },

  calculateSizeBonus: (features, template) => {
    const targetRatios = {
      '0': 1, '1': 0.5, '2': 1, '3': 1, '4': 0.8, '5': 1, '6': 1, '7': 0.7, '8': 1, '9': 1,
      '+': 1, '-': 0.2, '=': 0.3,
      '(': 1, ')': 1, '[': 1, ']': 1
    };

    const targetRatio = targetRatios[template.key] || 1;
    const actualRatio = features.aspectRatio;
    
    return Math.max(0, 1 - Math.abs(actualRatio - targetRatio));
  }
};

const MathExpressionParser = {
  parseSymbols: (symbolList) => {
    let latex = '';
    let prevSymbol = null;

    for (const symbol of symbolList) {
      const symbolInfo = SymbolRecognizer.getSymbolByKey(symbol);
      if (!symbolInfo) continue;

      let currentLatex = symbolInfo.latex;

      if (prevSymbol) {
        const prevInfo = SymbolRecognizer.getSymbolByKey(prevSymbol);
        
        if (prevInfo && this.needsMultiplication(prevInfo, symbolInfo)) {
          latex += ' \\cdot ';
        }
      }

      latex += currentLatex;
      prevSymbol = symbol;
    }

    return latex;
  },

  needsMultiplication: (prev, current) => {
    const prevIsLetterOrNumber = prev.category === 'letters' || prev.category === 'numbers';
    const currentIsLetterOrNumber = current.category === 'letters' || current.category === 'numbers';
    const prevIsCloseParen = prev.key === ')' || prev.key === ']' || prev.key === '}';
    const currentIsOpenParen = current.key === '(' || current.key === '[' || current.key === '{';

    return (prevIsLetterOrNumber && currentIsLetterOrNumber) ||
           (prevIsCloseParen && currentIsLetterOrNumber) ||
           (prevIsLetterOrNumber && currentIsOpenParen) ||
           (prevIsCloseParen && currentIsOpenParen);
  },

  parseWithStructure: (recognizedSymbols) => {
    let latex = '';
    let i = 0;

    while (i < recognizedSymbols.length) {
      const symbol = recognizedSymbols[i];
      const symbolInfo = SymbolRecognizer.getSymbolByKey(symbol);
      
      if (!symbolInfo) {
        i++;
        continue;
      }

      if (symbolInfo.latex.includes('{}')) {
        const innerContent = this.extractGroup(recognizedSymbols, i + 1);
        latex += symbolInfo.latex.replace('{}', `{${innerContent.latex}}`);
        i += innerContent.count + 1;
      } else {
        latex += symbolInfo.latex;
        i++;
      }
    }

    return latex;
  },

  extractGroup: (symbols, startIndex) => {
    let latex = '';
    let count = 0;
    let balance = 0;

    for (let i = startIndex; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      if (symbol === '(' || symbol === '[') {
        balance++;
      } else if (symbol === ')' || symbol === ']') {
        balance--;
        if (balance < 0) break;
      }

      const symbolInfo = SymbolRecognizer.getSymbolByKey(symbol);
      if (symbolInfo) {
        latex += symbolInfo.latex;
        count++;
      }
    }

    return { latex, count };
  }
};

const Recognizer = {
  recognize: (canvas, options = {}) => {
    const features = FeatureExtractor.extractFeatures(canvas);
    
    if (features.pixelCount === 0) {
      return {
        success: false,
        message: 'No input detected',
        results: []
      };
    }

    const allTemplates = SymbolRecognizer.getAllSymbols();
    const matches = TemplateMatcher.match(features, allTemplates);

    return {
      success: true,
      features,
      results: matches.map(m => ({
        symbol: m.symbol.key,
        latex: m.symbol.latex,
        category: m.symbol.category,
        confidence: Math.round(m.score * 100)
      }))
    };
  },

  recognizeMultiple: (strokes, options = {}) => {
    const results = [];
    
    for (const stroke of strokes) {
      const result = this.recognize(stroke.canvas);
      if (result.success && result.results.length > 0) {
        results.push(result.results[0]);
      }
    }

    const latex = MathExpressionParser.parseSymbols(results.map(r => r.symbol));
    
    return {
      success: true,
      symbols: results,
      latex,
      fullLatex: `$${latex}$`
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FeatureExtractor,
    TemplateMatcher,
    MathExpressionParser,
    Recognizer
  };
}