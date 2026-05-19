#pragma once

#include "hand_tracking_sdk/common.h"
#include <memory>
#include <chrono>
#include <deque>
#include <mutex>
#include <array>
#include <vector>

namespace hand_tracking_sdk {

class PerformanceProfiler {
public:
    PerformanceProfiler();
    ~PerformanceProfiler();

    void StartFrame();
    void EndFrame();
    float GetFPS() const;
    float GetAverageInferenceTime() const;
    float GetLastInferenceTime() const;

    void Reset();

private:
    mutable std::mutex mutex_;
    std::chrono::high_resolution_clock::time_point frame_start_;
    std::deque<float> frame_times_;
    std::deque<float> inference_times_;
    static const size_t MAX_SAMPLES = 60;
};

class FrameSkipper {
public:
    FrameSkipper(int target_fps = 30);
    ~FrameSkipper();

    bool ShouldProcessFrame();
    void SetTargetFPS(int fps);
    int GetTargetFPS() const;

private:
    int target_fps_;
    int frame_count_;
    std::chrono::high_resolution_clock::time_point last_time_;
};

class LowPassFilter {
public:
    explicit LowPassFilter(float alpha = 0.5f);
    ~LowPassFilter();

    Point3D Filter(const Point3D& input);
    void Reset();
    void SetAlpha(float alpha);

private:
    float alpha_;
    Point3D previous_;
    bool initialized_;
};

class KalmanFilter1D {
public:
    KalmanFilter1D(float process_noise = 0.01f, float measurement_noise = 0.1f,
                   float estimation_error = 1.0f);
    ~KalmanFilter1D();

    float Filter(float measurement);
    void Reset(float initial_value = 0.0f);
    void SetProcessNoise(float noise);
    void SetMeasurementNoise(float noise);

private:
    float process_noise_;
    float measurement_noise_;
    float estimation_error_;
    float current_estimate_;
    float previous_estimate_;
    float kalman_gain_;
    bool initialized_;
};

class KalmanFilter3D {
public:
    KalmanFilter3D(float process_noise = 0.01f, float measurement_noise = 0.1f);
    ~KalmanFilter3D();

    Point3D Filter(const Point3D& measurement);
    void Reset(const Point3D& initial_value = Point3D(0, 0, 0));
    void SetProcessNoise(float noise);
    void SetMeasurementNoise(float noise);

private:
    KalmanFilter1D filter_x_;
    KalmanFilter1D filter_y_;
    KalmanFilter1D filter_z_;
};

class OneEuroFilter {
public:
    explicit OneEuroFilter(float min_cutoff = 1.0f, float beta = 0.007f,
                           float d_cutoff = 1.0f);
    ~OneEuroFilter();

    Point3D Filter(const Point3D& measurement, float delta_time);
    void Reset();
    void SetParameters(float min_cutoff, float beta, float d_cutoff);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class HandSmoother {
public:
    enum class SmoothMode {
        LOW_PASS,
        KALMAN,
        ONE_EURO
    };

    explicit HandSmoother(SmoothMode mode = SmoothMode::ONE_EURO);
    ~HandSmoother();

    HandLandmarks Smooth(const HandLandmarks& input);
    void Reset();
    void SetMode(SmoothMode mode);
    void SetSmoothStrength(float strength);

private:
    SmoothMode mode_;
    float smooth_strength_;
    std::array<std::unique_ptr<KalmanFilter3D>, 21> kalman_filters_;
    std::array<std::unique_ptr<LowPassFilter>, 21> lowpass_filters_;
    std::array<std::unique_ptr<OneEuroFilter>, 21> one_euro_filters_;
    std::chrono::high_resolution_clock::time_point last_timestamp_;
    bool initialized_;
};

class OutlierDetector {
public:
    OutlierDetector(float threshold = 3.0f, size_t window_size = 10);
    ~OutlierDetector();

    bool IsOutlier(const Point3D& point, size_t landmark_index);
    Point3D GetSmoothedPoint(const Point3D& point, size_t landmark_index);
    void Reset();
    void SetThreshold(float threshold);

private:
    float threshold_;
    size_t window_size_;
    std::array<std::deque<Point3D>, 21> history_;
    std::array<Point3D, 21> means_;
    std::array<Point3D, 21> stddevs_;
    std::array<bool, 21> outlier_flags_;

    void UpdateStatistics(size_t landmark_index);
};

class TemporalGestureSmoother {
public:
    explicit TemporalGestureSmoother(size_t window_size = 8,
                                     float min_consistency = 0.6f);
    ~TemporalGestureSmoother();

    GestureResult Smooth(const GestureResult& current_result);
    void Reset();
    void SetWindowSize(size_t size);
    void SetMinConsistency(float consistency);
    GestureType GetStableGesture() const;

private:
    size_t window_size_;
    float min_consistency_;
    std::deque<GestureType> gesture_history_;
    std::deque<float> confidence_history_;
    GestureType stable_gesture_;
    float stable_confidence_;

    GestureType FindMajorityGesture() const;
    float CalculateConfidence() const;
};

class MotionAnalyzer {
public:
    MotionAnalyzer();
    ~MotionAnalyzer();

    struct MotionInfo {
        float speed = 0.0f;
        float acceleration = 0.0f;
        float direction_change = 0.0f;
        bool is_fast_motion = false;
        bool is_stable = true;
    };

    MotionInfo Analyze(const HandLandmarks& landmarks, int64_t timestamp_ms);
    void Reset();

    float GetAdaptiveSmoothAlpha() const;
    float GetCurrentSpeed() const { return current_speed_; }

private:
    bool initialized_;
    HandLandmarks previous_landmarks_;
    int64_t previous_timestamp_;
    float current_speed_;
    float previous_speed_;
    MotionInfo current_motion_;

    float CalculateHandSpeed(const HandLandmarks& prev,
                             const HandLandmarks& curr,
                             float delta_time) const;
};

class QualityEstimator {
public:
    QualityEstimator();
    ~QualityEstimator();

    struct QualityInfo {
        float overall_quality = 1.0f;
        float visibility_score = 1.0f;
        float position_score = 1.0f;
        float size_score = 1.0f;
        bool is_low_quality = false;
    };

    QualityInfo Estimate(const HandLandmarks& landmarks, int frame_width, int frame_height);
    void Reset();

private:
    float CalculateVisibilityScore(const HandLandmarks& landmarks) const;
    float CalculatePositionScore(const HandLandmarks& landmarks,
                                 int frame_width, int frame_height) const;
    float CalculateSizeScore(const HandLandmarks& landmarks) const;
};

}
