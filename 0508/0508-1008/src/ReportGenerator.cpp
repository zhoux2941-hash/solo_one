#include "ReportGenerator.h"

namespace memsafety {

std::string ReportGenerator::escapeJSON(const std::string& s) {
    std::string result;
    for (char c : s) {
        switch (c) {
            case '"':  result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\b': result += "\\b"; break;
            case '\f': result += "\\f"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned char>(c));
                    result += buf;
                } else {
                    result += c;
                }
        }
    }
    return result;
}

std::string ReportGenerator::getRuleId(IssueType type) {
    switch (type) {
        case IssueType::NULL_POINTER_DEREF: return "MEMSAFETY-NP001";
        case IssueType::USE_AFTER_FREE: return "MEMSAFETY-UF001";
        case IssueType::DOUBLE_FREE: return "MEMSAFETY-DF001";
        case IssueType::MEMORY_LEAK: return "MEMSAFETY-ML001";
        case IssueType::UNREACHABLE_ERROR_HANDLER: return "MEMSAFETY-UC001";
        case IssueType::DEAD_ERROR_CODE: return "MEMSAFETY-UC002";
        default: return "MEMSAFETY-UNKNOWN";
    }
}

std::string ReportGenerator::getRuleName(IssueType type) {
    switch (type) {
        case IssueType::NULL_POINTER_DEREF: return "NullPointerDereference";
        case IssueType::USE_AFTER_FREE: return "UseAfterFree";
        case IssueType::DOUBLE_FREE: return "DoubleFree";
        case IssueType::MEMORY_LEAK: return "MemoryLeak";
        case IssueType::UNREACHABLE_ERROR_HANDLER: return "UnreachableErrorHandler";
        case IssueType::DEAD_ERROR_CODE: return "DeadErrorCode";
        default: return "Unknown";
    }
}

std::string ReportGenerator::getRuleDescription(IssueType type) {
    switch (type) {
        case IssueType::NULL_POINTER_DEREF:
            return "A null pointer is being dereferenced, which will cause a crash.";
        case IssueType::USE_AFTER_FREE:
            return "Memory is accessed after it has been freed, leading to undefined behavior.";
        case IssueType::DOUBLE_FREE:
            return "Memory is freed multiple times, which can corrupt the heap.";
        case IssueType::MEMORY_LEAK:
            return "Allocated memory is not freed, causing a memory leak.";
        case IssueType::UNREACHABLE_ERROR_HANDLER:
            return "Error handling code is unreachable and will never execute.";
        case IssueType::DEAD_ERROR_CODE:
            return "Error handling path is dead; the condition is always false.";
        default:
            return "Unknown memory safety issue.";
    }
}

std::string ReportGenerator::getRuleHelpURI(IssueType type) {
    switch (type) {
        case IssueType::NULL_POINTER_DEREF:
            return "https://cwe.mitre.org/data/definitions/476.html";
        case IssueType::USE_AFTER_FREE:
            return "https://cwe.mitre.org/data/definitions/416.html";
        case IssueType::DOUBLE_FREE:
            return "https://cwe.mitre.org/data/definitions/415.html";
        case IssueType::MEMORY_LEAK:
            return "https://cwe.mitre.org/data/definitions/401.html";
        case IssueType::UNREACHABLE_ERROR_HANDLER:
            return "https://cwe.mitre.org/data/definitions/561.html";
        case IssueType::DEAD_ERROR_CODE:
            return "https://cwe.mitre.org/data/definitions/570.html";
        default:
            return "";
    }
}

void ReportGenerator::generateReport(const std::vector<Issue>& issues, 
                                     OutputFormat format, 
                                     const std::string& outputFile) {
    std::string output;
    
    switch (format) {
        case OutputFormat::TEXT:
            output = toText(issues);
            break;
        case OutputFormat::JSON:
            output = toJSON(issues);
            break;
        case OutputFormat::SARIF:
            output = toSARIF(issues);
            break;
    }
    
    if (!outputFile.empty()) {
        std::ofstream outFile(outputFile);
        if (outFile.is_open()) {
            outFile << output;
            outFile.close();
        } else {
            std::cerr << "Error: Could not open output file: " << outputFile << std::endl;
            std::cout << output;
        }
    } else {
        std::cout << output;
    }
}

