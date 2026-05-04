class FOVCalculator {
  constructor() {
    this.TILE_WALL = 0;
    this.TILE_FLOOR = 1;
  }

  calculateFOV(map, playerX, playerY, radius) {
    const width = map[0].length;
    const height = map.length;
    const visible = this.createVisibilityMap(width, height);
    
    visible[playerY][playerX] = true;
    
    for (let octant = 0; octant < 8; octant++) {
      this.castLight(map, visible, playerX, playerY, radius, octant);
    }
    
    return visible;
  }

  createVisibilityMap(width, height) {
    const visible = [];
    for (let y = 0; y < height; y++) {
      visible[y] = [];
      for (let x = 0; x < width; x++) {
        visible[y][x] = false;
      }
    }
    return visible;
  }

  castLight(map, visible, startX, startY, radius, octant) {
    const rowTranslations = [
      { xx: 1, xy: 0, yx: 0, yy: 1 },
      { xx: 1, xy: 0, yx: 0, yy: -1 },
      { xx: -1, xy: 0, yx: 0, yy: 1 },
      { xx: -1, xy: 0, yx: 0, yy: -1 },
      { xx: 0, xy: 1, yx: 1, yy: 0 },
      { xx: 0, xy: -1, yx: 1, yy: 0 },
      { xx: 0, xy: 1, yx: -1, yy: 0 },
      { xx: 0, xy: -1, yx: -1, yy: 0 }
    ];
    
    const { xx, xy, yx, yy } = rowTranslations[octant];
    
    let slopes = [];
    slopes.push({ start: 0, end: 0, blocked: false });
    
    for (let row = 1; row <= radius; row++) {
      const newSlopes = [];
      
      for (let column = -row; column <= 0; column++) {
        const currentX = startX + column * xx + row * xy;
        const currentY = startY + column * yx + row * yy;
        
        const leftSlope = (column - 0.5) / (row + 0.5);
        const rightSlope = (column + 0.5) / (row - 0.5);
        
        const distance = Math.sqrt(column * column + row * row);
        const isInRadius = distance <= radius;
        
        const isBlocked = this.isWall(map, currentX, currentY);
        
        if (isInRadius) {
          visible[currentY][currentX] = true;
        }
        
        if (isBlocked) {
          this.addSlope(newSlopes, rightSlope, leftSlope, true);
        } else {
          this.addSlope(newSlopes, rightSlope, leftSlope, false);
        }
      }
      
      slopes = newSlopes;
    }
  }

  isWall(map, x, y) {
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
      return true;
    }
    return map[y][x] === this.TILE_WALL;
  }

  addSlope(slopes, start, end, blocked) {
    if (slopes.length === 0) {
      slopes.push({ start, end, blocked });
      return;
    }
    
    const lastSlope = slopes[slopes.length - 1];
    
    if (lastSlope.blocked === blocked) {
      lastSlope.start = Math.min(lastSlope.start, start);
      lastSlope.end = Math.max(lastSlope.end, end);
    } else {
      slopes.push({ start, end, blocked });
    }
  }

  calculateSimpleFOV(map, playerX, playerY, radius) {
    const width = map[0].length;
    const height = map.length;
    const visible = this.createVisibilityMap(width, height);
    
    for (let angle = 0; angle < 360; angle += 0.5) {
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      
      let x = playerX;
      let y = playerY;
      
      for (let distance = 0; distance < radius; distance++) {
        const ix = Math.round(x);
        const iy = Math.round(y);
        
        if (ix < 0 || ix >= width || iy < 0 || iy >= height) {
          break;
        }
        
        visible[iy][ix] = true;
        
        if (map[iy][ix] === this.TILE_WALL) {
          break;
        }
        
        x += dx;
        y += dy;
      }
    }
    
    return visible;
  }

  isInFOV(visible, x, y) {
    if (!visible[y]) return false;
    return visible[y][x] === true;
  }
}

module.exports = FOVCalculator;
