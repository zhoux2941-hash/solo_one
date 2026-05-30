﻿import { Vector2D, MagneticField } from '@/types/physics';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export function cross3D(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function to3D(v: Vector2D, z: number = 0): Vector3D {
  return { x: v.x, y: v.y, z };
}

export function to2D(v: Vector3D): Vector2D {
  return { x: v.x, y: v.y };
}

export function calculateLorentzForce(
  velocity: Vector2D,
  electricField: Vector2D,
  magneticField: MagneticField,
  charge: number
): Vector2D {
  const B: Vector3D = {
    x: 0,
    y: 0,
    z: magneticField.direction === 'out' ? magneticField.strength : -magneticField.strength,
  };

  const v3D = to3D(velocity, 0);
  const vCrossB = cross3D(v3D, B);
  const magneticForce = to2D(vCrossB);

  const Fx = charge * (electricField.x + magneticForce.x);
  const Fy = charge * (electricField.y + magneticForce.y);

  return { x: Fx, y: Fy };
}

export function calculateMagneticFieldAtPoint(
  magneticField: MagneticField
): Vector3D {
  return {
    x: 0,
    y: 0,
    z: magneticField.direction === 'out' ? magneticField.strength : -magneticField.strength,
  };
}

export function calculateMagneticForceOnly(
  velocity: Vector2D,
  magneticField: MagneticField,
  charge: number
): Vector2D {
  const B: Vector3D = {
    x: 0,
    y: 0,
    z: magneticField.direction === 'out' ? magneticField.strength : -magneticField.strength,
  };

  const v3D = to3D(velocity, 0);
  const vCrossB = cross3D(v3D, B);

  return {
    x: charge * vCrossB.x,
    y: charge * vCrossB.y,
  };
}
