import { Particle, PointCharge, MagneticField, Vector2D } from '@/types/physics';
import { calculateElectricField } from './electricField';
import { calculateLorentzForce } from './magneticField';

interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function getStateDerivative(
  state: ParticleState,
  charges: PointCharge[],
  magneticField: MagneticField,
  particleCharge: number,
  particleMass: number
): ParticleState {
  const electricField = calculateElectricField(state.x, state.y, charges);
  const velocity = { x: state.vx, y: state.vy };
  const force = calculateLorentzForce(velocity, electricField, magneticField, particleCharge);

  return {
    x: state.vx,
    y: state.vy,
    vx: force.x / particleMass,
    vy: force.y / particleMass,
  };
}

function addStates(a: ParticleState, b: ParticleState, scale: number = 1): ParticleState {
  return {
    x: a.x + b.x * scale,
    y: a.y + b.y * scale,
    vx: a.vx + b.vx * scale,
    vy: a.vy + b.vy * scale,
  };
}

export function rungeKutta4Step(
  particle: Particle,
  charges: PointCharge[],
  magneticField: MagneticField,
  dt: number
): ParticleState {
  const state: ParticleState = {
    x: particle.x,
    y: particle.y,
    vx: particle.vx,
    vy: particle.vy,
  };

  const k1 = getStateDerivative(state, charges, magneticField, particle.charge, particle.mass);
  const k2 = getStateDerivative(
    addStates(state, k1, dt / 2),
    charges,
    magneticField,
    particle.charge,
    particle.mass
  );
  const k3 = getStateDerivative(
    addStates(state, k2, dt / 2),
    charges,
    magneticField,
    particle.charge,
    particle.mass
  );
  const k4 = getStateDerivative(
    addStates(state, k3, dt),
    charges,
    magneticField,
    particle.charge,
    particle.mass
  );

  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: state.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    vx: state.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: state.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
  };
}

export function calculateKineticEnergy(particle: Particle): number {
  const speedSquared = particle.vx * particle.vx + particle.vy * particle.vy;
  return 0.5 * particle.mass * speedSquared;
}

export function calculateSpeed(particle: Particle): number {
  return Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
}
