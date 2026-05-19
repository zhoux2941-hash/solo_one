#include "Visualization/Renderer.h"
#include <cmath>

Vec3 Renderer::getMuscleColor(float activation) {
    float t = std::max(0.0f, std::min(1.0f, activation));
    return Vec3(1.0f, 0.2f + 0.8f * t, 0.2f);
}

Vec3 Renderer::getStressColor(float stress) {
    float t = (stress - stressMin) / (stressMax - stressMin);
    t = std::max(0.0f, std::min(1.0f, t));

    if (t < 0.25f) {
        return Vec3(0.0f, 0.0f, 1.0f);
    } else if (t < 0.5f) {
        float f = (t - 0.25f) * 4.0f;
        return Vec3(0.0f, f, 1.0f - f);
    } else if (t < 0.75f) {
        float f = (t - 0.5f) * 4.0f;
        return Vec3(f, 1.0f - f, 0.0f);
    } else {
        float f = (t - 0.75f) * 4.0f;
        return Vec3(1.0f, f, f);
    }
}

void Renderer::setupCamera() {
    glLoadIdentity();

    float radX = cameraAngleX * 3.14159f / 180.0f;
    float radY = cameraAngleY * 3.14159f / 180.0f;

    float x = cameraDistance * std::sin(radY) * std::cos(radX);
    float y = cameraDistance * std::sin(radX);
    float z = cameraDistance * std::cos(radY) * std::cos(radX);

    gluLookAt(x + cameraTarget.x, y + cameraTarget.y, z + cameraTarget.z,
              cameraTarget.x, cameraTarget.y, cameraTarget.z,
              0.0f, 1.0f, 0.0f);
}

void Renderer::renderMesh() {
    if (!mesh) return;

    if (showParticles) {
        glPointSize(5.0f);
        glColor3f(1.0f, 0.0f, 0.0f);
        glBegin(GL_POINTS);
        for (const auto& p : mesh->particles) {
            glVertex3f(p.position.x, p.position.y, p.position.z);
        }
        glEnd();
    }

    if (wireframe) {
        glColor3f(0.3f, 0.5f, 1.0f);
        glLineWidth(1.0f);
        glBegin(GL_LINES);
        for (const auto& edge : mesh->edges) {
            const Vec3& p0 = mesh->particles[edge.i].position;
            const Vec3& p1 = mesh->particles[edge.j].position;
            glVertex3f(p0.x, p0.y, p0.z);
            glVertex3f(p1.x, p1.y, p1.z);
        }
        glEnd();
    } else {
        glEnable(GL_LIGHTING);
        glEnable(GL_LIGHT0);
        GLfloat lightPos[] = {10.0f, 10.0f, 10.0f, 1.0f};
        glLightfv(GL_LIGHT0, GL_POSITION, lightPos);

        glBegin(GL_TRIANGLES);
        for (size_t i = 0; i < mesh->tetrahedra.size(); i++) {
            const auto& tet = mesh->tetrahedra[i];
            
            Vec3 color;
            if (showStress) {
                color = getStressColor(std::abs(tet.stress));
            } else {
                color = Vec3(0.3f, 0.7f, 1.0f);
            }

            glColor3f(color.x, color.y, color.z);

            for (int j = 0; j < 4; j++) {
                int i0 = tet.indices[j];
                int i1 = tet.indices[(j + 1) % 4];
                int i2 = tet.indices[(j + 2) % 4];

                const Vec3& p0 = mesh->particles[i0].position;
                const Vec3& p1 = mesh->particles[i1].position;
                const Vec3& p2 = mesh->particles[i2].position;

                Vec3 normal = (p1 - p0).cross(p2 - p0).normalized();
                glNormal3f(normal.x, normal.y, normal.z);

                glVertex3f(p0.x, p0.y, p0.z);
                glVertex3f(p1.x, p1.y, p1.z);
                glVertex3f(p2.x, p2.y, p2.z);
            }
        }
        glEnd();

        glDisable(GL_LIGHTING);

        if (showEdges) {
            glColor3f(0.1f, 0.1f, 0.3f);
            glLineWidth(0.5f);
            glBegin(GL_LINES);
            for (const auto& edge : mesh->edges) {
                const Vec3& p0 = mesh->particles[edge.i].position;
                const Vec3& p1 = mesh->particles[edge.j].position;
                glVertex3f(p0.x, p0.y, p0.z);
                glVertex3f(p1.x, p1.y, p1.z);
            }
            glEnd();
        }
    }
}

