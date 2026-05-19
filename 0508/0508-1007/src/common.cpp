#include "hand_tracking_sdk/common.h"
#include <unordered_map>
#include <string>

namespace hand_tracking_sdk {

namespace {
const std::unordered_map<GestureType, const char*> kGestureNames = {
    {GestureType::NONE, "None"},
    {GestureType::FIST, "Fist"},
    {GestureType::ONE, "One"},
    {GestureType::TWO, "Two"},
    {GestureType::THREE, "Three"},
    {GestureType::FOUR, "Four"},
    {GestureType::FIVE, "Five"},
    {GestureType::OK, "OK"},
    {GestureType::THUMBS_UP, "ThumbsUp"},
    {GestureType::HEART, "Heart"}
};

const std::unordered_map<std::string, GestureType> kNameToGesture = {
    {"None", GestureType::NONE},
    {"Fist", GestureType::FIST},
    {"One", GestureType::ONE},
    {"Two", GestureType::TWO},
    {"Three", GestureType::THREE},
    {"Four", GestureType::FOUR},
    {"Five", GestureType::FIVE},
    {"OK", GestureType::OK},
    {"ThumbsUp", GestureType::THUMBS_UP},
    {"Heart", GestureType::HEART}
};
}

const char* GestureTypeToString(GestureType type) {
    auto it = kGestureNames.find(type);
    if (it != kGestureNames.end()) {
        return it->second;
    }
    return "Unknown";
}

GestureType StringToGestureType(const std::string& name) {
    auto it = kNameToGesture.find(name);
    if (it != kNameToGesture.end()) {
        return it->second;
    }
    return GestureType::NONE;
}

}
