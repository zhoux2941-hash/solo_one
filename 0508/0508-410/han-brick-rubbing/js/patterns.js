const PATTERNS = {
  azureDragon: { name: '青龙', draw: drawAzureDragon },
  whiteTiger: { name: '白虎', draw: drawWhiteTiger },
  vermillionBird: { name: '朱雀', draw: drawVermillionBird },
  blackTortoise: { name: '玄武', draw: drawBlackTortoise }
};

export function getPatternList() {
  return Object.entries(PATTERNS).map(([key, val]) => ({
    key,
    name: val.name
  }));
}

export function drawPattern(ctx, patternKey, w, h) {
  const pattern = PATTERNS[patternKey];
  if (!pattern) return;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  drawBrickTexture(ctx, w, h);
  pattern.draw(ctx, w, h);
}

function drawBrickTexture(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(60,40,20,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = 10 + Math.random() * 40;
    const angle = Math.random() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function setReliefStyle(ctx, isFill = true) {
  if (isFill) {
    ctx.fillStyle = '#e8dcc8';
  }
  ctx.strokeStyle = '#e8dcc8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function setDetailStyle(ctx) {
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawScales(ctx, cx, cy, rx, ry, count, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation) ctx.rotate(rotation);
  setDetailStyle(ctx);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * rx * 0.6;
    const y = Math.sin(angle) * ry * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, Math.min(rx, ry) * 0.15, 0, Math.PI, false);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAzureDragon(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const s = Math.min(w, h) * 0.4;

  ctx.save();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.8);
  ctx.bezierCurveTo(
    cx + s * 0.3, cy - s * 1.0,
    cx + s * 0.8, cy - s * 0.6,
    cx + s * 0.6, cy - s * 0.1
  );
  ctx.bezierCurveTo(
    cx + s * 0.5, cy + s * 0.3,
    cx + s * 0.2, cy + s * 0.5,
    cx - s * 0.1, cy + s * 0.7
  );
  ctx.bezierCurveTo(
    cx - s * 0.4, cy + s * 0.9,
    cx - s * 0.8, cy + s * 0.8,
    cx - s * 0.9, cy + s * 0.5
  );
  ctx.bezierCurveTo(
    cx - s * 0.95, cy + s * 0.2,
    cx - s * 0.7, cy - s * 0.1,
    cx - s * 0.5, cy - s * 0.3
  );
  ctx.bezierCurveTo(
    cx - s * 0.4, cy - s * 0.5,
    cx - s * 0.3, cy - s * 0.7,
    cx - s * 0.1, cy - s * 0.8
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy - s * 0.85);
  ctx.bezierCurveTo(
    cx - s * 0.05, cy - s * 1.1,
    cx + s * 0.15, cy - s * 1.15,
    cx + s * 0.2, cy - s * 0.95
  );
  ctx.bezierCurveTo(
    cx + s * 0.25, cy - s * 0.85,
    cx + s * 0.15, cy - s * 0.75,
    cx + s * 0.05, cy - s * 0.78
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, cy - s * 0.9);
  ctx.lineTo(cx - s * 0.35, cy - s * 1.2);
  ctx.lineTo(cx - s * 0.25, cy - s * 1.15);
  ctx.lineTo(cx - s * 0.15, cy - s * 1.25);
  ctx.lineTo(cx - s * 0.05, cy - s * 0.95);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.05, cy - s * 0.88, s * 0.06, s * 0.04, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.15);
  ctx.bezierCurveTo(
    cx - s * 0.65, cy + s * 0.05,
    cx - s * 0.75, cy + s * 0.2,
    cx - s * 0.7, cy + s * 0.4
  );
  ctx.lineTo(cx - s * 0.6, cy + s * 0.35);
  ctx.lineTo(cx - s * 0.55, cy + s * 0.5);
  ctx.lineTo(cx - s * 0.5, cy + s * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.1, cy + s * 0.15);
  ctx.bezierCurveTo(
    cx - s * 0.05, cy + s * 0.3,
    cx - s * 0.1, cy + s * 0.45,
    cx - s * 0.05, cy + s * 0.6
  );
  ctx.lineTo(cx + s * 0.05, cy + s * 0.5);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.65);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.85, cy + s * 0.5);
  ctx.bezierCurveTo(
    cx - s * 1.05, cy + s * 0.6,
    cx - s * 1.1, cy + s * 0.4,
    cx - s * 0.95, cy + s * 0.35
  );
  ctx.bezierCurveTo(
    cx - s * 1.15, cy + s * 0.7,
    cx - s * 1.2, cy + s * 0.9,
    cx - s * 1.0, cy + s * 0.95
  );
  ctx.bezierCurveTo(
    cx - s * 0.85, cy + s * 1.0,
    cx - s * 0.75, cy + s * 0.85,
    cx - s * 0.8, cy + s * 0.7
  );
  ctx.closePath();
  ctx.fill();

  drawScales(ctx, cx + s * 0.2, cy - s * 0.3, s * 0.25, s * 0.18, 6, -0.3);
  drawScales(ctx, cx - s * 0.15, cy + s * 0.1, s * 0.2, s * 0.15, 5, 0.2);
  drawScales(ctx, cx - s * 0.4, cy + s * 0.4, s * 0.18, s * 0.12, 5, 0.1);

  setDetailStyle(ctx);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy - s * 0.8);
  ctx.bezierCurveTo(
    cx + s * 0.3, cy - s * 1.0,
    cx + s * 0.8, cy - s * 0.6,
    cx + s * 0.6, cy - s * 0.1
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.6, cy - s * 0.1);
  ctx.bezierCurveTo(
    cx + s * 0.5, cy + s * 0.3,
    cx + s * 0.2, cy + s * 0.5,
    cx - s * 0.1, cy + s * 0.7
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.07, cy - s * 0.87, s * 0.02, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();

  drawFlameDecor(ctx, cx + s * 0.55, cy - s * 0.15, s * 0.12);
  drawFlameDecor(ctx, cx - s * 0.5, cy - s * 0.2, s * 0.1);

  drawBorderFrame(ctx, w, h);
  ctx.restore();
}