std::string ReportGenerator::toText(const std::vector<Issue>& issues) {
    std::stringstream ss;
    
    if (issues.empty()) {
        ss << "No memory safety issues found.\n";
        return ss.str();
    }
    
    ss << "=== Memory Safety Analysis Report ===\n";
    ss << "Total issues found: " << issues.size() << "\n\n";
    
    for (size_t i = 0; i < issues.size(); ++i) {
        const Issue& issue = issues[i];
        ss << "[" << (i + 1) << "] " << issue.getTypeString() << "\n";
        ss << "  Severity: " << issue.getSeverity() << "\n";
        ss << "  File: " << (issue.filename.empty() ? "unknown" : issue.filename) << "\n";
        ss << "  Line: " << issue.line;
        if (issue.column > 0) {
            ss << ", Column: " << issue.column;
        }
        ss << "\n";
        ss << "  Function: " << (issue.function.empty() ? "unknown" : issue.function) << "\n";
        if (!issue.variable.empty()) {
            ss << "  Variable: " << issue.variable << "\n";
        }
        ss << "  Description: " << issue.description << "\n";
        
        if (!issue.trace.empty()) {
            ss << "  Trace:\n";
            for (const auto& [file, line] : issue.trace) {
                ss << "    -> " << file << ":" << line << "\n";
            }
        }
        ss << "\n";
    }
    
    ss << "=== Summary ===\n";
    std::map<std::string, int> typeCount;
    for (const auto& issue : issues) {
        typeCount[issue.getTypeString()]++;
    }
    for (const auto& [type, count] : typeCount) {
        ss << "  " << type << ": " << count << "\n";
    }
    
    return ss.str();
}

std::string ReportGenerator::toJSON(const std::vector<Issue>& issues) {
    std::stringstream ss;
    
    ss << "{\n";
    ss << "  \"version\": \"1.0\",\n";
    ss << "  \"tool\": \"MemSafetyAnalyzer\",\n";
    ss << "  \"totalIssues\": " << issues.size() << ",\n";
    ss << "  \"issues\": [\n";
    
    for (size_t i = 0; i < issues.size(); ++i) {
        const Issue& issue = issues[i];
        ss << "    {\n";
        ss << "      \"id\": " << (i + 1) << ",\n";
        ss << "      \"type\": \"" << issue.getTypeString() << "\",\n";
        ss << "      \"severity\": \"" << issue.getSeverity() << "\",\n";
        ss << "      \"file\": \"" << escapeJSON(issue.filename) << "\",\n";
        ss << "      \"line\": " << issue.line << ",\n";
        ss << "      \"column\": " << issue.column << ",\n";
        ss << "      \"function\": \"" << escapeJSON(issue.function) << "\",\n";
        ss << "      \"variable\": \"" << escapeJSON(issue.variable) << "\",\n";
        ss << "      \"description\": \"" << escapeJSON(issue.description) << "\",\n";
        ss << "      \"trace\": [";
        for (size_t j = 0; j < issue.trace.size(); ++j) {
            const auto& [file, line] = issue.trace[j];
            ss << "{\"file\": \"" << escapeJSON(file) << "\", \"line\": " << line << "}";
            if (j < issue.trace.size() - 1) ss << ", ";
        }
        ss << "]\n";
        ss << "    }";
        if (i < issues.size() - 1) ss << ",";
        ss << "\n";
    }
    
    ss << "  ]\n";
    ss << "}\n";
    
    return ss.str();
}

