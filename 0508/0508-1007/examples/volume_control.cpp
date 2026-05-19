#include "hand_tracking_sdk/hand_tracker.h"
#include "hand_tracking_sdk/visualizer.h"
#include "hand_tracking_sdk/performance_optimizer.h"
#include <opencv2/opencv.hpp>
#include <deque>
#include <cmath>

#ifdef _WIN32
#include <windows.h>
#endif

using namespace hand_tracking_sdk;

float CalculatePinchDistance(const Point3D& thumb, const Point3D& index) {
    float dx = thumb.x - index.x;
    float dy = thumb.y - index.y;
    float dz = thumb.z - index.z;
    return std::sqrt(dx * dx + dy * dy + dz * dz);
}

float CalculateRotationAngle(const Point3D& wrist, const Point3D& middle_tip) {
    float dx = middle_tip.x - wrist.x;
    float dy = middle_tip.y - wrist.y;
    return std::atan2(dy, dx) * 180.0f / CV_PI;
}

void SetSystemVolume(int volume) {
#ifdef _WIN32
    volume = std::max(0, std::min(100, volume));

    HKEY hKey;
    if (RegOpenKeyExA(HKEY_CURRENT_USER,
        "Software\\Microsoft\\Windows\\CurrentVersion\\Applets\\VolumeControl",
        0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        DWORD value = static_cast<DWORD>(volume);
        RegSetValueExA(hKey, "MasterVolume", 0, REG_DWORD,
                       reinterpret_cast<const BYTE*>(&value), sizeof(DWORD));
        RegCloseKey(hKey);
    }
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

    int current_volume = 50;
    bool volume_control_active = false;
    bool calibration_mode = false;

    float min_pinch_distance = 0.02f;
    float max_pinch_distance = 0.15f;

    float reference_angle = 0.0f;
    bool reference_set = false;
    float accumulated_rotation = 0.0f;
    float last_angle = 0.0f;

    std::deque<int> volume_history;
    for (int i = 0; i < 5; ++i) {
        volume_history.push_back(current_volume);
    }

    int control_mode = 0;

    cv::namedWindow("Volume Control", cv::WINDOW_NORMAL);

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

                const Point3D& thumb_tip = hand.landmarks[4].position;
                const Point3D& index_tip = hand.landmarks[8].position;
                const Point3D& wrist = hand.landmarks[0].position;
                const Point3D& middle_tip = hand.landmarks[12].position;

                float pinch_distance = CalculatePinchDistance(thumb_tip, index_tip);
                float rotation_angle = CalculateRotationAngle(wrist, middle_tip);

                if (gesture == GestureType::OK) {
                    calibration_mode = !calibration_mode;
                    if (calibration_mode) {
                        reference_set = false;
                        accumulated_rotation = 0.0f;
                    }
                    cv::waitKey(300);
                }

                if (gesture == GestureType::FIST) {
                    volume_control_active = !volume_control_active;
                    cv::waitKey(300);
                }

                if (gesture == GestureType::THUMBS_UP) {
                    current_volume = std::min(100, current_volume + 5);
                    SetSystemVolume(current_volume);
                    cv::waitKey(200);
                }

                if (gesture == GestureType::FIVE) {
                    control_mode = (control_mode + 1) % 2;
                    cv::waitKey(300);
                }

                if (volume_control_active) {
                    if (control_mode == 0) {
                        if (pinch_distance < min_pinch_distance) {
                            pinch_distance = min_pinch_distance;
                        }
                        if (pinch_distance > max_pinch_distance) {
                            pinch_distance = max_pinch_distance;
                        }

                        int new_volume = static_cast<int>(
                            (pinch_distance - min_pinch_distance) /
                            (max_pinch_distance - min_pinch_distance) * 100.0f);

                        volume_history.push_back(new_volume);
                        volume_history.pop_front();

                        int avg_volume = 0;
                        for (int v : volume_history) {
                            avg_volume += v;
                        }
                        avg_volume /= static_cast<int>(volume_history.size());

                        if (std::abs(avg_volume - current_volume) >= 2) {
                            current_volume = avg_volume;
                            SetSystemVolume(current_volume);
                        }
                    } else {
                        if (!reference_set) {
                            reference_angle = rotation_angle;
                            last_angle = rotation_angle;
                            reference_set = true;
                        } else {
                            float angle_diff = rotation_angle - last_angle;
                            if (angle_diff > 180.0f) angle_diff -= 360.0f;
                            if (angle_diff < -180.0f) angle_diff += 360.0f;

                            if (std::abs(angle_diff) < 45.0f) {
                                accumulated_rotation += angle_diff;
                            }
                            last_angle = rotation_angle;

                            int volume_change = static_cast<int>(accumulated_rotation / 3.0f);
                            if (std::abs(volume_change) >= 1) {
                                current_volume = std::max(0, std::min(100,
                                    current_volume + volume_change));
                                SetSystemVolume(current_volume);
                                accumulated_rotation = 0.0f;
                            }
                        }
                    }
                } else {
                    reference_set = false;
                    accumulated_rotation = 0.0f;
                }

                int thumb_x = static_cast<int>(thumb_tip.x * frame.cols);
                int thumb_y = static_cast<int>(thumb_tip.y * frame.rows);
                int index_x = static_cast<int>(index_tip.x * frame.cols);
                int index_y = static_cast<int>(index_tip.y * frame.rows);

                if (volume_control_active && control_mode == 0) {
                    cv::line(frame, cv::Point(thumb_x, thumb_y),
                             cv::Point(index_x, index_y),
                             cv::Scalar(0, 255, 255), 3);
                    cv::circle(frame, cv::Point(thumb_x, thumb_y), 8,
                               cv::Scalar(0, 0, 255), -1);
                    cv::circle(frame, cv::Point(index_x, index_y), 8,
                               cv::Scalar(0, 255, 0), -1);
                }
            }

            visualizer.DrawAll(frame, result, profiler.GetFPS());
        }

        int bar_width = 50;
        int bar_height = 300;
        int bar_x = frame.cols - bar_width - 30;
        int bar_y = (frame.rows - bar_height) / 2;

        cv::rectangle(frame, cv::Point(bar_x, bar_y),
                      cv::Point(bar_x + bar_width, bar_y + bar_height),
                      cv::Scalar(100, 100, 100), -1);
        cv::rectangle(frame, cv::Point(bar_x, bar_y),
                      cv::Point(bar_x + bar_width, bar_y + bar_height),
                      cv::Scalar(255, 255, 255), 2);

        int fill_height = static_cast<int>(bar_height * current_volume / 100.0f);
        cv::Scalar volume_color = current_volume < 30 ? cv::Scalar(0, 255, 0) :
                                  current_volume < 70 ? cv::Scalar(0, 255, 255) :
                                  cv::Scalar(0, 0, 255);
        cv::rectangle(frame, cv::Point(bar_x, bar_y + bar_height - fill_height),
                      cv::Point(bar_x + bar_width, bar_y + bar_height),
                      volume_color, -1);

        cv::putText(frame, std::to_string(current_volume) + "%",
                    cv::Point(bar_x - 10, bar_y + bar_height + 30),
                    cv::FONT_HERSHEY_SIMPLEX, 0.7, cv::Scalar(255, 255, 255), 2);

        cv::putText(frame, volume_control_active ? "ACTIVE" : "INACTIVE",
                    cv::Point(10, 100), cv::FONT_HERSHEY_SIMPLEX, 0.8,
                    volume_control_active ? cv::Scalar(0, 255, 0) : cv::Scalar(0, 0, 255), 2);

        cv::putText(frame, "Mode: " + std::string(control_mode == 0 ? "Pinch" : "Rotation"),
                    cv::Point(10, 135), cv::FONT_HERSHEY_SIMPLEX, 0.6,
                    cv::Scalar(255, 200, 0), 2);

        cv::putText(frame, "Fist = Toggle Control | Five = Switch Mode",
                    cv::Point(10, frame.rows - 50),
                    cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(255, 255, 255), 1);
        cv::putText(frame, "ThumbsUp = Volume+5 | OK = Calibrate",
                    cv::Point(10, frame.rows - 25),
                    cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(255, 255, 255), 1);

        cv::imshow("Volume Control", frame);

        profiler.EndFrame();

        char key = cv::waitKey(1);
        if (key == 27) break;
        if (key == '+' || key == '=') {
            current_volume = std::min(100, current_volume + 5);
            SetSystemVolume(current_volume);
        }
        if (key == '-') {
            current_volume = std::max(0, current_volume - 5);
            SetSystemVolume(current_volume);
        }
    }

    cap.release();
    cv::destroyAllWindows();
    tracker.Release();

    return 0;
}
