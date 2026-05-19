#include "hand_tracking_sdk/multi_user_tracker.h"
#include <cmath>
#include <algorithm>
#include <unordered_set>
#include <limits>

namespace hand_tracking_sdk {

HandFeatureExtractor::HandFeatureExtractor() {}
HandFeatureExtractor::~HandFeatureExtractor() {}

Point3D HandFeatureExtractor::CalculatePalmCenter(const HandLandmarks& landmarks) {
    const int palm_indices[] = {0, 5, 9, 13, 17};
    float x = 0, y = 0, z = 0;
    for (int idx : palm_indices) {
        x += landmarks[idx].position.x;
        y += landmarks[idx].position.y;
        z += landmarks[idx].position.z;
    }
    return Point3D(x / 5.0f, y / 5.0f, z / 5.0f);
}

float HandFeatureExtractor::CalculatePalmSize(const HandLandmarks& landmarks) {
    Point3D wrist = landmarks[0].position;
    Point3D middle_mcp = landmarks[9].position;
    float dx = wrist.x - middle_mcp.x;
    float dy = wrist.y - middle_mcp.y;
    float dz = wrist.z - middle_mcp.z;
    return std::sqrt(dx * dx + dy * dy + dz * dz);
}

float HandFeatureExtractor::CalculateOrientation(const HandLandmarks& landmarks) {
    Point3D wrist = landmarks[0].position;
    Point3D middle_tip = landmarks[12].position;
    float dx = middle_tip.x - wrist.x;
    float dy = middle_tip.y - wrist.y;
    return std::atan2(dy, dx) * 180.0f / M_PI;
}

std::array<float, 21> HandFeatureExtractor::CalculateFingerAngles(const HandLandmarks& landmarks) {
    std::array<float, 21> angles = {0};

    const std::vector<std::tuple<int, int, int>> joints = {
        {0, 1, 2}, {1, 2, 3}, {2, 3, 4},
        {0, 5, 6}, {5, 6, 7}, {6, 7, 8},
        {5, 9, 10}, {9, 10, 11}, {10, 11, 12},
        {9, 13, 14}, {13, 14, 15}, {14, 15, 16},
        {13, 17, 18}, {17, 18, 19}, {18, 19, 20}
    };

    for (const auto& [a, b, c] : joints) {
        Point3D v1 = Point3D(
            landmarks[a].position.x - landmarks[b].position.x,
            landmarks[a].position.y - landmarks[b].position.y,
            landmarks[a].position.z - landmarks[b].position.z
        );
        Point3D v2 = Point3D(
            landmarks[c].position.x - landmarks[b].position.x,
            landmarks[c].position.y - landmarks[b].position.y,
            landmarks[c].position.z - landmarks[b].position.z
        );

        float dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        float len1 = std::sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        float len2 = std::sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

        if (len1 > 0 && len2 > 0) {
            float cos_angle = dot / (len1 * len2);
            cos_angle = std::max(-1.0f, std::min(1.0f, cos_angle));
            angles[b] = std::acos(cos_angle) * 180.0f / M_PI;
        }
    }

    return angles;
}

HandFeatures HandFeatureExtractor::Extract(const HandLandmarks& landmarks) {
    HandFeatures features;
    features.palm_center = CalculatePalmCenter(landmarks);
    features.palm_size = CalculatePalmSize(landmarks);
    features.orientation = CalculateOrientation(landmarks);
    features.finger_angles = CalculateFingerAngles(landmarks);

    float min_x = 1.0f, max_x = 0.0f, min_y = 1.0f, max_y = 0.0f;
    for (const auto& lm : landmarks) {
        min_x = std::min(min_x, lm.position.x);
        max_x = std::max(max_x, lm.position.x);
        min_y = std::min(min_y, lm.position.y);
        max_y = std::max(max_y, lm.position.y);
    }
    float w = max_x - min_x;
    float h = max_y - min_y;
    features.aspect_ratio = h > 0 ? w / h : 1.0f;

    float avg_finger_len = 0;
    const int tips[] = {8, 12, 16, 20};
    for (int tip : tips) {
        avg_finger_len += std::sqrt(
            std::pow(landmarks[tip].position.x - landmarks[0].position.x, 2) +
            std::pow(landmarks[tip].position.y - landmarks[0].position.y, 2)
        );
    }
    features.finger_length_ratio = features.palm_size > 0 ?
        (avg_finger_len / 4.0f) / features.palm_size : 0;

    return features;
}

float HandFeatureExtractor::CalculateSimilarity(const HandFeatures& a, const HandFeatures& b) {
    float size_sim = 1.0f - std::abs(a.palm_size - b.palm_size) / std::max(a.palm_size, b.palm_size);
    float aspect_sim = 1.0f - std::abs(a.aspect_ratio - b.aspect_ratio);
    float finger_sim = 1.0f - std::abs(a.finger_length_ratio - b.finger_length_ratio);

    float angle_diff = 0;
    for (int i = 0; i < 21; ++i) {
        float diff = std::abs(a.finger_angles[i] - b.finger_angles[i]);
        angle_diff += std::min(diff, 180.0f - diff);
    }
    float angle_sim = 1.0f - (angle_diff / (21.0f * 180.0f));

    return 0.3f * size_sim + 0.2f * aspect_sim + 0.2f * finger_sim + 0.3f * angle_sim;
}

float HandFeatureExtractor::CalculateBoundingBoxOverlap(
    const std::array<float, 4>& a, const std::array<float, 4>& b) {
    float x1_overlap = std::max(a[0], b[0]);
    float y1_overlap = std::max(a[1], b[1]);
    float x2_overlap = std::min(a[2], b[2]);
    float y2_overlap = std::min(a[3], b[3]);

    if (x2_overlap < x1_overlap || y2_overlap < y1_overlap) return 0.0f;

    float overlap_area = (x2_overlap - x1_overlap) * (y2_overlap - y1_overlap);
    float area_a = (a[2] - a[0]) * (a[3] - a[1]);
    float area_b = (b[2] - b[0]) * (b[3] - b[1]);
    float union_area = area_a + area_b - overlap_area;

    return union_area > 0 ? overlap_area / union_area : 0.0f;
}

HandMatcher::HandMatcher() = default;
HandMatcher::~HandMatcher() = default;

float HandMatcher::CalculateHandSimilarity(const HandResult& a, const HandResult& b) const {
    float iou = HandFeatureExtractor::CalculateBoundingBoxOverlap(a.bounding_box, b.bounding_box);

    Point3D pa = a.features.palm_center;
    Point3D pb = b.features.palm_center;
    float dist = std::sqrt(std::pow(pa.x - pb.x, 2) + std::pow(pa.y - pb.y, 2));
    float dist_sim = std::max(0.0f, 1.0f - dist * 10.0f);

    float feature_sim = HandFeatureExtractor::CalculateSimilarity(a.features, b.features);

    float side_sim = (a.is_left_hand == b.is_left_hand) ? 1.0f : 0.0f;

    return 0.35f * iou + 0.35f * dist_sim + 0.2f * feature_sim + 0.1f * side_sim;
}

std::vector<HandMatcher::MatchResult> HandMatcher::Match(
    const std::vector<HandResult>& detected_hands,
    const std::unordered_map<int, HandResult>& tracked_hands,
    int64_t timestamp_ms) {

    std::vector<MatchResult> results;
    std::unordered_set<int> used_track_ids;

    for (size_t i = 0; i < detected_hands.size(); ++i) {
        const auto& hand = detected_hands[i];

        float best_sim = match_threshold_;
        int best_track_id = -1;

        for (const auto& [track_id, tracked] : tracked_hands) {
            if (used_track_ids.count(track_id)) continue;
            if (timestamp_ms - tracked.last_seen_ms > kMaxDisappearedTimeMs) continue;

            float sim = CalculateHandSimilarity(hand, tracked);
            if (sim > best_sim) {
                best_sim = sim;
                best_track_id = track_id;
            }
        }

        MatchResult result;
        result.hand_index = static_cast<int>(i);
        result.similarity = best_sim;

        if (best_track_id >= 0) {
            result.track_id = best_track_id;
            result.is_new = false;
            used_track_ids.insert(best_track_id);
        } else {
            result.track_id = GetNextTrackingId();
            result.is_new = true;
        }

        results.push_back(result);
    }

    return results;
}

UserMatcher::UserMatcher() = default;
UserMatcher::~UserMatcher() = default;

float UserMatcher::CalculateUserMatchScore(
    const HandResult& hand,
    const UserInfo& user,
    const std::unordered_map<int, HandResult>& all_hands) const {

    if (!user.is_active) return 0.0f;
    if (user.num_hands >= kMaxHandsPerUser) return 0.0f;

    float score = 0.0f;

    for (int hand_id : user.hand_ids) {
        if (hand_id < 0) continue;

        auto it = all_hands.find(hand_id);
        if (it == all_hands.end()) continue;

        const auto& existing_hand = it->second;

        float side_penalty = (existing_hand.is_left_hand == hand.is_left_hand) ? 0.0f : 1.0f;
        if (side_penalty > 0.5f) continue;

        Point3D c1 = existing_hand.features.palm_center;
        Point3D c2 = hand.features.palm_center;
        float dist = std::sqrt(std::pow(c1.x - c2.x, 2) + std::pow(c1.y - c2.y, 2));

        float size_sim = 1.0f - std::abs(existing_hand.features.palm_size - hand.features.palm_size) /
                         std::max(existing_hand.features.palm_size, hand.features.palm_size);

        score += std::max(0.0f, 1.0f - dist * 5.0f) * 0.6f + size_sim * 0.4f;
    }

    if (user.num_hands == 0) {
        score = 0.5f;
    } else {
        score /= user.num_hands;
    }

    return score;
}

std::vector<UserMatcher::UserMatchResult> UserMatcher::MatchHandsToUsers(
    const std::vector<HandResult>& hands,
    const std::unordered_map<int, UserInfo>& users,
    int64_t timestamp_ms) {

    std::vector<UserMatchResult> results;
    std::unordered_set<int> used_user_ids;
    std::unordered_map<int, HandResult> all_hands;
    for (const auto& h : hands) {
        if (h.tracking_id >= 0) {
            all_hands[h.tracking_id] = h;
        }
    }

    for (const auto& hand : hands) {
        float best_score = threshold_;
        int best_user_id = -1;

        for (const auto& [user_id, user] : users) {
            if (used_user_ids.count(user_id) && user.num_hands >= kMaxHandsPerUser) continue;

            float score = CalculateUserMatchScore(hand, user, all_hands);
            if (score > best_score) {
                best_score = score;
                best_user_id = user_id;
            }
        }

        UserMatchResult result;
        result.hand_id = hand.tracking_id;
        result.confidence = best_score;

        if (best_user_id >= 0) {
            result.user_id = best_user_id;
            result.is_new_user = false;
            used_user_ids.insert(best_user_id);
        } else {
            result.user_id = GetNextUserId();
            result.is_new_user = true;
        }

        results.push_back(result);
    }

    return results;
}

class MultiUserTracker::Impl {
public:
    Impl() : max_num_hands_(4), max_num_users_(2), user_timeout_ms_(5000) {}

