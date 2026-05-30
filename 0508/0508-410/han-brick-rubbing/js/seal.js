const SEAL_STYLES = [
  { key: 'square', name: '方印', draw: drawSquareSeal },
  { key: 'round', name: '圆印', draw: drawRoundSeal },
  { key: 'oval', name: '椭圆印', draw: drawOvalSeal }
];

export function getSealStyles() {
  return SEAL_STYLES.map(s => ({ key: s.key, name: s.name }));
}

export function drawInscription(ctx, text, x, y, options = {}) {
  const {
    fontSize = 18,
    color = '#2a1a0a',
    vertical = true,
    fontFamily = 'KaiTi, STKaiti, SimSun, STSong, "Microsoft YaHei", "Microsoft JhengHei", "PingFang SC", "PingFang TC", "Noto Serif CJK SC", "Noto Serif CJK TC", serif'
  } = options;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (vertical) {
    const chars = text.split('');
    const charSpacing = fontSize * 1.3;
    chars.forEach((char, i) => {
      ctx.fillText(char, x, y + i * charSpacing);
    });
  } else {
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

export function drawSeal(ctx, styleKey, x, y, text, size = 50) {
  const style = SEAL_STYLES.find(s => s.key === styleKey);
  if (!style) return;
  style.draw(ctx, x, y, text, size);
}

function drawSquareSeal(ctx, x, y, text, size) {
  ctx.save();
  ctx.translate(x, y);

  const half = size / 2;

  ctx.fillStyle = 'rgba(200,30,20,0.85)';
  ctx.fillRect(-half, -half, size, size);

  ctx.strokeStyle = 'rgba(180,20,15,0.6)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-half + 3, -half + 3, size - 6, size - 6);

  ctx.fillStyle = '#f5e6c8';
  ctx.font = `bold ${size * 0.35}px SimSun, STSong, "Microsoft YaHei", "Microsoft JhengHei", "PingFang SC", "PingFang TC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.slice(0, 4).split('');
  const positions = getSquarePositions(chars.length, half);
  positions.forEach((pos, i) => {
    if (chars[i]) {
      ctx.fillText(chars[i], pos.x, pos.y);
    }
  });

  addSealTexture(ctx, -half, -half, size, size);
  ctx.restore();
}

function drawRoundSeal(ctx, x, y, text, size) {
  ctx.save();
  ctx.translate(x, y);

  const radius = size / 2;

  ctx.fillStyle = 'rgba(200,30,20,0.85)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(180,20,15,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f5e6c8';
  ctx.font = `bold ${size * 0.3}px SimSun, STSong, "Microsoft YaHei", "Microsoft JhengHei", "PingFang SC", "PingFang TC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.slice(0, 4).split('');
  if (chars.length <= 2) {
    chars.forEach((char, i) => {
      ctx.fillText(char, 0, (i - (chars.length - 1) / 2) * size * 0.35);
    });
  } else {
    const positions = getSquarePositions(chars.length, radius * 0.7);
    positions.forEach((pos, i) => {
      if (chars[i]) {
        ctx.fillText(chars[i], pos.x, pos.y);
      }
    });
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.clip();
  addSealTexture(ctx, -radius, -radius, size, size);
  ctx.restore();
}

function drawOvalSeal(ctx, x, y, text, size) {
  ctx.save();
  ctx.translate(x, y);

  const rx = size / 2;
  const ry = size / 3;

  ctx.fillStyle = 'rgba(200,30,20,0.85)';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(180,20,15,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 3, ry - 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f5e6c8';
  ctx.font = `bold ${size * 0.22}px SimSun, STSong, "Microsoft YaHei", "Microsoft JhengHei", "PingFang SC", "PingFang TC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = text.slice(0, 6).split('');
  if (chars.length <= 3) {
    chars.forEach((char, i) => {
      ctx.fillText(char, 0, (i - (chars.length - 1) / 2) * size * 0.25);
    });
  } else {
    const row1 = chars.slice(0, Math.ceil(chars.length / 2));
    const row2 = chars.slice(Math.ceil(chars.length / 2));
    row1.forEach((char, i) => {
      ctx.fillText(char, (i - (row1.length - 1) / 2) * size * 0.25, -size * 0.1);
    });
    row2.forEach((char, i) => {
      ctx.fillText(char, (i - (row2.length - 1) / 2) * size * 0.25, size * 0.15);
    });
  }

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  addSealTexture(ctx, -rx, -ry, size, size * 0.7);
  ctx.restore();
}

function getSquarePositions(count, half) {
  if (count === 1) return [{ x: 0, y: 0 }];
  if (count === 2) return [{ x: -half * 0.35, y: -half * 0.3 }, { x: half * 0.35, y: half * 0.3 }];
  if (count === 3) return [
    { x: -half * 0.35, y: -half * 0.4 },
    { x: half * 0.35, y: 0 },
    { x: -half * 0.35, y: half * 0.4 }
  ];
  return [
    { x: -half * 0.35, y: -half * 0.35 },
    { x: half * 0.35, y: -half * 0.35 },
    { x: -half * 0.35, y: half * 0.35 },
    { x: half * 0.35, y: half * 0.35 }
  ];
}

function addSealTexture(ctx, x, y, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 80; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const alpha = 0.05 + Math.random() * 0.15;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(px, py, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  ctx.restore();
}