function drawWhiteTiger(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const s = Math.min(w, h) * 0.38;

  ctx.save();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.6, cy - s * 0.4);
  ctx.bezierCurveTo(
    cx + s * 0.55, cy - s * 0.65,
    cx + s * 0.35, cy - s * 0.8,
    cx + s * 0.1, cy - s * 0.75
  );
  ctx.bezierCurveTo(
    cx - s * 0.1, cy - s * 0.7,
    cx - s * 0.3, cy - s * 0.55,
    cx - s * 0.5, cy - s * 0.3
  );
  ctx.bezierCurveTo(
    cx - s * 0.7, cy - s * 0.1,
    cx - s * 0.85, cy + s * 0.15,
    cx - s * 0.8, cy + s * 0.4
  );
  ctx.bezierCurveTo(
    cx - s * 0.75, cy + s * 0.65,
    cx - s * 0.5, cy + s * 0.8,
    cx - s * 0.2, cy + s * 0.75
  );
  ctx.bezierCurveTo(
    cx + s * 0.1, cy + s * 0.7,
    cx + s * 0.35, cy + s * 0.55,
    cx + s * 0.5, cy + s * 0.3
  );
  ctx.bezierCurveTo(
    cx + s * 0.6, cy + s * 0.15,
    cx + s * 0.65, cy - s * 0.1,
    cx + s * 0.6, cy - s * 0.4
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.15, cy - s * 0.7, s * 0.22, s * 0.18, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy - s * 0.78);
  ctx.bezierCurveTo(
    cx + s * 0.45, cy - s * 0.95,
    cx + s * 0.55, cy - s * 0.9,
    cx + s * 0.5, cy - s * 0.7
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.22, cy - s * 0.72, s * 0.04, s * 0.03, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy - s * 0.65);
  ctx.lineTo(cx + s * 0.45, cy - s * 0.62);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.58);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.05, cy - s * 0.05);
  ctx.bezierCurveTo(
    cx - s * 0.05, cy + s * 0.15,
    cx - s * 0.15, cy + s * 0.3,
    cx - s * 0.1, cy + s * 0.55
  );
  ctx.lineTo(cx - s * 0.02, cy + s * 0.45);
  ctx.lineTo(cx + s * 0.05, cy + s * 0.6);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.3, cy + s * 0.05);
  ctx.bezierCurveTo(
    cx + s * 0.2, cy + s * 0.2,
    cx + s * 0.15, cy + s * 0.35,
    cx + s * 0.2, cy + s * 0.55
  );
  ctx.lineTo(cx + s * 0.27, cy + s * 0.45);
  ctx.lineTo(cx + s * 0.33, cy + s * 0.58);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.75, cy + s * 0.4);
  ctx.bezierCurveTo(
    cx - s * 0.95, cy + s * 0.55,
    cx - s * 1.05, cy + s * 0.75,
    cx - s * 0.9, cy + s * 0.95
  );
  ctx.bezierCurveTo(
    cx - s * 0.8, cy + s * 1.05,
    cx - s * 0.65, cy + s * 0.9,
    cx - s * 0.6, cy + s * 0.7
  );
  ctx.closePath();
  ctx.fill();

  setDetailStyle(ctx);
  const stripes = [
    { x: cx - s * 0.2, y: cy - s * 0.35, angle: 0.5 },
    { x: cx - s * 0.35, y: cy - s * 0.15, angle: 0.4 },
    { x: cx - s * 0.45, y: cy + s * 0.1, angle: 0.3 },
    { x: cx - s * 0.4, y: cy + s * 0.3, angle: 0.2 }
  ];
  stripes.forEach(st => {
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.angle);
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.04);
    ctx.lineTo(s * 0.12, -s * 0.04);
    ctx.moveTo(-s * 0.1, s * 0.04);
    ctx.lineTo(s * 0.1, s * 0.04);
    ctx.stroke();
    ctx.restore();
  });

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.6, cy - s * 0.4);
  ctx.bezierCurveTo(
    cx + s * 0.55, cy - s * 0.65,
    cx + s * 0.35, cy - s * 0.8,
    cx + s * 0.1, cy - s * 0.75
  );
  ctx.stroke();

  drawFlameDecor(ctx, cx + s * 0.45, cy - s * 0.3, s * 0.08);
  drawFlameDecor(ctx, cx - s * 0.6, cy + s * 0.15, s * 0.08);

  drawBorderFrame(ctx, w, h);
  ctx.restore();
}

