#pragma once
#include "Simulation/Particle.h"
#include <vector>

class Constraint {
public:
    float stiffness;
    float compliance;

    Constraint() : stiffness(1.0f), compliance(0.0f) {}
    Constraint(float stiff, float comp = 0.0f) 
        : stiffness(stiff), compliance(comp) {}

    virtual ~Constraint() = default;

    virtual void project(std::vector<Particle>& particles, float dt) = 0;
    virtual float computeC(const std::vector<Particle>& particles) const = 0;
    virtual int getSize() const = 0;
};

class StretchConstraint : public Constraint {
public:
    int i, j;
    float restLength;

    StretchConstraint(int i0, int j0, float restLen, float stiff)
        : Constraint(stiff), i(i0), j(j0), restLength(restLen) {}

    void project(std::vector<Particle>& particles, float dt) override {
        Particle& p0 = particles[i];
        Particle& p1 = particles[j];

        Vec3 diff = p1.predictedPosition - p0.predictedPosition;
        float currentLength = diff.length();
        
        if (currentLength < 1e-6f) return;

        float C = currentLength - restLength;
        float wSum = p0.invMass + p1.invMass;

        if (wSum < 1e-6f) return;

        float lambda = -C / (wSum + compliance / (dt * dt));
        lambda *= stiffness;

        Vec3 correction = diff * (lambda / currentLength);
        p0.applyCorrection(correction * p0.invMass);
        p1.applyCorrection(-correction * p1.invMass);
    }

    float computeC(const std::vector<Particle>& particles) const override {
        const Particle& p0 = particles[i];
        const Particle& p1 = particles[j];
        float currentLength = (p1.predictedPosition - p0.predictedPosition).length();
        return currentLength - restLength;
    }

    int getSize() const override { return 2; }
};

class VolumeConstraint : public Constraint {
public:
    std::array<int, 4> indices;
    float restVolume;

    VolumeConstraint(int i0, int i1, int i2, int i3, float restVol, float stiff)
        : Constraint(stiff), restVolume(restVol) {
        indices[0] = i0; indices[1] = i1; indices[2] = i2; indices[3] = i3;
    }

    void project(std::vector<Particle>& particles, float dt) override {
        Particle& p0 = particles[indices[0]];
        Particle& p1 = particles[indices[1]];
        Particle& p2 = particles[indices[2]];
        Particle& p3 = particles[indices[3]];

        Vec3 x0 = p0.predictedPosition;
        Vec3 x1 = p1.predictedPosition;
        Vec3 x2 = p2.predictedPosition;
        Vec3 x3 = p3.predictedPosition;

        float currentVol = (x1 - x0).dot((x2 - x0).cross(x3 - x0)) / 6.0f;
        float C = currentVol - restVolume;

        Vec3 grad0 = (x2 - x1).cross(x3 - x1) / 6.0f;
        Vec3 grad1 = (x3 - x0).cross(x2 - x0) / 6.0f;
        Vec3 grad2 = (x1 - x0).cross(x3 - x0) / 6.0f;
        Vec3 grad3 = (x2 - x0).cross(x1 - x0) / 6.0f;

        float wSum = p0.invMass * grad0.dot(grad0) +
                     p1.invMass * grad1.dot(grad1) +
                     p2.invMass * grad2.dot(grad2) +
                     p3.invMass * grad3.dot(grad3);

        if (wSum < 1e-6f) return;

        float lambda = -C / (wSum + compliance / (dt * dt));
        lambda *= stiffness;

        p0.applyCorrection(grad0 * (lambda * p0.invMass));
        p1.applyCorrection(grad1 * (lambda * p1.invMass));
        p2.applyCorrection(grad2 * (lambda * p2.invMass));
        p3.applyCorrection(grad3 * (lambda * p3.invMass));
    }

    float computeC(const std::vector<Particle>& particles) const override {
        const Particle& p0 = particles[indices[0]];
        const Particle& p1 = particles[indices[1]];
        const Particle& p2 = particles[indices[2]];
        const Particle& p3 = particles[indices[3]];

        Vec3 x0 = p0.predictedPosition;
        Vec3 x1 = p1.predictedPosition;
        Vec3 x2 = p2.predictedPosition;
        Vec3 x3 = p3.predictedPosition;

        float currentVol = (x1 - x0).dot((x2 - x0).cross(x3 - x0)) / 6.0f;
        return currentVol - restVolume;
    }

    int getSize() const override { return 4; }
};

class BendingConstraint : public Constraint {
public:
    std::array<int, 4> indices;
    float restAngle;

    BendingConstraint(int i0, int i1, int i2, int i3, float angle, float stiff)
        : Constraint(stiff), restAngle(angle) {
        indices[0] = i0; indices[1] = i1; indices[2] = i2; indices[3] = i3;
    }

    void project(std::vector<Particle>& particles, float dt) override {
        Particle& p0 = particles[indices[0]];
        Particle& p1 = particles[indices[1]];
        Particle& p2 = particles[indices[2]];
        Particle& p3 = particles[indices[3]];

        Vec3 x0 = p0.predictedPosition;
        Vec3 x1 = p1.predictedPosition;
        Vec3 x2 = p2.predictedPosition;
        Vec3 x3 = p3.predictedPosition;

        Vec3 e0 = x1 - x0;
        Vec3 e1 = x2 - x0;
        Vec3 e2 = x3 - x0;

        Vec3 n1 = e0.cross(e1).normalized();
        Vec3 n2 = e0.cross(e2).normalized();

        float dot = n1.dot(n2);
        dot = std::max(-1.0f, std::min(1.0f, dot));
        float currentAngle = std::acos(dot);
        float C = currentAngle - restAngle;

        if (std::abs(C) < 1e-4f) return;

        Vec3 d0 = e0.cross(n2) + n1.cross(e0) * (n2.dot(n1) / n1.dot(n1));
        Vec3 d1 = e2.cross(n1) + n2.cross(e0) * (n1.dot(n2) / n2.dot(n2));
        Vec3 d2 = n1.cross(e1);
        Vec3 d3 = e0.cross(n2);

        float wSum = p0.invMass * d0.dot(d0) +
                     p1.invMass * d1.dot(d1) +
                     p2.invMass * d2.dot(d2) +
                     p3.invMass * d3.dot(d3);

        if (wSum < 1e-6f) return;

        float lambda = -C / (wSum + compliance / (dt * dt));
        lambda *= stiffness;

        p0.applyCorrection(d0 * (lambda * p0.invMass));
        p1.applyCorrection(d1 * (lambda * p1.invMass));
        p2.applyCorrection(d2 * (lambda * p2.invMass));
        p3.applyCorrection(d3 * (lambda * p3.invMass));
    }

    float computeC(const std::vector<Particle>& particles) const override {
        return 0.0f;
    }

    int getSize() const override { return 4; }
};