std::string ReportGenerator::toSARIF(const std::vector<Issue>& issues) {
    std::stringstream ss;
    
    ss << "{\n";
    ss << "  \"$schema\": \"https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json\",\n";
    ss << "  \"version\": \"2.1.0\",\n";
    ss << "  \"runs\": [\n";
    ss << "    {\n";
    ss << "      \"tool\": {\n";
    ss << "        \"driver\": {\n";
    ss << "          \"name\": \"MemSafetyAnalyzer\",\n";
    ss << "          \"version\": \"1.0.0\",\n";
    ss << "          \"informationUri\": \"https://github.com/memsafety/analyzer\",\n";
    ss << "          \"rules\": [\n";
    
    std::set<IssueType> seenTypes;
    for (const auto& issue : issues) {
        if (seenTypes.count(issue.type)) continue;
        seenTypes.insert(issue.type);
        
        ss << "            {\n";
        ss << "              \"id\": \"" << getRuleId(issue.type) << "\",\n";
        ss << "              \"name\": \"" << getRuleName(issue.type) << "\",\n";
        ss << "              \"shortDescription\": {\n";
        ss << "                \"text\": \"" << escapeJSON(getRuleDescription(issue.type)) << "\"\n";
        ss << "              },\n";
        ss << "              \"fullDescription\": {\n";
        ss << "                \"text\": \"" << escapeJSON(getRuleDescription(issue.type)) << "\"\n";
        ss << "              },\n";
        ss << "              \"helpUri\": \"" << getRuleHelpURI(issue.type) << "\",\n";
        ss << "              \"properties\": {\n";
        ss << "                \"severity\": \"" << (issues[0].getSeverity()) << "\"\n";
        ss << "              }\n";
        ss << "            },\n";
    }
    
    ss << "          ]\n";
    ss << "        }\n";
    ss << "      },\n";
    ss << "      \"results\": [\n";
    
    for (size_t i = 0; i < issues.size(); ++i) {
        const Issue& issue = issues[i];
        ss << "        {\n";
        ss << "          \"ruleId\": \"" << getRuleId(issue.type) << "\",\n";
        ss << "          \"level\": \"";
        std::string sev = issue.getSeverity();
        if (sev == "CRITICAL") ss << "error";
        else if (sev == "HIGH") ss << "error";
        else if (sev == "MEDIUM") ss << "warning";
        else ss << "note";
        ss << "\",\n";
        ss << "          \"message\": {\n";
        ss << "            \"text\": \"" << escapeJSON(issue.description) << "\"\n";
        ss << "          },\n";
        ss << "          \"locations\": [\n";
        ss << "            {\n";
        ss << "              \"physicalLocation\": {\n";
        ss << "                \"artifactLocation\": {\n";
        ss << "                  \"uri\": \"" << escapeJSON(issue.filename) << "\"\n";
        ss << "                },\n";
        ss << "                \"region\": {\n";
        ss << "                  \"startLine\": " << issue.line << ",\n";
        ss << "                  \"startColumn\": " << std::max(1u, issue.column) << "\n";
        ss << "                }\n";
        ss << "              }\n";
        ss << "            }\n";
        ss << "          ],\n";
        
        if (!issue.trace.empty()) {
            ss << "          \"codeFlows\": [\n";
            ss << "            {\n";
            ss << "              \"threadFlows\": [\n";
            ss << "                {\n";
            ss << "                  \"locations\": [\n";
            for (size_t j = 0; j < issue.trace.size(); ++j) {
                const auto& [file, line] = issue.trace[j];
                ss << "                    {\n";
                ss << "                      \"location\": {\n";
                ss << "                        \"physicalLocation\": {\n";
                ss << "                          \"artifactLocation\": {\n";
                ss << "                            \"uri\": \"" << escapeJSON(file) << "\"\n";
                ss << "                          },\n";
                ss << "                          \"region\": {\n";
                ss << "                            \"startLine\": " << line << "\n";
                ss << "                          }\n";
                ss << "                        }\n";
                ss << "                      }\n";
                ss << "                    }";
                if (j < issue.trace.size() - 1) ss << ",";
                ss << "\n";
            }
            ss << "                  ]\n";
            ss << "                }\n";
            ss << "              ]\n";
            ss << "            }\n";
            ss << "          ],\n";
        }
        
        ss << "          \"properties\": {\n";
        ss << "            \"function\": \"" << escapeJSON(issue.function) << "\",\n";
        ss << "            \"variable\": \"" << escapeJSON(issue.variable) << "\"\n";
        ss << "          }\n";
        ss << "        }";
        if (i < issues.size() - 1) ss << ",";
        ss << "\n";
    }
    
    ss << "      ]\n";
    ss << "    }\n";
    ss << "  ]\n";
    ss << "}\n";
    
    return ss.str();
}

} // namespace memsafety
