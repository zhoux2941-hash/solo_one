import React, { useEffect, useRef } from 'react';

const TILE_SIZE = 16;
const VIEWPORT_TILES_X = 40;
const VIEWPORT_TILES_Y = 25;
const CANVAS_WIDTH = VIEWPORT_TILES_X * TILE_SIZE;
const CANVAS_HEIGHT = VIEWPORT_TILES_Y * TILE_SIZE;

const COLORS = {
  wall: '#3a3a5a',
  wallHighlight: '#4a4a6a',
  wallShadow: '#2a2a4a',
  floor: '#5a5a7a',
  floorLight: '#6a6a8a',
  floorDark: '#4a4a6a',
  exploredWall: '#1a1a2a',
  exploredFloor: '#2a2a3a',
  player: '#4488ff',
  playerOutline: '#2266dd',
  playerGlow: 'rgba(68, 136, 255, 0.3)'
};

const TILES = {
  WALL: 0,
  FLOOR: 1
};

function GameCanvas({ gameState, playerId }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    
    const render = (timestamp) => {
      if (timestamp - lastRenderTime.current < 16) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }
      lastRenderTime.current = timestamp;

      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const { map, player, monsters, items, visibleTiles, exploredTiles } = gameState;
      
      if (!map || !player) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      const mapWidth = map[0].length;
      const mapHeight = map.length;

      const cameraX = Math.max(0, Math.min(
        player.x - Math.floor(VIEWPORT_TILES_X / 2),
        mapWidth - VIEWPORT_TILES_X
      ));
      const cameraY = Math.max(0, Math.min(
        player.y - Math.floor(VIEWPORT_TILES_Y / 2),
        mapHeight - VIEWPORT_TILES_Y
      ));

      drawMap(ctx, map, visibleTiles, exploredTiles, cameraX, cameraY);
      drawItems(ctx, items, visibleTiles, exploredTiles, cameraX, cameraY);
      drawMonsters(ctx, monsters, visibleTiles, cameraX, cameraY);
      drawPlayer(ctx, player, cameraX, cameraY, timestamp);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, playerId]);

  function drawMap(ctx, map, visibleTiles, exploredTiles, cameraX, cameraY) {
    for (let viewY = 0; viewY < VIEWPORT_TILES_Y; viewY++) {
      for (let viewX = 0; viewX < VIEWPORT_TILES_X; viewX++) {
        const mapX = cameraX + viewX;
        const mapY = cameraY + viewY;

        if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
          continue;
        }

        const tile = map[mapY][mapX];
        const isVisible = visibleTiles && visibleTiles[mapY] && visibleTiles[mapY][mapX];
        const isExplored = exploredTiles && exploredTiles[mapY] && exploredTiles[mapY][mapX];

        const screenX = viewX * TILE_SIZE;
        const screenY = viewY * TILE_SIZE;

        if (isVisible) {
          if (tile === TILES.WALL) {
            drawWall(ctx, screenX, screenY, true);
          } else {
            drawFloor(ctx, screenX, screenY, true, mapX, mapY);
          }
        } else if (isExplored) {
          if (tile === TILES.WALL) {
            drawWall(ctx, screenX, screenY, false);
          } else {
            drawFloor(ctx, screenX, screenY, false, mapX, mapY);
          }
        }
      }
    }
  }

  function drawWall(ctx, x, y, isVisible) {
    if (isVisible) {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      
      ctx.fillStyle = COLORS.wallHighlight;
      ctx.fillRect(x, y, TILE_SIZE, 2);
      ctx.fillRect(x, y, 2, TILE_SIZE);
      
      ctx.fillStyle = COLORS.wallShadow;
      ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
      ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
      
      ctx.fillStyle = COLORS.wallShadow;
      ctx.fillRect(x + 6, y + 6, 4, 4);
    } else {
      ctx.fillStyle = COLORS.exploredWall;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  function drawFloor(ctx, x, y, isVisible, tileX, tileY) {
    if (isVisible) {
      const pattern = (tileX + tileY) % 2;
      ctx.fillStyle = pattern === 0 ? COLORS.floor : COLORS.floorLight;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      if ((tileX + tileY) % 3 === 0) {
        ctx.fillRect(x + 4, y + 4, 2, 2);
      }
      if ((tileX * tileY) % 5 === 0) {
        ctx.fillRect(x + 10, y + 10, 2, 2);
      }
    } else {
      ctx.fillStyle = COLORS.exploredFloor;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  function drawPlayer(ctx, player, cameraX, cameraY, timestamp) {
    const screenX = (player.x - cameraX) * TILE_SIZE;
    const screenY = (player.y - cameraY) * TILE_SIZE;

    if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
        screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) {
      return;
    }

    const pulse = Math.sin(timestamp / 500) * 0.2 + 0.8;
    const glowSize = TILE_SIZE * pulse;

    ctx.save();
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 10 * pulse;
    
    ctx.fillStyle = COLORS.playerGlow;
    ctx.beginPath();
    ctx.arc(
      screenX + TILE_SIZE / 2,
      screenY + TILE_SIZE / 2,
      glowSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      screenX + TILE_SIZE / 2,
      screenY + TILE_SIZE / 2,
      TILE_SIZE / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(
      screenX + TILE_SIZE / 2,
      screenY + TILE_SIZE / 2,
      TILE_SIZE / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX + 5, screenY + 6, 2, 2);
    ctx.fillRect(screenX + 9, screenY + 6, 2, 2);
  }

  function drawMonsters(ctx, monsters, visibleTiles, cameraX, cameraY) {
    if (!monsters) return;

    for (const monster of monsters) {
      const isVisible = visibleTiles && visibleTiles[monster.y] && visibleTiles[monster.y][monster.x];
      
      if (!isVisible) continue;

      const screenX = (monster.x - cameraX) * TILE_SIZE;
      const screenY = (monster.y - cameraY) * TILE_SIZE;

      if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
          screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) {
        continue;
      }

      drawMonster(ctx, screenX, screenY, monster);
    }
  }

  function drawMonster(ctx, x, y, monster) {
    ctx.save();
    ctx.shadowColor = monster.color;
    ctx.shadowBlur = 5;

    ctx.fillStyle = monster.color;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;

    switch (monster.symbol) {
      case 'g':
        drawGoblin(ctx, x, y, monster.color);
        break;
      case 'o':
        drawOrc(ctx, x, y, monster.color);
        break;
      case 'T':
        drawTroll(ctx, x, y, monster.color);
        break;
      case 's':
        drawSkeleton(ctx, x, y, monster.color);
        break;
      default:
        ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    }

    const hpPercent = monster.hp / monster.maxHp;
    const barWidth = TILE_SIZE - 4;
    const barHeight = 3;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 2, y - 4, barWidth, barHeight);
    
    ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffff44' : '#ff4444';
    ctx.fillRect(x + 2, y - 4, barWidth * hpPercent, barHeight);

    ctx.restore();
  }

  function drawGoblin(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(x + 3, y + 5, 2, 4);
    ctx.fillRect(x + 11, y + 5, 2, 4);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x + 5, y + 7, 2, 2);
    ctx.fillRect(x + 9, y + 7, 2, 2);
  }

  function drawOrc(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 3, y + 4, 10, 10);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x + 5, y + 6, 3, 3);
    ctx.fillRect(x + 9, y + 6, 3, 3);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 5, y + 11, 2, 3);
    ctx.fillRect(x + 9, y + 11, 2, 3);
  }

  function drawTroll(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, y + 2, 12, 12);

    ctx.fillRect(x + 1, y + 5, 3, 6);
    ctx.fillRect(x + 12, y + 5, 3, 6);

    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x + 4, y + 4, 3, 3);
    ctx.fillRect(x + 9, y + 4, 3, 3);
  }

  function drawSkeleton(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(x + 6, y + 10, 4, 4);

    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 6, y + 5, 2, 2);
    ctx.fillRect(x + 9, y + 5, 2, 2);
  }

  function drawItems(ctx, items, visibleTiles, exploredTiles, cameraX, cameraY) {
    if (!items) return;

    for (const item of items) {
      if (item.collected) continue;

      const isVisible = visibleTiles && visibleTiles[item.y] && visibleTiles[item.y][item.x];
      const isExplored = exploredTiles && exploredTiles[item.y] && exploredTiles[item.y][item.x];
      
      if (!isVisible && !isExplored) continue;

      const screenX = (item.x - cameraX) * TILE_SIZE;
      const screenY = (item.y - cameraY) * TILE_SIZE;

      if (screenX < -TILE_SIZE || screenX > CANVAS_WIDTH ||
          screenY < -TILE_SIZE || screenY > CANVAS_HEIGHT) {
        continue;
      }

      drawItem(ctx, screenX, screenY, item, isVisible);
    }
  }

  function drawItem(ctx, x, y, item, isVisible) {
    const alpha = isVisible ? 1 : 0.5;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (isVisible) {
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 4;
    }

    ctx.fillStyle = item.color;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (item.symbol) {
      case '!':
        drawPotion(ctx, x, y, item.color);
        break;
      case '/':
        drawSword(ctx, x, y, item.color);
        break;
      case '[':
        drawShield(ctx, x, y, item.color);
        break;
      case '*':
        drawGold(ctx, x, y, item.color);
        break;
      default:
        ctx.fillText(item.symbol, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    }

    ctx.restore();
  }

  function drawPotion(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 5);
    ctx.lineTo(x + 10, y + 5);
    ctx.lineTo(x + 10, y + 7);
    ctx.lineTo(x + 11, y + 8);
    ctx.lineTo(x + 11, y + 12);
    ctx.lineTo(x + 5, y + 12);
    ctx.lineTo(x + 5, y + 8);
    ctx.lineTo(x + 6, y + 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 6, y + 3, 4, 2);
  }

  function drawSword(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    ctx.rotate(-Math.PI / 4);
    
    ctx.fillRect(-1, -7, 2, 10);
    ctx.fillRect(-4, 2, 8, 2);
    ctx.fillRect(-1, 4, 2, 3);
    
    ctx.restore();
  }

  function drawShield(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 3);
    ctx.lineTo(x + 13, y + 5);
    ctx.lineTo(x + 13, y + 10);
    ctx.lineTo(x + 8, y + 14);
    ctx.lineTo(x + 3, y + 10);
    ctx.lineTo(x + 3, y + 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 5);
    ctx.lineTo(x + 8, y + 12);
    ctx.moveTo(x + 5, y + 7);
    ctx.lineTo(x + 11, y + 7);
    ctx.stroke();
  }

  function drawGold(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="game-canvas"
      style={{
        imageRendering: 'pixelated',
        imageRendering: 'crisp-edges'
      }}
    />
  );
}

export default GameCanvas;
