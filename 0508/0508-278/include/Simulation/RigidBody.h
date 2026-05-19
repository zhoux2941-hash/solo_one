#pragma once
#include "Math/Vec3.h"
#include "Math/Mat3.h"
#include "Math/Quat.h"

class RigidBody {
public:
    Vec3 position;
    Vec3 linearVelocity;
    Quat orientation;
    Vec3 angularVelocity;
    float mass;
    float invMass;
    Mat3 inertiaTensor;
    Mat3 invInertiaTensor;
    Vec3 centerOfMass;
    float restitution;
    float friction;
    bool isStatic;

    enum Type { SPHERE, BOX } type;
    float radius;
    Vec3 halfExtents;

    RigidBody() : position(Vec3::zero()), linearVelocity(Vec3::zero()),
                  orientation(Quat()), angularVelocity(Vec3::zero()),
                  mass(1.0f), invMass(1.0f),
                  restitution(0.3f), friction(0.5f), isStatic(false),
                  type(SPHERE), radius(0.5f), halfExtents(0.5f, 0.5f, 0.5f) {
        inertiaTensor = Mat3::identity() * (0.4f * mass * radius * radius);
        invInertiaTensor = inertiaTensor.inverse();
    }

    static RigidBody createSphere(const Vec3& pos, float r, float m = 1.0f) {
        RigidBody rb;
        rb.position = pos;
        rb.radius = r;
        rb.mass = m;
        rb.invMass = m > 0 ? 1.0f / m : 0.0f;
        rb.type = SPHERE;
        rb.inertiaTensor = Mat3::identity() * (0.4f * m * r * r);
        rb.invInertiaTensor = rb.inertiaTensor.inverse();
        return rb;
    }

    static RigidBody createBox(const Vec3& pos, const Vec3& he, float m = 1.0f) {
        RigidBody rb;
        rb.position = pos;
        rb.halfExtents = he;
        rb.mass = m;
        rb.invMass = m > 0 ? 1.0f / m : 0.0f;
        rb.type = BOX;
        
        float x2 = he.x * he.x * 4.0f;
        float y2 = he.y * he.y * 4.0f;
        float z2 = he.z * he.z * 4.0f;
        float factor = m / 12.0f;
        rb.inertiaTensor = Mat3(
            factor * (y2 + z2), 0, 0,
            0, factor * (x2 + z2), 0,
            0, 0, factor * (x2 + y2)
        );
        rb.invInertiaTensor = rb.inertiaTensor.inverse();
        return rb;
    }

    void integrate(float dt, const Vec3& gravity) {
        if (isStatic) return;
        
        linearVelocity += gravity * dt;
        position += linearVelocity * dt;

        Vec3 w = angularVelocity * dt;
        float angle = w.length();
        if (angle > 1e-6f) {
            Quat dq = Quat::fromAxisAngle(w / angle, angle);
            orientation = dq * orientation;
            orientation.normalize();
        }
    }

    void applyImpulse(const Vec3& impulse, const Vec3& point) {
        if (isStatic) return;
        
        linearVelocity += impulse * invMass;
        
        Vec3 r = point - position;
        Vec3 angularImpulse = r.cross(impulse);
        Mat3 worldInvInertia = orientation.toMat3() * invInertiaTensor * orientation.toMat3().transpose();
        angularVelocity += worldInvInertia * angularImpulse;
    }

    bool pointInside(const Vec3& p) const {
        if (type == SPHERE) {
            return (p - position).lengthSquared() < radius * radius;
        } else {
            Vec3 local = p - position;
            return std::abs(local.x) < halfExtents.x &&
                   std::abs(local.y) < halfExtents.y &&
                   std::abs(local.z) < halfExtents.z;
        }
    }

    Vec3 getClosestPoint(const Vec3& p) const {
        if (type == SPHERE) {
            Vec3 dir = p - position;
            float len = dir.length();
            if (len < 1e-6f) return position + Vec3(0, radius, 0);
            return position + dir * (radius / len);
        } else {
            Vec3 local = p - position;
            for (int i = 0; i < 3; i++) {
                float* l = &local.x + i;
                float* he = &halfExtents.x + i;
                *l = std::max(-*he, std::min(*he, *l));
            }
            return position + local;
        }
    }

    Vec3 getVelocityAtPoint(const Vec3& point) const {
        if (isStatic) return Vec3::zero();
        return linearVelocity + angularVelocity.cross(point - position);
    }
};
