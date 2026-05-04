class RandomWalkMapGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.MAX_STEPS = 1000;
    this.MIN_FLOOR_TILES = 500;
  }

  generate() {
    const map = this.createEmptyMap();
    const floorCount = this.randomWalkFill(map);
    
    if (floorCount < this.MIN_FLOOR_TILES) {
      return this.generate();
    }
    
    this.removeDeadEnds(map);
    
    return map;
  }

  createEmptyMap() {
    const map = [];
    for (let y = 0; y < this.height; y++) {
      map[y] = [];
      for (let x = 0; x < this.width; x++) {
        map[y][x] = 0;
      }
    }
    return map;
  }

  randomWalkFill(map) {
    let x = Math.floor(this.width / 2);
    let y = Math.floor(this.height / 2);
    let floorCount = 0;
    
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    let currentDirection = directions[Math.floor(Math.random() * 4)];
    let stepsWithoutChange = 0;
    
    for (let step = 0; step < this.MAX_STEPS; step++) {
      this.setFloor(map, x, y);
      floorCount++;
      
      for (let i = 0; i < 2; i++) {
        this.setFloor(map, x + Math.floor(Math.random() * 3) - 1, y + Math.floor(Math.random() * 3) - 1);
      }
      
      stepsWithoutChange++;
      
      if (stepsWithoutChange > 5 || Math.random() < 0.3) {
        currentDirection = directions[Math.floor(Math.random() * 4)];
        stepsWithoutChange = 0;
      }
      
      const newX = x + currentDirection.dx;
      const newY = y + currentDirection.dy;
      
      if (newX > 1 && newX < this.width - 2) {
        x = newX;
      }
      
      if (newY > 1 && newY < this.height - 2) {
        y = newY;
      }
    }
    
    return floorCount;
  }

  setFloor(map, x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      if (map[y][x] === 0) {
        map[y][x] = 1;
      }
    }
  }

  removeDeadEnds(map) {
    const newMap = this.createEmptyMap();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        newMap[y][x] = map[y][x];
      }
    }
    
    for (let iteration = 0; iteration < 3; iteration++) {
      const toRemove = [];
      
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (newMap[y][x] === 1) {
            const wallCount = this.countAdjacentWalls(newMap, x, y);
            if (wallCount >= 3) {
              toRemove.push({ x, y });
            }
          }
        }
      }
      
      for (const pos of toRemove) {
        newMap[pos.y][pos.x] = 0;
      }
    }
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        map[y][x] = newMap[y][x];
      }
    }
  }

  countAdjacentWalls(map, x, y) {
    let count = 0;
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || map[ny][nx] === 0) {
        count++;
      }
    }
    
    return count;
  }
}

module.exports = RandomWalkMapGenerator;
