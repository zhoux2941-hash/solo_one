import { Particle, Vector2D } from '@/types/physics';

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  showTrajectories: boolean
): void {
  for (const particle of particles) {
    if (showTrajectories && particle.trajectory.length > 1) {
      drawTrajectory(ctx, particle.trajectory, particle.charge);
    }

    drawParticle(ctx, particle);
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const radius = 8;

  const gradient = ctx.createRadialGradient(
    particle.x,
    particle.y,
    0,
    particle.x,
    particle.y,
    radius * 2
  );
  gradient.addColorStop(0, 'rgba(255, 107, 53, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff6b35';
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(particle.charge > 0 ? '+' : '-', particle.x, particle.y);
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  trajectory: Vector2D[],
  charge: number
): void {
  if (trajectory.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(trajectory[0].x, trajectory[0].y);

  for (let i = 1; i < trajectory.length; i++) {
    ctx.lineTo(trajectory[i].x, trajectory[i].y);
  }

  const gradient = ctx.createLinearGradient(
    trajectory[0].x,
    trajectory[0].y,
    trajectory[trajectory.length - 1].x,
    trajectory[trajectory.length - 1].y
  );
  gradient.addColorStop(0, 'rgba(255, 107, 53, 0.1)');
  gradient.addColorStop(0.7, 'rgba(255, 107, 53, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 107, 53, 0.9)');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();
}
