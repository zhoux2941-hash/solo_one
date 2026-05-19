#pragma once
#include "Simulation/TetraMesh.h"
#include "Simulation/Constraint.h"
#include "Simulation/Collision.h"
#include "Simulation/RigidBody.h"
#include "Simulation/Muscle.h"
#include <vector>
#include <unordered_map>
#include <algorithm>

class SpatialGrid {
public:
    struct CellKey {
        int x, y, z;
        CellKey(int x_, int y_, int z_) : x(x_), y(y_), z(z_) {}
        bool operator==(const CellKey& other) const {
            return x == other.x && y == other.y && z == other.z;
        }
    };

    struct CellHash {
        size_t operator()(const CellKey& k) const {
            return (size_t(k.x) * 73856093) ^ (size_t(k.y) * 19349663) ^ (size_t(k.z) * 83492791);
        }
    };

    float cellSize;
    std::unordered_map<CellKey, std::vector<int>, CellHash> grid;

    SpatialGrid(float size = 0.1f) : cellSize(size) {}

    void clear() { grid.clear(); }

    void insert(const Vec3& pos, int particleIdx) {
        CellKey key(
            (int)std::floor(pos.x / cellSize),
            (int)std::floor(pos.y / cellSize),
            (int)std::floor(pos.z / cellSize)
        );
        grid[key].push_back(particleIdx);
    }

    void getNearby(const Vec3& pos, std::vector<int>& result) const {
        int x = (int)std::floor(pos.x / cellSize);
        int y = (int)std::floor(pos.y / cellSize);
        int z = (int)std::floor(pos.z / cellSize);

        for (int dx = -1; dx <= 1; dx++) {
            for (int dy = -1; dy <= 1; dy++) {
                for (int dz = -1; dz <= 1; dz++) {
                    CellKey key(x + dx, y + dy, z + dz);
                    auto it = grid.find(key);
                    if (it != grid.end()) {
                        result.insert(result.end(), it->second.begin(), it->second.end());
                    }
                }
            }
        }
    }
};

class PBDSolver {
public:
    TetraMesh* mesh;
    std::vector<StretchConstraint> stretchConstraints;
    std::vector<VolumeConstraint> volumeConstraints;
    std::vector<BendingConstraint> bendingConstraints;
    std::vector<RigidBody*> rigidBodies;
    CollisionSystem collisionSystem;
    SpatialGrid spatialGrid;
    MuscleSystem muscleSystem;
    CrawlingController crawlingController;

    Vec3 gravity;
    float damping;
    int iterations;
    float timeStep;
    bool useSpatialGrid;
    bool enableBendingConstraints;
    int stressUpdateInterval;
    int frameCount;
    bool enableMuscles;

    PBDSolver() : mesh(nullptr), gravity(0.0f, -9.8f, 0.0f),
                  damping(0.99f), iterations(10), timeStep(0.01f),
                  useSpatialGrid(true), enableBendingConstraints(true),
                  stressUpdateInterval(3), frameCount(0), spatialGrid(0.15f),
                  enableMuscles(true) {}

    ~PBDSolver() {
        for (auto* rb : rigidBodies) {
            delete rb;
        }
    }

    void setMesh(TetraMesh* m) {
        mesh = m;
        buildConstraints();
    }

    void addRigidBody(RigidBody* rb) {
        rigidBodies.push_back(rb);
    }

    void buildConstraints();
    void step(float dt);

private:
    void predictPositions(float dt);
    void projectConstraints(float dt);
    void updateVelocities();
    void computeStresses();
    void handleCollisions();
    void handleRigidBodyCoupling();
    void buildSpatialGrid();
};
