export function drawVectorField(
  ctx: CanvasRenderingContext2D,
  vectors: { x: number; y: number; Ex: number; Ey: number; magnitude: number }[]
): void {
  for (const vec of vectors) {
    if (vec.magnitude < 0.01) continue;

    const scale = 20 * vec.magnitude;
    const angle = Math.atan2(vec.Ey, vec.Ex);

    const endX = vec.x + scale * Math.cos(angle);
    const endY = vec.y + scale * Math.sin(angle);

    const gradient = ctx.createLinearGradient(vec.x, vec.y, endX, endY);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
    gradient.addColorStop(1, `rgba(0, 212, 255, ${0.3 + 0.5 * vec.magnitude})`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vec.x, vec.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const arrowSize = 4 + 4 * vec.magnitude;
    const arrowAngle1 = angle + Math.PI - Math.PI / 6;
    const arrowAngle2 = angle + Math.PI + Math.PI / 6;

    ctx.fillStyle = `rgba(0, 212, 255, ${0.5 + 0.4 * vec.magnitude})`;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX + arrowSize * Math.cos(arrowAngle1),
      endY + arrowSize * Math.sin(arrowAngle1)
    );
    ctx.lineTo(
      endX + arrowSize * Math.cos(arrowAngle2),
      endY + arrowSize * Math.sin(arrowAngle2)
    );
    ctx.closePath();
    ctx.fill();
  }
}
