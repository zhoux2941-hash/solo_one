#include "hand_tracking_sdk/hand_tracker.h"
#include "hand_tracking_sdk/visualizer.h"
#include "hand_tracking_sdk/performance_optimizer.h"
#include <opencv2/opencv.hpp>
#include <fstream>
#include <iomanip>

using namespace hand_tracking_sdk;

void PrintResult(const FrameResult& result) {
    std::cout << "=== Frame Result ===" << std::endl;
    std::cout << "Timestamp: " << result.timestamp_ms << "ms" << std::endl;
    std::cout << "Inference time: " << result.inference_time_ms << "ms" << std::endl;
    std::cout << "Hands detected: " << result.hands.size() << std::endl;

    for (size_t i = 0; i < result.hands.size(); ++i) {
        const auto& hand = result.hands[i];
        std::cout << "\nHand " << (i + 1) << ":" << std::endl;
        std::cout << "  Side: " << (hand.is_left_hand ? "Left" : "Right") << std::endl;
        std::cout << "  Score: " << std::fixed << std::setprecision(2) << hand.hand_score << std::endl;
        std::cout << "  Gesture: " << hand.gesture.name
                  << " (" << std::fixed << std::setprecision(2)
                  << hand.gesture.confidence * 100 << "%)" << std::endl;

        std::cout << "  Landmarks (first 5):" << std::endl;
        for (int j = 0; j < 5; ++j) {
            const auto& lm = hand.landmarks[j];
            std::cout << "    " << j << ": ("
                      << std::fixed << std::setprecision(3) << lm.position.x << ", "
                      << lm.position.y << ", " << lm.position.z << ")" << std::endl;
        }
    }
    std::cout << "====================" << std::endl;
}

int main() {
    std::cout << "MediaPipe Hand Tracking SDK v" << HandTracker::GetSDKVersion() << std::endl;
    std::cout << "Supported gestures: ";
    for (auto g : GestureRecognizer::GetSupportedGestures()) {
        std::cout << GestureTypeToString(g) << " ";
    }
    std::cout << std::endl << std::endl;

    cv::VideoCapture cap(0);
    if (!cap.isOpened()) {
        std::cerr << "Failed to open camera" << std::endl;
        return -1;
    }

    cap.set(cv::CAP_PROP_FRAME_WIDTH, 1280);
    cap.set(cv::CAP_PROP_FRAME_HEIGHT, 720);

    TrackerConfig config;
    config.mode = TrackingMode::MULTI_HAND;
    config.max_num_hands = 2;
    config.min_detection_confidence = 0.5f;
    config.min_tracking_confidence = 0.5f;
    config.enable_gesture_recognition = true;
    config.use_int8_quantization = true;

    HandTracker tracker;
    if (!tracker.Initialize(config)) {
        std::cerr << "Failed to initialize tracker" << std::endl;
        return -1;
    }

    Visualizer visualizer;
    PerformanceProfiler profiler;

    cv::namedWindow("Hand Tracking Demo", cv::WINDOW_NORMAL);

    std::ofstream log_file("tracking_log.csv");
    log_file << "timestamp_ms,hand_index,x,y,z,gesture,confidence" << std::endl;

    int frame_count = 0;

    while (true) {
        cv::Mat frame;
        cap >> frame;
        if (frame.empty()) break;

        cv::flip(frame, frame, 1);

        profiler.StartFrame();

        FrameResult result;
        if (tracker.ProcessFrame(frame, result)) {
            visualizer.DrawAll(frame, result, profiler.GetFPS());

            if (frame_count % 30 == 0) {
                PrintResult(result);
            }

            for (size_t i = 0; i < result.hands.size(); ++i) {
                const auto& hand = result.hands[i];
                for (int j = 0; j < 21; ++j) {
                    const auto& lm = hand.landmarks[j];
                    log_file << result.timestamp_ms << ","
                             << i << ","
                             << std::fixed << std::setprecision(4)
                             << lm.position.x << ","
                             << lm.position.y << ","
                             << lm.position.z << ","
                             << hand.gesture.name << ","
                             << hand.gesture.confidence << std::endl;
                }
            }
        }

        cv::imshow("Hand Tracking Demo", frame);

        profiler.EndFrame();
        frame_count++;

        char key = cv::waitKey(1);
        if (key == 27) break;
        if (key == ' ') {
            cv::imwrite("frame_" + std::to_string(frame_count) + ".png", frame);
            std::cout << "Saved frame to frame_" << frame_count << ".png" << std::endl;
        }
    }

    std::cout << "\n=== Statistics ===" << std::endl;
    std::cout << "Average FPS: " << std::fixed << std::setprecision(1)
              << profiler.GetFPS() << std::endl;
    std::cout << "Total frames: " << frame_count << std::endl;

    log_file.close();
    cap.release();
    cv::destroyAllWindows();
    tracker.Release();

    return 0;
}
