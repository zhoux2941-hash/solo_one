#include "hand_tracking_sdk/hand_tracker.h"
#include "hand_tracking_sdk/visualizer.h"
#include "hand_tracking_sdk/performance_optimizer.h"
#include <opencv2/opencv.hpp>
#include <deque>

using namespace hand_tracking_sdk;

struct PaintStroke {
    std::deque<cv::Point> points;
    cv::Scalar color;
    int thickness;
};

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

    cv::Mat canvas;
    std::vector<PaintStroke> strokes;
    PaintStroke current_stroke;
    bool is_drawing = false;

    std::vector<cv::Scalar> colors = {
        cv::Scalar(255, 0, 0),
        cv::Scalar(0, 255, 0),
        cv::Scalar(0, 0, 255),
        cv::Scalar(255, 255, 0),
        cv::Scalar(255, 0, 255),
        cv::Scalar(0, 255, 255)
    };
    int current_color_idx = 0;
    int current_thickness = 5;

    cv::namedWindow("Virtual Paint", cv::WINDOW_NORMAL);

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
                const Point3D& index_tip = hand.landmarks[8].position;
                const Point3D& middle_tip = hand.landmarks[12].position;

                int x = static_cast<int>(index_tip.x * frame.cols);
                int y = static_cast<int>(index_tip.y * frame.rows);

                float distance = std::sqrt(
                    std::pow(index_tip.x - middle_tip.x, 2) +
                    std::pow(index_tip.y - middle_tip.y, 2)
                );

                GestureType gesture = hand.gesture.type;

                if (gesture == GestureType::TWO && distance < 0.08f) {
                    if (is_drawing) {
                        if (!current_stroke.points.empty()) {
                            strokes.push_back(current_stroke);
                        }
                        current_stroke.points.clear();
                    }
                    is_drawing = false;
                } else if (gesture == GestureType::ONE) {
                    is_drawing = true;
                    current_stroke.color = colors[current_color_idx];
                    current_stroke.thickness = current_thickness;
                    current_stroke.points.push_back(cv::Point(x, y));
                } else if (gesture == GestureType::FIST) {
                    if (!strokes.empty()) {
                        strokes.pop_back();
                    }
                    current_stroke.points.clear();
                    is_drawing = false;
                } else if (gesture == GestureType::THREE) {
                    current_color_idx = (current_color_idx + 1) % colors.size();
                } else if (gesture == GestureType::FOUR) {
                    current_thickness = std::max(2, current_thickness - 1);
                } else if (gesture == GestureType::FIVE) {
                    current_thickness = std::min(20, current_thickness + 1);
                } else {
                    if (is_drawing && !current_stroke.points.empty()) {
                        strokes.push_back(current_stroke);
                        current_stroke.points.clear();
                    }
                    is_drawing = false;
                }

                if (is_drawing) {
                    cv::circle(frame, cv::Point(x, y), current_thickness + 3,
                               colors[current_color_idx], -1);
                }
            }

            visualizer.DrawAll(frame, result, profiler.GetFPS());
        }

        if (canvas.empty() || canvas.size() != frame.size()) {
            canvas = cv::Mat::zeros(frame.size(), frame.type());
        }
        canvas.setTo(cv::Scalar(255, 255, 255));

        for (const auto& stroke : strokes) {
            for (size_t i = 1; i < stroke.points.size(); ++i) {
                cv::line(canvas, stroke.points[i-1], stroke.points[i],
                         stroke.color, stroke.thickness, cv::LINE_AA);
            }
        }

        if (!current_stroke.points.empty()) {
            for (size_t i = 1; i < current_stroke.points.size(); ++i) {
                cv::line(canvas, current_stroke.points[i-1], current_stroke.points[i],
                         current_stroke.color, current_stroke.thickness, cv::LINE_AA);
            }
        }

        cv::Mat display;
        cv::addWeighted(frame, 0.6, canvas, 0.4, 0, display);

        cv::putText(display, "Color: " + std::to_string(current_color_idx + 1) + "/" +
                    std::to_string(colors.size()), cv::Point(10, 100),
                    cv::FONT_HERSHEY_SIMPLEX, 0.6, cv::Scalar(0, 255, 0), 2);
        cv::putText(display, "Thickness: " + std::to_string(current_thickness),
                    cv::Point(10, 130), cv::FONT_HERSHEY_SIMPLEX, 0.6, cv::Scalar(0, 255, 0), 2);
        cv::putText(display, "1=Draw | 2=Select | Fist=Undo | 3=Color | 4/5=Thickness",
                    cv::Point(10, frame.rows - 20), cv::FONT_HERSHEY_SIMPLEX, 0.5,
                    cv::Scalar(255, 255, 255), 1);

        cv::imshow("Virtual Paint", display);

        profiler.EndFrame();

        char key = cv::waitKey(1);
        if (key == 27) break;
        if (key == 'c' || key == 'C') {
            strokes.clear();
            current_stroke.points.clear();
        }
        if (key == 's' || key == 'S') {
            cv::imwrite("painting.png", canvas);
            std::cout << "Saved painting to painting.png" << std::endl;
        }
    }

    cap.release();
    cv::destroyAllWindows();
    tracker.Release();

    return 0;
}
