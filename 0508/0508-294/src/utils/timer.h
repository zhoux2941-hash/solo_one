#pragma once

#include <chrono>

namespace ve {

class Timer {
public:
    Timer() { Reset(); }
    
    void Reset() {
        start_ = std::chrono::high_resolution_clock::now();
    }
    
    double Elapsed() const {
        auto end = std::chrono::high_resolution_clock::now();
        return std::chrono::duration<double>(end - start_).count();
    }
    
    int64_t ElapsedMs() const {
        return std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::high_resolution_clock::now() - start_).count();
    }
    
private:
    std::chrono::high_resolution_clock::time_point start_;
};

class ScopedTimer {
public:
    ScopedTimer(const char* name) : name_(name) {}
    ~ScopedTimer() {
        double ms = timer_.Elapsed() * 1000.0;
        VE_LOG_INFO("%s: %.2f ms", name_, ms);
    }
    
private:
    const char* name_;
    Timer timer_;
};

}
