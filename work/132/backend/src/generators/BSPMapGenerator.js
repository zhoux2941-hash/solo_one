class BSPNode {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = null;
    this.right = null;
    this.room = null;
  }
}

class BSPMapGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.MIN_ROOM_SIZE = 4;
    this.ROOM_MARGIN = 1;
  }

  generate() {
    const map = this.createEmptyMap();
    const root = new BSPNode(1, 1, this.width - 2, this.height - 2);
    
    this.splitNode(root, 5);
    this.createRooms(root, map);
    this.connectNodes(root, map);
    
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

  splitNode(node, depth) {
    if (depth <= 0) return;
    
    const canSplitHorizontal = node.height >= this.MIN_ROOM_SIZE * 2 + this.ROOM_MARGIN;
    const canSplitVertical = node.width >= this.MIN_ROOM_SIZE * 2 + this.ROOM_MARGIN;
    
    if (!canSplitHorizontal && !canSplitVertical) return;
    
    let splitHorizontal = false;
    
    if (canSplitHorizontal && canSplitVertical) {
      splitHorizontal = Math.random() > 0.5;
    } else if (canSplitHorizontal) {
      splitHorizontal = true;
    } else if (!canSplitVertical) {
      return;
    }
    
    if (splitHorizontal) {
      const minSplit = this.MIN_ROOM_SIZE + this.ROOM_MARGIN;
      const maxSplit = node.height - this.MIN_ROOM_SIZE - this.ROOM_MARGIN;
      const splitPoint = minSplit + Math.floor(Math.random() * (maxSplit - minSplit));
      
      node.left = new BSPNode(node.x, node.y, node.width, splitPoint);
      node.right = new BSPNode(node.x, node.y + splitPoint + this.ROOM_MARGIN, node.width, node.height - splitPoint - this.ROOM_MARGIN);
    } else {
      const minSplit = this.MIN_ROOM_SIZE + this.ROOM_MARGIN;
      const maxSplit = node.width - this.MIN_ROOM_SIZE - this.ROOM_MARGIN;
      const splitPoint = minSplit + Math.floor(Math.random() * (maxSplit - minSplit));
      
      node.left = new BSPNode(node.x, node.y, splitPoint, node.height);
      node.right = new BSPNode(node.x + splitPoint + this.ROOM_MARGIN, node.y, node.width - splitPoint - this.ROOM_MARGIN, node.height);
    }
    
    this.splitNode(node.left, depth - 1);
    this.splitNode(node.right, depth - 1);
  }

  createRooms(node, map) {
    if (!node.left && !node.right) {
      const roomWidth = Math.max(this.MIN_ROOM_SIZE, Math.floor(Math.random() * (node.width - this.MIN_ROOM_SIZE + 1)) + this.MIN_ROOM_SIZE - 1);
      const roomHeight = Math.max(this.MIN_ROOM_SIZE, Math.floor(Math.random() * (node.height - this.MIN_ROOM_SIZE + 1)) + this.MIN_ROOM_SIZE - 1);
      
      const roomX = node.x + Math.floor(Math.random() * (node.width - roomWidth + 1));
      const roomY = node.y + Math.floor(Math.random() * (node.height - roomHeight + 1));
      
      node.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        centerX: roomX + Math.floor(roomWidth / 2),
        centerY: roomY + Math.floor(roomHeight / 2)
      };
      
      this.carveRoom(node.room, map);
    } else {
      if (node.left) this.createRooms(node.left, map);
      if (node.right) this.createRooms(node.right, map);
    }
  }

  carveRoom(room, map) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          map[y][x] = 1;
        }
      }
    }
  }

  connectNodes(node, map) {
    if (node.left && node.right) {
      const leftRoom = this.getRandomRoom(node.left);
      const rightRoom = this.getRandomRoom(node.right);
      
      this.createCorridor(leftRoom, rightRoom, map);
      
      this.connectNodes(node.left, map);
      this.connectNodes(node.right, map);
    }
  }

  getRandomRoom(node) {
    if (node.room) return node.room;
    
    const rooms = [];
    if (node.left) rooms.push(this.getRandomRoom(node.left));
    if (node.right) rooms.push(this.getRandomRoom(node.right));
    
    return rooms[Math.floor(Math.random() * rooms.length)];
  }

  createCorridor(room1, room2, map) {
    let x1 = room1.centerX;
    let y1 = room1.centerY;
    let x2 = room2.centerX;
    let y2 = room2.centerY;
    
    if (Math.random() > 0.5) {
      this.createHorizontalCorridor(x1, x2, y1, map);
      this.createVerticalCorridor(y1, y2, x2, map);
    } else {
      this.createVerticalCorridor(y1, y2, x1, map);
      this.createHorizontalCorridor(x1, x2, y2, map);
    }
  }

  createHorizontalCorridor(x1, x2, y, map) {
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    
    for (let x = startX; x <= endX; x++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        map[y][x] = 1;
      }
    }
  }

  createVerticalCorridor(y1, y2, x, map) {
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);
    
    for (let y = startY; y <= endY; y++) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        map[y][x] = 1;
      }
    }
  }
}

module.exports = BSPMapGenerator;
