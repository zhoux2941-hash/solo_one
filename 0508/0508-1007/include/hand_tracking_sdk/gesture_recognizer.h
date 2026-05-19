#pragma once

#include "hand_tracking_sdk/common.h"
#include <memory>
#include <vector>
#include <array>

namespace hand_tracking_sdk {

class GestureRecognizer {
public:
    GestureRecognizer();
    ~GestureRecognizer();

    bool Initialize();
    GestureResult Recognize(const HandLandmarks& landmarks, bool is_left_hand);
    void Release();

    static const std::vector<GestureType>& GetSupportedGestures();
    static float CalculateSimilarity(const HandLandmarks& a, const HandLandmarks& b);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

}
