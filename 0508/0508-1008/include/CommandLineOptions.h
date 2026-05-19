#ifndef MEMSAFETY_COMMANDLINEOPTIONS_H
#define MEMSAFETY_COMMANDLINEOPTIONS_H

#include "Common.h"

namespace memsafety {

class CommandLineParser {
public:
    static Config parse(int argc, char** argv);
    static void printHelp();
    static void printVersion();
};

} // namespace memsafety

#endif // MEMSAFETY_COMMANDLINEOPTIONS_H
