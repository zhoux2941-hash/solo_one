#include "Simulation/PBDSolver.h"
#include <iostream>

void PBDSolver::buildConstraints() {
    if (!mesh) return;

    stretchConstraints.clear();
    volumeConstraints.clear();
    bendingConstraints.clear();

    stretchConstraints.reserve(mesh->edges.size());
    for (const auto& edge : mesh->edges) {
        stretchConstraints.emplace_back(edge.i, edge.j, edge.restLength, 1.0f);
    }

    volumeConstraints.reserve(mesh->tetrahedra.size());
    for (const auto& tet : mesh->tetrahedra) {
        volumeConstraints.emplace_back(
            tet.indices[0], tet.indices[1],
            tet.indices[2], tet.indices[3],
            tet.restVolume, 1.0f
        );
    }

    if (enableBendingConstraints) {
        int bendingCount = 0;
        for (const auto& entry : mesh->edgeToFaces) {
            if (entry.second.size() >= 2) {
                const Face& f1 = mesh->faces[entry.second[0]];
                const Face& f2 = mesh->faces[entry.second[1]];

                int unique1 = -1, unique2 = -1;
                for (int a : f1.indices) {
                    if (a != entry.first.a && a != entry.first.b) unique1 = a;
                }
                for (int b : f2.indices) {
                    if (b != entry.first.a && b != entry.first.b) unique2 = b;
                }

                if (unique1 != -1 && unique2 != -1 && unique1 != unique2) {
                    float dot = f1.normal.dot(f2.normal);
                    dot = std::max(-1.0f, std::min(1.0f, dot));
                    float angle = std::acos(dot);
                    bendingConstraints.emplace_back(
                        entry.first.a, entry.first.b,
                        unique1, unique2, angle, 0.3f
                    );
                    bendingCount++;
                }
            }
        }
    }

    std::cout << "Constraints built: Stretch=" << stretchConstraints.size()
              << ", Volume=" << volumeConstraints.size()
              << ", Bending=" << bendingConstraints.size() << std::endl;
}

void PBDSolver::buildSpatialGrid() {
    if (!mesh || !useSpatialGrid) return;

    spatialGrid.clear();
    for (size_t i = 0; i < mesh->particles.size(); i++) {
        spatialGrid.insert(mesh->particles[i].predictedPosition, (int)i);
    }
}

void PBDSolver::step(float dt) {
    if (!mesh) return;

    timeStep = dt;
    frameCount++;

    if (enableMuscles) {
        crawlingController.applyPattern(muscleSystem);
        muscleSystem.update(dt);
    }

    predictPositions(dt);

    if (enableMuscles) {
        muscleSystem.applyAsConstraints(mesh->particles);
    }

    if (useSpatialGrid) {
        buildSpatialGrid();
    }

    handleCollisions();

    for (int iter = 0; iter < iterations; iter++) {
        projectConstraints(dt);
        if (enableMuscles && iter % 2 == 0) {
            muscleSystem.applyAsConstraints(mesh->particles);
        }
    }

    handleRigidBodyCoupling();
    updateVelocities();

    if (frameCount % stressUpdateInterval == 0) {
        computeStresses();
    }
}

void PBDSolver::predictPositions(float dt) {
    for (auto& p : mesh->particles) {
        if (!p.fixed) {
            p.velocity += gravity * dt;
            p.predictedPosition = p.position + p.velocity * dt;
        }
    }

    for (auto* rb : rigidBodies) {
        rb->integrate(dt, gravity);
    }
}

