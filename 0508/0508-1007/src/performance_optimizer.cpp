#include "hand_tracking_sdk/performance_optimizer.h"
#include <numeric>
#include <cmath>
#include <algorithm>

namespace hand_tracking_sdk {

PerformanceProfiler::PerformanceProfiler() {}
PerformanceProfiler::~PerformanceProfiler() {}

void PerformanceProfiler::StartFrame() {
    std::lock_guard<std::mutex> lock(mutex_);
    frame_start_ = std::chrono::high_resolution_clock::now();
}

void PerformanceProfiler::EndFrame() {
    std::lock_guard<std::mutex> lock(mutex_);
    auto now = std::chrono::high_resolution_clock::now();
    float frame_time = std::chrono::duration<float, std::milli>(now - frame_start_).count();

    frame_times_.push_back(frame_time);
    if (frame_times_.size() > MAX_SAMPLES) {
        frame_times_.pop_front();
    }
}

float PerformanceProfiler::GetFPS() const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (frame_times_.empty()) return 0.0f;
    float avg_time = std::accumulate(frame_times_.begin(), frame_times_.end(), 0.0f) / frame_times_.size();
    return avg_time > 0 ? 1000.0f / avg_time : 0.0f;
}

float PerformanceProfiler::GetAverageInferenceTime() const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (inference_times_.empty()) return 0.0f;
    return std::accumulate(inference_times_.begin(), inference_times_.end(), 0.0f) / inference_times_.size();
}

float PerformanceProfiler::GetLastInferenceTime() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return inference_times_.empty() ? 0.0f : inference_times_.back();
}

void PerformanceProfiler::Reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    frame_times_.clear();
    inference_times_.clear();
}

FrameSkipper::FrameSkipper(int target_fps)
    : target_fps_(target_fps), frame_count_(0),
      last_time_(std::chrono::high_resolution_clock::now()) {}

FrameSkipper::~FrameSkipper() {}

bool FrameSkipper::ShouldProcessFrame() {
    frame_count_++;
    auto now = std::chrono::high_resolution_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - last_time_).count();

    if (elapsed >= 1000) {
        frame_count_ = 0;
        last_time_ = now;
        return true;
    }

    int expected_frames = (target_fps_ * elapsed) / 1000;
    return frame_count_ <= expected_frames;
}

void FrameSkipper::SetTargetFPS(int fps) {
    target_fps_ = fps;
    frame_count_ = 0;
    last_time_ = std::chrono::high_resolution_clock::now();
}

int FrameSkipper::GetTargetFPS() const {
    return target_fps_;
}

LowPassFilter::LowPassFilter(float alpha)
    : alpha_(alpha), previous_(0, 0, 0), initialized_(false) {}

LowPassFilter::~LowPassFilter() {}

Point3D LowPassFilter::Filter(const Point3D& input) {
    if (!initialized_) {
        previous_ = input;
        initialized_ = true;
        return input;
    }

    Point3D output;
    output.x = alpha_ * input.x + (1.0f - alpha_) * previous_.x;
    output.y = alpha_ * input.y + (1.0f - alpha_) * previous_.y;
    output.z = alpha_ * input.z + (1.0f - alpha_) * previous_.z;
    previous_ = output;

    return output;
}

void LowPassFilter::Reset() {
    initialized_ = false;
    previous_ = Point3D(0, 0, 0);
}

void LowPassFilter::SetAlpha(float alpha) {
    alpha_ = alpha;
}

KalmanFilter1D::KalmanFilter1D(float process_noise, float measurement_noise,
                               float estimation_error)
    : process_noise_(process_noise),
      measurement_noise_(measurement_noise),
      estimation_error_(estimation_error),
      current_estimate_(0.0f),
      previous_estimate_(0.0f),
      kalman_gain_(0.0f),
      initialized_(false) {}

KalmanFilter1D::~KalmanFilter1D() {}

