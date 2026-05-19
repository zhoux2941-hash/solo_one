#pragma once
#include "Simulation/TetraMesh.h"
#include "Simulation/RigidBody.h"
#include "Simulation/PBDSolver.h"
#include "Math/Vec3.h"
#include <GL/glut.h>

class Renderer {
public:
    TetraMesh* mesh;
    PBDSolver* solver;
    std::vector<RigidBody*>* rigidBodies;
    
    bool wireframe;
    bool showStress;
    bool showEdges;
    bool showParticles;
    bool showMuscles;
    float cameraDistance;
    float cameraAngleX;
    float cameraAngleY;
    Vec3 cameraTarget;
    float stressMin;
    float stressMax;

    Renderer() : mesh(nullptr), solver(nullptr), rigidBodies(nullptr),
                 wireframe(false), showStress(true), showEdges(true), showParticles(false),
                 showMuscles(true), cameraDistance(5.0f), cameraAngleX(30.0f), cameraAngleY(45.0f),
                 cameraTarget(Vec3::zero()), stressMin(0.0f), stressMax(100.0f) {}

    void render();
    void renderMesh();
    void renderRigidBodies();
    void renderColliders();
    void renderGrid();
    void renderMuscles();

    Vec3 getStressColor(float stress);
    Vec3 getMuscleColor(float activation);

    void setupCamera();
    void handleMouseMove(int x, int y);
    void handleMouseWheel(int button, int dir, int x, int y);
};
