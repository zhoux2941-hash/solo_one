#pragma once

#include <vector>
#include <array>
#include <string>
#include <cstdint>

namespace hand_tracking_sdk {

struct Point3D {
    float x = 0.0f;
    float y = 0.0f;
    float z = 0.0f;

    Point3D() = default;
    Point3D(float x_, float y_, float z_) : x(x_), y(y_), z(z_) {}
};

struct Landmark {
    Point3D position;
    float visibility = 1.0f;
    float presence = 1.0f;
};

using HandLandmarks = std::array<Landmark, 21>;

enum class GestureType {
    NONE = 0,
    FIST = 1,
    ONE = 2,
    TWO = 3,
    THREE = 4,
    FOUR = 5,
    FIVE = 6,
    OK = 7,
    THUMBS_UP = 8,
    HEART = 9,
    COUNT = 10
};

struct GestureResult {
    GestureType type = GestureType::NONE;
    float confidence = 0.0f;
    std::string name;
};

struct HandFeatures {
    float palm_size = 0.0f;
    float aspect_ratio = 1.0f;
    float finger_length_ratio = 0.0f;
    Point3D palm_center;
    float orientation = 0.0f;
    std::array<float, 21> finger_angles;
};

struct HandResult {
    int tracking_id = -1;
    int user_id = -1;
    HandLandmarks landmarks;
    HandLandmarks world_landmarks;
    GestureResult gesture;
    bool is_left_hand = false;
    float hand_score = 0.0f;
    float tracking_confidence = 0.0f;
    std::array<float, 4> bounding_box;
    HandFeatures features;
    int64_t first_seen_ms = 0;
    int64_t last_seen_ms = 0;
};

struct UserInfo {
    int user_id = -1;
    std::string name;
    std::array<int, 2> hand_ids = {-1, -1};
    int64_t first_seen_ms = 0;
    int64_t last_seen_ms = 0;
    bool is_active = false;
    int num_hands = 0;
};

struct FrameResult {
    std::vector<HandResult> hands;
    std::vector<UserInfo> users;
    int64_t timestamp_ms = 0;
    float inference_time_ms = 0.0f;
    int width = 0;
    int height = 0;
};

enum class TrackingMode {
    SINGLE_HAND,
    MULTI_HAND,
    MULTI_USER
};

struct TrackerConfig {
    TrackingMode mode = TrackingMode::MULTI_USER;
    int max_num_hands = 4;
    int max_num_users = 2;
    float min_detection_confidence = 0.5f;
    float min_tracking_confidence = 0.5f;
    bool enable_gesture_recognition = true;
    bool use_int8_quantization = true;
    bool enable_multi_user_tracking = true;
    float user_match_threshold = 0.6f;
    int64_t user_timeout_ms = 5000;
    std::string model_path;
};

const char* GestureTypeToString(GestureType type);

GestureType StringToGestureType(const std::string& name);

}