float KalmanFilter1D::Filter(float measurement) {
    if (!initialized_) {
        current_estimate_ = measurement;
        previous_estimate_ = measurement;
        initialized_ = true;
        return measurement;
    }

    current_estimate_ = previous_estimate_;
    estimation_error_ += process_noise_;

    kalman_gain_ = estimation_error_ / (estimation_error_ + measurement_noise_);
    current_estimate_ = current_estimate_ + kalman_gain_ * (measurement - current_estimate_);
    estimation_error_ = (1.0f - kalman_gain_) * estimation_error_;

    previous_estimate_ = current_estimate_;
    return current_estimate_;
}

void KalmanFilter1D::Reset(float initial_value) {
    current_estimate_ = initial_value;
    previous_estimate_ = initial_value;
    estimation_error_ = 1.0f;
    kalman_gain_ = 0.0f;
    initialized_ = false;
}

void KalmanFilter1D::SetProcessNoise(float noise) {
    process_noise_ = noise;
}

void KalmanFilter1D::SetMeasurementNoise(float noise) {
    measurement_noise_ = noise;
}

KalmanFilter3D::KalmanFilter3D(float process_noise, float measurement_noise)
    : filter_x_(process_noise, measurement_noise),
      filter_y_(process_noise, measurement_noise),
      filter_z_(process_noise, measurement_noise) {}

KalmanFilter3D::~KalmanFilter3D() {}

Point3D KalmanFilter3D::Filter(const Point3D& measurement) {
    return Point3D(
        filter_x_.Filter(measurement.x),
        filter_y_.Filter(measurement.y),
        filter_z_.Filter(measurement.z)
    );
}

void KalmanFilter3D::Reset(const Point3D& initial_value) {
    filter_x_.Reset(initial_value.x);
    filter_y_.Reset(initial_value.y);
    filter_z_.Reset(initial_value.z);
}

void KalmanFilter3D::SetProcessNoise(float noise) {
    filter_x_.SetProcessNoise(noise);
    filter_y_.SetProcessNoise(noise);
    filter_z_.SetProcessNoise(noise);
}

void KalmanFilter3D::SetMeasurementNoise(float noise) {
    filter_x_.SetMeasurementNoise(noise);
    filter_y_.SetMeasurementNoise(noise);
    filter_z_.SetMeasurementNoise(noise);
}

class OneEuroFilter::Impl {
public:
    Impl(float min_cutoff, float beta, float d_cutoff)
        : min_cutoff_(min_cutoff), beta_(beta), d_cutoff_(d_cutoff),
          initialized_(false),
          x_prev_(0.0f), dx_prev_(0.0f),
          y_prev_(0.0f), dy_prev_(0.0f),
          z_prev_(0.0f), dz_prev_(0.0f),
          last_time_(-1.0f) {}

    float Filter1D(float value, float prev, float d_prev, float& d_out, float dt) {
        const float kAlpha = 0.5f;
        float d_cutoff = d_cutoff_;

        float ed = dt * d_cutoff;
        float alpha_d = ed / (1.0f + ed);
        float dx = (value - prev) / dt;
        dx = alpha_d * dx + (1.0f - alpha_d) * d_prev;

        float cutoff = min_cutoff_ + beta_ * std::abs(dx);
        float e = dt * cutoff;
        float alpha = e / (1.0f + e);

        d_out = dx;
        return alpha * value + (1.0f - alpha) * prev;
    }

    Point3D Filter(const Point3D& measurement, float dt) {
        if (!initialized_ || last_time_ < 0) {
            x_prev_ = measurement.x;
            y_prev_ = measurement.y;
            z_prev_ = measurement.z;
            dx_prev_ = 0.0f;
            dy_prev_ = 0.0f;
            dz_prev_ = 0.0f;
            initialized_ = true;
            last_time_ = 0.0f;
            return measurement;
        }

        float dx, dy, dz;
        Point3D result;
        result.x = Filter1D(measurement.x, x_prev_, dx_prev_, dx, dt);
        result.y = Filter1D(measurement.y, y_prev_, dy_prev_, dy, dt);
        result.z = Filter1D(measurement.z, z_prev_, dz_prev_, dz, dt);

        x_prev_ = result.x;
        y_prev_ = result.y;
        z_prev_ = result.z;
        dx_prev_ = dx;
        dy_prev_ = dy;
        dz_prev_ = dz;

        return result;
    }

