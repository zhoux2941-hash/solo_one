#include "CommandLineOptions.h"
#include <iostream>
#include <cstring>

namespace memsafety {

void CommandLineParser::printHelp() {
    std::cout << "MemSafetyAnalyzer - Memory Safety Static Analysis Tool\n";
    std::cout << "Usage: memsafety [options] <input-files>\n\n";
    std::cout << "Options:\n";
    std::cout << "  -h, --help                Show this help message\n";
    std::cout << "  -v, --version             Show version information\n";
    std::cout << "  -o, --output <file>       Output file (default: stdout)\n";
    std::cout << "  -f, --format <format>     Output format: text, json, sarif (default: text)\n";
    std::cout << "  --verbose                 Enable verbose output\n";
    std::cout << "  --debug                   Enable debug output\n\n";
    std::cout << "Check Options:\n";
    std::cout << "  --no-null-pointer         Disable null pointer dereference check\n";
    std::cout << "  --no-use-after-free       Disable use-after-free check\n";
    std::cout << "  --no-double-free          Disable double-free check\n";
    std::cout << "  --no-memory-leak          Disable memory leak check\n";
    std::cout << "  --no-unreachable-code     Disable unreachable error handler check\n";
    std::cout << "  --no-context-sensitive    Disable context-sensitive analysis\n";
    std::cout << "  --no-path-sensitive       Disable path-sensitive analysis\n";
    std::cout << "  --max-path-depth <n>      Maximum path depth (default: 50)\n";
    std::cout << "  --max-loop-unroll <n>     Maximum loop unroll count (default: 3)\n\n";
    std::cout << "Performance/Resource Options:\n";
    std::cout << "  --timeout <seconds>       Analysis timeout per file (default: 60, 0=disable)\n";
    std::cout << "  --max-memory <MB>         Memory limit in MB (default: 2048, 0=disable)\n";
    std::cout << "  --max-paths <n>           Max paths per function (default: 1000)\n";
    std::cout << "  --max-function-size <n>   Max instructions per function (default: 2000)\n";
    std::cout << "  --no-widening             Disable widening (may increase analysis time)\n";
    std::cout << "  --no-loop-detection       Disable loop detection\n";
    std::cout << "  --no-function-skipping    Disable large function skipping\n";
    std::cout << "  --no-merge-at-joins       Disable state merging at join points\n";
    std::cout << "  --no-reachability         Disable reachability analysis\n";
    std::cout << "  --widening-threshold <n>  BB visits before widening (default: 5)\n\n";
    std::cout << "Extra compiler arguments:\n";
    std::cout << "  -- <args>                 Pass extra arguments to the compiler\n";
    std::cout << "\nExamples:\n";
    std::cout << "  memsafety test.c\n";
    std::cout << "  memsafety -f json -o report.json test.c\n";
    std::cout << "  memsafety --timeout 120 --max-memory 4096 large_file.c\n";
    std::cout << "  memsafety --no-memory-leak test.c -- -I/path/to/include\n";
    std::cout << "  memsafety --no-path-sensitive --max-paths 100 complex_file.c\n";
}

void CommandLineParser::printVersion() {
    std::cout << "MemSafetyAnalyzer version 1.0.0\n";
    std::cout << "LLVM-based C/C++ Memory Safety Static Analysis Tool\n";
    std::cout << "Copyright (c) 2024\n";
}

Config CommandLineParser::parse(int argc, char** argv) {
    Config config;
    
    bool inExtraArgs = false;
    
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (inExtraArgs) {
            config.extraArgs.push_back(arg);
            continue;
        }
        
        if (arg == "--") {
            inExtraArgs = true;
            continue;
        }
        
        if (arg == "-h" || arg == "--help") {
            printHelp();
            exit(0);
        } else if (arg == "-v" || arg == "--version") {
            printVersion();
            exit(0);
        } else if (arg == "-o" || arg == "--output") {
            if (i + 1 < argc) {
                config.outputFile = argv[++i];
            } else {
                std::cerr << "Error: --output requires a filename\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "-f" || arg == "--format") {
            if (i + 1 < argc) {
                std::string format = argv[++i];
                if (format == "text") {
                    config.format = OutputFormat::TEXT;
                } else if (format == "json") {
                    config.format = OutputFormat::JSON;
                } else if (format == "sarif") {
                    config.format = OutputFormat::SARIF;
                } else {
                    std::cerr << "Error: Unknown format '" << format 
                              << "'. Supported: text, json, sarif\n";
                    printHelp();
                    exit(1);
                }
            } else {
                std::cerr << "Error: --format requires a format type\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--verbose") {
            config.verbose = true;
        } else if (arg == "--debug") {
            config.debug = true;
        } else if (arg == "--no-null-pointer") {
            config.checks.enableNullPointer = false;
        } else if (arg == "--no-use-after-free") {
            config.checks.enableUseAfterFree = false;
        } else if (arg == "--no-double-free") {
            config.checks.enableDoubleFree = false;
        } else if (arg == "--no-memory-leak") {
            config.checks.enableMemoryLeak = false;
        } else if (arg == "--no-unreachable-code") {
            config.checks.enableUnreachableCode = false;
        } else if (arg == "--no-context-sensitive") {
            config.checks.contextSensitive = false;
        } else if (arg == "--no-path-sensitive") {
            config.checks.pathSensitive = false;
        } else if (arg == "--max-path-depth") {
            if (i + 1 < argc) {
                config.checks.maxPathDepth = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --max-path-depth requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--max-loop-unroll") {
            if (i + 1 < argc) {
                config.checks.maxLoopUnroll = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --max-loop-unroll requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--timeout") {
            if (i + 1 < argc) {
                config.checks.timeoutSeconds = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --timeout requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--max-memory") {
            if (i + 1 < argc) {
                config.checks.maxMemoryMB = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --max-memory requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--max-paths") {
            if (i + 1 < argc) {
                config.checks.maxPathsPerFunction = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --max-paths requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--max-function-size") {
            if (i + 1 < argc) {
                config.checks.maxFunctionSize = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --max-function-size requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg == "--no-widening") {
            config.checks.enableWidening = false;
        } else if (arg == "--no-loop-detection") {
            config.checks.enableLoopDetection = false;
        } else if (arg == "--no-function-skipping") {
            config.checks.enableFunctionSkipping = false;
        } else if (arg == "--no-merge-at-joins") {
            config.checks.mergeStatesAtJoins = false;
        } else if (arg == "--no-reachability") {
            config.checks.enableReachabilityAnalysis = false;
        } else if (arg == "--widening-threshold") {
            if (i + 1 < argc) {
                config.checks.wideningThreshold = std::stoi(argv[++i]);
            } else {
                std::cerr << "Error: --widening-threshold requires a number\n";
                printHelp();
                exit(1);
            }
        } else if (arg.size() > 0 && arg[0] == '-') {
            std::cerr << "Error: Unknown option '" << arg << "'\n";
            printHelp();
            exit(1);
        } else {
            config.inputFiles.push_back(arg);
        }
    }
    
    return config;
}

} // namespace memsafety
