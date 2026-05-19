#include "hand_tracking_sdk/performance_optimizer.h"
#include <iostream>
#include <cassert>
#include <thread>
#include <chrono>

using namespace hand_tracking_sdk;

void TestPerformanceProfiler() {
    std::cout << "Testing PerformanceProfiler..." << std::endl;

    PerformanceProfiler profiler;

    for (int i = 0; i < 10; ++i) {
        profiler.StartFrame();
        std::this_thread::sleep_for(std::chrono::milliseconds(16));
        profiler.EndFrame();
    }

    float fps = profiler.GetFPS();
    std::cout << "  FPS: " << fps << std::endl;
    assert(fps > 0);

    profiler.Reset();
    assert(profiler.GetFPS() == 0);

    std::cout << "PerformanceProfiler tests: PASS" << std::endl;
}

void TestFrameSkipper() {
    std::cout << "Testing FrameSkipper..." << std::endl;

    FrameSkipper skipper(30);
    assert(skipper.GetTargetFPS() == 30);

    skipper.SetTargetFPS(60);
    assert(skipper.GetTargetFPS() == 60);

    int processed = 0;
    for (int i = 0; i < 100; ++i) {
        if (skipper.ShouldProcessFrame()) {
            processed++;
        }
    }
    std::cout << "  Processed frames: " << processed << std::endl;

    std::cout << "FrameSkipper tests: PASS" << std::endl;
}

void TestLowPassFilter() {
    std::cout << "Testing LowPassFilter..." << std::endl;

    LowPassFilter filter(0.5f);

    Point3D p1(10, 20, 30);
    Point3D result1 = filter.Filter(p1);
    assert(std::abs(result1.x - 10) < 0.01);

    Point3D p2(20, 40, 60);
    Point3D result2 = filter.Filter(p2);
    assert(std::abs(result2.x - 15) < 0.01);

    filter.Reset();
    Point3D p3(5, 10, 15);
    Point3D result3 = filter.Filter(p3);
    assert(std::abs(result3.x - 5) < 0.01);

    std::cout << "LowPassFilter tests: PASS" << std::endl;
}

int main() {
    std::cout << "=== Performance Optimizer Tests ===" << std::endl;

    TestPerformanceProfiler();
    TestFrameSkipper();
    TestLowPassFilter();

    std::cout << "\nAll tests passed!" << std::endl;
    return 0;
}