void PBDSolver::projectConstraints(float dt) {
    for (auto& c : stretchConstraints) {
        Particle& p0 = mesh->particles[c.i];
        Particle& p1 = mesh->particles[c.j];

        if (p0.fixed && p1.fixed) continue;

        Vec3 diff = p1.predictedPosition - p0.predictedPosition;
        float currentLength = diff.length();

        if (currentLength < 1e-6f) continue;

        float error = (currentLength - c.restLength) * c.stiffness;
        float wSum = p0.invMass + p1.invMass;

        if (wSum < 1e-6f) continue;

        Vec3 correction = diff * (error / (currentLength * wSum));
        if (!p0.fixed) p0.predictedPosition += correction * p0.invMass;
        if (!p1.fixed) p1.predictedPosition -= correction * p1.invMass;
    }

    for (auto& c : volumeConstraints) {
        Particle& p0 = mesh->particles[c.indices[0]];
        Particle& p1 = mesh->particles[c.indices[1]];
        Particle& p2 = mesh->particles[c.indices[2]];
        Particle& p3 = mesh->particles[c.indices[3]];

        if (p0.fixed && p1.fixed && p2.fixed && p3.fixed) continue;

        Vec3 e1 = p1.predictedPosition - p0.predictedPosition;
        Vec3 e2 = p2.predictedPosition - p0.predictedPosition;
        Vec3 e3 = p3.predictedPosition - p0.predictedPosition;

        float currentVol = e1.dot(e2.cross(e3)) / 6.0f;
        float error = (currentVol - c.restVolume) * c.stiffness;

        Vec3 grad0 = (e2 - e1).cross(e3 - e1) / 6.0f;
        Vec3 grad1 = e2.cross(e3) / 6.0f;
        Vec3 grad2 = e3.cross(e1) / 6.0f;
        Vec3 grad3 = e1.cross(e2) / 6.0f;

        float wSum = p0.invMass * grad0.dot(grad0) +
                     p1.invMass * grad1.dot(grad1) +
                     p2.invMass * grad2.dot(grad2) +
                     p3.invMass * grad3.dot(grad3);

        if (wSum < 1e-6f) continue;

        float lambda = -error / wSum;

        if (!p0.fixed) p0.predictedPosition += grad0 * (lambda * p0.invMass);
        if (!p1.fixed) p1.predictedPosition += grad1 * (lambda * p1.invMass);
        if (!p2.fixed) p2.predictedPosition += grad2 * (lambda * p2.invMass);
        if (!p3.fixed) p3.predictedPosition += grad3 * (lambda * p3.invMass);
    }

    if (enableBendingConstraints) {
        for (auto& c : bendingConstraints) {
            c.project(mesh->particles, dt);
        }
    }
}

void PBDSolver::updateVelocities() {
    for (auto& p : mesh->particles) {
        if (!p.fixed) {
            p.velocity = (p.predictedPosition - p.position) * damping;
            p.position = p.predictedPosition;
        }
    }
}

void PBDSolver::computeStresses() {
    for (auto& tet : mesh->tetrahedra) {
        tet.computeStress(mesh->particles, mesh->youngsModulus);
    }
}

void PBDSolver::handleCollisions() {
    for (auto& p : mesh->particles) {
        if (p.fixed) continue;
        collisionSystem.resolveParticle(p);
    }

    for (auto* rb : rigidBodies) {
        if (rb->isStatic) continue;

        for (const auto& plane : collisionSystem.planes) {
            Vec3 cp = rb->position - plane.normal * (rb->type == RigidBody::SPHERE ? rb->radius : 0.01f);
            float dist = cp.dot(plane.normal) - plane.distance;

            if (dist < 0.0f) {
                Vec3 vel = rb->getVelocityAtPoint(cp);
                float vn = vel.dot(plane.normal);

                if (vn < 0.0f) {
                    float j = -(1.0f + 0.3f) * vn;
                    j /= rb->invMass + 1.0f;

                    Vec3 impulse = plane.normal * j;
                    rb->applyImpulse(impulse, cp);
                    rb->position += plane.normal * (-dist * 0.5f);
                }
            }
        }
    }
}

void PBDSolver::handleRigidBodyCoupling() {
    for (auto* rb : rigidBodies) {
        for (auto& p : mesh->particles) {
            if (p.fixed || p.invMass < 1e-6f) continue;

            Vec3 closest = rb->getClosestPoint(p.predictedPosition);
            Vec3 diff = p.predictedPosition - closest;
            float distSq = diff.x * diff.x + diff.y * diff.y + diff.z * diff.z;

            if (distSq < 1e-12f) continue;

            if (rb->pointInside(p.predictedPosition)) {
                float dist = std::sqrt(distSq);
                Vec3 normal = diff / dist;
                float depth = 0.01f - dist;

                if (depth > 0.0f) {
                    Vec3 rbVel = rb->getVelocityAtPoint(closest);
                    Vec3 relVel = p.velocity - rbVel;
                    float vn = relVel.dot(normal);

                    float wSum = p.invMass + rb->invMass;
                    float lambda = (-vn * 0.8f) / wSum;

                    if (lambda > 0) {
                        Vec3 impulse = normal * lambda;
                        p.velocity -= impulse * p.invMass;
                        p.predictedPosition += normal * depth;

                        if (!rb->isStatic) {
                            rb->applyImpulse(-impulse, closest);
                        }
                    }
                }
            }
        }
    }
}
