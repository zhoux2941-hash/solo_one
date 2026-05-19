#pragma once
#include "Math/Vec3.h"
#include <vector>

struct Collider {
    virtual ~Collider() = default;
    virtual bool detectCollision(const Vec3& point, Vec3& normal, float& depth) const = 0;
    virtual void resolveCollision(Vec3& position, Vec3& velocity, float invMass) const = 0;
};

class PlaneCollider : public Collider {
public:
    Vec3 normal;
    float distance;
    float restitution;
    float friction;

    PlaneCollider() : normal(Vec3::up()), distance(0.0f), restitution(0.3f), friction(0.5f) {}
    PlaneCollider(const Vec3& n, float d) : normal(n.normalized()), distance(d), restitution(0.3f), friction(0.5f) {}

    bool detectCollision(const Vec3& point, Vec3& outNormal, float& outDepth) const override {
        float dist = point.dot(normal) - distance;
        if (dist < 0.0f) {
            outNormal = normal;
            outDepth = -dist;
            return true;
        }
        return false;
    }

    void resolveCollision(Vec3& position, Vec3& velocity, float invMass) const override {
        Vec3 n;
        float depth;
        if (detectCollision(position, n, depth)) {
            position += n * depth;
            
            float vn = velocity.dot(n);
            if (vn < 0.0f) {
                Vec3 vt = velocity - n * vn;
                velocity = n * (-vn * restitution) + vt * (1.0f - friction);
            }
        }
    }
};

class SphereCollider : public Collider {
public:
    Vec3 center;
    float radius;
    float restitution;

    SphereCollider() : center(Vec3::zero()), radius(1.0f), restitution(0.3f) {}
    SphereCollider(const Vec3& c, float r) : center(c), radius(r), restitution(0.3f) {}

    bool detectCollision(const Vec3& point, Vec3& outNormal, float& outDepth) const override {
        Vec3 diff = point - center;
        float dist = diff.length();
        if (dist < radius && dist > 1e-6f) {
            outNormal = diff / dist;
            outDepth = radius - dist;
            return true;
        }
        return false;
    }

    void resolveCollision(Vec3& position, Vec3& velocity, float invMass) const override {
        Vec3 n;
        float depth;
        if (detectCollision(position, n, depth)) {
            position += n * depth;
            
            float vn = velocity.dot(n);
            if (vn < 0.0f) {
                velocity -= n * vn * (1.0f + restitution);
            }
        }
    }
};

class BoxCollider : public Collider {
public:
    Vec3 center;
    Vec3 halfExtents;
    float restitution;

    BoxCollider() : center(Vec3::zero()), halfExtents(Vec3::one() * 0.5f), restitution(0.3f) {}
    BoxCollider(const Vec3& c, const Vec3& he) : center(c), halfExtents(he), restitution(0.3f) {}

    bool detectCollision(const Vec3& point, Vec3& outNormal, float& outDepth) const override {
        Vec3 local = point - center;
        Vec3 dist;
        bool inside = true;

        for (int i = 0; i < 3; i++) {
            float* d = &dist.x + i;
            float* l = &local.x + i;
            float* he = &halfExtents.x + i;
            
            if (*l > *he) {
                *d = *l - *he;
                inside = false;
            } else if (*l < -*he) {
                *d = *l + *he;
                inside = false;
            } else {
                float d1 = *he - *l;
                float d2 = *he + *l;
                *d = (d1 < d2) ? -d1 : d2;
            }
        }

        if (!inside) return false;

        float minAbs = std::abs(dist.x);
        int minAxis = 0;
        if (std::abs(dist.y) < minAbs) {
            minAbs = std::abs(dist.y);
            minAxis = 1;
        }
        if (std::abs(dist.z) < minAbs) {
            minAbs = std::abs(dist.z);
            minAxis = 2;
        }

        outNormal = Vec3::zero();
        (&outNormal.x)[minAxis] = (&dist.x)[minAxis] > 0 ? 1.0f : -1.0f;
        outDepth = minAbs;
        return true;
    }

    void resolveCollision(Vec3& position, Vec3& velocity, float invMass) const override {
        Vec3 n;
        float depth;
        if (detectCollision(position, n, depth)) {
            position += n * depth;
            
            float vn = velocity.dot(n);
            if (vn < 0.0f) {
                velocity -= n * vn * (1.0f + restitution);
            }
        }
    }
};

class CollisionSystem {
public:
    std::vector<PlaneCollider> planes;
    std::vector<SphereCollider> spheres;
    std::vector<BoxCollider> boxes;

    void addPlane(const Vec3& normal, float distance) {
        planes.emplace_back(normal, distance);
    }

    void addSphere(const Vec3& center, float radius) {
        spheres.emplace_back(center, radius);
    }

    void addBox(const Vec3& center, const Vec3& halfExtents) {
        boxes.emplace_back(center, halfExtents);
    }

    bool checkCollision(const Vec3& point, Vec3& normal, float& depth) const {
        for (const auto& plane : planes) {
            if (plane.detectCollision(point, normal, depth)) {
                return true;
            }
        }
        for (const auto& sphere : spheres) {
            if (sphere.detectCollision(point, normal, depth)) {
                return true;
            }
        }
        for (const auto& box : boxes) {
            if (box.detectCollision(point, normal, depth)) {
                return true;
            }
        }
        return false;
    }

    void resolveParticle(Particle& particle) const {
        Vec3 normal;
        float depth;
        for (const auto& plane : planes) {
            plane.resolveCollision(particle.predictedPosition, particle.velocity, particle.invMass);
        }
        for (const auto& sphere : spheres) {
            sphere.resolveCollision(particle.predictedPosition, particle.velocity, particle.invMass);
        }
        for (const auto& box : boxes) {
            box.resolveCollision(particle.predictedPosition, particle.velocity, particle.invMass);
        }
    }
};
