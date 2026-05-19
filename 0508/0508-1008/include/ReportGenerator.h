#ifndef MEMSAFETY_REPORTGENERATOR_H
#define MEMSAFETY_REPORTGENERATOR_H

#include "Common.h"

namespace memsafety {

class ReportGenerator {
public:
    static void generateReport(const std::vector<Issue>& issues, 
                               OutputFormat format, 
                               const std::string& outputFile);
    
    static std::string toText(const std::vector<Issue>& issues);
    static std::string toJSON(const std::vector<Issue>& issues);
    static std::string toSARIF(const std::vector<Issue>& issues);

private:
    static std::string escapeJSON(const std::string& s);
    static std::string getRuleId(IssueType type);
    static std::string getRuleName(IssueType type);
    static std::string getRuleDescription(IssueType type);
    static std::string getRuleHelpURI(IssueType type);
};

} // namespace memsafety

#endif // MEMSAFETY_REPORTGENERATOR_H
