#include "Simulation/TetraMesh.h"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <set>
#include <iostream>

void Tetrahedron::computeRestProperties(const std::vector<Particle>& particles) {
    const Vec3& p0 = particles[indices[0]].position;
    const Vec3& p1 = particles[indices[1]].position;
    const Vec3& p2 = particles[indices[2]].position;
    const Vec3& p3 = particles[indices[3]].position;

    Vec3 e1 = p1 - p0;
    Vec3 e2 = p2 - p0;
    Vec3 e3 = p3 - p0;

    restVolume = std::abs(e1.dot(e2.cross(e3))) / 6.0f;

    Mat3 Dm(e1.x, e2.x, e3.x,
            e1.y, e2.y, e3.y,
            e1.z, e2.z, e3.z);
    restBasis = Dm.inverse();
}

float Tetrahedron::computeCurrentVolume(const std::vector<Particle>& particles) const {
    const Vec3& p0 = particles[indices[0]].predictedPosition;
    const Vec3& p1 = particles[indices[1]].predictedPosition;
    const Vec3& p2 = particles[indices[2]].predictedPosition;
    const Vec3& p3 = particles[indices[3]].predictedPosition;

    Vec3 e1 = p1 - p0;
    Vec3 e2 = p2 - p0;
    Vec3 e3 = p3 - p0;

    return std::abs(e1.dot(e2.cross(e3))) / 6.0f;
}

void Tetrahedron::computeStress(std::vector<Particle>& particles, float youngsModulus) {
    const Vec3& p0 = particles[indices[0]].predictedPosition;
    const Vec3& p1 = particles[indices[1]].predictedPosition;
    const Vec3& p2 = particles[indices[2]].predictedPosition;
    const Vec3& p3 = particles[indices[3]].predictedPosition;

    Vec3 e1 = p1 - p0;
    Vec3 e2 = p2 - p0;
    Vec3 e3 = p3 - p0;

    Mat3 Ds(e1.x, e2.x, e3.x,
            e1.y, e2.y, e3.y,
            e1.z, e2.z, e3.z);

    Mat3 F = Ds * restBasis;
    Mat3 I = Mat3::identity();
    Mat3 epsilon = (F + F.transpose()) * 0.5f - I;
    
    stress = epsilon.trace() * youngsModulus;
    volume = computeCurrentVolume(particles);
}

void TetraMesh::generateCube(float size, int resolution) {
    particles.clear();
    tetrahedra.clear();
    edges.clear();
    faces.clear();
    edgeToFaces.clear();

    float step = size / (resolution - 1);
    float halfSize = size * 0.5f;

    for (int z = 0; z < resolution; z++) {
        for (int y = 0; y < resolution; y++) {
            for (int x = 0; x < resolution; x++) {
                Vec3 pos(
                    x * step - halfSize,
                    y * step - halfSize,
                    z * step - halfSize
                );
                particles.emplace_back(pos, 1.0f);
            }
        }
    }

    int n = resolution;
    for (int z = 0; z < n - 1; z++) {
        for (int y = 0; y < n - 1; y++) {
            for (int x = 0; x < n - 1; x++) {
                int i000 = x + y * n + z * n * n;
                int i100 = (x + 1) + y * n + z * n * n;
                int i010 = x + (y + 1) * n + z * n * n;
                int i001 = x + y * n + (z + 1) * n * n;
                int i110 = (x + 1) + (y + 1) * n + z * n * n;
                int i101 = (x + 1) + y * n + (z + 1) * n * n;
                int i011 = x + (y + 1) * n + (z + 1) * n * n;
                int i111 = (x + 1) + (y + 1) * n + (z + 1) * n * n;

                tetrahedra.emplace_back(i000, i100, i010, i001);
                tetrahedra.emplace_back(i111, i011, i101, i110);
                tetrahedra.emplace_back(i100, i010, i001, i111);
                tetrahedra.emplace_back(i100, i010, i110, i111);
                tetrahedra.emplace_back(i100, i001, i101, i111);
                tetrahedra.emplace_back(i010, i001, i011, i111);
            }
        }
    }

    initializeRestProperties();
    buildEdges();
    buildFaces();
    buildEdgeFaceMap();
}

