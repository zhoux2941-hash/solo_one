#pragma once
#include "Math/Vec3.h"
#include <vector>
#include <cmath>

class MuscleConstraint {
public:
    int particleA;
    int particleB;
    float restLength;
    float currentLength;
    float activation;
    float maxContraction;
    float strength;

    MuscleConstraint() : particleA(0), particleB(0), restLength(1.0f), 
                         currentLength(1.0f), activation(0.0f), 
                         maxContraction(0.3f), strength(100.0f) {}

    MuscleConstraint(int a, int b, float len, float str = 100.0f, float maxCont = 0.3f)
        : particleA(a), particleB(b), restLength(len), currentLength(len),
          activation(0.0f), maxContraction(maxCont), strength(str) {}

    float getTargetLength() const {
        return restLength * (1.0f - maxContraction * std::max(0.0f, activation));
    }

    void setActivation(float act) {
        activation = std::max(0.0f, std::min(1.0f, act));
    }
};

class MuscleGroup {
public:
    std::vector<MuscleConstraint> muscles;
    std::string name;
    float phase;
    float frequency;
    float amplitude;
    bool enabled;

    MuscleGroup() : phase(0.0f), frequency(1.0f), amplitude(1.0f), enabled(true) {}
    MuscleGroup(const std::string& n) : name(n), phase(0.0f), frequency(1.0f), 
                                         amplitude(1.0f), enabled(true) {}

    void addMuscle(const MuscleConstraint& muscle) {
        muscles.push_back(muscle);
    }

    void update(float time, float waveSpeed = 0.0f, float waveOffset = 0.0f) {
        if (!enabled) return;
        
        for (size_t i = 0; i < muscles.size(); i++) {
            float localPhase = phase + waveOffset * i;
            float act = 0.5f + 0.5f * std::sin(2.0f * 3.14159f * frequency * time + localPhase);
            muscles[i].setActivation(act * amplitude);
        }
    }

    void setConstantActivation(float act) {
        for (auto& m : muscles) {
            m.setActivation(act * amplitude);
        }
    }
};

class MuscleSystem {
public:
    std::vector<MuscleGroup> muscleGroups;
    float globalFrequency;
    float globalAmplitude;
    bool enabled;
    float simulationTime;
    float waveSpeed;

    MuscleSystem() : globalFrequency(1.5f), globalAmplitude(1.0f), 
                     enabled(true), simulationTime(0.0f), waveSpeed(0.2f) {}

    void addMuscleGroup(const MuscleGroup& group) {
        muscleGroups.push_back(group);
    }

    void update(float dt) {
        if (!enabled) return;
        
        simulationTime += dt;
        
        for (size_t g = 0; g < muscleGroups.size(); g++) {
            auto& group = muscleGroups[g];
            float groupPhase = (float)g / muscleGroups.size() * 6.28318f;
            group.frequency = globalFrequency;
            group.amplitude = globalAmplitude;
            group.phase = groupPhase;
            group.update(simulationTime, waveSpeed, 0.0f);
        }
    }

    void applyForces(std::vector<Particle>& particles, float dt) {
        if (!enabled) return;

        for (const auto& group : muscleGroups) {
            if (!group.enabled) continue;

            for (const auto& muscle : group.muscles) {
                Particle& pA = particles[muscle.particleA];
                Particle& pB = particles[muscle.particleB];

                if (pA.fixed && pB.fixed) continue;

                Vec3 dir = pB.predictedPosition - pA.predictedPosition;
                float len = dir.length();
                if (len < 1e-6f) continue;
                dir /= len;

                float targetLen = muscle.getTargetLength();
                float error = len - targetLen;
                
                float forceMag = -error * muscle.strength * dt;
                Vec3 force = dir * forceMag;

                if (!pA.fixed) pA.predictedPosition += force * pA.invMass;
                if (!pB.fixed) pB.predictedPosition -= force * pB.invMass;
            }
        }
    }

    void applyAsConstraints(std::vector<Particle>& particles) {
        if (!enabled) return;

        for (const auto& group : muscleGroups) {
            if (!group.enabled) continue;

            for (const auto& muscle : group.muscles) {
                Particle& pA = particles[muscle.particleA];
                Particle& pB = particles[muscle.particleB];

                if (pA.fixed && pB.fixed) continue;

                Vec3 diff = pB.predictedPosition - pA.predictedPosition;
                float currentLen = diff.length();
                if (currentLen < 1e-6f) continue;

                float targetLen = muscle.getTargetLength();
                float error = (currentLen - targetLen) * 0.5f;
                Vec3 correction = diff * (error / currentLen);

                if (!pA.fixed) pA.predictedPosition += correction * 0.8f;
                if (!pB.fixed) pB.predictedPosition -= correction * 0.8f;
            }
        }
    }

    void reset() {
        simulationTime = 0.0f;
        for (auto& group : muscleGroups) {
            for (auto& muscle : group.muscles) {
                muscle.setActivation(0.0f);
            }
        }
    }

    void clear() {
        muscleGroups.clear();
        simulationTime = 0.0f;
    }
};

class CrawlingController {
public:
    enum Pattern {
        WAVE,
        PERISTALTIC,
        UNDULATION,
        STANDING
    };

    Pattern currentPattern;
    float speed;
    float direction;
    bool enabled;

    CrawlingController() : currentPattern(WAVE), speed(1.0f), direction(1.0f), enabled(true) {}

    void applyPattern(MuscleSystem& muscleSystem) {
        if (!enabled) return;

        switch (currentPattern) {
            case WAVE:
                muscleSystem.waveSpeed = 0.5f;
                muscleSystem.globalAmplitude = 0.8f * speed;
                break;
            case PERISTALTIC:
                muscleSystem.waveSpeed = 0.3f;
                muscleSystem.globalAmplitude = 1.0f * speed;
                break;
            case UNDULATION:
                muscleSystem.waveSpeed = 0.8f;
                muscleSystem.globalAmplitude = 0.6f * speed;
                break;
            case STANDING:
                muscleSystem.globalAmplitude = 0.0f;
                break;
        }
    }

    void setPattern(Pattern p) {
        currentPattern = p;
    }

    const char* getPatternName() const {
        switch (currentPattern) {
            case WAVE: return "Wave";
            case PERISTALTIC: return "Peristaltic";
            case UNDULATION: return "Undulation";
            case STANDING: return "Standing";
            default: return "Unknown";
        }
    }
};
