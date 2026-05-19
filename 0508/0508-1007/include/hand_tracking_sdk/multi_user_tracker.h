#pragma once

#include "hand_tracking_sdk/common.h"
#include <memory>
#include <vector>
#include <unordered_map>
#include <array>
#include <string>

namespace hand_tracking_sdk {

class MultiUserTracker {
public:
    MultiUserTracker();
    ~MultiUserTracker();

    bool Initialize(const TrackerConfig& config);

    void AssignHandsToUsers(std::vector<HandResult>& hands,
                            std::vector<UserInfo>& users,
                            int64_t timestamp_ms);

    int GetActiveUserCount() const;
    int GetActiveHandCount() const;

    void Reset();
    void Release();

    const std::vector<UserInfo>& GetUsers() const;

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

class HandFeatureExtractor {
public:
    HandFeatureExtractor();
    ~HandFeatureExtractor();

    static HandFeatures Extract(const HandLandmarks& landmarks);
    static float CalculateSimilarity(const HandFeatures& a, const HandFeatures& b);
    static float CalculateBoundingBoxOverlap(
        const std::array<float, 4>& a,
        const std::array<float, 4>& b);
    static Point3D CalculatePalmCenter(const HandLandmarks& landmarks);
    static float CalculatePalmSize(const HandLandmarks& landmarks);

private:
    static float CalculateOrientation(const HandLandmarks& landmarks);
    static std::array<float, 21> CalculateFingerAngles(const HandLandmarks& landmarks);
};

class HandMatcher {
public:
    struct MatchResult {
        int hand_index = -1;
        int track_id = -1;
        float similarity = 0.0f;
        bool is_new = false;
    };

    HandMatcher();
    ~HandMatcher();

    void SetMatchThreshold(float threshold) { match_threshold_ = threshold; }
    float GetMatchThreshold() const { return match_threshold_; }

    std::vector<MatchResult> Match(
        const std::vector<HandResult>& detected_hands,
        const std::unordered_map<int, HandResult>& tracked_hands,
        int64_t timestamp_ms);

    int GetNextTrackingId() { return next_tracking_id_++; }
    void Reset() { next_tracking_id_ = 0; }

private:
    float match_threshold_ = 0.6f;
    int next_tracking_id_ = 0;
    static const int64_t kMaxDisappearedTimeMs = 500;

    float CalculateHandSimilarity(const HandResult& a, const HandResult& b) const;
};

class UserMatcher {
public:
    UserMatcher();
    ~UserMatcher();

    struct UserMatchResult {
        int user_id = -1;
        int hand_id = -1;
        float confidence = 0.0f;
        bool is_new_user = false;
    };

    void SetThreshold(float threshold) { threshold_ = threshold; }
    float GetThreshold() const { return threshold_; }

    std::vector<UserMatchResult> MatchHandsToUsers(
        const std::vector<HandResult>& hands,
        const std::unordered_map<int, UserInfo>& users,
        int64_t timestamp_ms);

    int GetNextUserId() { return next_user_id_++; }
    void Reset() { next_user_id_ = 0; }

private:
    float threshold_ = 0.6f;
    int next_user_id_ = 0;
    static const int kMaxHandsPerUser = 2;

    float CalculateUserMatchScore(
        const HandResult& hand,
        const UserInfo& user,
        const std::unordered_map<int, HandResult>& all_hands) const;
};

}
