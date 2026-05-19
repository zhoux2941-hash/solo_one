#include "hand_tracking_sdk/performance_optimizer.h"
#include "hand_tracking_sdk/gesture_recognizer.h"
#include <iostream>
#include <cassert>
#include <cmath>
#include <vector>
#include <random>

using namespace hand_tracking_sdk;

float CalculateJitter(const std::vector<Point3D>& points) {
    if (points.size() < 2) return 0.0f;
    float total_dist = 0.0f;
    for (size_t i = 1; i < points.size(); ++i) {
        float dx = points[i].x - points[i-1].x;
        float dy = points[i].y - points[i-1].y;
        total_dist += std::sqrt(dx*dx + dy*dy);
    }
    return total_dist / (points.size() - 1);
}

void TestKalmanFilter() {
    std::cout << "Testing KalmanFilter..." << std::endl;

    KalmanFilter3D filter(0.005f, 0.1f);

    std::mt19937 rng(42);
    std::normal_distribution<float> noise(0.0f, 0.02f);

    std::vector<Point3D> raw_points;
    std::vector<Point3D> filtered_points;

    for (int i = 0; i < 100; ++i) {
        float t = i / 100.0f;
        Point3D raw(0.3f + 0.2f * t + noise(rng),
                    0.5f + 0.1f * std::sin(t * 10) + noise(rng),
                    0.0f + noise(rng));

        raw_points.push_back(raw);
        filtered_points.push_back(filter.Filter(raw));
    }

    float raw_jitter = CalculateJitter(raw_points);
    float filtered_jitter = CalculateJitter(filtered_points);

    std::cout << "  Raw jitter: " << raw_jitter << std::endl;
    std::cout << "  Filtered jitter: " << filtered_jitter << std::endl;
    std::cout << "  Reduction ratio: " << (raw_jitter / filtered_jitter) << "x" << std::endl;

    assert(filtered_jitter < raw_jitter * 0.5f);
    std::cout << "  KalmanFilter reduces jitter by >50%: PASS" << std::endl;
}

void TestOneEuroFilter() {
    std::cout << "Testing OneEuroFilter..." << std::endl;

    OneEuroFilter filter(1.0f, 0.007f, 1.0f);

    std::mt19937 rng(123);
    std::normal_distribution<float> noise(0.0f, 0.015f);

    std::vector<Point3D> raw_points;
    std::vector<Point3D> filtered_points;

    for (int i = 0; i < 200; ++i) {
        float t = i / 100.0f;
        float dt = 0.016f;

        Point3D raw(0.5f + 0.3f * std::sin(t * 2) + noise(rng),
                    0.5f + 0.2f * std::cos(t * 3) + noise(rng),
                    0.0f + noise(rng));

        raw_points.push_back(raw);
        filtered_points.push_back(filter.Filter(raw, dt));
    }

    float raw_jitter = CalculateJitter(raw_points);
    float filtered_jitter = CalculateJitter(filtered_points);

    std::cout << "  Raw jitter: " << raw_jitter << std::endl;
    std::cout << "  Filtered jitter: " << filtered_jitter << std::endl;

    assert(filtered_jitter < raw_jitter * 0.4f);
    std::cout << "  OneEuroFilter reduces jitter by >60%: PASS" << std::endl;
}

void TestOutlierDetector() {
    std::cout << "Testing OutlierDetector..." << std::endl;

    OutlierDetector detector(2.5f, 10);

    for (int i = 0; i < 15; ++i) {
        Point3D p(0.5f + (i % 3) * 0.01f, 0.5f, 0.0f);
        bool is_outlier = detector.IsOutlier(p, 0);
        assert(!is_outlier);
    }

    Point3D outlier(0.9f, 0.9f, 0.0f);
    bool is_outlier = detector.IsOutlier(outlier, 0);
    std::cout << "  Outlier detected: " << (is_outlier ? "YES" : "NO") << std::endl;
    assert(is_outlier);

    Point3D smoothed = detector.GetSmoothedPoint(outlier, 0);
    std::cout << "  Smoothed from (" << outlier.x << ", " << outlier.y
              << ") to (" << smoothed.x << ", " << smoothed.y << ")" << std::endl;

    assert(std::abs(smoothed.x - 0.5f) < 0.1f);
    std::cout << "  OutlierDetector works correctly: PASS" << std::endl;
}

void TestTemporalGestureSmoother() {
    std::cout << "Testing TemporalGestureSmoother..." << std::endl;

    TemporalGestureSmoother smoother(5, 0.6f);

    GestureResult r1, r2, r3;
    r1.type = GestureType::FIST; r1.confidence = 0.8f; r1.name = "Fist";
    r2.type = GestureType::ONE; r2.confidence = 0.7f; r2.name = "One";
    r3.type = GestureType::FIST; r3.confidence = 0.9f; r3.name = "Fist";

    GestureResult result;

    result = smoother.Smooth(r1);
    std::cout << "  After first FIST: " << result.name << std::endl;

    result = smoother.Smooth(r2);
    std::cout << "  After ONE (should still be FIST): " << result.name << std::endl;
    assert(result.type == GestureType::FIST);

    result = smoother.Smooth(r2);
    result = smoother.Smooth(r2);
    result = smoother.Smooth(r2);
    result = smoother.Smooth(r2);
    std::cout << "  After 5 ONEs: " << result.name << std::endl;
    assert(result.type == GestureType::ONE);

    std::cout << "  TemporalGestureSmoother prevents flickering: PASS" << std::endl;
}