    bool Initialize(const TrackerConfig& config) {
        max_num_hands_ = config.max_num_hands;
        max_num_users_ = config.max_num_users;
        user_timeout_ms_ = config.user_timeout_ms;
        hand_matcher_.SetMatchThreshold(config.user_match_threshold);
        user_matcher_.SetThreshold(config.user_match_threshold);
        return true;
    }

    void AssignHandsToUsers(std::vector<HandResult>& hands,
                            std::vector<UserInfo>& users,
                            int64_t timestamp_ms) {
        for (auto& hand : hands) {
            hand.features = HandFeatureExtractor::Extract(hand.landmarks);
            float min_x = 1.0f, max_x = 0.0f, min_y = 1.0f, max_y = 0.0f;
            for (const auto& lm : hand.landmarks) {
                min_x = std::min(min_x, lm.position.x);
                min_y = std::min(min_y, lm.position.y);
                max_x = std::max(max_x, lm.position.x);
                max_y = std::max(max_y, lm.position.y);
            }
            hand.bounding_box = {min_x, min_y, max_x, max_y};
        }

        auto hand_matches = hand_matcher_.Match(hands, tracked_hands_, timestamp_ms);

        for (const auto& match : hand_matches) {
            if (match.hand_index >= 0 && match.hand_index < static_cast<int>(hands.size())) {
                auto& hand = hands[match.hand_index];
                hand.tracking_id = match.track_id;
                hand.last_seen_ms = timestamp_ms;

                if (match.is_new) {
                    hand.first_seen_ms = timestamp_ms;
                } else if (tracked_hands_.count(match.track_id)) {
                    hand.first_seen_ms = tracked_hands_[match.track_id].first_seen_ms;
                }

                tracked_hands_[match.track_id] = hand;
            }
        }

        CleanupExpiredHands(timestamp_ms);

        std::unordered_map<int, UserInfo> user_map;
        for (const auto& user : users) {
            user_map[user.user_id] = user;
        }

        auto user_matches = user_matcher_.MatchHandsToUsers(hands, user_map, timestamp_ms);

        std::unordered_map<int, UserInfo> updated_users;
        for (const auto& match : user_matches) {
            int user_id = match.user_id;
            if (!updated_users.count(user_id)) {
                if (user_map.count(user_id)) {
                    updated_users[user_id] = user_map[user_id];
                } else {
                    UserInfo new_user;
                    new_user.user_id = user_id;
                    new_user.name = "User_" + std::to_string(user_id);
                    new_user.first_seen_ms = timestamp_ms;
                    new_user.is_active = true;
                    new_user.num_hands = 0;
                    new_user.hand_ids = {-1, -1};
                    updated_users[user_id] = new_user;
                }
            }

            auto& user = updated_users[user_id];
            user.last_seen_ms = timestamp_ms;
            user.is_active = true;

            for (auto& hand : hands) {
                if (hand.tracking_id == match.hand_id) {
                    hand.user_id = user_id;

                    if (hand.is_left_hand) {
                        user.hand_ids[0] = match.hand_id;
                    } else {
                        user.hand_ids[1] = match.hand_id;
                    }
                    user.num_hands = (user.hand_ids[0] >= 0 ? 1 : 0) + (user.hand_ids[1] >= 0 ? 1 : 0);
                    break;
                }
            }
        }

        for (const auto& [user_id, user] : user_map) {
            if (!updated_users.count(user_id) &&
                timestamp_ms - user.last_seen_ms < user_timeout_ms_) {
                updated_users[user_id] = user;
                updated_users[user_id].is_active = false;
            }
        }

        users.clear();
        for (const auto& [user_id, user] : updated_users) {
            users.push_back(user);
        }

        std::sort(users.begin(), users.end(), [](const UserInfo& a, const UserInfo& b) {
            return a.user_id < b.user_id;
        });
    }