    void Reset() {
        initialized_ = false;
        last_time_ = -1.0f;
        x_prev_ = y_prev_ = z_prev_ = 0.0f;
        dx_prev_ = dy_prev_ = dz_prev_ = 0.0f;
    }

    void SetParameters(float min_cutoff, float beta, float d_cutoff) {
        min_cutoff_ = min_cutoff;
        beta_ = beta;
        d_cutoff_ = d_cutoff;
    }

private:
    float min_cutoff_;
    float beta_;
    float d_cutoff_;
    bool initialized_;
    float x_prev_, dx_prev_;
    float y_prev_, dy_prev_;
    float z_prev_, dz_prev_;
    float last_time_;
};

OneEuroFilter::OneEuroFilter(float min_cutoff, float beta, float d_cutoff)
    : impl_(std::make_unique<Impl>(min_cutoff, beta, d_cutoff)) {}

OneEuroFilter::~OneEuroFilter() = default;

Point3D OneEuroFilter::Filter(const Point3D& measurement, float delta_time) {
    return impl_->Filter(measurement, delta_time);
}

void OneEuroFilter::Reset() {
    impl_->Reset();
}

void OneEuroFilter::SetParameters(float min_cutoff, float beta, float d_cutoff) {
    impl_->SetParameters(min_cutoff, beta, d_cutoff);
}

HandSmoother::HandSmoother(SmoothMode mode)
    : mode_(mode), smooth_strength_(0.5f), initialized_(false) {
    for (int i = 0; i < 21; ++i) {
        kalman_filters_[i] = std::make_unique<KalmanFilter3D>(0.005f, 0.05f);
        lowpass_filters_[i] = std::make_unique<LowPassFilter>(0.3f);
        one_euro_filters_[i] = std::make_unique<OneEuroFilter>(1.0f, 0.007f, 1.0f);
    }
}

HandSmoother::~HandSmoother() = default;

HandLandmarks HandSmoother::Smooth(const HandLandmarks& input) {
    auto now = std::chrono::high_resolution_clock::now();
    float dt = 0.033f;

    if (initialized_) {
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(
            now - last_timestamp_).count();
        dt = std::max(0.001f, duration / 1000.0f);
    }
    last_timestamp_ = now;
    initialized_ = true;

    HandLandmarks smoothed = input;

    for (int i = 0; i < 21; ++i) {
        switch (mode_) {
            case SmoothMode::LOW_PASS:
                smoothed[i].position = lowpass_filters_[i]->Filter(input[i].position);
                break;
            case SmoothMode::KALMAN:
                smoothed[i].position = kalman_filters_[i]->Filter(input[i].position);
                break;
            case SmoothMode::ONE_EURO:
                smoothed[i].position = one_euro_filters_[i]->Filter(input[i].position, dt);
                break;
        }
    }

    return smoothed;
}

void HandSmoother::Reset() {
    for (int i = 0; i < 21; ++i) {
        kalman_filters_[i]->Reset();
        lowpass_filters_[i]->Reset();
        one_euro_filters_[i]->Reset();
    }
    initialized_ = false;
}

void HandSmoother::SetMode(SmoothMode mode) {
    if (mode_ != mode) {
        Reset();
        mode_ = mode;
    }
}

