#pragma once

#include <cstdio>
#include <cstdarg>
#include <string>

namespace ve {

enum class LogLevel {
    Debug,
    Info,
    Warn,
    Error
};

class Logger {
public:
    static void SetLevel(LogLevel level);
    static void Log(LogLevel level, const char* format, ...);
    
private:
    static LogLevel s_level;
};

#define VE_LOG_DEBUG(fmt, ...) Logger::Log(LogLevel::Debug, fmt, ##__VA_ARGS__)
#define VE_LOG_INFO(fmt, ...)  Logger::Log(LogLevel::Info,  fmt, ##__VA_ARGS__)
#define VE_LOG_WARN(fmt, ...)  Logger::Log(LogLevel::Warn,  fmt, ##__VA_ARGS__)
#define VE_LOG_ERROR(fmt, ...) Logger::Log(LogLevel::Error, fmt, ##__VA_ARGS__)

}
