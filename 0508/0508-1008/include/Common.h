#ifndef MEMSAFETY_COMMON_H
#define MEMSAFETY_COMMON_H

#include <string>
#include <vector>
#include <map>
#include <set>
#include <memory>
#include <sstream>
#include <fstream>
#include <iostream>
#include <algorithm>

namespace memsafety {

enum class IssueType {
    NULL_POINTER_DEREF,
    USE_AFTER_FREE,
    DOUBLE_FREE,
    MEMORY_LEAK,
    UNREACHABLE_ERROR_HANDLER,
    DEAD_ERROR_CODE
};

struct Issue {
    IssueType type;
    std::string filename;
    unsigned line;
    unsigned column;
    std::string description;
    std::string function;
    std::string variable;
    std::vector<std::pair<std::string, unsigned>> trace;

    std::string getTypeString() const {
        switch (type) {
            case IssueType::NULL_POINTER_DEREF: return "NULL_POINTER_DEREFERENCE";
            case IssueType::USE_AFTER_FREE: return "USE_AFTER_FREE";
            case IssueType::DOUBLE_FREE: return "DOUBLE_FREE";
            case IssueType::MEMORY_LEAK: return "MEMORY_LEAK";
            case IssueType::UNREACHABLE_ERROR_HANDLER: return "UNREACHABLE_ERROR_HANDLER";
            case IssueType::DEAD_ERROR_CODE: return "DEAD_ERROR_CODE";
            default: return "UNKNOWN";
        }
    }

    std::string getSeverity() const {
        switch (type) {
            case IssueType::NULL_POINTER_DEREF: return "HIGH";
            case IssueType::USE_AFTER_FREE: return "CRITICAL";
            case IssueType::DOUBLE_FREE: return "CRITICAL";
            case IssueType::MEMORY_LEAK: return "MEDIUM";
            case IssueType::UNREACHABLE_ERROR_HANDLER: return "LOW";
            case IssueType::DEAD_ERROR_CODE: return "LOW";
            default: return "LOW";
        }
    }
};

struct CheckOptions {
    bool enableNullPointer = true;
    bool enableUseAfterFree = true;
    bool enableDoubleFree = true;
    bool enableMemoryLeak = true;
    bool enableUnreachableCode = true;
    bool contextSensitive = true;
    bool pathSensitive = true;
    unsigned maxPathDepth = 50;
    unsigned maxLoopUnroll = 3;
    
    unsigned maxPathsPerFunction = 1000;
    unsigned maxInstructionsPerFunction = 5000;
    unsigned timeoutSeconds = 60;
    unsigned maxMemoryMB = 2048;
    unsigned maxFunctionSize = 2000;
    
    bool enableWidening = true;
    bool enableLoopDetection = true;
    bool enableFunctionSkipping = true;
    bool mergeStatesAtJoins = true;
    bool enableReachabilityAnalysis = true;
    
    unsigned wideningThreshold = 5;
};

enum class OutputFormat {
    TEXT,
    JSON,
    SARIF
};

struct Config {
    std::vector<std::string> inputFiles;
    std::vector<std::string> extraArgs;
    CheckOptions checks;
    OutputFormat format = OutputFormat::TEXT;
    std::string outputFile;
    bool verbose = false;
    bool debug = false;
};

inline std::string trim(const std::string& s) {
    auto start = s.find_first_not_of(" \t\n\r");
    auto end = s.find_last_not_of(" \t\n\r");
    if (start == std::string::npos) return "";
    return s.substr(start, end - start + 1);
}

} // namespace memsafety

#endif // MEMSAFETY_COMMON_H
