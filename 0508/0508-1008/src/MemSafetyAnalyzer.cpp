#include "Common.h"
#include "CommandLineOptions.h"
#include "AnalysisEngine.h"
#include "ReportGenerator.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/Module.h"
#include "llvm/IRReader/IRReader.h"
#include "llvm/Support/SourceMgr.h"
#include "llvm/Support/CommandLine.h"
#include "llvm/Support/raw_ostream.h"
#include "clang/Tooling/CommonOptionsParser.h"
#include "clang/Tooling/Tooling.h"
#include "clang/Frontend/TextDiagnosticPrinter.h"
#include "clang/Frontend/CompilerInstance.h"
#include "clang/AST/ASTConsumer.h"
#include "clang/AST/ASTContext.h"
#include "llvm/CodeGen/CodeGenAction.h"
#include "llvm/Bitcode/BitcodeWriter.h"

using namespace memsafety;
using namespace llvm;
using namespace clang;
using namespace clang::tooling;

static cl::OptionCategory MemSafetyCategory("MemSafety Analyzer Options");

int main(int argc, char** argv) {
    Config config = CommandLineParser::parse(argc, argv);
    
    if (config.inputFiles.empty()) {
        CommandLineParser::printHelp();
        return 1;
    }
    
    llvm::LLVMContext context;
    std::vector<Issue> allIssues;
    
    for (const auto& inputFile : config.inputFiles) {
        if (config.verbose) {
            llvm::outs() << "Analyzing: " << inputFile << "\n";
        }
        
        llvm::SMDiagnostic err;
        std::unique_ptr<llvm::Module> module;
        
        if (inputFile.size() > 3 && 
            inputFile.substr(inputFile.size() - 3) == ".bc") {
            module = llvm::parseIRFile(inputFile, err, context);
        } else if (inputFile.size() > 3 && 
                   inputFile.substr(inputFile.size() - 3) == ".ll") {
            module = llvm::parseIRFile(inputFile, err, context);
        } else {
            auto action = std::make_unique<clang::EmitLLVMOnlyAction>(&context);
            
            std::vector<const char*> args;
            args.push_back("memsafety");
            args.push_back(inputFile.c_str());
            for (const auto& arg : config.extraArgs) {
                args.push_back(arg.c_str());
            }
            
            clang::IntrusiveRefCntPtr<clang::DiagnosticOptions> diagOpts = 
                new clang::DiagnosticOptions();
            clang::TextDiagnosticPrinter diagPrinter(llvm::errs(), &*diagOpts);
            clang::IntrusiveRefCntPtr<clang::DiagnosticIDs> diagID(
                new clang::DiagnosticIDs());
            clang::DiagnosticsEngine diags(diagID, &*diagOpts, &diagPrinter);
            
            clang::CompilerInstance ci;
            ci.createDiagnostics(&diagPrinter, false);
            
            clang::TargetOptions& topts = ci.getTargetOpts();
            topts.Triple = llvm::sys::getDefaultTargetTriple();
            
            clang::HeaderSearchOptions& hopts = ci.getHeaderSearchOpts();
            hopts.AddPath("/usr/include", clang::frontend::System, false, false);
            hopts.AddPath("/usr/local/include", clang::frontend::System, false, false);
            
            clang::CodeGenOptions& cgopts = ci.getCodeGenOpts();
            cgopts.OptimizationLevel = 0;
            cgopts.DebugInfo = false;
            
            ci.getInvocation().setLangDefaults(
                clang::IK_C, 
                llvm::Triple(llvm::sys::getDefaultTargetTriple()),
                clang::LangStandard::lang_c11,
                {false, false, false});
            
            if (!ci.ExecuteAction(*action)) {
                llvm::errs() << "Error compiling: " << inputFile << "\n";
                continue;
            }
            
            module = action->takeModule();
        }
        
        if (!module) {
            err.print(argv[0], llvm::errs());
            continue;
        }
        
        AnalysisEngine engine(config);
        auto issues = engine.analyzeModule(*module);
        allIssues.insert(allIssues.end(), issues.begin(), issues.end());
    }
    
    if (config.verbose) {
        llvm::outs() << "Found " << allIssues.size() << " issues\n";
    }
    
    ReportGenerator::generateReport(allIssues, config.format, config.outputFile);
    
    return 0;
}
