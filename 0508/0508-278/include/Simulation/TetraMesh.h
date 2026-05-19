#pragma once
#include "Simulation/Particle.h"
#include <vector>
#include <array>
#include <unordered_map>
#include <cstdint>

struct Tetrahedron {
    std::array<int, 4> indices;
    float restVolume;
    float volume;
    float stress;
    Mat3 restBasis;

    Tetrahedron() : restVolume(0.0f), volume(0.0f), stress(0.0f) {}
    Tetrahedron(int i0, int i1, int i2, int i3) {
        indices[0] = i0; indices[1] = i1; indices[2] = i2; indices[3] = i3;
        restVolume = 0.0f; volume = 0.0f; stress = 0.0f;
    }

    void computeRestProperties(const std::vector<Particle>& particles);
    float computeCurrentVolume(const std::vector<Particle>& particles) const;
    void computeStress(std::vector<Particle>& particles, float youngsModulus);
};

struct Edge {
    int i, j;
    float restLength;

    Edge() : i(0), j(0), restLength(0.0f) {}
    Edge(int i0, int j0, float len) : i(i0), j(j0), restLength(len) {}
};

struct Face {
    std::array<int, 3> indices;
    Vec3 normal;

    Face() {}
    Face(int i0, int i1, int i2) {
        indices[0] = i0; indices[1] = i1; indices[2] = i2;
    }
};

struct EdgeKey {
    int a, b;
    EdgeKey(int i, int j) {
        if (i < j) { a = i; b = j; }
        else { a = j; b = i; }
    }
    bool operator==(const EdgeKey& other) const {
        return a == other.a && b == other.b;
    }
};

namespace std {
    template<> struct hash<EdgeKey> {
        size_t operator()(const EdgeKey& k) const {
            return (size_t(k.a) << 20) | (size_t(k.b) & 0xFFFFF);
        }
    };
}

class TetraMesh {
public:
    std::vector<Particle> particles;
    std::vector<Tetrahedron> tetrahedra;
    std::vector<Edge> edges;
    std::vector<Face> faces;
    std::unordered_map<EdgeKey, std::vector<int>> edgeToFaces;
    float youngsModulus;
    float poissonRatio;

    TetraMesh() : youngsModulus(1000.0f), poissonRatio(0.3f) {}

    void generateCube(float size, int resolution);
    void generateFromOBJ(const std::string& filename);
    void buildEdges();
    void buildFaces();
    void buildEdgeFaceMap();
    void initializeRestProperties();

    void setFixedParticle(int index, bool fixed) {
        if (index >= 0 && index < (int)particles.size()) {
            particles[index].setFixed(fixed);
        }
    }

    void setMass(float mass) {
        float invMassPerParticle = mass > 0 ? 1.0f / mass * particles.size() : 0;
        for (auto& p : particles) {
            p.setMass(mass / particles.size());
        }
    }
};
