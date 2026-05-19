#include "hand_tracking_sdk/multi_user_tracker.h"
#include "hand_tracking_sdk/hand_tracker.h"
#include <gtest/gtest.h>
#include <opencv2/opencv.hpp>
#include <chrono>

using namespace hand_tracking_sdk;

TEST(MultiUserTrackerTest, Initialize) {
    MultiUserTracker tracker;
    TrackerConfig config;
    config.max_num_users = 2;
    config.max_num_hands = 4;
    config.user_match_threshold = 0.5f;
    config.user_timeout_ms = 1000;
    EXPECT_TRUE(tracker.Initialize(config));
}

TEST(MultiUserTrackerTest, SingleHandTracking) {
    MultiUserTracker tracker;
    TrackerConfig config;
    config.max_num_users = 2;
    config.max_num_hands = 4;
    config.user_match_threshold = 0.5f;
    config.user_timeout_ms = 5000;
    tracker.Initialize(config);

    std::vector<HandResult> hands(1);
    std::vector<UserInfo> users;
    int64_t timestamp = 1000;

    hands[0].landmarks[0].position = {0.5f, 0.5f, 0.0f};
    hands[0].landmarks[9].position = {0.5f, 0.4f, 0.0f};

    tracker.AssignHandsToUsers(hands, users, timestamp);

    EXPECT_EQ(hands[0].tracking_id, 0);
    EXPECT_EQ(hands[0].user_id, 0);
    EXPECT_EQ(users.size(), 1u);
    EXPECT_EQ(users[0].num_hands, 1);
    EXPECT_EQ(tracker.GetActiveUserCount(), 1);
    EXPECT_EQ(tracker.GetActiveHandCount(), 1);
}

TEST(MultiUserTrackerTest, TwoHandsOneUser) {
    MultiUserTracker tracker;
    TrackerConfig config;
    config.max_num_users = 2;
    config.max_num_hands = 4;
    config.user_match_threshold = 0.5f;
    config.user_timeout_ms = 5000;
    tracker.Initialize(config);

    std::vector<HandResult> hands(2);
    std::vector<UserInfo> users;
    int64_t timestamp = 1000;

    hands[0].is_left_hand = true;
    hands[0].landmarks[0].position = {0.3f, 0.5f, 0.0f};
    hands[0].landmarks[9].position = {0.3f, 0.4f, 0.0f};
    hands[0].bounding_box = {0.2f, 0.3f, 0.4f, 0.6f};

    hands[1].is_left_hand = false;
    hands[1].landmarks[0].position = {0.7f, 0.5f, 0.0f};
    hands[1].landmarks[9].position = {0.7f, 0.4f, 0.0f};
    hands[1].bounding_box = {0.6f, 0.3f, 0.8f, 0.6f};

    tracker.AssignHandsToUsers(hands, users, timestamp);

    EXPECT_EQ(hands[0].user_id, 0);
    EXPECT_EQ(hands[1].user_id, 0);
    EXPECT_EQ(users.size(), 1u);
    EXPECT_EQ(users[0].num_hands, 2);
    EXPECT_EQ(tracker.GetActiveHandCount(), 2);
}

TEST(MultiUserTrackerTest, TwoUsersFourHands) {
    MultiUserTracker tracker;
    TrackerConfig config;
    config.max_num_users = 2;
    config.max_num_hands = 4;
    config.user_match_threshold = 0.5f;
    config.user_timeout_ms = 5000;
    tracker.Initialize(config);

    std::vector<HandResult> hands(4);
    std::vector<UserInfo> users;
    int64_t timestamp = 1000;

    hands[0].is_left_hand = true;
    hands[0].landmarks[0].position = {0.2f, 0.5f, 0.0f};
    hands[0].landmarks[9].position = {0.2f, 0.4f, 0.0f};
    hands[0].bounding_box = {0.1f, 0.3f, 0.3f, 0.6f};

    hands[1].is_left_hand = false;
    hands[1].landmarks[0].position = {0.4f, 0.5f, 0.0f};
    hands[1].landmarks[9].position = {0.4f, 0.4f, 0.0f};
    hands[1].bounding_box = {0.3f, 0.3f, 0.5f, 0.6f};

    hands[2].is_left_hand = true;
    hands[2].landmarks[0].position = {0.6f, 0.5f, 0.0f};
    hands[2].landmarks[9].position = {0.6f, 0.4f, 0.0f};
    hands[2].bounding_box = {0.5f, 0.3f, 0.7f, 0.6f};

    hands[3].is_left_hand = false;
    hands[3].landmarks[0].position = {0.8f, 0.5f, 0.0f};
    hands[3].landmarks[9].position = {0.8f, 0.4f, 0.0f};
    hands[3].bounding_box = {0.7f, 0.3f, 0.9f, 0.6f};

    tracker.AssignHandsToUsers(hands, users, timestamp);

    EXPECT_EQ(tracker.GetActiveUserCount(), 2);
    EXPECT_EQ(tracker.GetActiveHandCount(), 4);

    int user0_hands = 0, user1_hands = 0;
    for (const auto& hand : hands) {
        if (hand.user_id == 0) user0_hands++;
        else if (hand.user_id == 1) user1_hands++;
    }
    EXPECT_EQ(user0_hands + user1_hands, 4);
    EXPECT_GE(user0_hands, 1);
    EXPECT_GE(user1_hands, 1);
}

