#include "hand_tracking_sdk/hand_tracker.h"
#include "hand_tracking_sdk/visualizer.h"
#include "hand_tracking_sdk/performance_optimizer.h"
#include <opencv2/opencv.hpp>
#include <deque>
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#endif

using namespace hand_tracking_sdk;

enum class SwipeDirection {
    NONE,
    LEFT,
    RIGHT,
    UP,
    DOWN
};

class SwipeDetector {
public:
    SwipeDetector() : min_swipe_distance_(0.15f), min_swipe_speed_(0.3f),
                      max_swipe_time_(500), cooldown_ms_(800) {}

    SwipeDirection Detect(const Point3D& current_pos, int64_t timestamp_ms) {
        if (!initialized_) {
            last_pos_ = current_pos;
            last_timestamp_ = timestamp_ms;
            initialized_ = true;
            return SwipeDirection::NONE;
        }

        if (timestamp_ms - last_cooldown_time_ < cooldown_ms_) {
            return SwipeDirection::NONE;
        }

        float dx = current_pos.x - last_pos_.x;
        float dy = current_pos.y - last_pos_.y;
        float dt = static_cast<float>(timestamp_ms - last_timestamp_) / 1000.0f;

        if (dt > 0.016f) {
            float vx = dx / dt;
            float vy = dy / dt;

            float distance = std::sqrt(dx * dx + dy * dy);

            if (distance >= min_swipe_distance_) {
                if (std::abs(vx) > std::abs(vy)) {
                    if (vx > min_swipe_speed_) {
                        last_cooldown_time_ = timestamp_ms;
                        return SwipeDirection::RIGHT;
                    } else if (vx < -min_swipe_speed_) {
                        last_cooldown_time_ = timestamp_ms;
                        return SwipeDirection::LEFT;
                    }
                } else {
                    if (vy > min_swipe_speed_) {
                        last_cooldown_time_ = timestamp_ms;
                        return SwipeDirection::DOWN;
                    } else if (vy < -min_swipe_speed_) {
                        last_cooldown_time_ = timestamp_ms;
                        return SwipeDirection::UP;
                    }
                }
            }
        }

        last_pos_ = current_pos;
        last_timestamp_ = timestamp_ms;
        return SwipeDirection::NONE;
    }

    void Reset() {
        initialized_ = false;
    }

private:
    bool initialized_ = false;
    Point3D last_pos_;
    int64_t last_timestamp_ = 0;
    int64_t last_cooldown_time_ = 0;
    float min_swipe_distance_;
    float min_swipe_speed_;
    int max_swipe_time_;
    int cooldown_ms_;
};

void SendKeyPress(WORD key) {
#ifdef _WIN32
    INPUT input[2] = {0};

    input[0].type = INPUT_KEYBOARD;
    input[0].ki.wVk = key;

    input[1].type = INPUT_KEYBOARD;
    input[1].ki.wVk = key;
    input[1].ki.dwFlags = KEYEVENTF_KEYUP;

    SendInput(2, input, sizeof(INPUT));
#endif
}