function drawVermillionBird(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const s = Math.min(w, h) * 0.38;

  ctx.save();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.15, s * 0.25, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.4, s * 0.18, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.1, cy - s * 0.58);
  ctx.bezierCurveTo(
    cx - s * 0.2, cy - s * 0.9,
    cx - s * 0.05, cy - s * 1.1,
    cx + s * 0.05, cy - s * 0.95
  );
  ctx.bezierCurveTo(
    cx + s * 0.15, cy - s * 0.85,
    cx + s * 0.1, cy - s * 0.65,
    cx + s * 0.05, cy - s * 0.58
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.05, cy - s * 0.6);
  ctx.bezierCurveTo(
    cx + s * 0.25, cy - s * 0.9,
    cx + s * 0.4, cy - s * 0.85,
    cx + s * 0.35, cy - s * 0.65
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy - s * 0.5);
  ctx.bezierCurveTo(
    cx - s * 0.25, cy - s * 0.75,
    cx - s * 0.15, cy - s * 0.85,
    cx - s * 0.05, cy - s * 0.7
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, cy - s * 0.15);
  ctx.bezierCurveTo(
    cx - s * 0.7, cy - s * 0.5,
    cx - s * 0.95, cy - s * 0.3,
    cx - s * 0.8, cy - s * 0.05
  );
  ctx.bezierCurveTo(
    cx - s * 0.7, cy + s * 0.1,
    cx - s * 0.5, cy + s * 0.05,
    cx - s * 0.3, cy + s * 0.0
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.2, cy - s * 0.15);
  ctx.bezierCurveTo(
    cx + s * 0.7, cy - s * 0.5,
    cx + s * 0.95, cy - s * 0.3,
    cx + s * 0.8, cy - s * 0.05
  );
  ctx.bezierCurveTo(
    cx + s * 0.7, cy + s * 0.1,
    cx + s * 0.5, cy + s * 0.05,
    cx + s * 0.3, cy + s * 0.0
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy + s * 0.45);
  ctx.bezierCurveTo(
    cx - s * 0.3, cy + s * 0.65,
    cx - s * 0.5, cy + s * 0.9,
    cx - s * 0.7, cy + s * 1.0
  );
  ctx.bezierCurveTo(
    cx - s * 0.6, cy + s * 0.85,
    cx - s * 0.45, cy + s * 0.7,
    cx - s * 0.35, cy + s * 0.5
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.48);
  ctx.bezierCurveTo(
    cx - s * 0.1, cy + s * 0.75,
    cx - s * 0.2, cy + s * 0.95,
    cx - s * 0.35, cy + s * 1.1
  );
  ctx.bezierCurveTo(
    cx - s * 0.15, cy + s * 0.95,
    cx - s * 0.05, cy + s * 0.75,
    cx + s * 0.05, cy + s * 0.5
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.15, cy + s * 0.45);
  ctx.bezierCurveTo(
    cx + s * 0.2, cy + s * 0.7,
    cx + s * 0.15, cy + s * 0.9,
    cx + s * 0.05, cy + s * 1.05
  );
  ctx.bezierCurveTo(
    cx + s * 0.2, cy + s * 0.85,
    cx + s * 0.25, cy + s * 0.65,
    cx + s * 0.2, cy + s * 0.48
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.06, cy - s * 0.42, s * 0.03, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.12, cy - s * 0.4);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.38);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.05, cy + s * 0.45);
  ctx.lineTo(cx - s * 0.08, cy + s * 0.7);
  ctx.lineTo(cx + s * 0.02, cy + s * 0.65);
  ctx.lineTo(cx - s * 0.02, cy + s * 0.85);
  ctx.lineTo(cx + s * 0.08, cy + s * 0.7);
  ctx.closePath();
  ctx.fill();

  setDetailStyle(ctx);
  drawFeatherLines(ctx, cx - s * 0.55, cy - s * 0.2, s * 0.4, -0.3, 5);
  drawFeatherLines(ctx, cx + s * 0.55, cy - s * 0.2, s * 0.4, 0.3, 5);

  drawBorderFrame(ctx, w, h);
  ctx.restore();
}

