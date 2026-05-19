#pragma once

#include "hand_tracking_sdk/common.h"
#include <opencv2/opencv.hpp>

namespace hand_tracking_sdk {

class Visualizer {
public:
    Visualizer();
    ~Visualizer();

    void DrawLandmarks(cv::Mat& image, const HandResult& hand,
                       const cv::Scalar& landmark_color = cv::Scalar(0, 255, 0),
                       const cv::Scalar& connection_color = cv::Scalar(255, 0, 0));

    void DrawBoundingBox(cv::Mat& image, const HandResult& hand,
                         const cv::Scalar& color = cv::Scalar(0, 0, 255),
                         int thickness = 2);

    void DrawGestureLabel(cv::Mat& image, const HandResult& hand,
                          const cv::Scalar& text_color = cv::Scalar(255, 255, 255),
                          const cv::Scalar& bg_color = cv::Scalar(0, 0, 0));

    void DrawFPS(cv::Mat& image, float fps, const cv::Point& position = cv::Point(10, 30),
                 const cv::Scalar& color = cv::Scalar(0, 255, 0),
                 double font_scale = 1.0, int thickness = 2);

    void DrawAll(cv::Mat& image, const FrameResult& result, float fps = 0.0f);

    static const std::vector<std::pair<int, int>>& GetHandConnections();

private:
    static std::vector<std::pair<int, int>> hand_connections_;
    static void InitializeConnections();
};

}
