#pragma once
#include "Math/Vec3.h"

class Particle {
public:
    Vec3 position;
    Vec3 predictedPosition;
    Vec3 velocity;
    float mass;
    float invMass;
    bool fixed;

    Particle() : position(Vec3::zero()), predictedPosition(Vec3::zero()),
                velocity(Vec3::zero()), mass(1.0f), invMass(1.0f), fixed(false) {}

    Particle(const Vec3& pos, float m = 1.0f)
        : position(pos), predictedPosition(pos), velocity(Vec3::zero()),
          mass(m), fixed(false) {
        invMass = (m > 0.0f) ? (1.0f / m) : 0.0f;
    }

    void setMass(float m) {
        mass = m;
        invMass = (m > 0.0f && !fixed) ? (1.0f / m) : 0.0f;
    }

    void setFixed(bool f) {
        fixed = f;
        if (fixed) {
            invMass = 0.0f;
            velocity = Vec3::zero();
        } else {
            invMass = (mass > 0.0f) ? (1.0f / mass) : 0.0f;
        }
    }

    void integrateExplicit(float dt, const Vec3& gravity) {
        if (fixed) return;
        velocity += gravity * dt;
        predictedPosition = position + velocity * dt;
    }

    void updateVelocity(float damping) {
        if (fixed) return;
        velocity = (predictedPosition - position) * damping;
        position = predictedPosition;
    }

    void applyCorrection(const Vec3& correction) {
        if (fixed) return;
        predictedPosition += correction;
    }
};