TEST(MultiUserTrackerTest, HandFeatureExtraction) {
    HandLandmarks landmarks;
    landmarks[0].position = {0.5f, 0.6f, 0.0f};
    landmarks[1].position = {0.5f, 0.55f, 0.0f};
    landmarks[2].position = {0.5f, 0.5f, 0.0f};
    landmarks[3].position = {0.5f, 0.45f, 0.0f};
    landmarks[4].position = {0.5f, 0.4f, 0.0f};
    landmarks[5].position = {0.45f, 0.55f, 0.0f};
    landmarks[9].position = {0.55f, 0.55f, 0.0f};
    landmarks[13].position = {0.5f, 0.55f, 0.0f};
    landmarks[17].position = {0.5f, 0.55f, 0.0f};

    auto features = HandFeatureExtractor::Extract(landmarks);

    EXPECT_GT(features.palm_size, 0.0f);
    EXPECT_GT(features.aspect_ratio, 0.0f);
    EXPECT_EQ(features.finger_angles.size(), 5u);
}

TEST(MultiUserTrackerTest, BoundingBoxOverlap) {
    std::array<float, 4> box1 = {0.0f, 0.0f, 0.5f, 0.5f};
    std::array<float, 4> box2 = {0.25f, 0.25f, 0.75f, 0.75f};
    std::array<float, 4> box3 = {0.6f, 0.6f, 1.0f, 1.0f};

    float overlap12 = HandFeatureExtractor::CalculateBoundingBoxOverlap(box1, box2);
    float overlap13 = HandFeatureExtractor::CalculateBoundingBoxOverlap(box1, box3);

    EXPECT_GT(overlap12, 0.0f);
    EXPECT_LT(overlap12, 1.0f);
    EXPECT_FLOAT_EQ(overlap13, 0.0f);
}

TEST(MultiUserTrackerTest, PalmCenterAndSize) {
    HandLandmarks landmarks;
    landmarks[0].position = {0.4f, 0.6f, 0.0f};
    landmarks[5].position = {0.45f, 0.5f, 0.0f};
    landmarks[9].position = {0.55f, 0.5f, 0.0f};
    landmarks[13].position = {0.6f, 0.55f, 0.0f};
    landmarks[17].position = {0.5f, 0.6f, 0.0f};

    auto center = HandFeatureExtractor::CalculatePalmCenter(landmarks);
    auto size = HandFeatureExtractor::CalculatePalmSize(landmarks);

    EXPECT_GT(center.x, 0.0f);
    EXPECT_LT(center.x, 1.0f);
    EXPECT_GT(size, 0.0f);
}

TEST(HandTrackerMultiUserTest, MultiUserModeInitialization) {
    HandTracker tracker;
    TrackerConfig config;
    config.mode = TrackingMode::MULTI_USER;
    config.max_num_hands = 4;
    config.max_num_users = 2;
    config.enable_multi_user_tracking = true;

    ASSERT_TRUE(tracker.Initialize(config));
    EXPECT_TRUE(tracker.IsInitialized());
    EXPECT_EQ(tracker.GetConfig().mode, TrackingMode::MULTI_USER);
    EXPECT_EQ(tracker.GetConfig().max_num_hands, 4);
}

TEST(HandTrackerMultiUserTest, MultiUserTracking) {
    HandTracker tracker;
    TrackerConfig config;
    config.mode = TrackingMode::MULTI_USER;
    config.max_num_hands = 4;
    config.max_num_users = 2;
    config.enable_multi_user_tracking = true;
    config.enable_gesture_recognition = false;

    ASSERT_TRUE(tracker.Initialize(config));

    cv::Mat frame(480, 640, CV_8UC3, cv::Scalar(0, 0, 0));
    FrameResult result;

    for (int i = 0; i < 5; ++i) {
        EXPECT_TRUE(tracker.ProcessFrame(frame, result));
    }

    EXPECT_FALSE(result.hands.empty());
    EXPECT_LE(result.hands.size(), 4u);

    for (const auto& hand : result.hands) {
        EXPECT_GE(hand.tracking_id, 0);
        EXPECT_GE(hand.user_id, 0);
    }

    EXPECT_FALSE(result.users.empty());
    EXPECT_LE(result.users.size(), 2u);

    for (const auto& user : result.users) {
        EXPECT_TRUE(user.is_active);
        EXPECT_GT(user.num_hands, 0);
    }
}

TEST(HandTrackerMultiUserTest, MaxUserLimit) {
    HandTracker tracker;
    TrackerConfig config;
    config.mode = TrackingMode::MULTI_USER;
    config.max_num_hands = 4;
    config.max_num_users = 2;
    config.enable_multi_user_tracking = true;

    ASSERT_TRUE(tracker.Initialize(config));

    cv::Mat frame(480, 640, CV_8UC3, cv::Scalar(0, 0, 0));
    FrameResult result;

    for (int i = 0; i < 10; ++i) {
        tracker.ProcessFrame(frame, result);
    }

    EXPECT_LE(result.users.size(), 2u);
}

TEST(HandTrackerMultiUserTest, ResetFunctionality) {
    MultiUserTracker tracker;
    TrackerConfig config;
    config.max_num_users = 2;
    config.max_num_hands = 4;
    config.user_match_threshold = 0.5f;
    config.user_timeout_ms = 5000;
    tracker.Initialize(config);

    std::vector<HandResult> hands(2);
    std::vector<UserInfo> users;

    hands[0].landmarks[0].position = {0.3f, 0.5f, 0.0f};
    hands[0].landmarks[9].position = {0.3f, 0.4f, 0.0f};
    hands[1].landmarks[0].position = {0.7f, 0.5f, 0.0f};
    hands[1].landmarks[9].position = {0.7f, 0.4f, 0.0f};

    tracker.AssignHandsToUsers(hands, users, 1000);
    EXPECT_EQ(tracker.GetActiveUserCount(), 1);

    tracker.Reset();
    EXPECT_EQ(tracker.GetActiveUserCount(), 0);
    EXPECT_EQ(tracker.GetActiveHandCount(), 0);
}
