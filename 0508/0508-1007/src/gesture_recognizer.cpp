#include "hand_tracking_sdk/gesture_recognizer.h"
#include <cmath>
#include <algorithm>
#include <unordered_map>

namespace hand_tracking_sdk {

namespace {

const int kThumbTip = 4;
const int kThumbIP = 3;
const int kThumbMCP = 2;
const int kIndexTip = 8;
const int kIndexPIP = 6;
const int kIndexMCP = 5;
const int kMiddleTip = 12;
const int kMiddlePIP = 10;
const int kMiddleMCP = 9;
const int kRingTip = 16;
const int kRingPIP = 14;
const int kRingMCP = 13;
const int kPinkyTip = 20;
const int kPinkyPIP = 18;
const int kPinkyMCP = 17;
const int kWrist = 0;

float Distance(const Point3D& a, const Point3D& b) {
    float dx = a.x - b.x;
    float dy = a.y - b.y;
    float dz = a.z - b.z;
    return std::sqrt(dx * dx + dy * dy + dz * dz);
}

float Dot(const Point3D& a, const Point3D& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

Point3D Normalize(const Point3D& v) {
    float len = std::sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 1e-6f) return Point3D(0, 0, 0);
    return Point3D(v.x / len, v.y / len, v.z / len);
}

Point3D Subtract(const Point3D& a, const Point3D& b) {
    return Point3D(a.x - b.x, a.y - b.y, a.z - b.z);
}

bool IsFingerExtended(const HandLandmarks& landmarks, int tip_idx, int pip_idx, int mcp_idx) {
    const Point3D& tip = landmarks[tip_idx].position;
    const Point3D& pip = landmarks[pip_idx].position;
    const Point3D& mcp = landmarks[mcp_idx].position;
    const Point3D& wrist = landmarks[0].position;

    float wrist_to_tip = Distance(wrist, tip);
    float wrist_to_mcp = Distance(wrist, mcp);

    Point3D vec1 = Subtract(pip, mcp);
    Point3D vec2 = Subtract(tip, pip);
    vec1 = Normalize(vec1);
    vec2 = Normalize(vec2);
    float angle_cos = Dot(vec1, vec2);

    Point3D vec_mcp_wrist = Subtract(wrist, mcp);
    Point3D vec_tip_mcp = Subtract(tip, mcp);
    vec_mcp_wrist = Normalize(vec_mcp_wrist);
    vec_tip_mcp = Normalize(vec_tip_mcp);
    float direction_cos = Dot(vec_mcp_wrist, vec_tip_mcp);

    const float kMinExtensionRatio = 1.1f;
    const float kMinAngleCos = 0.5f;
    const float kMinDirectionCos = 0.3f;

    bool extended_by_distance = (wrist_to_tip > wrist_to_mcp * kMinExtensionRatio);
    bool extended_by_angle = (angle_cos > kMinAngleCos);
    bool extended_by_direction = (direction_cos > kMinDirectionCos);

    int votes = 0;
    if (extended_by_distance) votes++;
    if (extended_by_angle) votes++;
    if (extended_by_direction) votes++;

    return votes >= 2;
}

bool IsThumbExtended(const HandLandmarks& landmarks, bool is_left_hand) {
    const Point3D& thumb_tip = landmarks[kThumbTip].position;
    const Point3D& thumb_ip = landmarks[kThumbIP].position;
    const Point3D& thumb_mcp = landmarks[kThumbMCP].position;
    const Point3D& index_mcp = landmarks[kIndexMCP].position;
    const Point3D& wrist = landmarks[kWrist].position;

    Point3D wrist_to_index = Subtract(index_mcp, wrist);
    Point3D wrist_to_thumb = Subtract(thumb_tip, wrist);
    wrist_to_index = Normalize(wrist_to_index);
    wrist_to_thumb = Normalize(wrist_to_thumb);

    float angle_cos = Dot(wrist_to_index, wrist_to_thumb);

    float thumb_to_index = Distance(thumb_tip, index_mcp);
    float mcp_dist = Distance(thumb_mcp, index_mcp);

    Point3D vec_thumb1 = Subtract(thumb_ip, thumb_mcp);
    Point3D vec_thumb2 = Subtract(thumb_tip, thumb_ip);
    vec_thumb1 = Normalize(vec_thumb1);
    vec_thumb2 = Normalize(vec_thumb2);
    float thumb_straightness = Dot(vec_thumb1, vec_thumb2);

    float wrist_to_thumb_tip = Distance(wrist, thumb_tip);
    float wrist_to_thumb_mcp = Distance(wrist, thumb_mcp);
    bool extended_by_distance = wrist_to_thumb_tip > wrist_to_thumb_mcp * 1.15f;

    const float kMinThumbToIndex = 1.2f;
    const float kMinAngleCos = 0.15f;
    const float kMinStraightness = 0.5f;

    int votes = 0;
    if (thumb_to_index > mcp_dist * kMinThumbToIndex) votes++;
    if (angle_cos > kMinAngleCos) votes++;
    if (thumb_straightness > kMinStraightness) votes++;
    if (extended_by_distance) votes++;

    return votes >= 2;
}

float CheckFist(const HandLandmarks& landmarks) {
    float score = 0.0f;
    int folded_fingers = 0;

    if (!IsFingerExtended(landmarks, kIndexTip, kIndexPIP, kIndexMCP)) folded_fingers++;
    if (!IsFingerExtended(landmarks, kMiddleTip, kMiddlePIP, kMiddleMCP)) folded_fingers++;
    if (!IsFingerExtended(landmarks, kRingTip, kRingPIP, kRingMCP)) folded_fingers++;
    if (!IsFingerExtended(landmarks, kPinkyTip, kPinkyPIP, kPinkyMCP)) folded_fingers++;

    const Point3D& thumb_tip = landmarks[kThumbTip].position;
    const Point3D& middle_mcp = landmarks[kMiddleMCP].position;
    float thumb_to_middle = Distance(thumb_tip, middle_mcp);
    float wrist_to_middle = Distance(landmarks[kWrist].position, middle_mcp);

    score = folded_fingers * 0.2f;
    if (thumb_to_middle < wrist_to_middle * 0.6f) score += 0.2f;

    return std::min(1.0f, score);
}

float CheckOK(const HandLandmarks& landmarks) {
    const Point3D& thumb_tip = landmarks[kThumbTip].position;
    const Point3D& index_tip = landmarks[kIndexTip].position;
    float thumb_index_dist = Distance(thumb_tip, index_tip);
    float wrist_mcp_dist = Distance(landmarks[kWrist].position, landmarks[kIndexMCP].position);

    bool thumb_index_touch = thumb_index_dist < wrist_mcp_dist * 0.35f;

    int extended = 0;
    if (IsFingerExtended(landmarks, kMiddleTip, kMiddlePIP, kMiddleMCP)) extended++;
    if (IsFingerExtended(landmarks, kRingTip, kRingPIP, kRingMCP)) extended++;
    if (IsFingerExtended(landmarks, kPinkyTip, kPinkyPIP, kPinkyMCP)) extended++;

    float score = 0.0f;
    if (thumb_index_touch) score += 0.5f;
    score += extended * 0.15f;

    return std::min(1.0f, score);
}

float CheckThumbsUp(const HandLandmarks& landmarks, bool is_left_hand) {
    if (!IsThumbExtended(landmarks, is_left_hand)) return 0.0f;

    int folded = 0;
    if (!IsFingerExtended(landmarks, kIndexTip, kIndexPIP, kIndexMCP)) folded++;
    if (!IsFingerExtended(landmarks, kMiddleTip, kMiddlePIP, kMiddleMCP)) folded++;
    if (!IsFingerExtended(landmarks, kRingTip, kRingPIP, kRingMCP)) folded++;
    if (!IsFingerExtended(landmarks, kPinkyTip, kPinkyPIP, kPinkyMCP)) folded++;

    const Point3D& thumb_tip = landmarks[kThumbTip].position;
    const Point3D& wrist = landmarks[kWrist].position;
    const Point3D& middle_mcp = landmarks[kMiddleMCP].position;

    Point3D wrist_to_thumb = Subtract(thumb_tip, wrist);
    Point3D wrist_to_middle = Subtract(middle_mcp, wrist);

    float vertical_score = 0.0f;
    if (thumb_tip.y < wrist.y - 0.1f) {
        vertical_score = 0.3f;
    }

    return std::min(1.0f, 0.4f + folded * 0.075f + vertical_score);
}

float CheckHeart(const HandLandmarks& landmarks) {
    const Point3D& thumb_tip = landmarks[kThumbTip].position;
    const Point3D& index_tip = landmarks[kIndexTip].position;
    const Point3D& middle_tip = landmarks[kMiddleTip].position;

    float thumb_index_dist = Distance(thumb_tip, index_tip);
    float wrist_mcp_dist = Distance(landmarks[kWrist].position, landmarks[kIndexMCP].position);

    bool thumb_index_touch = thumb_index_dist < wrist_mcp_dist * 0.4f;

    bool middle_extended = IsFingerExtended(landmarks, kMiddleTip, kMiddlePIP, kMiddleMCP);
    bool ring_extended = IsFingerExtended(landmarks, kRingTip, kRingPIP, kRingMCP);
    bool pinky_folded = !IsFingerExtended(landmarks, kPinkyTip, kPinkyPIP, kPinkyMCP);

    float score = 0.0f;
    if (thumb_index_touch) score += 0.4f;
    if (middle_extended) score += 0.15f;
    if (ring_extended) score += 0.15f;
    if (pinky_folded) score += 0.15f;

    const Point3D& middle_pip = landmarks[kMiddlePIP].position;
    const Point3D& ring_pip = landmarks[kRingPIP].position;
    float middle_ring_dist = Distance(middle_tip, ring_tip);
    float pip_dist = Distance(middle_pip, ring_pip);
    if (middle_ring_dist < pip_dist * 1.5f) score += 0.1f;

    return std::min(1.0f, score);
}

float CheckNumberGesture(const HandLandmarks& landmarks, int number, bool is_left_hand) {
    bool thumb = IsThumbExtended(landmarks, is_left_hand);
    bool index = IsFingerExtended(landmarks, kIndexTip, kIndexPIP, kIndexMCP);
    bool middle = IsFingerExtended(landmarks, kMiddleTip, kMiddlePIP, kMiddleMCP);
    bool ring = IsFingerExtended(landmarks, kRingTip, kRingPIP, kRingMCP);
    bool pinky = IsFingerExtended(landmarks, kPinkyTip, kPinkyPIP, kPinkyMCP);

    int extended_count = (thumb ? 1 : 0) + (index ? 1 : 0) + (middle ? 1 : 0) + (ring ? 1 : 0) + (pinky ? 1 : 0);

    switch (number) {
        case 1:
            return (index && !middle && !ring && !pinky) ? 0.9f : 0.0f;
        case 2:
            return (index && middle && !ring && !pinky) ? 0.9f : 0.0f;
        case 3:
            return (index && middle && ring && !pinky) ? 0.85f : 0.0f;
        case 4:
            return (index && middle && ring && pinky && !thumb) ? 0.85f : 0.0f;
        case 5:
            return (extended_count == 5) ? 0.8f : 0.0f;
        default:
            return 0.0f;
    }
}

}

class GestureRecognizer::Impl {
public:
    bool Initialize() {
        return true;
    }