int main() {
    cv::VideoCapture cap(0);
    if (!cap.isOpened()) {
        std::cerr << "Failed to open camera" << std::endl;
        return -1;
    }

    cap.set(cv::CAP_PROP_FRAME_WIDTH, 1280);
    cap.set(cv::CAP_PROP_FRAME_HEIGHT, 720);

    TrackerConfig config;
    config.mode = TrackingMode::SINGLE_HAND;
    config.max_num_hands = 1;
    config.enable_gesture_recognition = true;

    HandTracker tracker;
    if (!tracker.Initialize(config)) {
        std::cerr << "Failed to initialize tracker" << std::endl;
        return -1;
    }

    Visualizer visualizer;
    PerformanceProfiler profiler;
    SwipeDetector swipe_detector;

    int current_slide = 1;
    int total_slides = 10;
    bool presentation_active = true;

    std::deque<std::pair<int64_t, std::string>> action_log;

    cv::namedWindow("PPT Controller", cv::WINDOW_NORMAL);

    while (true) {
        cv::Mat frame;
        cap >> frame;
        if (frame.empty()) break;

        cv::flip(frame, frame, 1);

        profiler.StartFrame();

        FrameResult result;
        if (tracker.ProcessFrame(frame, result)) {
            if (!result.hands.empty()) {
                const HandResult& hand = result.hands[0];
                GestureType gesture = hand.gesture.type;
                const Point3D& palm_center = hand.landmarks[9].position;

                SwipeDirection swipe = swipe_detector.Detect(palm_center, result.timestamp_ms);

                if (gesture == GestureType::FIVE) {
                    if (swipe == SwipeDirection::LEFT) {
                        if (current_slide > 1) {
                            current_slide--;
                            SendKeyPress(VK_LEFT);
                            action_log.push_back({result.timestamp_ms, "Previous Slide"});
                        }
                    } else if (swipe == SwipeDirection::RIGHT) {
                        if (current_slide < total_slides) {
                            current_slide++;
                            SendKeyPress(VK_RIGHT);
                            action_log.push_back({result.timestamp_ms, "Next Slide"});
                        }
                    }
                }

                if (gesture == GestureType::FIST) {
                    presentation_active = !presentation_active;
                    action_log.push_back({result.timestamp_ms,
                        presentation_active ? "Resume" : "Pause"});
                    cv::waitKey(500);
                }

                if (gesture == GestureType::THUMBS_UP) {
                    SendKeyPress(VK_F5);
                    action_log.push_back({result.timestamp_ms, "Start Presentation"});
                    cv::waitKey(500);
                }

                if (gesture == GestureType::OK) {
                    SendKeyPress(VK_ESCAPE);
                    action_log.push_back({result.timestamp_ms, "Exit Presentation"});
                    cv::waitKey(500);
                }

                while (action_log.size() > 5) {
                    action_log.pop_front();
                }
            }

            visualizer.DrawAll(frame, result, profiler.GetFPS());
        }

        int bar_width = 400;
        int bar_height = 20;
        int bar_x = (frame.cols - bar_width) / 2;
        int bar_y = frame.rows - 60;

        cv::rectangle(frame, cv::Point(bar_x, bar_y),
                      cv::Point(bar_x + bar_width, bar_y + bar_height),
                      cv::Scalar(100, 100, 100), -1);

        float progress = static_cast<float>(current_slide) / total_slides;
        cv::rectangle(frame, cv::Point(bar_x, bar_y),
                      cv::Point(bar_x + static_cast<int>(bar_width * progress), bar_y + bar_height),
                      cv::Scalar(0, 255, 0), -1);

        cv::putText(frame, "Slide " + std::to_string(current_slide) + " / " +
                    std::to_string(total_slides),
                    cv::Point(bar_x, bar_y - 10),
                    cv::FONT_HERSHEY_SIMPLEX, 0.6, cv::Scalar(255, 255, 255), 2);

        cv::putText(frame, "Swipe left/right to navigate",
                    cv::Point(10, 100), cv::FONT_HERSHEY_SIMPLEX, 0.5,
                    cv::Scalar(0, 255, 0), 1);
        cv::putText(frame, "Fist = Pause/Resume | ThumbsUp = Start | OK = Exit",
                    cv::Point(10, 130), cv::FONT_HERSHEY_SIMPLEX, 0.5,
                    cv::Scalar(0, 255, 0), 1);

        int log_y = 170;
        for (auto it = action_log.rbegin(); it != action_log.rend(); ++it) {
            cv::putText(frame, it->second, cv::Point(10, log_y),
                        cv::FONT_HERSHEY_SIMPLEX, 0.4, cv::Scalar(255, 200, 0), 1);
            log_y += 25;
        }

        if (!presentation_active) {
            cv::putText(frame, "PAUSED",
                        cv::Point(frame.cols / 2 - 60, frame.rows / 2),
                        cv::FONT_HERSHEY_SIMPLEX, 1.5, cv::Scalar(0, 0, 255), 3);
        }

        cv::imshow("PPT Controller", frame);

        profiler.EndFrame();

        char key = cv::waitKey(1);
        if (key == 27) break;
    }

    cap.release();
    cv::destroyAllWindows();
    tracker.Release();

    return 0;
}
