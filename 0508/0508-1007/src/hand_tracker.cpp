#include "hand_tracking_sdk/hand_tracker.h"
#include "hand_tracking_sdk/gesture_recognizer.h"
#include "hand_tracking_sdk/performance_optimizer.h"
#include "hand_tracking_sdk/multi_user_tracker.h"
#include <chrono>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <queue>
#include <atomic>
#include <cmath>

namespace hand_tracking_sdk {

namespace {

class MockHandModel {
public:
    MockHandModel() {
        InitializeHandTemplate();
    }

    void InitializeHandTemplate() {
        template_landmarks_[0] = Point3D(0.0f, 0.0f, 0.0f);
        template_landmarks_[1] = Point3D(0.1f, -0.1f, 0.0f);
        template_landmarks_[2] = Point3D(0.18f, -0.22f, 0.02f);
        template_landmarks_[3] = Point3D(0.25f, -0.3f, 0.04f);
        template_landmarks_[4] = Point3D(0.32f, -0.38f, 0.06f);
        template_landmarks_[5] = Point3D(0.05f, -0.35f, 0.0f);
        template_landmarks_[6] = Point3D(0.05f, -0.5f, 0.05f);
        template_landmarks_[7] = Point3D(0.05f, -0.6f, 0.08f);
        template_landmarks_[8] = Point3D(0.05f, -0.7f, 0.1f);
        template_landmarks_[9] = Point3D(-0.05f, -0.35f, 0.0f);
        template_landmarks_[10] = Point3D(-0.05f, -0.52f, 0.05f);
        template_landmarks_[11] = Point3D(-0.05f, -0.63f, 0.08f);
        template_landmarks_[12] = Point3D(-0.05f, -0.74f, 0.1f);
        template_landmarks_[13] = Point3D(-0.15f, -0.33f, 0.0f);
        template_landmarks_[14] = Point3D(-0.15f, -0.48f, 0.05f);
        template_landmarks_[15] = Point3D(-0.15f, -0.58f, 0.08f);
        template_landmarks_[16] = Point3D(-0.15f, -0.68f, 0.1f);
        template_landmarks_[17] = Point3D(-0.25f, -0.28f, 0.0f);
        template_landmarks_[18] = Point3D(-0.28f, -0.4f, 0.05f);
        template_landmarks_[19] = Point3D(-0.3f, -0.48f, 0.08f);
        template_landmarks_[20] = Point3D(-0.32f, -0.56f, 0.1f);
    }

    void GenerateRandomLandmarks(HandLandmarks& landmarks, const cv::Mat& frame) {
        float center_x = 0.5f + (rand() % 100 - 50) / 500.0f;
        float center_y = 0.5f + (rand() % 100 - 50) / 500.0f;
        float scale = 0.15f + (rand() % 50) / 500.0f;

        for (int i = 0; i < 21; ++i) {
            landmarks[i].position.x = center_x + template_landmarks_[i].x * scale;
            landmarks[i].position.y = center_y + template_landmarks_[i].y * scale;
            landmarks[i].position.z = template_landmarks_[i].z * scale;
            landmarks[i].visibility = 0.8f + (rand() % 20) / 100.0f;
            landmarks[i].presence = 0.85f + (rand() % 15) / 100.0f;
        }
    }

    void AddJitter(HandLandmarks& landmarks, float amount = 0.01f) {
        for (int i = 0; i < 21; ++i) {
            landmarks[i].position.x += (rand() % 100 - 50) / 5000.0f * amount * 10;
            landmarks[i].position.y += (rand() % 100 - 50) / 5000.0f * amount * 10;
            landmarks[i].position.z += (rand() % 100 - 50) / 5000.0f * amount * 10;
        }
    }

private:
    std::array<Point3D, 21> template_landmarks_;
};

}

class HandTracker::Impl {
public:
    Impl() : initialized_(false), running_(false), frame_count_(0) {}

    ~Impl() {
        Release();
    }

    bool Initialize(const TrackerConfig& config) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (initialized_) return false;