function drawBlackTortoise(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const s = Math.min(w, h) * 0.38;

  ctx.save();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.2, s * 0.5, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.05, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.1, cy - s * 0.35, s * 0.15, s * 0.13, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.05, cy - s * 0.45);
  ctx.lineTo(cx - s * 0.08, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.02, cy - s * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx + s * 0.15, cy - s * 0.37, s * 0.025, s * 0.02, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
  setReliefStyle(ctx);

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy + s * 0.45);
  ctx.lineTo(cx - s * 0.45, cy + s * 0.65);
  ctx.lineTo(cx - s * 0.38, cy + s * 0.6);
  ctx.lineTo(cx - s * 0.42, cy + s * 0.75);
  ctx.lineTo(cx - s * 0.32, cy + s * 0.65);
  ctx.lineTo(cx - s * 0.28, cy + s * 0.48);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.15, cy + s * 0.48);
  ctx.lineTo(cx + s * 0.2, cy + s * 0.68);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.62);
  ctx.lineTo(cx + s * 0.22, cy + s * 0.78);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.65);
  ctx.lineTo(cx + s * 0.28, cy + s * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.25, cy - s * 0.5);
  ctx.bezierCurveTo(
    cx - s * 0.5, cy - s * 0.7,
    cx - s * 0.8, cy - s * 0.6,
    cx - s * 0.85, cy - s * 0.3
  );
  ctx.bezierCurveTo(
    cx - s * 0.9, cy - s * 0.05,
    cx - s * 0.7, cy + s * 0.15,
    cx - s * 0.5, cy + s * 0.1
  );
  ctx.bezierCurveTo(
    cx - s * 0.3, cy + s * 0.05,
    cx - s * 0.2, cy - s * 0.1,
    cx - s * 0.25, cy - s * 0.25
  );
  ctx.bezierCurveTo(
    cx - s * 0.3, cy - s * 0.4,
    cx - s * 0.25, cy - s * 0.5,
    cx - s * 0.25, cy - s * 0.5
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx - s * 0.85, cy - s * 0.3, s * 0.08, s * 0.06, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.88, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.95, cy - s * 0.5);
  ctx.lineTo(cx - s * 0.85, cy - s * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(cx - s * 0.87, cy - s * 0.33, s * 0.02, s * 0.015, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3a2a1a';
  ctx.fill();
  setReliefStyle(ctx);

  setDetailStyle(ctx);

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy - s * 0.2);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.32, cy + s * 0.0);
  ctx.lineTo(cx + s * 0.32, cy + s * 0.0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.28, cy + s * 0.2);
  ctx.lineTo(cx + s * 0.28, cy + s * 0.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.15, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.15, cy + s * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.15, cy - s * 0.35);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.35);
  ctx.lineTo(cx, cy + s * 0.35);
  ctx.stroke();

  const snakeScales = [
    { x: cx - s * 0.4, y: cy - s * 0.55 },
    { x: cx - s * 0.55, y: cy - s * 0.4 },
    { x: cx - s * 0.65, y: cy - s * 0.2 },
    { x: cx - s * 0.6, y: cy + s * 0.0 }
  ];
  snakeScales.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, s * 0.04, 0, Math.PI, false);
    ctx.stroke();
  });

  drawBorderFrame(ctx, w, h);
  ctx.restore();
}

function drawFlameDecor(ctx, x, y, size) {
  ctx.save();
  setReliefStyle(ctx);
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.bezierCurveTo(
    x + size * 0.5, y - size * 0.7,
    x + size * 0.5, y + size * 0.3,
    x, y + size
  );
  ctx.bezierCurveTo(
    x - size * 0.5, y + size * 0.3,
    x - size * 0.5, y - size * 0.7,
    x, y - size
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFeatherLines(ctx, x, y, length, angle, count) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  for (let i = 0; i < count; i++) {
    const offset = (i - count / 2) * 8;
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(length, offset);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBorderFrame(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = '#e8dcc8';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, w - 24, h - 24);
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  setDetailStyle(ctx);
  ctx.lineWidth = 1;
  const cornerSize = 15;
  const corners = [
    [20, 20], [w - 20, 20],
    [20, h - 20], [w - 20, h - 20]
  ];
  corners.forEach(([cx, cy]) => {
    const dx = cx < w / 2 ? 1 : -1;
    const dy = cy < h / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerSize);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerSize, cy);
    ctx.stroke();
  });

  ctx.restore();
}