void Renderer::renderRigidBodies() {
    if (!rigidBodies) return;

    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0);

    for (const auto* rb : *rigidBodies) {
        glPushMatrix();
        glTranslatef(rb->position.x, rb->position.y, rb->position.z);

        Mat3 rot = rb->orientation.toMat3();
        GLfloat m[16] = {
            rot.m[0][0], rot.m[1][0], rot.m[2][0], 0,
            rot.m[0][1], rot.m[1][1], rot.m[2][1], 0,
            rot.m[0][2], rot.m[1][2], rot.m[2][2], 0,
            0, 0, 0, 1
        };
        glMultMatrixf(m);

        if (rb->type == RigidBody::SPHERE) {
            glColor3f(1.0f, 0.5f, 0.2f);
            glutSolidSphere(rb->radius, 16, 16);
        } else {
            glColor3f(0.5f, 0.8f, 0.3f);
            glScalef(rb->halfExtents.x * 2, rb->halfExtents.y * 2, rb->halfExtents.z * 2);
            glutSolidCube(1.0f);
        }

        glPopMatrix();
    }

    glDisable(GL_LIGHTING);
}

void Renderer::renderColliders() {
    if (!solver) return;

    glColor4f(0.8f, 0.8f, 0.8f, 0.3f);
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    for (const auto& plane : solver->collisionSystem.planes) {
        float size = 10.0f;
        Vec3 u, v;
        if (std::abs(plane.normal.y) > 0.9f) {
            u = Vec3(1, 0, 0);
            v = Vec3(0, 0, 1);
        } else {
            u = Vec3(1, 0, 0).cross(plane.normal).normalized();
            v = plane.normal.cross(u).normalized();
        }

        Vec3 center = plane.normal * plane.distance;

        glBegin(GL_QUADS);
        glNormal3f(plane.normal.x, plane.normal.y, plane.normal.z);
        Vec3 p1 = center + u * size + v * size;
        Vec3 p2 = center - u * size + v * size;
        Vec3 p3 = center - u * size - v * size;
        Vec3 p4 = center + u * size - v * size;
        glVertex3f(p1.x, p1.y, p1.z);
        glVertex3f(p2.x, p2.y, p2.z);
        glVertex3f(p3.x, p3.y, p3.z);
        glVertex3f(p4.x, p4.y, p4.z);
        glEnd();
    }

    glDisable(GL_BLEND);
}

void Renderer::renderMuscles() {
    if (!solver || !mesh || !showMuscles) return;

    glLineWidth(4.0f);
    glDisable(GL_LIGHTING);

    for (const auto& group : solver->muscleSystem.muscleGroups) {
        if (!group.enabled) continue;

        for (const auto& muscle : group.muscles) {
            const Particle& pA = mesh->particles[muscle.particleA];
            const Particle& pB = mesh->particles[muscle.particleB];

            Vec3 color = getMuscleColor(muscle.activation);
            glColor3f(color.x, color.y, color.z);

            glBegin(GL_LINES);
            glVertex3f(pA.position.x, pA.position.y, pA.position.z);
            glVertex3f(pB.position.x, pB.position.y, pB.position.z);
            glEnd();

            if (muscle.activation > 0.5f) {
                glPointSize(8.0f);
                glBegin(GL_POINTS);
                glVertex3f(pA.position.x, pA.position.y, pA.position.z);
                glVertex3f(pB.position.x, pB.position.y, pB.position.z);
                glEnd();
            }
        }
    }

    glEnable(GL_LIGHTING);
}

void Renderer::renderGrid() {
    glColor3f(0.3f, 0.3f, 0.3f);
    glLineWidth(1.0f);

    float size = 5.0f;
    int steps = 10;
    float step = size * 2.0f / steps;

    glBegin(GL_LINES);
    for (int i = 0; i <= steps; i++) {
        float x = -size + i * step;
        glVertex3f(x, 0.0f, -size);
        glVertex3f(x, 0.0f, size);
        glVertex3f(-size, 0.0f, x);
        glVertex3f(size, 0.0f, x);
    }
    glEnd();
}

void Renderer::render() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    setupCamera();
    renderGrid();
    renderColliders();
    renderMesh();
    renderMuscles();
    renderRigidBodies();

    glutSwapBuffers();
}

void Renderer::handleMouseMove(int x, int y) {
    static int lastX = x, lastY = y;
    static bool leftPressed = false;

    if (glutGetModifiers() & GLUT_ACTIVE_SHIFT) {
        cameraAngleY += (x - lastX) * 0.5f;
        cameraAngleX += (y - lastY) * 0.5f;
        cameraAngleX = std::max(-89.0f, std::min(89.0f, cameraAngleX));
    }

    lastX = x;
    lastY = y;
}

void Renderer::handleMouseWheel(int button, int dir, int x, int y) {
    cameraDistance *= (dir > 0) ? 0.9f : 1.1f;
    cameraDistance = std::max(1.0f, std::min(50.0f, cameraDistance));
}