void HandSmoother::SetSmoothStrength(float strength) {
    smooth_strength_ = std::max(0.0f, std::min(1.0f, strength));

    float lp_alpha = 0.1f + smooth_strength_ * 0.5f;
    for (auto& f : lowpass_filters_) {
        f->SetAlpha(lp_alpha);
    }

    float k_process = 0.001f + smooth_strength_ * 0.02f;
    float k_meas = 0.01f + smooth_strength_ * 0.1f;
    for (auto& f : kalman_filters_) {
        f->SetProcessNoise(k_process);
        f->SetMeasurementNoise(k_meas);
    }

    float oe_min_cutoff = 0.1f + (1.0f - smooth_strength_) * 2.0f;
    float oe_beta = 0.001f + (1.0f - smooth_strength_) * 0.02f;
    for (auto& f : one_euro_filters_) {
        f->SetParameters(oe_min_cutoff, oe_beta, 1.0f);
    }
}

OutlierDetector::OutlierDetector(float threshold, size_t window_size)
    : threshold_(threshold), window_size_(window_size) {
    Reset();
}

OutlierDetector::~OutlierDetector() = default;

void OutlierDetector::UpdateStatistics(size_t landmark_index) {
    auto& hist = history_[landmark_index];
    if (hist.empty()) return;

    Point3D sum(0, 0, 0);
    for (const auto& p : hist) {
        sum.x += p.x;
        sum.y += p.y;
        sum.z += p.z;
    }
    means_[landmark_index] = Point3D(
        sum.x / hist.size(),
        sum.y / hist.size(),
        sum.z / hist.size()
    );

    Point3D sq_sum(0, 0, 0);
    for (const auto& p : hist) {
        sq_sum.x += (p.x - means_[landmark_index].x) * (p.x - means_[landmark_index].x);
        sq_sum.y += (p.y - means_[landmark_index].y) * (p.y - means_[landmark_index].y);
        sq_sum.z += (p.z - means_[landmark_index].z) * (p.z - means_[landmark_index].z);
    }
    stddevs_[landmark_index] = Point3D(
        std::sqrt(sq_sum.x / hist.size()),
        std::sqrt(sq_sum.y / hist.size()),
        std::sqrt(sq_sum.z / hist.size())
    );
}

bool OutlierDetector::IsOutlier(const Point3D& point, size_t landmark_index) {
    if (landmark_index >= 21) return false;

    auto& hist = history_[landmark_index];
    if (hist.size() < window_size_) {
        hist.push_back(point);
        UpdateStatistics(landmark_index);
        outlier_flags_[landmark_index] = false;
        return false;
    }

    const Point3D& mean = means_[landmark_index];
    const Point3D& stddev = stddevs_[landmark_index];

    float zx = stddev.x > 0.001f ? std::abs(point.x - mean.x) / stddev.x : 0;
    float zy = stddev.y > 0.001f ? std::abs(point.y - mean.y) / stddev.y : 0;
    float zz = stddev.z > 0.001f ? std::abs(point.z - mean.z) / stddev.z : 0;

    bool is_outlier = (zx > threshold_ || zy > threshold_ || zz > threshold_);
    outlier_flags_[landmark_index] = is_outlier;

    if (!is_outlier) {
        hist.push_back(point);
        if (hist.size() > window_size_) {
            hist.pop_front();
        }
        UpdateStatistics(landmark_index);
    }

    return is_outlier;
}

Point3D OutlierDetector::GetSmoothedPoint(const Point3D& point, size_t landmark_index) {
    if (IsOutlier(point, landmark_index)) {
        return means_[landmark_index];
    }
    return point;
}

void OutlierDetector::Reset() {
    for (int i = 0; i < 21; ++i) {
        history_[i].clear();
        means_[i] = Point3D(0, 0, 0);
        stddevs_[i] = Point3D(0, 0, 0);
        outlier_flags_[i] = false;
    }
}

void OutlierDetector::SetThreshold(float threshold) {
    threshold_ = threshold;
}

TemporalGestureSmoother::TemporalGestureSmoother(size_t window_size, float min_consistency)
    : window_size_(window_size),
      min_consistency_(min_consistency),
      stable_gesture_(GestureType::NONE),
      stable_confidence_(0.0f) {}