        config_ = config;
        gesture_recognizer_ = std::make_unique<GestureRecognizer>();
        if (!gesture_recognizer_->Initialize()) {
            return false;
        }

        profiler_ = std::make_unique<PerformanceProfiler>();
        frame_skipper_ = std::make_unique<FrameSkipper>(30);

        int num_hands = (config_.mode == TrackingMode::SINGLE_HAND) ? 1 : config_.max_num_hands;
        num_hands = std::max(1, std::min(num_hands, 4));
        for (int i = 0; i < num_hands; ++i) {
            hand_smoothers_.emplace_back(std::make_unique<HandSmoother>(HandSmoother::SmoothMode::ONE_EURO));
            outlier_detectors_.emplace_back(std::make_unique<OutlierDetector>(2.5f, 8));
            gesture_smoothers_.emplace_back(std::make_unique<TemporalGestureSmoother>(6, 0.5f));
            motion_analyzers_.emplace_back(std::make_unique<MotionAnalyzer>());
            quality_estimators_.emplace_back(std::make_unique<QualityEstimator>());
        }

        if (config_.enable_multi_user_tracking || config_.mode == TrackingMode::MULTI_USER) {
            multi_user_tracker_ = std::make_unique<MultiUserTracker>();
            if (!multi_user_tracker_->Initialize(config)) {
                return false;
            }
        }

        mock_model_ = std::make_unique<MockHandModel>();

        if (config_.mode == TrackingMode::MULTI_HAND || config_.mode == TrackingMode::MULTI_USER) {
            running_ = true;
            worker_thread_ = std::thread(&Impl::AsyncWorker, this);
        }

        initialized_ = true;
        return true;
    }

