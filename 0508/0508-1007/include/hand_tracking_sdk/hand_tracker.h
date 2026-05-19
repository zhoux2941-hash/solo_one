#pragma once

#include "hand_tracking_sdk/common.h"
#include <memory>
#include <opencv2/opencv.hpp>

namespace hand_tracking_sdk {

class HandTracker {
public:
    HandTracker();
    ~HandTracker();

    bool Initialize(const TrackerConfig& config);
    bool ProcessFrame(const cv::Mat& frame, FrameResult& result);
    bool ProcessFrameAsync(const cv::Mat& frame);
    bool GetLatestResult(FrameResult& result);
    void Release();

    bool IsInitialized() const;
    const TrackerConfig& GetConfig() const;

    static std::string GetSDKVersion();

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