TemporalGestureSmoother::~TemporalGestureSmoother() = default;

GestureType TemporalGestureSmoother::FindMajorityGesture() const {
    if (gesture_history_.empty()) return GestureType::NONE;

    std::array<int, static_cast<int>(GestureType::COUNT)> counts = {0};
    for (auto g : gesture_history_) {
        counts[static_cast<int>(g)]++;
    }

    int max_count = 0;
    GestureType majority = GestureType::NONE;
    for (int i = 0; i < static_cast<int>(GestureType::COUNT); ++i) {
        if (counts[i] > max_count) {
            max_count = counts[i];
            majority = static_cast<GestureType>(i);
        }
    }

    float ratio = static_cast<float>(max_count) / gesture_history_.size();
    if (ratio >= min_consistency_) {
        return majority;
    }

    return stable_gesture_;
}

float TemporalGestureSmoother::CalculateConfidence() const {
    if (confidence_history_.empty()) return 0.0f;
    float sum = 0.0f;
    for (float c : confidence_history_) {
        sum += c;
    }
    return sum / confidence_history_.size();
}

GestureResult TemporalGestureSmoother::Smooth(const GestureResult& current_result) {
    gesture_history_.push_back(current_result.type);
    confidence_history_.push_back(current_result.confidence);

    while (gesture_history_.size() > window_size_) {
        gesture_history_.pop_front();
    }
    while (confidence_history_.size() > window_size_) {
        confidence_history_.pop_front();
    }

    GestureType new_stable = FindMajorityGesture();
    float avg_confidence = CalculateConfidence();

    if (gesture_history_.size() >= window_size_ / 2) {
        stable_gesture_ = new_stable;
        stable_confidence_ = avg_confidence;
    }

    GestureResult result;
    result.type = stable_gesture_;
    result.confidence = stable_confidence_;
    result.name = GestureTypeToString(stable_gesture_);

    return result;
}

void TemporalGestureSmoother::Reset() {
    gesture_history_.clear();
    confidence_history_.clear();
    stable_gesture_ = GestureType::NONE;
    stable_confidence_ = 0.0f;
}

void TemporalGestureSmoother::SetWindowSize(size_t size) {
    window_size_ = size;
    while (gesture_history_.size() > window_size_) {
        gesture_history_.pop_front();
    }
    while (confidence_history_.size() > window_size_) {
        confidence_history_.pop_front();
    }
}

void TemporalGestureSmoother::SetMinConsistency(float consistency) {
    min_consistency_ = consistency;
}

GestureType TemporalGestureSmoother::GetStableGesture() const {
    return stable_gesture_;
}

MotionAnalyzer::MotionAnalyzer()
    : initialized_(false),
      current_speed_(0.0f),
      previous_speed_(0.0f),
      previous_timestamp_(0) {}

MotionAnalyzer::~MotionAnalyzer() = default;

float MotionAnalyzer::CalculateHandSpeed(const HandLandmarks& prev,
                                         const HandLandmarks& curr,
                                         float delta_time) const {
    float total_dist = 0.0f;
    int count = 0;

    for (int i = 0; i < 21; ++i) {
        float dx = curr[i].position.x - prev[i].position.x;
        float dy = curr[i].position.y - prev[i].position.y;
        float dz = curr[i].position.z - prev[i].position.z;
        total_dist += std::sqrt(dx * dx + dy * dy + dz * dz);
        count++;
    }

    float avg_dist = count > 0 ? total_dist / count : 0.0f;
    return delta_time > 0 ? avg_dist / delta_time : 0.0f;
}