void TetraMesh::generateFromOBJ(const std::string& filename) {
    particles.clear();
    tetrahedra.clear();
    edges.clear();
    faces.clear();
    edgeToFaces.clear();

    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cout << "Warning: Could not open " << filename << ", generating cube instead" << std::endl;
        generateCube(1.0f, 4);
        return;
    }

    std::vector<Vec3> vertices;
    std::vector<std::array<int, 3>> triFaces;

    std::string line;
    while (std::getline(file, line)) {
        std::istringstream iss(line);
        std::string type;
        iss >> type;

        if (type == "v") {
            float x, y, z;
            iss >> x >> y >> z;
            vertices.emplace_back(x, y, z);
        } else if (type == "f") {
            std::string token;
            std::vector<int> indices;
            while (iss >> token) {
                std::string idxStr = token.substr(0, token.find('/'));
                indices.push_back(std::stoi(idxStr) - 1);
            }
            if (indices.size() >= 3) {
                for (size_t i = 1; i < indices.size() - 1; i++) {
                    triFaces.push_back({indices[0], indices[i], indices[i + 1]});
                }
            }
        }
    }

    for (const auto& v : vertices) {
        particles.emplace_back(v, 1.0f);
    }

    Vec3 center(0, 0, 0);
    for (const auto& p : particles) {
        center += p.position;
    }
    center /= particles.size();

    int centerIdx = particles.size();
    particles.emplace_back(center, 1.0f);

    for (const auto& f : triFaces) {
        tetrahedra.emplace_back(f[0], f[1], f[2], centerIdx);
    }

    initializeRestProperties();
    buildEdges();
    buildFaces();
    buildEdgeFaceMap();
}

void TetraMesh::buildEdges() {
    edges.clear();
    std::set<std::pair<int, int>> edgeSet;

    for (const auto& tet : tetrahedra) {
        for (int i = 0; i < 4; i++) {
            for (int j = i + 1; j < 4; j++) {
                int a = tet.indices[i];
                int b = tet.indices[j];
                if (a > b) std::swap(a, b);
                edgeSet.insert({a, b});
            }
        }
    }

    for (const auto& e : edgeSet) {
        float len = (particles[e.first].position - particles[e.second].position).length();
        edges.emplace_back(e.first, e.second, len);
    }
}

void TetraMesh::buildFaces() {
    faces.clear();
    std::map<std::tuple<int, int, int>, int> faceCount;

    auto sortFace = [](int a, int b, int c) {
        if (a > b) std::swap(a, b);
        if (b > c) std::swap(b, c);
        if (a > b) std::swap(a, b);
        return std::make_tuple(a, b, c);
    };

    for (const auto& tet : tetrahedra) {
        auto f1 = sortFace(tet.indices[1], tet.indices[2], tet.indices[3]);
        auto f2 = sortFace(tet.indices[0], tet.indices[2], tet.indices[3]);
        auto f3 = sortFace(tet.indices[0], tet.indices[1], tet.indices[3]);
        auto f4 = sortFace(tet.indices[0], tet.indices[1], tet.indices[2]);
        faceCount[f1]++;
        faceCount[f2]++;
        faceCount[f3]++;
        faceCount[f4]++;
    }

    for (const auto& entry : faceCount) {
        if (entry.second == 1) {
            Face f(std::get<0>(entry.first), std::get<1>(entry.first), std::get<2>(entry.first));
            Vec3 p0 = particles[f.indices[0]].position;
            Vec3 p1 = particles[f.indices[1]].position;
            Vec3 p2 = particles[f.indices[2]].position;
            f.normal = (p1 - p0).cross(p2 - p0).normalized();
            faces.push_back(f);
        }
    }
}

void TetraMesh::buildEdgeFaceMap() {
    edgeToFaces.clear();
    for (size_t faceIdx = 0; faceIdx < faces.size(); faceIdx++) {
        const Face& f = faces[faceIdx];
        for (int i = 0; i < 3; i++) {
            int j = (i + 1) % 3;
            EdgeKey key(f.indices[i], f.indices[j]);
            edgeToFaces[key].push_back((int)faceIdx);
        }
    }
}

void TetraMesh::initializeRestProperties() {
    for (auto& tet : tetrahedra) {
        tet.computeRestProperties(particles);
    }
    setMass(1.0f);
}
