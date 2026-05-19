#ifndef MEMSAFETY_DOUBLEFREEDETECTOR_H
#define MEMSAFETY_DOUBLEFREEDETECTOR_H

#include "Common.h"
#include "AnalysisEngine.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Value.h"
#include "llvm/Support/raw_ostream.h"

namespace memsafety {

class DoubleFreeDetector {
public:
    DoubleFreeDetector(AnalysisEngine& engine) : engine(engine) {}
    
    void checkFree(llvm::CallInst* CI, llvm::Value* ptr, AbstractState& state);

private:
    AnalysisEngine& engine;
    
    bool isAlreadyFreed(llvm::Value* ptr, AbstractState& state);
    llvm::Value* getUnderlyingPointer(llvm::Value* val);
    std::string getPointerName(llvm::Value* val);
    llvm::Instruction* getFirstFreeSite(llvm::Value* ptr, AbstractState& state);
};

} // namespace memsafety

#endif // MEMSAFETY_DOUBLEFREEDETECTOR_H