MotionAnalyzer::MotionInfo MotionAnalyzer::Analyze(const HandLandmarks& landmarks, int64_t timestamp_ms) {
    MotionInfo info;

    if (!initialized_ || previous_timestamp_ == 0) {
        previous_landmarks_ = landmarks;
        previous_timestamp_ = timestamp_ms;
        initialized_ = true;
        current_speed_ = 0.0f;
        previous_speed_ = 0.0f;
        return info;
    }

    float delta_time = (timestamp_ms - previous_timestamp_) / 1000.0f;
    delta_time = std::max(0.001f, delta_time);

    current_speed_ = CalculateHandSpeed(previous_landmarks_, landmarks, delta_time);
    info.speed = current_speed_;

    info.acceleration = delta_time > 0 ? (current_speed_ - previous_speed_) / delta_time : 0.0f;
    info.is_fast_motion = current_speed_ > 2.0f;
    info.is_stable = current_speed_ < 0.5f;

    previous_landmarks_ = landmarks;
    previous_timestamp_ = timestamp_ms;
    previous_speed_ = current_speed_;
    current_motion_ = info;

    return info;
}

void MotionAnalyzer::Reset() {
    initialized_ = false;
    previous_timestamp_ = 0;
    current_speed_ = 0.0f;
    previous_speed_ = 0.0f;
}

float MotionAnalyzer::GetAdaptiveSmoothAlpha() const {
    float speed_factor = std::min(1.0f, current_speed_ / 3.0f);
    float alpha = 0.1f + speed_factor * 0.6f;
    return alpha;
}

QualityEstimator::QualityEstimator() = default;
QualityEstimator::~QualityEstimator() = default;

float QualityEstimator::CalculateVisibilityScore(const HandLandmarks& landmarks) const {
    float avg_visibility = 0.0f;
    for (const auto& lm : landmarks) {
        avg_visibility += lm.visibility;
    }
    avg_visibility /= 21.0f;
    return avg_visibility;
}

float QualityEstimator::CalculatePositionScore(const HandLandmarks& landmarks,
                                              int frame_width, int frame_height) const {
    float min_x = 1.0f, max_x = 0.0f, min_y = 1.0f, max_y = 0.0f;
    for (const auto& lm : landmarks) {
        min_x = std::min(min_x, lm.position.x);
        max_x = std::max(max_x, lm.position.x);
        min_y = std::min(min_y, lm.position.y);
        max_y = std::max(max_y, lm.position.y);
    }

    float center_x = (min_x + max_x) / 2.0f;
    float center_y = (min_y + max_y) / 2.0f;

    float dx = std::abs(center_x - 0.5f) * 2.0f;
    float dy = std::abs(center_y - 0.5f) * 2.0f;

    float dist_from_center = std::sqrt(dx * dx + dy * dy);
    return std::max(0.0f, 1.0f - dist_from_center);
}

float QualityEstimator::CalculateSizeScore(const HandLandmarks& landmarks) const {
    float min_x = 1.0f, max_x = 0.0f, min_y = 1.0f, max_y = 0.0f;
    for (const auto& lm : landmarks) {
        min_x = std::min(min_x, lm.position.x);
        max_x = std::max(max_x, lm.position.x);
        min_y = std::min(min_y, lm.position.y);
        max_y = std::max(max_y, lm.position.y);
    }

    float width = max_x - min_x;
    float height = max_y - min_y;
    float size = std::max(width, height);

    if (size < 0.05f) return 0.0f;
    if (size < 0.1f) return 0.3f;
    if (size > 0.5f) return 0.5f;
    return 1.0f;
}

QualityEstimator::QualityInfo QualityEstimator::Estimate(const HandLandmarks& landmarks,
                                                        int frame_width, int frame_height) {
    QualityInfo info;
    info.visibility_score = CalculateVisibilityScore(landmarks);
    info.position_score = CalculatePositionScore(landmarks, frame_width, frame_height);
    info.size_score = CalculateSizeScore(landmarks);

    info.overall_quality = 0.4f * info.visibility_score +
                           0.3f * info.position_score +
                           0.3f * info.size_score;

    info.is_low_quality = info.overall_quality < 0.4f;

    return info;
}

void QualityEstimator::Reset() {}

}
