#include "logger.h"
#include <chrono>
#include <cstring>
#include <mutex>

#ifdef _WIN32
#include <windows.h>
#endif

namespace ve {

LogLevel Logger::s_level = LogLevel::Debug;
static std::mutex s_log_mutex;

void Logger::SetLevel(LogLevel level) {
    s_level = level;
}

void Logger::Log(LogLevel level, const char* format, ...) {
    if (level < s_level) return;
    
    std::lock_guard<std::mutex> lock(s_log_mutex);
    
    const char* level_str = "DEBUG";
    switch (level) {
        case LogLevel::Info:  level_str = "INFO "; break;
        case LogLevel::Warn:  level_str = "WARN "; break;
        case LogLevel::Error: level_str = "ERROR"; break;
        default: break;
    }
    
    auto now = std::chrono::system_clock::now();
    std::time_t now_time = std::chrono::system_clock::to_time_t(now);
    char time_buf[32];
    std::strftime(time_buf, sizeof(time_buf), "%H:%M:%S", std::localtime(&now_time));
    
#ifdef _WIN32
    HANDLE hConsole = GetStdHandle(STD_OUTPUT_HANDLE);
    CONSOLE_SCREEN_BUFFER_INFO csbi;
    GetConsoleScreenBufferInfo(hConsole, &csbi);
    WORD original_color = csbi.wAttributes;
    
    WORD color = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_BLUE;
    if (level == LogLevel::Warn) color = FOREGROUND_RED | FOREGROUND_GREEN | FOREGROUND_INTENSITY;
    if (level == LogLevel::Error) color = FOREGROUND_RED | FOREGROUND_INTENSITY;
    SetConsoleTextAttribute(hConsole, color);
#endif
    
    printf("[%s] [%s] ", time_buf, level_str);
    
    va_list args;
    va_start(args, format);
    vprintf(format, args);
    va_end(args);
    
    printf("\n");
    fflush(stdout);
    
#ifdef _WIN32
    SetConsoleTextAttribute(hConsole, original_color);
#endif
}

}