    GestureResult Recognize(const HandLandmarks& landmarks, bool is_left_hand) {
        GestureResult result;
        result.type = GestureType::NONE;
        result.confidence = 0.0f;
        result.name = "None";

        std::vector<std::pair<GestureType, float>> scores;

        scores.emplace_back(GestureType::FIST, CheckFist(landmarks));
        scores.emplace_back(GestureType::ONE, CheckNumberGesture(landmarks, 1, is_left_hand));
        scores.emplace_back(GestureType::TWO, CheckNumberGesture(landmarks, 2, is_left_hand));
        scores.emplace_back(GestureType::THREE, CheckNumberGesture(landmarks, 3, is_left_hand));
        scores.emplace_back(GestureType::FOUR, CheckNumberGesture(landmarks, 4, is_left_hand));
        scores.emplace_back(GestureType::FIVE, CheckNumberGesture(landmarks, 5, is_left_hand));
        scores.emplace_back(GestureType::OK, CheckOK(landmarks));
        scores.emplace_back(GestureType::THUMBS_UP, CheckThumbsUp(landmarks, is_left_hand));
        scores.emplace_back(GestureType::HEART, CheckHeart(landmarks));

        float max_score = 0.0f;
        GestureType best_gesture = GestureType::NONE;

        for (const auto& [type, score] : scores) {
            if (score > max_score) {
                max_score = score;
                best_gesture = type;
            }
        }

        const float kMinConfidence = 0.45f;
        if (max_score >= kMinConfidence) {
            result.type = best_gesture;
            result.confidence = max_score;
            result.name = GestureTypeToString(best_gesture);
        }

        return result;
    }

    void Release() {}
};

GestureRecognizer::GestureRecognizer() : impl_(std::make_unique<Impl>()) {}
GestureRecognizer::~GestureRecognizer() = default;

bool GestureRecognizer::Initialize() { return impl_->Initialize(); }

GestureResult GestureRecognizer::Recognize(const HandLandmarks& landmarks, bool is_left_hand) {
    return impl_->Recognize(landmarks, is_left_hand);
}

void GestureRecognizer::Release() { impl_->Release(); }

const std::vector<GestureType>& GestureRecognizer::GetSupportedGestures() {
    static const std::vector<GestureType> kSupported = {
        GestureType::FIST,
        GestureType::ONE,
        GestureType::TWO,
        GestureType::THREE,
        GestureType::FOUR,
        GestureType::FIVE,
        GestureType::OK,
        GestureType::THUMBS_UP,
        GestureType::HEART
    };
    return kSupported;
}

float GestureRecognizer::CalculateSimilarity(const HandLandmarks& a, const HandLandmarks& b) {
    float total_dist = 0.0f;
    for (size_t i = 0; i < 21; ++i) {
        total_dist += Distance(a[i].position, b[i].position);
    }
    return 1.0f / (1.0f + total_dist * 0.5f);
}

}