void TestHandSmoother() {
    std::cout << "Testing HandSmoother..." << std::endl;

    HandSmoother smoother(HandSmoother::SmoothMode::ONE_EURO);

    std::mt19937 rng(456);
    std::normal_distribution<float> noise(0.0f, 0.01f);

    HandLandmarks base_landmarks;
    for (int i = 0; i < 21; ++i) {
        base_landmarks[i].position = Point3D(0.3f + i * 0.01f, 0.5f, 0.0f);
    }

    std::vector<HandLandmarks> smoothed_sequence;

    for (int i = 0; i < 30; ++i) {
        HandLandmarks noisy = base_landmarks;
        for (int j = 0; j < 21; ++j) {
            noisy[j].position.x += noise(rng);
            noisy[j].position.y += noise(rng);
        }

        HandLandmarks smoothed = smoother.Smooth(noisy);
        smoothed_sequence.push_back(smoothed);
    }

    float raw_movement = 0.0f;
    float smoothed_movement = 0.0f;

    for (int i = 1; i < 10; ++i) {
        HandLandmarks noisy = base_landmarks;
        for (int j = 0; j < 21; ++j) {
            noisy[j].position.x += noise(rng);
            noisy[j].position.y += noise(rng);
        }

        for (int j = 0; j < 21; ++j) {
            float raw_dx = noisy[j].position.x - base_landmarks[j].position.x;
            float raw_dy = noisy[j].position.y - base_landmarks[j].position.y;
            raw_movement += std::sqrt(raw_dx*raw_dx + raw_dy*raw_dy);

            float smooth_dx = smoothed_sequence[i][j].position.x - smoothed_sequence[i-1][j].position.x;
            float smooth_dy = smoothed_sequence[i][j].position.y - smoothed_sequence[i-1][j].position.y;
            smoothed_movement += std::sqrt(smooth_dx*smooth_dx + smooth_dy*smooth_dy);
        }
    }

    std::cout << "  Raw total movement: " << raw_movement << std::endl;
    std::cout << "  Smoothed total movement: " << smoothed_movement << std::endl;

    assert(smoothed_movement < raw_movement * 0.5f);
    std::cout << "  HandSmoother reduces landmark jitter: PASS" << std::endl;
}

void TestMotionAnalyzer() {
    std::cout << "Testing MotionAnalyzer..." << std::endl;

    MotionAnalyzer analyzer;

    HandLandmarks landmarks;
    for (int i = 0; i < 21; ++i) {
        landmarks[i].position = Point3D(0.3f + i * 0.01f, 0.5f, 0.0f);
    }

    auto info = analyzer.Analyze(landmarks, 1000);
    std::cout << "  Initial motion - speed: " << info.speed
              << ", stable: " << info.is_stable << std::endl;

    for (int i = 0; i < 21; ++i) {
        landmarks[i].position.x += 0.1f;
    }
    info = analyzer.Analyze(landmarks, 1033);
    std::cout << "  After movement - speed: " << info.speed
              << ", fast: " << info.is_fast_motion << std::endl;

    assert(info.speed > 0);
    std::cout << "  MotionAnalyzer detects motion correctly: PASS" << std::endl;
}

void TestQualityEstimator() {
    std::cout << "Testing QualityEstimator..." << std::endl;

    QualityEstimator estimator;

    HandLandmarks good_landmarks;
    for (int i = 0; i < 21; ++i) {
        good_landmarks[i].position = Point3D(0.4f + i * 0.005f, 0.5f, 0.0f);
        good_landmarks[i].visibility = 0.9f;
    }

    auto good_quality = estimator.Estimate(good_landmarks, 1280, 720);
    std::cout << "  Good quality: " << good_quality.overall_quality
              << ", low_quality: " << good_quality.is_low_quality << std::endl;
    assert(!good_quality.is_low_quality);

    HandLandmarks bad_landmarks;
    for (int i = 0; i < 21; ++i) {
        bad_landmarks[i].position = Point3D(0.01f + i * 0.001f, 0.01f, 0.0f);
        bad_landmarks[i].visibility = 0.3f;
    }

    auto bad_quality = estimator.Estimate(bad_landmarks, 1280, 720);
    std::cout << "  Bad quality: " << bad_quality.overall_quality
              << ", low_quality: " << bad_quality.is_low_quality << std::endl;
    assert(bad_quality.is_low_quality || bad_quality.overall_quality < good_quality.overall_quality);

    std::cout << "  QualityEstimator works correctly: PASS" << std::endl;
}

int main() {
    std::cout << "=== Stability and Smoothing Tests ===" << std::endl << std::endl;

    TestKalmanFilter();
    std::cout << std::endl;

    TestOneEuroFilter();
    std::cout << std::endl;

    TestOutlierDetector();
    std::cout << std::endl;

    TestTemporalGestureSmoother();
    std::cout << std::endl;

    TestHandSmoother();
    std::cout << std::endl;

    TestMotionAnalyzer();
    std::cout << std::endl;

    TestQualityEstimator();
    std::cout << std::endl;

    std::cout << "====================================" << std::endl;
    std::cout << "All stability tests passed!" << std::endl;
    return 0;
}
