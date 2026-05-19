#include "hand_tracking_sdk/visualizer.h"
#include <opencv2/opencv.hpp>

namespace hand_tracking_sdk {

std::vector<std::pair<int, int>> Visualizer::hand_connections_;

Visualizer::Visualizer() {
    InitializeConnections();
}

Visualizer::~Visualizer() {}

void Visualizer::InitializeConnections() {
    if (!hand_connections_.empty()) return;

    hand_connections_ = {
        {0, 1}, {1, 2}, {2, 3}, {3, 4},
        {0, 5}, {5, 6}, {6, 7}, {7, 8},
        {5, 9}, {9, 10}, {10, 11}, {11, 12},
        {9, 13}, {13, 14}, {14, 15}, {15, 16},
        {13, 17}, {17, 18}, {18, 19}, {19, 20},
        {0, 17}
    };
}

const std::vector<std::pair<int, int>>& Visualizer::GetHandConnections() {
    InitializeConnections();
    return hand_connections_;
}

void Visualizer::DrawLandmarks(cv::Mat& image, const HandResult& hand,
                               const cv::Scalar& landmark_color,
                               const cv::Scalar& connection_color) {
    int width = image.cols;
    int height = image.rows;

    for (const auto& [start_idx, end_idx] : hand_connections_) {
        const Point3D& start = hand.landmarks[start_idx].position;
        const Point3D& end = hand.landmarks[end_idx].position;

        cv::Point p1(static_cast<int>(start.x * width), static_cast<int>(start.y * height));
        cv::Point p2(static_cast<int>(end.x * width), static_cast<int>(end.y * height));

        cv::line(image, p1, p2, connection_color, 2);
    }

    for (const auto& lm : hand.landmarks) {
        cv::Point p(static_cast<int>(lm.position.x * width), static_cast<int>(lm.position.y * height));
        cv::circle(image, p, 5, landmark_color, -1);
        cv::circle(image, p, 7, cv::Scalar(0, 0, 0), 1);
    }
}

void Visualizer::DrawBoundingBox(cv::Mat& image, const HandResult& hand,
                                 const cv::Scalar& color, int thickness) {
    int width = image.cols;
    int height = image.rows;

    cv::Point top_left(
        static_cast<int>(hand.bounding_box[0] * width),
        static_cast<int>(hand.bounding_box[1] * height)
    );
    cv::Point bottom_right(
        static_cast<int>(hand.bounding_box[2] * width),
        static_cast<int>(hand.bounding_box[3] * height)
    );

    cv::rectangle(image, top_left, bottom_right, color, thickness);
}

void Visualizer::DrawGestureLabel(cv::Mat& image, const HandResult& hand,
                                  const cv::Scalar& text_color,
                                  const cv::Scalar& bg_color) {
    int width = image.cols;
    int height = image.rows;

    std::string label = hand.gesture.name;
    if (label.empty()) label = "Unknown";

    std::string hand_side = hand.is_left_hand ? "Left" : "Right";
    std::string full_label = hand_side + ": " + label +
        " (" + std::to_string(static_cast<int>(hand.gesture.confidence * 100)) + "%)";

    int x = static_cast<int>(hand.bounding_box[0] * width);
    int y = static_cast<int>(hand.bounding_box[1] * height) - 10;

    int baseline = 0;
    cv::Size text_size = cv::getTextSize(full_label, cv::FONT_HERSHEY_SIMPLEX, 0.6, 2, &baseline);

    cv::rectangle(image,
        cv::Point(x, y - text_size.height - 5),
        cv::Point(x + text_size.width + 10, y + baseline - 5),
        bg_color, -1);

    cv::putText(image, full_label, cv::Point(x + 5, y - 5),
        cv::FONT_HERSHEY_SIMPLEX, 0.6, text_color, 2);
}

void Visualizer::DrawFPS(cv::Mat& image, float fps, const cv::Point& position,
                         const cv::Scalar& color, double font_scale, int thickness) {
    std::string fps_text = "FPS: " + std::to_string(static_cast<int>(fps));
    cv::putText(image, fps_text, position, cv::FONT_HERSHEY_SIMPLEX, font_scale, color, thickness);
}

void Visualizer::DrawAll(cv::Mat& image, const FrameResult& result, float fps) {
    for (const auto& hand : result.hands) {
        DrawLandmarks(image, hand);
        DrawBoundingBox(image, hand);
        DrawGestureLabel(image, hand);
    }

    if (fps > 0) {
        DrawFPS(image, fps);
    }

    std::string info = "Hands: " + std::to_string(result.hands.size()) +
        " | Inference: " + std::to_string(result.inference_time_ms) + "ms";
    cv::putText(image, info, cv::Point(10, 60), cv::FONT_HERSHEY_SIMPLEX, 0.5, cv::Scalar(0, 255, 0), 1);
}

}
