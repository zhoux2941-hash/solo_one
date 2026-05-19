#include "hand_tracking_sdk/gesture_recognizer.h"
#include <iostream>
#include <cassert>

using namespace hand_tracking_sdk;

void TestGestureMapping() {
    std::cout << "Testing gesture mapping..." << std::endl;

    const char* name = GestureTypeToString(GestureType::FIST);
    assert(std::string(name) == "Fist");
    std::cout << "  Fist mapping: PASS" << std::endl;

    GestureType type = StringToGestureType("OK");
    assert(type == GestureType::OK);
    std::cout << "  OK mapping: PASS" << std::endl;

    std::cout << "Gesture mapping tests: PASS" << std::endl;
}

void TestSupportedGestures() {
    std::cout << "Testing supported gestures..." << std::endl;

    const auto& gestures = GestureRecognizer::GetSupportedGestures();
    assert(gestures.size() == 9);
    std::cout << "  Number of supported gestures: " << gestures.size() << " - PASS" << std::endl;

    std::cout << "Supported gestures tests: PASS" << std::endl;
}

int main() {
    std::cout << "=== Gesture Recognizer Tests ===" << std::endl;

    TestGestureMapping();
    TestSupportedGestures();

    std::cout << "\nAll tests passed!" << std::endl;
    return 0;
}
