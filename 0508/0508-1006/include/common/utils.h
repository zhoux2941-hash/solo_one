#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <chrono>
#include <random>
#include <sstream>
#include <iomanip>
#include <spdlog/spdlog.h>

namespace paxoskv {

class Utils {
public:
    static uint64_t NowMicros() {
        return static_cast<uint64_t>(
            std::chrono::duration_cast<std::chrono::microseconds>(
                std::chrono::system_clock::now().time_since_epoch()
            ).count()
        );
    }

    static uint64_t NowMillis() {
        return static_cast<uint64_t>(
            std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()
            ).count()
        );
    }

    static uint64_t RandomUint64(uint64_t min, uint64_t max) {
        static thread_local std::mt19937_64 gen(
            std::random_device{}()
        );
        std::uniform_int_distribution<uint64_t> dist(min, max);
        return dist(gen);
    }

    static std::string GenerateId() {
        std::stringstream ss;
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);
        std::tm tm_buf;
        localtime_s(&tm_buf, &in_time_t);
        ss << std::put_time(&tm_buf, "%Y%m%d%H%M%S")
           << "_" << RandomUint64(1000, 9999);
        return ss.str();
    }

    static std::vector<std::string> Split(const std::string& s, char delimiter) {
        std::vector<std::string> tokens;
        std::string token;
        std::istringstream tokenStream(s);
        while (std::getline(tokenStream, token, delimiter)) {
            if (!token.empty()) {
                tokens.push_back(token);
            }
        }
        return tokens;
    }
};

} 