    bool ProcessFrame(const cv::Mat& frame, FrameResult& result) {
        if (!initialized_) return false;

        std::lock_guard<std::mutex> lock(mutex_);
        auto start_time = std::chrono::high_resolution_clock::now();

        result.timestamp_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
        result.width = frame.cols;
        result.height = frame.rows;
        result.hands.clear();

        if (!frame_skipper_->ShouldProcessFrame()) {
            result = last_result_;
            return true;
        }

        int num_hands = (config_.mode == TrackingMode::SINGLE_HAND) ? 1 : config_.max_num_hands;
        num_hands = std::max(1, std::min(num_hands, 2));

        for (int i = 0; i < num_hands; ++i) {
            HandResult hand;
            mock_model_->GenerateRandomLandmarks(hand.landmarks, frame);

            if (frame_count_ > 10) {
                mock_model_->AddJitter(hand.landmarks, 0.5f);
            }

            if (static_cast<size_t>(i) < quality_estimators_.size()) {
                auto quality = quality_estimators_[i]->Estimate(hand.landmarks, frame.cols, frame.rows);

                if (!quality.is_low_quality) {
                    for (int j = 0; j < 21; ++j) {
                        hand.landmarks[j].position =
                            outlier_detectors_[i]->GetSmoothedPoint(hand.landmarks[j].position, j);
                    }
                }

                auto motion = motion_analyzers_[i]->Analyze(hand.landmarks, result.timestamp_ms);

                float adaptive_strength = 0.5f;
                if (motion.is_fast_motion) {
                    adaptive_strength = 0.2f;
                } else if (motion.is_stable) {
                    adaptive_strength = 0.7f;
                }

                if (quality.is_low_quality) {
                    adaptive_strength = std::min(1.0f, adaptive_strength + 0.3f);
                }

                hand_smoothers_[i]->SetSmoothStrength(adaptive_strength);
                hand.landmarks = hand_smoothers_[i]->Smooth(hand.landmarks);

                if (config_.enable_gesture_recognition) {
                    GestureResult raw_gesture = gesture_recognizer_->Recognize(hand.landmarks, hand.is_left_hand);

                    if (quality.is_low_quality && last_result_.hands.size() > static_cast<size_t>(i)) {
                        hand.gesture = last_result_.hands[i].gesture;
                    } else {
                        hand.gesture = gesture_smoothers_[i]->Smooth(raw_gesture);
                    }

                    if (motion.is_fast_motion && hand.gesture.type != GestureType::NONE) {
                        float motion_penalty = std::min(0.3f, motion.speed * 0.1f);
                        hand.gesture.confidence = std::max(0.0f, hand.gesture.confidence - motion_penalty);
                    }

                    if (quality.is_low_quality) {
                        hand.gesture.confidence *= quality.overall_quality;
                    }
                }
            }

            hand.world_landmarks = hand.landmarks;
            hand.is_left_hand = (i == 0 || i == 2);
            hand.hand_score = 0.7f + (rand() % 30) / 100.0f;

            float min_x = 1.0f, min_y = 1.0f, max_x = 0.0f, max_y = 0.0f;
            for (const auto& lm : hand.landmarks) {
                min_x = std::min(min_x, lm.position.x);
                min_y = std::min(min_y, lm.position.y);
                max_x = std::max(max_x, lm.position.x);
                max_y = std::max(max_y, lm.position.y);
            }
            hand.bounding_box = {min_x, min_y, max_x, max_y};

            result.hands.push_back(hand);
        }

        if (multi_user_tracker_) {
            multi_user_tracker_->AssignHandsToUsers(result.hands, result.users, result.timestamp_ms);
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        result.inference_time_ms = std::chrono::duration<float, std::milli>(end_time - start_time).count();

        last_result_ = result;
        frame_count_++;

        return true;
    }

    bool ProcessFrameAsync(const cv::Mat& frame) {
        if (!initialized_ || (config_.mode != TrackingMode::MULTI_HAND &&
                              config_.mode != TrackingMode::MULTI_USER)) return false;

        std::lock_guard<std::mutex> lock(queue_mutex_);
        if (frame_queue_.size() >= 2) {
            frame_queue_.pop();
        }
        frame_queue_.push(frame.clone());
        cv_.notify_one();
        return true;
    }

    bool GetLatestResult(FrameResult& result) {
        if (!initialized_) return false;

        std::lock_guard<std::mutex> lock(result_mutex_);
        if (latest_result_.hands.empty()) return false;
        result = latest_result_;
        return true;
    }

    void Release() {
        running_ = false;
        cv_.notify_all();

        if (worker_thread_.joinable()) {
            worker_thread_.join();
        }

        std::lock_guard<std::mutex> lock(mutex_);
        gesture_recognizer_.reset();
        profiler_.reset();
        frame_skipper_.reset();
        hand_smoothers_.clear();
        outlier_detectors_.clear();
        gesture_smoothers_.clear();
        motion_analyzers_.clear();
        quality_estimators_.clear();
        multi_user_tracker_.reset();
        mock_model_.reset();
        initialized_ = false;
        frame_count_ = 0;
    }

    bool IsInitialized() const { return initialized_; }
    const TrackerConfig& GetConfig() const { return config_; }

private:
    void AsyncWorker() {
        while (running_) {
            cv::Mat frame;
            {
                std::unique_lock<std::mutex> lock(queue_mutex_);
                cv_.wait(lock, [this] { return !frame_queue_.empty() || !running_; });
                if (!running_) break;
                frame = frame_queue_.front();
                frame_queue_.pop();
            }

            FrameResult result;
            ProcessFrameInternal(frame, result);

            std::lock_guard<std::mutex> lock(result_mutex_);
            latest_result_ = result;
        }
    }

    bool ProcessFrameInternal(const cv::Mat& frame, FrameResult& result) {
        auto start_time = std::chrono::high_resolution_clock::now();

        result.timestamp_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
        result.width = frame.cols;
        result.height = frame.rows;
        result.hands.clear();

        int num_hands = config_.max_num_hands;
        for (int i = 0; i < num_hands; ++i) {
            HandResult hand;
            mock_model_->GenerateRandomLandmarks(hand.landmarks, frame);

            auto quality = quality_estimators_[i]->Estimate(hand.landmarks, frame.cols, frame.rows);

            if (!quality.is_low_quality) {
                for (int j = 0; j < 21; ++j) {
                    hand.landmarks[j].position =
                        outlier_detectors_[i]->GetSmoothedPoint(hand.landmarks[j].position, j);
                }
            }

            auto motion = motion_analyzers_[i]->Analyze(hand.landmarks, result.timestamp_ms);

            float adaptive_strength = motion.is_fast_motion ? 0.2f : (motion.is_stable ? 0.7f : 0.5f);
            hand_smoothers_[i]->SetSmoothStrength(adaptive_strength);
            hand.landmarks = hand_smoothers_[i]->Smooth(hand.landmarks);
            hand.world_landmarks = hand.landmarks;

            hand.is_left_hand = (i == 0);
            hand.hand_score = 0.75f + (rand() % 25) / 100.0f;

            float min_x = 1.0f, min_y = 1.0f, max_x = 0.0f, max_y = 0.0f;
            for (const auto& lm : hand.landmarks) {
                min_x = std::min(min_x, lm.position.x);
                min_y = std::min(min_y, lm.position.y);
                max_x = std::max(max_x, lm.position.x);
                max_y = std::max(max_y, lm.position.y);
            }
            hand.bounding_box = {min_x, min_y, max_x, max_y};

            if (config_.enable_gesture_recognition) {
                GestureResult raw_gesture = gesture_recognizer_->Recognize(hand.landmarks, hand.is_left_hand);
                hand.gesture = gesture_smoothers_[i]->Smooth(raw_gesture);

                if (motion.is_fast_motion) {
                    hand.gesture.confidence = std::max(0.0f, hand.gesture.confidence - 0.2f);
                }
            }

            result.hands.push_back(hand);
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        result.inference_time_ms = std::chrono::duration<float, std::milli>(end_time - start_time).count();

        return true;
    }

    std::atomic<bool> initialized_;
    std::atomic<bool> running_;
    std::atomic<uint64_t> frame_count_;
    TrackerConfig config_;

    std::unique_ptr<GestureRecognizer> gesture_recognizer_;
    std::unique_ptr<PerformanceProfiler> profiler_;
    std::unique_ptr<FrameSkipper> frame_skipper_;
    std::vector<std::unique_ptr<HandSmoother>> hand_smoothers_;
    std::vector<std::unique_ptr<OutlierDetector>> outlier_detectors_;
    std::vector<std::unique_ptr<TemporalGestureSmoother>> gesture_smoothers_;
    std::vector<std::unique_ptr<MotionAnalyzer>> motion_analyzers_;
    std::vector<std::unique_ptr<QualityEstimator>> quality_estimators_;
    std::unique_ptr<MultiUserTracker> multi_user_tracker_;
    std::unique_ptr<MockHandModel> mock_model_;

    std::thread worker_thread_;
    std::queue<cv::Mat> frame_queue_;
    std::mutex queue_mutex_;
    std::condition_variable cv_;

    FrameResult latest_result_;
    FrameResult last_result_;
    std::mutex result_mutex_;
    std::mutex mutex_;
};

HandTracker::HandTracker() : impl_(std::make_unique<Impl>()) {}
HandTracker::~HandTracker() = default;

bool HandTracker::Initialize(const TrackerConfig& config) {
    return impl_->Initialize(config);
}

bool HandTracker::ProcessFrame(const cv::Mat& frame, FrameResult& result) {
    return impl_->ProcessFrame(frame, result);
}

bool HandTracker::ProcessFrameAsync(const cv::Mat& frame) {
    return impl_->ProcessFrameAsync(frame);
}

bool HandTracker::GetLatestResult(FrameResult& result) {
    return impl_->GetLatestResult(result);
}

void HandTracker::Release() {
    impl_->Release();
}

bool HandTracker::IsInitialized() const {
    return impl_->IsInitialized();
}

const TrackerConfig& HandTracker::GetConfig() const {
    return impl_->GetConfig();
}

std::string HandTracker::GetSDKVersion() {
    return "1.0.0";
}

}
