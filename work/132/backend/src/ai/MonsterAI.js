class MonsterAI {
  constructor() {
    this.TILE_WALL = 0;
    this.TILE_FLOOR = 1;
    this.VISION_RANGE = 6;
    this.ATTACK_RANGE = 1;
  }

  getAction(monster, player, map) {
    const distanceToPlayer = this.getManhattanDistance(monster.x, monster.y, player.x, player.y);
    
    if (distanceToPlayer <= this.ATTACK_RANGE) {
      return { type: 'attack', x: player.x, y: player.y };
    }
    
    if (distanceToPlayer <= this.VISION_RANGE) {
      if (this.hasLineOfSight(monster, player, map)) {
        return this.moveTowardsPlayer(monster, player, map);
      }
    }
    
    return this.randomMove(monster, map);
  }

  getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  hasLineOfSight(monster, player, map) {
    const dx = Math.abs(player.x - monster.x);
    const dy = Math.abs(player.y - monster.y);
    
    const sx = monster.x < player.x ? 1 : -1;
    const sy = monster.y < player.y ? 1 : -1;
    
    let err = dx - dy;
    
    let x = monster.x;
    let y = monster.y;
    
    while (x !== player.x || y !== player.y) {
      const e2 = 2 * err;
      
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
      
      if (x === player.x && y === player.y) {
        return true;
      }
      
      if (this.isWall(map, x, y)) {
        return false;
      }
    }
    
    return true;
  }

  isWall(map, x, y) {
    if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
      return true;
    }
    return map[y][x] === this.TILE_WALL;
  }

  moveTowardsPlayer(monster, player, map) {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    const currentDistance = this.getManhattanDistance(monster.x, monster.y, player.x, player.y);
    
    let bestDirection = null;
    let bestDistance = Infinity;
    
    const improvingMoves = [];
    const neutralMoves = [];
    const allValidMoves = [];
    
    for (const dir of directions) {
      const newX = monster.x + dir.dx;
      const newY = monster.y + dir.dy;
      
      if (!this.isWall(map, newX, newY)) {
        const newDistance = this.getManhattanDistance(newX, newY, player.x, player.y);
        
        allValidMoves.push({ dir, newX, newY, newDistance });
        
        if (newDistance < currentDistance) {
          improvingMoves.push({ dir, newX, newY, newDistance });
          if (newDistance < bestDistance) {
            bestDistance = newDistance;
            bestDirection = dir;
          }
        } else if (newDistance === currentDistance) {
          neutralMoves.push({ dir, newX, newY, newDistance });
        }
      }
    }
    
    if (improvingMoves.length > 0) {
      improvingMoves.sort((a, b) => a.newDistance - b.newDistance);
      const best = improvingMoves[0];
      return {
        type: 'move',
        x: best.newX,
        y: best.newY
      };
    }
    
    if (neutralMoves.length > 0) {
      const chosen = neutralMoves[Math.floor(Math.random() * neutralMoves.length)];
      return {
        type: 'move',
        x: chosen.newX,
        y: chosen.newY
      };
    }
    
    if (allValidMoves.length > 0) {
      const path = this.findPath(monster.x, monster.y, player.x, player.y, map);
      
      if (path && path.length > 0) {
        return {
          type: 'move',
          x: path[0].x,
          y: path[0].y
        };
      }
      
      if (allValidMoves.length === 1) {
        const onlyMove = allValidMoves[0];
        return {
          type: 'move',
          x: onlyMove.newX,
          y: onlyMove.newY
        };
      }
      
      allValidMoves.sort((a, b) => a.newDistance - b.newDistance);
      
      if (Math.random() < 0.7) {
        const bestAmongWorst = allValidMoves[0];
        return {
          type: 'move',
          x: bestAmongWorst.newX,
          y: bestAmongWorst.newY
        };
      } else {
        const randomMove = allValidMoves[Math.floor(Math.random() * allValidMoves.length)];
        return {
          type: 'move',
          x: randomMove.newX,
          y: randomMove.newY
        };
      }
    }
    
    return { type: 'wait' };
  }

  randomMove(monster, map) {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    const validMoves = [];
    
    for (const dir of directions) {
      const newX = monster.x + dir.dx;
      const newY = monster.y + dir.dy;
      
      if (!this.isWall(map, newX, newY)) {
        validMoves.push(dir);
      }
    }
    
    if (validMoves.length === 0 || Math.random() < 0.25) {
      return { type: 'wait' };
    }
    
    const chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    return {
      type: 'move',
      x: monster.x + chosen.dx,
      y: monster.y + chosen.dy
    };
  }

  findPath(startX, startY, targetX, targetY, map) {
    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();
    
    const width = map[0].length;
    const height = map.length;
    
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      
      if (current.x === targetX && current.y === targetY) {
        return this.reconstructPath(current);
      }
      
      closedSet.add(`${current.x},${current.y}`);
      
      const neighbors = this.getNeighbors(current.x, current.y, width, height);
      
      for (const neighbor of neighbors) {
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
          continue;
        }
        
        if (this.isWall(map, neighbor.x, neighbor.y)) {
          continue;
        }
        
        const g = current.g + 1;
        const h = this.getManhattanDistance(neighbor.x, neighbor.y, targetX, targetY);
        const f = g + h;
        
        const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
        
        if (existing) {
          if (g < existing.g) {
            existing.g = g;
            existing.f = f;
            existing.parent = current;
          }
        } else {
          openSet.push({
            x: neighbor.x,
            y: neighbor.y,
            g,
            h,
            f,
            parent: current
          });
        }
      }
    }
    
    return null;
  }

  getNeighbors(x, y, width, height) {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    
    return neighbors;
  }

  reconstructPath(node) {
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    
    return path.length > 1 ? path.slice(1) : [];
  }
}

module.exports = MonsterAI;