    void CleanupExpiredHands(int64_t timestamp_ms) {
        for (auto it = tracked_hands_.begin(); it != tracked_hands_.end(); ) {
            if (timestamp_ms - it->second.last_seen_ms > user_timeout_ms_) {
                it = tracked_hands_.erase(it);
            } else {
                ++it;
            }
        }
    }

    int GetActiveUserCount() const {
        int count = 0;
        for (const auto& [id, user] : users_) {
            if (user.is_active) count++;
        }
        return count;
    }

    int GetActiveHandCount() const {
        return static_cast<int>(tracked_hands_.size());
    }

    void Reset() {
        tracked_hands_.clear();
        users_.clear();
        hand_matcher_.Reset();
        user_matcher_.Reset();
    }

    void Release() {
        Reset();
    }

    const std::vector<UserInfo>& GetUsers() const {
        static std::vector<UserInfo> user_list;
        user_list.clear();
        for (const auto& [id, user] : users_) {
            user_list.push_back(user);
        }
        return user_list;
    }

private:
    int max_num_hands_;
    int max_num_users_;
    int64_t user_timeout_ms_;
    HandMatcher hand_matcher_;
    UserMatcher user_matcher_;
    std::unordered_map<int, HandResult> tracked_hands_;
    std::unordered_map<int, UserInfo> users_;
};

MultiUserTracker::MultiUserTracker() : impl_(std::make_unique<Impl>()) {}
MultiUserTracker::~MultiUserTracker() = default;

bool MultiUserTracker::Initialize(const TrackerConfig& config) {
    return impl_->Initialize(config);
}

void MultiUserTracker::AssignHandsToUsers(std::vector<HandResult>& hands,
                                          std::vector<UserInfo>& users,
                                          int64_t timestamp_ms) {
    impl_->AssignHandsToUsers(hands, users, timestamp_ms);
}

int MultiUserTracker::GetActiveUserCount() const {
    return impl_->GetActiveUserCount();
}

int MultiUserTracker::GetActiveHandCount() const {
    return impl_->GetActiveHandCount();
}

void MultiUserTracker::Reset() {
    impl_->Reset();
}

void MultiUserTracker::Release() {
    impl_->Release();
}

const std::vector<UserInfo>& MultiUserTracker::GetUsers() const {
    return impl_->GetUsers();
}

}
